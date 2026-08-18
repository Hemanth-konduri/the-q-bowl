import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import AdminSidebar from "@/components/admin/sidebar";
import AdminHeader from "@/components/admin/header";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  const user = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, admin.id))
    .limit(1);

  const displayName = user[0]?.name ?? user[0]?.email ?? "Admin";

  return (
    <div className="min-h-screen" style={{ background: "#F7F3E8" }}>
      <AdminSidebar />
      <AdminHeader adminName={displayName} />
      <main className="pt-14 min-h-screen lg:ml-56">
        <div className="p-3 pb-20 sm:p-4 lg:p-6 lg:pb-6">{children}</div>
      </main>
    </div>
  );
}
