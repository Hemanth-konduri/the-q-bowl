"use client";

import { useState } from "react";
import { MapPin, CheckCircle2, XCircle } from "lucide-react";

interface Area {
  name: string;
  pincode: string;
  fee: number;
}

const SUPPORTED_AREAS: Area[] = [
  { name: "Gachibowli", pincode: "500032", fee: 0 },
  { name: "Hitec City", pincode: "500081", fee: 0 },
  { name: "Madhapur", pincode: "500081", fee: 0 },
  { name: "Kondapur", pincode: "500084", fee: 0 },
  { name: "Jubilee Hills", pincode: "500033", fee: 29 },
  { name: "Banjara Hills", pincode: "500034", fee: 29 },
  { name: "Financial District", pincode: "500075", fee: 0 },
];

export default function DeliveryChecker() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{ found: boolean; area?: Area } | null>(null);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const trimmed = query.trim().toLowerCase();
    const matched = SUPPORTED_AREAS.find(
      (a) => a.pincode === trimmed || a.name.toLowerCase().includes(trimmed)
    );

    if (matched) {
      setResult({ found: true, area: matched });
    } else {
      setResult({ found: false });
    }
  };

  return (
    <section id="delivery" className="py-24 bg-[#f5e3cd] text-[#1B4D3E] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="gsap-reveal retro-card p-8 sm:p-12 bg-white max-w-4xl mx-auto">
          
          <div className="grid md:grid-cols-12 gap-8 items-center">
            
            {/* Left Header */}
            <div className="md:col-span-6 space-y-3 text-center md:text-left">
              <span className="font-mouse-memoirs text-2xl text-[#E5A00D] uppercase tracking-wider font-bold block">
                INSTANT AREA LOOKUP
              </span>
              <h3 className="font-outfit text-3xl sm:text-4xl font-extrabold text-[#1B4D3E] uppercase leading-none">
                CHECK DELIVERY ELIGIBILITY
              </h3>
              <p className="font-sans text-xs sm:text-sm text-[#1B4D3E]/80 leading-relaxed font-normal">
                We deliver fresh, temperature-controlled meal bowls directly from our cloud kitchen. Enter your pincode or locality below.
              </p>
            </div>

            {/* Input Form & Results */}
            <div className="md:col-span-6">
              <form onSubmit={handleCheck} className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      if (result) setResult(null);
                    }}
                    placeholder="Enter pincode or locality (e.g. 500084, Gachibowli)"
                    className="w-full pl-11 pr-28 py-3.5 rounded-2xl bg-[#FFF8EE] border-2 border-[#1B4D3E] text-[#1B4D3E] font-sans text-sm font-semibold placeholder-[#1B4D3E]/50 focus:outline-none focus:border-[#E5A00D]"
                  />
                  <MapPin className="w-5 h-5 text-[#1B4D3E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 rounded-xl bg-[#1B4D3E] hover:bg-[#E5A00D] hover:text-[#0F3329] text-white font-outfit text-xs uppercase font-bold transition shadow-[2px_2px_0px_#0F3329]"
                  >
                    Check
                  </button>
                </div>
              </form>

              {/* Lookup Result Box */}
              {result && (
                <div className="mt-4 transition-all">
                  {result.found && result.area ? (
                    <div className="p-4 rounded-xl bg-emerald-100 border-2 border-emerald-600 flex items-center gap-3 text-emerald-900 font-sans text-xs">
                      <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                      <div>
                        <span className="font-bold block text-emerald-950 font-outfit text-base">
                          Delivery Available in {result.area.name} ({result.area.pincode})!
                        </span>
                        <span>
                          {result.area.fee === 0 ? "🎉 FREE Doorstep Delivery" : `Standard Delivery Fee: ₹${result.area.fee}`}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-red-100 border-2 border-red-500 flex items-center gap-3 text-red-900 font-sans text-xs">
                      <XCircle className="w-5 h-5 shrink-0 text-red-600" />
                      <div>
                        <span className="font-bold block text-red-950 font-outfit text-base">Out of Current Service Zone</span>
                        <span>We are currently expanding! We hope to serve your location soon.</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quick Area Tags */}
              <div className="mt-6 pt-4 border-t-2 border-[#1B4D3E]/20">
                <span className="font-sans text-xs text-[#1B4D3E]/70 uppercase font-bold block mb-2">
                  Popular Delivery Hubs:
                </span>
                <div className="flex flex-wrap gap-2">
                  {SUPPORTED_AREAS.slice(0, 5).map((a) => (
                    <button
                      key={a.name}
                      onClick={() => {
                        setQuery(a.name);
                        setResult({ found: true, area: a });
                      }}
                      className="px-3 py-1 rounded-full bg-[#FFF8EE] border border-[#1B4D3E] font-sans text-xs font-semibold text-[#1B4D3E] hover:bg-[#1B4D3E] hover:text-white transition"
                    >
                      {a.name} ({a.pincode})
                    </button>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
