import { requireAdmin } from "@/lib/auth-guard";

export default async function AdminDashboard() {
  await requireAdmin();

  return (
    <div className="min-h-screen p-8" style={{ background: "#F7F3E8" }}>
      <h1 className="text-2xl font-bold" style={{ color: "#24332B" }}>Admin Dashboard</h1>
      <p className="mt-2 text-sm" style={{ color: "#7C817A" }}>Welcome back. More sections coming soon.</p>
    </div>
  );
}
