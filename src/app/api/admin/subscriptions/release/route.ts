import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  subscriptions,
  subscriptionDeliveries,
  users,
  notifications,
  foodItems,
} from "@/db/schema";
import { requireAdminApi } from "@/lib/auth-guard";
import { eq, and, sql } from "drizzle-orm";

function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const {
      mode = "SINGLE", // "SINGLE" | "BATCH"
      subscriptionId,
      mealSlot = "LUNCH", // "LUNCH" | "DINNER"
      deliveryDate = getTodayDateString(),
    } = body;

    const normalizedSlot = mealSlot.toUpperCase() === "DINNER" ? "DINNER" : "LUNCH";

    // ─────────────────────────────────────────────
    // 1. SINGLE SUBSCRIBER RELEASE
    // ─────────────────────────────────────────────
    if (mode === "SINGLE") {
      if (!subscriptionId) {
        return NextResponse.json(
          { error: "subscriptionId is required for single release." },
          { status: 400 }
        );
      }

      const subList = await db
        .select({
          id: subscriptions.id,
          userId: subscriptions.userId,
          mealId: subscriptions.mealId,
          status: subscriptions.status,
          mealsRemaining: subscriptions.mealsRemaining,
          creditsRemaining: subscriptions.creditsRemaining,
          mealsUsed: subscriptions.mealsUsed,
          mealTiming: subscriptions.mealTiming,
          customerName: users.name,
        })
        .from(subscriptions)
        .leftJoin(users, eq(subscriptions.userId, users.id))
        .where(eq(subscriptions.id, subscriptionId))
        .limit(1);

      if (subList.length === 0) {
        return NextResponse.json({ error: "Subscription not found." }, { status: 404 });
      }

      const sub = subList[0];

      if (sub.status !== "ACTIVE") {
        return NextResponse.json(
          { error: `Cannot release order. Subscription is currently ${sub.status}.` },
          { status: 400 }
        );
      }

      if (sub.mealsRemaining <= 0) {
        return NextResponse.json(
          { error: "No meal credits remaining on this subscription." },
          { status: 400 }
        );
      }

      // Check if already released for this slot today
      const existingDelivery = await db
        .select()
        .from(subscriptionDeliveries)
        .where(
          and(
            eq(subscriptionDeliveries.subscriptionId, sub.id),
            eq(subscriptionDeliveries.deliveryDate, deliveryDate),
            eq(subscriptionDeliveries.mealType, normalizedSlot)
          )
        )
        .limit(1);

      if (existingDelivery.length > 0) {
        const d = existingDelivery[0];
        if (d.status === "DELIVERED") {
          return NextResponse.json(
            { error: `Today's ${normalizedSlot} meal has already been delivered for this subscriber.` },
            { status: 400 }
          );
        }
        if (d.status === "MAKING" || d.status === "OUT_FOR_DELIVERY") {
          return NextResponse.json(
            { error: `Today's ${normalizedSlot} order is already released and in progress (${d.status}).` },
            { status: 400 }
          );
        }

        // If SCHEDULED, advance it to MAKING
        await db
          .update(subscriptionDeliveries)
          .set({ status: "MAKING", updatedAt: new Date() })
          .where(eq(subscriptionDeliveries.id, d.id));

        return NextResponse.json({
          success: true,
          message: `Order for ${sub.customerName || "Subscriber"} (${normalizedSlot}) advanced to Kitchen Preparation!`,
          deliveryId: d.id,
        });
      }

      // Create new active delivery dispatch record for today
      const deliveryId = `sdel-${sub.id}-${deliveryDate}-${normalizedSlot.toLowerCase()}-${Date.now().toString().slice(-4)}`;

      await db.insert(subscriptionDeliveries).values({
        id: deliveryId,
        subscriptionId: sub.id,
        deliveryDate,
        mealType: normalizedSlot,
        status: "MAKING",
        mealId: sub.mealId || null,
        notes: `Released by Admin kitchen for ${normalizedSlot} session`,
      });

      // Deduct 1 credit & increment completed meals
      await db
        .update(subscriptions)
        .set({
          creditsRemaining: Math.max(0, (sub.creditsRemaining ?? sub.mealsRemaining) - 1),
          mealsRemaining: Math.max(0, sub.mealsRemaining - 1),
          mealsUsed: (sub.mealsUsed || 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, sub.id));

      // Notify user
      if (sub.userId) {
        await db.insert(notifications).values({
          id: `notif-rel-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          userId: sub.userId,
          title: `Daily ${normalizedSlot} Bowl is Cooking! 🍲`,
          body: `Your daily subscription meal for ${normalizedSlot} (${deliveryDate}) has been released to the kitchen and is being freshly cooked in a clay handi.`,
          isRead: false,
        });
      }

      return NextResponse.json({
        success: true,
        message: `Successfully released ${normalizedSlot} order for ${sub.customerName || "Subscriber"}!`,
        deliveryId,
        mealsRemaining: Math.max(0, sub.mealsRemaining - 1),
      });
    }

    // ─────────────────────────────────────────────
    // 2. BATCH RELEASE FOR ALL ACTIVE SUBSCRIBERS
    // ─────────────────────────────────────────────
    if (mode === "BATCH") {
      // Find all active subscriptions with remaining credits
      const activeSubs = await db
        .select({
          id: subscriptions.id,
          userId: subscriptions.userId,
          mealId: subscriptions.mealId,
          status: subscriptions.status,
          mealsRemaining: subscriptions.mealsRemaining,
          creditsRemaining: subscriptions.creditsRemaining,
          mealsUsed: subscriptions.mealsUsed,
          mealTiming: subscriptions.mealTiming,
          customerName: users.name,
        })
        .from(subscriptions)
        .leftJoin(users, eq(subscriptions.userId, users.id))
        .where(eq(subscriptions.status, "ACTIVE"));

      // Filter eligible for the requested slot
      const eligible = activeSubs.filter((s) => {
        if (s.mealsRemaining <= 0) return false;
        const timing = (s.mealTiming || "LUNCH").toUpperCase();
        if (timing === "BOTH") return true;
        return timing === normalizedSlot;
      });

      if (eligible.length === 0) {
        return NextResponse.json({
          success: true,
          releasedCount: 0,
          message: `No active subscribers eligible for ${normalizedSlot} release today.`,
        });
      }

      // Check existing deliveries for today
      const existingDeliveries = await db
        .select({
          subscriptionId: subscriptionDeliveries.subscriptionId,
          status: subscriptionDeliveries.status,
          id: subscriptionDeliveries.id,
        })
        .from(subscriptionDeliveries)
        .where(
          and(
            eq(subscriptionDeliveries.deliveryDate, deliveryDate),
            eq(subscriptionDeliveries.mealType, normalizedSlot)
          )
        );

      const existingMap = new Map<string, { status: string; id: string }>();
      existingDeliveries.forEach((d) => {
        existingMap.set(d.subscriptionId, { status: d.status, id: d.id });
      });

      let releasedCount = 0;
      let advancedCount = 0;

      for (const sub of eligible) {
        const existing = existingMap.get(sub.id);

        if (existing) {
          // If already scheduled, advance to MAKING
          if (existing.status === "SCHEDULED") {
            await db
              .update(subscriptionDeliveries)
              .set({ status: "MAKING", updatedAt: new Date() })
              .where(eq(subscriptionDeliveries.id, existing.id));
            advancedCount++;
          }
          continue;
        }

        // Create new delivery record
        const deliveryId = `sdel-${sub.id}-${deliveryDate}-${normalizedSlot.toLowerCase()}-${Date.now().toString().slice(-4)}`;

        await db.insert(subscriptionDeliveries).values({
          id: deliveryId,
          subscriptionId: sub.id,
          deliveryDate,
          mealType: normalizedSlot,
          status: "MAKING",
          mealId: sub.mealId || null,
          notes: `Batch released by kitchen for ${normalizedSlot}`,
        });

        // Deduct 1 credit & increment completed
        await db
          .update(subscriptions)
          .set({
            creditsRemaining: Math.max(0, (sub.creditsRemaining ?? sub.mealsRemaining) - 1),
            mealsRemaining: Math.max(0, sub.mealsRemaining - 1),
            mealsUsed: (sub.mealsUsed || 0) + 1,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, sub.id));

        // Notify user
        if (sub.userId) {
          await db.insert(notifications).values({
            id: `notif-batch-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            userId: sub.userId,
            title: `Today's ${normalizedSlot} Meal is Cooking! 🍲`,
            body: `Your daily subscription bowl for ${normalizedSlot} has been released to the kitchen for preparation.`,
            isRead: false,
          });
        }

        releasedCount++;
      }

      return NextResponse.json({
        success: true,
        releasedCount,
        advancedCount,
        message: `Batch released ${releasedCount} new ${normalizedSlot} orders to the kitchen (${advancedCount} advanced from scheduled).`,
      });
    }

    return NextResponse.json({ error: "Invalid mode specified." }, { status: 400 });
  } catch (error: any) {
    console.error("Error in POST /api/admin/subscriptions/release:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to release subscription order." },
      { status: 500 }
    );
  }
}
