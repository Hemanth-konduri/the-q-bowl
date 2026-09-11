import { NextResponse } from "next/server";
import { db } from "@/db";
import { kitchenSettings } from "@/db/schema";
import { getKitchenSettings } from "@/lib/kitchen-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const existing = await db.select().from(kitchenSettings).limit(1);
    if (existing.length > 0) {
      const row = existing[0];
      const isOpenNow = row.kitchenStatus === "OPEN" && !row.isOrderingPaused;
      return NextResponse.json(
        {
          success: true,
          isOpenNow,
          settings: {
            kitchenStatus: row.kitchenStatus || "OPEN",
            openingTime: row.openingTime || "07:00 AM",
            closingTime: row.closingTime || "10:30 PM",
            isOrderingPaused: Boolean(row.isOrderingPaused),
            estimatedPrepTime: row.estimatedPrepTime || "25 - 35 mins",
            isNoticeBannerActive: Boolean(row.isNoticeBannerActive),
            noticeBannerText: row.noticeBannerText || "",
            noticeBannerType: row.noticeBannerType || "INFO",
            subscriberExemptionNote:
              row.subscriberExemptionNote ||
              "Active subscribers continue receiving daily scheduled meals on time without interruption.",
            kitchenName: row.kitchenName,
            kitchenLat: row.kitchenLat,
            kitchenLng: row.kitchenLng,
            deliveryRadiusKm: row.deliveryRadiusKm,
            updatedAt: row.updatedAt ? row.updatedAt.toISOString() : new Date().toISOString(),
          },
        },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );
    }

    const fallback = getKitchenSettings();
    return NextResponse.json(
      {
        success: true,
        isOpenNow: fallback.kitchenStatus === "OPEN" && !fallback.isOrderingPaused,
        settings: fallback,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error: any) {
    console.error("GET /api/kitchen/status error:", error);
    const fallback = getKitchenSettings();
    return NextResponse.json({
      success: true,
      isOpenNow: true,
      settings: fallback,
    });
  }
}
