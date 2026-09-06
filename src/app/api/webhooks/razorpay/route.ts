import { NextResponse } from "next/server";
import { RazorpayService } from "@/lib/services/RazorpayService";
import { PaymentService } from "@/lib/services/PaymentService";
import { OrderService } from "@/lib/services/OrderService";
import { SubscriptionService } from "@/lib/services/SubscriptionService";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    // Verify webhook signature
    const isValidSignature = RazorpayService.verifyWebhookSignature(rawBody, signature);
    if (!isValidSignature) {
      console.error("Invalid Razorpay Webhook Signature");
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const eventId = payload.created_at
      ? `${event}_${payload.created_at}_${payload.payload?.payment?.entity?.id || Math.random()}`
      : `evt_${Date.now()}_${Math.random()}`;

    console.log(`[Razorpay Webhook] Received Event: ${event} (ID: ${eventId})`);

    // Idempotency Check
    const { isDuplicate, eventRecordId } = await PaymentService.logWebhookEvent({
      eventId,
      eventType: event,
      payload: rawBody,
    });

    if (isDuplicate) {
      console.log(`[Razorpay Webhook] Skipping duplicate event: ${eventId}`);
      return NextResponse.json({ status: "already_processed" }, { status: 200 });
    }

    // Event Handling
    if (event === "payment.captured" || event === "order.paid") {
      const paymentEntity = payload.payload?.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id;
      const razorpayPaymentId = paymentEntity?.id;
      const paymentMethod = paymentEntity?.method?.toUpperCase() || "UPI";

      if (razorpayOrderId && razorpayPaymentId) {
        const updatedPayment = await PaymentService.updatePaymentSuccess({
          razorpayOrderId,
          razorpayPaymentId,
          method: paymentMethod,
        });

        if (updatedPayment) {
          if (updatedPayment.purpose === "ORDER" && updatedPayment.orderId && updatedPayment.userId) {
            await OrderService.fulfillOrder(updatedPayment.orderId, updatedPayment.userId);
          } else if (updatedPayment.purpose === "SUBSCRIPTION" && updatedPayment.userId) {
            await SubscriptionService.createSubscriptionFromPayment({
              ...updatedPayment,
              userId: updatedPayment.userId,
            });
          }
        }
      }
    } else if (event === "payment.failed") {
      const paymentEntity = payload.payload?.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id;
      if (razorpayOrderId) {
        await PaymentService.updatePaymentFailed(razorpayOrderId);
      }
    }

    // Mark event as processed
    await PaymentService.markEventProcessed(eventId);

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    console.error("[Razorpay Webhook Error]:", error);
    return NextResponse.json({ error: "Webhook handling failed" }, { status: 500 });
  }
}
