import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { createSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=google_failed", req.url));
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokens.access_token) {
      return NextResponse.redirect(new URL("/login?error=google_failed", req.url));
    }

    // Get user info from Google
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await profileRes.json();

    if (!profile.email) {
      return NextResponse.redirect(new URL("/login?error=google_failed", req.url));
    }

    // Find existing user by googleId or email
    let existing = await db
      .select()
      .from(users)
      .where(or(eq(users.googleId, profile.id), eq(users.email, profile.email)))
      .limit(1);

    if (existing.length === 0) {
      // Create new customer
      const created = await db
        .insert(users)
        .values({
          id: crypto.randomUUID(),
          email: profile.email,
          name: profile.name ?? null,
          googleId: profile.id,
          role: "CUSTOMER",
        })
        .returning();
      existing = created;
    } else if (!existing[0].googleId) {
      // Link Google to existing email account
      await db
        .update(users)
        .set({ googleId: profile.id })
        .where(eq(users.id, existing[0].id));
    }

    const user = existing[0];
    await createSession({ userId: user.id, role: user.role });
    const destination = user.role === "ADMIN" ? "/admin/dashboard" : "/";
    return NextResponse.redirect(new URL(destination, req.url));
  } catch {
    return NextResponse.redirect(new URL("/login?error=google_failed", req.url));
  }
}
