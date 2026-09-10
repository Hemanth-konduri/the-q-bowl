import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, orders, orderItems, customerComplaints, complaintMessages, foodItems } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getSession } from "@/lib/session";

// GET /api/user/complaints
// Fetch complaints submitted by the logged-in user
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const complaintsList = await db
      .select()
      .from(customerComplaints)
      .where(eq(customerComplaints.userId, session.userId))
      .orderBy(desc(customerComplaints.createdAt));

    // Attach order items info to each complaint for rich display
    const enriched = await Promise.all(
      complaintsList.map(async (cmp) => {
        let foodItemName = "Gourmet Meal";
        if (cmp.orderId) {
          const items = await db
            .select()
            .from(orderItems)
            .where(eq(orderItems.orderId, cmp.orderId));
          if (items.length > 0) {
            foodItemName = items.map((i) => i.name).join(", ");
          }
        }
        return {
          ...cmp,
          foodItemName,
        };
      })
    );

    return NextResponse.json({ complaints: enriched });
  } catch (error) {
    console.error("GET /api/user/complaints error:", error);
    return NextResponse.json({ error: "Failed to fetch complaints." }, { status: 500 });
  }
}

// POST /api/user/complaints
// Submit a complaint for a delivered order
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, category, subject, description, imageUrl = "", priority = "MEDIUM" } = body;

    if (!category || !subject || !description) {
      return NextResponse.json(
        { error: "Category, subject, and detailed description are required." },
        { status: 400 }
      );
    }

    // Fetch user details
    const userList = await db
      .select({ name: users.name, email: users.email, phone: users.phone })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    const userObj = userList[0];
    const customerName = userObj?.name || "Customer";

    // Safely check if orderId exists in orders table to avoid FK constraint issues
    let validOrderId: string | null = null;
    if (orderId) {
      const orderMatch = await db
        .select({ id: orders.id })
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (orderMatch.length > 0) {
        validOrderId = orderMatch[0].id;
      }
    }

    // Generate unique user-friendly Complaint ID (e.g. CMP-849201)
    const complaintId = `CMP-${Math.floor(100000 + Math.random() * 900000)}`;

    // Insert complaint row
    await db.insert(customerComplaints).values({
      id: complaintId,
      userId: session.userId,
      orderId: validOrderId,
      customerName,
      customerEmail: userObj?.email || null,
      customerPhone: userObj?.phone || null,
      category,
      subject: subject.trim(),
      description: description.trim(),
      imageUrl: imageUrl.trim() || null,
      status: "Open",
      priority: priority.toUpperCase(),
      adminNotes: null,
    });

    // Insert initial message into ticket conversation history
    const msgId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    await db.insert(complaintMessages).values({
      id: msgId,
      complaintId,
      senderType: "CUSTOMER",
      senderName: customerName,
      message: description.trim(),
      statusUpdate: "Open",
    });

    return NextResponse.json({
      success: true,
      complaintId,
      message: `Complaint ${complaintId} submitted successfully. Our support team will review it shortly.`,
    });
  } catch (error) {
    console.error("POST /api/user/complaints error:", error);
    return NextResponse.json({ error: "Failed to submit complaint." }, { status: 500 });
  }
}

