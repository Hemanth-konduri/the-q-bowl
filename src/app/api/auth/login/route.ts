import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { identifier, password } = await req.json();
  const value = typeof identifier === "string" ? identifier.trim().toLowerCase() : "";
  if (!value || typeof password !== "string") return NextResponse.json({ error: "Username/email and password are required." }, { status: 400 });

  const [user] = await db.select().from(users).where(or(eq(users.email, value), eq(users.username, value))).limit(1);
  if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  if (!user.isActive) return NextResponse.json({ error: "This account is inactive." }, { status: 403 });

  await createSession({ userId: user.id, role: user.role });

  // ── 1. ADMIN ISOLATED FLOW ──
  // Admins log in directly with Email + Password only.
  // Never trigger OTP, email verification check, or document submission for Admins.
  if (user.role === "ADMIN") {
    return NextResponse.json({ success: true, redirect: "/admin/dashboard" });
  }

  // ── 2. USER VERIFICATION FLOW ──
  // Customers follow the multi-step verification pipeline.
  if (!user.emailVerified) {
    return NextResponse.json({
      success: true,
      redirect: `/verify-email?email=${encodeURIComponent(user.email ?? "")}&username=${encodeURIComponent(user.username ?? "")}`,
    });
  }

  if (!user.aadhaarDocument || !user.idProofDocument || user.verificationStatus === "REJECTED") {
    return NextResponse.json({ success: true, redirect: "/identity-verification" });
  }

  if (user.verificationStatus !== "APPROVED") {
    return NextResponse.json({ success: true, redirect: "/verification-pending" });
  }

  return NextResponse.json({ success: true, redirect: "/dashboard" });
}
