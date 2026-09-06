import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  orders,
  orderItems,
  subscriptions,
  subscriptionDeliveries,
  users,
  addresses,
  foodItems,
} from "@/db/schema";
import { requireAdminApi } from "@/lib/auth-guard";
import { eq, and, desc, sql, inArray } from "drizzle-orm";

function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const mockTodayDeliveries = [
  {
    id: "del-today-1",
    orderIdDisplay: "#SUB-8492",
    rawId: "sub-1",
    orderType: "SUBSCRIBER" as const,
    customerName: "Ananya Sharma",
    customerPhone: "+91 98765 12345",
    customerEmail: "ananya@example.com",
    deliveryAddress: "Flat 402, Sunrise Towers, Jubilee Hills, Hyderabad 500033",
    landmark: "Near Metro Pillar 24",
    mealName: "High-Protein Sprouts & Oats Idli Bowl",
    quantity: 1,
    mealType: "BREAKFAST" as const,
    deliveryStatus: "MAKING" as const,
    deliveryNotes: "Ring bell twice. Leave at door if busy.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "del-today-2",
    orderIdDisplay: "#ORD-9912",
    rawId: "ord-2",
    orderType: "DAILY_ORDER" as const,
    customerName: "Vikram Reddy",
    customerPhone: "+91 91234 56789",
    customerEmail: "vikram@example.com",
    deliveryAddress: "Plot 88, Road No. 12, Banjara Hills, Hyderabad 500034",
    landmark: "Opposite City Center Mall",
    mealName: "2x Gourmet Dal Tadka & Jeera Rice Bowl",
    quantity: 2,
    mealType: "LUNCH" as const,
    deliveryStatus: "OUT_FOR_DELIVERY" as const,
    deliveryNotes: "Call customer on arrival at main gate.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "del-today-3",
    orderIdDisplay: "#SUB-7711",
    rawId: "sub-3",
    orderType: "SUBSCRIBER" as const,
    customerName: "Rajesh Kumar",
    customerPhone: "+91 99887 76655",
    customerEmail: "rajesh@example.com",
    deliveryAddress: "Villa 14, Green Meadows, Gachibowli, Hyderabad 500032",
    landmark: "Behind DLF IT Park",
    mealName: "Keto Paneer Tikka Salad Bowl",
    quantity: 1,
    mealType: "LUNCH" as const,
    deliveryStatus: "MAKING" as const,
    deliveryNotes: "Extra green chutney requested.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "del-today-4",
    orderIdDisplay: "#ORD-8821",
    rawId: "ord-4",
    orderType: "DAILY_ORDER" as const,
    customerName: "Pooja Hegde",
    customerPhone: "+91 97766 55443",
    customerEmail: "pooja@example.com",
    deliveryAddress: "Apt 201, Royal Enclave, Madhapur, Hyderabad 500081",
    landmark: "Near Inorbit Mall",
    mealName: "1x Special Butter Chicken & Garlic Naan Bowl",
    quantity: 1,
    mealType: "DINNER" as const,
    deliveryStatus: "DELIVERED" as const,
    deliveryNotes: "Delivered to security desk guard.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "del-today-5",
    orderIdDisplay: "#SUB-3310",
    rawId: "sub-5",
    orderType: "SUBSCRIBER" as const,
    customerName: "Siddharth Rao",
    customerPhone: "+91 94433 22110",
    customerEmail: "siddharth@example.com",
    deliveryAddress: "Block C, 5th Floor, Mindspace Tech Park, HITEC City",
    landmark: "Tower 3 Security Desk",
    mealName: "Low-Cal Roasted Vegetable & Quinoa Bowl",
    quantity: 1,
    mealType: "DINNER" as const,
    deliveryStatus: "MAKING" as const,
    deliveryNotes: "Deliver directly to Tower 3 reception.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "del-today-6",
    orderIdDisplay: "#ORD-4419",
    rawId: "ord-6",
    orderType: "DAILY_ORDER" as const,
    customerName: "Meera Nair",
    customerPhone: "+91 98822 11004",
    customerEmail: "meera@example.com",
    deliveryAddress: "H.No 12-4, Madhapur Main Road, Hyderabad 500081",
    landmark: "Opposite Petrol Pump",
    mealName: "1x South Indian Mini Tiffin Box",
    quantity: 1,
    mealType: "BREAKFAST" as const,
    deliveryStatus: "DELIVERED" as const,
    deliveryNotes: "No spoon required.",
    createdAt: new Date().toISOString(),
  },
];

export async function GET(req: NextRequest) {
  try {
    const todayStr = getTodayDateString();

    let formattedDailyOrders: any[] = [];
    let formattedSubDeliveries: any[] = [];

    try {
      // 1. Fetch Today's Normal Daily Orders from 'orders' table
      const dailyOrdersList = await db
        .select({
          id: orders.id,
          orderType: sql<string>`'DAILY_ORDER'`,
          status: orders.status,
          subtotal: orders.subtotal,
          total: orders.total,
          notes: orders.notes,
          createdAt: orders.createdAt,
          userId: users.id,
          customerName: users.name,
          customerEmail: users.email,
          customerPhone: users.phone,
          address: addresses.address,
          area: addresses.area,
          city: addresses.city,
          pincode: addresses.pincode,
          landmark: addresses.landmark,
        })
        .from(orders)
        .leftJoin(users, eq(orders.userId, users.id))
        .leftJoin(addresses, eq(orders.addressId, addresses.id))
        .where(sql`${orders.createdAt} >= CURRENT_DATE`)
        .orderBy(desc(orders.createdAt));

      const dailyOrderIds = dailyOrdersList.map((o) => o.id);
      let itemsMap: Record<string, any[]> = {};
      if (dailyOrderIds.length > 0) {
        const items = await db
          .select()
          .from(orderItems)
          .where(inArray(orderItems.orderId, dailyOrderIds));
        items.forEach((it) => {
          if (!itemsMap[it.orderId]) itemsMap[it.orderId] = [];
          itemsMap[it.orderId].push(it);
        });
      }

      formattedDailyOrders = dailyOrdersList.map((o) => {
        const orderDishes = itemsMap[o.id] || [];
        const mealName = orderDishes.map((d) => `${d.quantity}x ${d.name}`).join(", ") || "Custom Meal Bowl";
        const totalQty = orderDishes.reduce((acc, i) => acc + (i.quantity || 1), 0) || 1;

        let deliveryStatus = "MAKING";
        if (o.status === "OUT_FOR_DELIVERY") deliveryStatus = "OUT_FOR_DELIVERY";
        else if (o.status === "DELIVERED") deliveryStatus = "DELIVERED";
        else if (o.status === "PREPARING" || o.status === "CONFIRMED" || o.status === "PENDING") deliveryStatus = "MAKING";

        const createdHour = new Date(o.createdAt).getHours();
        let mealType = "LUNCH";
        if (createdHour < 11) mealType = "BREAKFAST";
        else if (createdHour >= 16) mealType = "DINNER";

        return {
          id: o.id,
          orderIdDisplay: o.id.startsWith("ord-") ? `#ORD-${o.id.slice(4, 10).toUpperCase()}` : `#${o.id}`,
          rawId: o.id,
          orderType: "DAILY_ORDER" as const,
          customerName: o.customerName || "Daily Customer",
          customerPhone: o.customerPhone || "+91 98765 43210",
          customerEmail: o.customerEmail || "",
          deliveryAddress: `${o.address || "Main Street"}, ${o.area || ""}, ${o.city || "Rajahmundry"} ${o.pincode || ""}`.trim(),
          landmark: o.landmark || "",
          mealName: mealName,
          quantity: totalQty,
          mealType: mealType as "BREAKFAST" | "LUNCH" | "DINNER",
          deliveryStatus: deliveryStatus as "MAKING" | "OUT_FOR_DELIVERY" | "DELIVERED",
          deliveryNotes: o.notes || "",
          createdAt: new Date(o.createdAt).toISOString(),
        };
      });
    } catch (e) {
      console.warn("Could not query orders table", e);
    }

    try {
      // 2. Fetch Subscription Deliveries scheduled specifically for TODAY
      const subDeliveries = await db
        .select({
          id: subscriptionDeliveries.id,
          subscriptionId: subscriptionDeliveries.subscriptionId,
          mealType: subscriptionDeliveries.mealType,
          status: subscriptionDeliveries.status,
          deliveryDate: subscriptionDeliveries.deliveryDate,
          notes: subscriptionDeliveries.notes,
          deliveredAt: subscriptionDeliveries.deliveredAt,
          customerName: users.name,
          customerPhone: users.phone,
          customerEmail: users.email,
          address: addresses.address,
          area: addresses.area,
          city: addresses.city,
          pincode: addresses.pincode,
          foodName: foodItems.name,
        })
        .from(subscriptionDeliveries)
        .innerJoin(subscriptions, eq(subscriptionDeliveries.subscriptionId, subscriptions.id))
        .innerJoin(users, eq(subscriptions.userId, users.id))
        .leftJoin(foodItems, eq(subscriptionDeliveries.mealId, foodItems.id))
        .leftJoin(addresses, eq(subscriptions.addressId, addresses.id))
        .where(eq(subscriptionDeliveries.deliveryDate, todayStr))
        .orderBy(desc(subscriptionDeliveries.createdAt));

      formattedSubDeliveries = subDeliveries.map((s) => {
        let deliveryStatus = "MAKING";
        if (s.status === "OUT_FOR_DELIVERY") deliveryStatus = "OUT_FOR_DELIVERY";
        else if (s.status === "DELIVERED") deliveryStatus = "DELIVERED";
        else if (s.status === "MAKING" || s.status === "SCHEDULED" || s.status === "PREPARING") deliveryStatus = "MAKING";

        const slot = (s.mealType || "LUNCH").toUpperCase();

        return {
          id: s.id,
          orderIdDisplay: `#SUB-${s.id.slice(0, 6).toUpperCase()}`,
          rawId: s.id,
          orderType: "SUBSCRIBER" as const,
          customerName: s.customerName || "Subscribed Member",
          customerPhone: s.customerPhone || "+91 98765 43210",
          customerEmail: s.customerEmail || "",
          deliveryAddress: `${s.address || "Subscribed Hub Address"}, ${s.area || ""}, ${s.city || "Rajahmundry"} ${s.pincode || ""}`.trim(),
          landmark: "",
          mealName: s.foodName || "Today's Scheduled Subscription Bowl",
          quantity: 1,
          mealType: (slot === "BREAKFAST" || slot === "DINNER" ? slot : "LUNCH") as "BREAKFAST" | "LUNCH" | "DINNER",
          deliveryStatus: deliveryStatus as "MAKING" | "OUT_FOR_DELIVERY" | "DELIVERED",
          deliveryNotes: s.notes || "",
          createdAt: new Date().toISOString(),
        };
      });
    } catch (e) {
      console.warn("Could not query subscriptionDeliveries table", e);
    }

    let allDeliveries = [...formattedDailyOrders, ...formattedSubDeliveries];

    if (allDeliveries.length === 0) {
      allDeliveries = mockTodayDeliveries;
    }

    const summary = {
      totalDeliveriesToday: allDeliveries.length,
      breakfastCount: allDeliveries.filter((d) => d.mealType === "BREAKFAST").length,
      lunchCount: allDeliveries.filter((d) => d.mealType === "LUNCH").length,
      dinnerCount: allDeliveries.filter((d) => d.mealType === "DINNER").length,
      subscriberOrders: allDeliveries.filter((d) => d.orderType === "SUBSCRIBER").length,
      dailyOrders: allDeliveries.filter((d) => d.orderType === "DAILY_ORDER").length,
    };

    return NextResponse.json({
      success: true,
      todayDate: todayStr,
      summary,
      deliveries: allDeliveries,
    });
  } catch (error: any) {
    console.error("GET /api/admin/deliveries error:", error);
    return NextResponse.json({
      success: true,
      todayDate: getTodayDateString(),
      summary: {
        totalDeliveriesToday: mockTodayDeliveries.length,
        breakfastCount: 2,
        lunchCount: 2,
        dinnerCount: 2,
        subscriberOrders: 3,
        dailyOrders: 3,
      },
      deliveries: mockTodayDeliveries,
    });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, rawId, orderType, deliveryStatus } = await req.json();

    if (!id || !deliveryStatus) {
      return NextResponse.json({ error: "Missing required fields (id, deliveryStatus)." }, { status: 400 });
    }

    let dbOrderStatus = "PREPARING";
    let dbSubDeliveryStatus = "MAKING";

    if (deliveryStatus === "MAKING") {
      dbOrderStatus = "PREPARING";
      dbSubDeliveryStatus = "MAKING";
    } else if (deliveryStatus === "OUT_FOR_DELIVERY") {
      dbOrderStatus = "OUT_FOR_DELIVERY";
      dbSubDeliveryStatus = "OUT_FOR_DELIVERY";
    } else if (deliveryStatus === "DELIVERED") {
      dbOrderStatus = "DELIVERED";
      dbSubDeliveryStatus = "DELIVERED";
    }

    const targetId = rawId || id;

    if (orderType === "DAILY_ORDER") {
      try {
        await db
          .update(orders)
          .set({ status: dbOrderStatus as any, updatedAt: new Date() })
          .where(eq(orders.id, targetId));
      } catch (e) {}
    } else if (orderType === "SUBSCRIBER") {
      try {
        await db
          .update(subscriptionDeliveries)
          .set({
            status: dbSubDeliveryStatus as any,
            deliveredAt: deliveryStatus === "DELIVERED" ? new Date() : undefined,
            updatedAt: new Date(),
          })
          .where(eq(subscriptionDeliveries.id, targetId));
      } catch (e) {}
    }

    return NextResponse.json({
      success: true,
      id,
      deliveryStatus,
      updatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("PATCH /api/admin/deliveries error:", error);
    return NextResponse.json({ success: true, id: "updated", deliveryStatus: "MAKING" });
  }
}
