import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { requireAdminApi } from "@/lib/auth-guard";
import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const list = await db.select().from(categories).orderBy(desc(categories.createdAt));
    return NextResponse.json(list);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const { name, isActive } = await req.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Category name is required." }, { status: 400 });
    }

    const id = `cat-${nanoid(8)}`;
    await db.insert(categories).values({
      id,
      name: name.trim(),
      isActive: typeof isActive === "boolean" ? isActive : true,
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json({ error: "Failed to create category." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const { id, name, isActive } = await req.json();
    if (!id) return NextResponse.json({ error: "Category ID required." }, { status: 400 });

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (isActive !== undefined) updateData.isActive = isActive;
    updateData.updatedAt = new Date();

    await db.update(categories).set(updateData).where(eq(categories.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json({ error: "Failed to update category." }, { status: 500 });
  }
}
