import { NextRequest, NextResponse } from "next/server";
import { PaymentService } from "@/lib/services/PaymentService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { razorpay_order_id } = body;

    if (razorpay_order_id) {
      await PaymentService.updatePaymentFailed(razorpay_order_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to record payment cancellation" }, { status: 500 });
  }
}
