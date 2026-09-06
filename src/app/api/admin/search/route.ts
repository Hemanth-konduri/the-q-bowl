import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-guard";
import { db } from "@/db";
import { users, orders, foodItems } from "@/db/schema";
import { ilike, or, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim() || "";

  if (!query) {
    return NextResponse.json({ results: { customers: [], orders: [], menu: [] } });
  }

  try {
    const searchPattern = `%${query}%`;

    // 1. Search Customers (Users)
    const foundUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
      })
      .from(users)
      .where(
        or(
          ilike(users.name, searchPattern),
          ilike(users.email, searchPattern),
          ilike(users.phone, searchPattern)
        )
      )
      .limit(5);

    // 2. Search Orders
    const foundOrders = await db
      .select({
        id: orders.id,
        total: orders.total,
        status: orders.status,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(ilike(orders.id, searchPattern))
      .orderBy(desc(orders.createdAt))
      .limit(5);

    // 3. Search Food Items / Menu
    const foundItems = await db
      .select({
        id: foodItems.id,
        name: foodItems.name,
        price: foodItems.price,
        isVeg: foodItems.isVeg,
      })
      .from(foodItems)
      .where(ilike(foodItems.name, searchPattern))
      .limit(5);

    return NextResponse.json({
      results: {
        customers: foundUsers,
        orders: foundOrders,
        menu: foundItems,
      },
    });
  } catch (error) {
    console.error("Error searching admin data:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
