import { NextResponse } from "next/server";
import { requireDeliveryPartnerApi } from "@/lib/auth-guard";
import { db } from "@/db";
import {
  subscriptionDeliveries,
  subscriptions,
  normalOrderDeliveries,
  orders,
  deliveryAssignments,
} from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { partner } = await requireDeliveryPartnerApi();
    const body = await req.json();
    const { deliveryId, deliveryType } = body;

    if (!deliveryId) {
      return NextResponse.json({ error: "deliveryId is required" }, { status: 400 });
    }

    const now = new Date();

    if (deliveryType === "NORMAL") {
      // 1. Mark Normal Order Delivery completed
      await db
        .update(normalOrderDeliveries)
        .set({
          status: "DELIVERED",
          deliveredAt: now,
          updatedAt: now,
        })
        .where(eq(normalOrderDeliveries.id, deliveryId));

      // 2. Fetch orderId & update order status
      const nRecord = await db
        .select()
        .from(normalOrderDeliveries)
        .where(eq(normalOrderDeliveries.id, deliveryId))
        .limit(1);

      if (nRecord.length > 0) {
        await db
          .update(orders)
          .set({ status: "DELIVERED", updatedAt: now })
          .where(eq(orders.id, nRecord[0].orderId));
      }

      // 3. Update delivery assignment
      await db
        .update(deliveryAssignments)
        .set({ status: "DELIVERED", updatedAt: now })
        .where(eq(deliveryAssignments.orderId, nRecord[0]?.orderId || deliveryId));
    } else {
      // 1. Mark Subscription Delivery completed
      const subDelList = await db
        .select()
        .from(subscriptionDeliveries)
        .where(eq(subscriptionDeliveries.id, deliveryId))
        .limit(1);

      if (subDelList.length > 0) {
        const subDel = subDelList[0];

        await db
          .update(subscriptionDeliveries)
          .set({
            status: "DELIVERED",
            deliveredAt: now,
            updatedAt: now,
          })
          .where(eq(subscriptionDeliveries.id, deliveryId));

        // 2. Deduct credit & increment mealsUsed on Subscription
        await db
          .update(subscriptions)
          .set({
            mealsUsed: sql`${subscriptions.mealsUsed} + 1`,
            mealsRemaining: sql`GREATEST(0, ${subscriptions.mealsRemaining} - 1)`,
            updatedAt: now,
          })
          .where(eq(subscriptions.id, subDel.subscriptionId));

        // 3. Update delivery assignment
        await db
          .update(deliveryAssignments)
          .set({ status: "DELIVERED", updatedAt: now })
          .where(eq(deliveryAssignments.subscriptionDeliveryId, deliveryId));
      }
    }

    return NextResponse.json({
      success: true,
      message: "Delivery marked as delivered successfully.",
      deliveredAt: now.toISOString(),
    });
  } catch (error: any) {
    console.error("Mark Delivered API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to mark delivery as completed" }, { status: 500 });
  }
}
