import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Settings, Shield, Bell, Eye, Truck, CreditCard } from "lucide-react";

import PageHeader from "@/components/admin/page-header";
import PageCard from "@/components/admin/page-card";
import StatCard from "@/components/admin/stat-card";

export default async function SettingsPage() {
  const admin = await requireAdmin();

  const adminUser = await db
    .select({ name: users.name, email: users.email, phone: users.phone, role: users.role })
    .from(users)
    .where(eq(users.id, admin.id))
    .limit(1);

  const adminName = adminUser[0]?.name ?? "Admin";
  const adminEmail = adminUser[0]?.email ?? "—";
  const adminPhone = adminUser[0]?.phone ?? "—";
  const adminRole = adminUser[0]?.role ?? "ADMIN";

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Settings"
        subtitle="Manage your admin profile and system preferences."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 space-y-6">
          <PageCard>
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-lg p-3" style={{ background: "#EDF2EE", color: "#496A5A" }}>
                <Settings size={20} />
              </div>
              <div>
                <h2 className="text-sm font-semibold" style={{ color: "#24332B" }}>Admin Profile</h2>
                <p className="text-xs" style={{ color: "#7C817A" }}>Manage your account information</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>Admin Name</label>
                  <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}>
                    {adminName}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>Email</label>
                  <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}>
                    {adminEmail}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>Phone</label>
                <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}>
                  {adminPhone}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#7C817A" }}>Role</label>
                <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}>
                  {adminRole}
                </div>
              </div>
            </div>
          </PageCard>

          <PageCard>
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-lg p-3" style={{ background: "#EEF2FF", color: "#4F46E5" }}>
                <Shield size={20} />
              </div>
              <div>
                <h2 className="text-sm font-semibold" style={{ color: "#24332B" }}>Security</h2>
                <p className="text-xs" style={{ color: "#7C817A" }}>Password and authentication settings</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border p-4" style={{ borderColor: "#E8E4D9" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium" style={{ color: "#24332B" }}>Change Password</div>
                    <div className="text-xs mt-1" style={{ color: "#7C817A" }}>Update your admin password</div>
                  </div>
                  <button className="rounded-lg px-4 py-2 text-sm font-medium" style={{ background: "#496A5A", color: "#fff" }}>
                    Change
                  </button>
                </div>
              </div>
              <div className="rounded-lg border p-4" style={{ borderColor: "#E8E4D9" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium" style={{ color: "#24332B" }}>Two-Factor Authentication</div>
                    <div className="text-xs mt-1" style={{ color: "#7C817A" }}>Add an extra layer of security</div>
                  </div>
                  <button className="rounded-lg px-4 py-2 text-sm font-medium" style={{ background: "#F3F4F6", color: "#374151" }}>
                    Not enabled
                  </button>
                </div>
              </div>
            </div>
          </PageCard>
        </div>

        <div className="space-y-6">
          <StatCard
            label="Admin Status"
            value="Active"
            icon={Shield}
            iconBg="#E8F9EE"
            iconColor="#1F7A4A"
            sub="Full access"
          />
          <StatCard
            label="Last Login"
            value={new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            icon={Eye}
            iconBg="#EEF2FF"
            iconColor="#4F46E5"
            sub="Just now"
          />
        </div>
      </div>

      <PageCard>
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-lg p-3" style={{ background: "#FDF3C7", color: "#A16207" }}>
            <Bell size={20} />
          </div>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: "#24332B" }}>Preferences</h2>
            <p className="text-xs" style={{ color: "#7C817A" }}>Customize your admin experience</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: "#E8E4D9" }}>
            <div>
              <div className="text-sm font-medium" style={{ color: "#24332B" }}>Email Notifications</div>
              <div className="text-xs mt-1" style={{ color: "#7C817A" }}>Receive alerts about new orders and updates</div>
            </div>
            <button className="w-12 h-6 rounded-full transition-colors flex items-center px-1" style={{ background: "#496A5A" }}>
              <div className="w-4 h-4 rounded-full bg-white" />
            </button>
          </div>
          <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: "#E8E4D9" }}>
            <div>
              <div className="text-sm font-medium" style={{ color: "#24332B" }}>Order Alerts</div>
              <div className="text-xs mt-1" style={{ color: "#7C817A" }}>Get notified for new customer orders</div>
            </div>
            <button className="w-12 h-6 rounded-full transition-colors flex items-center px-1" style={{ background: "#496A5A" }}>
              <div className="w-4 h-4 rounded-full bg-white" />
            </button>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <div className="text-sm font-medium" style={{ color: "#24332B" }}>Delivery Updates</div>
              <div className="text-xs mt-1" style={{ color: "#7C817A" }}>Track delivery status changes</div>
            </div>
            <button className="w-12 h-6 rounded-full transition-colors flex items-center px-1" style={{ background: "#496A5A" }}>
              <div className="w-4 h-4 rounded-full bg-white" />
            </button>
          </div>
        </div>
      </PageCard>
    </div>
  );
}
