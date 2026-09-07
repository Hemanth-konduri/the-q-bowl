"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "../components/AdminSidebar";
import { AdminNavbar } from "../components/AdminNavbar";
import {
  Tag,
  Gift,
  PlusCircle,
  TrendingDown,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Edit2,
  Trash2,
  Eye,
  Loader2,
  Calendar,
  X,
  Percent,
  DollarSign,
  Zap,
  ShoppingBag,
  Award,
  Layers,
} from "lucide-react";

interface Coupon {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderAmount: number | null;
  maxDiscount: number | null;
  startDate: string | null;
  endDate: string | null;
  usageLimit: number | null;
  usageCount: number;
  perUserLimit: number;
  campaignType: string;
  isActive: boolean;
  createdAt: string;
}

interface SummaryData {
  activeCouponsCount: number;
  expiredCouponsCount: number;
  totalRedemptions: number;
  totalDiscountGiven: number;
}

export default function AdminCouponsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<SummaryData>({
    activeCouponsCount: 0,
    expiredCouponsCount: 0,
    totalRedemptions: 0,
    totalDiscountGiven: 0,
  });
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [campaigns, setCampaigns] = useState<Coupon[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Input States
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formType, setFormType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [formValue, setFormValue] = useState("");
  const [formMinOrder, setFormMinOrder] = useState("");
  const [formMaxDiscount, setFormMaxDiscount] = useState("");
  const [formValidFrom, setFormValidFrom] = useState("");
  const [formValidUntil, setFormValidUntil] = useState("");
  const [formUsageLimit, setFormUsageLimit] = useState("");
  const [formPerUserLimit, setFormPerUserLimit] = useState("1");
  const [formCampaignType, setFormCampaignType] = useState("COUPON");

  async function fetchCouponsData(isSilent = false) {
    if (!isSilent) setLoading(true);
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/coupons");
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary || {});
        setCoupons(data.coupons || []);
        setCampaigns(data.campaigns || []);
      }
    } catch (err) {
      console.error("Failed to fetch coupons data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchCouponsData();
  }, []);

  // Open Create Modal
  function handleOpenCreate() {
    setEditCoupon(null);
    setFormCode("");
    setFormName("");
    setFormDesc("");
    setFormType("PERCENTAGE");
    setFormValue("");
    setFormMinOrder("");
    setFormMaxDiscount("");
    setFormValidFrom("");
    setFormValidUntil("");
    setFormUsageLimit("");
    setFormPerUserLimit("1");
    setFormCampaignType("COUPON");
    setShowCreateModal(true);
  }

  // Open Edit Modal
  function handleOpenEdit(coupon: Coupon) {
    setEditCoupon(coupon);
    setFormCode(coupon.code || "");
    setFormName(coupon.name);
    setFormDesc(coupon.description || "");
    setFormType(coupon.discountType);
    setFormValue(String(coupon.discountValue));
    setFormMinOrder(coupon.minOrderAmount ? String(coupon.minOrderAmount) : "");
    setFormMaxDiscount(coupon.maxDiscount ? String(coupon.maxDiscount) : "");
    setFormValidFrom(coupon.startDate ? new Date(coupon.startDate).toISOString().split("T")[0] : "");
    setFormValidUntil(coupon.endDate ? new Date(coupon.endDate).toISOString().split("T")[0] : "");
    setFormUsageLimit(coupon.usageLimit ? String(coupon.usageLimit) : "");
    setFormPerUserLimit(String(coupon.perUserLimit || 1));
    setFormCampaignType(coupon.campaignType || "COUPON");
    setShowCreateModal(true);
  }

  // Save / Update Coupon
  async function handleSubmitCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!formName || !formValue) return;
    setSubmitting(true);

    try {
      const payload = {
        code: formCode ? formCode.trim().toUpperCase() : null,
        name: formName.trim(),
        description: formDesc.trim() || null,
        discountType: formType,
        discountValue: Number(formValue),
        minOrderAmount: formMinOrder ? Number(formMinOrder) : 0,
        maxDiscount: formMaxDiscount ? Number(formMaxDiscount) : null,
        validFrom: formValidFrom || undefined,
        validUntil: formValidUntil || undefined,
        usageLimit: formUsageLimit ? Number(formUsageLimit) : null,
        perUserLimit: Number(formPerUserLimit || 1),
        campaignType: formCampaignType,
      };

      if (editCoupon) {
        await fetch(`/api/admin/coupons/${editCoupon.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/admin/coupons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      setShowCreateModal(false);
      fetchCouponsData(true);
    } catch (err) {
      console.error("Error saving coupon:", err);
    } finally {
      setSubmitting(false);
    }
  }

  // Toggle Active Status
  async function handleToggleActive(coupon: Coupon) {
    const nextState = !coupon.isActive;
    setCoupons((prev) =>
      prev.map((item) => (item.id === coupon.id ? { ...item, isActive: nextState } : item))
    );
    setCampaigns((prev) =>
      prev.map((item) => (item.id === coupon.id ? { ...item, isActive: nextState } : item))
    );
    try {
      await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextState }),
      });
    } catch (err) {
      console.error("Error toggling coupon status:", err);
    }
  }

  // Delete Coupon
  async function handleDeleteCoupon(id: string) {
    if (!confirm("Are you sure you want to delete this coupon code?")) return;
    setCoupons((prev) => prev.filter((item) => item.id !== id));
    setCampaigns((prev) => prev.filter((item) => item.id !== id));
    try {
      await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Error deleting coupon:", err);
    }
  }

  // Search Filter
  const filteredCoupons = coupons.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.code?.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q)
    );
  });

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
                <Tag className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-black uppercase tracking-tight font-sans">
                  Coupons &amp; Promotional Discounts
                </h1>
                <p className="text-xs font-bold text-slate-500">
                  Manage discount promo codes, festival campaigns, and automated offer rules.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchCouponsData()}
                disabled={refreshing}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 transition-colors"
                title="Refresh Coupons"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-[#E5A00D]" : ""}`} />
                <span>Refresh</span>
              </button>

              <button
                onClick={handleOpenCreate}
                className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-[#E5A00D] font-extrabold text-xs rounded-xl flex items-center gap-2 transition-all shadow-none"
              >
                <PlusCircle className="w-4 h-4" /> Create Coupon Code
              </button>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* TOP SUMMARY STATS CARDS (4 CARDS)                            */}
          {/* ════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Active Coupons */}
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Active Coupons
                </span>
                <div className="p-1.5 bg-emerald-100 text-emerald-900 rounded-lg">
                  <Tag size={14} />
                </div>
              </div>
              <div className="text-xl font-black text-black">{summary.activeCouponsCount}</div>
              <div className="text-[10px] font-bold text-slate-500">Currently redeemable</div>
            </div>

            {/* Card 2: Expired Coupons */}
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Expired Coupons
                </span>
                <div className="p-1.5 bg-slate-200 text-slate-800 rounded-lg">
                  <Clock size={14} />
                </div>
              </div>
              <div className="text-xl font-black text-black">{summary.expiredCouponsCount}</div>
              <div className="text-[10px] font-bold text-slate-500">Past validity date</div>
            </div>

            {/* Card 3: Total Redemptions */}
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Total Redemptions
                </span>
                <div className="p-1.5 bg-amber-100 text-amber-900 rounded-lg">
                  <Gift size={14} />
                </div>
              </div>
              <div className="text-xl font-black text-black">{summary.totalRedemptions}</div>
              <div className="text-[10px] font-bold text-slate-500">Times redeemed by users</div>
            </div>

            {/* Card 4: Total Discount Given */}
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Total Discount Given
                </span>
                <div className="p-1.5 bg-purple-100 text-purple-800 rounded-lg">
                  <TrendingDown size={14} />
                </div>
              </div>
              <div className="text-xl font-black text-purple-900 font-mono">
                ₹{summary.totalDiscountGiven.toLocaleString("en-IN")}
              </div>
              <div className="text-[10px] font-bold text-slate-500">Total customer savings</div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* DISCOUNT CAMPAIGNS SECTION (NO COUPON CODE NEEDED)           */}
          {/* ════════════════════════════════════════════════════════════ */}
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-black text-black uppercase tracking-tight">
                Promotional Discount Campaigns
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Automated promotional discounts applied directly at checkout or plan selection.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {campaigns.map((camp) => (
                <div
                  key={camp.id}
                  className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-[10px] font-black uppercase">
                        {camp.campaignType.replace(/_/g, " ")}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleToggleActive(camp)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase transition-all ${
                          camp.isActive
                            ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}
                      >
                        {camp.isActive ? "ACTIVE" : "INACTIVE"}
                      </button>
                    </div>

                    <div className="font-black text-sm text-black">{camp.name}</div>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      {camp.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                    <span className="font-black text-black text-sm">
                      {camp.discountType === "PERCENTAGE"
                        ? `${camp.discountValue}% OFF`
                        : `₹${camp.discountValue} OFF`}
                    </span>
                    <span className="text-slate-500 text-[11px] font-sans">
                      {camp.usageCount || 0} redeemed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* EXISTING COUPONS LEDGER TABLE                                */}
          {/* ════════════════════════════════════════════════════════════ */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-black uppercase tracking-tight">
                  Active &amp; Expired Coupon Codes
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  List of promo codes entered by customers during checkout.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search promo code or name..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-black focus:outline-none focus:border-black"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-16 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <Loader2 className="w-8 h-8 text-[#E5A00D] animate-spin mx-auto" />
                <p className="text-xs font-black text-black uppercase">Loading Coupon Codes...</p>
              </div>
            ) : filteredCoupons.length === 0 ? (
              <div className="p-16 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <Tag className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-base font-black text-black uppercase">No Coupons Available</h3>
                <p className="text-xs text-slate-500 font-medium">
                  No promo codes matched your search query. Click &apos;Create Coupon Code&apos; to create one.
                </p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-none">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                        <th className="p-4">Coupon Code</th>
                        <th className="p-4">Coupon Name &amp; Info</th>
                        <th className="p-4">Discount Value</th>
                        <th className="p-4">Min Order</th>
                        <th className="p-4">Redemptions</th>
                        <th className="p-4">Expiry Date</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium">
                      {filteredCoupons.map((cp) => {
                        const isExpired = cp.endDate && new Date(cp.endDate) <= new Date();

                        return (
                          <tr key={cp.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* Coupon Code */}
                            <td className="p-4 align-top">
                              <span className="inline-block px-3 py-1 bg-black text-[#E5A00D] font-mono font-black text-xs rounded-xl tracking-wider border border-amber-400">
                                {cp.code || "NO-CODE"}
                              </span>
                            </td>

                            {/* Name & Info */}
                            <td className="p-4 align-top space-y-0.5">
                              <div className="font-black text-black text-xs">{cp.name}</div>
                              {cp.description && (
                                <div className="text-[11px] text-slate-500 max-w-xs">{cp.description}</div>
                              )}
                            </td>

                            {/* Discount Value */}
                            <td className="p-4 align-top font-mono font-black text-black text-xs">
                              {cp.discountType === "PERCENTAGE"
                                ? `${cp.discountValue}% OFF`
                                : `₹${cp.discountValue} OFF`}
                              {cp.maxDiscount && (
                                <div className="text-[10px] text-slate-400 font-sans">
                                  (Max ₹{cp.maxDiscount})
                                </div>
                              )}
                            </td>

                            {/* Min Order */}
                            <td className="p-4 align-top font-mono text-slate-700 text-xs">
                              ₹{cp.minOrderAmount || 0}
                            </td>

                            {/* Redemptions */}
                            <td className="p-4 align-top font-mono text-slate-700 text-xs">
                              {cp.usageCount}
                              {cp.usageLimit && <span className="text-slate-400"> / {cp.usageLimit}</span>}
                            </td>

                            {/* Expiry Date */}
                            <td className="p-4 align-top text-slate-600 text-xs font-mono">
                              {cp.endDate ? new Date(cp.endDate).toLocaleDateString() : "No Expiry"}
                            </td>

                            {/* Status */}
                            <td className="p-4 align-top">
                              <button
                                type="button"
                                onClick={() => handleToggleActive(cp)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase transition-all ${
                                  isExpired
                                    ? "bg-slate-200 text-slate-600 border border-slate-300"
                                    : cp.isActive
                                    ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                                    : "bg-rose-100 text-rose-900 border border-rose-300"
                                }`}
                              >
                                {isExpired ? "EXPIRED" : cp.isActive ? "ACTIVE" : "INACTIVE"}
                              </button>
                            </td>

                            {/* Actions */}
                            <td className="p-4 align-top text-center space-x-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(cp)}
                                className="p-1.5 bg-black text-[#E5A00D] hover:bg-neutral-800 rounded-lg transition-colors"
                                title="Edit Coupon"
                              >
                                <Edit2 size={14} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteCoupon(cp.id)}
                                className="p-1.5 bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                                title="Delete Coupon"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* CREATE / EDIT COUPON MODAL                                   */}
      {/* ════════════════════════════════════════════════════════════ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border-2 border-black w-full max-w-lg rounded-2xl p-6 space-y-4 relative text-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-black uppercase tracking-tight">
                {editCoupon ? "Edit Coupon / Campaign" : "Create New Coupon Code"}
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-slate-400 hover:text-black">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitCoupon} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Coupon Code (Optional):</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="e.g. WELCOME20"
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-black text-black uppercase"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Campaign Type *:</label>
                  <select
                    value={formCampaignType}
                    onChange={(e) => setFormCampaignType(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-black"
                  >
                    <option value="COUPON">Promo Code Coupon</option>
                    <option value="FIRST_ORDER">First Order Offer</option>
                    <option value="FESTIVAL">Festival Special</option>
                    <option value="SUBSCRIPTION">Subscription Discount</option>
                    <option value="MEAL_SPECIFIC">Meal Specific Discount</option>
                    <option value="BUY_X_GET_Y">Buy X Get Y (UI Ready)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Coupon Name *:</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Welcome 20% Discount"
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-black"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description:</label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="e.g. 20% discount on orders above ₹249"
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Discount Type *:</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-black"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Discount Value *:</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    placeholder="e.g. 20"
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold text-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Min Order Amount (₹):</label>
                  <input
                    type="number"
                    value={formMinOrder}
                    onChange={(e) => setFormMinOrder(e.target.value)}
                    placeholder="e.g. 249"
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold text-black"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Max Discount Cap (₹):</label>
                  <input
                    type="number"
                    value={formMaxDiscount}
                    onChange={(e) => setFormMaxDiscount(e.target.value)}
                    placeholder="e.g. 100"
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold text-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Valid From:</label>
                  <input
                    type="date"
                    value={formValidFrom}
                    onChange={(e) => setFormValidFrom(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-black"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Valid Until / Expiry:</label>
                  <input
                    type="date"
                    value={formValidUntil}
                    onChange={(e) => setFormValidUntil(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total Usage Limit:</label>
                  <input
                    type="number"
                    value={formUsageLimit}
                    onChange={(e) => setFormUsageLimit(e.target.value)}
                    placeholder="e.g. 500 (blank = unlimited)"
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold text-black"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Per User Limit:</label>
                  <input
                    type="number"
                    value={formPerUserLimit}
                    onChange={(e) => setFormPerUserLimit(e.target.value)}
                    placeholder="1"
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold text-black"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-black text-[#E5A00D] font-extrabold text-xs rounded-xl flex items-center gap-1 hover:bg-neutral-800"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  {editCoupon ? "Save Changes" : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
