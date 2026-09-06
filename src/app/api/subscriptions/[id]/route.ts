import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  subscriptions,
  subscriptionPlans,
  subscriptionPackages,
  subscriptionDeliveries,
  foodItems,
  addresses,
} from "@/db/schema";
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
        mealId: subscriptions.mealId,
        packageId: subscriptions.packageId,
        mealCreditsPurchased: subscriptions.mealCreditsPurchased,
        mealsRemaining: subscriptions.mealsRemaining,
        totalMeals: subscriptions.totalMeals,
        mealsUsed: subscriptions.mealsUsed,
        mealsPerDay: subscriptions.mealsPerDay,
        mealTiming: subscriptions.mealTiming,
        pricePerMeal: subscriptions.pricePerMeal,
        discount: subscriptions.discount,
        totalAmount: subscriptions.totalAmount,
        pricePaid: subscriptions.pricePaid,
        startDate: subscriptions.startDate,
        endDate: subscriptions.endDate,
        expectedEndDate: subscriptions.expectedEndDate,
        nextDeliveryDate: subscriptions.nextDeliveryDate,
        dietaryPreference: subscriptions.dietaryPreference,
        spicePreference: subscriptions.spicePreference,
        allergies: subscriptions.allergies,
        excludeIngredients: subscriptions.excludeIngredients,
        deliveryDays: subscriptions.deliveryDays,
        preferredDeliveryTime: subscriptions.preferredDeliveryTime,
        mealName: foodItems.name,
        mealDescription: foodItems.description,
        mealImageUrl: foodItems.imageUrl,
        mealCalories: foodItems.calories,
        mealIsVeg: foodItems.isVeg,
        packageName: subscriptionPackages.name,
        planName: subscriptionPlans.name,
        addressLabel: addresses.label,
        addressString: addresses.address,
        area: addresses.area,
        city: addresses.city,
      })
      .from(subscriptions)
      .leftJoin(foodItems, eq(subscriptions.mealId, foodItems.id))
      .leftJoin(subscriptionPackages, eq(subscriptions.packageId, subscriptionPackages.id))
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

    const deliveries = await db
      .select({
        id: subscriptionDeliveries.id,
        deliveryDate: subscriptionDeliveries.deliveryDate,
        mealType: subscriptionDeliveries.mealType,
        status: subscriptionDeliveries.status,
        mealId: subscriptionDeliveries.mealId,
        mealName: foodItems.name,
      })
      .from(subscriptionDeliveries)
      .leftJoin(foodItems, eq(subscriptionDeliveries.mealId, foodItems.id))
      .where(eq(subscriptionDeliveries.subscriptionId, id))
      .orderBy(asc(subscriptionDeliveries.deliveryDate));

    return NextResponse.json({
      subscription,
      deliveries,
    });
  } catch (error) {
    console.error("Subscription GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch subscription details" }, { status: 500 });
  }
}
