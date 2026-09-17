import { NextResponse } from "next/server";
import { BatchService } from "@/lib/services/batchService";
import { db } from "@/db";
import { deliveryManifest, users, foodItems, addresses } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/admin/kitchen/prep - Returns live kitchen prep counts & batch cards
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date") || new Date().toISOString().split("T")[0];

    const prepData = await BatchService.getKitchenPrepData(dateStr);

    return NextResponse.json({ success: true, ...prepData });
  } catch (err: any) {
    console.error("GET /api/admin/kitchen/prep error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// GET /api/admin/kitchen/prep/details?batchId=xxx - Returns list of customers inside a batch
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { batchId, date } = body;

    if (!batchId) {
      return NextResponse.json({ success: false, error: "batchId is required" }, { status: 400 });
    }

    const targetDate = date || new Date().toISOString().split("T")[0];

    const manifestItems = await db
      .select({
        id: deliveryManifest.id,
        orderType: deliveryManifest.orderType,
        status: deliveryManifest.status,
        deliveredAt: deliveryManifest.deliveredAt,
        customerName: users.name,
        customerPhone: users.phone,
        mealName: foodItems.name,
        addressLabel: addresses.label,
        addressText: addresses.address,
        area: addresses.area,
        city: addresses.city,
      })
      .from(deliveryManifest)
      .leftJoin(users, eq(deliveryManifest.customerId, users.id))
      .leftJoin(foodItems, eq(deliveryManifest.mealId, foodItems.id))
      .leftJoin(addresses, eq(deliveryManifest.addressId, addresses.id))
      .where(eq(deliveryManifest.batchId, batchId));

    return NextResponse.json({ success: true, customers: manifestItems });
  } catch (err: any) {
    console.error("POST /api/admin/kitchen/prep error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
