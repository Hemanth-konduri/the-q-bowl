import { NextResponse } from "next/server";
import { requireDeliveryPartnerApi } from "@/lib/auth-guard";
import { db } from "@/db";
import {
  orders,
  orderItems,
  normalOrderDeliveries,
  deliveryPartners,
  deliveryAssignments,
  deliveryVerificationRecords,
  users,
  addresses,
} from "@/db/schema";
import { eq, and, or } from "drizzle-orm";
import { formatOrderId } from "@/lib/utils/orderIdFormatter";

export async function POST(req: Request) {
  try {
    const { partner } = await requireDeliveryPartnerApi();
    const body = await req.json();
    const { qrToken } = body;

    if (!qrToken || typeof qrToken !== "string" || !qrToken.trim()) {
      return NextResponse.json(
        { error: "Invalid QR code. Please scan a valid Q-Bowl delivery verification code." },
        { status: 400 }
      );
    }

    const trimmedToken = qrToken.trim();

    // 1. Locate order by qrToken
    const orderRows = await db
      .select({
        id: orders.id,
        status: orders.status,
        type: orders.type,
        subtotal: orders.subtotal,
        deliveryFee: orders.deliveryFee,
        discount: orders.discount,
        total: orders.total,
        qrToken: orders.qrToken,
        qrStatus: orders.qrStatus,
        createdAt: orders.createdAt,
        userId: orders.userId,
        userName: users.name,
        userPhone: users.phone,
        userEmail: users.email,
        addressLabel: addresses.label,
        addressString: addresses.address,
        recipientName: addresses.recipientName,
        recipientPhone: addresses.recipientPhone,
        area: addresses.area,
        city: addresses.city,
        pincode: addresses.pincode,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .leftJoin(addresses, eq(orders.addressId, addresses.id))
      .where(eq(orders.qrToken, trimmedToken))
      .limit(1);

    if (orderRows.length === 0) {
      return NextResponse.json(
        { error: "Invalid or unauthorized QR code. This order cannot be verified." },
        { status: 404 }
      );
    }

    const orderData = orderRows[0];

    // 2. Verify Delivery Partner Assignment
    // Check normalOrderDeliveries for this order & partner
    const deliveryAssignmentRows = await db
      .select({
        id: normalOrderDeliveries.id,
        orderId: normalOrderDeliveries.orderId,
        deliveryPartnerId: normalOrderDeliveries.deliveryPartnerId,
        status: normalOrderDeliveries.status,
        deliveredAt: normalOrderDeliveries.deliveredAt,
      })
      .from(normalOrderDeliveries)
      .where(eq(normalOrderDeliveries.orderId, orderData.id))
      .limit(1);

    // If assigned to a partner, verify partner match
    if (
      deliveryAssignmentRows.length > 0 &&
      deliveryAssignmentRows[0].deliveryPartnerId &&
      deliveryAssignmentRows[0].deliveryPartnerId !== partner.id
    ) {
      return NextResponse.json(
        {
          error:
            "Unauthorized: This order is assigned to a different delivery partner. You cannot verify or deliver this order.",
        },
        { status: 403 }
      );
    }

    // 3. Verify Order Status & Single-Use Rules
    if (orderData.status === "DELIVERED" || orderData.qrStatus === "USED") {
      return NextResponse.json(
        {
          error:
            "This QR code has already been used. The order has already been marked as Delivered.",
        },
        { status: 400 }
      );
    }

    if (orderData.status === "CANCELLED" || orderData.status === "FAILED") {
      return NextResponse.json(
        {
          error: `Cannot deliver this order because it is currently ${orderData.status}.`,
        },
        { status: 400 }
      );
    }

    // 4. Fetch Order Dishes
    const items = await db
      .select({
        id: orderItems.id,
        name: orderItems.name,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        totalPrice: orderItems.totalPrice,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderData.id));

    const now = new Date();

    // 5. Automatically mark the order as DELIVERED upon valid QR scan
    await db
      .update(orders)
      .set({
        status: "DELIVERED",
        qrStatus: "USED",
        updatedAt: now,
      })
      .where(eq(orders.id, orderData.id));

    // Update normal order deliveries table if exists
    await db
      .update(normalOrderDeliveries)
      .set({
        status: "DELIVERED",
        deliveredAt: now,
        updatedAt: now,
      })
      .where(
        or(
          eq(normalOrderDeliveries.orderId, orderData.id),
          eq(normalOrderDeliveries.id, deliveryAssignmentRows[0]?.id || "")
        )
      );

    // Update delivery assignments if exists
    await db
      .update(deliveryAssignments)
      .set({
        status: "DELIVERED",
        deliveredAt: now,
        updatedAt: now,
      })
      .where(eq(deliveryAssignments.orderId, orderData.id));

    // 6. Record scan & delivery confirmation in audit records
    try {
      const crypto = await import("crypto");
      await db.insert(deliveryVerificationRecords).values({
        id: `verif-${crypto.randomUUID().slice(0, 8)}`,
        orderId: orderData.id,
        deliveryPartnerId: partner.id,
        qrTokenScanned: trimmedToken,
        verificationResult: "SUCCESS",
        scannedAt: now,
        confirmedAt: now,
        notes: `QR scanned & automatically delivered by partner ${partner.fullName || partner.id}`,
      });
    } catch (auditErr) {
      console.warn("Failed to log scan audit:", auditErr);
    }

    const resolvedCustomerName = orderData.recipientName?.trim() || orderData.userName || "Customer";
    const resolvedCustomerPhone = orderData.recipientPhone?.trim() || orderData.userPhone || "N/A";

    return NextResponse.json({
      success: true,
      delivered: true,
      deliveredAt: now.toISOString(),
      order: {
        id: orderData.id,
        orderId: orderData.id,
        orderIdDisplay: formatOrderId(orderData.id),
        status: "DELIVERED",
        qrStatus: "USED",
        customer: {
          name: resolvedCustomerName,
          phone: resolvedCustomerPhone,
          email: orderData.userEmail || "",
          address: orderData.addressString || "Customer Address",
          area: orderData.area || "",
          city: orderData.city || "",
        },
        customerName: resolvedCustomerName,
        customerPhone: resolvedCustomerPhone,
        customerEmail: orderData.userEmail || "",
        totalAmount: orderData.total,
        subtotal: orderData.subtotal,
        deliveryFee: orderData.deliveryFee || 0,
        discount: orderData.discount || 0,
        address: `${orderData.addressString || ""}, ${orderData.area || ""}, ${orderData.city || ""}`.replace(
          /^,\s*/,
          ""
        ),
        addressLabel: orderData.addressLabel || "Home",
        items: Array.isArray(items) ? items : [],
        qrToken: orderData.qrToken,
        deliveryId: deliveryAssignmentRows[0]?.id || `nord-${orderData.id.slice(-6)}`,
      },
    });
  } catch (error: any) {
    console.error("QR Verify API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify QR code" },
      { status: 500 }
    );
  }
}

