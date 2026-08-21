import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/db";
import { offers } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { Eye, Pencil, Plus, Power, Ticket, Trash2 } from "lucide-react";

import ActionButton from "@/components/admin/action-button";
import PageHeader from "@/components/admin/page-header";
import PageCard from "@/components/admin/page-card";
import DataTable from "@/components/admin/data-table";
import StatCard from "@/components/admin/stat-card";
import StatusBadge from "@/components/admin/status-badge";
import ImageUploader from "@/components/shared/image-uploader";

const DISCOUNT_TYPE_OPTIONS = ["PERCENTAGE", "FIXED"] as const;
type DiscountType = (typeof DISCOUNT_TYPE_OPTIONS)[number];

async function createOffer(formData: FormData) {
  "use server";

  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const rawType = String(formData.get("type") ?? "PERCENTAGE");
  const type: DiscountType = DISCOUNT_TYPE_OPTIONS.includes(rawType as DiscountType)
    ? (rawType as DiscountType)
    : "PERCENTAGE";
  const value = Number(formData.get("value") ?? 0);
  const minOrderAmount = Number(formData.get("minOrderAmount") ?? 0);
  const maxDiscount = Number(formData.get("maxDiscount") ?? 0);
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");

  if (!name || !startDate || !endDate || !Number.isFinite(value) || value <= 0) {
    redirect("/admin/offers");
  }

  const payload = {
    name,
    description: description || null,
    discountType: type,
    discountValue: value,
    minOrderAmount: minOrderAmount || null,
    maxDiscount: maxDiscount || null,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    isActive: true,
    updatedAt: new Date(),
  };

  if (id) {
    await db.update(offers).set(payload).where(eq(offers.id, id));
  } else {
    await db.insert(offers).values({ id: crypto.randomUUID(), ...payload });
  }

  revalidatePath("/admin/offers");
  redirect("/admin/offers");
}

async function toggleOfferStatus(formData: FormData) {
  "use server";

  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const isActive = String(formData.get("isActive") ?? "false") === "true";

  if (!id) {
    redirect("/admin/offers");
  }

  await db.update(offers).set({ isActive: !isActive, updatedAt: new Date() }).where(eq(offers.id, id));

  revalidatePath("/admin/offers");
  redirect("/admin/offers");
}

async function deleteOffer(formData: FormData) {
  "use server";

  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) {
    redirect("/admin/offers");
  }

  await db.delete(offers).where(eq(offers.id, id));

  revalidatePath("/admin/offers");
  redirect("/admin/offers");
}

export default async function OffersPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined };
}) {
  await requireAdmin();

  const params = searchParams ? await searchParams : {};
  const addModal = params.modal === "add";
  const viewId = typeof params.view === "string" ? params.view : undefined;
  const editId = typeof params.edit === "string" ? params.edit : undefined;

  const offerRows = await db
    .select()
    .from(offers)
    .orderBy(desc(offers.createdAt));

  const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(n);
  const fmtPercent = (n: number) => `${n}%`;
  const fmtCurrency = (n: number) => `₹${fmt(n)}`;

  const selectedOffer = offerRows.find((o) => o.id === (viewId ?? editId)) ?? undefined;
  const activeCount = offerRows.filter((o) => o.isActive).length;
  const inactiveCount = offerRows.length - activeCount;
  const percentageOffers = offerRows.filter((o) => o.discountType === "PERCENTAGE").length;
  const fixedOffers = offerRows.filter((o) => o.discountType === "FIXED").length;

  const formatValue = (offer: typeof offerRows[0]) => {
    if (offer.discountType === "PERCENTAGE") return fmtPercent(offer.discountValue);
    return fmtCurrency(offer.discountValue);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Offers & Discounts"
        subtitle="Create promotional offers to boost sales and customer engagement."
        actions={<ActionButton href="?modal=add" variant="primary">+ Add Offer</ActionButton>}
      />

      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Offers" value={String(offerRows.length)} icon={Ticket} iconBg="#EDF2EE" iconColor="#496A5A" sub="Active + inactive" />
        <StatCard label="Active" value={String(activeCount)} icon={Power} iconBg="#E8F9EE" iconColor="#1F7A4A" sub="Live promotions" />
        <StatCard label="Percentage" value={String(percentageOffers)} icon={Eye} iconBg="#EEF2FF" iconColor="#4F46E5" sub="Off offers" />
        <StatCard label="Fixed Amount" value={String(fixedOffers)} icon={Eye} iconBg="#F5F3EE" iconColor="#675D4D" sub="Flat discounts" />
      </div>

      <PageCard noPadding>
        <div className="px-5 py-4 border-b" style={{ borderColor: "#E8E4D9" }}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold" style={{ color: "#24332B" }}>Promotional offers</h2>
            <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "#EDF2EE", color: "#496A5A" }}>
              {offerRows.length} offers
            </span>
          </div>
        </div>

        <DataTable
          columns={[
            { label: "Offer Name" },
            { label: "Type" },
            { label: "Value" },
            { label: "Min Order" },
            { label: "Valid Until" },
            { label: "Status" },
            { label: "Actions", className: "text-right" },
          ]}
          rows={offerRows.map((offer) => [
            <div key="name" className="font-medium" style={{ color: "#24332B" }}>{offer.name}</div>,
            <span key="type" className="text-xs px-2 py-1 rounded-full" style={{ background: "#F3F4F6", color: "#374151" }}>
              {offer.discountType.replace(/_/g, " ")}
            </span>,
            <span key="value" className="font-medium" style={{ color: "#496A5A" }}>{formatValue(offer)}</span>,
            <span key="min" className="text-sm" style={{ color: "#4B5563" }}>
              {offer.minOrderAmount ? fmtCurrency(offer.minOrderAmount) : "—"}
            </span>,
            <span key="end" className="text-sm" style={{ color: "#7C817A" }}>
              {new Date(offer.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </span>,
            <StatusBadge key="status" status={offer.isActive ? "ACTIVE" : "PAUSED"} />,
            <div key="actions" className="flex justify-end gap-2">
              <a href={`?view=${offer.id}`} className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition hover:opacity-90" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}><Eye size={12} />View</a>
              <a href={`?edit=${offer.id}`} className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition hover:opacity-90" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}><Pencil size={12} />Edit</a>
              <form action={toggleOfferStatus}>
                <input type="hidden" name="id" value={offer.id} />
                <input type="hidden" name="isActive" value={String(offer.isActive)} />
                <button type="submit" className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition hover:opacity-90" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }} title={offer.isActive ? "Deactivate offer" : "Activate offer"}><Power size={12} />{offer.isActive ? "Disable" : "Enable"}</button>
              </form>
              <form action={deleteOffer}><input type="hidden" name="id" value={offer.id} /><button type="submit" className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition hover:opacity-90" style={{ borderColor: "#F5C5C5", background: "#FFF7F7", color: "#B42318" }} title="Delete offer"><Trash2 size={12} />Delete</button></form>
            </div>,
          ])}
          emptyMessage="No offers created yet. Create your first promotional offer to start driving sales."
        />
      </PageCard>

      {(addModal || selectedOffer) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl" style={{ border: "1px solid #E8E4D9" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: "#24332B" }}>{addModal ? "Add offer" : selectedOffer ? (editId ? "Edit offer" : "Offer details") : "Offer"}</h3>
              <a href="/admin/offers" className="text-sm" style={{ color: "#7C817A" }}>Close</a>
            </div>

            {addModal || editId ? (
              <form action={addModal ? createOffer : createOffer} className="space-y-4">
                {editId && <input type="hidden" name="id" value={selectedOffer?.id ?? editId} />}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>Offer name</label>
                  <input name="name" defaultValue={selectedOffer?.name ?? ""} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }} required />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>Description</label>
                  <textarea name="description" rows={3} defaultValue={selectedOffer?.description ?? ""} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>Discount type</label>
                    <select name="type" defaultValue={selectedOffer?.discountType ?? "PERCENTAGE"} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}>
                      {DISCOUNT_TYPE_OPTIONS.map((type) => (
                        <option key={type} value={type}>{type.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>Discount value</label>
                    <input name="value" type="number" min="0.01" step="0.01" defaultValue={selectedOffer ? (selectedOffer.discountType === "PERCENTAGE" ? selectedOffer.discountValue : selectedOffer.discountValue / 100) : 0} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }} required />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>Min order amount (₹)</label>
                    <input name="minOrderAmount" type="number" min="0" step="1" defaultValue={selectedOffer?.minOrderAmount ?? 0} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>Max discount (₹)</label>
                    <input name="maxDiscount" type="number" min="0" step="1" defaultValue={selectedOffer?.maxDiscount ?? 0} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>Start date</label>
                    <input name="startDate" type="date" defaultValue={selectedOffer ? new Date(selectedOffer.startDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }} required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>End date</label>
                    <input name="endDate" type="date" defaultValue={selectedOffer ? new Date(selectedOffer.endDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }} required />
                  </div>
                </div>
                <div>
                  <ImageUploader folder="offers" name="imageUrl" label="Upload Promotional Banner Image" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <a href="/admin/offers" className="rounded-lg border px-3 py-2 text-sm font-medium" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}>Cancel</a>
                  <button type="submit" className="rounded-lg px-3 py-2 text-sm font-medium" style={{ background: "#496A5A", color: "#fff" }}>{addModal ? "Save offer" : "Update offer"}</button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-sm">
                <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}>
                  <div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Offer name</div>
                  <div className="mt-1 font-medium" style={{ color: "#24332B" }}>{selectedOffer?.name ?? "—"}</div>
                </div>
                <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}>
                  <div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Description</div>
                  <div className="mt-1" style={{ color: "#24332B" }}>{selectedOffer?.description || "No description provided."}</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}>
                    <div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Discount type</div>
                    <div className="mt-1" style={{ color: "#24332B" }}>{selectedOffer?.discountType.replace(/_/g, " ") ?? "—"}</div>
                  </div>
                  <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}>
                    <div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Value</div>
                    <div className="mt-1 font-medium" style={{ color: "#496A5A" }}>{selectedOffer ? formatValue(selectedOffer) : "—"}</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}>
                    <div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Min order amount</div>
                    <div className="mt-1" style={{ color: "#24332B" }}>{selectedOffer?.minOrderAmount ? fmtCurrency(selectedOffer.minOrderAmount) : "—"}</div>
                  </div>
                  <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}>
                    <div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Max discount</div>
                    <div className="mt-1" style={{ color: "#24332B" }}>{selectedOffer?.maxDiscount ? fmtCurrency(selectedOffer.maxDiscount) : "—"}</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}>
                    <div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Start date</div>
                    <div className="mt-1" style={{ color: "#24332B" }}>{selectedOffer ? new Date(selectedOffer.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</div>
                  </div>
                  <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}>
                    <div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>End date</div>
                    <div className="mt-1" style={{ color: "#24332B" }}>{selectedOffer ? new Date(selectedOffer.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <a href={`?edit=${selectedOffer?.id ?? ""}`} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}><Pencil size={14} />Edit</a>
                  <a href="/admin/offers" className="rounded-lg px-3 py-2 text-sm font-medium" style={{ background: "#496A5A", color: "#fff" }}>Close</a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
