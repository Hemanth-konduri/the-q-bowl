"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  PauseCircle,
  PlayCircle,
  Utensils,
  Plus,
  AlertCircle,
  Check,
  ArrowRight,
  Package,
} from "lucide-react";

type SubscriptionData = {
  activeSubscription: {
    id: string;
    status: string;
    totalMeals: number;
    mealsUsed: number;
    mealsRemaining: number;
    startDate: string;
    expectedEndDate: string;
    pricePaid: number;
    mealTypes: string[];
    planName?: string | null;
    planDescription?: string | null;
  } | null;
  days: {
    id: string;
    subscriptionId: string;
    date: string;
    isSkipped: boolean;
    isConsumed: boolean;
  }[];
  availablePlans: {
    id: string;
    name: string;
    description?: string | null;
    totalMeals: number;
    price: number;
    mealTypes: string[];
    isActive: boolean;
  }[];
};

export default function SubscriptionsPage() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  async function fetchSubscriptions() {
    try {
      const res = await fetch("/api/user/subscriptions");
      if (!res.ok) throw new Error("Failed to load subscription details");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error("Subscription load error:", err);
      setError(err.message || "Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  async function togglePause() {
    if (!data?.activeSubscription || updating) return;
    setUpdating(true);
    try {
      const res = await fetch("/api/user/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TOGGLE_PAUSE",
          subscriptionId: data.activeSubscription.id,
        }),
      });
      if (res.ok) {
        await fetchSubscriptions();
      }
    } catch (err) {
      console.error("Failed to toggle pause:", err);
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#0F3329] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="font-outfit text-sm font-bold uppercase tracking-wider text-[#0F3329]">
          Loading subscription details from database...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 rounded-3xl bg-red-50 border-2 border-red-400 text-red-800 space-y-4 max-w-xl mx-auto my-12 text-center">
        <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
        <h2 className="font-outfit text-xl font-bold uppercase">Subscription Error</h2>
        <p className="font-sans text-sm">{error || "Unable to load subscription data."}</p>
        <button
          onClick={fetchSubscriptions}
          className="px-6 py-2.5 rounded-full bg-[#0F3329] text-[#f5e3cd] font-outfit text-xs font-bold uppercase"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  const sub = data.activeSubscription;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      
      {/* =========================================================
          PAGE HEADER (NO SHADOWS)
          ========================================================= */}

      <div className="p-8 sm:p-10 bg-[#FFF8EE] border-2 border-[#0F3329]/20 rounded-[2rem] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <span className="font-outfit text-xs font-bold uppercase text-[#E5A00D] bg-[#0F3329] px-3 py-1 rounded-full block w-fit mb-2">
            DAILY MEAL DISPATCHES
          </span>
          <h1 className="font-outfit font-black text-3xl sm:text-5xl text-[#0F3329] uppercase tracking-tight leading-none">
            MY SUBSCRIPTION PLAN
          </h1>
          <p className="font-sans text-sm sm:text-base text-[#0F3329]/70 font-medium mt-2">
            Real-time status of your active meal subscription plan and daily dispatches.
          </p>
        </div>

        {sub && (
          <button
            onClick={togglePause}
            disabled={updating}
            className={`px-6 py-3.5 rounded-2xl font-outfit text-xs sm:text-sm font-black uppercase tracking-wider border-2 transition-colors shrink-0 ${
              sub.status === "PAUSED"
                ? "bg-emerald-700 text-white border-emerald-800 hover:bg-emerald-800"
                : "bg-[#0F3329] text-[#E5A00D] border-[#0F3329] hover:bg-[#E5A00D] hover:text-[#0F3329]"
            }`}
          >
            {updating ? "Updating..." : sub.status === "PAUSED" ? "▶ Resume Plan" : "⏸ Pause Plan"}
          </button>
        )}
      </div>


      {/* =========================================================
          CURRENT PLAN OVERVIEW (NO SHADOWS)
          ========================================================= */}

      <div className="p-8 bg-[#0F3329] text-[#f5e3cd] border-2 border-[#0F3329] rounded-[2rem] space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E5A00D]/20 pb-4">
          <div>
            <span className="font-outfit text-xs font-black uppercase tracking-widest text-[#E5A00D] block">
              DATABASE RECORD
            </span>
            <h2 className="font-outfit font-black text-2xl sm:text-4xl text-[#FFF8EE] uppercase">
              {sub ? (sub.planName || "Active Meal Subscription") : "No Active Subscription"}
            </h2>
          </div>
          {sub ? (
            <span className="px-4 py-1.5 rounded-full bg-[#E5A00D] text-[#0F3329] font-outfit text-xs font-black uppercase tracking-wider">
              STATUS: {sub.status}
            </span>
          ) : (
            <span className="px-4 py-1.5 rounded-full bg-[#1B4D3E] text-[#f5e3cd] font-outfit text-xs font-bold uppercase tracking-wider">
              NO PLAN ENROLLED
            </span>
          )}
        </div>

        {sub ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#1B4D3E] border border-[#E5A00D]/30 space-y-1">
              <span className="font-outfit text-[10px] font-extrabold uppercase text-[#D8C4A9] block">
                TOTAL MEALS
              </span>
              <span className="font-outfit text-2xl font-black text-[#FFF8EE] block">
                {sub.totalMeals} Bowls
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#1B4D3E] border border-[#E5A00D]/30 space-y-1">
              <span className="font-outfit text-[10px] font-extrabold uppercase text-[#E5A00D] block">
                REMAINING
              </span>
              <span className="font-outfit text-2xl font-black text-[#E5A00D] block">
                {sub.mealsRemaining} Bowls
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#1B4D3E] border border-[#E5A00D]/30 space-y-1">
              <span className="font-outfit text-[10px] font-extrabold uppercase text-[#D8C4A9] block">
                MEALS USED
              </span>
              <span className="font-outfit text-2xl font-black text-[#FFF8EE] block">
                {sub.mealsUsed} Bowls
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#1B4D3E] border border-[#E5A00D]/30 space-y-1">
              <span className="font-outfit text-[10px] font-extrabold uppercase text-[#D8C4A9] block">
                EXPIRATION
              </span>
              <span className="font-outfit text-lg font-black text-[#FFF8EE] block">
                {new Date(sub.expectedEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-[#1B4D3E] border border-[#E5A00D]/30 text-center space-y-2">
            <Package className="w-8 h-8 text-[#E5A00D] mx-auto" />
            <p className="font-outfit text-sm font-bold uppercase text-[#FFF8EE]">
              You currently do not have an active meal subscription.
            </p>
            <p className="font-sans text-xs text-[#D8C4A9] font-medium max-w-md mx-auto">
              Select one of the available subscription plans below to start enjoying fresh daily cloud kitchen dispatches!
            </p>
          </div>
        )}
      </div>


      {/* =========================================================
          AVAILABLE SUBSCRIPTION PLANS CATALOG FROM DATABASE (NO SHADOWS)
          ========================================================= */}

      <div className="p-8 sm:p-10 bg-[#FFF8EE] border-2 border-[#0F3329]/20 rounded-[2rem] space-y-6">
        <div className="border-b border-[#0F3329]/15 pb-4">
          <span className="font-outfit text-xs font-bold uppercase text-[#E5A00D] bg-[#0F3329] px-3 py-1 rounded-full block w-fit mb-1">
            SUBSCRIPTION CATALOG
          </span>
          <h2 className="font-outfit font-black text-3xl sm:text-4xl text-[#0F3329] uppercase tracking-tight">
            AVAILABLE MEAL PLANS
          </h2>
          <p className="font-sans text-xs sm:text-sm text-[#0F3329]/70 font-semibold mt-1">
            Real subscription plans stored in database catalog with zero delivery fees.
          </p>
        </div>

        {data.availablePlans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.availablePlans.map((plan) => (
              <div
                key={plan.id}
                className="p-6 rounded-2xl bg-[#f5e3cd]/70 border border-[#0F3329]/20 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <span className="font-outfit text-xs font-black uppercase text-[#0F3329] bg-[#E5A00D] px-3 py-1 rounded-full border border-[#0F3329]/30 inline-block">
                    {plan.name}
                  </span>
                  <h3 className="font-outfit font-black text-3xl text-[#0F3329]">
                    ₹{plan.price}
                  </h3>
                  <p className="font-sans text-xs text-[#0F3329]/70 font-bold">
                    {plan.totalMeals} Total Fresh Meals
                  </p>
                  {plan.description && (
                    <p className="font-sans text-xs text-[#0F3329]/80 font-medium">
                      {plan.description}
                    </p>
                  )}
                </div>

                <Link
                  href="/#pricing"
                  className="w-full py-3 rounded-xl bg-[#0F3329] text-[#f5e3cd] font-outfit text-xs font-black uppercase tracking-wider hover:bg-[#E5A00D] hover:text-[#0F3329] transition-colors text-center block"
                >
                  Subscribe Plan
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Fallback Cards if DB catalog hasn't been seeded yet */}
            <div className="p-6 rounded-2xl bg-[#f5e3cd]/70 border border-[#0F3329]/20 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="font-outfit text-xs font-black uppercase text-[#0F3329] bg-[#E5A00D] px-3 py-1 rounded-full border border-[#0F3329]/30 inline-block">
                  7-DAY TRIAL PLAN
                </span>
                <h3 className="font-outfit font-black text-3xl text-[#0F3329]">₹1,499</h3>
                <p className="font-sans text-xs text-[#0F3329]/70 font-bold">14 Fresh Meals • 2 Meals/Day</p>
              </div>
              <Link
                href="/#pricing"
                className="w-full py-3 rounded-xl bg-[#0F3329] text-[#f5e3cd] font-outfit text-xs font-black uppercase tracking-wider hover:bg-[#E5A00D] hover:text-[#0F3329] transition-colors text-center block"
              >
                Subscribe Now
              </Link>
            </div>

            <div className="p-6 rounded-2xl bg-[#f5e3cd]/70 border border-[#0F3329]/20 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="font-outfit text-xs font-black uppercase text-[#0F3329] bg-[#E5A00D] px-3 py-1 rounded-full border border-[#0F3329]/30 inline-block">
                  15-DAY FLEX PLAN
                </span>
                <h3 className="font-outfit font-black text-3xl text-[#0F3329]">₹2,999</h3>
                <p className="font-sans text-xs text-[#0F3329]/70 font-bold">30 Fresh Meals • Save 15%</p>
              </div>
              <Link
                href="/#pricing"
                className="w-full py-3 rounded-xl bg-[#0F3329] text-[#f5e3cd] font-outfit text-xs font-black uppercase tracking-wider hover:bg-[#E5A00D] hover:text-[#0F3329] transition-colors text-center block"
              >
                Subscribe Now
              </Link>
            </div>

            <div className="p-6 rounded-2xl bg-[#0F3329] text-[#f5e3cd] border border-[#0F3329] space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="font-outfit text-xs font-black uppercase text-[#0F3329] bg-[#E5A00D] px-3 py-1 rounded-full border border-[#0F3329]/30 inline-block">
                  30-DAY FEAST CLUB
                </span>
                <h3 className="font-outfit font-black text-3xl text-[#E5A00D]">₹5,499</h3>
                <p className="font-sans text-xs text-[#D8C4A9] font-bold">60 Fresh Meals • Save 30%</p>
              </div>
              <Link
                href="/#pricing"
                className="w-full py-3 rounded-xl bg-[#E5A00D] text-[#0F3329] font-outfit text-xs font-black uppercase tracking-wider hover:bg-white transition-colors text-center block"
              >
                Subscribe Now
              </Link>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
