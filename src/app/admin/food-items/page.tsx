import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/db";
import { categories, foodItems } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { Eye, Pencil, Plus, Power, Trash2 } from "lucide-react";

import ActionButton from "@/components/admin/action-button";
import DataTable from "@/components/admin/data-table";
import PageCard from "@/components/admin/page-card";
import PageHeader from "@/components/admin/page-header";
import StatCard from "@/components/admin/stat-card";
import StatusBadge from "@/components/admin/status-badge";
import ImageUploader from "@/components/shared/image-uploader";

const MEAL_TYPES = ["BREAKFAST", "LUNCH", "DINNER", "SNACK", "OTHER"] as const;
type MealType = (typeof MEAL_TYPES)[number];

const truncate = (text?: string | null, max = 85) => {
  if (!text) return "—";
  return text.length <= max ? text : `${text.slice(0, max).trim()}…`;
};

async function createFoodItem(formData: FormData) {
  "use server";

  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const price = Number(formData.get("price") ?? 0);
  const rawMealType = String(formData.get("mealType") ?? "LUNCH");
  const mealType: MealType = MEAL_TYPES.includes(rawMealType as MealType)
    ? (rawMealType as MealType)
    : "LUNCH";
  const isVeg = String(formData.get("isVeg") ?? "true") === "true";
  const isAvailable = String(formData.get("isAvailable") ?? "true") === "true";

  if (!name || !categoryId || Number.isNaN(price) || price <= 0) {
    redirect("/admin/food-items");
  }

  await db.insert(foodItems).values({
    id: crypto.randomUUID(),
    categoryId,
    name,
    description: description || null,
    imageUrl: imageUrl || null,
    price,
    isVeg,
    mealType,
    isAvailable,
  });

  revalidatePath("/admin/food-items");
  redirect("/admin/food-items");
}

async function updateFoodItem(formData: FormData) {
  "use server";

  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const price = Number(formData.get("price") ?? 0);
  const rawMealType = String(formData.get("mealType") ?? "LUNCH");
  const mealType: MealType = MEAL_TYPES.includes(rawMealType as MealType)
    ? (rawMealType as MealType)
    : "LUNCH";
  const isVeg = String(formData.get("isVeg") ?? "true") === "true";
  const isAvailable = String(formData.get("isAvailable") ?? "true") === "true";

  if (!id || !name || !categoryId || Number.isNaN(price) || price <= 0) {
    redirect("/admin/food-items");
  }

  await db
    .update(foodItems)
    .set({
      categoryId,
      name,
      description: description || null,
      imageUrl: imageUrl || null,
      price,
      isVeg,
      mealType,
      isAvailable,
      updatedAt: new Date(),
    })
    .where(eq(foodItems.id, id));

  revalidatePath("/admin/food-items");
  redirect("/admin/food-items");
}

async function toggleFoodItemAvailability(formData: FormData) {
  "use server";

  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const isAvailable = String(formData.get("isAvailable") ?? "false") === "true";

  if (!id) {
    redirect("/admin/food-items");
  }

  await db
    .update(foodItems)
    .set({ isAvailable: !isAvailable, updatedAt: new Date() })
    .where(eq(foodItems.id, id));

  revalidatePath("/admin/food-items");
  redirect("/admin/food-items");
}

async function deleteFoodItem(formData: FormData) {
  "use server";

  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) {
    redirect("/admin/food-items");
  }

  await db.delete(foodItems).where(eq(foodItems.id, id));

  revalidatePath("/admin/food-items");
  redirect("/admin/food-items");
}

export default async function FoodItemsPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined };
}) {
  await requireAdmin();

  const params = searchParams ? await searchParams : {};
  const addModal = params.modal === "add";
  const viewId = typeof params.view === "string" ? params.view : undefined;
  const editId = typeof params.edit === "string" ? params.edit : undefined;

  const [categoryList, itemRows] = await Promise.all([
    db.select().from(categories).where(eq(categories.isActive, true)).orderBy(desc(categories.createdAt)),
    db
      .select({
        id: foodItems.id,
        name: foodItems.name,
        description: foodItems.description,
        imageUrl: foodItems.imageUrl,
        price: foodItems.price,
        isVeg: foodItems.isVeg,
        mealType: foodItems.mealType,
        isAvailable: foodItems.isAvailable,
        categoryId: foodItems.categoryId,
        categoryName: categories.name,
        updatedAt: foodItems.updatedAt,
      })
      .from(foodItems)
      .leftJoin(categories, eq(foodItems.categoryId, categories.id))
      .orderBy(desc(foodItems.createdAt)),
  ]);

  const selected = itemRows.find((item) => item.id === (viewId ?? editId));
  const availableCount = itemRows.filter((item) => item.isAvailable).length;
  const unavailableCount = itemRows.length - availableCount;
  const hasCategories = categoryList.length > 0;

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Food Items"
        subtitle="Create and manage the kitchen’s catalog of meals and menu offerings."
        actions={<ActionButton href="?modal=add" variant="primary">+ Add Food</ActionButton>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Items" value={String(itemRows.length)} icon={Plus} iconBg="#EDF2EE" iconColor="#496A5A" sub="Menu inventory" />
        <StatCard label="Available" value={String(availableCount)} icon={Power} iconBg="#E8F9EE" iconColor="#1F7A4A" sub="Ready to order" />
        <StatCard label="Hidden" value={String(unavailableCount)} icon={Power} iconBg="#F5F3EE" iconColor="#675D4D" sub="Not in active menu" />
        <StatCard label="Categories" value={String(categoryList.length)} icon={Eye} iconBg="#EEF2FF" iconColor="#4F46E5" sub="Active groups" />
      </div>

      <PageCard noPadding>
        <div className="px-5 py-4 border-b" style={{ borderColor: "#E8E4D9" }}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold" style={{ color: "#24332B" }}>Food catalog</h2>
            <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "#EDF2EE", color: "#496A5A" }}>
              {itemRows.length} items
            </span>
          </div>
        </div>

        <DataTable
          columns={[
            { label: "Item" },
            { label: "Category" },
            { label: "Meal" },
            { label: "Price" },
            { label: "Status" },
            { label: "Actions", className: "text-right" },
          ]}
          rows={itemRows.map((item) => [
            <div key="name" className="space-y-1">
              <div className="font-medium" style={{ color: "#24332B" }}>{item.name}</div>
              {item.description && (
                <div className="text-xs" style={{ color: "#7C817A" }}>
                  {truncate(item.description)}
                  <a href={`?view=${item.id}`} className="ml-2 font-medium" style={{ color: "#496A5A" }}>
                    View full
                  </a>
                </div>
              )}
            </div>,
            <span key="category" className="text-sm" style={{ color: "#4B5563" }}>{item.categoryName ?? "Unassigned"}</span>,
            <span key="meal" className="text-sm" style={{ color: "#4B5563" }}>{item.mealType}</span>,
            <span key="price" className="font-medium" style={{ color: "#24332B" }}>₹{new Intl.NumberFormat("en-IN").format(Number(item.price))}</span>,
            <StatusBadge key="status" status={item.isAvailable ? "ACTIVE" : "PAUSED"} />,
            <div key="actions" className="flex justify-end gap-2">
              <a href={`?view=${item.id}`} className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition hover:opacity-90" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}><Eye size={12} />View</a>
              <form action={toggleFoodItemAvailability}>
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="isAvailable" value={String(item.isAvailable)} />
                <button type="submit" className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition hover:opacity-90" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }} title={item.isAvailable ? "Mark unavailable" : "Mark available"}><Power size={12} />{item.isAvailable ? "Hide" : "Show"}</button>
              </form>
              <form action={deleteFoodItem}><input type="hidden" name="id" value={item.id} /><button type="submit" className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition hover:opacity-90" style={{ borderColor: "#F5C5C5", background: "#FFF7F7", color: "#B42318" }} title="Delete food item"><Trash2 size={12} />Delete</button></form>
            </div>,
          ])}
          emptyMessage="No food items yet. Add your first item to start building the menu."
        />
      </PageCard>

      {(addModal || selected) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl" style={{ border: "1px solid #E8E4D9" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: "#24332B" }}>{addModal ? "Add food item" : selected ? (editId ? "Edit food item" : "Food item details") : "Food item"}</h3>
              <a href="/admin/food-items" className="text-sm" style={{ color: "#7C817A" }}>Close</a>
            </div>

            {addModal || editId ? (
              <form action={addModal ? createFoodItem : updateFoodItem} className="space-y-4">
                {editId && <input type="hidden" name="id" value={selected?.id ?? editId} />}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2"><label className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>Item name</label><input name="name" defaultValue={selected?.name ?? ""} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }} required /></div>
                  <div className="sm:col-span-2"><label className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>Category</label><select name="categoryId" defaultValue={selected?.categoryId ?? ""} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }} required>{hasCategories ? categoryList.map((category) => <option key={category.id} value={category.id}>{category.name}</option>) : <option value="">Create a category</option>}</select></div>
                  <div className="sm:col-span-2"><label className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>Description</label><textarea name="description" rows={3} defaultValue={selected?.description ?? ""} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }} /></div>
                  <div><label className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>Price (₹)</label><input type="number" min="1" step="1" name="price" defaultValue={selected ? Number(selected.price) : 0} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }} required /></div>
                  <div><label className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>Meal type</label><select name="mealType" defaultValue={selected?.mealType ?? "LUNCH"} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}>{MEAL_TYPES.map((mealType) => <option key={mealType} value={mealType}>{mealType}</option>)}</select></div>
                  <div><label className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>Veg / Non-veg</label><select name="isVeg" defaultValue={selected ? String(selected.isVeg) : "true"} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}><option value="true">Veg</option><option value="false">Non-Veg</option></select></div>
                  <div><label className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>Availability</label><select name="isAvailable" defaultValue={selected ? String(selected.isAvailable) : "true"} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}><option value="true">Available</option><option value="false">Unavailable</option></select></div>
                  <div className="sm:col-span-2">
                    <ImageUploader folder="meals" name="imageUrl" value={selected?.imageUrl ?? ""} label="Upload Meal Image" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2"><a href="/admin/food-items" className="rounded-lg border px-3 py-2 text-sm font-medium" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}>Cancel</a><button type="submit" className="rounded-lg px-3 py-2 text-sm font-medium" style={{ background: "#496A5A", color: "#fff" }}>{addModal ? "Save food item" : "Update food item"}</button></div>
              </form>
            ) : (
              <div className="space-y-4 text-sm">
                <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}><div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Name</div><div className="mt-1 font-medium" style={{ color: "#24332B" }}>{selected?.name ?? "—"}</div></div>
                <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}><div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Description</div><div className="mt-1" style={{ color: "#24332B" }}>{selected?.description || "No description provided."}</div></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}><div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Category</div><div className="mt-1" style={{ color: "#24332B" }}>{selected?.categoryName ?? "—"}</div></div>
                  <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}><div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Price</div><div className="mt-1" style={{ color: "#24332B" }}>₹{selected ? Number(selected.price).toLocaleString("en-IN") : "—"}</div></div>
                </div>
                <div className="flex justify-end gap-2"><a href={`?edit=${selected?.id ?? ""}`} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}><Pencil size={14} />Edit</a><a href="/admin/food-items" className="rounded-lg px-3 py-2 text-sm font-medium" style={{ background: "#496A5A", color: "#fff" }}>Close</a></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
