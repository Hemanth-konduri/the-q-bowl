"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import dynamic from "next/dynamic";
import { Bike, MapPin, Compass, Layers, ExternalLink, Plus, Minus, Navigation } from "lucide-react";

const InteractiveMapPinPickerModal = dynamic(
  () => import("@/components/common/InteractiveMapPinPickerModal"),
  { ssr: false }
);

interface LiveTrackingMapProps {
  // Rider coords
  driverLat?: number | null;
  driverLng?: number | null;
  driverName?: string;
  driverPhone?: string;
  // Customer coords & address
  customerLat?: number | null;
  customerLng?: number | null;
  customerAddress?: string;
  customerArea?: string;
  // Kitchen coords (origin)
  kitchenLat?: number;
  kitchenLng?: number;
  orderStatus: string;
  compact?: boolean;
}

export default function LiveTrackingMap({
  driverLat,
  driverLng,
  driverName = "Express Delivery Partner",
  driverPhone = "",
  customerLat,
  customerLng,
  customerAddress = "Customer Location",
  customerArea = "Delivery Destination",
  kitchenLat = 17.0521416, // Exact Bridge County Canteen location
  kitchenLng = 81.8677663,
  orderStatus,
  compact = false,
}: LiveTrackingMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const customerMarkerRef = useRef<L.Marker | null>(null);
  const kitchenMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const routeCasingRef = useRef<L.Polyline | null>(null);

  // Pin picker modal state & dynamic kitchen coords
  const [isPinPickerOpen, setIsPinPickerOpen] = useState(false);
  const [activeKitchenLat, setActiveKitchenLat] = useState(kitchenLat);
  const [activeKitchenLng, setActiveKitchenLng] = useState(kitchenLng);

  // Fetch live persisted kitchen location from database on mount
  useEffect(() => {
    fetch("/api/kitchen/update-location")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.kitchen?.lat && d?.kitchen?.lng) {
          setActiveKitchenLat(d.kitchen.lat);
          setActiveKitchenLng(d.kitchen.lng);
        }
      })
      .catch(() => {});
  }, []);

  // Map layer type: 'roadmap' (Google Streets) or 'satellite' (Google Hybrid Satellite)
  const [mapLayerType, setMapLayerType] = useState<"roadmap" | "satellite">("roadmap");

  // Fallback / default coordinates if driver coords not yet emitted
  const effectiveCustLat = customerLat || activeKitchenLat;
  const effectiveCustLng = customerLng || activeKitchenLng;
  
  // If driver has not reported GPS yet, position them near kitchen towards customer
  const effectiveDriverLat = driverLat || (activeKitchenLat + (effectiveCustLat - activeKitchenLat) * 0.45);
  const effectiveDriverLng = driverLng || (activeKitchenLng + (effectiveCustLng - activeKitchenLng) * 0.45);

  const [etaMinutes, setEtaMinutes] = useState<number>(12);
  const [distanceKm, setDistanceKm] = useState<string>("2.4");

  // Calculate distance between driver and customer
  useEffect(() => {
    function getDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
      const R = 6371; // Radius of earth in km
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }

    const dist = getDistanceInKm(
      effectiveDriverLat,
      effectiveDriverLng,
      effectiveCustLat,
      effectiveCustLng
    );

    const km = Math.max(0.3, Number(dist.toFixed(1)));
    setDistanceKm(km.toString());
    // Approx 25 km/h city bike speed -> ~2.4 mins per km + 3 min buffer
    const mins = Math.max(4, Math.round(km * 2.5 + 3));
    setEtaMinutes(mins);
  }, [effectiveDriverLat, effectiveDriverLng, effectiveCustLat, effectiveCustLng]);

  // Helper to get Google Maps tile URL
  const getGoogleTileUrl = (type: "roadmap" | "satellite") => {
    return type === "satellite"
      ? "https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" // Google Hybrid Satellite + Roads
      : "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"; // Google Roads
  };

  // Switch between Google Roads & Google Satellite
  const toggleMapLayer = (type: "roadmap" | "satellite") => {
    setMapLayerType(type);
    if (tileLayerRef.current) {
      tileLayerRef.current.setUrl(getGoogleTileUrl(type));
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Cleanup previous map instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Initialize Leaflet map
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([effectiveDriverLat, effectiveDriverLng], 15);

    // Google Maps High-Resolution Tiles (Zero API key needed, authentic Google road & satellite styling)
    const googleTiles = L.tileLayer(getGoogleTileUrl(mapLayerType), {
      maxZoom: 20,
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
      attribution: "&copy; Google Maps",
    }).addTo(map);
    tileLayerRef.current = googleTiles;

    // Custom Icon Creators
    const createDriverIcon = () =>
      L.divIcon({
        className: "custom-driver-pin",
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 44px; height: 44px; background: rgba(66, 133, 244, 0.4); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 38px; height: 38px; background: #000000; border: 3px solid #E5A00D; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.6); z-index: 10;">
              <span style="font-size: 19px;">🛵</span>
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

    const createCustomerIcon = () =>
      L.divIcon({
        className: "custom-customer-pin",
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
            <div style="width: 34px; height: 34px; background: #EA4335; border: 3px solid #FFFFFF; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(234,67,53,0.6); z-index: 10;">
              <span style="font-size: 16px;">🏠</span>
            </div>
            <div style="background: #1A73E8; color: #FFFFFF; font-size: 10px; font-weight: 900; padding: 2px 7px; border-radius: 6px; margin-top: 3px; white-space: nowrap; border: 1.5px solid #FFFFFF; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
              Delivery Drop
            </div>
          </div>
        `,
        iconSize: [60, 52],
        iconAnchor: [30, 26],
      });

    const createKitchenIcon = () =>
      L.divIcon({
        className: "custom-kitchen-pin",
        html: `
          <div style="width: 32px; height: 32px; background: #1A73E8; border: 2.5px solid #FFFFFF; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 10px rgba(26,115,232,0.6);">
            <span style="font-size: 15px;">🍲</span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

    // Add Kitchen Marker
    kitchenMarkerRef.current = L.marker([activeKitchenLat, activeKitchenLng], {
      icon: createKitchenIcon(),
    })
      .addTo(map)
      .bindPopup("<b>The Q Bowl Cloud Kitchen</b><br>The Q Bowl, Bridge County, Canteen, Rajanagaram, Velugubanda, AP 533296");

    // Add Customer Marker
    customerMarkerRef.current = L.marker([effectiveCustLat, effectiveCustLng], {
      icon: createCustomerIcon(),
    })
      .addTo(map)
      .bindPopup(`<b>Destination</b><br>${customerAddress}`);

    // Add Driver Marker
    driverMarkerRef.current = L.marker([effectiveDriverLat, effectiveDriverLng], {
      icon: createDriverIcon(),
    })
      .addTo(map)
      .bindPopup(`<b>${driverName}</b><br>🛵 Live Delivery Partner`);

    // Draw Google Navigation Blue Route Polyline
    const routePoints: [number, number][] = [
      [activeKitchenLat, activeKitchenLng],
      [effectiveDriverLat, effectiveDriverLng],
      [effectiveCustLat, effectiveCustLng],
    ];

    // Casing line (soft shadow)
    routeCasingRef.current = L.polyline(routePoints, {
      color: "#1A73E8",
      weight: 8,
      opacity: 0.3,
    }).addTo(map);

    // Inner bright blue Google navigation line
    routePolylineRef.current = L.polyline(routePoints, {
      color: "#4285F4",
      weight: 5,
      opacity: 0.95,
      dashArray: "8, 8",
    }).addTo(map);

    // Fit Bounds safely so both driver and customer are framed
    const group = L.featureGroup([
      kitchenMarkerRef.current,
      customerMarkerRef.current,
      driverMarkerRef.current,
    ]);
    const bounds = group.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.2));
    }

    mapInstanceRef.current = map;

    return () => {
      try {
        map.remove();
      } catch {
        // ignore Leaflet cleanup errors
      }
      mapInstanceRef.current = null;
      kitchenMarkerRef.current = null;
      customerMarkerRef.current = null;
      driverMarkerRef.current = null;
      routePolylineRef.current = null;
      routeCasingRef.current = null;
      tileLayerRef.current = null;
      if (mapContainerRef.current) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }
    };
  }, [activeKitchenLat, activeKitchenLng, customerAddress]);

  // Update dynamic markers when coordinates update
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (kitchenMarkerRef.current && (kitchenMarkerRef.current as any)._map) {
      try {
        kitchenMarkerRef.current.setLatLng([activeKitchenLat, activeKitchenLng]);
      } catch {
        // safety guard against _leaflet_pos
      }
    }
    if (driverMarkerRef.current && (driverMarkerRef.current as any)._map) {
      try {
        driverMarkerRef.current.setLatLng([effectiveDriverLat, effectiveDriverLng]);
      } catch {
        // safety guard against _leaflet_pos
      }
    }
    if (customerMarkerRef.current && (customerMarkerRef.current as any)._map) {
      try {
        customerMarkerRef.current.setLatLng([effectiveCustLat, effectiveCustLng]);
      } catch {
        // safety guard against _leaflet_pos
      }
    }
    if (routePolylineRef.current && (routePolylineRef.current as any)._map) {
      try {
        routePolylineRef.current.setLatLngs([
          [activeKitchenLat, activeKitchenLng],
          [effectiveDriverLat, effectiveDriverLng],
          [effectiveCustLat, effectiveCustLng],
        ]);
      } catch {
        // safety guard
      }
    }
    if (routeCasingRef.current && (routeCasingRef.current as any)._map) {
      try {
        routeCasingRef.current.setLatLngs([
          [activeKitchenLat, activeKitchenLng],
          [effectiveDriverLat, effectiveDriverLng],
          [effectiveCustLat, effectiveCustLng],
        ]);
      } catch {
        // safety guard
      }
    }
  }, [effectiveDriverLat, effectiveDriverLng, effectiveCustLat, effectiveCustLng, activeKitchenLat, activeKitchenLng]);

  const recenterOnDriver = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([effectiveDriverLat, effectiveDriverLng], 16, {
        animate: true,
      });
    }
  };

  const fitAll = () => {
    if (mapInstanceRef.current && customerMarkerRef.current && driverMarkerRef.current) {
      const group = L.featureGroup([customerMarkerRef.current, driverMarkerRef.current]);
      const bounds = group.getBounds();
      if (bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds.pad(0.25), { animate: true });
      }
    }
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  return (
    <div className={`relative w-full overflow-hidden bg-zinc-950 ${compact ? "rounded-2xl border-2 border-black shadow-[4px_4px_0_#000]" : "rounded-3xl border-3 border-black shadow-[6px_6px_0_#000]"}`}>
      {/* Map Canvas */}
      <div ref={mapContainerRef} className={`w-full z-0 ${compact ? "h-60 sm:h-72" : "h-80 sm:h-[420px]"}`} />

      {/* Top Floating Controls */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Live Rider Info & ETA */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          <div className="bg-black/95 backdrop-blur-md text-white border-2 border-white/20 px-4 py-2 rounded-2xl shadow-xl flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
            <div>
              <p className="font-outfit font-black text-xs uppercase tracking-wider text-[#E5A00D]">
                Live GPS En-Route
              </p>
              <p className="text-[11px] font-bold text-zinc-300">
                Arriving in ~{etaMinutes} mins ({distanceKm} km away)
              </p>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-md text-black border-2 border-black px-3.5 py-2 rounded-2xl shadow-xl flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <Bike size={16} className="text-[#E5A00D]" />
              <span className="font-outfit font-black uppercase text-xs">{driverName}</span>
            </div>
            {driverPhone && (
              <a
                href={`tel:${driverPhone}`}
                className="px-2.5 py-1 rounded-xl bg-black text-[#FFF8EE] hover:bg-[#E5A00D] hover:text-black font-outfit font-black text-[10px] uppercase tracking-wider transition-colors"
              >
                Call Rider
              </a>
            )}
          </div>
        </div>

        {/* Google Maps Layer Switcher: [Map | Satellite] & Direct Google Maps Launcher */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Map / Satellite Toggle */}
          <div className="bg-white/95 backdrop-blur-md p-1 rounded-2xl border-2 border-black shadow-[3px_3px_0_#000] flex items-center gap-1">
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

          {/* Adjust Pin Interactive Button */}
          <button
            type="button"
            onClick={() => setIsPinPickerOpen(true)}
            title="Adjust and pin exact location on map"
            className="px-3 py-2 rounded-2xl bg-[#E5A00D] hover:bg-black hover:text-[#E5A00D] text-black border-2 border-black font-outfit font-black text-xs uppercase tracking-wider shadow-[3px_3px_0_#000] flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <MapPin size={13} />
            <span>Adjust Pin</span>
          </button>

          {/* Open in Google Maps Button */}
          <a
            href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent("The Q Bowl, Bridge County, Canteen, Rajanagaram, Velugubanda, Andhra Pradesh 533296")}&destination=${effectiveCustLat},${effectiveCustLng}`}
            target="_blank"
            rel="noreferrer"
            title="Open in official Google Maps app"
            className="px-3 py-2 rounded-2xl bg-[#4285F4] hover:bg-[#1A73E8] text-white border-2 border-black font-outfit font-black text-xs uppercase tracking-wider shadow-[3px_3px_0_#000] flex items-center gap-1.5 transition-all"
          >
            <ExternalLink size={13} />
            <span className="hidden sm:inline">Google Maps App</span>
          </a>
        </div>
      </div>

      {/* Map Action & Zoom Controls (Bottom Right) */}
      <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-2">
        {/* Zoom Controls */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border-2 border-black shadow-[3px_3px_0_#000] overflow-hidden flex flex-col divide-y divide-black/20">
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In"
            className="h-9 w-9 flex items-center justify-center text-black hover:bg-zinc-100 transition-colors"
          >
            <Plus size={16} className="stroke-[3]" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out"
            className="h-9 w-9 flex items-center justify-center text-black hover:bg-zinc-100 transition-colors"
          >
            <Minus size={16} className="stroke-[3]" />
          </button>
        </div>

        {/* Focus Rider */}
        <button
          type="button"
          onClick={recenterOnDriver}
          title="Focus on Rider"
          className="h-10 w-10 rounded-2xl bg-white hover:bg-black hover:text-[#FFF8EE] text-black border-2 border-black shadow-[3px_3px_0_#000] flex items-center justify-center transition-all"
        >
          <Bike size={18} />
        </button>

        {/* Fit Entire Route */}
        <button
          type="button"
          onClick={fitAll}
          title="Show Entire Route"
          className="h-10 w-10 rounded-2xl bg-[#E5A00D] hover:bg-black hover:text-[#E5A00D] text-black border-2 border-black shadow-[3px_3px_0_#000] flex items-center justify-center transition-all"
        >
          <Compass size={18} />
        </button>
      </div>

      {/* Destination Pill (Bottom Left) */}
      <div className="absolute bottom-3 left-3 max-w-[70%] sm:max-w-md z-10 bg-white/95 backdrop-blur-md text-black border-2 border-black p-2.5 sm:px-4 sm:py-2 rounded-2xl shadow-[3px_3px_0_#000] flex items-center gap-2.5 text-xs">
        <div className="h-7 w-7 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-300">
          <MapPin size={15} />
        </div>
        <div className="truncate leading-tight">
          <p className="font-outfit font-black uppercase text-[10px] text-zinc-500">Delivering To</p>
          <p className="font-bold text-black text-xs truncate">{customerAddress}</p>
        </div>
      </div>

      {/* Interactive Map Pin Dropper Modal */}
      {isPinPickerOpen && (
        <InteractiveMapPinPickerModal
          isOpen={isPinPickerOpen}
          onClose={() => setIsPinPickerOpen(false)}
          initialKitchenLat={activeKitchenLat}
          initialKitchenLng={activeKitchenLng}
          initialKitchenAddress="The Q Bowl, Bridge County, Canteen, Rajanagaram, Velugubanda, Andhra Pradesh 533296"
          onLocationSaved={(newLat, newLng) => {
            setActiveKitchenLat(newLat);
            setActiveKitchenLng(newLng);
            if (kitchenMarkerRef.current) {
              kitchenMarkerRef.current.setLatLng([newLat, newLng]);
            }
          }}
        />
      )}
    </div>
  );
}
