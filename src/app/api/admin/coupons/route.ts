import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { offers } from "@/db/schema";
import { requireAdminApi } from "@/lib/auth-guard";
import { count, sql, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

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
      (acc, o) => acc + (o.usageCount || 0) * (o.discountValue || 0),
      0
    );

    const couponsList = allOffers.filter((o) => o.code);
    const campaignsList = allOffers.filter((o) => !o.code || o.campaignType !== "COUPON");

    return NextResponse.json({
      summary: {
        activeCouponsCount,
        expiredCouponsCount,
        totalRedemptions,
        totalDiscountGiven,
      },
      coupons: couponsList,
      campaigns: campaignsList,
    });
  } catch (error: any) {
    console.error("GET /api/admin/coupons error:", error);
    return NextResponse.json(
      { error: "Failed to fetch real coupon records." },
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
