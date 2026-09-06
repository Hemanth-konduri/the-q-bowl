import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-guard";
import { db } from "@/db";
import { notifications, verificationRequests, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    // 1. Fetch notifications table items
    const dbNotifs = await db
      .select({
        id: notifications.id,
        title: notifications.title,
        body: notifications.body,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .orderBy(desc(notifications.createdAt))
      .limit(10);

    // 2. Fetch pending verification requests as high-priority admin notifications
    const pendingVerifs = await db
      .select({
        id: verificationRequests.id,
        userName: users.name,
        userEmail: users.email,
        createdAt: verificationRequests.createdAt,
      })
      .from(verificationRequests)
      .innerJoin(users, eq(verificationRequests.userId, users.id))
      .where(eq(verificationRequests.status, "PENDING"))
      .orderBy(desc(verificationRequests.createdAt))
      .limit(10);

    // Transform pending verifications into notification structure
    const verifNotifs = pendingVerifs.map((v) => ({
      id: `verif-${v.id}`,
      title: "Identity Verification Pending",
      body: `${v.userName || v.userEmail || "A customer"} submitted identity documents for review.`,
      isRead: false,
      type: "VERIFICATION",
      createdAt: v.createdAt,
    }));

    const formattedDbNotifs = dbNotifs.map((n) => ({
      ...n,
      type: "SYSTEM",
    }));

    const combined = [...verifNotifs, ...formattedDbNotifs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const unreadCount = combined.filter((n) => !n.isRead).length;

    return NextResponse.json({
      notifications: combined,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching admin notifications:", error);
    return NextResponse.json(
      { error: "Failed to load notifications" },
      { status: 500 }
    );
  }
}
