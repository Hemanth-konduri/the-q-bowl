import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  users,
  subscriptions,
  subscriptionPlans,
  subscriptionPackages,
  subscriptionDeliveries,
  payments,
  orders,
  orderItems,
  addresses,
  foodItems,
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
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

    const activeSubscription = activeSubs.length > 0 ? activeSubs[0] : null;

    // 3. Fetch customer's subscription deliveries
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
      .where(eq(subscriptions.userId, session.userId))
      .orderBy(desc(subscriptionDeliveries.deliveryDate), desc(subscriptionDeliveries.createdAt))
      .limit(5);

    // 4. Fetch customer's real recent orders with order items
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, session.userId))
      .orderBy(desc(orders.createdAt))
      .limit(5);

    const ordersWithItems = await Promise.all(
      userOrders.map(async (ord) => {
        const items = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, ord.id));
        return {
          ...ord,
          items,
        };
      })
    );

    // 5. Combine and format recent deliveries
    const formattedSubDeliveries = subDeliveries.map((sd) => ({
      id: sd.id,
      date: sd.deliveredAt ? sd.deliveredAt.toISOString() : sd.deliveryDate,
      mealType: sd.mealType || "Lunch",
      itemsSummary: sd.mealName || activeSubscription?.mealName || "Gourmet Subscription Meal",
      status: sd.status, // SCHEDULED, DELIVERED, CANCELLED, SKIPPED
      quantity: 1,
      type: "SUBSCRIPTION" as const,
    }));

    const formattedOrders = ordersWithItems.map((ord) => ({
      id: ord.id,
      date: ord.createdAt ? ord.createdAt.toISOString() : new Date().toISOString(),
      mealType: "Express Order",
      itemsSummary: ord.items?.map((i: any) => i.name).join(", ") || "Gourmet Meal Order",
      status: ord.status, // DELIVERED, PREPARING, OUT_FOR_DELIVERY, CANCELLED
      quantity: ord.items?.reduce((acc: number, i: any) => acc + i.quantity, 0) || 1,
      type: "ORDER" as const,
    }));

    const recentDeliveries = [...formattedSubDeliveries, ...formattedOrders]
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
