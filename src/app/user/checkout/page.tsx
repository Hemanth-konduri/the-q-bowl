import { db } from "@/db";
import { deliveryAreas } from "@/db/schema";
import { eq } from "drizzle-orm";
import { MapPin, Navigation } from "lucide-react";

import PageHeader from "@/components/admin/page-header";
import PageCard from "@/components/admin/page-card";
import LocationPicker from "@/components/location-picker";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined };
}) {
  const params = searchParams ? await searchParams : {};
  const kitchenLat = Number(params.kitchenLat ?? 28.6139);
  const kitchenLng = Number(params.kitchenLng ?? 77.2090);

  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    console.log("Location selected:", { lat, lng, address });
    // In a real app, this would save to order or show delivery fee
  };

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Select Delivery Location"
        subtitle="Pinpoint your exact location on the map for accurate delivery."
        actions={null}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PageCard>
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-lg p-3" style={{ background: "#EDF2EE", color: "#496A5A" }}>
                <MapPin size={20} />
              </div>
              <div>
                <h2 className="text-sm font-semibold" style={{ color: "#24332B" }}>Select your location</h2>
                <p className="text-xs" style={{ color: "#7C817A" }}>Click on the map or search for your address</p>
              </div>
            </div>

            <LocationPicker
              onLocationSelect={handleLocationSelect}
              showRoutePreview={true}
              kitchenLat={kitchenLat}
              kitchenLng={kitchenLng}
            />
          </PageCard>
        </div>

        <div className="space-y-6">
          <PageCard>
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-lg p-3" style={{ background: "#F0FDF4", color: "#16A34A" }}>
                <Navigation size={20} />
              </div>
              <h2 className="text-sm font-semibold" style={{ color: "#24332B" }}>Delivery Info</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b" style={{ borderColor: "#E8E4D9" }}>
                <span className="text-gray-600">Service Area</span>
                <span className="font-medium" style={{ color: "#496A5A" }}>Within radius</span>
              </div>
              <div className="flex justify-between py-2 border-b" style={{ borderColor: "#E8E4D9" }}>
                <span className="text-gray-600">Estimated Time</span>
                <span className="font-medium" style={{ color: "#24332B" }}>30-45 min</span>
              </div>
              <div className="flex justify-between py-2 border-b" style={{ borderColor: "#E8E4D9" }}>
                <span className="text-gray-600">Delivery Fee</span>
                <span className="font-medium" style={{ color: "#24332B" }}>₹49</span>
              </div>
            </div>
          </PageCard>

          <button
            className="w-full py-3 rounded-lg font-medium text-white"
            style={{ background: "#496A5A" }}
          >
            Continue to Payment
          </button>
        </div>
      </div>
    </div>
  );
}
