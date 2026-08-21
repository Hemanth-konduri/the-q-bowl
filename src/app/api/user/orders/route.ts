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
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";
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

        // Fetch delivery assignment details (driver) if assigned
        const delivery = await db
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

        return {
          ...ord,
          items,
          delivery: delivery.length > 0 ? delivery[0] : null,
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

    if (!addressId) {
      return NextResponse.json({ error: "Delivery address is required" }, { status: 400 });
    }

    // Verify address exists, belongs to authenticated user, has pin, and is within 15km radius
    const addrRows = await db.select().from(addresses).where(eq(addresses.id, addressId)).limit(1);
    if (addrRows.length === 0) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    const targetAddress = addrRows[0];
    if (targetAddress.userId !== session.userId) {
      return NextResponse.json({ error: "Forbidden: Selected address does not belong to your account." }, { status: 403 });
    }

    if (targetAddress.latitude === null || targetAddress.longitude === null) {
      return NextResponse.json(
        { error: "Selected address missing map pin location. Please pin location on map before placing order." },
        { status: 400 }
      );
    }

    // Kitchen Hub Coords: 17.4399, 78.3847
    const KITCHEN_LAT = 17.4399;
    const KITCHEN_LNG = 78.3847;
    const R = 6371; // Earth's radius in km
    const dLat = ((targetAddress.latitude - KITCHEN_LAT) * Math.PI) / 180;
    const dLon = ((targetAddress.longitude - KITCHEN_LNG) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((KITCHEN_LAT * Math.PI) / 180) *
        Math.cos((targetAddress.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const distanceKm = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));

    if (distanceKm > 15) {
      return NextResponse.json(
        { error: `Selected address is ${distanceKm.toFixed(1)} km away, which exceeds our 15 km delivery zone.` },
        { status: 400 }
      );
    }

    // Fetch user's cart
    const userCartRows = await db
      .select()
      .from(carts)
      .where(eq(carts.userId, session.userId))
      .limit(1);

    if (userCartRows.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
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
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
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
      addressId,
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
