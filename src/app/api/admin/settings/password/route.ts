import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAdminApi } from "@/lib/auth-guard";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const { currentPassword, newPassword, confirmPassword } = await req.json();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: "All password fields are required." }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "New password and confirmation do not match." }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters long." }, { status: 400 });
    }

    const [adminUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, auth.user.id))
      .limit(1);

    if (!adminUser) {
      return NextResponse.json({ error: "Admin user not found." }, { status: 404 });
    }

    if (adminUser.passwordHash) {
      const isValid = await bcrypt.compare(currentPassword, adminUser.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
      }
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db
      .update(users)
      .set({ passwordHash: newHash, updatedAt: new Date() })
      .where(eq(users.id, adminUser.id));

    return NextResponse.json({
      success: true,
      message: "Admin password updated successfully.",
    });
  } catch (error: any) {
    console.error("POST /api/admin/settings/password error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update admin password." },
      { status: 500 }
    );
  }
}
