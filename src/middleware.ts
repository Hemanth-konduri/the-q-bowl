import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

const ADMIN_LOGIN_ROUTE = "/login";
const ADMIN_PREFIX = "/admin/";

// ✅ NEW (works for BOTH Web Cookies AND Mobile App Tokens):
async function getSessionPayload(req: NextRequest) {
  // 1. Check if token is coming from Mobile App Header
  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
  let token = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7)
    : undefined;

  // 2. If not from mobile, check website cookie
  if (!token) {
    token = req.cookies.get("session")?.value;
  }

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

  // Handle CORS preflight requests from mobile / web dev tools
  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,PATCH,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
      },
    });
  }

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

  // ── Admin login page (/admin) -> redirect to universal login ──
  if (pathname === "/admin") {
    if (session?.role === "ADMIN") return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    if (session && session.role !== "ADMIN") return NextResponse.redirect(new URL("/dashboard", req.url));
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // ── Delivery Boy protected routes (/delivery-dashboard) ──
  if (pathname.startsWith("/delivery-dashboard")) {
    if (!session) return NextResponse.redirect(new URL("/login", req.url));
    if (session.role !== "DELIVERY_STAFF" && session.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // ── Redirect active Admin/Delivery session away from user verification routes ──
  if (session?.role === "ADMIN" || session?.role === "DELIVERY_STAFF") {
    if (
      pathname === "/identity-verification" ||
      pathname === "/verification-pending" ||
      pathname === "/verify-email" ||
      pathname === "/login" ||
      pathname === "/register"
    ) {
      return NextResponse.redirect(
        new URL(session.role === "ADMIN" ? "/admin/dashboard" : "/delivery-dashboard", req.url)
      );
    }
  }

  // ── Redirect active Customer session away from auth pages (/login & /register) ──
  if (session && (session.role === "CUSTOMER" || !session.role)) {
    if (pathname === "/login" || pathname === "/register") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
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
