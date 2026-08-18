import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const redirectUri = `${origin}/api/auth/google/callback`;

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
}
