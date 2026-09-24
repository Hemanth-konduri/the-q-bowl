import { NextResponse } from "next/server";
import { db, withDbRetry } from "@/db";
import { kitchenSettings } from "@/db/schema";
import { getKitchenSettings } from "@/lib/kitchen-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Wrap database query with timeout (3s) and retry mechanism
    const fetchFromDb = async () => {
      return await withDbRetry(async () => {
        return await db.select().from(kitchenSettings).limit(1);
      }, 2);
    };

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("DB_TIMEOUT")), 3000)
    );

    const existing = await Promise.race([fetchFromDb(), timeoutPromise]);

    if (existing && existing.length > 0) {
      const row = existing[0];
      const isOpenNow = row.kitchenStatus === "OPEN" && !row.isOrderingPaused;
      return NextResponse.json(
        {
          success: true,
          isOpenNow,
          kitchenStatus: row.kitchenStatus || "OPEN",
          isOrderingPaused: Boolean(row.isOrderingPaused),
          openingTime: row.openingTime || "07:00 AM",
          closingTime: row.closingTime || "10:30 PM",
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
    const fallbackIsOpenNow = fallback.kitchenStatus === "OPEN" && !fallback.isOrderingPaused;
    return NextResponse.json(
      {
        success: true,
        isOpenNow: fallbackIsOpenNow,
        kitchenStatus: fallback.kitchenStatus || "OPEN",
        isOrderingPaused: Boolean(fallback.isOrderingPaused),
        openingTime: fallback.openingTime || "07:00 AM",
        closingTime: fallback.closingTime || "10:30 PM",
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
      kitchenStatus: fallback.kitchenStatus || "OPEN",
      isOrderingPaused: Boolean(fallback.isOrderingPaused),
      settings: fallback,
    });
  }
}
