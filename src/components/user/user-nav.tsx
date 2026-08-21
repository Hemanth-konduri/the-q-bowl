"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  ShoppingBag,
  MapPin,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Utensils,
  ChevronDown,
} from "lucide-react";

type UserData = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: string;
};

const NAV_ITEMS = [
  { label: "Dashboard", href: "/user/dashboard", icon: LayoutDashboard },
  { label: "Menu", href: "/user/menu", icon: Utensils },
  { label: "Subscriptions", href: "/user/subscriptions", icon: CalendarCheck },
  { label: "My Orders", href: "/user/orders", icon: ShoppingBag },
  { label: "Addresses", href: "/user/addresses", icon: MapPin },
  { label: "Profile", href: "/user/profile", icon: UserIcon },
];

export default function UserNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    setMobileOpen(false);
    setUserDropdown(false);
  }, [pathname]);

  // Fetch real authenticated user profile from database via /api/auth/me
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (err) {
        console.error("Failed to load user profile:", err);
      }
    }
    fetchUser();
  }, []);

  const navItems = NAV_ITEMS;

  // Get user display name or fallback initials
  const displayName = user?.name || user?.email?.split("@")[0] || "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 left-0 w-full z-[990] bg-[#f5e3cd] border-b border-[#0F3329]/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
        
        {/* Brand Logo (No Shadows) */}
        <Link
          href="/user/dashboard"
          className="font-outfit font-black text-2xl sm:text-3xl text-[#1B4D3E] hover:scale-105 transition-transform uppercase tracking-tight shrink-0 flex items-center gap-2"
        >
          <span>Q1 BOWL</span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-5 lg:gap-7">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`font-outfit text-xs lg:text-sm font-extrabold uppercase tracking-wider transition-colors relative py-1.5 ${
                  isActive
                    ? "text-[#0F3329]"
                    : "text-[#0F3329]/70 hover:text-[#0F3329]"
                }`}
              >
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0F3329] rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* Cart Icon Link */}
          <Link
            href="/user/cart"
            className="p-2 rounded-full border-2 border-[#0F3329] bg-[#FFF8EE] text-[#0F3329] hover:bg-[#0F3329] hover:text-[#f5e3cd] transition-all relative"
            title="View Cart"
          >
            <ShoppingBag className="w-4 h-4" />
          </Link>

          {/* Order Bowl Action Link */}
          <Link
            href="/user/menu"
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full border-2 border-[#0F3329] bg-[#0F3329] text-[#f5e3cd] font-outfit text-xs font-black uppercase tracking-wider hover:bg-[#1B4D3E] transition-all"
          >
            <Utensils className="w-3.5 h-3.5 text-[#E5A00D]" />
            <span>Order Bowl</span>
          </Link>

          {/* User Profile Menu (No Shadows, Real User Data) */}
          <div className="relative">
            <button
              onClick={() => setUserDropdown(!userDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border-2 border-[#0F3329] bg-[#FFF8EE] text-[#0F3329] hover:bg-[#0F3329] hover:text-[#f5e3cd] transition-all"
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#0F3329] text-[#E5A00D] font-outfit text-xs font-black flex items-center justify-center">
                {initials}
              </div>
              <span className="font-outfit text-xs font-bold uppercase hidden lg:inline-block truncate max-w-[120px]">
                {displayName}
              </span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {/* Dropdown Menu (No Shadows) */}
            {userDropdown && (
              <div className="absolute right-0 top-[calc(100%+0.6rem)] w-60 bg-[#FFF8EE] border-2 border-[#0F3329] rounded-2xl p-4 z-[1000] space-y-2 animate-in fade-in zoom-in-95">
                <div className="pb-3 border-b border-[#0F3329]/15">
                  <span className="font-outfit text-xs font-black uppercase text-[#0F3329] block truncate">
                    {displayName}
                  </span>
                  {user?.email && (
                    <span className="font-sans text-xs font-medium text-[#0F3329]/70 truncate block mt-0.5">
                      {user.email}
                    </span>
                  )}
                </div>

                <div className="space-y-1 font-outfit text-xs font-extrabold uppercase">
                  <Link
                    href="/user/profile"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-[#0F3329] hover:bg-[#0F3329] hover:text-[#f5e3cd] transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-[#E5A00D]" />
                    <span>Profile Settings</span>
                  </Link>
                  <Link
                    href="/user/orders"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-[#0F3329] hover:bg-[#0F3329] hover:text-[#f5e3cd] transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#E5A00D]" />
                    <span>Order History</span>
                  </Link>
                  <a
                    href="/api/auth/logout"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-red-700 hover:bg-red-600 hover:text-white transition-colors pt-2 border-t border-[#0F3329]/10"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-full border-2 border-[#0F3329] text-[#0F3329]"
            aria-label="Toggle Mobile Navigation"
          >
            {mobileOpen ? <X className="w-5 h-5 text-[#E5A00D]" /> : <Menu className="w-5 h-5 text-[#0F3329]" />}
          </button>

        </div>
      </div>

      {/* Mobile Drawer (No Shadows) */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 top-[68px] z-[999] bg-[#0F3329] text-[#f5e3cd] p-6 flex flex-col justify-between animate-in fade-in slide-in-from-top duration-300">
          <div className="space-y-4">
            <div className="pb-3 border-b border-[#E5A00D]/20">
              <span className="font-outfit text-xs font-black uppercase text-[#E5A00D] block">
                SIGNED IN AS
              </span>
              <span className="font-outfit text-lg font-bold text-[#FFF8EE] block truncate">
                {displayName}
              </span>
            </div>

            <nav className="flex flex-col gap-2 font-outfit text-xl font-bold uppercase text-[#FFF8EE]">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`py-3 border-b border-[#FFF8EE]/10 flex items-center justify-between transition-colors ${
                      isActive ? "text-[#E5A00D] font-extrabold" : "text-[#FFF8EE]/80"
                    }`}
                  >
                    <span>{item.label}</span>
                    {isActive && <span className="text-[#E5A00D]">●</span>}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="pt-6 border-t border-[#E5A00D]/30 space-y-3">
            <Link
              href="/#menu"
              onClick={() => setMobileOpen(false)}
              className="w-full py-3.5 rounded-2xl bg-[#E5A00D] text-[#0F3329] font-outfit font-black text-center uppercase tracking-wider block"
            >
              Order Meal Bowl
            </Link>
            <a
              href="/api/auth/logout"
              className="w-full py-3 rounded-2xl bg-[#1B4D3E] text-red-300 font-outfit font-extrabold text-center uppercase tracking-wider block border border-red-400/40"
            >
              Sign Out
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
