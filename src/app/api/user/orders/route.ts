import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/db";
import {
  orders,
  orderItems,
  deliveryAssignments,
  addresses,
  users,
  carts,
  cartItems,
  foodItems,
  offers,
  payments,
} from "@/db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Query customer's real orders from database with connection retry resilience
    const userOrders = await withDbRetry(async () => {
      return await db
        .select({
          id: orders.id,
          type: orders.type,
          status: orders.status,
          subtotal: orders.subtotal,
          deliveryFee: orders.deliveryFee,
          discount: orders.discount,
          total: orders.total,
          notes: orders.notes,
          qrToken: orders.qrToken,
          qrGeneratedAt: orders.qrGeneratedAt,
          qrStatus: orders.qrStatus,
          createdAt: orders.createdAt,
          addressLabel: addresses.label,
          addressString: addresses.address,
          area: addresses.area,
          city: addresses.city,
          pincode: addresses.pincode,
          latitude: addresses.latitude,
          longitude: addresses.longitude,
        })
        .from(orders)
        .leftJoin(addresses, eq(orders.addressId, addresses.id))
        .where(eq(orders.userId, session.userId))
        .orderBy(desc(orders.createdAt));
    });

    if (!userOrders || userOrders.length === 0) {
      return NextResponse.json({ orders: [] });
    }

    const orderIds = userOrders.map((o) => o.id);

    // Batch query order items in a single query
    const allItems = await withDbRetry(async () => {
      return await db
        .select()
        .from(orderItems)
        .where(inArray(orderItems.orderId, orderIds));
    });

    const itemsByOrder = new Map<string, typeof allItems>();
    for (const item of allItems) {
      if (!itemsByOrder.has(item.orderId)) {
        itemsByOrder.set(item.orderId, []);
      }
      itemsByOrder.get(item.orderId)!.push(item);
    }

    // Batch query normal order deliveries
    const { normalOrderDeliveries, deliveryPartners } = await import("@/db/schema");
    let allPartnerDeliveries: any[] = [];
    try {
      allPartnerDeliveries = await withDbRetry(async () => {
        return await db
          .select({
            orderId: normalOrderDeliveries.orderId,
            status: normalOrderDeliveries.status,
            deliveredAt: normalOrderDeliveries.deliveredAt,
            notes: normalOrderDeliveries.notes,
            partnerId: deliveryPartners.id,
            partnerName: deliveryPartners.fullName,
            partnerPhone: deliveryPartners.phone,
            partnerEmail: deliveryPartners.email,
            currentLat: deliveryPartners.currentLat,
            currentLng: deliveryPartners.currentLng,
            lastLocationAt: deliveryPartners.lastLocationAt,
          })
          .from(normalOrderDeliveries)
          .innerJoin(deliveryPartners, eq(normalOrderDeliveries.deliveryPartnerId, deliveryPartners.id))
          .where(inArray(normalOrderDeliveries.orderId, orderIds));
      });
    } catch (err) {
      console.warn("Could not batch fetch partner deliveries:", err);
    }

    const deliveryByOrder = new Map<string, any>();
    for (const p of allPartnerDeliveries) {
      if (!deliveryByOrder.has(p.orderId)) {
        deliveryByOrder.set(p.orderId, {
          status: p.status || "ASSIGNED",
          staffName: p.partnerName || "Express Fleet Driver",
          staffPhone: p.partnerPhone || "+91 83285 34576",
          staffEmail: p.partnerEmail || "driver@qbowl.in",
          currentLat: p.currentLat,
          currentLng: p.currentLng,
          lastLocationAt: p.lastLocationAt,
          deliveredAt: p.deliveredAt,
          notes: p.notes,
        });
      }
    }

    // Batch query payments
    let allPayments: any[] = [];
    try {
      allPayments = await withDbRetry(async () => {
        return await db
          .select({
            id: payments.id,
            orderId: payments.orderId,
            method: payments.method,
            status: payments.status,
            amount: payments.amount,
            paidAt: payments.paidAt,
            razorpayPaymentId: payments.razorpayPaymentId,
          })
          .from(payments)
          .where(inArray(payments.orderId, orderIds));
      });
    } catch (err) {
      console.warn("Could not batch fetch payments:", err);
    }

    const paymentByOrder = new Map<string, any>();
    for (const pay of allPayments) {
      if (pay.orderId && !paymentByOrder.has(pay.orderId)) {
        paymentByOrder.set(pay.orderId, pay);
      }
    }

    const ordersWithDetails = userOrders.map((ord) => {
      return {
        ...ord,
        items: itemsByOrder.get(ord.id) || [],
        delivery: deliveryByOrder.get(ord.id) || null,
        payment: paymentByOrder.get(ord.id) || null,
      };
    });

    return NextResponse.json({ orders: ordersWithDetails });
  } catch (error) {
    console.error("Orders API error:", error);
    return NextResponse.json({ error: "Failed to fetch orders", orders: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { addressId, deliverySlot, notes, paymentMethod, couponCode, sessionKey = "guest-session" } = body;
    let selectedAddressId = addressId;

    if (!selectedAddressId) {
      // Look up user's default or most recent address
      const userAddrs = await db
        .select()
        .from(addresses)
        .where(eq(addresses.userId, session.userId))
        .orderBy(desc(addresses.isDefault), desc(addresses.createdAt))
        .limit(1);

      if (userAddrs.length > 0) {
        selectedAddressId = userAddrs[0].id;
      } else {
        return NextResponse.json(
          { error: "No delivery address found. Please add a delivery address to place your order.", code: "NO_ADDRESS" },
          { status: 400 }
        );
      }
    }

    // Verify address exists, belongs to authenticated user, has pin, and is within delivery radius
    const addrRows = await db.select().from(addresses).where(eq(addresses.id, selectedAddressId)).limit(1);
    if (addrRows.length === 0) {
      return NextResponse.json({ error: "Selected address not found", code: "NO_ADDRESS" }, { status: 404 });
    }

    const targetAddress = addrRows[0];
    if (targetAddress.userId !== session.userId) {
      return NextResponse.json({ error: "Forbidden: Selected address does not belong to your account." }, { status: 403 });
    }

    const { DeliveryZoneService } = await import("@/lib/services/DeliveryZoneService");
    const activeZone = await DeliveryZoneService.getActiveDeliveryZone();

    const lat = targetAddress.latitude !== null && targetAddress.latitude !== undefined
      ? targetAddress.latitude
      : activeZone.kitchenLat;
    const lng = targetAddress.longitude !== null && targetAddress.longitude !== undefined
      ? targetAddress.longitude
      : activeZone.kitchenLng;

    // Dynamic Database Delivery Zone Validation
    const zoneVal = await DeliveryZoneService.validateLocation(lat, lng);

    if (!zoneVal.isWithinRadius) {
      return NextResponse.json(
        { error: `Selected address is ${zoneVal.distanceKm} km away from ${zoneVal.zoneName}, which exceeds our ${zoneVal.allowedRadiusKm} km delivery zone.` },
        { status: 400 }
      );
    }


    // Fetch user's cart or initialize it
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
        sessionKey: sessionKey || "user-session",
      });
      userCartRows = await db.select().from(carts).where(eq(carts.id, newCartId)).limit(1);
    }

    const cartObj = userCartRows[0];

    // Check if items were provided in the request body (client-side cart sync)
    if (body.items && Array.isArray(body.items) && body.items.length > 0) {
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
      return NextResponse.json({ error: "Your cart is currently empty. Please add items to proceed." }, { status: 400 });
    }

    // Check item availability
    const unavailableItem = cItems.find((i) => !i.isAvailable);
    if (unavailableItem) {
      return NextResponse.json(
        { error: `"${unavailableItem.name}" is currently unavailable. Please remove it from your cart to proceed.` },
        { status: 400 }
      );
    }

    const subtotal = cItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    let appliedOfferId: string | null = cartObj.offerId || null;

    if (couponCode && typeof couponCode === "string" && couponCode.trim()) {
      const cleanCode = couponCode.trim().toUpperCase();
      const { or } = await import("drizzle-orm");
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

    let discount = 0;
    if (appliedOfferId) {
      const offerRows = await db.select().from(offers).where(eq(offers.id, appliedOfferId)).limit(1);
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

    // Clean up any stale unconfirmed PENDING orders for this user to avoid duplicate ghost orders
    try {
      const staleOrders = await db
        .select({ id: orders.id })
        .from(orders)
        .where(and(eq(orders.userId, session.userId), eq(orders.status, "PENDING")));

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

    // Create Order
    await db.insert(orders).values({
      id: orderId,
      userId: session.userId,
      addressId: selectedAddressId,
      offerId: appliedOfferId,
      type: "NORMAL",
      status: "PENDING",
      subtotal,
      deliveryFee,
      discount,
      total,
      notes: notes || deliverySlot ? `Slot: ${deliverySlot}. ${notes || ""}` : notes,
    });

    // Create Order Items
    for (const ci of cItems) {
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

    // Create initial delivery assignment
    await db.insert(deliveryAssignments).values({
      id: `da-${orderId}`,
      orderId,
      staffId: session.userId, // Default placeholder staff until assigned
      status: "ASSIGNED",
      notes: "Awaiting preparation",
    });

    // Clear cart items
    await db.delete(cartItems).where(eq(cartItems.cartId, cartObj.id));
    await db.update(carts).set({ offerId: null, notes: null }).where(eq(carts.id, cartObj.id));

    return NextResponse.json({
      success: true,
      orderId,
      total,
      paymentMethod,
    });
  } catch (error) {
    console.error("Order Create POST Error:", error);
    return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
  }
}
