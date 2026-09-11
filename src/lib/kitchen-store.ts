// Shared Kitchen Operational State Store
// Enables instantaneous sync between Admin Kitchen controls and Customer Dashboard

export interface KitchenSettingsData {
  kitchenStatus: "OPEN" | "CLOSED" | "CLOSED_TODAY" | "TEMPORARILY_UNAVAILABLE";
  openingTime: string;
  closingTime: string;
  isOrderingPaused: boolean;
  maxOrdersPerDay: number;
  currentOrdersToday: number;
  isSameDayOrderingEnabled: boolean;
  estimatedPrepTime: string;
  isHolidayClosure: boolean;
  holidayReason: string;
  holidayReopeningDate: string;
  isNoticeBannerActive: boolean;
  noticeBannerText: string;
  noticeBannerType: "INFO" | "WARNING" | "ALERT" | "SUCCESS";
  subscriberExemptionNote: string;
  kitchenName?: string;
  kitchenLat?: number;
  kitchenLng?: number;
  deliveryRadiusKm?: number;
  updatedAt: string;
}

// Global reference survives across API routes in Node runtime
const globalForKitchen = globalThis as unknown as {
  kitchenStore?: KitchenSettingsData;
};

export const defaultKitchenSettings: KitchenSettingsData = {
  kitchenStatus: "OPEN",
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
  noticeBannerType: "INFO",
  subscriberExemptionNote: "Active subscribers continue receiving daily scheduled meals on time without interruption.",
  kitchenName: "The Q Bowl Cloud Kitchen, Bridge County Canteen, Rajanagaram, Velugubanda, AP",
  kitchenLat: 17.0605,
  kitchenLng: 81.8640,
  deliveryRadiusKm: 20.0,
  updatedAt: new Date().toISOString(),
};

export function getKitchenSettings(): KitchenSettingsData {
  if (!globalForKitchen.kitchenStore) {
    globalForKitchen.kitchenStore = { ...defaultKitchenSettings };
  }
  return globalForKitchen.kitchenStore;
}

export function updateKitchenSettings(partial: Partial<KitchenSettingsData>): KitchenSettingsData {
  const current = getKitchenSettings();
  globalForKitchen.kitchenStore = {
    ...current,
    ...partial,
    updatedAt: new Date().toISOString(),
  };
  return globalForKitchen.kitchenStore;
}
