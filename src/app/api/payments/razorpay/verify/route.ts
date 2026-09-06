import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { RazorpayService } from "@/lib/services/RazorpayService";
import { PaymentService } from "@/lib/services/PaymentService";
import { OrderService } from "@/lib/services/OrderService";
import { SubscriptionService } from "@/lib/services/SubscriptionService";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required Razorpay payment signature parameters." },
        { status: 400 }
      );
    }

    // Cryptographic signature check (HMAC-SHA256)
    const isValidSignature = RazorpayService.verifyPaymentSignature({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    if (!isValidSignature) {
      console.error(`Invalid Razorpay signature for order: ${razorpay_order_id}`);
      await PaymentService.updatePaymentFailed(razorpay_order_id);
      return NextResponse.json(
        { error: "Invalid payment signature verification failed." },
        { status: 400 }
      );
    }

    // Mark payment as SUCCESS in payments table
    const updatedPayment = await PaymentService.updatePaymentSuccess({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    if (!updatedPayment) {
      return NextResponse.json(
        { error: "Payment record not found." },
        { status: 404 }
      );
    }

    // Fulfill business logic based on purpose
    let subscriptionId = updatedPayment.subscriptionId;
    if (updatedPayment.purpose === "ORDER" && updatedPayment.orderId) {
      await OrderService.fulfillOrder(updatedPayment.orderId, session.userId);
    } else if (updatedPayment.purpose === "SUBSCRIPTION") {
      const createdSub = await SubscriptionService.createSubscriptionFromPayment({
        ...updatedPayment,
        userId: updatedPayment.userId || session.userId,
      });
      if (createdSub) {
        subscriptionId = createdSub.id;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully.",
      orderId: updatedPayment.orderId,
      subscriptionId,
      paymentId: updatedPayment.id,
    });
  } catch (error: any) {
    console.error("Razorpay Verify POST Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to verify payment." },
      { status: 500 }
    );
  }
}
