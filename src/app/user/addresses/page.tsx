"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Home,
  Briefcase,
  Plus,
  CheckCircle2,
  Trash2,
  Edit2,
  Sparkles,
  Search,
} from "lucide-react";

type Address = {
  id: string;
  label: "Home" | "Work" | "Other";
  address: string;
  area: string;
  city: string;
  pincode: string;
  isDefault: boolean;
};

const INITIAL_ADDRESSES: Address[] = [
  {
    id: "addr_1",
    label: "Home",
    address: "Flat 402, Golden Heights Appts, Road No 12",
    area: "Jubilee Hills",
    city: "Hyderabad",
    pincode: "500033",
    isDefault: true,
  },
  {
    id: "addr_2",
    label: "Work",
    address: "Building 4B, Mindspace Cyberabad, Hitech City",
    area: "Madhapur",
    city: "Hyderabad",
    pincode: "500081",
    isDefault: false,
  },
];

export default function UserAddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>(INITIAL_ADDRESSES);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // New Address Form State
  const [label, setLabel] = useState<"Home" | "Work" | "Other">("Home");
  const [street, setStreet] = useState("");
  const [area, setArea] = useState("");
  const [pincode, setPincode] = useState("");

  const setDefault = (id: string) => {
    setAddresses((prev) =>
      prev.map((addr) => ({
        ...addr,
        isDefault: addr.id === id,
      }))
    );
  };

  const handleAddAddress = () => {
    if (!street || !area || !pincode) return;
    const newAddr: Address = {
      id: `addr_${Date.now()}`,
      label,
      address: street,
      area,
      city: "Hyderabad",
      pincode,
      isDefault: addresses.length === 0,
    };
    setAddresses([...addresses, newAddr]);
    setStreet("");
    setArea("");
    setPincode("");
    setShowAddForm(false);
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      
      {/* =========================================================
          PAGE HEADER
          ========================================================= */}

      <div className="p-8 sm:p-10 bg-[#FFF8EE] border-4 border-[#0F3329] rounded-[2.5rem] shadow-[8px_8px_0px_#0F3329] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <span className="font-mouse-memoirs text-2xl text-[#E5A00D] uppercase font-bold tracking-widest block">
            SAVED DISPATCH LOCATIONS
          </span>
          <h1 className="font-outfit font-black text-3xl sm:text-5xl text-[#0F3329] uppercase tracking-tight leading-none mt-1">
            MY ADDRESS BOOK
          </h1>
          <p className="font-sans text-sm sm:text-base text-[#0F3329]/80 font-medium mt-2">
            Manage your daily delivery addresses for effortless meal dispatching.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-6 py-3.5 rounded-2xl bg-[#0F3329] text-[#f5e3cd] border-2 border-[#0F3329] font-outfit text-xs sm:text-sm font-black uppercase tracking-wider hover:bg-[#E5A00D] hover:text-[#0F3329] transition-all shadow-[4px_4px_0px_#071914] flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? "Close Form" : "Add New Address"}</span>
        </button>
      </div>


      {/* =========================================================
          NEW ADDRESS FORM (INLINE CARD)
          ========================================================= */}

      {showAddForm && (
        <div className="p-8 bg-[#FFF8EE] border-4 border-[#0F3329] rounded-[2.5rem] shadow-[8px_8px_0px_#0F3329] space-y-6 animate-in slide-in-from-top duration-300">
          <div className="border-b-2 border-[#0F3329]/15 pb-4">
            <span className="font-mouse-memoirs text-xl text-[#E5A00D] uppercase font-bold tracking-widest block">
              ENTER NEW LOCATION
            </span>
            <h2 className="font-outfit font-black text-2xl text-[#0F3329] uppercase">
              ADD DISPATCH ADDRESS
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Label Pills */}
            <div className="sm:col-span-2 space-y-1">
              <label className="block font-outfit text-xs font-extrabold uppercase tracking-wider text-[#0F3329]">
                Address Type Tag
              </label>
              <div className="flex gap-3">
                {(["Home", "Work", "Other"] as const).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setLabel(tag)}
                    className={`px-4 py-2 rounded-xl font-outfit text-xs font-bold uppercase border-2 transition-all ${
                      label === tag
                        ? "bg-[#0F3329] text-[#E5A00D] border-[#0F3329]"
                        : "bg-white text-[#0F3329] border-[#0F3329]/30"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Street Address */}
            <div className="sm:col-span-2 space-y-1">
              <label className="block font-outfit text-xs font-extrabold uppercase tracking-wider text-[#0F3329]">
                Flat / House / Building &amp; Street
              </label>
              <input
                type="text"
                placeholder="e.g. Flat 402, Golden Heights, Road 12"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="w-full rounded-2xl px-4 py-3 text-sm font-sans font-semibold outline-none border-3 border-[#0F3329] bg-white text-[#0F3329]"
              />
            </div>

            {/* Area */}
            <div className="space-y-1">
              <label className="block font-outfit text-xs font-extrabold uppercase tracking-wider text-[#0F3329]">
                Area / Locality
              </label>
              <input
                type="text"
                placeholder="e.g. Jubilee Hills"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full rounded-2xl px-4 py-3 text-sm font-sans font-semibold outline-none border-3 border-[#0F3329] bg-white text-[#0F3329]"
              />
            </div>

            {/* Pincode */}
            <div className="space-y-1">
              <label className="block font-outfit text-xs font-extrabold uppercase tracking-wider text-[#0F3329]">
                Pincode
              </label>
              <input
                type="text"
                placeholder="e.g. 500033"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-full rounded-2xl px-4 py-3 text-sm font-sans font-semibold outline-none border-3 border-[#0F3329] bg-white text-[#0F3329]"
              />
            </div>

          </div>

          <button
            onClick={handleAddAddress}
            className="w-full py-4 rounded-2xl bg-[#0F3329] text-[#f5e3cd] font-outfit text-sm font-black uppercase tracking-wider hover:bg-[#E5A00D] hover:text-[#0F3329] transition-all shadow-[4px_4px_0px_#071914]"
          >
            Save Address
          </button>
        </div>
      )}


      {/* =========================================================
          SAVED ADDRESSES LIST
          ========================================================= */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {addresses.map((addr) => (
          <div
            key={addr.id}
            className={`p-7 bg-[#FFF8EE] border-4 border-[#0F3329] rounded-[2.5rem] shadow-[6px_6px_0px_#0F3329] space-y-4 flex flex-col justify-between ${
              addr.isDefault ? "ring-4 ring-[#E5A00D]" : ""
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {addr.label === "Home" ? (
                    <Home className="w-5 h-5 text-[#E5A00D]" />
                  ) : (
                    <Briefcase className="w-5 h-5 text-[#E5A00D]" />
                  )}
                  <span className="font-outfit text-base font-black text-[#0F3329] uppercase">
                    {addr.label} ADDRESS
                  </span>
                </div>

                {addr.isDefault ? (
                  <span className="px-3 py-1 rounded-full bg-[#0F3329] text-[#E5A00D] font-outfit text-xs font-black uppercase tracking-wider border border-[#E5A00D]/40">
                    DEFAULT LOCATION
                  </span>
                ) : (
                  <button
                    onClick={() => setDefault(addr.id)}
                    className="font-outfit text-xs font-extrabold uppercase text-[#1B4D3E] underline hover:text-[#E5A00D]"
                  >
                    Set as Default
                  </button>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-[#f5e3cd] border-2 border-[#0F3329] space-y-1">
                <p className="font-sans text-sm font-bold text-[#0F3329] leading-relaxed">
                  {addr.address}
                </p>
                <p className="font-sans text-xs font-semibold text-[#0F3329]/70">
                  {addr.area}, {addr.city} - {addr.pincode}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#0F3329]/15 text-xs font-outfit font-extrabold uppercase">
              <span className="text-emerald-800 flex items-center gap-1">
                ✓ Serviceable Cloud Kitchen Zone
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
