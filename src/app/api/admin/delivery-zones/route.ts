import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { deliveryAreas } from "@/db/schema";
import { requireAdminApi } from "@/lib/auth-guard";
import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const list = await db.select().from(deliveryAreas).orderBy(desc(deliveryAreas.createdAt));
    return NextResponse.json(list);
  } catch (error) {
    console.error("Error fetching delivery zones:", error);
    return NextResponse.json({ error: "Failed to fetch delivery zones." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const { name, kitchenLat, kitchenLng, radius, deliveryFee, isActive } = await req.json();

    if (!name || kitchenLat === undefined || kitchenLng === undefined || !radius) {
      return NextResponse.json(
        { error: "Zone Name, Kitchen Coordinates, and Radius are required." },
        { status: 400 }
      );
    }

    const id = `zone-${nanoid(8)}`;
    await db.insert(deliveryAreas).values({
      id,
      name: String(name).trim(),
      kitchenLat: Number(kitchenLat),
      kitchenLng: Number(kitchenLng),
      radius: Number(radius),
      deliveryFee: Number(deliveryFee || 0),
      isActive: typeof isActive === "boolean" ? isActive : true,
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Error creating delivery zone:", error);
    return NextResponse.json({ error: "Failed to create delivery zone." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const { id, name, radius, deliveryFee, isActive } = await req.json();
    if (!id) return NextResponse.json({ error: "Zone ID is required." }, { status: 400 });

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = String(name).trim();
    if (radius !== undefined) updateData.radius = Number(radius);
    if (deliveryFee !== undefined) updateData.deliveryFee = Number(deliveryFee);
    if (typeof isActive === "boolean") updateData.isActive = isActive;
    updateData.updatedAt = new Date();

    await db.update(deliveryAreas).set(updateData).where(eq(deliveryAreas.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating delivery zone:", error);
    return NextResponse.json({ error: "Failed to update delivery zone." }, { status: 500 });
  }
}
