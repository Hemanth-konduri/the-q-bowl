import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/db";
import { users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { Eye, Pencil, Plus, Power, Trash2 } from "lucide-react";

import ActionButton from "@/components/admin/action-button";
import PageHeader from "@/components/admin/page-header";
import PageCard from "@/components/admin/page-card";
import DataTable from "@/components/admin/data-table";
import StatCard from "@/components/admin/stat-card";
import StatusBadge from "@/components/admin/status-badge";

const ROLE_OPTIONS = ["CUSTOMER", "ADMIN", "DELIVERY_STAFF"] as const;
type Role = (typeof ROLE_OPTIONS)[number];

async function createCustomer(formData: FormData) {
  "use server";

  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const rawRole = String(formData.get("role") ?? "CUSTOMER");
  const role: Role = ROLE_OPTIONS.includes(rawRole as Role) ? (rawRole as Role) : "CUSTOMER";

  if (!name || (!email && !phone)) {
    redirect("/admin/customers");
  }

  const payload = {
    name,
    email: email || null,
    phone: phone || null,
    role,
    isActive: true,
    updatedAt: new Date(),
  };

  if (id) {
    await db.update(users).set(payload).where(eq(users.id, id));
  } else {
    await db.insert(users).values({
      id: crypto.randomUUID(),
      ...payload,
    });
  }

  revalidatePath("/admin/customers");
  redirect("/admin/customers");
}

async function toggleCustomerStatus(formData: FormData) {
  "use server";

  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const isActive = String(formData.get("isActive") ?? "false") === "true";

  if (!id) {
    redirect("/admin/customers");
  }

  await db.update(users).set({ isActive: !isActive, updatedAt: new Date() }).where(eq(users.id, id));

  revalidatePath("/admin/customers");
  redirect("/admin/customers");
}

async function deleteCustomer(formData: FormData) {
  "use server";

  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) {
    redirect("/admin/customers");
  }

  await db.delete(users).where(eq(users.id, id));

  revalidatePath("/admin/customers");
  redirect("/admin/customers");
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined };
}) {
  await requireAdmin();

  const params = searchParams ? await searchParams : {};
  const addModal = params.modal === "add";
  const editId = typeof params.edit === "string" ? params.edit : undefined;

  const customerRows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  const activeCount = customerRows.filter((user) => user.isActive).length;
  const inactiveCount = customerRows.length - activeCount;
  const selected = customerRows.find((user) => user.id === editId);

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Customers"
        subtitle="Manage registered customer accounts and their account status."
        actions={<ActionButton href="?modal=add" variant="primary">+ Add Customer</ActionButton>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Customers" value={String(customerRows.length)} icon={Plus} iconBg="#EDF2EE" iconColor="#496A5A" sub="Across the platform" />
        <StatCard label="Active" value={String(activeCount)} icon={Power} iconBg="#E8F9EE" iconColor="#1F7A4A" sub="Online accounts" />
        <StatCard label="Inactive" value={String(inactiveCount)} icon={Power} iconBg="#F5F3EE" iconColor="#675D4D" sub="Disabled access" />
        <StatCard label="Role" value={activeCount > 0 ? "Healthy" : "Needs setup"} icon={Eye} iconBg="#EEF2FF" iconColor="#4F46E5" sub="Customer health" />
      </div>

      <PageCard noPadding>
        <div className="px-5 py-4 border-b" style={{ borderColor: "#E8E4D9" }}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold" style={{ color: "#24332B" }}>All customers</h2>
            <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "#EDF2EE", color: "#496A5A" }}>{customerRows.length} total</span>
          </div>
        </div>

        <DataTable
          columns={[{ label: "Customer" }, { label: "Contact" }, { label: "Role" }, { label: "Status" }, { label: "Actions", className: "text-right" }]}
          rows={customerRows.map((customer) => [
            <div key="customer" className="space-y-0.5">
              <div className="font-medium" style={{ color: "#24332B" }}>{customer.name || "Unnamed customer"}</div>
              <div className="text-xs" style={{ color: "#7C817A" }}>
                {customer.email || customer.phone || "No profile details"}
              </div>
            </div>,
            <div key="contact" className="text-sm" style={{ color: "#4B5563" }}>
              <div>{customer.email || "—"}</div>
              <div>{customer.phone || "—"}</div>
            </div>,
            <span key="role" className="text-xs px-2 py-1 rounded-full" style={{ background: "#F3F4F6", color: "#374151" }}>{customer.role}</span>,
            <StatusBadge key="status" status={customer.isActive ? "ACTIVE" : "PAUSED"} />,
            <div key="actions" className="flex justify-end gap-2">
              <a href={`/admin/customers/${customer.id}`} className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition hover:opacity-90" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}><Eye size={12} />View</a>
              <a href={`?edit=${customer.id}`} className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition hover:opacity-90" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}><Pencil size={12} />Edit</a>
              <form action={toggleCustomerStatus}>
                <input type="hidden" name="id" value={customer.id} />
                <input type="hidden" name="isActive" value={String(customer.isActive)} />
                <button type="submit" className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition hover:opacity-90" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }} title={customer.isActive ? "Deactivate customer" : "Activate customer"}><Power size={12} />{customer.isActive ? "Disable" : "Enable"}</button>
              </form>
              <form action={deleteCustomer}><input type="hidden" name="id" value={customer.id} /><button type="submit" className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition hover:opacity-90" style={{ borderColor: "#F5C5C5", background: "#FFF7F7", color: "#B42318" }} title="Delete customer"><Trash2 size={12} />Delete</button></form>
            </div>,
          ])}
          emptyMessage="No customers found. Add the first customer account to get started."
        />
      </PageCard>

      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl" style={{ border: "1px solid #E8E4D9" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: "#24332B" }}>{addModal ? "Add customer" : editId ? "Edit customer" : "Customer"}</h3>
              <a href="/admin/customers" className="text-sm" style={{ color: "#7C817A" }}>Close</a>
            </div>

            {editId ? (
              <form action={createCustomer} className="space-y-4">
                {editId && <input type="hidden" name="id" value={selected?.id ?? editId} />}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>Full name</label>
                  <input name="name" defaultValue={selected?.name ?? ""} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }} required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>Email</label>
                    <input name="email" type="email" defaultValue={selected?.email ?? ""} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>Phone</label>
                    <input name="phone" defaultValue={selected?.phone ?? ""} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>Role</label>
                  <select name="role" defaultValue={selected?.role ?? "CUSTOMER"} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}>
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <a href="/admin/customers" className="rounded-lg border px-3 py-2 text-sm font-medium" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}>Cancel</a>
                  <button type="submit" className="rounded-lg px-3 py-2 text-sm font-medium" style={{ background: "#496A5A", color: "#fff" }}>{editId ? "Update customer" : "Save customer"}</button>
                </div>
              </form>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
