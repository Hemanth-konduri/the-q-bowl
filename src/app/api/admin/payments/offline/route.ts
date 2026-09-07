import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, users, orders, subscriptions } from "@/db/schema";
import { requireAdminApi } from "@/lib/auth-guard";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const {
      userId,
      orderId,
      subscriptionId,
      amount,
      method, // CASH_ON_DELIVERY | UPI | NET_BANKING | WALLET
      purpose, // ORDER | SUBSCRIPTION
      notes,
      referenceId,
    } = body;

    if (!userId || !amount || Number(amount) <= 0) {
      return NextResponse.json(
        { error: "Customer ID and valid payment amount are required." },
        { status: 400 }
      );
    }

    // Verify user exists
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    const now = new Date();
    const newPaymentId = `pay_${crypto.randomUUID()}`;
    const generatedTxnId = referenceId || `OFFLINE-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const paymentMethod = method || "CASH_ON_DELIVERY";
    const paymentPurpose = purpose || (subscriptionId ? "SUBSCRIPTION" : "ORDER");

    await db.insert(payments).values({
      id: newPaymentId,
      userId,
      orderId: orderId || null,
      subscriptionId: subscriptionId || null,
      amount: Number(amount),
      currency: "INR",
      method: paymentMethod as any,
      purpose: paymentPurpose,
      transactionId: generatedTxnId,
      receipt: `RCPT-OFFLINE-${Date.now()}`,
      status: "SUCCESS",
      paidAt: now,
      notes: notes || "Recorded offline payment by admin.",
      createdAt: now,
      updatedAt: now,
    });

    // Sync order if attached
    if (orderId) {
      await db
        .update(orders)
        .set({ status: "CONFIRMED", updatedAt: now })
        .where(eq(orders.id, orderId));
    }

    // Sync subscription if attached
    if (subscriptionId) {
      await db
        .update(subscriptions)
        .set({ status: "ACTIVE", updatedAt: now })
        .where(eq(subscriptions.id, subscriptionId));
    }

    return NextResponse.json({
      success: true,
      paymentId: newPaymentId,
      transactionId: generatedTxnId,
      message: "Offline payment recorded successfully.",
    });
  } catch (error: any) {
    console.error("POST /api/admin/payments/offline error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to record offline payment." },
      { status: 500 }
    );
  }
}
