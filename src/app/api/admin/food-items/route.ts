import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { foodItems, categories, menuItems } from "@/db/schema";
import { requireAdminApi } from "@/lib/auth-guard";
import { deleteStorageFile } from "@/lib/supabase-storage";
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
        deliveryCharge: foodItems.deliveryCharge,
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
      deliveryCharge,
      calories,
      protein,
      isVeg,
      mealType,
      isAvailable,
    } = body;

    if (!categoryId || !name || price === undefined) {
      return NextResponse.json(
        { error: "Category, Name, and Price are required." },
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
      deliveryCharge: deliveryCharge !== undefined && deliveryCharge !== "" ? Number(deliveryCharge) : 0,
      calories: calories ? Number(calories) : 520,
      protein: protein || "30g",
      isVeg: Boolean(isVeg),
      mealType: (mealType || "LUNCH") as "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" | "OTHER",
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

    // Handle batch update array
    if (Array.isArray(body.items)) {
      for (const item of body.items) {
        if (item.id && typeof item.isAvailable === "boolean") {
          await db
            .update(foodItems)
            .set({ isAvailable: item.isAvailable, updatedAt: new Date() })
            .where(eq(foodItems.id, item.id));
        }
      }
      return NextResponse.json({ success: true, count: body.items.length });
    }

    const { id, isAvailable, price, deliveryCharge, categoryId, name, description, imageUrl, calories, protein, isVeg, mealType } = body;

    if (!id) return NextResponse.json({ error: "Food item ID is required." }, { status: 400 });

    const updateData: Record<string, unknown> = {};
    if (typeof isAvailable === "boolean") updateData.isAvailable = isAvailable;
    if (price !== undefined) updateData.price = Number(price);
    if (deliveryCharge !== undefined) updateData.deliveryCharge = deliveryCharge !== "" ? Number(deliveryCharge) : 0;
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

export async function DELETE(req: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");
    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body.id;
    }

    if (!id) return NextResponse.json({ error: "Food item ID is required." }, { status: 400 });

    const existing = await db.select().from(foodItems).where(eq(foodItems.id, id)).limit(1);
    if (existing.length === 0) {
      return NextResponse.json({ error: "Food item not found." }, { status: 404 });
    }

    const item = existing[0];

    // Remove from Supabase storage if image exists
    if (item.imageUrl) {
      await deleteStorageFile(item.imageUrl);
    }

    // Delete foreign key references in menuItems table if present
    await db.delete(menuItems).where(eq(menuItems.foodItemId, id)).catch(() => {});

    // Delete item permanently from food_items table
    await db.delete(foodItems).where(eq(foodItems.id, id));

    return NextResponse.json({ success: true, message: `Successfully deleted ${item.name}` });
  } catch (error: any) {
    console.error("Error deleting food item:", error);
    return NextResponse.json(
      { error: "Failed to delete food item: " + (error?.message || "") },
      { status: 500 }
    );
  }
}

