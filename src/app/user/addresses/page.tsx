"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Home,
  Briefcase,
  Plus,
  Trash2,
  AlertCircle,
} from "lucide-react";

type Address = {
  id: string;
  label: string;
  address: string;
  area: string;
  city: string;
  pincode: string;
  isDefault: boolean;
};

export default function UserAddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  
  // New Address Form State
  const [label, setLabel] = useState<"Home" | "Work" | "Other">("Home");
  const [street, setStreet] = useState("");
  const [area, setArea] = useState("");
  const [pincode, setPincode] = useState("");

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

  async function handleAddAddress() {
    if (!street.trim() || !area.trim() || !pincode.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/user/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          address: street,
          area,
          pincode,
        }),
      });
      if (res.ok) {
        setStreet("");
        setArea("");
        setPincode("");
        setShowAddForm(false);
        await fetchAddresses();
      }
    } catch (err) {
      console.error("Failed to save address:", err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#0F3329] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="font-outfit text-sm font-bold uppercase tracking-wider text-[#0F3329]">
          Fetching address book from database...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      
      {/* =========================================================
          PAGE HEADER (NO SHADOWS)
          ========================================================= */}

      <div className="p-8 sm:p-10 bg-[#FFF8EE] border-2 border-[#0F3329]/20 rounded-[2rem] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <span className="font-outfit text-xs font-bold uppercase text-[#E5A00D] bg-[#0F3329] px-3 py-1 rounded-full block w-fit mb-2">
            DATABASE RECORD LOCATIONS
          </span>
          <h1 className="font-outfit font-black text-3xl sm:text-5xl text-[#0F3329] uppercase tracking-tight leading-none">
            MY ADDRESS BOOK
          </h1>
          <p className="font-sans text-sm sm:text-base text-[#0F3329]/70 font-medium mt-2">
            Manage saved delivery addresses for cloud kitchen meal dispatches.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-6 py-3.5 rounded-2xl bg-[#0F3329] text-[#f5e3cd] border border-[#0F3329] font-outfit text-xs sm:text-sm font-black uppercase tracking-wider hover:bg-[#E5A00D] hover:text-[#0F3329] transition-colors flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? "Close Form" : "Add New Address"}</span>
        </button>
      </div>


      {/* =========================================================
          NEW ADDRESS FORM (NO SHADOWS)
          ========================================================= */}

      {showAddForm && (
        <div className="p-8 bg-[#FFF8EE] border-2 border-[#0F3329]/20 rounded-[2rem] space-y-6 animate-in slide-in-from-top duration-300">
          <div className="border-b border-[#0F3329]/15 pb-4">
            <span className="font-outfit text-xs font-black uppercase text-[#E5A00D] bg-[#0F3329] px-3 py-1 rounded-full block w-fit mb-1">
              NEW LOCATION ENTRY
            </span>
            <h2 className="font-outfit font-black text-2xl text-[#0F3329] uppercase">
              ADD DISPATCH ADDRESS
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Label Pills */}
            <div className="sm:col-span-2 space-y-1">
              <label className="block font-outfit text-xs font-extrabold uppercase tracking-wider text-[#0F3329]">
                Address Tag
              </label>
              <div className="flex gap-3">
                {(["Home", "Work", "Other"] as const).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setLabel(tag)}
                    className={`px-4 py-2 rounded-xl font-outfit text-xs font-bold uppercase border transition-colors ${
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
                Street Address / Flat / Building
              </label>
              <input
                type="text"
                placeholder="e.g. Flat 402, Golden Heights, Road 12"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="w-full rounded-2xl px-4 py-3 text-sm font-sans font-semibold outline-none border-2 border-[#0F3329]/30 bg-white text-[#0F3329]"
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
                className="w-full rounded-2xl px-4 py-3 text-sm font-sans font-semibold outline-none border-2 border-[#0F3329]/30 bg-white text-[#0F3329]"
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
                className="w-full rounded-2xl px-4 py-3 text-sm font-sans font-semibold outline-none border-2 border-[#0F3329]/30 bg-white text-[#0F3329]"
              />
            </div>

          </div>

          <button
            onClick={handleAddAddress}
            disabled={saving || !street || !area || !pincode}
            className="w-full py-4 rounded-2xl bg-[#0F3329] text-[#f5e3cd] font-outfit text-sm font-black uppercase tracking-wider hover:bg-[#E5A00D] hover:text-[#0F3329] transition-colors disabled:opacity-50"
          >
            {saving ? "Saving to Database..." : "Save Address"}
          </button>
        </div>
      )}


      {/* =========================================================
          SAVED ADDRESSES LIST FROM DATABASE (NO SHADOWS)
          ========================================================= */}

      {error && (
        <div className="p-6 rounded-2xl bg-red-50 border border-red-300 text-red-800 text-sm font-sans">
          {error}
        </div>
      )}

      {addresses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`p-7 bg-[#FFF8EE] border-2 border-[#0F3329]/20 rounded-[2rem] space-y-4 flex flex-col justify-between ${
                addr.isDefault ? "ring-2 ring-[#E5A00D]" : ""
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
                    <span className="px-3 py-1 rounded-full bg-[#0F3329] text-[#E5A00D] font-outfit text-xs font-black uppercase tracking-wider">
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

                <div className="p-4 rounded-2xl bg-[#f5e3cd]/70 border border-[#0F3329]/15 space-y-1">
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
                  ✓ Verified Service Area
                </span>

                {!addr.isDefault && (
                  <button
                    onClick={() => deleteAddress(addr.id)}
                    className="text-red-700 hover:text-red-900 flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 bg-[#FFF8EE] border-2 border-[#0F3329]/20 rounded-[2rem] text-center space-y-4">
          <MapPin className="w-12 h-12 text-[#0F3329]/40 mx-auto" />
          <div>
            <h3 className="font-outfit font-black text-xl text-[#0F3329] uppercase">
              No Saved Addresses Found
            </h3>
            <p className="font-sans text-xs text-[#0F3329]/70 font-medium max-w-md mx-auto mt-1">
              Add your primary delivery address so our cloud kitchen can dispatch your daily meal orders.
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-3 rounded-xl bg-[#0F3329] text-[#f5e3cd] font-outfit text-xs font-black uppercase tracking-wider hover:bg-[#E5A00D] hover:text-[#0F3329] transition-colors"
          >
            + Add First Address
          </button>
        </div>
      )}

    </div>
  );
}
