import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/db";
import {
  users,
  addresses,
  orders,
  subscriptions,
  subscriptionPlans,
  payments,
  notifications,
  deliveryAssignments,
} from "@/db/schema";
import { and, desc, eq, or } from "drizzle-orm";
import {
  ArrowLeft,
  Bell,
  CreditCard,
  MapPin,
  Package,
  Repeat,
  Truck,
  User,
} from "lucide-react";

import PageCard from "@/components/admin/page-card";
import StatCard from "@/components/admin/stat-card";
import StatusBadge from "@/components/admin/status-badge";
import DataTable from "@/components/admin/data-table";

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(amount: number | null | undefined) {
  return `Rs ${Number(amount ?? 0).toLocaleString("en-IN")}`;
}

export default async function CustomerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;

  const customer = await db.query.users.findFirst({
    where: eq(users.id, id),
  });

  if (!customer) {
    return (
      <div className="max-w-7xl mx-auto">
        <a
          href="/admin/customers"
          className="inline-flex items-center gap-2 text-sm mb-4"
          style={{ color: "#496A5A" }}
        >
          <ArrowLeft size={16} /> Back to customers
        </a>
        <PageCard>
          <div className="text-center py-8">
            <h2 className="text-lg font-semibold" style={{ color: "#24332B" }}>
              Customer not found
            </h2>
            <p className="text-sm mt-2" style={{ color: "#7C817A" }}>
              This customer does not exist or was removed.
            </p>
          </div>
        </PageCard>
      </div>
    );
  }

  const [customerAddresses, customerOrders, customerSubscriptions, customerNotifications] =
    await Promise.all([
      db
        .select({
          id: addresses.id,
          label: addresses.label,
          address: addresses.address,
          area: addresses.area,
          city: addresses.city,
          state: addresses.state,
          pincode: addresses.pincode,
          isDefault: addresses.isDefault,
          createdAt: addresses.createdAt,
        })
        .from(addresses)
        .where(eq(addresses.userId, id))
        .orderBy(desc(addresses.createdAt)),
      db
        .select({
          id: orders.id,
          type: orders.type,
          status: orders.status,
          subtotal: orders.subtotal,
          deliveryFee: orders.deliveryFee,
          discount: orders.discount,
          total: orders.total,
          notes: orders.notes,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .where(eq(orders.userId, id))
        .orderBy(desc(orders.createdAt)),
      db
        .select({
          id: subscriptions.id,
          status: subscriptions.status,
          planName: subscriptionPlans.name,
          startDate: subscriptions.startDate,
          expectedEndDate: subscriptions.expectedEndDate,
          totalMeals: subscriptions.totalMeals,
          mealsUsed: subscriptions.mealsUsed,
          mealsRemaining: subscriptions.mealsRemaining,
          pricePaid: subscriptions.pricePaid,
          createdAt: subscriptions.createdAt,
        })
        .from(subscriptions)
        .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
        .where(eq(subscriptions.userId, id))
        .orderBy(desc(subscriptions.createdAt)),
      db
        .select({
          id: notifications.id,
          title: notifications.title,
          body: notifications.body,
          isRead: notifications.isRead,
          createdAt: notifications.createdAt,
        })
        .from(notifications)
        .where(eq(notifications.userId, id))
        .orderBy(desc(notifications.createdAt)),
    ]);

  const customerPayments = await db
    .select({
      id: payments.id,
      amount: payments.amount,
      method: payments.method,
      status: payments.status,
      transactionId: payments.transactionId,
      paidAt: payments.paidAt,
      createdAt: payments.createdAt,
      orderId: payments.orderId,
      subscriptionId: payments.subscriptionId,
    })
    .from(payments)
    .leftJoin(orders, eq(payments.orderId, orders.id))
    .leftJoin(subscriptions, eq(payments.subscriptionId, subscriptions.id))
    .where(or(eq(orders.userId, id), eq(subscriptions.userId, id)))
    .orderBy(desc(payments.createdAt));

  const customerDeliveries = await db
    .select({
      id: deliveryAssignments.id,
      status: deliveryAssignments.status,
      scheduledAt: deliveryAssignments.scheduledAt,
      deliveredAt: deliveryAssignments.deliveredAt,
      failureReason: deliveryAssignments.failureReason,
      orderId: deliveryAssignments.orderId,
    })
    .from(deliveryAssignments)
    .leftJoin(orders, eq(deliveryAssignments.orderId, orders.id))
    .where(eq(orders.userId, id))
    .orderBy(desc(deliveryAssignments.createdAt));

  const totalSpent = customerOrders.reduce((sum, row) => sum + Number(row.total ?? 0), 0);
  const successfulPayments = customerPayments.filter((row) => row.status === "SUCCESS").length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <a
          href="/admin/customers"
          className="inline-flex items-center gap-2 text-sm"
          style={{ color: "#496A5A" }}
        >
          <ArrowLeft size={16} /> Back to customers
        </a>
      </div>

      <PageCard>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: "#24332B" }}>
              {customer.name || "Unnamed customer"}
            </h1>
            <p className="text-sm mt-1" style={{ color: "#7C817A" }}>
              {customer.email || "No email"} | {customer.phone || "No phone"}
            </p>
            <p className="text-xs mt-2" style={{ color: "#7C817A" }}>
              Customer ID: {customer.id}
            </p>
          </div>
          <div className="text-right">
            <StatusBadge status={customer.isActive ? "ACTIVE" : "PAUSED"} />
            <p className="text-xs mt-2" style={{ color: "#7C817A" }}>
              Joined {formatDate(customer.createdAt)}
            </p>
          </div>
        </div>
      </PageCard>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Orders" value={String(customerOrders.length)} icon={Package} iconBg="#EDF2EE" iconColor="#496A5A" sub="Total placed" />
        <StatCard label="Subscriptions" value={String(customerSubscriptions.length)} icon={Repeat} iconBg="#EEF2FF" iconColor="#4F46E5" sub="Plan history" />
        <StatCard label="Payments" value={String(successfulPayments)} icon={CreditCard} iconBg="#E8F9EE" iconColor="#1F7A4A" sub="Successful" />
        <StatCard label="Spent" value={formatCurrency(totalSpent)} icon={User} iconBg="#FDF3C7" iconColor="#A16207" sub="Lifetime value" />
      </div>

      <PageCard noPadding>
        <div className="px-5 py-4 border-b" style={{ borderColor: "#E8E4D9" }}>
          <h2 className="text-sm font-semibold" style={{ color: "#24332B" }}>Order history</h2>
        </div>
        <DataTable
          columns={[
            { label: "Order" },
            { label: "Type" },
            { label: "Status" },
            { label: "Total" },
            { label: "Created" },
          ]}
          rows={customerOrders.map((row) => [
            <span key="id" className="font-mono text-xs" style={{ color: "#496A5A" }}>#{row.id.slice(-6).toUpperCase()}</span>,
            <span key="type" style={{ color: "#24332B" }}>{row.type}</span>,
            <StatusBadge key="status" status={row.status} />,
            <span key="total" className="font-medium" style={{ color: "#24332B" }}>{formatCurrency(row.total)}</span>,
            <span key="created" style={{ color: "#4B5563" }}>{formatDate(row.createdAt)}</span>,
          ])}
          emptyMessage="No orders yet."
        />
      </PageCard>

      <PageCard noPadding>
        <div className="px-5 py-4 border-b" style={{ borderColor: "#E8E4D9" }}>
          <h2 className="text-sm font-semibold" style={{ color: "#24332B" }}>Subscriptions</h2>
        </div>
        <DataTable
          columns={[
            { label: "Plan" },
            { label: "Status" },
            { label: "Meals" },
            { label: "Price" },
            { label: "Period" },
          ]}
          rows={customerSubscriptions.map((row) => [
            <span key="plan" className="font-medium" style={{ color: "#24332B" }}>{row.planName || "Unknown plan"}</span>,
            <StatusBadge key="status" status={row.status} />,
            <span key="meals" style={{ color: "#4B5563" }}>{row.mealsUsed}/{row.totalMeals} used</span>,
            <span key="price" className="font-medium" style={{ color: "#24332B" }}>{formatCurrency(row.pricePaid)}</span>,
            <span key="period" style={{ color: "#4B5563" }}>{String(row.startDate)} to {String(row.expectedEndDate)}</span>,
          ])}
          emptyMessage="No subscriptions yet."
        />
      </PageCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PageCard noPadding>
          <div className="px-5 py-4 border-b" style={{ borderColor: "#E8E4D9" }}>
            <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "#24332B" }}>
              <CreditCard size={14} /> Payments
            </h2>
          </div>
          <DataTable
            columns={[{ label: "Amount" }, { label: "Method" }, { label: "Status" }, { label: "Date" }]}
            rows={customerPayments.map((row) => [
              <span key="amt" className="font-medium" style={{ color: "#24332B" }}>{formatCurrency(row.amount)}</span>,
              <span key="method" style={{ color: "#4B5563" }}>{row.method}</span>,
              <StatusBadge key="status" status={row.status} />,
              <span key="date" style={{ color: "#4B5563" }}>{formatDate(row.paidAt || row.createdAt)}</span>,
            ])}
            emptyMessage="No payments found."
          />
        </PageCard>

        <PageCard noPadding>
          <div className="px-5 py-4 border-b" style={{ borderColor: "#E8E4D9" }}>
            <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "#24332B" }}>
              <Bell size={14} /> Notifications
            </h2>
          </div>
          <DataTable
            columns={[{ label: "Title" }, { label: "Message" }, { label: "Read" }, { label: "Date" }]}
            rows={customerNotifications.map((row) => [
              <span key="title" className="font-medium" style={{ color: "#24332B" }}>{row.title}</span>,
              <span key="body" style={{ color: "#4B5563" }}>{row.body}</span>,
              <StatusBadge key="read" status={row.isRead ? "ACTIVE" : "PAUSED"} />,
              <span key="date" style={{ color: "#4B5563" }}>{formatDate(row.createdAt)}</span>,
            ])}
            emptyMessage="No notifications sent."
          />
        </PageCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PageCard noPadding>
          <div className="px-5 py-4 border-b" style={{ borderColor: "#E8E4D9" }}>
            <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "#24332B" }}>
              <MapPin size={14} /> Addresses
            </h2>
          </div>
          <DataTable
            columns={[{ label: "Label" }, { label: "Address" }, { label: "Pincode" }, { label: "Default" }]}
            rows={customerAddresses.map((row) => [
              <span key="label" className="font-medium" style={{ color: "#24332B" }}>{row.label}</span>,
              <span key="address" style={{ color: "#4B5563" }}>{row.address}, {row.area}, {row.city}</span>,
              <span key="pin" style={{ color: "#4B5563" }}>{row.pincode}</span>,
              <StatusBadge key="default" status={row.isDefault ? "ACTIVE" : "PAUSED"} />,
            ])}
            emptyMessage="No saved addresses."
          />
        </PageCard>

        <PageCard noPadding>
          <div className="px-5 py-4 border-b" style={{ borderColor: "#E8E4D9" }}>
            <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "#24332B" }}>
              <Truck size={14} /> Delivery history
            </h2>
          </div>
          <DataTable
            columns={[{ label: "Order" }, { label: "Status" }, { label: "Scheduled" }, { label: "Delivered" }]}
            rows={customerDeliveries.map((row) => [
              <span key="order" className="font-mono text-xs" style={{ color: "#496A5A" }}>#{row.orderId.slice(-6).toUpperCase()}</span>,
              <StatusBadge key="status" status={row.status} />,
              <span key="sched" style={{ color: "#4B5563" }}>{formatDate(row.scheduledAt)}</span>,
              <span key="done" style={{ color: "#4B5563" }}>{formatDate(row.deliveredAt)}</span>,
            ])}
            emptyMessage="No delivery assignments yet."
          />
        </PageCard>
      </div>
    </div>
  );
}
