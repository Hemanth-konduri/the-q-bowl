"use client";

import Link from "next/link";
import { Tag, Sparkles, Gift, ArrowRight } from "lucide-react";

export default function OffersBanner() {
  return (
    <section className="py-16 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="gsap-reveal relative rounded-3xl p-8 sm:p-12 overflow-hidden border border-[#E07A5F]/30 bg-gradient-to-r from-black via-black to-[#1F1410] glow-accent">
          
          {/* Ambient Glow */}
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#E07A5F]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="grid lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#E07A5F]/20 text-[#E07A5F] border border-[#E07A5F]/30">
                <Gift className="w-3.5 h-3.5" />
                <span>Occasion Promotion</span>
              </div>
              <h3 className="font-display text-3xl sm:text-5xl font-extrabold text-white leading-tight">
                GET <span className="text-gradient-accent">20% OFF</span> ON YOUR FIRST NORMAL ORDER
              </h3>
              <p className="text-xs sm:text-sm text-[#94A39B] max-w-xl font-light">
                Try our chef-crafted à la carte bowls today. Use coupon code <strong className="text-white bg-black px-2 py-0.5 rounded border border-white/10">WELCOME20</strong> at checkout on orders above ₹299.
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-end">
              <Link
                href="/login"
                className="px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-[#E07A5F] hover:bg-[#E88970] transition text-center flex items-center justify-center gap-2 shadow-lg shadow-[#E07A5F]/25"
              >
                <span>Claim Offer Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
