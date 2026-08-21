"use client";

import React, { useState, useEffect, use } from "react";
import SuccessScreen from "@/components/shared/success-screen";

export default function OrderSuccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [orderData, setOrderData] = useState<any>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      try {
        setLoading(true);
        const res = await fetch(`/api/orders/${id}`);
        if (res.ok) {
          const data = await res.json();
          setOrderData(data);
        } else {
          setErrorStatus(res.status);
        }
      } catch (err) {
        console.error("Failed to load order success data:", err);
        setErrorStatus(500);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto p-12 bg-[#FFF8EE] border-2 border-[#0F3329] rounded-3xl text-center space-y-4 animate-pulse">
        <div className="w-16 h-16 rounded-full bg-[#0F3329]/10 mx-auto" />
        <div className="h-6 bg-[#0F3329]/15 rounded w-1/2 mx-auto" />
      </div>
    );
  }

  if (errorStatus === 403 || errorStatus === 404 || !orderData?.order) {
    return (
      <div className="max-w-md mx-auto p-8 bg-[#FFF8EE] border-2 border-[#0F3329] rounded-3xl text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center mx-auto text-xl">
          ✕
        </div>
        <h2 className="font-outfit font-black text-xl text-[#0F3329] uppercase">
          {errorStatus === 403 ? "Unauthorized Order Access" : "Order Not Found"}
        </h2>
        <p className="font-sans text-xs text-[#0F3329]/70">
          {errorStatus === 403
            ? "You do not have authorization to view this order."
            : "The requested order ID could not be located."}
        </p>
        <a
          href="/user/dashboard"
          className="inline-block px-6 py-2.5 rounded-2xl bg-[#0F3329] text-[#f5e3cd] font-outfit text-xs font-black uppercase tracking-wider"
        >
          Return to Dashboard
        </a>
      </div>
    );
  }

  const order = orderData?.order;
  const items = orderData?.items || [];
  const addressSummary = order
    ? `${order.addressString || ""}, ${order.area || ""}, ${order.city || ""}`
    : "Hyderabad Locality";

  const details = [
    { label: "PAYMENT STATUS", value: "PAID / CONFIRMED" },
    { label: "TOTAL PAID", value: `₹${(order?.total || 0).toFixed(2)}` },
    { label: "ITEMS COUNT", value: `${items.reduce((acc: number, i: any) => acc + i.quantity, 0)} Bowls` },
  ];

  return (
    <SuccessScreen
      type="ORDER"
      title="ORDER PLACED SUCCESSFULLY!"
      subtitle="Our cloud kitchen culinary team has received your order and is preparing your artisan meal bowl."
      idLabel="ORDER ID"
      idValue={id}
      details={details}
      addressSummary={addressSummary}
      primaryButtonText="Track Live Delivery"
      primaryButtonHref={`/user/orders`}
      secondaryButtonText="Back to Dashboard"
      secondaryButtonHref="/user/dashboard"
    />
  );
}
