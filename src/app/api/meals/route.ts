import { NextResponse } from "next/server";
import { db } from "@/db";
import { foodItems, categories } from "@/db/schema";
import { eq, and, ilike } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const categoryId = searchParams.get("categoryId");
    const isVeg = searchParams.get("isVeg");
    const mealType = searchParams.get("mealType");

    const allCategories = await db.select().from(categories).where(eq(categories.isActive, true));

    const items = await db
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
      })
      .from(foodItems)
      .leftJoin(categories, eq(foodItems.categoryId, categories.id))
      .where(eq(foodItems.isAvailable, true));

    let filteredItems = items;

    if (search) {
      const q = search.toLowerCase();
      filteredItems = filteredItems.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.categoryName?.toLowerCase().includes(q)
      );
    }

    if (categoryId && categoryId !== "ALL") {
      filteredItems = filteredItems.filter((item) => item.categoryId === categoryId);
    }

    if (isVeg !== null && isVeg !== undefined && isVeg !== "") {
      const vegBool = isVeg === "true";
      filteredItems = filteredItems.filter((item) => item.isVeg === vegBool);
    }

    if (mealType && mealType !== "ALL") {
      filteredItems = filteredItems.filter((item) => item.mealType === mealType);
    }

    return NextResponse.json({
      categories: allCategories,
      meals: filteredItems,
    });
  } catch (error) {
    console.error("Meals GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch meals" }, { status: 500 });
  }
}
