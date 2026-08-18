"use client";

import Link from "next/link";
import { ArrowUpRight, MessageSquare, Clock, MapPin, Send, Globe, Phone, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#E5A00D] text-[#0F3329] pt-12 pb-10 relative overflow-hidden">
      
      {/* 1. Continuous Marquee Ticker Bar */}
      <div className="w-full overflow-hidden border-y-4 border-[#0F3329] bg-[#0F3329] py-3 text-[#E5A00D] font-mouse-memoirs text-2xl sm:text-3xl font-bold tracking-widest uppercase mb-12 shadow-[0_4px_0_#071914]">
        <div className="animate-footer-marquee whitespace-nowrap flex gap-8">
          <span>THE Q BOWL • HYDERABAD&apos;S FINEST CLOUD KITCHEN • FRESH DAILY MEAL BOWLS • NO MINIMUM ORDER • FLEXIBLE SUBSCRIPTIONS • PAUSE OR SKIP ANYTIME • CHEF-CURATED MENU •</span>
          <span>THE Q BOWL • HYDERABAD&apos;S FINEST CLOUD KITCHEN • FRESH DAILY MEAL BOWLS • NO MINIMUM ORDER • FLEXIBLE SUBSCRIPTIONS • PAUSE OR SKIP ANYTIME • CHEF-CURATED MENU •</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* 2. Giant Animated Big "THE Q BOWL" Text */}
        <div className="text-center my-6 py-4 overflow-hidden">
          <h1 className="font-mouse-memoirs text-[22vw] sm:text-[24vw] leading-[0.72] text-[#0F3329] font-black uppercase tracking-tighter select-none transition-transform duration-700 hover:scale-[1.02] inline-block animate-hero-floating cursor-pointer">
            THE Q BOWL
          </h1>
        </div>

        {/* 3. Redesigned 4-Column Grid inside Dark Obsidian Green Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          
          {/* Column 1: Brand & Kitchen Status */}
          <div className="p-8 bg-[#0F3329] text-[#f5e3cd] rounded-[2rem] border-4 border-[#071914] shadow-[6px_6px_0px_#071914] flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-mouse-memoirs text-4xl text-[#E5A00D] uppercase font-bold tracking-wider">
                THE Q BOWL
              </h3>
              <p className="font-sans text-sm text-[#f5e3cd]/80 leading-relaxed font-normal">
                Artisan cloud kitchen in Hyderabad serving chef-crafted meal bowls and flexible daily meal subscriptions.
              </p>
            </div>
            <div className="pt-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1B4D3E] border-2 border-[#E5A00D] text-[#E5A00D] font-sans text-xs font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Kitchen Live &amp; Dispatching</span>
              </span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="p-8 bg-[#0F3329] text-[#f5e3cd] rounded-[2rem] border-4 border-[#071914] shadow-[6px_6px_0px_#071914]">
            <h4 className="font-outfit text-xl font-extrabold text-[#E5A00D] uppercase tracking-wider mb-6 pb-2 border-b-2 border-[#E5A00D]/20">
              Quick Links
            </h4>
            <ul className="font-sans text-sm space-y-3">
              {[
                { label: "Today's Menu", href: "#menu" },
                { label: "Subscription Plans", href: "#subscriptions" },
                { label: "How It Works", href: "#how-it-works" },
                { label: "Our Kitchen Story", href: "#story" },
                { label: "Customer Sign In", href: "/login" },
              ].map((link, idx) => (
                <li key={idx}>
                  <a
                    href={link.href}
                    className="inline-flex items-center gap-2 text-[#f5e3cd]/90 hover:text-[#E5A00D] transition-colors font-medium group"
                  >
                    <ArrowUpRight className="w-4 h-4 text-[#E5A00D] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    <span>{link.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Operating Hours & Locations */}
          <div className="p-8 bg-[#0F3329] text-[#f5e3cd] rounded-[2rem] border-4 border-[#071914] shadow-[6px_6px_0px_#071914]">
            <h4 className="font-outfit text-xl font-extrabold text-[#E5A00D] uppercase tracking-wider mb-6 pb-2 border-b-2 border-[#E5A00D]/20">
              Kitchen Hours &amp; Hubs
            </h4>
            <div className="space-y-4 font-sans text-sm">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-[#E5A00D] shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-[#FFF8EE]">Daily Hours</h5>
                  <p className="text-xs text-[#f5e3cd]/80">11:00 AM – 11:00 PM</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#E5A00D] shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-[#FFF8EE]">Active Delivery Hubs</h5>
                  <p className="text-xs text-[#f5e3cd]/80 leading-relaxed">
                    Gachibowli, Hitec City, Madhapur, Jubilee Hills &amp; Kondapur.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Column 4: Daily Menu Drop Newsletter */}
          <div className="p-8 bg-[#0F3329] text-[#f5e3cd] rounded-[2rem] border-4 border-[#071914] shadow-[6px_6px_0px_#071914] flex flex-col justify-between">
            <div>
              <h4 className="font-outfit text-xl font-extrabold text-[#E5A00D] uppercase tracking-wider mb-3">
                Daily Menu Drop
              </h4>
              <p className="font-sans text-xs text-[#f5e3cd]/80 leading-relaxed font-normal mb-4">
                Get tomorrow&apos;s chef menu dropped to your inbox every evening at 8:00 PM.
              </p>
              <form onSubmit={(e) => e.preventDefault()} className="space-y-2">
                <input
                  type="email"
                  placeholder="Enter your email..."
                  className="w-full px-4 py-3 rounded-xl bg-[#1B4D3E] border-2 border-[#E5A00D]/40 text-[#FFF8EE] placeholder-[#f5e3cd]/50 text-xs font-sans focus:outline-none focus:border-[#E5A00D]"
                />
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#E5A00D] text-[#0F3329] font-outfit text-xs font-extrabold uppercase tracking-wider hover:bg-white transition-colors flex items-center justify-center gap-2 shadow-[2px_2px_0px_#000]"
                >
                  <span>Subscribe Menu</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>

        </div>

        {/* 4. Social Links & FSSAI Badges */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t-4 border-[#0F3329]">
          <div className="flex items-center gap-3">
            {[
              { icon: Globe, label: "Website", href: "#" },
              { icon: MessageSquare, label: "WhatsApp", href: "#" },
              { icon: Phone, label: "Call Support", href: "#" },
              { icon: Mail, label: "Email Support", href: "#" },
            ].map((s, idx) => {
              const Icon = s.icon;
              return (
                <a
                  key={idx}
                  href={s.href}
                  className="p-3 rounded-full bg-[#0F3329] text-[#E5A00D] border-2 border-[#071914] hover:bg-white hover:text-[#0F3329] transition-all transform hover:scale-110 shadow-[3px_3px_0px_#071914]"
                  aria-label={s.label}
                >
                  <Icon className="w-5 h-5" />
                </a>
              );
            })}
          </div>

          <div className="font-sans text-xs font-bold text-[#0F3329] flex items-center gap-4">
            <span className="px-3 py-1.5 rounded-lg bg-[#0F3329] text-[#E5A00D] border-2 border-[#071914] uppercase tracking-wider shadow-[2px_2px_0px_#071914]">
              FSSAI LIC. #13624011000123
            </span>
          </div>
        </div>

        {/* 5. Bottom Copyright Bar */}
        <div className="mt-8 pt-6 border-t-2 border-[#0F3329]/20 flex flex-col sm:flex-row items-center justify-between text-xs font-sans text-[#0F3329] font-medium gap-4">
          <p>© 2026 The Q Bowl Kitchen. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Terms of Service</a>
            <a href="#" className="hover:underline">Refund Policy</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
