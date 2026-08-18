"use client";

import { UtensilsCrossed, Sliders, ChefHat, Truck } from "lucide-react";

const STEPS = [
  {
    number: "01",
    title: "Pick Your Flow",
    description: "Choose single meal instant ordering or set up a flexible 7, 15, or 30-day meal subscription.",
    icon: UtensilsCrossed,
  },
  {
    number: "02",
    title: "Customize & Select",
    description: "Pick your favorite dishes from today's & tomorrow's changing menu before cutoff hours.",
    icon: Sliders,
  },
  {
    number: "03",
    title: "Chef Cooks Fresh",
    description: "Our cloud kitchen team prepares your order with fresh local ingredients immediately after cutoff.",
    icon: ChefHat,
  },
  {
    number: "04",
    title: "Express Delivery",
    description: "Hot, sealed meal bowls delivered to your home or office. Pause or skip upcoming days anytime.",
    icon: Truck,
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-[#0B1511] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="gsap-reveal text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#182B23] border border-[#233D31] text-[#94A39B] mb-4">
            <span>Simple 4-Step Process</span>
          </div>
          <h2 className="font-display text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
            HOW <span className="text-gradient">Q1 BOWL WORKS.</span>
          </h2>
          <p className="mt-4 text-[#94A39B] text-base sm:text-lg font-light">
            Designed for convenience, transparency, and delicious healthy dining.
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="gsap-reveal glass-panel p-8 rounded-3xl border border-[#233D31] hover:border-[#3B624E] transition-all duration-300 relative group flex flex-col justify-between"
              >
                <div>
                  {/* Step Number & Icon */}
                  <div className="flex items-center justify-between mb-8">
                    <span className="font-display text-5xl font-black text-[#233D31] group-hover:text-[#3B624E] transition-colors">
                      {step.number}
                    </span>
                    <div className="p-3.5 rounded-2xl bg-[#182B23] text-emerald-400 border border-[#233D31]">
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="font-display text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-xs text-[#94A39B] font-light leading-relaxed">{step.description}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#233D31]/40 flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Seamless Experience</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
