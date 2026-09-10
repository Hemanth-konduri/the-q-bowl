import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { createSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const origin = req.nextUrl.origin || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const redirectUri = `${origin}/api/auth/google/callback`;

  if (!code) {
    return NextResponse.redirect(new URL("/register?error=google_failed", req.url));
  }

  try {
    // Exchange authorization code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokens.access_token) {
      console.error("Google Token Exchange failed:", tokens);
      return NextResponse.redirect(new URL("/register?error=google_failed", req.url));
    }

    // Fetch user profile from Google
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await profileRes.json();

    if (!profile.email) {
      return NextResponse.redirect(new URL("/register?error=google_failed", req.url));
    }

    const cleanEmail = profile.email.toLowerCase().trim();

    // Find existing user by googleId or email
    let existing = await db
      .select()
      .from(users)
      .where(or(eq(users.googleId, profile.id), eq(users.email, cleanEmail)))
      .limit(1);

    if (existing.length === 0) {
      // Create new customer user
      const created = await db
        .insert(users)
        .values({
          id: crypto.randomUUID(),
          email: cleanEmail,
          name: profile.name ?? null,
          googleId: profile.id,
          role: "CUSTOMER",
          emailVerified: true,
        })
        .returning();
      existing = created;
    } else {
      // Ensure existing user is marked emailVerified = true and linked to googleId
      const updated = await db
        .update(users)
        .set({
          emailVerified: true,
          googleId: profile.id,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existing[0].id))
        .returning();
      if (updated.length > 0) {
        existing = updated;
      }
    }

    const user = existing[0];
    await createSession({ userId: user.id, role: user.role });

    if (user.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
    if (user.verificationStatus === "APPROVED") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    if (!user.aadhaarDocument || !user.idProofDocument || user.verificationStatus === "REJECTED") {
      return NextResponse.redirect(new URL("/identity-verification", req.url));
    }

    return NextResponse.redirect(new URL("/verification-pending", req.url));
  } catch (error) {
    console.error("Error during Google OAuth callback:", error);
    return NextResponse.redirect(new URL("/register?error=google_failed", req.url));
  }
}
