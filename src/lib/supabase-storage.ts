import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://juaokpcotezgstrmpldk.supabase.co";

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1YW9rcGNvdGV6Z3N0cm1wbGRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAxNTAwMDAwMH0.placeholder";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

export const BUCKET_NAME = "qbowl-assets";

let isBucketVerified = false;

/**
 * Ensures that the storage bucket exists and is public.
 */
export async function ensureBucketExists(): Promise<boolean> {
  if (isBucketVerified) return true;
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (!listError && buckets && buckets.some((b) => b.name === BUCKET_NAME)) {
      isBucketVerified = true;
      return true;
    }

    const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 10485760, // 10MB
    });

    if (!createError || createError.message?.includes("already exists")) {
      await supabase.storage.updateBucket(BUCKET_NAME, { public: true });
      isBucketVerified = true;
      return true;
    }

    console.warn("Supabase Storage bucket creation warning:", createError.message);
    return false;
  } catch (err) {
    console.warn("Failed to ensure storage bucket exists:", err);
    return false;
  }
}

/**
 * Get the direct public URL for a file stored in Supabase Storage.
 */
export function getStoragePublicUrl(filePath: string): string {
  if (!filePath) return "";
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }
  const cleanPath = filePath.replace(/^\/+/, "");
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${cleanPath}`;
}

/**
 * Get the safe internal document viewer URL that handles fallback gracefully.
 */
export function getDocumentViewUrl(filePath: string): string {
  if (!filePath) return "";
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }
  const cleanPath = filePath.replace(/^\/+/, "");
  return `/api/admin/documents/view?path=${encodeURIComponent(cleanPath)}`;
}
