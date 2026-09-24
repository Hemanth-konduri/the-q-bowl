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
  ToggleLeft,
  ToggleRight,
  Power,
  Send,
  Sun,
  Moon,
  Rocket,
  Truck,
  PackageCheck,
  Layers,
  ChevronDown,
  ChevronUp,
  UserCheck,
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

interface EnrichedBatch {
  id: string;
  name: string;
  mealSlot: string;
  deliveryTime: string;
  assignedPartnerId: string | null;
  partnerName?: string;
  partnerPhone?: string;
  status: string;
  totalMeals: number;
  subscriptionCount: number;
  dailyOrderCount: number;
  deliveries: Array<{
    id: string;
    orderType: string;
    customerName?: string;
    customerPhone?: string;
    mealName?: string;
    addressLine?: string;
    area?: string;
    status: string;
  }>;
}

interface DeliveryPartnerRecord {
  id: string;
  fullName: string;
  phone: string;
  isActive: boolean;
}

export default function AdminSubscriptionsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"SUBSCRIBERS" | "BATCHES" | "MEAL_PRICING" | "PACKAGES">("SUBSCRIBERS");
  const [searchQuery, setSearchQuery] = useState("");

  // Data States
  const [subscribers, setSubscribers] = useState<SubscriberRecord[]>([]);
  const [pricings, setPricings] = useState<MealPricing[]>([]);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [foodCatalog, setFoodCatalog] = useState<FoodCatalogItem[]>([]);
  const [deliveryBatchesList, setDeliveryBatchesList] = useState<EnrichedBatch[]>([]);
  const [deliveryPartnersList, setDeliveryPartnersList] = useState<DeliveryPartnerRecord[]>([]);
  const [updatingBatchId, setUpdatingBatchId] = useState<string | null>(null);
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);

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

  // Release Order State
  const [releasingSub, setReleasingSub] = useState<SubscriberRecord | null>(null);
  const [releaseSlot, setReleaseSlot] = useState<"LUNCH" | "DINNER">("LUNCH");
  const [submittingRelease, setSubmittingRelease] = useState(false);
  const [batchReleasingSlot, setBatchReleasingSlot] = useState<"LUNCH" | "DINNER" | null>(null);

  // Release Order Handler (Single or Batch)
  async function handleReleaseOrder(mode: "SINGLE" | "BATCH", subId?: string, slot?: "LUNCH" | "DINNER") {
    const targetSlot = slot || releaseSlot;
    if (mode === "SINGLE") {
      setSubmittingRelease(true);
    } else {
      setBatchReleasingSlot(targetSlot);
    }

    try {
      const res = await fetch("/api/admin/subscriptions/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          subscriptionId: subId || releasingSub?.id,
          mealSlot: targetSlot,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setToastMessage(`🚀 ${data.message}`);
        setTimeout(() => setToastMessage(null), 4000);
        setReleasingSub(null);
        await fetchAllSubscriptionData();
      } else {
        alert(data.error || "Failed to release order.");
      }
    } catch (e: any) {
      alert(e.message || "Failed to release order.");
    } finally {
      setSubmittingRelease(false);
      setBatchReleasingSlot(null);
    }
  }

  // 1. Fetch All Subscription Data & Today's Batches
  async function fetchBatchesData() {
    try {
      const today = new Date().toISOString().split("T")[0];
      const [batchesRes, partnersRes, deliveryRes] = await Promise.all([
        fetch("/api/admin/batches"),
        fetch("/api/admin/delivery-partners"),
        fetch(`/api/delivery/batches?date=${today}`),
      ]);

      let rawBatches: any[] = [];
      if (batchesRes.ok) {
        const bData = await batchesRes.json();
        rawBatches = bData.batches || [];
      }

      if (partnersRes.ok) {
        const pData = await partnersRes.json();
        setDeliveryPartnersList(Array.isArray(pData) ? pData : pData.partners || []);
      }

      let manifestBatches: any[] = [];
      if (deliveryRes.ok) {
        const dData = await deliveryRes.json();
        manifestBatches = dData.batches || [];
      }

      const merged: EnrichedBatch[] = rawBatches.map((b) => {
        const matchedManifest = manifestBatches.find((mb) => mb.id === b.id);
        const deliveries = matchedManifest?.deliveries || [];
        const subCount = deliveries.filter((d: any) => d.orderType === "SUBSCRIPTION").length;
        const dailyCount = deliveries.filter((d: any) => d.orderType !== "SUBSCRIPTION").length;

        return {
          id: b.id,
          name: b.name,
          mealSlot: b.mealSlot || "LUNCH",
          deliveryTime: b.deliveryTime,
          assignedPartnerId: b.assignedPartnerId,
          partnerName: b.partnerName,
          partnerPhone: b.partnerPhone,
          status: b.status || "SCHEDULED",
          totalMeals: deliveries.length,
          subscriptionCount: subCount,
          dailyOrderCount: dailyCount,
          deliveries,
        };
      });

      setDeliveryBatchesList(merged);
    } catch (err) {
      console.error("Error fetching batches data:", err);
    }
  }

  async function handleAssignBatchPartner(batchId: string, assignedPartnerId: string) {
    setUpdatingBatchId(batchId);
    try {
      const res = await fetch("/api/admin/batches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId, assignedPartnerId }),
      });
      if (res.ok) {
        setToastMessage("Delivery partner assigned to batch successfully!");
        setTimeout(() => setToastMessage(null), 3000);
        await fetchBatchesData();
      }
    } catch (err) {
      console.error("Error assigning partner to batch:", err);
    } finally {
      setUpdatingBatchId(null);
    }
  }

  async function handleUpdateBatchStatus(batchId: string, status: string) {
    setUpdatingBatchId(batchId);
    try {
      const res = await fetch("/api/admin/batches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId, status }),
      });
      if (res.ok) {
        setToastMessage(`Batch status updated to ${status}!`);
        setTimeout(() => setToastMessage(null), 3000);
        await fetchBatchesData();
      }
    } catch (err) {
      console.error("Error updating batch status:", err);
    } finally {
      setUpdatingBatchId(null);
    }
  }

  async function handleDispatchBatch(batchId: string, batchName: string) {
    if (!confirm(`Are you sure you want to dispatch ${batchName} now? All orders in this batch will be assigned for delivery.`)) {
      return;
    }
    await handleUpdateBatchStatus(batchId, "DISPATCHED");
  }

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

      await fetchBatchesData();
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
        setToastMessage("Meal subscription pricing saved successfully!");
        setTimeout(() => setToastMessage(null), 3500);
        fetchAllSubscriptionData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save pricing");
      }
    } catch (err) {
      console.error("Error saving pricing:", err);
    }
  }

  // 4b. Toggle Meal Pricing Active / Inactive
  async function handleTogglePricingActive(pricing: MealPricing) {
    const newStatus = !pricing.isActive;
    try {
      const res = await fetch("/api/admin/subscriptions/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: pricing.id,
          mealId: pricing.mealId,
          pricePerMeal: pricing.pricePerMeal,
          isActive: newStatus,
        }),
      });

      if (res.ok) {
        setToastMessage(`Pricing for ${pricing.mealName} ${newStatus ? "activated" : "deactivated"}!`);
        setTimeout(() => setToastMessage(null), 3500);
        fetchAllSubscriptionData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update pricing status");
      }
    } catch (err) {
      console.error("Error toggling pricing status:", err);
    }
  }

  // 4c. Delete Meal Pricing
  async function handleDeletePricing(pricingId: string, mealName: string) {
    if (!confirm(`Are you sure you want to delete the subscription pricing for "${mealName}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/subscriptions/pricing?id=${pricingId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setToastMessage("Pricing deleted successfully!");
        setTimeout(() => setToastMessage(null), 3500);
        fetchAllSubscriptionData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete pricing");
      }
    } catch (err) {
      console.error("Error deleting pricing:", err);
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
        setToastMessage("Subscription package saved successfully!");
        setTimeout(() => setToastMessage(null), 3500);
        fetchAllSubscriptionData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save package");
      }
    } catch (err) {
      console.error("Error saving package:", err);
    }
  }

  // 5b. Toggle Package Active / Inactive
  async function handleTogglePackageActive(pkg: CreditPackage) {
    const newStatus = !pkg.isActive;
    try {
      const res = await fetch("/api/admin/subscriptions/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: pkg.id,
          name: pkg.name,
          mealCredits: pkg.mealCredits,
          discount: pkg.discount,
          isFeatured: pkg.isFeatured,
          isActive: newStatus,
        }),
      });

      if (res.ok) {
        setToastMessage(`Package "${pkg.name}" ${newStatus ? "activated" : "deactivated"}!`);
        setTimeout(() => setToastMessage(null), 3500);
        fetchAllSubscriptionData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update package status");
      }
    } catch (err) {
      console.error("Error toggling package status:", err);
    }
  }

  // 5c. Delete Credit Package
  async function handleDeletePackage(packageId: string, packageName: string) {
    if (!confirm(`Are you sure you want to delete the package "${packageName}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/subscriptions/packages?id=${packageId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setToastMessage("Package deleted successfully!");
        setTimeout(() => setToastMessage(null), 3500);
        fetchAllSubscriptionData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete package");
      }
    } catch (err) {
      console.error("Error deleting package:", err);
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

      <div className="lg:pl-64 pl-0 flex flex-col min-h-screen bg-white transition-all duration-300">
        <AdminNavbar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 bg-white max-w-full overflow-x-hidden">
          {/* Top Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-black tracking-tight uppercase">
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <div className="bg-white border-2 border-black p-3.5 sm:p-6 rounded-2xl shadow-none">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider line-clamp-1">
                  Subscribers
                </span>
                <div className="h-7 w-7 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-[#E5A00D] text-black flex items-center justify-center font-bold shrink-0">
                  <User className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                </div>
              </div>
              <div className="mt-2 sm:mt-4 flex items-baseline justify-between">
                <span className="text-xl sm:text-3xl font-black text-black">{activeSubCount}</span>
                <span className="text-[10px] sm:text-xs font-bold text-[#E5A00D] bg-amber-50 px-1.5 sm:px-2 py-0.5 rounded-full border border-amber-200">
                  Active
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-3.5 sm:p-6 rounded-2xl shadow-none">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider line-clamp-1">
                  Meal Credits
                </span>
                <div className="h-7 w-7 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-black text-[#E5A00D] flex items-center justify-center font-bold shrink-0">
                  <Utensils className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                </div>
              </div>
              <div className="mt-2 sm:mt-4 flex items-baseline justify-between">
                <span className="text-xl sm:text-3xl font-black text-black">{totalMealsRemainingSum}</span>
                <span className="text-[10px] sm:text-xs font-bold text-slate-500">Pending</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-3.5 sm:p-6 rounded-2xl shadow-none">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider line-clamp-1">
                  Revenue
                </span>
                <div className="h-7 w-7 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-amber-50 text-amber-900 border border-amber-200 flex items-center justify-center font-bold shrink-0">
                  <CreditCard className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-[#E5A00D]" />
                </div>
              </div>
              <div className="mt-2 sm:mt-4 flex items-baseline justify-between">
                <span className="text-xl sm:text-3xl font-black text-black">₹{totalRevenueSum.toLocaleString()}</span>
                <span className="text-[10px] sm:text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded-full border border-emerald-200">
                  Total
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-3.5 sm:p-6 rounded-2xl shadow-none">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider line-clamp-1">
                  Meals Priced
                </span>
                <div className="h-7 w-7 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-slate-100 text-black flex items-center justify-center font-bold shrink-0">
                  <DollarSign className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                </div>
              </div>
              <div className="mt-2 sm:mt-4 flex items-baseline justify-between">
                <span className="text-xl sm:text-3xl font-black text-black">{pricings.length}</span>
                <span className="text-[10px] sm:text-xs font-bold text-slate-500">Catalog</span>
              </div>
            </div>
          </div>

          {/* TAB NAVIGATION: SUBSCRIBERS LIST vs TODAY'S BATCHES vs MEAL PRICING vs PACKAGES */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-none space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2 flex-wrap">
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
                  onClick={() => setActiveTab("BATCHES")}
                  className={`px-4 py-2 text-xs font-black rounded-xl transition-colors ${
                    activeTab === "BATCHES"
                      ? "bg-[#E5A00D] text-black shadow-none"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Today&apos;s Delivery Batches ({deliveryBatchesList.length})
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
                {/* Kitchen Production Release Action Bar */}
                {(() => {
                  const lunchEligible = subscribers.filter(
                    (s) => s.status === "ACTIVE" && s.mealsRemaining > 0 && (s.mealTiming === "LUNCH" || s.mealTiming === "BOTH")
                  );
                  const dinnerEligible = subscribers.filter(
                    (s) => s.status === "ACTIVE" && s.mealsRemaining > 0 && (s.mealTiming === "DINNER" || s.mealTiming === "BOTH")
                  );

                  return (
                    <div className="rounded-2xl border-2 border-black bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 p-4 shadow-[3px_3px_0_#000] flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#E5A00D] text-black border border-black flex items-center justify-center shrink-0 shadow-[1px_1px_0_#000]">
                          <Rocket className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-outfit font-black text-xs uppercase tracking-wider text-black">
                              Kitchen Production Release
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-black text-[#E5A00D]">
                              Live Daily Orders
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-600 font-medium">
                            Release today's scheduled subscriber meals directly into the Kitchen &amp; Delivery queue
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                        {/* Batch Release Lunch */}
                        <button
                          type="button"
                          disabled={lunchEligible.length === 0 || batchReleasingSlot !== null}
                          onClick={() => {
                            if (confirm(`Release all ${lunchEligible.length} active Lunch subscription orders to the kitchen for today?`)) {
                              handleReleaseOrder("BATCH", undefined, "LUNCH");
                            }
                          }}
                          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-outfit font-black text-xs uppercase tracking-wider border-2 border-black transition-all ${
                            lunchEligible.length > 0 && batchReleasingSlot === null
                              ? "bg-[#E5A00D] text-black hover:bg-black hover:text-[#E5A00D] shadow-[2px_2px_0_#000] cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
                              : "bg-zinc-200 text-zinc-400 border-zinc-300 cursor-not-allowed shadow-none"
                          }`}
                        >
                          {batchReleasingSlot === "LUNCH" ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Sun size={14} />
                          )}
                          <span>Release Lunch ({lunchEligible.length})</span>
                        </button>

                        {/* Batch Release Dinner */}
                        <button
                          type="button"
                          disabled={dinnerEligible.length === 0 || batchReleasingSlot !== null}
                          onClick={() => {
                            if (confirm(`Release all ${dinnerEligible.length} active Dinner subscription orders to the kitchen for today?`)) {
                              handleReleaseOrder("BATCH", undefined, "DINNER");
                            }
                          }}
                          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-outfit font-black text-xs uppercase tracking-wider border-2 border-black transition-all ${
                            dinnerEligible.length > 0 && batchReleasingSlot === null
                              ? "bg-black text-[#E5A00D] hover:bg-neutral-800 shadow-[2px_2px_0_#E5A00D] cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
                              : "bg-zinc-200 text-zinc-400 border-zinc-300 cursor-not-allowed shadow-none"
                          }`}
                        >
                          {batchReleasingSlot === "DINNER" ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Moon size={14} />
                          )}
                          <span>Release Dinner ({dinnerEligible.length})</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}

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
                  <>
                    {/* Mobile Card List View */}
                    <div className="sm:hidden space-y-3">
                      {filteredSubscribers.length > 0 ? (
                        filteredSubscribers.map((sub) => {
                          const completed = sub.mealsUsed ?? (sub.totalMeals - sub.mealsRemaining);
                          return (
                            <div key={sub.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="font-black text-black text-sm truncate">
                                    {sub.userName || "Subscriber User"}
                                  </p>
                                  <p className="text-xs font-mono text-slate-500 truncate">{sub.userPhone || sub.userEmail}</p>
                                </div>
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold shrink-0 ${
                                    sub.status === "ACTIVE"
                                      ? "bg-[#E5A00D] text-black"
                                      : sub.status === "PAUSED"
                                      ? "bg-amber-100 text-amber-900 border border-amber-300"
                                      : "bg-slate-200 text-slate-700"
                                  }`}
                                >
                                  {sub.status}
                                </span>
                              </div>

                              <div className="bg-white rounded-xl p-3 border border-slate-100 space-y-1.5 text-xs">
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-500 font-bold">Meal Bowl:</span>
                                  <span className="font-extrabold text-black">{sub.mealName || "Custom Bowl Selection"}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-500 font-bold">Slot &amp; Start:</span>
                                  <span className="font-bold text-slate-800">{sub.mealTiming || "LUNCH"} • {sub.startDate || "Active"}</span>
                                </div>
                                <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                                  <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md text-[11px] font-black">
                                    {completed} Done
                                  </span>
                                  <span className="px-2 py-0.5 bg-amber-100 text-amber-950 border border-amber-300 rounded-md text-[11px] font-black">
                                    {sub.mealsRemaining} Pending
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReleaseSlot(sub.mealTiming === "DINNER" ? "DINNER" : "LUNCH");
                                    setReleasingSub(sub);
                                  }}
                                  disabled={sub.status !== "ACTIVE" || sub.mealsRemaining <= 0}
                                  className={`flex-1 flex items-center justify-center gap-1 py-2 font-black text-xs rounded-xl transition-all ${
                                    sub.status === "ACTIVE" && sub.mealsRemaining > 0
                                      ? "bg-[#E5A00D] text-black active:scale-95"
                                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                  }`}
                                >
                                  <Send size={12} />
                                  <span>Release</span>
                                </button>
                                <button
                                  onClick={() => setSelectedSub(sub)}
                                  className="flex items-center justify-center gap-1 px-3 py-2 bg-slate-200 text-black font-extrabold text-xs rounded-xl"
                                >
                                  <Eye size={14} /> View
                                </button>
                                {sub.status === "ACTIVE" && (
                                  <button
                                    onClick={() => handleUpdateSubscriber(sub.id, "PAUSED")}
                                    disabled={updatingSubId === sub.id}
                                    className="px-3 py-2 bg-amber-100 text-amber-900 font-bold text-xs rounded-xl border border-amber-300"
                                  >
                                    Pause
                                  </button>
                                )}
                                {sub.status === "PAUSED" && (
                                  <button
                                    onClick={() => handleUpdateSubscriber(sub.id, "ACTIVE")}
                                    disabled={updatingSubId === sub.id}
                                    className="px-3 py-2 bg-black text-white font-bold text-xs rounded-xl"
                                  >
                                    Resume
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-slate-500 font-medium text-xs">
                          No subscribers found. Click &quot;Add Offline Subscriber&quot; to import members.
                        </div>
                      )}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden sm:block overflow-x-auto">
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
                                      {/* Individual Release Order Button */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setReleaseSlot(sub.mealTiming === "DINNER" ? "DINNER" : "LUNCH");
                                          setReleasingSub(sub);
                                        }}
                                        disabled={sub.status !== "ACTIVE" || sub.mealsRemaining <= 0}
                                        title={
                                          sub.status !== "ACTIVE"
                                            ? "Plan is not active"
                                            : sub.mealsRemaining <= 0
                                            ? "No meals remaining"
                                            : "Release today's meal order to kitchen"
                                        }
                                        className={`flex items-center gap-1 px-2.5 py-1.5 font-black text-xs rounded-xl transition-all ${
                                          sub.status === "ACTIVE" && sub.mealsRemaining > 0
                                            ? "bg-[#E5A00D] hover:bg-black hover:text-[#E5A00D] text-black shadow-xs cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
                                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                        }`}
                                      >
                                        <Send size={12} />
                                        <span>Release</span>
                                      </button>

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
                  </>
                )}
              </div>
            )}

            {/* TAB 2: TODAY'S DELIVERY BATCHES */}
            {activeTab === "BATCHES" && (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl border-2 border-black bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 shadow-[3px_3px_0_#000] flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black text-[#E5A00D] border border-black flex items-center justify-center font-bold shrink-0">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-outfit font-black text-sm uppercase text-black">
                        Today&apos;s Synchronized Delivery Batches
                      </h3>
                      <p className="text-xs text-zinc-600 font-medium">
                        Daily online orders and subscription meals are grouped into location batches for synchronized dispatch.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fetchBatchesData()}
                      className="px-3.5 py-2 bg-white text-black hover:bg-zinc-100 font-bold text-xs rounded-xl border border-black shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <RefreshCw size={13} className={updatingBatchId ? "animate-spin text-[#E5A00D]" : ""} />
                      <span>Refresh Batches</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {deliveryBatchesList.length > 0 ? (
                    deliveryBatchesList.map((batch) => {
                      const isExpanded = expandedBatchId === batch.id;
                      return (
                        <div
                          key={batch.id}
                          className="bg-white border-2 border-black rounded-2xl p-5 shadow-[4px_4px_0_#000] flex flex-col justify-between space-y-4 relative"
                        >
                          {/* Batch Header */}
                          <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-outfit font-black text-base text-black">{batch.name}</span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-950 border border-amber-300 flex items-center gap-1">
                                  {batch.mealSlot === "DINNER" ? <Moon size={10} /> : <Sun size={10} />}
                                  {batch.mealSlot}
                                </span>
                              </div>
                              <p className="text-xs font-bold text-slate-500 mt-0.5 flex items-center gap-1">
                                <Clock size={12} className="text-[#E5A00D]" />
                                <span>Target Delivery: {batch.deliveryTime || "12:30 PM"}</span>
                              </p>
                            </div>

                            {/* Status Badge */}
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                                batch.status === "DELIVERED"
                                  ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                                  : batch.status === "DISPATCHED"
                                  ? "bg-blue-100 text-blue-900 border-blue-300"
                                  : batch.status === "PREPARING"
                                  ? "bg-amber-100 text-amber-900 border-amber-300"
                                  : "bg-slate-100 text-slate-700 border-slate-300"
                              }`}
                            >
                              {batch.status}
                            </span>
                          </div>

                          {/* Delivery Metrics Breakdown */}
                          <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                            <div>
                              <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Total Meals</span>
                              <span className="font-outfit font-black text-lg text-black">{batch.totalMeals}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-extrabold text-amber-800 uppercase block">Subs</span>
                              <span className="font-outfit font-black text-lg text-amber-950">{batch.subscriptionCount}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-extrabold text-blue-800 uppercase block">Daily</span>
                              <span className="font-outfit font-black text-lg text-blue-950">{batch.dailyOrderCount}</span>
                            </div>
                          </div>

                          {/* Delivery Partner Selector */}
                          <div className="space-y-1 text-xs">
                            <label className="font-bold text-slate-600 flex items-center justify-between">
                              <span>Assigned Delivery Partner</span>
                              {batch.assignedPartnerId && (
                                <span className="text-[10px] font-extrabold text-emerald-600 flex items-center gap-1">
                                  <UserCheck size={11} /> Assigned
                                </span>
                              )}
                            </label>
                            <select
                              value={batch.assignedPartnerId || ""}
                              onChange={(e) => handleAssignBatchPartner(batch.id, e.target.value)}
                              disabled={updatingBatchId === batch.id}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-black focus:border-[#E5A00D] outline-none"
                            >
                              <option value="">-- Unassigned --</option>
                              {deliveryPartnersList.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.fullName} ({p.phone})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Status Update & Dispatch Actions */}
                          <div className="space-y-2 pt-1 border-t border-slate-100">
                            <div className="flex items-center gap-2">
                              <select
                                value={batch.status}
                                onChange={(e) => handleUpdateBatchStatus(batch.id, e.target.value)}
                                disabled={updatingBatchId === batch.id}
                                className="flex-1 px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-black"
                              >
                                <option value="SCHEDULED">Status: SCHEDULED</option>
                                <option value="PREPARING">Status: PREPARING</option>
                                <option value="DISPATCHED">Status: DISPATCHED</option>
                                <option value="DELIVERED">Status: DELIVERED</option>
                              </select>

                              <button
                                onClick={() => handleDispatchBatch(batch.id, batch.name)}
                                disabled={batch.status === "DISPATCHED" || batch.status === "DELIVERED" || updatingBatchId === batch.id}
                                className={`px-3.5 py-2 rounded-xl font-outfit font-black text-xs uppercase tracking-wider border transition-all ${
                                  batch.status !== "DISPATCHED" && batch.status !== "DELIVERED"
                                    ? "bg-black text-[#E5A00D] hover:bg-neutral-800 border-black cursor-pointer shadow-xs"
                                    : "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed"
                                }`}
                              >
                                Dispatch Batch
                              </button>
                            </div>

                            {/* Toggle Manifest Deliveries Accordion */}
                            <button
                              onClick={() => setExpandedBatchId(isExpanded ? null : batch.id)}
                              className="w-full py-1.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center justify-between transition-colors cursor-pointer"
                            >
                              <span>View Customer Deliveries ({batch.deliveries.length})</span>
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>

                            {/* Manifest Deliveries List */}
                            {isExpanded && (
                              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 max-h-48 overflow-y-auto text-xs">
                                {batch.deliveries.length > 0 ? (
                                  batch.deliveries.map((d: any) => (
                                    <div key={d.id} className="p-2 bg-white rounded-lg border border-slate-200 space-y-1">
                                      <div className="flex items-center justify-between">
                                        <span className="font-bold text-black">{d.customerName || "Customer"}</span>
                                        <span
                                          className={`px-2 py-0.2 text-[9px] font-black rounded-md ${
                                            d.orderType === "SUBSCRIPTION"
                                              ? "bg-amber-100 text-amber-950 border border-amber-300"
                                              : "bg-blue-100 text-blue-950 border border-blue-300"
                                          }`}
                                        >
                                          {d.orderType === "SUBSCRIPTION" ? "SUBSCRIPTION" : "DAILY ORDER"}
                                        </span>
                                      </div>
                                      <p className="text-[11px] font-mono text-slate-500">{d.customerPhone}</p>
                                      <p className="text-[11px] text-slate-700 font-semibold truncate">{d.mealName || "Meal Bowl"}</p>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-[11px] text-slate-500 text-center py-2">
                                    No individual orders assigned to this batch yet.
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full text-center py-12 text-slate-500 font-medium">
                      No delivery batches configured for today.
                    </div>
                  )}
                </div>
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

                          {/* ON / OFF Interactive Toggle Switch */}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleTogglePricingActive(p)}
                              title={p.isActive ? "Click to Deactivate" : "Click to Activate"}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border ${
                                p.isActive
                                  ? "bg-emerald-500 text-white border-emerald-600 shadow-sm hover:bg-emerald-600"
                                  : "bg-slate-200 text-slate-600 border-slate-300 hover:bg-slate-300"
                              }`}
                            >
                              <Power size={11} className={p.isActive ? "text-white" : "text-slate-500"} />
                              <span>{p.isActive ? "ON" : "OFF"}</span>
                            </button>
                          </div>
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

                        <div className="flex items-center gap-2 pt-1">
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
                            className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-black font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                          <button
                            onClick={() => handleDeletePricing(p.id, p.mealName)}
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl border border-red-200 transition-colors flex items-center justify-center cursor-pointer"
                            title="Delete Per-Meal Pricing"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
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

                          {/* ON / OFF Interactive Toggle Switch */}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleTogglePackageActive(pkg)}
                              title={pkg.isActive ? "Click to Deactivate Plan" : "Click to Activate Plan"}
                              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border ${
                                pkg.isActive
                                  ? "bg-emerald-500 text-white border-emerald-600 shadow-sm hover:bg-emerald-600"
                                  : "bg-slate-200 text-slate-600 border-slate-300 hover:bg-slate-300"
                              }`}
                            >
                              <Power size={11} className={pkg.isActive ? "text-white" : "text-slate-500"} />
                              <span>{pkg.isActive ? "ACTIVE (ON)" : "INACTIVE (OFF)"}</span>
                            </button>
                          </div>
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
                            className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-black font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                          <button
                            onClick={() => handleDeletePackage(pkg.id, pkg.name)}
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl border border-red-200 transition-colors flex items-center justify-center cursor-pointer"
                            title="Delete Credit Package"
                          >
                            <Trash2 size={14} />
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

      {/* ════════════════════════════════════════════════════════════ */}
      {/* MODAL 3: MEAL PRICING FORM MODAL (Add / Edit)              */}
      {/* ════════════════════════════════════════════════════════════ */}
      {showPricingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border-2 border-black w-full max-w-md rounded-2xl p-6 space-y-6 relative overflow-hidden text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-lg font-black text-black uppercase tracking-tight flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#E5A00D]" />
                  {pricingForm.id ? "Edit Meal Subscription Cost" : "Add Meal Subscription Cost"}
                </h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  Configure discounted per-meal cost for subscriber billing.
                </p>
              </div>
              <button
                onClick={() => setShowPricingModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-black transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePricing} className="space-y-4 text-xs font-bold">
              <div>
                <label className="text-slate-700 block mb-1">Select Food Item *</label>
                <select
                  required
                  value={pricingForm.mealId}
                  onChange={(e) => setPricingForm((prev) => ({ ...prev, mealId: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-black focus:bg-white focus:border-[#E5A00D] outline-none"
                >
                  <option value="">Select a meal from catalog...</option>
                  {foodCatalog.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} (Regular Price: ₹{f.price})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 block mb-1">Subscription Price Per Meal (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={pricingForm.pricePerMeal}
                  onChange={(e) => setPricingForm((prev) => ({ ...prev, pricePerMeal: e.target.value }))}
                  placeholder="e.g. 55"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-black focus:bg-white focus:border-[#E5A00D] outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1 font-normal">
                  Rate charged per meal to subscribers. E.g. ₹55 instead of standard ₹60.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pricingIsActive"
                  checked={pricingForm.isActive}
                  onChange={(e) => setPricingForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-[#E5A00D] focus:ring-[#E5A00D]"
                />
                <label htmlFor="pricingIsActive" className="text-slate-800 text-xs font-bold cursor-pointer">
                  Active for subscribers
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowPricingModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#E5A00D] hover:bg-[#d4920b] text-black font-black text-xs rounded-xl border border-black/20 cursor-pointer"
                >
                  {pricingForm.id ? "Update Pricing" : "Save Pricing"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* MODAL 4: CREDIT PACKAGE FORM MODAL (Add / Edit)            */}
      {/* ════════════════════════════════════════════════════════════ */}
      {showPackageModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border-2 border-black w-full max-w-md rounded-2xl p-6 space-y-6 relative overflow-hidden text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-lg font-black text-black uppercase tracking-tight flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#E5A00D]" />
                  {packageForm.id ? "Edit Credit Package" : "Add Credit Package"}
                </h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  Package bundles e.g. 20, 30, or 60 meals with optional discounts.
                </p>
              </div>
              <button
                onClick={() => setShowPackageModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-black transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="space-y-4 text-xs font-bold">
              <div>
                <label className="text-slate-700 block mb-1">Package Name *</label>
                <input
                  type="text"
                  required
                  value={packageForm.name}
                  onChange={(e) => setPackageForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. 30 Meals / Month"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-black focus:bg-white focus:border-[#E5A00D] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1">Meal Credits *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={packageForm.mealCredits}
                    onChange={(e) => setPackageForm((prev) => ({ ...prev, mealCredits: e.target.value }))}
                    placeholder="e.g. 30"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-black focus:bg-white focus:border-[#E5A00D] outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1">Discount Savings (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={packageForm.discount}
                    onChange={(e) => setPackageForm((prev) => ({ ...prev, discount: e.target.value }))}
                    placeholder="e.g. 150"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-black focus:bg-white focus:border-[#E5A00D] outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="pkgIsFeatured"
                    checked={packageForm.isFeatured}
                    onChange={(e) => setPackageForm((prev) => ({ ...prev, isFeatured: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 text-[#E5A00D] focus:ring-[#E5A00D]"
                  />
                  <label htmlFor="pkgIsFeatured" className="text-slate-800 text-xs font-bold cursor-pointer">
                    Highlight as Most Popular Tier
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="pkgIsActive"
                    checked={packageForm.isActive}
                    onChange={(e) => setPackageForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 text-[#E5A00D] focus:ring-[#E5A00D]"
                  />
                  <label htmlFor="pkgIsActive" className="text-slate-800 text-xs font-bold cursor-pointer">
                    Active (visible in customer store)
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowPackageModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#E5A00D] hover:bg-[#d4920b] text-black font-black text-xs rounded-xl border border-black/20 cursor-pointer"
                >
                  {packageForm.id ? "Update Package" : "Save Package"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ── RELEASE ORDER CONFIRMATION MODAL ── */}
      {releasingSub && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border-2 border-black max-w-md w-full p-6 shadow-[6px_6px_0_#000] space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#E5A00D] text-black border border-black flex items-center justify-center font-bold">
                  <Rocket size={16} />
                </div>
                <div>
                  <h3 className="font-outfit font-black text-base uppercase text-black">
                    Release Subscription Meal
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-medium">
                    Send today's order to Kitchen &amp; Delivery queue
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReleasingSub(null)}
                className="text-slate-400 hover:text-black transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Subscriber Info Card */}
            <div className="bg-[#FFF8EE] border border-amber-200/80 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-black text-black text-sm block">
                    {releasingSub.userName || "Subscriber User"}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-600 block">
                    {releasingSub.userPhone}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-black text-[10px] uppercase">
                  {releasingSub.mealsRemaining} Credits Left
                </span>
              </div>

              <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-[11px]">
                <span className="text-zinc-600 font-medium">Meal Dish:</span>
                <span className="font-bold text-black">{releasingSub.mealName || "Standard Bowl"}</span>
              </div>

              {releasingSub.deliveryAddress && (
                <div className="flex items-start gap-1 text-[11px] text-zinc-600 pt-1">
                  <MapPin size={13} className="text-amber-800 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{releasingSub.deliveryAddress}</span>
                </div>
              )}
            </div>

            {/* Session Selection */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-black block">
                Select Meal Session for Today:
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setReleaseSlot("LUNCH")}
                  className={`p-3 rounded-xl border-2 font-outfit font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    releaseSlot === "LUNCH"
                      ? "border-black bg-[#E5A00D] text-black shadow-[2px_2px_0_#000]"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-black"
                  }`}
                >
                  <Sun size={15} />
                  <span>Lunch (12:00 PM)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReleaseSlot("DINNER")}
                  className={`p-3 rounded-xl border-2 font-outfit font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    releaseSlot === "DINNER"
                      ? "border-black bg-black text-[#E5A00D] shadow-[2px_2px_0_#E5A00D]"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-black"
                  }`}
                >
                  <Moon size={15} />
                  <span>Dinner (7:30 PM)</span>
                </button>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-[11px] text-slate-600 font-medium">
              💡 Releasing this order will deduct <strong>1 meal credit</strong> from the subscriber and place this meal into the <strong>Kitchen &amp; Delivery dashboard</strong>.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReleasingSub(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold text-xs hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingRelease}
                onClick={() => handleReleaseOrder("SINGLE")}
                className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-[#E5A00D] font-outfit font-black text-xs uppercase tracking-wider rounded-xl border border-black transition-all flex items-center gap-2 shadow-[2px_2px_0_#E5A00D]"
              >
                {submittingRelease ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Releasing...</span>
                  </>
                ) : (
                  <>
                    <Rocket size={14} />
                    <span>Confirm &amp; Release 🚀</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
