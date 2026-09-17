"use client";

import { useState, useEffect } from "react";
import CustomerNavbar from "@/components/dashboard/CustomerNavbar";
import { Bell, ShoppingBag, Gift, Sparkles, Clock, Utensils, Loader2, CheckCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body?: string;
  message?: string;
  time?: string;
  timestamp?: string;
  isRead: boolean;
  actionUrl?: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Local storage helper
  const getViewedNotificationIds = (): string[] => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("qbowl_viewed_notif_ids");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const addViewedNotificationId = (id: string) => {
    if (typeof window === "undefined") return;
    try {
      const current = getViewedNotificationIds();
      if (!current.includes(id)) {
        const updated = [...current, id];
        localStorage.setItem("qbowl_viewed_notif_ids", JSON.stringify(updated));
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/user/notifications");
      if (res.ok) {
        const data = await res.json();
        const rawNotifs: NotificationItem[] = data.notifications || [];
        const viewedIds = getViewedNotificationIds();

        const processed = rawNotifs.map((n) => ({
          ...n,
          isRead: n.isRead || viewedIds.includes(n.id),
        }));

        setNotifications(processed);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      addViewedNotificationId(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );

      try {
        await fetch("/api/user/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId: notif.id }),
        });
      } catch {
        // Silently handle
      }
    }

    if (notif.actionUrl) {
      router.push(notif.actionUrl);
    }
  };

  const handleMarkAllAsRead = () => {
    notifications.forEach((n) => addViewedNotificationId(n.id));
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-[#f5e3cd] text-black font-sans antialiased flex flex-col">
      <CustomerNavbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        
        {/* Page Header Banner */}
        <div className="bg-[#FFF8EE] border-3 border-black rounded-2xl p-6 sm:p-8 shadow-[6px_6px_0px_#000000] mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-outfit font-black uppercase tracking-widest bg-[#E5A00D] text-black px-3 py-1 rounded-full border-2 border-black shadow-[2px_2px_0px_#000] inline-block">
                Live Updates & Alerts
              </span>
              {unreadCount > 0 && (
                <span className="text-xs font-outfit font-black uppercase tracking-wider bg-black text-[#E5A00D] px-2.5 py-0.5 rounded-full border border-black">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <h1 className="text-3xl font-outfit font-black uppercase tracking-wider text-black text-stroke-small">
              Notifications Hub
            </h1>
            <p className="text-xs font-semibold text-black/70 mt-1">
              Real-time dispatches, kitchen status alerts, subscription updates, and exclusive promos.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-3 py-2 rounded-xl bg-black text-[#E5A00D] hover:bg-zinc-800 border-2 border-black font-outfit text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0px_#000] flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCheck size={14} />
                <span>Mark All Read</span>
              </button>
            )}
            <div className="w-12 h-12 rounded-full bg-black text-[#E5A00D] border-2 border-black flex items-center justify-center flex-shrink-0 shadow-[3px_3px_0px_#000]">
              <Bell className="w-6 h-6 stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* Notifications Feed */}
        {loading ? (
          <div className="flex justify-center py-16 text-[#E5A00D]">
            <Loader2 size={36} className="animate-spin text-black" />
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((n) => {
              const isOrder = n.type === "ORDER";
              const isSub = n.type === "SUBSCRIPTION";
              const isPromo = n.type === "PROMO";

              return (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`border-3 border-black rounded-2xl p-5 shadow-[5px_5px_0px_#000000] flex items-start gap-4 transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] cursor-pointer ${
                    !n.isRead
                      ? "bg-[#FFF8EE] ring-2 ring-black"
                      : "bg-white/90 opacity-75 hover:opacity-100"
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

                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-outfit uppercase text-base ${!n.isRead ? "font-black text-black" : "font-bold text-zinc-700"}`}>
                          {n.title}
                        </h3>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#E5A00D] border border-black animate-pulse" />
                        )}
                      </div>
                      <span className="text-[10px] font-outfit font-bold uppercase text-black/60 flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" />
                        {n.time || n.timestamp || "Recent"}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-black/80 leading-relaxed">
                      {n.body || n.message}
                    </p>

                    {n.actionUrl && (
                      <div className="pt-2">
                        <span className="inline-flex items-center gap-1 text-xs font-outfit font-black uppercase text-black bg-[#f5e3cd] hover:bg-[#E5A00D] px-3 py-1 rounded-lg border-2 border-black shadow-[2px_2px_0px_#000] transition-colors">
                          View Details →
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#FFF8EE] border-3 border-black rounded-2xl p-12 text-center shadow-[6px_6px_0px_#000]">
            <Bell className="w-12 h-12 mx-auto text-[#E5A00D] stroke-[2] mb-3" />
            <h3 className="font-outfit font-black text-lg uppercase text-black">
              All Caught Up!
            </h3>
            <p className="text-xs font-semibold text-zinc-600 mt-1">
              You have no unread notifications right now.
            </p>
          </div>
        )}

      </main>
    </div>
  );
}

