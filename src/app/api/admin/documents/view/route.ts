import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabase, BUCKET_NAME, ensureBucketExists } from "@/lib/supabase-storage";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawPath = searchParams.get("path") || searchParams.get("url");

  if (!rawPath) {
    return new NextResponse("Missing document path parameter.", { status: 400 });
  }

  // Clean path
  const cleanPath = rawPath.replace(/^\/+/, "");

  // Require logged in session for security
  const session = await getSession();
  if (!session?.userId) {
    return new NextResponse("Unauthorized access to document.", { status: 401 });
  }

  try {
    await ensureBucketExists();

    const { data, error } = await supabase.storage.from(BUCKET_NAME).download(cleanPath);

    if (!error && data) {
      const buffer = Buffer.from(await data.arrayBuffer());
      const lower = cleanPath.toLowerCase();
      let contentType = "application/octet-stream";

      if (lower.endsWith(".pdf")) contentType = "application/pdf";
      else if (lower.endsWith(".png")) contentType = "image/png";
      else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) contentType = "image/jpeg";
      else if (lower.endsWith(".webp")) contentType = "image/webp";

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": "inline",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }
  } catch (err) {
    console.error("Error fetching document from storage:", err);
  }

  // Fallback HTML page matching Q1 Bowl Admin theme if file not found in storage
  const filename = cleanPath.split("/").pop() || cleanPath;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document Notice | Q1 Bowl Admin</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body { background-color: #f8fafc; color: #0f172a; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
    .card { background: #ffffff; border: 2px solid #000000; border-radius: 16px; max-width: 520px; width: 100%; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); text-align: center; }
    .badge { display: inline-block; background: #FEF3C7; color: #92400E; border: 1px solid #FCD34D; font-weight: 900; font-size: 11px; text-transform: uppercase; padding: 4px 12px; border-radius: 20px; margin-bottom: 16px; letter-spacing: 0.5px; }
    .icon { width: 56px; height: 56px; background: #000000; color: #E5A00D; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto; font-size: 24px; font-weight: bold; }
    h1 { font-size: 20px; font-weight: 900; color: #000000; text-transform: uppercase; margin-bottom: 8px; letter-spacing: -0.5px; }
    p { font-size: 13px; color: #475569; font-weight: 500; line-height: 1.6; margin-bottom: 20px; }
    .path-box { background: #F1F5F9; border: 1px solid #E2E8F0; padding: 10px 14px; border-radius: 10px; font-family: monospace; font-size: 12px; color: #334155; word-break: break-all; margin-bottom: 24px; text-align: left; }
    .actions { display: flex; gap: 12px; justify-content: center; }
    .btn { text-decoration: none; font-size: 12px; font-weight: 800; padding: 10px 20px; border-radius: 12px; cursor: pointer; transition: all 0.2s ease; display: inline-block; }
    .btn-primary { background: #000000; color: #E5A00D; border: none; }
    .btn-primary:hover { background: #1e293b; }
    .btn-secondary { background: #F1F5F9; color: #334155; border: 1px solid #CBD5E1; }
    .btn-secondary:hover { background: #E2E8F0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">📄</div>
    <div class="badge">Storage Notice</div>
    <h1>Document Not Available</h1>
    <p>The requested identity document file is currently unavailable in cloud storage. It may have been uploaded prior to storage setup or needs to be re-uploaded by the customer.</p>
    <div class="path-box">
      <strong>File:</strong> ${filename}<br/>
      <strong>Path:</strong> ${cleanPath}
    </div>
    <div class="actions">
      <a href="javascript:window.close()" class="btn btn-secondary">Close Window</a>
      <a href="/admin/dashboard" class="btn btn-primary">Return to Admin Dashboard</a>
    </div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
