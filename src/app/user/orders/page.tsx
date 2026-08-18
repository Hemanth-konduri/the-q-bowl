"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  MapPin,
  ChevronRight,
  RefreshCw,
  PhoneCall,
  FileText,
  Search,
  Sparkles,
} from "lucide-react";

import dumBiryaniImg from "../../../../../public/dum_biryani_hero.png";
import heroDishImg from "../../../../../public/hero_dish.png";
import paneerImg from "../../../../../public/paneer.png";

type Order = {
  id: string;
  type: "SUBSCRIPTION" | "NORMAL";
  date: string;
  status: "OUT_FOR_DELIVERY" | "PREPARING" | "DELIVERED" | "CANCELLED";
  items: { name: string; qty: number; price: number; image: any }[];
  total: number;
  deliveryAddress: string;
  driverName?: string;
  driverPhone?: string;
  vehicleNo?: string;
  estimatedArrival?: string;
};

const ORDERS: Order[] = [
  {
    id: "Q1B-8942",
    type: "SUBSCRIPTION",
    date: "Aug 18, 2026 • 12:15 PM",
    status: "OUT_FOR_DELIVERY",
    items: [
      { name: "Hyderabadi Chicken Dum Biryani", qty: 1, price: 299, image: dumBiryaniImg },
    ],
    total: 0, // Subscription order
    deliveryAddress: "Flat 402, Golden Heights, Road No 12, Jubilee Hills, Hyderabad",
    driverName: "Ramesh K.",
    driverPhone: "+91 98765 12345",
    vehicleNo: "TS 09 EQ 4821",
    estimatedArrival: "12:45 PM",
  },
  {
    id: "Q1B-8901",
    type: "NORMAL",
    date: "Aug 17, 2026 • 8:00 PM",
    status: "DELIVERED",
    items: [
      { name: "Royal Paneer Tikka Deluxe Bowl", qty: 1, price: 239, image: paneerImg },
    ],
    total: 239,
    deliveryAddress: "Flat 402, Golden Heights, Road No 12, Jubilee Hills, Hyderabad",
    driverName: "Suresh M.",
  },
  {
    id: "Q1B-8820",
    type: "NORMAL",
    date: "Aug 15, 2026 • 1:10 PM",
    status: "DELIVERED",
    items: [
      { name: "Signature Protein Harvest Bowl", qty: 2, price: 249, image: heroDishImg },
    ],
    total: 498,
    deliveryAddress: "Flat 402, Golden Heights, Road No 12, Jubilee Hills, Hyderabad",
  },
];

export default function UserOrdersPage() {
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "DELIVERED">("ALL");

  const filteredOrders = ORDERS.filter((order) => {
    if (filter === "ACTIVE") return order.status === "OUT_FOR_DELIVERY" || order.status === "PREPARING";
    if (filter === "DELIVERED") return order.status === "DELIVERED";
    return true;
  });

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      
      {/* =========================================================
          PAGE HEADER
          ========================================================= */}

      <div className="p-8 sm:p-10 bg-[#FFF8EE] border-4 border-[#0F3329] rounded-[2.5rem] shadow-[8px_8px_0px_#0F3329] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <span className="font-mouse-memoirs text-2xl text-[#E5A00D] uppercase font-bold tracking-widest block">
            ORDER HISTORY &amp; LIVE TRACKING
          </span>
          <h1 className="font-outfit font-black text-3xl sm:text-5xl text-[#0F3329] uppercase tracking-tight leading-none mt-1">
            MY MEAL ORDERS
          </h1>
          <p className="font-sans text-sm sm:text-base text-[#0F3329]/80 font-medium mt-2">
            Track active dispatches in real-time or view past meal receipts.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 p-1.5 rounded-full bg-[#0F3329] border-2 border-[#0F3329] shadow-[3px_3px_0px_#071914]">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-4 py-2 rounded-full font-outfit text-xs font-bold uppercase transition-all ${
              filter === "ALL" ? "bg-[#E5A00D] text-[#0F3329]" : "text-[#f5e3cd] hover:text-white"
            }`}
          >
            All Orders
          </button>
          <button
            onClick={() => setFilter("ACTIVE")}
            className={`px-4 py-2 rounded-full font-outfit text-xs font-bold uppercase transition-all ${
              filter === "ACTIVE" ? "bg-[#E5A00D] text-[#0F3329]" : "text-[#f5e3cd] hover:text-white"
            }`}
          >
            Active Dispatches
          </button>
          <button
            onClick={() => setFilter("DELIVERED")}
            className={`px-4 py-2 rounded-full font-outfit text-xs font-bold uppercase transition-all ${
              filter === "DELIVERED" ? "bg-[#E5A00D] text-[#0F3329]" : "text-[#f5e3cd] hover:text-white"
            }`}
          >
            Delivered
          </button>
        </div>
      </div>


      {/* =========================================================
          ORDERS LIST
          ========================================================= */}

      <div className="space-y-6">
        {filteredOrders.map((order) => (
          <div
            key={order.id}
            className="p-6 sm:p-8 bg-[#FFF8EE] border-4 border-[#0F3329] rounded-[2.5rem] shadow-[6px_6px_0px_#0F3329] space-y-6"
          >
            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#0F3329]/15 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-outfit text-xl font-black text-[#0F3329]">
                    ORDER #{order.id}
                  </span>
                  <span className="font-outfit text-[10px] font-extrabold uppercase bg-[#0F3329] text-[#E5A00D] px-2.5 py-0.5 rounded-full">
                    {order.type}
                  </span>
                </div>
                <span className="font-sans text-xs text-[#0F3329]/70 font-semibold block mt-1">
                  Placed on {order.date}
                </span>
              </div>

              {/* Status Badge */}
              <div className="shrink-0">
                {order.status === "OUT_FOR_DELIVERY" && (
                  <span className="px-4 py-1.5 rounded-full bg-amber-100 text-amber-900 border-2 border-amber-500 font-outfit text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-amber-600 animate-bounce" />
                    <span>Out for Delivery</span>
                  </span>
                )}
                {order.status === "DELIVERED" && (
                  <span className="px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 border-2 border-emerald-500 font-outfit text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Delivered</span>
                  </span>
                )}
              </div>
            </div>

            {/* LIVE STEP TRACKER BANNER FOR ACTIVE ORDERS */}
            {order.status === "OUT_FOR_DELIVERY" && (
              <div className="p-5 rounded-2xl bg-[#0F3329] text-[#f5e3cd] border-2 border-[#0F3329] space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-outfit text-xs font-black uppercase text-[#E5A00D]">
                    REAL-TIME DISPATCH TRACKER
                  </span>
                  <span className="font-outfit text-xs font-bold text-[#D8C4A9]">
                    ETA: <strong className="text-[#E5A00D]">{order.estimatedArrival}</strong>
                  </span>
                </div>

                {/* Progress bar */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="h-2 rounded-full bg-[#E5A00D]" />
                  <div className="h-2 rounded-full bg-[#E5A00D]" />
                  <div className="h-2 rounded-full bg-[#E5A00D] animate-pulse" />
                  <div className="h-2 rounded-full bg-[#1B4D3E]" />
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-2 border-t border-[#E5A00D]/20 font-sans text-xs text-[#D8C4A9]">
                  <div>
                    Rider: <strong className="text-[#FFF8EE]">{order.driverName}</strong> ({order.vehicleNo})
                  </div>
                  {order.driverPhone && (
                    <a
                      href={`tel:${order.driverPhone}`}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#E5A00D] text-[#0F3329] font-outfit font-black text-xs uppercase"
                    >
                      <PhoneCall className="w-3 h-3" />
                      <span>Call Driver</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Items row */}
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-[#f5e3cd] border-2 border-[#0F3329] flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#0F3329] p-1 shrink-0 relative overflow-hidden border border-[#E5A00D]/40">
                      <Image src={item.image} alt={item.name} fill className="object-contain p-1" />
                    </div>
                    <div>
                      <h4 className="font-outfit font-extrabold text-sm text-[#0F3329] uppercase">
                        {item.name}
                      </h4>
                      <span className="font-sans text-xs text-[#0F3329]/70 font-semibold">
                        Qty: {item.qty}
                      </span>
                    </div>
                  </div>

                  <span className="font-outfit text-base font-black text-[#0F3329]">
                    {order.type === "SUBSCRIPTION" ? "Included in Plan" : `₹${item.price * item.qty}`}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer summary */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2 border-t-2 border-[#0F3329]/15">
              <div className="font-sans text-xs text-[#0F3329]/70 font-semibold flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#0F3329]" />
                <span>{order.deliveryAddress}</span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <span className="font-outfit text-sm font-black text-[#0F3329]">
                  Total: {order.total === 0 ? "Plan Credit" : `₹${order.total}`}
                </span>
                <button className="px-4 py-2 rounded-xl bg-[#0F3329] text-[#f5e3cd] font-outfit text-xs font-black uppercase tracking-wider hover:bg-[#E5A00D] hover:text-[#0F3329] transition-all">
                  {order.status === "DELIVERED" ? "Reorder Dish" : "View Receipt"}
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
