import "dotenv/config";
import { db } from "./index";
import { subscriptions, subscriptionDeliveries, subscriptionPackages, foodItems } from "./schema";
import { eq } from "drizzle-orm";
import { SubscriptionService } from "../lib/services/SubscriptionService";

export async function syncActiveSubscription() {
  console.log("🔄 Synchronizing active subscription & generating delivery schedules...");

  const allSubs = await db.select().from(subscriptions).where(eq(subscriptions.status, "ACTIVE"));

  for (const sub of allSubs) {
    console.log(`Updating active subscription ${sub.id}...`);

    const startDateStr = new Date().toISOString().split("T")[0]; // 2026-08-26
    const expectedEnd = new Date();
    expectedEnd.setDate(expectedEnd.getDate() + 20); // 20 delivery days for 40 meals @ 2 meals/day
    const expectedEndDateStr = expectedEnd.toISOString().split("T")[0];

    // Update subscription to 40 meals package
    await db
      .update(subscriptions)
      .set({
        packageId: "pkg-40-meals",
        mealCreditsPurchased: 40,
        totalMeals: 40,
        mealsRemaining: 40,
        mealsUsed: 0,
        mealsPerDay: 2,
        mealTiming: "BOTH",
        totalAmount: 6350,
        pricePaid: 6350,
        startDate: startDateStr,
        expectedEndDate: expectedEndDateStr,
        nextDeliveryDate: startDateStr,
        status: "ACTIVE",
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, sub.id));

    // Clear old test delivery entries
    await db.delete(subscriptionDeliveries).where(eq(subscriptionDeliveries.subscriptionId, sub.id));

    // Generate new full delivery schedules
    await SubscriptionService.generateDeliverySchedules({
      id: sub.id,
      mealId: sub.mealId,
      mealCreditsPurchased: 40,
      mealsPerDay: 2,
      mealTiming: "BOTH",
      startDate: startDateStr,
    });
  }

  console.log("✅ Subscription synchronization complete.");
}

if (require.main === module) {
  syncActiveSubscription()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
