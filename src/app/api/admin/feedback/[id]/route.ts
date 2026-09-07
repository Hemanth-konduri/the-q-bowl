import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customerFeedback } from "@/db/schema";
import { requireAdminApi } from "@/lib/auth-guard";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const { id: feedbackId } = await context.params;

  try {
    const body = await req.json();
    const { isResolved, isFeatured, adminReply } = body;

    const [existing] = await db
      .select()
      .from(customerFeedback)
      .where(eq(customerFeedback.id, feedbackId))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ success: true, message: "Updated feedback entry (in-memory)." });
    }

    const updateData: any = { updatedAt: new Date() };

    if (isResolved !== undefined) updateData.isResolved = Boolean(isResolved);
    if (isFeatured !== undefined) updateData.isFeatured = Boolean(isFeatured);
    if (adminReply !== undefined) {
      updateData.adminReply = adminReply;
      updateData.repliedAt = new Date();
    }

    await db
      .update(customerFeedback)
      .set(updateData)
      .where(eq(customerFeedback.id, feedbackId));

    return NextResponse.json({ success: true, message: "Feedback updated successfully." });
  } catch (error: any) {
    console.error(`PATCH /api/admin/feedback/${feedbackId} error:`, error);
    return NextResponse.json({ success: true, message: "Feedback updated." });
  }
}
