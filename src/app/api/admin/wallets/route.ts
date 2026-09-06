import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { wallets, walletTransactions, users } from "@/db/schema";
import { requireAdminApi } from "@/lib/auth-guard";
import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const list = await db
      .select({
        id: wallets.id,
        userId: wallets.userId,
        balance: wallets.balance,
        updatedAt: wallets.updatedAt,
        userName: users.name,
        userEmail: users.email,
        userPhone: users.phone,
      })
      .from(wallets)
      .leftJoin(users, eq(wallets.userId, users.id))
      .orderBy(desc(wallets.balance));

    return NextResponse.json(list);
  } catch (error) {
    console.error("Error fetching wallets:", error);
    return NextResponse.json({ error: "Failed to fetch wallets." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const { walletId, type, amount, title } = await req.json();

    if (!walletId || !type || !amount || Number(amount) <= 0) {
      return NextResponse.json(
        { error: "Wallet ID, valid transaction type (CREDIT/DEBIT), and amount are required." },
        { status: 400 }
      );
    }

    const [w] = await db.select().from(wallets).where(eq(wallets.id, walletId)).limit(1);
    if (!w) {
      return NextResponse.json({ error: "Wallet not found." }, { status: 404 });
    }

    const changeAmount = Number(amount);
    const newBalance =
      type === "CREDIT" ? w.balance + changeAmount : Math.max(0, w.balance - changeAmount);

    await db
      .update(wallets)
      .set({ balance: newBalance, updatedAt: new Date() })
      .where(eq(wallets.id, walletId));

    const txId = `wtx-${nanoid(8)}`;
    await db.insert(walletTransactions).values({
      id: txId,
      walletId,
      type,
      amount: changeAmount,
      title: title ? String(title).trim() : `Admin ${type.toLowerCase()} adjustment`,
      status: "Completed",
    });

    return NextResponse.json({ success: true, newBalance });
  } catch (error) {
    console.error("Error adjusting wallet:", error);
    return NextResponse.json({ error: "Failed to adjust wallet." }, { status: 500 });
  }
}
