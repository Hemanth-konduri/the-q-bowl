import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { Bell, Eye, Pencil, Plus, Trash2 } from "lucide-react";

import ActionButton from "@/components/admin/action-button";
import PageHeader from "@/components/admin/page-header";
import PageCard from "@/components/admin/page-card";
import DataTable from "@/components/admin/data-table";
import StatCard from "@/components/admin/stat-card";
import StatusBadge from "@/components/admin/status-badge";

async function createNotification(formData: FormData) {
  "use server";

  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const userId = String(formData.get("userId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!userId || !title || !body) {
    redirect("/admin/notifications");
  }

  const payload = { userId, title, body, isRead: false, updatedAt: new Date() };

  if (id) {
    await db.update(notifications).set(payload).where(eq(notifications.id, id));
  } else {
    await db.insert(notifications).values({ id: crypto.randomUUID(), ...payload });
  }

  revalidatePath("/admin/notifications");
  redirect("/admin/notifications");
}

async function toggleNotificationRead(formData: FormData) {
  "use server";

  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const isRead = String(formData.get("isRead") ?? "false") === "true";

  if (!id) {
    redirect("/admin/notifications");
  }

  await db.update(notifications).set({ isRead: !isRead }).where(eq(notifications.id, id));

  revalidatePath("/admin/notifications");
  redirect("/admin/notifications");
}

async function deleteNotification(formData: FormData) {
  "use server";

  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) {
    redirect("/admin/notifications");
  }

  await db.delete(notifications).where(eq(notifications.id, id));

  revalidatePath("/admin/notifications");
  redirect("/admin/notifications");
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined };
}) {
  await requireAdmin();

  const params = searchParams ? await searchParams : {};
  const addModal = params.modal === "add";
  const viewId = typeof params.view === "string" ? params.view : undefined;
  const editId = typeof params.edit === "string" ? params.edit : undefined;

  const notificationRows = await db
    .select({
      id: notifications.id,
      title: notifications.title,
      body: notifications.body,
      isRead: notifications.isRead,
      createdAt: notifications.createdAt,
      userId: notifications.userId,
      userName: users.name,
      userEmail: users.email,
    })
    .from(notifications)
    .leftJoin(users, eq(notifications.userId, users.id))
    .orderBy(desc(notifications.createdAt));

  const total = notificationRows.length;
  const unread = notificationRows.filter((item) => !item.isRead).length;
  const read = notificationRows.filter((item) => item.isRead).length;
  const selected = notificationRows.find((item) => item.id === (viewId ?? editId));
  const truncate = (text: string, max = 90) => text.length <= max ? text : `${text.slice(0, max).trim()}…`;

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Notifications"
        subtitle="Broadcast updates and alerts to customers or staff."
        actions={<ActionButton href="?modal=add" variant="primary">+ Send Notification</ActionButton>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total" value={String(total)} icon={Plus} iconBg="#EDF2EE" iconColor="#496A5A" sub="Messages sent" />
        <StatCard label="Unread" value={String(unread)} icon={Bell} iconBg="#FDF3C7" iconColor="#A16207" sub="Needs attention" />
        <StatCard label="Read" value={String(read)} icon={Eye} iconBg="#E8F9EE" iconColor="#1F7A4A" sub="Acknowledged" />
        <StatCard label="Audience" value={notificationRows[0]?.userName ? "Live" : "None"} icon={Bell} iconBg="#EEF2FF" iconColor="#4F46E5" sub="Targeted" />
      </div>

      <PageCard noPadding>
        <div className="px-5 py-4 border-b" style={{ borderColor: "#E8E4D9" }}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold" style={{ color: "#24332B" }}>Recent notifications</h2>
            <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "#EDF2EE", color: "#496A5A" }}>{notificationRows.length} records</span>
          </div>
        </div>

        <DataTable
          columns={[{ label: "Recipient" }, { label: "Title" }, { label: "Message" }, { label: "Status" }, { label: "Actions", className: "text-right" }]}
          rows={notificationRows.map((item) => [
            <span key="recipient" className="font-medium" style={{ color: "#24332B" }}>{item.userName || item.userEmail || "Unknown user"}</span>,
            <span key="title" className="font-medium" style={{ color: "#24332B" }}>{item.title}</span>,
            <span key="body" style={{ color: "#4B5563" }}>{truncate(item.body)}</span>,
            <StatusBadge key="status" status={item.isRead ? "ACTIVE" : "PAUSED"} />,
            <div key="actions" className="flex justify-end gap-2">
              <a href={`?view=${item.id}`} className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition hover:opacity-90" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}><Eye size={12} />View</a>
              <a href={`?edit=${item.id}`} className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition hover:opacity-90" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}><Pencil size={12} />Edit</a>
              <form action={toggleNotificationRead}>
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="isRead" value={String(item.isRead)} />
                <button type="submit" className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition hover:opacity-90" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }} title={item.isRead ? "Mark unread" : "Mark read"}>{item.isRead ? "Unread" : "Read"}</button>
              </form>
              <form action={deleteNotification}><input type="hidden" name="id" value={item.id} /><button type="submit" className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition hover:opacity-90" style={{ borderColor: "#F5C5C5", background: "#FFF7F7", color: "#B42318" }} title="Delete notification"><Trash2 size={12} />Delete</button></form>
            </div>,
          ])}
          emptyMessage="No notifications sent yet. Create the first message to reach your customers."
        />
      </PageCard>

      {(addModal || selected) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl" style={{ border: "1px solid #E8E4D9" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: "#24332B" }}>{addModal ? "Send notification" : selected ? (editId ? "Edit notification" : "Notification details") : "Notification"}</h3>
              <a href="/admin/notifications" className="text-sm" style={{ color: "#7C817A" }}>Close</a>
            </div>

            {addModal || editId ? (
              <form action={createNotification} className="space-y-4">
                {editId && <input type="hidden" name="id" value={selected?.id ?? editId} />}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>User ID</label>
                  <input name="userId" defaultValue={selected?.userId ?? ""} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }} required />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>Title</label>
                  <input name="title" defaultValue={selected?.title ?? ""} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }} required />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>Message</label>
                  <textarea name="body" rows={4} defaultValue={selected?.body ?? ""} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }} required />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <a href="/admin/notifications" className="rounded-lg border px-3 py-2 text-sm font-medium" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}>Cancel</a>
                  <button type="submit" className="rounded-lg px-3 py-2 text-sm font-medium" style={{ background: "#496A5A", color: "#fff" }}>{addModal ? "Send" : "Update"}</button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}><div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Recipient</div><div className="mt-1 font-medium" style={{ color: "#24332B" }}>{selected?.userName || selected?.userEmail || "Unknown user"}</div></div>
                  <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}><div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Status</div><div className="mt-1"><StatusBadge status={selected?.isRead ? "ACTIVE" : "PAUSED"} /></div></div>
                </div>
                <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}><div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Title</div><div className="mt-1" style={{ color: "#24332B" }}>{selected?.title || "—"}</div></div>
                <div className="rounded-lg border p-3" style={{ borderColor: "#E8E4D9" }}><div className="text-xs uppercase tracking-wide" style={{ color: "#7C817A" }}>Message</div><div className="mt-1" style={{ color: "#24332B" }}>{selected?.body || "—"}</div></div>
                <div className="flex justify-end gap-2">
                  <a href={`?edit=${selected?.id ?? ""}`} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}><Pencil size={14} />Edit</a>
                  <a href="/admin/notifications" className="rounded-lg px-3 py-2 text-sm font-medium" style={{ background: "#496A5A", color: "#fff" }}>Close</a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
