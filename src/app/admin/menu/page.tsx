"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "../components/AdminSidebar";
import { AdminNavbar } from "../components/AdminNavbar";
import {
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Search,
  Upload,
  X,
  Tag,
  AlertTriangle,
  Save,
  Eye,
  EyeOff,
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

export default function AdminMenuPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingBatch, setSavingBatch] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<"CATALOG" | "CATEGORIES">("CATALOG");

  // Data States
  const [foodItemsList, setFoodItemsList] = useState<FoodItem[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);

  // Toast Banner State
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("ALL");
  const [availabilityFilter, setAvailabilityFilter] = useState<"ALL" | "AVAILABLE" | "UNAVAILABLE">("ALL");

  // Create/Edit Food Item Modal State
  const [showItemModal, setShowItemModal] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
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

  // Create Category Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryNameInput, setCategoryNameInput] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);

  // Delete Food Item Modal State
  const [foodToDelete, setFoodToDelete] = useState<FoodItem | null>(null);
  const [deletingFood, setDeletingFood] = useState(false);

  // Delete Category Modal State
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState(false);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }

  // 1. Fetch Food Catalog & Categories
  async function fetchCatalogAndCategories(isManual = false) {
    if (isManual) setRefreshing(true);
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
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error("Error fetching menu catalog:", err);
      showToast("error", "Failed to load menu catalog from database.");
    } font: {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchCatalogAndCategories();
  }, []);

  // Toggle Single Food Item Availability in UI state (Optimistic)
  function handleToggleAvailability(id: string) {
    setFoodItemsList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isAvailable: !item.isAvailable } : item
      )
    );
    setHasUnsavedChanges(true);
  }

  // Batch Save Availability Modifications to Database
  async function handleSaveAllAvailability() {
    setSavingBatch(true);
    try {
      const res = await fetch("/api/admin/food-items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: foodItemsList.map((item) => ({
            id: item.id,
            isAvailable: item.isAvailable,
          })),
        }),
      });

      if (res.ok) {
        showToast("success", "✓ Menu availability successfully updated in database!");
        setHasUnsavedChanges(false);
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast("error", errData.error || "Failed to save availability changes.");
      }
    } catch (err) {
      console.error("Error batch saving availability:", err);
      showToast("error", "Network error while saving menu changes.");
    } finally {
      setSavingBatch(false);
    }
  }

  // Image File Upload Handler (Supabase Storage)
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "meals");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setItemForm((prev) => ({ ...prev, imageUrl: data.publicUrl }));
        showToast("success", "Dish image uploaded successfully!");
      } else {
        const err = await res.json().catch(() => ({}));
        showToast("error", err.error || "Failed to upload image.");
      }
    } catch (err) {
      console.error("Image upload error:", err);
      showToast("error", "Error uploading image file.");
    } finally {
      setUploadingImage(false);
    }
  }

  // Save Food Item (Create or Edit)
  async function handleSaveFoodItem(e: React.FormEvent) {
    e.preventDefault();
    if (!itemForm.name.trim() || !itemForm.categoryId || !itemForm.price) {
      showToast("error", "Please fill in Dish Name, Category, and Price.");
      return;
    }

    setSavingItem(true);
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
          name: itemForm.name.trim(),
          description: itemForm.description.trim(),
          imageUrl: itemForm.imageUrl || null,
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
        showToast("success", isEdit ? "✓ Dish updated successfully!" : "✓ New dish created!");
        fetchCatalogAndCategories();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast("error", err.error || "Failed to save dish.");
      }
    } catch (err) {
      console.error("Error saving food item:", err);
      showToast("error", "Failed to save dish.");
    } finally {
      setSavingItem(false);
    }
  }

  // Save Category
  async function handleSaveCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryNameInput.trim()) return;

    setSavingCategory(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: categoryNameInput.trim(), isActive: true }),
      });

      if (res.ok) {
        setShowCategoryModal(false);
        setCategoryNameInput("");
        showToast("success", `✓ Category "${categoryNameInput.trim()}" created!`);
        fetchCatalogAndCategories();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast("error", err.error || "Failed to create category.");
      }
    } catch (err) {
      console.error("Error saving category:", err);
      showToast("error", "Error creating category.");
    } finally {
      setSavingCategory(false);
    }
  }

  // Execute Food Item Permanent Deletion
  async function handleConfirmDeleteFood() {
    if (!foodToDelete) return;
    setDeletingFood(true);

    try {
      const res = await fetch(`/api/admin/food-items?id=${foodToDelete.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setFoodItemsList((prev) => prev.filter((item) => item.id !== foodToDelete.id));
        showToast("success", `✓ Deleted "${foodToDelete.name}" permanently.`);
        setFoodToDelete(null);
      } else {
        const err = await res.json().catch(() => ({}));
        showToast("error", err.error || "Failed to delete food item.");
      }
    } catch (err) {
      console.error("Error deleting dish:", err);
      showToast("error", "Network error while deleting dish.");
    } finally {
      setDeletingFood(false);
    }
  }

  // Execute Category Deletion
  async function handleConfirmDeleteCategory() {
    if (!categoryToDelete) return;
    setDeletingCategory(true);

    try {
      const res = await fetch(`/api/admin/categories?id=${categoryToDelete.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setCategoriesList((prev) => prev.filter((cat) => cat.id !== categoryToDelete.id));
        showToast("success", `✓ Category "${categoryToDelete.name}" deleted.`);
        setCategoryToDelete(null);
      } else {
        const err = await res.json().catch(() => ({}));
        showToast("error", err.error || "Failed to delete category.");
      }
    } catch (err) {
      console.error("Error deleting category:", err);
      showToast("error", "Network error while deleting category.");
    } finally {
      setDeletingCategory(false);
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

    const matchesAvailability =
      availabilityFilter === "ALL" ||
      (availabilityFilter === "AVAILABLE" && item.isAvailable) ||
      (availabilityFilter === "UNAVAILABLE" && !item.isAvailable);

    return matchesSearch && matchesCategory && matchesAvailability;
  });

  const availableCount = foodItemsList.filter((i) => i.isAvailable).length;
  const unavailableCount = foodItemsList.length - availableCount;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative">
      {/* ── Fixed Left Sidebar ── */}
      <AdminSidebar />

      {/* ── Main Content Area ── */}
      <div className="pl-64 flex flex-col min-h-screen bg-slate-50">
        {/* ── Sticky Top Navbar ── */}
        <AdminNavbar />

        {/* ── Toast Notification Banner ── */}
        {toast && (
          <div
            className={`fixed top-4 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-3 transition-all transform animate-in fade-in slide-in-from-top-4 ${
              toast.type === "success"
                ? "bg-emerald-950 border-emerald-500 text-emerald-100 font-bold"
                : "bg-rose-950 border-rose-500 text-rose-100 font-bold"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            ) : (
              <XCircle size={18} className="text-rose-400 shrink-0" />
            )}
            <span className="text-sm">{toast.message}</span>
          </div>
        )}

        {/* ── Page Body ── */}
        <main className="flex-1 p-8 space-y-8 bg-slate-50">
          {/* Top Page Header & Main Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-black tracking-tight uppercase flex items-center gap-2">
                <UtensilsCrossed className="w-8 h-8 text-[#E5A00D]" />
                Menu &amp; Availability Management
              </h1>
              <p className="text-sm font-bold text-slate-500 mt-1">
                Toggle live dish availability for today&apos;s menu. Available dishes sync instantly to user search, home recommendations &amp; ordering.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => fetchCatalogAndCategories(true)}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 transition-colors shadow-sm disabled:opacity-50"
              >
                <RefreshCw size={14} className={refreshing ? "animate-spin text-[#E5A00D]" : ""} />
                {refreshing ? "Syncing..." : "Sync Database"}
              </button>

              <button
                onClick={handleSaveAllAvailability}
                disabled={savingBatch || !hasUnsavedChanges}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs transition-all shadow-md ${
                  hasUnsavedChanges
                    ? "bg-[#E5A00D] hover:bg-amber-500 text-black animate-pulse"
                    : "bg-slate-800 text-slate-400 opacity-60 cursor-not-allowed"
                }`}
              >
                {savingBatch ? (
                  <Loader2 size={15} className="animate-spin text-black" />
                ) : (
                  <Save size={15} />
                )}
                {hasUnsavedChanges ? "Save Availability Changes" : "Availability Saved"}
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
                  Total Master Dishes
                </span>
                <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 text-[#E5A00D] flex items-center justify-center font-bold">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-black text-black">{foodItemsList.length}</span>
                <span className="text-xs font-bold text-slate-500">Master Catalog</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:border-emerald-500 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Available Today
                </span>
                <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center font-bold">
                  <Eye className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-black text-emerald-600">{availableCount}</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Visible to Users
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:border-slate-400 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Unavailable Dishes
                </span>
                <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center font-bold">
                  <EyeOff className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-black text-slate-600">{unavailableCount}</span>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  Hidden from Users
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:border-[#E5A00D] transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Food Categories
                </span>
                <div className="h-10 w-10 rounded-xl bg-black text-[#E5A00D] flex items-center justify-center font-bold">
                  <Tag className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-black text-black">{categoriesList.length}</span>
                <span className="text-xs font-bold text-slate-500">Active Groups</span>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* MAIN TABS & ACTIONS                                         */}
          {/* ════════════════════════════════════════════════════════════ */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("CATALOG")}
                  className={`px-5 py-2.5 text-xs font-black rounded-xl transition-all ${
                    activeTab === "CATALOG"
                      ? "bg-[#E5A00D] text-black shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Menu Dishes &amp; Availability ({foodItemsList.length})
                </button>

                <button
                  onClick={() => setActiveTab("CATEGORIES")}
                  className={`px-5 py-2.5 text-xs font-black rounded-xl transition-all ${
                    activeTab === "CATEGORIES"
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
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-black hover:bg-neutral-800 text-[#E5A00D] font-black text-xs rounded-xl shadow-sm transition-colors"
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
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-black hover:bg-neutral-800 text-[#E5A00D] font-black text-xs rounded-xl shadow-sm transition-colors"
                >
                  <Plus size={16} /> Add Category
                </button>
              )}
            </div>

            {/* ════════════════════════════════════════════════════════════ */}
            {/* TAB 1: MENU DISHES & AVAILABILITY                             */}
            {/* ════════════════════════════════════════════════════════════ */}
            {activeTab === "CATALOG" && (
              <div className="space-y-6">
                {/* Search & Category Filter Bar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search dish by name or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-black outline-none focus:border-[#E5A00D] transition-colors"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {/* Category Filter */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 uppercase">Category:</span>
                      <select
                        value={selectedCategoryFilter}
                        onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                        className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-black outline-none focus:border-[#E5A00D]"
                      >
                        <option value="ALL">All Categories</option>
                        {categoriesList.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Availability Filter */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 uppercase">Status:</span>
                      <select
                        value={availabilityFilter}
                        onChange={(e) => setAvailabilityFilter(e.target.value as any)}
                        className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-black outline-none focus:border-[#E5A00D]"
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="AVAILABLE">Available Only</option>
                        <option value="UNAVAILABLE">Unavailable Only</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Dish Grid List */}
                {loading ? (
                  <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-[#E5A00D]" />
                    <p className="text-xs font-bold text-slate-500">Loading master food catalog...</p>
                  </div>
                ) : filteredCatalog.length === 0 ? (
                  <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                    <UtensilsCrossed className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-600">No menu items found.</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting search query or filters.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCatalog.map((item) => {
                      const category = categoriesList.find((c) => c.id === item.categoryId);
                      const displayImg =
                        item.imageUrl ||
                        (item.isVeg ? "/paneer_bowl_new.png" : "/biryani_handi_slider.jpg");

                      return (
                        <div
                          key={item.id}
                          className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-all flex flex-col justify-between ${
                            item.isAvailable
                              ? "border-slate-200 hover:border-[#E5A00D]"
                              : "border-slate-200 bg-slate-50/70 opacity-70"
                          }`}
                        >
                          <div>
                            {/* Card Top Banner / Image */}
                            <div className="relative h-44 w-full bg-slate-100 overflow-hidden group">
                              <img
                                src={displayImg}
                                alt={item.name}
                                className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                                  !item.isAvailable ? "grayscale-[20%]" : ""
                                }`}
                              />

                              {/* Veg / Non-Veg Badge */}
                              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider border border-white/40 flex items-center gap-1.5 shadow-sm">
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    item.isVeg ? "bg-emerald-500" : "bg-rose-500"
                                  }`}
                                />
                                <span className={item.isVeg ? "text-emerald-700" : "text-rose-700"}>
                                  {item.isVeg ? "PURE VEG" : "NON-VEG"}
                                </span>
                              </div>

                              {/* Category Badge */}
                              <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md text-[#E5A00D] px-2.5 py-1 rounded-full text-[10px] font-black border border-white/10 shadow-sm">
                                {category?.name || item.categoryName || "Artisan Bowl"}
                              </div>

                              {/* Action Overlay Buttons */}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                <button
                                  onClick={() => {
                                    setItemForm({
                                      id: item.id,
                                      categoryId: item.categoryId,
                                      name: item.name,
                                      description: item.description || "",
                                      imageUrl: item.imageUrl || "",
                                      price: String(item.price),
                                      deliveryCharge:
                                        item.deliveryCharge !== undefined
                                          ? String(item.deliveryCharge)
                                          : "0",
                                      calories: String(item.calories || 520),
                                      protein: item.protein || "30g",
                                      isVeg: item.isVeg,
                                      mealType: item.mealType || "LUNCH",
                                      isAvailable: item.isAvailable,
                                    });
                                    setShowItemModal(true);
                                  }}
                                  className="p-2.5 bg-white text-black rounded-xl hover:bg-[#E5A00D] font-bold text-xs shadow-md transition-colors flex items-center gap-1"
                                >
                                  <Edit2 size={14} /> Edit
                                </button>

                                <button
                                  onClick={() => setFoodToDelete(item)}
                                  className="p-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-bold text-xs shadow-md transition-colors flex items-center gap-1"
                                >
                                  <Trash2 size={14} /> Delete
                                </button>
                              </div>
                            </div>

                            {/* Card Content Details */}
                            <div className="p-5 space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="font-black text-base text-black leading-snug">
                                  {item.name}
                                </h3>
                                <span className="font-black text-lg text-black bg-amber-50 px-2.5 py-0.5 rounded-xl border border-amber-200">
                                  ₹{item.price}
                                </span>
                              </div>

                              {item.description && (
                                <p className="text-xs font-medium text-slate-500 line-clamp-2">
                                  {item.description}
                                </p>
                              )}

                              <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400 pt-1">
                                <span>🔥 {item.calories} kcal</span>
                                <span>•</span>
                                <span>💪 {item.protein}</span>
                              </div>
                            </div>
                          </div>

                          {/* Card Footer: Interactive Availability Toggle Switch */}
                          <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {item.isAvailable ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <CheckCircle2 size={12} className="text-emerald-600" />
                                  Available
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-slate-200 text-slate-600 border border-slate-300">
                                  <XCircle size={12} className="text-slate-500" />
                                  Unavailable
                                </span>
                              )}
                            </div>

                            {/* Toggle Switch */}
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.isAvailable}
                                onChange={() => handleToggleAvailability(item.id)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E5A00D]" />
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════ */}
            {/* TAB 2: CATEGORIES MANAGEMENT                                 */}
            {/* ════════════════════════════════════════════════════════════ */}
            {activeTab === "CATEGORIES" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoriesList.map((cat) => {
                    const dishCount = foodItemsList.filter((i) => i.categoryId === cat.id).length;

                    return (
                      <div
                        key={cat.id}
                        className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:border-[#E5A00D] transition-all flex flex-col justify-between space-y-4"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                              Food Category
                            </span>
                            <h3 className="text-xl font-black text-black mt-1">{cat.name}</h3>
                          </div>
                          <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 text-[#E5A00D] flex items-center justify-center font-bold">
                            <Tag size={18} />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                            {dishCount} Dish{dishCount !== 1 ? "es" : ""} Assigned
                          </span>

                          <button
                            onClick={() => setCategoryToDelete(cat)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl font-bold text-xs transition-colors flex items-center gap-1"
                          >
                            <Trash2 size={15} /> Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: CREATE / EDIT FOOD ITEM                             */}
      {/* ════════════════════════════════════════════════════════════ */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-6 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h2 className="text-xl font-black text-black uppercase flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-[#E5A00D]" />
                {itemForm.id ? "Edit Dish Item" : "Create New Dish Item"}
              </h2>
              <button
                onClick={() => setShowItemModal(false)}
                className="p-2 text-slate-400 hover:text-black rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveFoodItem} className="space-y-4">
              {/* Image Upload Row */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase">Dish Image</label>
                <div className="flex items-center gap-4">
                  {itemForm.imageUrl ? (
                    <img
                      src={itemForm.imageUrl}
                      alt="Dish preview"
                      className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-sm"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                      <UtensilsCrossed size={20} />
                    </div>
                  )}

                  <label className="flex-1 cursor-pointer bg-slate-50 border border-slate-300 hover:bg-slate-100 rounded-xl p-3 text-center transition-colors">
                    <span className="text-xs font-bold text-black flex items-center justify-center gap-2">
                      {uploadingImage ? (
                        <>
                          <Loader2 size={14} className="animate-spin text-[#E5A00D]" /> Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={14} /> Choose Image File (Supabase Storage)
                        </>
                      )}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Dish Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Dish Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chicken Fry Piece Biryani"
                  value={itemForm.name}
                  onChange={(e) => setItemForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs text-black outline-none focus:border-[#E5A00D]"
                />
              </div>

              {/* Category & Price Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Category *</label>
                  <select
                    value={itemForm.categoryId}
                    onChange={(e) => setItemForm((p) => ({ ...p, categoryId: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs text-black outline-none focus:border-[#E5A00D]"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 299"
                    value={itemForm.price}
                    onChange={(e) => setItemForm((p) => ({ ...p, price: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs text-black outline-none focus:border-[#E5A00D]"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Description</label>
                <textarea
                  rows={2}
                  placeholder="Freshly prepared in terracotta handi with basmati rice &amp; spices."
                  value={itemForm.description}
                  onChange={(e) => setItemForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-xs text-black outline-none focus:border-[#E5A00D]"
                />
              </div>

              {/* Veg Toggle Row */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Dietary Type</label>
                <div className="flex items-center gap-6 pt-1">
                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                    <input
                      type="radio"
                      name="isVeg"
                      checked={itemForm.isVeg}
                      onChange={() => setItemForm((p) => ({ ...p, isVeg: true }))}
                      className="accent-emerald-600 w-4 h-4"
                    />
                    <span className="text-emerald-700">Pure Veg</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                    <input
                      type="radio"
                      name="isVeg"
                      checked={!itemForm.isVeg}
                      onChange={() => setItemForm((p) => ({ ...p, isVeg: false }))}
                      className="accent-rose-600 w-4 h-4"
                    />
                    <span className="text-rose-700">Non-Veg</span>
                  </label>
                </div>
              </div>

              {/* Calories & Protein Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Calories (kcal)</label>
                  <input
                    type="number"
                    value={itemForm.calories}
                    onChange={(e) => setItemForm((p) => ({ ...p, calories: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs text-black outline-none focus:border-[#E5A00D]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Protein (g)</label>
                  <input
                    type="text"
                    value={itemForm.protein}
                    onChange={(e) => setItemForm((p) => ({ ...p, protein: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs text-black outline-none focus:border-[#E5A00D]"
                  />
                </div>
              </div>

              {/* Initial Availability Checkbox */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Set Initial Availability</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={itemForm.isAvailable}
                    onChange={(e) => setItemForm((p) => ({ ...p, isAvailable: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E5A00D]" />
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingItem}
                  className="px-6 py-2.5 bg-[#E5A00D] hover:bg-amber-500 font-black text-xs text-black rounded-xl transition-colors shadow-md flex items-center gap-2"
                >
                  {savingItem && <Loader2 size={14} className="animate-spin text-black" />}
                  {itemForm.id ? "Update Dish" : "Create Dish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: CREATE CATEGORY                                     */}
      {/* ════════════════════════════════════════════════════════════ */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h2 className="text-lg font-black text-black uppercase flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#E5A00D]" /> Add New Category
              </h2>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="p-2 text-slate-400 hover:text-black rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Biryani &amp; Rice Bowls"
                  value={categoryNameInput}
                  onChange={(e) => setCategoryNameInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs text-black outline-none focus:border-[#E5A00D]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingCategory}
                  className="px-5 py-2 bg-[#E5A00D] hover:bg-amber-500 font-black text-xs text-black rounded-xl transition-colors shadow-md flex items-center gap-2"
                >
                  {savingCategory && <Loader2 size={14} className="animate-spin text-black" />}
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* MODAL 3: CONFIRM DELETE FOOD ITEM                            */}
      {/* ════════════════════════════════════════════════════════════ */}
      {foodToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 border border-slate-100">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="h-12 w-12 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={24} className="text-rose-600" />
              </div>
              <div>
                <h3 className="font-black text-lg text-black leading-tight">Delete Dish Item?</h3>
                <p className="text-xs font-bold text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            {/* Dish Card Preview */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-4">
              <img
                src={
                  foodToDelete.imageUrl ||
                  (foodToDelete.isVeg ? "/paneer_bowl_new.png" : "/biryani_handi_slider.jpg")
                }
                alt={foodToDelete.name}
                className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
              />
              <div>
                <h4 className="font-black text-sm text-black">{foodToDelete.name}</h4>
                <p className="text-xs font-bold text-[#E5A00D] mt-0.5">₹{foodToDelete.price}</p>
                <span className="text-[10px] font-bold text-slate-400">ID: {foodToDelete.id}</span>
              </div>
            </div>

            <p className="text-xs font-bold text-slate-600 bg-rose-50 border border-rose-200 p-3 rounded-xl">
              Delete &quot;{foodToDelete.name}&quot;? This will permanently remove the meal from the menu and delete its image asset.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFoodToDelete(null)}
                disabled={deletingFood}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700 rounded-xl transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDeleteFood}
                disabled={deletingFood}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 font-black text-xs text-white rounded-xl transition-colors shadow-md flex items-center gap-2"
              >
                {deletingFood && <Loader2 size={14} className="animate-spin text-white" />}
                Permanently Delete Dish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* MODAL 4: CONFIRM DELETE CATEGORY                             */}
      {/* ════════════════════════════════════════════════════════════ */}
      {categoryToDelete && (() => {
        const assignedDishes = foodItemsList.filter((i) => i.categoryId === categoryToDelete.id);
        const hasAssignedDishes = assignedDishes.length > 0;

        return (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 border border-slate-100">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="h-12 w-12 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                  <AlertTriangle size={24} className="text-rose-600" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-black leading-tight">Delete Category?</h3>
                  <p className="text-xs font-bold text-slate-500">Category: &quot;{categoryToDelete.name}&quot;</p>
                </div>
              </div>

              {hasAssignedDishes ? (
                <div className="bg-amber-50 border border-amber-300 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 font-black text-xs">
                    <AlertTriangle size={16} className="text-amber-600" />
                    <span>Cannot Delete Active Category</span>
                  </div>
                  <p className="text-xs font-semibold text-amber-900 leading-relaxed">
                    Delete &quot;{categoryToDelete.name}&quot;? This action cannot be undone. However, there are currently{" "}
                    <strong>{assignedDishes.length} meal(s)</strong> assigned to this category. Please reassign or delete those meals first before deleting the category.
                  </p>
                </div>
              ) : (
                <p className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  Delete &quot;{categoryToDelete.name}&quot;? This action cannot be undone.
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCategoryToDelete(null)}
                  disabled={deletingCategory}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700 rounded-xl transition-colors"
                >
                  {hasAssignedDishes ? "Close" : "Cancel"}
                </button>

                {!hasAssignedDishes && (
                  <button
                    type="button"
                    onClick={handleConfirmDeleteCategory}
                    disabled={deletingCategory}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 font-black text-xs text-white rounded-xl transition-colors shadow-md flex items-center gap-2"
                  >
                    {deletingCategory && <Loader2 size={14} className="animate-spin text-white" />}
                    Delete Category
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
