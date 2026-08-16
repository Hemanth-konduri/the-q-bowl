import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/auth-guard";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";

export async function GET() {
  const { error } = await requireAuthApi() as { error?: NextResponse };
  if (error) return error;

  const session = await getSession();
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, session!.userId))
    .limit(1);

  const { passwordHash: _, ...safeUser } = user[0];
  return NextResponse.json(safeUser);
}
