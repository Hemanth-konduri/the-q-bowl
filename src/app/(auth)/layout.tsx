import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex h-screen max-h-screen w-full flex-col justify-between overflow-hidden bg-[#f5e3cd] text-black selection:bg-[#E5A00D]/30">
      {/* ── Background Decorative Grid & Ambient Glow ── */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#000000_0.75px,transparent_0.75px)] [background-size:24px_24px] opacity-[0.06]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[450px] w-[450px] -translate-x-1/2 rounded-full bg-[#E5A00D]/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 left-1/2 h-[450px] w-[450px] -translate-x-1/2 rounded-full bg-[#E5A00D]/15 blur-[140px]" />

      {/* ── Floating Decorative Food Bowls (Specified Bowl Assets - Compact Fit) ── */}
      <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
        {/* 1. Top-Left: Chicken Dum Biryani Bowl */}
        <div className="animate-bowl-1 absolute -left-6 -top-6 w-32 sm:left-4 sm:top-4 sm:w-44 md:w-52 lg:left-8 lg:top-6 lg:w-60 drop-shadow-[0_20px_25px_rgba(0,0,0,0.18)]">
          <Image
            src="/chicken_dum_biryani.png"
            alt="Chicken Dum Biryani Bowl"
            width={300}
            height={300}
            className="h-auto w-full object-contain filter transition-transform duration-700 hover:scale-105"
            priority
          />
        </div>

        {/* 2. Top-Right: Chicken Curry Bowl */}
        <div className="animate-bowl-2 absolute -right-6 -top-6 w-32 sm:-right-2 sm:top-4 sm:w-40 md:w-48 lg:right-8 lg:top-4 lg:w-56 drop-shadow-[0_20px_25px_rgba(0,0,0,0.18)]">
          <Image
            src="/chicken_curry_bowl.png"
            alt="Chicken Curry Bowl"
            width={280}
            height={280}
            className="h-auto w-full object-contain filter transition-transform duration-700 hover:scale-105"
            priority
          />
        </div>

        {/* 3. Mid-Left: Veg Bowl */}
        <div className="animate-bowl-5 absolute top-[38%] -left-10 hidden sm:block w-28 md:w-36 lg:left-2 lg:w-44 drop-shadow-[0_15px_20px_rgba(0,0,0,0.16)]">
          <Image
            src="/veg_bowl.png"
            alt="Fresh Veg Bowl"
            width={240}
            height={240}
            className="h-auto w-full object-contain filter transition-transform duration-700 hover:scale-105"
          />
        </div>

        {/* 4. Mid-Right: Chicken Fry Biryani Bowl */}
        <div className="animate-bowl-4 absolute top-[38%] -right-10 hidden sm:block w-28 md:w-36 lg:right-2 lg:w-44 drop-shadow-[0_15px_20px_rgba(0,0,0,0.16)]">
          <Image
            src="/chicken_fry_biryani.png"
            alt="Chicken Fry Biryani Bowl"
            width={240}
            height={240}
            className="h-auto w-full object-contain filter transition-transform duration-700 hover:scale-105"
          />
        </div>

        {/* 5. Bottom-Left: Paneer Bowl */}
        <div className="animate-bowl-3 absolute -bottom-8 -left-6 w-32 sm:bottom-2 sm:left-4 sm:w-44 md:w-52 lg:bottom-6 lg:left-8 lg:w-60 drop-shadow-[0_20px_25px_rgba(0,0,0,0.2)]">
          <Image
            src="/paneer_bowl_new.png"
            alt="Paneer Bowl"
            width={300}
            height={300}
            className="h-auto w-full object-contain filter transition-transform duration-700 hover:scale-105"
          />
        </div>

        {/* 6. Bottom-Right: Protein Biryani Bowl */}
        <div className="animate-bowl-2 absolute -bottom-8 -right-6 w-32 sm:bottom-2 sm:right-4 sm:w-44 md:w-52 lg:bottom-6 lg:right-8 lg:w-60 drop-shadow-[0_20px_25px_rgba(0,0,0,0.2)]">
          <Image
            src="/protein_bowl.png"
            alt="Protein Biryani Bowl"
            width={300}
            height={300}
            className="h-auto w-full object-contain filter transition-transform duration-700 hover:scale-105"
          />
        </div>

        {/* Floating Accent Badge Top-Center-Right */}
        <div className="animate-bowl-5 absolute top-1/4 right-[3%] hidden xl:block drop-shadow-md">
          <div className="flex items-center gap-2 rounded-full border-2 border-black bg-[#FFF8EE] px-3.5 py-1 text-[11px] font-bold text-black shadow-[2.5px_2.5px_0px_#000]">
            <span className="h-2 w-2 rounded-full bg-[#E5A00D] animate-pulse" />
            100% Fresh Daily Bowls
          </div>
        </div>

        {/* Floating Accent Badge Bottom-Center-Left */}
        <div className="animate-bowl-1 absolute bottom-1/4 left-[3%] hidden xl:block drop-shadow-md">
          <div className="flex items-center gap-2 rounded-full border-2 border-black bg-[#000000] px-3.5 py-1 text-[11px] font-bold text-[#f5e3cd] shadow-[2.5px_2.5px_0px_#E5A00D]">
            <span>✨ Crafted Recipe Bowls</span>
          </div>
        </div>
      </div>

      {/* ── Top Header ── */}
      <header className="relative z-30 flex w-full items-center justify-between px-6 py-4 sm:px-10 sm:py-4">
        <Link href="/" className="group flex items-center gap-2.5 transition-transform duration-300 hover:scale-105">
          <div className="relative h-9 w-9 overflow-hidden rounded-full border-2 border-black shadow-[2px_2px_0px_#000]">
            <Image src="/the_q_bowl_logo.png" alt="Q1 Bowl Logo" fill className="object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="font-outfit text-lg font-black tracking-tight text-black">Q1 Bowl</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-black/60">Crafted Bowls</span>
          </div>
        </Link>

        <Link
          href="/"
          className="group flex items-center gap-1.5 rounded-full border-2 border-black bg-[#FFF8EE] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-black shadow-[2.5px_2.5px_0px_#000] transition-all hover:bg-black hover:text-[#f5e3cd] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          <span>Back to Home</span>
          <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
        </Link>
      </header>

      {/* ── Center Content Container (NO Card, Fixed Positioned) ── */}
      <main className="relative z-30 flex flex-1 items-center justify-center px-4 py-1 sm:px-6 overflow-hidden">
        <div className="w-full max-w-md transition-all duration-300">
          {children}
        </div>
      </main>

      {/* ── Bottom Footer ── */}
      <footer className="relative z-30 flex items-center justify-between px-6 py-3 text-[11px] font-semibold text-black/50 sm:px-10">
        <span>© 2026 Q1 Bowl • Member Onboarding</span>
        <span className="hidden sm:inline">Crafted with care for your health</span>
        <span>Secure Access</span>
      </footer>
    </div>
  );
}

