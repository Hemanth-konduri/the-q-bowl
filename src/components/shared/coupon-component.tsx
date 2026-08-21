"use client";

import React, { useState } from "react";
import { Tag, CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface CouponComponentProps {
  appliedOffer?: {
    id: string;
    name: string;
    description?: string | null;
  } | null;
  subtotal: number;
  onApplyCoupon: (code: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  onRemoveCoupon: () => Promise<void>;
}

export default function CouponComponent({
  appliedOffer,
  subtotal,
  onApplyCoupon,
  onRemoveCoupon,
}: CouponComponentProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleApply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await onApplyCoupon(code.trim());
    setLoading(false);

    if (res.success) {
      setSuccessMsg(res.message || "Coupon code applied successfully!");
      setCode("");
    } else {
      setErrorMsg(res.error || "Failed to apply coupon");
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    await onRemoveCoupon();
    setLoading(false);
  };

  return (
    <div className="bg-[#FFF8EE] border-2 border-[#0F3329] rounded-2xl p-4 sm:p-5 space-y-3">
      <div className="flex items-center gap-2 text-[#0F3329]">
        <Tag className="w-5 h-5 text-[#E5A00D]" />
        <h3 className="font-outfit font-black text-sm uppercase tracking-wider">
          Apply Promo / Coupon Code
        </h3>
      </div>

      {appliedOffer ? (
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#EAF2ED] border border-[#0F3329]/20">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            <div>
              <span className="font-outfit font-black text-xs uppercase tracking-wider text-[#0F3329] block">
                {appliedOffer.name} APPLIED
              </span>
              {appliedOffer.description && (
                <span className="font-sans text-xs text-[#0F3329]/70 block">
                  {appliedOffer.description}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={loading}
            className="text-xs font-outfit font-bold uppercase text-red-700 hover:underline px-2 py-1"
          >
            Remove
          </button>
        </div>
      ) : (
        <form onSubmit={handleApply} className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="TRY 'WELCOME50' or 'QBOWL20'"
            className="flex-1 px-4 py-2.5 rounded-xl border-2 border-[#0F3329]/30 bg-white font-outfit font-bold text-xs sm:text-sm uppercase tracking-wider text-[#0F3329] placeholder-[#0F3329]/40 focus:outline-none focus:border-[#0F3329]"
          />
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="px-5 py-2.5 rounded-xl bg-[#0F3329] text-[#f5e3cd] font-outfit font-black text-xs uppercase tracking-wider hover:bg-[#1B4D3E] transition-all disabled:opacity-40 flex items-center gap-1.5 shrink-0"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Apply</span>
          </button>
        </form>
      )}

      {errorMsg && (
        <div className="flex items-center gap-1.5 text-red-700 text-xs font-sans font-semibold">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-sans font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
    </div>
  );
}
