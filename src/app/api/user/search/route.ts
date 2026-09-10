import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/db";
import { foodItems, orders } from "@/db/schema";
import { ilike, eq, and, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim() || "";

  if (!query) {
    return NextResponse.json({ results: { meals: [], orders: [] } });
  }

  try {
    const searchPattern = `%${query}%`;

    // 1. Search Bowls / Food items
    const foundMeals = await db
      .select({
        id: foodItems.id,
        name: foodItems.name,
        price: foodItems.price,
        isVeg: foodItems.isVeg,
        description: foodItems.description,
      })
      .from(foodItems)
      .where(
        and(
          ilike(foodItems.name, searchPattern),
          eq(foodItems.isAvailable, true)
        )
      )
      .limit(6);

    // 2. Search Customer's Orders
    const foundOrders = await db
      .select({
        id: orders.id,
        total: orders.total,
        status: orders.status,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(
        and(
          eq(orders.userId, session.userId),
          ilike(orders.id, searchPattern)
        )
      )
      .orderBy(desc(orders.createdAt))
      .limit(4);

    return NextResponse.json({
      results: {
        meals: foundMeals,
        orders: foundOrders,
      },
    });
  } catch (error) {
    console.error("Error searching customer data:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
