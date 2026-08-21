"use client";

import React from "react";
import Image from "next/image";
import { Utensils } from "lucide-react";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  isVeg?: boolean;
}

interface OrderSummaryCardProps {
  items: OrderItem[];
  title?: string;
}

export default function OrderSummaryCard({
  items,
  title = "Order Items",
}: OrderSummaryCardProps) {
  return (
    <div className="bg-[#FFF8EE] border-2 border-[#0F3329] rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2 border-b border-[#0F3329]/15 pb-3">
        <Utensils className="w-5 h-5 text-[#E5A00D]" />
        <h3 className="font-outfit font-black text-sm uppercase tracking-wider text-[#0F3329]">
          {title} ({items.reduce((acc, i) => acc + i.quantity, 0)})
        </h3>
      </div>

      <div className="space-y-3 divide-y divide-[#0F3329]/10 max-h-[360px] overflow-y-auto pr-1">
        {items.map((item) => (
          <div key={item.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl border border-[#0F3329]/20 overflow-hidden relative shrink-0 bg-[#f5e3cd]">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-outfit font-black text-xs text-[#0F3329]">
                    QB
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      item.isVeg === false ? "bg-red-600" : "bg-emerald-600"
                    }`}
                  />
                  <h4 className="font-outfit font-extrabold text-xs uppercase text-[#0F3329]">
                    {item.name}
                  </h4>
                </div>
                <span className="font-sans text-xs text-[#0F3329]/70 block mt-0.5">
                  Qty: {item.quantity} × ₹{item.price}
                </span>
              </div>
            </div>

            <span className="font-outfit font-black text-sm text-[#0F3329] shrink-0">
              ₹{(item.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
