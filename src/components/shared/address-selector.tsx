"use client";

import React, { useState, useEffect } from "react";
import { MapPin, Plus, Check, AlertCircle, X, Navigation, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

const LocationPicker = dynamic(() => import("@/components/location-picker"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] bg-[#FFF8EE] rounded-xl flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#0F3329]/30 text-[#0F3329]">
      <Loader2 className="w-6 h-6 animate-spin text-[#E5A00D]" />
      <span className="font-outfit text-xs font-bold uppercase tracking-wider">
        Loading Interactive Map...
      </span>
    </div>
  ),
});

export interface AddressType {
  id: string;
  label: string;
  recipientName?: string | null;
  recipientPhone?: string | null;
  address: string;
  landmark?: string | null;
  area: string;
  city: string;
  pincode: string;
  latitude?: number | null;
  longitude?: number | null;
  isDefault?: boolean;
}

interface AddressSelectorProps {
  selectedAddressId: string | null;
  onSelectAddress: (address: AddressType) => void;
  showBlockingPinModal?: boolean;
  onCloseBlockingPinModal?: () => void;
}

export default function AddressSelector({
  selectedAddressId,
  onSelectAddress,
  showBlockingPinModal = false,
  onCloseBlockingPinModal,
}: AddressSelectorProps) {
  const [addressesList, setAddressesList] = useState<AddressType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // New address form state
  const [newLabel, setNewLabel] = useState("Home");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [area, setArea] = useState("");
  const [landmark, setLandmark] = useState("");
  const [pincode, setPincode] = useState("500081");
  const [pinnedLat, setPinnedLat] = useState<number | null>(null);
  const [pinnedLng, setPinnedLng] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/user/addresses");
      if (res.ok) {
        const data = await res.json();
        const list: AddressType[] = data.addresses || [];
        setAddressesList(list);

        if (list.length > 0) {
          const active = list.find((a) => a.id === selectedAddressId) || list.find((a) => a.isDefault) || list[0];
          onSelectAddress(active);
        }
      }
    } catch (err) {
      console.error("Failed to load addresses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleLocationPicked = (lat: number, lng: number, fullAddr: string) => {
    setPinnedLat(lat);
    setPinnedLng(lng);
    if (!streetAddress) {
      setStreetAddress(fullAddr);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!pinnedLat || !pinnedLng) {
      setErrorMsg("Please select your exact pin location on the map.");
      return;
    }

    if (!streetAddress || !area || !pincode) {
      setErrorMsg("Please fill in street address, area, and pincode.");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/user/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: newLabel,
          recipientName,
          recipientPhone,
          address: streetAddress,
          area,
          landmark,
          city: "Hyderabad",
          state: "Telangana",
          pincode,
          latitude: pinnedLat,
          longitude: pinnedLng,
          isDefault: addressesList.length === 0,
        }),
      });

      const data = await res.json();
      setSaving(false);

      if (!res.ok) {
        setErrorMsg(data.error || "Failed to save address");
        return;
      }

      setShowAddModal(false);
      if (onCloseBlockingPinModal) onCloseBlockingPinModal();

      // Refresh list & select newly created address
      await fetchAddresses();
      if (data.address) {
        onSelectAddress(data.address);
      }
    } catch (err) {
      setSaving(false);
      setErrorMsg("An unexpected error occurred while saving.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#E5A00D]" />
          <h3 className="font-outfit font-black text-sm uppercase tracking-wider text-[#0F3329]">
            Delivery Address
          </h3>
        </div>
        <button
          type="button"
          onClick={() => {
            setErrorMsg(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-1 text-xs font-outfit font-black uppercase text-[#0F3329] hover:underline"
        >
          <Plus className="w-4 h-4 text-[#E5A00D]" />
          <span>Add New Address</span>
        </button>
      </div>

      {loading ? (
        <div className="p-6 bg-[#FFF8EE] border-2 border-[#0F3329] rounded-2xl flex items-center justify-center gap-2 text-[#0F3329]">
          <Loader2 className="w-5 h-5 animate-spin text-[#E5A00D]" />
          <span className="font-outfit text-xs font-bold uppercase">Loading Delivery Locations...</span>
        </div>
      ) : addressesList.length === 0 ? (
        <div className="p-6 bg-[#FFF8EE] border-2 border-dashed border-[#0F3329]/30 rounded-2xl text-center space-y-3">
          <MapPin className="w-8 h-8 text-[#E5A00D] mx-auto opacity-70" />
          <p className="font-outfit text-xs font-bold uppercase text-[#0F3329]/80">
            No saved delivery addresses found
          </p>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-[#0F3329] text-[#f5e3cd] font-outfit text-xs font-black uppercase tracking-wider hover:bg-[#1B4D3E] transition-all inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Delivery Location</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {addressesList.map((addr) => {
            const isSelected = addr.id === selectedAddressId;
            const hasPin = addr.latitude && addr.longitude;

            return (
              <div
                key={addr.id}
                onClick={() => onSelectAddress(addr)}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all relative space-y-2 ${
                  isSelected
                    ? "bg-[#FFF8EE] border-[#0F3329] shadow-sm"
                    : "bg-white/60 border-[#0F3329]/20 hover:border-[#0F3329]/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#0F3329] text-[#E5A00D] font-outfit text-[10px] font-black uppercase tracking-wider">
                      {addr.label}
                    </span>
                    {addr.isDefault && (
                      <span className="text-[10px] font-outfit font-bold uppercase text-[#0F3329]/60">
                        Default
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {hasPin ? (
                      <span className="text-[10px] font-outfit font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Navigation className="w-2.5 h-2.5" /> Pinned Map
                      </span>
                    ) : (
                      <span className="text-[10px] font-outfit font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertCircle className="w-2.5 h-2.5" /> No Map Pin
                      </span>
                    )}

                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected
                          ? "border-[#0F3329] bg-[#0F3329] text-[#f5e3cd]"
                          : "border-[#0F3329]/30"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="font-outfit font-extrabold text-xs uppercase text-[#0F3329]">
                    {addr.recipientName || "Valued Customer"} • {addr.recipientPhone || ""}
                  </p>
                  <p className="font-sans text-xs text-[#0F3329]/80 line-clamp-2 mt-0.5">
                    {addr.address}, {addr.area}, {addr.city} - {addr.pincode}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* BLOCKING MODAL: PIN EXCITING LOCATION REQUIRED */}
      {(showBlockingPinModal || (showAddModal && !pinnedLat)) && (
        <div className="fixed inset-0 z-[1050] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-[#FFF8EE] border-2 border-[#0F3329] rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-[#0F3329]/15 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#E5A00D] text-[#0F3329]">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-outfit font-black text-base uppercase tracking-wider text-[#0F3329]">
                    Pin Exact Delivery Location
                  </h3>
                  <p className="font-sans text-xs text-[#0F3329]/70">
                    A accurate map pin is mandatory for live GPS delivery dispatch.
                  </p>
                </div>
              </div>
              {onCloseBlockingPinModal && (
                <button
                  type="button"
                  onClick={onCloseBlockingPinModal}
                  className="p-1 rounded-full text-[#0F3329]/60 hover:text-[#0F3329]"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-100 border border-red-400 text-red-800 text-xs font-sans font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div className="space-y-1">
                <label className="font-outfit text-xs font-extrabold uppercase text-[#0F3329] block">
                  1. Click on map or search address to drop pin *
                </label>
                <LocationPicker
                  onLocationSelect={handleLocationPicked}
                  kitchenLat={17.4399}
                  kitchenLng={78.3847}
                  showRoutePreview={true}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-outfit text-xs font-extrabold uppercase text-[#0F3329] block mb-1">
                    Label
                  </label>
                  <select
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border-2 border-[#0F3329]/30 bg-white font-outfit text-xs font-bold uppercase text-[#0F3329]"
                  >
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="Gym">Gym</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="font-outfit text-xs font-extrabold uppercase text-[#0F3329] block mb-1">
                    Recipient Name
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full px-3 py-2 rounded-xl border-2 border-[#0F3329]/30 bg-white font-sans text-xs text-[#0F3329]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-outfit text-xs font-extrabold uppercase text-[#0F3329] block mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="Mobile Number"
                    className="w-full px-3 py-2 rounded-xl border-2 border-[#0F3329]/30 bg-white font-sans text-xs text-[#0F3329]"
                  />
                </div>
                <div>
                  <label className="font-outfit text-xs font-extrabold uppercase text-[#0F3329] block mb-1">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border-2 border-[#0F3329]/30 bg-white font-sans text-xs text-[#0F3329]"
                  />
                </div>
              </div>

              <div>
                <label className="font-outfit text-xs font-extrabold uppercase text-[#0F3329] block mb-1">
                  Street Address & Flat / Door No. *
                </label>
                <textarea
                  rows={2}
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="Flat No, Building, Street Name"
                  className="w-full px-3 py-2 rounded-xl border-2 border-[#0F3329]/30 bg-white font-sans text-xs text-[#0F3329]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-outfit text-xs font-extrabold uppercase text-[#0F3329] block mb-1">
                    Area / Locality *
                  </label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="Gachibowli / Hitec City"
                    className="w-full px-3 py-2 rounded-xl border-2 border-[#0F3329]/30 bg-white font-sans text-xs text-[#0F3329]"
                  />
                </div>
                <div>
                  <label className="font-outfit text-xs font-extrabold uppercase text-[#0F3329] block mb-1">
                    Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="Near Metro Station"
                    className="w-full px-3 py-2 rounded-xl border-2 border-[#0F3329]/30 bg-white font-sans text-xs text-[#0F3329]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#0F3329]/15">
                {onCloseBlockingPinModal && (
                  <button
                    type="button"
                    onClick={onCloseBlockingPinModal}
                    className="px-4 py-2.5 rounded-xl border-2 border-[#0F3329]/30 text-[#0F3329] font-outfit text-xs font-bold uppercase"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={saving || !pinnedLat}
                  className="px-6 py-2.5 rounded-xl bg-[#0F3329] text-[#f5e3cd] font-outfit font-black text-xs uppercase tracking-wider hover:bg-[#1B4D3E] transition-all disabled:opacity-40 flex items-center gap-1.5"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Location Pin & Continue</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
