import { NextRequest, NextResponse } from "next/server";
import { DeliveryZoneService } from "@/lib/services/DeliveryZoneService";

export const dynamic = "force-dynamic";

// Rajamahendravaram / Rajanagaram / Godavari Region Localities & Pincodes
export const RAJAHMUNDRY_SUPPORTED_LOCALITIES = [
  { name: "Bridge County & Canteen Hub", pincode: "533296", distanceKm: 0.2, fee: 0, tag: "Kitchen Campus" },
  { name: "Rajanagaram", pincode: "533294", distanceKm: 2.5, fee: 0, tag: "Primary Zone" },
  { name: "Velugubanda", pincode: "533296", distanceKm: 1.0, fee: 0, tag: "Primary Zone" },
  { name: "GIET Campus & Surroundings", pincode: "533296", distanceKm: 3.2, fee: 0, tag: "Fast Track" },
  { name: "Diwancheruvu", pincode: "533296", distanceKm: 4.8, fee: 0, tag: "Fast Track" },
  { name: "Lalacheruvu", pincode: "533106", distanceKm: 8.5, fee: 20, tag: "Rajahmundry City" },
  { name: "Danavaipeta", pincode: "533103", distanceKm: 12.0, fee: 29, tag: "Rajahmundry City" },
  { name: "Morampudi", pincode: "533107", distanceKm: 11.5, fee: 29, tag: "Rajahmundry City" },
  { name: "Kotipalli Bus Stand / Main Road", pincode: "533101", distanceKm: 13.5, fee: 29, tag: "Rajahmundry Hub" },
  { name: "Prakash Nagar", pincode: "533103", distanceKm: 12.8, fee: 29, tag: "Rajahmundry Hub" },
  { name: "Katheru", pincode: "533105", distanceKm: 9.5, fee: 20, tag: "Rajahmundry North" },
  { name: "Dowleswaram (Barrage Area)", pincode: "533125", distanceKm: 16.0, fee: 39, tag: "Extended Zone" },
  { name: "Rajahmundry Railway Station (RJY)", pincode: "533104", distanceKm: 14.0, fee: 29, tag: "Rajahmundry Hub" },
  { name: "Airport Road / Madhurapudi", pincode: "533102", distanceKm: 6.5, fee: 20, tag: "Airport Corridor" },
  { name: "Korukonda", pincode: "533289", distanceKm: 14.5, fee: 39, tag: "Extended Zone" },
];

export async function GET() {
  try {
    const activeZone = await DeliveryZoneService.getActiveDeliveryZone();
    return NextResponse.json({
      success: true,
      kitchenName: activeZone.zoneName,
      kitchenLat: activeZone.kitchenLat,
      kitchenLng: activeZone.kitchenLng,
      allowedRadiusKm: activeZone.deliveryRadiusKm,
      supportedAreas: RAJAHMUNDRY_SUPPORTED_LOCALITIES,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      kitchenName: "The Q Bowl Cloud Kitchen, Bridge County Canteen Hub, Rajanagaram, Velugubanda, AP 533296",
      allowedRadiusKm: 20.0,
      supportedAreas: RAJAHMUNDRY_SUPPORTED_LOCALITIES,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, lat, lng } = body;

    const activeZone = await DeliveryZoneService.getActiveDeliveryZone();

    // 1. If GPS coordinates provided, validate real Haversine radius from live Kitchen
    if (typeof lat === "number" && typeof lng === "number") {
      const locationCheck = await DeliveryZoneService.validateLocation(lat, lng);
      return NextResponse.json({
        success: true,
        eligible: locationCheck.isWithinRadius,
        distanceKm: locationCheck.distanceKm,
        allowedRadiusKm: locationCheck.allowedRadiusKm,
        deliveryFee: locationCheck.deliveryFee,
        kitchenName: activeZone.zoneName,
      });
    }

    // 2. Text / Pincode / Locality Lookup
    const search = String(query || "").trim().toLowerCase();
    if (!search) {
      return NextResponse.json({ error: "Search query or coordinates required" }, { status: 400 });
    }

    const matched = RAJAHMUNDRY_SUPPORTED_LOCALITIES.find(
      (loc) => loc.pincode === search || loc.name.toLowerCase().includes(search)
    );

    if (matched && matched.distanceKm <= activeZone.deliveryRadiusKm) {
      return NextResponse.json({
        success: true,
        eligible: true,
        area: matched,
        distanceKm: matched.distanceKm,
        allowedRadiusKm: activeZone.deliveryRadiusKm,
        deliveryFee: matched.fee,
        kitchenName: activeZone.zoneName,
      });
    }

    // Check if query mentions Hyderabad / out-of-range cities
    const isOutOfCity = /hyderabad|bangalore|chennai|vizag|vijayawada|gachibowli|madhapur|hitec/i.test(search);

    return NextResponse.json({
      success: true,
      eligible: false,
      isOutOfCity,
      message: isOutOfCity
        ? "We currently operate our Cloud Kitchen exclusively in Rajamahendravaram / Rajanagaram (within 20km radius)."
        : `This location is outside our ${activeZone.deliveryRadiusKm}km delivery radius from our Rajanagaram Cloud Kitchen.`,
      allowedRadiusKm: activeZone.deliveryRadiusKm,
      kitchenName: activeZone.zoneName,
    });
  } catch (error: any) {
    console.error("Delivery check error:", error);
    return NextResponse.json({ error: "Failed to verify delivery eligibility" }, { status: 500 });
  }
}
