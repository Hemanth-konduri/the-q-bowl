import { NextResponse } from "next/server";
import { db } from "@/db";
import { offers } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, subtotal } = body;

    if (!code) {
      return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
    }

    const offerRows = await db
      .select()
      .from(offers)
      .where(and(eq(offers.name, code.trim().toUpperCase()), eq(offers.isActive, true)))
      .limit(1);

    if (offerRows.length === 0) {
      return NextResponse.json({ error: "Invalid or expired coupon code" }, { status: 404 });
    }

    const offer = offerRows[0];

    if (offer.minOrderAmount && subtotal < offer.minOrderAmount) {
      return NextResponse.json(
        {
          error: `Coupon requires a minimum order subtotal of ₹${offer.minOrderAmount}`,
        },
        { status: 400 }
      );
    }

    let discount = 0;
    if (offer.discountType === "PERCENTAGE") {
      discount = (subtotal * offer.discountValue) / 100;
      if (offer.maxDiscount) {
        discount = Math.min(discount, offer.maxDiscount);
      }
    } else {
      discount = offer.discountValue;
    }

    return NextResponse.json({
      valid: true,
      offerId: offer.id,
      code: offer.name,
      discount,
      message: `Coupon '${offer.name}' applied! Saved ₹${discount}`,
    });
  } catch (error) {
    console.error("Coupon Validation Error:", error);
    return NextResponse.json({ error: "Failed to validate coupon" }, { status: 500 });
  }
}
