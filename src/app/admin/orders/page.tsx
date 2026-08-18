import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/db";
import { orders, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { Eye, Plus } from "lucide-react";

import ActionButton from "@/components/admin/action-button";
import PageHeader from "@/components/admin/page-header";
import PageCard from "@/components/admin/page-card";
import DataTable from "@/components/admin/data-table";
import StatCard from "@/components/admin/stat-card";
import StatusBadge from "@/components/admin/status-badge";

const ORDER_STATUS_OPTIONS = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "FAILED",
] as const;

type OrderStatus = (typeof ORDER_STATUS_OPTIONS)[number];

async function updateOrderStatus(formData: FormData) {
  "use server";

  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const rawStatus = String(formData.get("status") ?? "PENDING");
  const status: OrderStatus = ORDER_STATUS_OPTIONS.includes(rawStatus as OrderStatus)
    ? (rawStatus as OrderStatus)
    : "PENDING";

  if (!id) {
    redirect("/admin/orders");
  }

  await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.id, id));

  revalidatePath("/admin/orders");
  redirect("/admin/orders");
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined };
}) {
  await requireAdmin();

  const params = searchParams ? await searchParams : {};
  const addModal = params.modal === "add";
  const selectedOrderId = typeof params.view === "string" ? params.view : undefined;

  const orderRows = await db
    .select({
      id: orders.id,
      type: orders.type,
      status: orders.status,
      total: orders.total,
      createdAt: orders.createdAt,
      customerName: users.name,
      customerEmail: users.email,
      itemCount: sql<number>`COALESCE((SELECT COUNT(*) FROM order_items WHERE order_items.order_id = ${orders.id}), 0)`,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .orderBy(sql`${orders.createdAt} desc`);

  const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(n);
  const selectedOrder = orderRows.find((order) => order.id === selectedOrderId) ?? undefined;
  const pending = orderRows.filter((order) => order.status === "PENDING").length;
  const preparing = orderRows.filter((order) => order.status === "PREPARING").length;
  const revenue = orderRows.reduce((total, order) => total + Number(order.total), 0);

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Orders"
        subtitle="Review incoming and active kitchen orders across the platform."
        actions={<ActionButton href="?modal=add" variant="primary">+ Add Order</ActionButton>}
      />

      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total" value={String(orderRows.length)} icon={Plus} iconBg="#EDF2EE" iconColor="#496A5A" sub="All orders" />
        <StatCard label="Pending" value={String(pending)} icon={Eye} iconBg="#FDF3C7" iconColor="#A16207" sub="Needs action" />
        <StatCard label="Preparing" value={String(preparing)} icon={Plus} iconBg="#E0F2FE" iconColor="#0369A1" sub="In kitchen" />
        <StatCard label="Revenue" value={`₹${fmt(revenue)}`} icon={Eye} iconBg="#E8F9EE" iconColor="#1F7A4A" sub="Gross sales" />
      </div>

      <PageCard noPadding>
        <div className="px-5 py-4 border-b" style={{ borderColor: "#E8E4D9" }}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold" style={{ color: "#24332B" }}>Recent orders</h2>
            <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "#EDF2EE", color: "#496A5A" }}>
              {orderRows.length} orders
            </span>
          </div>
        </div>

        <DataTable
          columns={[
            { label: "Order" },
            { label: "Customer" },
            { label: "Type" },
            { label: "Items" },
            { label: "Amount" },
            { label: "Status" },
            { label: "Time" },
            { label: "Action" },
          ]}
          rows={orderRows.map((order) => [
            <span key="order" className="font-mono text-xs" style={{ color: "#496A5A" }}>
              #{order.id.slice(-6).toUpperCase()}
            </span>,
            <span key="customer" className="font-medium" style={{ color: "#24332B" }}>
              {order.customerName ?? order.customerEmail ?? "Guest"}
            </span>,
            <span key="type" style={{ color: "#4B5563" }}>{order.type}</span>,
            <span key="items" style={{ color: "#4B5563" }}>{Number(order.itemCount)} items</span>,
            <span key="amount" className="font-medium" style={{ color: "#24332B" }}>
              ₹{fmt(Number(order.total))}
            </span>,
            <StatusBadge key="status" status={order.status} />,
            <span key="time" className="text-xs" style={{ color: "#7C817A" }}>
              {new Date(order.createdAt).toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>,
            <div key="action" className="flex items-center gap-2">
              <a href={`?view=${order.id}`} className="inline-flex items-center justify-center rounded-lg border px-2 py-1.5 text-xs font-medium" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}><Eye size={12} /></a>
              <form action={updateOrderStatus} className="min-w-36">
                <input type="hidden" name="id" value={order.id} />
                <select
                  name="status"
                  defaultValue={order.status}
                  className="w-full rounded-md border px-2 py-1.5 text-xs outline-none"
                  style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}
                  onChange={(event) => {
                    const form = event.currentTarget.form;
                    if (form) form.requestSubmit();
                  }}
                >
                  {ORDER_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>{status.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </form>
            </div>,
          ])}
          emptyMessage="No orders yet. New customer orders will appear here."
        />
      </PageCard>

      {(addModal || selectedOrder) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl" style={{ border: "1px solid #E8E4D9" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: "#24332B" }}>{addModal ? "Add order" : "Order details"}</h3>
              <a href="/admin/orders" className="text-sm" style={{ color: "#7C817A" }}>Close</a>
            </div>

            {addModal ? (
              <div className="rounded-lg border border-dashed p-6 text-sm" style={{ borderColor: "#DDD9CC", color: "#7C817A" }}>
                Order creation is handled through the customer checkout flow. Use the live orders as they arrive.
              </div>
            ) : (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}><div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Order</div><div className="mt-1 font-medium" style={{ color: "#24332B" }}>#{selectedOrder?.id.slice(-6).toUpperCase()}</div></div>
                  <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}><div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Status</div><div className="mt-1"><StatusBadge status={selectedOrder?.status ?? "PENDING"} /></div></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}><div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Customer</div><div className="mt-1" style={{ color: "#24332B" }}>{selectedOrder?.customerName ?? selectedOrder?.customerEmail ?? "Guest"}</div></div>
                  <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}><div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Amount</div><div className="mt-1 font-medium" style={{ color: "#24332B" }}>₹{selectedOrder ? fmt(Number(selectedOrder.total)) : "0"}</div></div>
                </div>
                <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}><div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Order type</div><div className="mt-1" style={{ color: "#24332B" }}>{selectedOrder?.type ?? "—"}</div></div>
                <div className="flex justify-end gap-2"><a href="/admin/orders" className="rounded-lg px-3 py-2 text-sm font-medium" style={{ background: "#496A5A", color: "#fff" }}>Close</a></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
