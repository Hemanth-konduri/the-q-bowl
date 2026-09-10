import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, orders, orderItems, customerComplaints, complaintMessages } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { getSession } from "@/lib/session";

// GET /api/user/complaints/[id]
// Returns ticket details and message history for a specific complaint
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const complaintMatch = await db
      .select()
      .from(customerComplaints)
      .where(and(eq(customerComplaints.id, id), eq(customerComplaints.userId, session.userId)))
      .limit(1);

    if (complaintMatch.length === 0) {
      return NextResponse.json({ error: "Complaint ticket not found." }, { status: 404 });
    }

    const complaint = complaintMatch[0];

    // Fetch conversation timeline messages
    const messages = await db
      .select()
      .from(complaintMessages)
      .where(eq(complaintMessages.complaintId, id))
      .orderBy(asc(complaintMessages.createdAt));

    // Fetch order items summary if orderId is attached
    let items: any[] = [];
    if (complaint.orderId) {
      items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, complaint.orderId));
    }

    return NextResponse.json({
      complaint: {
        ...complaint,
        foodItemName: items.map((i) => i.name).join(", ") || "Gourmet Meal",
        items,
      },
      messages,
    });
  } catch (error) {
    console.error("GET /api/user/complaints/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch complaint details." }, { status: 500 });
  }
}

// POST /api/user/complaints/[id]
// Allow customer to append a follow-up reply message to the complaint ticket
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message text is required." }, { status: 400 });
    }

    const complaintMatch = await db
      .select()
      .from(customerComplaints)
      .where(and(eq(customerComplaints.id, id), eq(customerComplaints.userId, session.userId)))
      .limit(1);

    if (complaintMatch.length === 0) {
      return NextResponse.json({ error: "Complaint ticket not found." }, { status: 404 });
    }

    const userMatch = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    const userName = userMatch[0]?.name || "Customer";

    const msgId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    await db.insert(complaintMessages).values({
      id: msgId,
      complaintId: id,
      senderType: "CUSTOMER",
      senderName: userName,
      message: message.trim(),
    });

    // Touch updatedAt timestamp on complaint
    await db
      .update(customerComplaints)
      .set({ updatedAt: new Date() })
      .where(eq(customerComplaints.id, id));

    return NextResponse.json({ success: true, messageId: msgId });
  } catch (error) {
    console.error("POST /api/user/complaints/[id] error:", error);
    return NextResponse.json({ error: "Failed to post message." }, { status: 500 });
  }
}
