import { NextResponse } from "next/server";
import { db, withDbRetry } from "@/db";
import {
  users,
  subscriptions,
  subscriptionPlans,
  subscriptionPackages,
  subscriptionDeliveries,
  deliveryManifest,
  payments,
  orders,
  orderItems,
  addresses,
  foodItems,
} from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch real user profile
    const userList = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (userList.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const currentUser = userList[0];

    // 2. Fetch customer's real active subscription (if any)
    const activeSubs = await db
      .select({
        id: subscriptions.id,
        status: subscriptions.status,
        totalMeals: subscriptions.totalMeals,
        mealsUsed: subscriptions.mealsUsed,
        mealsRemaining: subscriptions.mealsRemaining,
        creditsRemaining: subscriptions.creditsRemaining,
        startDate: subscriptions.startDate,
        endDate: subscriptions.endDate,
        expectedEndDate: subscriptions.expectedEndDate,
        pricePaid: payments.amount,
        planName: subscriptionPackages.name,
        mealName: foodItems.name,
        planDescription: foodItems.name,
        preferredDeliveryTime: subscriptions.preferredDeliveryTime,
      })
      .from(subscriptions)
      .leftJoin(subscriptionPackages, eq(subscriptions.packageId, subscriptionPackages.id))
      .leftJoin(foodItems, eq(subscriptions.mealId, foodItems.id))
      .leftJoin(payments, eq(subscriptions.paymentId, payments.id))
      .where(
        and(
          eq(subscriptions.userId, session.userId),
          eq(subscriptions.status, "ACTIVE")
        )
      )
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    const activeSubscription = activeSubs.length > 0 ? {
      ...activeSubs[0],
      mealsRemaining: activeSubs[0].creditsRemaining ?? activeSubs[0].mealsRemaining,
    } : null;

    // 3. Fetch customer's subscription deliveries that are strictly DELIVERED
    const subDeliveries = await db
      .select({
        id: subscriptionDeliveries.id,
        deliveryDate: subscriptionDeliveries.deliveryDate,
        mealType: subscriptionDeliveries.mealType,
        status: subscriptionDeliveries.status,
        deliveredAt: subscriptionDeliveries.deliveredAt,
        mealName: foodItems.name,
      })
      .from(subscriptionDeliveries)
      .innerJoin(subscriptions, eq(subscriptionDeliveries.subscriptionId, subscriptions.id))
      .leftJoin(foodItems, eq(subscriptionDeliveries.mealId, foodItems.id))
      .where(
        and(
          eq(subscriptions.userId, session.userId),
          eq(subscriptionDeliveries.status, "DELIVERED")
        )
      )
      .orderBy(desc(subscriptionDeliveries.deliveredAt), desc(subscriptionDeliveries.deliveryDate))
      .limit(10);

    // 4. Fetch unified delivery manifest records that are strictly DELIVERED
    const manifestDeliveries = await db
      .select({
        id: deliveryManifest.id,
        deliveryDate: deliveryManifest.deliveryDate,
        mealSlot: deliveryManifest.mealSlot,
        status: deliveryManifest.status,
        deliveredAt: deliveryManifest.deliveredAt,
        orderType: deliveryManifest.orderType,
        mealName: foodItems.name,
      })
      .from(deliveryManifest)
      .leftJoin(foodItems, eq(deliveryManifest.mealId, foodItems.id))
      .where(
        and(
          eq(deliveryManifest.customerId, session.userId),
          eq(deliveryManifest.status, "DELIVERED")
        )
      )
      .orderBy(desc(deliveryManifest.deliveredAt), desc(deliveryManifest.deliveryDate))
      .limit(10);

    // 5. Fetch customer's real DELIVERED orders with order items
    const userOrders = await withDbRetry(async () => {
      return await db
        .select()
        .from(orders)
        .where(
          and(
            eq(orders.userId, session.userId),
            eq(orders.status, "DELIVERED")
          )
        )
        .orderBy(desc(orders.updatedAt), desc(orders.createdAt))
        .limit(10);
    });

    let ordersWithItems: any[] = [];
    if (userOrders.length > 0) {
      const orderIds = userOrders.map((o) => o.id);
      const allItems = await withDbRetry(async () => {
        return await db
          .select()
          .from(orderItems)
          .where(inArray(orderItems.orderId, orderIds));
      });

      const itemsMap = new Map<string, typeof allItems>();
      for (const it of allItems) {
        if (!itemsMap.has(it.orderId)) itemsMap.set(it.orderId, []);
        itemsMap.get(it.orderId)!.push(it);
      }

      ordersWithItems = userOrders.map((ord) => ({
        ...ord,
        items: itemsMap.get(ord.id) || [],
      }));
    }

    // 6. Combine and format ONLY delivered items (no scheduled or pending orders)
    const formattedSubDeliveries = subDeliveries.map((sd) => ({
      id: sd.id,
      date: sd.deliveredAt ? sd.deliveredAt.toISOString() : (sd.deliveryDate || new Date().toISOString()),
      mealType: sd.mealType ? `${sd.mealType.charAt(0).toUpperCase()}${sd.mealType.slice(1).toLowerCase()}` : "Lunch",
      itemsSummary: sd.mealName || activeSubscription?.mealName || "Q Bowl Royal Homestyle Thali Bowl",
      status: "DELIVERED",
      quantity: 1,
      type: "SUBSCRIPTION" as const,
    }));

    const formattedManifestDeliveries = manifestDeliveries.map((md) => ({
      id: md.id,
      date: md.deliveredAt ? md.deliveredAt.toISOString() : (md.deliveryDate || new Date().toISOString()),
      mealType: md.mealSlot ? `${md.mealSlot.charAt(0).toUpperCase()}${md.mealSlot.slice(1).toLowerCase()}` : "Daily Drop",
      itemsSummary: md.mealName || (md.orderType === "SUBSCRIPTION" ? "Q Bowl Royal Homestyle Thali Bowl" : "Express Gourmet Order"),
      status: "DELIVERED",
      quantity: 1,
      type: (md.orderType === "SUBSCRIPTION" ? "SUBSCRIPTION" : "ORDER") as "SUBSCRIPTION" | "ORDER",
    }));

    const formattedOrders = ordersWithItems.map((ord) => ({
      id: ord.id,
      date: ord.updatedAt ? ord.updatedAt.toISOString() : (ord.createdAt ? ord.createdAt.toISOString() : new Date().toISOString()),
      mealType: "Express Order",
      itemsSummary: ord.items?.map((i: any) => i.name).join(", ") || "Gourmet Meal Order",
      status: "DELIVERED",
      quantity: ord.items?.reduce((acc: number, i: any) => acc + i.quantity, 0) || 1,
      type: "ORDER" as const,
    }));

    const seenIds = new Set<string>();
    const recentDeliveries = [...formattedSubDeliveries, ...formattedManifestDeliveries, ...formattedOrders]
      .filter((item) => {
        if (!item.id || seenIds.has(item.id)) return false;
        seenIds.add(item.id);
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    // 6. Fetch customer's default delivery address
    const defaultAddresses = await db
      .select()
      .from(addresses)
      .where(
        and(
          eq(addresses.userId, session.userId),
          eq(addresses.isDefault, true)
        )
      )
      .limit(1);

    const defaultAddress = defaultAddresses.length > 0 ? defaultAddresses[0] : null;

    // 7. Fetch available real food catalog items from database
    const availableFoodItems = await db
      .select()
      .from(foodItems)
      .where(eq(foodItems.isAvailable, true))
      .limit(8);

    return NextResponse.json({
      user: currentUser,
      activeSubscription,
      recentOrders: ordersWithItems,
      recentDeliveries,
      defaultAddress,
      foodItems: availableFoodItems,
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
