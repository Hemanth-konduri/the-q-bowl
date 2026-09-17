"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, MessageSquare, Clock, MapPin, Send, Globe, Phone, Mail, CheckCircle2, Loader2 } from "lucide-react";

function InstagramIcon({ className = "w-4 h-4 sm:w-5 sm:h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export default function Footer() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;

    setSubmitting(true);
    setStatusMessage("");

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubscribed(true);
        setStatusMessage(data.message || "Subscribed successfully!");
        setEmail("");
      } else {
        setStatusMessage(data.error || "Failed to subscribe. Please try again.");
      }
    } catch {
      setStatusMessage("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-[#E5A00D] text-black pt-12 pb-10 relative overflow-hidden">
      
      {/* 1. Continuous Marquee Ticker Bar */}
      <div className="w-full overflow-hidden border-y-4 border-black bg-black py-2.5 sm:py-3 text-[#E5A00D] font-mouse-memoirs text-lg sm:text-3xl font-bold tracking-widest uppercase mb-8 sm:mb-12 shadow-[0_4px_0_#000000]">
        <div className="animate-footer-marquee whitespace-nowrap flex gap-6 sm:gap-8">
          <span>THE Q BOWL • RAJAHMUNDRY &amp; RAJANAGARAM FINEST CLOUD KITCHEN • FRESH DAILY MEAL BOWLS • NO MINIMUM ORDER • FLEXIBLE SUBSCRIPTIONS • PAUSE OR SKIP ANYTIME • CHEF-CURATED MENU •</span>
          <span>THE Q BOWL • RAJAHMUNDRY &amp; RAJANAGARAM FINEST CLOUD KITCHEN • FRESH DAILY MEAL BOWLS • NO MINIMUM ORDER • FLEXIBLE SUBSCRIPTIONS • PAUSE OR SKIP ANYTIME • CHEF-CURATED MENU •</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* 2. Giant Animated Big "THE Q BOWL" Text */}
        <div className="text-center my-4 sm:my-6 py-2 sm:py-4 overflow-hidden">
          <h1 className="font-mouse-memoirs text-[19vw] sm:text-[24vw] leading-[0.72] text-black font-black uppercase tracking-tighter select-none transition-transform duration-700 hover:scale-[1.02] inline-block animate-hero-floating cursor-pointer">
            THE Q BOWL
          </h1>
        </div>

        {/* 3. Redesigned 4-Column Grid inside Black Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-12 sm:mb-16">
          
          {/* Column 1: Brand & Kitchen Status */}
          <div className="p-6 sm:p-8 bg-black text-[#f5e3cd] rounded-2xl sm:rounded-[2rem] border-4 border-black shadow-[4px_4px_0px_#000000] sm:shadow-[6px_6px_0px_#000000] flex flex-col justify-between">
            <div className="space-y-3 sm:space-y-4">
              <h3 className="font-mouse-memoirs text-3xl sm:text-4xl text-[#E5A00D] uppercase font-bold tracking-wider">
                THE Q BOWL
              </h3>
              <p className="font-sans text-xs sm:text-sm text-[#f5e3cd]/80 leading-relaxed font-normal">
                Artisan cloud kitchen in Rajamahendravaram &amp; Rajanagaram serving fresh chef-crafted meal bowls and flexible daily subscriptions.
              </p>
            </div>
            <div className="pt-5 sm:pt-6">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-black border-2 border-[#E5A00D] text-[#E5A00D] font-sans text-[11px] sm:text-xs font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Kitchen Live &amp; Dispatching</span>
              </span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="p-6 sm:p-8 bg-black text-[#f5e3cd] rounded-2xl sm:rounded-[2rem] border-4 border-black shadow-[4px_4px_0px_#000000] sm:shadow-[6px_6px_0px_#000000]">
            <h4 className="font-outfit text-lg sm:text-xl font-extrabold text-[#E5A00D] uppercase tracking-wider mb-4 sm:mb-6 pb-2 border-b-2 border-[#E5A00D]/20">
              Quick Links
            </h4>
            <ul className="font-sans text-xs sm:text-sm space-y-2.5 sm:space-y-3">
              {[
                { label: "Today's Menu", href: "#menu" },
                { label: "Subscription Plans", href: "#subscriptions" },
                { label: "Check Delivery Zone", href: "#delivery" },
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
          <div className="p-6 sm:p-8 bg-black text-[#f5e3cd] rounded-2xl sm:rounded-[2rem] border-4 border-black shadow-[4px_4px_0px_#000000] sm:shadow-[6px_6px_0px_#000000]">
            <h4 className="font-outfit text-lg sm:text-xl font-extrabold text-[#E5A00D] uppercase tracking-wider mb-4 sm:mb-6 pb-2 border-b-2 border-[#E5A00D]/20">
              Kitchen Hours &amp; Hubs
            </h4>
            <div className="space-y-3.5 sm:space-y-4 font-sans text-xs sm:text-sm">
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#E5A00D] shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-[#FFF8EE]">Daily Hours</h5>
                  <p className="text-xs text-[#f5e3cd]/80">11:00 AM – 11:00 PM</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#E5A00D] shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-[#FFF8EE]">Active Delivery Hubs</h5>
                  <p className="text-xs text-[#f5e3cd]/80 leading-relaxed">
                    Bridge County, Rajanagaram, GIET, Diwancheruvu, Lalacheruvu &amp; Rajahmundry.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Column 4: Daily Menu Drop Newsletter */}
          <div className="p-6 sm:p-8 bg-black text-[#f5e3cd] rounded-2xl sm:rounded-[2rem] border-4 border-black shadow-[4px_4px_0px_#000000] sm:shadow-[6px_6px_0px_#000000] flex flex-col justify-between">
            <div>
              <h4 className="font-outfit text-lg sm:text-xl font-extrabold text-[#E5A00D] uppercase tracking-wider mb-2.5 sm:mb-3">
                Daily Menu Drop
              </h4>
              <p className="font-sans text-xs text-[#f5e3cd]/80 leading-relaxed font-normal mb-3 sm:mb-4">
                Get tomorrow&apos;s chef menu dropped to your inbox every evening at 8:00 PM.
              </p>
              
              {subscribed ? (
                <div className="p-3.5 rounded-xl bg-[#E5A00D]/10 border-2 border-[#E5A00D] text-left space-y-1 animate-fadeIn">
                  <div className="flex items-center gap-2 text-[#E5A00D] font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Subscribed!</span>
                  </div>
                  <p className="text-[11px] text-[#f5e3cd]/80 font-sans leading-tight">
                    {statusMessage || "Tomorrow's chef menu will drop in your inbox at 8:00 PM."}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="space-y-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email..."
                    required
                    className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-black border-2 border-[#E5A00D]/40 text-[#FFF8EE] placeholder-[#f5e3cd]/50 text-xs font-sans focus:outline-none focus:border-[#E5A00D]"
                  />
                  {statusMessage && (
                    <p className="text-[11px] text-red-400 font-sans">{statusMessage}</p>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 sm:py-3 rounded-xl bg-[#E5A00D] text-black font-outfit text-xs font-extrabold uppercase tracking-wider hover:bg-white transition-colors flex items-center justify-center gap-2 shadow-[2px_2px_0px_#000] disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Subscribing...</span>
                      </>
                    ) : (
                      <>
                        <span>Subscribe Menu</span>
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>

        {/* 4. Social Links & FSSAI Badges */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6 pt-6 border-t-4 border-black text-center sm:text-left">
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap justify-center sm:justify-start">
            {[
              { 
                icon: Globe, 
                label: "Website", 
                href: "/" 
              },
              { 
                icon: MessageSquare, 
                label: "WhatsApp (+91 9389434343)", 
                href: "https://wa.me/919389434343?text=Hello%20The%20Q%20Bowl,%20I%20would%20like%20to%20order%20or%20inquire%20about%20meal%20subscriptions" 
              },
              { 
                icon: Phone, 
                label: "Call Support (9389434343)", 
                href: "tel:+919389434343" 
              },
              { 
                icon: InstagramIcon, 
                label: "Instagram (@the_qbowl)", 
                href: "https://instagram.com/the_qbowl" 
              },
              { 
                icon: Mail, 
                label: "Email Support", 
                href: "mailto:support@theqbowl.com" 
              },
            ].map((s, idx) => {
              const Icon = s.icon;
              return (
                <a
                  key={idx}
                  href={s.href}
                  target={s.href.startsWith("http") ? "_blank" : undefined}
                  rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="p-2.5 sm:p-3 rounded-full bg-black text-[#E5A00D] border-2 border-black hover:bg-white hover:text-black transition-all transform hover:scale-110 shadow-[2px_2px_0px_#000000] sm:shadow-[3px_3px_0px_#000000]"
                  aria-label={s.label}
                  title={s.label}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
              );
            })}
          </div>

          <div className="font-sans text-xs font-bold text-black flex items-center gap-4">
            <span className="px-3 py-1.5 rounded-lg bg-black text-[#E5A00D] border-2 border-black uppercase tracking-wider shadow-[2px_2px_0px_#000000]">
              FSSAI LIC. #13624011000123
            </span>
          </div>
        </div>

        {/* 5. Bottom Copyright Bar */}
        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t-2 border-black/20 flex flex-col sm:flex-row items-center justify-between text-xs font-sans text-black font-medium gap-3 sm:gap-4 text-center sm:text-left">
          <p>© 2026 The Q Bowl Kitchen. All rights reserved.</p>
          <div className="flex flex-wrap justify-center sm:justify-end gap-4 sm:gap-6">
            <Link href="#story" className="hover:underline">About Kitchen</Link>
            <Link href="#delivery" className="hover:underline">Delivery Zones</Link>
            <Link href="#subscriptions" className="hover:underline">Subscription Terms</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
