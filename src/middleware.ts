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
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // ── Admin login page (/admin) ──
  if (pathname === ADMIN_LOGIN_ROUTE) {
    if (session?.role === "ADMIN") return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    if (session && session.role !== "ADMIN") return NextResponse.redirect(new URL("/dashboard", req.url));
    return NextResponse.next();
  }

  // ── Redirect active Admin session away from user verification routes ──
  if (session?.role === "ADMIN") {
    if (
      pathname === "/identity-verification" ||
      pathname === "/verification-pending" ||
      pathname === "/verify-email" ||
      pathname === "/login" ||
      pathname === "/register"
    ) {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
  }

  // ── Registration and email verification pages ──
  if (pathname === "/register" || pathname === "/login" || pathname === "/verify-email") {
    return NextResponse.next();
  }

  // ── Identity verification requires an email-verified session ──
  if (pathname === "/identity-verification") {
    if (!session) return NextResponse.redirect(new URL("/register", req.url));
    return NextResponse.next();
  }

  if (pathname === "/verification-pending") {
    if (!session) return NextResponse.redirect(new URL("/register", req.url));
    return NextResponse.next();
  }

  // ── Public landing page ──
  if (pathname === "/") {
    return NextResponse.next();
  }

  // ── Approved application dashboard ──
  if (pathname.startsWith("/dashboard")) {
    if (!session) return NextResponse.redirect(new URL("/register", req.url));
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|the_q_bowl_logo.png|api/auth).*)"],
};
