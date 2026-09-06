import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { users, verificationRequests } from "@/db/schema";
import { getSession } from "@/lib/session";
import { supabase, BUCKET_NAME } from "@/lib/supabase-storage";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];

async function storeDocument(file: File, userId: string, label: string) {
  if (!file || !ALLOWED_TYPES.includes(file.type.toLowerCase()) || file.size > MAX_FILE_SIZE) return null;
  const extension = file.type === "application/pdf" ? "pdf" : file.type.includes("png") ? "png" : file.type.includes("webp") ? "webp" : "jpg";
  const filePath = `identity-documents/${userId}/${label}-${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(BUCKET_NAME).upload(filePath, Buffer.from(await file.arrayBuffer()), {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error("Document storage is unavailable.");
  return filePath;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const user = await db.select({ emailVerified: users.emailVerified }).from(users).where(eq(users.id, session.userId)).limit(1);
    if (!user.length || !user[0].emailVerified) return NextResponse.json({ error: "Verify your email first." }, { status: 403 });

    const formData = await req.formData();
    const aadhaar = formData.get("aadhaar") as File | null;
    const idProof = formData.get("idProof") as File | null;
    if (!aadhaar || !idProof) return NextResponse.json({ error: "Both identity documents are required." }, { status: 400 });

    const [aadhaarPath, idProofPath] = await Promise.all([
      storeDocument(aadhaar, session.userId, "aadhaar"),
      storeDocument(idProof, session.userId, "id-proof"),
    ]);
    if (!aadhaarPath || !idProofPath) return NextResponse.json({ error: "Use a JPG, PNG, WEBP, or PDF file up to 8MB." }, { status: 400 });

    await db.insert(verificationRequests).values({
      id: crypto.randomUUID(),
      userId: session.userId,
      aadhaarDocument: aadhaarPath,
      idProofDocument: idProofPath,
      status: "PENDING",
    });
    await db.update(users).set({
      aadhaarDocument: aadhaarPath,
      idProofDocument: idProofPath,
      verificationStatus: "PENDING",
      verificationSubmittedAt: new Date(),
      verificationReviewedAt: null,
      updatedAt: new Date(),
    }).where(eq(users.id, session.userId));

    return NextResponse.json({ success: true, status: "PENDING" });
  } catch (error) {
    console.error("Identity verification error:", error);
    return NextResponse.json({ error: "Unable to submit identity documents." }, { status: 500 });
  }
}

export async function GET() {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [user] = await db
    .select({
      verificationStatus: users.verificationStatus,
      emailVerified: users.emailVerified,
      rejectionReason: users.rejectionReason,
      aadhaarDocument: users.aadhaarDocument,
      idProofDocument: users.idProofDocument,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [request] = await db
    .select({
      status: verificationRequests.status,
      reviewNotes: verificationRequests.reviewNotes,
      createdAt: verificationRequests.createdAt,
    })
    .from(verificationRequests)
    .where(and(eq(verificationRequests.userId, session.userId), eq(verificationRequests.status, user.verificationStatus)))
    .orderBy(desc(verificationRequests.createdAt))
    .limit(1);

  const hasUploadedDocs = Boolean(user.aadhaarDocument && user.idProofDocument);

  return NextResponse.json({
    ...user,
    hasUploadedDocs,
    request: request ?? null,
    reviewNotes: user.rejectionReason || request?.reviewNotes || null,
  });
}
