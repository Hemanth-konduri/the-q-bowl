"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles, Clock, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";

interface SubPackage {
  id: string;
  name: string;
  mealCredits: number;
  discount: number;
  isFeatured?: boolean;
}

export default function Pricing() {
  const router = useRouter();
  const [packages, setPackages] = useState<SubPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<SubPackage | null>(null);
  const [selectedTimings, setSelectedTimings] = useState<string[]>(["LUNCH", "DINNER"]);
  const [subscribing, setSubscribing] = useState(false);

  // Fetch active admin-selected packages from backend
  useEffect(() => {
    async function loadPackages() {
      try {
        setLoadingPackages(true);
        const res = await fetch("/api/subscription-packages");
        if (res.ok) {
          const data = await res.json();
          if (data.packages && Array.isArray(data.packages) && data.packages.length > 0) {
            setPackages(data.packages);
            const featured = data.packages.find((p: SubPackage) => p.isFeatured) || data.packages[0];
            setSelectedPackage(featured);
          }
        }
      } catch (err) {
        console.error("Failed to load subscription packages:", err);
      } finally {
        setLoadingPackages(false);
      }
    }

    loadPackages();
  }, []);

  const activeCredits = selectedPackage?.mealCredits || 20;
  const mealsPerDay = Math.max(1, selectedTimings.length);
  const durationDays = Math.ceil(activeCredits / mealsPerDay);

  const pricePerMeal = 55;
  const baseTotal = activeCredits * pricePerMeal;
  const discount = selectedPackage?.discount || 0;
  const totalPrice = Math.max(0, baseTotal - discount);
  const originalRetailTotal = activeCredits * 75;
  const totalSavings = originalRetailTotal - totalPrice;

  const toggleTiming = (timing: string) => {
    if (selectedTimings.includes(timing)) {
      if (selectedTimings.length > 1) {
        setSelectedTimings(selectedTimings.filter((t) => t !== timing));
      }
    } else {
      setSelectedTimings([...selectedTimings, timing]);
    }
  };

  // Auth verification and redirection with pre-selected package
  const handleSubscribeClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    setSubscribing(true);

    const targetPackageId = selectedPackage?.id || "";
    const targetCredits = selectedPackage?.mealCredits || 20;

    // Save package selection in sessionStorage for dashboard hydration
    try {
      sessionStorage.setItem(
        "qbowl_selected_subscription",
        JSON.stringify({
          packageId: targetPackageId,
          mealCredits: targetCredits,
          timings: selectedTimings,
        })
      );
    } catch {
      // ignore storage errors
    }

    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const user = await res.json();
        if (user && user.id) {
          if (user.role === "ADMIN") {
            router.push("/admin/dashboard");
            return;
          }
          if (user.role === "DELIVERY_STAFF") {
            router.push("/delivery-dashboard");
            return;
          }
          router.push(`/dashboard?packageId=${targetPackageId}&credits=${targetCredits}#subscriptions`);
          return;
        }
      }
    } catch {
      // ignore
    }

    // Not authenticated -> redirect to login with return redirect
    const returnUrl = encodeURIComponent(`/dashboard?packageId=${targetPackageId}&credits=${targetCredits}#subscriptions`);
    router.push(`/login?redirect=${returnUrl}`);
  };

  return (
    <section id="subscriptions" data-nav-dark="false" className="py-20 sm:py-24 bg-[#f5e3cd] text-black relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="gsap-reveal text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <span className="font-mouse-memoirs text-xl sm:text-2xl text-black uppercase font-bold tracking-widest block mb-2">
            MEAL CREDIT SUBSCRIPTION SYSTEM
          </span>
          <h2 className="font-outfit text-3xl sm:text-6xl font-extrabold text-black uppercase tracking-tight leading-none">
            FLEXIBLE MEAL CREDITS &amp; ZERO WASTAGE
          </h2>
          <p className="font-sans text-xs sm:text-base text-black/80 mt-2.5 sm:mt-3 font-normal">
            Pay per meal credit. Skip any meal anytime — skipped meals automatically extend your subscription end date.
          </p>
        </div>

        {/* Core Business Model Banner */}
        <div className="gsap-reveal max-w-4xl mx-auto mb-8 sm:mb-12 retro-card p-5 sm:p-8 bg-[#FFF8EE] border-2 border-black flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6 shadow-[4px_4px_0_#000] sm:shadow-[5px_5px_0_#000]">
          <div className="flex items-start gap-3.5 sm:gap-4">
            <div className="p-3 rounded-2xl bg-black text-[#E5A00D] shrink-0 border-2 border-black">
              <Sparkles className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <h4 className="font-outfit text-xl sm:text-2xl font-bold text-black">
                How Meal Credits Work
              </h4>
              <p className="font-sans text-xs sm:text-sm text-black/80 mt-1 leading-relaxed">
                Purchasing <strong>{activeCredits} Meal Credits</strong> with <strong>{selectedTimings.join(" & ")}</strong> delivers {mealsPerDay} meal{mealsPerDay > 1 ? "s" : ""} daily for <strong>{durationDays} days</strong>. Credits decrease <strong>ONLY after delivery partner confirms delivery</strong>.
              </p>
            </div>
          </div>
          <div className="shrink-0 text-center md:text-right border-t md:border-t-0 md:border-l-2 border-black/20 pt-3 md:pt-0 md:pl-6">
            <span className="font-outfit text-sm sm:text-base font-bold text-black block">Automated Area Batching</span>
            <span className="font-sans text-xs text-black/70 font-medium">Batch assigned automatically</span>
          </div>
        </div>

        {/* Interactive Configurator Container */}
        <div className="grid lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          
          {/* Controls */}
          <div className="gsap-reveal lg:col-span-7 retro-card p-5 sm:p-8 bg-white border-2 border-black/20 space-y-5 sm:space-y-8 shadow-[5px_5px_0_#000] sm:shadow-[6px_6px_0_#000]">
            <div>
              <h3 className="font-outfit text-xl sm:text-2xl font-bold text-black uppercase">Build Your Custom Subscription</h3>
              <p className="font-sans text-xs text-black/70 mt-1 font-medium">Select your active meal package and daily delivery timings.</p>
            </div>

            {/* 1. Meal Credit Selector (Live from Backend) */}
            <div>
              <label className="font-outfit text-xs font-bold uppercase tracking-wider text-black block mb-2 sm:mb-3">
                1. Select Meal Package (Admin Activated)
              </label>

              {loadingPackages ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="p-4 rounded-xl border-2 border-black/10 bg-[#FFF8EE]/60 animate-pulse h-20" />
                  ))}
                </div>
              ) : packages.length > 0 ? (
                <div className={`grid ${packages.length <= 2 ? "grid-cols-2" : packages.length === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"} gap-2.5 sm:gap-3`}>
                  {packages.map((pkg) => {
                    const isSelected = selectedPackage?.id === pkg.id;
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => setSelectedPackage(pkg)}
                        className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all text-left ${
                          isSelected
                            ? "bg-black border-black text-white shadow-[2px_2px_0px_#000000] sm:shadow-[4px_4px_0px_#000000]"
                            : "bg-[#FFF8EE] border-black text-black hover:bg-[#E5A00D]/20"
                        }`}
                      >
                        <div className="font-outfit text-base sm:text-xl font-bold">{pkg.mealCredits} Meals</div>
                        <div className="font-sans text-[10px] sm:text-[11px] opacity-90 font-medium mt-0.5 sm:mt-1">
                          {pkg.discount > 0 ? `Save ₹${pkg.discount}` : "Standard Plan"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-xl border-2 border-black bg-[#FFF8EE] text-xs font-bold text-center">
                  20 Meals Package Active
                </div>
              )}
            </div>

            {/* 2. Daily Timings Selector */}
            <div>
              <label className="font-outfit text-xs font-bold uppercase tracking-wider text-black block mb-2 sm:mb-3">
                2. Choose Daily Delivery Timings (Multi-select)
              </label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[
                  { id: "BREAKFAST", title: "Breakfast", time: "7:30 - 8:30 AM", icon: "🌅" },
                  { id: "LUNCH", title: "Lunch", time: "12:00 - 1:00 PM", icon: "☀️" },
                  { id: "DINNER", title: "Dinner", time: "7:30 - 8:30 PM", icon: "🌙" },
                ].map((timing) => {
                  const isSelected = selectedTimings.includes(timing.id);
                  return (
                    <button
                      key={timing.id}
                      type="button"
                      onClick={() => toggleTiming(timing.id)}
                      className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border-2 text-left transition-all ${
                        isSelected
                          ? "bg-black border-black text-white shadow-[2px_2px_0px_#000000] sm:shadow-[4px_4px_0px_#000000]"
                          : "bg-[#FFF8EE] border-black text-black hover:bg-[#E5A00D]/20"
                      }`}
                    >
                      <span className="text-lg sm:text-xl block mb-1">{timing.icon}</span>
                      <div className="font-outfit text-xs sm:text-sm font-bold">{timing.title}</div>
                      <div className="font-sans text-[9px] sm:text-[10px] opacity-80 mt-0.5">{timing.time}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Included Advantages */}
            <div className="pt-4 border-t-2 border-black/20 space-y-2">
              <div className="flex items-center gap-2.5 font-sans text-xs text-black font-medium">
                <Check className="w-4 h-4 text-black shrink-0" />
                <span>Credit deduction happens ONLY upon successful delivery</span>
              </div>
              <div className="flex items-center gap-2.5 font-sans text-xs text-black font-medium">
                <Check className="w-4 h-4 text-black shrink-0" />
                <span>Skipped meals extend subscription schedule automatically</span>
              </div>
              <div className="flex items-center gap-2.5 font-sans text-xs text-black font-medium">
                <Check className="w-4 h-4 text-black shrink-0" />
                <span>Automated delivery batch resolution based on pinned area</span>
              </div>
            </div>

          </div>

          {/* Telemetry & Price Summary Card */}
          <div className="gsap-reveal lg:col-span-5 retro-card-dark p-5 sm:p-8 border-4 border-[#E5A00D] flex flex-col justify-between h-full bg-black shadow-[6px_6px_0_#E5A00D]">
            <div>
              <span className="font-outfit text-xs font-bold text-[#E5A00D] uppercase tracking-wider block mb-3 sm:mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                SUBSCRIPTION TELEMETRY
              </span>

              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <h4 className="font-outfit text-2xl font-bold text-white">{activeCredits} Meal Credits</h4>
                  <p className="font-sans text-xs text-[#f5e3cd] font-light">
                    {selectedTimings.join(" + ")} ({mealsPerDay} Meals/Day)
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-outfit text-3xl sm:text-4xl font-extrabold text-[#E5A00D]">₹{totalPrice}</span>
                  {totalSavings > 0 && (
                    <span className="font-sans text-xs text-white block line-through opacity-70">
                      ₹{originalRetailTotal}
                    </span>
                  )}
                </div>
              </div>

              {/* Dynamic Telemetry Box */}
              <div className="bg-zinc-900 p-3.5 sm:p-4 rounded-xl border border-[#E5A00D]/40 space-y-2 sm:space-y-2.5 mb-5 sm:mb-6 font-sans text-xs">
                <div className="flex justify-between text-[#f5e3cd]">
                  <span>Daily Frequency:</span>
                  <strong className="text-white font-bold">{mealsPerDay} Meals / Day</strong>
                </div>
                <div className="flex justify-between text-[#f5e3cd]">
                  <span>Total Plan Duration:</span>
                  <strong className="text-white font-bold">{durationDays} Days</strong>
                </div>
                <div className="flex justify-between text-[#f5e3cd]">
                  <span>Effective Meal Price:</span>
                  <strong className="text-white font-bold">₹{Math.round(totalPrice / activeCredits)} / meal</strong>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-[#E5A00D] font-bold pt-1.5 border-t border-[#E5A00D]/30">
                    <span>Package Discount:</span>
                    <span>Save ₹{discount}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2.5 sm:space-y-3">
              <button
                type="button"
                onClick={handleSubscribeClick}
                disabled={subscribing}
                className="w-full py-3 sm:py-3.5 rounded-full font-outfit font-bold text-sm sm:text-base text-black bg-[#E5A00D] hover:bg-white active:scale-95 transition text-center flex items-center justify-center gap-2 uppercase shadow-[3px_3px_0px_#000] sm:shadow-[4px_4px_0px_#000]"
              >
                {subscribing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Verifying Session...</span>
                  </>
                ) : (
                  <>
                    <span>Configure &amp; Subscribe Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <p className="font-sans text-[10px] sm:text-[11px] text-[#D8C4A9] text-center font-light flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#E5A00D]" />
                Full credit refund guarantee before 1st delivery
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

