import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customerFeedback, users, orders, subscriptions, foodItems } from "@/db/schema";
import { requireAdminApi } from "@/lib/auth-guard";
import { count, sql, desc, eq, and, ilike, or } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "ALL";
  const rating = searchParams.get("rating") || "ALL";
  const dishId = searchParams.get("dishId") || "ALL";

  try {
    const rawList = await db
      .select({
        id: customerFeedback.id,
        userId: customerFeedback.userId,
        orderId: customerFeedback.orderId,
        subscriptionId: customerFeedback.subscriptionId,
        foodItemId: customerFeedback.foodItemId,
        customerName: customerFeedback.customerName,
        category: customerFeedback.category,
        rating: customerFeedback.rating,
        foodRating: customerFeedback.foodRating,
        deliveryRating: customerFeedback.deliveryRating,
        comment: customerFeedback.comment,
        isResolved: customerFeedback.isResolved,
        isFeatured: customerFeedback.isFeatured,
        adminReply: customerFeedback.adminReply,
        repliedAt: customerFeedback.repliedAt,
        createdAt: customerFeedback.createdAt,
        updatedAt: customerFeedback.updatedAt,
        userEmail: users.email,
        foodItemName: foodItems.name,
      })
      .from(customerFeedback)
      .leftJoin(users, eq(customerFeedback.userId, users.id))
      .leftJoin(foodItems, eq(customerFeedback.foodItemId, foodItems.id))
      .orderBy(desc(customerFeedback.createdAt))
      .limit(300);

    const feedbackList = rawList;

    // 1. Calculate Real KPI Metrics from Database
    const totalFeedback = feedbackList.length;
    const avgRatingVal =
      totalFeedback > 0
        ? (feedbackList.reduce((acc, f) => acc + (f.rating || 5), 0) / totalFeedback).toFixed(1)
        : "0.0";
    const fiveStarCount = feedbackList.filter((f) => f.rating === 5).length;
    const negativeCount = feedbackList.filter((f) => f.rating <= 2).length;
    const feedbackTodayCount = feedbackList.filter(
      (f) => new Date(f.createdAt).toDateString() === new Date().toDateString()
    ).length;

    // 2. Dish Rating Insights Grouping (Real Database Items)
    const dishMap: Record<string, { id: string; name: string; totalReviews: number; totalRating: number; recentReview: string }> = {};

    feedbackList.forEach((f) => {
      const dishName = f.foodItemName || "Artisan Bowl";
      if (!dishMap[dishName]) {
        dishMap[dishName] = {
          id: f.foodItemId || dishName,
          name: dishName,
          totalReviews: 0,
          totalRating: 0,
          recentReview: f.comment,
        };
      }
      dishMap[dishName].totalReviews += 1;
      dishMap[dishName].totalRating += f.rating || 5;
    });

    const dishInsights = Object.values(dishMap).map((d) => ({
      id: d.id,
      name: d.name,
      totalReviews: d.totalReviews,
      avgRating: (d.totalRating / d.totalReviews).toFixed(1),
      recentReview: d.recentReview,
    }));

    // 3. Filter list according to request criteria
    const filteredFeedback = feedbackList.filter((f) => {
      if (category !== "ALL" && f.category?.toUpperCase() !== category.toUpperCase()) return false;
      if (rating !== "ALL" && String(f.rating) !== rating) return false;
      if (dishId !== "ALL" && f.foodItemId !== dishId && f.foodItemName !== dishId) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = f.customerName?.toLowerCase().includes(q);
        const matchesComment = f.comment?.toLowerCase().includes(q);
        const matchesRef = f.orderId?.toLowerCase().includes(q) || f.subscriptionId?.toLowerCase().includes(q);
        if (!matchesName && !matchesComment && !matchesRef) return false;
      }
      return true;
    });

    return NextResponse.json({
      summary: {
        totalFeedback,
        averageRating: avgRatingVal,
        fiveStarCount,
        negativeCount,
        feedbackTodayCount,
      },
      dishInsights,
      feedback: filteredFeedback,
    });
  } catch (error: any) {
    console.error("GET /api/admin/feedback error:", error);
    return NextResponse.json(
      { error: "Failed to fetch real feedback records." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, orderId, subscriptionId, foodItemId, customerName, category, rating, comment } = body;

    if (!customerName || !comment) {
      return NextResponse.json({ error: "Customer name and comment are required." }, { status: 400 });
    }

    const newId = `fb_${crypto.randomUUID().slice(0, 8)}`;
    await db.insert(customerFeedback).values({
      id: newId,
      userId: userId || null,
      orderId: orderId || null,
      subscriptionId: subscriptionId || null,
      foodItemId: foodItemId || null,
      customerName,
      category: category || "MEAL_REVIEW",
      rating: Number(rating || 5),
      comment,
      isResolved: false,
      isFeatured: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true, feedbackId: newId });
  } catch (error: any) {
    console.error("POST /api/admin/feedback error:", error);
    return NextResponse.json({ error: "Failed to post feedback." }, { status: 500 });
  }
}
