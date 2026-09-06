"use client";

import { useState, useEffect, useMemo } from "react";
import { AdminSidebar } from "../components/AdminSidebar";
import { AdminNavbar } from "../components/AdminNavbar";
import {
  Bike,
  Sun,
  Sunrise,
  Moon,
  Search,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  Truck,
  ChefHat,
  RotateCcw,
  Sparkles,
  FileText,
  User,
  ShoppingBag,
  Grid,
  List,
  Check,
  Package,
  Calendar,
} from "lucide-react";

type MealSlot = "ALL" | "BREAKFAST" | "LUNCH" | "DINNER";
type OrderTypeFilter = "ALL" | "SUBSCRIBER" | "DAILY_ORDER";
type DeliveryStatus = "MAKING" | "OUT_FOR_DELIVERY" | "DELIVERED";
type StatusFilter = "ALL" | DeliveryStatus;
type SortOrder = "NEWEST" | "OLDEST";

interface DeliveryItem {
  id: string;
  orderIdDisplay: string;
  rawId: string;
  orderType: "SUBSCRIBER" | "DAILY_ORDER";
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress: string;
  landmark?: string;
  mealName: string;
  quantity: number;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER";
  deliveryStatus: DeliveryStatus;
  deliveryNotes: string;
  createdAt: string;
}

interface SummaryStats {
  totalDeliveriesToday: number;
  breakfastCount: number;
  lunchCount: number;
  dinnerCount: number;
  subscriberOrders: number;
  dailyOrders: number;
}

export default function AdminDeliveryPage() {
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [summary, setSummary] = useState<SummaryStats>({
    totalDeliveriesToday: 0,
    breakfastCount: 0,
    lunchCount: 0,
    dinnerCount: 0,
    subscriberOrders: 0,
    dailyOrders: 0,
  });

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filters State
  const [activeSlot, setActiveSlot] = useState<MealSlot>("LUNCH");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<OrderTypeFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [sortOrder, setSortOrder] = useState<SortOrder>("NEWEST");
  const [viewMode, setViewMode] = useState<"CARDS" | "TABLE">("CARDS");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchTodayDeliveries();
  }, []);

  const fetchTodayDeliveries = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/deliveries");
      if (!res.ok) {
        console.warn("Delivery API returned non-OK status:", res.status);
        return;
      }
      const text = await res.text();
      if (!text) return;
      const data = JSON.parse(text);
      if (data.success && data.deliveries) {
        setDeliveries(data.deliveries);
        if (data.summary) {
          setSummary(data.summary);
        }
      }
    } catch (err) {
      console.error("Failed to fetch today's delivery orders", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (item: DeliveryItem, newStatus: DeliveryStatus) => {
    if (item.deliveryStatus === newStatus) return;

    setUpdatingId(item.id);
    // Optimistic UI update
    setDeliveries((prev) =>
      prev.map((d) => (d.id === item.id ? { ...d, deliveryStatus: newStatus } : d))
    );

    try {
      const res = await fetch("/api/admin/deliveries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          rawId: item.rawId,
          orderType: item.orderType,
          deliveryStatus: newStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage(`Order ${item.orderIdDisplay} updated to "${getStatusLabel(newStatus)}"!`);
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        fetchTodayDeliveries();
      }
    } catch (err) {
      console.error("Failed to update status", err);
      fetchTodayDeliveries();
    } finally {
      setUpdatingId(null);
    }
  };

  // Status Label Helper
  const getStatusLabel = (status: DeliveryStatus) => {
    switch (status) {
      case "MAKING":
        return "Making Order";
      case "OUT_FOR_DELIVERY":
        return "Out for Delivery";
      case "DELIVERED":
        return "Delivered";
    }
  };

  const getStatusBadgeClass = (status: DeliveryStatus) => {
    switch (status) {
      case "MAKING":
        return "bg-amber-100 text-amber-900 border-amber-300 font-extrabold";
      case "OUT_FOR_DELIVERY":
        return "bg-blue-100 text-blue-900 border-blue-300 font-extrabold";
      case "DELIVERED":
        return "bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold";
    }
  };

  // Filtered & Sorted Deliveries for Today
  const filteredDeliveries = useMemo(() => {
    return deliveries
      .filter((item) => {
        // Slot tab filter
        if (activeSlot !== "ALL" && item.mealType !== activeSlot) return false;

        // Order Type filter
        if (typeFilter !== "ALL" && item.orderType !== typeFilter) return false;

        // Status filter
        if (statusFilter !== "ALL" && item.deliveryStatus !== statusFilter) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = item.customerName.toLowerCase().includes(q);
          const matchId = item.orderIdDisplay.toLowerCase().includes(q);
          const matchPhone = item.customerPhone.includes(q);
          const matchAddress = item.deliveryAddress.toLowerCase().includes(q);
          const matchMeal = item.mealName.toLowerCase().includes(q);
          if (!matchName && !matchId && !matchPhone && !matchAddress && !matchMeal) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return sortOrder === "NEWEST" ? timeB - timeA : timeA - timeB;
      });
  }, [deliveries, activeSlot, typeFilter, statusFilter, searchQuery, sortOrder]);

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <AdminSidebar />

      <div className="pl-64 flex flex-col min-h-screen bg-white">
        <AdminNavbar />

        <main className="flex-1 p-8 space-y-8 bg-white max-w-[1600px] mx-auto w-full">
          {/* Header Action Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-black text-[#E5A00D] flex items-center justify-center font-bold shadow-none border border-black shrink-0">
                <Bike className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-black uppercase tracking-tight">
                    Today's Delivery Operations
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-[#E5A00D] text-black">
                    Today Only
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500 mt-0.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-black" />
                  <span>{todayFormatted}</span>
                  <span>•</span>
                  <span>Manage orders scheduled for fulfillment today.</span>
                </p>
              </div>
            </div>

            {/* Quick Actions & Refresh */}
            <div className="flex items-center gap-3">
              {toastMessage && (
                <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold animate-fadeIn">
                  <Check className="w-4 h-4 text-emerald-600" />
                  {toastMessage}
                </div>
              )}

              <button
                onClick={fetchTodayDeliveries}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                <RotateCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Refresh Today's Feed
              </button>
            </div>
          </div>

          {/* TODAY'S 6 SUMMARY CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Card 1: Total Deliveries Today */}
            <div className="p-4 bg-white border-2 border-black rounded-2xl flex flex-col justify-between shadow-none">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Today</p>
              <h3 className="text-2xl font-black text-black mt-1">{summary.totalDeliveriesToday}</h3>
              <div className="mt-2 text-[10px] font-bold text-slate-400">Scheduled for today</div>
            </div>

            {/* Card 2: Breakfast Count */}
            <div className="p-4 bg-amber-50/60 border border-amber-300 rounded-2xl flex flex-col justify-between shadow-none">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-black text-amber-950 uppercase tracking-wider">Breakfast</p>
                <Sunrise className="w-4 h-4 text-amber-700" />
              </div>
              <h3 className="text-2xl font-black text-amber-950 mt-1">{summary.breakfastCount}</h3>
              <p className="text-[10px] text-amber-800 font-bold mt-2">Morning slot</p>
            </div>

            {/* Card 3: Lunch Count */}
            <div className="p-4 bg-amber-50/60 border border-amber-300 rounded-2xl flex flex-col justify-between shadow-none">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-black text-amber-950 uppercase tracking-wider">Lunch</p>
                <Sun className="w-4 h-4 text-amber-700" />
              </div>
              <h3 className="text-2xl font-black text-amber-950 mt-1">{summary.lunchCount}</h3>
              <p className="text-[10px] text-amber-800 font-bold mt-2">Afternoon slot</p>
            </div>

            {/* Card 4: Dinner Count */}
            <div className="p-4 bg-amber-50/60 border border-amber-300 rounded-2xl flex flex-col justify-between shadow-none">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-black text-amber-950 uppercase tracking-wider">Dinner</p>
                <Moon className="w-4 h-4 text-amber-700" />
              </div>
              <h3 className="text-2xl font-black text-amber-950 mt-1">{summary.dinnerCount}</h3>
              <p className="text-[10px] text-amber-800 font-bold mt-2">Evening slot</p>
            </div>

            {/* Card 5: Subscriber Orders */}
            <div className="p-4 bg-amber-100/60 border border-amber-400 rounded-2xl flex flex-col justify-between shadow-none">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-black text-amber-950 uppercase tracking-wider">Subscribers</p>
                <Sparkles className="w-4 h-4 text-amber-800" />
              </div>
              <h3 className="text-2xl font-black text-amber-950 mt-1">{summary.subscriberOrders}</h3>
              <p className="text-[10px] text-amber-800 font-bold mt-2">Scheduled meals today</p>
            </div>

            {/* Card 6: Daily Orders */}
            <div className="p-4 bg-emerald-50/60 border border-emerald-300 rounded-2xl flex flex-col justify-between shadow-none">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-black text-emerald-950 uppercase tracking-wider">Daily Orders</p>
                <ShoppingBag className="w-4 h-4 text-emerald-700" />
              </div>
              <h3 className="text-2xl font-black text-emerald-950 mt-1">{summary.dailyOrders}</h3>
              <p className="text-[10px] text-emerald-800 font-bold mt-2">One-time orders today</p>
            </div>
          </div>

          {/* THREE MEAL SECTIONS TABS (BREAKFAST / LUNCH / DINNER) */}
          <div className="border-b border-slate-200 pb-0">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Segmented Meal Slot Tabs */}
              <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveSlot("BREAKFAST")}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                    activeSlot === "BREAKFAST"
                      ? "bg-black text-white shadow-none"
                      : "text-slate-600 hover:text-black"
                  }`}
                >
                  <Sunrise className="w-4 h-4 text-[#E5A00D]" />
                  <span>Breakfast Section</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    activeSlot === "BREAKFAST" ? "bg-[#E5A00D] text-black" : "bg-slate-200 text-slate-700"
                  }`}>
                    {summary.breakfastCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSlot("LUNCH")}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                    activeSlot === "LUNCH"
                      ? "bg-black text-white shadow-none"
                      : "text-slate-600 hover:text-black"
                  }`}
                >
                  <Sun className="w-4 h-4 text-[#E5A00D]" />
                  <span>Lunch Section</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    activeSlot === "LUNCH" ? "bg-[#E5A00D] text-black" : "bg-slate-200 text-slate-700"
                  }`}>
                    {summary.lunchCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSlot("DINNER")}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                    activeSlot === "DINNER"
                      ? "bg-black text-white shadow-none"
                      : "text-slate-600 hover:text-black"
                  }`}
                >
                  <Moon className="w-4 h-4 text-[#E5A00D]" />
                  <span>Dinner Section</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    activeSlot === "DINNER" ? "bg-[#E5A00D] text-black" : "bg-slate-200 text-slate-700"
                  }`}>
                    {summary.dinnerCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSlot("ALL")}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                    activeSlot === "ALL"
                      ? "bg-black text-white shadow-none"
                      : "text-slate-600 hover:text-black"
                  }`}
                >
                  <span>All Today's Meals</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    activeSlot === "ALL" ? "bg-[#E5A00D] text-black" : "bg-slate-200 text-slate-700"
                  }`}>
                    {summary.totalDeliveriesToday}
                  </span>
                </button>
              </div>

              {/* View Layout Switcher */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setViewMode("CARDS")}
                  className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                    viewMode === "CARDS" ? "bg-white text-black border border-slate-300" : "text-slate-500"
                  }`}
                >
                  <Grid className="w-4 h-4" />
                  Cards View
                </button>
                <button
                  onClick={() => setViewMode("TABLE")}
                  className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                    viewMode === "TABLE" ? "bg-white text-black border border-slate-300" : "text-slate-500"
                  }`}
                >
                  <List className="w-4 h-4" />
                  Table View
                </button>
              </div>
            </div>
          </div>

          {/* FILTERS & SEARCH CONTROL BAR */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
              {/* Search Bar */}
              <div className="lg:col-span-4 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search customer, Order ID, phone, address..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-black focus:outline-none focus:border-black"
                />
              </div>

              {/* Order Type Filter */}
              <div className="lg:col-span-3">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as OrderTypeFilter)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-black focus:outline-none focus:border-black"
                >
                  <option value="ALL">All Order Types (Subscribers & Daily)</option>
                  <option value="SUBSCRIBER">⭐ Subscriber Orders Only</option>
                  <option value="DAILY_ORDER">🛍️ Daily Orders Only</option>
                </select>
              </div>

              {/* Delivery Status Filter */}
              <div className="lg:col-span-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-black focus:outline-none focus:border-black"
                >
                  <option value="ALL">All Delivery Statuses</option>
                  <option value="MAKING">👨‍🍳 Making Order</option>
                  <option value="OUT_FOR_DELIVERY">🛵 Out for Delivery</option>
                  <option value="DELIVERED">✅ Delivered</option>
                </select>
              </div>

              {/* Sort Order */}
              <div className="lg:col-span-2">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-black focus:outline-none focus:border-black"
                >
                  <option value="NEWEST">Newest First</option>
                  <option value="OLDEST">Oldest First</option>
                </select>
              </div>
            </div>
          </div>

          {/* ORDER LIST CONTENT VIEW */}
          {loading ? (
            <div className="p-12 text-center border border-slate-200 rounded-2xl bg-white space-y-3">
              <RotateCcw className="w-8 h-8 text-[#E5A00D] animate-spin mx-auto" />
              <p className="text-xs font-extrabold text-black uppercase tracking-wider">
                Loading Today's Delivery Queue...
              </p>
            </div>
          ) : filteredDeliveries.length === 0 ? (
            <div className="p-12 text-center border border-slate-200 rounded-2xl bg-slate-50 space-y-3">
              <Package className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-black text-black uppercase">No Deliveries Found Today</h3>
              <p className="text-xs text-slate-500 font-medium">
                No orders match your selected meal section ({activeSlot}) or search criteria.
              </p>
              <button
                onClick={() => {
                  setActiveSlot("ALL");
                  setTypeFilter("ALL");
                  setStatusFilter("ALL");
                  setSearchQuery("");
                }}
                className="px-4 py-2 bg-black text-[#E5A00D] font-bold text-xs rounded-xl"
              >
                Clear Filters
              </button>
            </div>
          ) : viewMode === "CARDS" ? (
            /* GRID CARDS VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDeliveries.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border-2 border-slate-200 rounded-2xl p-6 space-y-4 hover:border-slate-400 transition-all flex flex-col justify-between"
                >
                  {/* Card Top Header */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      {/* Order ID & Timing */}
                      <div>
                        <div className="text-sm font-black text-black tracking-wide">
                          {item.orderIdDisplay}
                        </div>
                        <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-[#E5A00D]" />
                          <span>Today's {item.mealType} Delivery</span>
                        </div>
                      </div>

                      {/* Order Type Badge (Subscriber vs Daily Order - Strictly NO meal credits shown) */}
                      {item.orderType === "SUBSCRIBER" ? (
                        <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                          Subscriber
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1">
                          <ShoppingBag className="w-3.5 h-3.5 text-emerald-700" />
                          Daily Order
                        </span>
                      )}
                    </div>

                    {/* Customer Info */}
                    <div className="space-y-1">
                      <div className="text-base font-extrabold text-black flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{item.customerName}</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <a href={`tel:${item.customerPhone}`} className="hover:underline hover:text-black">
                          {item.customerPhone}
                        </a>
                      </div>
                    </div>

                    {/* Delivery Address */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                      <div className="font-black text-slate-700 uppercase tracking-wider text-[10px] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                        Delivery Destination:
                      </div>
                      <p className="font-semibold text-slate-800 leading-relaxed">
                        {item.deliveryAddress}
                      </p>
                      {item.landmark && (
                        <p className="text-[11px] text-slate-500 font-medium">
                          Landmark: {item.landmark}
                        </p>
                      )}
                    </div>

                    {/* Meal / Bowl Details */}
                    <div className="p-3 bg-[#fbf4eb] border border-amber-200 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-black text-amber-900 uppercase tracking-wider">
                          Meal / Bowl Item
                        </div>
                        <div className="text-xs font-black text-black mt-0.5">
                          {item.mealName}
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-black text-[#E5A00D] font-extrabold text-xs rounded-lg shrink-0">
                        {item.quantity}x
                      </span>
                    </div>

                    {/* Delivery Notes (if any) */}
                    {item.deliveryNotes ? (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-0.5">
                        <div className="font-black text-[10px] uppercase tracking-wider text-amber-950 flex items-center gap-1">
                          <FileText className="w-3 h-3 text-amber-700" />
                          Delivery Notes:
                        </div>
                        <p className="font-bold text-[11px] leading-snug">{item.deliveryNotes}</p>
                      </div>
                    ) : null}
                  </div>

                  {/* Card Bottom: Status Control Selector */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center justify-between">
                      <span>Update Today's Status:</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] border ${getStatusBadgeClass(item.deliveryStatus)}`}>
                        {getStatusLabel(item.deliveryStatus)}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      {/* Status 1: MAKING */}
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(item, "MAKING")}
                        disabled={updatingId === item.id}
                        className={`py-2 px-1 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1 border ${
                          item.deliveryStatus === "MAKING"
                            ? "bg-amber-500 text-white border-amber-600 ring-2 ring-amber-500/20"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <ChefHat className="w-3.5 h-3.5" />
                        Making Order
                      </button>

                      {/* Status 2: OUT FOR DELIVERY */}
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(item, "OUT_FOR_DELIVERY")}
                        disabled={updatingId === item.id}
                        className={`py-2 px-1 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1 border ${
                          item.deliveryStatus === "OUT_FOR_DELIVERY"
                            ? "bg-blue-600 text-white border-blue-700 ring-2 ring-blue-600/20"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <Truck className="w-3.5 h-3.5" />
                        Out En Route
                      </button>

                      {/* Status 3: DELIVERED */}
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(item, "DELIVERED")}
                        disabled={updatingId === item.id}
                        className={`py-2 px-1 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1 border ${
                          item.deliveryStatus === "DELIVERED"
                            ? "bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-600/20"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Delivered
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* COMPACT TABLE VIEW */
            <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-none">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-black text-[#E5A00D] uppercase font-black tracking-wider text-[11px]">
                      <th className="p-4">Order ID & Type</th>
                      <th className="p-4">Customer Details</th>
                      <th className="p-4">Delivery Address</th>
                      <th className="p-4">Meal Item</th>
                      <th className="p-4">Delivery Notes</th>
                      <th className="p-4 text-center">Status Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-bold">
                    {filteredDeliveries.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 align-top space-y-1">
                          <div className="text-sm font-black text-black">{item.orderIdDisplay}</div>
                          {item.orderType === "SUBSCRIBER" ? (
                            <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-[10px] font-black">
                              SUBSCRIBER
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full text-[10px] font-black">
                              DAILY ORDER
                            </span>
                          )}
                        </td>

                        <td className="p-4 align-top space-y-1">
                          <div className="text-xs font-black text-black">{item.customerName}</div>
                          <div className="text-[11px] text-slate-500 font-bold">{item.customerPhone}</div>
                        </td>

                        <td className="p-4 align-top max-w-xs space-y-0.5">
                          <p className="text-xs text-slate-800 font-semibold leading-snug">
                            {item.deliveryAddress}
                          </p>
                        </td>

                        <td className="p-4 align-top space-y-1">
                          <div className="text-xs font-black text-black">{item.mealName}</div>
                          <div className="text-[11px] text-amber-800 font-bold">Qty: {item.quantity}x</div>
                        </td>

                        <td className="p-4 align-top text-slate-600 max-w-xs text-[11px]">
                          {item.deliveryNotes || "—"}
                        </td>

                        <td className="p-4 align-top text-center">
                          <select
                            value={item.deliveryStatus}
                            onChange={(e) => handleStatusUpdate(item, e.target.value as DeliveryStatus)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border focus:outline-none ${getStatusBadgeClass(
                              item.deliveryStatus
                            )}`}
                          >
                            <option value="MAKING">👨‍🍳 Making Order</option>
                            <option value="OUT_FOR_DELIVERY">🛵 Out for Delivery</option>
                            <option value="DELIVERED">✅ Delivered</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
