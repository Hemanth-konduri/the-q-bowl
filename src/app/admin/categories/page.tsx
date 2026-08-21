import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { Plus, Power, Trash2, Pencil, Eye } from "lucide-react";

import PageHeader from "@/components/admin/page-header";
import PageCard from "@/components/admin/page-card";
import DataTable from "@/components/admin/data-table";
import StatusBadge from "@/components/admin/status-badge";
import ActionButton from "@/components/admin/action-button";
import StatCard from "@/components/admin/stat-card";
import ImageUploader from "@/components/shared/image-uploader";

async function createCategory(formData: FormData) {
  "use server";

  await requireAdmin();
  const rawName = String(formData.get("name") ?? "").trim();
  if (!rawName) redirect("/admin/categories");

  const name = rawName.replace(/\s+/g, " ");
  const existing = await db.select({ id: categories.id }).from(categories).where(eq(categories.name, name)).limit(1);

  if (!existing.length) {
    await db.insert(categories).values({ id: crypto.randomUUID(), name, isActive: true });
  }

  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

async function updateCategory(formData: FormData) {
  "use server";

  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) redirect("/admin/categories");

  await db.update(categories).set({ name, updatedAt: new Date() }).where(eq(categories.id, id));
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

async function toggleCategoryStatus(formData: FormData) {
  "use server";

  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const isActive = String(formData.get("isActive") ?? "false") === "true";
  if (!id) redirect("/admin/categories");

  await db.update(categories).set({ isActive: !isActive, updatedAt: new Date() }).where(eq(categories.id, id));
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

async function deleteCategory(formData: FormData) {
  "use server";

  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/categories");

  await db.delete(categories).where(eq(categories.id, id));
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export default async function CategoriesPage({ searchParams }: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined } }) {
  await requireAdmin();
  const params = searchParams ? await searchParams : {};
  const addModal = params.modal === "add";
  const viewId = typeof params.view === "string" ? params.view : undefined;
  const editId = typeof params.edit === "string" ? params.edit : undefined;

  const categoryRows = await db.select().from(categories).orderBy(desc(categories.createdAt));
  const activeCount = categoryRows.filter((cat) => cat.isActive).length;
  const inactiveCount = categoryRows.length - activeCount;
  const selected = categoryRows.find((cat) => cat.id === (viewId ?? editId));

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Categories"
        subtitle="Manage menu sections for food items and daily menu planning."
        actions={<ActionButton href="?modal=add" variant="primary">+ Add Category</ActionButton>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Categories" value={String(categoryRows.length)} icon={Plus} iconBg="#EDF2EE" iconColor="#496A5A" sub="Across the menu" />
        <StatCard label="Active" value={String(activeCount)} icon={Power} iconBg="#E8F9EE" iconColor="#1F7A4A" sub="Live catalog" />
        <StatCard label="Inactive" value={String(inactiveCount)} icon={Power} iconBg="#F5F3EE" iconColor="#675D4D" sub="Hidden from customers" />
        <StatCard label="Status" value={activeCount > 0 ? "Healthy" : "Needs setup"} icon={Eye} iconBg="#EEF2FF" iconColor="#4F46E5" sub="Menu readiness" />
      </div>

      <PageCard noPadding>
        <div className="px-5 py-4 border-b" style={{ borderColor: "#E8E4D9" }}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold" style={{ color: "#24332B" }}>All categories</h2>
            <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "#EDF2EE", color: "#496A5A" }}>{categoryRows.length} total</span>
          </div>
        </div>

        <DataTable
          columns={[{ label: "Name" }, { label: "Status" }, { label: "Updated" }, { label: "Actions", className: "text-right" }]}
          rows={categoryRows.map((category) => [
            <div key="name" className="font-medium" style={{ color: "#24332B" }}>{category.name}</div>,
            <StatusBadge key="status" status={category.isActive ? "ACTIVE" : "PAUSED"} />,
            <span key="updated" className="text-xs" style={{ color: "#7C817A" }}>{new Date(category.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>,
            <div key="actions" className="flex justify-end gap-2">
              <a href={`?view=${category.id}`} className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition hover:opacity-90" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}><Eye size={12} />View</a>
              <form action={toggleCategoryStatus}>
                <input type="hidden" name="id" value={category.id} />
                <input type="hidden" name="isActive" value={String(category.isActive)} />
                <button type="submit" className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition hover:opacity-90" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }} title={category.isActive ? "Deactivate category" : "Activate category"}><Power size={12} />{category.isActive ? "Disable" : "Enable"}</button>
              </form>
              <form action={deleteCategory}><input type="hidden" name="id" value={category.id} /><button type="submit" className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition hover:opacity-90" style={{ borderColor: "#F5C5C5", background: "#FFF7F7", color: "#B42318" }} title="Delete category"><Trash2 size={12} />Delete</button></form>
            </div>,
          ])}
          emptyMessage="No categories created yet. Add your first category to begin menu setup."
        />
      </PageCard>

      {(addModal || selected) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" style={{ border: "1px solid #E8E4D9" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: "#24332B" }}>{addModal ? "Add category" : selected ? (editId ? "Edit category" : "Category details") : "Category"}</h3>
              <a href="/admin/categories" className="text-sm" style={{ color: "#7C817A" }}>Close</a>
            </div>

            {addModal || editId ? (
              <form action={addModal ? createCategory : updateCategory} className="space-y-4">
                {editId && <input type="hidden" name="id" value={selected?.id ?? editId} />}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>Category name</label>
                  <input name="name" defaultValue={selected?.name ?? ""} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }} required />
                </div>
                <div>
                  <ImageUploader folder="categories" name="imageUrl" label="Upload Category Image" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <a href="/admin/categories" className="rounded-lg border px-3 py-2 text-sm font-medium" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}>Cancel</a>
                  <button type="submit" className="rounded-lg px-3 py-2 text-sm font-medium" style={{ background: "#496A5A", color: "#fff" }}>{addModal ? "Save category" : "Update category"}</button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-sm">
                <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}>
                  <div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Name</div>
                  <div className="mt-1 font-medium" style={{ color: "#24332B" }}>{selected?.name ?? "—"}</div>
                </div>
                <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}>
                  <div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Status</div>
                  <div className="mt-1"><StatusBadge status={selected?.isActive ? "ACTIVE" : "PAUSED"} /></div>
                </div>
                <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}>
                  <div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Updated</div>
                  <div className="mt-1" style={{ color: "#24332B" }}>{selected ? new Date(selected.updatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—"}</div>
                </div>
                <div className="flex justify-end gap-2">
                  <a href={`?edit=${selected?.id ?? ""}`} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}><Pencil size={14} />Edit</a>
                  <a href="/admin/categories" className="rounded-lg px-3 py-2 text-sm font-medium" style={{ background: "#496A5A", color: "#fff" }}>Close</a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
