import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  subscriptions,
  subscriptionMealPricing,
  subscriptionPackages,
  subscriptionDeliveries,
  payments,
  foodItems,
  categories,
  addresses,
  users,
} from "@/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch user's subscriptions
    const userSubs = await db
      .select({
        id: subscriptions.id,
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
        totalAmount: payments.amount,
        pricePaid: payments.amount,
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
        addressLabel: addresses.label,
        addressString: addresses.address,
        area: addresses.area,
        city: addresses.city,
      })
      .from(subscriptions)
      .leftJoin(foodItems, eq(subscriptions.mealId, foodItems.id))
      .leftJoin(subscriptionPackages, eq(subscriptions.packageId, subscriptionPackages.id))
      .leftJoin(payments, eq(subscriptions.paymentId, payments.id))
      .leftJoin(addresses, eq(subscriptions.addressId, addresses.id))
      .where(eq(subscriptions.userId, session.userId))
      .orderBy(desc(subscriptions.createdAt));

    const activeSubscription = userSubs.find((s) => s.status === "ACTIVE" || s.status === "PAUSED") || userSubs[0] || null;

    // 2. Fetch deliveries for active subscription
    let deliveries: any[] = [];
    if (activeSubscription) {
      deliveries = await db
        .select({
          id: subscriptionDeliveries.id,
          subscriptionId: subscriptionDeliveries.subscriptionId,
          deliveryDate: subscriptionDeliveries.deliveryDate,
          mealType: subscriptionDeliveries.mealType,
          status: subscriptionDeliveries.status,
          mealId: subscriptionDeliveries.mealId,
          mealName: foodItems.name,
        })
        .from(subscriptionDeliveries)
        .leftJoin(foodItems, eq(subscriptionDeliveries.mealId, foodItems.id))
        .where(eq(subscriptionDeliveries.subscriptionId, activeSubscription.id))
        .orderBy(asc(subscriptionDeliveries.deliveryDate))
        .limit(30);
    }

    // 3. Fetch available preloaded meals catalog with subscription price
    const availableMeals = await db
      .select({
        id: foodItems.id,
        name: foodItems.name,
        description: foodItems.description,
        imageUrl: foodItems.imageUrl,
        calories: foodItems.calories,
        protein: foodItems.protein,
        isVeg: foodItems.isVeg,
        rating: foodItems.rating,
        standardPrice: foodItems.price,
        pricingId: subscriptionMealPricing.id,
        pricePerMeal: subscriptionMealPricing.pricePerMeal,
        categoryName: categories.name,
      })
      .from(foodItems)
      .leftJoin(subscriptionMealPricing, eq(foodItems.id, subscriptionMealPricing.mealId))
      .leftJoin(categories, eq(foodItems.categoryId, categories.id))
      .where(eq(foodItems.isAvailable, true));

    const processedMeals = availableMeals.map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      imageUrl: m.imageUrl,
      calories: m.calories,
      protein: m.protein,
      isVeg: m.isVeg,
      rating: m.rating,
      standardPrice: m.standardPrice,
      pricePerMeal: m.pricePerMeal ? Number(m.pricePerMeal) : Math.round(Number(m.standardPrice) * 0.85),
      categoryName: m.categoryName || "Artisan Bowls",
    }));

    // 4. Fetch available meal packages
    const availablePackages = await db
      .select()
      .from(subscriptionPackages)
      .where(eq(subscriptionPackages.isActive, true))
      .orderBy(asc(subscriptionPackages.mealCredits));

    return NextResponse.json({
      activeSubscription,
      allSubscriptions: userSubs,
      deliveries,
      availableMeals: processedMeals,
      availablePackages,
    });
  } catch (error) {
    console.error("User Subscriptions GET API error:", error);
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
      mealId,
      packageId,
      customCredits,
      mealTiming = "LUNCH", // 'LUNCH', 'DINNER', or 'BOTH'
      dietaryPreference = "VEG",
      spicePreference = "MEDIUM",
      allergies = [],
      excludeIngredients = [],
      deliveryDays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
      preferredDeliveryTime = "12:00 PM - 1:00 PM",
      addressId,
      startDate,
    } = body;

    if (action === "CREATE_SUBSCRIPTION") {
      if (!mealId || !addressId) {
        return NextResponse.json({ error: "Meal selection and delivery address are required." }, { status: 400 });
      }

      // Check delivery address & distance
      const addrRows = await db.select().from(addresses).where(eq(addresses.id, addressId)).limit(1);
      if (addrRows.length === 0) {
        return NextResponse.json({ error: "Address not found" }, { status: 404 });
      }

      const targetAddress = addrRows[0];
      if (targetAddress.userId !== session.userId) {
        return NextResponse.json({ error: "Forbidden: Address does not belong to your account." }, { status: 403 });
      }

      if (targetAddress.latitude === null || targetAddress.longitude === null) {
        return NextResponse.json(
          { error: "Selected address is missing map pin location. Please pin your location on map." },
          { status: 400 }
        );
      }

      // Dynamic Database Delivery Zone Validation
      const { DeliveryZoneService } = await import("@/lib/services/DeliveryZoneService");
      const zoneVal = await DeliveryZoneService.validateLocation(
        targetAddress.latitude,
        targetAddress.longitude
      );

      if (!zoneVal.isWithinRadius) {
        return NextResponse.json(
          { error: `Selected address is ${zoneVal.distanceKm} km away from ${zoneVal.zoneName}, which exceeds our ${zoneVal.allowedRadiusKm} km delivery zone.` },
          { status: 400 }
        );
      }


      const { SubscriptionService } = await import("@/lib/services/SubscriptionService");
      const calc = await SubscriptionService.calculateSubscriptionCheckout({
        userId: session.userId,
        packageId,
        mealId,
        addressId,
        mealCredits: customCredits ? Number(customCredits) : undefined,
      });

      const pricePerMeal = calc.pricePerMeal;
      const mealCredits = calc.mealCreditsPurchased;
      const discount = calc.discount;
      const grandTotal = calc.totalAmount;

      // Determine timing & meals per day
      const normalizedTiming = String(mealTiming).toUpperCase();
      const mealsPerDay = normalizedTiming === "BOTH" || normalizedTiming === "LUNCH_DINNER" ? 2 : 1;
      const durationDays = Math.ceil(mealCredits / mealsPerDay);

      // Server calculated dates
      const start = startDate ? new Date(startDate) : new Date(Date.now() + 24 * 60 * 60 * 1000);
      const end = new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000);

      const startDateStr = start.toISOString().split("T")[0];
      const endDateStr = end.toISOString().split("T")[0];

      const { PaymentService } = await import("@/lib/services/PaymentService");
      const directTxnId = `txn-direct-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const receiptMeta = JSON.stringify({
        packageId: packageId || null,
        mealId,
        addressId,
        mealCredits: calc.mealCreditsPurchased,
        mealsPerDay,
        mealTiming: normalizedTiming === "BOTH" ? "BOTH" : normalizedTiming,
        deliveryDays,
        startDate: startDateStr,
      });

      const pendingPay = await PaymentService.createPendingPayment({
        userId: session.userId,
        razorpayOrderId: directTxnId,
        amount: grandTotal,
        currency: "INR",
        purpose: "SUBSCRIPTION",
        receipt: receiptMeta,
      });

      const successPay = await PaymentService.updatePaymentSuccess({
        razorpayOrderId: directTxnId,
        razorpayPaymentId: `pay-${directTxnId}`,
      });

      const createdSub = await SubscriptionService.createSubscriptionFromPayment({
        id: successPay?.id || pendingPay.id,
        userId: session.userId,
        amount: grandTotal,
        status: "SUCCESS",
        receipt: receiptMeta,
      });

      const mealInfo = await db.select({ name: foodItems.name }).from(foodItems).where(eq(foodItems.id, mealId)).limit(1);
      const mealName = mealInfo.length > 0 ? mealInfo[0].name : "Subscription Meal";

      return NextResponse.json({
        success: true,
        subscriptionId: createdSub.id,
        mealName,
        mealCreditsPurchased: createdSub.mealCreditsPurchased,
        mealsRemaining: createdSub.mealsRemaining,
        mealsPerDay: createdSub.mealsPerDay,
        startDate: createdSub.startDate,
        endDate: createdSub.endDate,
        totalAmount: createdSub.totalAmount,
      });
    }

    if (action === "TOGGLE_PAUSE" && subscriptionId) {
      const sub = await db
        .select()
        .from(subscriptions)
        .where(and(eq(subscriptions.id, subscriptionId), eq(subscriptions.userId, session.userId)))
        .limit(1);

      if (sub.length > 0) {
        const currentStatus = sub[0].status;
        const newStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
        await db
          .update(subscriptions)
          .set({ status: newStatus, updatedAt: new Date() })
          .where(eq(subscriptions.id, subscriptionId));

        return NextResponse.json({ success: true, status: newStatus });
      } else {
        return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("User Subscriptions POST error:", error);
    return NextResponse.json({ error: error.message || "Failed to process subscription action" }, { status: 500 });
  }
}
