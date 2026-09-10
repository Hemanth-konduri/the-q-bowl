import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, orders, orderItems, customerFeedback, subscriptionDeliveries, subscriptions, foodItems } from "@/db/schema";
import { eq, and, desc, or } from "drizzle-orm";
import { getSession } from "@/lib/session";

// GET /api/user/feedback
// Returns pending feedback card (if any) and list of reviewed order IDs
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch user's submitted feedback entries to get reviewed order IDs
    const existingFeedback = await db
      .select({ orderId: customerFeedback.orderId, subscriptionId: customerFeedback.subscriptionId })
      .from(customerFeedback)
      .where(eq(customerFeedback.userId, session.userId));

    const reviewedOrderIds = existingFeedback
      .map((f) => f.orderId)
      .filter((id): id is string => Boolean(id));

    // 2. Fetch delivered normal orders for the user
    const userDeliveredOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.userId, session.userId),
          eq(orders.status, "DELIVERED")
        )
      )
      .orderBy(desc(orders.createdAt));

    // 3. Find the most recent delivered order that hasn't been reviewed yet
    const pendingOrder = userDeliveredOrders.find((ord) => !reviewedOrderIds.includes(ord.id));

    let pendingFeedbackCardData = null;
    if (pendingOrder) {
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, pendingOrder.id));

      pendingFeedbackCardData = {
        orderId: pendingOrder.id,
        deliveryDate: pendingOrder.createdAt
          ? new Date(pendingOrder.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
          : "Recent",
        mealType: "Gourmet Meal Dispatch",
        foodItemName: items.map((i) => i.name).join(", ") || "Q Bowl Gourmet Dish",
        itemCount: items.reduce((acc, i) => acc + i.quantity, 0) || 1,
      };
    }

    // If no pending normal order, check subscription deliveries
    if (!pendingFeedbackCardData) {
      const subDeliveries = await db
        .select({
          id: subscriptionDeliveries.id,
          deliveredAt: subscriptionDeliveries.deliveredAt,
          mealType: subscriptionDeliveries.mealType,
          mealName: foodItems.name,
        })
        .from(subscriptionDeliveries)
        .innerJoin(subscriptions, eq(subscriptionDeliveries.subscriptionId, subscriptions.id))
        .leftJoin(foodItems, eq(subscriptionDeliveries.mealId, foodItems.id))
        .where(
          and(
            eq(subscriptions.userId, session.userId),
            eq(subscriptionDeliveries.status, "DELIVERED")
          )
        )
        .orderBy(desc(subscriptionDeliveries.deliveredAt), desc(subscriptionDeliveries.createdAt))
        .limit(1);

      if (subDeliveries.length > 0 && !reviewedOrderIds.includes(subDeliveries[0].id)) {
        const sd = subDeliveries[0];
        pendingFeedbackCardData = {
          orderId: sd.id,
          deliveryDate: sd.deliveredAt
            ? new Date(sd.deliveredAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
            : "Recent",
          mealType: `${sd.mealType || "Subscription"} Delivery`,
          foodItemName: sd.mealName || "Artisan Subscription Bowl",
          itemCount: 1,
        };
      }
    }

    return NextResponse.json({
      pendingFeedbackCard: pendingFeedbackCardData,
      reviewedOrderIds,
    });
  } catch (error) {
    console.error("GET /api/user/feedback error:", error);
    return NextResponse.json({ error: "Failed to fetch user feedback status" }, { status: 500 });
  }
}

// POST /api/user/feedback
// Submit post-delivery feedback for an order or delivery
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, rating = 5, foodRating = 5, deliveryRating = 5, comment = "" } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required." }, { status: 400 });
    }

    // 1. Fetch user info
    const userList = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    const userName = userList[0]?.name || "Customer";

    // 2. Safely resolve order or subscription delivery
    let validOrderId: string | null = null;
    let validSubscriptionId: string | null = null;
    let foodItemIdToStore: string | null = null;

    const targetOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (targetOrders.length > 0) {
      validOrderId = targetOrders[0].id;
      // Fetch associated food item
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, validOrderId))
        .limit(1);
      foodItemIdToStore = items[0]?.foodItemId || null;
    } else {
      // Check subscription deliveries
      const subDeliveries = await db
        .select()
        .from(subscriptionDeliveries)
        .where(eq(subscriptionDeliveries.id, orderId))
        .limit(1);

      if (subDeliveries.length > 0) {
        validSubscriptionId = subDeliveries[0].subscriptionId;
        foodItemIdToStore = subDeliveries[0].mealId || null;
      }
    }

    // 3. Check if feedback already exists for this user and orderId
    const existing = await db
      .select({ id: customerFeedback.id })
      .from(customerFeedback)
      .where(
        and(
          eq(customerFeedback.userId, session.userId),
          validOrderId
            ? eq(customerFeedback.orderId, validOrderId)
            : eq(customerFeedback.comment, comment.trim())
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Feedback has already been submitted for this order." },
        { status: 400 }
      );
    }

    // 4. Insert feedback entry into DB
    const newId = `fb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    await db.insert(customerFeedback).values({
      id: newId,
      userId: session.userId,
      orderId: validOrderId, // Set to valid FK in orders or null if mock/sub ID to prevent foreign key failure
      subscriptionId: validSubscriptionId,
      foodItemId: foodItemIdToStore,
      customerName: userName,
      category: "MEAL_REVIEW",
      rating: Math.min(5, Math.max(1, Number(rating))),
      foodRating: Math.min(5, Math.max(1, Number(foodRating))),
      deliveryRating: Math.min(5, Math.max(1, Number(deliveryRating))),
      comment: comment.trim() || "Great gourmet meal experience!",
      isResolved: true,
      isFeatured: false,
    });

    return NextResponse.json({ success: true, feedbackId: newId });
  } catch (error) {
    console.error("POST /api/user/feedback error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit feedback." },
      { status: 500 }
    );
  }
}

