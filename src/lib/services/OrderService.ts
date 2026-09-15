import { db } from "@/db";
import {
  orders,
  orderItems,
  deliveryAssignments,
  addresses,
  carts,
  cartItems,
  foodItems,
  offers,
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { DeliveryZoneService } from "@/lib/services/DeliveryZoneService";

export class OrderService {
  /**
   * Validates address, computes subtotal, discounts, delivery fees on server.
   * Returns calculated breakdown & cart items.
   */
  public static async calculateCartCheckout(params: {
    userId: string;
    addressId: string;
    notes?: string;
    couponCode?: string;
  }) {
    // 1. Verify address
    const addrRows = await db
      .select()
      .from(addresses)
      .where(eq(addresses.id, params.addressId))
      .limit(1);

    if (addrRows.length === 0) {
      throw new Error("Delivery address not found.");
    }

    const targetAddress = addrRows[0];
    if (targetAddress.userId !== params.userId) {
      throw new Error("Selected address does not belong to your account.");
    }

    if (targetAddress.latitude === null || targetAddress.longitude === null) {
      throw new Error("Selected address is missing map pin location.");
    }

    // Dynamic Distance & Delivery Zone Validation against Database Single Source of Truth
    const zoneValidation = await DeliveryZoneService.validateLocation(
      targetAddress.latitude,
      targetAddress.longitude
    );

    if (!zoneValidation.isWithinRadius) {
      throw new Error(
        `Selected address is ${zoneValidation.distanceKm} km away from our ${zoneValidation.zoneName}, which exceeds the ${zoneValidation.allowedRadiusKm} km delivery limit.`
      );
    }


    // 2. Fetch User Cart
    const userCartRows = await db
      .select()
      .from(carts)
      .where(eq(carts.userId, params.userId))
      .limit(1);

    if (userCartRows.length === 0) {
      throw new Error("Your cart is empty.");
    }

    const cartObj = userCartRows[0];

    const cItems = await db
      .select({
        id: cartItems.id,
        foodItemId: cartItems.foodItemId,
        quantity: cartItems.quantity,
        name: foodItems.name,
        price: foodItems.price,
        isAvailable: foodItems.isAvailable,
      })
      .from(cartItems)
      .innerJoin(foodItems, eq(cartItems.foodItemId, foodItems.id))
      .where(eq(cartItems.cartId, cartObj.id));

    if (cItems.length === 0) {
      throw new Error("Your cart is empty.");
    }

    // Check item availability
    const unavailableItem = cItems.find((i) => !i.isAvailable);
    if (unavailableItem) {
      throw new Error(`"${unavailableItem.name}" is currently unavailable.`);
    }

    // Server-computed Subtotal
    const subtotal = cItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    // Resolve offerId from couponCode or cartObj
    let appliedOfferId: string | null = cartObj.offerId || null;
    if (params.couponCode && params.couponCode.trim()) {
      const cleanCode = params.couponCode.trim().toUpperCase();
      const { or, and } = await import("drizzle-orm");
      const foundOffers = await db
        .select()
        .from(offers)
        .where(
          and(
            or(eq(offers.name, cleanCode), eq(offers.code, cleanCode)),
            eq(offers.isActive, true)
          )
        )
        .limit(1);

      if (foundOffers.length > 0) {
        appliedOfferId = foundOffers[0].id;
      }
    }

    // Server-computed Discount
    let discount = 0;
    if (appliedOfferId) {
      const offerRows = await db
        .select()
        .from(offers)
        .where(eq(offers.id, appliedOfferId))
        .limit(1);

      if (offerRows.length > 0) {
        const off = offerRows[0];
        if (!off.minOrderAmount || subtotal >= off.minOrderAmount) {
          if (off.discountType === "PERCENTAGE") {
            discount = (subtotal * off.discountValue) / 100;
            if (off.maxDiscount) discount = Math.min(discount, off.maxDiscount);
          } else {
            discount = off.discountValue;
          }
        }
      }
    }

    discount = Math.min(discount, subtotal);
    const deliveryFee = 0; // Free delivery - exact food price charged
    const total = Math.max(0, subtotal + deliveryFee - discount);

    return {
      cart: cartObj,
      cItems,
      subtotal,
      deliveryFee,
      discount,
      total,
      appliedOfferId,
      addressId: params.addressId,
      notes: params.notes,
    };
  }

  /**
   * Creates a PENDING Order in the database prior to Razorpay Order creation
   */
  public static async createPendingOrder(params: {
    userId: string;
    addressId: string;
    notes?: string;
    couponCode?: string;
  }) {
    const checkout = await this.calculateCartCheckout(params);

    // Clean up any unfulfilled PENDING orders for this user to avoid duplicate ghost orders
    try {
      const staleOrders = await db
        .select({ id: orders.id })
        .from(orders)
        .where(and(eq(orders.userId, params.userId), eq(orders.status, "PENDING")));

      if (staleOrders.length > 0) {
        const staleIds = staleOrders.map((o) => o.id);
        await db.delete(orderItems).where(inArray(orderItems.orderId, staleIds));
        await db.delete(deliveryAssignments).where(inArray(deliveryAssignments.orderId, staleIds));
        await db.delete(orders).where(inArray(orders.id, staleIds));
      }
    } catch (cleanErr) {
      console.warn("Stale order cleanup warning:", cleanErr);
    }

    const orderId = `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    await db.insert(orders).values({
      id: orderId,
      userId: params.userId,
      addressId: params.addressId,
      offerId: checkout.appliedOfferId || checkout.cart.offerId || null,
      type: "NORMAL",
      status: "PENDING",
      subtotal: checkout.subtotal,
      deliveryFee: checkout.deliveryFee,
      discount: checkout.discount,
      total: checkout.total,
      notes: params.notes || null,
    });

    for (const ci of checkout.cItems) {
      await db.insert(orderItems).values({
        id: `oi-${orderId}-${ci.foodItemId}`,
        orderId,
        foodItemId: ci.foodItemId,
        name: ci.name,
        unitPrice: ci.price,
        quantity: ci.quantity,
        totalPrice: ci.price * ci.quantity,
      });
    }

    return { orderId, total: checkout.total, cartId: checkout.cart.id };
  }

  /**
   * Fulfills and confirms order upon verified payment
   */
  public static async fulfillOrder(orderId: string, userId: string) {
    const ordRows = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (ordRows.length === 0) return null;

    const ord = ordRows[0];

    // Note: Order remains PENDING until Admin explicitly accepts it in the admin console.
    // Payment status is already recorded as SUCCESS in the payments table.
    await db
      .update(orders)
      .set({
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    // Ensure delivery assignment exists
    const existingAssignment = await db
      .select()
      .from(deliveryAssignments)
      .where(eq(deliveryAssignments.orderId, orderId))
      .limit(1);

    if (existingAssignment.length === 0) {
      await db.insert(deliveryAssignments).values({
        id: `da-${orderId}`,
        orderId,
        staffId: userId,
        status: "ASSIGNED",
        notes: "Awaiting preparation",
      });
    }

    // Clear user cart
    const userCartRows = await db
      .select()
      .from(carts)
      .where(eq(carts.userId, userId))
      .limit(1);

    if (userCartRows.length > 0) {
      const cartId = userCartRows[0].id;
      await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
      await db.update(carts).set({ offerId: null, notes: null }).where(eq(carts.id, cartId));
    }

    // Increment offer usageCount if order has an applied offer
    if (ord.offerId) {
      try {
        const { sql } = await import("drizzle-orm");
        await db
          .update(offers)
          .set({
            usageCount: sql`${offers.usageCount} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(offers.id, ord.offerId));
      } catch (offerErr) {
        console.warn("Failed to increment coupon usageCount:", offerErr);
      }
    }

    return ord;
  }
}
