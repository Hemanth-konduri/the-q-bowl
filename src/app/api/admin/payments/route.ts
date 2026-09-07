import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, users, orders, subscriptions } from "@/db/schema";
import { requireAdminApi } from "@/lib/auth-guard";
import { count, sql, desc, eq, and, ilike, or, gte } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const purpose = searchParams.get("purpose") || "ALL"; // ALL | ORDER | SUBSCRIPTION
  const status = searchParams.get("status") || "ALL"; // ALL | SUCCESS | PENDING | FAILED | REFUNDED
  const method = searchParams.get("method") || "ALL"; // ALL | UPI | CREDIT_CARD | DEBIT_CARD | NET_BANKING | CASH_ON_DELIVERY | WALLET
  const dateRange = searchParams.get("dateRange") || "ALL"; // ALL | TODAY | THIS_WEEK | THIS_MONTH

  try {
    // 1. Calculate Summary Cards Statistics
    const [summaryStats] = await db
      .select({
        totalRevenue: sql<number>`coalesce(sum(case when ${payments.status} = 'SUCCESS' then ${payments.amount} else 0 end), 0)`,
        todayRevenue: sql<number>`coalesce(sum(case when ${payments.status} = 'SUCCESS' and ${payments.createdAt} >= CURRENT_DATE then ${payments.amount} else 0 end), 0)`,
        subscriptionRevenue: sql<number>`coalesce(sum(case when ${payments.status} = 'SUCCESS' and UPPER(${payments.purpose}) = 'SUBSCRIPTION' then ${payments.amount} else 0 end), 0)`,
        dailyOrderRevenue: sql<number>`coalesce(sum(case when ${payments.status} = 'SUCCESS' and (UPPER(${payments.purpose}) = 'ORDER' or ${payments.purpose} is null) then ${payments.amount} else 0 end), 0)`,
        pendingFailedCount: sql<number>`count(case when ${payments.status} in ('PENDING', 'FAILED') then 1 end)`,
        totalTransactions: count(payments.id),
      })
      .from(payments);

    // 2. Build Query Filters for Transactions Ledger
    const conditions = [];

    if (purpose !== "ALL") {
      conditions.push(sql`UPPER(${payments.purpose}) = ${purpose.toUpperCase()}`);
    }

    if (status !== "ALL") {
      conditions.push(eq(payments.status, status as any));
    }

    if (method !== "ALL") {
      conditions.push(eq(payments.method, method as any));
    }

    if (dateRange === "TODAY") {
      conditions.push(gte(payments.createdAt, new Date(new Date().setHours(0, 0, 0, 0))));
    } else if (dateRange === "THIS_WEEK") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      conditions.push(gte(payments.createdAt, weekAgo));
    } else if (dateRange === "THIS_MONTH") {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      conditions.push(gte(payments.createdAt, monthAgo));
    }

    if (search.trim()) {
      const queryStr = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(users.name, queryStr),
          ilike(users.email, queryStr),
          ilike(users.phone, queryStr),
          ilike(payments.id, queryStr),
          ilike(payments.transactionId, queryStr),
          ilike(payments.razorpayPaymentId, queryStr),
          ilike(payments.razorpayOrderId, queryStr),
          ilike(payments.orderId, queryStr),
          ilike(payments.subscriptionId, queryStr)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 3. Fetch Payments Ledger
    const rawLogs = await db
      .select({
        id: payments.id,
        userId: payments.userId,
        orderId: payments.orderId,
        subscriptionId: payments.subscriptionId,
        razorpayOrderId: payments.razorpayOrderId,
        razorpayPaymentId: payments.razorpayPaymentId,
        razorpaySignature: payments.razorpaySignature,
        amount: payments.amount,
        currency: payments.currency,
        method: payments.method,
        purpose: payments.purpose,
        receipt: payments.receipt,
        transactionId: payments.transactionId,
        status: payments.status,
        refundAmount: payments.refundAmount,
        refundReason: payments.refundReason,
        refundRefId: payments.refundRefId,
        refundedAt: payments.refundedAt,
        notes: payments.notes,
        paidAt: payments.paidAt,
        createdAt: payments.createdAt,
        updatedAt: payments.updatedAt,
        userName: users.name,
        userEmail: users.email,
        userPhone: users.phone,
        orderTotal: orders.total,
        orderStatus: orders.status,
        subscriptionStatus: subscriptions.status,
        subscriptionMeals: subscriptions.totalMeals,
      })
      .from(payments)
      .leftJoin(users, eq(payments.userId, users.id))
      .leftJoin(orders, eq(payments.orderId, orders.id))
      .leftJoin(subscriptions, eq(payments.subscriptionId, subscriptions.id))
      .where(whereClause)
      .orderBy(desc(payments.createdAt))
      .limit(300);

    const formattedTransactions = rawLogs.map((p) => {
      const txnDisplay = p.transactionId || p.razorpayPaymentId || `TXN-${p.id.slice(0, 8).toUpperCase()}`;
      const customerName = p.userName || p.userEmail || p.userPhone || "Customer User";
      const referenceId = p.subscriptionId
        ? `SUB-${p.subscriptionId.slice(0, 8).toUpperCase()}`
        : p.orderId
        ? `ORD-${p.orderId.slice(0, 8).toUpperCase()}`
        : `N/A`;

      return {
        ...p,
        txnDisplay,
        customerName,
        referenceId,
        purposeNormalized: (p.purpose || "ORDER").toUpperCase(),
      };
    });

    return NextResponse.json({
      summary: {
        totalRevenue: Number(summaryStats?.totalRevenue || 0),
        todayRevenue: Number(summaryStats?.todayRevenue || 0),
        subscriptionRevenue: Number(summaryStats?.subscriptionRevenue || 0),
        dailyOrderRevenue: Number(summaryStats?.dailyOrderRevenue || 0),
        pendingFailedCount: Number(summaryStats?.pendingFailedCount || 0),
        totalTransactions: Number(summaryStats?.totalTransactions || 0),
      },
      transactions: formattedTransactions,
    });
  } catch (error: any) {
    console.error("GET /api/admin/payments error:", error);
    return NextResponse.json({ error: "Failed to fetch payment ledger." }, { status: 500 });
  }
}
