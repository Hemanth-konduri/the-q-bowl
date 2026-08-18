import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/db";
import { payments, orders, subscriptions, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { Eye, Plus, CreditCard } from "lucide-react";

import ActionButton from "@/components/admin/action-button";
import PageHeader from "@/components/admin/page-header";
import PageCard from "@/components/admin/page-card";
import DataTable from "@/components/admin/data-table";
import StatCard from "@/components/admin/stat-card";
import StatusBadge from "@/components/admin/status-badge";

const PAYMENT_STATUS_OPTIONS = ["PENDING", "SUCCESS", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"] as const;
type PaymentStatus = (typeof PAYMENT_STATUS_OPTIONS)[number];

async function updatePaymentStatus(formData: FormData) {
  "use server";

  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const rawStatus = String(formData.get("status") ?? "PENDING");
  const status: PaymentStatus = PAYMENT_STATUS_OPTIONS.includes(rawStatus as PaymentStatus)
    ? (rawStatus as PaymentStatus)
    : "PENDING";

  if (!id) {
    redirect("/admin/payments");
  }

  await db.update(payments).set({ status, updatedAt: new Date() }).where(eq(payments.id, id));

  revalidatePath("/admin/payments");
  redirect("/admin/payments");
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined };
}) {
  await requireAdmin();

  const params = searchParams ? await searchParams : {};
  const selectedPaymentId = typeof params.view === "string" ? params.view : undefined;

  const paymentRows = await db
    .select({
      id: payments.id,
      orderId: payments.orderId,
      subscriptionId: payments.subscriptionId,
      amount: payments.amount,
      method: payments.method,
      status: payments.status,
      transactionId: payments.transactionId,
      paidAt: payments.paidAt,
      createdAt: payments.createdAt,
      customerName: users.name,
      customerEmail: users.email,
      orderType: orders.type,
      planName: subscriptions.planId,
    })
    .from(payments)
    .leftJoin(users, eq(payments.subscriptionId, subscriptions.id))
    .leftJoin(orders, eq(payments.orderId, orders.id))
    .leftJoin(subscriptions, eq(payments.subscriptionId, subscriptions.id))
    .orderBy(desc(payments.createdAt));

  const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(n);
  const selectedPayment = paymentRows.find((p) => p.id === selectedPaymentId) ?? undefined;
  const total = paymentRows.length;
  const success = paymentRows.filter((p) => p.status === "SUCCESS").length;
  const pending = paymentRows.filter((p) => p.status === "PENDING").length;
  const failed = paymentRows.filter((p) => p.status === "FAILED").length;
  const revenue = paymentRows.filter((p) => p.status === "SUCCESS").reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Payments"
        subtitle="Manage payment transactions and track revenue across orders and subscriptions."
        actions={<ActionButton href="#" variant="primary">+ Record Payment</ActionButton>}
      />

      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Transactions" value={String(total)} icon={Plus} iconBg="#EDF2EE" iconColor="#496A5A" sub="All payments" />
        <StatCard label="Success" value={String(success)} icon={CreditCard} iconBg="#E8F9EE" iconColor="#1F7A4A" sub="Completed" />
        <StatCard label="Pending" value={String(pending)} icon={Eye} iconBg="#FDF3C7" iconColor="#A16207" sub="Awaiting" />
        <StatCard label="Revenue" value={`₹${fmt(revenue)}`} icon={CreditCard} iconBg="#EEF2FF" iconColor="#4F46E5" sub="Collected" />
      </div>

      <PageCard noPadding>
        <div className="px-5 py-4 border-b" style={{ borderColor: "#E8E4D9" }}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold" style={{ color: "#24332B" }}>Payment records</h2>
            <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "#EDF2EE", color: "#496A5A" }}>
              {total} transactions
            </span>
          </div>
        </div>

        <DataTable
          columns={[
            { label: "Transaction" },
            { label: "Customer" },
            { label: "Type" },
            { label: "Amount" },
            { label: "Method" },
            { label: "Status" },
            { label: "Time" },
            { label: "Action" },
          ]}
          rows={paymentRows.map((payment) => [
            <span key="txn" className="font-mono text-xs" style={{ color: "#496A5A" }}>
              #{payment.id.slice(-6).toUpperCase()}
            </span>,
            <span key="customer" className="font-medium" style={{ color: "#24332B" }}>
              {payment.customerName ?? payment.customerEmail ?? "Guest"}
            </span>,
            <span key="type" style={{ color: "#4B5563" }}>
              {payment.orderId ? "Order" : "Subscription"}
            </span>,
            <span key="amount" className="font-medium" style={{ color: "#24332B" }}>
              ₹{fmt(Number(payment.amount))}
            </span>,
            <span key="method" className="text-xs px-2 py-1 rounded-full" style={{ background: "#F3F4F6", color: "#374151" }}>
              {payment.method.replace(/_/g, " ")}
            </span>,
            <StatusBadge key="status" status={payment.status} />,
            <span key="time" className="text-xs" style={{ color: "#7C817A" }}>
              {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
            </span>,
            <div key="action" className="flex items-center gap-2">
              <a href={`?view=${payment.id}`} className="inline-flex items-center justify-center rounded-lg border px-2 py-1.5 text-xs font-medium" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}><Eye size={12} /></a>
              <form action={updatePaymentStatus} className="min-w-36">
                <input type="hidden" name="id" value={payment.id} />
                <select
                  name="status"
                  defaultValue={payment.status}
                  className="w-full rounded-md border px-2 py-1.5 text-xs outline-none"
                  style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}
                  onChange={(event) => {
                    const form = event.currentTarget.form;
                    if (form) form.requestSubmit();
                  }}
                >
                  {PAYMENT_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>{status.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </form>
            </div>,
          ])}
          emptyMessage="No payment records yet. Transactions will appear here as customers complete payments."
        />
      </PageCard>

      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl" style={{ border: "1px solid #E8E4D9" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: "#24332B" }}>Payment details</h3>
              <a href="/admin/payments" className="text-sm" style={{ color: "#7C817A" }}>Close</a>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}>
                  <div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Transaction ID</div>
                  <div className="mt-1 font-mono text-xs" style={{ color: "#4B5563" }}>#{selectedPayment.id.slice(-6).toUpperCase()}</div>
                </div>
                <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}>
                  <div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Status</div>
                  <div className="mt-1"><StatusBadge status={selectedPayment.status} /></div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}>
                  <div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Customer</div>
                  <div className="mt-1" style={{ color: "#24332B" }}>{selectedPayment.customerName ?? selectedPayment.customerEmail ?? "Guest"}</div>
                </div>
                <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}>
                  <div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Amount</div>
                  <div className="mt-1 font-medium" style={{ color: "#24332B" }}>₹{fmt(Number(selectedPayment.amount))}</div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}>
                  <div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Payment Method</div>
                  <div className="mt-1" style={{ color: "#24332B" }}>{selectedPayment.method.replace(/_/g, " ")}</div>
                </div>
                <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}>
                  <div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Transaction Ref</div>
                  <div className="mt-1 font-mono text-xs" style={{ color: "#4B5563" }}>{selectedPayment.transactionId ?? "—"}</div>
                </div>
              </div>
              <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}>
                <div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Paid At</div>
                <div className="mt-1" style={{ color: "#24332B" }}>{selectedPayment.paidAt ? new Date(selectedPayment.paidAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Pending"}</div>
              </div>
              <div className="flex justify-end gap-2">
                <a href="/admin/payments" className="rounded-lg px-3 py-2 text-sm font-medium" style={{ background: "#496A5A", color: "#fff" }}>Close</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
