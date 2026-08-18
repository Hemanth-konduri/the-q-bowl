import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/db";
import { deliveryAreas } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { Eye, Pencil, Plus, Power, Trash2 } from "lucide-react";

import ActionButton from "@/components/admin/action-button";
import PageHeader from "@/components/admin/page-header";
import PageCard from "@/components/admin/page-card";
import DataTable from "@/components/admin/data-table";
import StatCard from "@/components/admin/stat-card";
import StatusBadge from "@/components/admin/status-badge";

async function createDeliveryArea(formData: FormData) {
  "use server";

  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const kitchenLat = Number(formData.get("kitchenLat") ?? 0);
  const kitchenLng = Number(formData.get("kitchenLng") ?? 0);
  const radius = Number(formData.get("radius") ?? 0);
  const deliveryFee = Number(formData.get("deliveryFee") ?? 0);

  if (!name || !Number.isFinite(kitchenLat) || !Number.isFinite(kitchenLng) || !Number.isFinite(radius) || !Number.isFinite(deliveryFee)) {
    redirect("/admin/delivery-areas");
  }

  const payload = { name, kitchenLat, kitchenLng, radius, deliveryFee, isActive: true, updatedAt: new Date() };

  if (id) {
    await db.update(deliveryAreas).set(payload).where(eq(deliveryAreas.id, id));
  } else {
    await db.insert(deliveryAreas).values({ id: crypto.randomUUID(), ...payload });
  }

  revalidatePath("/admin/delivery-areas");
  redirect("/admin/delivery-areas");
}

async function toggleAreaStatus(formData: FormData) {
  "use server";

  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const isActive = String(formData.get("isActive") ?? "false") === "true";

  if (!id) {
    redirect("/admin/delivery-areas");
  }

  await db.update(deliveryAreas).set({ isActive: !isActive, updatedAt: new Date() }).where(eq(deliveryAreas.id, id));

  revalidatePath("/admin/delivery-areas");
  redirect("/admin/delivery-areas");
}

async function deleteDeliveryArea(formData: FormData) {
  "use server";

  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) {
    redirect("/admin/delivery-areas");
  }

  await db.delete(deliveryAreas).where(eq(deliveryAreas.id, id));

  revalidatePath("/admin/delivery-areas");
  redirect("/admin/delivery-areas");
}

export default async function DeliveryAreasPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined };
}) {
  await requireAdmin();

  const params = searchParams ? await searchParams : {};
  const addModal = params.modal === "add";
  const viewId = typeof params.view === "string" ? params.view : undefined;
  const editId = typeof params.edit === "string" ? params.edit : undefined;

  const areas = await db.select().from(deliveryAreas).orderBy(desc(deliveryAreas.createdAt));
  const activeCount = areas.filter((area) => area.isActive).length;
  const inactiveCount = areas.length - activeCount;
  const selected = areas.find((area) => area.id === (viewId ?? editId));

  // Check if columns exist (handle missing columns gracefully)
  const hasKitchenCoords = areas.length > 0 && "kitchenLat" in areas[0] && "kitchenLng" in areas[0];

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Delivery Radius"
        subtitle="Set delivery range from your kitchen. Customers within the radius can order."
        actions={<ActionButton href="?modal=add" variant="primary">+ Set Radius</ActionButton>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Zones" value={String(activeCount)} icon={Plus} iconBg="#EDF2EE" iconColor="#496A5A" sub="Delivery coverage" />
        <StatCard label="Total Areas" value={String(areas.length)} icon={Power} iconBg="#E8F9EE" iconColor="#1F7A4A" sub="Configured zones" />
        <StatCard label="Max Radius" value={areas.length ? `${Math.max(...areas.map((item) => Number((item as any).radius || 0))).toFixed(1)} km` : "0 km"} icon={Eye} iconBg="#EEF2FF" iconColor="#4F46E5" sub="Coverage range" />
        <StatCard label="Delivery Fee" value={areas.length ? `₹${Math.max(...areas.map((item) => Number((item as any).deliveryFee || 0))).toLocaleString("en-IN")}` : "₹0"} icon={Power} iconBg="#F5F3EE" iconColor="#675D4D" sub="Highest fee" />
      </div>

      <PageCard noPadding>
        <div className="px-5 py-4 border-b" style={{ borderColor: "#E8E4D9" }}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold" style={{ color: "#24332B" }}>Delivery coverage</h2>
            <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "#EDF2EE", color: "#496A5A" }}>{areas.length} areas</span>
          </div>
        </div>

        <DataTable
          columns={[{ label: "Zone Name" }, { label: "Kitchen Location" }, { label: "Radius" }, { label: "Delivery Fee" }, { label: "Status" }, { label: "Actions", className: "text-right" }]}
          rows={areas.map((area) => [
            <div key="name" className="font-medium" style={{ color: "#24332B" }}>{area.name}</div>,
            <span key="location" className="text-xs" style={{ color: "#7C817A" }}>{(area as any).kitchenLat && (area as any).kitchenLng ? `${(area as any).kitchenLat.toFixed(4)}, ${(area as any).kitchenLng.toFixed(4)}` : "—"}</span>,
            <span key="radius" className="font-medium" style={{ color: "#496A5A" }}>{area.radius ? `${area.radius} km` : "—"}</span>,
            <span key="fee" className="font-medium" style={{ color: "#24332B" }}>₹{Number(area.deliveryFee).toLocaleString("en-IN")}</span>,
            <StatusBadge key="status" status={area.isActive ? "ACTIVE" : "PAUSED"} />,
            <div key="actions" className="flex justify-end gap-2">
              <a href={`?view=${area.id}`} className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition hover:opacity-90" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}><Eye size={12} />View</a>
              <a href={`?edit=${area.id}`} className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition hover:opacity-90" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}><Pencil size={12} />Edit</a>
              <form action={toggleAreaStatus}>
                <input type="hidden" name="id" value={area.id} />
                <input type="hidden" name="isActive" value={String(area.isActive)} />
                <button type="submit" className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition hover:opacity-90" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }} title={area.isActive ? "Deactivate zone" : "Activate zone"}> {area.isActive ? "Disable" : "Enable"}</button>
              </form>
              <form action={deleteDeliveryArea}><input type="hidden" name="id" value={area.id} /><button type="submit" className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition hover:opacity-90" style={{ borderColor: "#F5C5C5", background: "#FFF7F7", color: "#B42318" }} title="Delete zone">Delete</button></form>
            </div>,
          ])}
          emptyMessage="No delivery zones configured yet. Set your kitchen location and delivery radius to start taking orders."
        />
      </PageCard>

      {(addModal || selected) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl" style={{ border: "1px solid #E8E4D9" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: "#24332B" }}>{addModal ? "Add delivery area" : selected ? (editId ? "Edit delivery area" : "Area details") : "Area"}</h3>
              <a href="/admin/delivery-areas" className="text-sm" style={{ color: "#7C817A" }}>Close</a>
            </div>

            {addModal || editId ? (
              <form action={createDeliveryArea} className="space-y-4">
                {editId && <input type="hidden" name="id" value={selected?.id ?? editId} />}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>Zone name</label>
                  <input name="name" defaultValue={selected?.name ?? ""} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }} required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>Kitchen latitude</label>
                    <input name="kitchenLat" type="number" step="0.000001" defaultValue={(selected as any)?.kitchenLat ?? ""} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }} placeholder="e.g., 28.6139" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>Kitchen longitude</label>
                    <input name="kitchenLng" type="number" step="0.000001" defaultValue={(selected as any)?.kitchenLng ?? ""} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }} placeholder="e.g., 77.2090" required />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>Delivery radius (km)</label>
                  <input name="radius" type="number" min="0.1" step="0.1" defaultValue={selected?.radius ?? ""} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }} placeholder="e.g., 5" required />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>Delivery fee</label>
                  <input name="deliveryFee" type="number" min="0" step="1" defaultValue={selected?.deliveryFee ?? 0} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }} required />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <a href="/admin/delivery-areas" className="rounded-lg border px-3 py-2 text-sm font-medium" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}>Cancel</a>
                  <button type="submit" className="rounded-lg px-3 py-2 text-sm font-medium" style={{ background: "#496A5A", color: "#fff" }}>{addModal ? "Save zone" : "Update zone"}</button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-sm">
                <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}>
                  <div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Zone name</div>
                  <div className="mt-1 font-medium" style={{ color: "#24332B" }}>{selected?.name || "—"}</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}>
                    <div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Kitchen location</div>
                    <div className="mt-1 font-mono text-xs" style={{ color: "#4B5563" }}>{(selected as any)?.kitchenLat && (selected as any)?.kitchenLng ? `${(selected as any).kitchenLat.toFixed(6)}, ${(selected as any).kitchenLng.toFixed(6)}` : "—"}</div>
                  </div>
                  <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}>
                    <div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Delivery radius</div>
                    <div className="mt-1 font-medium" style={{ color: "#496A5A" }}>{selected?.radius ? `${selected.radius} km` : "—"}</div>
                  </div>
                </div>
                <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}>
                  <div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Delivery fee</div>
                  <div className="mt-1" style={{ color: "#24332B" }}>₹{selected ? Number(selected.deliveryFee).toLocaleString("en-IN") : "—"}</div>
                </div>
                <div className="flex justify-end gap-2">
                  <a href={`?edit=${selected?.id ?? ""}`} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}><Pencil size={14} />Edit</a>
                  <a href="/admin/delivery-areas" className="rounded-lg px-3 py-2 text-sm font-medium" style={{ background: "#496A5A", color: "#fff" }}>Close</a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
