import { NextResponse } from "next/server";
import { DeliveryZoneService } from "@/lib/services/DeliveryZoneService";

export async function GET() {
  try {
    const zone = await DeliveryZoneService.getActiveDeliveryZone();
    return NextResponse.json({ success: true, zone });
  } catch (error) {
    console.error("GET Delivery Zone Error:", error);
    return NextResponse.json({ error: "Failed to fetch delivery zone" }, { status: 500 });
  }
}
