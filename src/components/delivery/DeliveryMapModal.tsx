"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Navigation, Phone, MapPin, X, ExternalLink, Compass, Plus, Minus } from "lucide-react";

interface DeliveryMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerLat?: number;
  customerLng?: number;
  orderIdDisplay: string;
  mealName: string;
}

export default function DeliveryMapModal({
  isOpen,
  onClose,
  customerName,
  customerPhone,
  customerAddress,
  customerLat = 17.0521416,
  customerLng = 81.8677663,
  orderIdDisplay,
  mealName,
}: DeliveryMapModalProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const riderMarkerRef = useRef<L.Marker | null>(null);
  const [riderCoords, setRiderCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceKm, setDistanceKm] = useState<string>("0");
  const [etaMins, setEtaMins] = useState<number>(10);
  const [mapLayerType, setMapLayerType] = useState<"roadmap" | "satellite">("roadmap");

  // Get live GPS position of delivery driver
  useEffect(() => {
    if (!isOpen) return;

    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setRiderCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          console.warn("Geolocation warning:", err.message);
          // Default near Bridge County kitchen hub
          setRiderCoords({ lat: 17.0521416, lng: 81.8677663 });
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setRiderCoords({ lat: 17.0521416, lng: 81.8677663 });
    }
  }, [isOpen]);

  // Calculate distance & ETA
  useEffect(() => {
    if (!riderCoords) return;
    const lat1 = riderCoords.lat;
    const lon1 = riderCoords.lng;
    const lat2 = customerLat;
    const lon2 = customerLng;

    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = Math.max(0.2, Number((R * c).toFixed(1)));
    setDistanceKm(dist.toString());
    setEtaMins(Math.max(3, Math.round(dist * 2.5 + 2)));
  }, [riderCoords, customerLat, customerLng]);

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

  // Mount Leaflet Map
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const currentRiderLat = riderCoords?.lat || 17.0605;
    const currentRiderLng = riderCoords?.lng || 81.8640;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([customerLat, customerLng], 15);

    // Google Maps High-Resolution Tiles
    const googleTiles = L.tileLayer(getGoogleTileUrl(mapLayerType), {
      maxZoom: 20,
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
      attribution: "&copy; Google Maps",
    }).addTo(map);
    tileLayerRef.current = googleTiles;

    // Rider Icon
    const riderIcon = L.divIcon({
      className: "delivery-rider-pin",
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 44px; height: 44px; background: rgba(66, 133, 244, 0.4); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 38px; height: 38px; background: #000; border: 3px solid #E5A00D; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.6); z-index: 10;">
            <span style="font-size: 19px;">🛵</span>
          </div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    // Customer House Icon
    const customerIcon = L.divIcon({
      className: "customer-dest-pin",
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
          <div style="width: 36px; height: 36px; background: #EA4335; border: 3px solid #FFF; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(234,67,53,0.6); z-index: 10;">
            <span style="font-size: 17px;">🏠</span>
          </div>
          <div style="background: #1A73E8; color: #FFF; font-size: 10px; font-weight: 900; padding: 2px 8px; border-radius: 6px; margin-top: 3px; white-space: nowrap; border: 1.5px solid #FFF; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
            Customer Destination
          </div>
        </div>
      `,
      iconSize: [80, 56],
      iconAnchor: [40, 28],
    });

    const mCustomer = L.marker([customerLat, customerLng], { icon: customerIcon })
      .addTo(map)
      .bindPopup(`<b>${customerName}</b><br>${customerAddress}`);

    riderMarkerRef.current = L.marker([currentRiderLat, currentRiderLng], { icon: riderIcon })
      .addTo(map)
      .bindPopup("<b>You are here</b><br>Live Rider Location");

    // Route lines in Google Blue Navigation style
    L.polyline(
      [
        [currentRiderLat, currentRiderLng],
        [customerLat, customerLng],
      ],
      {
        color: "#1A73E8",
        weight: 8,
        opacity: 0.3,
      }
    ).addTo(map);

    L.polyline(
      [
        [currentRiderLat, currentRiderLng],
        [customerLat, customerLng],
      ],
      {
        color: "#4285F4",
        weight: 5,
        opacity: 0.95,
        dashArray: "8, 8",
      }
    ).addTo(map);

    const group = L.featureGroup([mCustomer, riderMarkerRef.current]);
    const bounds = group.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.3));
    }

    mapInstanceRef.current = map;

    return () => {
      try {
        map.remove();
      } catch {
        // ignore
      }
      mapInstanceRef.current = null;
      riderMarkerRef.current = null;
      tileLayerRef.current = null;
      if (mapContainerRef.current) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }
    };
  }, [isOpen, customerLat, customerLng, riderCoords, customerName, customerAddress]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white border-3 border-black w-full max-w-4xl rounded-3xl shadow-[8px_8px_0_#000] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#FFF8EE] border-b-3 border-black flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-black text-[#E5A00D] border-2 border-black flex items-center justify-center font-bold shadow-[2px_2px_0_#E5A00D]">
              <Navigation size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-outfit font-black text-lg sm:text-xl uppercase text-black">
                  Navigate To Customer
                </span>
                <span className="px-2 py-0.5 rounded-full bg-black text-[#E5A00D] font-mono font-black text-xs">
                  {orderIdDisplay}
                </span>
              </div>
              <p className="text-xs font-semibold text-zinc-600">
                {mealName} • Distance: ~{distanceKm} km • ETA: ~{etaMins} mins
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

        {/* Live Interactive Map */}
        <div className="relative w-full flex-1 min-h-[380px] sm:min-h-[440px] bg-zinc-900">
          <div ref={mapContainerRef} className="w-full h-full min-h-[380px] sm:min-h-[440px]" />

          {/* Quick HUD */}
          <div className="absolute top-3 left-3 z-[400] bg-black/90 backdrop-blur-md text-white border-2 border-white/20 px-3.5 py-2 rounded-2xl text-xs font-outfit font-black uppercase flex items-center gap-2 shadow-xl">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Turn-by-Turn Drop Route Active</span>
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
          </div>
        </div>

        {/* Customer Info & Action Footer */}
        <div className="p-4 sm:p-5 bg-white border-t-3 border-black flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-outfit font-black text-base text-black">{customerName}</span>
              <span className="text-xs text-zinc-500 font-bold">• Drop-off Point</span>
            </div>
            <p className="text-xs font-semibold text-zinc-700 flex items-start gap-1.5 max-w-xl">
              <MapPin size={14} className="text-rose-600 shrink-0 mt-0.5" />
              <span>{customerAddress}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {customerPhone && (
              <a
                href={`tel:${customerPhone}`}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl border-2 border-black bg-[#FFF8EE] hover:bg-black hover:text-white font-outfit font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[2px_2px_0_#000]"
              >
                <Phone size={14} className="text-[#E5A00D]" />
                <span>Call ({customerPhone})</span>
              </a>
            )}

            <a
              href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent("The Q Bowl, Bridge County, Canteen, Rajanagaram, Velugubanda, Andhra Pradesh 533296")}&destination=${customerLat},${customerLng}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-2xl border-2 border-black bg-black text-[#E5A00D] hover:bg-[#E5A00D] hover:text-black font-outfit font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[2px_2px_0_#000]"
            >
              <ExternalLink size={14} />
              <span>Google Maps Turn-by-Turn</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
