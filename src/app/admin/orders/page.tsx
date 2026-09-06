"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "../components/AdminSidebar";
import { AdminNavbar } from "../components/AdminNavbar";
import {
  Package,
  Utensils,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Search,
  Eye,
  X,
  User,
  MapPin,
  CreditCard,
  Phone,
  Mail,
  ShieldCheck,
  Award,
  ChevronRight,
} from "lucide-react";

interface OrderItem {
  id: string;
  foodItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

interface PaymentInfo {
  id: string;
  amount: number;
  method: string;
  status: string;
  transactionId?: string;
  paidAt?: string;
}

interface OrderRecord {
  id: string;
  type: string;
  status: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Customer Details
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  verificationStatus?: string;
  rewardPoints?: number;
  avatarUrl?: string;
  userCreatedAt?: string;
  // Address Details
  address?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
  // Items & Payment
  items: OrderItem[];
  payment?: PaymentInfo | null;
}

interface SummaryStats {
  totalToday: number;
  revenueToday: number;
  preparingCount: number;
  deliveredCount: number;
}

export default function AdminOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [summary, setSummary] = useState<SummaryStats>({
    totalToday: 0,
    revenueToday: 0,
    preparingCount: 0,
    deliveredCount: 0,
  });

  // Filter States
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Customer & Order Modal State
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);

  async function fetchOrdersData(isManual = false) {
    if (isManual) setRefreshing(true);
    try {
      let url = "/api/admin/orders";
      if (activeTab === "TODAY") {
        url += "?today=true";
      } else if (activeTab !== "ALL") {
        url += `?status=${activeTab}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        if (data.summary) setSummary(data.summary);
      }
    } catch (err) {
      console.error("Error fetching orders data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchOrdersData();
  }, [activeTab]);

  async function handleUpdateStatus(orderId: string, newStatus: string) {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      }
    } catch (err) {
      console.error("Error updating order status:", err);
    } finally {
      setUpdatingOrderId(null);
    }
  }

  // Filtered orders list by search query
  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase();
    return (
      o.id.toLowerCase().includes(q) ||
      o.userName.toLowerCase().includes(q) ||
      o.userEmail.toLowerCase().includes(q) ||
      (o.userPhone && o.userPhone.includes(q)) ||
      o.items.some((i) => i.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans relative">
      {/* ── Fixed Left Sidebar ── */}
      <AdminSidebar />

      {/* ── Main Content Area ── */}
      <div className="pl-64 flex flex-col min-h-screen bg-white">
        {/* ── Sticky Top Navbar ── */}
        <AdminNavbar />

        {/* ── Page Body ── */}
        <main className="flex-1 p-8 space-y-8 bg-white">
          {/* Top Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-black tracking-tight uppercase">
                Orders &amp; Customer Management
              </h1>
              <p className="text-sm font-bold text-slate-600 mt-1">
                Real-time tracking of today&apos;s customer orders, itemized receipts &amp; subscriber profiles.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchOrdersData(true)}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-black font-bold text-xs rounded-xl border border-slate-300 transition-colors shadow-sm disabled:opacity-50"
              >
                <RefreshCw size={14} className={refreshing ? "animate-spin text-[#E5A00D]" : ""} />
                {refreshing ? "Syncing..." : "Sync Orders"}
              </button>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* SUMMARY KPI METRIC CARDS                                     */}
          {/* ════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Total Orders Today */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:border-[#E5A00D] transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Today&apos;s Total Orders
                </span>
                <div className="h-10 w-10 rounded-xl bg-[#E5A00D] text-black flex items-center justify-center font-bold">
                  <Package className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-black text-black">{summary.totalToday}</span>
                <span className="text-xs font-bold text-slate-500">Live Database</span>
              </div>
            </div>

            {/* Card 2: Revenue Today */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:border-[#E5A00D] transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Today&apos;s Gross Revenue
                </span>
                <div className="h-10 w-10 rounded-xl bg-black text-[#E5A00D] flex items-center justify-center font-bold">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-black text-black">₹{summary.revenueToday.toLocaleString()}</span>
                <span className="text-xs font-bold text-slate-500">Settled Total</span>
              </div>
            </div>

            {/* Card 3: In Kitchen / Preparing */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:border-[#E5A00D] transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Kitchen Prep / Active
                </span>
                <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-black text-black">{summary.preparingCount}</span>
                <span className="text-xs font-bold text-amber-700">In Progress</span>
              </div>
            </div>

            {/* Card 4: Delivered / Completed */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:border-[#E5A00D] transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Completed / Delivered
                </span>
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-black text-black">{summary.deliveredCount}</span>
                <span className="text-xs font-bold text-emerald-700">Dispatched</span>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* FILTER NAVIGATION TABS & SEARCH BAR                          */}
          {/* ════════════════════════════════════════════════════════════ */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: "ALL", label: "All Orders" },
                  { id: "TODAY", label: "Today's Orders" },
                  { id: "PENDING", label: "Pending" },
                  { id: "PREPARING", label: "Preparing / Cooking" },
                  { id: "OUT_FOR_DELIVERY", label: "Out For Delivery" },
                  { id: "DELIVERED", label: "Delivered" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 text-xs font-black rounded-xl transition-colors ${
                      activeTab === tab.id
                        ? "bg-[#E5A00D] text-black shadow-sm"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* In-Table Search Input */}
              <div className="relative w-full lg:w-72">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by customer, phone, item..."
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#E5A00D] focus:bg-white text-black font-medium"
                />
              </div>
            </div>

            {/* ════════════════════════════════════════════════════════════ */}
            {/* ORDERS & CUSTOMER LIST TABLE                                 */}
            {/* ════════════════════════════════════════════════════════════ */}
            {loading ? (
              <div className="flex justify-center py-12 text-[#E5A00D]">
                <Loader2 size={32} className="animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-extrabold uppercase tracking-wider">
                      <th className="pb-3 pr-4">Order ID &amp; Time</th>
                      <th className="pb-3 px-4">Customer Details</th>
                      <th className="pb-3 px-4">Order Items</th>
                      <th className="pb-3 px-4">Type</th>
                      <th className="pb-3 px-4">Total</th>
                      <th className="pb-3 px-4">Status</th>
                      <th className="pb-3 pl-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredOrders.length > 0 ? (
                      filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                          {/* Order ID */}
                          <td className="py-4 pr-4">
                            <p className="font-mono font-black text-black group-hover:text-[#E5A00D] transition-colors">
                              #{order.id.slice(0, 8)}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {new Date(order.createdAt).toLocaleString([], {
                                dateStyle: "short",
                                timeStyle: "short",
                              })}
                            </p>
                          </td>

                          {/* Customer Details */}
                          <td className="py-4 px-4 font-bold text-slate-900">
                            <p className="text-sm font-black text-black">{order.userName}</p>
                            <p className="text-[11px] font-mono text-slate-500">{order.userPhone || order.userEmail}</p>
                            {order.city && (
                              <p className="text-[10px] text-slate-400 font-semibold">{order.area ? `${order.area}, ` : ""}{order.city}</p>
                            )}
                          </td>

                          {/* Order Items */}
                          <td className="py-4 px-4 font-medium">
                            {order.items.length > 0 ? (
                              <div className="space-y-0.5">
                                <p className="font-bold text-black truncate max-w-xs">
                                  {order.items[0].name} {order.items[0].quantity > 1 ? `(x${order.items[0].quantity})` : ""}
                                </p>
                                {order.items.length > 1 && (
                                  <p className="text-[11px] text-[#E5A00D] font-bold">
                                    +{order.items.length - 1} more items
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400">Normal Bowl Order</span>
                            )}
                          </td>

                          {/* Type */}
                          <td className="py-4 px-4">
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

                          {/* Total Amount */}
                          <td className="py-4 px-4 font-black text-black text-sm">
                            ₹{order.total}
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4">
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

                          {/* Actions & View Customer */}
                          <td className="py-4 pl-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Full Customer Details Button */}
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-black font-extrabold text-xs rounded-xl transition-colors shadow-sm"
                                title="View full customer profile & order details"
                              >
                                <Eye size={14} /> View Details
                              </button>

                              {order.status === "PENDING" && (
                                <button
                                  onClick={() => handleUpdateStatus(order.id, "PREPARING")}
                                  disabled={updatingOrderId === order.id}
                                  className="px-3 py-1.5 bg-black hover:bg-neutral-800 text-[#E5A00D] font-black text-xs rounded-xl transition-colors shadow-sm disabled:opacity-50"
                                >
                                  Accept Order
                                </button>
                              )}

                              {(order.status === "PREPARING" || order.status === "CONFIRMED") && (
                                <button
                                  onClick={() => handleUpdateStatus(order.id, "OUT_FOR_DELIVERY")}
                                  disabled={updatingOrderId === order.id}
                                  className="px-3 py-1.5 bg-[#E5A00D] hover:bg-amber-500 text-black font-black text-xs rounded-xl transition-colors shadow-sm disabled:opacity-50"
                                >
                                  Dispatch
                                </button>
                              )}

                              {order.status === "OUT_FOR_DELIVERY" && (
                                <button
                                  onClick={() => handleUpdateStatus(order.id, "DELIVERED")}
                                  disabled={updatingOrderId === order.id}
                                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl transition-colors shadow-sm disabled:opacity-50"
                                >
                                  Mark Delivered
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-10 text-slate-500 font-medium">
                          No orders matching your criteria found in the database.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* FULL CUSTOMER & ORDER DETAILS MODAL                          */}
      {/* ════════════════════════════════════════════════════════════ */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-300 w-full max-w-3xl rounded-2xl shadow-2xl p-6 space-y-6 relative overflow-hidden text-slate-900 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-black">
                    Order #{selectedOrder.id.slice(0, 8)}
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-black uppercase ${
                      selectedOrder.status === "DELIVERED"
                        ? "bg-emerald-100 text-emerald-800"
                        : selectedOrder.status === "OUT_FOR_DELIVERY"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-[#E5A00D] text-black"
                    }`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-black transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* 1. Customer Profile Information */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-1.5">
                  <User size={16} className="text-[#E5A00D]" /> Customer Profile Overview
                </span>
                <span className="text-[11px] font-bold bg-[#E5A00D] text-black px-2 py-0.5 rounded-full">
                  Verified Customer
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
                <div>
                  <p className="font-extrabold uppercase text-slate-400 text-[10px]">Full Name</p>
                  <p className="font-black text-black text-sm mt-0.5">{selectedOrder.userName}</p>
                </div>
                <div>
                  <p className="font-extrabold uppercase text-slate-400 text-[10px]">Phone Number</p>
                  <p className="font-bold text-slate-800 mt-0.5 font-mono flex items-center gap-1">
                    <Phone size={12} className="text-slate-400" /> {selectedOrder.userPhone || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="font-extrabold uppercase text-slate-400 text-[10px]">Email Address</p>
                  <p className="font-bold text-slate-800 mt-0.5 font-mono flex items-center gap-1 truncate">
                    <Mail size={12} className="text-slate-400" /> {selectedOrder.userEmail || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Delivery Address */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-1.5">
                <MapPin size={16} className="text-[#E5A00D]" /> Delivery Address
              </span>
              <p className="text-xs font-bold text-slate-800">
                {selectedOrder.address || "Main Kitchen Dispatch Address"}
              </p>
              <p className="text-xs text-slate-500 font-medium">
                {[selectedOrder.landmark, selectedOrder.area, selectedOrder.city, selectedOrder.state, selectedOrder.pincode]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>

            {/* 3. Itemized Dish List */}
            <div className="space-y-3">
              <span className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-1.5">
                <Utensils size={16} className="text-[#E5A00D]" /> Itemized Order Receipts
              </span>
              {selectedOrder.items.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-extrabold uppercase text-slate-400 text-[10px]">
                        <th className="p-2.5">Item Name</th>
                        <th className="p-2.5 text-center">Qty</th>
                        <th className="p-2.5 text-right">Unit Price</th>
                        <th className="p-2.5 text-right">Total Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {selectedOrder.items.map((item) => (
                        <tr key={item.id}>
                          <td className="p-2.5 font-bold text-black">{item.name}</td>
                          <td className="p-2.5 text-center font-bold">{item.quantity}</td>
                          <td className="p-2.5 text-right">₹{item.unitPrice}</td>
                          <td className="p-2.5 text-right font-black text-black">₹{item.totalPrice}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl">
                  Standard customized subscription bowl order.
                </p>
              )}
            </div>

            {/* 4. Payment & Billing Details */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between gap-4 text-xs">
              <div className="space-y-1">
                <p className="font-extrabold uppercase text-slate-400 text-[10px] flex items-center gap-1">
                  <CreditCard size={12} /> Payment Summary
                </p>
                <p className="font-bold text-black">
                  Method: {selectedOrder.payment?.method || "ONLINE / UPI"}
                </p>
                <p className="text-slate-500 font-mono text-[11px]">
                  Txn ID: {selectedOrder.payment?.transactionId || selectedOrder.id}
                </p>
              </div>

              <div className="text-right space-y-1">
                <p className="text-slate-500">Subtotal: ₹{selectedOrder.subtotal}</p>
                <p className="text-slate-500">Delivery Fee: ₹{selectedOrder.deliveryFee}</p>
                {selectedOrder.discount > 0 && (
                  <p className="text-emerald-700 font-bold">Discount: -₹{selectedOrder.discount}</p>
                )}
                <p className="text-base font-black text-black border-t border-slate-200 pt-1">
                  Grand Total: ₹{selectedOrder.total}
                </p>
              </div>
            </div>

            {/* Modal Controls */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-black font-bold text-xs rounded-xl transition-colors"
              >
                Close Window
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {selectedOrder.status === "PENDING" && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, "PREPARING")}
                    disabled={updatingOrderId === selectedOrder.id}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-black hover:bg-neutral-800 text-[#E5A00D] font-black text-xs rounded-xl shadow-md transition-colors disabled:opacity-50"
                  >
                    Accept &amp; Prepare Order
                  </button>
                )}

                {(selectedOrder.status === "PREPARING" || selectedOrder.status === "CONFIRMED") && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, "OUT_FOR_DELIVERY")}
                    disabled={updatingOrderId === selectedOrder.id}
                    className="flex-1 sm:flex-initial px-5 py-2 bg-[#E5A00D] hover:bg-amber-500 text-black font-black text-xs rounded-xl shadow-md transition-colors disabled:opacity-50"
                  >
                    Dispatch for Delivery
                  </button>
                )}

                {selectedOrder.status === "OUT_FOR_DELIVERY" && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, "DELIVERED")}
                    disabled={updatingOrderId === selectedOrder.id}
                    className="flex-1 sm:flex-initial px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-md transition-colors disabled:opacity-50"
                  >
                    Mark as Delivered
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
