import { db } from "@/db";
import { payments, paymentEvents, subscriptions, subscriptionDeliveries } from "@/db/schema";
import { eq } from "drizzle-orm";

export class PaymentService {
  /**
   * Records a pending payment when a Razorpay order is initialized
   */
  public static async createPendingPayment(data: {
    userId: string;
    razorpayOrderId: string;
    amount: number;
    currency?: string;
    purpose: "ORDER" | "SUBSCRIPTION" | "WALLET";
    receipt: string;
    orderId?: string;
    subscriptionId?: string;
    method?: "UPI" | "CREDIT_CARD" | "DEBIT_CARD" | "NET_BANKING" | "WALLET" | "CASH_ON_DELIVERY";
  }) {
    const paymentId = `pay-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    const [newPayment] = await db
      .insert(payments)
      .values({
        id: paymentId,
        userId: data.userId,
        orderId: data.orderId || null,
        subscriptionId: data.subscriptionId || null,
        razorpayOrderId: data.razorpayOrderId,
        amount: data.amount,
        currency: data.currency || "INR",
        purpose: data.purpose,
        receipt: data.receipt,
        method: data.method || "UPI",
        status: "PENDING",
        transactionId: data.razorpayOrderId,
      })
      .returning();

    return newPayment;
  }

  /**
   * Updates payment status to SUCCESS upon signature or webhook verification
   */
  public static async updatePaymentSuccess(data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature?: string;
    method?: string;
  }) {
    const existing = await db
      .select()
      .from(payments)
      .where(eq(payments.razorpayOrderId, data.razorpayOrderId))
      .limit(1);

    if (existing.length === 0) {
      return null;
    }

    const current = existing[0];
    if (current.status === "SUCCESS") {
      return current; // Already processed idempotently
    }

    const validMethod = (data.method || current.method || "UPI") as
      | "UPI"
      | "CREDIT_CARD"
      | "DEBIT_CARD"
      | "NET_BANKING"
      | "WALLET"
      | "CASH_ON_DELIVERY";

    const [updated] = await db
      .update(payments)
      .set({
        status: "SUCCESS",
        razorpayPaymentId: data.razorpayPaymentId,
        razorpaySignature: data.razorpaySignature || current.razorpaySignature,
        transactionId: data.razorpayPaymentId,
        method: validMethod,
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payments.id, current.id))
      .returning();

    return updated;
  }

  /**
   * Updates payment status to FAILED and cleans up unfulfilled pending subscription
   */
  public static async updatePaymentFailed(razorpayOrderId: string) {
    const existing = await db
      .select()
      .from(payments)
      .where(eq(payments.razorpayOrderId, razorpayOrderId))
      .limit(1);

    if (existing.length === 0) return null;

    const current = existing[0];

    // Clean up unfulfilled subscription record if payment failed or was dismissed before activation
    if (current.purpose === "SUBSCRIPTION" && current.subscriptionId) {
      const subRows = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.id, current.subscriptionId))
        .limit(1);

      if (subRows.length > 0 && subRows[0].status === "PAUSED") {
        await db.delete(subscriptionDeliveries).where(eq(subscriptionDeliveries.subscriptionId, current.subscriptionId));
        await db.delete(subscriptions).where(eq(subscriptions.id, current.subscriptionId));
      }
    }

    const [updated] = await db
      .update(payments)
      .set({
        status: "FAILED",
        updatedAt: new Date(),
      })
      .where(eq(payments.id, current.id))
      .returning();

    return updated;
  }

  /**
   * Logs a webhook event into payment_events table for idempotency check.
   * Returns false if the event was already recorded.
   */
  public static async logWebhookEvent(params: {
    eventId: string;
    eventType: string;
    payload: string;
  }): Promise<{ isDuplicate: boolean; eventRecordId: string }> {
    const existing = await db
      .select()
      .from(paymentEvents)
      .where(eq(paymentEvents.eventId, params.eventId))
      .limit(1);

    if (existing.length > 0) {
      return { isDuplicate: true, eventRecordId: existing[0].id };
    }

    const id = `pevent-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const [inserted] = await db
      .insert(paymentEvents)
      .values({
        id,
        eventId: params.eventId,
        eventType: params.eventType,
        payload: params.payload,
        processed: false,
      })
      .returning();

    return { isDuplicate: false, eventRecordId: inserted.id };
  }

  /**
   * Marks a webhook event as processed
   */
  public static async markEventProcessed(eventId: string) {
    await db
      .update(paymentEvents)
      .set({ processed: true })
      .where(eq(paymentEvents.eventId, eventId));
  }
}
