import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/db";
import { subscriptionPlans, subscriptions, users } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { CalendarDays, Eye, Pencil, Plus, Power, Trash2 } from "lucide-react";

import ActionButton from "@/components/admin/action-button";
import PageHeader from "@/components/admin/page-header";
import PageCard from "@/components/admin/page-card";
import DataTable from "@/components/admin/data-table";
import StatCard from "@/components/admin/stat-card";
import StatusBadge from "@/components/admin/status-badge";
import ImageUploader from "@/components/shared/image-uploader";

const MEAL_TYPE_OPTIONS = ["BREAKFAST", "LUNCH", "DINNER", "SNACK", "OTHER"] as const;
type MealType = (typeof MEAL_TYPE_OPTIONS)[number];
const SUBSCRIPTION_STATUS_OPTIONS = ["ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"] as const;
type SubscriptionStatus = (typeof SUBSCRIPTION_STATUS_OPTIONS)[number];

async function createSubscriptionPlan(formData: FormData) {
  "use server";

  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const totalMeals = Number(formData.get("totalMeals") ?? 30);
  const mealsPerDay = Number(formData.get("mealsPerDay") ?? 1);
  const price = Number(formData.get("price") ?? 0);
  const weeklyPrice = Number(formData.get("weeklyPrice") ?? price);
  const monthlyPrice = Number(formData.get("monthlyPrice") ?? price);
  const caloriesRange = String(formData.get("caloriesRange") ?? "450 - 600 kcal").trim();
  const deliveryFrequency = String(formData.get("deliveryFrequency") ?? "Daily Dispatch").trim();
  const rawFeatures = String(formData.get("features") ?? "").trim();
  const features = rawFeatures
    ? rawFeatures.split("\n").map((f) => f.trim()).filter(Boolean)
    : [];
  const isPopular = formData.get("isPopular") === "true" || formData.get("isPopular") === "on";

  const selectedMealTypes = formData.getAll("mealTypes").map(String);
  const normalizedMealTypes = selectedMealTypes.filter((value): value is MealType =>
    MEAL_TYPE_OPTIONS.includes(value as MealType)
  );

  if (!name || price <= 0) {
    redirect("/admin/subscriptions");
  }

  const payload = {
    name,
    description: description || null,
    totalMeals,
    mealsPerDay,
    price,
    weeklyPrice,
    monthlyPrice,
    caloriesRange,
    deliveryFrequency,
    features,
    isPopular,
    mealTypes: (normalizedMealTypes.length > 0 ? normalizedMealTypes : ["LUNCH"]) as MealType[],
    isActive: true,
    updatedAt: new Date(),
  };

  if (id) {
    await db.update(subscriptionPlans).set(payload).where(eq(subscriptionPlans.id, id));
  } else {
    await db.insert(subscriptionPlans).values({
      id: crypto.randomUUID(),
      ...payload,
    });
  }

  revalidatePath("/admin/subscriptions");
  redirect("/admin/subscriptions");
}

async function togglePlanStatus(formData: FormData) {
  "use server";

  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const isActive = String(formData.get("isActive") ?? "false") === "true";

  if (!id) {
    redirect("/admin/subscriptions");
  }

  await db
    .update(subscriptionPlans)
    .set({ isActive: !isActive, updatedAt: new Date() })
    .where(eq(subscriptionPlans.id, id));

  revalidatePath("/admin/subscriptions");
  redirect("/admin/subscriptions");
}

async function deletePlan(formData: FormData) {
  "use server";

  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) {
    redirect("/admin/subscriptions");
  }

  await db.delete(subscriptionPlans).where(eq(subscriptionPlans.id, id));

  revalidatePath("/admin/subscriptions");
  redirect("/admin/subscriptions");
}

async function updateSubscriptionStatus(formData: FormData) {
  "use server";

  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const rawStatus = String(formData.get("status") ?? "ACTIVE");
  const status: SubscriptionStatus = SUBSCRIPTION_STATUS_OPTIONS.includes(rawStatus as SubscriptionStatus)
    ? (rawStatus as SubscriptionStatus)
    : "ACTIVE";

  if (!id) {
    redirect("/admin/subscriptions");
  }

  await db
    .update(subscriptions)
    .set({ status, updatedAt: new Date() })
    .where(eq(subscriptions.id, id));

  revalidatePath("/admin/subscriptions");
  redirect("/admin/subscriptions");
}

export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined };
}) {
  await requireAdmin();

  const params = searchParams ? await searchParams : {};
  const addModal = params.modal === "add";
  const viewId = typeof params.view === "string" ? params.view : undefined;
  const editId = typeof params.edit === "string" ? params.edit : undefined;

  const [planRows, activeSubscriptions] = await Promise.all([
    db
      .select()
      .from(subscriptionPlans)
      .orderBy(desc(subscriptionPlans.createdAt)),
    db
      .select({
        id: subscriptions.id,
        status: subscriptions.status,
        totalMeals: subscriptions.totalMeals,
        mealsRemaining: subscriptions.mealsRemaining,
        pricePaid: subscriptions.pricePaid,
        startDate: subscriptions.startDate,
        expectedEndDate: subscriptions.expectedEndDate,
        mealTypes: subscriptions.mealTypes,
        customerName: users.name,
        customerEmail: users.email,
        planName: subscriptionPlans.name,
      })
      .from(subscriptions)
      .leftJoin(users, eq(subscriptions.userId, users.id))
      .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .orderBy(desc(subscriptions.createdAt)),
  ]);

  const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(n);
  const selectedPlan = planRows.find((plan) => plan.id === (viewId ?? editId)) ?? undefined;
  const activePlans = planRows.filter((plan) => plan.isActive).length;
  const activeStatus = activeSubscriptions.filter((sub) => sub.status === "ACTIVE").length;
  const pausedStatus = activeSubscriptions.filter((sub) => sub.status === "PAUSED").length;
  const truncate = (text?: string | null, max = 85) => {
    if (!text) return "—";
    return text.length <= max ? text : `${text.slice(0, max).trim()}…`;
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Subscriptions"
        subtitle="Manage subscription plans and monitor active customer subscriptions."
        actions={<ActionButton href="?modal=add" variant="primary">+ Add Plan</ActionButton>}
      />

      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Plans" value={String(planRows.length)} icon={Plus} iconBg="#EDF2EE" iconColor="#496A5A" sub="Available plans" />
        <StatCard label="Active" value={String(activeStatus)} icon={Power} iconBg="#E8F9EE" iconColor="#1F7A4A" sub="Live subscriptions" />
        <StatCard label="Paused" value={String(pausedStatus)} icon={Power} iconBg="#F5F3EE" iconColor="#675D4D" sub="On hold" />
        <StatCard label="Revenue" value={`₹${fmt(activeSubscriptions.reduce((sum, sub) => sum + Number(sub.pricePaid), 0))}`} icon={CalendarDays} iconBg="#EEF2FF" iconColor="#4F46E5" sub="Collected" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        <div className="lg:col-span-5">
          <PageCard>
            <div className="flex items-center gap-2 mb-4">
              <div className="rounded-md p-2" style={{ background: "#EDF2EE", color: "#496A5A" }}>
                <Plus size={16} />
              </div>
              <h2 className="text-sm font-semibold" style={{ color: "#24332B" }}>Create plan</h2>
            </div>

            <form action={createSubscriptionPlan} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>
                  Plan title *
                </label>
                <input
                  id="name"
                  name="name"
                  placeholder="e.g. Starter Plan"
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                  style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>
                  Subtitle / Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={2}
                  placeholder="e.g. Ideal for individuals starting clean daily eating"
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                  style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="weeklyPrice" className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>
                    Weekly price (₹) *
                  </label>
                  <input
                    id="weeklyPrice"
                    name="weeklyPrice"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="1499"
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                    style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="monthlyPrice" className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>
                    Monthly price (₹) *
                  </label>
                  <input
                    id="monthlyPrice"
                    name="monthlyPrice"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="5499"
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                    style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="mealsPerDay" className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>
                    Meals / Day
                  </label>
                  <input
                    id="mealsPerDay"
                    name="mealsPerDay"
                    type="number"
                    min="1"
                    max="5"
                    defaultValue={1}
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                    style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}
                  />
                </div>

                <div>
                  <label htmlFor="price" className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>
                    Base price (₹)
                  </label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="1499"
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                    style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="caloriesRange" className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>
                    Calories range
                  </label>
                  <input
                    id="caloriesRange"
                    name="caloriesRange"
                    placeholder="e.g. 450 – 600 kcal"
                    defaultValue="450 – 600 kcal"
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                    style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}
                  />
                </div>

                <div>
                  <label htmlFor="deliveryFrequency" className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>
                    Delivery frequency
                  </label>
                  <input
                    id="deliveryFrequency"
                    name="deliveryFrequency"
                    placeholder="e.g. 5 or 6 Days / Week"
                    defaultValue="5 or 6 Days / Week"
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                    style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="features" className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>
                  Plan features (1 bullet per line)
                </label>
                <textarea
                  id="features"
                  name="features"
                  rows={4}
                  placeholder={"1 Freshly Prepared Chef Bowl / Day\nLunch or Dinner Delivery Slot\nFree Doorstep Insulated Delivery\nPause or Skip Days Anytime"}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                  style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input type="checkbox" id="isPopular" name="isPopular" value="true" className="h-4 w-4 accent-[#496A5A]" />
                <label htmlFor="isPopular" className="text-xs font-medium" style={{ color: "#24332B" }}>
                  Mark as &quot;Most Popular Choice&quot; Badge
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: "#7C817A" }}>
                  Meal types included
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {MEAL_TYPE_OPTIONS.map((mealType) => (
                    <label key={mealType} className="flex items-center gap-2 rounded-lg border px-2 py-2 text-sm" style={{ borderColor: "#E8E4D9" }}>
                      <input type="checkbox" name="mealTypes" value={mealType} className="h-4 w-4 accent-[#496A5A]" defaultChecked />
                      {mealType}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <ImageUploader folder="subscriptions" name="imageUrl" label="Upload Subscription Plan Graphic" />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg px-3 py-2 text-sm font-medium transition hover:opacity-90"
                style={{ background: "#496A5A", color: "#fff" }}
              >
                Save plan
              </button>
            </form>
          </PageCard>
        </div>

        <div className="lg:col-span-7">
          <PageCard noPadding>
            <div className="px-5 py-4 border-b" style={{ borderColor: "#E8E4D9" }}>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold" style={{ color: "#24332B" }}>Subscription plans</h2>
                <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "#EDF2EE", color: "#496A5A" }}>
                  {planRows.length} plans
                </span>
              </div>
            </div>

            <DataTable
              columns={[
                { label: "Plan" },
                { label: "Meals" },
                { label: "Price" },
                { label: "Included" },
                { label: "Status" },
                { label: "Actions", className: "text-right" },
              ]}
              rows={planRows.map((plan) => [
                <div key="plan" className="space-y-0.5">
                  <div className="font-medium" style={{ color: "#24332B" }}>{plan.name}</div>
                  {plan.description && (
                    <div className="text-xs" style={{ color: "#7C817A" }}>
                      {truncate(plan.description)}
                      <a href={`?view=${plan.id}`} className="ml-2 font-medium" style={{ color: "#496A5A" }}>View full</a>
                    </div>
                  )}
                </div>,
                <span key="meals" className="text-sm" style={{ color: "#4B5563" }}>{plan.totalMeals}</span>,
                <span key="price" className="font-medium" style={{ color: "#24332B" }}>₹{fmt(Number(plan.price))}</span>,
                <span key="included" className="text-xs" style={{ color: "#4B5563" }}>
                  {(plan.mealTypes ?? []).join(", ") || "—"}
                </span>,
                <StatusBadge key="status" status={plan.isActive ? "ACTIVE" : "PAUSED"} />,
                <div key="actions" className="flex justify-end gap-2">
                  <a href={`?view=${plan.id}`} className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition hover:opacity-90" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}><Eye size={12} />View</a>
                  <form action={togglePlanStatus}>
                    <input type="hidden" name="id" value={plan.id} />
                    <input type="hidden" name="isActive" value={String(plan.isActive)} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition hover:opacity-90"
                      style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}
                      title={plan.isActive ? "Deactivate plan" : "Activate plan"}
                    >
                      <Power size={12} />
                      {plan.isActive ? "Disable" : "Enable"}
                    </button>
                  </form>

                  <form action={deletePlan}>
                    <input type="hidden" name="id" value={plan.id} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition hover:opacity-90"
                      style={{ borderColor: "#F5C5C5", background: "#FFF7F7", color: "#B42318" }}
                      title="Delete plan"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </form>
                </div>,
              ])}
              emptyMessage="No subscription plans yet. Create a plan to start selling subscriptions."
            />
          </PageCard>
        </div>
      </div>

      <PageCard noPadding>
        <div className="px-5 py-4 border-b" style={{ borderColor: "#E8E4D9" }}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold" style={{ color: "#24332B" }}>Active subscriptions</h2>
            <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "#EDF2EE", color: "#496A5A" }}>
              {activeSubscriptions.length} records
            </span>
          </div>
        </div>

        <DataTable
          columns={[
            { label: "Customer" },
            { label: "Plan" },
            { label: "Meals" },
            { label: "Remaining" },
            { label: "Status" },
            { label: "Action" },
          ]}
          rows={activeSubscriptions.map((sub) => [
            <span key="customer" className="font-medium" style={{ color: "#24332B" }}>
              {sub.customerName ?? sub.customerEmail ?? "Guest"}
            </span>,
            <span key="plan" style={{ color: "#4B5563" }}>{sub.planName ?? "Unknown plan"}</span>,
            <span key="total" style={{ color: "#4B5563" }}>{sub.totalMeals}</span>,
            <span key="remaining" style={{ color: "#24332B" }}>{sub.mealsRemaining}</span>,
            <StatusBadge key="status" status={sub.status} />,
            <form key="action" action={updateSubscriptionStatus} className="min-w-36">
              <input type="hidden" name="id" value={sub.id} />
              <select
                name="status"
                defaultValue={sub.status}
                className="w-full rounded-md border px-2 py-1.5 text-xs outline-none"
                style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}
                onChange={(event) => {
                  const form = event.currentTarget.form;
                  if (form) form.requestSubmit();
                }}
              >
                {SUBSCRIPTION_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </form>,
          ])}
          emptyMessage="No customer subscriptions yet. New subscriptions will appear here."
        />
      </PageCard>

      {(addModal || selectedPlan) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl" style={{ border: "1px solid #E8E4D9" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: "#24332B" }}>{addModal ? "Add subscription plan" : selectedPlan ? (editId ? "Edit subscription plan" : "Subscription plan details") : "Plan"}</h3>
              <a href="/admin/subscriptions" className="text-sm" style={{ color: "#7C817A" }}>Close</a>
            </div>

            {addModal || editId ? (
              <form action={createSubscriptionPlan} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
                {editId && <input type="hidden" name="id" value={editId} />}

                <div>
                  <label htmlFor="modal-name" className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>Plan title *</label>
                  <input id="modal-name" name="name" defaultValue={selectedPlan?.name ?? ""} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }} required />
                </div>

                <div>
                  <label htmlFor="modal-description" className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>Subtitle / Description *</label>
                  <textarea id="modal-description" name="description" rows={2} defaultValue={selectedPlan?.description ?? ""} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }} required />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="modal-weeklyPrice" className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>Weekly price (₹) *</label>
                    <input id="modal-weeklyPrice" name="weeklyPrice" type="number" min="1" step="1" defaultValue={selectedPlan?.weeklyPrice ? Number(selectedPlan.weeklyPrice) : 1499} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }} required />
                  </div>
                  <div>
                    <label htmlFor="modal-monthlyPrice" className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>Monthly price (₹) *</label>
                    <input id="modal-monthlyPrice" name="monthlyPrice" type="number" min="1" step="1" defaultValue={selectedPlan?.monthlyPrice ? Number(selectedPlan.monthlyPrice) : 5499} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }} required />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="modal-mealsPerDay" className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>Meals / Day</label>
                    <input id="modal-mealsPerDay" name="mealsPerDay" type="number" min="1" max="5" defaultValue={selectedPlan?.mealsPerDay ?? 1} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }} />
                  </div>
                  <div>
                    <label htmlFor="modal-price" className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>Base price (₹)</label>
                    <input id="modal-price" name="price" type="number" min="1" step="1" defaultValue={selectedPlan ? Number(selectedPlan.price) : 1499} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }} required />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="modal-caloriesRange" className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>Calories range</label>
                    <input id="modal-caloriesRange" name="caloriesRange" defaultValue={selectedPlan?.caloriesRange ?? "450 – 600 kcal"} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }} />
                  </div>
                  <div>
                    <label htmlFor="modal-deliveryFrequency" className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>Delivery frequency</label>
                    <input id="modal-deliveryFrequency" name="deliveryFrequency" defaultValue={selectedPlan?.deliveryFrequency ?? "5 or 6 Days / Week"} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }} />
                  </div>
                </div>

                <div>
                  <label htmlFor="modal-features" className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>Plan features (1 bullet per line)</label>
                  <textarea id="modal-features" name="features" rows={4} defaultValue={(selectedPlan?.features ?? []).join("\n")} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }} />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input type="checkbox" id="modal-isPopular" name="isPopular" value="true" defaultChecked={selectedPlan?.isPopular ?? false} className="h-4 w-4 accent-[#496A5A]" />
                  <label htmlFor="modal-isPopular" className="text-xs font-medium" style={{ color: "#24332B" }}>
                    Mark as &quot;Most Popular Choice&quot; Badge
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: "#7C817A" }}>Meal types included</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {MEAL_TYPE_OPTIONS.map((mealType) => (
                      <label key={mealType} className="flex items-center gap-2 rounded-lg border px-2 py-2 text-sm" style={{ borderColor: "#E8E4D9" }}>
                        <input type="checkbox" name="mealTypes" value={mealType} className="h-4 w-4 accent-[#496A5A]" defaultChecked={selectedPlan?.mealTypes?.includes(mealType) ?? true} />
                        {mealType}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <ImageUploader folder="subscriptions" name="imageUrl" label="Upload Subscription Plan Graphic" />
                </div>

                <div className="flex justify-end gap-2 pt-2"><a href="/admin/subscriptions" className="rounded-lg border px-3 py-2 text-sm font-medium" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}>Cancel</a><button type="submit" className="rounded-lg px-3 py-2 text-sm font-medium" style={{ background: "#496A5A", color: "#fff" }}>{addModal ? "Save plan" : "Update plan"}</button></div>
              </form>
            ) : (
              <div className="space-y-4 text-sm">
                <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}><div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Plan</div><div className="mt-1 font-medium" style={{ color: "#24332B" }}>{selectedPlan?.name ?? "—"}</div></div>
                <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}><div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Description</div><div className="mt-1" style={{ color: "#24332B" }}>{selectedPlan?.description || "No description provided."}</div></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}><div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Meals</div><div className="mt-1" style={{ color: "#24332B" }}>{selectedPlan?.totalMeals ?? "—"}</div></div>
                  <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}><div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Price</div><div className="mt-1" style={{ color: "#24332B" }}>₹{selectedPlan ? fmt(Number(selectedPlan.price)) : "—"}</div></div>
                </div>
                <div className="flex justify-end gap-2"><a href={`?edit=${selectedPlan?.id ?? ""}`} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}><Pencil size={14} />Edit</a><a href="/admin/subscriptions" className="rounded-lg px-3 py-2 text-sm font-medium" style={{ background: "#496A5A", color: "#fff" }}>Close</a></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
