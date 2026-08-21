import { NextResponse } from "next/server";
import { db } from "@/db";
import { foodItems, categories } from "@/db/schema";
import { eq, ne } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const mealRows = await db
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
      .where(eq(foodItems.id, id))
      .limit(1);

    if (mealRows.length === 0) {
      return NextResponse.json({ error: "Meal not found" }, { status: 404 });
    }

    const meal = mealRows[0];

    // Synthetic nutrition and ingredients based on food type
    const ingredients = [
      "Organic Grain Base (Quinoa & Brown Rice)",
      "Farm-Fresh Flame Roasted Vegetables",
      "Hand-pressed Artisanal Sauce",
      "Micro-greens & Cold-pressed Olive Drizzle",
      "Himalayan Pink Salt & Roasted Seeds",
    ];

    const nutrition = {
      calories: meal.calories || 520,
      protein: meal.protein || "32g",
      carbs: "58g",
      fat: "14g",
      fiber: "8g",
    };

    // Recommended meals in same category or generally available
    const recommended = await db
      .select({
        id: foodItems.id,
        name: foodItems.name,
        description: foodItems.description,
        imageUrl: foodItems.imageUrl,
        price: foodItems.price,
        calories: foodItems.calories,
        rating: foodItems.rating,
        isVeg: foodItems.isVeg,
      })
      .from(foodItems)
      .where(ne(foodItems.id, id))
      .limit(3);

    return NextResponse.json({
      meal,
      ingredients,
      nutrition,
      recommended,
    });
  } catch (error) {
    console.error("Meal Detail GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch meal details" }, { status: 500 });
  }
}
