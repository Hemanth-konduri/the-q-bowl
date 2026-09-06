"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "../components/AdminSidebar";
import { AdminNavbar } from "../components/AdminNavbar";
import {
  Utensils,
  CreditCard,
  Loader2,
  RefreshCw,
  Search,
  Eye,
  X,
  User,
  Phone,
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  Sparkles,
  UserPlus,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Check,
} from "lucide-react";

interface SubscriberRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  mealName: string;
  mealsRemaining: number; // Pending Meals
  totalMeals: number; // Total Meals
  mealsUsed: number; // Completed Meals
  mealsPerDay: number;
  mealTiming: string;
  dietaryPreference: string;
  pricePaid: number;
  startDate: string;
  expectedEndDate: string;
  status: string;
  createdAt: string;
  deliveryAddress?: string;
}

interface MealPricing {
  id: string;
  mealId: string;
  pricePerMeal: number;
  isActive: boolean;
  mealName: string;
  mealDescription?: string;
  mealImageUrl?: string;
  mealCalories?: number;
  mealIsVeg?: boolean;
  standardPrice?: number;
  categoryName?: string;
}

interface CreditPackage {
  id: string;
  name: string;
  mealCredits: number;
  discount: number;
  isFeatured: boolean;
  isActive: boolean;
}

interface FoodCatalogItem {
  id: string;
  name: string;
  price: number;
  isVeg: boolean;
}

export default function AdminSubscriptionsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"SUBSCRIBERS" | "MEAL_PRICING" | "PACKAGES">("SUBSCRIBERS");
  const [searchQuery, setSearchQuery] = useState("");

  // Data States
  const [subscribers, setSubscribers] = useState<SubscriberRecord[]>([]);
  const [pricings, setPricings] = useState<MealPricing[]>([]);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [foodCatalog, setFoodCatalog] = useState<FoodCatalogItem[]>([]);

  // Modal States
  const [selectedSub, setSelectedSub] = useState<SubscriberRecord | null>(null);
  const [updatingSubId, setUpdatingSubId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add Offline Subscriber Modal State
  const [showAddSubModal, setShowAddSubModal] = useState(false);
  const [submittingAddSub, setSubmittingAddSub] = useState(false);
  const [newSubForm, setNewSubForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    deliveryAddress: "",
    mealId: "",
    startDate: new Date().toISOString().split("T")[0],
    totalMeals: "30",
    completedMeals: "0",
    mealTiming: "LUNCH",
    status: "ACTIVE",
    pricePaid: "",
  });

  // Meal Pricing Form State
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [pricingForm, setPricingForm] = useState({
    id: "",
    mealId: "",
    pricePerMeal: "",
    isActive: true,
  });

  // Package Form State
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [packageForm, setPackageForm] = useState({
    id: "",
    name: "",
    mealCredits: "",
    discount: "",
    isFeatured: false,
    isActive: true,
  });

  // 1. Fetch All Subscription Data
  async function fetchAllSubscriptionData(isManual = false) {
    if (isManual) setRefreshing(true);
    try {
      const [subsRes, pricingRes, pkgRes, foodRes] = await Promise.all([
        fetch("/api/admin/subscriptions/list"),
        fetch("/api/admin/subscriptions/pricing"),
        fetch("/api/admin/subscriptions/packages"),
        fetch("/api/admin/food-items"),
      ]);

      if (subsRes.ok) {
        const subsData = await subsRes.json();
        setSubscribers(Array.isArray(subsData) ? subsData : []);
      }
      if (pricingRes.ok) {
        const pricingData = await pricingRes.json();
        setPricings(pricingData.pricings || []);
      }
      if (pkgRes.ok) {
        const pkgData = await pkgRes.json();
        setPackages(pkgData.packages || []);
      }
      if (foodRes.ok) {
        const foodData = await foodRes.json();
        setFoodCatalog(Array.isArray(foodData) ? foodData : foodData.foodItems || []);
      }
    } catch (err) {
      console.error("Error loading subscription data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchAllSubscriptionData();
  }, []);

  // 2. Add Offline Subscriber Handler
  async function handleCreateOfflineSubscriber(e: React.FormEvent) {
    e.preventDefault();
    if (!newSubForm.fullName || !newSubForm.phone || !newSubForm.deliveryAddress) return;

    setSubmittingAddSub(true);
    try {
      const res = await fetch("/api/admin/subscriptions/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: newSubForm.fullName,
          phone: newSubForm.phone,
          email: newSubForm.email || undefined,
          deliveryAddress: newSubForm.deliveryAddress,
          mealId: newSubForm.mealId || undefined,
          startDate: newSubForm.startDate,
          totalMeals: Number(newSubForm.totalMeals) || 30,
          completedMeals: Number(newSubForm.completedMeals) || 0,
          mealTiming: newSubForm.mealTiming,
          status: newSubForm.status,
          pricePaid: Number(newSubForm.pricePaid) || 0,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowAddSubModal(false);
        setNewSubForm({
          fullName: "",
          phone: "",
          email: "",
          deliveryAddress: "",
          mealId: "",
          startDate: new Date().toISOString().split("T")[0],
          totalMeals: "30",
          completedMeals: "0",
          mealTiming: "LUNCH",
          status: "ACTIVE",
          pricePaid: "",
        });
        setToastMessage("Offline subscriber onboarded successfully!");
        setTimeout(() => setToastMessage(null), 3500);
        fetchAllSubscriptionData();
      } else {
        alert(data.error || "Failed to add subscriber");
      }
    } catch (err) {
      console.error("Error adding subscriber:", err);
    } finally {
      setSubmittingAddSub(false);
    }
  }

  // 3. Handle Subscriber Status & Credit Updates
  async function handleUpdateSubscriber(subscriptionId: string, status?: string, addCredits?: number) {
    setUpdatingSubId(subscriptionId);
    try {
      const res = await fetch("/api/admin/subscriptions/list", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId, status, addCredits }),
      });
      if (res.ok) {
        await fetchAllSubscriptionData();
        if (selectedSub && selectedSub.id === subscriptionId) {
          const updatedSub = subscribers.find((s) => s.id === subscriptionId);
          if (updatedSub) setSelectedSub(updatedSub);
        }
      }
    } catch (err) {
      console.error("Error updating subscriber:", err);
    } finally {
      setUpdatingSubId(null);
    }
  }

  // 4. Save Meal Pricing
  async function handleSavePricing(e: React.FormEvent) {
    e.preventDefault();
    if (!pricingForm.mealId || !pricingForm.pricePerMeal) return;

    try {
      const res = await fetch("/api/admin/subscriptions/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: pricingForm.id || undefined,
          mealId: pricingForm.mealId,
          pricePerMeal: Number(pricingForm.pricePerMeal),
          isActive: pricingForm.isActive,
        }),
      });

      if (res.ok) {
        setShowPricingModal(false);
        setPricingForm({ id: "", mealId: "", pricePerMeal: "", isActive: true });
        fetchAllSubscriptionData();
      }
    } catch (err) {
      console.error("Error saving pricing:", err);
    }
  }

  // 5. Save Credit Package
  async function handleSavePackage(e: React.FormEvent) {
    e.preventDefault();
    if (!packageForm.name || !packageForm.mealCredits) return;

    try {
      const res = await fetch("/api/admin/subscriptions/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: packageForm.id || undefined,
          name: packageForm.name,
          mealCredits: Number(packageForm.mealCredits),
          discount: Number(packageForm.discount) || 0,
          isFeatured: packageForm.isFeatured,
          isActive: packageForm.isActive,
        }),
      });

      if (res.ok) {
        setShowPackageModal(false);
        setPackageForm({ id: "", name: "", mealCredits: "", discount: "", isFeatured: false, isActive: true });
        fetchAllSubscriptionData();
      }
    } catch (err) {
      console.error("Error saving package:", err);
    }
  }

  // Search Filter
  const filteredSubscribers = subscribers.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      (s.userName && s.userName.toLowerCase().includes(q)) ||
      (s.userEmail && s.userEmail.toLowerCase().includes(q)) ||
      (s.userPhone && s.userPhone.includes(q)) ||
      (s.mealName && s.mealName.toLowerCase().includes(q))
    );
  });

  const activeSubCount = subscribers.filter((s) => s.status === "ACTIVE").length;
  const totalMealsRemainingSum = subscribers.reduce((acc, curr) => acc + (curr.mealsRemaining || 0), 0);
  const totalRevenueSum = subscribers.reduce((acc, curr) => acc + (curr.pricePaid || 0), 0);

  // Automatically compute pending meals for modal form
  const computedFormPendingMeals = Math.max(
    0,
    (Number(newSubForm.totalMeals) || 0) - (Number(newSubForm.completedMeals) || 0)
  );

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans relative">
      <AdminSidebar />

      <div className="pl-64 flex flex-col min-h-screen bg-white">
        <AdminNavbar />

        <main className="flex-1 p-8 space-y-8 bg-white">
          {/* Top Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <h1 className="text-2xl font-black text-black tracking-tight uppercase">
                Subscription &amp; Subscriber Management
              </h1>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Manage active subscribers, import existing offline members, and configure meal credit pricing.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {toastMessage && (
                <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold animate-fadeIn">
                  <Check className="w-4 h-4 text-emerald-600" />
                  {toastMessage}
                </div>
              )}

              {/* Add Offline Subscriber Button */}
              <button
                onClick={() => setShowAddSubModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#E5A00D] hover:bg-[#d4920b] text-black font-extrabold text-xs rounded-xl shadow-none border border-black/20 transition-all active:scale-95"
              >
                <UserPlus size={16} />
                Add Offline Subscriber
              </button>

              <button
                onClick={() => fetchAllSubscriptionData(true)}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-black font-bold text-xs rounded-xl border border-slate-300 transition-colors shadow-none disabled:opacity-50"
              >
                <RefreshCw size={14} className={refreshing ? "animate-spin text-[#E5A00D]" : ""} />
                {refreshing ? "Syncing..." : "Sync Engine"}
              </button>
            </div>
          </div>

          {/* KPI CARDS SUMMARY */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border-2 border-black p-6 rounded-2xl shadow-none">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Active Subscribers
                </span>
                <div className="h-10 w-10 rounded-xl bg-[#E5A00D] text-black flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-black text-black">{activeSubCount}</span>
                <span className="text-xs font-bold text-[#E5A00D] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Live Active Plans
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-none">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Pending Meal Credits
                </span>
                <div className="h-10 w-10 rounded-xl bg-black text-[#E5A00D] flex items-center justify-center font-bold">
                  <Utensils className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-black text-black">{totalMealsRemainingSum}</span>
                <span className="text-xs font-bold text-slate-500">To be fulfilled</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-none">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Subscription Revenue
                </span>
                <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5 text-[#E5A00D]" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-black text-black">₹{totalRevenueSum.toLocaleString()}</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Total Collected
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-none">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Catalog Meals Priced
                </span>
                <div className="h-10 w-10 rounded-xl bg-slate-100 text-black flex items-center justify-center font-bold">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-black text-black">{pricings.length}</span>
                <span className="text-xs font-bold text-slate-500">Per-Meal Rates</span>
              </div>
            </div>
          </div>

          {/* TAB NAVIGATION: SUBSCRIBERS LIST vs MEAL PRICING vs PACKAGES */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-none space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("SUBSCRIBERS")}
                  className={`px-4 py-2 text-xs font-black rounded-xl transition-colors ${
                    activeTab === "SUBSCRIBERS"
                      ? "bg-[#E5A00D] text-black shadow-none"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Subscribers Directory ({subscribers.length})
                </button>

                <button
                  onClick={() => setActiveTab("MEAL_PRICING")}
                  className={`px-4 py-2 text-xs font-black rounded-xl transition-colors ${
                    activeTab === "MEAL_PRICING"
                      ? "bg-[#E5A00D] text-black shadow-none"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Per-Meal Pricing ({pricings.length})
                </button>

                <button
                  onClick={() => setActiveTab("PACKAGES")}
                  className={`px-4 py-2 text-xs font-black rounded-xl transition-colors ${
                    activeTab === "PACKAGES"
                      ? "bg-[#E5A00D] text-black shadow-none"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Credit Packages ({packages.length})
                </button>
              </div>

              {/* Action Buttons */}
              {activeTab === "MEAL_PRICING" && (
                <button
                  onClick={() => {
                    setPricingForm({ id: "", mealId: "", pricePerMeal: "", isActive: true });
                    setShowPricingModal(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-neutral-800 text-[#E5A00D] font-black text-xs rounded-xl shadow-none transition-colors"
                >
                  <Plus size={16} /> Add Meal Subscription Cost
                </button>
              )}

              {activeTab === "PACKAGES" && (
                <button
                  onClick={() => {
                    setPackageForm({ id: "", name: "", mealCredits: "", discount: "", isFeatured: false, isActive: true });
                    setShowPackageModal(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-neutral-800 text-[#E5A00D] font-black text-xs rounded-xl shadow-none transition-colors"
                >
                  <Plus size={16} /> Add Credit Package
                </button>
              )}
            </div>

            {/* TAB 1: SUBSCRIBERS LIST */}
            {activeTab === "SUBSCRIBERS" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="relative w-full max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search subscriber name, email, phone, meal..."
                      className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#E5A00D] focus:bg-white text-black font-medium"
                    />
                  </div>

                  <p className="text-xs text-slate-500 font-bold">
                    Showing <span className="text-black font-extrabold">{filteredSubscribers.length}</span> active &amp; imported subscribers
                  </p>
                </div>

                {loading ? (
                  <div className="flex justify-center py-12 text-[#E5A00D]">
                    <Loader2 size={32} className="animate-spin" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-extrabold uppercase tracking-wider">
                          <th className="pb-3 pr-4">Subscriber Profile</th>
                          <th className="pb-3 px-4">Assigned Meal Bowl</th>
                          <th className="pb-3 px-4">Completed Meals</th>
                          <th className="pb-3 px-4">Pending Meals</th>
                          <th className="pb-3 px-4">Schedule &amp; Timing</th>
                          <th className="pb-3 px-4">Status</th>
                          <th className="pb-3 pl-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-bold">
                        {filteredSubscribers.length > 0 ? (
                          filteredSubscribers.map((sub) => {
                            const completed = sub.mealsUsed ?? (sub.totalMeals - sub.mealsRemaining);
                            return (
                              <tr key={sub.id} className="hover:bg-slate-50 transition-colors group">
                                {/* Subscriber Profile */}
                                <td className="py-4 pr-4 text-slate-900">
                                  <p className="text-sm font-black text-black group-hover:text-[#E5A00D] transition-colors">
                                    {sub.userName || "Subscriber User"}
                                  </p>
                                  <p className="text-[11px] font-mono text-slate-500">{sub.userPhone || sub.userEmail}</p>
                                </td>

                                {/* Assigned Meal Item */}
                                <td className="py-4 px-4 font-extrabold text-black">
                                  {sub.mealName || "Custom Bowl Selection"}
                                </td>

                                {/* Completed Meals */}
                                <td className="py-4 px-4">
                                  <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-black">
                                    {completed} Meals Done
                                  </span>
                                </td>

                                {/* Pending Meals */}
                                <td className="py-4 px-4">
                                  <span className="px-2.5 py-1 bg-amber-100 text-amber-950 border border-amber-300 rounded-lg text-xs font-black">
                                    {sub.mealsRemaining} Meals Pending
                                  </span>
                                </td>

                                {/* Schedule & Timing */}
                                <td className="py-4 px-4 text-slate-700">
                                  <p className="font-black text-black">{sub.mealTiming || "LUNCH"}</p>
                                  <p className="text-[11px] text-slate-500">Start: {sub.startDate || "Active"}</p>
                                </td>

                                {/* Status */}
                                <td className="py-4 px-4">
                                  <span
                                    className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                                      sub.status === "ACTIVE"
                                        ? "bg-[#E5A00D] text-black"
                                        : sub.status === "PAUSED"
                                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                                        : "bg-slate-100 text-slate-600"
                                    }`}
                                  >
                                    {sub.status}
                                  </span>
                                </td>

                                {/* Actions */}
                                <td className="py-4 pl-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => setSelectedSub(sub)}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-black font-extrabold text-xs rounded-xl transition-colors"
                                    >
                                      <Eye size={14} /> View
                                    </button>

                                    {sub.status === "ACTIVE" && (
                                      <button
                                        onClick={() => handleUpdateSubscriber(sub.id, "PAUSED")}
                                        disabled={updatingSubId === sub.id}
                                        className="px-2.5 py-1.5 bg-amber-50 text-amber-900 hover:bg-amber-100 font-bold text-xs rounded-xl border border-amber-200 transition-colors"
                                      >
                                        Pause
                                      </button>
                                    )}

                                    {sub.status === "PAUSED" && (
                                      <button
                                        onClick={() => handleUpdateSubscriber(sub.id, "ACTIVE")}
                                        disabled={updatingSubId === sub.id}
                                        className="px-2.5 py-1.5 bg-black text-white hover:bg-neutral-800 font-bold text-xs rounded-xl transition-colors"
                                      >
                                        Resume
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={7} className="text-center py-10 text-slate-500 font-medium">
                              No subscribers found. Click &quot;Add Offline Subscriber&quot; to import members.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: SUBSCRIPTION PER-MEAL PRICING CATALOG */}
            {activeTab === "MEAL_PRICING" && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 font-bold">
                  Admin sets the per-meal subscription price here. In the user app, total plan cost = (Per-Meal Price × Number of Meals Selected) - Package Discount.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pricings.length > 0 ? (
                    pricings.map((p) => (
                      <div
                        key={p.id}
                        className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-none hover:border-[#E5A00D] transition-colors relative"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-black uppercase text-[#E5A00D] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              {p.categoryName || "Subscription Meal"}
                            </span>
                            <h4 className="font-black text-base text-black mt-1">{p.mealName}</h4>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              p.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {p.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-xl flex items-center justify-between text-xs border border-slate-200">
                          <div>
                            <p className="text-slate-400 font-bold uppercase text-[10px]">Standard Price</p>
                            <p className="font-extrabold text-slate-700">₹{p.standardPrice || "N/A"}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-slate-400 font-bold uppercase text-[10px]">Subscription Cost</p>
                            <p className="font-black text-black text-lg">₹{p.pricePerMeal} <span className="text-xs font-semibold text-slate-500">/ meal</span></p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setPricingForm({
                              id: p.id,
                              mealId: p.mealId,
                              pricePerMeal: String(p.pricePerMeal),
                              isActive: p.isActive,
                            });
                            setShowPricingModal(true);
                          }}
                          className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-black font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1"
                        >
                          <Edit2 size={14} /> Edit Per-Meal Cost
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12 text-slate-500 font-medium">
                      No subscription meal pricing configured yet. Click &quot;Add Meal Subscription Cost&quot; to assign per-meal rates.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: CREDIT PACKAGES */}
            {activeTab === "PACKAGES" && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 font-bold">
                  Define subscription credit packages (e.g. 10 Meals, 20 Meals, 30 Meals) with discount savings for subscribers.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {packages.length > 0 ? (
                    packages.map((pkg) => (
                      <div
                        key={pkg.id}
                        className={`p-5 rounded-2xl border ${
                          pkg.isFeatured ? "border-[#E5A00D] bg-amber-50/30" : "border-slate-200 bg-white"
                        } space-y-3 shadow-none relative`}
                      >
                        {pkg.isFeatured && (
                          <span className="absolute -top-3 right-4 px-2.5 py-0.5 bg-[#E5A00D] text-black font-black text-[10px] uppercase rounded-full shadow-none flex items-center gap-1 border border-black/20">
                            <Sparkles size={12} /> Popular Tier
                          </span>
                        )}

                        <div className="flex items-center justify-between">
                          <h4 className="font-black text-lg text-black">{pkg.name}</h4>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              pkg.isActive ? "bg-black text-[#E5A00D]" : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {pkg.isActive ? "Active" : "Disabled"}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <p className="text-3xl font-black text-black">
                            {pkg.mealCredits} <span className="text-sm font-bold text-slate-500">Meal Credits</span>
                          </p>
                          {pkg.discount > 0 && (
                            <p className="text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-200 inline-block px-2 py-0.5 rounded-md">
                              Save ₹{pkg.discount} on Package
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <button
                            onClick={() => {
                              setPackageForm({
                                id: pkg.id,
                                name: pkg.name,
                                mealCredits: String(pkg.mealCredits),
                                discount: String(pkg.discount),
                                isFeatured: pkg.isFeatured,
                                isActive: pkg.isActive,
                              });
                              setShowPackageModal(true);
                            }}
                            className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-black font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1"
                          >
                            <Edit2 size={14} /> Edit
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12 text-slate-500 font-medium">
                      No credit packages created yet. Click &quot;Add Credit Package&quot; to create meal packages.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: ADD OFFLINE SUBSCRIBER FORM MODAL                  */}
      {/* ════════════════════════════════════════════════════════════ */}
      {showAddSubModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border-2 border-black w-full max-w-xl rounded-2xl shadow-none p-6 space-y-6 relative overflow-hidden text-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-lg font-black text-black uppercase tracking-tight flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#E5A00D]" />
                  Import / Add Offline Subscriber
                </h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  Onboard existing customers who subscribed before website launch.
                </p>
              </div>
              <button
                onClick={() => setShowAddSubModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-black transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateOfflineSubscriber} className="space-y-4 text-xs font-bold">
              {/* Customer Details */}
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  1. Customer Information
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 block mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={newSubForm.fullName}
                      onChange={(e) => setNewSubForm((prev) => ({ ...prev, fullName: e.target.value }))}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-black"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 block mb-1">Phone Number (Login Key) *</label>
                    <input
                      type="text"
                      required
                      value={newSubForm.phone}
                      onChange={(e) => setNewSubForm((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-black"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 block mb-1">Email Address (Optional)</label>
                    <input
                      type="email"
                      value={newSubForm.email}
                      onChange={(e) => setNewSubForm((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="e.g. ramesh@example.com"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-black"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 block mb-1">Meal Timing Window *</label>
                    <select
                      value={newSubForm.mealTiming}
                      onChange={(e) => setNewSubForm((prev) => ({ ...prev, mealTiming: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-black"
                    >
                      <option value="LUNCH">☀️ Lunch Only (1 Meal/day)</option>
                      <option value="DINNER">🌙 Dinner Only (1 Meal/day)</option>
                      <option value="BREAKFAST">🌅 Breakfast Only (1 Meal/day)</option>
                      <option value="BOTH">🍱 Both Lunch &amp; Dinner (2 Meals/day)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-slate-700 block mb-1">Delivery Address *</label>
                  <textarea
                    rows={2}
                    required
                    value={newSubForm.deliveryAddress}
                    onChange={(e) => setNewSubForm((prev) => ({ ...prev, deliveryAddress: e.target.value }))}
                    placeholder="Full street address, flat no, landmark..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-black"
                  />
                </div>
              </div>

              {/* Subscription Plan & Meal Counts */}
              <div className="space-y-3 p-4 bg-amber-50/70 border border-amber-200 rounded-xl">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-950 block">
                  2. Subscription Plan &amp; Meal Balances
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-amber-950 block mb-1">Select Meal Bowl Item</label>
                    <select
                      value={newSubForm.mealId}
                      onChange={(e) => setNewSubForm((prev) => ({ ...prev, mealId: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs font-bold text-black"
                    >
                      <option value="">Default Gourmet Bowl</option>
                      {foodCatalog.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} (₹{f.price})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-amber-950 block mb-1">Start Date *</label>
                    <input
                      type="date"
                      required
                      value={newSubForm.startDate}
                      onChange={(e) => setNewSubForm((prev) => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs font-bold text-black"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-amber-950 block mb-1">Total Meals *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={newSubForm.totalMeals}
                      onChange={(e) => setNewSubForm((prev) => ({ ...prev, totalMeals: e.target.value }))}
                      placeholder="e.g. 30"
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs font-bold text-black"
                    />
                  </div>

                  <div>
                    <label className="text-amber-950 block mb-1">Completed Meals</label>
                    <input
                      type="number"
                      min="0"
                      value={newSubForm.completedMeals}
                      onChange={(e) => setNewSubForm((prev) => ({ ...prev, completedMeals: e.target.value }))}
                      placeholder="e.g. 12"
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs font-bold text-black"
                    />
                  </div>

                  <div>
                    <label className="text-amber-950 block mb-1">Pending Meals</label>
                    <input
                      type="number"
                      readOnly
                      value={computedFormPendingMeals}
                      className="w-full px-3 py-2 bg-amber-100 border border-amber-300 rounded-lg text-xs font-black text-amber-950 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-amber-950 block mb-1">Subscription Status *</label>
                    <select
                      value={newSubForm.status}
                      onChange={(e) => setNewSubForm((prev) => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs font-bold text-black"
                    >
                      <option value="ACTIVE">Active (Fulfilling Daily)</option>
                      <option value="PAUSED">Paused (Temporarily On Hold)</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-amber-950 block mb-1">Price Paid / Collected (₹)</label>
                    <input
                      type="number"
                      value={newSubForm.pricePaid}
                      onChange={(e) => setNewSubForm((prev) => ({ ...prev, pricePaid: e.target.value }))}
                      placeholder="e.g. 3600"
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs font-bold text-black"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSubModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAddSub}
                  className="px-5 py-2.5 bg-[#E5A00D] hover:bg-[#d4920b] text-black font-black text-xs rounded-xl shadow-none border border-black/20"
                >
                  {submittingAddSub ? "Onboarding..." : "Confirm & Save Subscriber"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: VIEW SUBSCRIBER PROFILE DRAWER */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border-2 border-black w-full max-w-xl rounded-2xl shadow-none p-6 space-y-6 relative overflow-hidden text-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-xl font-black text-black">
                  Subscriber Profile &amp; Plan Details
                </h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  Single source of truth in PostgreSQL database
                </p>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-black transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Customer Details</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 font-bold">
                <div>
                  <p className="font-extrabold text-black text-sm">{selectedSub.userName}</p>
                  <p className="text-[11px] text-slate-500">Name</p>
                </div>
                <div>
                  <p className="font-bold text-slate-800">{selectedSub.userPhone || "N/A"}</p>
                  <p className="text-[11px] text-slate-500">Phone</p>
                </div>
              </div>
              {selectedSub.deliveryAddress && (
                <div className="pt-2 border-t border-slate-200 text-xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Delivery Address</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedSub.deliveryAddress}</p>
                </div>
              )}
            </div>

            {/* Meal Counts Display */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] font-black text-slate-500 uppercase">Total Meals</span>
                <p className="text-2xl font-black text-black mt-0.5">{selectedSub.totalMeals || selectedSub.mealsRemaining}</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] font-black text-slate-500 uppercase">Completed</span>
                <p className="text-2xl font-black text-black mt-0.5">
                  {selectedSub.mealsUsed ?? (selectedSub.totalMeals - selectedSub.mealsRemaining)}
                </p>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl">
                <span className="text-[10px] font-black text-amber-950 uppercase">Pending</span>
                <p className="text-2xl font-black text-amber-950 mt-0.5">{selectedSub.mealsRemaining}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
