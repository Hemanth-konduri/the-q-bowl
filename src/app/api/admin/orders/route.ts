import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  orders,
  orderItems,
  users,
  addresses,
  payments,
  deliveryPartners,
  normalOrderDeliveries,
  deliveryAssignments,
} from "@/db/schema";
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
    let assignedPartnerByOrderId: Record<string, any> = {};

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

      // Fetch assigned delivery partner
      const deliveries = await db
        .select({
          orderId: normalOrderDeliveries.orderId,
          deliveryPartnerId: normalOrderDeliveries.deliveryPartnerId,
          deliveryPartnerName: deliveryPartners.fullName,
          deliveryPartnerPhone: deliveryPartners.phone,
          deliveryStatus: normalOrderDeliveries.status,
        })
        .from(normalOrderDeliveries)
        .leftJoin(deliveryPartners, eq(normalOrderDeliveries.deliveryPartnerId, deliveryPartners.id))
        .where(inArray(normalOrderDeliveries.orderId, orderIds));

      deliveries.forEach((d) => {
        if (d.orderId) {
          assignedPartnerByOrderId[d.orderId] = {
            id: d.deliveryPartnerId,
            name: d.deliveryPartnerName,
            phone: d.deliveryPartnerPhone,
            status: d.deliveryStatus,
          };
        }
      });
    }

    const formattedOrders = orderList.map((o) => ({
      ...o,
      userName: o.userName || o.userEmail || "Customer User",
      items: itemsByOrderId[o.id] || [],
      payment: paymentsByOrderId[o.id] || null,
      assignedPartner: assignedPartnerByOrderId[o.id] || null,
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
    const { orderId, status, deliveryPartnerId } = await req.json();

    if (!orderId || !status) {
      return NextResponse.json({ error: "Order ID and status are required." }, { status: 400 });
    }

    // 1. Update order status
    await db
      .update(orders)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    // 2. If assigning delivery partner or dispatching
    if (deliveryPartnerId || status === "OUT_FOR_DELIVERY" || status === "DELIVERED") {
      const now = new Date();

      // Check existing normalOrderDeliveries record
      const existingDel = await db
        .select()
        .from(normalOrderDeliveries)
        .where(eq(normalOrderDeliveries.orderId, orderId))
        .limit(1);

      if (existingDel.length > 0) {
        await db
          .update(normalOrderDeliveries)
          .set({
            deliveryPartnerId: deliveryPartnerId || existingDel[0].deliveryPartnerId,
            status: status === "DELIVERED" ? "DELIVERED" : "OUT_FOR_DELIVERY",
            deliveredAt: status === "DELIVERED" ? now : existingDel[0].deliveredAt,
            updatedAt: now,
          })
          .where(eq(normalOrderDeliveries.id, existingDel[0].id));
      } else if (deliveryPartnerId) {
        const delId = `nord-${Date.now().toString().slice(-6)}`;
        await db.insert(normalOrderDeliveries).values({
          id: delId,
          orderId,
          deliveryPartnerId,
          status: status === "DELIVERED" ? "DELIVERED" : "OUT_FOR_DELIVERY",
          deliveredAt: status === "DELIVERED" ? now : null,
          createdAt: now,
          updatedAt: now,
        });

        // Also record in deliveryAssignments
        const assignId = `assign-${Date.now().toString().slice(-6)}`;
        await db.insert(deliveryAssignments).values({
          id: assignId,
          deliveryPartnerId,
          orderId,
          status: status === "DELIVERED" ? "DELIVERED" : "ASSIGNED",
          assignedAt: now,
          deliveredAt: status === "DELIVERED" ? now : null,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json({ error: "Failed to update order status." }, { status: 500 });
  }
}
