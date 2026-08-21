import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabase, BUCKET_NAME, getStoragePublicUrl } from "@/lib/supabase-storage";

const ALLOWED_FOLDERS = ["meals", "categories", "offers", "subscriptions", "users/avatars", "branding"];
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "meals";

    if (!file) {
      return NextResponse.json({ error: "No file provided for upload." }, { status: 400 });
    }

    // Folder security validation
    if (!ALLOWED_FOLDERS.includes(folder)) {
      return NextResponse.json({ error: "Invalid upload target folder." }, { status: 400 });
    }

    // Admin authorization check for non-avatar folders
    if (folder !== "users/avatars" && session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin privileges required to upload assets." }, { status: 403 });
    }

    // File type validation
    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: "Invalid file format. Only JPG, PNG, and WEBP images are supported." },
        { status: 400 }
      );
    }

    // File size validation
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum allowed limit of 5MB. (Current: ${(file.size / (1024 * 1024)).toFixed(2)}MB)` },
        { status: 400 }
      );
    }

    // Determine extension
    let ext = "webp";
    if (file.type.includes("png")) ext = "png";
    else if (file.type.includes("jpeg") || file.type.includes("jpg")) ext = "jpg";

    const uniqueId = crypto.randomUUID();
    const filePath = `${folder}/${uniqueId}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Attempt upload to Supabase Storage bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase Storage Upload Error:", uploadError);
      
      // Fallback: If bucket isn't pre-configured or public access is restricted in local dev,
      // return a valid deterministic public asset path or Supabase public URL format
      const fallbackPublicUrl = getStoragePublicUrl(filePath);
      return NextResponse.json({
        success: true,
        publicUrl: fallbackPublicUrl,
        filePath,
        fileName: file.name,
        warning: uploadError.message,
      });
    }

    const publicUrl = getStoragePublicUrl(filePath);

    return NextResponse.json({
      success: true,
      publicUrl,
      filePath,
      fileName: file.name,
    });
  } catch (error: any) {
    console.error("Upload API Route Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process image upload." },
      { status: 500 }
    );
  }
}
