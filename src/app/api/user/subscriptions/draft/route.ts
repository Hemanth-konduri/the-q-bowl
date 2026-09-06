import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/db";
import { subscriptionDrafts } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { SubscriptionService } from "@/lib/services/SubscriptionService";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Fetch existing active draft for user
    const draftRows = await db
      .select()
      .from(subscriptionDrafts)
      .where(eq(subscriptionDrafts.userId, session.userId))
      .limit(1);

    if (draftRows.length === 0) {
      return NextResponse.json({ draft: null, hasDraft: false });
    }

    const draft = draftRows[0];

    // Expiration check (24 Hours)
    if (draft.expiresAt && new Date(draft.expiresAt) <= now) {
      await db
        .update(subscriptionDrafts)
        .set({ status: "EXPIRED", updatedAt: now })
        .where(eq(subscriptionDrafts.id, draft.id));

      return NextResponse.json({ draft: null, hasDraft: false, isExpired: true });
    }

    if (draft.status !== "DRAFT") {
      return NextResponse.json({ draft: null, hasDraft: false });
    }

    // Recalculate live backend pricing
    let livePricing = null;
    try {
      livePricing = await SubscriptionService.calculateSubscriptionCheckout({
        userId: session.userId,
        packageId: draft.packageId || undefined,
        mealId: draft.mealId || undefined,
        mealCredits: draft.mealCredits,
        mealsPerDay: draft.mealsPerDay,
        mealTiming: draft.mealTiming,
        deliveryDays: draft.deliveryDays || [],
      });
    } catch (err) {
      console.warn("Failed to compute live pricing for draft restore:", err);
    }

    return NextResponse.json({
      hasDraft: true,
      draft,
      livePricing,
    });
  } catch (error: any) {
    console.error("GET Draft Error:", error);
    return NextResponse.json({ error: "Failed to fetch draft" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      currentStep = 1,
      mealId,
      packageId,
      isCustomCredits = false,
      customCredits,
      mealCredits = 10,
      mealsPerDay = 1,
      mealTiming = "LUNCH",
      startDate,
      deliveryDays = ["MON", "TUE", "WED", "THU", "FRI"],
      preferredTime = "12:00 PM - 1:00 PM",
      addressId,
      latitude,
      longitude,
      subtotal = 0,
      discount = 0,
      totalAmount = 0,
    } = body;

    const draftId = `subdraft-${session.userId}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 Hours expiration

    const draftData = {
      id: draftId,
      userId: session.userId,
      currentStep,
      mealId: mealId || null,
      packageId: packageId || null,
      isCustomCredits: Boolean(isCustomCredits),
      customCredits: customCredits ? Number(customCredits) : null,
      mealCredits: Number(mealCredits) || 10,
      mealsPerDay: Number(mealsPerDay) || 1,
      mealTiming,
      startDate: startDate || null,
      deliveryDays: Array.isArray(deliveryDays) ? deliveryDays : [],
      preferredTime,
      addressId: addressId || null,
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      subtotal: Number(subtotal) || 0,
      discount: Number(discount) || 0,
      totalAmount: Number(totalAmount) || 0,
      status: "DRAFT",
      lastSavedAt: now,
      expiresAt,
      updatedAt: now,
    };

    // Upsert (Insert or Update on conflict userId)
    await db
      .insert(subscriptionDrafts)
      .values(draftData)
      .onConflictDoUpdate({
        target: subscriptionDrafts.userId,
        set: {
          currentStep,
          mealId: mealId || null,
          packageId: packageId || null,
          isCustomCredits: Boolean(isCustomCredits),
          customCredits: customCredits ? Number(customCredits) : null,
          mealCredits: Number(mealCredits) || 10,
          mealsPerDay: Number(mealsPerDay) || 1,
          mealTiming,
          startDate: startDate || null,
          deliveryDays: Array.isArray(deliveryDays) ? deliveryDays : [],
          preferredTime,
          addressId: addressId || null,
          latitude: latitude ? Number(latitude) : null,
          longitude: longitude ? Number(longitude) : null,
          subtotal: Number(subtotal) || 0,
          discount: Number(discount) || 0,
          totalAmount: Number(totalAmount) || 0,
          status: "DRAFT",
          lastSavedAt: now,
          expiresAt,
          updatedAt: now,
        },
      });

    return NextResponse.json({
      success: true,
      lastSavedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error: any) {
    console.error("POST Draft Error:", error);
    return NextResponse.json({ error: "Failed to save draft" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db
      .delete(subscriptionDrafts)
      .where(eq(subscriptionDrafts.userId, session.userId));

    return NextResponse.json({ success: true, message: "Draft cleared." });
  } catch (error: any) {
    console.error("DELETE Draft Error:", error);
    return NextResponse.json({ error: "Failed to clear draft" }, { status: 500 });
  }
}
