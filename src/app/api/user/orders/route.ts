import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  orders,
  orderItems,
  deliveryAssignments,
  addresses,
  users,
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
