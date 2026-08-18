import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/db";
import { foodItems, menuItems, menus } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { CalendarDays, Eye, Plus, Power, Trash2 } from "lucide-react";

import ActionButton from "@/components/admin/action-button";
import DataTable from "@/components/admin/data-table";
import PageCard from "@/components/admin/page-card";
import PageHeader from "@/components/admin/page-header";
import StatCard from "@/components/admin/stat-card";
import StatusBadge from "@/components/admin/status-badge";

async function saveMenu(formData: FormData) {
  "use server";

  await requireAdmin();

  const date = String(formData.get("date") ?? "").trim();
  const selectedIds = formData.getAll("foodItemIds").map(String);

  if (!date) {
    redirect("/admin/menu");
  }

  const existing = await db
    .select({ id: menus.id })
    .from(menus)
    .where(eq(menus.date, date))
    .limit(1);

  let menuId = existing[0]?.id;

  if (!menuId) {
    menuId = crypto.randomUUID();
    await db.insert(menus).values({
      id: menuId,
      date,
      isActive: true,
    });
  }

  await db.delete(menuItems).where(eq(menuItems.menuId, menuId));

  if (selectedIds.length > 0) {
    await db.insert(menuItems).values(
      selectedIds.map((foodItemId) => ({
        id: crypto.randomUUID(),
        menuId,
        foodItemId,
      }))
    );
  }

  revalidatePath("/admin/menu");
  redirect("/admin/menu");
}

async function toggleMenuStatus(formData: FormData) {
  "use server";

  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const isActive = String(formData.get("isActive") ?? "false") === "true";

  if (!id) {
    redirect("/admin/menu");
  }

  await db
    .update(menus)
    .set({ isActive: !isActive, updatedAt: new Date() })
    .where(eq(menus.id, id));

  revalidatePath("/admin/menu");
  redirect("/admin/menu");
}

async function deleteMenu(formData: FormData) {
  "use server";

  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) {
    redirect("/admin/menu");
  }

  await db.delete(menuItems).where(eq(menuItems.menuId, id));
  await db.delete(menus).where(eq(menus.id, id));

  revalidatePath("/admin/menu");
  redirect("/admin/menu");
}

export default async function MenuPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined };
}) {
  await requireAdmin();

  const params = searchParams ? await searchParams : {};
  const addModal = params.modal === "add";
  const selectedMenuId = typeof params.view === "string" ? params.view : undefined;

  const [menuRows, availableItems] = await Promise.all([
    db
      .select({
        id: menus.id,
        date: menus.date,
        isActive: menus.isActive,
        createdAt: menus.createdAt,
      })
      .from(menus)
      .orderBy(desc(menus.date)),
    db
      .select({
        id: foodItems.id,
        name: foodItems.name,
        price: foodItems.price,
        mealType: foodItems.mealType,
        isAvailable: foodItems.isAvailable,
      })
      .from(foodItems)
      .where(eq(foodItems.isAvailable, true))
      .orderBy(desc(foodItems.updatedAt)),
  ]);

  const menuItemCounts = new Map<string, number>();
  for (const row of menuRows) {
    const count = await db
      .select({ count: menuItems.id })
      .from(menuItems)
      .where(eq(menuItems.menuId, row.id));
    menuItemCounts.set(row.id, count.length);
  }

  const today = new Date().toISOString().split("T")[0];
  const selectedMenu = menuRows.find((menu) => menu.id === selectedMenuId) ?? undefined;
  const activeCount = menuRows.filter((menu) => menu.isActive).length;
  const inactiveCount = menuRows.length - activeCount;

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Menu"
        subtitle="Build daily menu plans for breakfast, lunch, dinner, and special offerings."
        actions={<ActionButton href="?modal=add" variant="primary">+ Add Menu</ActionButton>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Menus" value={String(menuRows.length)} icon={CalendarDays} iconBg="#EDF2EE" iconColor="#496A5A" sub="Scheduled days" />
        <StatCard label="Active" value={String(activeCount)} icon={Power} iconBg="#E8F9EE" iconColor="#1F7A4A" sub="Live menu" />
        <StatCard label="Inactive" value={String(inactiveCount)} icon={Power} iconBg="#F5F3EE" iconColor="#675D4D" sub="Paused dates" />
        <StatCard label="Food Items" value={String(availableItems.length)} icon={Eye} iconBg="#EEF2FF" iconColor="#4F46E5" sub="Ready for menu" />
      </div>

      <PageCard noPadding>
        <div className="px-5 py-4 border-b" style={{ borderColor: "#E8E4D9" }}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold" style={{ color: "#24332B" }}>Scheduled menus</h2>
            <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "#EDF2EE", color: "#496A5A" }}>{menuRows.length} dates</span>
          </div>
        </div>

        <DataTable
          columns={[{ label: "Date" }, { label: "Items" }, { label: "Status" }, { label: "Actions", className: "text-right" }]}
          rows={menuRows.map((menu) => [
            <div key="date" className="font-medium" style={{ color: "#24332B" }}>{new Date(`${menu.date}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>,
            <span key="count" className="text-sm" style={{ color: "#4B5563" }}>{menuItemCounts.get(menu.id) ?? 0} items</span>,
            <StatusBadge key="status" status={menu.isActive ? "ACTIVE" : "PAUSED"} />,
            <div key="actions" className="flex justify-end gap-2">
              <a href={`?view=${menu.id}`} className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition hover:opacity-90" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}><Eye size={12} />View</a>
              <form action={toggleMenuStatus}><input type="hidden" name="id" value={menu.id} /><input type="hidden" name="isActive" value={String(menu.isActive)} /><button type="submit" className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition hover:opacity-90" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }} title={menu.isActive ? "Deactivate menu" : "Activate menu"}><Power size={12} />{menu.isActive ? "Disable" : "Enable"}</button></form>
              <form action={deleteMenu}><input type="hidden" name="id" value={menu.id} /><button type="submit" className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition hover:opacity-90" style={{ borderColor: "#F5C5C5", background: "#FFF7F7", color: "#B42318" }} title="Delete menu"><Trash2 size={12} />Delete</button></form>
            </div>,
          ])}
          emptyMessage="No daily menus scheduled yet. Set the first menu date and save menu items."
        />
      </PageCard>

      {(addModal || selectedMenu) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl" style={{ border: "1px solid #E8E4D9" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: "#24332B" }}>{addModal ? "Add menu" : "Menu details"}</h3>
              <a href="/admin/menu" className="text-sm" style={{ color: "#7C817A" }}>Close</a>
            </div>

            {addModal ? (
              <form action={saveMenu} className="space-y-4">
                <div>
                  <label htmlFor="date" className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>Menu date</label>
                  <input id="date" name="date" type="date" defaultValue={today} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }} required />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2"><label className="text-xs font-medium" style={{ color: "#7C817A" }}>Available food items</label><span className="text-[10px] uppercase tracking-wide" style={{ color: "#7C817A" }}>{availableItems.length} items</span></div>
                  <div className="space-y-2 max-h-80 sm:max-h-90 overflow-y-auto pr-1">
                    {availableItems.length === 0 ? <div className="rounded-lg border border-dashed p-3 text-sm" style={{ borderColor: "#DDD9CC", color: "#7C817A" }}>No available food items yet. Add items in the Food Items page first.</div> : availableItems.map((item) => <label key={item.id} className="flex items-center justify-between gap-3 rounded-lg border p-2.5 cursor-pointer transition hover:bg-gray-50" style={{ borderColor: "#E8E4D9" }}><div className="flex items-center gap-3"><input type="checkbox" name="foodItemIds" value={item.id} className="h-4 w-4 accent-[#496A5A]" /><div><div className="text-sm font-medium" style={{ color: "#24332B" }}>{item.name}</div><div className="text-[11px]" style={{ color: "#7C817A" }}>{item.mealType}</div></div></div><span className="text-sm font-medium" style={{ color: "#24332B" }}>₹{new Intl.NumberFormat("en-IN").format(Number(item.price))}</span></label>)}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2"><a href="/admin/menu" className="rounded-lg border px-3 py-2 text-sm font-medium" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}>Cancel</a><button type="submit" className="rounded-lg px-3 py-2 text-sm font-medium" style={{ background: "#496A5A", color: "#fff" }}>Save menu</button></div>
              </form>
            ) : (
              <div className="space-y-4 text-sm">
                <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}><div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Date</div><div className="mt-1 font-medium" style={{ color: "#24332B" }}>{selectedMenu ? new Date(`${selectedMenu.date}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</div></div>
                <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}><div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Items</div><div className="mt-1" style={{ color: "#24332B" }}>{selectedMenu ? `${menuItemCounts.get(selectedMenu.id) ?? 0} selected items` : "—"}</div></div>
                <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}><div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Status</div><div className="mt-1"><StatusBadge status={selectedMenu?.isActive ? "ACTIVE" : "PAUSED"} /></div></div>
                <div className="flex justify-end gap-2"><a href="/admin/menu" className="rounded-lg px-3 py-2 text-sm font-medium" style={{ background: "#496A5A", color: "#fff" }}>Close</a></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
