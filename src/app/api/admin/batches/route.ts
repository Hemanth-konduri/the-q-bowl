import { NextResponse } from "next/server";
import { db } from "@/db";
import { deliveryBatches, deliveryAreas, deliveryPartners } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/admin/batches - Fetch all batches
export async function GET() {
  try {
    const batches = await db
      .select({
        id: deliveryBatches.id,
        name: deliveryBatches.name,
        mealSlot: deliveryBatches.mealSlot,
        deliveryTime: deliveryBatches.deliveryTime,
        assignedPartnerId: deliveryBatches.assignedPartnerId,
        partnerName: deliveryPartners.fullName,
        partnerPhone: deliveryPartners.phone,
        status: deliveryBatches.status,
        isActive: deliveryBatches.isActive,
      })
      .from(deliveryBatches)
      .leftJoin(deliveryPartners, eq(deliveryBatches.assignedPartnerId, deliveryPartners.id));

    const areas = await db.select().from(deliveryAreas);

    const enrichedBatches = batches.map((b) => ({
      ...b,
      areas: areas.filter((a) => a.batchId === b.id),
    }));

    return NextResponse.json({ success: true, batches: enrichedBatches });
  } catch (err: any) {
    console.error("GET /api/admin/batches error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST /api/admin/batches - Create or update batch
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, name, mealSlot, deliveryTime, assignedPartnerId, status } = body;

    if (!name || !deliveryTime) {
      return NextResponse.json({ success: false, error: "Name and deliveryTime are required" }, { status: 400 });
    }

    const batchId = id || `batch-${Date.now()}`;

    const [batch] = await db
      .insert(deliveryBatches)
      .values({
        id: batchId,
        name,
        mealSlot: mealSlot || "LUNCH",
        deliveryTime,
        assignedPartnerId: assignedPartnerId || null,
        status: status || "SCHEDULED",
        isActive: true,
      })
      .onConflictDoUpdate({
        target: deliveryBatches.id,
        set: {
          name,
          mealSlot: mealSlot || "LUNCH",
          deliveryTime,
          assignedPartnerId: assignedPartnerId || null,
          status: status || "SCHEDULED",
          updatedAt: new Date(),
        },
      })
      .returning();

    return NextResponse.json({ success: true, batch });
  } catch (err: any) {
    console.error("POST /api/admin/batches error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PATCH /api/admin/batches - Batch status or partner assignment update
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { batchId, status, assignedPartnerId } = body;

    if (!batchId) {
      return NextResponse.json({ success: false, error: "batchId is required" }, { status: 400 });
    }

    const updateData: any = { updatedAt: new Date() };
    if (status !== undefined) updateData.status = status;
    if (assignedPartnerId !== undefined) updateData.assignedPartnerId = assignedPartnerId || null;

    const [updatedBatch] = await db
      .update(deliveryBatches)
      .set(updateData)
      .where(eq(deliveryBatches.id, batchId))
      .returning();

    return NextResponse.json({ success: true, batch: updatedBatch });
  } catch (err: any) {
    console.error("PATCH /api/admin/batches error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
