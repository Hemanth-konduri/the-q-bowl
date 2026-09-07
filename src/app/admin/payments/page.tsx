"use client";

import { useState, useEffect, useMemo } from "react";
import { AdminSidebar } from "../components/AdminSidebar";
import { AdminNavbar } from "../components/AdminNavbar";
import {
  Wallet,
  DollarSign,
  TrendingUp,
  CreditCard,
  RefreshCw,
  Search,
  Filter,
  Download,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RotateCcw,
  Eye,
  FileText,
  Clock,
  User,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  X,
  Loader2,
  Check,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface PaymentRecord {
  id: string;
  userId: string;
  orderId: string | null;
  subscriptionId: string | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  razorpaySignature: string | null;
  amount: number;
  currency: string;
  method: string;
  purpose: string;
  receipt: string | null;
  transactionId: string | null;
  status: "SUCCESS" | "PENDING" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED";
  refundAmount: number | null;
  refundReason: string | null;
  refundRefId: string | null;
  refundedAt: string | null;
  notes: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  txnDisplay: string;
  customerName: string;
  userEmail: string | null;
  userPhone: string | null;
  referenceId: string;
  purposeNormalized: "ORDER" | "SUBSCRIPTION" | "WALLET";
}

interface SummaryData {
  totalRevenue: number;
  todayRevenue: number;
  subscriptionRevenue: number;
  dailyOrderRevenue: number;
  pendingFailedCount: number;
  totalTransactions: number;
}

export default function AdminPaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<SummaryData>({
    totalRevenue: 0,
    todayRevenue: 0,
    subscriptionRevenue: 0,
    dailyOrderRevenue: 0,
    pendingFailedCount: 0,
    totalTransactions: 0,
  });
  const [transactions, setTransactions] = useState<PaymentRecord[]>([]);

  // Navigation Tabs: ALL | ORDER | SUBSCRIPTION
  const [activeTab, setActiveTab] = useState<"ALL" | "ORDER" | "SUBSCRIPTION">("ALL");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [dateRangeFilter, setDateRangeFilter] = useState("ALL");

  // Modal States
  const [inspectTxn, setInspectTxn] = useState<PaymentRecord | null>(null);
  const [markPaidTxn, setMarkPaidTxn] = useState<PaymentRecord | null>(null);
  const [markPaidNotes, setMarkPaidNotes] = useState("");
  const [refundTxn, setRefundTxn] = useState<PaymentRecord | null>(null);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState("");
  const [refundRefId, setRefundRefId] = useState("");
  const [showOfflineModal, setShowOfflineModal] = useState(false);

  // Offline payment form
  const [offlineUserId, setOfflineUserId] = useState("");
  const [offlineOrderId, setOfflineOrderId] = useState("");
  const [offlineSubscriptionId, setOfflineSubscriptionId] = useState("");
  const [offlineAmount, setOfflineAmount] = useState("");
  const [offlineMethod, setOfflineMethod] = useState("CASH_ON_DELIVERY");
  const [offlineNotes, setOfflineNotes] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  // Fetch Payments Data
  async function fetchPaymentsData(isSilent = false) {
    if (!isSilent) setLoading(true);
    setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (activeTab !== "ALL") params.set("purpose", activeTab);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (methodFilter !== "ALL") params.set("method", methodFilter);
      if (dateRangeFilter !== "ALL") params.set("dateRange", dateRangeFilter);

      const res = await fetch(`/api/admin/payments?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary || {});
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error("Failed to fetch payments data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchPaymentsData();
  }, [activeTab, statusFilter, methodFilter, dateRangeFilter]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPaymentsData(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filtered transactions in-memory client side for instant feel
  const displayedTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (activeTab === "ORDER" && t.purposeNormalized !== "ORDER") return false;
      if (activeTab === "SUBSCRIPTION" && t.purposeNormalized !== "SUBSCRIPTION") return false;
      return true;
    });
  }, [transactions, activeTab]);

  // Handle Mark as Paid Action
  async function handleConfirmMarkPaid() {
    if (!markPaidTxn) return;
    setSubmittingAction(true);
    try {
      const res = await fetch(`/api/admin/payments/${markPaidTxn.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "MARK_PAID",
          notes: markPaidNotes || "Marked as paid by admin.",
        }),
      });
      if (res.ok) {
        setMarkPaidTxn(null);
        setMarkPaidNotes("");
        fetchPaymentsData(true);
      }
    } catch (err) {
      console.error("Error marking payment paid:", err);
    } finally {
      setSubmittingAction(false);
    }
  }

  // Handle Refund Action
  async function handleConfirmRefund() {
    if (!refundTxn) return;
    setSubmittingAction(true);
    try {
      const res = await fetch(`/api/admin/payments/${refundTxn.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REFUND",
          refundAmount: refundAmount || refundTxn.amount,
          refundReason: refundReason || "Admin processed refund",
          refundRefId: refundRefId || undefined,
        }),
      });
      if (res.ok) {
        setRefundTxn(null);
        setRefundAmount(0);
        setRefundReason("");
        setRefundRefId("");
        fetchPaymentsData(true);
      }
    } catch (err) {
      console.error("Error processing refund:", err);
    } finally {
      setSubmittingAction(false);
    }
  }

  // Handle Submit Offline Payment
  async function handleCreateOfflinePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!offlineUserId || !offlineAmount || Number(offlineAmount) <= 0) return;
    setSubmittingAction(true);
    try {
      const res = await fetch("/api/admin/payments/offline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: offlineUserId,
          orderId: offlineOrderId || undefined,
          subscriptionId: offlineSubscriptionId || undefined,
          amount: Number(offlineAmount),
          method: offlineMethod,
          notes: offlineNotes,
        }),
      });
      if (res.ok) {
        setShowOfflineModal(false);
        setOfflineUserId("");
        setOfflineOrderId("");
        setOfflineSubscriptionId("");
        setOfflineAmount("");
        setOfflineNotes("");
        fetchPaymentsData(true);
      }
    } catch (err) {
      console.error("Error creating offline payment:", err);
    } finally {
      setSubmittingAction(false);
    }
  }

  // CSV Export Utility
  function handleExportCSV() {
    if (!displayedTransactions.length) return;
    const headers = [
      "Transaction ID",
      "Customer Name",
      "Email",
      "Phone",
      "Payment Type",
      "Reference ID",
      "Amount (INR)",
      "Payment Method",
      "Payment Status",
      "Razorpay Payment ID",
      "Razorpay Order ID",
      "Date",
    ];

    const rows = displayedTransactions.map((t) => [
      `"${t.txnDisplay}"`,
      `"${t.customerName.replace(/"/g, '""')}"`,
      `"${t.userEmail || ""}"`,
      `"${t.userPhone || ""}"`,
      `"${t.purposeNormalized}"`,
      `"${t.referenceId}"`,
      t.amount,
      `"${t.method}"`,
      `"${t.status}"`,
      `"${t.razorpayPaymentId || ""}"`,
      `"${t.razorpayOrderId || ""}"`,
      `"${new Date(t.createdAt).toLocaleString()}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Q1_Bowl_Payments_Ledger_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <AdminSidebar />
      <div className="pl-64 flex flex-col min-h-screen bg-white">
        <AdminNavbar />

        <main className="flex-1 p-8 space-y-8 bg-white">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-[#E5A00D] text-black flex items-center justify-center font-extrabold shadow-sm border border-amber-400">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-black uppercase tracking-tight font-sans">
                  Payments &amp; Financial Ledger
                </h1>
                <p className="text-xs font-bold text-slate-500">
                  Track revenue, monitor Razorpay transactions, record offline payments, and process refunds.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchPaymentsData()}
                disabled={refreshing}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 transition-colors"
                title="Refresh Ledger"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-[#E5A00D]" : ""}`} />
                <span>Refresh</span>
              </button>

              <button
                onClick={() => setShowOfflineModal(true)}
                className="px-4 py-2.5 bg-black hover:bg-neutral-800 text-[#E5A00D] font-extrabold text-xs rounded-xl flex items-center gap-2 transition-all shadow-none"
              >
                <PlusCircle className="w-4 h-4" /> Record Offline Payment
              </button>

              <button
                onClick={handleExportCSV}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 transition-all shadow-none"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* TOP SUMMARY STATS CARDS (6 CARDS)                            */}
          {/* ════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Card 1: Total Revenue */}
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
                ₹{summary.totalRevenue.toLocaleString("en-IN")}
              </div>
              <div className="text-[10px] font-bold text-slate-500">All successful payments</div>
            </div>

            {/* Card 2: Today's Revenue */}
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-2 hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Today&apos;s Revenue
                </span>
                <div className="p-1.5 bg-amber-100 text-amber-900 rounded-lg">
                  <TrendingUp size={14} />
                </div>
              </div>
              <div className="text-xl font-black text-black">
                ₹{summary.todayRevenue.toLocaleString("en-IN")}
              </div>
              <div className="text-[10px] font-bold text-slate-500">Collected today</div>
            </div>

            {/* Card 3: Subscription Revenue */}
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-2 hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Subscription Rev
                </span>
                <div className="p-1.5 bg-amber-100 text-amber-900 rounded-lg">
                  <Sparkles size={14} />
                </div>
              </div>
              <div className="text-xl font-black text-black">
                ₹{summary.subscriptionRevenue.toLocaleString("en-IN")}
              </div>
              <div className="text-[10px] font-bold text-slate-500">Subscribers total</div>
            </div>

            {/* Card 4: Daily Orders Revenue */}
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-2 hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Daily Orders Rev
                </span>
                <div className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
                  <CreditCard size={14} />
                </div>
              </div>
              <div className="text-xl font-black text-black">
                ₹{summary.dailyOrderRevenue.toLocaleString("en-IN")}
              </div>
              <div className="text-[10px] font-bold text-slate-500">One-time meals</div>
            </div>

            {/* Card 5: Pending/Failed Payments */}
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-2 hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Pending / Failed
                </span>
                <div className="p-1.5 bg-rose-100 text-rose-800 rounded-lg">
                  <AlertCircle size={14} />
                </div>
              </div>
              <div className="text-xl font-black text-black">
                {summary.pendingFailedCount}
              </div>
              <div className="text-[10px] font-bold text-slate-500">Requires attention</div>
            </div>

            {/* Card 6: Total Transactions */}
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-2 hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Transactions
                </span>
                <div className="p-1.5 bg-purple-100 text-purple-800 rounded-lg">
                  <FileText size={14} />
                </div>
              </div>
              <div className="text-xl font-black text-black">
                {summary.totalTransactions}
              </div>
              <div className="text-[10px] font-bold text-slate-500">Total recorded</div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* CATEGORY TABS & FILTER TOOLBAR                               */}
          {/* ════════════════════════════════════════════════════════════ */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-2">
              {/* Category Segmented Tabs */}
              <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 w-full md:w-auto">
                <button
                  onClick={() => setActiveTab("ALL")}
                  className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                    activeTab === "ALL"
                      ? "bg-black text-[#E5A00D] shadow-sm"
                      : "text-slate-600 hover:text-black hover:bg-slate-200/60"
                  }`}
                >
                  All Payments
                </button>
                <button
                  onClick={() => setActiveTab("ORDER")}
                  className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                    activeTab === "ORDER"
                      ? "bg-black text-[#E5A00D] shadow-sm"
                      : "text-slate-600 hover:text-black hover:bg-slate-200/60"
                  }`}
                >
                  🛍️ Daily Orders
                </button>
                <button
                  onClick={() => setActiveTab("SUBSCRIPTION")}
                  className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                    activeTab === "SUBSCRIPTION"
                      ? "bg-black text-[#E5A00D] shadow-sm"
                      : "text-slate-600 hover:text-black hover:bg-slate-200/60"
                  }`}
                >
                  ⭐ Subscriptions
                </button>
              </div>

              {/* Status Badge Legend */}
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 overflow-x-auto pb-1">
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full font-black text-[10px] uppercase">
                  ● SUCCESS / PAID
                </span>
                <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full font-black text-[10px] uppercase">
                  ● PENDING
                </span>
                <span className="px-2.5 py-1 bg-rose-100 text-rose-900 border border-rose-300 rounded-full font-black text-[10px] uppercase">
                  ● FAILED
                </span>
                <span className="px-2.5 py-1 bg-purple-100 text-purple-900 border border-purple-300 rounded-full font-black text-[10px] uppercase">
                  ● REFUNDED
                </span>
              </div>
            </div>

            {/* Filter Toolbar Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              {/* 1. Instant Search Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search customer, ID, or ref..."
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-black focus:outline-none focus:border-black placeholder:text-slate-400"
                />
              </div>

              {/* 2. Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-black focus:outline-none focus:border-black"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SUCCESS">Success / Paid</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                  <option value="REFUNDED">Refunded</option>
                  <option value="PARTIALLY_REFUNDED">Partially Refunded</option>
                </select>
              </div>

              {/* 3. Payment Method Filter */}
              <div>
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-black focus:outline-none focus:border-black"
                >
                  <option value="ALL">All Payment Methods</option>
                  <option value="UPI">UPI</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="DEBIT_CARD">Debit Card</option>
                  <option value="NET_BANKING">Net Banking</option>
                  <option value="CASH_ON_DELIVERY">Cash on Delivery / Offline</option>
                  <option value="WALLET">Wallet</option>
                </select>
              </div>

              {/* 4. Date Range Filter */}
              <div>
                <select
                  value={dateRangeFilter}
                  onChange={(e) => setDateRangeFilter(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-black focus:outline-none focus:border-black"
                >
                  <option value="ALL">All Time</option>
                  <option value="TODAY">Today Only</option>
                  <option value="THIS_WEEK">Past 7 Days</option>
                  <option value="THIS_MONTH">Past 30 Days</option>
                </select>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* TRANSACTIONS LEDGER TABLE                                    */}
          {/* ════════════════════════════════════════════════════════════ */}
          {loading ? (
            <div className="p-16 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <Loader2 className="w-8 h-8 text-[#E5A00D] animate-spin mx-auto" />
              <p className="text-xs font-black text-black uppercase">Loading Transactions Ledger...</p>
            </div>
          ) : displayedTransactions.length === 0 ? (
            <div className="p-16 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <Wallet className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-black text-black uppercase">No Payments Found</h3>
              <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                No transaction records matched your search query or selected category and status filters.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-none">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      <th className="p-4">Transaction ID</th>
                      <th className="p-4">Customer Details</th>
                      <th className="p-4">Category &amp; Ref</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Payment Method</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Date &amp; Time</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    {displayedTransactions.map((txn) => {
                      const isSuccess = txn.status === "SUCCESS";
                      const isPending = txn.status === "PENDING";
                      const isFailed = txn.status === "FAILED";
                      const isRefunded = txn.status === "REFUNDED" || txn.status === "PARTIALLY_REFUNDED";

                      return (
                        <tr key={txn.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Transaction ID */}
                          <td className="p-4 align-top">
                            <div className="font-mono font-extrabold text-black text-xs">
                              {txn.txnDisplay}
                            </div>
                            {txn.razorpayPaymentId && (
                              <div className="text-[10px] text-slate-400 font-mono">
                                RZP: {txn.razorpayPaymentId}
                              </div>
                            )}
                          </td>

                          {/* Customer Details */}
                          <td className="p-4 align-top space-y-0.5">
                            <div className="font-black text-black">{txn.customerName}</div>
                            <div className="text-[10px] text-slate-500 flex flex-wrap items-center gap-1 font-mono">
                              {txn.userPhone && <span>{txn.userPhone}</span>}
                              {txn.userEmail && <span>• {txn.userEmail}</span>}
                            </div>
                          </td>

                          {/* Category & Reference */}
                          <td className="p-4 align-top space-y-1">
                            {txn.purposeNormalized === "SUBSCRIPTION" ? (
                              <span className="inline-block px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-[10px] font-black">
                                ⭐ Subscription
                              </span>
                            ) : (
                              <span className="inline-block px-2.5 py-0.5 bg-slate-100 text-slate-800 border border-slate-300 rounded-full text-[10px] font-bold">
                                🛍️ Daily Order
                              </span>
                            )}
                            <div className="text-[10px] text-slate-500 font-mono font-bold">
                              {txn.referenceId}
                            </div>
                          </td>

                          {/* Amount */}
                          <td className="p-4 align-top font-black text-black text-sm font-mono">
                            ₹{txn.amount.toLocaleString("en-IN")}
                            {txn.refundAmount && txn.refundAmount > 0 ? (
                              <div className="text-[10px] text-purple-700 font-bold">
                                (-₹{txn.refundAmount} refunded)
                              </div>
                            ) : null}
                          </td>

                          {/* Payment Method */}
                          <td className="p-4 align-top">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-xl font-extrabold text-[11px] text-slate-800">
                              <CreditCard size={12} className="text-black" />
                              {txn.method.replace(/_/g, " ")}
                            </span>
                          </td>

                          {/* Payment Status */}
                          <td className="p-4 align-top">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                isSuccess
                                  ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                                  : isPending
                                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                                  : isFailed
                                  ? "bg-rose-100 text-rose-900 border border-rose-300"
                                  : "bg-purple-100 text-purple-900 border border-purple-300"
                              }`}
                            >
                              {txn.status}
                            </span>
                          </td>

                          {/* Date & Time */}
                          <td className="p-4 align-top text-slate-600 text-xs font-mono">
                            <div>{new Date(txn.createdAt).toLocaleDateString()}</div>
                            <div className="text-[10px] text-slate-400">
                              {new Date(txn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="p-4 align-top text-center space-x-1">
                            <button
                              onClick={() => setInspectTxn(txn)}
                              className="p-1.5 bg-black text-[#E5A00D] hover:bg-neutral-800 rounded-lg transition-colors"
                              title="Inspect Full Details"
                            >
                              <Eye size={14} />
                            </button>

                            {isPending && (
                              <button
                                onClick={() => setMarkPaidTxn(txn)}
                                className="p-1.5 bg-emerald-100 text-emerald-900 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors"
                                title="Mark Offline Cash / Payment as Paid"
                              >
                                <CheckCircle2 size={14} />
                              </button>
                            )}

                            {isSuccess && (
                              <button
                                onClick={() => {
                                  setRefundTxn(txn);
                                  setRefundAmount(txn.amount);
                                }}
                                className="p-1.5 bg-purple-100 text-purple-900 hover:bg-purple-200 border border-purple-300 rounded-lg transition-colors"
                                title="Process / Record Refund"
                              >
                                <RotateCcw size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: TRANSACTION INSPECTOR MODAL                        */}
      {/* ════════════════════════════════════════════════════════════ */}
      {inspectTxn && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border-2 border-black w-full max-w-xl rounded-2xl p-6 space-y-5 relative text-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-black text-black uppercase tracking-tight">
                  Transaction Details
                </h3>
                <p className="text-xs text-slate-500 font-mono">{inspectTxn.txnDisplay}</p>
              </div>
              <button
                onClick={() => setInspectTxn(null)}
                className="p-1 text-slate-400 hover:text-black transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Details Grid */}
            <div className="space-y-4 text-xs">
              {/* Customer Profile */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <div className="text-[10px] font-black uppercase text-slate-400">Customer</div>
                <div className="font-extrabold text-sm text-black">{inspectTxn.customerName}</div>
                <div className="text-slate-600 font-mono">
                  {inspectTxn.userPhone || "No Phone"} • {inspectTxn.userEmail || "No Email"}
                </div>
              </div>

              {/* Transaction Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-black uppercase text-slate-400">Amount</div>
                  <div className="font-black text-black text-base font-mono">
                    ₹{inspectTxn.amount}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-black uppercase text-slate-400">Status</div>
                  <span className="inline-block mt-1 font-black text-xs uppercase text-emerald-800">
                    {inspectTxn.status}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-black uppercase text-slate-400">Method</div>
                  <div className="font-extrabold text-slate-800 mt-1">
                    {inspectTxn.method.replace(/_/g, " ")}
                  </div>
                </div>
              </div>

              {/* Metadata Breakdown */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-500">Category Purpose:</span>
                  <span className="font-bold text-black">{inspectTxn.purposeNormalized}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-500">Order / Sub Reference:</span>
                  <span className="font-bold text-black">{inspectTxn.referenceId}</span>
                </div>
                {inspectTxn.razorpayPaymentId && (
                  <div className="flex justify-between border-b border-slate-200 pb-1">
                    <span className="text-slate-500">Razorpay Payment ID:</span>
                    <span className="font-bold text-black">{inspectTxn.razorpayPaymentId}</span>
                  </div>
                )}
                {inspectTxn.razorpayOrderId && (
                  <div className="flex justify-between border-b border-slate-200 pb-1">
                    <span className="text-slate-500">Razorpay Order ID:</span>
                    <span className="font-bold text-black">{inspectTxn.razorpayOrderId}</span>
                  </div>
                )}
                {inspectTxn.receipt && (
                  <div className="flex justify-between border-b border-slate-200 pb-1">
                    <span className="text-slate-500">Receipt Ref:</span>
                    <span className="font-bold text-black">{inspectTxn.receipt}</span>
                  </div>
                )}
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-500">Created At:</span>
                  <span className="font-bold text-black">{new Date(inspectTxn.createdAt).toLocaleString()}</span>
                </div>
                {inspectTxn.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Paid At:</span>
                    <span className="font-bold text-emerald-800">{new Date(inspectTxn.paidAt).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Refund Info if applicable */}
              {inspectTxn.refundAmount ? (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl space-y-1 text-purple-950 font-mono text-[11px]">
                  <div className="font-black uppercase text-xs text-purple-900">Refund Summary</div>
                  <div>Refund Amount: ₹{inspectTxn.refundAmount}</div>
                  <div>Reason: {inspectTxn.refundReason || "N/A"}</div>
                  <div>Ref ID: {inspectTxn.refundRefId || "N/A"}</div>
                  {inspectTxn.refundedAt && <div>Refunded At: {new Date(inspectTxn.refundedAt).toLocaleString()}</div>}
                </div>
              ) : null}

              {/* Notes */}
              {inspectTxn.notes && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 text-xs">
                  <span className="font-extrabold block">Admin / Payment Notes:</span>
                  <p>{inspectTxn.notes}</p>
                </div>
              )}
            </div>

            <div className="text-right pt-2 border-t border-slate-200">
              <button
                onClick={() => setInspectTxn(null)}
                className="px-5 py-2.5 bg-black text-[#E5A00D] font-extrabold text-xs rounded-xl"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: MARK PENDING PAYMENT AS PAID                       */}
      {/* ════════════════════════════════════════════════════════════ */}
      {markPaidTxn && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border-2 border-black w-full max-w-md rounded-2xl p-6 space-y-4 relative text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-black uppercase tracking-tight">
                Confirm Payment Collection
              </h3>
              <button onClick={() => setMarkPaidTxn(null)} className="p-1 text-slate-400 hover:text-black">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 font-medium">
                Are you sure you want to mark this pending payment of{" "}
                <strong className="text-black font-bold">₹{markPaidTxn.amount}</strong> for{" "}
                <strong className="text-black font-bold">{markPaidTxn.customerName}</strong> as{" "}
                <span className="text-emerald-800 font-extrabold">PAID (SUCCESS)</span>?
              </p>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Collection Notes (Optional):</label>
                <input
                  type="text"
                  value={markPaidNotes}
                  onChange={(e) => setMarkPaidNotes(e.target.value)}
                  placeholder="e.g. Collected cash on delivery / offline bank transfer."
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-black"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setMarkPaidTxn(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmMarkPaid}
                disabled={submittingAction}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1"
              >
                {submittingAction && <Loader2 size={14} className="animate-spin" />}
                Confirm Paid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* MODAL 3: PROCESS / RECORD REFUND                            */}
      {/* ════════════════════════════════════════════════════════════ */}
      {refundTxn && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border-2 border-black w-full max-w-md rounded-2xl p-6 space-y-4 relative text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-purple-950 uppercase tracking-tight">
                Record Refund
              </h3>
              <button onClick={() => setRefundTxn(null)} className="p-1 text-slate-400 hover:text-black">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-950">
                <span className="font-extrabold block">Original Transaction:</span>
                <div>Amount: ₹{refundTxn.amount} • Customer: {refundTxn.customerName}</div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Refund Amount (₹):</label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  max={refundTxn.amount}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-black font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Reason for Refund:</label>
                <textarea
                  rows={2}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g. Order cancellation or customer dissatisfaction."
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-black"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Refund Reference ID (Optional):</label>
                <input
                  type="text"
                  value={refundRefId}
                  onChange={(e) => setRefundRefId(e.target.value)}
                  placeholder="e.g. RZP_REF_98127391"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-black font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setRefundTxn(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRefund}
                disabled={submittingAction}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs rounded-xl flex items-center gap-1"
              >
                {submittingAction && <Loader2 size={14} className="animate-spin" />}
                Confirm Refund
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* MODAL 4: RECORD OFFLINE PAYMENT                             */}
      {/* ════════════════════════════════════════════════════════════ */}
      {showOfflineModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border-2 border-black w-full max-w-lg rounded-2xl p-6 space-y-4 relative text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-black uppercase tracking-tight">
                Record Offline Payment
              </h3>
              <button onClick={() => setShowOfflineModal(false)} className="p-1 text-slate-400 hover:text-black">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateOfflinePayment} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Customer User ID *:</label>
                <input
                  type="text"
                  required
                  value={offlineUserId}
                  onChange={(e) => setOfflineUserId(e.target.value)}
                  placeholder="e.g. usr-123456 or UUID"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-black font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Order ID (Optional):</label>
                  <input
                    type="text"
                    value={offlineOrderId}
                    onChange={(e) => setOfflineOrderId(e.target.value)}
                    placeholder="e.g. ord-123"
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-black font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sub ID (Optional):</label>
                  <input
                    type="text"
                    value={offlineSubscriptionId}
                    onChange={(e) => setOfflineSubscriptionId(e.target.value)}
                    placeholder="e.g. sub-456"
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-black font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Amount (₹) *:</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={offlineAmount}
                    onChange={(e) => setOfflineAmount(e.target.value)}
                    placeholder="e.g. 1500"
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-black font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Method *:</label>
                  <select
                    value={offlineMethod}
                    onChange={(e) => setOfflineMethod(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-black"
                  >
                    <option value="CASH_ON_DELIVERY">Cash (COD / Offline Cash)</option>
                    <option value="UPI">Offline UPI Transfer</option>
                    <option value="NET_BANKING">Direct Bank Transfer</option>
                    <option value="WALLET">Wallet Balance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Notes:</label>
                <input
                  type="text"
                  value={offlineNotes}
                  onChange={(e) => setOfflineNotes(e.target.value)}
                  placeholder="e.g. Received cash at counter for monthly plan"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-black"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowOfflineModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-4 py-2 bg-black text-[#E5A00D] font-extrabold text-xs rounded-xl flex items-center gap-1 hover:bg-neutral-800"
                >
                  {submittingAction && <Loader2 size={14} className="animate-spin" />}
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
