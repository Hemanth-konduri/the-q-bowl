import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  subscriptions,
  subscriptionPlans,
  subscriptionDays,
  addresses,
} from "@/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch user's real active subscription
    const userSubs = await db
      .select({
        id: subscriptions.id,
        status: subscriptions.status,
        totalMeals: subscriptions.totalMeals,
        mealsUsed: subscriptions.mealsUsed,
        mealsRemaining: subscriptions.mealsRemaining,
        startDate: subscriptions.startDate,
        expectedEndDate: subscriptions.expectedEndDate,
        pricePaid: subscriptions.pricePaid,
        mealTypes: subscriptions.mealTypes,
        planName: subscriptionPlans.name,
        planDescription: subscriptionPlans.description,
      })
      .from(subscriptions)
      .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(eq(subscriptions.userId, session.userId))
      .orderBy(desc(subscriptions.createdAt));

    const activeSubscription = userSubs.find((s) => s.status === "ACTIVE") || userSubs[0] || null;

    // 2. Fetch real subscription days if subscription exists
    let days: any[] = [];
    if (activeSubscription) {
      days = await db
        .select()
        .from(subscriptionDays)
        .where(eq(subscriptionDays.subscriptionId, activeSubscription.id))
        .orderBy(asc(subscriptionDays.date))
        .limit(14);
    }

    // 3. Fetch real available subscription plans catalog from database
    const availablePlans = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true));

    return NextResponse.json({
      activeSubscription,
      allSubscriptions: userSubs,
      days,
      availablePlans,
    });
  } catch (error) {
    console.error("Subscriptions API error:", error);
    return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      action,
      subscriptionId,
      dayId,
      isSkipped,
      planId,
      duration = "MONTHLY",
      mealTypes = ["LUNCH", "DINNER"],
      dietaryPreference = "VEG",
      spicePreference = "MEDIUM",
      allergies = [],
      excludeIngredients = [],
      deliveryDays = ["MON", "TUE", "WED", "THU", "FRI", "SAT"],
      preferredDeliveryTime = "12:00 PM - 1:00 PM",
      addressId,
      pricePaid,
      startDate,
    } = body;

    if (action === "CREATE_SUBSCRIPTION") {
      if (!planId || !addressId) {
        return NextResponse.json({ error: "Plan ID and delivery address are required" }, { status: 400 });
      }

      // Check address
      const addrRows = await db.select().from(addresses).where(eq(addresses.id, addressId)).limit(1);
      if (addrRows.length === 0) {
        return NextResponse.json({ error: "Address not found" }, { status: 404 });
      }

      const targetAddress = addrRows[0];
      if (targetAddress.userId !== session.userId) {
        return NextResponse.json({ error: "Forbidden: Selected address does not belong to your account." }, { status: 403 });
      }

      if (targetAddress.latitude === null || targetAddress.longitude === null) {
        return NextResponse.json(
          { error: "Selected address missing map pin location. Please pin location on map before subscribing." },
          { status: 400 }
        );
      }

      // Kitchen Hub Coords: 17.4399, 78.3847
      const KITCHEN_LAT = 17.4399;
      const KITCHEN_LNG = 78.3847;
      const R = 6371; // Earth's radius in km
      const dLat = ((targetAddress.latitude - KITCHEN_LAT) * Math.PI) / 180;
      const dLon = ((targetAddress.longitude - KITCHEN_LNG) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((KITCHEN_LAT * Math.PI) / 180) *
          Math.cos((targetAddress.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const distanceKm = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));

      if (distanceKm > 15) {
        return NextResponse.json(
          { error: `Selected address is ${distanceKm.toFixed(1)} km away, which exceeds our 15 km delivery zone.` },
          { status: 400 }
        );
      }

      const planRows = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId)).limit(1);
      if (planRows.length === 0) {
        return NextResponse.json({ error: "Subscription plan not found" }, { status: 404 });
      }

      const plan = planRows[0];
      const isWeekly = duration === "WEEKLY";
      const totalMealsCount = isWeekly ? (plan.mealsPerDay || 1) * 7 : plan.totalMeals;

      // SERVER SOURCE OF TRUTH FOR PRICE: Ignore client-sent price
      const finalPrice = isWeekly ? plan.weeklyPrice || plan.price : plan.monthlyPrice || plan.price;

      const subId = `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const sDate = startDate || new Date().toISOString().split("T")[0];
      const eDate = new Date(Date.now() + (isWeekly ? 7 : 30) * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      await db.insert(subscriptions).values({
        id: subId,
        userId: session.userId,
        planId,
        addressId,
        mealTypes: mealTypes.length > 0 ? mealTypes : ["LUNCH"],
        pricePaid: finalPrice,
        totalMeals: totalMealsCount,
        mealsUsed: 0,
        mealsRemaining: totalMealsCount,
        startDate: sDate,
        expectedEndDate: eDate,
        dietaryPreference,
        spicePreference,
        allergies,
        excludeIngredients,
        deliveryDays,
        preferredDeliveryTime,
        status: "ACTIVE",
      });

      // Generate initial subscription days
      for (let i = 0; i < Math.min(totalMealsCount, 14); i++) {
        const d = new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        const dayIdVal = `subday-${subId}-${d}`;
        await db.insert(subscriptionDays).values({
          id: dayIdVal,
          subscriptionId: subId,
          date: d,
          isSkipped: false,
          isConsumed: false,
        });
      }

      return NextResponse.json({
        success: true,
        subscriptionId: subId,
        planName: plan.name,
        startDate: sDate,
        totalMeals: totalMealsCount,
        pricePaid: finalPrice,
      });
    }

    if (action === "TOGGLE_PAUSE" && subscriptionId) {
      const sub = await db
        .select()
        .from(subscriptions)
        .where(and(eq(subscriptions.id, subscriptionId), eq(subscriptions.userId, session.userId)))
        .limit(1);

      if (sub.length > 0) {
        const newStatus = sub[0].status === "ACTIVE" ? "PAUSED" : "ACTIVE";
        await db
          .update(subscriptions)
          .set({ status: newStatus, updatedAt: new Date() })
          .where(eq(subscriptions.id, subscriptionId));
        return NextResponse.json({ success: true, status: newStatus });
      }
    }

    if (action === "TOGGLE_SKIP" && dayId) {
      await db
        .update(subscriptionDays)
        .set({ isSkipped, updatedAt: new Date() })
        .where(eq(subscriptionDays.id, dayId));
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Subscription update error:", error);
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
  }
}
