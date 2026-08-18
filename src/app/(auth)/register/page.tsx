"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles, User, Phone, Mail, KeyRound, AlertCircle, Star } from "lucide-react";
import biryaniImg from "../../../../public/dum_biryani_hero.png";

type Step = "details" | "otp";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("details");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendOtp() {
    if (!name.trim() || !email.trim()) return setError("Name and email are required");
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error);
    setStep("otp");
  }

  async function verifyOtp() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, name, phone }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error);
    router.push(data.redirect ?? "/");
  }

  return (
    <div className="min-h-screen bg-[#f5e3cd] text-[#0F3329] flex flex-col justify-between relative overflow-hidden selection:bg-[#0F3329] selection:text-white">
      
      {/* Soft Background Light Glow */}
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[550px] h-[550px] bg-[#E5A00D]/20 rounded-full blur-[140px] pointer-events-none" />

      {/* =========================================================
          TOP HEADER BAR
          ========================================================= */}

      <header className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 flex items-center justify-between relative z-30 shrink-0">
        <Link
          href="/"
          className="font-modak text-3xl sm:text-5xl text-[#1B4D3E] text-stroke-small hover:scale-105 transition-transform uppercase tracking-tight"
        >
          Q1 BOWL
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FFF8EE] text-[#0F3329] border-2 border-[#0F3329] font-outfit text-xs sm:text-sm font-bold uppercase tracking-wider hover:bg-[#0F3329] hover:text-[#f5e3cd] transition-all shadow-[3px_3px_0px_#0F3329]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </header>


      {/* =========================================================
          MAIN 2-COLUMN LAYOUT: PERFECT DEAD-CENTER ALIGNMENT
          ========================================================= */}

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 relative z-20 flex-1 flex items-center justify-center my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center justify-center w-full">
          
          {/* LEFT COLUMN: FORM CARD */}
          <div className="lg:col-span-6 xl:col-span-5 w-full max-w-md mx-auto lg:mx-0">
            <div className="p-8 sm:p-10 bg-[#FFF8EE] border-4 border-[#0F3329] rounded-[2.5rem] shadow-[8px_8px_0px_#0F3329] relative overflow-hidden">
              
              {step === "details" ? (
                <div className="space-y-6 relative z-10">
                  <div className="text-left">
                    <span className="font-mouse-memoirs text-2xl text-[#E5A00D] uppercase font-bold tracking-widest inline-flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#E5A00D]" />
                      <span>START YOUR SUBSCRIPTION</span>
                    </span>
                    <h1 className="font-outfit font-black text-3xl sm:text-4xl text-[#0F3329] uppercase tracking-tight leading-none mt-1">
                      CREATE YOUR ACCOUNT
                    </h1>
                    <p className="font-sans text-xs sm:text-sm text-[#0F3329]/70 mt-2 font-medium">
                      Already have an account?{" "}
                      <Link href="/login" className="font-bold text-[#1B4D3E] underline hover:text-[#E5A00D] transition-colors">
                        Sign in here
                      </Link>
                    </p>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-xs font-sans font-bold rounded-2xl px-4 py-3 bg-red-50 border-2 border-red-500 text-red-700 shadow-[2px_2px_0px_#b91c1c]">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="space-y-3.5">
                    {/* Full Name */}
                    <div className="space-y-1">
                      <label className="block font-outfit text-xs font-extrabold uppercase tracking-wider text-[#0F3329]">
                        Full Name <span className="text-red-600">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Your full name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full rounded-2xl px-4 py-3 pl-11 text-sm font-sans font-semibold outline-none border-3 border-[#0F3329] bg-white text-[#0F3329] placeholder-[#0F3329]/40 focus:border-[#E5A00D] transition-all shadow-[3px_3px_0px_#0F3329]"
                        />
                        <User className="w-5 h-5 text-[#0F3329]/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-1">
                      <label className="block font-outfit text-xs font-extrabold uppercase tracking-wider text-[#0F3329]">
                        Phone Number
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full rounded-2xl px-4 py-3 pl-11 text-sm font-sans font-semibold outline-none border-3 border-[#0F3329] bg-white text-[#0F3329] placeholder-[#0F3329]/40 focus:border-[#E5A00D] transition-all shadow-[3px_3px_0px_#0F3329]"
                        />
                        <Phone className="w-5 h-5 text-[#0F3329]/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Email Address */}
                    <div className="space-y-1">
                      <label className="block font-outfit text-xs font-extrabold uppercase tracking-wider text-[#0F3329]">
                        Email Address <span className="text-red-600">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          placeholder="name@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && name && email && sendOtp()}
                          className="w-full rounded-2xl px-4 py-3 pl-11 text-sm font-sans font-semibold outline-none border-3 border-[#0F3329] bg-white text-[#0F3329] placeholder-[#0F3329]/40 focus:border-[#E5A00D] transition-all shadow-[3px_3px_0px_#0F3329]"
                        />
                        <Mail className="w-5 h-5 text-[#0F3329]/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={sendOtp}
                    disabled={loading || !name || !email}
                    className="w-full py-4 rounded-2xl font-outfit text-base font-black uppercase tracking-wider text-[#f5e3cd] bg-[#0F3329] border-2 border-[#0F3329] hover:bg-[#E5A00D] hover:text-[#0F3329] transition-all transform hover:scale-[1.02] active:scale-95 shadow-[4px_4px_0px_#071914] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>{loading ? "Sending code..." : "Continue"}</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-3 my-2">
                    <div className="flex-1 h-0.5 bg-[#0F3329]/20" />
                    <span className="font-outfit text-xs font-bold text-[#0F3329]/60 uppercase tracking-widest">OR</span>
                    <div className="flex-1 h-0.5 bg-[#0F3329]/20" />
                  </div>

                  <a
                    href="/api/auth/google"
                    className="w-full flex items-center justify-center gap-3 rounded-2xl py-3.5 text-sm font-outfit font-extrabold uppercase tracking-wider text-[#0F3329] bg-white border-3 border-[#0F3329] hover:bg-[#f5e3cd] transition-all shadow-[3px_3px_0px_#0F3329]"
                  >
                    <svg width="20" height="20" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                    <span>Continue with Google</span>
                  </a>
                </div>
              ) : (
                <div className="space-y-6 relative z-10">
                  <div className="text-left">
                    <span className="font-mouse-memoirs text-2xl text-[#E5A00D] uppercase font-bold tracking-widest inline-flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-[#E5A00D]" />
                      <span>SECURITY CODE SENT</span>
                    </span>
                    <h1 className="font-outfit font-black text-3xl sm:text-4xl text-[#0F3329] uppercase tracking-tight leading-none mt-1">
                      VERIFY YOUR EMAIL
                    </h1>
                    <p className="font-sans text-xs sm:text-sm text-[#0F3329]/80 mt-2 font-medium">
                      We sent a 6-digit code to <span className="font-bold text-[#0F3329]">{email}</span>
                    </p>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-xs font-sans font-bold rounded-2xl px-4 py-3 bg-red-50 border-2 border-red-500 text-red-700 shadow-[2px_2px_0px_#b91c1c]">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="block font-outfit text-xs font-extrabold uppercase tracking-wider text-[#0F3329] text-center">
                      One-Time Passcode
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="000000"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      onKeyDown={(e) => e.key === "Enter" && otp.length === 6 && verifyOtp()}
                      maxLength={6}
                      className="w-full rounded-2xl px-4 py-3.5 text-2xl font-mono font-bold outline-none border-3 border-[#0F3329] bg-white text-[#0F3329] text-center tracking-[0.4em] placeholder-[#0F3329]/30 focus:border-[#E5A00D] transition-all shadow-[3px_3px_0px_#0F3329]"
                    />
                  </div>

                  <button
                    onClick={verifyOtp}
                    disabled={loading || otp.length !== 6}
                    className="w-full py-4 rounded-2xl font-outfit text-base font-black uppercase tracking-wider text-[#f5e3cd] bg-[#0F3329] border-2 border-[#0F3329] hover:bg-[#E5A00D] hover:text-[#0F3329] transition-all transform hover:scale-[1.02] active:scale-95 shadow-[4px_4px_0px_#071914] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>{loading ? "Creating Account..." : "Create Account"}</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => { setStep("details"); setOtp(""); setError(""); }}
                    className="w-full text-left font-outfit text-xs font-extrabold uppercase tracking-wider text-[#0F3329]/70 hover:text-[#0F3329] transition-colors"
                  >
                    ← Edit Details
                  </button>
                </div>
              )}

            </div>
          </div>

          {/* RIGHT COLUMN: PERFECT DEAD-CENTER BIRYANI DISH & FLOATING STICKERS */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col items-center justify-center relative my-auto">
            
            {/* DISH & FLOATING STICKER CONTAINER */}
            <div className="relative w-full max-w-[480px] sm:max-w-[520px] aspect-square flex items-center justify-center">
              
              {/* SOFT LIGHT ORANGE GLOW (NO CUTOFF LINES) */}
              <div className="w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] bg-[#E5A00D]/30 rounded-full blur-[100px] absolute inset-0 m-auto pointer-events-none" />

              {/* HERO BIRYANI DISH IMAGE */}
              <Image
                src={biryaniImg}
                alt="Q1 Bowl Artisan Dum Biryani"
                priority
                className="w-[92%] h-[92%] object-contain drop-shadow-[0_25px_45px_rgba(229,160,13,0.4)] relative z-10 transform hover:scale-105 transition-transform duration-500"
              />

              {/* -------------------------
                  FLOATING STICKERS (BALANCED AROUND DISH)
              -------------------------- */}

              {/* TOP LEFT STICKER: SMASHED FRESH */}
              <div className="absolute top-[2%] left-[-4%] sm:left-[-6%] z-20 animate-float-slow pointer-events-none">
                <span className="font-modak text-4xl sm:text-5xl lg:text-6xl text-[#E5A00D] text-stroke-small uppercase leading-none block rotate-[-12deg] drop-shadow-xl">
                  SMASHED<br />FRESH
                </span>
              </div>

              {/* TOP RIGHT STICKER: BOLD FLAVOR */}
              <div className="absolute top-[6%] right-[-4%] sm:right-[-6%] z-20 animate-float-reverse pointer-events-none">
                <span className="font-modak text-4xl sm:text-5xl lg:text-6xl text-[#E5A00D] text-stroke-small uppercase leading-none block rotate-[12deg] drop-shadow-xl">
                  BOLD<br />FLAVOR
                </span>
              </div>

              {/* BOTTOM FLOATING BADGE */}
              <div className="absolute -bottom-4 z-20 animate-float-slow pointer-events-none">
                <div className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#0F3329] text-[#E5A00D] border-3 border-[#E5A00D] shadow-[5px_5px_0px_#071914] font-outfit text-xs sm:text-sm font-black uppercase tracking-wider">
                  <Star className="w-4 h-4 fill-[#E5A00D]" />
                  <span>FRESH DAILY SUBSCRIPTION</span>
                </div>
              </div>

            </div>

          </div>

        </div>
      </main>

      {/* Footer Padding Spacing for Perfect Visual Alignment */}
      <footer className="w-full py-4 text-center shrink-0">
        <span className="font-sans text-xs text-[#0F3329]/50 font-medium">
          © 2026 Q1 BOWL • ALL RIGHTS RESERVED
        </span>
      </footer>

    </div>
  );
}
