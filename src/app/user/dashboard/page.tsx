"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  CalendarCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  ArrowRight,
  Flame,
  Utensils,
  ChevronRight,
  MapPin,
  TrendingUp,
  Star,
  RefreshCw,
  Plus,
} from "lucide-react";

import dumBiryaniImg from "../../../../../public/dum_biryani_hero.png";
import heroDishImg from "../../../../../public/hero_dish.png";
import paneerImg from "../../../../../public/paneer.png";
import biryaniImg from "../../../../../public/biryani.png";

export default function UserDashboardPage() {
  const [lunchSkipped, setLunchSkipped] = useState(false);
  const [dinnerSkipped, setDinnerSkipped] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "menu">("overview");

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      
      {/* =========================================================
          WELCOME HERO BANNER
          ========================================================= */}
      
      <div className="p-8 sm:p-10 bg-[#FFF8EE] border-4 border-[#0F3329] rounded-[2.5rem] shadow-[8px_8px_0px_#0F3329] relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1 rounded-full bg-[#0F3329] text-[#E5A00D] font-outfit text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-[2px_2px_0px_#E5A00D]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ACTIVE SUBSCRIPTION MEMBER</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-sans font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Kitchen Open • Dispatching</span>
            </span>
          </div>

          <h1 className="font-outfit font-black text-3xl sm:text-5xl text-[#0F3329] uppercase tracking-tight leading-none">
            WELCOME BACK, <span className="text-[#1B4D3E]">FEAST CLUBBER!</span>
          </h1>
          <p className="font-sans text-sm sm:text-base text-[#0F3329]/80 font-medium">
            Your fresh artisanal meals are prepared daily. Manage today&apos;s slots, customize tomorrow&apos;s menu, or track live dispatches.
          </p>
        </div>

        <div className="shrink-0 flex flex-wrap sm:flex-nowrap gap-3 relative z-10 w-full md:w-auto">
          <Link
            href="/user/subscriptions"
            className="flex-1 md:flex-none px-6 py-3.5 rounded-2xl bg-[#0F3329] text-[#f5e3cd] border-2 border-[#0F3329] font-outfit text-xs sm:text-sm font-black uppercase tracking-wider hover:bg-[#E5A00D] hover:text-[#0F3329] transition-all shadow-[4px_4px_0px_#071914] text-center"
          >
            Manage Plan
          </Link>
          <Link
            href="/#menu"
            className="flex-1 md:flex-none px-6 py-3.5 rounded-2xl bg-[#E5A00D] text-[#0F3329] border-2 border-[#0F3329] font-outfit text-xs sm:text-sm font-black uppercase tracking-wider hover:bg-white transition-all shadow-[4px_4px_0px_#0F3329] text-center"
          >
            Order Extra Bowl
          </Link>
        </div>
      </div>


      {/* =========================================================
          ACTIVE SUBSCRIPTION STATUS CARD
          ========================================================= */}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left 7 Cols: Active Plan & Today's Meals */}
        <div className="lg:col-span-7 space-y-8">
          
          <div className="p-7 bg-[#FFF8EE] border-4 border-[#0F3329] rounded-[2.5rem] shadow-[6px_6px_0px_#0F3329] space-y-6">
            <div className="flex items-center justify-between border-b-2 border-[#0F3329]/15 pb-4">
              <div>
                <span className="font-mouse-memoirs text-xl text-[#E5A00D] uppercase font-bold tracking-widest block">
                  CURRENT ACTIVE PLAN
                </span>
                <h2 className="font-outfit font-black text-2xl sm:text-3xl text-[#0F3329] uppercase tracking-tight">
                  30-DAY ARTISAN BIRYANI &amp; BOWL PLAN
                </h2>
              </div>
              <span className="px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 border-2 border-emerald-600 font-outfit text-xs font-extrabold uppercase tracking-wider">
                ACTIVE
              </span>
            </div>

            {/* Meal Balance Progress */}
            <div className="space-y-2">
              <div className="flex justify-between items-center font-outfit text-xs font-black uppercase tracking-wider text-[#0F3329]">
                <span>MEALS REMAINING BALANCE</span>
                <span className="text-[#E5A00D] bg-[#0F3329] px-3 py-0.5 rounded-full">
                  18 / 30 MEALS
                </span>
              </div>
              <div className="w-full h-4 rounded-full bg-[#0F3329]/10 border-2 border-[#0F3329] overflow-hidden p-0.5">
                <div className="h-full rounded-full bg-[#E5A00D] w-[60%] transition-all duration-1000 shadow-inner" />
              </div>
              <p className="font-sans text-xs text-[#0F3329]/70 font-semibold">
                Valid until Sept 15, 2026 • 12 Meals enjoyed this month
              </p>
            </div>

            {/* Today's Meal Slots */}
            <div className="space-y-4 pt-2">
              <span className="font-outfit text-xs font-black uppercase tracking-widest text-[#0F3329] block">
                TODAY&apos;S SCHEDULED SLOTS (AUG 18)
              </span>

              {/* LUNCH SLOT */}
              <div className="p-4 rounded-2xl bg-[#f5e3cd] border-3 border-[#0F3329] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-xl bg-[#0F3329] p-1 shrink-0 relative overflow-hidden border border-[#E5A00D]/40">
                    <Image src={dumBiryaniImg} alt="Lunch Dish" fill className="object-contain p-1" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-outfit text-xs font-extrabold text-[#E5A00D] bg-[#0F3329] px-2 py-0.5 rounded-full uppercase">
                        LUNCH • 12:30 PM
                      </span>
                      {lunchSkipped && (
                        <span className="font-outfit text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full uppercase border border-red-300">
                          SKIPPED
                        </span>
                      )}
                    </div>
                    <h3 className="font-outfit font-extrabold text-base text-[#0F3329] uppercase mt-1">
                      Hyderabadi Chicken Dum Biryani
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setLunchSkipped(!lunchSkipped)}
                  className={`px-4 py-2 rounded-xl font-outfit text-xs font-extrabold uppercase tracking-wider border-2 transition-all shrink-0 ${
                    lunchSkipped
                      ? "bg-emerald-600 text-white border-emerald-800 hover:bg-emerald-700"
                      : "bg-white text-red-700 border-red-600 hover:bg-red-50"
                  }`}
                >
                  {lunchSkipped ? "Unskip Slot" : "Skip Lunch"}
                </button>
              </div>

              {/* DINNER SLOT */}
              <div className="p-4 rounded-2xl bg-[#f5e3cd] border-3 border-[#0F3329] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-xl bg-[#0F3329] p-1 shrink-0 relative overflow-hidden border border-[#E5A00D]/40">
                    <Image src={paneerImg} alt="Dinner Dish" fill className="object-contain p-1" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-outfit text-xs font-extrabold text-[#E5A00D] bg-[#0F3329] px-2 py-0.5 rounded-full uppercase">
                        DINNER • 8:00 PM
                      </span>
                      {dinnerSkipped && (
                        <span className="font-outfit text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full uppercase border border-red-300">
                          SKIPPED
                        </span>
                      )}
                    </div>
                    <h3 className="font-outfit font-extrabold text-base text-[#0F3329] uppercase mt-1">
                      Royal Paneer Tikka Deluxe Bowl
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setDinnerSkipped(!dinnerSkipped)}
                  className={`px-4 py-2 rounded-xl font-outfit text-xs font-extrabold uppercase tracking-wider border-2 transition-all shrink-0 ${
                    dinnerSkipped
                      ? "bg-emerald-600 text-white border-emerald-800 hover:bg-emerald-700"
                      : "bg-white text-red-700 border-red-600 hover:bg-red-50"
                  }`}
                >
                  {dinnerSkipped ? "Unskip Slot" : "Skip Dinner"}
                </button>
              </div>

            </div>
          </div>

          {/* ACTIVE DISPATCH LIVE TRACKER CARD */}
          <div className="p-6 bg-[#0F3329] text-[#f5e3cd] border-4 border-[#0F3329] rounded-[2.5rem] shadow-[6px_6px_0px_#071914] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5A00D]/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#E5A00D] animate-ping" />
                <span className="font-outfit text-xs font-black uppercase tracking-wider text-[#E5A00D]">
                  LIVE DISPATCH STATUS • ORDER #Q1B-8942
                </span>
              </div>
              <span className="font-outfit text-xs font-extrabold text-[#E5A00D] bg-[#1B4D3E] px-3 py-1 rounded-full border border-[#E5A00D]/30">
                OUT FOR DELIVERY
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="font-outfit font-black text-xl uppercase text-[#FFF8EE]">
                    Lunch Dispatch On The Way
                  </h3>
                  <p className="font-sans text-xs text-[#D8C4A9] mt-0.5">
                    Rider Ramesh K. • Hero Splendor (TS 09 EQ 4821)
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-outfit text-xs font-bold uppercase text-[#D8C4A9] block">EST. ARRIVAL</span>
                  <span className="font-outfit text-2xl font-black text-[#E5A00D]">12:45 PM</span>
                </div>
              </div>

              {/* Progress Steps */}
              <div className="grid grid-cols-4 gap-2 pt-2">
                <div className="h-2 rounded-full bg-[#E5A00D]" />
                <div className="h-2 rounded-full bg-[#E5A00D]" />
                <div className="h-2 rounded-full bg-[#E5A00D] animate-pulse" />
                <div className="h-2 rounded-full bg-[#1B4D3E]" />
              </div>

              <div className="flex justify-between font-outfit text-[10px] font-bold uppercase text-[#D8C4A9]">
                <span>Placed</span>
                <span>Preparing</span>
                <span className="text-[#E5A00D]">Out for Delivery</span>
                <span>Delivered</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right 5 Cols: Stats & Saved Addresses */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* STATS OVERVIEW */}
          <div className="p-7 bg-[#FFF8EE] border-4 border-[#0F3329] rounded-[2.5rem] shadow-[6px_6px_0px_#0F3329] space-y-5">
            <span className="font-mouse-memoirs text-xl text-[#E5A00D] uppercase font-bold tracking-widest block">
              YOUR SUBSCRIPTION SAVINGS
            </span>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#f5e3cd] border-3 border-[#0F3329] space-y-1">
                <span className="font-outfit text-[10px] font-extrabold uppercase text-[#0F3329]/70 block">
                  MEALS ENJOYED
                </span>
                <span className="font-outfit text-3xl font-black text-[#0F3329] block">
                  12 Bowls
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#0F3329] text-[#f5e3cd] border-3 border-[#0F3329] space-y-1">
                <span className="font-outfit text-[10px] font-extrabold uppercase text-[#E5A00D] block">
                  TOTAL SAVED
                </span>
                <span className="font-outfit text-3xl font-black text-[#E5A00D] block">
                  ₹1,450
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border-2 border-[#0F3329] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#E5A00D] text-[#0F3329]">
                  <Star className="w-5 h-5 fill-[#0F3329]" />
                </div>
                <div>
                  <span className="font-outfit text-xs font-extrabold uppercase text-[#0F3329] block">
                    MOST ORDERED DISH
                  </span>
                  <span className="font-sans text-xs font-bold text-[#0F3329]/70">
                    Hyderabadi Chicken Dum Biryani
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* DEFAULT DELIVERY ADDRESS CARD */}
          <div className="p-7 bg-[#FFF8EE] border-4 border-[#0F3329] rounded-[2.5rem] shadow-[6px_6px_0px_#0F3329] space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mouse-memoirs text-xl text-[#E5A00D] uppercase font-bold tracking-widest">
                DEFAULT DELIVERY LOCATION
              </span>
              <Link
                href="/user/addresses"
                className="font-outfit text-xs font-extrabold uppercase text-[#1B4D3E] underline hover:text-[#E5A00D]"
              >
                Change
              </Link>
            </div>

            <div className="p-4 rounded-2xl bg-[#f5e3cd] border-2 border-[#0F3329] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-outfit text-xs font-black uppercase text-[#0F3329] bg-[#E5A00D] px-2.5 py-0.5 rounded-full border border-[#0F3329]">
                  HOME ADDRESS
                </span>
                <span className="font-sans text-xs font-bold text-emerald-800">
                  ✓ Verified Serviceable Area
                </span>
              </div>
              <p className="font-sans text-xs font-bold text-[#0F3329] leading-relaxed">
                Flat 402, Golden Heights Appts, Road No 12, Jubilee Hills, Hyderabad - 500033
              </p>
            </div>
          </div>

        </div>

      </div>


      {/* =========================================================
          EXPLORE TODAY'S FEATURED KITCHEN BOWL MENU
          ========================================================= */}

      <div className="p-8 sm:p-10 bg-[#FFF8EE] border-4 border-[#0F3329] rounded-[2.5rem] shadow-[8px_8px_0px_#0F3329] space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-[#0F3329]/15 pb-4">
          <div>
            <span className="font-mouse-memoirs text-2xl text-[#E5A00D] uppercase font-bold tracking-widest block">
              ADDITIONAL MEAL BOWLS
            </span>
            <h2 className="font-outfit font-black text-3xl sm:text-4xl text-[#0F3329] uppercase tracking-tight">
              FRESH A LA CARTE DISHES TODAY
            </h2>
          </div>
          <Link
            href="/#menu"
            className="inline-flex items-center gap-2 font-outfit text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#0F3329] hover:text-[#E5A00D] transition-colors"
          >
            <span>View Full Menu</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* ITEM 1 */}
          <div className="p-4 rounded-3xl bg-[#f5e3cd] border-3 border-[#0F3329] space-y-3 flex flex-col justify-between group hover:shadow-[4px_4px_0px_#0F3329] transition-all">
            <div className="relative h-44 w-full rounded-2xl bg-[#0F3329] border-2 border-[#0F3329] overflow-hidden flex items-center justify-center p-2">
              <Image src={heroDishImg} alt="Protein Harvest Bowl" fill className="object-contain p-2 group-hover:scale-105 transition-transform" />
              <span className="absolute top-2 right-2 font-outfit text-[10px] font-black uppercase text-[#0F3329] bg-[#E5A00D] px-2 py-0.5 rounded-full">
                ★ 4.9
              </span>
            </div>
            <div>
              <h3 className="font-outfit font-black text-base uppercase text-[#0F3329]">
                Protein Harvest Bowl
              </h3>
              <p className="font-sans text-xs text-[#0F3329]/70 font-semibold mt-0.5">
                540 kcal • 38g Protein
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#0F3329]/15">
              <span className="font-outfit text-lg font-black text-[#0F3329]">₹249</span>
              <button className="px-3 py-1.5 rounded-xl bg-[#0F3329] text-[#E5A00D] border border-[#0F3329] font-outfit text-xs font-black uppercase tracking-wider hover:bg-[#E5A00D] hover:text-[#0F3329] transition-all flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* ITEM 2 */}
          <div className="p-4 rounded-3xl bg-[#f5e3cd] border-3 border-[#0F3329] space-y-3 flex flex-col justify-between group hover:shadow-[4px_4px_0px_#0F3329] transition-all">
            <div className="relative h-44 w-full rounded-2xl bg-[#0F3329] border-2 border-[#0F3329] overflow-hidden flex items-center justify-center p-2">
              <Image src={dumBiryaniImg} alt="Hyderabadi Dum Biryani" fill className="object-contain p-2 group-hover:scale-105 transition-transform" />
              <span className="absolute top-2 right-2 font-outfit text-[10px] font-black uppercase text-[#0F3329] bg-[#E5A00D] px-2 py-0.5 rounded-full">
                ★ 4.9
              </span>
            </div>
            <div>
              <h3 className="font-outfit font-black text-base uppercase text-[#0F3329]">
                Hyderabadi Dum Biryani
              </h3>
              <p className="font-sans text-xs text-[#0F3329]/70 font-semibold mt-0.5">
                680 kcal • 32g Protein
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#0F3329]/15">
              <span className="font-outfit text-lg font-black text-[#0F3329]">₹299</span>
              <button className="px-3 py-1.5 rounded-xl bg-[#0F3329] text-[#E5A00D] border border-[#0F3329] font-outfit text-xs font-black uppercase tracking-wider hover:bg-[#E5A00D] hover:text-[#0F3329] transition-all flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* ITEM 3 */}
          <div className="p-4 rounded-3xl bg-[#f5e3cd] border-3 border-[#0F3329] space-y-3 flex flex-col justify-between group hover:shadow-[4px_4px_0px_#0F3329] transition-all">
            <div className="relative h-44 w-full rounded-2xl bg-[#0F3329] border-2 border-[#0F3329] overflow-hidden flex items-center justify-center p-2">
              <Image src={paneerImg} alt="Royal Paneer Tikka Bowl" fill className="object-contain p-2 group-hover:scale-105 transition-transform" />
              <span className="absolute top-2 right-2 font-outfit text-[10px] font-black uppercase text-[#0F3329] bg-[#E5A00D] px-2 py-0.5 rounded-full">
                ★ 4.8
              </span>
            </div>
            <div>
              <h3 className="font-outfit font-black text-base uppercase text-[#0F3329]">
                Royal Paneer Tikka Bowl
              </h3>
              <p className="font-sans text-xs text-[#0F3329]/70 font-semibold mt-0.5">
                590 kcal • 24g Protein
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#0F3329]/15">
              <span className="font-outfit text-lg font-black text-[#0F3329]">₹239</span>
              <button className="px-3 py-1.5 rounded-xl bg-[#0F3329] text-[#E5A00D] border border-[#0F3329] font-outfit text-xs font-black uppercase tracking-wider hover:bg-[#E5A00D] hover:text-[#0F3329] transition-all flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* ITEM 4 */}
          <div className="p-4 rounded-3xl bg-[#f5e3cd] border-3 border-[#0F3329] space-y-3 flex flex-col justify-between group hover:shadow-[4px_4px_0px_#0F3329] transition-all">
            <div className="relative h-44 w-full rounded-2xl bg-[#0F3329] border-2 border-[#0F3329] overflow-hidden flex items-center justify-center p-2">
              <Image src={biryaniImg} alt="Special Artisanal Dum Biryani" fill className="object-contain p-2 group-hover:scale-105 transition-transform" />
              <span className="absolute top-2 right-2 font-outfit text-[10px] font-black uppercase text-[#0F3329] bg-[#E5A00D] px-2 py-0.5 rounded-full">
                ★ 4.9
              </span>
            </div>
            <div>
              <h3 className="font-outfit font-black text-base uppercase text-[#0F3329]">
                Special Artisanal Biryani
              </h3>
              <p className="font-sans text-xs text-[#0F3329]/70 font-semibold mt-0.5">
                710 kcal • 35g Protein
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#0F3329]/15">
              <span className="font-outfit text-lg font-black text-[#0F3329]">₹329</span>
              <button className="px-3 py-1.5 rounded-xl bg-[#0F3329] text-[#E5A00D] border border-[#0F3329] font-outfit text-xs font-black uppercase tracking-wider hover:bg-[#E5A00D] hover:text-[#0F3329] transition-all flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
