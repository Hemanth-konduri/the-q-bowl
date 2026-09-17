import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  subscriptions,
  subscriptionDeliverySchedule,
  deliveryManifest,
  foodItems,
  deliveryBatches,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

// GET /api/user/subscriptions/schedule?userId=xxx
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });
    }

    // Fetch active/latest subscription
    const subRows = await db
      .select({
        id: subscriptions.id,
        mealCreditsPurchased: subscriptions.mealCreditsPurchased,
        creditsRemaining: subscriptions.creditsRemaining,
        mealsRemaining: subscriptions.mealsRemaining,
        mealsUsed: subscriptions.mealsUsed,
        mealsPerDay: subscriptions.mealsPerDay,
        mealTiming: subscriptions.mealTiming,
        startDate: subscriptions.startDate,
        expectedEndDate: subscriptions.expectedEndDate,
        nextDeliveryDate: subscriptions.nextDeliveryDate,
        status: subscriptions.status,
        mealId: subscriptions.mealId,
        mealName: foodItems.name,
        mealImage: foodItems.imageUrl,
        calories: foodItems.calories,
        isVeg: foodItems.isVeg,
      })
      .from(subscriptions)
      .leftJoin(foodItems, eq(subscriptions.mealId, foodItems.id))
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (subRows.length === 0) {
      return NextResponse.json({ success: true, subscription: null, schedule: [] });
    }

    const sub = subRows[0];
    const creditsLeft = sub.creditsRemaining ?? sub.mealsRemaining ?? 0;
    const progressPercent = sub.mealCreditsPurchased > 0
      ? Math.round(((sub.mealCreditsPurchased - creditsLeft) / sub.mealCreditsPurchased) * 100)
      : 0;

    // Fetch delivery schedule
    const scheduleItems = await db
      .select({
        id: subscriptionDeliverySchedule.id,
        deliveryDate: subscriptionDeliverySchedule.deliveryDate,
        mealSlot: subscriptionDeliverySchedule.mealType,
        status: subscriptionDeliverySchedule.status,
        deliveredAt: subscriptionDeliverySchedule.deliveredAt,
        batchId: subscriptionDeliverySchedule.batchId,
        batchName: deliveryBatches.name,
        batchTime: deliveryBatches.deliveryTime,
      })
      .from(subscriptionDeliverySchedule)
      .leftJoin(deliveryBatches, eq(subscriptionDeliverySchedule.batchId, deliveryBatches.id))
      .where(eq(subscriptionDeliverySchedule.subscriptionId, sub.id));

    return NextResponse.json({
      success: true,
      subscription: {
        ...sub,
        creditsRemaining: creditsLeft,
        progressPercent,
      },
      schedule: scheduleItems,
    });
  } catch (err: any) {
    console.error("GET /api/user/subscriptions/schedule error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST /api/user/subscriptions/schedule - Skip a scheduled meal
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, scheduleId, userId } = body;

    if (action === "SKIP") {
      if (!scheduleId) {
        return NextResponse.json({ success: false, error: "scheduleId is required" }, { status: 400 });
      }

      // Mark current delivery as SKIPPED
      const [updatedSched] = await db
        .update(subscriptionDeliverySchedule)
        .set({
          status: "SKIPPED",
          updatedAt: new Date(),
        })
        .where(eq(subscriptionDeliverySchedule.id, scheduleId))
        .returning();

      if (updatedSched) {
        // Also update delivery_manifest entry
        await db
          .update(deliveryManifest)
          .set({ status: "SKIPPED", updatedAt: new Date() })
          .where(eq(deliveryManifest.referenceId, scheduleId));

        // Find last scheduled date in subscription schedule to extend by 1 day
        const allScheds = await db
          .select({ deliveryDate: subscriptionDeliverySchedule.deliveryDate })
          .from(subscriptionDeliverySchedule)
          .where(eq(subscriptionDeliverySchedule.subscriptionId, updatedSched.subscriptionId));

        let maxDate = new Date();
        for (const s of allScheds) {
          const d = new Date(s.deliveryDate);
          if (d > maxDate) maxDate = d;
        }

        maxDate.setDate(maxDate.getDate() + 1);
        const newDateStr = maxDate.toISOString().split("T")[0];

        const newSchedId = `sdel-${updatedSched.subscriptionId}-${newDateStr}-${updatedSched.mealType.toLowerCase()}`;
        const newManifestId = `mnf-sub-${newSchedId}`;

        // Add extended meal delivery row at the end of the timeline
        await db
          .insert(subscriptionDeliverySchedule)
          .values({
            id: newSchedId,
            subscriptionId: updatedSched.subscriptionId,
            batchId: updatedSched.batchId,
            addressId: updatedSched.addressId,
            deliveryDate: newDateStr,
            mealType: updatedSched.mealType,
            status: "SCHEDULED",
            mealId: updatedSched.mealId,
          })
          .onConflictDoNothing();

        // Get sub userId
        const subRows = await db
          .select({ userId: subscriptions.id, subId: subscriptions.id, uId: subscriptions.userId })
          .from(subscriptions)
          .where(eq(subscriptions.id, updatedSched.subscriptionId))
          .limit(1);

        if (subRows.length > 0) {
          await db
            .insert(deliveryManifest)
            .values({
              id: newManifestId,
              orderType: "SUBSCRIPTION",
              referenceId: newSchedId,
              batchId: updatedSched.batchId || "batch-1",
              customerId: subRows[0].uId,
              mealId: updatedSched.mealId,
              addressId: updatedSched.addressId,
              deliveryDate: newDateStr,
              mealSlot: updatedSched.mealType,
              status: "SCHEDULED",
            })
            .onConflictDoNothing();
        }
      }

      return NextResponse.json({ success: true, message: "Meal skipped and schedule extended successfully" });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("POST /api/user/subscriptions/schedule error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
