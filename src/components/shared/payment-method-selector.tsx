"use client";

import React, { useState } from "react";
import { QrCode, CreditCard, Banknote, Building2, Check, ShieldCheck } from "lucide-react";

export type PaymentMethodType = "UPI" | "CREDIT_CARD" | "DEBIT_CARD" | "NET_BANKING" | "CASH_ON_DELIVERY";

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethodType;
  onSelectMethod: (method: PaymentMethodType) => void;
  allowCOD?: boolean;
}

export default function PaymentMethodSelector({
  selectedMethod,
  onSelectMethod,
  allowCOD = true,
}: PaymentMethodSelectorProps) {
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const methods = [
    {
      id: "UPI" as PaymentMethodType,
      name: "UPI / QR Code",
      badge: "Fastest",
      description: "Google Pay, PhonePe, Paytm, BHIM UPI",
      icon: QrCode,
    },
    {
      id: "CREDIT_CARD" as PaymentMethodType,
      name: "Credit / Debit Card",
      badge: "Instant",
      description: "Visa, MasterCard, RuPay, Amex",
      icon: CreditCard,
    },
    {
      id: "NET_BANKING" as PaymentMethodType,
      name: "Net Banking",
      badge: "All Banks",
      description: "HDFC, ICICI, SBI, Axis, Kotak",
      icon: Building2,
    },
    ...(allowCOD
      ? [
          {
            id: "CASH_ON_DELIVERY" as PaymentMethodType,
            name: "Cash on Delivery",
            badge: "Pay at Doorstep",
            description: "Pay via Cash or UPI QR upon delivery",
            icon: Banknote,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {methods.map((item) => {
          const isSelected = selectedMethod === item.id;
          const Icon = item.icon;

          return (
            <div
              key={item.id}
              onClick={() => onSelectMethod(item.id)}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all space-y-2 relative ${
                isSelected
                  ? "bg-[#FFF8EE] border-[#0F3329] shadow-sm"
                  : "bg-white/60 border-[#0F3329]/20 hover:border-[#0F3329]/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${isSelected ? "bg-[#0F3329] text-[#E5A00D]" : "bg-[#0F3329]/10 text-[#0F3329]"}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-outfit font-extrabold text-xs uppercase text-[#0F3329]">
                      {item.name}
                    </h4>
                    <span className="font-sans text-[11px] text-[#0F3329]/70 block">
                      {item.description}
                    </span>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isSelected ? "border-[#0F3329] bg-[#0F3329] text-[#f5e3cd]" : "border-[#0F3329]/30"
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* EXPANDED METHOD DETAILS */}
      {selectedMethod === "UPI" && (
        <div className="p-4 rounded-2xl bg-[#FFF8EE] border-2 border-[#0F3329]/30 space-y-3 animate-in fade-in">
          <label className="font-outfit text-xs font-black uppercase text-[#0F3329] block">
            Enter Virtual Payment Address (VPA / UPI ID)
          </label>
          <input
            type="text"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="username@upi (e.g. mobile@okaxis)"
            className="w-full px-4 py-2.5 rounded-xl border-2 border-[#0F3329]/30 bg-white font-sans text-xs text-[#0F3329]"
          />
          <p className="font-sans text-[11px] text-[#0F3329]/70 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            You will receive a payment request on your UPI app to approve payment.
          </p>
        </div>
      )}

      {(selectedMethod === "CREDIT_CARD" || selectedMethod === "DEBIT_CARD") && (
        <div className="p-4 rounded-2xl bg-[#FFF8EE] border-2 border-[#0F3329]/30 space-y-3 animate-in fade-in">
          <div>
            <label className="font-outfit text-xs font-black uppercase text-[#0F3329] block mb-1">
              Card Number
            </label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="4532 •••• •••• 8912"
              className="w-full px-4 py-2.5 rounded-xl border-2 border-[#0F3329]/30 bg-white font-sans text-xs text-[#0F3329]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-outfit text-xs font-black uppercase text-[#0F3329] block mb-1">
                Expiry Date
              </label>
              <input
                type="text"
                value={cardExpiry}
                onChange={(e) => setCardExpiry(e.target.value)}
                placeholder="MM/YY"
                className="w-full px-4 py-2.5 rounded-xl border-2 border-[#0F3329]/30 bg-white font-sans text-xs text-[#0F3329]"
              />
            </div>
            <div>
              <label className="font-outfit text-xs font-black uppercase text-[#0F3329] block mb-1">
                CVV / CVC
              </label>
              <input
                type="password"
                maxLength={4}
                value={cardCvv}
                onChange={(e) => setCardCvv(e.target.value)}
                placeholder="•••"
                className="w-full px-4 py-2.5 rounded-xl border-2 border-[#0F3329]/30 bg-white font-sans text-xs text-[#0F3329]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
