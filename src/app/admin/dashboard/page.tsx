"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "../components/AdminSidebar";
import { AdminNavbar } from "../components/AdminNavbar";
import {
  Utensils,
  TrendingUp,
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Sun,
  Sunrise,
  Moon,
  ChefHat,
  ShieldCheck,
  UserCheck,
  UserX,
  FileText,
  Eye,
  X,
  ExternalLink,
} from "lucide-react";
import { getDocumentViewUrl } from "@/lib/supabase-storage";

interface KpiData {
  activeSubscriptions: number;
  todayRevenue: number;
  ordersToday: number;
  avgSlaRate: string;
  onTimePercent: string;
  sparklines: {
    subscriptions: number[];
    revenue: number[];
    orders: number[];
    sla: number[];
  };
}

interface SubscriberMealPrep {
  breakfast: number;
  lunch: number;
  dinner: number;
  total: number;
}

interface LiveOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  total: number;
  status: string;
  type: string;
  createdAt: string;
}

interface AccessRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  status: string;
  aadhaarDocument: string;
  idProofDocument: string;
  aadhaarUrl?: string;
  idProofUrl?: string;
  reviewNotes?: string;
  createdAt: string;
}

interface AnalyticsDay {
  date: string;
  day: string;
  revenue: number;
  orders: number;
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [updatingVerifId, setUpdatingVerifId] = useState<string | null>(null);

  // Document View Modal State
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);

  const [kpi, setKpi] = useState<KpiData>({
    activeSubscriptions: 428,
    todayRevenue: 42850,
    ordersToday: 184,
    avgSlaRate: "12.4m",
    onTimePercent: "98.2%",
    sparklines: {
      subscriptions: [320, 340, 355, 380, 410, 420, 428],
      revenue: [24000, 31000, 28000, 39000, 45000, 38000, 42850],
      orders: [120, 145, 130, 160, 175, 168, 184],
      sla: [92, 94, 91, 96, 98, 97, 98.2],
    },
  });

  const [mealPrep, setMealPrep] = useState<SubscriberMealPrep>({
    breakfast: 142,
    lunch: 285,
    dinner: 198,
    total: 625,
  });

  const [ordersList, setOrdersList] = useState<LiveOrder[]>([]);
  const [requestsList, setRequestsList] = useState<AccessRequest[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsDay[]>([]);

  // 1. Load Overview Data from Database
  async function fetchOverviewData(isManual = false) {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch("/api/admin/overview");
      if (res.ok) {
        const data = await res.json();
        if (data.kpi) setKpi(data.kpi);
        if (data.subscriberMealPrep) setMealPrep(data.subscriberMealPrep);
        if (data.liveOrders) setOrdersList(data.liveOrders);
        if (data.accessRequests) setRequestsList(data.accessRequests);
        if (data.analyticsGraph) setAnalyticsData(data.analyticsGraph);
      }
    } catch (err) {
      console.error("Error fetching overview data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchOverviewData();
  }, []);

  // 2. Handle Order Status Mutations (Accept / Dispatch / Deliver)
  async function handleUpdateOrderStatus(orderId: string, newStatus: string) {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      if (res.ok) {
        setOrdersList((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      }
    } catch (err) {
      console.error("Error updating order status:", err);
    } finally {
      setUpdatingOrderId(null);
    }
  }

  // 3. Handle User Access Verification Approvals / Rejections
  async function handleVerificationReview(requestId: string, status: "APPROVED" | "REJECTED") {
    setUpdatingVerifId(requestId);
    try {
      const res = await fetch("/api/admin/verifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, status }),
      });
      if (res.ok) {
        setRequestsList((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, status } : r))
        );
        if (selectedRequest && selectedRequest.id === requestId) {
          setSelectedRequest((prev) => (prev ? { ...prev, status } : null));
        }
      }
    } catch (err) {
      console.error("Error reviewing verification request:", err);
    } finally {
      setUpdatingVerifId(null);
    }
  }

  // Helper to render mini inline sparkline graphs
  function renderSparkline(points: number[], strokeColor: string) {
    if (!points || points.length < 2) return null;
    const min = Math.min(...points);
    const max = Math.max(...points) || 1;
    const width = 90;
    const height = 30;

    const pathD = points
      .map((val, idx) => {
        const x = (idx / (points.length - 1)) * width;
        const y = height - ((val - min) / (max - min || 1)) * (height - 6) - 3;
        return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");

    return (
      <svg className="w-24 h-8 overflow-visible shrink-0" viewBox={`0 0 ${width} ${height}`}>
        <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans relative">
      {/* ── Fixed Left Sidebar ── */}
      <AdminSidebar />

      {/* ── Main Content Area ── */}
      <div className="pl-64 flex flex-col min-h-screen bg-white">
        {/* ── Sticky Top Navbar ── */}
        <AdminNavbar />

        {/* ── Dashboard Page Content ── */}
        <main className="flex-1 p-8 space-y-8 bg-white">
          {/* Top Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-black tracking-tight uppercase">
                Admin Overview
              </h1>
              <p className="text-sm font-bold text-slate-600 mt-1">
                Real-time kitchen dispatch, subscriber meal production & user access control.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchOverviewData(true)}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-black font-bold text-xs rounded-xl border border-slate-300 transition-colors shadow-sm disabled:opacity-50"
              >
                <RefreshCw size={14} className={refreshing ? "animate-spin text-[#E5A00D]" : ""} />
                {refreshing ? "Syncing..." : "Sync Database"}
              </button>
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black bg-black text-[#E5A00D] border border-black shadow-sm">
                <span className="h-2 w-2 rounded-full bg-[#E5A00D] animate-pulse" />
                Live DB Stream Active
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#E5A00D] space-y-3">
              <Loader2 size={36} className="animate-spin" />
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Fetching real-time metrics from PostgreSQL...
              </p>
            </div>
          ) : (
            <>
              {/* ════════════════════════════════════════════════════════════ */}
              {/* ROW 1: 4 KPI CARDS WITH COLOR GRADIENTS & MINI GRAPH SPARKLINE */}
              {/* ════════════════════════════════════════════════════════════ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Card 1: Active Subscriptions */}
                <div className="bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-black p-6 rounded-2xl shadow-md flex flex-col justify-between relative overflow-hidden group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-black/80">
                      Active Subscriptions
                    </span>
                    <div className="h-10 w-10 rounded-xl bg-black/10 flex items-center justify-center font-bold text-black border border-black/20">
                      <Utensils className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <span className="text-3xl font-black tracking-tight">{kpi.activeSubscriptions}</span>
                      <p className="text-[11px] font-bold text-black/80 mt-1">Active meal plan subscribers</p>
                    </div>
                    {/* Mini Sparkline Graph */}
                    {renderSparkline(kpi.sparklines?.subscriptions, "#000000")}
                  </div>
                </div>

                {/* Card 2: Daily Revenue */}
                <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 text-white p-6 rounded-2xl shadow-md flex flex-col justify-between relative overflow-hidden group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-100">
                      Daily Gross Revenue
                    </span>
                    <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-white border border-white/20">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <span className="text-3xl font-black tracking-tight">₹{kpi.todayRevenue.toLocaleString()}</span>
                      <p className="text-[11px] font-bold text-emerald-100 mt-1">Settled payments today</p>
                    </div>
                    {/* Mini Sparkline Graph */}
                    {renderSparkline(kpi.sparklines?.revenue, "#A7F3D0")}
                  </div>
                </div>

                {/* Card 3: Total Orders Today */}
                <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-800 text-white p-6 rounded-2xl shadow-md flex flex-col justify-between relative overflow-hidden group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-indigo-100">
                      Total Orders Today
                    </span>
                    <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-white border border-white/20">
                      <Package className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <span className="text-3xl font-black tracking-tight">{kpi.ordersToday}</span>
                      <p className="text-[11px] font-bold text-indigo-100 mt-1">Normal + Subscription orders</p>
                    </div>
                    {/* Mini Sparkline Graph */}
                    {renderSparkline(kpi.sparklines?.orders, "#BFDBFE")}
                  </div>
                </div>

                {/* Card 4: Avg Kitchen SLA */}
                <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 text-white p-6 rounded-2xl shadow-md flex flex-col justify-between relative overflow-hidden group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-purple-100">
                      Kitchen SLA / On-Time
                    </span>
                    <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-white border border-white/20">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <span className="text-3xl font-black tracking-tight">{kpi.avgSlaRate}</span>
                      <p className="text-[11px] font-bold text-purple-100 mt-1">
                        {kpi.onTimePercent} dispatch target
                      </p>
                    </div>
                    {/* Mini Sparkline Graph */}
                    {renderSparkline(kpi.sparklines?.sla, "#E9D5FF")}
                  </div>
                </div>
              </div>

              {/* ════════════════════════════════════════════════════════════ */}
              {/* ROW 2: CONTAINER FOR SUBSCRIBER MEAL PREP REQUIREMENTS      */}
              {/* (EXCLUDES TODAY'S NORMAL ORDERS)                             */}
              {/* ════════════════════════════════════════════════════════════ */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-[#E5A00D] text-black flex items-center justify-center font-black">
                      <ChefHat size={18} />
                    </div>
                    <div>
                      <h3 className="font-black text-base text-black uppercase tracking-tight">
                        Subscriber Daily Meal Preparation Requirements
                      </h3>
                      <p className="text-xs text-slate-500 font-bold">
                        Scheduled cooking quantities for active subscribers (excludes normal custom orders)
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-black text-[#E5A00D] font-black text-xs rounded-full">
                    {mealPrep.total} Total Meals
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                  {/* Card 1: Breakfast */}
                  <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center font-bold">
                        <Sunrise className="w-5 h-5 text-amber-700" />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold uppercase text-slate-500">Breakfast</p>
                        <p className="text-2xl font-black text-slate-900">{mealPrep.breakfast}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full">
                      7:30 AM Slot
                    </span>
                  </div>

                  {/* Card 2: Lunch */}
                  <div className="p-4 rounded-xl bg-orange-50/80 border border-orange-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-orange-200 text-orange-900 flex items-center justify-center font-bold">
                        <Sun className="w-5 h-5 text-orange-700" />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold uppercase text-slate-500">Lunch</p>
                        <p className="text-2xl font-black text-slate-900">{mealPrep.lunch}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold bg-orange-200/80 text-orange-900 px-2 py-0.5 rounded-full">
                      12:30 PM Slot
                    </span>
                  </div>

                  {/* Card 3: Dinner */}
                  <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-indigo-200 text-indigo-900 flex items-center justify-center font-bold">
                        <Moon className="w-5 h-5 text-indigo-700" />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold uppercase text-slate-500">Dinner</p>
                        <p className="text-2xl font-black text-slate-900">{mealPrep.dinner}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold bg-indigo-200/80 text-indigo-900 px-2 py-0.5 rounded-full">
                      7:30 PM Slot
                    </span>
                  </div>

                  {/* Card 4: Total Subscriber Meals */}
                  <div className="p-4 rounded-xl bg-black text-white flex items-center justify-between border border-neutral-800">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#E5A00D] text-black flex items-center justify-center font-black">
                        <Utensils className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold uppercase text-slate-300">Total Prep</p>
                        <p className="text-2xl font-black text-white">{mealPrep.total}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black bg-[#E5A00D] text-black px-2 py-0.5 rounded-full">
                      Today
                    </span>
                  </div>
                </div>
              </div>

              {/* ════════════════════════════════════════════════════════════ */}
              {/* ROW 3: LIVE ORDERS CONTAINER WITH ACCEPT & TRACKING BUTTONS  */}
              {/* ════════════════════════════════════════════════════════════ */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div>
                    <h3 className="font-black text-lg text-black uppercase">
                      Live Customer Orders &amp; Dispatch Tracker
                    </h3>
                    <p className="text-xs text-slate-500 font-bold">
                      Incoming normal and subscription orders requiring kitchen action
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    Showing latest {ordersList.length} orders
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-extrabold uppercase tracking-wider">
                        <th className="pb-3 pr-4">Order Details</th>
                        <th className="pb-3 px-4">Customer</th>
                        <th className="pb-3 px-4">Type</th>
                        <th className="pb-3 px-4">Total</th>
                        <th className="pb-3 px-4">Status</th>
                        <th className="pb-3 pl-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {ordersList.length > 0 ? (
                        ordersList.map((order) => (
                          <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                            {/* Order ID */}
                            <td className="py-3.5 pr-4">
                              <p className="font-mono font-black text-black">#{order.id.slice(0, 8)}</p>
                              <p className="text-[11px] text-slate-400">
                                {new Date(order.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </td>

                            {/* Customer */}
                            <td className="py-3.5 px-4 font-bold text-slate-900">
                              <p>{order.customerName}</p>
                              <p className="text-[11px] font-mono text-slate-500">{order.customerPhone || order.customerEmail}</p>
                            </td>

                            {/* Type */}
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  order.type === "SUBSCRIPTION"
                                    ? "bg-amber-100 text-black border border-amber-300"
                                    : "bg-slate-100 text-slate-800 border border-slate-300"
                                }`}
                              >
                                {order.type}
                              </span>
                            </td>

                            {/* Total */}
                            <td className="py-3.5 px-4 font-black text-black">
                              ₹{order.total}
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold ${
                                  order.status === "DELIVERED"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : order.status === "OUT_FOR_DELIVERY"
                                    ? "bg-blue-100 text-blue-800"
                                    : order.status === "PREPARING" || order.status === "CONFIRMED"
                                    ? "bg-[#E5A00D] text-black"
                                    : "bg-amber-100 text-amber-900"
                                }`}
                              >
                                {order.status}
                              </span>
                            </td>

                            {/* Action Buttons */}
                            <td className="py-3.5 pl-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {order.status === "PENDING" && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order.id, "PREPARING")}
                                    disabled={updatingOrderId === order.id}
                                    className="px-3 py-1 bg-black hover:bg-neutral-800 text-[#E5A00D] font-black text-[11px] rounded-lg transition-colors shadow-sm disabled:opacity-50"
                                  >
                                    Accept Order
                                  </button>
                                )}

                                {(order.status === "PENDING" || order.status === "PREPARING" || order.status === "CONFIRMED" || order.status === "READY") && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order.id, "OUT_FOR_DELIVERY")}
                                    disabled={updatingOrderId === order.id}
                                    className="px-3 py-1 bg-[#E5A00D] hover:bg-amber-500 text-black font-black text-[11px] rounded-lg transition-colors shadow-sm disabled:opacity-50"
                                  >
                                    Track / Dispatch
                                  </button>
                                )}

                                {order.status === "OUT_FOR_DELIVERY" && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order.id, "DELIVERED")}
                                    disabled={updatingOrderId === order.id}
                                    className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-[11px] rounded-lg transition-colors shadow-sm disabled:opacity-50"
                                  >
                                    Mark Delivered
                                  </button>
                                )}

                                {order.status === "DELIVERED" && (
                                  <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                                    <CheckCircle2 size={14} /> Completed
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center py-6 text-slate-500 font-medium">
                            No live customer orders found in the database.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ════════════════════════════════════════════════════════════ */}
              {/* ROW 4: USER ACCESS REQUESTS & REVENUE GRAPH (2 COLUMNS)     */}
              {/* ════════════════════════════════════════════════════════════ */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left 6 Cols: User Access & Verification Requests */}
                <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-[#E5A00D]" />
                      <h3 className="font-black text-base text-black uppercase">
                        User Access &amp; Identity Requests
                      </h3>
                    </div>
                    <span className="text-xs font-extrabold bg-amber-100 text-black px-2.5 py-0.5 rounded-full">
                      {requestsList.filter((r) => r.status === "PENDING").length} Pending
                    </span>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {requestsList.length > 0 ? (
                      requestsList.map((req) => (
                        <div
                          key={req.id}
                          className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-black text-sm">{req.userName}</p>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                  req.status === "APPROVED"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : req.status === "REJECTED"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-[#E5A00D] text-black"
                                }`}
                              >
                                {req.status}
                              </span>
                            </div>
                            <p className="text-slate-500 font-mono mt-0.5">{req.userEmail || req.userPhone}</p>
                          </div>

                          {/* Actions: View Details, Approve, Reject */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* View Full Document Details Button */}
                            <button
                              onClick={() => setSelectedRequest(req)}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-black font-extrabold text-xs rounded-xl transition-colors shadow-sm"
                              title="View full user details and submitted documents"
                            >
                              <Eye size={14} className="text-black" /> View
                            </button>

                            {req.status === "PENDING" && (
                              <>
                                <button
                                  onClick={() => handleVerificationReview(req.id, "APPROVED")}
                                  disabled={updatingVerifId === req.id}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-black hover:bg-neutral-800 text-white font-black text-xs rounded-xl shadow-sm transition-colors disabled:opacity-50"
                                >
                                  <UserCheck size={14} className="text-[#E5A00D]" /> Approve
                                </button>
                                <button
                                  onClick={() => handleVerificationReview(req.id, "REJECTED")}
                                  disabled={updatingVerifId === req.id}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-black text-xs rounded-xl border border-red-200 transition-colors disabled:opacity-50"
                                >
                                  <UserX size={14} /> Reject
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-center text-slate-500 py-6 font-medium">
                        No pending identity verification access requests found.
                      </p>
                    )}
                  </div>
                </div>

                {/* Right 6 Cols: Revenue & Order Analytics Graph */}
                <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <h3 className="font-black text-base text-black uppercase">
                      7-Day Revenue &amp; Order Throughput
                    </h3>
                    <span className="text-xs font-bold text-slate-500">Live Analytics</span>
                  </div>

                  {/* SVG Bar Chart Visualization */}
                  <div className="h-64 w-full relative flex items-end justify-between px-2 gap-2 my-2">
                    {analyticsData.map((item) => {
                      const maxRevenue = 15000;
                      const heightPct = Math.min((item.revenue / maxRevenue) * 100, 100);

                      return (
                        <div
                          key={item.date}
                          className="flex-1 flex flex-col items-center h-full justify-end group relative"
                        >
                          {/* Tooltip */}
                          <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[10px] p-2 rounded-lg pointer-events-none shadow-lg z-20 whitespace-nowrap">
                            <p className="font-bold text-[#E5A00D]">{item.day} ({item.date})</p>
                            <p>Revenue: ₹{item.revenue}</p>
                            <p>Orders: {item.orders}</p>
                          </div>

                          {/* Bar */}
                          <div
                            className="w-full max-w-[28px] bg-gradient-to-t from-black to-[#E5A00D] rounded-t-lg transition-all group-hover:scale-105"
                            style={{ height: `${Math.max(heightPct, 15)}%` }}
                          />

                          {/* Label */}
                          <span className="text-[11px] font-black text-slate-600 mt-2 uppercase">
                            {item.day}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-bold text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-[#E5A00D]" />
                      <span>Daily Revenue Peak</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-black" />
                      <span>Order Volume Baseline</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* FULL USER ACCESS REQUEST & SUBMITTED DOCUMENTS MODAL         */}
      {/* ════════════════════════════════════════════════════════════ */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-300 w-full max-w-2xl rounded-2xl shadow-2xl p-6 space-y-6 relative overflow-hidden text-slate-900 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-black">
                    User Access Request Details
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-black uppercase ${
                      selectedRequest.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800"
                        : selectedRequest.status === "REJECTED"
                        ? "bg-red-100 text-red-800"
                        : "bg-[#E5A00D] text-black"
                    }`}
                  >
                    {selectedRequest.status}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  Submitted on {new Date(selectedRequest.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-black transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Customer Contact & Identity Profile */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <p className="font-extrabold uppercase text-slate-400 text-[10px]">Customer Name</p>
                <p className="font-extrabold text-black text-sm mt-0.5">{selectedRequest.userName}</p>
              </div>
              <div>
                <p className="font-extrabold uppercase text-slate-400 text-[10px]">Email Address</p>
                <p className="font-bold text-slate-800 mt-0.5 font-mono">{selectedRequest.userEmail || "N/A"}</p>
              </div>
              <div>
                <p className="font-extrabold uppercase text-slate-400 text-[10px]">Phone Number</p>
                <p className="font-bold text-slate-800 mt-0.5 font-mono">{selectedRequest.userPhone || "N/A"}</p>
              </div>
            </div>

            {/* Submitted Documents Section */}
            <div className="space-y-4">
              <h4 className="font-black text-sm text-black uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#E5A00D]" /> Submitted Verification Documents
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Aadhaar Document */}
                {(() => {
                  const aadhaarDocPath = selectedRequest.aadhaarDocument || selectedRequest.aadhaarUrl || "";
                  const aadhaarViewUrl = getDocumentViewUrl(aadhaarDocPath);
                  const isPdf = aadhaarDocPath.toLowerCase().includes(".pdf");

                  return (
                    <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-black">Aadhaar Card Document</span>
                        {aadhaarViewUrl && (
                          <a
                            href={aadhaarViewUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] font-extrabold text-black hover:text-[#E5A00D] flex items-center gap-1"
                          >
                            Open Full <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                      {aadhaarViewUrl ? (
                        <div className="relative h-44 w-full bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center">
                          {isPdf ? (
                            <div className="flex flex-col items-center justify-center p-3 text-center space-y-2">
                              <FileText className="w-10 h-10 text-[#E5A00D]" />
                              <span className="text-xs font-black text-black uppercase">PDF Document File</span>
                              <span className="text-[10px] text-slate-500 font-mono break-all line-clamp-1">
                                {selectedRequest.aadhaarDocument || "aadhaar.pdf"}
                              </span>
                              <a
                                href={aadhaarViewUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1 bg-black text-[#E5A00D] font-bold text-[11px] rounded-lg hover:bg-neutral-800 transition-colors"
                              >
                                View PDF Document
                              </a>
                            </div>
                          ) : (
                            <img
                              src={aadhaarViewUrl}
                              alt="Aadhaar Document"
                              className="object-contain h-full w-full"
                              onError={(e) => {
                                const target = e.target as HTMLElement;
                                target.style.display = "none";
                                const parent = target.parentElement;
                                if (parent && !parent.querySelector(".fallback-card")) {
                                  const div = document.createElement("div");
                                  div.className = "fallback-card flex flex-col items-center justify-center p-3 text-center space-y-1.5";
                                  div.innerHTML = `<div class="text-xs font-black text-slate-700">Document Image File</div><div class="text-[10px] text-slate-500 font-mono break-all p-1">${selectedRequest.aadhaarDocument || "aadhaar"}</div><a href="${aadhaarViewUrl}" target="_blank" class="px-3 py-1 bg-black text-[#E5A00D] font-bold text-[11px] rounded-lg">View Notice / Document</a>`;
                                  parent.appendChild(div);
                                }
                              }}
                            />
                          )}
                        </div>
                      ) : (
                        <div className="h-32 rounded-lg bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-500 font-medium">
                          No Aadhaar document uploaded
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 2. ID Proof Document */}
                {(() => {
                  const idProofDocPath = selectedRequest.idProofDocument || selectedRequest.idProofUrl || "";
                  const idProofViewUrl = getDocumentViewUrl(idProofDocPath);
                  const isPdf = idProofDocPath.toLowerCase().includes(".pdf");

                  return (
                    <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-black">Secondary ID Proof</span>
                        {idProofViewUrl && (
                          <a
                            href={idProofViewUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] font-extrabold text-black hover:text-[#E5A00D] flex items-center gap-1"
                          >
                            Open Full <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                      {idProofViewUrl ? (
                        <div className="relative h-44 w-full bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center">
                          {isPdf ? (
                            <div className="flex flex-col items-center justify-center p-3 text-center space-y-2">
                              <FileText className="w-10 h-10 text-[#E5A00D]" />
                              <span className="text-xs font-black text-black uppercase">PDF Document File</span>
                              <span className="text-[10px] text-slate-500 font-mono break-all line-clamp-1">
                                {selectedRequest.idProofDocument || "id-proof.pdf"}
                              </span>
                              <a
                                href={idProofViewUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1 bg-black text-[#E5A00D] font-bold text-[11px] rounded-lg hover:bg-neutral-800 transition-colors"
                              >
                                View PDF Document
                              </a>
                            </div>
                          ) : (
                            <img
                              src={idProofViewUrl}
                              alt="ID Proof Document"
                              className="object-contain h-full w-full"
                              onError={(e) => {
                                const target = e.target as HTMLElement;
                                target.style.display = "none";
                                const parent = target.parentElement;
                                if (parent && !parent.querySelector(".fallback-card")) {
                                  const div = document.createElement("div");
                                  div.className = "fallback-card flex flex-col items-center justify-center p-3 text-center space-y-1.5";
                                  div.innerHTML = `<div class="text-xs font-black text-slate-700">Document Image File</div><div class="text-[10px] text-slate-500 font-mono break-all p-1">${selectedRequest.idProofDocument || "id-proof"}</div><a href="${idProofViewUrl}" target="_blank" class="px-3 py-1 bg-black text-[#E5A00D] font-bold text-[11px] rounded-lg">View Notice / Document</a>`;
                                  parent.appendChild(div);
                                }
                              }}
                            />
                          )}
                        </div>
                      ) : (
                        <div className="h-32 rounded-lg bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-500 font-medium">
                          No ID proof document uploaded
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={() => setSelectedRequest(null)}
                className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-black font-bold text-xs rounded-xl transition-colors"
              >
                Close Modal
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleVerificationReview(selectedRequest.id, "REJECTED")}
                  disabled={updatingVerifId === selectedRequest.id}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-black text-xs rounded-xl border border-red-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <UserX size={16} /> Reject Request
                </button>

                <button
                  onClick={() => handleVerificationReview(selectedRequest.id, "APPROVED")}
                  disabled={updatingVerifId === selectedRequest.id}
                  className="flex-1 sm:flex-initial px-5 py-2 bg-black hover:bg-neutral-800 text-white font-black text-xs rounded-xl shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <UserCheck size={16} className="text-[#E5A00D]" /> Approve User Access
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
