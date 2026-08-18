import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  subscriptions,
  subscriptionPlans,
  subscriptionDays,
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

    const { action, subscriptionId, dayId, isSkipped } = await req.json();

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
