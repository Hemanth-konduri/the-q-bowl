"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "../components/AdminSidebar";
import { AdminNavbar } from "../components/AdminNavbar";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  Calendar,
  RefreshCw,
  Sun,
  Sunrise,
  Moon,
  CreditCard,
  ChefHat,
  Zap,
  ArrowUpRight,
  Loader2,
  PieChart,
  Activity,
  Award,
} from "lucide-react";

interface AnalyticsData {
  range: string;
  kpis: {
    totalRevenue: number;
    todayRevenue: number;
    totalOrders: number;
    activeSubscribers: number;
    newCustomersToday: number;
    ordersDeliveredToday: number;
    totalCustomers: number;
  };
  charts: {
    revenueTrend: Array<{
      date: string;
      day: string;
      dailyOrders: number;
      subscriptionOrders: number;
      revenue: number;
    }>;
    mealSlotDistribution: {
      breakfast: number;
      lunch: number;
      dinner: number;
      total: number;
    };
    topSellingMeals: Array<{
      id: string;
      name: string;
      category: string;
      ordersCount: number;
      totalRevenue: number;
      percentage: number;
    }>;
    paymentDistribution: Array<{
      name: string;
      count: number;
      percentage: number;
      color: string;
    }>;
    peakHours: Array<{
      time: string;
      slot: string;
      count: number;
      percentage: number;
    }>;
  };
  insights: {
    highestSellingMeal: string;
    busiestDay: string;
    averageOrderValue: string;
    subscriptionRenewalRate: string;
  };
  activityTimeline: Array<{
    id: string;
    title: string;
    description: string;
    time: string;
    timestamp: string;
    type: string;
  }>;
}

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState("THIS_WEEK");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  async function fetchAnalytics(isSilent = false) {
    if (!isSilent) setLoading(true);
    setRefreshing(true);
    try {
      const res = await fetch(`/api/admin/analytics?range=${dateRange}`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const kpis = analytics?.kpis || {
    totalRevenue: 0,
    todayRevenue: 0,
    totalOrders: 0,
    activeSubscribers: 0,
    newCustomersToday: 0,
    ordersDeliveredToday: 0,
    totalCustomers: 0,
  };

  const maxRevInTrend = Math.max(
    ...(analytics?.charts.revenueTrend.map((d) => d.revenue) || [1000])
  );

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <AdminSidebar />
      <div className="pl-64 flex flex-col min-h-screen bg-white">
        <AdminNavbar />

        <main className="flex-1 p-8 space-y-8 bg-white">
          {/* Header & Filter Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-black text-[#E5A00D] flex items-center justify-center font-extrabold shadow-sm border border-neutral-800">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-black uppercase tracking-tight font-sans">
                  Analytics &amp; Business Intelligence
                </h1>
                <p className="text-xs font-bold text-slate-500">
                  Comprehensive performance metrics, revenue growth, top dishes, and customer insights.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Range Filters */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
                {[
                  { label: "Today", value: "TODAY" },
                  { label: "This Week", value: "THIS_WEEK" },
                  { label: "This Month", value: "THIS_MONTH" },
                  { label: "All Time", value: "ALL" },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setDateRange(item.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                      dateRange === item.value
                        ? "bg-black text-[#E5A00D] shadow-sm"
                        : "text-slate-600 hover:text-black hover:bg-slate-200/50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => fetchAnalytics()}
                disabled={refreshing}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 transition-colors"
                title="Refresh Analytics"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-[#E5A00D]" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-16 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <Loader2 className="w-8 h-8 text-[#E5A00D] animate-spin mx-auto" />
              <p className="text-xs font-black text-black uppercase">Loading Analytics Engine...</p>
            </div>
          ) : (
            <>
              {/* ════════════════════════════════════════════════════════════ */}
              {/* OVERVIEW METRIC CARDS (6 CARDS)                              */}
              {/* ════════════════════════════════════════════════════════════ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {/* 1. Total Revenue */}
                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-2 hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Total Revenue
                    </span>
                    <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                      <DollarSign size={14} />
                    </div>
                  </div>
                  <div className="text-xl font-black text-black">
                    ₹{kpis.totalRevenue.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1 text-emerald-700">
                    <TrendingUp size={12} /> Lifetime collected
                  </div>
                </div>

                {/* 2. Today's Revenue */}
                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-2 hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Today Revenue
                    </span>
                    <div className="p-1.5 bg-amber-100 text-amber-900 rounded-lg">
                      <Sparkles size={14} />
                    </div>
                  </div>
                  <div className="text-xl font-black text-black">
                    ₹{kpis.todayRevenue.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500">Collected today</div>
                </div>

                {/* 3. Total Orders */}
                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-2 hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Total Orders
                    </span>
                    <div className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
                      <ShoppingBag size={14} />
                    </div>
                  </div>
                  <div className="text-xl font-black text-black">{kpis.totalOrders}</div>
                  <div className="text-[10px] font-bold text-slate-500">All order entries</div>
                </div>

                {/* 4. Active Subscribers */}
                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-2 hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Subscribers
                    </span>
                    <div className="p-1.5 bg-amber-100 text-amber-900 rounded-lg">
                      <ChefHat size={14} />
                    </div>
                  </div>
                  <div className="text-xl font-black text-black">{kpis.activeSubscribers}</div>
                  <div className="text-[10px] font-bold text-slate-500">Active meal plans</div>
                </div>

                {/* 5. New Customers */}
                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-2 hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      New Customers
                    </span>
                    <div className="p-1.5 bg-purple-100 text-purple-800 rounded-lg">
                      <Users size={14} />
                    </div>
                  </div>
                  <div className="text-xl font-black text-black">{kpis.totalCustomers}</div>
                  <div className="text-[10px] font-bold text-slate-500">+{kpis.newCustomersToday} today</div>
                </div>

                {/* 6. Orders Delivered Today */}
                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-2 hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Delivered Today
                    </span>
                    <div className="p-1.5 bg-emerald-100 text-emerald-900 rounded-lg">
                      <CheckCircle2 size={14} />
                    </div>
                  </div>
                  <div className="text-xl font-black text-black">{kpis.ordersDeliveredToday}</div>
                  <div className="text-[10px] font-bold text-slate-500">Fulfilled orders</div>
                </div>
              </div>

              {/* ════════════════════════════════════════════════════════════ */}
              {/* QUICK BUSINESS INSIGHTS CALLOUT CARDS                       */}
              {/* ════════════════════════════════════════════════════════════ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-black text-[#E5A00D] p-5 rounded-2xl space-y-1 border border-neutral-800">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Highest Selling Bowl
                  </div>
                  <div className="text-base font-black text-white">
                    {analytics?.insights.highestSellingMeal}
                  </div>
                  <div className="text-[11px] text-[#E5A00D] font-bold">Top customer favorite</div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Busiest Day
                  </div>
                  <div className="text-base font-black text-black">
                    {analytics?.insights.busiestDay}
                  </div>
                  <div className="text-[11px] text-slate-500 font-bold">Peak weekly volume</div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Average Order Value (AOV)
                  </div>
                  <div className="text-base font-black text-black">
                    {analytics?.insights.averageOrderValue}
                  </div>
                  <div className="text-[11px] text-slate-500 font-bold">Per transaction avg</div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Subscription Renewal Rate
                  </div>
                  <div className="text-base font-black text-emerald-700">
                    {analytics?.insights.subscriptionRenewalRate}
                  </div>
                  <div className="text-[11px] text-slate-500 font-bold">High subscriber retention</div>
                </div>
              </div>

              {/* ════════════════════════════════════════════════════════════ */}
              {/* CHARTS ROW 1: REVENUE TREND & MEAL SLOT DISTRIBUTION        */}
              {/* ════════════════════════════════════════════════════════════ */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Revenue & Order Volume Growth Trend */}
                <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-black text-black uppercase tracking-tight">
                        Revenue &amp; Order Trend
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Daily performance comparing daily orders and subscription renewals.
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-black uppercase">
                      Past 7 Days
                    </span>
                  </div>

                  {/* Visual Bar Chart */}
                  <div className="space-y-4 pt-2">
                    {analytics?.charts.revenueTrend.map((item) => {
                      const widthPercent = Math.min(Math.round((item.revenue / maxRevInTrend) * 100), 100);
                      return (
                        <div key={item.date} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-black font-extrabold w-12">{item.day}</span>
                            <span className="text-slate-500 text-[11px] font-mono">
                              🛍️ {item.dailyOrders} daily • ⭐ {item.subscriptionOrders} subs
                            </span>
                            <span className="text-black font-mono font-extrabold">₹{item.revenue.toLocaleString()}</span>
                          </div>
                          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                            <div
                              style={{ width: `${widthPercent}%` }}
                              className="h-full bg-black rounded-full transition-all duration-500"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Meal Slot Distribution (Breakfast, Lunch, Dinner) */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-6 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-black uppercase tracking-tight">
                      Meal Slot Distribution
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Meals ordered by preparation timing.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Breakfast */}
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                          <Sunrise className="w-4 h-4 text-amber-600" /> Breakfast Slot
                        </span>
                        <span className="font-black text-black font-mono text-sm">
                          {analytics?.charts.mealSlotDistribution.breakfast} meals
                        </span>
                      </div>
                      <div className="h-2 w-full bg-amber-200 rounded-full overflow-hidden">
                        <div
                          style={{
                            width: `${Math.round(
                              (analytics?.charts.mealSlotDistribution.breakfast! /
                                analytics?.charts.mealSlotDistribution.total!) *
                                100
                            )}%`,
                          }}
                          className="h-full bg-amber-500 rounded-full"
                        />
                      </div>
                    </div>

                    {/* Lunch */}
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-orange-950 flex items-center gap-1.5">
                          <Sun className="w-4 h-4 text-orange-600" /> Lunch Rush Hour
                        </span>
                        <span className="font-black text-black font-mono text-sm">
                          {analytics?.charts.mealSlotDistribution.lunch} meals
                        </span>
                      </div>
                      <div className="h-2 w-full bg-orange-200 rounded-full overflow-hidden">
                        <div
                          style={{
                            width: `${Math.round(
                              (analytics?.charts.mealSlotDistribution.lunch! /
                                analytics?.charts.mealSlotDistribution.total!) *
                                100
                            )}%`,
                          }}
                          className="h-full bg-orange-500 rounded-full"
                        />
                      </div>
                    </div>

                    {/* Dinner */}
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-purple-950 flex items-center gap-1.5">
                          <Moon className="w-4 h-4 text-purple-600" /> Dinner Slot
                        </span>
                        <span className="font-black text-black font-mono text-sm">
                          {analytics?.charts.mealSlotDistribution.dinner} meals
                        </span>
                      </div>
                      <div className="h-2 w-full bg-purple-200 rounded-full overflow-hidden">
                        <div
                          style={{
                            width: `${Math.round(
                              (analytics?.charts.mealSlotDistribution.dinner! /
                                analytics?.charts.mealSlotDistribution.total!) *
                                100
                            )}%`,
                          }}
                          className="h-full bg-purple-600 rounded-full"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 font-bold text-center pt-2 border-t border-slate-100">
                    Total Prep Volume Today: {analytics?.charts.mealSlotDistribution.total} meals
                  </div>
                </div>
              </div>

              {/* ════════════════════════════════════════════════════════════ */}
              {/* CHARTS ROW 2: TOP SELLING BOWLS & PAYMENT METHOD BREAKDOWN  */}
              {/* ════════════════════════════════════════════════════════════ */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Top Selling Bowls */}
                <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-black text-black uppercase tracking-tight">
                        Top-Selling Bowls &amp; Meals
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Highest performing culinary offerings by volume and revenue.
                      </p>
                    </div>
                    <Award className="w-5 h-5 text-[#E5A00D]" />
                  </div>

                  <div className="space-y-3">
                    {analytics?.charts.topSellingMeals.map((meal, index) => (
                      <div
                        key={meal.id}
                        className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg bg-black text-[#E5A00D] font-black text-xs flex items-center justify-center">
                            #{index + 1}
                          </span>
                          <div>
                            <div className="font-extrabold text-sm text-black">{meal.name}</div>
                            <div className="text-[10px] text-slate-500 font-bold uppercase">{meal.category}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 font-mono text-xs text-right">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-sans">Orders</span>
                            <span className="font-black text-black">{meal.ordersCount}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-sans">Revenue</span>
                            <span className="font-black text-emerald-700">₹{meal.totalRevenue.toLocaleString()}</span>
                          </div>
                          <div className="w-16">
                            <span className="text-[10px] text-slate-400 block font-sans">Share</span>
                            <span className="font-bold text-black">{meal.percentage}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Payment Method Distribution & Peak Hours */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-6">
                  <div>
                    <h3 className="text-base font-black text-black uppercase tracking-tight">
                      Payment Method Breakdown
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Distribution across digital and cash channels.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {analytics?.charts.paymentDistribution.map((item) => (
                      <div key={item.name} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-black">{item.name}</span>
                          <span className="font-mono text-slate-700">
                            {item.count} txns ({item.percentage}%)
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                            className="h-full rounded-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <h4 className="text-xs font-black uppercase text-black">Peak Ordering Windows</h4>
                    {analytics?.charts.peakHours.map((slot) => (
                      <div key={slot.slot} className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-600">{slot.time}</span>
                        <span className="font-mono text-black font-extrabold">{slot.slot}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ════════════════════════════════════════════════════════════ */}
              {/* RECENT BUSINESS ACTIVITY TIMELINE                            */}
              {/* ════════════════════════════════════════════════════════════ */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-black uppercase tracking-tight">
                      Live Activity Timeline
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Real-time log of recent order placements and customer actions.
                    </p>
                  </div>
                  <Activity className="w-5 h-5 text-emerald-600" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                  {analytics?.activityTimeline.map((act) => (
                    <div
                      key={act.id}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            act.type === "SUBSCRIPTION"
                              ? "bg-amber-100 text-amber-900 border border-amber-300"
                              : "bg-slate-200 text-slate-800"
                          }`}
                        >
                          {act.type}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{act.time}</span>
                      </div>
                      <div className="font-black text-xs text-black">{act.title}</div>
                      <div className="text-[11px] text-slate-600 font-medium">{act.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
