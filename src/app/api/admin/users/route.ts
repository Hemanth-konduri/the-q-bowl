import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, wallets } from "@/db/schema";
import { requireAdminApi } from "@/lib/auth-guard";
import { desc, eq, ilike, or, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const roleFilter = searchParams.get("role") || "";
  const statusFilter = searchParams.get("status") || "";

  try {
    const conditions = [];

    if (search.trim()) {
      const pattern = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(users.name, pattern),
          ilike(users.email, pattern),
          ilike(users.phone, pattern)
        )
      );
    }

    if (roleFilter && ["CUSTOMER", "ADMIN", "DELIVERY_STAFF"].includes(roleFilter)) {
      conditions.push(eq(users.role, roleFilter as "CUSTOMER" | "ADMIN" | "DELIVERY_STAFF"));
    }

    if (statusFilter && ["PENDING", "APPROVED", "REJECTED"].includes(statusFilter)) {
      conditions.push(eq(users.verificationStatus, statusFilter as "PENDING" | "APPROVED" | "REJECTED"));
    }

    const userList = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        emailVerified: users.emailVerified,
        verificationStatus: users.verificationStatus,
        isActive: users.isActive,
        createdAt: users.createdAt,
        walletBalance: wallets.balance,
      })
      .from(users)
      .leftJoin(wallets, eq(users.id, wallets.userId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(users.createdAt))
      .limit(100);

    return NextResponse.json(userList);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users list." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { userId, role, isActive, verificationStatus } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};

    if (role && ["CUSTOMER", "ADMIN", "DELIVERY_STAFF"].includes(role)) {
      updateData.role = role;
    }

    if (typeof isActive === "boolean") {
      updateData.isActive = isActive;
    }

    if (verificationStatus && ["PENDING", "APPROVED", "REJECTED"].includes(verificationStatus)) {
      updateData.verificationStatus = verificationStatus;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
    }

    updateData.updatedAt = new Date();

    await db.update(users).set(updateData).where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user profile." }, { status: 500 });
  }
}
