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
  deliveryPartners,
} from "@/db/schema";
import { eq, and, ne, sql } from "drizzle-orm";

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

    // 1. Fetch Subscription Deliveries for Today
    const subDeliveries = await db
      .select({
        id: subscriptionDeliveries.id,
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
      })
      .from(subscriptionDeliveries)
      .innerJoin(subscriptions, eq(subscriptionDeliveries.subscriptionId, subscriptions.id))
      .innerJoin(users, eq(subscriptions.userId, users.id))
      .leftJoin(foodItems, eq(subscriptionDeliveries.mealId, foodItems.id))
      .leftJoin(addresses, eq(subscriptions.addressId, addresses.id))
      .where(
        and(
          eq(subscriptionDeliveries.deliveryDate, todayStr),
          ne(subscriptionDeliveries.status, "CANCELLED")
        )
      );

    // 2. Fetch Normal Order Deliveries for Today
    const normalDeliveries = await db
      .select({
        id: normalOrderDeliveries.id,
        deliveryType: sql<string>`'NORMAL'`,
        customerName: users.name,
        customerEmail: users.email,
        customerPhone: users.phone,
        mealName: sql<string>`'À la carte Order'`,
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
      })
      .from(normalOrderDeliveries)
      .innerJoin(orders, eq(normalOrderDeliveries.orderId, orders.id))
      .innerJoin(users, eq(orders.userId, users.id))
      .leftJoin(addresses, eq(orders.addressId, addresses.id))
      .where(ne(normalOrderDeliveries.status, "CANCELLED"));

    const allDeliveries = [...subDeliveries, ...normalDeliveries];

    const totalAssigned = allDeliveries.length;
    const deliveredCount = allDeliveries.filter((d) => d.status === "DELIVERED").length;
    const remainingCount = totalAssigned - deliveredCount;
    const currentSession = getCurrentSessionName();

    return NextResponse.json({
      partner: {
        id: partner.id,
        fullName: partner.fullName || "Ravi Kumar",
        phone: partner.phone || "+918328534576",
        email: partner.email || "ravi.delivery@qbowl.in",
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
        deliveryType: d.deliveryType || "SUBSCRIPTION",
        customerName: d.customerName || "Customer",
        customerPhone: d.customerPhone || "+918328534576",
        customerEmail: d.customerEmail || "",
        mealName: d.mealName || "Chicken Fry Piece Biryani",
        mealType: (d.mealType || "LUNCH").toUpperCase(),
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
          latitude: d.latitude ? Number(d.latitude) : 17.0005,
          longitude: d.longitude ? Number(d.longitude) : 81.7800,
        },
      })),
    });
  } catch (error: any) {
    console.error("Delivery Dashboard GET Error:", error);
    return NextResponse.json({ error: error.message || "Failed to load delivery dashboard" }, { status: 500 });
  }
}
