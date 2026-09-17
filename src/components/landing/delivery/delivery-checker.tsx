"use client";

import { useState, useEffect } from "react";
import { MapPin, CheckCircle2, XCircle, Navigation, Loader2, Info } from "lucide-react";

interface Locality {
  name: string;
  pincode: string;
  distanceKm: number;
  fee: number;
  tag?: string;
}

const DEFAULT_LOCALITIES: Locality[] = [
  { name: "Bridge County Hub", pincode: "533296", distanceKm: 0.2, fee: 0, tag: "Campus Hub" },
  { name: "Rajanagaram", pincode: "533294", distanceKm: 2.5, fee: 0, tag: "Primary Zone" },
  { name: "Velugubanda", pincode: "533296", distanceKm: 1.0, fee: 0, tag: "Primary Zone" },
  { name: "GIET Campus", pincode: "533296", distanceKm: 3.2, fee: 0, tag: "Fast Track" },
  { name: "Diwancheruvu", pincode: "533296", distanceKm: 4.8, fee: 0, tag: "Fast Track" },
  { name: "Lalacheruvu", pincode: "533106", distanceKm: 8.5, fee: 20, tag: "Rajahmundry City" },
  { name: "Danavaipeta", pincode: "533103", distanceKm: 12.0, fee: 29, tag: "Rajahmundry City" },
  { name: "Morampudi", pincode: "533107", distanceKm: 11.5, fee: 29, tag: "Rajahmundry City" },
  { name: "Kotipalli Main Road", pincode: "533101", distanceKm: 13.5, fee: 29, tag: "Rajahmundry Hub" },
  { name: "Prakash Nagar", pincode: "533103", distanceKm: 12.8, fee: 29, tag: "Rajahmundry Hub" },
  { name: "Dowleswaram Barrage", pincode: "533125", distanceKm: 16.0, fee: 39, tag: "Extended Zone" },
];

export default function DeliveryChecker() {
  const [query, setQuery] = useState("");
  const [hubs, setHubs] = useState<Locality[]>(DEFAULT_LOCALITIES);
  const [allowedRadiusKm, setAllowedRadiusKm] = useState<number>(20.0);
  const [kitchenName, setKitchenName] = useState<string>("The Q Bowl Cloud Kitchen, Rajanagaram Hub");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{
    eligible: boolean;
    area?: Locality;
    distanceKm?: number;
    fee?: number;
    message?: string;
  } | null>(null);

  // Fetch live delivery zone configuration from backend
  useEffect(() => {
    async function loadZoneConfig() {
      try {
        const res = await fetch("/api/delivery/check-eligibility");
        if (res.ok) {
          const data = await res.json();
          if (data.supportedAreas && Array.isArray(data.supportedAreas)) {
            setHubs(data.supportedAreas);
          }
          if (data.allowedRadiusKm) {
            setAllowedRadiusKm(data.allowedRadiusKm);
          }
          if (data.kitchenName) {
            setKitchenName(data.kitchenName);
          }
        }
      } catch (err) {
        console.error("Failed to load delivery zone config:", err);
      }
    }
    loadZoneConfig();
  }, []);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setChecking(true);
    try {
      const res = await fetch("/api/delivery/check-eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.eligible) {
          setResult({
            eligible: true,
            area: data.area,
            distanceKm: data.distanceKm,
            fee: data.deliveryFee,
          });
        } else {
          setResult({
            eligible: false,
            message: data.message || `Out of ${allowedRadiusKm}km delivery radius from our Rajanagaram Cloud Kitchen.`,
          });
        }
      } else {
        setResult({
          eligible: false,
          message: `Location not currently within our active ${allowedRadiusKm}km delivery zone.`,
        });
      }
    } catch {
      // Offline fallback
      const search = query.trim().toLowerCase();
      const matched = hubs.find(
        (h) => h.pincode === search || h.name.toLowerCase().includes(search)
      );
      if (matched && matched.distanceKm <= allowedRadiusKm) {
        setResult({
          eligible: true,
          area: matched,
          distanceKm: matched.distanceKm,
          fee: matched.fee,
        });
      } else {
        setResult({
          eligible: false,
          message: `Location not found within our active ${allowedRadiusKm}km Rajanagaram delivery zone.`,
        });
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <section id="delivery" className="py-20 sm:py-24 bg-[#f5e3cd] text-black relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="gsap-reveal retro-card p-5 sm:p-10 md:p-12 bg-white max-w-4xl mx-auto shadow-[5px_5px_0_#000]">
          
          <div className="grid md:grid-cols-12 gap-6 md:gap-8 items-center">
            
            {/* Left Header */}
            <div className="md:col-span-6 space-y-2.5 sm:space-y-3 text-center md:text-left">
              <span className="font-mouse-memoirs text-xl sm:text-2xl text-[#E5A00D] uppercase tracking-wider font-bold block">
                INSTANT AREA LOOKUP
              </span>
              <h3 className="font-outfit text-2xl sm:text-4xl font-extrabold text-black uppercase leading-tight">
                CHECK DELIVERY ELIGIBILITY
              </h3>
              <p className="font-sans text-xs sm:text-sm text-black/80 leading-relaxed font-normal">
                Dispatched piping hot directly from our Cloud Kitchen at <strong>Bridge County, Rajanagaram</strong>. Servicing Rajamahendravaram &amp; surrounding areas within a <strong>{allowedRadiusKm} km</strong> radius.
              </p>
              
              <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF8EE] border border-black text-[11px] font-bold text-black/80">
                <Navigation className="w-3.5 h-3.5 text-[#E5A00D]" />
                <span>Base Hub: Rajanagaram, Velugubanda (533296)</span>
              </div>
            </div>

            {/* Input Form & Results */}
            <div className="md:col-span-6">
              <form onSubmit={handleCheck} className="space-y-3 sm:space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      if (result) setResult(null);
                    }}
                    placeholder="Enter Rajahmundry area or pincode (e.g. 533296 or Danavaipeta)"
                    className="w-full pl-9 sm:pl-11 pr-24 sm:pr-28 py-3 sm:py-3.5 rounded-2xl bg-[#FFF8EE] border-2 border-black text-black font-sans text-xs sm:text-sm font-semibold placeholder-black/50 focus:outline-none focus:border-[#E5A00D] shadow-[2px_2px_0px_#000]"
                  />
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-black absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2" />
                  <button
                    type="submit"
                    disabled={checking}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3.5 py-1.5 sm:px-5 sm:py-2 rounded-xl bg-black hover:bg-[#E5A00D] hover:text-black text-white font-outfit text-[11px] sm:text-xs uppercase font-bold transition shadow-[2px_2px_0px_#000000] flex items-center gap-1.5"
                  >
                    {checking ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <span>Check</span>
                    )}
                  </button>
                </div>
              </form>

              {/* Lookup Result Box */}
              {result && (
                <div className="mt-4 transition-all">
                  {result.eligible ? (
                    <div className="p-4 rounded-xl bg-[#FFF8EE] border-2 border-black flex items-start gap-3 text-black font-sans text-xs shadow-[3px_3px_0px_#000]">
                      <CheckCircle2 className="w-5 h-5 shrink-0 text-black mt-0.5" />
                      <div>
                        <span className="font-bold block text-black font-outfit text-base">
                          ✓ Delivery Available in {result.area?.name || query} ({result.area?.pincode || "Rajahmundry Zone"})!
                        </span>
                        <p className="text-black/80 mt-1 font-medium">
                          {result.fee === 0 ? "🎉 FREE Doorstep Delivery" : `Standard Delivery: ₹${result.fee}`} • Est. Distance: {result.distanceKm ? `~${result.distanceKm} km` : `< ${allowedRadiusKm} km`} from kitchen.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-amber-50 border-2 border-black flex items-start gap-3 text-black font-sans text-xs shadow-[3px_3px_0px_#000]">
                      <XCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                      <div>
                        <span className="font-bold block text-black font-outfit text-base">Outside Kitchen Delivery Range</span>
                        <p className="text-black/80 mt-1">
                          {result.message || `We only deliver within ${allowedRadiusKm} km from our Rajanagaram / Rajamahendravaram Cloud Kitchen.`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quick Area Tags */}
              <div className="mt-5 pt-4 border-t-2 border-black/20">
                <span className="font-sans text-xs text-black/80 uppercase font-bold block mb-2">
                  Popular Rajamahendravaram Delivery Hubs:
                </span>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {hubs.slice(0, 6).map((a) => (
                    <button
                      key={a.name}
                      type="button"
                      onClick={() => {
                        setQuery(a.name);
                        setResult({
                          eligible: true,
                          area: a,
                          distanceKm: a.distanceKm,
                          fee: a.fee,
                        });
                      }}
                      className="px-2.5 sm:px-3 py-1 rounded-full bg-[#FFF8EE] border border-black font-sans text-[11px] sm:text-xs font-semibold text-black hover:bg-black hover:text-white transition shadow-[1px_1px_0px_#000] active:scale-95"
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
