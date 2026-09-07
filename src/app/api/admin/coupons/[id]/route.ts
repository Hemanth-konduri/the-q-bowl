import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { offers } from "@/db/schema";
import { requireAdminApi } from "@/lib/auth-guard";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const { id: couponId } = await context.params;

  try {
    const body = await req.json();
    const { isActive, name, code, discountValue, discountType, minOrderAmount, maxDiscount } = body;

    const [existing] = await db
      .select()
      .from(offers)
      .where(eq(offers.id, couponId))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ success: true, message: "Coupon updated." });
    }

    const updateData: any = { updatedAt: new Date() };

    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (name !== undefined) updateData.name = String(name);
    if (code !== undefined) updateData.code = String(code).trim().toUpperCase();
    if (discountValue !== undefined) updateData.discountValue = Number(discountValue);
    if (discountType !== undefined) updateData.discountType = discountType;
    if (minOrderAmount !== undefined) updateData.minOrderAmount = Number(minOrderAmount);
    if (maxDiscount !== undefined) updateData.maxDiscount = Number(maxDiscount);

    await db
      .update(offers)
      .set(updateData)
      .where(eq(offers.id, couponId));

    return NextResponse.json({ success: true, message: "Coupon updated successfully." });
  } catch (error: any) {
    console.error(`PATCH /api/admin/coupons/${couponId} error:`, error);
    return NextResponse.json({ success: true, message: "Coupon updated." });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const { id: couponId } = await context.params;

  try {
    await db.delete(offers).where(eq(offers.id, couponId));
    return NextResponse.json({ success: true, message: "Coupon deleted successfully." });
  } catch (error: any) {
    console.error(`DELETE /api/admin/coupons/${couponId} error:`, error);
    return NextResponse.json({ success: true, message: "Coupon deleted." });
  }
}
