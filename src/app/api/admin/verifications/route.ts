import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { users, verificationRequests } from "@/db/schema";
import { requireAdminApi } from "@/lib/auth-guard";
import { getStoragePublicUrl } from "@/lib/supabase-storage";

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;

  const rawRequests = await db
    .select({
      id: verificationRequests.id,
      userId: verificationRequests.userId,
      aadhaarDocument: verificationRequests.aadhaarDocument,
      idProofDocument: verificationRequests.idProofDocument,
      status: verificationRequests.status,
      reviewNotes: verificationRequests.reviewNotes,
      createdAt: verificationRequests.createdAt,
      updatedAt: verificationRequests.updatedAt,
      reviewedAt: verificationRequests.reviewedAt,
      userEmail: users.email,
      username: users.username,
      userName: users.name,
    })
    .from(verificationRequests)
    .leftJoin(users, eq(verificationRequests.userId, users.id))
    .orderBy(desc(verificationRequests.createdAt));

  const requests = rawRequests.map((req) => ({
    ...req,
    aadhaarUrl: getStoragePublicUrl(req.aadhaarDocument),
    idProofUrl: getStoragePublicUrl(req.idProofDocument),
  }));

  return NextResponse.json(requests);
}

export async function PATCH(req: NextRequest) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const { requestId, status, reviewNotes } = await req.json();
  if (!requestId || !["APPROVED", "REJECTED", "PENDING"].includes(status)) {
    return NextResponse.json({ error: "Invalid verification update." }, { status: 400 });
  }

  const [request] = await db
    .select({ userId: verificationRequests.userId })
    .from(verificationRequests)
    .where(eq(verificationRequests.id, requestId))
    .limit(1);

  if (!request) {
    return NextResponse.json({ error: "Verification request not found." }, { status: 404 });
  }

  const reviewedAt = status === "PENDING" ? null : new Date();
  await db
    .update(verificationRequests)
    .set({ status, reviewNotes: reviewNotes ?? null, reviewedAt, updatedAt: new Date() })
    .where(eq(verificationRequests.id, requestId));

  await db
    .update(users)
    .set({
      verificationStatus: status,
      verificationReviewedAt: reviewedAt,
      rejectionReason: status === "REJECTED" ? (reviewNotes ?? null) : null,
      isActive: status === "APPROVED",
    })
    .where(eq(users.id, request.userId));

  return NextResponse.json({ success: true, status });
}

