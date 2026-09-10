import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  customerComplaints,
  complaintMessages,
  orders,
  orderItems,
  users,
  addresses,
  customerFeedback,
  deliveryAssignments,
  deliveryPartners,
  kitchenSettings,
} from "@/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { requireAdminApi } from "@/lib/auth-guard";
import { sendComplaintResponseEmail } from "@/lib/email";

// GET /api/admin/complaints
// Fetch all customer complaints with 360° order, customer, delivery details and timeline
export async function GET(req: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");
    const categoryFilter = searchParams.get("category");

    const complaintsList = await db
      .select()
      .from(customerComplaints)
      .orderBy(desc(customerComplaints.createdAt));

    let filtered = complaintsList;
    if (statusFilter && statusFilter !== "ALL") {
      filtered = filtered.filter(
        (c) => c.status.toUpperCase() === statusFilter.toUpperCase()
      );
    }
    if (categoryFilter && categoryFilter !== "ALL") {
      filtered = filtered.filter(
        (c) => c.category.toUpperCase() === categoryFilter.toUpperCase()
      );
    }

    // Enrich complaints with 360° Order, Delivery, & Message timeline details
    const enrichedComplaints = await Promise.all(
      filtered.map(async (cmp) => {
        // 1. Fetch User details
        let customerInfo = {
          name: cmp.customerName,
          email: cmp.customerEmail || "N/A",
          phone: cmp.customerPhone || "N/A",
          address: "Delivery Location",
        };

        const userMatch = await db
          .select()
          .from(users)
          .where(eq(users.id, cmp.userId))
          .limit(1);

        if (userMatch.length > 0) {
          customerInfo.name = userMatch[0].name || cmp.customerName;
          customerInfo.email = userMatch[0].email || cmp.customerEmail || "N/A";
          customerInfo.phone = userMatch[0].phone || cmp.customerPhone || "N/A";
        }

        // 2. Fetch Order & Delivery details if orderId is attached
        let orderInfo: any = null;
        let deliveryInfo: any = null;

        if (cmp.orderId) {
          const orderMatch = await db
            .select()
            .from(orders)
            .where(eq(orders.id, cmp.orderId))
            .limit(1);

          if (orderMatch.length > 0) {
            const ord = orderMatch[0];
            const items = await db
              .select()
              .from(orderItems)
              .where(eq(orderItems.orderId, ord.id));

            orderInfo = {
              orderId: ord.id,
              items: items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.unitPrice })),
              itemsSummary: items.map((i) => `${i.name} (x${i.quantity})`).join(", ") || "Gourmet Dish",
              totalAmount: ord.total,
              type: ord.type,
              status: ord.status,
              createdAt: ord.createdAt,
            };

            // Fetch delivery address
            if (ord.addressId) {
              const addrMatch = await db
                .select()
                .from(addresses)
                .where(eq(addresses.id, ord.addressId))
                .limit(1);
              if (addrMatch.length > 0) {
                const a = addrMatch[0];
                customerInfo.address = `${a.address}, ${a.area ? a.area + ", " : ""}${a.city}`;
              }
            }

            // Fetch delivery partner assignment details
            const assignMatch = await db
              .select({
                assignmentId: deliveryAssignments.id,
                assignedAt: deliveryAssignments.assignedAt,
                pickedUpAt: deliveryAssignments.pickedUpAt,
                deliveredAt: deliveryAssignments.deliveredAt,
                partnerName: deliveryPartners.fullName,
                partnerPhone: deliveryPartners.phone,
              })
              .from(deliveryAssignments)
              .leftJoin(deliveryPartners, eq(deliveryAssignments.deliveryPartnerId, deliveryPartners.id))
              .where(eq(deliveryAssignments.orderId, ord.id))
              .limit(1);

            if (assignMatch.length > 0) {
              const da = assignMatch[0];
              let durationMinutes = 25;
              if (ord.createdAt && da.deliveredAt) {
                durationMinutes = Math.round(
                  (new Date(da.deliveredAt).getTime() - new Date(ord.createdAt).getTime()) / 60000
                );
              }
              deliveryInfo = {
                partnerName: da.partnerName || "Express Courier Rider",
                partnerPhone: da.partnerPhone || "+91 98765 43210",
                kitchenName: "Central Gourmet Kitchen",
                assignedAt: da.assignedAt,
                pickedUpAt: da.pickedUpAt,
                deliveredAt: da.deliveredAt,
                durationMinutes,
              };
            }
          }
        }

        // Fallback delivery info if order has no explicit assignment row
        if (!deliveryInfo) {
          deliveryInfo = {
            partnerName: "Q1 Express Courier",
            partnerPhone: "+91 98765 43210",
            kitchenName: "Central Kitchen Hub",
            durationMinutes: 28,
          };
        }

        // 3. Fetch previous customer feedback for this user
        const feedbackMatch = await db
          .select()
          .from(customerFeedback)
          .where(eq(customerFeedback.userId, cmp.userId))
          .limit(1);

        const previousFeedback = feedbackMatch.length > 0 ? feedbackMatch[0] : null;

        // 4. Fetch ticket conversation messages timeline
        const messages = await db
          .select()
          .from(complaintMessages)
          .where(eq(complaintMessages.complaintId, cmp.id))
          .orderBy(asc(complaintMessages.createdAt));

        return {
          ...cmp,
          customerInfo,
          orderInfo,
          deliveryInfo,
          previousFeedback,
          messages,
        };
      })
    );

    const counts = {
      total: complaintsList.length,
      open: complaintsList.filter((c) => ["OPEN", "Open"].includes(c.status)).length,
      reviewing: complaintsList.filter((c) => ["REVIEWING", "Reviewing"].includes(c.status)).length,
      inProgress: complaintsList.filter((c) => ["IN_PROGRESS", "In Progress"].includes(c.status)).length,
      resolved: complaintsList.filter((c) => ["RESOLVED", "Resolved"].includes(c.status)).length,
      closed: complaintsList.filter((c) => ["CLOSED", "Closed"].includes(c.status)).length,
    };

    return NextResponse.json({
      complaints: enrichedComplaints,
      counts,
    });
  } catch (err) {
    console.error("GET /api/admin/complaints error:", err);
    return NextResponse.json({ error: "Failed to fetch complaints." }, { status: 500 });
  }
}

// PATCH /api/admin/complaints
// Update complaint status, priority, admin notes, post response message & email customer
export async function PATCH(req: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  try {
    const body = await req.json();
    const {
      complaintId,
      status,
      priority,
      adminNotes,
      adminResponse,
      sendEmail = true,
      adminName = "Q1 Bowl Support",
    } = body;

    if (!complaintId) {
      return NextResponse.json({ error: "Complaint ID is required." }, { status: 400 });
    }

    const complaintMatch = await db
      .select()
      .from(customerComplaints)
      .where(eq(customerComplaints.id, complaintId))
      .limit(1);

    if (complaintMatch.length === 0) {
      return NextResponse.json({ error: "Complaint not found." }, { status: 404 });
    }

    const currentComplaint = complaintMatch[0];

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (status) {
      updateData.status = status;
      if (["Resolved", "RESOLVED", "Closed", "CLOSED"].includes(status)) {
        updateData.resolvedAt = new Date();
      }
    }

    if (priority) {
      updateData.priority = priority.toUpperCase();
    }

    if (typeof adminNotes === "string") {
      updateData.adminNotes = adminNotes.trim();
    }

    await db
      .update(customerComplaints)
      .set(updateData)
      .where(eq(customerComplaints.id, complaintId));

    // Post message into ticket conversation if admin provided a response
    if (adminResponse && adminResponse.trim()) {
      const msgId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      await db.insert(complaintMessages).values({
        id: msgId,
        complaintId,
        senderType: "ADMIN",
        senderName: adminName,
        message: adminResponse.trim(),
        statusUpdate: status || currentComplaint.status,
      });

      // Send email notification to customer if recipient email exists and sendEmail is true
      if (sendEmail && currentComplaint.customerEmail) {
        await sendComplaintResponseEmail({
          to: currentComplaint.customerEmail,
          customerName: currentComplaint.customerName,
          complaintId: currentComplaint.id,
          subject: currentComplaint.subject,
          responseText: adminResponse.trim(),
          status: status || currentComplaint.status,
          adminName,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Complaint updated successfully.",
    });
  } catch (err) {
    console.error("PATCH /api/admin/complaints error:", err);
    return NextResponse.json({ error: "Failed to update complaint." }, { status: 500 });
  }
}

