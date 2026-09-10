import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, deliveryPartners } from "@/db/schema";
import { requireAdminApi } from "@/lib/auth-guard";
import { eq, or, desc, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

// GET: Fetch all Admin and Delivery Staff credentials accounts
export async function GET(req: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const roleFilter = searchParams.get("role"); // "ADMIN" | "DELIVERY_STAFF" | null

  try {
    const conditions = [
      or(eq(users.role, "ADMIN"), eq(users.role, "DELIVERY_STAFF"))
    ];

    if (roleFilter && (roleFilter === "ADMIN" || roleFilter === "DELIVERY_STAFF")) {
      conditions.length = 0;
      conditions.push(eq(users.role, roleFilter));
    }

    const accounts = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        username: users.username,
        phone: users.phone,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(and(...conditions))
      .orderBy(desc(users.createdAt));

    return NextResponse.json({ success: true, accounts });
  } catch (error) {
    console.error("Error fetching credentials:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff & admin credentials." },
      { status: 500 }
    );
  }
}

// POST: Create a new Admin or Delivery Boy credential account
export async function POST(req: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { name, email, username, phone, password, role } = body;

    const cleanName = typeof name === "string" ? name.trim() : "";
    const cleanEmail = typeof email === "string" ? email.toLowerCase().trim() : "";
    const cleanUsername = typeof username === "string" ? username.trim().toLowerCase() : "";
    const cleanPhone = typeof phone === "string" ? phone.trim() : "";
    const cleanRole = role === "DELIVERY_STAFF" ? "DELIVERY_STAFF" : "ADMIN";

    if (!cleanName) {
      return NextResponse.json({ error: "Full Name is required." }, { status: 400 });
    }

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json({ error: "Valid email address is required." }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmail = await db
      .select({ id: users.id, email: users.email, role: users.role })
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (existingEmail.length > 0) {
      return NextResponse.json(
        { error: `An account with email '${cleanEmail}' already exists (Role: ${existingEmail[0].role}). Please use a different email or update their credentials.` },
        { status: 409 }
      );
    }

    // Check if username already exists if provided
    const targetUsername = cleanUsername || `${cleanRole === "ADMIN" ? "admin" : "driver"}_${Date.now().toString().slice(-6)}`;
    const existingUsername = await db
      .select({ id: users.id, username: users.username })
      .from(users)
      .where(eq(users.username, targetUsername))
      .limit(1);

    if (existingUsername.length > 0) {
      return NextResponse.json(
        { error: `Username '${targetUsername}' is already taken. Please choose another username.` },
        { status: 409 }
      );
    }

    // Check if phone already exists if provided
    if (cleanPhone) {
      const existingPhone = await db
        .select({ id: users.id, phone: users.phone })
        .from(users)
        .where(eq(users.phone, cleanPhone))
        .limit(1);

      if (existingPhone.length > 0) {
        return NextResponse.json(
          { error: `Phone number '${cleanPhone}' is already registered with another account.` },
          { status: 409 }
        );
      }
    }

    const newUserId = `usr-${cleanRole === "ADMIN" ? "adm" : "del"}-${Date.now()}`;
    const passwordHash = await bcrypt.hash(password, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        id: newUserId,
        name: cleanName,
        email: cleanEmail,
        username: targetUsername,
        phone: cleanPhone || null,
        passwordHash,
        role: cleanRole,
        emailVerified: true,
        verificationStatus: "APPROVED",
        isActive: true,
      })
      .returning();

    // If Delivery Boy, ensure delivery_partners record is also linked
    if (cleanRole === "DELIVERY_STAFF") {
      const partnerId = `dp-${Date.now().toString().slice(-6)}`;
      await db.insert(deliveryPartners).values({
        id: partnerId,
        userId: newUser.id,
        fullName: cleanName,
        phone: cleanPhone || "+910000000000",
        email: cleanEmail,
        isActive: true,
      });
    }

    return NextResponse.json({
      success: true,
      account: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        username: newUser.username,
        phone: newUser.phone,
        role: newUser.role,
        isActive: newUser.isActive,
      },
    });
  } catch (error) {
    console.error("Error creating credential account:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create credential account." },
      { status: 500 }
    );
  }
}

// PATCH: Update password, active status, name, or phone of an account
export async function PATCH(req: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { userId, name, phone, password, isActive } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    const updates: Record<string, any> = { updatedAt: new Date() };

    if (typeof name === "string" && name.trim()) {
      updates.name = name.trim();
    }
    if (typeof phone === "string") {
      updates.phone = phone.trim() || null;
    }
    if (typeof isActive === "boolean") {
      updates.isActive = isActive;
    }
    if (typeof password === "string" && password.length >= 6) {
      updates.passwordHash = await bcrypt.hash(password, 10);
    }

    await db.update(users).set(updates).where(eq(users.id, userId));

    // Also sync with delivery_partners if applicable
    if (updates.name || updates.phone || typeof updates.isActive === "boolean") {
      const partnerUpdates: Record<string, any> = { updatedAt: new Date() };
      if (updates.name) partnerUpdates.fullName = updates.name;
      if (updates.phone) partnerUpdates.phone = updates.phone;
      if (typeof updates.isActive === "boolean") partnerUpdates.isActive = updates.isActive;
      
      await db
        .update(deliveryPartners)
        .set(partnerUpdates)
        .where(eq(deliveryPartners.userId, userId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating credentials:", error);
    return NextResponse.json(
      { error: "Failed to update credential account." },
      { status: 500 }
    );
  }
}

// DELETE: Delete a staff/admin credential account
export async function DELETE(req: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User ID is required." }, { status: 400 });
  }

  // Prevent admin from deleting their own current session account
  if (auth.user?.id === userId) {
    return NextResponse.json(
      { error: "You cannot delete your own active administrator account." },
      { status: 400 }
    );
  }

  try {
    // Delete delivery_partners record if linked
    await db.delete(deliveryPartners).where(eq(deliveryPartners.userId, userId));

    // Delete users record
    await db.delete(users).where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting credential account:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete credential account." },
      { status: 500 }
    );
  }
}

