"use client";

import { useState, useEffect } from "react";
import CustomerNavbar from "@/components/dashboard/CustomerNavbar";
import { Bell, CheckCircle2, ShoppingBag, Gift, Sparkles, Clock, Utensils, AlertCircle } from "lucide-react";
import Link from "next/link";

interface NotificationItem {
  id: string;
  type: "ORDER" | "SUBSCRIPTION" | "PROMO" | "SYSTEM";
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
}

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name?: string; email?: string; avatarUrl?: string; role?: string } | null>(null);
  const [cartCount, setCartCount] = useState(0);

  const notifications: NotificationItem[] = [
    {
      id: "notif-1",
      type: "ORDER",
      title: "Kitchen Preparing Your Gourmet Bowl!",
      message: "Your live order #QB-8492 is currently being freshly cooked in our Gachibowli cloud kitchen.",
      timestamp: "10 minutes ago",
      isRead: false,
      actionUrl: "/orders",
    },
    {
      id: "notif-2",
      type: "SUBSCRIPTION",
      title: "Daily Lunch Dispatch Scheduled",
      message: "Your active gourmet subscription meal for today has been slated for 12:45 PM delivery.",
      timestamp: "1 hour ago",
      isRead: false,
      actionUrl: "/subscriptions",
    },
    {
      id: "notif-3",
      type: "PROMO",
      title: "₹100 Off Gourmet Subscriptions!",
      message: "Use promo code CRAV100 on checkout to get flat ₹100 instant discount on 20 & 30 meal packages.",
      timestamp: "Yesterday",
      isRead: true,
      actionUrl: "/subscriptions",
    },
    {
      id: "notif-4",
      type: "SYSTEM",
      title: "Welcome to Q Bowl Gourmet Care!",
      message: "Your account is verified. Complete your profile address to receive instant 15-min dispatches.",
      timestamp: "2 days ago",
      isRead: true,
      actionUrl: "/profile",
    },
  ];

  useEffect(() => {
    fetchUserData();
    fetchCartCount();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/user/dashboard");
      if (res.ok) {
        const data = await res.json();
        setUser(data.profile || null);
      }
    } catch (err) {
      console.error("Failed to load user info:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCartCount = async () => {
    try {
      const res = await fetch("/api/cart");
      if (res.ok) {
        const data = await res.json();
        const total = (data.items || []).reduce((acc: number, item: any) => acc + item.quantity, 0);
        setCartCount(total);
      }
    } catch {
      // Ignore
    }
  };

  return (
    <div className="min-h-screen bg-[#f5e3cd] text-black font-sans antialiased flex flex-col">
      <CustomerNavbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        
        {/* Page Header Banner */}
        <div className="bg-[#FFF8EE] border-3 border-black rounded-2xl p-6 sm:p-8 shadow-[6px_6px_0px_#000000] mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-outfit font-black uppercase tracking-widest bg-[#E5A00D] text-black px-3 py-1 rounded-full border-2 border-black shadow-[2px_2px_0px_#000] inline-block mb-2">
              Live Updates & Alerts
            </span>
            <h1 className="text-3xl font-outfit font-black uppercase tracking-wider text-black text-stroke-small">
              Notifications Hub
            </h1>
            <p className="text-xs font-semibold text-black/70 mt-1">
              Real-time dispatches, kitchen status alerts, subscription updates, and exclusive promos.
            </p>
          </div>

          <div className="w-12 h-12 rounded-full bg-black text-[#E5A00D] border-2 border-black flex items-center justify-center flex-shrink-0 shadow-[3px_3px_0px_#000]">
            <Bell className="w-6 h-6 stroke-[2.5]" />
          </div>
        </div>

        {/* Notifications Feed */}
        <div className="space-y-4">
          {notifications.map((n) => {
            const isOrder = n.type === "ORDER";
            const isSub = n.type === "SUBSCRIPTION";
            const isPromo = n.type === "PROMO";

            return (
              <div
                key={n.id}
                className={`bg-[#FFF8EE] border-3 border-black rounded-2xl p-5 shadow-[5px_5px_0px_#000000] flex items-start gap-4 transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] ${
                  !n.isRead ? "ring-2 ring-black" : ""
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl border-2 border-black flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0px_#000] ${
                    isOrder
                      ? "bg-emerald-300 text-black"
                      : isSub
                      ? "bg-[#E5A00D] text-black"
                      : isPromo
                      ? "bg-amber-400 text-black"
                      : "bg-black text-[#f5e3cd]"
                  }`}
                >
                  {isOrder ? (
                    <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
                  ) : isSub ? (
                    <Utensils className="w-5 h-5 stroke-[2.5]" />
                  ) : isPromo ? (
                    <Gift className="w-5 h-5 stroke-[2.5]" />
                  ) : (
                    <Sparkles className="w-5 h-5 stroke-[2.5]" />
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-outfit font-black text-base uppercase text-black">
                      {n.title}
                    </h3>
                    <span className="text-[10px] font-outfit font-bold uppercase text-black/60 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {n.timestamp}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-black/80 leading-relaxed">
                    {n.message}
                  </p>

                  {n.actionUrl && (
                    <div className="pt-2">
                      <Link
                        href={n.actionUrl}
                        className="inline-flex items-center gap-1 text-xs font-outfit font-black uppercase text-black bg-[#f5e3cd] hover:bg-[#E5A00D] px-3 py-1 rounded-lg border-2 border-black shadow-[2px_2px_0px_#000] transition-colors"
                      >
                        View Details →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </main>
    </div>
  );
}
