"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, MapPin, ArrowRight, Home, Sparkles } from "lucide-react";
import gsap from "gsap";

interface SuccessScreenProps {
  type: "ORDER" | "SUBSCRIPTION";
  title: string;
  subtitle: string;
  idLabel: string;
  idValue: string;
  details: { label: string; value: string }[];
  addressSummary?: string;
  primaryButtonText: string;
  primaryButtonHref: string;
  secondaryButtonText?: string;
  secondaryButtonHref?: string;
}

export default function SuccessScreen({
  type,
  title,
  subtitle,
  idLabel,
  idValue,
  details,
  addressSummary,
  primaryButtonText,
  primaryButtonHref,
  secondaryButtonText = "Back to Home",
  secondaryButtonHref = "/user/dashboard",
}: SuccessScreenProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.children,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.12, ease: "power3.out" }
      );
    }
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-8 sm:py-12 px-4">
      <div
        ref={containerRef}
        className="bg-[#FFF8EE] border-2 border-[#0F3329] rounded-3xl p-6 sm:p-10 text-center space-y-6 shadow-xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none font-outfit font-black text-8xl text-[#0F3329]">
          Q1
        </div>

        {/* ICON BADGE */}
        <div className="w-20 h-20 rounded-full bg-[#0F3329] text-[#E5A00D] flex items-center justify-center mx-auto shadow-lg relative">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          <div className="absolute -top-1 -right-1 p-1 bg-[#E5A00D] text-[#0F3329] rounded-full animate-bounce">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        {/* HEADINGS */}
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-[#E5A00D] text-[#0F3329] font-outfit text-xs font-black uppercase tracking-wider">
            {type === "ORDER" ? "ORDER CONFIRMED" : "SUBSCRIPTION ACTIVATED"}
          </span>
          <h1 className="font-outfit font-black text-2xl sm:text-3xl uppercase text-[#0F3329] tracking-tight pt-1">
            {title}
          </h1>
          <p className="font-sans text-xs sm:text-sm text-[#0F3329]/80 max-w-md mx-auto">
            {subtitle}
          </p>
        </div>

        {/* ORDER / SUB ID BANNER */}
        <div className="bg-[#f5e3cd] border-2 border-[#0F3329] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-left">
            <span className="font-outfit text-[11px] font-black uppercase text-[#0F3329]/70 block">
              {idLabel}
            </span>
            <span className="font-outfit font-black text-lg text-[#0F3329]">
              {idValue}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-outfit font-bold text-[#0F3329] bg-[#FFF8EE] px-3.5 py-1.5 rounded-xl border border-[#0F3329]/20">
            <Clock className="w-4 h-4 text-[#E5A00D]" />
            <span>ESTIMATED TIME: 30-40 MINS</span>
          </div>
        </div>

        {/* DETAILS GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-left">
          {details.map((item, idx) => (
            <div key={idx} className="p-3 bg-white/70 rounded-xl border border-[#0F3329]/15">
              <span className="font-outfit text-[10px] font-black uppercase text-[#0F3329]/60 block">
                {item.label}
              </span>
              <span className="font-outfit font-extrabold text-xs text-[#0F3329] block truncate mt-0.5">
                {item.value}
              </span>
            </div>
          ))}
        </div>

        {/* ADDRESS RECAP */}
        {addressSummary && (
          <div className="text-left p-3.5 rounded-xl bg-white/70 border border-[#0F3329]/15 flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-[#E5A00D] shrink-0 mt-0.5" />
            <div>
              <span className="font-outfit text-[10px] font-black uppercase text-[#0F3329]/60 block">
                DELIVERY ADDRESS
              </span>
              <p className="font-sans text-xs text-[#0F3329]/80 font-medium">
                {addressSummary}
              </p>
            </div>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-[#0F3329]/15">
          <Link
            href={primaryButtonHref}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#0F3329] text-[#f5e3cd] font-outfit font-black text-xs uppercase tracking-wider hover:bg-[#1B4D3E] transition-all flex items-center justify-center gap-2 shadow-md hover:scale-105"
          >
            <span>{primaryButtonText}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href={secondaryButtonHref}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border-2 border-[#0F3329] text-[#0F3329] font-outfit font-bold text-xs uppercase tracking-wider hover:bg-[#0F3329] hover:text-[#f5e3cd] transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>{secondaryButtonText}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
