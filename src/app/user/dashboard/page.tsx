"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";

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

export default function UserDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
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

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#0F3329] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="font-outfit text-sm font-bold uppercase tracking-wider text-[#0F3329]">
          Fetching dashboard data from database...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 rounded-3xl bg-red-50 border-2 border-red-400 text-red-800 space-y-4 max-w-xl mx-auto my-12 text-center">
        <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
        <h2 className="font-outfit text-xl font-bold uppercase">Dashboard Error</h2>
        <p className="font-sans text-sm">{error || "Unable to load dashboard profile."}</p>
        <Link
          href="/login"
          className="inline-block px-6 py-2.5 rounded-full bg-[#0F3329] text-[#f5e3cd] font-outfit text-xs font-bold uppercase"
        >
          Sign In Again
        </Link>
      </div>
    );
  }

  const displayName = data.user.name || data.user.email?.split("@")[0] || "Customer";
  const sub = data.activeSubscription;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      
      {/* =========================================================
          WELCOME HERO BANNER (NO SHADOWS)
          ========================================================= */}
      
      <div className="p-8 sm:p-10 bg-[#FFF8EE] border-2 border-[#0F3329]/20 rounded-[2rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1 rounded-full bg-[#0F3329] text-[#E5A00D] font-outfit text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>MEMBER PORTAL</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Kitchen Active</span>
            </span>
          </div>

          <h1 className="font-outfit font-black text-3xl sm:text-5xl text-[#0F3329] uppercase tracking-tight leading-none">
            WELCOME BACK, <span className="text-[#1B4D3E]">{displayName}</span>
          </h1>
          <p className="font-sans text-sm sm:text-base text-[#0F3329]/70 font-medium">
            Manage your daily meal dispatches, active subscriptions, and recent orders.
          </p>
        </div>

        <div className="shrink-0 flex flex-wrap sm:flex-nowrap gap-3 w-full md:w-auto">
          <Link
            href="/user/subscriptions"
            className="flex-1 md:flex-none px-6 py-3.5 rounded-2xl bg-[#0F3329] text-[#f5e3cd] border border-[#0F3329] font-outfit text-xs sm:text-sm font-extrabold uppercase tracking-wider hover:bg-[#E5A00D] hover:text-[#0F3329] transition-colors text-center"
          >
            Subscriptions
          </Link>
          <Link
            href="/#menu"
            className="flex-1 md:flex-none px-6 py-3.5 rounded-2xl bg-[#E5A00D] text-[#0F3329] border border-[#0F3329] font-outfit text-xs sm:text-sm font-extrabold uppercase tracking-wider hover:bg-white transition-colors text-center"
          >
            Order Meal Bowl
          </Link>
        </div>
      </div>


      {/* =========================================================
          MAIN GRID: SUBSCRIPTION & ADDRESS (NO SHADOWS)
          ========================================================= */}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left 7 Cols: Real Active Subscription Status */}
        <div className="lg:col-span-7 space-y-8">
          
          <div className="p-7 bg-[#FFF8EE] border-2 border-[#0F3329]/20 rounded-[2rem] space-y-6">
            <div className="flex items-center justify-between border-b border-[#0F3329]/15 pb-4">
              <div>
                <span className="font-outfit text-xs font-black text-[#E5A00D] bg-[#0F3329] px-3 py-1 rounded-full uppercase tracking-wider block w-fit mb-1">
                  REAL-TIME SUBSCRIPTION
                </span>
                <h2 className="font-outfit font-black text-2xl sm:text-3xl text-[#0F3329] uppercase tracking-tight">
                  {sub ? (sub.planName || "Active Subscription Plan") : "No Active Subscription"}
                </h2>
              </div>
              {sub ? (
                <span className="px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-400 font-outfit text-xs font-bold uppercase tracking-wider">
                  ACTIVE
                </span>
              ) : (
                <span className="px-3.5 py-1.5 rounded-full bg-gray-100 text-gray-700 border border-gray-300 font-outfit text-xs font-bold uppercase tracking-wider">
                  INACTIVE
                </span>
              )}
            </div>

            {sub ? (
              <div className="space-y-4">
                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center font-outfit text-xs font-black uppercase tracking-wider text-[#0F3329]">
                    <span>MEALS REMAINING BALANCE</span>
                    <span className="text-[#E5A00D] bg-[#0F3329] px-3 py-0.5 rounded-full">
                      {sub.mealsRemaining} / {sub.totalMeals} MEALS
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-[#0F3329]/10 border border-[#0F3329]/30 overflow-hidden">
                    <div
                      className="h-full bg-[#E5A00D] transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, (sub.mealsRemaining / (sub.totalMeals || 1)) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="font-sans text-xs text-[#0F3329]/70 font-semibold">
                    {sub.mealsUsed} meals used • Expected End Date: {new Date(sub.expectedEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <Link
                    href="/user/subscriptions"
                    className="font-outfit text-xs font-bold uppercase text-[#1B4D3E] underline hover:text-[#E5A00D]"
                  >
                    View Schedule Calendar →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-[#f5e3cd]/60 border border-[#0F3329]/15 text-center space-y-3">
                <Utensils className="w-8 h-8 text-[#0F3329]/50 mx-auto" />
                <div>
                  <h3 className="font-outfit font-bold text-base text-[#0F3329] uppercase">
                    Start Your Meal Subscription
                  </h3>
                  <p className="font-sans text-xs text-[#0F3329]/70 font-medium mt-1 max-w-md mx-auto">
                    Subscribe to daily cloud kitchen meal dispatches with zero delivery fees and flexible skip options.
                  </p>
                </div>
                <Link
                  href="/user/subscriptions"
                  className="inline-block px-5 py-2.5 rounded-xl bg-[#0F3329] text-[#f5e3cd] font-outfit text-xs font-black uppercase tracking-wider hover:bg-[#E5A00D] hover:text-[#0F3329] transition-colors"
                >
                  Explore Plans
                </Link>
              </div>
            )}
          </div>

          {/* REAL RECENT ORDERS FROM DATABASE */}
          <div className="p-7 bg-[#FFF8EE] border-2 border-[#0F3329]/20 rounded-[2rem] space-y-6">
            <div className="flex items-center justify-between border-b border-[#0F3329]/15 pb-4">
              <div>
                <span className="font-outfit text-xs font-bold uppercase text-[#0F3329]/60 tracking-wider block">
                  ORDER HISTORY
                </span>
                <h2 className="font-outfit font-black text-2xl text-[#0F3329] uppercase">
                  RECENT ORDERS
                </h2>
              </div>
              <Link
                href="/user/orders"
                className="font-outfit text-xs font-extrabold uppercase text-[#1B4D3E] underline hover:text-[#E5A00D]"
              >
                View All
              </Link>
            </div>

            {data.recentOrders.length > 0 ? (
              <div className="space-y-4">
                {data.recentOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 rounded-2xl bg-[#f5e3cd]/70 border border-[#0F3329]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-outfit font-black text-sm text-[#0F3329]">
                          ORDER #{ord.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className="font-outfit text-[10px] font-bold uppercase bg-[#0F3329] text-[#E5A00D] px-2 py-0.5 rounded-full">
                          {ord.status}
                        </span>
                      </div>
                      <span className="font-sans text-xs text-[#0F3329]/60 block mt-1">
                        {new Date(ord.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>

                      {/* Items list */}
                      {ord.items.length > 0 && (
                        <div className="mt-2 font-sans text-xs font-semibold text-[#0F3329]/80">
                          {ord.items.map((item) => (
                            <span key={item.id} className="inline-block mr-3">
                              • {item.name} (x{item.quantity})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-outfit text-base font-black text-[#0F3329] block">
                        ₹{ord.total}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-[#f5e3cd]/60 border border-[#0F3329]/15 text-center space-y-2">
                <Package className="w-8 h-8 text-[#0F3329]/40 mx-auto" />
                <p className="font-outfit text-xs font-bold uppercase text-[#0F3329]">
                  No past orders recorded yet
                </p>
                <p className="font-sans text-xs text-[#0F3329]/60 font-medium">
                  When you place meal orders, they will appear here in real-time.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Right 5 Cols: Real Default Address & Account Info */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* REAL DEFAULT ADDRESS */}
          <div className="p-7 bg-[#FFF8EE] border-2 border-[#0F3329]/20 rounded-[2rem] space-y-4">
            <div className="flex items-center justify-between border-b border-[#0F3329]/15 pb-3">
              <span className="font-outfit text-xs font-black uppercase text-[#0F3329]">
                PRIMARY DISPATCH LOCATION
              </span>
              <Link
                href="/user/addresses"
                className="font-outfit text-xs font-extrabold uppercase text-[#1B4D3E] underline hover:text-[#E5A00D]"
              >
                Manage
              </Link>
            </div>

            {data.defaultAddress ? (
              <div className="p-4 rounded-2xl bg-[#f5e3cd]/80 border border-[#0F3329]/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-outfit text-xs font-black uppercase text-[#0F3329] bg-[#E5A00D] px-2.5 py-0.5 rounded-full">
                    {data.defaultAddress.label}
                  </span>
                  <span className="font-sans text-xs font-bold text-emerald-800">
                    ✓ Verified Zone
                  </span>
                </div>
                <p className="font-sans text-xs font-bold text-[#0F3329] leading-relaxed">
                  {data.defaultAddress.address}
                </p>
                <p className="font-sans text-xs text-[#0F3329]/70 font-semibold">
                  {data.defaultAddress.area}, {data.defaultAddress.city} - {data.defaultAddress.pincode}
                </p>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-[#f5e3cd]/60 border border-[#0F3329]/15 text-center space-y-2">
                <MapPin className="w-6 h-6 text-[#0F3329]/40 mx-auto" />
                <p className="font-outfit text-xs font-bold uppercase text-[#0F3329]">
                  No Default Address Set
                </p>
                <Link
                  href="/user/addresses"
                  className="inline-block font-outfit text-xs font-extrabold uppercase text-[#1B4D3E] underline"
                >
                  + Add Delivery Address
                </Link>
              </div>
            )}
          </div>

          {/* REAL USER ACCOUNT INFO */}
          <div className="p-7 bg-[#FFF8EE] border-2 border-[#0F3329]/20 rounded-[2rem] space-y-4">
            <div className="flex items-center justify-between border-b border-[#0F3329]/15 pb-3">
              <span className="font-outfit text-xs font-black uppercase text-[#0F3329]">
                ACCOUNT DETAILS
              </span>
              <Link
                href="/user/profile"
                className="font-outfit text-xs font-extrabold uppercase text-[#1B4D3E] underline hover:text-[#E5A00D]"
              >
                Edit
              </Link>
            </div>

            <div className="space-y-2 font-sans text-xs font-semibold text-[#0F3329]">
              <div className="flex justify-between p-2.5 rounded-xl bg-[#f5e3cd]/50">
                <span className="opacity-70">Name:</span>
                <span className="font-bold">{displayName}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-[#f5e3cd]/50">
                <span className="opacity-70">Email:</span>
                <span className="font-bold truncate max-w-[180px]">{data.user.email}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-[#f5e3cd]/50">
                <span className="opacity-70">Phone:</span>
                <span className="font-bold">{data.user.phone || "Not set"}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-[#f5e3cd]/50">
                <span className="opacity-70">Account Role:</span>
                <span className="font-bold uppercase text-[#E5A00D] bg-[#0F3329] px-2 py-0.5 rounded-md">
                  {data.user.role}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>


      {/* =========================================================
          REAL FOOD CATALOG FROM DATABASE (NO SHADOWS)
          ========================================================= */}

      {data.foodItems.length > 0 && (
        <div className="p-8 sm:p-10 bg-[#FFF8EE] border-2 border-[#0F3329]/20 rounded-[2rem] space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#0F3329]/15 pb-4">
            <div>
              <span className="font-outfit text-xs font-bold uppercase text-[#E5A00D] bg-[#0F3329] px-3 py-1 rounded-full block w-fit mb-1">
                KITCHEN CATALOG
              </span>
              <h2 className="font-outfit font-black text-3xl text-[#0F3329] uppercase">
                FEATURED FOOD DISHES
              </h2>
            </div>
            <Link
              href="/#menu"
              className="inline-flex items-center gap-1.5 font-outfit text-xs font-extrabold uppercase text-[#0F3329] hover:text-[#E5A00D]"
            >
              <span>View Full Menu</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.foodItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-[#f5e3cd]/70 border border-[#0F3329]/20 space-y-3 flex flex-col justify-between"
              >
                <div className="relative h-40 w-full rounded-xl bg-[#0F3329] overflow-hidden flex items-center justify-center p-2">
                  <Image
                    src={item.imageUrl || "/dum_biryani_hero.png"}
                    alt={item.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 25vw"
                    unoptimized={Boolean(item.imageUrl?.startsWith("http"))}
                    className="object-contain p-2"
                  />
                  <span className="absolute top-2 right-2 font-outfit text-[10px] font-black uppercase text-[#0F3329] bg-[#E5A00D] px-2 py-0.5 rounded-full">
                    {item.isVeg ? "Veg" : "Non-Veg"}
                  </span>
                </div>

                <div>
                  <h3 className="font-outfit font-black text-base uppercase text-[#0F3329] line-clamp-1">
                    {item.name}
                  </h3>
                  {item.description && (
                    <p className="font-sans text-xs text-[#0F3329]/70 line-clamp-2 mt-0.5">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#0F3329]/15">
                  <span className="font-outfit text-lg font-black text-[#0F3329]">
                    ₹{item.price}
                  </span>
                  <Link
                    href="/#menu"
                    className="px-3 py-1.5 rounded-xl bg-[#0F3329] text-[#E5A00D] font-outfit text-xs font-black uppercase hover:bg-[#E5A00D] hover:text-[#0F3329] transition-colors"
                  >
                    Order
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
