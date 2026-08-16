import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

const PUBLIC_ROUTES = ["/login", "/register"];
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
    // No session at all
    if (!session) {
      return NextResponse.redirect(new URL(ADMIN_LOGIN_ROUTE, req.url));
    }
    // Session exists but role is not ADMIN — hard block, send to customer home
    if (session.role !== "ADMIN") {
      const res = NextResponse.redirect(new URL("/", req.url));
      // Clear the session cookie so they can't retry
      res.cookies.delete("session");
      return res;
    }
    return NextResponse.next();
  }

  // ── Admin login page (/admin) ──
  if (pathname === ADMIN_LOGIN_ROUTE) {
    if (session?.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
    // Non-admin logged in users trying to access /admin login page — send home
    if (session && session.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // ── Customer public routes ──
  const isPublic = PUBLIC_ROUTES.some((r) => pathname === r);

  if (isPublic) {
    // Already logged in customers go home
    if (session?.role === "CUSTOMER") return NextResponse.redirect(new URL("/", req.url));
    // Admin accidentally on customer login — send to admin dashboard
    if (session?.role === "ADMIN") return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    return NextResponse.next();
  }

  // ── All other routes require a valid customer session ──
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|the_q_bowl_logo.png|api/auth).*)"],
};
