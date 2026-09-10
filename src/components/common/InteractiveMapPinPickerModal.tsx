"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin,
  Bike,
  Utensils,
  X,
  Check,
  Navigation,
  ExternalLink,
  Plus,
  Minus,
  RotateCcw,
  Loader2,
  AlertCircle,
  Crosshair,
  Search,
} from "lucide-react";

interface InteractiveMapPinPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialKitchenLat?: number;
  initialKitchenLng?: number;
  initialKitchenAddress?: string;
  onLocationSaved?: (newLat: number, newLng: number, address: string) => void;
}

type PinTarget = "KITCHEN" | "CUSTOMER" | "RIDER";

export default function InteractiveMapPinPickerModal({
  isOpen,
  onClose,
  initialKitchenLat = 17.0605,
  initialKitchenLng = 81.8640,
  initialKitchenAddress = "The Q Bowl, Bridge County, Canteen, Rajanagaram, Velugubanda, Andhra Pradesh 533296",
  onLocationSaved,
}: InteractiveMapPinPickerModalProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const kitchenMarkerRef = useRef<L.Marker | null>(null);
  const customerMarkerRef = useRef<L.Marker | null>(null);
  const riderMarkerRef = useRef<L.Marker | null>(null);

  // Active target mode being adjusted
  const [activeTarget, setActiveTarget] = useState<PinTarget>("KITCHEN");
  const [mapLayerType, setMapLayerType] = useState<"roadmap" | "satellite">("roadmap");

  // Coordinate States
  const [kitchenCoords, setKitchenCoords] = useState<{ lat: number; lng: number }>({
    lat: initialKitchenLat,
    lng: initialKitchenLng,
  });
  const [customerCoords, setCustomerCoords] = useState<{ lat: number; lng: number }>({
    lat: 17.0620,
    lng: 81.8660,
  });
  const [riderCoords, setRiderCoords] = useState<{ lat: number; lng: number }>({
    lat: 17.0610,
    lng: 81.8650,
  });

  const [kitchenAddress, setKitchenAddress] = useState(initialKitchenAddress);
  const [coordInput, setCoordInput] = useState(`${initialKitchenLat.toFixed(6)}, ${initialKitchenLng.toFixed(6)}`);
  const [reverseAddressInfo, setReverseAddressInfo] = useState<string | null>(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Helper for Google Maps tile URL
  const getGoogleTileUrl = (type: "roadmap" | "satellite") => {
    return type === "satellite"
      ? "https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
      : "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";
  };

  const toggleMapLayer = (type: "roadmap" | "satellite") => {
    setMapLayerType(type);
    if (tileLayerRef.current) {
      tileLayerRef.current.setUrl(getGoogleTileUrl(type));
    }
  };

  // Reverse geocode when pin moves
  const fetchAddressForCoords = async (lat: number, lng: number) => {
    try {
      setIsReverseGeocoding(true);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        {
          headers: { "Accept-Language": "en" },
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.display_name) {
          setReverseAddressInfo(data.display_name);
        }
      }
    } catch {
      // Ignore geocode failure
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // Update pin position
  const updateActivePinPosition = (lat: number, lng: number) => {
    setCoordInput(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    fetchAddressForCoords(lat, lng);

    if (activeTarget === "KITCHEN") {
      setKitchenCoords({ lat, lng });
      if (kitchenMarkerRef.current) kitchenMarkerRef.current.setLatLng([lat, lng]);
    } else if (activeTarget === "CUSTOMER") {
      setCustomerCoords({ lat, lng });
      if (customerMarkerRef.current) customerMarkerRef.current.setLatLng([lat, lng]);
    } else {
      setRiderCoords({ lat, lng });
      if (riderMarkerRef.current) riderMarkerRef.current.setLatLng([lat, lng]);
    }
  };

  // Handle manual coordinate input jump
  const handleApplyCoordinates = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    const parts = coordInput.split(",").map((s) => parseFloat(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      const lat = parts[0];
      const lng = parts[1];
      updateActivePinPosition(lat, lng);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([lat, lng], 18, { animate: true });
      }
    } else {
      setErrorMsg("Please enter coordinates in format: 17.0605, 81.8640");
    }
  };

  // Save Kitchen to DB
  const handleSaveKitchenLocation = async () => {
    try {
      setIsSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const res = await fetch("/api/kitchen/update-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: kitchenCoords.lat,
          lng: kitchenCoords.lng,
          name: kitchenAddress,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg("✅ Cloud Kitchen Location updated successfully in database!");
        if (onLocationSaved) {
          onLocationSaved(kitchenCoords.lat, kitchenCoords.lng, kitchenAddress);
        }
        setTimeout(() => {
          setSuccessMsg(null);
        }, 4000);
      } else {
        setErrorMsg(data.error || "Failed to update location");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error updating location");
    } finally {
      setIsSaving(false);
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([kitchenCoords.lat, kitchenCoords.lng], 16);

    // Google Maps High-Res Tiles
    const googleTiles = L.tileLayer(getGoogleTileUrl(mapLayerType), {
      maxZoom: 20,
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
      attribution: "&copy; Google Maps",
    }).addTo(map);
    tileLayerRef.current = googleTiles;

    // Custom Icon Helpers
    const createKitchenIcon = () =>
      L.divIcon({
        className: "custom-pin-kitchen",
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: grab;">
            <div style="width: 40px; height: 40px; background: #000; border: 3px solid #E5A00D; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.7); z-index: 10;">
              <span style="font-size: 19px;">🍲</span>
            </div>
            <div style="background: #E5A00D; color: #000; font-size: 11px; font-weight: 900; padding: 2px 8px; border-radius: 6px; margin-top: 3px; white-space: nowrap; border: 1.5px solid #000; box-shadow: 0 2px 6px rgba(0,0,0,0.4);">
              Cloud Kitchen Pin
            </div>
          </div>
        `,
        iconSize: [110, 60],
        iconAnchor: [55, 30],
      });

    const createCustomerIcon = () =>
      L.divIcon({
        className: "custom-pin-customer",
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: grab;">
            <div style="width: 38px; height: 38px; background: #EA4335; border: 3px solid #FFF; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(234,67,53,0.7); z-index: 10;">
              <span style="font-size: 18px;">🏠</span>
            </div>
            <div style="background: #1A73E8; color: #FFF; font-size: 11px; font-weight: 900; padding: 2px 8px; border-radius: 6px; margin-top: 3px; white-space: nowrap; border: 1.5px solid #FFF; box-shadow: 0 2px 6px rgba(0,0,0,0.4);">
              Customer Drop
            </div>
          </div>
        `,
        iconSize: [100, 60],
        iconAnchor: [50, 30],
      });

    const createRiderIcon = () =>
      L.divIcon({
        className: "custom-pin-rider",
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: grab;">
            <div style="width: 38px; height: 38px; background: #059669; border: 3px solid #FFF; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(5,150,105,0.7); z-index: 10;">
              <span style="font-size: 18px;">🛵</span>
            </div>
            <div style="background: #059669; color: #FFF; font-size: 11px; font-weight: 900; padding: 2px 8px; border-radius: 6px; margin-top: 3px; white-space: nowrap; border: 1.5px solid #FFF; box-shadow: 0 2px 6px rgba(0,0,0,0.4);">
              Delivery Boy
            </div>
          </div>
        `,
        iconSize: [90, 60],
        iconAnchor: [45, 30],
      });

    // Add Kitchen Marker (Draggable)
    kitchenMarkerRef.current = L.marker([kitchenCoords.lat, kitchenCoords.lng], {
      icon: createKitchenIcon(),
      draggable: true,
    })
      .addTo(map)
      .bindPopup("<b>Cloud Kitchen</b><br>Drag me to exact building");

    kitchenMarkerRef.current.on("dragend", (e: any) => {
      const { lat, lng } = e.target.getLatLng();
      setActiveTarget("KITCHEN");
      updateActivePinPosition(lat, lng);
    });

    // Add Customer Marker (Draggable)
    customerMarkerRef.current = L.marker([customerCoords.lat, customerCoords.lng], {
      icon: createCustomerIcon(),
      draggable: true,
    })
      .addTo(map)
      .bindPopup("<b>Customer Drop Point</b><br>Drag me to customer address");

    customerMarkerRef.current.on("dragend", (e: any) => {
      const { lat, lng } = e.target.getLatLng();
      setActiveTarget("CUSTOMER");
      updateActivePinPosition(lat, lng);
    });

    // Add Rider Marker (Draggable)
    riderMarkerRef.current = L.marker([riderCoords.lat, riderCoords.lng], {
      icon: createRiderIcon(),
      draggable: true,
    })
      .addTo(map)
      .bindPopup("<b>Delivery Boy Location</b><br>Drag me to rider position");

    riderMarkerRef.current.on("dragend", (e: any) => {
      const { lat, lng } = e.target.getLatLng();
      setActiveTarget("RIDER");
      updateActivePinPosition(lat, lng);
    });

    // Click anywhere on map to move the active pin
    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      updateActivePinPosition(lat, lng);
    });

    mapInstanceRef.current = map;

    return () => {
      try {
        map.remove();
      } catch {
        // ignore
      }
      mapInstanceRef.current = null;
      kitchenMarkerRef.current = null;
      customerMarkerRef.current = null;
      riderMarkerRef.current = null;
      tileLayerRef.current = null;
      if (mapContainerRef.current) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }
    };
  }, [isOpen]);

  // When active target changes, center map on that pin
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    let targetCoords = kitchenCoords;
    if (activeTarget === "CUSTOMER") targetCoords = customerCoords;
    if (activeTarget === "RIDER") targetCoords = riderCoords;

    setCoordInput(`${targetCoords.lat.toFixed(6)}, ${targetCoords.lng.toFixed(6)}`);
    mapInstanceRef.current.setView([targetCoords.lat, targetCoords.lng], 17, { animate: true });
  }, [activeTarget]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white border-3 border-black w-full max-w-5xl rounded-3xl shadow-[10px_10px_0_#000] overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#FFF8EE] border-b-3 border-black flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-black text-[#E5A00D] border-2 border-black flex items-center justify-center font-bold shadow-[2px_2px_0_#E5A00D]">
              <MapPin size={22} />
            </div>
            <div>
              <h3 className="font-outfit font-black text-lg sm:text-xl uppercase tracking-tight text-black">
                Interactive Pin Dropper &amp; Location Selector
              </h3>
              <p className="text-xs font-semibold text-zinc-600">
                Click anywhere on the map or drag pins to set exact spot for Kitchen, Customer, or Driver.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white hover:bg-black hover:text-white border-2 border-black transition-colors shadow-[2px_2px_0_#000]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Target Switcher & Coordinate Bar */}
        <div className="p-3 sm:p-4 bg-zinc-100 border-b-2 border-black/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* 3 Selectable Pin Targets */}
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border-2 border-black shadow-[2px_2px_0_#000]">
            <button
              type="button"
              onClick={() => setActiveTarget("KITCHEN")}
              className={`px-3 py-1.5 rounded-xl font-outfit font-black uppercase text-xs flex items-center gap-1.5 transition-all ${
                activeTarget === "KITCHEN"
                  ? "bg-black text-[#E5A00D] shadow-sm"
                  : "text-zinc-600 hover:text-black"
              }`}
            >
              <span>🍲</span>
              <span>Cloud Kitchen</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTarget("CUSTOMER")}
              className={`px-3 py-1.5 rounded-xl font-outfit font-black uppercase text-xs flex items-center gap-1.5 transition-all ${
                activeTarget === "CUSTOMER"
                  ? "bg-black text-rose-400 shadow-sm"
                  : "text-zinc-600 hover:text-black"
              }`}
            >
              <span>🏠</span>
              <span>Customer Drop</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTarget("RIDER")}
              className={`px-3 py-1.5 rounded-xl font-outfit font-black uppercase text-xs flex items-center gap-1.5 transition-all ${
                activeTarget === "RIDER"
                  ? "bg-black text-emerald-400 shadow-sm"
                  : "text-zinc-600 hover:text-black"
              }`}
            >
              <span>🛵</span>
              <span>Delivery Boy</span>
            </button>
          </div>

          {/* Coordinate Quick Jump Form */}
          <form onSubmit={handleApplyCoordinates} className="flex items-center gap-2 flex-1 sm:max-w-md">
            <div className="relative flex-1">
              <input
                type="text"
                value={coordInput}
                onChange={(e) => setCoordInput(e.target.value)}
                placeholder="Lat, Lng (e.g. 17.0605, 81.8640)"
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border-2 border-black bg-white font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#E5A00D]"
              />
              <Crosshair size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-black text-[#E5A00D] hover:bg-[#E5A00D] hover:text-black font-outfit font-black text-xs uppercase tracking-wider border-2 border-black shadow-[2px_2px_0_#000] transition-all shrink-0"
            >
              Locate Pin
            </button>
          </form>
        </div>

        {/* Map View Canvas */}
        <div className="relative w-full flex-1 min-h-[380px] sm:min-h-[460px] bg-zinc-950">
          <div ref={mapContainerRef} className="w-full h-full min-h-[380px] sm:min-h-[460px]" />

          {/* Floating Instructions Banner */}
          <div className="absolute top-3 left-3 z-[400] max-w-sm sm:max-w-md bg-black/90 backdrop-blur-md text-white border-2 border-white/20 p-2.5 sm:px-4 sm:py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs">
            <div className="h-7 w-7 rounded-xl bg-[#E5A00D] text-black flex items-center justify-center font-bold shrink-0">
              {activeTarget === "KITCHEN" ? "🍲" : activeTarget === "CUSTOMER" ? "🏠" : "🛵"}
            </div>
            <div>
              <p className="font-outfit font-black uppercase text-[11px] text-[#E5A00D]">
                Moving {activeTarget === "KITCHEN" ? "Cloud Kitchen Pin" : activeTarget === "CUSTOMER" ? "Customer Drop Pin" : "Delivery Boy Pin"}
              </p>
              <p className="text-[10px] text-zinc-300 font-semibold leading-tight">
                Click anywhere on the map or drag the pin directly onto the building/gate.
              </p>
            </div>
          </div>

          {/* Google Maps Layer Switcher [Map | Satellite] */}
          <div className="absolute top-3 right-3 z-[400] bg-white/95 backdrop-blur-md p-1 rounded-2xl border-2 border-black shadow-[3px_3px_0_#000] flex items-center gap-1">
            <button
              type="button"
              onClick={() => toggleMapLayer("roadmap")}
              className={`px-3 py-1 rounded-xl text-xs font-outfit font-black uppercase transition-all ${
                mapLayerType === "roadmap"
                  ? "bg-black text-[#E5A00D] shadow-sm"
                  : "text-zinc-600 hover:text-black"
              }`}
            >
              🗺️ Map
            </button>
            <button
              type="button"
              onClick={() => toggleMapLayer("satellite")}
              className={`px-3 py-1 rounded-xl text-xs font-outfit font-black uppercase transition-all ${
                mapLayerType === "satellite"
                  ? "bg-black text-[#E5A00D] shadow-sm"
                  : "text-zinc-600 hover:text-black"
              }`}
            >
              🛰️ Satellite
            </button>
          </div>

          {/* Zoom Buttons */}
          <div className="absolute bottom-3 right-3 z-[400] flex flex-col gap-2">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl border-2 border-black shadow-[3px_3px_0_#000] overflow-hidden flex flex-col divide-y divide-black/20">
              <button
                type="button"
                onClick={() => mapInstanceRef.current?.zoomIn()}
                title="Zoom In"
                className="h-9 w-9 flex items-center justify-center text-black hover:bg-zinc-100 transition-colors"
              >
                <Plus size={16} className="stroke-[3]" />
              </button>
              <button
                type="button"
                onClick={() => mapInstanceRef.current?.zoomOut()}
                title="Zoom Out"
                className="h-9 w-9 flex items-center justify-center text-black hover:bg-zinc-100 transition-colors"
              >
                <Minus size={16} className="stroke-[3]" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.setView([kitchenCoords.lat, kitchenCoords.lng], 18, { animate: true });
                }
              }}
              title="Center on Kitchen"
              className="h-10 w-10 rounded-2xl bg-black text-[#E5A00D] border-2 border-black shadow-[3px_3px_0_#000] flex items-center justify-center hover:bg-[#E5A00D] hover:text-black transition-all"
            >
              <Crosshair size={18} />
            </button>
          </div>
        </div>

        {/* Footer with Selected Coordinates and Save Button */}
        <div className="p-4 sm:p-5 bg-white border-t-3 border-black flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="font-outfit font-black text-xs uppercase px-2 py-0.5 rounded-md bg-black text-[#E5A00D]">
                Current Pin: {kitchenCoords.lat.toFixed(6)}, {kitchenCoords.lng.toFixed(6)}
              </span>
              {isReverseGeocoding && <span className="text-[10px] text-zinc-400 font-bold flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Resolving address...</span>}
            </div>
            <p className="text-xs font-semibold text-zinc-800 leading-relaxed truncate">
              {reverseAddressInfo || kitchenAddress}
            </p>
            {successMsg && <p className="text-xs font-black text-emerald-700">{successMsg}</p>}
            {errorMsg && <p className="text-xs font-black text-rose-600">{errorMsg}</p>}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${kitchenCoords.lat},${kitchenCoords.lng}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-2xl border-2 border-black bg-zinc-100 hover:bg-black hover:text-white font-outfit font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-[2px_2px_0_#000]"
            >
              <ExternalLink size={14} />
              <span>Verify on Google Maps</span>
            </a>

            <button
              type="button"
              onClick={handleSaveKitchenLocation}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-2xl border-2 border-black bg-black text-[#E5A00D] hover:bg-[#E5A00D] hover:text-black font-outfit font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[3px_3px_0_#000] disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={16} />}
              <span>Save Kitchen Pin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
