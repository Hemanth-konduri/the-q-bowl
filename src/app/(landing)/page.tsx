"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Preloader from "@/components/landing/preloader";
import LenisProvider from "@/components/landing/lenis-provider";
import Navbar from "@/components/landing/navbar/navbar";
import Hero from "@/components/landing/hero/hero";
import CraftStory from "@/components/landing/about/craft-story";
import JellyWave from "@/components/landing/jelly-wave";
import DailyMenuPreview from "@/components/landing/menu/daily-menu-preview";
import Pricing from "@/components/landing/pricing/pricing";
import DeliveryChecker from "@/components/landing/delivery/delivery-checker";
import FAQSection from "@/components/landing/faq/faq-section";
import CTA from "@/components/landing/cta/cta";
import Footer from "@/components/landing/footer/footer";
import { useGsapAnimations } from "@/components/landing/gsap-provider";
import { Menu, X, ArrowUpRight } from "lucide-react";

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Initialize GSAP scroll animations & parallax hooks
  useGsapAnimations();

  return (
    <LenisProvider>
      <div className="min-h-screen bg-[#f5e3cd] text-black font-sans selection:bg-black selection:text-white">

        {/* Liquid Preloader Curtain */}
        <Preloader />

        {/* CRAV Style Floating Sticky Mobile-Friendly Navbar */}
        <Navbar />

        {/* Main Flow */}
        <main className="relative">
          <Hero />
          <CraftStory />

          {/* Jelly Wave Transition into Dark Menu Section */}
          <JellyWave bgColor="#f5e3cd" fillColor="#000000" />
          <DailyMenuPreview />
          <JellyWave bgColor="#000000" fillColor="#f5e3cd" flip />

          <Pricing />
          <DeliveryChecker />

          {/* Jelly Wave Transition into Yellow FAQ & Reviews Section */}
          <JellyWave bgColor="#f5e3cd" fillColor="#E5A00D" />
          <FAQSection />
          <JellyWave bgColor="#E5A00D" fillColor="#f5e3cd" flip />

          <CTA />
        </main>

        {/* Jelly Wave Transition into Yellow Footer */}
        <JellyWave bgColor="#f5e3cd" fillColor="#E5A00D" />
        <Footer />

      </div>
    </LenisProvider>
  );
}
