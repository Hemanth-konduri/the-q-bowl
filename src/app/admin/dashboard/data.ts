import { db } from "@/db";
import {
  orders,
  payments,
  subscriptions,
  subscriptionDays,
  subscriptionDayItems,
  users,
} from "@/db/schema";
import { eq, and, gte, lt, sql, count, sum, ne } from "drizzle-orm";

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export async function getDashboardStats() {
  const { start, end } = todayRange();
  const todayStr = start.toISOString().split("T")[0];

  // Today's orders count
  const [todayOrders] = await db
    .select({ count: count() })
    .from(orders)
    .where(and(gte(orders.createdAt, start), lt(orders.createdAt, end)));

  // Yesterday's orders for % change
  const yStart = new Date(start); yStart.setDate(yStart.getDate() - 1);
  const yEnd = new Date(end); yEnd.setDate(yEnd.getDate() - 1);
  const [yesterdayOrders] = await db
    .select({ count: count() })
    .from(orders)
    .where(and(gte(orders.createdAt, yStart), lt(orders.createdAt, yEnd)));

  // Pending orders (need action)
  const [pendingOrders] = await db
    .select({ count: count() })
    .from(orders)
    .where(eq(orders.status, "PENDING"));

  // Today's revenue (successful payments)
  const [todayRevenue] = await db
    .select({ total: sum(payments.amount) })
    .from(payments)
    .where(
      and(
        eq(payments.status, "SUCCESS"),
        gte(payments.paidAt, start),
        lt(payments.paidAt, end)
      )
    );

  // Yesterday's revenue for % change
  const [yesterdayRevenue] = await db
    .select({ total: sum(payments.amount) })
    .from(payments)
    .where(
      and(
        eq(payments.status, "SUCCESS"),
        gte(payments.paidAt, yStart),
        lt(payments.paidAt, yEnd)
      )
    );

  // Today's subscription meals (active subscription days for today)
  const [subMeals] = await db
    .select({ count: count() })
    .from(subscriptionDays)
    .where(
      and(
        eq(subscriptionDays.date, todayStr),
        eq(subscriptionDays.isSkipped, false)
      )
    );

  // Active subscriptions count
  const [activeSubs] = await db
    .select({ count: count() })
    .from(subscriptions)
    .where(eq(subscriptions.status, "ACTIVE"));

  // Total customers
  const [totalCustomers] = await db
    .select({ count: count() })
    .from(users)
    .where(and(eq(users.role, "CUSTOMER"), eq(users.isActive, true)));

  const todayOrdersCount = todayOrders.count;
  const yesterdayOrdersCount = yesterdayOrders.count;
  const ordersChange =
    yesterdayOrdersCount > 0
      ? (((todayOrdersCount - yesterdayOrdersCount) / yesterdayOrdersCount) * 100).toFixed(1)
      : null;

  const todayRev = Number(todayRevenue.total ?? 0);
  const yesterdayRev = Number(yesterdayRevenue.total ?? 0);
  const revenueChange =
    yesterdayRev > 0
      ? (((todayRev - yesterdayRev) / yesterdayRev) * 100).toFixed(1)
      : null;

  return {
    todayOrders: todayOrdersCount,
    ordersChange,
    pendingOrders: pendingOrders.count,
    todayRevenue: todayRev,
    revenueChange,
    subscriptionMealsToday: subMeals.count,
    activeSubscriptions: activeSubs.count,
    totalCustomers: totalCustomers.count,
  };
}

export async function getKitchenLoad() {
  const todayStr = new Date().toISOString().split("T")[0];

  // Subscription meals per meal type today
  const subLoad = await db
    .select({
      mealType: subscriptionDayItems.mealType,
      count: count(),
    })
    .from(subscriptionDayItems)
    .innerJoin(
      subscriptionDays,
      eq(subscriptionDayItems.subscriptionDayId, subscriptionDays.id)
    )
    .where(
      and(
        eq(subscriptionDays.date, todayStr),
        eq(subscriptionDays.isSkipped, false),
        eq(subscriptionDayItems.isSkipped, false)
      )
    )
    .groupBy(subscriptionDayItems.mealType);

  // Normal orders per meal type today (via order items food meal type)
  const normalLoad = await db
    .select({
      mealType: sql<string>`'NORMAL'`,
      count: count(),
    })
    .from(orders)
    .where(
      and(
        eq(orders.type, "NORMAL"),
        gte(orders.createdAt, (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })()),
        lt(orders.createdAt, (() => { const d = new Date(); d.setHours(23,59,59,999); return d; })()),
        ne(orders.status, "CANCELLED"),
        ne(orders.status, "FAILED")
      )
    );

  const mealOrder = ["BREAKFAST", "LUNCH", "DINNER", "SNACK", "OTHER"] as const;
  const subMap = Object.fromEntries(subLoad.map((r) => [r.mealType, r.count]));
  const normalOrdersToday = normalLoad[0]?.count ?? 0;

  const kitchenLoad = mealOrder
    .map((m) => ({ mealType: m, subscriptionCount: subMap[m] ?? 0 }))
    .filter((r) => r.subscriptionCount > 0);

  const totalMeals = kitchenLoad.reduce((s, r) => s + r.subscriptionCount, 0);

  return { kitchenLoad, normalOrdersToday, totalMeals };
}

export async function getRecentOrders() {
  const recent = await db
    .select({
      id: orders.id,
      type: orders.type,
      status: orders.status,
      total: orders.total,
      createdAt: orders.createdAt,
      customerName: users.name,
      customerEmail: users.email,
    })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .orderBy(sql`${orders.createdAt} desc`)
    .limit(5);

  return recent;
}
