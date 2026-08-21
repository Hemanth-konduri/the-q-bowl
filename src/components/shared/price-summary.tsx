"use client";

import React from "react";
import { Receipt, ShieldCheck } from "lucide-react";

interface PriceSummaryProps {
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  title?: string;
  isSubscription?: boolean;
}

export default function PriceSummary({
  subtotal,
  deliveryFee,
  discount,
  total,
  title = "Price Summary",
  isSubscription = false,
}: PriceSummaryProps) {
  return (
    <div className="bg-[#FFF8EE] border-2 border-[#0F3329] rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2 border-b border-[#0F3329]/15 pb-3">
        <Receipt className="w-5 h-5 text-[#E5A00D]" />
        <h3 className="font-outfit font-black text-sm uppercase tracking-wider text-[#0F3329]">
          {title}
        </h3>
      </div>

      <div className="space-y-2.5 font-outfit text-xs sm:text-sm">
        <div className="flex justify-between items-center text-[#0F3329]/80">
          <span>{isSubscription ? "Base Plan Price" : "Item Subtotal"}</span>
          <span className="font-bold text-[#0F3329]">₹{subtotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center text-[#0F3329]/80">
          <span>Delivery Fee</span>
          {deliveryFee === 0 ? (
            <span className="font-bold text-emerald-700 uppercase text-xs">FREE</span>
          ) : (
            <span className="font-bold text-[#0F3329]">₹{deliveryFee.toFixed(2)}</span>
          )}
        </div>

        {discount > 0 && (
          <div className="flex justify-between items-center text-emerald-700 font-bold">
            <span>Promo Discount</span>
            <span>- ₹{discount.toFixed(2)}</span>
          </div>
        )}

        <div className="border-t-2 border-dashed border-[#0F3329]/20 pt-3 flex justify-between items-baseline">
          <div>
            <span className="font-outfit font-black text-base uppercase text-[#0F3329] block">
              Total Amount
            </span>
            <span className="font-sans text-[11px] text-[#0F3329]/60 block">
              Includes all taxes & packaging
            </span>
          </div>
          <span className="font-outfit font-black text-2xl text-[#0F3329]">₹{total.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-[#0F3329]/10 text-[11px] font-sans font-medium text-[#0F3329]/70">
        <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
        <span>100% Secure Checkout with Insulated Fresh Delivery Guarantee</span>
      </div>
    </div>
  );
}
