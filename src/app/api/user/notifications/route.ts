import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/db";
import { orders, subscriptions, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userList = await db
      .select({
        id: users.id,
        verificationStatus: users.verificationStatus,
      })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    const user = userList[0];

    // Fetch user recent orders for status notifications
    const recentOrders = await db
      .select({
        id: orders.id,
        status: orders.status,
        total: orders.total,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.userId, session.userId))
      .orderBy(desc(orders.createdAt))
      .limit(5);

    // Fetch active subscription
    const userSubs = await db
      .select({
        id: subscriptions.id,
        status: subscriptions.status,
        mealsRemaining: subscriptions.mealsRemaining,
      })
      .from(subscriptions)
      .where(eq(subscriptions.userId, session.userId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    const notifs = [];

    if (user?.verificationStatus === "APPROVED") {
      notifs.push({
        id: "verified-approved",
        title: "Account Verified & Approved 🎉",
        body: "Your identity verification is approved. Enjoy seamless ordering!",
        type: "SUCCESS",
        time: "Just now",
        isRead: false,
      });
    }

    if (userSubs.length > 0 && userSubs[0].status === "ACTIVE") {
      notifs.push({
        id: `sub-${userSubs[0].id}`,
        title: "Active Meal Subscription 🍲",
        body: `You have ${userSubs[0].mealsRemaining ?? 0} meals remaining in your plan.`,
        type: "SUBSCRIPTION",
        time: "Active",
        isRead: false,
      });
    }

    recentOrders.forEach((o) => {
      notifs.push({
        id: `ord-${o.id}`,
        title: `Order #${o.id.slice(0, 8)} (${o.status})`,
        body: `Total: ₹${o.total} • Current status: ${o.status.replace(/_/g, " ")}`,
        type: "ORDER",
        time: new Date(o.createdAt).toLocaleDateString(),
        isRead: false,
      });
    });

    return NextResponse.json({
      notifications: notifs,
      unreadCount: notifs.length,
    });
  } catch (error) {
    console.error("User notifications error:", error);
    return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 });
  }
}
