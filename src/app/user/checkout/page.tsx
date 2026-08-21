"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, FileText, ArrowRight, ShieldCheck, MapPin, AlertCircle, Loader2 } from "lucide-react";
import AddressSelector, { AddressType } from "@/components/shared/address-selector";
import PaymentMethodSelector, { PaymentMethodType } from "@/components/shared/payment-method-selector";
import PriceSummary from "@/components/shared/price-summary";
import OrderSummaryCard from "@/components/shared/order-summary-card";

export default function CheckoutPage() {
  const [cartData, setCartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [selectedAddress, setSelectedAddress] = useState<AddressType | null>(null);
  const [deliverySlot, setDeliverySlot] = useState("12:00 PM - 1:00 PM (Lunch)");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("UPI");

  const [showBlockingPinModal, setShowBlockingPinModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/cart");
      if (res.ok) {
        const data = await res.json();
        setCartData(data);
        if (!data.items || data.items.length === 0) {
          window.location.href = "/user/cart";
        }
      }
    } catch (err) {
      console.error("Cart fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const timeSlots = [
    "12:00 PM - 1:00 PM (Lunch Slot 1)",
    "1:00 PM - 2:00 PM (Lunch Slot 2)",
    "7:00 PM - 8:00 PM (Dinner Slot 1)",
    "8:00 PM - 9:00 PM (Dinner Slot 2)",
  ];

  const handleProceedToPayment = async () => {
    setErrorMsg(null);

    if (!selectedAddress) {
      setErrorMsg("Please select or add a delivery address.");
      return;
    }

    if (!selectedAddress.latitude || !selectedAddress.longitude) {
      setShowBlockingPinModal(true);
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/user/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId: selectedAddress.id,
          deliverySlot,
          notes,
          paymentMethod,
        }),
      });

      const data = await res.json();
      setSubmitting(false);

      if (!res.ok) {
        if (data.error?.includes("pin location")) {
          setShowBlockingPinModal(true);
        } else {
          setErrorMsg(data.error || "Failed to initiate order.");
        }
        return;
      }

      // Store pending order details in sessionStorage & redirect to payment screen
      sessionStorage.setItem("pending_order_id", data.orderId);
      sessionStorage.setItem("pending_payment_method", paymentMethod);
      sessionStorage.setItem("pending_order_total", String(data.total));

      window.location.href = `/user/payment?orderId=${data.orderId}&method=${paymentMethod}&amount=${data.total}`;
    } catch (err) {
      setSubmitting(false);
      setErrorMsg("An error occurred while creating order.");
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-12 bg-[#FFF8EE] border-2 border-[#0F3329] rounded-3xl text-center space-y-4 animate-pulse">
        <div className="w-12 h-12 rounded-full bg-[#0F3329]/10 mx-auto" />
        <div className="h-6 bg-[#0F3329]/15 rounded w-1/3 mx-auto" />
      </div>
    );
  }

  const items = cartData?.items || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b-2 border-[#0F3329]/15 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/user/cart" className="p-2 rounded-xl bg-[#FFF8EE] border border-[#0F3329]/20 text-[#0F3329]">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-outfit font-black text-2xl sm:text-3xl text-[#0F3329] uppercase tracking-tight">
              CHECKOUT & ADDRESS PIN
            </h1>
            <span className="font-sans text-xs text-[#0F3329]/70">
              Step 1 of 2 • Confirm Delivery Details
            </span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-100 border-2 border-red-400 text-red-900 text-xs font-sans font-bold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-700" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* LEFT COLUMN: ADDRESS, TIME SLOT, NOTES, PAYMENT METHOD */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. ADDRESS SELECTOR & PINNED MAP CHECK */}
          <div className="bg-[#FFF8EE] border-2 border-[#0F3329] rounded-3xl p-5 sm:p-6 space-y-4">
            <AddressSelector
              selectedAddressId={selectedAddress?.id || null}
              onSelectAddress={(addr) => {
                setSelectedAddress(addr);
                if (!addr.latitude || !addr.longitude) {
                  setShowBlockingPinModal(true);
                }
              }}
              showBlockingPinModal={showBlockingPinModal}
              onCloseBlockingPinModal={() => setShowBlockingPinModal(false)}
            />
          </div>

          {/* 2. DELIVERY TIME SLOT */}
          <div className="bg-[#FFF8EE] border-2 border-[#0F3329] rounded-3xl p-5 sm:p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#E5A00D]" />
              <h3 className="font-outfit font-black text-sm uppercase tracking-wider text-[#0F3329]">
                Select Delivery Time Window
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {timeSlots.map((slot, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setDeliverySlot(slot)}
                  className={`p-3 rounded-2xl border-2 text-left font-outfit text-xs font-bold uppercase transition-all ${
                    deliverySlot === slot
                      ? "bg-[#0F3329] text-[#f5e3cd] border-[#0F3329]"
                      : "bg-white/70 text-[#0F3329] border-[#0F3329]/20 hover:border-[#0F3329]/50"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          {/* 3. ORDER NOTES */}
          <div className="bg-[#FFF8EE] border-2 border-[#0F3329] rounded-3xl p-5 sm:p-6 space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#E5A00D]" />
              <h3 className="font-outfit font-black text-sm uppercase tracking-wider text-[#0F3329]">
                Special Instructions / Order Notes
              </h3>
            </div>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Leave at security gate, call on arrival, extra spicy sauce on side..."
              className="w-full px-4 py-2.5 rounded-2xl border-2 border-[#0F3329]/30 bg-white font-sans text-xs text-[#0F3329] placeholder-[#0F3329]/40 focus:outline-none focus:border-[#0F3329]"
            />
          </div>

          {/* 4. PAYMENT METHOD SELECTION */}
          <div className="bg-[#FFF8EE] border-2 border-[#0F3329] rounded-3xl p-5 sm:p-6 space-y-4">
            <h3 className="font-outfit font-black text-sm uppercase tracking-wider text-[#0F3329]">
              Choose Payment Method
            </h3>
            <PaymentMethodSelector
              selectedMethod={paymentMethod}
              onSelectMethod={(method) => setPaymentMethod(method)}
            />
          </div>
        </div>

        {/* RIGHT COLUMN: ORDER RECAP & FINAL BILL SUMMARY */}
        <div className="space-y-6">
          <OrderSummaryCard items={items} />

          <PriceSummary
            subtotal={cartData?.subtotal || 0}
            deliveryFee={cartData?.deliveryFee || 0}
            discount={cartData?.discount || 0}
            total={cartData?.total || 0}
          />

          <button
            type="button"
            onClick={handleProceedToPayment}
            disabled={submitting}
            className="w-full py-4 rounded-2xl bg-[#0F3329] text-[#f5e3cd] font-outfit font-black text-sm uppercase tracking-wider hover:bg-[#1B4D3E] transition-all flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] disabled:opacity-40"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#E5A00D]" />
                <span>Processing Order...</span>
              </>
            ) : (
              <>
                <span>Proceed to Payment</span>
                <ArrowRight className="w-4 h-4 text-[#E5A00D]" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
