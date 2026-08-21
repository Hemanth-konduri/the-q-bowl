"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ArrowRight, Utensils } from "lucide-react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDarkSection, setIsDarkSection] = useState(false);

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
      {/* 100% Transparent Floating Navbar with Smooth Color Theme Switch */}
      <header className="fixed top-0 left-0 w-full z-[990] py-4 bg-transparent transition-colors duration-500 pointer-events-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between">
          
          {/* Brand Logo & Icon with Smooth Theme Transition */}
          <Link
            href="/"
            className="flex items-center gap-2.5 sm:gap-3 shrink-0 group transition-transform duration-300 hover:scale-105"
          >
            <div className={`p-1 rounded-xl border-2 transition-all duration-500 ${
              isDarkSection
                ? "bg-[#E5A00D] border-[#E5A00D] shadow-[2px_2px_0px_#FFF8EE]"
                : "bg-[#FFF8EE] border-black shadow-[2px_2px_0px_#000000]"
            }`}>
              <Image
                src="/the_q_bowl_logo.png"
                alt="The Q Bowl Logo"
                width={48}
                height={48}
                priority
                className="w-7 h-7 sm:w-9 sm:h-9 object-contain rounded-lg"
              />
            </div>
            <span
              className={`font-outfit text-2xl sm:text-4xl font-black uppercase tracking-wider transition-colors duration-500 ${
                isDarkSection ? "text-[#E5A00D] text-stroke-white" : "text-black text-stroke-small"
              }`}
            >
              The Q BOWL
            </span>
          </Link>

          {/* Action Buttons Container */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Primary Order CTA Pill */}
            <Link
              href="#menu"
              className={`font-outfit text-xs sm:text-sm font-extrabold uppercase tracking-wider px-4 py-2 sm:px-6 sm:py-2.5 rounded-full border-2 transition-all duration-500 flex items-center gap-1.5 shrink-0 ${
                isDarkSection
                  ? "bg-[#E5A00D] text-black border-[#E5A00D] shadow-[2px_2px_0px_#FFF8EE] sm:shadow-[3px_3px_0px_#FFF8EE] hover:bg-white"
                  : "bg-black text-[#f5e3cd] border-black shadow-[2px_2px_0px_#000] sm:shadow-[3px_3px_0px_#000] hover:bg-zinc-900"
              }`}
            >
              <Utensils className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors duration-500 ${isDarkSection ? "text-black" : "text-[#E5A00D]"}`} />
              <span>Burgers &amp; Bowls</span>
            </Link>

            {/* Menu Toggle Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2 rounded-full border-2 font-outfit text-xs sm:text-sm font-extrabold transition-all duration-500 shrink-0 ${
                isDarkSection
                  ? "bg-[#FFF8EE] text-black border-[#E5A00D] shadow-[2px_2px_0px_#E5A00D] sm:shadow-[3px_3px_0px_#E5A00D] hover:bg-[#E5A00D]"
                  : "bg-[#FFF8EE] text-black border-black shadow-[2px_2px_0px_#000000] sm:shadow-[3px_3px_0px_#000000] hover:bg-black hover:text-white"
              }`}
              aria-label="Toggle Navigation Menu"
            >
              <span className="uppercase font-bold">Menu</span>
              {menuOpen ? (
                <X className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-500 ${isDarkSection ? "text-black" : "text-[#E5A00D]"}`} />
              ) : (
                <Menu className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-500 ${isDarkSection ? "text-black" : "text-black"}`} />
              )}
            </button>

          </div>
        </div>
      </header>

      {/* Fullscreen Mobile & Desktop Navigation Overlay Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-[9999] bg-black text-[#f5e3cd] flex flex-col justify-between p-6 sm:p-12 animate-in fade-in slide-in-from-top duration-300 overflow-y-auto">
          
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b-2 border-[#E5A00D]/30 pb-6">
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 font-outfit text-3xl sm:text-4xl font-black text-[#E5A00D] uppercase tracking-wider"
            >
              <div className="p-1 rounded-xl bg-[#E5A00D] border-2 border-[#E5A00D] shadow-[2px_2px_0px_#000000]">
                <Image
                  src="/the_q_bowl_logo.png"
                  alt="The Q Bowl Logo"
                  width={40}
                  height={40}
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-lg"
                />
              </div>
              <span>The Q BOWL</span>
            </Link>
            <button
              onClick={() => setMenuOpen(false)}
              className="p-3 rounded-full bg-black text-[#E5A00D] border-2 border-[#E5A00D] hover:bg-[#E5A00D] hover:text-black transition-all shadow-[3px_3px_0px_#000]"
              aria-label="Close Menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Big Navigation Links */}
          <div className="my-auto py-8 flex flex-col gap-6 text-center sm:text-left max-w-xl mx-auto w-full">
            <span className="font-mouse-memoirs text-2xl text-[#E5A00D] uppercase font-bold tracking-widest block">
              QUICK NAVIGATION
            </span>
            <nav className="flex flex-col gap-4 font-outfit text-3xl sm:text-5xl font-black uppercase text-[#FFF8EE] tracking-tight">
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
                  onClick={() => setMenuOpen(false)}
                  className="hover:text-[#E5A00D] transition-colors flex items-center justify-between group py-1"
                >
                  <span>{item.label}</span>
                  <ArrowRight className="w-8 h-8 text-[#E5A00D] opacity-0 group-hover:opacity-100 transform -translate-x-4 group-hover:translate-x-0 transition-all" />
                </a>
              ))}
            </nav>
          </div>

          {/* Drawer Footer Actions */}
          <div className="border-t-2 border-[#E5A00D]/30 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span className="font-sans text-xs font-bold text-[#E5A00D] uppercase tracking-wider">
                Kitchen Live &amp; Dispatching • Hyderabad
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="flex-1 sm:flex-initial px-6 py-3 rounded-full bg-[#E5A00D] text-black font-outfit text-sm font-extrabold uppercase tracking-wider text-center hover:bg-white transition-all shadow-[3px_3px_0px_#000]"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setMenuOpen(false)}
                className="flex-1 sm:flex-initial px-6 py-3 rounded-full bg-[#FFF8EE] text-black font-outfit text-sm font-extrabold uppercase tracking-wider text-center hover:bg-[#E5A00D] transition-all shadow-[3px_3px_0px_#000]"
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
