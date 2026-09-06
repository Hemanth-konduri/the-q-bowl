import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { addresses } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userAddresses = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, session.userId))
      .orderBy(desc(addresses.isDefault), desc(addresses.createdAt));

    return NextResponse.json({ addresses: userAddresses });
  } catch (error) {
    console.error("Addresses GET API error:", error);
    return NextResponse.json({ error: "Failed to fetch addresses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, addressId, label, address: street, area, city, state, pincode, latitude, longitude, isDefault } = body;

    // Action 1: Set Default Address
    if (action === "SET_DEFAULT" && addressId) {
      // Unset previous defaults
      await db
        .update(addresses)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(addresses.userId, session.userId));

      // Set target address as default
      await db
        .update(addresses)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(and(eq(addresses.id, addressId), eq(addresses.userId, session.userId)));

      return NextResponse.json({ success: true });
    }

    // Action 2: Delete Address
    if (action === "DELETE" && addressId) {
      await db
        .delete(addresses)
        .where(and(eq(addresses.id, addressId), eq(addresses.userId, session.userId)));
      return NextResponse.json({ success: true });
    }

    // Action 3: Add New Address
    if (!street || !area || !pincode) {
      return NextResponse.json({ error: "Street address, area, and pincode are required" }, { status: 400 });
    }

    if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
      return NextResponse.json(
        { error: "Pinned map location (latitude and longitude) is mandatory for delivery." },
        { status: 400 }
      );
    }

    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);

    // Dynamic Database Delivery Zone Validation
    const { DeliveryZoneService } = await import("@/lib/services/DeliveryZoneService");
    const zoneVal = await DeliveryZoneService.validateLocation(latNum, lngNum);

    if (!zoneVal.isWithinRadius) {
      return NextResponse.json(
        {
          error: `Selected location is ${zoneVal.distanceKm} km away from ${zoneVal.zoneName}, which exceeds our maximum delivery radius of ${zoneVal.allowedRadiusKm} km.`,
        },
        { status: 400 }
      );
    }


    // Check existing addresses
    const existing = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, session.userId));

    const shouldBeDefault = Boolean(isDefault || existing.length === 0);

    if (shouldBeDefault) {
      // Unset previous defaults
      await db
        .update(addresses)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(addresses.userId, session.userId));
    }

    const newAddress = await db
      .insert(addresses)
      .values({
        id: crypto.randomUUID(),
        userId: session.userId,
        label: label || "Home",
        recipientName: body.recipientName || "Customer",
        recipientPhone: body.recipientPhone || "9876543210",
        address: street,
        landmark: body.landmark || null,
        area: area || "Hyderabad Locality",
        city: city || "Hyderabad",
        state: state || "Telangana",
        pincode,
        latitude: latNum,
        longitude: lngNum,
        isDefault: shouldBeDefault,
      })
      .returning();

    return NextResponse.json({ success: true, address: newAddress[0] });
  } catch (error) {
    console.error("Addresses POST API error:", error);
    return NextResponse.json({ error: "Failed to save address" }, { status: 500 });
  }
}
