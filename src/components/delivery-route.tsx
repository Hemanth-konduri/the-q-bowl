"use client";

import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Truck, Navigation, MapPin } from "lucide-react";

// Fix for default Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface DeliveryRouteProps {
  kitchenLat: number;
  kitchenLng: number;
  customerLat: number;
  customerLng: number;
  kitchenAddress: string;
  customerAddress: string;
}

export default function DeliveryRoute({ kitchenLat, kitchenLng, customerLat, customerLng, kitchenAddress, customerAddress }: DeliveryRouteProps) {
  const mapRef = useRef<L.Map | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initMap = async () => {
      // Calculate center point
      const centerLat = (kitchenLat + customerLat) / 2;
      const centerLng = (kitchenLng + customerLng) / 2;

      mapRef.current = L.map("delivery-route-map").setView([centerLat, centerLng], 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(mapRef.current);

      // Add kitchen marker (green)
      L.marker([kitchenLat, kitchenLng], {
        icon: new L.Icon({
          iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        }),
      })
        .addTo(mapRef.current)
        .bindPopup(`<b>Kitchen</b><br>${kitchenAddress}`);

      // Add customer marker (red)
      L.marker([customerLat, customerLng], {
        icon: new L.Icon({
          iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        }),
      })
        .addTo(mapRef.current)
        .bindPopup(`<b>Customer</b><br>${customerAddress}`);

      // Draw line between points
      const latLngs = [[kitchenLat, kitchenLng], [customerLat, customerLng]];
      L.polyline(latLngs, { color: "#496A5A", weight: 4 }).addTo(mapRef.current);

      // Get route info from OpenRouteService
      try {
        const response = await fetch(
          `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${process.env.OPENROUTE_API_KEY}&start=${kitchenLng},${kitchenLat}&end=${customerLng},${customerLat}`
        );
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          const route = data.features[0].properties.segments[0];
          setRouteInfo({
            distance: `${(route.distance / 1000).toFixed(1)} km`,
            duration: `${Math.round(route.duration / 60)} min`,
          });
        }
      } catch (error) {
        console.error("Route calculation failed:", error);
        // Fallback distance calculation
        const R = 6371; // Earth's radius in km
        const dLat = (customerLat - kitchenLat) * (Math.PI / 180);
        const dLng = (customerLng - kitchenLng) * (Math.PI / 180);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(kitchenLat * (Math.PI / 180)) * Math.cos(customerLat * (Math.PI / 180)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        setRouteInfo({
          distance: `${distance.toFixed(1)} km`,
          duration: `${Math.round(distance * 2.5)} min`, // Approx 24 km/h average
        });
      } finally {
        setIsLoading(false);
      }
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, [kitchenLat, kitchenLng, customerLat, customerLng, kitchenAddress, customerAddress]);

  return (
    <div className="space-y-4">
      {/* Route Info Card */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border p-4" style={{ borderColor: "#E8E4D9" }}>
          <div className="flex items-center gap-2 mb-2" style={{ color: "#7C817A" }}>
            <Navigation size={16} />
            <span className="text-xs uppercase tracking-wide">Distance</span>
          </div>
          {isLoading ? (
            <div className="h-6" />
          ) : (
            <div className="text-2xl font-bold" style={{ color: "#496A5A" }}>{routeInfo?.distance}</div>
          )}
        </div>
        <div className="rounded-lg border p-4" style={{ borderColor: "#E8E4D9" }}>
          <div className="flex items-center gap-2 mb-2" style={{ color: "#7C817A" }}>
            <Truck size={16} />
            <span className="text-xs uppercase tracking-wide">Est. Time</span>
          </div>
          {isLoading ? (
            <div className="h-6" />
          ) : (
            <div className="text-2xl font-bold" style={{ color: "#496A5A" }}>{routeInfo?.duration}</div>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div
        id="delivery-route-map"
        className="w-full h-96 rounded-lg overflow-hidden shadow-sm"
        style={{ background: "#EDF2EE" }}
      />

      {/* Address Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border p-4" style={{ borderColor: "#E8E4D9" }}>
          <div className="flex items-center gap-2 mb-2" style={{ color: "#7C817A" }}>
            <MapPin size={14} />
            <span className="text-xs font-medium">From</span>
          </div>
          <div className="text-sm" style={{ color: "#24332B" }}>{kitchenAddress}</div>
        </div>
        <div className="rounded-lg border p-4" style={{ borderColor: "#E8E4D9" }}>
          <div className="flex items-center gap-2 mb-2" style={{ color: "#7C817A" }}>
            <MapPin size={14} />
            <span className="text-xs font-medium">To</span>
          </div>
          <div className="text-sm" style={{ color: "#24332B" }}>{customerAddress}</div>
        </div>
      </div>
    </div>
  );
}
