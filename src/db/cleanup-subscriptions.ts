import "dotenv/config";
import { db } from "./index";
import { subscriptions, payments, subscriptionDeliveries } from "./schema";
import { eq, inArray, sql } from "drizzle-orm";

export async function cleanupSubscriptionsDatabase() {
  console.log("🧹 Starting Subscription Database Synchronization & Cleanup...");

  try {
    // Ensure payment_id column exists with UNIQUE constraint on subscriptions table
    await db.execute(sql`
      ALTER TABLE subscriptions
      ADD COLUMN IF NOT EXISTS payment_id text UNIQUE REFERENCES payments(id);
    `);
    // 1. Fetch all subscription and payment records
    const allSubs = await db.select().from(subscriptions);
    const allPayments = await db.select().from(payments);

    console.log(`Found ${allSubs.length} total subscriptions and ${allPayments.length} total payments.`);

    const successPayments = allPayments.filter(
      (p) => p.status === "SUCCESS" && p.purpose === "SUBSCRIPTION"
    );

    console.log(`Found ${successPayments.length} verified SUCCESS subscription payments.`);

    const linkedPaymentIds = new Set<string>();
    const validSubIdsToKeep = new Set<string>();

    // 2. Pair valid subscriptions 1:1 with SUCCESS payments
    for (const sub of allSubs) {
      // Find matching success payment
      const matchPayment = successPayments.find((p) => {
        if (linkedPaymentIds.has(p.id)) return false; // Already paired to another sub
        if (sub.paymentId === p.id) return true;
        if (p.subscriptionId === sub.id) return true;
        if (p.userId === sub.userId && Math.abs(p.amount - sub.totalAmount) < 1) return true;
        return false;
      });

      if (matchPayment) {
        linkedPaymentIds.add(matchPayment.id);
        validSubIdsToKeep.add(sub.id);

        // Update 1:1 paymentId reference and exact total matching payment
        await db
          .update(subscriptions)
          .set({
            paymentId: matchPayment.id,
            totalAmount: matchPayment.amount,
            pricePaid: matchPayment.amount,
            status: "ACTIVE",
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, sub.id));

        // Link payment back to sub
        await db
          .update(payments)
          .set({ subscriptionId: sub.id })
          .where(eq(payments.id, matchPayment.id));
      }
    }

    // 3. For any SUCCESS payment that does NOT have a subscription, create ONE
    for (const pay of successPayments) {
      if (!linkedPaymentIds.has(pay.id) && pay.userId) {
        console.log(`Creating missing 1:1 subscription for SUCCESS payment: ${pay.id}`);

        const { SubscriptionService } = await import("../lib/services/SubscriptionService");
        const newSub = await SubscriptionService.createSubscriptionFromPayment({
          id: pay.id,
          userId: pay.userId,
          amount: pay.amount,
          status: "SUCCESS",
          receipt: pay.receipt,
        });

        if (newSub) {
          validSubIdsToKeep.add(newSub.id);
          linkedPaymentIds.add(pay.id);
        }
      }
    }

    // 4. Identify all invalid / unverified / duplicate subscription IDs to delete
    const invalidSubIds = allSubs
      .map((s) => s.id)
      .filter((id) => !validSubIdsToKeep.has(id));

    if (invalidSubIds.length > 0) {
      console.log(`Deleting ${invalidSubIds.length} invalid/unpaid/duplicate subscriptions...`);

      // Nullify foreign key references in payments table first
      await db
        .update(payments)
        .set({ subscriptionId: null })
        .where(inArray(payments.subscriptionId, invalidSubIds));

      // Delete associated delivery schedules first
      await db
        .delete(subscriptionDeliveries)
        .where(inArray(subscriptionDeliveries.subscriptionId, invalidSubIds));

      // Delete invalid subscriptions
      await db.delete(subscriptions).where(inArray(subscriptions.id, invalidSubIds));
    }

    console.log("✅ Subscription Database Synchronization Complete.");
    console.log(`Final state: ${validSubIdsToKeep.size} valid subscriptions synchronized 1:1 with verified payments.`);
  } catch (error) {
    console.error("❌ Subscription Cleanup Error:", error);
  }
}

// Execute cleanup if run directly
if (require.main === module) {
  cleanupSubscriptionsDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
