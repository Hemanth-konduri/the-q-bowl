import { NextResponse } from "next/server";
import { db } from "@/db";
import { offers } from "@/db/schema";
import { eq, and, or, isNull, gt } from "drizzle-orm";

export async function GET() {
  try {
    const now = new Date();

    // Fetch active coupons & promotional offers created by Admin
    const activeOffers = await db
      .select({
        id: offers.id,
        code: offers.code,
        name: offers.name,
        description: offers.description,
        discountType: offers.discountType,
        discountValue: offers.discountValue,
        minOrderAmount: offers.minOrderAmount,
        maxDiscount: offers.maxDiscount,
        startDate: offers.startDate,
        endDate: offers.endDate,
        usageLimit: offers.usageLimit,
        usageCount: offers.usageCount,
        campaignType: offers.campaignType,
      })
      .from(offers)
      .where(
        and(
          eq(offers.isActive, true),
          or(isNull(offers.endDate), gt(offers.endDate, now))
        )
      )
      .orderBy(offers.createdAt);

    // Format for customer consumption
    const customerCoupons = activeOffers
      .filter((o) => !o.usageLimit || o.usageCount < o.usageLimit)
      .map((o) => ({
        id: o.id,
        code: o.code || o.name,
        displayName: o.name,
        description: o.description,
        discountType: o.discountType,
        discountValue: o.discountValue,
        minOrderAmount: o.minOrderAmount || 0,
        maxDiscount: o.maxDiscount || null,
        endDate: o.endDate ? o.endDate.toISOString() : null,
        campaignType: o.campaignType,
        formattedDiscount:
          o.discountType === "PERCENTAGE"
            ? `${o.discountValue}% OFF`
            : `₹${o.discountValue} OFF`,
      }));

    return NextResponse.json({
      success: true,
      coupons: customerCoupons,
    });
  } catch (error: any) {
    console.error("GET /api/coupons error:", error);
    return NextResponse.json(
      { error: "Failed to fetch active coupons" },
      { status: 500 }
    );
  }
}
