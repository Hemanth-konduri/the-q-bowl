import { NextResponse } from "next/server";
import { db } from "@/db";
import { payments, users } from "@/db/schema";
import { requireAdminApi } from "@/lib/auth-guard";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const logs = await db
      .select({
        id: payments.id,
        amount: payments.amount,
        currency: payments.currency,
        method: payments.method,
        purpose: payments.purpose,
        status: payments.status,
        razorpayPaymentId: payments.razorpayPaymentId,
        createdAt: payments.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(payments)
      .leftJoin(users, eq(payments.userId, users.id))
      .orderBy(desc(payments.createdAt))
      .limit(100);

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error fetching payment logs:", error);
    return NextResponse.json({ error: "Failed to fetch payment logs." }, { status: 500 });
  }
}
