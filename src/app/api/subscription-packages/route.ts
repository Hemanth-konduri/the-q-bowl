import { NextResponse } from "next/server";
import { db } from "@/db";
import { subscriptionPackages } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const packages = await db
      .select({
        id: subscriptionPackages.id,
        name: subscriptionPackages.name,
        mealCredits: subscriptionPackages.mealCredits,
        discount: subscriptionPackages.discount,
        isFeatured: subscriptionPackages.isFeatured,
        isActive: subscriptionPackages.isActive,
      })
      .from(subscriptionPackages)
      .where(eq(subscriptionPackages.isActive, true))
      .orderBy(asc(subscriptionPackages.mealCredits));

    return NextResponse.json({
      success: true,
      packages,
    });
  } catch (error: any) {
    console.error("GET /api/subscription-packages error:", error);
    return NextResponse.json(
      {
        success: false,
        packages: [
          { id: "pkg_20", name: "20 Meal Credits", mealCredits: 20, discount: 0, isFeatured: true, isActive: true },
          { id: "pkg_60", name: "60 Meal Credits", mealCredits: 60, discount: 300, isFeatured: false, isActive: true },
          { id: "pkg_80", name: "80 Meal Credits", mealCredits: 80, discount: 300, isFeatured: false, isActive: true },
        ],
      },
      { status: 200 }
    );
  }
}
