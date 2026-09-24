import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/db";
import { subscriptionPackages } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { requireAdminApi } from "@/lib/auth-guard";

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const packages = await withDbRetry(async () => {
      return await db
        .select()
        .from(subscriptionPackages)
        .orderBy(asc(subscriptionPackages.mealCredits));
    }, 2);

    return NextResponse.json({ packages });
  } catch (error: any) {
    console.error("Admin Packages GET Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch packages" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { id, name, mealCredits, discount = 0, isFeatured = false, isActive = true } = body;

    if (!name || !mealCredits || Number(mealCredits) <= 0) {
      return NextResponse.json(
        { error: "Package name and positive meal credits count are required." },
        { status: 400 }
      );
    }

    const creditsNum = Number(mealCredits);
    const discountNum = Math.max(0, Number(discount) || 0);

    // If marked featured, un-feature other packages
    if (isFeatured) {
      await db
        .update(subscriptionPackages)
        .set({ isFeatured: false })
        .where(eq(subscriptionPackages.isFeatured, true));
    }

    if (id) {
      const [updated] = await db
        .update(subscriptionPackages)
        .set({
          name: String(name).trim(),
          mealCredits: creditsNum,
          discount: discountNum,
          isFeatured: Boolean(isFeatured),
          isActive: Boolean(isActive),
          updatedAt: new Date(),
        })
        .where(eq(subscriptionPackages.id, id))
        .returning();

      return NextResponse.json({ success: true, package: updated });
    } else {
      const newId = `pkg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const [inserted] = await db
        .insert(subscriptionPackages)
        .values({
          id: newId,
          name: String(name).trim(),
          mealCredits: creditsNum,
          discount: discountNum,
          isFeatured: Boolean(isFeatured),
          isActive: Boolean(isActive),
        })
        .returning();

      return NextResponse.json({ success: true, package: inserted });
    }
  } catch (error: any) {
    console.error("Admin Packages POST Error:", error);
    return NextResponse.json({ error: error.message || "Failed to save package" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Package ID is required" }, { status: 400 });
    }

    await db.delete(subscriptionPackages).where(eq(subscriptionPackages.id, id));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Admin Packages DELETE Error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete package" }, { status: 500 });
  }
}
