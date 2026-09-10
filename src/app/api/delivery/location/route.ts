import { NextRequest, NextResponse } from "next/server";
import { requireDeliveryPartnerApi } from "@/lib/auth-guard";
import { db } from "@/db";
import { deliveryPartners } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { partner } = await requireDeliveryPartnerApi();
    let body;
    try {
      body = await req.json();
    } catch (e: any) {
      // Handle aborted/closed connection gracefully
      return NextResponse.json({ error: "Invalid JSON or connection aborted" }, { status: 400 });
    }

    const { latitude, longitude } = body || {};

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json({ error: "Valid latitude and longitude are required." }, { status: 400 });
    }

    const now = new Date();

    await db
      .update(deliveryPartners)
      .set({
        currentLat: latitude,
        currentLng: longitude,
        lastLocationAt: now,
        updatedAt: now,
      })
      .where(eq(deliveryPartners.id, partner.id));

    return NextResponse.json({
      success: true,
      partnerId: partner.id,
      latitude,
      longitude,
      timestamp: now.toISOString(),
    });
  } catch (error: any) {
    if (error?.code === "ECONNRESET" || error?.name === "AbortError" || error?.message?.includes("aborted")) {
      return NextResponse.json({ ok: false, reason: "Connection aborted" }, { status: 499 });
    }
    console.warn("GPS Location Update Warning:", error?.message || error);
    return NextResponse.json({ error: error.message || "Failed to update GPS location" }, { status: 500 });
  }
}
