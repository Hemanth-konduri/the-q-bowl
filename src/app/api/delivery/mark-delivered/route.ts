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
import { eq, or, sql } from "drizzle-orm";

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
      // Check if deliveryId corresponds to normalOrderDeliveries.id or orders.id
      let targetOrderId = deliveryId;

      const nRecord = await db
        .select()
        .from(normalOrderDeliveries)
        .where(or(eq(normalOrderDeliveries.id, deliveryId), eq(normalOrderDeliveries.orderId, deliveryId)))
        .limit(1);

      if (nRecord.length > 0) {
        targetOrderId = nRecord[0].orderId;
        await db
          .update(normalOrderDeliveries)
          .set({
            status: "DELIVERED",
            deliveredAt: now,
            updatedAt: now,
          })
          .where(eq(normalOrderDeliveries.id, nRecord[0].id));
      }

      // Fetch current QR token and update order
      const orderRows = await db
        .select({ qrToken: orders.qrToken })
        .from(orders)
        .where(eq(orders.id, targetOrderId))
        .limit(1);

      const currentQrToken = orderRows[0]?.qrToken || "VERIFIED_DELIVERY";

      await db
        .update(orders)
        .set({
          status: "DELIVERED",
          qrStatus: "USED",
          updatedAt: now,
        })
        .where(eq(orders.id, targetOrderId));

      // 3. Log into deliveryVerificationRecords
      try {
        const crypto = await import("crypto");
        const { deliveryVerificationRecords } = await import("@/db/schema");
        await db.insert(deliveryVerificationRecords).values({
          id: `verif-${crypto.randomUUID().slice(0, 8)}`,
          orderId: targetOrderId,
          deliveryPartnerId: partner.id,
          qrTokenScanned: currentQrToken,
          verificationResult: "SUCCESS",
          scannedAt: now,
          confirmedAt: now,
          notes: `Delivery completed and verified by partner ${partner.fullName || partner.id}`,
        });
      } catch (auditErr) {
        console.warn("Failed to write delivery verification audit:", auditErr);
      }

      // 4. Update delivery assignment
      await db
        .update(deliveryAssignments)
        .set({ status: "DELIVERED", updatedAt: now })
        .where(eq(deliveryAssignments.orderId, targetOrderId));
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
