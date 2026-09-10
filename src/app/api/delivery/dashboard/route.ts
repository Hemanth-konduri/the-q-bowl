import { NextResponse } from "next/server";
import { requireDeliveryPartnerApi } from "@/lib/auth-guard";
import { db } from "@/db";
import {
  subscriptionDeliveries,
  subscriptions,
  users,
  foodItems,
  addresses,
  normalOrderDeliveries,
  orders,
  orderItems,
  deliveryPartners,
} from "@/db/schema";
import { eq, and, ne, sql, inArray } from "drizzle-orm";
import { formatOrderId } from "@/lib/utils/orderIdFormatter";

function getCurrentSessionName(): "Breakfast" | "Lunch" | "Dinner" {
  const hour = new Date().getHours();
  if (hour < 11) return "Breakfast";
  if (hour < 16) return "Lunch";
  return "Dinner";
}

function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function GET() {
  try {
    const { partner } = await requireDeliveryPartnerApi();
    const todayStr = getTodayDateString();

    // 1. Fetch Subscription Deliveries for Today assigned to this partner
    const subDeliveries = await db
      .select({
        id: subscriptionDeliveries.id,
        orderId: subscriptionDeliveries.subscriptionId,
        deliveryType: sql<string>`'SUBSCRIPTION'`,
        customerName: users.name,
        customerEmail: users.email,
        customerPhone: users.phone,
        mealName: foodItems.name,
        mealType: subscriptionDeliveries.mealType,
        status: subscriptionDeliveries.status,
        deliveredAt: subscriptionDeliveries.deliveredAt,
        notes: subscriptionDeliveries.notes,
        mealsRemaining: subscriptions.mealsRemaining,
        addressLabel: addresses.label,
        streetAddress: addresses.address,
        area: addresses.area,
        city: addresses.city,
        pincode: addresses.pincode,
        latitude: addresses.latitude,
        longitude: addresses.longitude,
        totalAmount: subscriptions.totalAmount,
      })
      .from(subscriptionDeliveries)
      .innerJoin(subscriptions, eq(subscriptionDeliveries.subscriptionId, subscriptions.id))
      .innerJoin(users, eq(subscriptions.userId, users.id))
      .leftJoin(foodItems, eq(subscriptionDeliveries.mealId, foodItems.id))
      .leftJoin(addresses, eq(subscriptions.addressId, addresses.id))
      .where(
        and(
          eq(subscriptionDeliveries.deliveryDate, todayStr),
          eq(subscriptionDeliveries.deliveryPartnerId, partner.id),
          ne(subscriptionDeliveries.status, "CANCELLED")
        )
      );

    // 2. Fetch Normal Order Deliveries assigned to this partner
    const normalDeliveries = await db
      .select({
        id: normalOrderDeliveries.id,
        orderId: normalOrderDeliveries.orderId,
        deliveryType: sql<string>`'NORMAL'`,
        customerName: users.name,
        customerEmail: users.email,
        customerPhone: users.phone,
        mealName: sql<string>`'Order Dishes'`,
        mealType: sql<string>`'LUNCH'`,
        status: normalOrderDeliveries.status,
        deliveredAt: normalOrderDeliveries.deliveredAt,
        notes: normalOrderDeliveries.notes,
        mealsRemaining: sql<number>`0`,
        addressLabel: addresses.label,
        streetAddress: addresses.address,
        area: addresses.area,
        city: addresses.city,
        pincode: addresses.pincode,
        latitude: addresses.latitude,
        longitude: addresses.longitude,
        totalAmount: orders.total,
      })
      .from(normalOrderDeliveries)
      .innerJoin(orders, eq(normalOrderDeliveries.orderId, orders.id))
      .innerJoin(users, eq(orders.userId, users.id))
      .leftJoin(addresses, eq(orders.addressId, addresses.id))
      .where(
        and(
          eq(normalOrderDeliveries.deliveryPartnerId, partner.id),
          ne(normalOrderDeliveries.status, "CANCELLED")
        )
      );

    // Fetch order items for normal deliveries
    const orderIds = normalDeliveries.map((n) => n.orderId).filter(Boolean);
    let itemsByOrderId: Record<string, any[]> = {};
    if (orderIds.length > 0) {
      const items = await db
        .select()
        .from(orderItems)
        .where(inArray(orderItems.orderId, orderIds));
      items.forEach((item) => {
        if (!itemsByOrderId[item.orderId]) itemsByOrderId[item.orderId] = [];
        itemsByOrderId[item.orderId].push(item);
      });
    }

    const allDeliveries = [
      ...subDeliveries.map((s) => ({
        ...s,
        items: [{ name: s.mealName || "Subscription Meal", quantity: 1, unitPrice: 0 }],
      })),
      ...normalDeliveries.map((n) => {
        const dishList = itemsByOrderId[n.orderId] || [];
        const dishSummary = dishList.map((d) => `${d.quantity}x ${d.name}`).join(", ") || "Fresh Artisan Bowl";
        return {
          ...n,
          mealName: dishSummary,
          items: dishList,
        };
      }),
    ];

    const totalAssigned = allDeliveries.length;
    const deliveredCount = allDeliveries.filter((d) => d.status === "DELIVERED").length;
    const remainingCount = totalAssigned - deliveredCount;
    const currentSession = getCurrentSessionName();

    return NextResponse.json({
      partner: {
        id: partner.id,
        fullName: partner.fullName || "Delivery Partner",
        phone: partner.phone || "+918328534576",
        email: partner.email || "driver@qbowl.in",
        partnerCode: partner.id.replace("dp-", "DEL-").toUpperCase(),
      },
      summary: {
        totalAssigned,
        deliveredCount,
        remainingCount,
        currentSession,
      },
      deliveries: allDeliveries.map((d) => ({
        id: d.id,
        orderId: d.orderId,
        orderIdDisplay: d.orderId ? formatOrderId(d.orderId) : `#DEL-${d.id.slice(-6).toUpperCase()}`,
        deliveryType: d.deliveryType || "NORMAL",
        customerName: d.customerName || "Customer",
        customerPhone: d.customerPhone || "+918328534576",
        customerEmail: d.customerEmail || "",
        mealName: d.mealName || "Artisan Bowl",
        mealType: (d.mealType || "LUNCH").toUpperCase(),
        items: d.items || [],
        totalAmount: d.totalAmount || 0,
        status: d.status || "SCHEDULED",
        deliveredAt: d.deliveredAt ? new Date(d.deliveredAt).toISOString() : null,
        mealsRemaining: d.mealsRemaining || 0,
        notes: d.notes || "",
        address: {
          label: d.addressLabel || "Home",
          fullAddress: `${d.streetAddress || ""}, ${d.area || ""}, ${d.city || ""}`.replace(/^,\s*/, ""),
          street: d.streetAddress || "",
          area: d.area || "",
          city: d.city || "Rajahmundry",
          pincode: d.pincode || "",
          latitude: d.latitude ? Number(d.latitude) : 17.0521416,
          longitude: d.longitude ? Number(d.longitude) : 81.8677663,
        },
      })),
    });
  } catch (error: any) {
    console.error("Delivery Dashboard GET Error:", error);
    return NextResponse.json({ error: error.message || "Failed to load delivery dashboard" }, { status: 500 });
  }
}
