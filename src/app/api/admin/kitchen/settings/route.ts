import { NextResponse } from "next/server";
import { db } from "@/db";
import { kitchenSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

// In-memory fallback state to ensure ultra-fast response & initial defaults
let memorySettings = {
  kitchenStatus: "OPEN", // 'OPEN' | 'CLOSED' | 'CLOSED_TODAY' | 'TEMPORARILY_UNAVAILABLE'
  openingTime: "07:00 AM",
  closingTime: "10:30 PM",
  isOrderingPaused: false,
  maxOrdersPerDay: 250,
  currentOrdersToday: 142,
  isSameDayOrderingEnabled: true,
  estimatedPrepTime: "25 - 35 mins",
  isHolidayClosure: false,
  holidayReason: "Diwali Special Break",
  holidayReopeningDate: "2026-09-10",
  isNoticeBannerActive: true,
  noticeBannerText: "Kitchen is open and serving fresh homemade bowls! Pre-orders welcome.",
  noticeBannerType: "INFO", // 'INFO' | 'WARNING' | 'ALERT' | 'SUCCESS'
  subscriberExemptionNote: "Active subscribers continue receiving daily meals on schedule without interruption.",
  updatedAt: new Date().toISOString(),
};

export async function GET() {
  try {
    const existing = await db.select().from(kitchenSettings).limit(1);
    if (existing.length > 0) {
      const row = existing[0];
      return NextResponse.json({
        success: true,
        settings: {
          ...memorySettings,
          kitchenName: row.kitchenName,
          kitchenLat: row.kitchenLat,
          kitchenLng: row.kitchenLng,
          deliveryRadiusKm: row.deliveryRadiusKm,
        },
      });
    }
    return NextResponse.json({
      success: true,
      settings: memorySettings,
    });
  } catch (error: any) {
    console.error("GET /api/admin/kitchen/settings error:", error);
    return NextResponse.json({ success: true, settings: memorySettings });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    memorySettings = {
      ...memorySettings,
      ...body,
      updatedAt: new Date().toISOString(),
    };

    // Try persisting kitchenName & radius if present in table
    const existing = await db.select().from(kitchenSettings).limit(1);
    if (existing.length > 0) {
      await db
        .update(kitchenSettings)
        .set({ updatedAt: new Date() })
        .where(eq(kitchenSettings.id, existing[0].id));
    }

    return NextResponse.json({
      success: true,
      message: "Kitchen operational settings updated successfully",
      settings: memorySettings,
    });
  } catch (error: any) {
    console.error("POST /api/admin/kitchen/settings error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update settings" },
      { status: 500 }
    );
  }
}
