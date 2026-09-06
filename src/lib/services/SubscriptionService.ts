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
    let pricePerMeal = 149;
    let discount = 0;
    let deliveryFee = 0;
    let taxes = 0;

    // 1. Fetch Meal details & pricing from database
    if (params.mealId) {
      const mealRows = await db
        .select({
          id: foodItems.id,
          name: foodItems.name,
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
        pricePerMeal =
          m.subPricePerMeal && m.pricingIsActive
            ? Number(m.subPricePerMeal)
            : Math.round(Number(m.standardPrice) * 0.85);
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

    // 3. Compute delivery fee if address ID is provided
    if (params.addressId) {
      try {
        const addrRows = await db
          .select()
          .from(addresses)
          .where(eq(addresses.id, params.addressId))
          .limit(1);

        if (addrRows.length > 0 && addrRows[0].latitude !== null && addrRows[0].longitude !== null) {
          const { DeliveryZoneService } = await import("@/lib/services/DeliveryZoneService");
          const zoneVal = await DeliveryZoneService.validateLocation(
            addrRows[0].latitude,
            addrRows[0].longitude
          );
          if (zoneVal.isWithinRadius) {
            deliveryFee = zoneVal.deliveryFee;
          }
        }
      } catch (e) {
        console.warn("Delivery fee check failed during sub calculation:", e);
      }
    }

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

      // 5. Generate full initial delivery schedules
      await SubscriptionService.generateDeliverySchedules(subRecord);
    }

    return subRecord;
  }

  /**
   * Generates initial scheduled delivery rows in subscriptionDeliveries
   */
  public static async generateDeliverySchedules(sub: {
    id: string;
    mealId: string | null;
    mealCreditsPurchased: number;
    mealsPerDay: number;
    mealTiming: string;
    startDate: string;
  }) {
    const existing = await db
      .select()
      .from(subscriptionDeliveries)
      .where(eq(subscriptionDeliveries.subscriptionId, sub.id))
      .limit(1);

    if (existing.length > 0) return;

    const totalCredits = sub.mealCreditsPurchased || 20;
    const mealsPerDay = sub.mealsPerDay || 1;
    const days = Math.ceil(totalCredits / mealsPerDay);

    let curr = new Date(sub.startDate || Date.now());
    let scheduled = 0;

    const rowsToInsert = [];

    for (let dayIdx = 0; dayIdx < days && scheduled < totalCredits; dayIdx++) {
      const dateStr = curr.toISOString().split("T")[0];

      if (mealsPerDay === 2 || sub.mealTiming === "BOTH") {
        rowsToInsert.push({
          id: `sdel-${sub.id}-${dateStr}-lunch`,
          subscriptionId: sub.id,
          deliveryDate: dateStr,
          mealType: "LUNCH",
          status: "SCHEDULED",
          mealId: sub.mealId || null,
        });
        scheduled++;

        if (scheduled < totalCredits) {
          rowsToInsert.push({
            id: `sdel-${sub.id}-${dateStr}-dinner`,
            subscriptionId: sub.id,
            deliveryDate: dateStr,
            mealType: "DINNER",
            status: "SCHEDULED",
            mealId: sub.mealId || null,
          });
          scheduled++;
        }
      } else {
        rowsToInsert.push({
          id: `sdel-${sub.id}-${dateStr}-${(sub.mealTiming || "LUNCH").toLowerCase()}`,
          subscriptionId: sub.id,
          deliveryDate: dateStr,
          mealType: sub.mealTiming === "DINNER" ? "DINNER" : "LUNCH",
          status: "SCHEDULED",
          mealId: sub.mealId || null,
        });
        scheduled++;
      }

      curr.setDate(curr.getDate() + 1);
    }

    if (rowsToInsert.length > 0) {
      await db.insert(subscriptionDeliveries).values(rowsToInsert);
    }
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
