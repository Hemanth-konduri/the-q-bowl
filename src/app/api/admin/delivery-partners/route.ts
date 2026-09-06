import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { deliveryPartners } from "@/db/schema";
import { requireAdminApi } from "@/lib/auth-guard";
import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const list = await db.select().from(deliveryPartners).orderBy(desc(deliveryPartners.createdAt));
    return NextResponse.json(list);
  } catch (error) {
    console.error("Error fetching delivery partners:", error);
    return NextResponse.json({ error: "Failed to fetch delivery partners." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const { fullName, phone, email, isActive } = await req.json();

    if (!fullName || !phone) {
      return NextResponse.json({ error: "Full Name and Phone are required." }, { status: 400 });
    }

    const id = `dp-${nanoid(8)}`;
    await db.insert(deliveryPartners).values({
      id,
      fullName: String(fullName).trim(),
      phone: String(phone).trim(),
      email: email ? String(email).trim() : null,
      isActive: typeof isActive === "boolean" ? isActive : true,
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Error creating delivery partner:", error);
    return NextResponse.json({ error: "Failed to onboard delivery partner." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const { id, fullName, phone, email, isActive } = await req.json();
    if (!id) return NextResponse.json({ error: "Partner ID is required." }, { status: 400 });

    const updateData: Record<string, unknown> = {};
    if (fullName) updateData.fullName = String(fullName).trim();
    if (phone) updateData.phone = String(phone).trim();
    if (email !== undefined) updateData.email = email ? String(email).trim() : null;
    if (typeof isActive === "boolean") updateData.isActive = isActive;
    updateData.updatedAt = new Date();

    await db.update(deliveryPartners).set(updateData).where(eq(deliveryPartners.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating delivery partner:", error);
    return NextResponse.json({ error: "Failed to update delivery partner." }, { status: 500 });
  }
}
