import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export type SessionPayload = {
  userId: string;
  role: string;
};

export async function generateToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(secret);
}

export async function createSession(payload: SessionPayload) {
  const token = await generateToken(payload);

  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

import { headers } from "next/headers";

export async function getSession(): Promise<SessionPayload | null> {
  // 1. Check Authorization Bearer header (Mobile App)
  let token: string | undefined;
  try {
    const headerList = await headers();
    const authHeader = headerList.get("authorization") || headerList.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  } catch {}

  // 2. Fallback to cookie (Web App)
  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get("session")?.value;
    } catch {}
  }

  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  cookieStore.set("session", "", {
    path: "/",
    expires: new Date(0),
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
  });
}
