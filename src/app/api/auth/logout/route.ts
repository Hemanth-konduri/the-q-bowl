import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/session";

export async function POST() {
  await deleteSession();
  const res = NextResponse.json({ success: true });
  // Explicitly clear session cookie on response header to guarantee deletion across all browsers
  res.cookies.set("session", "", {
    path: "/",
    expires: new Date(0),
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
  });
  return res;
}

