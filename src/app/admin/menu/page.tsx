"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "../components/AdminSidebar";
import { AdminNavbar } from "../components/AdminNavbar";
import {
  UtensilsCrossed,
  Calendar,
  Clock,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Search,
  Sun,
  Sunrise,
  Moon,
  Upload,
  X,
  Sparkles,
  Tag,
  Check,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  isActive: boolean;
}

interface FoodItem {
  id: string;
  categoryId: string;
  categoryName?: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  deliveryCharge?: number;
  calories: number;
  protein: string;
  isVeg: boolean;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" | "OTHER";
  isAvailable: boolean;
}

interface DailyMenuItem {
  id: string;
  foodItemId: string;
  name: string;
  price: number;
  imageUrl?: string;
  isVeg: boolean;
  mealType: string;
}

export default function AdminMenuPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"SCHEDULER" | "CATALOG" | "CATEGORIES">("SCHEDULER");

  // Date & Meal Timing Slot Filter States for Scheduler
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [selectedSlot, setSelectedSlot] = useState<string>("ALL");

  // Data States
  const [foodItemsList, setFoodItemsList] = useState<FoodItem[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [dailyMenuItems, setDailyMenuItems] = useState<DailyMenuItem[]>([]);
  const [dailyMenuActive, setDailyMenuActive] = useState<boolean>(true);
  const [selectedFoodIds, setSelectedFoodIds] = useState<string[]>([]);
  const [savingMenu, setSavingMenu] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("ALL");

  // Create/Edit Food Item Modal
  const [showItemModal, setShowItemModal] = useState(false);
  const [itemForm, setItemForm] = useState({
    id: "",
    categoryId: "",
    name: "",
    description: "",
    imageUrl: "",
    price: "",
    deliveryCharge: "",
    calories: "520",
    protein: "32g",
    isVeg: true,
    mealType: "LUNCH",
    isAvailable: true,
  });

  // Create Category Modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryNameInput, setCategoryNameInput] = useState("");

  // 1. Fetch Food Catalog & Categories
  async function fetchCatalogAndCategories() {
    try {
      const [itemsRes, catRes] = await Promise.all([
        fetch("/api/admin/food-items"),
        fetch("/api/admin/categories"),
      ]);

      if (itemsRes.ok) {
        const data = await itemsRes.json();
        setFoodItemsList(Array.isArray(data) ? data : []);
      }
      if (catRes.ok) {
        const catData = await catRes.json();
        const cats = Array.isArray(catData) ? catData : [];
        setCategoriesList(cats);
        if (cats.length > 0 && !itemForm.categoryId) {
          setItemForm((prev) => ({ ...prev, categoryId: cats[0].id }));
        }
      }
    } catch (err) {
      console.error("Error fetching catalog:", err);
    }
  }

  // 2. Fetch Daily Menu Availability for Selected Date
  async function fetchDailyMenu(dateStr: string) {
    try {
      const res = await fetch(`/api/admin/menu?date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        const items: DailyMenuItem[] = data.items || [];
        setDailyMenuItems(items);
        setDailyMenuActive(data.isActive !== undefined ? data.isActive : true);
        setSelectedFoodIds(items.map((i) => i.foodItemId));
      }
    } catch (err) {
      console.error("Error fetching daily menu:", err);
    }
  }

  async function loadInitialData(isManual = false) {
    if (isManual) setRefreshing(true);
    await Promise.all([fetchCatalogAndCategories(), fetchDailyMenu(selectedDate)]);
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    fetchDailyMenu(selectedDate);
  }, [selectedDate]);

  // Save Daily Scheduled Menu (Date & Slot Availability)
  async function handleSaveDailyMenu() {
    setSavingMenu(true);
    try {
      const res = await fetch("/api/admin/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          isActive: dailyMenuActive,
          selectedFoodItemIds: selectedFoodIds,
        }),
      });
      if (res.ok) {
        await fetchDailyMenu(selectedDate);
      }
    } catch (err) {
      console.error("Error saving daily menu:", err);
    } font: {
      setSavingMenu(false);
    }
  }

  function toggleFoodSelection(foodId: string) {
    setSelectedFoodIds((prev) =>
      prev.includes(foodId) ? prev.filter((id) => id !== foodId) : [...prev, foodId]
    );
  }

  // Save Food Item (Create or Edit)
  async function handleSaveFoodItem(e: React.FormEvent) {
    e.preventDefault();
    if (!itemForm.name || !itemForm.categoryId || !itemForm.price) return;

    try {
      const isEdit = Boolean(itemForm.id);
      const url = "/api/admin/food-items";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: itemForm.id || undefined,
          categoryId: itemForm.categoryId,
          name: itemForm.name,
          description: itemForm.description,
          imageUrl: itemForm.imageUrl,
          price: Number(itemForm.price),
          deliveryCharge: itemForm.deliveryCharge !== "" ? Number(itemForm.deliveryCharge) : 0,
          calories: Number(itemForm.calories) || 520,
          protein: itemForm.protein || "30g",
          isVeg: itemForm.isVeg,
          mealType: itemForm.mealType || "LUNCH",
          isAvailable: itemForm.isAvailable,
        }),
      });

      if (res.ok) {
        setShowItemModal(false);
        setItemForm({
          id: "",
          categoryId: categoriesList[0]?.id || "",
          name: "",
          description: "",
          imageUrl: "",
          price: "",
          deliveryCharge: "",
          calories: "520",
          protein: "32g",
          isVeg: true,
          mealType: "LUNCH",
          isAvailable: true,
        });
        fetchCatalogAndCategories();
      }
    } catch (err) {
      console.error("Error saving food item:", err);
    }
  }

  // Save Category
  async function handleSaveCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryNameInput.trim()) return;

    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: categoryNameInput.trim(), isActive: true }),
      });
      if (res.ok) {
        setShowCategoryModal(false);
        setCategoryNameInput("");
        fetchCatalogAndCategories();
      }
    } catch (err) {
      console.error("Error saving category:", err);
    }
  }

  // Toggle Food Item Availability
  async function handleToggleItemAvailability(id: string, currentStatus: boolean) {
    try {
      const res = await fetch("/api/admin/food-items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isAvailable: !currentStatus }),
      });
      if (res.ok) {
        fetchCatalogAndCategories();
      }
    } catch (err) {
      console.error("Error toggling item availability:", err);
    }
  }

  // Filter Catalog List
  const filteredCatalog = foodItemsList.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      item.name.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q));

    const matchesCategory =
      selectedCategoryFilter === "ALL" || item.categoryId === selectedCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Filter Scheduler Catalog List by selectedSlot
  const filteredSchedulerCatalog = foodItemsList.filter((item) => {
    if (selectedSlot === "ALL") return true;
    return item.mealType === selectedSlot;
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
                Menu Management &amp; Daily Availability Scheduler
              </h1>
              <p className="text-sm font-bold text-slate-600 mt-1">
                Schedule date-wise &amp; meal timing availability for breakfast, lunch, and dinner.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => loadInitialData(true)}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-black font-bold text-xs rounded-xl border border-slate-300 transition-colors shadow-sm disabled:opacity-50"
              >
                <RefreshCw size={14} className={refreshing ? "animate-spin text-[#E5A00D]" : ""} />
                {refreshing ? "Syncing..." : "Sync Catalog"}
              </button>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* SUMMARY KPI CARDS                                            */}
          {/* ════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:border-[#E5A00D] transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Total Catalog Dishes
                </span>
                <div className="h-10 w-10 rounded-xl bg-[#E5A00D] text-black flex items-center justify-center font-bold">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-black text-black">{foodItemsList.length}</span>
                <span className="text-xs font-bold text-slate-500">Master Items</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:border-[#E5A00D] transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Scheduled Today
                </span>
                <div className="h-10 w-10 rounded-xl bg-black text-[#E5A00D] flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-black text-black">{dailyMenuItems.length}</span>
                <span className="text-xs font-bold text-[#E5A00D] bg-amber-50 px-2 py-0.5 rounded-full">
                  {selectedDate}
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:border-[#E5A00D] transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Breakfast Items
                </span>
                <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-center font-bold">
                  <Sunrise className="w-5 h-5 text-[#E5A00D]" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-black text-black">
                  {foodItemsList.filter((i) => i.mealType === "BREAKFAST").length}
                </span>
                <span className="text-xs font-bold text-slate-500">Morning Slot</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:border-[#E5A00D] transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Lunch &amp; Dinner Items
                </span>
                <div className="h-10 w-10 rounded-xl bg-black text-white flex items-center justify-center font-bold">
                  <Moon className="w-5 h-5 text-[#E5A00D]" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-black text-black">
                  {foodItemsList.filter((i) => i.mealType === "LUNCH" || i.mealType === "DINNER").length}
                </span>
                <span className="text-xs font-bold text-slate-500">Peak Slots</span>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* MAIN TABS: DAILY SCHEDULER vs MASTER CATALOG vs CATEGORIES   */}
          {/* ════════════════════════════════════════════════════════════ */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("SCHEDULER")}
                  className={`px-4 py-2 text-xs font-black rounded-xl transition-colors ${activeTab === "SCHEDULER"
                      ? "bg-[#E5A00D] text-black shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                >
                  Date &amp; Timing Availability Planner
                </button>

                <button
                  onClick={() => setActiveTab("CATALOG")}
                  className={`px-4 py-2 text-xs font-black rounded-xl transition-colors ${activeTab === "CATALOG"
                      ? "bg-[#E5A00D] text-black shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                >
                  Master Food Catalog ({foodItemsList.length})
                </button>

                <button
                  onClick={() => setActiveTab("CATEGORIES")}
                  className={`px-4 py-2 text-xs font-black rounded-xl transition-colors ${activeTab === "CATEGORIES"
                      ? "bg-[#E5A00D] text-black shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                >
                  Categories ({categoriesList.length})
                </button>
              </div>

              {activeTab === "CATALOG" && (
                <button
                  onClick={() => {
                    setItemForm({
                      id: "",
                      categoryId: categoriesList[0]?.id || "",
                      name: "",
                      description: "",
                      imageUrl: "",
                      price: "",
                      deliveryCharge: "",
                      calories: "520",
                      protein: "32g",
                      isVeg: true,
                      mealType: "LUNCH",
                      isAvailable: true,
                    });
                    setShowItemModal(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-neutral-800 text-[#E5A00D] font-black text-xs rounded-xl shadow-sm transition-colors"
                >
                  <Plus size={16} /> Add New Dish Item
                </button>
              )}

              {activeTab === "CATEGORIES" && (
                <button
                  onClick={() => {
                    setCategoryNameInput("");
                    setShowCategoryModal(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-neutral-800 text-[#E5A00D] font-black text-xs rounded-xl shadow-sm transition-colors"
                >
                  <Plus size={16} /> Add Category
                </button>
              )}
            </div>

            {/* ════════════════════════════════════════════════════════════ */}
            {/* TAB 1: DATE & MEAL TIMINGS AVAILABILITY SCHEDULER            */}
            {/* ════════════════════════════════════════════════════════════ */}
            {activeTab === "SCHEDULER" && (
              <div className="space-y-6">
                {/* Date Picker & Slot Filters Header Bar */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Calendar size={18} className="text-[#E5A00D]" />
                    <span className="font-black text-xs text-black uppercase">Select Menu Date:</span>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-xs text-black outline-none focus:border-[#E5A00D]"
                    />
                  </div>

                  {/* Meal Slot Timing Filters */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-500 mr-1">Meal Timing Slot:</span>
                    {[
                      { id: "ALL", label: "All Slots" },
                      { id: "BREAKFAST", label: "Sunrise Breakfast" },
                      { id: "LUNCH", label: "Midday Lunch" },
                      { id: "DINNER", label: "Night Dinner" },
                      { id: "SNACK", label: "Snacks" },
                    ].map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot.id)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${selectedSlot === slot.id
                            ? "bg-black text-[#E5A00D]"
                            : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
                          }`}
                      >
                        {slot.label}
                      </button>
                    ))}
                  </div>

                  {/* Save Schedule Action Button */}
                  <button
                    onClick={handleSaveDailyMenu}
                    disabled={savingMenu}
                    className="flex items-center gap-1.5 px-5 py-2 bg-[#E5A00D] hover:bg-amber-500 text-black font-black text-xs rounded-xl shadow-md transition-colors disabled:opacity-50"
                  >
                    {savingMenu ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    Save Schedule for {selectedDate}
                  </button>
                </div>

                {/* Available Dishes Checklist */}
                {loading ? (
                  <div className="flex justify-center py-12 text-[#E5A00D]">
                    <Loader2 size={32} className="animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-black uppercase tracking-wider">
                        Toggle Available Dishes for {selectedDate} ({selectedFoodIds.length} Selected)
                      </span>
                      <button
                        onClick={() =>
                          setSelectedFoodIds(
                            selectedFoodIds.length === foodItemsList.length
                              ? []
                              : foodItemsList.map((i) => i.id)
                          )
                        }
                        className="text-xs font-bold text-black hover:text-[#E5A00D]"
                      >
                        {selectedFoodIds.length === foodItemsList.length ? "Deselect All" : "Select All Dishes"}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredSchedulerCatalog.map((dish) => {
                        const isSelected = selectedFoodIds.includes(dish.id);

                        return (
                          <div
                            key={dish.id}
                            onClick={() => toggleFoodSelection(dish.id)}
                            className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${isSelected
                                ? "border-[#E5A00D] bg-amber-50/40 shadow-sm"
                                : "border-slate-200 bg-white hover:bg-slate-50"
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`h-6 w-6 rounded-md flex items-center justify-center font-bold text-xs border transition-colors ${isSelected
                                    ? "bg-[#E5A00D] text-black border-amber-400"
                                    : "bg-white border-slate-300 text-transparent"
                                  }`}
                              >
                                ✓
                              </div>
                              <div>
                                <p className="font-extrabold text-xs text-black">{dish.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] font-bold text-slate-500">₹{dish.price}</span>
                                  <span className="text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                                    {dish.mealType}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${isSelected ? "bg-black text-[#E5A00D]" : "bg-slate-100 text-slate-500"
                                }`}
                            >
                              {isSelected ? "Available" : "Off"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════ */}
            {/* TAB 2: MASTER FOOD CATALOG DISH ITEMS                        */}
            {/* ════════════════════════════════════════════════════════════ */}
            {activeTab === "CATALOG" && (
              <div className="space-y-4">
                {/* Search & Category Filter Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="relative w-full sm:w-72">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search dish name, description..."
                      className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#E5A00D] focus:bg-white text-black font-medium"
                    />
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto">
                    <button
                      onClick={() => setSelectedCategoryFilter("ALL")}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg ${selectedCategoryFilter === "ALL"
                          ? "bg-black text-[#E5A00D]"
                          : "bg-slate-100 text-slate-700"
                        }`}
                    >
                      All Categories
                    </button>
                    {categoriesList.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategoryFilter(cat.id)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap ${selectedCategoryFilter === cat.id
                            ? "bg-black text-[#E5A00D]"
                            : "bg-slate-100 text-slate-700"
                          }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Catalog Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCatalog.length > 0 ? (
                    filteredCatalog.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-sm hover:border-[#E5A00D] transition-colors relative flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-black px-2 py-0.5 rounded-full">
                                {item.categoryName || "Dish"}
                              </span>
                              <h4 className="font-black text-base text-black mt-1">{item.name}</h4>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase shrink-0 ${item.isVeg ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                                }`}
                            >
                              {item.isVeg ? "VEG" : "NON-VEG"}
                            </span>
                          </div>

                          <p className="text-xs text-slate-500 line-clamp-2">{item.description || "Fresh crafted recipe bowl."}</p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-500">{item.calories} kcal • {item.protein}</span>
                            <div className="text-right">
                              <span className="text-black font-black text-base">₹{item.price}</span>
                              {item.deliveryCharge !== undefined && Number(item.deliveryCharge) > 0 && (
                                <span className="block text-[10px] text-amber-600 font-semibold">+₹{item.deliveryCharge} delivery</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => {
                                setItemForm({
                                  id: item.id,
                                  categoryId: item.categoryId,
                                  name: item.name,
                                  description: item.description || "",
                                  imageUrl: item.imageUrl || "",
                                  price: String(item.price),
                                  deliveryCharge: item.deliveryCharge !== undefined && item.deliveryCharge !== null ? String(item.deliveryCharge) : "",
                                  calories: String(item.calories || 520),
                                  protein: item.protein || "32g",
                                  isVeg: item.isVeg,
                                  mealType: item.mealType || "LUNCH",
                                  isAvailable: item.isAvailable,
                                });
                                setShowItemModal(true);
                              }}
                              className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-black font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1"
                            >
                              <Edit2 size={14} /> Edit
                            </button>

                            <button
                              onClick={() => handleToggleItemAvailability(item.id, item.isAvailable)}
                              className={`px-3 py-1.5 font-bold text-xs rounded-xl transition-colors ${item.isAvailable
                                  ? "bg-black text-[#E5A00D]"
                                  : "bg-slate-200 text-slate-600"
                                }`}
                            >
                              {item.isAvailable ? "Available" : "Disabled"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12 text-slate-500 font-medium">
                      No food catalog items found. Click &quot;Add New Dish Item&quot; to create menu items.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════ */}
            {/* TAB 3: CATEGORIES MANAGER                                    */}
            {/* ════════════════════════════════════════════════════════════ */}
            {activeTab === "CATEGORIES" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoriesList.map((cat) => (
                    <div
                      key={cat.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-sm"
                    >
                      <span className="font-black text-sm text-black">{cat.name}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${cat.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                          }`}
                      >
                        {cat.isActive ? "Active" : "Hidden"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* MODAL: CREATE / EDIT FOOD ITEM                               */}
      {/* ════════════════════════════════════════════════════════════ */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-300 w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4 relative text-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-black text-black">
                {itemForm.id ? "Edit Dish Item" : "Create New Dish Item"}
              </h3>
              <button onClick={() => setShowItemModal(false)} className="text-slate-400 hover:text-black">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveFoodItem} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-black uppercase tracking-wider mb-1">
                    Dish Name
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Paneer Tikka Bowl"
                    value={itemForm.name}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-black outline-none focus:border-[#E5A00D]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-black uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    required
                    value={itemForm.categoryId}
                    onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-black outline-none focus:border-[#E5A00D]"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-black uppercase tracking-wider mb-1">
                    Price (₹)
                  </label>
                  <input
                    required
                    type="number"
                    placeholder="180"
                    value={itemForm.price}
                    onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-black outline-none focus:border-[#E5A00D]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-black uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Delivery (₹)</span>
                    <span className="text-[10px] text-slate-400 font-semibold lowercase">optional</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={itemForm.deliveryCharge}
                    onChange={(e) => setItemForm({ ...itemForm, deliveryCharge: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-black outline-none focus:border-[#E5A00D]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-black uppercase tracking-wider mb-1">
                    Calories (kcal)
                  </label>
                  <input
                    type="number"
                    placeholder="520"
                    value={itemForm.calories}
                    onChange={(e) => setItemForm({ ...itemForm, calories: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-black outline-none focus:border-[#E5A00D]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-black uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Fresh ingredients, high protein bowl recipe..."
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-black outline-none focus:border-[#E5A00D]"
                />
              </div>

              <div>
                <label className="block font-bold text-black uppercase tracking-wider mb-1">
                  Image URL
                </label>
                <input
                  type="text"
                  placeholder="/paneer_bowl_new.png or public URL"
                  value={itemForm.imageUrl}
                  onChange={(e) => setItemForm({ ...itemForm, imageUrl: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-black outline-none focus:border-[#E5A00D]"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isVegCheck"
                    checked={itemForm.isVeg}
                    onChange={(e) => setItemForm({ ...itemForm, isVeg: e.target.checked })}
                    className="h-4 w-4 accent-[#E5A00D]"
                  />
                  <label htmlFor="isVegCheck" className="font-bold text-black">
                    Vegetarian Dish
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isAvailableCheck"
                    checked={itemForm.isAvailable}
                    onChange={(e) => setItemForm({ ...itemForm, isAvailable: e.target.checked })}
                    className="h-4 w-4 accent-[#E5A00D]"
                  />
                  <label htmlFor="isAvailableCheck" className="font-bold text-black">
                    Available in Catalog
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-black font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-black hover:bg-neutral-800 text-[#E5A00D] font-black rounded-xl shadow-sm"
                >
                  Save Dish Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* MODAL: CREATE CATEGORY                                       */}
      {/* ════════════════════════════════════════════════════════════ */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-300 w-full max-w-sm rounded-2xl shadow-2xl p-6 space-y-4 relative text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-black text-black">Add Food Category</h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-black">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-black uppercase tracking-wider mb-1">
                  Category Name
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Protein Bowls, Biryani, Salads"
                  value={categoryNameInput}
                  onChange={(e) => setCategoryNameInput(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-black outline-none focus:border-[#E5A00D]"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-black font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-black hover:bg-neutral-800 text-[#E5A00D] font-black rounded-xl shadow-sm"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
