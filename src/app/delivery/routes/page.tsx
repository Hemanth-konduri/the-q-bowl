import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/db";
import { deliveryAssignments, orders, addresses, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Truck, Navigation, MapPin } from "lucide-react";

import PageHeader from "@/components/admin/page-header";
import PageCard from "@/components/admin/page-card";
import DeliveryRoute from "@/components/delivery-route";

export default async function DeliveryRoutesPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined };
}) {
  await requireAdmin();

  const params = searchParams ? await searchParams : {};
  const assignmentId = typeof params.assignment === "string" ? params.assignment : undefined;

  const assignment = await db
    .select({
      id: deliveryAssignments.id,
      orderId: deliveryAssignments.orderId,
      status: deliveryAssignments.status,
      kitchenAddress: addresses.address,
      customerLat: addresses.latitude,
      customerLng: addresses.longitude,
      customerAddress: addresses.address,
      customerArea: addresses.area,
      customerCity: addresses.city,
      customerState: addresses.state,
      customerPincode: addresses.pincode,
      customerName: users.name,
    })
    .from(deliveryAssignments)
    .leftJoin(orders, eq(deliveryAssignments.orderId, orders.id))
    .leftJoin(addresses, eq(orders.addressId, addresses.id))
    .leftJoin(users, eq(orders.userId, users.id))
    .where(eq(deliveryAssignments.id, assignmentId || ""))
    .limit(1);

  if (!assignment || !assignment[0]) {
    return (
      <div className="max-w-4xl mx-auto">
        <PageHeader title="Delivery Routes" subtitle="View delivery routes to customer locations." />
        <PageCard>
          <div className="text-center py-12">
            <Truck size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-lg font-semibold" style={{ color: "#24332B" }}>No delivery assignment selected</h2>
            <p className="text-sm mt-2" style={{ color: "#7C817A" }}>Select a delivery from the assignments list to view the route.</p>
          </div>
        </PageCard>
      </div>
    );
  }

  const data = assignment[0];

  // Combine address parts for full address
  const fullCustomerAddress = `${data.customerAddress}, ${data.customerArea}, ${data.customerCity} - ${data.customerPincode}, ${data.customerState}`;

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Delivery Route"
        subtitle={`Route to ${data.customerName}'s location`}
        actions={null}
      />

      <PageCard noPadding>
        <div className="px-5 py-4 border-b" style={{ borderColor: "#E8E4D9" }}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold" style={{ color: "#24332B" }}>Delivery route details</h2>
            <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "#EDF2EE", color: "#496A5A" }}>
              Order #{data.orderId?.slice(-6).toUpperCase()}
            </span>
          </div>
        </div>

        <div className="p-6">
          <DeliveryRoute
            kitchenLat={17.4399}
            kitchenLng={78.3847}
            customerLat={data.customerLat || 17.4399}
            customerLng={data.customerLng || 78.3847}
            kitchenAddress="Artisan Kitchen Hub"
            customerAddress={fullCustomerAddress}
          />
        </div>
      </PageCard>
    </div>
  );
}
