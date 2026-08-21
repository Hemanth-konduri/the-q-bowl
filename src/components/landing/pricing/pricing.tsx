"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Calendar } from "lucide-react";

export default function Pricing() {
  const [duration, setDuration] = useState<7 | 15 | 30>(30);
  const [mealSlot, setMealSlot] = useState<"LUNCH" | "DINNER" | "BOTH">("BOTH");

  // 1 Subscription Day = 1 Meal Entitlement
  const basePricePerDay = mealSlot === "BOTH" ? 220 : 130;
  const discountMultiplier = duration === 30 ? 0.85 : duration === 15 ? 0.90 : 1;
  const pricePerDay = Math.round(basePricePerDay * discountMultiplier);
  const totalPrice = pricePerDay * duration;
  const originalTotal = basePricePerDay * duration;
  const savings = originalTotal - totalPrice;

  return (
    <section id="subscriptions" data-nav-dark="false" className="py-24 bg-[#f5e3cd] text-black relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="gsap-reveal text-center max-w-3xl mx-auto mb-14">
          <span className="font-mouse-memoirs text-2xl text-black uppercase font-bold tracking-widest block mb-2">
            FLEXIBLE MEAL SUBSCRIPTIONS
          </span>
          <h2 className="font-outfit text-4xl sm:text-6xl font-extrabold text-black uppercase tracking-tight leading-none">
            EAT WELL ON YOUR TERMS
          </h2>
          <p className="font-sans text-base sm:text-lg text-black/80 mt-3 font-normal">
            Pause or skip any meal before cutoff. Skipped meals extend your plan automatically.
          </p>
        </div>

        {/* Core Subscription Rule Banner */}
        <div className="gsap-reveal max-w-4xl mx-auto mb-12 retro-card p-6 sm:p-8 bg-[#FFF8EE] border-2 border-black flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-black text-[#E5A00D] shrink-0 border-2 border-black">
              <Calendar className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-outfit text-2xl font-bold text-black">
                The 1 Meal = 1 Subscription Day Guarantee
              </h4>
              <p className="font-sans text-xs sm:text-sm text-black/80 mt-1 leading-relaxed">
                Selecting <strong>Lunch + Dinner</strong> counts as <strong>ONE subscription day entitlement</strong>. A 30-day plan provides 30 full days of nutrition, with zero wasted meals.
              </p>
            </div>
          </div>
          <div className="shrink-0 text-center md:text-right border-t md:border-t-0 md:border-l-2 border-black/20 pt-4 md:pt-0 md:pl-6">
            <span className="font-outfit text-base font-bold text-black block">100% Pause Flexibility</span>
            <span className="font-sans text-xs text-black/70 font-medium">Extend End Date Anytime</span>
          </div>
        </div>

        {/* Interactive Configurator Container */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Controls */}
          <div className="gsap-reveal lg:col-span-7 retro-card p-8 bg-white border-2 border-black/20 space-y-8">
            <div>
              <h3 className="font-outfit text-2xl font-bold text-black uppercase">Build Your Custom Plan</h3>
              <p className="font-sans text-xs text-black/70 mt-1 font-medium">Select plan duration and preferred daily meal slots.</p>
            </div>

            {/* Duration Selector */}
            <div>
              <label className="font-outfit text-xs font-bold uppercase tracking-wider text-black block mb-3">
                1. Select Duration (Days)
              </label>
              <div className="grid grid-cols-3 gap-3">
                {([7, 15, 30] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      duration === d
                        ? "bg-black border-black text-white shadow-[4px_4px_0px_#000000]"
                        : "bg-[#FFF8EE] border-black text-black hover:bg-[#E5A00D]/20"
                    }`}
                  >
                    <div className="font-outfit text-2xl font-bold">{d} Days</div>
                    <div className="font-sans text-xs opacity-90 font-medium mt-1">
                      {d === 30 ? "Save 15%" : d === 15 ? "Save 10%" : "Standard"}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Meal Slot Selector */}
            <div>
              <label className="font-outfit text-xs font-bold uppercase tracking-wider text-black block mb-3">
                2. Choose Daily Meal Slots
              </label>
              <div className="grid sm:grid-cols-3 gap-3">
                <button
                  onClick={() => setMealSlot("LUNCH")}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    mealSlot === "LUNCH"
                      ? "bg-black border-black text-white shadow-[4px_4px_0px_#000000]"
                      : "bg-[#FFF8EE] border-black text-black hover:bg-[#E5A00D]/20"
                  }`}
                >
                  <div className="font-outfit text-lg font-bold">Lunch Only</div>
                  <div className="font-sans text-xs opacity-80 mt-1 font-normal">12:00-1:30 PM</div>
                </button>

                <button
                  onClick={() => setMealSlot("DINNER")}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    mealSlot === "DINNER"
                      ? "bg-black border-black text-white shadow-[4px_4px_0px_#000000]"
                      : "bg-[#FFF8EE] border-black text-black hover:bg-[#E5A00D]/20"
                  }`}
                >
                  <div className="font-outfit text-lg font-bold">Dinner Only</div>
                  <div className="font-sans text-xs opacity-80 mt-1 font-normal">7:30-9:00 PM</div>
                </button>

                <button
                  onClick={() => setMealSlot("BOTH")}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    mealSlot === "BOTH"
                      ? "bg-black border-black text-white shadow-[4px_4px_0px_#000000]"
                      : "bg-[#FFF8EE] border-black text-black hover:bg-[#E5A00D]/20"
                  }`}
                >
                  <div className="font-outfit text-lg font-bold">Lunch + Dinner</div>
                  <div className="font-sans text-xs opacity-80 mt-1 font-normal">Best Value</div>
                </button>
              </div>
            </div>

            {/* Included Advantages */}
            <div className="pt-4 border-t-2 border-black/20 space-y-2.5">
              <div className="flex items-center gap-3 font-sans text-xs text-black font-medium">
                <Check className="w-4 h-4 text-black shrink-0" />
                <span>Pause or skip meals before kitchen cutoff without burning entitlements</span>
              </div>
              <div className="flex items-center gap-3 font-sans text-xs text-black font-medium">
                <Check className="w-4 h-4 text-black shrink-0" />
                <span>Select daily dishes from changing kitchen menu</span>
              </div>
              <div className="flex items-center gap-3 font-sans text-xs text-black font-medium">
                <Check className="w-4 h-4 text-black shrink-0" />
                <span>Free doorstep delivery within active kitchen service area</span>
              </div>
            </div>

          </div>

          {/* Price Summary Card */}
          <div className="gsap-reveal lg:col-span-5 retro-card-dark p-8 border-4 border-[#E5A00D] flex flex-col justify-between h-full bg-black">
            <div>
              <span className="font-outfit text-xs font-bold text-[#E5A00D] uppercase tracking-wider block mb-4">
                CALCULATED SUMMARY
              </span>

              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <h4 className="font-outfit text-2xl font-bold text-white">{duration}-Day Plan</h4>
                  <p className="font-sans text-xs text-[#f5e3cd] font-light">
                    {mealSlot === "BOTH" ? "Lunch + Dinner Daily" : `${mealSlot} Daily`}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-outfit text-4xl font-extrabold text-[#E5A00D]">₹{totalPrice}</span>
                  {savings > 0 && (
                    <span className="font-sans text-xs text-white block line-through opacity-70">
                      ₹{originalTotal}
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-black p-4 rounded-xl border border-[#E5A00D]/40 space-y-2 mb-6 font-sans text-xs">
                <div className="flex justify-between text-[#f5e3cd]">
                  <span>Effective Price Per Subscription Day:</span>
                  <strong className="text-white font-bold">₹{pricePerDay}/day</strong>
                </div>
                <div className="flex justify-between text-[#f5e3cd]">
                  <span>Total Subscription Entitlements:</span>
                  <strong className="text-white font-bold">{duration} Full Days</strong>
                </div>
                {savings > 0 && (
                  <div className="flex justify-between text-[#E5A00D] font-bold pt-2 border-t border-[#E5A00D]/30">
                    <span>Your Subscription Savings:</span>
                    <span>Save ₹{savings}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Link
                href="/register"
                className="w-full py-3.5 rounded-full font-outfit font-bold text-base text-black bg-[#E5A00D] hover:bg-white transition text-center block uppercase shadow-[4px_4px_0px_#000]"
              >
                Subscribe Now
              </Link>
              <p className="font-sans text-[11px] text-[#D8C4A9] text-center font-light">
                Full refund eligible if 0 meals consumed. Once 1st meal is consumed, pause flexibility applies.
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
