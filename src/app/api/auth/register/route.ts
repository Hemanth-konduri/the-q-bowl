import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function POST(req: NextRequest) {
  try {
    const { email, username, password, phone } = await req.json();
    const cleanEmail = typeof email === "string" ? email.toLowerCase().trim() : "";
    const cleanUsername = typeof username === "string" ? username.trim() : "";
    const cleanPhone = typeof phone === "string" ? phone.trim() : "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(cleanUsername)) {
      return NextResponse.json({ error: "Username must be 3-30 letters, numbers, or underscores." }, { status: 400 });
    }
    if (cleanPhone && !/^[0-9+--\s()]{10,15}$/.test(cleanPhone)) {
      return NextResponse.json({ error: "Enter a valid phone number (at least 10 digits)." }, { status: 400 });
    }
    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const conditions = [eq(users.email, cleanEmail), eq(users.username, cleanUsername)];
    if (cleanPhone) conditions.push(eq(users.phone, cleanPhone));

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(or(...conditions))
      .limit(1);
    if (existing.length) {
      return NextResponse.json({ error: "Email, username, or phone number is already registered." }, { status: 409 });
    }

    const [user] = await db.insert(users).values({
      id: crypto.randomUUID(),
      email: cleanEmail,
      username: cleanUsername,
      phone: cleanPhone || null,
      passwordHash: await bcrypt.hash(password, 12),
      role: "CUSTOMER",
      emailVerified: false,
      verificationStatus: "PENDING",
    }).returning({ id: users.id, email: users.email, username: users.username, phone: users.phone });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Registration error details:", error);
    const errorMessage = error instanceof Error ? error.message : "Unable to create account.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
