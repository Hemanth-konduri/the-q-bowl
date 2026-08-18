"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Order {
  id: string;
  items: string[];
  total: number;
  status: "pending" | "confirmed" | "preparing" | "out-for-delivery" | "delivered" | "cancelled";
  date: string;
  deliveryAddress: string;
}

const orders: Order[] = [
  {
    id: "ORD-001",
    items: ["Superfood Bowl", "Protein Power Bowl"],
    total: 31.98,
    status: "delivered",
    date: "Oct 15, 2024",
    deliveryAddress: "123 Main St, Apt 4B",
  },
  {
    id: "ORD-002",
    items: ["Vegan Delight"],
    total: 13.99,
    status: "delivered",
    date: "Oct 12, 2024",
    deliveryAddress: "123 Main St, Apt 4B",
  },
  {
    id: "ORD-003",
    items: ["Mediterranean Feast", "Superfood Bowl"],
    total: 29.98,
    status: "out-for-delivery",
    date: "Oct 18, 2024",
    deliveryAddress: "456 Oak Ave, Suite 200",
  },
  {
    id: "ORD-004",
    items: ["Protein Power Bowl"],
    total: 16.99,
    status: "confirmed",
    date: "Oct 19, 2024",
    deliveryAddress: "123 Main St, Apt 4B",
  },
];

const statusColors = {
  pending: { bg: "#FFF8F5", text: "#D86F45" },
  confirmed: { bg: "#E8F5E9", text: "#4CAF50" },
  preparing: { bg: "#FFF3E0", text: "#FF9800" },
  "out-for-delivery": { bg: "#E3F2FD", text: "#2196F3" },
  delivered: { bg: "#E8F5E9", text: "#4CAF50" },
  cancelled: { bg: "#FFEBEE", text: "#F44336" },
};

export default function UserOrdersPage() {
  const [filter, setFilter] = useState<"all" | "pending" | "delivered" | "cancelled">("all");

  const filteredOrders = filter === "all" 
    ? orders 
    : orders.filter((order) => order.status === filter);

  return (
    <div className="min-h-screen bg-[#F7F3E8]">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8" style={{ color: "#24332B" }}>
          My Orders
        </h1>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-3 mb-8">
          {[
            { id: "all", label: "All Orders" },
            { id: "pending", label: "Pending" },
            { id: "delivered", label: "Delivered" },
            { id: "cancelled", label: "Cancelled" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
                filter === tab.id
                  ? "bg-[#496A5A] text-white shadow-lg"
                  : "bg-white text-[#24332B] hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-lg" style={{ color: "#7C817A" }}>
                No orders found
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-lg" style={{ color: "#24332B" }}>
                        {order.id}
                      </span>
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold"
                        style={{
                          background: statusColors[order.status].bg,
                          color: statusColors[order.status].text,
                        }}
                      >
                        {order.status.replace("-", " ")}
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: "#7C817A" }}>
                      {order.date} • {order.deliveryAddress}
                    </p>
                  </div>
                  <div className="text-right mt-2 md:mt-0">
                    <div className="text-2xl font-bold mb-1" style={{ color: "#24332B" }}>
                      ${order.total.toFixed(2)}
                    </div>
                    <Button variant="outline" className="rounded-lg px-4 py-2 text-sm" style={{ borderColor: "#496A5A", color: "#496A5A" }}>
                      View Details
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-4" style={{ borderColor: "#DDD9CC" }}>
                  <div className="flex flex-wrap gap-2">
                    {order.items.map((item, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-lg text-sm"
                        style={{ background: "#F7F3E8", color: "#24332B" }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
