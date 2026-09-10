"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Search,
  LogOut,
  User,
  Package,
  UtensilsCrossed,
  ShieldAlert,
  Loader2,
  X,
  ChevronRight,
} from "lucide-react";
import { formatOrderId } from "@/lib/utils/orderIdFormatter";

interface AdminProfile {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  avatarUrl: string | null;
}

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  type: string;
  createdAt: string;
}

interface SearchResults {
  customers: Array<{ id: string; name: string; email: string; phone: string; role: string }>;
  orders: Array<{ id: string; total: number; status: string; createdAt: string }>;
  menu: Array<{ id: string; name: string; price: number; isVeg: boolean }>;
}

export function AdminNavbar() {
  const router = useRouter();

  // Profile State
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  // Notification State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch Admin Profile on mount
  useEffect(() => {
    async function loadAdminProfile() {
      try {
        const res = await fetch("/api/admin/me");
        if (res.ok) {
          const data = await res.json();
          if (data.admin) {
            setProfile(data.admin);
          }
          if (data.notificationsCount !== undefined) {
            setUnreadCount(data.notificationsCount);
          }
        }
      } catch (err) {
        console.error("Error loading admin profile:", err);
      }
    }
    loadAdminProfile();
  }, []);

  // Fetch Notifications from Database
  async function loadNotifications() {
    setLoadingNotifs(true);
    try {
      const res = await fetch("/api/admin/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Error loading notifications:", err);
    } finally {
      setLoadingNotifs(false);
    }
  }

  function handleToggleNotifs() {
    if (!notifOpen) {
      loadNotifications();
    }
    setNotifOpen(!notifOpen);
    setProfileOpen(false);
    setSearchOpen(false);
  }

  // Dynamic Search Debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setSearchOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || { customers: [], orders: [], menu: [] });
          setSearchOpen(true);
        }
      } catch (err) {
        console.error("Error performing search:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
        setNotifOpen(false);
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      router.push("/admin");
    }
  }

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AD";

  return (
    <header className="sticky top-0 z-40 h-20 border-b border-slate-200 bg-white" ref={containerRef}>
      <div className="flex h-full items-center justify-between px-6">
        {/* ── Search Bar ── */}
        <div className="relative w-[420px]">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm focus-within:border-[#E5A00D] focus-within:bg-white transition-colors">
            {isSearching ? (
              <Loader2 size={18} className="text-[#E5A00D] animate-spin shrink-0" />
            ) : (
              <Search size={18} className="text-black/50 shrink-0" />
            )}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customers, orders..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 text-black font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults(null);
                  setSearchOpen(false);
                }}
                className="text-slate-400 hover:text-black"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Search Results Popover */}
          {searchOpen && searchResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-96 overflow-y-auto space-y-4">
              {/* Customers */}
              {searchResults.customers.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 px-1">
                    Customers ({searchResults.customers.length})
                  </p>
                  <div className="space-y-1">
                    {searchResults.customers.map((c) => (
                      <Link
                        key={c.id}
                        href="/admin/customers"
                        onClick={() => setSearchOpen(false)}
                        className="flex items-center justify-between p-2 hover:bg-[#FFF8EE] rounded-lg transition-colors group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-slate-100 text-black flex items-center justify-center font-bold text-xs">
                            <User size={14} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-black group-hover:text-[#E5A00D]">
                              {c.name || "Customer"}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono">{c.email || c.phone}</p>
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-slate-400 group-hover:text-black" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Orders */}
              {searchResults.orders.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 px-1">
                    Orders ({searchResults.orders.length})
                  </p>
                  <div className="space-y-1">
                    {searchResults.orders.map((o) => (
                      <Link
                        key={o.id}
                        href="/admin/orders"
                        onClick={() => setSearchOpen(false)}
                        className="flex items-center justify-between p-2 hover:bg-[#FFF8EE] rounded-lg transition-colors group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-amber-100 text-[#E5A00D] flex items-center justify-center font-bold text-xs">
                            <Package size={14} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-black font-mono group-hover:text-[#E5A00D]">
                              {formatOrderId(o.id)}
                            </p>
                            <p className="text-[11px] text-slate-500 font-semibold">
                              Status: {o.status} • ₹{o.total}
                            </p>
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-slate-400 group-hover:text-black" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Menu */}
              {searchResults.menu.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 px-1">
                    Menu Items ({searchResults.menu.length})
                  </p>
                  <div className="space-y-1">
                    {searchResults.menu.map((m) => (
                      <Link
                        key={m.id}
                        href="/admin/menu"
                        onClick={() => setSearchOpen(false)}
                        className="flex items-center justify-between p-2 hover:bg-[#FFF8EE] rounded-lg transition-colors group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-black text-[#E5A00D] flex items-center justify-center font-bold text-xs">
                            <UtensilsCrossed size={14} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-black group-hover:text-[#E5A00D]">
                              {m.name}
                            </p>
                            <p className="text-[11px] text-slate-500 font-semibold">₹{m.price}</p>
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-slate-400 group-hover:text-black" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {searchResults.customers.length === 0 &&
                searchResults.orders.length === 0 &&
                searchResults.menu.length === 0 && (
                  <div className="text-center py-6 text-xs text-slate-500 font-medium">
                    No matching results found in database for &quot;{searchQuery}&quot;.
                  </div>
                )}
            </div>
          )}
        </div>

        {/* ── Right Controls ── */}
        <div className="flex items-center gap-4">
          {/* Bell Notifications */}
          <div className="relative">
            <button
              onClick={handleToggleNotifs}
              className="relative rounded-xl bg-slate-50 p-3 border border-slate-200 hover:bg-slate-100 hover:border-[#E5A00D] transition-colors shadow-sm focus:outline-none"
              title="Notifications"
            >
              <Bell size={18} className="text-black" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 bg-[#E5A00D] text-black font-black text-[10px] rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Popover */}
            {notifOpen && (
              <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-black text-xs text-black uppercase tracking-wider">
                    Notifications
                  </h4>
                  <span className="text-[10px] font-black bg-[#E5A00D] text-black px-2 py-0.5 rounded-full">
                    {unreadCount} Unread
                  </span>
                </div>

                {loadingNotifs ? (
                  <div className="flex justify-center py-6 text-[#E5A00D]">
                    <Loader2 size={20} className="animate-spin" />
                  </div>
                ) : notifications.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs"
                      >
                        <ShieldAlert className="w-4 h-4 text-[#E5A00D] shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-black">{n.title}</p>
                          <p className="text-[11px] text-slate-600 mt-0.5">{n.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-center text-slate-500 py-4 font-medium">
                    No new database notifications.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setProfileOpen(!profileOpen);
                setNotifOpen(false);
                setSearchOpen(false);
              }}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 hover:bg-slate-100 hover:border-[#E5A00D] transition-colors shadow-sm text-left focus:outline-none"
            >
              <div className="h-10 w-10 rounded-full bg-[#E5A00D] text-black font-black flex items-center justify-center text-sm border border-amber-400 shrink-0">
                {initials}
              </div>
              <div className="leading-tight pr-1">
                <p className="text-sm font-black text-black">{profile?.name || "Admin Owner"}</p>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                  {profile?.role || "Owner"}
                </p>
              </div>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg p-2 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-black text-black">{profile?.name || "Admin Owner"}</p>
                  <p className="text-[11px] font-mono text-slate-500 truncate mt-0.5">
                    {profile?.email || "admin@qbowl.in"}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-1"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default AdminNavbar;
