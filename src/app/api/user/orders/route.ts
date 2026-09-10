import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
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
import { eq, desc, and } from "drizzle-orm";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Query customer's real orders from database
    const userOrders = await db
      .select({
        id: orders.id,
        type: orders.type,
        status: orders.status,
        subtotal: orders.subtotal,
        deliveryFee: orders.deliveryFee,
        discount: orders.discount,
        total: orders.total,
        notes: orders.notes,
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

    const ordersWithDetails = await Promise.all(
      userOrders.map(async (ord) => {
        // Fetch order items
        const items = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, ord.id));

        let deliveryInfo = null;
        try {
          // Fetch normal order delivery partner assignment details
          const { normalOrderDeliveries, deliveryPartners } = await import("@/db/schema");
          const partnerAssignment = await db
            .select({
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
            .where(eq(normalOrderDeliveries.orderId, ord.id))
            .limit(1);

          if (partnerAssignment.length > 0) {
            const p = partnerAssignment[0];
            deliveryInfo = {
              status: p.status || "ASSIGNED",
              staffName: p.partnerName || "Express Fleet Driver",
              staffPhone: p.partnerPhone || "+91 83285 34576",
              staffEmail: p.partnerEmail || "driver@qbowl.in",
              currentLat: p.currentLat,
              currentLng: p.currentLng,
              lastLocationAt: p.lastLocationAt,
              deliveredAt: p.deliveredAt,
              notes: p.notes,
            };
          } else {
            // Fallback check in deliveryAssignments
            const legacyDelivery = await db
              .select({
                status: deliveryAssignments.status,
                scheduledAt: deliveryAssignments.scheduledAt,
                pickedUpAt: deliveryAssignments.pickedUpAt,
                deliveredAt: deliveryAssignments.deliveredAt,
                staffName: users.name,
                staffPhone: users.phone,
              })
              .from(deliveryAssignments)
              .leftJoin(users, eq(deliveryAssignments.staffId, users.id))
              .where(eq(deliveryAssignments.orderId, ord.id))
              .limit(1);

            if (legacyDelivery.length > 0 && legacyDelivery[0].staffName) {
              deliveryInfo = legacyDelivery[0];
            }
          }
        } catch (partnerErr) {
          console.warn("Could not fetch driver assignment details for order:", ord.id, partnerErr);
        }

        let paymentInfo = null;
        try {
          const payRows = await db
            .select({
              id: payments.id,
              method: payments.method,
              status: payments.status,
              amount: payments.amount,
              paidAt: payments.paidAt,
              razorpayPaymentId: payments.razorpayPaymentId,
            })
            .from(payments)
            .where(eq(payments.orderId, ord.id))
            .limit(1);

          if (payRows.length > 0) {
            paymentInfo = payRows[0];
          }
        } catch (payErr) {
          console.warn("Could not fetch payment record for order:", ord.id, payErr);
        }

        return {
          ...ord,
          items,
          delivery: deliveryInfo,
          payment: paymentInfo,
        };
      })
    );

    return NextResponse.json({ orders: ordersWithDetails });
  } catch (error) {
    console.error("Orders API error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { addressId, deliverySlot, notes, paymentMethod, sessionKey = "guest-session" } = body;
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

    let discount = 0;
    if (cartObj.offerId) {
      const offerRows = await db.select().from(offers).where(eq(offers.id, cartObj.offerId)).limit(1);
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

    const orderId = `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create Order
    await db.insert(orders).values({
      id: orderId,
      userId: session.userId,
      addressId: selectedAddressId,
      offerId: cartObj.offerId || null,
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
