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
import { eq } from "drizzle-orm";
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

    // Server-computed Discount
    let discount = 0;
    if (cartObj.offerId) {
      const offerRows = await db
        .select()
        .from(offers)
        .where(eq(offers.id, cartObj.offerId))
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

    const deliveryFee = subtotal > 500 ? 0 : 49;
    const total = Math.max(0, subtotal + deliveryFee - discount);

    return {
      cart: cartObj,
      cItems,
      subtotal,
      deliveryFee,
      discount,
      total,
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
  }) {
    const checkout = await this.calculateCartCheckout(params);

    const orderId = `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    await db.insert(orders).values({
      id: orderId,
      userId: params.userId,
      addressId: params.addressId,
      offerId: checkout.cart.offerId || null,
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
    if (ord.status === "CONFIRMED") return ord;

    // Update order status
    await db
      .update(orders)
      .set({
        status: "CONFIRMED",
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

    return ord;
  }
}
