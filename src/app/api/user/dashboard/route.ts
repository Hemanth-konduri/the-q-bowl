import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  users,
  subscriptions,
  subscriptionPlans,
  subscriptionDays,
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
        expectedEndDate: subscriptions.expectedEndDate,
        pricePaid: subscriptions.pricePaid,
        planName: subscriptionPlans.name,
        planDescription: subscriptionPlans.description,
      })
      .from(subscriptions)
      .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(
        and(
          eq(subscriptions.userId, session.userId),
          eq(subscriptions.status, "ACTIVE")
        )
      )
      .limit(1);

    const activeSubscription = activeSubs.length > 0 ? activeSubs[0] : null;

    // 3. Fetch customer's real recent orders with order items
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

    // 4. Fetch customer's default delivery address
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

    // 5. Fetch available real food catalog items from database
    const availableFoodItems = await db
      .select()
      .from(foodItems)
      .where(eq(foodItems.isAvailable, true))
      .limit(8);

    return NextResponse.json({
      user: currentUser,
      activeSubscription,
      recentOrders: ordersWithItems,
      defaultAddress,
      foodItems: availableFoodItems,
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
