import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

const ADMIN_LOGIN_ROUTE = "/admin";
const ADMIN_PREFIX = "/admin/";

async function getSessionPayload(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as { userId: string; role: string };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow static assets and auth API
  if (pathname.startsWith("/api/auth") || pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  const session = await getSessionPayload(req);

  // ── Admin protected routes (/admin/dashboard, /admin/*, etc.) ──
  if (pathname.startsWith(ADMIN_PREFIX)) {
    if (!session) return NextResponse.redirect(new URL(ADMIN_LOGIN_ROUTE, req.url));
    if (session.role !== "ADMIN") {
      const res = NextResponse.redirect(new URL("/user/dashboard", req.url));
      return res;
    }
    return NextResponse.next();
  }

  // ── Admin login page (/admin) ──
  if (pathname === ADMIN_LOGIN_ROUTE) {
    if (session?.role === "ADMIN") return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    if (session && session.role !== "ADMIN") return NextResponse.redirect(new URL("/user/dashboard", req.url));
    return NextResponse.next();
  }

  // ── Auth pages (/login & /register) ──
  if (pathname === "/login" || pathname === "/register") {
    if (session?.role === "CUSTOMER") return NextResponse.redirect(new URL("/user/dashboard", req.url));
    if (session?.role === "ADMIN") return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    return NextResponse.next();
  }

  // ── Public landing page ──
  if (pathname === "/") {
    return NextResponse.next();
  }

  // ── User Portal protected routes (/user/*) ──
  if (pathname.startsWith("/user")) {
    if (!session) return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|the_q_bowl_logo.png|api/auth).*)"],
};
