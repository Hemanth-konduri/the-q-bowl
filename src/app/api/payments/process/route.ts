import { NextResponse } from "next/server";
import { db } from "@/db";
import { payments, orders, subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, subscriptionId, paymentMethod, amount, transactionToken } = body;

    if (!paymentMethod || (!orderId && !subscriptionId)) {
      return NextResponse.json(
        { error: "Order/Subscription ID and payment method are required" },
        { status: 400 }
      );
    }

    const txId = transactionToken || `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // Check if transaction ID already processed to prevent duplicate payment submissions
    const existingTx = await db
      .select()
      .from(payments)
      .where(eq(payments.transactionId, txId))
      .limit(1);

    if (existingTx.length > 0 && existingTx[0].status === "SUCCESS") {
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        transactionId: txId,
        payment: existingTx[0],
      });
    }

    // Insert payment record
    const paymentId = `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const [newPayment] = await db
      .insert(payments)
      .values({
        id: paymentId,
        orderId: orderId || null,
        subscriptionId: subscriptionId || null,
        amount: Number(amount) || 0,
        method: paymentMethod,
        transactionId: txId,
        status: "SUCCESS",
        paidAt: new Date(),
      })
      .returning();

    // Update target Order or Subscription status
    if (orderId) {
      await db
        .update(orders)
        .set({ status: "CONFIRMED", updatedAt: new Date() })
        .where(eq(orders.id, orderId));
    }

    if (subscriptionId) {
      await db
        .update(subscriptions)
        .set({ status: "ACTIVE", updatedAt: new Date() })
        .where(eq(subscriptions.id, subscriptionId));
    }

    return NextResponse.json({
      success: true,
      paymentId,
      transactionId: txId,
      status: "SUCCESS",
      orderId,
      subscriptionId,
    });
  } catch (error) {
    console.error("Payment Processing Error:", error);
    return NextResponse.json({ error: "Payment processing failed" }, { status: 500 });
  }
}
