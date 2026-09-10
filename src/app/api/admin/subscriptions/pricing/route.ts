import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subscriptionMealPricing, foodItems, categories } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-guard";

export async function GET() {
  try {
    await requireAdmin();

    const pricings = await db
      .select({
        id: subscriptionMealPricing.id,
        mealId: subscriptionMealPricing.mealId,
        pricePerMeal: subscriptionMealPricing.pricePerMeal,
        isActive: subscriptionMealPricing.isActive,
        createdAt: subscriptionMealPricing.createdAt,
        updatedAt: subscriptionMealPricing.updatedAt,
        mealName: foodItems.name,
        mealDescription: foodItems.description,
        mealImageUrl: foodItems.imageUrl,
        mealCalories: foodItems.calories,
        mealIsVeg: foodItems.isVeg,
        standardPrice: foodItems.price,
        categoryName: categories.name,
      })
      .from(subscriptionMealPricing)
      .leftJoin(foodItems, eq(subscriptionMealPricing.mealId, foodItems.id))
      .leftJoin(categories, eq(foodItems.categoryId, categories.id))
      .orderBy(desc(subscriptionMealPricing.createdAt));

    return NextResponse.json({ pricings });
  } catch (error: any) {
    console.error("Admin Pricing GET Error:", error);
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json();
    const { id, mealId, pricePerMeal, isActive = true } = body;

    if (!mealId || pricePerMeal === undefined || Number(pricePerMeal) <= 0) {
      return NextResponse.json(
        { error: "Valid Meal ID and Price per meal (> 0) are required." },
        { status: 400 }
      );
    }

    const numericPrice = Number(pricePerMeal);

    if (id) {
      const [updated] = await db
        .update(subscriptionMealPricing)
        .set({
          mealId,
          pricePerMeal: numericPrice,
          isActive: Boolean(isActive),
          updatedAt: new Date(),
        })
        .where(eq(subscriptionMealPricing.id, id))
        .returning();

      return NextResponse.json({ success: true, pricing: updated });
    } else {
      const existing = await db
        .select()
        .from(subscriptionMealPricing)
        .where(eq(subscriptionMealPricing.mealId, mealId))
        .limit(1);

      if (existing.length > 0) {
        const [updated] = await db
          .update(subscriptionMealPricing)
          .set({
            pricePerMeal: numericPrice,
            isActive: Boolean(isActive),
            updatedAt: new Date(),
          })
          .where(eq(subscriptionMealPricing.id, existing[0].id))
          .returning();

        return NextResponse.json({ success: true, pricing: updated });
      }

      const newId = `smp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const [inserted] = await db
        .insert(subscriptionMealPricing)
        .values({
          id: newId,
          mealId,
          pricePerMeal: numericPrice,
          isActive: Boolean(isActive),
        })
        .returning();

      return NextResponse.json({ success: true, pricing: inserted });
    }
  } catch (error: any) {
    console.error("Admin Pricing POST Error:", error);
    return NextResponse.json({ error: error.message || "Failed to save pricing" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");
    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body.id;
    }

    if (!id) {
      return NextResponse.json({ error: "Pricing ID is required" }, { status: 400 });
    }

    await db.delete(subscriptionMealPricing).where(eq(subscriptionMealPricing.id, id));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Admin Pricing DELETE Error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete pricing" }, { status: 500 });
  }
}

