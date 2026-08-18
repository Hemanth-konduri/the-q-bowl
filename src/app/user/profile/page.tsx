"use client";

import { useState } from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  Flame,
  CheckCircle2,
  Bell,
  Utensils,
  Save,
} from "lucide-react";

export default function UserProfilePage() {
  const [name, setName] = useState("Hemanth Konduri");
  const [email, setEmail] = useState("hemanth@example.com");
  const [phone, setPhone] = useState("+91 98765 43210");
  
  // Dietary Preferences
  const [foodPreference, setFoodPreference] = useState<"NON_VEG" | "VEG" | "KETO">("NON_VEG");
  const [spiceLevel, setSpiceLevel] = useState<"MILD" | "MEDIUM" | "SPICY">("SPICY");
  const [notes, setNotes] = useState("Extra Salan with Biryani orders. No peanuts.");
  
  // Notification Toggles
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [whatsappTracking, setWhatsappTracking] = useState(true);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      
      {/* =========================================================
          PAGE HEADER
          ========================================================= */}

      <div className="p-8 sm:p-10 bg-[#FFF8EE] border-4 border-[#0F3329] rounded-[2.5rem] shadow-[8px_8px_0px_#0F3329] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <span className="font-mouse-memoirs text-2xl text-[#E5A00D] uppercase font-bold tracking-widest block">
            MEMBER PROFILE &amp; DIETARY PREFERENCES
          </span>
          <h1 className="font-outfit font-black text-3xl sm:text-5xl text-[#0F3329] uppercase tracking-tight leading-none mt-1">
            MY ACCOUNT PROFILE
          </h1>
          <p className="font-sans text-sm sm:text-base text-[#0F3329]/80 font-medium mt-2">
            Customize your kitchen taste profile, allergen notes, and daily dispatch notification preferences.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-6 py-3.5 rounded-2xl bg-[#0F3329] text-[#f5e3cd] border-2 border-[#0F3329] font-outfit text-xs sm:text-sm font-black uppercase tracking-wider hover:bg-[#E5A00D] hover:text-[#0F3329] transition-all shadow-[4px_4px_0px_#071914] flex items-center gap-2 shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>{savedSuccess ? "Saved!" : "Save Profile"}</span>
        </button>
      </div>


      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-100 border-2 border-emerald-600 text-emerald-900 font-sans font-bold text-sm flex items-center gap-2 shadow-[4px_4px_0px_#059669]">
          <CheckCircle2 className="w-5 h-5 text-emerald-700" />
          <span>Your profile preferences have been successfully updated in our cloud kitchen database!</span>
        </div>
      )}


      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left 6 Cols: Personal Details */}
        <div className="lg:col-span-6 space-y-8">
          
          <div className="p-8 bg-[#FFF8EE] border-4 border-[#0F3329] rounded-[2.5rem] shadow-[6px_6px_0px_#0F3329] space-y-6">
            <div className="border-b-2 border-[#0F3329]/15 pb-4">
              <span className="font-mouse-memoirs text-xl text-[#E5A00D] uppercase font-bold tracking-widest block">
                PERSONAL DETAILS
              </span>
              <h2 className="font-outfit font-black text-2xl text-[#0F3329] uppercase">
                MEMBER DATA
              </h2>
            </div>

            <div className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="block font-outfit text-xs font-extrabold uppercase tracking-wider text-[#0F3329]">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-2xl px-4 py-3 pl-11 text-sm font-sans font-semibold outline-none border-3 border-[#0F3329] bg-white text-[#0F3329]"
                  />
                  <User className="w-5 h-5 text-[#0F3329]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="block font-outfit text-xs font-extrabold uppercase tracking-wider text-[#0F3329]">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl px-4 py-3 pl-11 text-sm font-sans font-semibold outline-none border-3 border-[#0F3329] bg-white text-[#0F3329]"
                  />
                  <Mail className="w-5 h-5 text-[#0F3329]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block font-outfit text-xs font-extrabold uppercase tracking-wider text-[#0F3329]">
                    Phone Number
                  </label>
                  <span className="font-sans text-xs font-bold text-emerald-800 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Verified SMS OTP
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-2xl px-4 py-3 pl-11 text-sm font-sans font-semibold outline-none border-3 border-[#0F3329] bg-white text-[#0F3329]"
                  />
                  <Phone className="w-5 h-5 text-[#0F3329]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

          </div>

          {/* DISPATCH NOTIFICATIONS CARD */}
          <div className="p-8 bg-[#FFF8EE] border-4 border-[#0F3329] rounded-[2.5rem] shadow-[6px_6px_0px_#0F3329] space-y-4">
            <div className="border-b-2 border-[#0F3329]/15 pb-4">
              <span className="font-mouse-memoirs text-xl text-[#E5A00D] uppercase font-bold tracking-widest block">
                COMMUNICATION ALERTS
              </span>
              <h2 className="font-outfit font-black text-2xl text-[#0F3329] uppercase">
                DISPATCH NOTIFICATIONS
              </h2>
            </div>

            <div className="space-y-3 font-outfit text-xs font-bold uppercase text-[#0F3329]">
              
              <div className="p-3.5 rounded-2xl bg-[#f5e3cd] border-2 border-[#0F3329] flex items-center justify-between">
                <div>
                  <span className="block">Daily Meal Dispatch SMS</span>
                  <span className="font-sans text-[11px] font-semibold text-[#0F3329]/70 lowercase">
                    Get SMS alerts when your rider picks up lunch/dinner
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={smsAlerts}
                  onChange={() => setSmsAlerts(!smsAlerts)}
                  className="w-5 h-5 accent-[#0F3329]"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-[#f5e3cd] border-2 border-[#0F3329] flex items-center justify-between">
                <div>
                  <span className="block">WhatsApp Live Order Tracking</span>
                  <span className="font-sans text-[11px] font-semibold text-[#0F3329]/70 lowercase">
                    Receive live rider location map links on WhatsApp
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={whatsappTracking}
                  onChange={() => setWhatsappTracking(!whatsappTracking)}
                  className="w-5 h-5 accent-[#0F3329]"
                />
              </div>

            </div>
          </div>

        </div>

        {/* Right 6 Cols: Dietary Preferences */}
        <div className="lg:col-span-6 space-y-8">
          
          <div className="p-8 bg-[#FFF8EE] border-4 border-[#0F3329] rounded-[2.5rem] shadow-[6px_6px_0px_#0F3329] space-y-6">
            <div className="border-b-2 border-[#0F3329]/15 pb-4">
              <span className="font-mouse-memoirs text-xl text-[#E5A00D] uppercase font-bold tracking-widest block">
                KITCHEN TASTE PROFILE
              </span>
              <h2 className="font-outfit font-black text-2xl text-[#0F3329] uppercase">
                DIETARY PREFERENCES
              </h2>
            </div>

            <div className="space-y-5">
              
              {/* Food Choice Selection */}
              <div className="space-y-2">
                <label className="block font-outfit text-xs font-extrabold uppercase tracking-wider text-[#0F3329]">
                  Primary Meal Preference
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setFoodPreference("NON_VEG")}
                    className={`p-3 rounded-2xl font-outfit text-xs font-black uppercase border-3 transition-all ${
                      foodPreference === "NON_VEG"
                        ? "bg-[#0F3329] text-[#E5A00D] border-[#0F3329] shadow-[3px_3px_0px_#071914]"
                        : "bg-[#f5e3cd] text-[#0F3329] border-[#0F3329]/30"
                    }`}
                  >
                    Non-Veg
                  </button>
                  <button
                    type="button"
                    onClick={() => setFoodPreference("VEG")}
                    className={`p-3 rounded-2xl font-outfit text-xs font-black uppercase border-3 transition-all ${
                      foodPreference === "VEG"
                        ? "bg-[#0F3329] text-[#E5A00D] border-[#0F3329] shadow-[3px_3px_0px_#071914]"
                        : "bg-[#f5e3cd] text-[#0F3329] border-[#0F3329]/30"
                    }`}
                  >
                    Pure Veg
                  </button>
                  <button
                    type="button"
                    onClick={() => setFoodPreference("KETO")}
                    className={`p-3 rounded-2xl font-outfit text-xs font-black uppercase border-3 transition-all ${
                      foodPreference === "KETO"
                        ? "bg-[#0F3329] text-[#E5A00D] border-[#0F3329] shadow-[3px_3px_0px_#071914]"
                        : "bg-[#f5e3cd] text-[#0F3329] border-[#0F3329]/30"
                    }`}
                  >
                    Keto / Protein
                  </button>
                </div>
              </div>

              {/* Spice Level Selection */}
              <div className="space-y-2">
                <label className="block font-outfit text-xs font-extrabold uppercase tracking-wider text-[#0F3329]">
                  Spice Intensity Preference
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(["MILD", "MEDIUM", "SPICY"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSpiceLevel(lvl)}
                      className={`p-3 rounded-2xl font-outfit text-xs font-black uppercase border-3 transition-all ${
                        spiceLevel === lvl
                          ? "bg-[#E5A00D] text-[#0F3329] border-[#0F3329] shadow-[3px_3px_0px_#0F3329]"
                          : "bg-[#f5e3cd] text-[#0F3329] border-[#0F3329]/30"
                      }`}
                    >
                      {lvl === "SPICY" ? "🌶️ Spicy" : lvl === "MEDIUM" ? "🌶️ Medium" : "🍃 Mild"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Special Instructions & Allergies */}
              <div className="space-y-2">
                <label className="block font-outfit text-xs font-extrabold uppercase tracking-wider text-[#0F3329]">
                  Allergen Warnings &amp; Kitchen Notes
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Less oil, extra gravy, allergy to peanuts..."
                  className="w-full rounded-2xl px-4 py-3 text-sm font-sans font-semibold outline-none border-3 border-[#0F3329] bg-white text-[#0F3329]"
                />
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
