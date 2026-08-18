import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/db";
import { deliveryAssignments, orders, users } from "@/db/schema";
import { aliasedTable, desc, eq } from "drizzle-orm";
import { Eye, Pencil, Plus, Truck, Navigation } from "lucide-react";

import ActionButton from "@/components/admin/action-button";
import PageHeader from "@/components/admin/page-header";
import PageCard from "@/components/admin/page-card";
import DataTable from "@/components/admin/data-table";
import StatCard from "@/components/admin/stat-card";
import StatusBadge from "@/components/admin/status-badge";

const DELIVERY_STATUS_OPTIONS = ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED", "FAILED"] as const;
type DeliveryStatus = (typeof DELIVERY_STATUS_OPTIONS)[number];

async function createDeliveryAssignment(formData: FormData) {
  "use server";

  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const orderId = String(formData.get("orderId") ?? "").trim();
  const staffId = String(formData.get("staffId") ?? "").trim();
  const rawStatus = String(formData.get("status") ?? "ASSIGNED");
  const status: DeliveryStatus = DELIVERY_STATUS_OPTIONS.includes(rawStatus as DeliveryStatus)
    ? (rawStatus as DeliveryStatus)
    : "ASSIGNED";

  if (!orderId || !staffId) {
    redirect("/admin/delivery");
  }

  const payload = {
    orderId,
    staffId,
    status,
    updatedAt: new Date(),
  };

  if (id) {
    await db.update(deliveryAssignments).set(payload).where(eq(deliveryAssignments.id, id));
  } else {
    await db.insert(deliveryAssignments).values({ id: crypto.randomUUID(), ...payload, createdAt: new Date() });
  }

  revalidatePath("/admin/delivery");
  redirect("/admin/delivery");
}

async function updateDeliveryStatus(formData: FormData) {
  "use server";

  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const rawStatus = String(formData.get("status") ?? "ASSIGNED");
  const status: DeliveryStatus = DELIVERY_STATUS_OPTIONS.includes(rawStatus as DeliveryStatus)
    ? (rawStatus as DeliveryStatus)
    : "ASSIGNED";

  if (!id) {
    redirect("/admin/delivery");
  }

  await db.update(deliveryAssignments).set({ status, updatedAt: new Date() }).where(eq(deliveryAssignments.id, id));

  revalidatePath("/admin/delivery");
  redirect("/admin/delivery");
}

async function deleteDeliveryAssignment(formData: FormData) {
  "use server";

  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) {
    redirect("/admin/delivery");
  }

  await db.delete(deliveryAssignments).where(eq(deliveryAssignments.id, id));

  revalidatePath("/admin/delivery");
  redirect("/admin/delivery");
}

export default async function DeliveryPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined };
}) {
  await requireAdmin();

  const params = searchParams ? await searchParams : {};
  const addModal = params.modal === "add";
  const viewId = typeof params.view === "string" ? params.view : undefined;
  const editId = typeof params.edit === "string" ? params.edit : undefined;
  const routeId = typeof params.route === "string" ? params.route : undefined;

  const staff = aliasedTable(users, "staff_users");

  const assignments = await db
    .select({
      id: deliveryAssignments.id,
      status: deliveryAssignments.status,
      scheduledAt: deliveryAssignments.scheduledAt,
      deliveredAt: deliveryAssignments.deliveredAt,
      failureReason: deliveryAssignments.failureReason,
      orderId: deliveryAssignments.orderId,
      orderTotal: orders.total,
      orderStatus: orders.status,
      customerName: users.name,
      staffName: staff.name,
    })
    .from(deliveryAssignments)
    .leftJoin(orders, eq(deliveryAssignments.orderId, orders.id))
    .leftJoin(users, eq(orders.userId, users.id))
    .leftJoin(staff, eq(deliveryAssignments.staffId, staff.id))
    .orderBy(desc(deliveryAssignments.createdAt));

  const total = assignments.length;
  const assigned = assignments.filter((item) => item.status === "ASSIGNED").length;
  const outForDelivery = assignments.filter((item) => item.status === "OUT_FOR_DELIVERY").length;
  const delivered = assignments.filter((item) => item.status === "DELIVERED").length;
  const selected = assignments.find((assignment) => assignment.id === (viewId ?? editId));
  const routeAssignment = assignments.find((assignment) => assignment.id === routeId);

  // If route view is active, redirect to routes page
  if (routeId && !viewId && !editId) {
    redirect(`/admin/delivery/routes?assignment=${routeId}`);
  }

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Deliveries"
        subtitle="Manage delivery assignments and live order drops."
        actions={<ActionButton href="?modal=add" variant="primary">+ Assign Delivery</ActionButton>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total" value={String(total)} icon={Plus} iconBg="#EDF2EE" iconColor="#496A5A" sub="Assignments" />
        <StatCard label="Assigned" value={String(assigned)} icon={Truck} iconBg="#E0F2FE" iconColor="#0369A1" sub="Ready to send" />
        <StatCard label="Out for delivery" value={String(outForDelivery)} icon={Truck} iconBg="#FDF3C7" iconColor="#A16207" sub="On the road" />
        <StatCard label="Delivered" value={String(delivered)} icon={Plus} iconBg="#E8F9EE" iconColor="#1F7A4A" sub="Completed" />
      </div>

      <PageCard noPadding>
        <div className="px-5 py-4 border-b" style={{ borderColor: "#E8E4D9" }}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold" style={{ color: "#24332B" }}>Recent deliveries</h2>
            <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "#EDF2EE", color: "#496A5A" }}>{assignments.length} records</span>
          </div>
        </div>

        <DataTable
          columns={[{ label: "Order" }, { label: "Customer" }, { label: "Driver" }, { label: "Amount" }, { label: "Status" }, { label: "Actions", className: "text-right" }]}
          rows={assignments.map((assignment) => [
            <span key="order" className="font-mono text-xs" style={{ color: "#496A5A" }}>#{assignment.orderId?.slice(-6).toUpperCase() || "—"}</span>,
            <span key="customer" className="font-medium" style={{ color: "#24332B" }}>{assignment.customerName || "Guest"}</span>,
            <span key="driver" style={{ color: "#4B5563" }}>{assignment.staffName || "Unassigned"}</span>,
            <span key="amount" className="font-medium" style={{ color: "#24332B" }}>₹{Number(assignment.orderTotal ?? 0).toLocaleString("en-IN")}</span>,
            <StatusBadge key="status" status={assignment.status} />,
            <div key="actions" className="flex justify-end gap-2">
              <a href={`?view=${assignment.id}`} className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition hover:opacity-90" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}><Eye size={12} />View</a>
              <a href={`?route=${assignment.id}`} className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition hover:opacity-90" style={{ borderColor: "#C4D9C7", background: "#F0FDF4", color: "#16A34A" }}><Navigation size={12} />Route</a>
              <a href={`?edit=${assignment.id}`} className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition hover:opacity-90" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}><Pencil size={12} />Edit</a>
              <form action={deleteDeliveryAssignment}><input type="hidden" name="id" value={assignment.id} /><button type="submit" className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition hover:opacity-90" style={{ borderColor: "#F5C5C5", background: "#FFF7F7", color: "#B42318" }} title="Delete assignment">Delete</button></form>
            </div>,
          ])}
          emptyMessage="No delivery assignments yet. Assign a driver to start dispatching orders."
        />
      </PageCard>

      {(addModal || selected) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl" style={{ border: "1px solid #E8E4D9" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: "#24332B" }}>{addModal ? "Assign delivery" : selected ? (editId ? "Edit delivery" : "Delivery details") : "Delivery"}</h3>
              <a href="/admin/delivery" className="text-sm" style={{ color: "#7C817A" }}>Close</a>
            </div>

            {addModal || editId ? (
              <form action={createDeliveryAssignment} className="space-y-4">
                {editId && <input type="hidden" name="id" value={selected?.id ?? editId} />}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>Order ID</label>
                    <input name="orderId" defaultValue={selected?.orderId ?? ""} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }} required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>Staff ID</label>
                    <input name="staffId" defaultValue={selected?.staffName ?? ""} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }} required />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>Status</label>
                  <select name="status" defaultValue={selected?.status ?? "ASSIGNED"} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}>
                    {DELIVERY_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status.replace(/_/g, " ")}</option>)}
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <a href="/admin/delivery" className="rounded-lg border px-3 py-2 text-sm font-medium" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}>Cancel</a>
                  <button type="submit" className="rounded-lg px-3 py-2 text-sm font-medium" style={{ background: "#496A5A", color: "#fff" }}>{addModal ? "Save assignment" : "Update assignment"}</button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}><div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Order</div><div className="mt-1 font-medium" style={{ color: "#24332B" }}>#{selected?.orderId?.slice(-6).toUpperCase() || "—"}</div></div>
                  <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}><div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Status</div><div className="mt-1"><StatusBadge status={selected?.status ?? "ASSIGNED"} /></div></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}><div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Customer</div><div className="mt-1" style={{ color: "#24332B" }}>{selected?.customerName || "Guest"}</div></div>
                  <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}><div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Driver</div><div className="mt-1" style={{ color: "#24332B" }}>{selected?.staffName || "Unassigned"}</div></div>
                </div>
                <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}><div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Failure reason</div><div className="mt-1" style={{ color: "#24332B" }}>{selected?.failureReason || "No issues reported."}</div></div>
                <div className="flex justify-end gap-2">
                  <a href={`?edit=${selected?.id ?? ""}`} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}><Pencil size={14} />Edit</a>
                  <a href="/admin/delivery" className="rounded-lg px-3 py-2 text-sm font-medium" style={{ background: "#496A5A", color: "#fff" }}>Close</a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
