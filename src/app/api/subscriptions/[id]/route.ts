import { NextResponse } from "next/server";
import { db } from "@/db";
import { subscriptions, subscriptionPlans, subscriptionDays, addresses } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { getSession } from "@/lib/session";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subRows = await db
      .select({
        id: subscriptions.id,
        userId: subscriptions.userId,
        status: subscriptions.status,
        totalMeals: subscriptions.totalMeals,
        mealsUsed: subscriptions.mealsUsed,
        mealsRemaining: subscriptions.mealsRemaining,
        startDate: subscriptions.startDate,
        expectedEndDate: subscriptions.expectedEndDate,
        pricePaid: subscriptions.pricePaid,
        dietaryPreference: subscriptions.dietaryPreference,
        spicePreference: subscriptions.spicePreference,
        allergies: subscriptions.allergies,
        excludeIngredients: subscriptions.excludeIngredients,
        deliveryDays: subscriptions.deliveryDays,
        preferredDeliveryTime: subscriptions.preferredDeliveryTime,
        mealTypes: subscriptions.mealTypes,
        planName: subscriptionPlans.name,
        planDescription: subscriptionPlans.description,
        addressLabel: addresses.label,
        addressString: addresses.address,
        area: addresses.area,
        city: addresses.city,
      })
      .from(subscriptions)
      .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .leftJoin(addresses, eq(subscriptions.addressId, addresses.id))
      .where(eq(subscriptions.id, id))
      .limit(1);

    if (subRows.length === 0) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    const subscription = subRows[0];

    // Ownership Authorization Check
    if (subscription.userId !== session.userId && session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: You do not have access to this subscription." }, { status: 403 });
    }

    const days = await db
      .select()
      .from(subscriptionDays)
      .where(eq(subscriptionDays.subscriptionId, id))
      .orderBy(asc(subscriptionDays.date));

    return NextResponse.json({
      subscription,
      days,
    });
  } catch (error) {
    console.error("Subscription GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch subscription details" }, { status: 500 });
  }
}
