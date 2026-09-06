import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { offers } from "@/db/schema";
import { requireAdminApi } from "@/lib/auth-guard";
import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const list = await db.select().from(offers).orderBy(desc(offers.createdAt));
    return NextResponse.json(list);
  } catch (error) {
    console.error("Error fetching offers:", error);
    return NextResponse.json({ error: "Failed to fetch offers." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const { name, description, discountType, discountValue, minOrderAmount, maxDiscount, isActive } =
      await req.json();

    if (!name || !discountType || discountValue === undefined) {
      return NextResponse.json(
        { error: "Offer name, discount type, and discount value are required." },
        { status: 400 }
      );
    }

    const id = `offer-${nanoid(8)}`;
    await db.insert(offers).values({
      id,
      name: String(name).trim(),
      description: description ? String(description).trim() : null,
      discountType: discountType as "PERCENTAGE" | "FIXED",
      discountValue: Number(discountValue),
      minOrderAmount: minOrderAmount ? Number(minOrderAmount) : null,
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
      isActive: typeof isActive === "boolean" ? isActive : true,
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Error creating offer:", error);
    return NextResponse.json({ error: "Failed to create offer." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const { id, isActive } = await req.json();
    if (!id) return NextResponse.json({ error: "Offer ID required." }, { status: 400 });

    await db.update(offers).set({ isActive, updatedAt: new Date() }).where(eq(offers.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating offer:", error);
    return NextResponse.json({ error: "Failed to update offer." }, { status: 500 });
  }
}
