import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  deliveryBatches,
  deliveryManifest,
  deliveryPartners,
  users,
  foodItems,
  addresses,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { BatchService } from "@/lib/services/batchService";

// GET /api/delivery/batches - Fetch assigned batches & customer delivery list for delivery partner
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const partnerId = searchParams.get("partnerId");
    const targetDate = searchParams.get("date") || new Date().toISOString().split("T")[0];

    // Fetch batches assigned to partner (or all active if no partnerId filter)
    let batchesQuery = db
      .select({
        id: deliveryBatches.id,
        name: deliveryBatches.name,
        mealSlot: deliveryBatches.mealSlot,
        deliveryTime: deliveryBatches.deliveryTime,
        status: deliveryBatches.status,
        assignedPartnerId: deliveryBatches.assignedPartnerId,
      })
      .from(deliveryBatches)
      .where(eq(deliveryBatches.isActive, true));

    const batches = await batchesQuery;

    // Filter batches if partnerId provided
    const relevantBatches = partnerId
      ? batches.filter((b) => b.assignedPartnerId === partnerId)
      : batches;

    // Fetch manifest entries for relevant batches
    const manifestItems = await db
      .select({
        id: deliveryManifest.id,
        orderType: deliveryManifest.orderType,
        referenceId: deliveryManifest.referenceId,
        batchId: deliveryManifest.batchId,
        customerId: deliveryManifest.customerId,
        mealId: deliveryManifest.mealId,
        addressId: deliveryManifest.addressId,
        deliveryDate: deliveryManifest.deliveryDate,
        mealSlot: deliveryManifest.mealSlot,
        status: deliveryManifest.status,
        deliveredAt: deliveryManifest.deliveredAt,
        customerName: users.name,
        customerPhone: users.phone,
        mealName: foodItems.name,
        mealImage: foodItems.imageUrl,
        addressLabel: addresses.label,
        addressLine: addresses.address,
        area: addresses.area,
        city: addresses.city,
        latitude: addresses.latitude,
        longitude: addresses.longitude,
      })
      .from(deliveryManifest)
      .leftJoin(users, eq(deliveryManifest.customerId, users.id))
      .leftJoin(foodItems, eq(deliveryManifest.mealId, foodItems.id))
      .leftJoin(addresses, eq(deliveryManifest.addressId, addresses.id))
      .where(eq(deliveryManifest.deliveryDate, targetDate));

    const result = relevantBatches.map((b) => {
      const items = manifestItems.filter((m) => m.batchId === b.id);
      return {
        ...b,
        deliveriesCount: items.length,
        deliveries: items,
      };
    });

    return NextResponse.json({ success: true, date: targetDate, batches: result });
  } catch (err: any) {
    console.error("GET /api/delivery/batches error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST /api/delivery/batches - Perform action e.g. MARK_DELIVERED
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, manifestId, partnerId } = body;

    if (action === "MARK_DELIVERED") {
      if (!manifestId) {
        return NextResponse.json({ success: false, error: "manifestId is required" }, { status: 400 });
      }

      const res = await BatchService.markDeliveryCompleted(manifestId, partnerId);
      return NextResponse.json(res);
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("POST /api/delivery/batches error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
