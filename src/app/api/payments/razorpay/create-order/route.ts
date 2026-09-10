import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/db";
import { addresses, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { OrderService } from "@/lib/services/OrderService";
import { SubscriptionService } from "@/lib/services/SubscriptionService";
import { RazorpayService } from "@/lib/services/RazorpayService";
import { PaymentService } from "@/lib/services/PaymentService";
import { DeliveryZoneService } from "@/lib/services/DeliveryZoneService";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized: Please log in to initiate payment." }, { status: 401 });
    }

    // Fetch user details for customer prefill
    const userRows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
      })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    const customerUser = userRows[0] || null;

    const body = await req.json();
    const { purpose = "ORDER", addressId, notes, packageId, mealId, mealCredits, mealsPerDay, mealTiming, deliveryDays } = body;

    if (!addressId) {
      return NextResponse.json({ error: "Delivery address is required." }, { status: 400 });
    }

    // 1. Security Validation: Address Ownership Check
    const addrRows = await db
      .select()
      .from(addresses)
      .where(and(eq(addresses.id, addressId), eq(addresses.userId, session.userId)))
      .limit(1);

    if (addrRows.length === 0) {
      return NextResponse.json({ error: "Invalid delivery address selected." }, { status: 403 });
    }

    const targetAddress = addrRows[0];
    if (targetAddress.latitude === null || targetAddress.longitude === null) {
      return NextResponse.json(
        { error: "Selected address is missing pin location on map." },
        { status: 400 }
      );
    }

    // 2. Security Validation: Delivery Zone Eligibility Check
    const zoneVal = await DeliveryZoneService.validateLocation(
      targetAddress.latitude,
      targetAddress.longitude
    );

    if (!zoneVal.isWithinRadius) {
      return NextResponse.json(
        { error: `Selected address is outside our active delivery zone (${zoneVal.zoneName}).` },
        { status: 400 }
      );
    }

    let payableAmount = 0;
    let receiptId = "";
    let orderId: string | undefined = undefined;
    let subscriptionId: string | undefined = undefined;
    let breakdown: any = null;

    if (purpose === "ORDER") {
      // If client sent cart items directly, synchronize with user's db cart first
      if (body.items && Array.isArray(body.items) && body.items.length > 0) {
        const { carts, cartItems } = await import("@/db/schema");
        let userCartRows = await db
          .select()
          .from(carts)
          .where(eq(carts.userId, session.userId))
          .limit(1);

        if (userCartRows.length === 0) {
          const newCartId = `cart-usr-${session.userId}`;
          await db.insert(carts).values({
            id: newCartId,
            userId: session.userId,
            sessionKey: "user-session",
          });
          userCartRows = await db.select().from(carts).where(eq(carts.id, newCartId)).limit(1);
        }

        const cartObj = userCartRows[0];
        for (const item of body.items) {
          if (!item.id || !item.quantity || item.quantity <= 0) continue;
          const existingItem = await db
            .select()
            .from(cartItems)
            .where(and(eq(cartItems.cartId, cartObj.id), eq(cartItems.foodItemId, item.id)))
            .limit(1);

          if (existingItem.length > 0) {
            await db
              .update(cartItems)
              .set({ quantity: item.quantity, updatedAt: new Date() })
              .where(eq(cartItems.id, existingItem[0].id));
          } else {
            await db.insert(cartItems).values({
              id: `ci-${cartObj.id}-${item.id}`,
              cartId: cartObj.id,
              foodItemId: item.id,
              quantity: item.quantity,
            });
          }
        }
      }

      // Calculate cart total on server & create pending order
      const pendingOrder = await OrderService.createPendingOrder({
        userId: session.userId,
        addressId,
        notes,
      });

      payableAmount = pendingOrder.total;
      receiptId = pendingOrder.orderId;
      orderId = pendingOrder.orderId;
    } else if (purpose === "SUBSCRIPTION") {
      if (!mealId) {
        return NextResponse.json({ error: "Meal selection is required for subscription." }, { status: 400 });
      }

      // Compute exact server financial breakdown from DB records
      breakdown = await SubscriptionService.calculateSubscriptionCheckout({
        userId: session.userId,
        packageId,
        mealId,
        addressId,
        mealCredits,
        mealsPerDay,
        mealTiming,
        deliveryDays,
      });

      payableAmount = breakdown.totalAmount;
      receiptId = JSON.stringify({
        packageId: packageId || null,
        mealId: mealId || null,
        addressId: addressId || null,
        mealCredits: breakdown.mealCreditsPurchased,
        mealsPerDay: mealsPerDay || 1,
        mealTiming: mealTiming || "LUNCH",
        deliveryDays: deliveryDays || ["MON", "TUE", "WED", "THU", "FRI"],
        timestamp: Date.now(),
      });
    } else {
      return NextResponse.json({ error: "Invalid payment purpose." }, { status: 400 });
    }

    if (payableAmount <= 0) {
      return NextResponse.json({ error: "Invalid payable amount computed." }, { status: 400 });
    }

    // Call Razorpay API to create official Razorpay Order using verified amount
    const razorpayOrder = await RazorpayService.createOrder({
      amountInRupees: payableAmount,
      currency: "INR",
      receipt: receiptId,
      notes: {
        userId: session.userId,
        purpose,
        receiptId,
      },
    });

    // Record pending payment in payments DB table
    await PaymentService.createPendingPayment({
      userId: session.userId,
      razorpayOrderId: razorpayOrder.orderId,
      amount: payableAmount,
      currency: razorpayOrder.currency,
      purpose,
      receipt: receiptId,
      orderId,
      subscriptionId,
    });

    const publicKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;

    return NextResponse.json({
      success: true,
      razorpayOrderId: razorpayOrder.orderId,
      amount: razorpayOrder.amount, // in paise
      currency: razorpayOrder.currency,
      keyId: publicKey,
      orderId,
      subscriptionId,
      customer: {
        name: customerUser?.name || "",
        email: customerUser?.email || "",
        phone: customerUser?.phone || "",
      },
      breakdown,
    });
  } catch (error: any) {
    console.error("Razorpay Create Order Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create Razorpay payment order." },
      { status: 500 }
    );
  }
}
