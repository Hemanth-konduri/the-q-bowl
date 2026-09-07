import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { requireAdminApi } from "@/lib/auth-guard";
import { eq } from "drizzle-orm";

const DEFAULT_SETTINGS = {
  id: "app-settings-main",
  kitchenName: "Q1 Bowl - Artisan Cloud Kitchen",
  phone: "+91 98765 43210",
  email: "admin@q1bowl.com",
  address: "Gachibowli, Hyderabad, Telangana 500032",
  gstNumber: "36AAAAA0000A1Z5",
  logoUrl: "/the_q_bowl_logo.png",
  openingTime: "07:00 AM",
  closingTime: "10:30 PM",
  autoAcceptOrders: true,
  sameDayOrdering: true,
  deliveryRadiusKm: 7.5,
  enable2fa: false,
  emailNotifications: true,
  newOrderAlerts: true,
  newSubscriptionAlerts: true,
  paymentAlerts: true,
  timeZone: "Asia/Kolkata (GMT+5:30)",
  currency: "INR (₹)",
  dateFormat: "DD/MM/YYYY",
};

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const list = await db.select().from(appSettings).limit(1);
    if (!list.length) {
      // Seed default settings row if missing
      await db.insert(appSettings).values(DEFAULT_SETTINGS);
      return NextResponse.json({ success: true, settings: DEFAULT_SETTINGS });
    }
    return NextResponse.json({ success: true, settings: list[0] });
  } catch (error: any) {
    console.error("GET /api/admin/settings/all error:", error);
    return NextResponse.json({ success: true, settings: DEFAULT_SETTINGS });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const existing = await db.select().from(appSettings).limit(1);

    const updatedData = {
      kitchenName: body.kitchenName !== undefined ? String(body.kitchenName) : DEFAULT_SETTINGS.kitchenName,
      phone: body.phone !== undefined ? String(body.phone) : DEFAULT_SETTINGS.phone,
      email: body.email !== undefined ? String(body.email) : DEFAULT_SETTINGS.email,
      address: body.address !== undefined ? String(body.address) : DEFAULT_SETTINGS.address,
      gstNumber: body.gstNumber !== undefined ? String(body.gstNumber) : DEFAULT_SETTINGS.gstNumber,
      logoUrl: body.logoUrl !== undefined ? String(body.logoUrl) : DEFAULT_SETTINGS.logoUrl,
      openingTime: body.openingTime !== undefined ? String(body.openingTime) : DEFAULT_SETTINGS.openingTime,
      closingTime: body.closingTime !== undefined ? String(body.closingTime) : DEFAULT_SETTINGS.closingTime,
      autoAcceptOrders: body.autoAcceptOrders !== undefined ? Boolean(body.autoAcceptOrders) : true,
      sameDayOrdering: body.sameDayOrdering !== undefined ? Boolean(body.sameDayOrdering) : true,
      deliveryRadiusKm: body.deliveryRadiusKm !== undefined ? Number(body.deliveryRadiusKm) : 7.5,
      enable2fa: body.enable2fa !== undefined ? Boolean(body.enable2fa) : false,
      emailNotifications: body.emailNotifications !== undefined ? Boolean(body.emailNotifications) : true,
      newOrderAlerts: body.newOrderAlerts !== undefined ? Boolean(body.newOrderAlerts) : true,
      newSubscriptionAlerts: body.newSubscriptionAlerts !== undefined ? Boolean(body.newSubscriptionAlerts) : true,
      paymentAlerts: body.paymentAlerts !== undefined ? Boolean(body.paymentAlerts) : true,
      timeZone: body.timeZone !== undefined ? String(body.timeZone) : DEFAULT_SETTINGS.timeZone,
      currency: body.currency !== undefined ? String(body.currency) : DEFAULT_SETTINGS.currency,
      dateFormat: body.dateFormat !== undefined ? String(body.dateFormat) : DEFAULT_SETTINGS.dateFormat,
      updatedAt: new Date(),
    };

    if (existing.length > 0) {
      await db
        .update(appSettings)
        .set(updatedData)
        .where(eq(appSettings.id, existing[0].id));
    } else {
      await db.insert(appSettings).values({
        id: "app-settings-main",
        ...updatedData,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Application & operational settings saved successfully.",
      settings: updatedData,
    });
  } catch (error: any) {
    console.error("POST /api/admin/settings/all error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update application settings." },
      { status: 500 }
    );
  }
}
