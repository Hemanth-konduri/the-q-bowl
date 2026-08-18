"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  MapPin,
  PhoneCall,
  AlertCircle,
  Package,
} from "lucide-react";

type OrderItem = {
  id: string;
  foodItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
};

type DeliveryDetail = {
  status: string;
  scheduledAt?: string | null;
  pickedUpAt?: string | null;
  deliveredAt?: string | null;
  staffName?: string | null;
  staffPhone?: string | null;
};

type OrderData = {
  id: string;
  type: string;
  status: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  notes?: string | null;
  createdAt: string;
  addressLabel?: string | null;
  addressString?: string | null;
  area?: string | null;
  city?: string | null;
  pincode?: string | null;
  items: OrderItem[];
  delivery: DeliveryDetail | null;
};

export default function UserOrdersPage() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "DELIVERED">("ALL");

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch("/api/user/orders");
        if (!res.ok) throw new Error("Failed to load order history");
        const json = await res.json();
        setOrders(json.orders || []);
      } catch (err: any) {
        console.error("Orders load error:", err);
        setError(err.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((ord) => {
    if (filter === "ACTIVE") return ord.status === "OUT_FOR_DELIVERY" || ord.status === "PREPARING" || ord.status === "PENDING";
    if (filter === "DELIVERED") return ord.status === "DELIVERED";
    return true;
  });

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#0F3329] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="font-outfit text-sm font-bold uppercase tracking-wider text-[#0F3329]">
          Fetching order history from database...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      
      {/* =========================================================
          PAGE HEADER (NO SHADOWS)
          ========================================================= */}

      <div className="p-8 sm:p-10 bg-[#FFF8EE] border-2 border-[#0F3329]/20 rounded-[2rem] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <span className="font-outfit text-xs font-bold uppercase text-[#E5A00D] bg-[#0F3329] px-3 py-1 rounded-full block w-fit mb-2">
            DATABASE RECORD HISTORY
          </span>
          <h1 className="font-outfit font-black text-3xl sm:text-5xl text-[#0F3329] uppercase tracking-tight leading-none">
            MY MEAL ORDERS
          </h1>
          <p className="font-sans text-sm sm:text-base text-[#0F3329]/70 font-medium mt-2">
            Real-time status of past and active meal orders placed in our cloud kitchen.
          </p>
        </div>

        {/* Filter Pills (No Shadows) */}
        <div className="flex items-center gap-2 p-1.5 rounded-full bg-[#0F3329] border border-[#0F3329]">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-4 py-2 rounded-full font-outfit text-xs font-bold uppercase transition-colors ${
              filter === "ALL" ? "bg-[#E5A00D] text-[#0F3329]" : "text-[#f5e3cd] hover:text-white"
            }`}
          >
            All Orders
          </button>
          <button
            onClick={() => setFilter("ACTIVE")}
            className={`px-4 py-2 rounded-full font-outfit text-xs font-bold uppercase transition-colors ${
              filter === "ACTIVE" ? "bg-[#E5A00D] text-[#0F3329]" : "text-[#f5e3cd] hover:text-white"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter("DELIVERED")}
            className={`px-4 py-2 rounded-full font-outfit text-xs font-bold uppercase transition-colors ${
              filter === "DELIVERED" ? "bg-[#E5A00D] text-[#0F3329]" : "text-[#f5e3cd] hover:text-white"
            }`}
          >
            Delivered
          </button>
        </div>
      </div>


      {/* =========================================================
          ORDERS LIST FROM DATABASE (NO SHADOWS)
          ========================================================= */}

      {error && (
        <div className="p-6 rounded-2xl bg-red-50 border border-red-300 text-red-800 text-sm font-sans">
          {error}
        </div>
      )}

      {filteredOrders.length > 0 ? (
        <div className="space-y-6">
          {filteredOrders.map((ord) => (
            <div
              key={ord.id}
              className="p-6 sm:p-8 bg-[#FFF8EE] border-2 border-[#0F3329]/20 rounded-[2rem] space-y-6"
            >
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#0F3329]/15 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-outfit text-xl font-black text-[#0F3329]">
                      ORDER #{ord.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="font-outfit text-[10px] font-extrabold uppercase bg-[#0F3329] text-[#E5A00D] px-2.5 py-0.5 rounded-full">
                      {ord.type}
                    </span>
                  </div>
                  <span className="font-sans text-xs text-[#0F3329]/60 font-semibold block mt-1">
                    Placed on {new Date(ord.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                {/* Status Badge */}
                <div className="shrink-0">
                  {ord.status === "OUT_FOR_DELIVERY" && (
                    <span className="px-4 py-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-400 font-outfit text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-amber-600 animate-bounce" />
                      <span>Out for Delivery</span>
                    </span>
                  )}
                  {ord.status === "DELIVERED" && (
                    <span className="px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-400 font-outfit text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Delivered</span>
                    </span>
                  )}
                  {ord.status === "PREPARING" && (
                    <span className="px-4 py-1.5 rounded-full bg-blue-100 text-blue-800 border border-blue-400 font-outfit text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span>Preparing in Kitchen</span>
                    </span>
                  )}
                  {ord.status === "PENDING" && (
                    <span className="px-4 py-1.5 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-400 font-outfit text-xs font-black uppercase tracking-wider">
                      Pending Confirmation
                    </span>
                  )}
                </div>
              </div>

              {/* Driver info if assigned */}
              {ord.delivery && (
                <div className="p-4 rounded-2xl bg-[#0F3329] text-[#f5e3cd] space-y-2 font-sans text-xs">
                  <span className="font-outfit text-xs font-black uppercase text-[#E5A00D] block">
                    DELIVERY RIDER DETAILS
                  </span>
                  <div className="flex items-center justify-between">
                    <span>Rider: <strong className="text-white">{ord.delivery.staffName || "Assigned Driver"}</strong></span>
                    {ord.delivery.staffPhone && (
                      <a
                        href={`tel:${ord.delivery.staffPhone}`}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#E5A00D] text-[#0F3329] font-outfit font-black text-[11px] uppercase"
                      >
                        <PhoneCall className="w-3 h-3" />
                        <span>Call Rider</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Items row */}
              <div className="space-y-2.5">
                {ord.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-[#f5e3cd]/70 border border-[#0F3329]/15 flex items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="font-outfit font-extrabold text-sm text-[#0F3329] uppercase">
                        {item.name}
                      </h4>
                      <span className="font-sans text-xs text-[#0F3329]/70 font-semibold">
                        Qty: {item.quantity} × ₹{item.unitPrice}
                      </span>
                    </div>

                    <span className="font-outfit text-base font-black text-[#0F3329]">
                      ₹{item.totalPrice}
                    </span>
                  </div>
                ))}
              </div>

              {/* Footer summary */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2 border-t border-[#0F3329]/15">
                <div className="font-sans text-xs text-[#0F3329]/70 font-semibold flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#0F3329]" />
                  <span>
                    {ord.addressString ? `${ord.addressString}, ${ord.area}` : "Delivery Location"}
                  </span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <span className="font-outfit text-base font-black text-[#0F3329]">
                    Total: ₹{ord.total}
                  </span>
                  <Link
                    href="/#menu"
                    className="px-4 py-2 rounded-xl bg-[#0F3329] text-[#f5e3cd] font-outfit text-xs font-black uppercase tracking-wider hover:bg-[#E5A00D] hover:text-[#0F3329] transition-colors"
                  >
                    Order Again
                  </Link>
                </div>
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 bg-[#FFF8EE] border-2 border-[#0F3329]/20 rounded-[2rem] text-center space-y-4">
          <Package className="w-12 h-12 text-[#0F3329]/40 mx-auto" />
          <div>
            <h3 className="font-outfit font-black text-xl text-[#0F3329] uppercase">
              No Orders Found in Database
            </h3>
            <p className="font-sans text-xs text-[#0F3329]/70 font-medium max-w-md mx-auto mt-1">
              You haven&apos;t placed any orders yet. Browse our daily cloud kitchen menu to order your first meal bowl!
            </p>
          </div>
          <Link
            href="/#menu"
            className="inline-block px-6 py-3 rounded-xl bg-[#0F3329] text-[#f5e3cd] font-outfit text-xs font-black uppercase tracking-wider hover:bg-[#E5A00D] hover:text-[#0F3329] transition-colors"
          >
            Explore Menu
          </Link>
        </div>
      )}

    </div>
  );
}
