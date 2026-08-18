import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userList = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        googleId: users.googleId,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (userList.length === 0) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    return NextResponse.json({ user: userList[0] });
  } catch (error) {
    console.error("Profile GET API error:", error);
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, phone } = await req.json();

    const updated = await db
      .update(users)
      .set({
        name: name ?? null,
        phone: phone ?? null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.userId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
      });

    return NextResponse.json({ success: true, user: updated[0] });
  } catch (error) {
    console.error("Profile PUT API error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
