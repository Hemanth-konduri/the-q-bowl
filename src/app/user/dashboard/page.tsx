"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  CalendarCheck,
  Clock,
  ShoppingBag,
  ArrowRight,
  Plus,
  MapPin,
  Utensils,
  CheckCircle2,
  AlertCircle,
  Package,
  Bell,
  User,
  Truck,
  RotateCcw,
  Star,
  Flame,
  PauseCircle,
  ChevronRight,
  Tag,
  Gift,
} from "lucide-react";
import gsap from "gsap";

type DashboardData = {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    role: string;
  };
  activeSubscription: {
    id: string;
    status: string;
    totalMeals: number;
    mealsUsed: number;
    mealsRemaining: number;
    startDate: string;
    expectedEndDate: string;
    pricePaid: number;
    planName?: string | null;
    planDescription?: string | null;
  } | null;
  recentOrders: {
    id: string;
    type: string;
    status: string;
    total: number;
    createdAt: string;
    items: {
      id: string;
      name: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }[];
  }[];
  defaultAddress: {
    id: string;
    label: string;
    address: string;
    area: string;
    city: string;
    pincode: string;
  } | null;
  foodItems: {
    id: string;
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    price: number;
    isVeg: boolean;
    mealType: string;
  }[];
};

const MOTIVATIONAL_QUOTES = [
  "Nourishing chef-crafted meals, prepared fresh for your daily flow.",
  "Fuel your day with clean, high-protein cloud kitchen artisan bowls.",
  "Balanced nutrition delivered fresh to your doorstep without hassle.",
  "Eat well, feel great — slow-cooked flavor with zero preservatives.",
];

const RECOMMENDED_ITEMS = [
  {
    id: "rec-1",
    name: "Mediterranean Protein Power Bowl",
    calories: 520,
    price: 279,
    rating: 4.9,
    isVeg: false,
    image: "/hero_dish.png",
    protein: "38g",
  },
  {
    id: "rec-2",
    name: "Royal Paneer Tikka Deluxe Thali",
    calories: 590,
    price: 239,
    rating: 4.8,
    isVeg: true,
    image: "/paneer.png",
    protein: "26g",
  },
  {
    id: "rec-3",
    name: "Hyderabadi Artisanal Dum Biryani",
    calories: 680,
    price: 299,
    rating: 4.9,
    isVeg: false,
    image: "/dum_biryani_hero.png",
    protein: "34g",
  },
  {
    id: "rec-4",
    name: "Keto Broccoli & Roasted Cottage Cheese",
    calories: 410,
    price: 259,
    rating: 4.7,
    isVeg: true,
    image: "/biryani.png",
    protein: "29g",
  },
];

export default function UserDashboardPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [greeting, setGreeting] = useState("Good Morning");
  const [quote, setQuote] = useState(MOTIVATIONAL_QUOTES[0]);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    // Time-based greeting
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");

    // Random quote
    const randomIdx = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    setQuote(MOTIVATIONAL_QUOTES[randomIdx]);

    async function loadDashboard() {
      try {
        const res = await fetch("/api/user/dashboard");
        if (!res.ok) {
          throw new Error("Failed to load dashboard data");
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        console.error("Dashboard error:", err);
        setError(err.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  // GSAP Entrance Micro-Interactions
  useEffect(() => {
    if (!loading && data && containerRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          ".gsap-dash-fade",
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power2.out" }
        );

        // Progress bar fill animation
        gsap.fromTo(
          ".gsap-progress-bar",
          { width: "0%" },
          { duration: 0.9, ease: "power3.out", delay: 0.2 }
        );
      }, containerRef);

      return () => ctx.revert();
    }
  }, [loading, data]);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4 max-w-md mx-auto">
        <div className="w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="font-outfit text-xs font-bold uppercase tracking-wider text-black">
          Loading your personalized dashboard...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-[12px] bg-red-50 border-2 border-red-400 text-red-800 space-y-4 max-w-xl mx-auto my-12 text-center">
        <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
        <h2 className="font-outfit text-lg font-bold uppercase">Unable to Load Portal</h2>
        <p className="font-sans text-xs">{error || "Unable to retrieve dashboard profile."}</p>
        <Link
          href="/login"
          className="inline-block px-5 py-2 rounded-[10px] bg-black text-[#f5e3cd] font-outfit text-xs font-bold uppercase"
        >
          Sign In Again
        </Link>
      </div>
    );
  }

  const displayName = data.user.name || data.user.email?.split("@")[0] || "Customer";
  const sub = data.activeSubscription;

  // Calculate days remaining in subscription
  let daysRemaining = 0;
  if (sub) {
    const end = new Date(sub.expectedEndDate).getTime();
    const now = new Date().getTime();
    daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  }

  return (
    <div ref={containerRef} className="space-y-6 pb-16">
      
      {/* =========================================================
          1. GREETING HEADER
          ========================================================= */}
      <div className="gsap-dash-fade p-6 sm:p-7 bg-[#FFF8EE] border-2 border-black/15 rounded-[12px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-outfit text-2xl sm:text-3xl font-black text-black uppercase tracking-tight">
              {greeting}, {displayName} 👋
            </span>
          </div>
          <p className="font-sans text-xs sm:text-sm text-black/70 font-medium leading-relaxed">
            {quote}
          </p>
        </div>

        {/* Right Header Icons */}
        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
          <button
            className="p-2.5 rounded-[10px] bg-[#f5e3cd] border-2 border-black/15 text-black hover:bg-black hover:text-white transition-all relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E5A00D]" />
          </button>
          <Link
            href="/user/profile"
            className="p-2.5 rounded-[10px] bg-[#f5e3cd] border-2 border-black/15 text-black hover:bg-black hover:text-white transition-all flex items-center gap-2 font-outfit text-xs font-bold uppercase"
          >
            <User className="w-4 h-4" />
            <span className="hidden md:inline">Account</span>
          </Link>
        </div>
      </div>


      {/* =========================================================
          2. SUBSCRIPTION STATUS (TOP PRIORITY - FIRST CARD)
          ========================================================= */}
      <div className="gsap-dash-fade p-6 sm:p-7 bg-[#FFF8EE] border-2 border-black rounded-[12px] space-y-5 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black/15 pb-4">
          <div>
            <span className="font-outfit text-[11px] font-black uppercase text-black bg-[#E5A00D] px-2.5 py-0.5 rounded-[6px] tracking-wider inline-block mb-1">
              CURRENT PLAN STATUS
            </span>
            <h2 className="font-outfit font-black text-2xl sm:text-3xl text-black uppercase tracking-tight">
              {sub ? (sub.planName || "Active Premium Plan") : "Start Your Healthy Meal Journey"}
            </h2>
          </div>

          <div>
            {sub ? (
              <span className="px-3 py-1 rounded-[8px] bg-black text-[#E5A00D] font-outfit text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Subscribed ({daysRemaining} Days Left)</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-[8px] bg-black/10 text-black border border-black/20 font-outfit text-xs font-bold uppercase tracking-wider">
                No Active Plan
              </span>
            )}
          </div>
        </div>

        {sub ? (
          /* SUBSCRIBED STATE CARD DETAILS */
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-[10px] bg-[#f5e3cd]/70 border border-black/15 space-y-1">
                <span className="font-sans text-[11px] font-semibold text-black/60 block uppercase">Plan Duration</span>
                <p className="font-outfit font-black text-base text-black">{sub.totalMeals} Meal Entitlements</p>
              </div>
              <div className="p-3.5 rounded-[10px] bg-[#f5e3cd]/70 border border-black/15 space-y-1">
                <span className="font-sans text-[11px] font-semibold text-black/60 block uppercase">Meals Remaining</span>
                <p className="font-outfit font-black text-base text-black">{sub.mealsRemaining} Meals Balance</p>
              </div>
              <div className="p-3.5 rounded-[10px] bg-[#f5e3cd]/70 border border-black/15 space-y-1">
                <span className="font-sans text-[11px] font-semibold text-black/60 block uppercase">Days Remaining</span>
                <p className="font-outfit font-black text-base text-black">{daysRemaining} Days Active</p>
              </div>
              <div className="p-3.5 rounded-[10px] bg-[#f5e3cd]/70 border border-black/15 space-y-1">
                <span className="font-sans text-[11px] font-semibold text-black/60 block uppercase">Next Delivery Slot</span>
                <p className="font-outfit font-bold text-xs text-black">Today • 12:30 PM – 1:30 PM</p>
              </div>
            </div>

            {/* Usage Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center font-outfit text-xs font-bold uppercase tracking-wider text-black">
                <span>Plan Meal Consumption ({sub.mealsUsed} / {sub.totalMeals} Meals Used)</span>
                <span>{Math.round(((sub.totalMeals - sub.mealsRemaining) / (sub.totalMeals || 1)) * 100)}% Used</span>
              </div>
              <div className="w-full h-3 rounded-[6px] bg-black/10 border border-black/20 overflow-hidden">
                <div
                  className="gsap-progress-bar h-full bg-black rounded-[5px]"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(0, ((sub.totalMeals - sub.mealsRemaining) / (sub.totalMeals || 1)) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="font-sans text-xs text-black/70 font-medium">
                Auto-renews or extends when you pause. Zero wasted meals.
              </span>
              <Link
                href="/user/subscriptions"
                className="px-5 py-2.5 rounded-[10px] bg-black text-[#f5e3cd] font-outfit text-xs font-bold uppercase tracking-wider hover:bg-[#E5A00D] hover:text-black transition-all inline-flex items-center gap-1.5"
              >
                <span>Manage Subscription</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* NOT SUBSCRIBED STATE CARD */
          <div className="space-y-4">
            <p className="font-sans text-xs sm:text-sm text-black/80 font-normal leading-relaxed max-w-2xl">
              Enjoy chef-crafted gourmet meals delivered hot to your doorstep daily. Zero delivery fees, full pause flexibility, and changing kitchen menus.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <span className="px-3 py-1 rounded-[8px] bg-[#f5e3cd] border border-black/15 font-outfit text-xs font-bold text-black uppercase">
                ✓ Fresh Daily Cooked Meals
              </span>
              <span className="px-3 py-1 rounded-[8px] bg-[#f5e3cd] border border-black/15 font-outfit text-xs font-bold text-black uppercase">
                ✓ 100% Pause Flexibility
              </span>
              <span className="px-3 py-1 rounded-[8px] bg-[#f5e3cd] border border-black/15 font-outfit text-xs font-bold text-black uppercase">
                ✓ Doorstep Office &amp; Home Delivery
              </span>
            </div>

            <div className="pt-2">
              <Link
                href="/user/subscriptions"
                className="px-6 py-3 rounded-[10px] bg-black text-[#f5e3cd] font-outfit text-xs font-bold uppercase tracking-wider hover:bg-[#E5A00D] hover:text-black transition-all inline-flex items-center gap-2"
              >
                <span>View Subscription Plans</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>


      {/* =========================================================
          3. QUICK ACTIONS GRID
          ========================================================= */}
      <div className="gsap-dash-fade grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Order Meal", href: "/#menu", icon: ShoppingBag, desc: "Explore daily à la carte menu" },
          { label: "Today's Menu", href: "/#menu", icon: Utensils, desc: "Check active kitchen slots" },
          { label: "Track Delivery", href: "/user/orders", icon: Truck, desc: "Live dispatch status" },
          { label: "Subscription", href: "/user/subscriptions", icon: CalendarCheck, desc: "Plan & meal schedule" },
        ].map((act, idx) => {
          const Icon = act.icon;
          return (
            <Link
              key={idx}
              href={act.href}
              className="p-5 bg-[#FFF8EE] border-2 border-black/15 rounded-[12px] hover:border-black hover:scale-[1.02] transition-all group flex flex-col justify-between space-y-3"
            >
              <div className="p-2.5 rounded-[8px] bg-black text-[#E5A00D] w-fit group-hover:bg-[#E5A00D] group-hover:text-black transition-colors">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-outfit font-bold text-base text-black uppercase tracking-tight group-hover:text-black">
                  {act.label}
                </h3>
                <p className="font-sans text-[11px] text-black/60 font-medium mt-0.5">{act.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>


      {/* =========================================================
          4. TODAY'S MEALS (NORMAL À LA CARTE CATALOG)
          ========================================================= */}
      {data.foodItems.length > 0 && (
        <div className="gsap-dash-fade p-6 sm:p-7 bg-[#FFF8EE] border-2 border-black/15 rounded-[12px] space-y-5">
          <div className="flex items-center justify-between border-b-2 border-black/15 pb-4">
            <div>
              <span className="font-outfit text-[11px] font-black uppercase text-black bg-[#E5A00D] px-2.5 py-0.5 rounded-[6px] tracking-wider inline-block mb-1">
                KITCHEN FRESH
              </span>
              <h2 className="font-outfit font-black text-2xl text-black uppercase tracking-tight">
                Today&apos;s Featured Meals
              </h2>
            </div>
            <Link
              href="/#menu"
              className="font-outfit text-xs font-bold uppercase text-black underline hover:text-[#E5A00D]"
            >
              View Full Menu →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.foodItems.slice(0, 4).map((dish) => (
              <div
                key={dish.id}
                className="p-4 bg-[#f5e3cd]/60 border border-black/15 rounded-[10px] flex flex-col justify-between space-y-3 hover:scale-[1.02] transition-transform duration-300"
              >
                <div className="relative h-40 w-full rounded-[8px] bg-black overflow-hidden flex items-center justify-center p-2">
                  <Image
                    src={dish.imageUrl || "/dum_biryani_hero.png"}
                    alt={dish.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 25vw"
                    unoptimized={Boolean(dish.imageUrl?.startsWith("http"))}
                    className="object-contain p-2 hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-[4px] bg-black text-[#f5e3cd] font-outfit text-[10px] font-bold uppercase">
                    {dish.isVeg ? "Veg" : "Non-Veg"}
                  </span>
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-[4px] bg-[#E5A00D] text-black font-outfit text-[10px] font-black flex items-center gap-1">
                    <Star className="w-3 h-3 fill-black" /> 4.9
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-outfit font-extrabold text-sm uppercase text-black line-clamp-1">
                    {dish.name}
                  </h3>
                  <div className="flex items-center gap-2 font-sans text-[11px] text-black/60">
                    <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-[#E5A00D]" /> 540 kcal</span>
                    <span>•</span>
                    <span className="uppercase font-semibold">{dish.mealType}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-black/10">
                  <span className="font-outfit font-black text-base text-black">₹{dish.price}</span>
                  <Link
                    href="/#menu"
                    className="px-3.5 py-1.5 rounded-[8px] bg-black text-white font-outfit text-xs font-bold uppercase hover:bg-[#E5A00D] hover:text-black transition-colors"
                  >
                    Add to Cart
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* =========================================================
          5. RECENT DELIVERIES
          ========================================================= */}
      <div className="gsap-dash-fade p-6 sm:p-7 bg-[#FFF8EE] border-2 border-black/15 rounded-[12px] space-y-4">
        <div className="flex items-center justify-between border-b-2 border-black/15 pb-3">
          <h2 className="font-outfit font-black text-xl text-black uppercase tracking-tight">
            Recent Deliveries
          </h2>
          <Link
            href="/user/orders"
            className="font-outfit text-xs font-bold uppercase text-black underline hover:text-[#E5A00D]"
          >
            View All Orders
          </Link>
        </div>

        {data.recentOrders.length > 0 ? (
          <div className="space-y-3">
            {data.recentOrders.slice(0, 3).map((ord) => (
              <div
                key={ord.id}
                className="p-4 rounded-[10px] bg-[#f5e3cd]/60 border border-black/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-[8px] bg-black shrink-0 relative overflow-hidden flex items-center justify-center p-1">
                    <Image
                      src="/dum_biryani_hero.png"
                      alt="Order item"
                      fill
                      className="object-contain p-1"
                    />
                  </div>
                  <div>
                    <h4 className="font-outfit font-black text-sm text-black">
                      ORDER #{ord.id.slice(0, 8).toUpperCase()}
                    </h4>
                    <p className="font-sans text-xs text-black/70">
                      {new Date(ord.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <span className="px-2.5 py-1 rounded-[6px] bg-black text-white font-outfit text-[10px] font-bold uppercase">
                    {ord.status || "Delivered"}
                  </span>
                  <span className="font-outfit font-black text-sm text-black">₹{ord.total}</span>
                  <Link
                    href="/#menu"
                    className="px-3 py-1.5 rounded-[8px] bg-[#f5e3cd] border border-black text-black font-outfit text-xs font-bold uppercase hover:bg-black hover:text-white transition-all flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reorder</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-[10px] bg-[#f5e3cd]/40 border border-black/15 text-center space-y-2">
            <Package className="w-7 h-7 text-black/40 mx-auto" />
            <p className="font-outfit text-xs font-bold uppercase text-black">No recent deliveries recorded</p>
          </div>
        )}
      </div>


      {/* =========================================================
          6. ACTIVE SUBSCRIPTION DETAILS (SECONDARY CARD IF SUBSCRIBED)
          ========================================================= */}
      {sub && (
        <div className="gsap-dash-fade p-6 sm:p-7 bg-[#FFF8EE] border-2 border-black/15 rounded-[12px] space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black/15 pb-3">
            <h2 className="font-outfit font-black text-xl text-black uppercase tracking-tight">
              Active Subscription Details
            </h2>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`px-3 py-1.5 rounded-[8px] border font-outfit text-xs font-bold uppercase transition-colors flex items-center gap-1.5 ${
                isPaused
                  ? "bg-amber-100 border-amber-500 text-amber-900"
                  : "bg-[#f5e3cd] border-black text-black hover:bg-black hover:text-white"
              }`}
            >
              <PauseCircle className="w-4 h-4" />
              <span>{isPaused ? "Subscription Paused" : "Pause Subscription"}</span>
            </button>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 font-sans text-xs">
            <div className="p-3.5 rounded-[10px] bg-[#f5e3cd]/60 border border-black/15 space-y-1">
              <span className="font-bold text-black uppercase block">Available Meal Slots</span>
              <p className="text-black/80 font-medium">Lunch (12-1:30 PM) &amp; Dinner (7:30-9 PM)</p>
            </div>

            <div className="p-3.5 rounded-[10px] bg-[#f5e3cd]/60 border border-black/15 space-y-1">
              <span className="font-bold text-black uppercase block">Remaining Credits</span>
              <p className="text-black/80 font-medium">{sub.mealsRemaining} Full Meal Days Credit</p>
            </div>

            <div className="p-3.5 rounded-[10px] bg-[#f5e3cd]/60 border border-black/15 space-y-1">
              <span className="font-bold text-black uppercase block">Verified Address</span>
              <p className="text-black/80 font-medium truncate">
                {data.defaultAddress ? `${data.defaultAddress.label} • ${data.defaultAddress.area}` : "Primary Address Set"}
              </p>
            </div>
          </div>
        </div>
      )}


      {/* =========================================================
          7. RECOMMENDED FOR YOU
          ========================================================= */}
      <div className="gsap-dash-fade p-6 sm:p-7 bg-[#FFF8EE] border-2 border-black/15 rounded-[12px] space-y-4">
        <div className="flex items-center justify-between border-b-2 border-black/15 pb-3">
          <div>
            <span className="font-outfit text-[10px] font-bold uppercase text-black bg-[#E5A00D] px-2 py-0.5 rounded-[4px] inline-block mb-1">
              CURATED FOR YOUR PALATE
            </span>
            <h2 className="font-outfit font-black text-xl text-black uppercase tracking-tight">
              Recommended For You
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {RECOMMENDED_ITEMS.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-[#f5e3cd]/60 border border-black/15 rounded-[10px] space-y-3 flex flex-col justify-between hover:scale-[1.03] transition-transform duration-300"
            >
              <div className="relative h-36 w-full rounded-[8px] bg-black overflow-hidden flex items-center justify-center p-2">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-contain p-2 hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-[4px] bg-[#E5A00D] text-black font-outfit text-[10px] font-black">
                  ★ {item.rating}
                </span>
              </div>

              <div>
                <h4 className="font-outfit font-extrabold text-sm uppercase text-black line-clamp-1">
                  {item.name}
                </h4>
                <p className="font-sans text-[11px] text-black/60 mt-0.5">
                  {item.calories} kcal • {item.protein} protein
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-black/10">
                <span className="font-outfit font-black text-base text-black">₹{item.price}</span>
                <Link
                  href="/#menu"
                  className="px-3 py-1.5 rounded-[8px] bg-black text-white font-outfit text-xs font-bold uppercase hover:bg-[#E5A00D] hover:text-black transition-colors"
                >
                  Order
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* =========================================================
          8. SPECIAL OFFERS & PROMOTIONAL BANNER
          ========================================================= */}
      <div className="gsap-dash-fade p-6 sm:p-8 bg-black text-[#f5e3cd] border-2 border-black rounded-[12px] flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 max-w-xl relative z-10">
          <span className="px-3 py-1 rounded-[6px] bg-[#E5A00D] text-black font-outfit text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
            <Gift className="w-3.5 h-3.5" />
            <span>MEMBER EXCLUSIVE PROMO</span>
          </span>
          <h2 className="font-outfit font-black text-2xl sm:text-4xl text-white uppercase tracking-tight leading-tight">
            GET 20% OFF ON YOUR NEXT MEAL BOWL
          </h2>
          <p className="font-sans text-xs sm:text-sm text-[#f5e3cd]/80 font-normal">
            Use code <strong className="text-white bg-[#f5e3cd]/20 px-2 py-0.5 rounded border border-white/20">WELCOME20</strong> at checkout on orders above ₹299.
          </p>
        </div>

        <div className="shrink-0 relative z-10 w-full md:w-auto text-center">
          <Link
            href="/#menu"
            className="w-full sm:w-auto px-7 py-3.5 rounded-[10px] bg-[#E5A00D] text-black font-outfit text-xs sm:text-sm font-extrabold uppercase tracking-wider hover:bg-white transition-all inline-block shadow-[3px_3px_0px_#000]"
          >
            Claim Offer Now
          </Link>
        </div>
      </div>

    </div>
  );
}
