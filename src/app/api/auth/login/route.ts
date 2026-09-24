import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, generateToken } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { identifier, password } = await req.json();
  const value = typeof identifier === "string" ? identifier.trim().toLowerCase() : "";
  if (!value || typeof password !== "string") return NextResponse.json({ error: "Username/email and password are required." }, { status: 400 });

  const [user] = await db.select().from(users).where(or(eq(users.email, value), eq(users.username, value))).limit(1);
  if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  if (!user.isActive) return NextResponse.json({ error: "This account is inactive." }, { status: 403 });

  const token = await generateToken({ userId: user.id, role: user.role });
  await createSession({ userId: user.id, role: user.role });

  const responsePayload = {
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };

  // ── 1. ADMIN & DELIVERY STAFF DIRECT FLOW ──
  if (user.role === "ADMIN") {
    return NextResponse.json({ ...responsePayload, redirect: "/admin/dashboard" });
  }

  if (user.role === "DELIVERY_STAFF") {
    return NextResponse.json({ ...responsePayload, redirect: "/delivery-dashboard" });
  }

  // ── 2. USER VERIFICATION FLOW ──
  if (!user.emailVerified) {
    return NextResponse.json({
      ...responsePayload,
      redirect: `/verify-email?email=${encodeURIComponent(user.email ?? "")}&username=${encodeURIComponent(user.username ?? "")}`,
    });
  }

  return NextResponse.json({ ...responsePayload, redirect: "/dashboard" });
}
