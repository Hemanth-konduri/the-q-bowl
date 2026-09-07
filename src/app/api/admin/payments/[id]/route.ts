import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, orders, subscriptions } from "@/db/schema";
import { requireAdminApi } from "@/lib/auth-guard";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const { id: paymentId } = await context.params;

  try {
    const body = await req.json();
    const { action, status, refundAmount, refundReason, refundRefId, notes } = body;

    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);

    if (!payment) {
      return NextResponse.json({ error: "Payment record not found." }, { status: 404 });
    }

    const now = new Date();

    if (action === "MARK_PAID") {
      // Mark as SUCCESS / Paid
      await db
        .update(payments)
        .set({
          status: "SUCCESS",
          paidAt: payment.paidAt || now,
          notes: notes || payment.notes || "Marked as paid by admin.",
          updatedAt: now,
        })
        .where(eq(payments.id, paymentId));

      // Sync linked Order status
      if (payment.orderId) {
        await db
          .update(orders)
          .set({ status: "CONFIRMED", updatedAt: now })
          .where(eq(orders.id, payment.orderId));
      }

      // Sync linked Subscription status
      if (payment.subscriptionId) {
        await db
          .update(subscriptions)
          .set({ status: "ACTIVE", updatedAt: now })
          .where(eq(subscriptions.id, payment.subscriptionId));
      }

      return NextResponse.json({ success: true, message: "Payment marked as paid." });
    }

    if (action === "REFUND") {
      const parsedRefundAmount = Number(refundAmount || payment.amount);
      const isPartial = parsedRefundAmount < payment.amount;
      const newStatus = isPartial ? "PARTIALLY_REFUNDED" : "REFUNDED";

      await db
        .update(payments)
        .set({
          status: newStatus,
          refundAmount: parsedRefundAmount,
          refundReason: refundReason || "Admin processed refund.",
          refundRefId: refundRefId || `REF-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
          refundedAt: now,
          notes: notes || payment.notes || null,
          updatedAt: now,
        })
        .where(eq(payments.id, paymentId));

      // If full refund on order, cancel order
      if (payment.orderId && !isPartial) {
        await db
          .update(orders)
          .set({ status: "CANCELLED", updatedAt: now })
          .where(eq(orders.id, payment.orderId));
      }

      // If full refund on subscription, cancel subscription
      if (payment.subscriptionId && !isPartial) {
        await db
          .update(subscriptions)
          .set({ status: "CANCELLED", updatedAt: now })
          .where(eq(subscriptions.id, payment.subscriptionId));
      }

      return NextResponse.json({
        success: true,
        message: `Refund recorded successfully (${newStatus}).`,
      });
    }

    // Direct Status / Notes Update
    if (status) {
      await db
        .update(payments)
        .set({
          status: status as any,
          notes: notes !== undefined ? notes : payment.notes,
          updatedAt: now,
        })
        .where(eq(payments.id, paymentId));

      return NextResponse.json({ success: true, message: "Payment status updated." });
    }

    return NextResponse.json({ error: "Invalid action or parameters." }, { status: 400 });
  } catch (error: any) {
    console.error(`PATCH /api/admin/payments/${paymentId} error:`, error);
    return NextResponse.json(
      { error: error?.message || "Failed to update payment record." },
      { status: 500 }
    );
  }
}
