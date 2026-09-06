import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { PaymentService } from "@/lib/services/PaymentService";
import { OrderService } from "@/lib/services/OrderService";
import { SubscriptionService } from "@/lib/services/SubscriptionService";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, subscriptionId, paymentMethod = "UPI", amount, razorpayPaymentId, razorpayOrderId } = body;

    if (!orderId && !subscriptionId) {
      return NextResponse.json(
        { error: "Order ID or Subscription ID is required" },
        { status: 400 }
      );
    }

    // Fulfill order or subscription securely
    if (orderId) {
      await OrderService.fulfillOrder(orderId, session.userId);
    }
    if (subscriptionId) {
      await SubscriptionService.fulfillSubscription(subscriptionId);
    }

    return NextResponse.json({
      success: true,
      status: "SUCCESS",
      orderId,
      subscriptionId,
    });
  } catch (error: any) {
    console.error("Payment Processing Error:", error);
    return NextResponse.json(
      { error: error?.message || "Payment processing failed" },
      { status: 500 }
    );
  }
}
