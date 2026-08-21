"use client";

import { useEffect, useState, useRef } from "react";
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
  Search,
  Filter,
  X,
  Download,
  RotateCcw,
  ChefHat,
  Receipt,
  CreditCard,
  Sparkles,
  ChevronRight,
  XCircle,
} from "lucide-react";
import gsap from "gsap";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const ordersListRef = useRef<HTMLDivElement>(null);

  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "DELIVERED" | "CANCELLED">("ALL");

  // Selected Order for Details Drawer Modal
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);

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

  // GSAP Entrance Animations
  useEffect(() => {
    if (!loading && containerRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          ".gsap-order-fade",
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power2.out" }
        );
      }, containerRef);

      return () => ctx.revert();
    }
  }, [loading]);

  // Tab Switching GSAP Fade
  const handleTabSwitch = (tab: "ALL" | "ACTIVE" | "DELIVERED" | "CANCELLED") => {
    if (tab === activeTab) return;
    setActiveTab(tab);

    if (ordersListRef.current) {
      gsap.fromTo(
        ordersListRef.current.children,
        { opacity: 0, y: 10, scale: 0.99 },
        { opacity: 1, y: 0, scale: 1, duration: 0.35, stagger: 0.06, ease: "power2.out" }
      );
    }
  };

  // Filtered Orders Logic
  const filteredOrders = orders.filter((ord) => {
    // Tab Filter
    let matchesTab = true;
    if (activeTab === "ACTIVE") {
      matchesTab = ord.status === "OUT_FOR_DELIVERY" || ord.status === "PREPARING" || ord.status === "PENDING";
    } else if (activeTab === "DELIVERED") {
      matchesTab = ord.status === "DELIVERED";
    } else if (activeTab === "CANCELLED") {
      matchesTab = ord.status === "CANCELLED";
    }

    // Search Query Filter
    const matchesSearch =
      searchQuery.trim() === "" ||
      ord.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.items.some((it) => it.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesTab && matchesSearch;
  });

  // Calculate Statistics
  const totalOrdersCount = orders.length;
  const activeOrdersCount = orders.filter(
    (o) => o.status === "OUT_FOR_DELIVERY" || o.status === "PREPARING" || o.status === "PENDING"
  ).length;
  const deliveredCount = orders.filter((o) => o.status === "DELIVERED").length;
  const totalSpentAmount = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4 max-w-md mx-auto">
        <div className="w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="font-outfit text-xs font-bold uppercase tracking-wider text-black">
          Fetching your order records...
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-6 pb-16 max-w-6xl mx-auto">
      
      {/* =========================================================
          1. HEADER & SEARCH BAR
          ========================================================= */}
      <div className="gsap-order-fade p-6 sm:p-8 bg-[#FFF8EE] border-2 border-black/15 rounded-[12px] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1 max-w-xl">
          <span className="px-3 py-1 rounded-[6px] bg-[#E5A00D] text-black font-outfit text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CUSTOMER DISPATCH PORTAL</span>
          </span>
          <h1 className="font-outfit font-black text-3xl sm:text-5xl text-black uppercase tracking-tight leading-none">
            My Orders
          </h1>
          <p className="font-sans text-xs sm:text-sm text-black/70 font-medium">
            Track your live dispatches and reorder your favorite cloud kitchen bowls.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-black/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID or meal name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-[10px] bg-[#f5e3cd]/60 border-2 border-black/15 text-xs font-sans font-medium text-black placeholder:text-black/50 focus:outline-none focus:border-black transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-black/50 hover:text-black"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>


      {/* =========================================================
          2. ORDER SUMMARY (4 Compact Statistic Cards)
          ========================================================= */}
      <div className="gsap-order-fade grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-[#FFF8EE] border-2 border-black/15 rounded-[10px] space-y-1">
          <div className="flex items-center justify-between text-xs font-outfit font-bold uppercase text-black/60">
            <span>Total Orders</span>
            <ShoppingBag className="w-4 h-4 text-black" />
          </div>
          <p className="font-outfit font-black text-2xl text-black">{totalOrdersCount}</p>
        </div>

        <div className="p-4 bg-[#FFF8EE] border-2 border-black/15 rounded-[10px] space-y-1">
          <div className="flex items-center justify-between text-xs font-outfit font-bold uppercase text-black/60">
            <span>Active Orders</span>
            <Clock className="w-4 h-4 text-[#E5A00D]" />
          </div>
          <p className="font-outfit font-black text-2xl text-black">{activeOrdersCount}</p>
        </div>

        <div className="p-4 bg-[#FFF8EE] border-2 border-black/15 rounded-[10px] space-y-1">
          <div className="flex items-center justify-between text-xs font-outfit font-bold uppercase text-black/60">
            <span>Delivered</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="font-outfit font-black text-2xl text-black">{deliveredCount}</p>
        </div>

        <div className="p-4 bg-[#FFF8EE] border-2 border-black/15 rounded-[10px] space-y-1">
          <div className="flex items-center justify-between text-xs font-outfit font-bold uppercase text-black/60">
            <span>Total Spent</span>
            <Receipt className="w-4 h-4 text-black" />
          </div>
          <p className="font-outfit font-black text-2xl text-black">₹{totalSpentAmount}</p>
        </div>
      </div>


      {/* =========================================================
          3. FILTER TABS (Segmented Control)
          ========================================================= */}
      <div className="gsap-order-fade flex items-center justify-between border-b-2 border-black/15 pb-2">
        <div className="p-1 rounded-[10px] bg-[#FFF8EE] border-2 border-black/15 flex items-center gap-1">
          {[
            { id: "ALL", label: "All Orders" },
            { id: "ACTIVE", label: `Active (${activeOrdersCount})` },
            { id: "DELIVERED", label: "Delivered" },
            { id: "CANCELLED", label: "Cancelled" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabSwitch(tab.id as any)}
              className={`px-4 py-2 rounded-[8px] font-outfit text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === tab.id
                  ? "bg-black text-[#E5A00D] shadow-[2px_2px_0px_#000]"
                  : "text-black/70 hover:text-black"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>


      {/* =========================================================
          4 & 5. ORDERS LIST & ACTIVE PROGRESS TRACKER
          ========================================================= */}
      {error && (
        <div className="p-4 rounded-[10px] bg-red-50 border border-red-300 text-red-800 text-xs font-sans">
          {error}
        </div>
      )}

      {filteredOrders.length > 0 ? (
        <div ref={ordersListRef} className="space-y-6">
          {filteredOrders.map((ord) => {
            const isActive = ord.status === "OUT_FOR_DELIVERY" || ord.status === "PREPARING" || ord.status === "PENDING";
            
            // Calculate 4-stage progress step
            let currentStage = 1;
            if (ord.status === "PREPARING") currentStage = 2;
            if (ord.status === "OUT_FOR_DELIVERY") currentStage = 3;
            if (ord.status === "DELIVERED") currentStage = 4;

            return (
              <div
                key={ord.id}
                className={`p-6 sm:p-7 rounded-[12px] bg-[#FFF8EE] space-y-6 transition-all duration-300 ${
                  isActive
                    ? "border-2 border-black shadow-[4px_4px_0px_#000000]"
                    : "border-2 border-black/15 hover:border-black/40 hover:scale-[1.01]"
                }`}
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black/15 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-outfit text-xl font-black text-black">
                        ORDER #{ord.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className="font-outfit text-[10px] font-black uppercase bg-black text-[#E5A00D] px-2.5 py-0.5 rounded-[6px]">
                        {ord.type}
                      </span>
                    </div>
                    <span className="font-sans text-xs text-black/60 font-semibold block mt-0.5">
                      Placed on {new Date(ord.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0 flex items-center gap-2">
                    {ord.status === "OUT_FOR_DELIVERY" && (
                      <span className="px-3 py-1 rounded-[8px] bg-amber-100 text-amber-900 border border-amber-400 font-outfit text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-amber-700 animate-bounce" />
                        <span>Out for Delivery</span>
                      </span>
                    )}
                    {ord.status === "PREPARING" && (
                      <span className="px-3 py-1 rounded-[8px] bg-blue-100 text-blue-900 border border-blue-400 font-outfit text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                        <ChefHat className="w-4 h-4 text-blue-700" />
                        <span>Kitchen Preparing</span>
                      </span>
                    )}
                    {ord.status === "DELIVERED" && (
                      <span className="px-3 py-1 rounded-[8px] bg-emerald-100 text-emerald-900 border border-emerald-400 font-outfit text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        <span>Delivered</span>
                      </span>
                    )}
                    {ord.status === "CANCELLED" && (
                      <span className="px-3 py-1 rounded-[8px] bg-red-100 text-red-900 border border-red-400 font-outfit text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                        <XCircle className="w-4 h-4 text-red-700" />
                        <span>Cancelled</span>
                      </span>
                    )}
                    {ord.status === "PENDING" && (
                      <span className="px-3 py-1 rounded-[8px] bg-yellow-100 text-yellow-900 border border-yellow-400 font-outfit text-xs font-black uppercase tracking-wider">
                        Pending Confirmation
                      </span>
                    )}
                  </div>
                </div>


                {/* 4-STAGE ACTIVE ORDER HORIZONTAL PROGRESS TRACKER */}
                {isActive && (
                  <div className="p-4 rounded-[10px] bg-[#f5e3cd]/60 border border-black/15 space-y-3">
                    <div className="flex items-center justify-between font-outfit text-xs font-bold uppercase text-black">
                      <span>Live Order Status Progress</span>
                      <span className="text-[#E5A00D] bg-black px-2.5 py-0.5 rounded-[4px]">
                        ETA: ~20-30 Mins
                      </span>
                    </div>

                    <div className="relative pt-2 pb-1">
                      {/* Step line background */}
                      <div className="absolute top-1/2 left-4 right-4 h-1 bg-black/15 -translate-y-1/2 z-0" />
                      
                      {/* Active step line */}
                      <div
                        className="absolute top-1/2 left-4 h-1 bg-black -translate-y-1/2 z-0 transition-all duration-500"
                        style={{
                          width: `${((currentStage - 1) / 3) * 100}%`,
                        }}
                      />

                      <div className="relative z-10 flex items-center justify-between">
                        {[
                          { stage: 1, label: "Confirmed" },
                          { stage: 2, label: "Cooking" },
                          { stage: 3, label: "Out for Delivery" },
                          { stage: 4, label: "Delivered" },
                        ].map((st) => {
                          const isDone = currentStage >= st.stage;
                          return (
                            <div key={st.stage} className="flex flex-col items-center gap-1">
                              <div
                                className={`w-7 h-7 rounded-full border-2 font-outfit text-xs font-black flex items-center justify-center transition-colors ${
                                  isDone
                                    ? "bg-black text-[#E5A00D] border-black"
                                    : "bg-[#FFF8EE] text-black/50 border-black/20"
                                }`}
                              >
                                {st.stage}
                              </div>
                              <span className={`font-outfit text-[10px] font-extrabold uppercase ${isDone ? "text-black" : "text-black/50"}`}>
                                {st.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}


                {/* Driver phone contact if assigned */}
                {ord.delivery?.staffPhone && (
                  <div className="p-3.5 rounded-[10px] bg-black text-[#f5e3cd] flex items-center justify-between gap-4 font-sans text-xs">
                    <div>
                      <span className="font-outfit text-[10px] font-black uppercase text-[#E5A00D] block">Assigned Rider</span>
                      <span className="font-bold text-white">{ord.delivery.staffName || "Express Driver"}</span>
                    </div>
                    <a
                      href={`tel:${ord.delivery.staffPhone}`}
                      className="px-3 py-1.5 rounded-[8px] bg-[#E5A00D] text-black font-outfit font-black text-xs uppercase flex items-center gap-1.5"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Call Driver</span>
                    </a>
                  </div>
                )}


                {/* Ordered Items List */}
                <div className="space-y-2">
                  {ord.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-[10px] bg-[#f5e3cd]/70 border border-black/15 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[8px] bg-black shrink-0 relative overflow-hidden flex items-center justify-center p-1">
                          <Image
                            src="/dum_biryani_hero.png"
                            alt={item.name}
                            fill
                            className="object-contain p-1"
                          />
                        </div>
                        <div>
                          <h4 className="font-outfit font-extrabold text-sm text-black uppercase">
                            {item.name}
                          </h4>
                          <span className="font-sans text-xs text-black/70 font-semibold">
                            Qty: {item.quantity} × ₹{item.unitPrice}
                          </span>
                        </div>
                      </div>

                      <span className="font-outfit text-base font-black text-black">
                        ₹{item.totalPrice}
                      </span>
                    </div>
                  ))}
                </div>


                {/* Footer summary & actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2 border-t border-black/15">
                  <div className="font-sans text-xs text-black/70 font-semibold flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-black shrink-0" />
                    <span className="truncate max-w-sm">
                      {ord.addressString ? `${ord.addressString}, ${ord.area}` : "Primary Dispatch Location"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
                    <span className="font-outfit text-base font-black text-black">
                      Total: ₹{ord.total}
                    </span>

                    <button
                      onClick={() => setSelectedOrder(ord)}
                      className="px-3.5 py-2 rounded-[8px] bg-[#f5e3cd] border-2 border-black/20 text-black font-outfit text-xs font-bold uppercase hover:bg-black hover:text-white transition-all"
                    >
                      View Details
                    </button>

                    <Link
                      href="/#menu"
                      className="px-4 py-2 rounded-[8px] bg-black text-[#f5e3cd] font-outfit text-xs font-black uppercase tracking-wider hover:bg-[#E5A00D] hover:text-black transition-colors flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reorder</span>
                    </Link>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* =========================================================
            6. EMPTY STATE COMPONENT
            ========================================================= */
        <div className="gsap-order-fade p-12 bg-[#FFF8EE] border-2 border-black/15 rounded-[12px] text-center space-y-4 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-[12px] bg-black p-3 mx-auto text-[#E5A00D] flex items-center justify-center">
            <Package className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-outfit font-black text-2xl text-black uppercase tracking-tight">
              No Orders Found
            </h3>
            <p className="font-sans text-xs text-black/70 font-medium max-w-md mx-auto">
              You haven&apos;t placed any orders matching this criteria yet. Browse our daily cloud kitchen menu to order your first meal bowl!
            </p>
          </div>
          <Link
            href="/#menu"
            className="inline-block px-7 py-3 rounded-[10px] bg-black text-[#f5e3cd] font-outfit text-xs font-black uppercase tracking-wider hover:bg-[#E5A00D] hover:text-black transition-colors shadow-[2px_2px_0px_#000]"
          >
            Explore Menu
          </Link>
        </div>
      )}


      {/* =========================================================
          7. ORDER DETAILS DRAWER / MODAL
          ========================================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#FFF8EE] border-2 border-black rounded-[12px] p-6 sm:p-8 max-w-xl w-full space-y-6 max-h-[90vh] overflow-y-auto shadow-[8px_8px_0px_#000000] relative">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b-2 border-black/15 pb-4">
              <div>
                <span className="font-outfit text-[11px] font-black uppercase text-black bg-[#E5A00D] px-2.5 py-0.5 rounded-[6px] tracking-wider inline-block">
                  ORDER INVOICE BREAKDOWN
                </span>
                <h3 className="font-outfit font-black text-2xl text-black uppercase tracking-tight">
                  Order #{selectedOrder.id.slice(0, 8).toUpperCase()}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-[8px] bg-black text-white hover:bg-[#E5A00D] hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items List */}
            <div className="space-y-2">
              <span className="font-outfit text-xs font-bold uppercase text-black/60 block">Ordered Items</span>
              {selectedOrder.items.map((it) => (
                <div key={it.id} className="p-3 rounded-[8px] bg-[#f5e3cd]/60 border border-black/10 flex justify-between font-sans text-xs font-semibold text-black">
                  <span>{it.name} (x{it.quantity})</span>
                  <span>₹{it.totalPrice}</span>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="p-4 rounded-[10px] bg-[#f5e3cd]/60 border border-black/15 space-y-2 font-sans text-xs">
              <div className="flex justify-between text-black/70">
                <span>Subtotal</span>
                <span>₹{selectedOrder.subtotal || selectedOrder.total}</span>
              </div>
              <div className="flex justify-between text-black/70">
                <span>Delivery Fee</span>
                <span>₹{selectedOrder.deliveryFee || 0}</span>
              </div>
              {selectedOrder.discount > 0 && (
                <div className="flex justify-between text-emerald-800 font-bold">
                  <span>Discount</span>
                  <span>-₹{selectedOrder.discount}</span>
                </div>
              )}
              <div className="flex justify-between text-black/70">
                <span>Taxes &amp; Kitchen Charges</span>
                <span>Included</span>
              </div>
              <div className="flex justify-between text-sm font-outfit font-black text-black pt-2 border-t border-black/15">
                <span>Total Amount Paid</span>
                <span className="text-[#E5A00D] bg-black px-2.5 py-0.5 rounded-[4px]">
                  ₹{selectedOrder.total}
                </span>
              </div>
            </div>

            {/* Payment & Address Info */}
            <div className="grid grid-cols-2 gap-3 font-sans text-xs">
              <div className="p-3 rounded-[8px] bg-[#f5e3cd]/60 border border-black/10">
                <span className="font-outfit text-[10px] font-bold uppercase text-black/60 block">Payment Method</span>
                <span className="font-bold text-black flex items-center gap-1 mt-0.5">
                  <CreditCard className="w-3.5 h-3.5 text-[#E5A00D]" />
                  <span>Online Payment (Completed)</span>
                </span>
              </div>
              <div className="p-3 rounded-[8px] bg-[#f5e3cd]/60 border border-black/10">
                <span className="font-outfit text-[10px] font-bold uppercase text-black/60 block">Dispatch Location</span>
                <span className="font-bold text-black truncate block mt-0.5">
                  {selectedOrder.addressString || "Default Home Address"}
                </span>
              </div>
            </div>

            {/* Download Invoice CTA */}
            <div className="pt-2">
              <button
                onClick={() => window.print()}
                className="w-full py-3 rounded-[10px] bg-black text-[#f5e3cd] font-outfit text-xs font-bold uppercase tracking-wider hover:bg-[#E5A00D] hover:text-black transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Invoice / Print Receipt</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
