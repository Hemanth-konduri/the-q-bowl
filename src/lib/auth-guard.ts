import { getSession } from "./session";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

/**
 * Use in Server Components / Server Actions.
 * Verifies session AND confirms role from DB — not just the JWT claim.
 */
export async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/admin");

  const user = await db
    .select({ id: users.id, role: users.role, isActive: users.isActive })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user.length || user[0].role !== "ADMIN" || !user[0].isActive) {
    redirect("/admin");
  }

  return user[0];
}

/**
 * Use in Server Components for authenticated user portal pages.
 * Verifies session and confirms active user in database.
 */
export async function requireAuth(redirectTo = "/login") {
  const session = await getSession();
  if (!session) redirect(redirectTo);

  const user = await db
    .select({ id: users.id, role: users.role, name: users.name, email: users.email, isActive: users.isActive })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user.length || !user[0].isActive) {
    redirect(redirectTo);
  }

  return user[0];
}

/**
 * Use in API Route Handlers.
 * Returns 401/403 response instead of redirecting.
 */
export async function requireAdminApi() {
  const session = await getSession();
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const user = await db
    .select({ id: users.id, role: users.role, isActive: users.isActive })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user.length || user[0].role !== "ADMIN" || !user[0].isActive) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { user: user[0] };
}

/**
 * Use in API Route Handlers for customer routes.
 */
export async function requireAuthApi() {
  const session = await getSession();
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const user = await db
    .select({ id: users.id, role: users.role, isActive: users.isActive })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user.length || !user[0].isActive) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { user: user[0] };
}
