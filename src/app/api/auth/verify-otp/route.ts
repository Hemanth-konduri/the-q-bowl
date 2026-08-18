import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { emailOtps, users } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { createSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { email, otp, name, phone } = await req.json();

  if (!email || !otp) {
    return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
  }

  const record = await db
    .select()
    .from(emailOtps)
    .where(
      and(
        eq(emailOtps.email, email),
        eq(emailOtps.otp, otp),
        eq(emailOtps.used, false),
        gt(emailOtps.expiresAt, new Date())
      )
    )
    .limit(1);

  if (record.length === 0) {
    return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 401 });
  }

  await db.update(emailOtps).set({ used: true }).where(eq(emailOtps.id, record[0].id));

  let user = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (user.length === 0) {
    const created = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        email,
        name: name ?? null,
        phone: phone ?? null,
        role: "CUSTOMER",
      })
      .returning();
    user = created;
  }

  await createSession({ userId: user[0].id, role: user[0].role });
  const destination = user[0].role === "ADMIN" ? "/admin/dashboard" : "/user/dashboard";
  return NextResponse.json({
    success: true,
    redirect: destination,
    user: { id: user[0].id, email: user[0].email, role: user[0].role },
  });
}
