"use client";

import { useState, useEffect } from "react";
import {
  MapPin,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Home,
  Briefcase,
  Navigation,
  Loader2,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronRight,
  Crosshair,
  Building,
  Map,
} from "lucide-react";
import { INDIAN_STATES_AND_CITIES, INDIAN_STATES } from "@/lib/constants/indiaLocationData";

export interface AddressItem {
  id: string;
  userId: string;
  label: string;
  recipientName?: string | null;
  recipientPhone?: string | null;
  address: string;
  landmark?: string | null;
  area: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number | null;
  longitude?: number | null;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddressSelected?: (address: AddressItem) => void;
  initialMode?: "LIST" | "FORM";
  initialAddressToEdit?: AddressItem | null;
  titleOverride?: string;
  requireAddressMsg?: string;
}

const PRESET_LABELS = [
  { label: "Home", icon: Home },
  { label: "Work", icon: Briefcase },
  { label: "Other", icon: Navigation },
];

export function AddressModal({
  isOpen,
  onClose,
  onAddressSelected,
  initialMode = "LIST",
  initialAddressToEdit = null,
  titleOverride,
  requireAddressMsg,
}: AddressModalProps) {
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [autoDetectNotice, setAutoDetectNotice] = useState<string | null>(null);

  // Form or List view
  const [viewMode, setViewMode] = useState<"LIST" | "FORM">("LIST");
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  // Form fields
  const [label, setLabel] = useState("Home");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [area, setArea] = useState("");
  const [landmark, setLandmark] = useState("");
  const [state, setState] = useState("Andhra Pradesh");
  const [city, setCity] = useState("Rajahmundry");
  const [customCityMode, setCustomCityMode] = useState(false);
  const [customStateMode, setCustomStateMode] = useState(false);
  const [pincode, setPincode] = useState("533101");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isDefault, setIsDefault] = useState(false);

  // Available cities for selected state
  const availableCities = INDIAN_STATES_AND_CITIES[state] || [];

  // Fetch address list
  async function loadAddresses() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/user/addresses");
      if (res.ok) {
        const data = await res.json();
        const list = data.addresses || [];
        setAddresses(list);
        if (list.length === 0 && initialMode === "LIST") {
          setViewMode("FORM");
        }
      } else {
        const data = await res.json();
        setError(data.error || "Failed to load saved addresses.");
      }
    } catch (err) {
      console.error("Address load error:", err);
      setError("Network error while loading addresses.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMsg(null);
      setAutoDetectNotice(null);
      if (initialAddressToEdit) {
        startEditing(initialAddressToEdit);
      } else if (initialMode === "FORM") {
        resetForm();
        setViewMode("FORM");
      } else {
        setViewMode("LIST");
      }
      loadAddresses();
    }
  }, [isOpen, initialMode, initialAddressToEdit]);

  function resetForm() {
    setEditingAddressId(null);
    setLabel("Home");
    setRecipientName("");
    setRecipientPhone("");
    setStreetAddress("");
    setArea("");
    setLandmark("");
    setState("Andhra Pradesh");
    setCity("Rajahmundry");
    setCustomCityMode(false);
    setCustomStateMode(false);
    setPincode("533101");
    setLatitude(null);
    setLongitude(null);
    setIsDefault(false);
    setError(null);
    setAutoDetectNotice(null);
  }

  function startEditing(addr: AddressItem) {
    setEditingAddressId(addr.id);
    setLabel(addr.label || "Home");
    setRecipientName(addr.recipientName || "");
    setRecipientPhone(addr.recipientPhone || "");
    setStreetAddress(addr.address || "");
    setArea(addr.area || "");
    setLandmark(addr.landmark || "");
    
    // Check state/city existence in list
    const stateMatch = addr.state || "Andhra Pradesh";
    setState(stateMatch);
    if (!INDIAN_STATES.includes(stateMatch)) {
      setCustomStateMode(true);
    } else {
      setCustomStateMode(false);
    }

    const cityMatch = addr.city || "Rajahmundry";
    setCity(cityMatch);
    const citiesForState = INDIAN_STATES_AND_CITIES[stateMatch] || [];
    if (!citiesForState.includes(cityMatch)) {
      setCustomCityMode(true);
    } else {
      setCustomCityMode(false);
    }

    setPincode(addr.pincode || "");
    setLatitude(addr.latitude || null);
    setLongitude(addr.longitude || null);
    setIsDefault(addr.isDefault || false);
    setError(null);
    setAutoDetectNotice(null);
    setViewMode("FORM");
  }

  // Handle State Change
  function handleStateChange(newState: string) {
    if (newState === "__OTHER__") {
      setCustomStateMode(true);
      setCustomCityMode(true);
      setState("");
      setCity("");
      return;
    }
    setCustomStateMode(false);
    setState(newState);
    const cities = INDIAN_STATES_AND_CITIES[newState] || [];
    if (cities.length > 0) {
      setCity(cities[0]);
      setCustomCityMode(false);
    } else {
      setCity("");
      setCustomCityMode(true);
    }
  }

  // Auto-Detect Current GPS Location and Reverse-Geocode
  async function handleAutoDetectAddress() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser/device.");
      return;
    }

    setLocating(true);
    setError(null);
    setAutoDetectNotice("Detecting your exact GPS location...");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setLatitude(lat);
          setLongitude(lng);

          setAutoDetectNotice("Resolving street, area & pincode...");

          // Free OpenStreetMap Nominatim reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`,
            {
              headers: {
                "Accept-Language": "en",
              },
            }
          );

          if (!response.ok) {
            throw new Error("Failed to reverse geocode location");
          }

          const data = await response.json();
          const addr = data.address || {};

          // Extract components intelligently
          const road = addr.road || addr.street || addr.pedestrian || addr.path || "";
          const houseNumber = addr.house_number || addr.building || "";
          const neighbourhood = addr.neighbourhood || addr.suburb || addr.residential || addr.quarter || addr.city_district || "";
          const detectedCity = addr.city || addr.town || addr.municipality || addr.village || addr.county || "";
          const detectedState = addr.state || "";
          const detectedPostcode = addr.postcode || "";

          // Populate Street
          const streetParts = [houseNumber, road].filter(Boolean).join(", ");
          if (streetParts && !streetAddress) {
            setStreetAddress(streetParts);
          } else if (!streetAddress && data.display_name) {
            setStreetAddress(data.display_name.split(",").slice(0, 2).join(", "));
          }

          // Populate Area
          if (neighbourhood) {
            setArea(neighbourhood);
          } else if (road && !streetAddress) {
            setArea(road);
          }

          // Match or Set State
          let matchedState = "";
          for (const s of INDIAN_STATES) {
            if (
              detectedState.toLowerCase().includes(s.toLowerCase()) ||
              s.toLowerCase().includes(detectedState.toLowerCase())
            ) {
              matchedState = s;
              break;
            }
          }

          if (matchedState) {
            setState(matchedState);
            setCustomStateMode(false);
            const cities = INDIAN_STATES_AND_CITIES[matchedState] || [];
            
            // Match or Set City
            const matchedCity = cities.find(
              (c) =>
                detectedCity.toLowerCase().includes(c.toLowerCase()) ||
                c.toLowerCase().includes(detectedCity.toLowerCase())
            );

            if (matchedCity) {
              setCity(matchedCity);
              setCustomCityMode(false);
            } else if (detectedCity) {
              setCity(detectedCity);
              setCustomCityMode(true);
            }
          } else if (detectedState) {
            setState(detectedState);
            setCustomStateMode(true);
            if (detectedCity) {
              setCity(detectedCity);
              setCustomCityMode(true);
            }
          }

          // Populate Pincode
          if (detectedPostcode) {
            const cleanPin = detectedPostcode.replace(/\D/g, "").slice(0, 6);
            if (cleanPin) setPincode(cleanPin);
          }

          setAutoDetectNotice("📍 Location auto-filled! You can review or edit any field below.");
          setTimeout(() => setAutoDetectNotice(null), 5000);
        } catch (fetchErr) {
          console.error("Geocoding lookup error:", fetchErr);
          setAutoDetectNotice("📍 GPS coordinates captured! Please verify your area and pincode.");
          setTimeout(() => setAutoDetectNotice(null), 4000);
        } finally {
          setLocating(false);
        }
      },
      (geoErr) => {
        setLocating(false);
        setAutoDetectNotice(null);
        console.error("GPS position error:", geoErr);
        if (geoErr.code === 1) {
          setError("Location permission denied. Please enable location access or type your address manually.");
        } else if (geoErr.code === 2) {
          setError("Location unavailable. Please fill in the details manually.");
        } else {
          setError("Location request timed out. Please try again or type manually.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  }

  async function handleSaveAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!streetAddress.trim() || !area.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
      setError("Please fill out complete flat/house number, locality, city, state, and pincode.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      action: editingAddressId ? "EDIT" : undefined,
      addressId: editingAddressId || undefined,
      label,
      recipientName: recipientName.trim() || "Customer",
      recipientPhone: recipientPhone.trim() || "9876543210",
      address: streetAddress.trim(),
      area: area.trim(),
      landmark: landmark.trim() || undefined,
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      latitude: latitude ?? undefined,
      longitude: longitude ?? undefined,
      isDefault: isDefault || addresses.length === 0,
    };

    try {
      const res = await fetch("/api/user/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(editingAddressId ? "Address updated successfully!" : "New address saved successfully!");
        window.dispatchEvent(new Event("qbowl-address-updated"));

        if (onAddressSelected && data.address) {
          onAddressSelected(data.address);
        }

        setTimeout(async () => {
          await loadAddresses();
          setViewMode("LIST");
          resetForm();
          setSuccessMsg(null);
        }, 600);
      } else {
        setError(data.error || "Failed to save address. Please check your delivery zone.");
      }
    } catch (err) {
      console.error("Save address error:", err);
      setError("Failed to reach server. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSetDefault(addr: AddressItem) {
    try {
      const res = await fetch("/api/user/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SET_DEFAULT",
          addressId: addr.id,
        }),
      });
      if (res.ok) {
        setAddresses((prev) =>
          prev.map((a) => ({
            ...a,
            isDefault: a.id === addr.id,
          }))
        );
        window.dispatchEvent(new Event("qbowl-address-updated"));
        if (onAddressSelected) {
          onAddressSelected({ ...addr, isDefault: true });
        }
      }
    } catch (err) {
      console.error("Set default error:", err);
    }
  }

  async function handleDelete(addressId: string) {
    if (!confirm("Are you sure you want to remove this delivery address?")) return;
    try {
      const res = await fetch("/api/user/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DELETE",
          addressId,
        }),
      });
      if (res.ok) {
        setAddresses((prev) => prev.filter((a) => a.id !== addressId));
        window.dispatchEvent(new Event("qbowl-address-updated"));
      } else {
        const data = await res.json();
        setError(data.error || "Could not remove address.");
      }
    } catch (err) {
      console.error("Delete address error:", err);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] bg-white rounded-[2rem] border-4 border-black shadow-[8px_8px_0_#000] flex flex-col overflow-hidden text-black animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-5 bg-[#FFF8EE] border-b-3 border-black flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-[#E5A00D] border-2 border-black flex items-center justify-center shadow-[2px_2px_0_#000]">
              <MapPin size={20} className="text-black" />
            </div>
            <div>
              <h3 className="font-outfit text-lg sm:text-xl font-black uppercase tracking-wide">
                {titleOverride || (viewMode === "FORM" ? (editingAddressId ? "Edit Address" : "Add Delivery Address") : "Manage Delivery Addresses")}
              </h3>
              <p className="text-[11px] font-bold text-zinc-600">
                {viewMode === "FORM" ? "Deliveries freshly crafted to your doorstep" : "Select or edit your active delivery point"}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white hover:bg-black hover:text-white border-2 border-black transition-colors shadow-[2px_2px_0_#000]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Optional Warning Banner if checkout requires address */}
        {requireAddressMsg && (
          <div className="bg-amber-100 border-b-2 border-amber-300 px-6 py-2.5 flex items-center gap-2 text-xs font-bold text-amber-900">
            <AlertCircle size={15} className="shrink-0 text-amber-700" />
            <span>{requireAddressMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-400 text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <Check size={16} className="shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {autoDetectNotice && (
            <div className="p-3.5 rounded-2xl bg-[#FFF8EE] border-2 border-[#E5A00D] text-amber-950 text-xs font-bold flex items-center gap-2 animate-pulse">
              <Sparkles size={16} className="shrink-0 text-[#E5A00D]" />
              <span>{autoDetectNotice}</span>
            </div>
          )}

          {/* VIEW: ADDRESS LIST */}
          {viewMode === "LIST" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-zinc-500">
                  Saved Addresses ({addresses.length})
                </span>
                <button
                  onClick={() => {
                    resetForm();
                    setViewMode("FORM");
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-black text-[#FFF8EE] hover:bg-[#E5A00D] hover:text-black font-outfit font-black text-xs uppercase tracking-wider border-2 border-black shadow-[2px_2px_0_#000] transition-all"
                >
                  <Plus size={14} />
                  <span>Add New</span>
                </button>
              </div>

              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-zinc-400">
                  <Loader2 size={28} className="animate-spin text-[#E5A00D]" />
                  <p className="text-xs font-bold">Loading addresses...</p>
                </div>
              ) : addresses.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border-2 border-dashed border-black/20 bg-[#FFF8EE]/60 space-y-3">
                  <MapPin size={32} className="mx-auto text-[#E5A00D]" />
                  <p className="font-outfit font-black text-base text-black">No delivery addresses saved yet</p>
                  <p className="text-xs text-zinc-600 font-medium">Add your address to enjoy fast, doorstep Dum Biryani and Artisan Bowl deliveries.</p>
                  <button
                    onClick={() => {
                      resetForm();
                      setViewMode("FORM");
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E5A00D] text-black font-outfit font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0_#000]"
                  >
                    <Plus size={14} />
                    <span>Add First Address</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => {
                    return (
                      <div
                        key={addr.id}
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                          addr.isDefault
                            ? "border-black bg-[#FFF8EE] shadow-[4px_4px_0_#000]"
                            : "border-black/20 bg-white hover:border-black shadow-sm"
                        }`}
                      >
                        <div
                          className="flex items-start gap-3 cursor-pointer flex-1 min-w-0"
                          onClick={() => {
                            if (onAddressSelected) {
                              onAddressSelected(addr);
                              onClose();
                            } else {
                              handleSetDefault(addr);
                            }
                          }}
                        >
                          <div className={`p-2 rounded-xl border-2 shrink-0 ${addr.isDefault ? "bg-[#E5A00D] border-black text-black" : "bg-zinc-100 border-zinc-300 text-zinc-600"}`}>
                            {addr.label?.toLowerCase() === "work" ? (
                              <Briefcase size={16} />
                            ) : addr.label?.toLowerCase() === "other" ? (
                              <Navigation size={16} />
                            ) : (
                              <Home size={16} />
                            )}
                          </div>

                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-outfit font-black text-sm uppercase tracking-wider text-black">
                                {addr.label || "Home"}
                              </span>
                              {addr.isDefault && (
                                <span className="px-2 py-0.5 rounded-full bg-black text-[#FFF8EE] text-[10px] font-black tracking-wider uppercase">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-800 font-semibold leading-relaxed">
                              {addr.address}, {addr.area}, {addr.city}, {addr.state} - {addr.pincode}
                            </p>
                            {addr.recipientName && (
                              <p className="text-[11px] text-zinc-500 font-medium">
                                Recipient: {addr.recipientName} ({addr.recipientPhone || "N/A"})
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          {!addr.isDefault && (
                            <button
                              onClick={() => handleSetDefault(addr)}
                              className="px-2.5 py-1 rounded-lg bg-white hover:bg-black hover:text-white border border-black text-[11px] font-bold transition-all shadow-[1px_1px_0_#000]"
                              title="Set as active delivery address"
                            >
                              Make Default
                            </button>
                          )}
                          <button
                            onClick={() => startEditing(addr)}
                            className="p-1.5 rounded-lg bg-white hover:bg-[#E5A00D] border border-black text-zinc-800 transition-colors shadow-[1px_1px_0_#000]"
                            title="Edit Address"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(addr.id)}
                            className="p-1.5 rounded-lg bg-white hover:bg-rose-500 hover:text-white border border-black text-zinc-800 transition-colors shadow-[1px_1px_0_#000]"
                            title="Remove Address"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* VIEW: ADD / EDIT ADDRESS FORM */}
          {viewMode === "FORM" && (
            <form onSubmit={handleSaveAddress} className="space-y-4">
              
              {/* GPS Auto-Detect Location Banner Button */}
              <button
                type="button"
                onClick={handleAutoDetectAddress}
                disabled={locating}
                className="w-full py-2.5 px-4 rounded-2xl bg-amber-100 hover:bg-[#E5A00D] text-black border-2 border-black font-outfit font-black text-xs uppercase tracking-wider shadow-[3px_3px_0_#000] hover:shadow-none transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {locating ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-black" />
                    <span>Detecting Exact GPS Coordinates & Address...</span>
                  </>
                ) : (
                  <>
                    <Crosshair size={16} className="group-hover:rotate-45 transition-transform text-black" />
                    <span>⚡ Auto-Detect & Fill Current Location</span>
                  </>
                )}
              </button>

              {/* Address Label Presets */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-zinc-700 block">
                  Address Type / Label
                </label>
                <div className="flex items-center gap-2">
                  {PRESET_LABELS.map((p) => {
                    const Icon = p.icon;
                    const isSelected = label.toLowerCase() === p.label.toLowerCase();
                    return (
                      <button
                        type="button"
                        key={p.label}
                        onClick={() => setLabel(p.label)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-outfit font-black uppercase tracking-wider border-2 transition-all ${
                          isSelected
                            ? "bg-[#E5A00D] text-black border-black shadow-[2px_2px_0_#000]"
                            : "bg-white text-zinc-700 border-black/20 hover:border-black"
                        }`}
                      >
                        <Icon size={14} />
                        <span>{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recipient Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-wider text-zinc-700">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8EE]/50 border-2 border-black/30 focus:border-black focus:bg-white text-xs font-bold outline-none transition-all shadow-inner"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-wider text-zinc-700">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8EE]/50 border-2 border-black/30 focus:border-black focus:bg-white text-xs font-bold outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Flat / Street Address */}
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-zinc-700">
                  Flat / House / Floor / Building <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="e.g. Flat 402, Royal Palms, Tower B"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8EE]/50 border-2 border-black/30 focus:border-black focus:bg-white text-xs font-bold outline-none transition-all shadow-inner"
                />
              </div>

              {/* Locality & Landmark */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-wider text-zinc-700">
                    Area / Locality <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g. Danavaipeta / Main Road"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8EE]/50 border-2 border-black/30 focus:border-black focus:bg-white text-xs font-bold outline-none transition-all shadow-inner"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-wider text-zinc-700">
                    Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g. Near Kotipalli Bus Stand"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8EE]/50 border-2 border-black/30 focus:border-black focus:bg-white text-xs font-bold outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* State & City Dynamic Dropdowns + Pincode */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* State Selection */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-zinc-700">
                      State <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setCustomStateMode(!customStateMode)}
                      className="text-[10px] font-bold text-amber-700 hover:underline"
                    >
                      {customStateMode ? "Select list" : "Type custom"}
                    </button>
                  </div>

                  {customStateMode ? (
                    <input
                      type="text"
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="Enter State"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#FFF8EE]/50 border-2 border-black/30 focus:border-black focus:bg-white text-xs font-bold outline-none transition-all"
                    />
                  ) : (
                    <select
                      value={state}
                      onChange={(e) => handleStateChange(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#FFF8EE]/50 border-2 border-black/30 focus:border-black focus:bg-white text-xs font-bold outline-none transition-all cursor-pointer"
                    >
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                      <option value="__OTHER__">+ Other State / UT</option>
                    </select>
                  )}
                </div>

                {/* City Selection */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-zinc-700">
                      City <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setCustomCityMode(!customCityMode)}
                      className="text-[10px] font-bold text-amber-700 hover:underline"
                    >
                      {customCityMode ? "Select list" : "Type custom"}
                    </button>
                  </div>

                  {customCityMode || availableCities.length === 0 ? (
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Enter City"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#FFF8EE]/50 border-2 border-black/30 focus:border-black focus:bg-white text-xs font-bold outline-none transition-all"
                    />
                  ) : (
                    <select
                      value={city}
                      onChange={(e) => {
                        if (e.target.value === "__OTHER_CITY__") {
                          setCustomCityMode(true);
                          setCity("");
                        } else {
                          setCity(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#FFF8EE]/50 border-2 border-black/30 focus:border-black focus:bg-white text-xs font-bold outline-none transition-all cursor-pointer"
                    >
                      {availableCities.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="__OTHER_CITY__">+ Other City</option>
                    </select>
                  )}
                </div>

                {/* Pincode */}
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-wider text-zinc-700">
                    Pincode <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                    placeholder="533101"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#FFF8EE]/50 border-2 border-black/30 focus:border-black focus:bg-white text-xs font-bold outline-none transition-all font-mono"
                  />
                </div>
              </div>

              {/* Default Address Checkbox */}
              <div className="pt-1 flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="set-default-check"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="h-4 w-4 rounded border-2 border-black accent-[#E5A00D] cursor-pointer"
                />
                <label
                  htmlFor="set-default-check"
                  className="text-xs font-bold text-zinc-800 cursor-pointer select-none"
                >
                  Set as my primary delivery address
                </label>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-3 border-t-2 border-black/10 flex items-center justify-between gap-3">
                {addresses.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setViewMode("LIST");
                    }}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-100 border-2 border-black font-outfit font-black text-xs uppercase tracking-wider text-black transition-all"
                  >
                    Back to List
                  </button>
                ) : <div />}

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-black text-[#E5A00D] hover:bg-[#E5A00D] hover:text-black font-outfit font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0_#000] hover:shadow-none transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving Address...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>{editingAddressId ? "Save Changes" : "Save & Use Address"}</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
}

export default AddressModal;
