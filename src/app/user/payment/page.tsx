"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Lock, ShieldCheck, CheckCircle2, Loader2, ArrowLeft, CreditCard, QrCode, Banknote } from "lucide-react";
import PriceSummary from "@/components/shared/price-summary";

export default function PaymentPage() {
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("UPI");
  const [amount, setAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const oId = urlParams.get("orderId") || sessionStorage.getItem("pending_order_id");
    const pMethod = urlParams.get("method") || sessionStorage.getItem("pending_payment_method") || "UPI";
    const pAmount = Number(urlParams.get("amount") || sessionStorage.getItem("pending_order_total") || "0");

    if (!oId) {
      window.location.href = "/user/cart";
      return;
    }

    setOrderId(oId);
    setPaymentMethod(pMethod);
    setAmount(pAmount);
  }, []);

  const handlePayNow = async () => {
    if (isProcessing || !orderId) return; // Prevent duplicate payment submissions

    try {
      setIsProcessing(true);
      setErrorMsg(null);

      // Generate transaction token to prevent duplicate calls
      const transactionToken = `TXN-ORD-${orderId}-${Date.now()}`;

      const res = await fetch("/api/payments/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          paymentMethod,
          amount,
          transactionToken,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setIsProcessing(false);
        setErrorMsg(data.error || "Payment processing failed. Please try again.");
        return;
      }

      // Clear pending session items
      sessionStorage.removeItem("pending_order_id");
      sessionStorage.removeItem("pending_payment_method");
      sessionStorage.removeItem("pending_order_total");

      // Small deliberate delay for realistic processing animation
      setTimeout(() => {
        window.location.href = `/user/order-success/${orderId}`;
      }, 1200);
    } catch (err) {
      setIsProcessing(false);
      setErrorMsg("Connection error during payment processing.");
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 sm:py-12 px-4 space-y-6">
      {/* HEADER */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-full bg-[#0F3329] text-[#E5A00D] flex items-center justify-center mx-auto shadow-md">
          <Lock className="w-6 h-6 stroke-[2.5]" />
        </div>
        <h1 className="font-outfit font-black text-2xl sm:text-3xl text-[#0F3329] uppercase tracking-tight">
          SECURE PAYMENT GATEWAY
        </h1>
        <p className="font-sans text-xs text-[#0F3329]/70">
          Encrypted 256-bit SSL transaction for Order <span className="font-bold text-[#0F3329]">{orderId}</span>
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-100 border-2 border-red-400 text-red-900 text-xs font-sans font-bold">
          {errorMsg}
        </div>
      )}

      {/* PAYMENT RECAP CARD */}
      <div className="bg-[#FFF8EE] border-2 border-[#0F3329] rounded-3xl p-6 space-y-5 shadow-lg">
        <div className="flex items-center justify-between border-b border-[#0F3329]/15 pb-4">
          <div>
            <span className="font-outfit text-[11px] font-black uppercase text-[#0F3329]/60 block">
              Payment Method
            </span>
            <span className="font-outfit font-black text-base uppercase text-[#0F3329]">
              {paymentMethod.replace("_", " ")}
            </span>
          </div>

          <div className="text-right">
            <span className="font-outfit text-[11px] font-black uppercase text-[#0F3329]/60 block">
              Amount Payable
            </span>
            <span className="font-outfit font-black text-2xl text-[#0F3329]">₹{amount.toFixed(2)}</span>
          </div>
        </div>

        {/* METHOD SIMULATION UI */}
        {paymentMethod === "UPI" && (
          <div className="p-4 rounded-2xl bg-white border border-[#0F3329]/20 text-center space-y-3">
            <div className="w-32 h-32 mx-auto bg-[#f5e3cd] rounded-xl border border-[#0F3329]/30 p-2 flex items-center justify-center relative">
              <QrCode className="w-24 h-24 text-[#0F3329]" />
            </div>
            <p className="font-outfit text-xs font-bold uppercase text-[#0F3329]">
              Scan QR or approve request on UPI App
            </p>
          </div>
        )}

        {(paymentMethod === "CREDIT_CARD" || paymentMethod === "DEBIT_CARD") && (
          <div className="p-4 rounded-2xl bg-white border border-[#0F3329]/20 flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-[#0F3329]" />
            <div>
              <span className="font-outfit text-xs font-bold uppercase text-[#0F3329] block">
                Saved Card •••• 8912
              </span>
              <span className="font-sans text-[11px] text-[#0F3329]/70 block">
                256-bit PCI-DSS Compliant Encryption
              </span>
            </div>
          </div>
        )}

        {paymentMethod === "CASH_ON_DELIVERY" && (
          <div className="p-4 rounded-2xl bg-white border border-[#0F3329]/20 flex items-center gap-3">
            <Banknote className="w-8 h-8 text-emerald-700" />
            <div>
              <span className="font-outfit text-xs font-bold uppercase text-[#0F3329] block">
                Pay on Delivery
              </span>
              <span className="font-sans text-[11px] text-[#0F3329]/70 block">
                Pay via Cash or QR code when rider arrives.
              </span>
            </div>
          </div>
        )}

        {/* PAY NOW BUTTON */}
        <button
          type="button"
          onClick={handlePayNow}
          disabled={isProcessing}
          className="w-full py-4 rounded-2xl bg-[#0F3329] text-[#f5e3cd] font-outfit font-black text-sm uppercase tracking-wider hover:bg-[#1B4D3E] transition-all flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-[#E5A00D]" />
              <span>Authorizing Payment...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-5 h-5 text-[#E5A00D]" />
              <span>Confirm & Pay ₹{amount.toFixed(2)}</span>
            </>
          )}
        </button>
      </div>

      <div className="text-center font-sans text-xs text-[#0F3329]/60">
        Need to change payment details?{" "}
        <Link href="/user/checkout" className="font-bold underline text-[#0F3329]">
          Return to Checkout
        </Link>
      </div>
    </div>
  );
}
