import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { menus, menuItems, foodItems } from "@/db/schema";
import { requireAdminApi } from "@/lib/auth-guard";
import { eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date") || new Date().toISOString().split("T")[0];

  try {
    const existingMenu = await db
      .select()
      .from(menus)
      .where(eq(menus.date, dateStr))
      .limit(1);

    if (!existingMenu.length) {
      return NextResponse.json({ date: dateStr, isActive: false, items: [] });
    }

    const items = await db
      .select({
        id: menuItems.id,
        foodItemId: menuItems.foodItemId,
        name: foodItems.name,
        price: foodItems.price,
        imageUrl: foodItems.imageUrl,
        isVeg: foodItems.isVeg,
        mealType: foodItems.mealType,
      })
      .from(menuItems)
      .leftJoin(foodItems, eq(menuItems.foodItemId, foodItems.id))
      .where(eq(menuItems.menuId, existingMenu[0].id));

    return NextResponse.json({
      id: existingMenu[0].id,
      date: dateStr,
      isActive: existingMenu[0].isActive,
      items,
    });
  } catch (error) {
    console.error("Error fetching daily menu:", error);
    return NextResponse.json({ error: "Failed to fetch menu." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const { date, isActive, selectedFoodItemIds } = await req.json();

    if (!date || !Array.isArray(selectedFoodItemIds)) {
      return NextResponse.json({ error: "Date and food item IDs are required." }, { status: 400 });
    }

    let [menu] = await db.select().from(menus).where(eq(menus.date, date)).limit(1);

    if (!menu) {
      const menuId = `menu-${nanoid(8)}`;
      const [inserted] = await db
        .insert(menus)
        .values({
          id: menuId,
          date,
          isActive: typeof isActive === "boolean" ? isActive : true,
        })
        .returning();
      menu = inserted;
    } else if (typeof isActive === "boolean") {
      await db.update(menus).set({ isActive, updatedAt: new Date() }).where(eq(menus.id, menu.id));
    }

    // Replace menu items
    await db.delete(menuItems).where(eq(menuItems.menuId, menu.id));

    if (selectedFoodItemIds.length > 0) {
      const menuItemsToInsert = selectedFoodItemIds.map((itemId: string) => ({
        id: `mi-${nanoid(8)}`,
        menuId: menu.id,
        foodItemId: itemId,
      }));

      await db.insert(menuItems).values(menuItemsToInsert);
    }

    return NextResponse.json({ success: true, menuId: menu.id });
  } catch (error) {
    console.error("Error saving daily menu:", error);
    return NextResponse.json({ error: "Failed to save daily menu." }, { status: 500 });
  }
}
