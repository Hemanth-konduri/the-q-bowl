"use client";

import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Search, X, Navigation } from "lucide-react";

// Fix for default Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  defaultValue?: { lat: number; lng: number; address: string };
  showRoutePreview?: boolean;
  kitchenLat?: number;
  kitchenLng?: number;
}

export default function LocationPicker({ 
  onLocationSelect, 
  defaultValue, 
  showRoutePreview = false,
  kitchenLat,
  kitchenLng 
}: LocationPickerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);

  useEffect(() => {
    // Initialize map
    const initMap = async () => {
      const { lat, lng } = defaultValue || { lat: 28.6139, lng: 77.2090 }; // Default to Delhi

      mapRef.current = L.map("location-map").setView([lat, lng], 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(mapRef.current);

      // Add kitchen marker if showing route
      if (showRoutePreview && kitchenLat && kitchenLng) {
        L.marker([kitchenLat, kitchenLng], {
          icon: new L.Icon({
            iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
          }),
        }).addTo(mapRef.current);
      }

      // Add marker
      markerRef.current = L.marker([lat, lng]).addTo(mapRef.current).bindPopup("Selected location");

      // Handle map click
      mapRef.current.on("click", (e) => {
        const { lat, lng } = e.latlng;
        updateMarker(lat, lng);
      });

      // Set initial marker
      if (defaultValue) {
        updateMarker(defaultValue.lat, defaultValue.lng, defaultValue.address);
      }
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, [showRoutePreview, kitchenLat, kitchenLng]);

  const updateMarker = (lat: number, lng: number, address?: string) => {
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    }
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 13);
    }
    onLocationSelect(lat, lng, address || "Location selected");
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const results = await response.json();
      setSearchResults(results.slice(0, 5));
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = async (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    // Get address details
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      const address = data.display_name;
      
      updateMarker(lat, lng, address);
      setSearchQuery(address);
      setSearchResults([]);
    } catch (error) {
      updateMarker(lat, lng, result.display_name);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Box */}
      <div className="relative">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search location..."
            className="w-full pl-10 pr-10 py-3 rounded-lg border outline-none focus:ring-2"
            style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          )}
        </form>
        
        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border z-50 max-h-60 overflow-y-auto">
            {searchResults.map((result, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectResult(result)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm"
              >
                <div className="font-medium" style={{ color: "#24332B" }}>{result.display_name}</div>
                <div className="text-xs text-gray-500">{result.type}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map Container */}
      <div
        id="location-map"
        className="w-full h-80 rounded-lg overflow-hidden shadow-sm"
        style={{ background: "#EDF2EE" }}
      />

      {/* Current Location Button */}
      <button
        onClick={() => {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const { latitude, longitude } = position.coords;
                updateMarker(latitude, longitude, "Current location");
              },
              () => alert("Unable to get location")
            );
          }
        }}
        className="w-full py-2.5 rounded-lg border flex items-center justify-center gap-2 text-sm font-medium transition hover:opacity-90"
        style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}
      >
        <MapPin size={16} /> Use current location
      </button>

      {/* Route Info (if kitchen location provided) */}
      {showRoutePreview && kitchenLat && kitchenLng && (
        <div className="rounded-lg border p-4" style={{ borderColor: "#E8E4D9" }}>
          <div className="flex items-center gap-2 mb-2" style={{ color: "#7C817A" }}>
            <Navigation size={16} />
            <span className="text-xs font-medium">Delivery Info</span>
          </div>
          <div className="text-sm" style={{ color: "#24332B" }}>
            Enter your address to see estimated delivery time and fee.
          </div>
        </div>
      )}
    </div>
  );
}
