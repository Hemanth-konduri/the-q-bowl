"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ArrowRight, Utensils, Download, Smartphone, Sparkles } from "lucide-react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDarkSection, setIsDarkSection] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(true);

  // Close mobile drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [menuOpen]);

  // Dynamic Theme Detection (detects when navbar floats over dark green sections)
  useEffect(() => {
    const checkNavTheme = () => {
      const darkSections = document.querySelectorAll('[data-nav-dark="true"]');
      const navY = 50; // Navbar trigger height line

      let isDark = false;
      darkSections.forEach((sec) => {
        const rect = sec.getBoundingClientRect();
        if (rect.top <= navY && rect.bottom >= navY) {
          isDark = true;
        }
      });

      setIsDarkSection(isDark);
    };

    window.addEventListener("scroll", checkNavTheme, { passive: true });
    checkNavTheme();
    return () => window.removeEventListener("scroll", checkNavTheme);
  }, []);

  return (
    <>
      {/* Topmost Fixed/Floating Header Area */}
      <div className="fixed top-0 left-0 w-full z-[990] pointer-events-auto flex flex-col">
        {/* Top-of-Page Announcement Bar for APK Download (Phone/Mobile Only) */}
        {bannerVisible && (
          <div className="md:hidden w-full bg-black text-[#f5e3cd] border-b-2 border-[#E5A00D]/40 px-3 py-1.5 transition-all duration-300 shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
              
              {/* Left Badge / Message */}
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#E5A00D] text-black font-outfit text-[9px] font-black uppercase tracking-wider shrink-0 shadow-[1px_1px_0px_#FFF8EE]">
                  <Smartphone className="w-2.5 h-2.5 text-black" />
                  <span>App</span>
                </span>
                <span className="font-outfit text-[11px] font-bold text-[#FFF8EE] truncate flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#E5A00D] shrink-0" />
                  <span>Get The Q Bowl Android Apk</span>
                </span>
              </div>

              {/* Right CTA & Dismiss */}
              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href="/Thepowerhouse.apk"
                  download="Thepowerhouse.apk"
                  className="px-2.5 py-1 rounded-full bg-[#E5A00D] text-black font-outfit text-[10px] font-black uppercase tracking-wider hover:bg-white hover:text-black transition-all flex items-center gap-1 shadow-[1.5px_1.5px_0px_#FFF8EE] active:scale-95 whitespace-nowrap cursor-pointer"
                  title="Download The Q Bowl Android App (.apk)"
                >
                  <Download className="w-3 h-3 stroke-[2.5]" />
                  <span>Download</span>
                </a>
                <button
                  onClick={() => setBannerVisible(false)}
                  className="p-1 rounded-full text-[#f5e3cd]/70 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Dismiss banner"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Floating Navbar with Glass Blur and Dynamic Contrast */}
        <header className="w-full py-2.5 sm:py-4 bg-transparent backdrop-blur-[2px] transition-colors duration-500 pointer-events-auto">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2">

            {/* Brand Logo & Icon with Smooth Theme Transition */}
            <Link
              href="/"
              className="flex items-center gap-2 sm:gap-3 shrink-0 group transition-transform duration-300 hover:scale-105 min-w-0"
            >
              <div className={`p-1 rounded-xl border-2 transition-all duration-500 shrink-0 ${isDarkSection
                ? "bg-[#E5A00D] border-black shadow-[2px_2px_0px_#000]"
                : "bg-[#FFF8EE] border-black shadow-[2px_2px_0px_#000000]"
                }`}>
                <Image
                  src="/the_q_bowl_logo.png"
                  alt="The Q Bowl Logo"
                  width={48}
                  height={48}
                  priority
                  className="w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 object-contain rounded-lg"
                />
              </div>
              <span
                className={`font-outfit text-lg sm:text-3xl lg:text-4xl font-black uppercase tracking-wider transition-colors duration-500 truncate ${isDarkSection ? "text-[#E5A00D]" : "text-black text-stroke-small"
                  }`}
              >
                The Q BOWL
              </span>
            </Link>

            {/* Action Buttons Container */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">

              {/* Download APK Pill in Navbar (Desktop / Compact) */}
              <a
                href="/Thepowerhouse.apk"
                download="Thepowerhouse.apk"
                className={`hidden md:inline-flex font-outfit text-xs sm:text-sm font-extrabold uppercase tracking-wider px-3.5 py-1.5 sm:px-4 sm:py-2.5 rounded-full border-2 transition-all duration-500 items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 ${isDarkSection
                  ? "bg-transparent text-[#FFF8EE] border-[#E5A00D] shadow-[2px_2px_0px_#E5A00D] hover:bg-[#E5A00D] hover:text-black"
                  : "bg-[#FFF8EE] text-black border-black shadow-[2px_2px_0px_#000] hover:bg-[#E5A00D]"
                  }`}
                title="Download Android App APK"
              >
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E5A00D] group-hover:text-black" />
                <span>Get APK</span>
              </a>

              {/* Primary Order CTA Pill */}
              <button
                onClick={() => {
                  const el = document.getElementById("menu");
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth" });
                  } else {
                    window.location.href = "#menu";
                  }
                }}
                className={`font-outfit text-xs sm:text-sm font-extrabold uppercase tracking-wider px-3 py-1.5 sm:px-6 sm:py-2.5 rounded-full border-2 transition-all duration-500 flex items-center gap-1 sm:gap-1.5 shrink-0 cursor-pointer active:scale-95 ${isDarkSection
                  ? "bg-[#E5A00D] text-black border-[#E5A00D] shadow-[2px_2px_0px_#FFF8EE] sm:shadow-[3px_3px_0px_#FFF8EE] hover:bg-white"
                  : "bg-black text-[#f5e3cd] border-black shadow-[2px_2px_0px_#000] sm:shadow-[3px_3px_0px_#000] hover:bg-zinc-900"
                  }`}
              >
                <Utensils className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors duration-500 ${isDarkSection ? "text-black" : "text-[#E5A00D]"}`} />
                <span>Order Now</span>
              </button>

              {/* Menu Toggle Button */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-full border-2 font-outfit text-xs sm:text-sm font-extrabold transition-all duration-500 shrink-0 cursor-pointer ${isDarkSection
                  ? "bg-[#FFF8EE] text-black border-[#E5A00D] shadow-[2px_2px_0px_#E5A00D] sm:shadow-[3px_3px_0px_#E5A00D] hover:bg-[#E5A00D]"
                  : "bg-[#FFF8EE] text-black border-black shadow-[2px_2px_0px_#000000] sm:shadow-[3px_3px_0px_#000000] hover:bg-black hover:text-white"
                  }`}
                aria-label="Toggle Navigation Menu"
              >
                <span className="uppercase font-bold hidden xs:inline sm:inline">Menu</span>
                {menuOpen ? (
                  <X className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-500 ${isDarkSection ? "text-black" : "text-[#E5A00D]"}`} />
                ) : (
                  <Menu className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-500 ${isDarkSection ? "text-black" : "text-black"}`} />
                )}
              </button>

            </div>
          </div>
        </header>
      </div>

      {/* Fullscreen Mobile & Desktop Navigation Overlay Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-[9999] bg-black text-[#f5e3cd] flex flex-col justify-between p-5 sm:p-10 md:p-12 animate-in fade-in slide-in-from-top duration-300 overflow-y-auto">

          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b-2 border-[#E5A00D]/30 pb-4 sm:pb-6 shrink-0">
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 sm:gap-3 font-outfit text-2xl sm:text-4xl font-black text-[#E5A00D] uppercase tracking-wider"
            >
              <div className="p-1 rounded-xl bg-[#E5A00D] border-2 border-[#E5A00D] shadow-[2px_2px_0px_#000000]">
                <Image
                  src="/the_q_bowl_logo.png"
                  alt="The Q Bowl Logo"
                  width={40}
                  height={40}
                  className="w-7 h-7 sm:w-10 sm:h-10 object-contain rounded-lg"
                />
              </div>
              <span>The Q BOWL</span>
            </Link>
            <button
              onClick={() => setMenuOpen(false)}
              className="p-2 sm:p-3 rounded-full bg-black text-[#E5A00D] border-2 border-[#E5A00D] hover:bg-[#E5A00D] hover:text-black transition-all shadow-[2px_2px_0px_#000] sm:shadow-[3px_3px_0px_#000]"
              aria-label="Close Menu"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Big Navigation Links */}
          <div className="my-auto py-6 sm:py-8 flex flex-col gap-4 sm:gap-6 text-left max-w-xl mx-auto w-full">
            <span className="font-mouse-memoirs text-xl sm:text-2xl text-[#E5A00D] uppercase font-bold tracking-widest block">
              QUICK NAVIGATION
            </span>
            <nav className="flex flex-col gap-2.5 sm:gap-4 font-outfit text-2xl sm:text-4xl md:text-5xl font-black uppercase text-[#FFF8EE] tracking-tight">
              {[
                { label: "Today's Menu", href: "#menu" },
                { label: "Subscription Plans", href: "#subscriptions" },
                { label: "How It Works", href: "#how-it-works" },
                { label: "Our Kitchen Story", href: "#story" },
                { label: "Service Hubs", href: "#delivery" },
                { label: "FAQ & Reviews", href: "#faq" },
              ].map((item, idx) => (
                <a
                  key={idx}
                  href={item.href}
                  onClick={(e) => {
                    setMenuOpen(false);
                    const targetId = item.href.replace("#", "");
                    const targetEl = document.getElementById(targetId);
                    if (targetEl) {
                      e.preventDefault();
                      setTimeout(() => {
                        targetEl.scrollIntoView({ behavior: "smooth" });
                      }, 100);
                    }
                  }}
                  className="hover:text-[#E5A00D] transition-colors flex items-center justify-between group py-1 border-b border-white/5 sm:border-transparent"
                >
                  <span>{item.label}</span>
                  <ArrowRight className="w-5 h-5 sm:w-8 sm:h-8 text-[#E5A00D] opacity-60 sm:opacity-0 group-hover:opacity-100 transform -translate-x-2 sm:-translate-x-4 group-hover:translate-x-0 transition-all" />
                </a>
              ))}
              <a
                href="/Thepowerhouse.apk"
                download="Thepowerhouse.apk"
                onClick={() => setMenuOpen(false)}
                className="text-[#E5A00D] hover:text-white transition-colors flex items-center justify-between group py-1.5 border-t border-[#E5A00D]/20 pt-3 mt-1 font-outfit text-xl sm:text-3xl font-extrabold uppercase"
              >
                <span className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 sm:w-7 sm:h-7" />
                  Download Android APK
                </span>
                <Download className="w-5 h-5 sm:w-7 sm:h-7 text-[#E5A00D] group-hover:translate-y-0.5 transition-transform" />
              </a>
            </nav>
          </div>

          {/* Drawer Footer Actions */}
          <div className="border-t-2 border-[#E5A00D]/30 pt-5 sm:pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 pb-2">
            <div className="flex items-center gap-2 text-center sm:text-left">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
              <span className="font-sans text-[11px] sm:text-xs font-bold text-[#E5A00D] uppercase tracking-wider">
                Kitchen Live &amp; Dispatching • Hyderabad
              </span>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
              <Link
                href="/login"
                prefetch={true}
                onClick={() => setMenuOpen(false)}
                className="flex-1 sm:flex-initial px-5 py-2.5 sm:px-6 sm:py-3 rounded-full bg-[#E5A00D] text-black font-outfit text-xs sm:text-sm font-extrabold uppercase tracking-wider text-center hover:bg-white transition-all shadow-[2px_2px_0px_#000] sm:shadow-[3px_3px_0px_#000] active:scale-95"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                prefetch={true}
                onClick={() => setMenuOpen(false)}
                className="flex-1 sm:flex-initial px-5 py-2.5 sm:px-6 sm:py-3 rounded-full bg-[#FFF8EE] text-black font-outfit text-xs sm:text-sm font-extrabold uppercase tracking-wider text-center hover:bg-[#E5A00D] transition-all shadow-[2px_2px_0px_#000] sm:shadow-[3px_3px_0px_#000] active:scale-95"
              >
                Register
              </Link>
            </div>
          </div>

        </div>
      )}
    </>
  );
}
