import Razorpay from "razorpay";
import crypto from "crypto";

export class RazorpayService {
  private static instance: Razorpay | null = null;

  private static getClient(): Razorpay {
    if (!this.instance) {
      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;

      if (!keyId || !keySecret) {
        throw new Error("RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not configured in environment variables.");
      }

      this.instance = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
    }

    return this.instance;
  }

  /**
   * Creates a Razorpay Order
   * @param amountInRupees Amount in INR (e.g. 499.50)
   * @param receipt Unique receipt identifier
   * @param notes Additional metadata
   */
  public static async createOrder(options: {
    amountInRupees: number;
    currency?: string;
    receipt: string;
    notes?: Record<string, string>;
  }) {
    const razorpay = this.getClient();
    const amountInPaise = Math.round(options.amountInRupees * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: options.currency || "INR",
      receipt: options.receipt,
      notes: options.notes || {},
    });

    return {
      orderId: order.id,
      amount: order.amount, // in paise
      currency: order.currency,
      receipt: order.receipt,
    };
  }

  /**
   * Verifies the Razorpay payment checkout signature
   */
  public static verifyPaymentSignature(params: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): boolean {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) return false;

    const body = `${params.razorpayOrderId}|${params.razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(body)
      .digest("hex");

    return expectedSignature === params.razorpaySignature;
  }

  /**
   * Verifies the Razorpay Webhook signature
   */
  public static verifyWebhookSignature(
    rawBody: string,
    signature: string | null
  ): boolean {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret || !signature) return false;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    return expectedSignature === signature;
  }
}
