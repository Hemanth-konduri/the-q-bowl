import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { emailOtps, users } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { createSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { email, otp, name, phone } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and passcode are required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = otp.trim();

    const record = await db
      .select()
      .from(emailOtps)
      .where(
        and(
          eq(emailOtps.email, cleanEmail),
          eq(emailOtps.otp, cleanOtp),
          eq(emailOtps.used, false),
          gt(emailOtps.expiresAt, new Date())
        )
      )
      .limit(1);

    if (record.length === 0) {
      return NextResponse.json({ error: "Invalid or expired passcode" }, { status: 401 });
    }

    // Mark OTP as used
    await db.update(emailOtps).set({ used: true }).where(eq(emailOtps.id, record[0].id));

    // Find or create user
    let user = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);

    if (user.length === 0) {
      const created = await db
        .insert(users)
        .values({
          id: crypto.randomUUID(),
          email: cleanEmail,
          name: name ?? null,
          phone: phone ?? null,
          role: "CUSTOMER",
        })
        .returning();
      user = created;
    }

    const authenticatedUser = user[0];
    await createSession({ userId: authenticatedUser.id, role: authenticatedUser.role });
    
    // Always redirect regular customers to User Portal (/user/dashboard)
    const destination = authenticatedUser.role === "ADMIN" ? "/admin/dashboard" : "/user/dashboard";

    return NextResponse.json({
      success: true,
      redirect: destination,
      user: { id: authenticatedUser.id, email: authenticatedUser.email, role: authenticatedUser.role },
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
