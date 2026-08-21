"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, ArrowLeft, ArrowRight, Trash2, ShieldCheck, Utensils } from "lucide-react";
import QuantityStepper from "@/components/shared/quantity-stepper";
import CouponComponent from "@/components/shared/coupon-component";
import PriceSummary from "@/components/shared/price-summary";
import { EmptyCartState } from "@/components/shared/loading-empty-states";

export default function CartPage() {
  const [cartData, setCartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/cart");
      if (res.ok) {
        const data = await res.json();
        setCartData(data);
      }
    } catch (err) {
      console.error("Failed to fetch cart:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const updateQuantity = async (foodItemId: string, quantity: number) => {
    try {
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodItemId, quantity }),
      });
      await fetchCart();
    } catch (err) {
      console.error("Cart update error:", err);
    }
  };

  const removeItem = async (foodItemId: string) => {
    try {
      await fetch(`/api/cart?foodItemId=${foodItemId}`, {
        method: "DELETE",
      });
      await fetchCart();
    } catch (err) {
      console.error("Item removal error:", err);
    }
  };

  const handleApplyCoupon = async (code: string) => {
    try {
      const res = await fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponCode: code }),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchCart();
        return { success: true, message: `Coupon '${code}' applied!` };
      } else {
        return { success: false, error: data.error || "Invalid coupon code" };
      }
    } catch (err) {
      return { success: false, error: "Failed to apply coupon" };
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      await fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponCode: "" }),
      });
      await fetchCart();
    } catch (err) {
      console.error("Coupon remove error:", err);
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

  if (items.length === 0) {
    return <EmptyCartState />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b-2 border-[#0F3329]/15 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0F3329] text-[#E5A00D] flex items-center justify-center font-outfit font-black text-lg">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-outfit font-black text-2xl sm:text-3xl text-[#0F3329] uppercase tracking-tight">
              YOUR MEAL BOWL CART
            </h1>
            <span className="font-sans text-xs text-[#0F3329]/70">
              {items.reduce((acc: number, i: any) => acc + i.quantity, 0)} Items Selected
            </span>
          </div>
        </div>

        <Link
          href="/user/menu"
          className="hidden sm:flex items-center gap-2 font-outfit text-xs font-black uppercase text-[#0F3329] hover:underline"
        >
          <ArrowLeft className="w-4 h-4 text-[#E5A00D]" />
          <span>Continue Shopping</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* ITEMS LIST (LEFT 2 COLS) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#FFF8EE] border-2 border-[#0F3329] rounded-3xl p-5 sm:p-6 divide-y divide-[#0F3329]/10 space-y-4">
            {items.map((item: any) => (
              <div key={item.id} className="pt-4 first:pt-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl border-2 border-[#0F3329]/20 overflow-hidden relative bg-[#f5e3cd] shrink-0">
                    <Image
                      src={item.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80"}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          item.isVeg === false ? "bg-red-600" : "bg-emerald-600"
                        }`}
                      />
                      <h3 className="font-outfit font-black text-sm uppercase text-[#0F3329]">
                        {item.name}
                      </h3>
                    </div>
                    <p className="font-sans text-xs text-[#0F3329]/70 mt-0.5">
                      ₹{item.price} • {item.calories} Kcal
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0">
                  <QuantityStepper
                    quantity={item.quantity}
                    onIncrease={() => updateQuantity(item.foodItemId, item.quantity + 1)}
                    onDecrease={() => updateQuantity(item.foodItemId, item.quantity - 1)}
                    onRemove={() => removeItem(item.foodItemId)}
                    size="md"
                  />

                  <div className="text-right shrink-0">
                    <span className="font-sans text-[10px] uppercase text-[#0F3329]/60 block font-bold">
                      Subtotal
                    </span>
                    <span className="font-outfit font-black text-base text-[#0F3329]">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between sm:hidden">
            <Link
              href="/user/menu"
              className="flex items-center gap-1 font-outfit text-xs font-black uppercase text-[#0F3329]"
            >
              <ArrowLeft className="w-4 h-4 text-[#E5A00D]" />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>

        {/* PRICE & COUPON SIDEBAR (RIGHT COL) */}
        <div className="space-y-6">
          <CouponComponent
            appliedOffer={cartData?.offer}
            subtotal={cartData?.subtotal || 0}
            onApplyCoupon={handleApplyCoupon}
            onRemoveCoupon={handleRemoveCoupon}
          />

          <PriceSummary
            subtotal={cartData?.subtotal || 0}
            deliveryFee={cartData?.deliveryFee || 0}
            discount={cartData?.discount || 0}
            total={cartData?.total || 0}
          />

          <Link
            href="/user/checkout"
            className="w-full py-4 rounded-2xl bg-[#0F3329] text-[#f5e3cd] font-outfit font-black text-sm uppercase tracking-wider hover:bg-[#1B4D3E] transition-all flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02]"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4 text-[#E5A00D]" />
          </Link>
        </div>
      </div>
    </div>
  );
}
