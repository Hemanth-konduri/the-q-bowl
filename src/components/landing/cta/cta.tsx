"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function CTA() {
  return (
    <section className="py-20 bg-[#f5e3cd] relative overflow-hidden text-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Main CTA Container Card in Dark Obsidian Green (#0F3329) */}
        <div className="p-10 sm:p-16 bg-[#0F3329] border-4 border-[#071914] rounded-[2.5rem] shadow-[8px_8px_0px_#071914] max-w-4xl mx-auto text-[#f5e3cd] relative overflow-hidden">
          
          {/* Subtle Accent Glow */}
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#E5A00D]/10 blur-3xl pointer-events-none" />

          <div className="space-y-6 relative z-10">
            {/* Top Tagline in Golden Mustard Yellow */}
            <span className="font-mouse-memoirs text-2xl sm:text-3xl text-[#E5A00D] uppercase font-bold tracking-widest inline-flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#E5A00D]" />
              <span>TASTE THE DIFFERENCE TODAY</span>
              <Sparkles className="w-5 h-5 text-[#E5A00D]" />
            </span>

            {/* Main Headline in Outfit Bold Display Typography (Crisp White/Cream) */}
            <h2 className="font-outfit font-extrabold text-4xl sm:text-6xl lg:text-7xl text-[#FFF8EE] uppercase leading-none tracking-tight max-w-3xl mx-auto">
              READY TO UPGRADE YOUR DAILY DINING?
            </h2>

            {/* Subtitle in Soft Cream Text */}
            <p className="font-sans text-base sm:text-xl text-[#f5e3cd]/90 max-w-xl mx-auto font-normal leading-relaxed">
              Join thousands of happy customers enjoying fresh chef-curated meals. Order on-demand or start your flexible meal subscription now.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Link
                href="/register"
                className="px-8 py-4 rounded-full font-outfit text-lg font-bold text-[#0F3329] bg-[#E5A00D] border-2 border-[#E5A00D] hover:bg-white hover:border-white transition-all transform hover:scale-105 shadow-[4px_4px_0px_#000] flex items-center justify-center gap-2 uppercase tracking-wider"
              >
                <span>Create Free Account</span>
                <ArrowRight className="w-5 h-5 text-[#0F3329]" />
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 rounded-full font-outfit text-lg font-bold text-[#0F3329] bg-[#FFF8EE] border-2 border-[#FFF8EE] hover:bg-[#E5A00D] hover:border-[#E5A00D] hover:text-[#0F3329] transition-all transform hover:scale-105 shadow-[4px_4px_0px_#000] uppercase tracking-wider"
              >
                Sign In
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
