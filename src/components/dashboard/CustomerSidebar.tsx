"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ShoppingBag,
  Heart,
  History,
  Receipt,
  CalendarCheck,
  Settings,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
} from "lucide-react";

interface NavItem {
  name: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  href: string;
}

const navItems: NavItem[] = [
  { name: "Home", icon: Home, href: "/dashboard" },
  { name: "Order (Live Tracking)", icon: ShoppingBag, href: "/dashboard#active-order" },
  { name: "Favourites", icon: Heart, href: "/dashboard#favourites" },
  { name: "Order History", icon: History, href: "/dashboard#history" },
  { name: "Bills & Invoices", icon: Receipt, href: "/dashboard#invoices" },
  { name: "Subscriptions", icon: CalendarCheck, href: "/dashboard#subscriptions" },
  { name: "Kitchen Hub", icon: ChefHat, href: "/dashboard#kitchen" },
  { name: "Settings", icon: Settings, href: "/dashboard#settings" },
];

export function CustomerSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const [activeItem, setActiveItem] = useState("Home");

  // Track active item from hash / pathname on mount and on changes
  useEffect(() => {
    function updateActiveFromUrl() {
      if (typeof window !== "undefined") {
        const hash = window.location.hash;
        if (hash === "#favourites") {
          setActiveItem("Favourites");
        } else if (hash === "#active-order" || hash === "#orders") {
          setActiveItem("Order (Live Tracking)");
        } else if (hash === "#history") {
          setActiveItem("Order History");
        } else if (hash === "#invoices") {
          setActiveItem("Bills & Invoices");
        } else if (hash === "#subscriptions") {
          setActiveItem("Subscriptions");
        } else if (hash === "#kitchen" || hash === "#kitchen-info") {
          setActiveItem("Kitchen Hub");
        } else if (hash === "#settings") {
          setActiveItem("Settings");
        } else if (pathname === "/dashboard" && (!hash || hash === "#" || hash === "#menu-section")) {
          setActiveItem("Home");
        }
      }
    }

    updateActiveFromUrl();
    window.addEventListener("hashchange", updateActiveFromUrl);

    function handleCategoryEvent(e: any) {
      if (e?.detail?.category === "Favourites") {
        setActiveItem("Favourites");
      } else if (e?.detail?.category === "All Delicacies" || !e?.detail?.category) {
        setActiveItem("Home");
      }
    }
    window.addEventListener("qbowl-select-category", handleCategoryEvent);

    return () => {
      window.removeEventListener("hashchange", updateActiveFromUrl);
      window.removeEventListener("qbowl-select-category", handleCategoryEvent);
    };
  }, [pathname]);

  // Load user preference from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("qbowl_customer_sidebar_open");
    if (savedState !== null) {
      setIsOpen(savedState === "true");
    }
  }, []);

  function toggleSidebar() {
    const next = !isOpen;
    setIsOpen(next);
    try {
      localStorage.setItem("qbowl_customer_sidebar_open", String(next));
      window.dispatchEvent(new CustomEvent("qbowl-sidebar-toggled", { detail: { isOpen: next } }));
    } catch (err) {
      console.error("Failed to update sidebar state:", err);
    }
  }

  return (
    <>
      {/* ── Desktop Floating Sidebar (Hidden on Mobile) ── */}
      <aside className="hidden md:flex fixed left-4 sm:left-8 lg:left-12 top-28 z-30 flex-col items-center py-2 shrink-0 transition-all duration-300">
        {isOpen ? (
          <div className="flex flex-col items-center animate-in fade-in slide-in-from-left-2 duration-200">
            <nav className="flex flex-col items-center gap-3 bg-white/90 backdrop-blur-md p-2 rounded-3xl border-2 border-black shadow-[4px_4px_0px_#000000]">

              {/* Top Close / Hide Button */}
              <div className="relative group flex items-center justify-center pb-1 border-b-2 border-black/10 w-full">
                <button
                  onClick={toggleSidebar}
                  className="flex items-center justify-center w-10 h-8 rounded-xl bg-zinc-100 hover:bg-black hover:text-[#FFF8EE] text-zinc-600 transition-all border border-transparent hover:border-black"
                  aria-label="Hide navigation bar"
                  title="Hide navigation bar"
                >
                  <PanelLeftClose size={16} />
                </button>

                {/* Tooltip */}
                <div
                  role="tooltip"
                  className="absolute left-full ml-3.5 px-3 py-1.5 bg-black text-[#FFF8EE] text-xs font-outfit font-black uppercase tracking-wider rounded-xl whitespace-nowrap opacity-0 pointer-events-none -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:pointer-events-auto transition-all duration-200 z-50 shadow-[3px_3px_0px_#E5A00D] border border-black flex items-center gap-1.5"
                >
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-black" />
                  <span>Hide Navigation</span>
                </div>
              </div>

              {/* Navigation Item Icons */}
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeItem === item.name;

                return (
                  <div key={item.name} className="relative group flex items-center justify-center">
                    <a
                      href={item.href}
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveItem(item.name);

                        // Extract hash or route
                        if (item.href.includes("#")) {
                          const targetHash = item.href.substring(item.href.indexOf("#"));
                          if (window.location.pathname !== "/dashboard") {
                            window.location.href = item.href;
                            return;
                          }
                          window.location.hash = targetHash;
                          window.dispatchEvent(new HashChangeEvent("hashchange"));

                          if (item.name === "Favourites") {
                            window.dispatchEvent(new CustomEvent("qbowl-select-category", { detail: { category: "Favourites" } }));
                            const menuSec = document.getElementById("menu-section");
                            if (menuSec) {
                              menuSec.scrollIntoView({ behavior: "smooth", block: "start" });
                            }
                          }
                        } else {
                          // Home
                          if (window.location.pathname !== "/dashboard") {
                            window.location.href = "/dashboard";
                            return;
                          }
                          window.location.hash = "";
                          window.dispatchEvent(new HashChangeEvent("hashchange"));
                          window.dispatchEvent(new CustomEvent("qbowl-select-category", { detail: { category: "All Delicacies" } }));
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }
                      }}
                      className={`flex items-center justify-center w-12 h-12 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${isActive
                          ? "bg-[#E5A00D] border-black text-black shadow-[2px_2px_0px_#000000] scale-105"
                          : "bg-[#FFF8EE] border-transparent text-black/70 hover:text-black hover:bg-[#E5A00D] hover:border-black hover:shadow-[2px_2px_0px_#000000] hover:scale-110"
                        }`}
                      aria-label={item.name}
                    >
                      <Icon size={22} className="shrink-0 transition-transform duration-200 group-hover:scale-110 pointer-events-none" />
                    </a>

                    {/* Hover Tooltip showing name to the right */}
                    <div
                      role="tooltip"
                      className="absolute left-full ml-3.5 px-3 py-1.5 bg-black text-[#FFF8EE] text-xs font-outfit font-black uppercase tracking-wider rounded-xl whitespace-nowrap opacity-0 pointer-events-none -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-50 shadow-[3px_3px_0px_#E5A00D] border border-black flex items-center gap-1.5"
                    >
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-black" />
                      <span>{item.name}</span>
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>
        ) : (
          /* Collapsed State: Sleek Restore / Show Button */
          <div className="relative group flex items-center justify-center animate-in fade-in slide-in-from-left duration-200">
            <button
              onClick={toggleSidebar}
              className="flex items-center justify-center w-11 h-11 rounded-2xl bg-white/95 hover:bg-[#E5A00D] border-2 border-black shadow-[3px_3px_0px_#000000] text-black hover:scale-110 transition-all active:translate-x-0.5 active:translate-y-0.5"
              aria-label="Show navigation bar"
              title="Show navigation bar"
            >
              <PanelLeftOpen size={20} />
            </button>

            {/* Hover Tooltip to Restore */}
            <div
              role="tooltip"
              className="absolute left-full ml-3.5 px-3 py-1.5 bg-black text-[#FFF8EE] text-xs font-outfit font-black uppercase tracking-wider rounded-xl whitespace-nowrap opacity-0 pointer-events-none -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:pointer-events-auto transition-all duration-200 z-50 shadow-[3px_3px_0px_#E5A00D] border border-black flex items-center gap-1.5"
            >
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-black" />
              <span>Show Navigation</span>
            </div>
          </div>
        )}
      </aside>

      {/* ── Mobile Bottom Navigation Bar (Fixed at the bottom of the screen on mobile phones) ── */}
      <nav className="md:hidden fixed bottom-2 left-2 right-2 z-40 bg-white/95 backdrop-blur-lg px-1.5 py-1.5 rounded-3xl border-2 border-black shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex items-center justify-around overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.name;
          const shortName = item.name === "Order (Live Tracking)" ? "Live Order" : item.name === "Order History" ? "History" : item.name === "Bills & Invoices" ? "Bills" : item.name;

          return (
            <a
              key={item.name}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                setActiveItem(item.name);

                if (item.href.includes("#")) {
                  const targetHash = item.href.substring(item.href.indexOf("#"));
                  if (window.location.pathname !== "/dashboard") {
                    window.location.href = item.href;
                    return;
                  }
                  window.location.hash = targetHash;
                  window.dispatchEvent(new HashChangeEvent("hashchange"));

                  if (item.name === "Favourites") {
                    window.dispatchEvent(new CustomEvent("qbowl-select-category", { detail: { category: "Favourites" } }));
                    const menuSec = document.getElementById("menu-section");
                    if (menuSec) {
                      menuSec.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                  }
                } else {
                  if (window.location.pathname !== "/dashboard") {
                    window.location.href = "/dashboard";
                    return;
                  }
                  window.location.hash = "";
                  window.dispatchEvent(new HashChangeEvent("hashchange"));
                  window.dispatchEvent(new CustomEvent("qbowl-select-category", { detail: { category: "All Delicacies" } }));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-2xl transition-all shrink-0 ${isActive
                  ? "bg-[#E5A00D] text-black border-2 border-black shadow-[2px_2px_0_#000] scale-105"
                  : "text-zinc-600 hover:text-black hover:bg-[#FFF8EE]"
                }`}
            >
              <Icon size={18} className={isActive ? "text-black" : "text-zinc-700"} />
              <span className="text-[9px] font-outfit font-black uppercase tracking-tight leading-none">
                {shortName}
              </span>
            </a>
          );
        })}
      </nav>
    </>
  );
}

export default CustomerSidebar;
