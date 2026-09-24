"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  CalendarCheck,
  UtensilsCrossed,
  ChefHat,
  Bike,
  Users,
  Wallet,
  BarChart3,
  Settings,
  MessageSquare,
  Tag,
  KeyRound,
  X,
} from "lucide-react";

const menu = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
  { name: "Orders", icon: Receipt, href: "/admin/orders" },
  { name: "Subscriptions", icon: CalendarCheck, href: "/admin/subscriptions" },
  { name: "Menu", icon: UtensilsCrossed, href: "/admin/menu" },
  { name: "Kitchen", icon: ChefHat, href: "/admin/kitchen" },
  { name: "Delivery", icon: Bike, href: "/admin/delivery" },
  { name: "Customers", icon: Users, href: "/admin/customers" },
  { name: "Payments", icon: Wallet, href: "/admin/payments" },
  { name: "Feedback", icon: MessageSquare, href: "/admin/feedback" },
  { name: "Coupons", icon: Tag, href: "/admin/coupons" },
  { name: "Credentials", icon: KeyRound, href: "/admin/credentials" },
  { name: "Analytics", icon: BarChart3, href: "/admin/analytics" },
  { name: "Settings", icon: Settings, href: "/admin/settings" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function handleToggle() {
      setMobileOpen((prev) => !prev);
    }
    function handleClose() {
      setMobileOpen(false);
    }

    window.addEventListener("toggle-admin-sidebar", handleToggle);
    window.addEventListener("close-admin-sidebar", handleClose);

    return () => {
      window.removeEventListener("toggle-admin-sidebar", handleToggle);
      window.removeEventListener("close-admin-sidebar", handleClose);
    };
  }, []);

  // Close sidebar on pathname change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function handleNavigate(href: string) {
    setMobileOpen(false);
    router.push(href);
  }

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Aside */}
      <aside
        className={`fixed left-0 top-0 h-screen w-72 lg:w-64 bg-white p-5 text-black z-50 overflow-y-auto border-r border-slate-200 transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header with Logo & Mobile Close Button */}
        <div className="flex items-center justify-between mb-6 sm:mb-8 px-1">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative h-10 w-10 rounded-xl bg-[#E5A00D] p-1 flex items-center justify-center text-black shrink-0 border border-amber-400 shadow-sm group-hover:scale-105 transition-transform">
              <Image
                src="/the_q_bowl_logo.png"
                alt="Q Bowl Logo"
                width={28}
                height={28}
                className="object-contain rounded-lg"
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-black tracking-tight text-black font-sans uppercase">Q Bowl</h1>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#E5A00D]">Admin Panel</span>
            </div>
          </Link>

          {/* Close button for mobile drawer */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-black hover:bg-slate-100 transition-colors"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="space-y-1.5 pb-6">
          {menu.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href === "/admin/dashboard" && pathname === "/admin");

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigate(item.href);
                }}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#E5A00D] text-black font-black shadow-sm"
                    : "text-slate-700 hover:bg-slate-100 hover:text-black"
                }`}
              >
                <Icon size={18} className={isActive ? "text-black" : "text-slate-700"} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

export default AdminSidebar;

