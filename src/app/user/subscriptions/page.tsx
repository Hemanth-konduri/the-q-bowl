"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarCheck,
  Calendar as CalendarIcon,
  Sparkles,
  CheckCircle2,
  XCircle,
  PauseCircle,
  PlayCircle,
  Utensils,
  Plus,
  Flame,
  Star,
  Check,
  ArrowRight,
} from "lucide-react";

import dumBiryaniImg from "../../../../../public/dum_biryani_hero.png";
import paneerImg from "../../../../../public/paneer.png";
import heroDishImg from "../../../../../public/hero_dish.png";

type DaySchedule = {
  dateStr: string;
  dayName: string;
  dayNum: number;
  lunchDish: string;
  dinnerDish: string;
  isSkipped: boolean;
  isConsumed: boolean;
};

const INITIAL_SCHEDULE: DaySchedule[] = [
  {
    dateStr: "2026-08-18",
    dayName: "TODAY",
    dayNum: 18,
    lunchDish: "Hyderabadi Chicken Dum Biryani",
    dinnerDish: "Royal Paneer Tikka Deluxe Bowl",
    isSkipped: false,
    isConsumed: false,
  },
  {
    dateStr: "2026-08-19",
    dayName: "WED",
    dayNum: 19,
    lunchDish: "Mediterranean Protein Power Bowl",
    dinnerDish: "Keto Broccoli & Paneer Steak",
    isSkipped: false,
    isConsumed: false,
  },
  {
    dateStr: "2026-08-20",
    dayName: "THU",
    dayNum: 20,
    lunchDish: "Special Artisanal Dum Biryani",
    dinnerDish: "Signature Protein Harvest Bowl",
    isSkipped: true,
    isConsumed: false,
  },
  {
    dateStr: "2026-08-21",
    dayName: "FRI",
    dayNum: 21,
    lunchDish: "Awadhi Mutton Dum Biryani",
    dinnerDish: "Royal Paneer Tikka Deluxe Bowl",
    isSkipped: false,
    isConsumed: false,
  },
  {
    dateStr: "2026-08-22",
    dayName: "SAT",
    dayNum: 22,
    lunchDish: "Hyderabadi Chicken Dum Biryani",
    dinnerDish: "Mediterranean Protein Power Bowl",
    isSkipped: false,
    isConsumed: false,
  },
  {
    dateStr: "2026-08-23",
    dayName: "SUN",
    dayNum: 23,
    lunchDish: "Chef Special Heritage Biryani",
    dinnerDish: "Keto Broccoli & Paneer Steak",
    isSkipped: false,
    isConsumed: false,
  },
  {
    dateStr: "2026-08-24",
    dayName: "MON",
    dayNum: 24,
    lunchDish: "Signature Protein Harvest Bowl",
    dinnerDish: "Special Artisanal Dum Biryani",
    isSkipped: false,
    isConsumed: false,
  },
];

export default function SubscriptionsPage() {
  const [schedule, setSchedule] = useState<DaySchedule[]>(INITIAL_SCHEDULE);
  const [planPaused, setPlanPaused] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"30day" | "15day" | "7day">("30day");

  const toggleSkip = (index: number) => {
    setSchedule((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, isSkipped: !item.isSkipped } : item
      )
    );
  };

  return (
    <div className="space-y-10 pb-12 animate-in fade-in duration-500">
      
      {/* =========================================================
          PAGE HEADER
          ========================================================= */}

      <div className="p-8 sm:p-10 bg-[#FFF8EE] border-4 border-[#0F3329] rounded-[2.5rem] shadow-[8px_8px_0px_#0F3329] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <span className="font-mouse-memoirs text-2xl text-[#E5A00D] uppercase font-bold tracking-widest block">
            CUSTOMIZE YOUR DAILY MEAL DISPATCHES
          </span>
          <h1 className="font-outfit font-black text-3xl sm:text-5xl text-[#0F3329] uppercase tracking-tight leading-none mt-1">
            MY SUBSCRIPTION PLAN
          </h1>
          <p className="font-sans text-sm sm:text-base text-[#0F3329]/80 font-medium mt-2">
            Skip days anytime without losing meal credits. Paused days are automatically pushed to the end of your plan.
          </p>
        </div>

        <button
          onClick={() => setPlanPaused(!planPaused)}
          className={`px-6 py-3.5 rounded-2xl font-outfit text-xs sm:text-sm font-black uppercase tracking-wider border-3 transition-all shrink-0 shadow-[4px_4px_0px_#0F3329] ${
            planPaused
              ? "bg-emerald-600 text-white border-emerald-900 hover:bg-emerald-700"
              : "bg-[#0F3329] text-[#E5A00D] border-[#0F3329] hover:bg-[#E5A00D] hover:text-[#0F3329]"
          }`}
        >
          {planPaused ? "▶ Resume Subscription" : "⏸ Pause Subscription"}
        </button>
      </div>


      {/* =========================================================
          CURRENT PLAN OVERVIEW
          ========================================================= */}

      <div className="p-8 bg-[#0F3329] text-[#f5e3cd] border-4 border-[#0F3329] rounded-[2.5rem] shadow-[8px_8px_0px_#071914] space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E5A00D]/20 pb-4">
          <div>
            <span className="font-outfit text-xs font-black uppercase tracking-widest text-[#E5A00D] block">
              CURRENT PLAN DETAILS
            </span>
            <h2 className="font-outfit font-black text-2xl sm:text-4xl text-[#FFF8EE] uppercase">
              30-DAY FEAST CLUB MEAL SUBSCRIPTION
            </h2>
          </div>
          <span className="px-4 py-1.5 rounded-full bg-[#E5A00D] text-[#0F3329] font-outfit text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#000]">
            {planPaused ? "PAUSED" : "ACTIVE & DISPATCHING"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#1B4D3E] border border-[#E5A00D]/30 space-y-1">
            <span className="font-outfit text-[10px] font-extrabold uppercase text-[#D8C4A9] block">
              TOTAL MEALS
            </span>
            <span className="font-outfit text-2xl font-black text-[#FFF8EE] block">30 Bowls</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#1B4D3E] border border-[#E5A00D]/30 space-y-1">
            <span className="font-outfit text-[10px] font-extrabold uppercase text-[#E5A00D] block">
              REMAINING
            </span>
            <span className="font-outfit text-2xl font-black text-[#E5A00D] block">18 Bowls</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#1B4D3E] border border-[#E5A00D]/30 space-y-1">
            <span className="font-outfit text-[10px] font-extrabold uppercase text-[#D8C4A9] block">
              DAILY SLOTS
            </span>
            <span className="font-outfit text-2xl font-black text-[#FFF8EE] block">Lunch &amp; Dinner</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#1B4D3E] border border-[#E5A00D]/30 space-y-1">
            <span className="font-outfit text-[10px] font-extrabold uppercase text-[#D8C4A9] block">
              EXPIRATION
            </span>
            <span className="font-outfit text-xl font-black text-[#FFF8EE] block">Sept 15, 2026</span>
          </div>
        </div>
      </div>


      {/* =========================================================
          UPCOMING 7-DAY DISPATCH CALENDAR & SKIP MANAGER
          ========================================================= */}

      <div className="p-8 sm:p-10 bg-[#FFF8EE] border-4 border-[#0F3329] rounded-[2.5rem] shadow-[8px_8px_0px_#0F3329] space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-[#0F3329]/15 pb-4">
          <div>
            <span className="font-mouse-memoirs text-2xl text-[#E5A00D] uppercase font-bold tracking-widest block">
              7-DAY DISPATCH SCHEDULE
            </span>
            <h2 className="font-outfit font-black text-3xl text-[#0F3329] uppercase tracking-tight">
              MANAGE UPCOMING MEAL SLOTS
            </h2>
          </div>
          <span className="font-sans text-xs font-bold text-[#0F3329]/70 bg-[#f5e3cd] px-3.5 py-1.5 rounded-full border border-[#0F3329]/30">
            ℹ Cutoff to skip lunch: 11:30 AM • Dinner: 7:00 PM
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedule.map((day, idx) => (
            <div
              key={day.dateStr}
              className={`p-5 rounded-3xl border-3 transition-all flex flex-col justify-between space-y-4 ${
                day.isSkipped
                  ? "bg-red-50 border-red-500 shadow-[4px_4px_0px_#b91c1c]"
                  : "bg-[#f5e3cd] border-[#0F3329] shadow-[4px_4px_0px_#0F3329]"
              }`}
            >
              <div className="flex items-center justify-between border-b border-[#0F3329]/15 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-outfit text-xl font-black text-[#0F3329] bg-white px-3 py-1 rounded-xl border border-[#0F3329]">
                    {day.dayNum}
                  </span>
                  <div>
                    <span className="font-outfit text-xs font-black uppercase text-[#0F3329] block leading-none">
                      {day.dayName}
                    </span>
                    <span className="font-sans text-[10px] font-semibold text-[#0F3329]/60">
                      {day.dateStr}
                    </span>
                  </div>
                </div>

                <span
                  className={`font-outfit text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                    day.isSkipped
                      ? "bg-red-200 text-red-800 border-red-400"
                      : "bg-emerald-100 text-emerald-800 border-emerald-400"
                  }`}
                >
                  {day.isSkipped ? "SKIPPED" : "SCHEDULED"}
                </span>
              </div>

              {/* Dish Previews */}
              <div className="space-y-2.5 font-sans text-xs">
                <div className="p-2.5 rounded-xl bg-white/80 border border-[#0F3329]/15 flex items-center justify-between">
                  <div>
                    <span className="font-outfit text-[10px] font-extrabold text-[#E5A00D] bg-[#0F3329] px-2 py-0.5 rounded-full uppercase block w-fit mb-0.5">
                      LUNCH
                    </span>
                    <span className="font-bold text-[#0F3329] block line-clamp-1">
                      {day.lunchDish}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/80 border border-[#0F3329]/15 flex items-center justify-between">
                  <div>
                    <span className="font-outfit text-[10px] font-extrabold text-[#E5A00D] bg-[#0F3329] px-2 py-0.5 rounded-full uppercase block w-fit mb-0.5">
                      DINNER
                    </span>
                    <span className="font-bold text-[#0F3329] block line-clamp-1">
                      {day.dinnerDish}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => toggleSkip(idx)}
                className={`w-full py-2.5 rounded-xl font-outfit text-xs font-black uppercase tracking-wider border-2 transition-all cursor-pointer ${
                  day.isSkipped
                    ? "bg-emerald-600 text-white border-emerald-800 hover:bg-emerald-700"
                    : "bg-white text-red-700 border-red-600 hover:bg-red-50"
                }`}
              >
                {day.isSkipped ? "✓ Restore Day" : "✕ Skip Day"}
              </button>
            </div>
          ))}
        </div>
      </div>


      {/* =========================================================
          RENEW / EXTEND SUBSCRIPTION PLAN CARDS
          ========================================================= */}

      <div className="p-8 sm:p-10 bg-[#FFF8EE] border-4 border-[#0F3329] rounded-[2.5rem] shadow-[8px_8px_0px_#0F3329] space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="font-mouse-memoirs text-2xl text-[#E5A00D] uppercase font-bold tracking-widest block">
            NEED MORE MEALS?
          </span>
          <h2 className="font-outfit font-black text-3xl sm:text-4xl text-[#0F3329] uppercase tracking-tight">
            RENEW OR EXTEND YOUR PLAN
          </h2>
          <p className="font-sans text-xs sm:text-sm text-[#0F3329]/70 font-semibold">
            Choose a plan that fits your routine. All plans come with free daily cloud kitchen dispatches and zero delivery fees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          
          {/* 7-DAY TRIAL PLAN */}
          <div className="p-6 rounded-3xl bg-[#f5e3cd] border-3 border-[#0F3329] space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="font-outfit text-xs font-black uppercase text-[#0F3329] bg-[#E5A00D] px-3 py-1 rounded-full border border-[#0F3329]">
                7-DAY TRIAL PLAN
              </span>
              <h3 className="font-outfit font-black text-3xl text-[#0F3329]">₹1,499</h3>
              <p className="font-sans text-xs text-[#0F3329]/70 font-bold">14 Fresh Meals • 2 Meals / Day</p>
            </div>
            <ul className="space-y-2 font-sans text-xs font-bold text-[#0F3329]">
              <li className="flex items-center gap-2">✓ Free Express Delivery</li>
              <li className="flex items-center gap-2">✓ Skip/Pause Anytime</li>
              <li className="flex items-center gap-2">✓ Full Menu Selection</li>
            </ul>
            <button className="w-full py-3 rounded-2xl bg-[#0F3329] text-[#f5e3cd] font-outfit text-xs font-black uppercase tracking-wider hover:bg-[#E5A00D] hover:text-[#0F3329] transition-all shadow-[3px_3px_0px_#071914]">
              Select Plan
            </button>
          </div>

          {/* 15-DAY FLEX PLAN */}
          <div className="p-6 rounded-3xl bg-[#f5e3cd] border-3 border-[#0F3329] space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="font-outfit text-xs font-black uppercase text-[#0F3329] bg-[#E5A00D] px-3 py-1 rounded-full border border-[#0F3329]">
                15-DAY FLEX PLAN
              </span>
              <h3 className="font-outfit font-black text-3xl text-[#0F3329]">₹2,999</h3>
              <p className="font-sans text-xs text-[#0F3329]/70 font-bold">30 Fresh Meals • Save 15%</p>
            </div>
            <ul className="space-y-2 font-sans text-xs font-bold text-[#0F3329]">
              <li className="flex items-center gap-2">✓ Free Express Delivery</li>
              <li className="flex items-center gap-2">✓ Skip/Pause Anytime</li>
              <li className="flex items-center gap-2">✓ Priority Kitchen Slots</li>
            </ul>
            <button className="w-full py-3 rounded-2xl bg-[#0F3329] text-[#f5e3cd] font-outfit text-xs font-black uppercase tracking-wider hover:bg-[#E5A00D] hover:text-[#0F3329] transition-all shadow-[3px_3px_0px_#071914]">
              Select Plan
            </button>
          </div>

          {/* 30-DAY FEAST CLUB PLAN */}
          <div className="p-6 rounded-3xl bg-[#0F3329] text-[#f5e3cd] border-4 border-[#0F3329] space-y-4 flex flex-col justify-between shadow-[6px_6px_0px_#071914] relative overflow-hidden">
            <div className="space-y-2">
              <span className="font-outfit text-xs font-black uppercase text-[#0F3329] bg-[#E5A00D] px-3 py-1 rounded-full border border-[#0F3329]">
                BEST VALUE • 30-DAY FEAST
              </span>
              <h3 className="font-outfit font-black text-3xl text-[#E5A00D]">₹5,499</h3>
              <p className="font-sans text-xs text-[#D8C4A9] font-bold">60 Fresh Meals • Save 30%</p>
            </div>
            <ul className="space-y-2 font-sans text-xs font-bold text-[#FFF8EE]">
              <li className="flex items-center gap-2">✓ Free VIP Delivery</li>
              <li className="flex items-center gap-2">✓ Unlimited Free Swaps</li>
              <li className="flex items-center gap-2">✓ Dedicated Support</li>
            </ul>
            <button className="w-full py-3 rounded-2xl bg-[#E5A00D] text-[#0F3329] font-outfit text-xs font-black uppercase tracking-wider hover:bg-white transition-all shadow-[3px_3px_0px_#000]">
              Renew 30-Day Plan
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
