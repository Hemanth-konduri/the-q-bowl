import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { kitchenSettings } from "@/db/schema";
import { requireAdminApi } from "@/lib/auth-guard";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const list = await db.select().from(kitchenSettings).limit(1);
    if (!list.length) {
      // Default Gachibowli central kitchen provision
      return NextResponse.json({
        id: "ks-default",
        kitchenName: "Q1 Bowl Central Kitchen (Gachibowli)",
        kitchenLat: 17.4401,
        kitchenLng: 78.3489,
        deliveryRadiusKm: 7.5,
      });
    }
    return NextResponse.json(list[0]);
  } catch (error) {
    console.error("Error fetching kitchen settings:", error);
    return NextResponse.json({ error: "Failed to fetch kitchen settings." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const { kitchenName, kitchenLat, kitchenLng, deliveryRadiusKm } = await req.json();

    if (!kitchenName || kitchenLat === undefined || kitchenLng === undefined) {
      return NextResponse.json(
        { error: "Kitchen Name and Coordinates (Lat/Lng) are required." },
        { status: 400 }
      );
    }

    const existing = await db.select().from(kitchenSettings).limit(1);

    if (existing.length > 0) {
      await db
        .update(kitchenSettings)
        .set({
          kitchenName: String(kitchenName).trim(),
          kitchenLat: Number(kitchenLat),
          kitchenLng: Number(kitchenLng),
          deliveryRadiusKm: Number(deliveryRadiusKm || 7.5),
          updatedAt: new Date(),
        })
        .where(eq(kitchenSettings.id, existing[0].id));
    } else {
      await db.insert(kitchenSettings).values({
        id: `ks-${nanoid(8)}`,
        kitchenName: String(kitchenName).trim(),
        kitchenLat: Number(kitchenLat),
        kitchenLng: Number(kitchenLng),
        deliveryRadiusKm: Number(deliveryRadiusKm || 7.5),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating kitchen settings:", error);
    return NextResponse.json({ error: "Failed to update kitchen settings." }, { status: 500 });
  }
}
