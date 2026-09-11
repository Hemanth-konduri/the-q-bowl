import { NextResponse } from "next/server";
import { db } from "@/db";
import { kitchenSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getKitchenSettings, updateKitchenSettings } from "@/lib/kitchen-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const existing = await db.select().from(kitchenSettings).limit(1);
    if (existing.length > 0) {
      const row = existing[0];
      return NextResponse.json({
        success: true,
        settings: {
          kitchenStatus: row.kitchenStatus || "OPEN",
          openingTime: row.openingTime || "07:00 AM",
          closingTime: row.closingTime || "10:30 PM",
          isOrderingPaused: Boolean(row.isOrderingPaused),
          maxOrdersPerDay: row.maxOrdersPerDay ?? 250,
          currentOrdersToday: row.currentOrdersToday ?? 142,
          isSameDayOrderingEnabled: row.isSameDayOrderingEnabled ?? true,
          estimatedPrepTime: row.estimatedPrepTime || "25 - 35 mins",
          isHolidayClosure: Boolean(row.isHolidayClosure),
          holidayReason: row.holidayReason || "Special Break",
          holidayReopeningDate: row.holidayReopeningDate || "2026-09-10",
          isNoticeBannerActive: Boolean(row.isNoticeBannerActive),
          noticeBannerText: row.noticeBannerText || "Kitchen is open and serving fresh homemade bowls! Pre-orders welcome.",
          noticeBannerType: row.noticeBannerType || "INFO",
          subscriberExemptionNote: row.subscriberExemptionNote || "Active subscribers continue receiving daily scheduled meals on time without interruption.",
          kitchenName: row.kitchenName,
          kitchenLat: row.kitchenLat,
          kitchenLng: row.kitchenLng,
          deliveryRadiusKm: row.deliveryRadiusKm,
          updatedAt: row.updatedAt ? row.updatedAt.toISOString() : new Date().toISOString(),
        },
      }, {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        }
      });
    }

    return NextResponse.json({
      success: true,
      settings: getKitchenSettings(),
    }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      }
    });
  } catch (error: any) {
    console.error("GET /api/admin/kitchen/settings error:", error);
    return NextResponse.json({ success: true, settings: getKitchenSettings() });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const existing = await db.select().from(kitchenSettings).limit(1);

    const updatePayload: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (body.kitchenStatus !== undefined) updatePayload.kitchenStatus = body.kitchenStatus;
    if (body.openingTime !== undefined) updatePayload.openingTime = body.openingTime;
    if (body.closingTime !== undefined) updatePayload.closingTime = body.closingTime;
    if (body.isOrderingPaused !== undefined) updatePayload.isOrderingPaused = Boolean(body.isOrderingPaused);
    if (body.maxOrdersPerDay !== undefined) updatePayload.maxOrdersPerDay = Number(body.maxOrdersPerDay);
    if (body.currentOrdersToday !== undefined) updatePayload.currentOrdersToday = Number(body.currentOrdersToday);
    if (body.isSameDayOrderingEnabled !== undefined) updatePayload.isSameDayOrderingEnabled = Boolean(body.isSameDayOrderingEnabled);
    if (body.estimatedPrepTime !== undefined) updatePayload.estimatedPrepTime = body.estimatedPrepTime;
    if (body.isHolidayClosure !== undefined) updatePayload.isHolidayClosure = Boolean(body.isHolidayClosure);
    if (body.holidayReason !== undefined) updatePayload.holidayReason = body.holidayReason;
    if (body.holidayReopeningDate !== undefined) updatePayload.holidayReopeningDate = body.holidayReopeningDate;
    if (body.isNoticeBannerActive !== undefined) updatePayload.isNoticeBannerActive = Boolean(body.isNoticeBannerActive);
    if (body.noticeBannerText !== undefined) updatePayload.noticeBannerText = body.noticeBannerText;
    if (body.noticeBannerType !== undefined) updatePayload.noticeBannerType = body.noticeBannerType;
    if (body.subscriberExemptionNote !== undefined) updatePayload.subscriberExemptionNote = body.subscriberExemptionNote;
    if (body.kitchenName !== undefined) updatePayload.kitchenName = body.kitchenName;
    if (body.kitchenLat !== undefined) updatePayload.kitchenLat = Number(body.kitchenLat);
    if (body.kitchenLng !== undefined) updatePayload.kitchenLng = Number(body.kitchenLng);
    if (body.deliveryRadiusKm !== undefined) updatePayload.deliveryRadiusKm = Number(body.deliveryRadiusKm);

    if (existing.length > 0) {
      await db
        .update(kitchenSettings)
        .set(updatePayload)
        .where(eq(kitchenSettings.id, existing[0].id));
    } else {
      await db.insert(kitchenSettings).values({
        id: "kitchen-main",
        kitchenName: body.kitchenName || "The Q Bowl Cloud Kitchen, Bridge County Canteen, Rajanagaram, Velugubanda, AP 533296",
        kitchenLat: body.kitchenLat ? Number(body.kitchenLat) : 17.0605,
        kitchenLng: body.kitchenLng ? Number(body.kitchenLng) : 81.8640,
        deliveryRadiusKm: body.deliveryRadiusKm ? Number(body.deliveryRadiusKm) : 20.0,
        ...updatePayload,
      });
    }

    // Also update in-memory cache
    const updated = updateKitchenSettings(body);

    return NextResponse.json({
      success: true,
      message: "Kitchen operational settings updated successfully",
      settings: updated,
    });
  } catch (error: any) {
    console.error("POST /api/admin/kitchen/settings error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update settings" },
      { status: 500 }
    );
  }
}

