"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  ShoppingBag,
  MapPin,
  User,
  LogOut,
  Menu,
  X,
  Sparkles,
  Utensils,
  ChevronDown,
} from "lucide-react";

export default function UserNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
    setUserDropdown(false);
  }, [pathname]);

  const navItems = [
    { label: "Dashboard", href: "/user/dashboard", icon: LayoutDashboard },
    { label: "Subscriptions", href: "/user/subscriptions", icon: CalendarCheck },
    { label: "My Orders", href: "/user/orders", icon: ShoppingBag },
    { label: "Addresses", href: "/user/addresses", icon: MapPin },
    { label: "Profile", href: "/user/profile", icon: User },
  ];

  return (
    <header className="sticky top-0 left-0 w-full z-[990] bg-[#f5e3cd] border-b-4 border-[#0F3329] shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link
          href="/user/dashboard"
          className="font-modak text-3xl sm:text-4xl text-[#1B4D3E] text-stroke-small hover:scale-105 transition-transform uppercase tracking-tight shrink-0 flex items-center gap-2"
        >
          <span>Q1 BOWL</span>
          <span className="hidden sm:inline-block font-outfit text-[10px] font-black uppercase tracking-widest bg-[#0F3329] text-[#E5A00D] px-2.5 py-0.5 rounded-full border border-[#E5A00D]/40">
            CLUB MEMBER
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-outfit text-xs lg:text-sm font-bold uppercase tracking-wider transition-all border-2 ${
                  isActive
                    ? "bg-[#0F3329] text-[#f5e3cd] border-[#0F3329] shadow-[3px_3px_0px_#071914]"
                    : "bg-[#FFF8EE] text-[#0F3329] border-[#0F3329]/20 hover:border-[#0F3329] hover:bg-[#0F3329] hover:text-[#f5e3cd]"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-[#E5A00D]" : "text-[#0F3329]"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Order Bowl Pill Button */}
          <Link
            href="/#menu"
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#E5A00D] text-[#0F3329] border-2 border-[#0F3329] font-outfit text-xs font-extrabold uppercase tracking-wider hover:bg-white transition-all shadow-[2px_2px_0px_#0F3329]"
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Order Bowl</span>
          </Link>

          {/* User Profile Popover */}
          <div className="relative">
            <button
              onClick={() => setUserDropdown(!userDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#FFF8EE] border-2 border-[#0F3329] shadow-[2px_2px_0px_#0F3329] hover:bg-[#0F3329] hover:text-[#f5e3cd] transition-all"
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#0F3329] text-[#E5A00D] font-outfit text-xs font-black flex items-center justify-center border border-[#E5A00D]/50">
                Q1
              </div>
              <span className="font-outfit text-xs font-bold uppercase hidden lg:inline-block">My Account</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {/* Dropdown Menu */}
            {userDropdown && (
              <div className="absolute right-0 top-[calc(100%+0.6rem)] w-56 bg-[#FFF8EE] border-3 border-[#0F3329] rounded-2xl p-4 shadow-xl z-[1000] space-y-2 animate-in fade-in zoom-in-95">
                <div className="pb-3 border-b border-[#0F3329]/15">
                  <span className="font-mouse-memoirs text-lg text-[#E5A00D] uppercase font-bold tracking-wider block leading-none">
                    Q1 BOWL MEMBER
                  </span>
                  <span className="font-sans text-xs font-bold text-[#0F3329] truncate block mt-0.5">
                    Customer Account
                  </span>
                </div>
                <div className="space-y-1 font-outfit text-xs font-bold uppercase">
                  <Link
                    href="/user/profile"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-[#0F3329] hover:bg-[#0F3329] hover:text-[#f5e3cd] transition-all"
                  >
                    <User className="w-4 h-4 text-[#E5A00D]" />
                    <span>Profile Settings</span>
                  </Link>
                  <Link
                    href="/user/orders"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-[#0F3329] hover:bg-[#0F3329] hover:text-[#f5e3cd] transition-all"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#E5A00D]" />
                    <span>Order History</span>
                  </Link>
                  <a
                    href="/api/auth/logout"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-red-700 hover:bg-red-600 hover:text-white transition-all pt-2 border-t border-[#0F3329]/10"
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
            className="md:hidden p-2 rounded-full bg-[#FFF8EE] text-[#0F3329] border-2 border-[#0F3329] shadow-[2px_2px_0px_#0F3329]"
            aria-label="Toggle Mobile Navigation"
          >
            {mobileOpen ? <X className="w-5 h-5 text-[#E5A00D]" /> : <Menu className="w-5 h-5 text-[#0F3329]" />}
          </button>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 top-[60px] z-[999] bg-[#0F3329] text-[#f5e3cd] p-6 flex flex-col justify-between animate-in fade-in slide-in-from-top duration-300">
          <div className="space-y-4">
            <span className="font-mouse-memoirs text-2xl text-[#E5A00D] uppercase font-bold tracking-widest block">
              PORTAL NAVIGATION
            </span>
            <nav className="flex flex-col gap-3 font-outfit text-2xl font-black uppercase text-[#FFF8EE]">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all ${
                      isActive
                        ? "bg-[#E5A00D] text-[#0F3329] border-[#E5A00D]"
                        : "bg-[#1B4D3E] text-[#FFF8EE] border-[#1B4D3E] hover:border-[#E5A00D]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-6 h-6" />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="pt-6 border-t-2 border-[#E5A00D]/30 space-y-3">
            <Link
              href="/#menu"
              onClick={() => setMobileOpen(false)}
              className="w-full py-3.5 rounded-2xl bg-[#E5A00D] text-[#0F3329] font-outfit font-black text-center uppercase tracking-wider block shadow-[3px_3px_0px_#000]"
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
