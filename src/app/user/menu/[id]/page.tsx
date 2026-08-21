"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Star, Flame, Utensils, CheckCircle2, ShieldCheck, ShoppingBag, ArrowRight } from "lucide-react";
import QuantityStepper from "@/components/shared/quantity-stepper";

export default function MealDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [mealData, setMealData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [selectedGalleryIdx, setSelectedGalleryIdx] = useState(0);

  useEffect(() => {
    async function fetchDetails() {
      try {
        setLoading(true);
        const res = await fetch(`/api/meals/${id}`);
        if (res.ok) {
          const data = await res.json();
          setMealData(data);
        }
      } catch (err) {
        console.error("Failed to fetch meal details:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [id]);

  const handleAddToCart = async () => {
    try {
      setAdding(true);
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodItemId: id, quantity }),
      });
      setAdding(false);
      window.location.href = "/user/cart";
    } catch (err) {
      console.error("Add to cart error:", err);
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-12 bg-[#FFF8EE] border-2 border-[#0F3329] rounded-3xl text-center space-y-4 animate-pulse">
        <div className="w-12 h-12 rounded-full bg-[#0F3329]/10 mx-auto" />
        <div className="h-6 bg-[#0F3329]/15 rounded w-1/3 mx-auto" />
        <div className="h-4 bg-[#0F3329]/10 rounded w-1/2 mx-auto" />
      </div>
    );
  }

  if (!mealData || !mealData.meal) {
    return (
      <div className="max-w-xl mx-auto p-12 bg-[#FFF8EE] border-2 border-[#0F3329] rounded-3xl text-center space-y-4">
        <h2 className="font-outfit font-black text-xl text-[#0F3329] uppercase">Meal Not Found</h2>
        <Link href="/user/menu" className="px-6 py-2.5 rounded-xl bg-[#0F3329] text-[#f5e3cd] font-outfit text-xs font-black uppercase inline-block">
          Back to Menu
        </Link>
      </div>
    );
  }

  const { meal, ingredients, nutrition, recommended } = mealData;

  const galleryImages = [
    meal.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-16">
      {/* BACK BUTTON */}
      <Link
        href="/user/menu"
        className="inline-flex items-center gap-2 font-outfit text-xs font-black uppercase text-[#0F3329] hover:underline"
      >
        <ArrowLeft className="w-4 h-4 text-[#E5A00D]" />
        <span>Back to Chef Menu</span>
      </Link>

      {/* MEAL HERO GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* GALLERY SECTION */}
        <div className="space-y-4">
          <div className="w-full h-80 sm:h-96 rounded-3xl border-2 border-[#0F3329] overflow-hidden relative bg-[#f5e3cd]">
            <Image
              src={galleryImages[selectedGalleryIdx]}
              alt={meal.name}
              fill
              className="object-cover"
            />
            <div className="absolute top-4 left-4 bg-[#0F3329] text-[#E5A00D] px-3 py-1 rounded-full font-outfit text-xs font-black uppercase flex items-center gap-1.5 shadow-md">
              <Star className="w-4 h-4 fill-[#E5A00D]" />
              <span>{meal.rating} Rating</span>
            </div>
          </div>

          <div className="flex gap-3">
            {galleryImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedGalleryIdx(idx)}
                className={`w-20 h-20 rounded-2xl border-2 overflow-hidden relative transition-all ${
                  selectedGalleryIdx === idx
                    ? "border-[#0F3329] scale-105"
                    : "border-[#0F3329]/20 opacity-70 hover:opacity-100"
                }`}
              >
                <Image src={img} alt="Thumbnail" fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* DETAILS SECTION */}
        <div className="bg-[#FFF8EE] border-2 border-[#0F3329] rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#0F3329] text-[#E5A00D] font-outfit text-[10px] font-black uppercase tracking-wider">
                {meal.categoryName || "ARTISAN BOWL"}
              </span>
              <span
                className={`px-3 py-1 rounded-full font-outfit text-[10px] font-black uppercase tracking-wider text-white ${
                  meal.isVeg ? "bg-emerald-700" : "bg-red-700"
                }`}
              >
                {meal.isVeg ? "Pure Veg" : "Non-Veg"}
              </span>
            </div>

            <h1 className="font-outfit font-black text-2xl sm:text-3xl text-[#0F3329] uppercase tracking-tight">
              {meal.name}
            </h1>
            <p className="font-sans text-xs sm:text-sm text-[#0F3329]/80 leading-relaxed">
              {meal.description}
            </p>
          </div>

          {/* NUTRITION MACROS */}
          <div className="p-4 rounded-2xl bg-[#f5e3cd]/70 border border-[#0F3329]/20 space-y-2">
            <h4 className="font-outfit font-black text-xs uppercase text-[#0F3329] flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-[#E5A00D]" />
              Dietitian Macro Information
            </h4>
            <div className="grid grid-cols-4 gap-2 text-center pt-1">
              <div className="bg-white/80 p-2 rounded-xl border border-[#0F3329]/10">
                <span className="font-sans text-[10px] text-[#0F3329]/60 block font-bold">Calories</span>
                <span className="font-outfit font-extrabold text-xs text-[#0F3329]">{nutrition.calories} kcal</span>
              </div>
              <div className="bg-white/80 p-2 rounded-xl border border-[#0F3329]/10">
                <span className="font-sans text-[10px] text-[#0F3329]/60 block font-bold">Protein</span>
                <span className="font-outfit font-extrabold text-xs text-[#0F3329]">{nutrition.protein}</span>
              </div>
              <div className="bg-white/80 p-2 rounded-xl border border-[#0F3329]/10">
                <span className="font-sans text-[10px] text-[#0F3329]/60 block font-bold">Carbs</span>
                <span className="font-outfit font-extrabold text-xs text-[#0F3329]">{nutrition.carbs}</span>
              </div>
              <div className="bg-white/80 p-2 rounded-xl border border-[#0F3329]/10">
                <span className="font-sans text-[10px] text-[#0F3329]/60 block font-bold">Fat</span>
                <span className="font-outfit font-extrabold text-xs text-[#0F3329]">{nutrition.fat}</span>
              </div>
            </div>
          </div>

          {/* INGREDIENTS LIST */}
          <div className="space-y-2">
            <h4 className="font-outfit font-black text-xs uppercase text-[#0F3329]">
              Ingredients & Craft Prep
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans text-[#0F3329]/80">
              {ingredients.map((ing: string, idx: number) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>{ing}</span>
                </div>
              ))}
            </div>
          </div>

          {/* PRICE & ADD TO CART ACTION */}
          <div className="border-t-2 border-[#0F3329]/15 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="font-sans text-xs uppercase text-[#0F3329]/60 block font-bold">
                Price Per Portion
              </span>
              <span className="font-outfit font-black text-2xl text-[#0F3329]">₹{meal.price}</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <QuantityStepper
                quantity={quantity}
                onIncrease={() => setQuantity(quantity + 1)}
                onDecrease={() => setQuantity(Math.max(1, quantity - 1))}
                size="lg"
              />

              <button
                onClick={handleAddToCart}
                disabled={adding}
                className="flex-1 sm:flex-initial px-8 py-3.5 rounded-2xl bg-[#0F3329] text-[#f5e3cd] font-outfit font-black text-xs uppercase tracking-wider hover:bg-[#1B4D3E] transition-all flex items-center justify-center gap-2 shadow-md hover:scale-105"
              >
                <Utensils className="w-4 h-4" />
                <span>{adding ? "Adding..." : "Add to Cart"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RECOMMENDED MEALS SECTION */}
      {recommended && recommended.length > 0 && (
        <div className="space-y-6 pt-6 border-t-2 border-[#0F3329]/15">
          <h2 className="font-outfit font-black text-xl uppercase text-[#0F3329] tracking-tight">
            RECOMMENDED PAIRINGS & POPULAR BOWLS
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {recommended.map((rec: any) => (
              <div
                key={rec.id}
                className="bg-[#FFF8EE] border-2 border-[#0F3329] rounded-2xl overflow-hidden p-4 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="w-full h-36 relative rounded-xl overflow-hidden bg-[#f5e3cd]">
                    <Image
                      src={rec.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80"}
                      alt={rec.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <h4 className="font-outfit font-black text-sm uppercase text-[#0F3329] line-clamp-1">
                    {rec.name}
                  </h4>
                  <p className="font-sans text-xs text-[#0F3329]/70 line-clamp-2">
                    {rec.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#0F3329]/10">
                  <span className="font-outfit font-black text-lg text-[#0F3329]">₹{rec.price}</span>
                  <Link
                    href={`/user/menu/${rec.id}`}
                    className="px-3 py-1.5 rounded-xl border border-[#0F3329] text-[#0F3329] font-outfit text-xs font-bold uppercase hover:bg-[#0F3329] hover:text-[#f5e3cd] transition-colors"
                  >
                    View Bowl
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
