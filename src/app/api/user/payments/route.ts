import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/db";
import { payments, orders, subscriptions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userPayments = await db
      .select({
        id: payments.id,
        amount: payments.amount,
        currency: payments.currency,
        status: payments.status,
        method: payments.method,
        purpose: payments.purpose,
        razorpayOrderId: payments.razorpayOrderId,
        razorpayPaymentId: payments.razorpayPaymentId,
        receipt: payments.receipt,
        paidAt: payments.paidAt,
        createdAt: payments.createdAt,
        orderId: payments.orderId,
        subscriptionId: payments.subscriptionId,
      })
      .from(payments)
      .where(eq(payments.userId, session.userId))
      .orderBy(desc(payments.createdAt));

    return NextResponse.json({ payments: userPayments });
  } catch (error) {
    console.error("User Payments API Error:", error);
    return NextResponse.json({ error: "Failed to fetch user payments" }, { status: 500 });
  }
}
