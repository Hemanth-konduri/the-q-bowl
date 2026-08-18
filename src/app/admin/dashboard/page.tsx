import { requireAdmin } from "@/lib/auth-guard";
import { getDashboardStats, getKitchenLoad, getRecentOrders } from "./data";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ShoppingBag, CalendarDays, AlertCircle, IndianRupee, Users } from "lucide-react";

import PageHeader from "@/components/admin/page-header";
import PageCard from "@/components/admin/page-card";
import CardHeader from "@/components/admin/card-header";
import StatCard from "@/components/admin/stat-card";
import StatRow from "@/components/admin/stat-row";
import BarRow from "@/components/admin/bar-row";
import DataTable from "@/components/admin/data-table";
import StatusBadge from "@/components/admin/status-badge";
import ActionButton from "@/components/admin/action-button";

const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(n);
const pct = (v: string | null) => v === null ? null : { value: Math.abs(parseFloat(v)).toFixed(1), up: parseFloat(v) >= 0 };

const MEAL_LABEL: Record<string, string> = {
  BREAKFAST: "Breakfast", LUNCH: "Lunch", DINNER: "Dinner", SNACK: "Snack", OTHER: "Other",
};

export default async function AdminDashboard() {
  const admin = await requireAdmin();
  const [adminUser, stats, kitchen, recentOrders] = await Promise.all([
    db.select({ name: users.name }).from(users).where(eq(users.id, admin.id)).limit(1),
    getDashboardStats(),
    getKitchenLoad(),
    getRecentOrders(),
  ]);

  const now = new Date();
  const greeting = now.getHours() < 12 ? "morning" : now.getHours() < 17 ? "afternoon" : "evening";
  const adminName = adminUser[0]?.name ?? "Admin";
  const dateStr = now.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const maxKitchen = Math.max(...kitchen.kitchenLoad.map((r) => r.subscriptionCount), 1);

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title={`Good ${greeting}, ${adminName}`}
        subtitle={dateStr}
        actions={
          <>
            <ActionButton href="/admin/food-items">+ Add Food</ActionButton>
            <ActionButton href="/admin/menu">+ Create Menu</ActionButton>
            <ActionButton href="/admin/orders" variant="primary">View Orders</ActionButton>
          </>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Today's Orders"
          value={fmt(stats.todayOrders)}
          icon={ShoppingBag}
          iconBg="#EDF2EE" iconColor="#496A5A"
          trend={pct(stats.ordersChange)}
        />
        <StatCard
          label="Subscription Meals"
          value={fmt(stats.subscriptionMealsToday)}
          icon={CalendarDays}
          iconBg="#EEF2FF" iconColor="#4F46E5"
          sub={`${stats.activeSubscriptions} active subs`}
        />
        <StatCard
          label="Pending Orders"
          value={fmt(stats.pendingOrders)}
          icon={AlertCircle}
          iconBg="#FFF7ED" iconColor="#D86F45"
          sub="Need action"
          urgent={stats.pendingOrders > 0}
        />
        <StatCard
          label="Today's Revenue"
          value={`₹${fmt(stats.todayRevenue)}`}
          icon={IndianRupee}
          iconBg="#F0FDF4" iconColor="#16A34A"
          trend={pct(stats.revenueChange)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Kitchen Load */}
        <PageCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: "#24332B" }}>Today's Kitchen Load</h2>
            <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "#EDF2EE", color: "#496A5A" }}>
              {fmt(kitchen.totalMeals + kitchen.normalOrdersToday)} total
            </span>
          </div>
          {kitchen.kitchenLoad.length === 0 && kitchen.normalOrdersToday === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: "#7C817A" }}>No meals scheduled for today.</p>
          ) : (
            <div className="space-y-3">
              {kitchen.kitchenLoad.map((row) => (
                <BarRow
                  key={row.mealType}
                  label={MEAL_LABEL[row.mealType]}
                  value={row.subscriptionCount}
                  max={maxKitchen}
                  meta="subscription"
                />
              ))}
              {kitchen.normalOrdersToday > 0 && (
                <div className="pt-2 border-t flex items-center justify-between text-xs" style={{ borderColor: "#E8E4D9", color: "#7C817A" }}>
                  <span>Normal orders today</span>
                  <span className="font-semibold" style={{ color: "#24332B" }}>{kitchen.normalOrdersToday}</span>
                </div>
              )}
            </div>
          )}
        </PageCard>

        {/* Overview */}
        <PageCard>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "#24332B" }}>Overview</h2>
          <div className="space-y-4">
            <StatRow icon={Users} iconBg="#EDF2EE" iconColor="#496A5A" label="Total Customers" value={fmt(stats.totalCustomers)} />
            <StatRow icon={CalendarDays} iconBg="#EEF2FF" iconColor="#4F46E5" label="Active Subscriptions" value={fmt(stats.activeSubscriptions)} />
            <StatRow
              icon={AlertCircle} iconBg="#FFF7ED" iconColor="#D86F45"
              label="Pending Orders" value={fmt(stats.pendingOrders)}
              valueColor={stats.pendingOrders > 0 ? "#D86F45" : "#24332B"}
            />
          </div>
        </PageCard>
      </div>

      {/* Recent Orders */}
      <PageCard noPadding>
        <CardHeader
          title="Recent Orders"
          right={<ActionButton href="/admin/orders">View all →</ActionButton>}
        />
        <DataTable
          columns={[
            { label: "Order" }, { label: "Customer" }, { label: "Type" },
            { label: "Amount" }, { label: "Status" }, { label: "Time" },
          ]}
          emptyMessage="No orders yet."
          rows={recentOrders.map((o) => [
            <span key="id" className="font-mono text-xs" style={{ color: "#496A5A" }}>#{o.id.slice(-6).toUpperCase()}</span>,
            <span key="name" className="font-medium">{o.customerName ?? o.customerEmail ?? "—"}</span>,
            <span key="type" style={{ color: "#4B5563" }}>{o.type}</span>,
            <span key="amt" className="font-medium">₹{fmt(o.total)}</span>,
            <StatusBadge key="status" status={o.status} />,
            <span key="time" className="text-xs" style={{ color: "#7C817A" }}>
              {new Date(o.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </span>,
          ])}
        />
      </PageCard>
    </div>
  );
}
