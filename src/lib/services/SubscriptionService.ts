import { db } from "@/db";
import {
  subscriptions,
  subscriptionPackages,
  subscriptionMealPricing,
  subscriptionDeliveries,
  foodItems,
  addresses,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { BatchService } from "./batchService";

export class SubscriptionService {
  /**
   * Server-side calculation of subscription package price & credits
   * Formula: Grand Total = (Price Per Meal × Meal Credits) - Discount + Delivery Fee + Taxes
   */
  public static async calculateSubscriptionCheckout(params: {
    userId?: string;
    packageId?: string;
    mealId?: string;
    addressId?: string;
    mealCredits?: number;
    mealsPerDay?: number;
    mealTiming?: string;
    deliveryDays?: string[];
    startDate?: string;
  }) {
    let mealCredits = 20;
    let pricePerMeal = 55; // Default standard subscription rate is ₹55/meal
    let discount = 0;
    let deliveryFee = 0; // Subscriptions include free daily priority delivery
    let taxes = 0;

    // 1. Fetch Meal details & pricing from database
    if (params.mealId) {
      const mealRows = await db
        .select({
          id: foodItems.id,
          name: foodItems.name,
          isVeg: foodItems.isVeg,
          standardPrice: foodItems.price,
          subPricePerMeal: subscriptionMealPricing.pricePerMeal,
          pricingIsActive: subscriptionMealPricing.isActive,
        })
        .from(foodItems)
        .leftJoin(subscriptionMealPricing, eq(foodItems.id, subscriptionMealPricing.mealId))
        .where(eq(foodItems.id, params.mealId))
        .limit(1);

      if (mealRows.length > 0) {
        const m = mealRows[0];
        if (m.subPricePerMeal && m.pricingIsActive) {
          pricePerMeal = Number(m.subPricePerMeal);
        } else {
          pricePerMeal = 55; // Veg subscriber locked rate is ₹55/meal
        }
      }
    }

    // 2. Determine Meal Credits & Discount from subscriptionPackages or custom credits
    if (params.packageId) {
      const pkgRows = await db
        .select()
        .from(subscriptionPackages)
        .where(eq(subscriptionPackages.id, params.packageId))
        .limit(1);

      if (pkgRows.length > 0) {
        const pkg = pkgRows[0];
        mealCredits = pkg.mealCredits;
        discount = Number(pkg.discount || 0); // Flat rupee discount
      }
    } else if (params.mealCredits) {
      const parsed = Number(params.mealCredits);
      if (!isNaN(parsed) && parsed >= 10) {
        mealCredits = parsed;
      }
      discount = 0;
    }

    // 3. Subscriptions include free daily priority delivery (deliveryFee = 0)
    deliveryFee = 0;

    // 4. Grand Total = (Price Per Meal × Meal Credits) - Discount + Delivery Fee + Taxes
    const subtotal = pricePerMeal * mealCredits;
    const totalAmount = Math.max(0, subtotal - discount + deliveryFee + taxes);

    return {
      mealCreditsPurchased: mealCredits,
      pricePerMeal,
      subtotal,
      discount,
      deliveryFee,
      taxes,
      totalAmount,
    };
  }

  /**
   * Creates ONE subscription record strictly after a verified SUCCESS payment (Single Source of Truth).
   * Idempotent: Database UNIQUE constraint on paymentId prevents duplicate creation.
   */
  public static async createSubscriptionFromPayment(payment: {
    id: string;
    userId: string;
    amount: number;
    status: string;
    receipt?: string | null;
  }) {
    if (payment.status !== "SUCCESS") {
      throw new Error(`Cannot create subscription for unverified payment status: ${payment.status}`);
    }

    // 1. Idempotency Check: Return existing subscription if already created for this paymentId
    const existingSubs = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.paymentId, payment.id))
      .limit(1);

    if (existingSubs.length > 0) {
      return existingSubs[0];
    }

    // 2. Parse subscription specs from payment receipt metadata
    let spec: any = {};
    if (payment.receipt) {
      try {
        spec = JSON.parse(payment.receipt);
      } catch (e) {
        // Receipt was plain string identifier
      }
    }

    const calc = await this.calculateSubscriptionCheckout({
      userId: payment.userId,
      packageId: spec.packageId || undefined,
      mealId: spec.mealId || undefined,
      addressId: spec.addressId || undefined,
      mealCredits: spec.mealCredits || undefined,
    });

    const subscriptionId = `sub-pay-${payment.id}`;
    const start = spec.startDate ? new Date(spec.startDate) : new Date();
    const mealsPerDay = spec.mealsPerDay || 1;
    const daysDuration = Math.ceil(calc.mealCreditsPurchased / mealsPerDay);
    const expectedEnd = new Date(start);
    expectedEnd.setDate(expectedEnd.getDate() + daysDuration);

    const startDateStr = start.toISOString().split("T")[0];
    const endDateStr = expectedEnd.toISOString().split("T")[0];

    // 3. Insert single subscription with UNIQUE paymentId
    const [newSub] = await db
      .insert(subscriptions)
      .values({
        id: subscriptionId,
        paymentId: payment.id,
        userId: payment.userId,
        mealId: spec.mealId || null,
        packageId: spec.packageId || null,
        addressId: spec.addressId || null,
        mealCreditsPurchased: calc.mealCreditsPurchased,
        mealsRemaining: calc.mealCreditsPurchased,
        totalMeals: calc.mealCreditsPurchased,
        mealsUsed: 0,
        mealsPerDay,
        mealTiming: spec.mealTiming || "LUNCH",
        pricePerMeal: calc.pricePerMeal,
        discount: calc.discount,
        totalAmount: payment.amount,
        pricePaid: payment.amount,
        startDate: startDateStr,
        endDate: endDateStr,
        expectedEndDate: endDateStr,
        nextDeliveryDate: startDateStr,
        dietaryPreference: spec.dietaryPreference || "VEG",
        spicePreference: spec.spicePreference || "MEDIUM",
        deliveryDays: spec.deliveryDays || ["MON", "TUE", "WED", "THU", "FRI"],
        mealTypes: [],
        status: "ACTIVE",
      })
      .onConflictDoNothing()
      .returning();

    const subRecord = newSub || (await db.select().from(subscriptions).where(eq(subscriptions.paymentId, payment.id)).limit(1))[0];

    // 4. Link subscriptionId back to payments record
    if (subRecord) {
      const { payments } = await import("@/db/schema");
      await db
        .update(payments)
        .set({ subscriptionId: subRecord.id })
        .where(eq(payments.id, payment.id));

      // 5. Generate full initial delivery schedules & manifest via BatchService
      await BatchService.generateSubscriptionScheduleAndManifest(subRecord);
    }

    return subRecord;
  }

  /**
   * Generates initial scheduled delivery rows in subscriptionDeliveries & deliveryManifest
   */
  public static async generateDeliverySchedules(sub: any) {
    const { BatchService } = await import("./batchService");
    await BatchService.generateSubscriptionScheduleAndManifest(sub);
  }

  /**
   * Deprecated: Subscription creation before payment is eliminated.
   */
  public static async createPendingSubscription(params: any) {
    const calc = await this.calculateSubscriptionCheckout(params);
    return { subscriptionId: `pending-${Date.now()}`, totalAmount: calc.totalAmount, subscription: null };
  }

  /**
   * Activates subscription upon verified payment
   */
  public static async fulfillSubscription(subscriptionId: string) {
    const subRows = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, subscriptionId))
      .limit(1);

    if (subRows.length === 0) return null;

    const sub = subRows[0];

    await db
      .update(subscriptions)
      .set({
        status: "ACTIVE",
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscriptionId));

    return sub;
  }
}
