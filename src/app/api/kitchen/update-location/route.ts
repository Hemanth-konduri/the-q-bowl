import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { kitchenSettings, deliveryAreas } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const existing = await db.select().from(kitchenSettings).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        kitchen: {
          name: existing[0].kitchenName,
          lat: existing[0].kitchenLat,
          lng: existing[0].kitchenLng,
          radiusKm: existing[0].deliveryRadiusKm,
        },
      });
    }

    return NextResponse.json({
      success: true,
      kitchen: {
        name: "The Q Bowl, Bridge County, Canteen, Rajanagaram, Velugubanda, Andhra Pradesh 533296",
        lat: 17.0605,
        lng: 81.8640,
        radiusKm: 20.0,
      },
    });
  } catch (error: any) {
    console.error("GET /api/kitchen/update-location error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lat, lng, name, radiusKm } = body;

    if (lat === undefined || lng === undefined) {
      return NextResponse.json({ error: "Latitude and Longitude are required" }, { status: 400 });
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (isNaN(latNum) || isNaN(lngNum)) {
      return NextResponse.json({ error: "Invalid coordinates format" }, { status: 400 });
    }

    const kitchenName = name?.trim() || "The Q Bowl, Bridge County, Canteen, Rajanagaram, Velugubanda, Andhra Pradesh 533296";
    const radius = radiusKm ? parseFloat(radiusKm) : 20.0;

    // 1. Update kitchenSettings table
    const existingKitchen = await db.select().from(kitchenSettings).limit(1);
    if (existingKitchen.length > 0) {
      await db
        .update(kitchenSettings)
        .set({
          kitchenName,
          kitchenLat: latNum,
          kitchenLng: lngNum,
          deliveryRadiusKm: radius,
          updatedAt: new Date(),
        })
        .where(eq(kitchenSettings.id, existingKitchen[0].id));
    } else {
      await db.insert(kitchenSettings).values({
        id: "kitchen-main",
        kitchenName,
        kitchenLat: latNum,
        kitchenLng: lngNum,
        deliveryRadiusKm: radius,
        updatedAt: new Date(),
      });
    }

    // 2. Update active deliveryAreas table
    const existingAreas = await db.select().from(deliveryAreas).limit(1);
    if (existingAreas.length > 0) {
      await db
        .update(deliveryAreas)
        .set({
          name: `The Q Bowl Cloud Kitchen (${kitchenName.slice(0, 50)})`,
          kitchenLat: latNum,
          kitchenLng: lngNum,
          radius,
          updatedAt: new Date(),
        })
        .where(eq(deliveryAreas.id, existingAreas[0].id));
    } else {
      await db.insert(deliveryAreas).values({
        id: "area-rajahmundry-main",
        name: `The Q Bowl Cloud Kitchen (${kitchenName.slice(0, 50)})`,
        kitchenLat: latNum,
        kitchenLng: lngNum,
        radius,
        deliveryFee: 49.0,
        isActive: true,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Cloud kitchen location successfully updated in database",
      kitchen: {
        name: kitchenName,
        lat: latNum,
        lng: lngNum,
        radiusKm: radius,
      },
    });
  } catch (error: any) {
    console.error("POST /api/kitchen/update-location error:", error);
    return NextResponse.json({ error: error.message || "Failed to update kitchen location" }, { status: 500 });
  }
}
