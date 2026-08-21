"use client";

import React from "react";
import Link from "next/link";
import { ShoppingBag, CalendarCheck, Utensils } from "lucide-react";

export function SkeletonCard() {
  return (
    <div className="bg-[#FFF8EE] border-2 border-[#0F3329]/20 rounded-2xl p-4 space-y-3 animate-pulse">
      <div className="w-full h-40 bg-[#0F3329]/10 rounded-xl" />
      <div className="h-4 bg-[#0F3329]/15 rounded w-3/4" />
      <div className="h-3 bg-[#0F3329]/10 rounded w-1/2" />
      <div className="flex justify-between items-center pt-2">
        <div className="h-5 bg-[#0F3329]/20 rounded w-1/4" />
        <div className="h-8 bg-[#0F3329]/20 rounded-xl w-24" />
      </div>
    </div>
  );
}

export function EmptyCartState() {
  return (
    <div className="bg-[#FFF8EE] border-2 border-dashed border-[#0F3329]/30 rounded-3xl p-8 sm:p-12 text-center space-y-4 max-w-md mx-auto my-8">
      <div className="w-16 h-16 rounded-full bg-[#0F3329]/10 text-[#0F3329] flex items-center justify-center mx-auto">
        <ShoppingBag className="w-8 h-8 opacity-60" />
      </div>
      <div className="space-y-1">
        <h3 className="font-outfit font-black text-lg uppercase text-[#0F3329]">
          Your Bowl Cart is Empty
        </h3>
        <p className="font-sans text-xs text-[#0F3329]/70">
          Looks like you haven't added any artisan food bowls to your cart yet.
        </p>
      </div>
      <Link
        href="/user/menu"
        className="px-6 py-3 rounded-2xl bg-[#0F3329] text-[#f5e3cd] font-outfit font-black text-xs uppercase tracking-wider hover:bg-[#1B4D3E] transition-all inline-flex items-center gap-2"
      >
        <Utensils className="w-4 h-4" />
        <span>Explore Artisan Menu</span>
      </Link>
    </div>
  );
}

export function EmptySubscriptionsState() {
  return (
    <div className="bg-[#FFF8EE] border-2 border-dashed border-[#0F3329]/30 rounded-3xl p-8 sm:p-12 text-center space-y-4 max-w-md mx-auto my-8">
      <div className="w-16 h-16 rounded-full bg-[#0F3329]/10 text-[#0F3329] flex items-center justify-center mx-auto">
        <CalendarCheck className="w-8 h-8 opacity-60" />
      </div>
      <div className="space-y-1">
        <h3 className="font-outfit font-black text-lg uppercase text-[#0F3329]">
          No Active Subscription
        </h3>
        <p className="font-sans text-xs text-[#0F3329]/70">
          Unlock fresh chef-curated daily meal dispatches delivered directly to your doorstep.
        </p>
      </div>
      <Link
        href="/user/subscriptions"
        className="px-6 py-3 rounded-2xl bg-[#0F3329] text-[#f5e3cd] font-outfit font-black text-xs uppercase tracking-wider hover:bg-[#1B4D3E] transition-all inline-flex items-center gap-2"
      >
        <CalendarCheck className="w-4 h-4" />
        <span>View Meal Plans</span>
      </Link>
    </div>
  );
}
