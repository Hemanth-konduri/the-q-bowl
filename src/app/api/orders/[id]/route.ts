import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, addresses, deliveryAssignments, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderRows = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        type: orders.type,
        status: orders.status,
        subtotal: orders.subtotal,
        deliveryFee: orders.deliveryFee,
        discount: orders.discount,
        total: orders.total,
        notes: orders.notes,
        createdAt: orders.createdAt,
        addressId: orders.addressId,
        recipientName: addresses.recipientName,
        recipientPhone: addresses.recipientPhone,
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
      .where(eq(orders.id, id))
      .limit(1);

    if (orderRows.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderData = orderRows[0];

    // Ownership Authorization Check
    if (orderData.userId !== session.userId && session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: You do not have access to this order." }, { status: 403 });
    }

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));

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
      .where(eq(deliveryAssignments.orderId, id))
      .limit(1);

    return NextResponse.json({
      order: orderData,
      items,
      delivery: delivery.length > 0 ? delivery[0] : null,
      estimatedMinutes: 25,
    });
  } catch (error) {
    console.error("Order ID GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch order details" }, { status: 500 });
  }
}
