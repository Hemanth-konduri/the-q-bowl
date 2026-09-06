import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!cleanEmail || typeof password !== "string") {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const [admin] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, cleanEmail), eq(users.role, "ADMIN")))
    .limit(1);

  if (!admin || !admin.passwordHash) {
    return NextResponse.json({ error: "Invalid admin credentials." }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid admin credentials." }, { status: 401 });
  }

  if (!admin.isActive) {
    return NextResponse.json({ error: "This admin account is inactive." }, { status: 403 });
  }

  // Create Admin session and redirect directly to Admin Dashboard
  await createSession({ userId: admin.id, role: admin.role });
  return NextResponse.json({ success: true, redirect: "/admin/dashboard" });
}
