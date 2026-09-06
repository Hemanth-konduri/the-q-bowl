import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { foodItems, categories } from "@/db/schema";
import { requireAdminApi } from "@/lib/auth-guard";
import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const list = await db
      .select({
        id: foodItems.id,
        categoryId: foodItems.categoryId,
        categoryName: categories.name,
        name: foodItems.name,
        description: foodItems.description,
        imageUrl: foodItems.imageUrl,
        price: foodItems.price,
        calories: foodItems.calories,
        protein: foodItems.protein,
        rating: foodItems.rating,
        isVeg: foodItems.isVeg,
        mealType: foodItems.mealType,
        isAvailable: foodItems.isAvailable,
        createdAt: foodItems.createdAt,
      })
      .from(foodItems)
      .leftJoin(categories, eq(foodItems.categoryId, categories.id))
      .orderBy(desc(foodItems.createdAt));

    return NextResponse.json(list);
  } catch (error) {
    console.error("Error fetching food items:", error);
    return NextResponse.json({ error: "Failed to fetch food items" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const {
      categoryId,
      name,
      description,
      imageUrl,
      price,
      calories,
      protein,
      isVeg,
      mealType,
      isAvailable,
    } = body;

    if (!categoryId || !name || price === undefined || !mealType) {
      return NextResponse.json(
        { error: "Category, Name, Price, and Meal Type are required." },
        { status: 400 }
      );
    }

    const id = `item-${nanoid(8)}`;
    await db.insert(foodItems).values({
      id,
      categoryId,
      name: name.trim(),
      description: description || null,
      imageUrl: imageUrl || null,
      price: Number(price),
      calories: calories ? Number(calories) : 520,
      protein: protein || "30g",
      isVeg: Boolean(isVeg),
      mealType: mealType as "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" | "OTHER",
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Error creating food item:", error);
    return NextResponse.json({ error: "Failed to create food item." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { id, isAvailable, price, categoryId, name, description, imageUrl, calories, protein, isVeg, mealType } = body;

    if (!id) return NextResponse.json({ error: "Food item ID is required." }, { status: 400 });

    const updateData: Record<string, unknown> = {};
    if (typeof isAvailable === "boolean") updateData.isAvailable = isAvailable;
    if (price !== undefined) updateData.price = Number(price);
    if (categoryId) updateData.categoryId = categoryId;
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (calories !== undefined) updateData.calories = Number(calories);
    if (protein !== undefined) updateData.protein = protein;
    if (typeof isVeg === "boolean") updateData.isVeg = isVeg;
    if (mealType) updateData.mealType = mealType;

    updateData.updatedAt = new Date();

    await db.update(foodItems).set(updateData).where(eq(foodItems.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating food item:", error);
    return NextResponse.json({ error: "Failed to update food item." }, { status: 500 });
  }
}
