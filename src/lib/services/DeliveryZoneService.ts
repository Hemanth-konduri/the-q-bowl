import { db } from "@/db";
import { deliveryAreas, kitchenSettings } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export interface DeliveryZoneInfo {
  id: string;
  zoneName: string;
  kitchenLat: number;
  kitchenLng: number;
  deliveryRadiusKm: number;
  deliveryFee: number;
  isActive: boolean;
}

// Default fallback for The Q Bowl Cloud Kitchen Hub (Bridge County, Canteen, Rajanagaram, Velugubanda, AP 533296)
const DEFAULT_RAJAHMUNDRY_HUB: DeliveryZoneInfo = {
  id: "zone-rajahmundry-central",
  zoneName: "The Q Bowl (Bridge County, Canteen, Rajanagaram, Velugubanda, AP 533296)",
  kitchenLat: 17.0521416001496,
  kitchenLng: 81.867766342987642,
  deliveryRadiusKm: 20.0,
  deliveryFee: 49.0,
  isActive: true,
};

// Haversine Distance Formula (in kilometers)
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export class DeliveryZoneService {
  /**
   * Fetches the active delivery zone configuration directly from the database.
   * If no active zone exists, creates and returns the default Rajahmundry hub.
   */
  public static async getActiveDeliveryZone(): Promise<DeliveryZoneInfo> {
    try {
      // 1. Query active row from delivery_areas table
      const activeAreas = await db
        .select()
        .from(deliveryAreas)
        .where(eq(deliveryAreas.isActive, true))
        .orderBy(desc(deliveryAreas.createdAt))
        .limit(1);

      if (activeAreas.length > 0) {
        const area = activeAreas[0];
        return {
          id: area.id,
          zoneName: area.name,
          kitchenLat: Number(area.kitchenLat),
          kitchenLng: Number(area.kitchenLng),
          deliveryRadiusKm: Number(area.radius),
          deliveryFee: Number(area.deliveryFee),
          isActive: area.isActive,
        };
      }

      // 2. Query fallback from kitchen_settings table
      const settings = await db.select().from(kitchenSettings).limit(1);
      if (settings.length > 0) {
        const set = settings[0];
        return {
          id: set.id,
          zoneName: set.kitchenName || "Kitchen Hub",
          kitchenLat: Number(set.kitchenLat),
          kitchenLng: Number(set.kitchenLng),
          deliveryRadiusKm: Number(set.deliveryRadiusKm),
          deliveryFee: 49.0,
          isActive: true,
        };
      }

      // 3. Seed initial default Rajahmundry delivery zone if database is empty
      try {
        await db.insert(deliveryAreas).values({
          id: DEFAULT_RAJAHMUNDRY_HUB.id,
          name: DEFAULT_RAJAHMUNDRY_HUB.zoneName,
          kitchenLat: DEFAULT_RAJAHMUNDRY_HUB.kitchenLat,
          kitchenLng: DEFAULT_RAJAHMUNDRY_HUB.kitchenLng,
          radius: DEFAULT_RAJAHMUNDRY_HUB.deliveryRadiusKm,
          deliveryFee: DEFAULT_RAJAHMUNDRY_HUB.deliveryFee,
          isActive: true,
        });
      } catch (e) {
        // Ignore duplicate insert errors
      }

      return DEFAULT_RAJAHMUNDRY_HUB;
    } catch (error) {
      console.error("Error fetching active delivery zone from database:", error);
      return DEFAULT_RAJAHMUNDRY_HUB;
    }
  }

  /**
   * Validates user coordinates against the live database kitchen location & radius.
   */
  public static async validateLocation(lat: number, lng: number) {
    const zone = await this.getActiveDeliveryZone();
    const distanceKm = calculateHaversineDistance(
      zone.kitchenLat,
      zone.kitchenLng,
      lat,
      lng
    );

    const isWithinRadius = distanceKm <= zone.deliveryRadiusKm;
    const deliveryFee = isWithinRadius ? zone.deliveryFee : 0;

    return {
      isWithinRadius,
      distanceKm,
      allowedRadiusKm: zone.deliveryRadiusKm,
      deliveryFee,
      zoneName: zone.zoneName,
      kitchenLat: zone.kitchenLat,
      kitchenLng: zone.kitchenLng,
    };
  }
}
