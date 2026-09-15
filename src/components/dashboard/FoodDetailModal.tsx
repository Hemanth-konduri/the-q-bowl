"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  X,
  Star,
  Heart,
  ShoppingBag,
  Flame,
  Dumbbell,
  Clock,
  Sparkles,
  CheckCircle2,
  ChefHat,
  Plus,
  Minus,
  UtensilsCrossed,
} from "lucide-react";

export interface FoodDetailItem {
  id: string;
  name: string;
  category: string;
  tag?: string;
  tagType?: "NON-VEG" | "ROYAL NON-VEG" | "CRAFT NON-VEG" | "PURE VEG" | string;
  rating?: number;
  specs?: string;
  calories?: string;
  protein?: string;
  description?: string;
  price: number;
  image?: string;
}

interface FoodDetailModalProps {
  food: FoodDetailItem | null;
  isOpen: boolean;
  onClose: () => void;
  currentQuantity: number;
  onUpdateQuantity: (food: FoodDetailItem, delta: number) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (foodId: string) => void;
  isKitchenClosed?: boolean;
  onOpenKitchenModal?: () => void;
}

export function FoodDetailModal({
  food,
  isOpen,
  onClose,
  currentQuantity,
  onUpdateQuantity,
  isFavorite = false,
  onToggleFavorite,
  isKitchenClosed = false,
  onOpenKitchenModal,
}: FoodDetailModalProps) {
  const [addedToast, setAddedToast] = useState(false);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !food) return null;

  const isVeg =
    food.tagType === "PURE VEG" ||
    food.tag?.toLowerCase().includes("veg") ||
    food.category?.toLowerCase().includes("veg");

  const displayImage = food.image || "/chicken_dum_biryani.png";
  const displayRating = food.rating || 4.9;
  const displaySpecs = food.specs || "Handcrafted • Fresh Dum Prep";
  const displayCalories = food.calories || "550 kcal";
  const displayProtein = food.protein || "28g protein";

  const handleAddOne = () => {
    if (isKitchenClosed) {
      if (onOpenKitchenModal) onOpenKitchenModal();
      return;
    }
    onUpdateQuantity(food, 1);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 1800);
  };

  const handleMinusOne = () => {
    onUpdateQuantity(food, -1);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      {/* Backdrop click dismiss */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div
        className="relative z-10 w-full max-w-2xl bg-[#FFF8EE] rounded-3xl border-3 border-black shadow-[8px_8px_0px_#000000] overflow-hidden animate-in zoom-in-95 duration-200 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar with Close Button */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b-2 border-black">
          <div className="flex items-center gap-2">
            <span
              className={`h-3 w-3 rounded-full border-2 border-black ${
                isVeg ? "bg-emerald-500" : "bg-red-500"
              }`}
            />
            <span className="font-outfit font-black text-xs sm:text-sm uppercase tracking-wider text-black">
              {food.category || "Artisan Food Bowl"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onToggleFavorite && (
              <button
                onClick={() => onToggleFavorite(food.id)}
                className={`p-2 rounded-full border-2 border-black transition-all shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 ${
                  isFavorite
                    ? "bg-red-100 text-red-600"
                    : "bg-white text-zinc-400 hover:text-red-500"
                }`}
                title={isFavorite ? "Remove from favourites" : "Add to favourites"}
              >
                <Heart size={16} className={isFavorite ? "fill-red-600" : ""} />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-full border-2 border-black bg-white hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5"
              aria-label="Close dialog"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Main Visual & Key Badges */}
          <div className="relative h-56 sm:h-72 w-full rounded-2xl border-2 border-black overflow-hidden shadow-[4px_4px_0_#000] bg-zinc-100">
            <Image
              src={displayImage}
              alt={food.name}
              fill
              priority
              className="object-cover transition-transform duration-500 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

            {/* Tag Badges Overlay */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-black shadow-sm ${
                  isVeg ? "bg-emerald-500 text-white" : "bg-red-600 text-white"
                }`}
              >
                {isVeg ? "🌱 Pure Veg" : "🍖 Non-Veg Special"}
              </span>

              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-black text-[#E5A00D] border border-black shadow-sm flex items-center gap-1">
                <ChefHat size={12} />
                <span>Chef&apos;s Signature</span>
              </span>
            </div>

            {/* Bottom Floating Stats */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 text-xs font-black">
                <Star size={14} className="fill-amber-400 text-amber-400" />
                <span>{displayRating}</span>
                <span className="text-zinc-300 font-normal">• 1.2k+ ratings</span>
              </div>

              <span className="font-outfit text-xl sm:text-2xl font-black text-[#E5A00D] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                ₹{food.price}
              </span>
            </div>
          </div>

          {/* Title and Pricing Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black/10 pb-4">
            <div>
              <h3 className="font-outfit text-2xl sm:text-3xl font-black text-black leading-tight">
                {food.name}
              </h3>
              <p className="text-xs text-zinc-600 font-bold uppercase tracking-wider mt-1 flex items-center gap-1.5">
                <UtensilsCrossed size={13} className="text-[#E5A00D]" />
                <span>{displaySpecs}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">
                  Price per Bowl
                </p>
                <p className="font-outfit text-2xl font-black text-black">
                  ₹{food.price}
                </p>
              </div>
            </div>
          </div>

          {/* Nutrition Highlights Grid */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            <div className="p-3 rounded-2xl bg-white border-2 border-black shadow-[2px_2px_0_#000] text-center">
              <div className="flex items-center justify-center text-amber-500 mb-1">
                <Flame size={18} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                Calories
              </p>
              <p className="font-outfit font-black text-xs sm:text-sm text-black">
                {displayCalories}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-white border-2 border-black shadow-[2px_2px_0_#000] text-center">
              <div className="flex items-center justify-center text-emerald-600 mb-1">
                <Dumbbell size={18} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                Protein
              </p>
              <p className="font-outfit font-black text-xs sm:text-sm text-black">
                {displayProtein}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-white border-2 border-black shadow-[2px_2px_0_#000] text-center">
              <div className="flex items-center justify-center text-blue-500 mb-1">
                <Clock size={18} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                Prep Time
              </p>
              <p className="font-outfit font-black text-xs sm:text-sm text-black">
                15-25 Mins
              </p>
            </div>
          </div>

          {/* Full Description & Preparation Details */}
          <div className="p-4 rounded-2xl bg-white border-2 border-black shadow-[3px_3px_0_#000] space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#E5A00D]">
              <Sparkles size={14} />
              <span>Chef&apos;s Description &amp; Recipe Notes</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed font-medium">
              {food.description ||
                "Crafted fresh per order in authentic sealed terracotta handis & wood ovens with premium farm-sourced ingredients and aromatic artisanal spice blends."}
            </p>
          </div>

          {/* Kitchen Status Notice (if offline) */}
          {isKitchenClosed && (
            <div className="p-3 rounded-xl bg-red-100 border-2 border-red-400 text-red-800 text-xs font-bold flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                <span>Kitchen is currently closed / offline for new orders.</span>
              </div>
              {onOpenKitchenModal && (
                <button
                  onClick={onOpenKitchenModal}
                  className="underline uppercase tracking-wider font-black text-[11px]"
                >
                  View Hours
                </button>
              )}
            </div>
          )}

          {/* Toast Notification when Added */}
          {addedToast && (
            <div className="p-2.5 rounded-xl bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 border-2 border-black shadow-[3px_3px_0_#000] animate-in slide-in-from-bottom-2 duration-150">
              <CheckCircle2 size={16} />
              <span>Added to your bowl cart!</span>
            </div>
          )}

          {/* Action Footer: Quantity & Add to Cart */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            {/* Quantity Controller */}
            <div className="flex items-center justify-between w-full sm:w-auto gap-3 bg-white border-2 border-black rounded-2xl px-4 py-2.5 shadow-[3px_3px_0_#000]">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-500">
                Quantity
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleMinusOne}
                  disabled={currentQuantity <= 0}
                  className="h-8 w-8 rounded-xl bg-[#FFF8EE] border-2 border-black flex items-center justify-center text-black font-black hover:bg-black hover:text-white transition-colors disabled:opacity-40 disabled:hover:bg-[#FFF8EE] disabled:hover:text-black"
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} />
                </button>
                <span className="font-outfit font-black text-base text-black min-w-[20px] text-center">
                  {currentQuantity}
                </span>
                <button
                  onClick={handleAddOne}
                  className="h-8 w-8 rounded-xl bg-[#E5A00D] border-2 border-black flex items-center justify-center text-black font-black hover:bg-black hover:text-[#E5A00D] transition-colors shadow-sm"
                  aria-label="Increase quantity"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Add / Update Cart CTA Button */}
            <button
              onClick={handleAddOne}
              className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl border-2 border-black bg-[#E5A00D] hover:bg-black text-black hover:text-[#E5A00D] font-outfit font-black text-sm uppercase tracking-wider shadow-[4px_4px_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag size={18} />
              <span>
                {currentQuantity > 0
                  ? `Update Bowl (₹${food.price * Math.max(1, currentQuantity)})`
                  : `Add To Bowl • ₹${food.price}`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
