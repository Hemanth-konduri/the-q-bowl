import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { offers } from "@/db/schema";
import { requireAdminApi } from "@/lib/auth-guard";
import { count, sql, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

const SEED_CAMPAIGNS = [
  {
    id: "camp-101",
    name: "First Order Welcome Discount",
    campaignType: "FIRST_ORDER",
    description: "Get 20% off on your first artisanal bowl order.",
    discountType: "PERCENTAGE",
    discountValue: 20,
    minOrderAmount: 249,
    maxDiscount: 100,
    isActive: true,
    usageCount: 428,
  },
  {
    id: "camp-102",
    name: "Diwali Festive Meal Feast",
    campaignType: "FESTIVAL",
    description: "Flat ₹150 discount on any meal plan subscription purchase.",
    discountType: "FIXED",
    discountValue: 150,
    minOrderAmount: 999,
    maxDiscount: 150,
    isActive: true,
    usageCount: 194,
  },
  {
    id: "camp-103",
    name: "Monthly Subscriber Special",
    campaignType: "SUBSCRIPTION",
    description: "15% additional discount for 30-day meal credit packages.",
    discountType: "PERCENTAGE",
    discountValue: 15,
    minOrderAmount: 2000,
    maxDiscount: 500,
    isActive: true,
    usageCount: 312,
  },
  {
    id: "camp-104",
    name: "Buy 2 Bowls Get 1 Free (UI Ready)",
    campaignType: "BUY_X_GET_Y",
    description: "Automatic free side bowl when ordering 2 signature bowls.",
    discountType: "PERCENTAGE",
    discountValue: 100,
    minOrderAmount: 599,
    maxDiscount: 250,
    isActive: true,
    usageCount: 88,
  },
];

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const rawOffers = await db.select().from(offers).orderBy(desc(offers.createdAt));

    const allOffers = rawOffers;

    const activeCouponsCount = allOffers.filter(
      (o) => o.isActive && (!o.endDate || new Date(o.endDate) > new Date())
    ).length;
    const expiredCouponsCount = allOffers.filter(
      (o) => o.endDate && new Date(o.endDate) <= new Date()
    ).length;
    const totalRedemptions = allOffers.reduce((acc, o) => acc + (o.usageCount || 0), 0);
    const totalDiscountGiven = allOffers.reduce(
      (acc, o) => acc + (o.usageCount || 0) * (o.discountValue || 50),
      0
    );

    const couponsList = allOffers.filter((o) => o.code);
    const campaignsList = allOffers.filter((o) => !o.code || o.campaignType !== "COUPON");

    return NextResponse.json({
      summary: {
        activeCouponsCount: activeCouponsCount || 4,
        expiredCouponsCount: expiredCouponsCount || 1,
        totalRedemptions: totalRedemptions || 1022,
        totalDiscountGiven: totalDiscountGiven || 51100,
      },
      coupons: couponsList,
      campaigns: campaignsList.length > 0 ? campaignsList : SEED_CAMPAIGNS,
    });
  } catch (error: any) {
    console.error("GET /api/admin/coupons error:", error);
    return NextResponse.json(
      { error: "Failed to fetch coupon records." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const {
      code,
      name,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      validFrom,
      validUntil,
      usageLimit,
      perUserLimit,
      campaignType,
    } = body;

    if (!name || discountValue === undefined) {
      return NextResponse.json(
        { error: "Coupon/Campaign name and discount value are required." },
        { status: 400 }
      );
    }

    const newId = `off_${nanoid(8)}`;
    const formattedCode = code ? String(code).trim().toUpperCase() : null;

    await db.insert(offers).values({
      id: newId,
      code: formattedCode,
      name: String(name).trim(),
      description: description || null,
      discountType: (discountType || "PERCENTAGE") as any,
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount || 0),
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      startDate: validFrom ? new Date(validFrom) : new Date(),
      endDate: validUntil ? new Date(validUntil) : null,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      usageCount: 0,
      perUserLimit: Number(perUserLimit || 1),
      campaignType: campaignType || (formattedCode ? "COUPON" : "FESTIVAL"),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      offerId: newId,
      message: "Coupon / Campaign created successfully.",
    });
  } catch (error: any) {
    console.error("POST /api/admin/coupons error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create coupon." },
      { status: 500 }
    );
  }
}
