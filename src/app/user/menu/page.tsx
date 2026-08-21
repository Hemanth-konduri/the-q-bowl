"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Utensils, Star, Flame, ShoppingBag, ArrowRight, Filter, Eye } from "lucide-react";
import QuantityStepper from "@/components/shared/quantity-stepper";
import { SkeletonCard } from "@/components/shared/loading-empty-states";

interface Category {
  id: string;
  name: string;
}

interface Meal {
  id: string;
  categoryId: string;
  categoryName?: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  calories: number;
  protein: string;
  rating: number;
  isVeg: boolean;
  mealType: string;
}

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [isVegFilter, setIsVegFilter] = useState<boolean | null>(null);

  // Cart quantities dictionary: { [foodItemId]: quantity }
  const [cartQuantities, setCartQuantities] = useState<{ [key: string]: number }>({});
  const [cartTotalCount, setCartTotalCount] = useState(0);
  const [cartSubtotal, setCartSubtotal] = useState(0);

  const fetchMealsAndCart = async () => {
    try {
      setLoading(true);
      // Fetch meals catalog
      const params = new URLSearchParams();
      if (selectedCategory !== "ALL") params.set("categoryId", selectedCategory);
      if (isVegFilter !== null) params.set("isVeg", String(isVegFilter));
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/meals?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
        setMeals(data.meals || []);
      }

      // Fetch active user cart
      const cartRes = await fetch("/api/cart");
      if (cartRes.ok) {
        const cartData = await cartRes.json();
        const dict: { [key: string]: number } = {};
        let totalCount = 0;
        (cartData.items || []).forEach((item: any) => {
          dict[item.foodItemId] = item.quantity;
          totalCount += item.quantity;
        });
        setCartQuantities(dict);
        setCartTotalCount(totalCount);
        setCartSubtotal(cartData.subtotal || 0);
      }
    } catch (err) {
      console.error("Failed to load menu data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMealsAndCart();
  }, [selectedCategory, isVegFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMealsAndCart();
  };

  const updateItemQuantity = async (foodItemId: string, newQty: number) => {
    // Optimistic UI update
    setCartQuantities((prev) => {
      const next = { ...prev };
      if (newQty <= 0) delete next[foodItemId];
      else next[foodItemId] = newQty;
      return next;
    });

    try {
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodItemId, quantity: newQty }),
      });
      // Refresh cart numbers
      const cartRes = await fetch("/api/cart");
      if (cartRes.ok) {
        const cartData = await cartRes.json();
        const dict: { [key: string]: number } = {};
        let totalCount = 0;
        (cartData.items || []).forEach((item: any) => {
          dict[item.foodItemId] = item.quantity;
          totalCount += item.quantity;
        });
        setCartQuantities(dict);
        setCartTotalCount(totalCount);
        setCartSubtotal(cartData.subtotal || 0);
      }
    } catch (err) {
      console.error("Failed to update item quantity:", err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24">
      {/* MENU HEADER */}
      <div className="bg-[#FFF8EE] border-2 border-[#0F3329] rounded-3xl p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2 text-center md:text-left">
          <span className="px-3.5 py-1 rounded-full bg-[#E5A00D] text-[#0F3329] font-outfit text-xs font-black uppercase tracking-wider">
            FRESH DAILY DISPATCH
          </span>
          <h1 className="font-outfit font-black text-2xl sm:text-4xl uppercase text-[#0F3329] tracking-tight">
            ARTISAN CHEF BOWL MENU
          </h1>
          <p className="font-sans text-xs sm:text-sm text-[#0F3329]/80 max-w-xl">
            Dietitian-balanced organic grains, flame-roasted proteins, and artisanal house sauces crafted daily for high performance.
          </p>
        </div>

        {/* SEARCH BAR */}
        <form onSubmit={handleSearchSubmit} className="w-full md:w-80 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bowls or ingredients..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-[#0F3329]/30 bg-white font-sans text-xs sm:text-sm text-[#0F3329] placeholder-[#0F3329]/50 focus:outline-none focus:border-[#0F3329]"
          />
          <Search className="w-5 h-5 text-[#0F3329]/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </form>
      </div>

      {/* FILTERS & CATEGORIES ROW */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#0F3329]/15 pb-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none max-w-full">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-4 py-2 rounded-xl font-outfit text-xs font-extrabold uppercase tracking-wider shrink-0 border-2 transition-all ${
              selectedCategory === "ALL"
                ? "bg-[#0F3329] text-[#f5e3cd] border-[#0F3329]"
                : "bg-[#FFF8EE] text-[#0F3329] border-[#0F3329]/20 hover:border-[#0F3329]"
            }`}
          >
            All Bowls
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl font-outfit text-xs font-extrabold uppercase tracking-wider shrink-0 border-2 transition-all ${
                selectedCategory === cat.id
                  ? "bg-[#0F3329] text-[#f5e3cd] border-[#0F3329]"
                  : "bg-[#FFF8EE] text-[#0F3329] border-[#0F3329]/20 hover:border-[#0F3329]"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Veg / Non-Veg Toggle Filter */}
        <div className="flex items-center gap-2 bg-[#FFF8EE] border-2 border-[#0F3329]/20 rounded-2xl p-1 shrink-0">
          <button
            onClick={() => setIsVegFilter(null)}
            className={`px-3 py-1.5 rounded-xl font-outfit text-xs font-extrabold uppercase transition-all ${
              isVegFilter === null ? "bg-[#0F3329] text-[#E5A00D]" : "text-[#0F3329]/70"
            }`}
          >
            All Diets
          </button>
          <button
            onClick={() => setIsVegFilter(true)}
            className={`px-3 py-1.5 rounded-xl font-outfit text-xs font-extrabold uppercase flex items-center gap-1.5 transition-all ${
              isVegFilter === true ? "bg-emerald-800 text-white" : "text-[#0F3329]/70"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Pure Veg
          </button>
          <button
            onClick={() => setIsVegFilter(false)}
            className={`px-3 py-1.5 rounded-xl font-outfit text-xs font-extrabold uppercase flex items-center gap-1.5 transition-all ${
              isVegFilter === false ? "bg-red-800 text-white" : "text-[#0F3329]/70"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Non-Veg
          </button>
        </div>
      </div>

      {/* MEALS GRID */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : meals.length === 0 ? (
        <div className="p-12 bg-[#FFF8EE] border-2 border-dashed border-[#0F3329]/30 rounded-3xl text-center space-y-3 max-w-md mx-auto">
          <Utensils className="w-8 h-8 text-[#0F3329]/50 mx-auto" />
          <h3 className="font-outfit font-black text-base uppercase text-[#0F3329]">
            No Meal Bowls Found
          </h3>
          <p className="font-sans text-xs text-[#0F3329]/70">
            Try adjusting your search criteria or category filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {meals.map((meal) => {
            const currentQty = cartQuantities[meal.id] || 0;

            return (
              <div
                key={meal.id}
                className="bg-[#FFF8EE] border-2 border-[#0F3329] rounded-3xl overflow-hidden flex flex-col justify-between hover:border-[#1B4D3E] transition-all hover:scale-[1.01] shadow-sm group"
              >
                <div>
                  {/* IMAGE & BADGES */}
                  <div className="h-48 relative bg-[#f5e3cd] overflow-hidden">
                    <Image
                      src={meal.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80"}
                      alt={meal.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                      <span
                        className={`px-2.5 py-1 rounded-full font-outfit text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5 ${
                          meal.isVeg
                            ? "bg-emerald-700 text-white"
                            : "bg-red-700 text-white"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        {meal.isVeg ? "VEG" : "NON-VEG"}
                      </span>

                      <div className="flex items-center gap-1 bg-[#0F3329] text-[#E5A00D] px-2.5 py-1 rounded-full font-outfit text-xs font-black">
                        <Star className="w-3.5 h-3.5 fill-[#E5A00D]" />
                        <span>{meal.rating}</span>
                      </div>
                    </div>

                    {/* Quick View Button */}
                    <Link
                      href={`/user/menu/${meal.id}`}
                      className="absolute bottom-3 right-3 p-2 bg-[#FFF8EE] text-[#0F3329] border border-[#0F3329] rounded-xl font-outfit text-xs font-extrabold uppercase flex items-center gap-1 shadow-md hover:bg-[#0F3329] hover:text-[#f5e3cd] transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </Link>
                  </div>

                  {/* CONTENT */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between gap-2 text-xs font-outfit font-bold text-[#0F3329]/70">
                      <span className="flex items-center gap-1 text-[#0F3329]">
                        <Flame className="w-3.5 h-3.5 text-[#E5A00D]" />
                        {meal.calories} Kcal
                      </span>
                      <span>Protein: {meal.protein}</span>
                    </div>

                    <Link href={`/user/menu/${meal.id}`}>
                      <h3 className="font-outfit font-black text-lg uppercase text-[#0F3329] hover:underline line-clamp-1">
                        {meal.name}
                      </h3>
                    </Link>

                    <p className="font-sans text-xs text-[#0F3329]/80 line-clamp-2">
                      {meal.description}
                    </p>
                  </div>
                </div>

                {/* CARD FOOTER */}
                <div className="p-5 pt-0 flex items-center justify-between border-t border-[#0F3329]/10 mt-3">
                  <div>
                    <span className="font-sans text-[10px] uppercase text-[#0F3329]/60 block font-bold">
                      Price
                    </span>
                    <span className="font-outfit font-black text-xl text-[#0F3329]">₹{meal.price}</span>
                  </div>

                  {currentQty > 0 ? (
                    <QuantityStepper
                      quantity={currentQty}
                      onIncrease={() => updateItemQuantity(meal.id, currentQty + 1)}
                      onDecrease={() => updateItemQuantity(meal.id, currentQty - 1)}
                      size="md"
                    />
                  ) : (
                    <button
                      onClick={() => updateItemQuantity(meal.id, 1)}
                      className="px-4 py-2.5 rounded-2xl bg-[#0F3329] text-[#f5e3cd] font-outfit font-black text-xs uppercase tracking-wider hover:bg-[#1B4D3E] transition-all flex items-center gap-1.5"
                    >
                      <Utensils className="w-3.5 h-3.5" />
                      <span>Add to Cart</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FLOATING CART BAR (WHEN ITEMS ADDED) */}
      {cartTotalCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[900] max-w-lg w-[calc(100%-2rem)] bg-[#0F3329] text-[#f5e3cd] rounded-3xl p-4 border-2 border-[#E5A00D] shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E5A00D] text-[#0F3329] flex items-center justify-center font-outfit font-black text-lg">
              {cartTotalCount}
            </div>
            <div>
              <span className="font-outfit text-xs font-black uppercase text-[#E5A00D] block">
                YOUR CART
              </span>
              <span className="font-outfit font-bold text-sm text-white">
                ₹{cartSubtotal.toFixed(2)} Subtotal
              </span>
            </div>
          </div>

          <Link
            href="/user/cart"
            className="px-5 py-2.5 rounded-2xl bg-[#E5A00D] text-[#0F3329] font-outfit font-black text-xs uppercase tracking-wider hover:bg-white transition-all flex items-center gap-1.5"
          >
            <span>Proceed to Cart</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
