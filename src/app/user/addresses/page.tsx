"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  MapPin,
  Home,
  Briefcase,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Sparkles,
  Phone,
  User as UserIcon,
  Navigation,
  Check,
  X,
  Edit2,
} from "lucide-react";
import gsap from "gsap";

// Import LocationPicker dynamically without SSR for Leaflet compatibility
const LocationPicker = dynamic(() => import("@/components/location-picker"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 rounded-[10px] bg-black/10 border-2 border-black/15 flex items-center justify-center font-outfit text-xs font-bold uppercase text-black">
      Loading interactive delivery map...
    </div>
  ),
});

type Address = {
  id: string;
  label: string;
  address: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number | null;
  longitude?: number | null;
  isDefault: boolean;
  recipientName?: string;
  recipientPhone?: string;
};

// Cloud Kitchen Hub Coordinates & Delivery Radius Config
const KITCHEN_LAT = 17.4399;
const KITCHEN_LNG = 78.3847;
const MAX_DELIVERY_RADIUS_KM = 7.5;

// Haversine Distance Formula (km)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export default function UserAddressesPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [blockingModalAddress, setBlockingModalAddress] = useState<Address | null>(null);

  // Form State
  const [label, setLabel] = useState<"Home" | "Work" | "Other">("Home");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [flatNo, setFlatNo] = useState("");
  const [street, setStreet] = useState("");
  const [landmark, setLandmark] = useState("");
  const [area, setArea] = useState("");
  const [city, setCity] = useState("Hyderabad");
  const [state, setState] = useState("Telangana");
  const [pincode, setPincode] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  // Map Coordinates & Radius State
  const [pinnedLat, setPinnedLat] = useState<number | null>(KITCHEN_LAT);
  const [pinnedLng, setPinnedLng] = useState<number | null>(KITCHEN_LNG);
  const [resolvedMapAddress, setResolvedMapAddress] = useState("");
  const [distanceKm, setDistanceKm] = useState<number | null>(0);
  const [isWithinRadius, setIsWithinRadius] = useState<boolean>(true);

  async function fetchAddresses() {
    try {
      const res = await fetch("/api/user/addresses");
      if (!res.ok) throw new Error("Failed to load address book");
      const json = await res.json();
      setAddresses(json.addresses || []);
    } catch (err: any) {
      console.error("Addresses load error:", err);
      setError(err.message || "Failed to load addresses");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAddresses();
  }, []);

  // GSAP Entrance Animations
  useEffect(() => {
    if (!loading && containerRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          ".gsap-addr-fade",
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power2.out" }
        );
      }, containerRef);

      return () => ctx.revert();
    }
  }, [loading]);

  // Handle Location Selection from Leaflet Map Pin
  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    setPinnedLat(lat);
    setPinnedLng(lng);
    setResolvedMapAddress(address);

    // Calculate distance from cloud kitchen hub
    const dist = calculateDistance(KITCHEN_LAT, KITCHEN_LNG, lat, lng);
    setDistanceKm(dist);
    setIsWithinRadius(dist <= MAX_DELIVERY_RADIUS_KM);
  };

  async function setDefault(id: string) {
    try {
      const res = await fetch("/api/user/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SET_DEFAULT", addressId: id }),
      });
      if (res.ok) {
        await fetchAddresses();
      }
    } catch (err) {
      console.error("Failed to set default address:", err);
    }
  }

  async function deleteAddress(id: string) {
    try {
      const res = await fetch("/api/user/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DELETE", addressId: id }),
      });
      if (res.ok) {
        await fetchAddresses();
      }
    } catch (err) {
      console.error("Failed to delete address:", err);
    }
  }

  async function handleSaveAddress() {
    const fullStreetAddress = flatNo ? `${flatNo}, ${street}` : street;
    if (!fullStreetAddress.trim() || !area.trim() || !pincode.trim() || saving || !isWithinRadius) return;

    setSaving(true);
    try {
      const res = await fetch("/api/user/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          address: fullStreetAddress,
          area,
          city,
          state,
          pincode,
          latitude: pinnedLat,
          longitude: pinnedLng,
          isDefault,
        }),
      });

      if (res.ok) {
        // Reset form
        setFlatNo("");
        setStreet("");
        setLandmark("");
        setArea("");
        setPincode("");
        setFullName("");
        setPhone("");
        setShowAddForm(false);
        setBlockingModalAddress(null);
        await fetchAddresses();
      }
    } catch (err) {
      console.error("Failed to save address:", err);
    } finally {
      setSaving(false);
    }
  }

  // Form Validation Rule
  const isPhoneValid = phone.trim().length === 0 || phone.trim().length >= 10;
  const isFormValid =
    street.trim().length > 0 &&
    area.trim().length > 0 &&
    pincode.trim().length >= 6 &&
    isPhoneValid &&
    pinnedLat !== null &&
    pinnedLng !== null &&
    isWithinRadius;

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4 max-w-md mx-auto">
        <div className="w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="font-outfit text-xs font-bold uppercase tracking-wider text-black">
          Loading saved address locations...
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-6 pb-16 max-w-6xl mx-auto">
      
      {/* =========================================================
          1. HEADER
          ========================================================= */}
      <div className="gsap-addr-fade p-6 sm:p-8 bg-[#FFF8EE] border-2 border-black/15 rounded-[12px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1 max-w-xl">
          <span className="px-3 py-1 rounded-[6px] bg-[#E5A00D] text-black font-outfit text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>DISPATCH ADDRESS BOOK</span>
          </span>
          <h1 className="font-outfit font-black text-3xl sm:text-5xl text-black uppercase tracking-tight leading-none">
            Delivery Addresses
          </h1>
          <p className="font-sans text-xs sm:text-sm text-black/70 font-medium">
            Manage your delivery locations and choose where your meals should arrive.
          </p>
        </div>

        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            if (!showAddForm) {
              setTimeout(() => {
                formRef.current?.scrollIntoView({ behavior: "smooth" });
              }, 100);
            }
          }}
          className="px-6 py-3.5 rounded-[10px] bg-black text-[#f5e3cd] font-outfit text-xs sm:text-sm font-extrabold uppercase tracking-wider hover:bg-[#E5A00D] hover:text-black transition-all flex items-center gap-2 shrink-0 shadow-[2px_2px_0px_#000]"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? "Close Form" : "+ Add New Address"}</span>
        </button>
      </div>


      {/* =========================================================
          2. SAVED ADDRESSES GRID
          ========================================================= */}
      {error && (
        <div className="p-4 rounded-[10px] bg-red-50 border border-red-300 text-red-800 text-xs font-sans">
          {error}
        </div>
      )}

      {addresses.length > 0 ? (
        <div className="gsap-addr-fade grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((addr) => {
            const hasLocationPin = addr.latitude !== null && addr.longitude !== null;
            return (
              <div
                key={addr.id}
                className={`p-6 sm:p-7 bg-[#FFF8EE] rounded-[12px] space-y-4 flex flex-col justify-between transition-all duration-300 ${
                  addr.isDefault
                    ? "border-2 border-black ring-2 ring-[#E5A00D] shadow-[4px_4px_0px_#000000]"
                    : "border-2 border-black/15 hover:border-black/40 hover:scale-[1.01]"
                }`}
              >
                <div className="space-y-3">
                  {/* Tag & Default Badge */}
                  <div className="flex items-center justify-between border-b-2 border-black/15 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-[8px] bg-black text-[#E5A00D]">
                        {addr.label === "Work" ? (
                          <Briefcase className="w-4 h-4" />
                        ) : (
                          <Home className="w-4 h-4" />
                        )}
                      </div>
                      <span className="font-outfit text-base font-black text-black uppercase">
                        {addr.label} ADDRESS
                      </span>
                    </div>

                    {addr.isDefault ? (
                      <span className="px-3 py-1 rounded-[6px] bg-black text-[#E5A00D] font-outfit text-xs font-black uppercase tracking-wider">
                        DEFAULT LOCATION
                      </span>
                    ) : (
                      <button
                        onClick={() => setDefault(addr.id)}
                        className="font-outfit text-xs font-bold uppercase text-black underline hover:text-[#E5A00D]"
                      >
                        Set as Default
                      </button>
                    )}
                  </div>

                  {/* Recipient Details */}
                  <div className="space-y-1">
                    <p className="font-outfit font-extrabold text-sm text-black uppercase">
                      {addr.recipientName || "Registered Customer"}
                    </p>
                    {addr.recipientPhone && (
                      <p className="font-sans text-xs text-black/70 flex items-center gap-1 font-semibold">
                        <Phone className="w-3.5 h-3.5 text-black" />
                        <span>{addr.recipientPhone}</span>
                      </p>
                    )}
                  </div>

                  {/* Address Body */}
                  <div className="p-4 rounded-[10px] bg-[#f5e3cd]/60 border border-black/15 space-y-1">
                    <p className="font-sans text-xs font-bold text-black leading-relaxed">
                      {addr.address}
                    </p>
                    <p className="font-sans text-xs font-semibold text-black/70">
                      {addr.area}, {addr.city} - {addr.pincode}
                    </p>
                  </div>
                </div>

                {/* Footer Controls & Pinned Pin Status */}
                <div className="flex items-center justify-between pt-3 border-t border-black/15 text-xs font-outfit font-extrabold uppercase">
                  {hasLocationPin ? (
                    <span className="text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>Pin Verified ({addr.latitude?.toFixed(4)}, {addr.longitude?.toFixed(4)})</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        setBlockingModalAddress(addr);
                        setShowAddForm(true);
                      }}
                      className="text-amber-900 bg-amber-100 border border-amber-400 px-2.5 py-0.5 rounded-[6px] flex items-center gap-1"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                      <span>Location Pin Missing!</span>
                    </button>
                  )}

                  {!addr.isDefault && (
                    <button
                      onClick={() => deleteAddress(addr.id)}
                      className="text-red-700 hover:text-red-900 flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="gsap-addr-fade p-12 bg-[#FFF8EE] border-2 border-black/15 rounded-[12px] text-center space-y-4 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-[12px] bg-black p-3 mx-auto text-[#E5A00D] flex items-center justify-center">
            <MapPin className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-outfit font-black text-2xl text-black uppercase tracking-tight">
              No Saved Addresses Found
            </h3>
            <p className="font-sans text-xs text-black/70 font-medium max-w-md mx-auto">
              Add your primary delivery address so our cloud kitchen can dispatch your daily meal orders.
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-7 py-3 rounded-[10px] bg-black text-[#f5e3cd] font-outfit text-xs font-black uppercase tracking-wider hover:bg-[#E5A00D] hover:text-black transition-colors shadow-[2px_2px_0px_#000]"
          >
            + Add First Address
          </button>
        </div>
      )}


      {/* =========================================================
          3, 4, 5 & 6. ADD NEW ADDRESS FORM & INTERACTIVE MAP PINNER
          ========================================================= */}
      {showAddForm && (
        <div
          ref={formRef}
          className="gsap-addr-fade p-6 sm:p-8 bg-[#FFF8EE] border-2 border-black rounded-[12px] space-y-6 animate-in slide-in-from-top duration-300"
        >
          <div className="border-b-2 border-black/15 pb-4 flex items-center justify-between">
            <div>
              <span className="font-outfit text-[11px] font-black uppercase text-black bg-[#E5A00D] px-2.5 py-0.5 rounded-[6px] tracking-wider inline-block mb-1">
                NEW DISPATCH LOCATION
              </span>
              <h2 className="font-outfit font-black text-2xl sm:text-3xl text-black uppercase tracking-tight">
                Add New Delivery Address
              </h2>
            </div>
            <button
              onClick={() => setShowAddForm(false)}
              className="p-2 rounded-[8px] bg-black text-white hover:bg-[#E5A00D] hover:text-black transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 2-Column Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tag selector */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block font-outfit text-xs font-extrabold uppercase tracking-wider text-black">
                Address Tag
              </label>
              <div className="flex gap-3">
                {(["Home", "Work", "Other"] as const).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setLabel(tag)}
                    className={`px-4 py-2 rounded-[8px] font-outfit text-xs font-bold uppercase border-2 transition-all ${
                      label === tag
                        ? "bg-black text-[#E5A00D] border-black shadow-[2px_2px_0px_#000]"
                        : "bg-white text-black border-black/20 hover:border-black"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient Full Name */}
            <div className="space-y-1">
              <label className="block font-outfit text-xs font-extrabold uppercase tracking-wider text-black">
                Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Hemanth Konduri"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-[10px] px-4 py-2.5 text-xs font-sans font-semibold outline-none border-2 border-black/20 bg-white text-black focus:border-black transition-colors"
              />
            </div>

            {/* Recipient Phone */}
            <div className="space-y-1">
              <label className="block font-outfit text-xs font-extrabold uppercase tracking-wider text-black">
                Phone Number
              </label>
              <input
                type="text"
                placeholder="e.g. +91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-[10px] px-4 py-2.5 text-xs font-sans font-semibold outline-none border-2 border-black/20 bg-white text-black focus:border-black transition-colors"
              />
            </div>

            {/* House / Flat No. */}
            <div className="space-y-1">
              <label className="block font-outfit text-xs font-extrabold uppercase tracking-wider text-black">
                House / Flat No. / Building
              </label>
              <input
                type="text"
                placeholder="e.g. Flat 402, Golden Heights"
                value={flatNo}
                onChange={(e) => setFlatNo(e.target.value)}
                className="w-full rounded-[10px] px-4 py-2.5 text-xs font-sans font-semibold outline-none border-2 border-black/20 bg-white text-black focus:border-black transition-colors"
              />
            </div>

            {/* Street */}
            <div className="space-y-1">
              <label className="block font-outfit text-xs font-extrabold uppercase tracking-wider text-black">
                Street / Road
              </label>
              <input
                type="text"
                placeholder="e.g. Road No. 12, Jubilee Hills"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="w-full rounded-[10px] px-4 py-2.5 text-xs font-sans font-semibold outline-none border-2 border-black/20 bg-white text-black focus:border-black transition-colors"
              />
            </div>

            {/* Area / Locality */}
            <div className="space-y-1">
              <label className="block font-outfit text-xs font-extrabold uppercase tracking-wider text-black">
                Area / Locality
              </label>
              <input
                type="text"
                placeholder="e.g. Jubilee Hills"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full rounded-[10px] px-4 py-2.5 text-xs font-sans font-semibold outline-none border-2 border-black/20 bg-white text-black focus:border-black transition-colors"
              />
            </div>

            {/* Pincode */}
            <div className="space-y-1">
              <label className="block font-outfit text-xs font-extrabold uppercase tracking-wider text-black">
                Pincode
              </label>
              <input
                type="text"
                placeholder="e.g. 500033"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-full rounded-[10px] px-4 py-2.5 text-xs font-sans font-semibold outline-none border-2 border-black/20 bg-white text-black focus:border-black transition-colors"
              />
            </div>
          </div>


          {/* 4. PIN EXACT LOCATION (INTERACTIVE MAP) */}
          <div className="space-y-3 pt-3 border-t-2 border-black/15">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-outfit text-xs font-black uppercase text-black block">
                  PIN EXACT DELIVERY LOCATION (MANDATORY)
                </span>
                <p className="font-sans text-[11px] text-black/70 font-medium">
                  Pin your exact delivery location (building entrance, gate, hostel block). This helps our delivery partner reach you faster and avoids missed deliveries.
                </p>
              </div>
            </div>

            {/* Interactive Leaflet Map */}
            <div className="p-3 bg-[#f5e3cd]/60 border-2 border-black/15 rounded-[10px]">
              <LocationPicker
                kitchenLat={KITCHEN_LAT}
                kitchenLng={KITCHEN_LNG}
                showRoutePreview={true}
                onLocationSelect={handleLocationSelect}
              />
            </div>

            {/* Resolved Location Output */}
            {pinnedLat && pinnedLng && (
              <div className="p-3 rounded-[8px] bg-black text-[#f5e3cd] font-sans text-xs flex items-center justify-between gap-2">
                <span className="truncate">
                  📍 Pinned Coordinates: <strong>{pinnedLat.toFixed(5)}, {pinnedLng.toFixed(5)}</strong>
                </span>
                <span className="font-outfit font-black text-[#E5A00D] uppercase shrink-0">
                  {resolvedMapAddress ? "Address Resolved" : "Pin Set"}
                </span>
              </div>
            )}
          </div>


          {/* 5. DELIVERY RADIUS VALIDATION CARD */}
          {distanceKm !== null && (
            <div
              className={`p-4 rounded-[10px] border-2 space-y-1 transition-all ${
                isWithinRadius
                  ? "bg-emerald-50 border-emerald-500 text-emerald-900"
                  : "bg-red-50 border-red-500 text-red-900"
              }`}
            >
              <div className="flex items-center gap-2 font-outfit text-xs font-black uppercase">
                {isWithinRadius ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Great! We deliver to this location.</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-red-700" />
                    <span>Sorry, this location is outside our delivery area.</span>
                  </>
                )}
              </div>
              <p className="font-sans text-xs font-semibold">
                Distance from Cloud Kitchen: <strong>{distanceKm} km</strong> (Admin delivery radius limit: {MAX_DELIVERY_RADIUS_KM} km).
                {!isWithinRadius && " Please move the map pin closer to our kitchen coverage zone to enable saving."}
              </p>
            </div>
          )}


          {/* 6. SET AS DEFAULT CHECKBOX */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="set-default"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 rounded border-black/30 text-black focus:ring-black cursor-pointer"
            />
            <label htmlFor="set-default" className="font-outfit text-xs font-bold uppercase text-black cursor-pointer">
              Set as default delivery address
            </label>
          </div>


          {/* 7. SAVE BUTTON VALIDATION */}
          <button
            onClick={handleSaveAddress}
            disabled={saving || !isFormValid}
            className="w-full py-3.5 rounded-[10px] bg-black text-[#f5e3cd] font-outfit text-xs font-black uppercase tracking-wider hover:bg-[#E5A00D] hover:text-black transition-all shadow-[3px_3px_0px_#000] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? "Saving Location to Database..." : "Save Address"}
          </button>
        </div>
      )}


      {/* =========================================================
          8. CHECKOUT LOCATION BLOCKING MODAL
          ========================================================= */}
      {blockingModalAddress && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#FFF8EE] border-2 border-black rounded-[12px] p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-[8px_8px_0px_#000000] relative">
            <div className="flex items-center justify-between border-b-2 border-black/15 pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h3 className="font-outfit font-black text-xl text-black uppercase tracking-tight">
                  Complete Your Delivery Location
                </h3>
              </div>
              <button
                onClick={() => setBlockingModalAddress(null)}
                className="p-1.5 rounded-[6px] bg-black text-white hover:bg-[#E5A00D] hover:text-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="font-sans text-xs text-black/80 font-medium leading-relaxed">
              Your address <strong>&quot;{blockingModalAddress.address}&quot;</strong> is saved, but the exact map location pin is missing. Please pin your delivery location so our delivery partner can reach you accurately.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  setBlockingModalAddress(null);
                  setShowAddForm(true);
                  setTimeout(() => {
                    formRef.current?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }}
                className="flex-1 py-3 rounded-[10px] bg-black text-[#E5A00D] font-outfit text-xs font-black uppercase tracking-wider hover:bg-[#E5A00D] hover:text-black transition-colors"
              >
                Pin Location Now
              </button>
              <button
                onClick={() => setBlockingModalAddress(null)}
                className="px-4 py-3 rounded-[10px] bg-[#f5e3cd] border-2 border-black/20 text-black font-outfit text-xs font-bold uppercase hover:bg-black hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
