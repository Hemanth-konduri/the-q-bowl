import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { foodItems, subscriptionPackages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SubscriptionService } from "@/lib/services/SubscriptionService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      mealId,
      packageId,
      customCredits,
      addressId,
      mealTiming = "LUNCH", // 'LUNCH', 'DINNER', or 'BOTH'
      startDate,
    } = body;

    if (!mealId) {
      return NextResponse.json({ error: "Meal selection is required" }, { status: 400 });
    }

    // Fetch meal metadata
    const mealRows = await db
      .select({
        id: foodItems.id,
        name: foodItems.name,
        description: foodItems.description,
        imageUrl: foodItems.imageUrl,
        calories: foodItems.calories,
        isVeg: foodItems.isVeg,
      })
      .from(foodItems)
      .where(eq(foodItems.id, mealId))
      .limit(1);

    if (mealRows.length === 0) {
      return NextResponse.json({ error: "Selected meal not found" }, { status: 404 });
    }

    const meal = mealRows[0];

    // Fetch package metadata if provided
    let selectedPackage: any = null;
    if (packageId) {
      const pkgRows = await db
        .select()
        .from(subscriptionPackages)
        .where(eq(subscriptionPackages.id, packageId))
        .limit(1);
      if (pkgRows.length > 0) {
        selectedPackage = pkgRows[0];
      }
    }

    // Unified Server-Side Financial Calculation
    const calc = await SubscriptionService.calculateSubscriptionCheckout({
      mealId,
      packageId: packageId || undefined,
      addressId: addressId || undefined,
      mealCredits: customCredits ? Number(customCredits) : undefined,
    });

    // Timing & Schedule calculations
    const normalizedTiming = String(mealTiming).toUpperCase();
    const mealsPerDay = normalizedTiming === "BOTH" || normalizedTiming === "LUNCH_DINNER" ? 2 : 1;
    const durationDays = Math.ceil(calc.mealCreditsPurchased / mealsPerDay);

    const start = startDate ? new Date(startDate) : new Date(Date.now() + 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000);

    return NextResponse.json({
      meal,
      package: selectedPackage,
      pricePerMeal: calc.pricePerMeal,
      mealCredits: calc.mealCreditsPurchased,
      mealsPerDay,
      mealTiming: normalizedTiming === "BOTH" ? "Lunch + Dinner" : normalizedTiming,
      durationDays,
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
      subtotal: calc.subtotal,
      discount: calc.discount,
      deliveryFee: calc.deliveryFee,
      taxes: calc.taxes,
      totalAmount: calc.totalAmount,
    });
  } catch (error: any) {
    console.error("Calculate API Error:", error);
    return NextResponse.json({ error: "Failed to calculate subscription details" }, { status: 500 });
  }
}
