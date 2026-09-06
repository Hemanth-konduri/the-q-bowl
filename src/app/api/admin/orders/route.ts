import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, users, addresses, payments } from "@/db/schema";
import { requireAdminApi } from "@/lib/auth-guard";
import { desc, eq, and, sql, inArray } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status") || "";
  const typeFilter = searchParams.get("type") || "";
  const todayOnly = searchParams.get("today") === "true";

  try {
    const conditions = [];
    if (statusFilter) {
      conditions.push(eq(orders.status, statusFilter as any));
    }
    if (typeFilter) {
      conditions.push(eq(orders.type, typeFilter as any));
    }
    if (todayOnly) {
      conditions.push(sql`${orders.createdAt} >= CURRENT_DATE`);
    }

    const orderList = await db
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
        updatedAt: orders.updatedAt,
        // Customer Details
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
        userPhone: users.phone,
        verificationStatus: users.verificationStatus,
        rewardPoints: users.rewardPoints,
        avatarUrl: users.avatarUrl,
        userCreatedAt: users.createdAt,
        // Address Details
        address: addresses.address,
        area: addresses.area,
        city: addresses.city,
        state: addresses.state,
        pincode: addresses.pincode,
        landmark: addresses.landmark,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .leftJoin(addresses, eq(orders.addressId, addresses.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(orders.createdAt))
      .limit(100);

    const orderIds = orderList.map((o) => o.id);
    let itemsByOrderId: Record<string, any[]> = {};
    let paymentsByOrderId: Record<string, any> = {};

    if (orderIds.length > 0) {
      // Fetch itemized order dishes
      const items = await db
        .select()
        .from(orderItems)
        .where(inArray(orderItems.orderId, orderIds));

      items.forEach((item) => {
        if (!itemsByOrderId[item.orderId]) itemsByOrderId[item.orderId] = [];
        itemsByOrderId[item.orderId].push(item);
      });

      // Fetch payment record
      const paymentRecords = await db
        .select()
        .from(payments)
        .where(inArray(payments.orderId, orderIds));

      paymentRecords.forEach((p) => {
        if (p.orderId) paymentsByOrderId[p.orderId] = p;
      });
    }

    const formattedOrders = orderList.map((o) => ({
      ...o,
      userName: o.userName || o.userEmail || "Customer User",
      items: itemsByOrderId[o.id] || [],
      payment: paymentsByOrderId[o.id] || null,
    }));

    // Calculate Summary Stats
    const [todaySummary] = await db
      .select({
        totalToday: sql<number>`count(case when ${orders.createdAt} >= CURRENT_DATE then 1 end)`,
        revenueToday: sql<number>`coalesce(sum(case when ${orders.createdAt} >= CURRENT_DATE then ${orders.total} else 0 end), 0)`,
        preparingCount: sql<number>`count(case when ${orders.status} = 'PREPARING' or ${orders.status} = 'CONFIRMED' then 1 end)`,
        deliveredCount: sql<number>`count(case when ${orders.status} = 'DELIVERED' then 1 end)`,
      })
      .from(orders);

    return NextResponse.json({
      orders: formattedOrders,
      summary: {
        totalToday: Number(todaySummary?.totalToday || 0),
        revenueToday: Number(todaySummary?.revenueToday || 0),
        preparingCount: Number(todaySummary?.preparingCount || 0),
        deliveredCount: Number(todaySummary?.deliveredCount || 0),
      },
    });
  } catch (error) {
    console.error("Error fetching admin orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const { orderId, status } = await req.json();

    if (!orderId || !status) {
      return NextResponse.json({ error: "Order ID and status are required." }, { status: 400 });
    }

    await db
      .update(orders)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json({ error: "Failed to update order status." }, { status: 500 });
  }
}
