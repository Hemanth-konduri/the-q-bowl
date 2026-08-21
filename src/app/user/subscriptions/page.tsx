"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarCheck,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Utensils,
  Plus,
  AlertCircle,
  Check,
  ArrowRight,
  Package,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Truck,
  Flame,
  Zap,
} from "lucide-react";
import gsap from "gsap";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  
  // State for Billing Toggle (Weekly vs Monthly)
  const [billingCycle, setBillingCycle] = useState<"weekly" | "monthly">("monthly");
  
  // State for showing/collapsing pricing catalog if already subscribed
  const [showCatalog, setShowCatalog] = useState(false);

  // State for FAQ Accordion open items
  const [openFaq, setOpenFaq] = useState<number | null>(0);

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

  // GSAP Entrance Animation
  useEffect(() => {
    if (!loading && containerRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          ".gsap-sub-fade",
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power2.out" }
        );

        // Progress bar fill animation
        gsap.fromTo(
          ".gsap-sub-progress",
          { width: "0%" },
          { duration: 0.9, ease: "power3.out", delay: 0.2 }
        );
      }, containerRef);

      return () => ctx.revert();
    }
  }, [loading]);

  // GSAP Billing Cycle Switch Animation
  const handleBillingSwitch = (cycle: "weekly" | "monthly") => {
    if (cycle === billingCycle) return;
    setBillingCycle(cycle);

    if (cardsRef.current) {
      gsap.fromTo(
        cardsRef.current.children,
        { opacity: 0, y: 12, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.08, ease: "power2.out" }
      );
    }
  };

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
      <div className="py-24 text-center space-y-4 max-w-md mx-auto">
        <div className="w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="font-outfit text-xs font-bold uppercase tracking-wider text-black">
          Fetching subscription plans...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-[12px] bg-red-50 border-2 border-red-400 text-red-800 space-y-4 max-w-xl mx-auto my-12 text-center">
        <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
        <h2 className="font-outfit text-lg font-bold uppercase">Subscription Load Error</h2>
        <p className="font-sans text-xs">{error || "Unable to load subscription details."}</p>
        <button
          onClick={fetchSubscriptions}
          className="px-5 py-2.5 rounded-[10px] bg-black text-[#f5e3cd] font-outfit text-xs font-bold uppercase"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  const sub = data.activeSubscription;

  // Days remaining calculation
  let daysRemaining = 0;
  if (sub) {
    const end = new Date(sub.expectedEndDate).getTime();
    const now = new Date().getTime();
    daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  }

  const dbPlans = data?.availablePlans || [];

  const faqs = [
    {
      q: "Can I pause my subscription?",
      a: "Yes! You can pause or resume your subscription at any time with a single click. Unused meal credits never expire while paused and will automatically roll over to your next active period.",
    },
    {
      q: "Can I change my delivery address?",
      a: "Absolutely. You can update your default delivery address or select a temporary dispatch location (e.g. office vs. home) up to 2 hours before your selected delivery slot.",
    },
    {
      q: "What if I miss a delivery?",
      a: "If you know in advance that you'll be unavailable, simply tap 'Skip Day' on your calendar before 10 AM. If a delivery is missed, our rider will notify you and place it in safe insulated drop-boxes.",
    },
    {
      q: "Can I upgrade or change my plan later?",
      a: "Yes, you can upgrade your plan anytime. Any remaining credits from your current subscription will be prorated and credited directly toward your new plan.",
    },
  ];

  return (
    <div ref={containerRef} className="space-y-8 pb-16 max-w-6xl mx-auto">
      
      {/* =========================================================
          1. PAGE HEADER
          ========================================================= */}
      <div className="gsap-sub-fade p-6 sm:p-8 bg-[#FFF8EE] border-2 border-black/15 rounded-[12px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <span className="px-3 py-1 rounded-[6px] bg-[#E5A00D] text-black font-outfit text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Q1 MEAL SUBSCRIPTIONS</span>
          </span>
          <h1 className="font-outfit font-black text-3xl sm:text-5xl text-black uppercase tracking-tight leading-none">
            Subscription Plans
          </h1>
          <p className="font-sans text-xs sm:text-sm text-black/70 font-medium leading-relaxed">
            Choose a plan that fits your lifestyle. Fresh, chef-prepared artisan bowls delivered daily to your home or office.
          </p>
        </div>

        {/* Healthy Food Illustration Badge */}
        <div className="shrink-0 relative w-24 h-24 sm:w-28 sm:h-28 rounded-[12px] bg-black p-2 border-2 border-black overflow-hidden flex items-center justify-center self-end sm:self-center">
          <Image
            src="/hero_dish.png"
            alt="Healthy meal bowl"
            fill
            className="object-contain p-2 hover:scale-105 transition-transform duration-300"
          />
        </div>
      </div>


      {/* =========================================================
          2. ACTIVE SUBSCRIPTION STATE CARD (If user has active plan)
          ========================================================= */}
      {sub ? (
        <div className="gsap-sub-fade p-6 sm:p-7 bg-[#FFF8EE] border-2 border-black rounded-[12px] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black/15 pb-4">
            <div>
              <span className="font-outfit text-[11px] font-black uppercase text-black bg-[#E5A00D] px-2.5 py-0.5 rounded-[6px] tracking-wider inline-block mb-1">
                YOUR ACTIVE ENROLLMENT
              </span>
              <h2 className="font-outfit font-black text-2xl sm:text-3xl text-black uppercase tracking-tight">
                {sub.planName || "Active Premium Plan"}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-[8px] bg-black text-[#E5A00D] font-outfit text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{sub.status}</span>
              </span>
              <span className="px-3 py-1 rounded-[8px] bg-[#f5e3cd] border border-black/20 font-outfit text-xs font-bold text-black uppercase">
                {sub.totalMeals >= 30 ? "Monthly Plan" : "Weekly Plan"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-[10px] bg-[#f5e3cd]/70 border border-black/15 space-y-1">
              <span className="font-sans text-[11px] font-semibold text-black/60 block uppercase">Days Remaining</span>
              <p className="font-outfit font-black text-base text-black">{daysRemaining} Days Left</p>
            </div>
            <div className="p-3.5 rounded-[10px] bg-[#f5e3cd]/70 border border-black/15 space-y-1">
              <span className="font-sans text-[11px] font-semibold text-black/60 block uppercase">Meals Remaining</span>
              <p className="font-outfit font-black text-base text-black">{sub.mealsRemaining} / {sub.totalMeals} Bowls</p>
            </div>
            <div className="p-3.5 rounded-[10px] bg-[#f5e3cd]/70 border border-black/15 space-y-1">
              <span className="font-sans text-[11px] font-semibold text-black/60 block uppercase">Expiration Date</span>
              <p className="font-outfit font-black text-xs text-black">
                {new Date(sub.expectedEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
            <div className="p-3.5 rounded-[10px] bg-[#f5e3cd]/70 border border-black/15 space-y-1">
              <span className="font-sans text-[11px] font-semibold text-black/60 block uppercase">Next Delivery Slot</span>
              <p className="font-outfit font-bold text-xs text-black">Today • 12:30 PM – 1:30 PM</p>
            </div>
          </div>

          {/* Usage Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center font-outfit text-xs font-bold uppercase tracking-wider text-black">
              <span>Subscription Meal Usage ({sub.mealsUsed} Meals Consumed)</span>
              <span>{Math.round(((sub.totalMeals - sub.mealsRemaining) / (sub.totalMeals || 1)) * 100)}% Complete</span>
            </div>
            <div className="w-full h-3 rounded-[6px] bg-black/10 border border-black/20 overflow-hidden">
              <div
                className="gsap-sub-progress h-full bg-black rounded-[5px]"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(0, ((sub.totalMeals - sub.mealsRemaining) / (sub.totalMeals || 1)) * 100)
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Manage & Pause Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={togglePause}
                disabled={updating}
                className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-[10px] font-outfit text-xs font-bold uppercase tracking-wider border-2 transition-all flex items-center justify-center gap-1.5 ${
                  sub.status === "PAUSED"
                    ? "bg-emerald-700 text-white border-emerald-800 hover:bg-emerald-800"
                    : "bg-[#f5e3cd] border-black text-black hover:bg-black hover:text-white"
                }`}
              >
                {sub.status === "PAUSED" ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
                <span>{updating ? "Updating..." : sub.status === "PAUSED" ? "Resume Plan" : "Pause Subscription"}</span>
              </button>
            </div>

            <button
              onClick={() => setShowCatalog(!showCatalog)}
              className="font-outfit text-xs font-bold uppercase text-black underline hover:text-[#E5A00D] transition-colors"
            >
              {showCatalog ? "Hide Plan Catalog ↑" : "Explore Other Plans / Change Plan ↓"}
            </button>
          </div>
        </div>
      ) : (
        /* =========================================================
            3. NO SUBSCRIPTION STATE CARD (For non-subscribed users)
            ========================================================= */
        <div className="gsap-sub-fade p-6 sm:p-8 bg-[#FFF8EE] border-2 border-black/15 rounded-[12px] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="font-outfit text-[11px] font-black uppercase text-black bg-[#E5A00D] px-2.5 py-0.5 rounded-[6px] tracking-wider inline-block">
                GET STARTED TODAY
              </span>
              <h2 className="font-outfit font-black text-2xl sm:text-3xl text-black uppercase tracking-tight">
                Start Your Meal Journey
              </h2>
              <p className="font-sans text-xs sm:text-sm text-black/70 font-medium">
                Enjoy daily freshly prepared meals with zero delivery fees. Flexible weekly &amp; monthly plans. Skip or pause anytime.
              </p>
            </div>

            <button
              onClick={() => {
                const el = document.getElementById("pricing-plans");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-6 py-3 rounded-[10px] bg-black text-[#f5e3cd] font-outfit text-xs font-bold uppercase tracking-wider hover:bg-[#E5A00D] hover:text-black transition-all shrink-0"
            >
              Choose a Plan
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <span className="px-3 py-1 rounded-[8px] bg-[#f5e3cd] border border-black/15 font-outfit text-xs font-bold text-black uppercase">
              ✓ Daily Freshly Cooked
            </span>
            <span className="px-3 py-1 rounded-[8px] bg-[#f5e3cd] border border-black/15 font-outfit text-xs font-bold text-black uppercase">
              ✓ Flexible Weekly &amp; Monthly
            </span>
            <span className="px-3 py-1 rounded-[8px] bg-[#f5e3cd] border border-black/15 font-outfit text-xs font-bold text-black uppercase">
              ✓ Skip or Pause Anytime
            </span>
          </div>
        </div>
      )}


      {/* Show pricing catalog if user has NO subscription OR toggled "showCatalog" */}
      {(!sub || showCatalog) && (
        <div id="pricing-plans" className="space-y-6 pt-4">
          
          {/* =========================================================
              4. BILLING TOGGLE (Segmented Control)
              ========================================================= */}
          <div className="gsap-sub-fade flex flex-col items-center justify-center space-y-3">
            <span className="font-outfit text-xs font-bold uppercase tracking-wider text-black/70">
              Select Billing Frequency
            </span>
            
            <div className="p-1 rounded-[10px] bg-[#FFF8EE] border-2 border-black/15 flex items-center gap-1">
              <button
                onClick={() => handleBillingSwitch("weekly")}
                className={`px-5 py-2 rounded-[8px] font-outfit text-xs font-bold uppercase tracking-wider transition-all ${
                  billingCycle === "weekly"
                    ? "bg-black text-[#E5A00D] shadow-[2px_2px_0px_#000]"
                    : "text-black/70 hover:text-black"
                }`}
              >
                Weekly Billing (7 Days)
              </button>
              <button
                onClick={() => handleBillingSwitch("monthly")}
                className={`px-5 py-2 rounded-[8px] font-outfit text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  billingCycle === "monthly"
                    ? "bg-black text-[#E5A00D] shadow-[2px_2px_0px_#000]"
                    : "text-black/70 hover:text-black"
                }`}
              >
                <span>Monthly Billing (30 Days)</span>
                <span className="px-1.5 py-0.2 rounded bg-[#E5A00D] text-black font-extrabold text-[9px]">SAVE 20%</span>
              </button>
            </div>
          </div>


          {/* =========================================================
              5. SUBSCRIPTION PLAN CARDS (3 Premium Plans)
              ========================================================= */}
          <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {dbPlans.map((plan: any) => {
              const displayPrice = billingCycle === "weekly"
                ? (plan.weeklyPrice || plan.price)
                : (plan.monthlyPrice || plan.price);
              const displayDuration = billingCycle === "weekly" ? "weekly" : "monthly";
              const featuresList = plan.features && plan.features.length > 0
                ? plan.features
                : [
                    "1 Freshly Prepared Chef Bowl / Day",
                    "Lunch or Dinner Delivery Slot",
                    "Free Doorstep Insulated Delivery",
                    "Pause or Skip Days Anytime",
                    "Weekly Rotating Kitchen Menu",
                  ];

              return (
                <div
                  key={plan.id}
                  className={`p-6 sm:p-7 rounded-[12px] bg-[#FFF8EE] transition-all duration-300 flex flex-col justify-between space-y-6 relative ${
                    plan.isPopular
                      ? "border-2 border-black shadow-[4px_4px_0px_#000000]"
                      : "border-2 border-black/15 hover:border-black/40 hover:scale-[1.02]"
                  }`}
                >
                  {/* Popular Badge for Featured Plan */}
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-0.5 rounded-full bg-black text-[#E5A00D] border border-black font-outfit text-[10px] font-black uppercase tracking-widest">
                      MOST POPULAR
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Plan Name & Tag */}
                    <div>
                      <span className="font-outfit text-xs font-bold uppercase text-black/60 block">
                        {plan.mealsPerDay || 1} {plan.mealsPerDay === 1 ? "Meal" : "Meals"} / Day
                      </span>
                      <h3 className="font-outfit font-black text-2xl text-black uppercase tracking-tight">
                        {plan.name}
                      </h3>
                      <p className="font-sans text-xs text-black/70 font-medium mt-0.5">
                        {plan.description || "Ideal for individuals starting clean daily eating"}
                      </p>
                    </div>

                    {/* Pricing */}
                    <div className="p-3.5 rounded-[10px] bg-[#f5e3cd]/60 border border-black/15 space-y-1">
                      <div className="flex items-baseline gap-1">
                        <span className="font-outfit font-black text-3xl text-black">₹{displayPrice}</span>
                        <span className="font-sans text-xs font-semibold text-black/60">/ {displayDuration}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-sans text-black/70 font-semibold pt-1 border-t border-black/10">
                        <span>{plan.caloriesRange || "450 – 600 kcal"}</span>
                        <span>{plan.deliveryFrequency || "Daily Dispatch"}</span>
                      </div>
                    </div>

                    {/* Feature Checkmarks */}
                    <div className="space-y-2 pt-2 font-sans text-xs text-black/80 font-medium">
                      {featuresList.map((feat: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-black shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Plan CTA Button */}
                  <Link
                    href={`/user/subscriptions/customise?planId=${plan.id}`}
                    className={`w-full py-3 rounded-[10px] font-outfit text-xs font-black uppercase tracking-wider text-center block transition-all shadow-md ${
                      plan.isPopular
                        ? "bg-[#0F3329] text-[#E5A00D] hover:bg-[#E5A00D] hover:text-[#0F3329] border-2 border-[#0F3329]"
                        : "bg-[#0F3329] text-[#f5e3cd] hover:bg-[#1B4D3E]"
                    }`}
                  >
                    Configure & Subscribe Now
                  </Link>
                </div>
              );
            })}
          </div>

        </div>
      )}


      {/* =========================================================
          6. WHAT'S INCLUDED (4 Icon Cards)
          ========================================================= */}
      <div className="gsap-sub-fade p-6 sm:p-8 bg-[#FFF8EE] border-2 border-black/15 rounded-[12px] space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <span className="font-outfit text-[11px] font-black uppercase text-black bg-[#E5A00D] px-2.5 py-0.5 rounded-[6px] tracking-wider inline-block">
            SUBSCRIPTION GUARANTEE
          </span>
          <h2 className="font-outfit font-black text-2xl sm:text-3xl text-black uppercase tracking-tight">
            What&apos;s Included In Every Plan
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: "Freshly Cooked Daily",
              desc: "Cooked from scratch every morning with zero frozen preservatives.",
              icon: Utensils,
            },
            {
              title: "Nutrition-Balanced",
              desc: "Calorie-counted and macro-split by certified dietitians.",
              icon: ShieldCheck,
            },
            {
              title: "Flexible Pause & Resume",
              desc: "Pause or skip days anytime. Unused meal credits never expire.",
              icon: PauseCircle,
            },
            {
              title: "Doorstep Delivery",
              desc: "Express insulated dispatch to your home or office on schedule.",
              icon: Truck,
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="p-5 rounded-[10px] bg-[#f5e3cd]/60 border border-black/15 space-y-2">
                <div className="p-2.5 rounded-[8px] bg-black text-[#E5A00D] w-fit">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="font-outfit font-bold text-base text-black uppercase">{item.title}</h4>
                <p className="font-sans text-xs text-black/70 font-medium leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>


      {/* =========================================================
          7. HOW IT WORKS (3 Horizontal Steps)
          ========================================================= */}
      <div className="gsap-sub-fade p-6 sm:p-8 bg-[#FFF8EE] border-2 border-black/15 rounded-[12px] space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <span className="font-outfit text-[11px] font-black uppercase text-black bg-[#E5A00D] px-2.5 py-0.5 rounded-[6px] tracking-wider inline-block">
            SIMPLE 3-STEP FLOW
          </span>
          <h2 className="font-outfit font-black text-2xl sm:text-3xl text-black uppercase tracking-tight">
            How It Works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {[
            {
              step: "01",
              title: "Choose Plan",
              desc: "Select Starter, Balanced, or Premium with Weekly or Monthly billing.",
            },
            {
              step: "02",
              title: "Select Meal Preferences",
              desc: "Pick Veg or Non-Veg preferences, delivery slot, and address.",
            },
            {
              step: "03",
              title: "Daily Delivery",
              desc: "Relax as fresh chef-cooked meal bowls arrive daily at your doorstep.",
            },
          ].map((st, idx) => (
            <div key={idx} className="p-6 rounded-[10px] bg-[#f5e3cd]/60 border border-black/15 space-y-3 relative">
              <span className="font-outfit font-black text-3xl text-black/20 block">{st.step}</span>
              <h4 className="font-outfit font-black text-lg text-black uppercase">{st.title}</h4>
              <p className="font-sans text-xs text-black/70 font-medium leading-relaxed">{st.desc}</p>
            </div>
          ))}
        </div>
      </div>


      {/* =========================================================
          8. FAQ SECTION (Collapsible Accordions)
          ========================================================= */}
      <div className="gsap-sub-fade p-6 sm:p-8 bg-[#FFF8EE] border-2 border-black/15 rounded-[12px] space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h2 className="font-outfit font-black text-2xl sm:text-3xl text-black uppercase tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3 max-w-3xl mx-auto">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="rounded-[10px] bg-[#f5e3cd]/60 border border-black/15 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-left font-outfit font-bold text-sm text-black uppercase flex items-center justify-between gap-4"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-black shrink-0" /> : <ChevronDown className="w-4 h-4 text-black shrink-0" />}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 font-sans text-xs text-black/70 font-medium leading-relaxed border-t border-black/10">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>


      {/* =========================================================
          9. FINAL CTA BANNER
          ========================================================= */}
      <div className="gsap-sub-fade p-8 sm:p-10 bg-black text-[#f5e3cd] border-2 border-black rounded-[12px] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl text-center md:text-left">
          <h2 className="font-outfit font-black text-3xl sm:text-4xl text-white uppercase tracking-tight">
            Eat better without the hassle.
          </h2>
          <p className="font-sans text-xs sm:text-sm text-[#f5e3cd]/80 font-normal">
            Join hundreds of food lovers enjoying freshly prepared artisan meal bowls daily.
          </p>
        </div>

        <button
          onClick={() => {
            const el = document.getElementById("pricing-plans");
            el?.scrollIntoView({ behavior: "smooth" });
          }}
          className="w-full sm:w-auto px-8 py-3.5 rounded-[10px] bg-[#E5A00D] text-black font-outfit text-xs sm:text-sm font-extrabold uppercase tracking-wider hover:bg-white transition-all shadow-[3px_3px_0px_#000] shrink-0"
        >
          Start Subscription
        </button>
      </div>

    </div>
  );
}
