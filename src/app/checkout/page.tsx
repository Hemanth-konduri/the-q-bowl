"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  ShieldCheck,
  CreditCard,
  Landmark,
  Banknote,
  MapPin,
  Clock,
  ChevronRight,
  Loader2,
  AlertCircle,
  X,
  Plus,
  Minus,
  Smartphone,
  Tag,
  Gift,
  Percent,
  Check,
  Sparkles,
  Utensils,
} from "lucide-react";
import { AddressModal, AddressItem } from "@/components/dashboard/AddressModal";
import { openRazorpayModal } from "@/lib/razorpay-client";
import { formatOrderId } from "@/lib/utils/orderIdFormatter";

interface CartItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  specs?: string;
  quantity: number;
  isVeg?: boolean;
}

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
}

type PaymentMethodType = "UPI" | "CARD" | "NETBANKING" | "COD";

// Official Brand Logos
function PhonePeLogo() {
  return (
    <div className="w-11 h-11 rounded-xl bg-white border border-black/10 flex items-center justify-center p-1 shrink-0 shadow-sm">
      <img src="/icons/phonepe.svg" alt="PhonePe" className="w-9 h-9 object-contain" />
    </div>
  );
}

function GooglePayLogo() {
  return (
    <div className="w-11 h-11 rounded-xl bg-white border border-black/10 flex items-center justify-center p-1.5 shrink-0 shadow-sm">
      <img src="/icons/gpay.svg" alt="Google Pay" className="w-8 h-8 object-contain" />
    </div>
  );
}

function NaviLogo() {
  return (
    <div className="w-11 h-11 rounded-xl bg-white border border-black/10 flex items-center justify-center p-1 shrink-0 shadow-sm">
      <img src="/image.png" alt="Navi" className="w-9 h-9 object-contain rounded-lg" />
    </div>
  );
}

function AmazonPayLogo() {
  return (
    <div className="w-11 h-11 rounded-xl bg-white border border-black/10 flex items-center justify-center p-1.5 shrink-0 shadow-sm">
      <img src="/icons/amazonpay.svg" alt="Amazon Pay" className="w-8 h-8 object-contain" />
    </div>
  );
}

function PaytmLogo() {
  return (
    <div className="w-11 h-11 rounded-xl bg-white border border-black/10 flex items-center justify-center p-1.5 shrink-0 shadow-sm">
      <img src="/icons/paytm.svg" alt="Paytm" className="w-9 h-auto object-contain" />
    </div>
  );
}

const UPI_APPS = [
  { id: "phonepe", label: "PhonePe", icon: <PhonePeLogo /> },
  { id: "gpay", label: "Google Pay", icon: <GooglePayLogo /> },
  { id: "navi", label: "Navi", icon: <NaviLogo /> },
  { id: "amazonpay", label: "Amazon Pay", icon: <AmazonPayLogo /> },
  { id: "paytm", label: "Paytm", icon: <PaytmLogo /> },
];

export default function CheckoutPage() {
  const router = useRouter();

  // Cart & Order State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  // Payment Selection
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("UPI");
  const [selectedUpiApp, setSelectedUpiApp] = useState<string>("phonepe");

  // Execution State
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const isSubmittingRef = useRef(false);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Kitchen Status State
  const [isKitchenClosed, setIsKitchenClosed] = useState<boolean>(false);
  const [kitchenStatusMsg, setKitchenStatusMsg] = useState<string>("");

  // Coupon & Promotional Discounts State
  interface AvailableCoupon {
    id: string;
    code: string;
    displayName: string;
    description: string | null;
    discountType: "PERCENTAGE" | "FIXED";
    discountValue: number;
    minOrderAmount: number;
    maxDiscount: number | null;
    endDate: string | null;
    formattedDiscount: string;
  }
  const [availableCoupons, setAvailableCoupons] = useState<AvailableCoupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [showCouponsModal, setShowCouponsModal] = useState(false);
  const [couponInput, setCouponInput] = useState<string>("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    name: string;
    discount: number;
    offerId?: string;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Fetch available active coupons
  useEffect(() => {
    async function fetchCoupons() {
      try {
        setLoadingCoupons(true);
        const res = await fetch("/api/coupons");
        if (res.ok) {
          const data = await res.json();
          setAvailableCoupons(data.coupons || []);
        }
      } catch (err) {
        console.error("Failed to load checkout coupons:", err);
      } finally {
        setLoadingCoupons(false);
      }
    }
    fetchCoupons();

    // Check if customer clicked "Apply" from dashboard
    const pendingCode = localStorage.getItem("qbowl_pending_coupon");
    if (pendingCode) {
      setCouponInput(pendingCode);
      localStorage.removeItem("qbowl_pending_coupon");
    }
  }, []);

  // Check Kitchen Status on Mount
  useEffect(() => {
    async function checkKitchenStatus() {
      try {
        const res = await fetch(`/api/kitchen/status?t=${Date.now()}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const status = data.settings?.kitchenStatus || data.kitchenStatus || "OPEN";
          const isPaused = Boolean(data.settings?.isOrderingPaused ?? data.isOrderingPaused);
          const closed = (typeof data.isOpenNow === "boolean") ? !data.isOpenNow : (status !== "OPEN" || isPaused);
          setIsKitchenClosed(closed);
          if (closed) {
            const openingTime = data.settings?.openingTime || data.openingTime || "11:00 AM";
            const closingTime = data.settings?.closingTime || data.closingTime || "11:00 PM";
            setKitchenStatusMsg(
              status === "TEMPORARILY_UNAVAILABLE" || isPaused
                ? "The kitchen is temporarily unavailable and not accepting orders at this time."
                : `The kitchen is currently closed. Operating hours: ${openingTime} – ${closingTime}.`
            );
          }
        }
      } catch (e) { }
    }
    checkKitchenStatus();
  }, []);

  // Sync Cart Items from localStorage & enrich missing images
  useEffect(() => {
    async function loadCart() {
      try {
        const detailsStr = localStorage.getItem("qbowl_cart_details");
        if (detailsStr) {
          const detailsMap = JSON.parse(detailsStr);
          let list = Object.values(detailsMap) as CartItem[];
          setCartItems(list);
          if (list.length === 0) {
            router.push("/dashboard");
            return;
          }

          // If any item is missing an image, try fetching meals catalog to populate it
          const missingImage = list.some((item) => !item.image);
          if (missingImage) {
            try {
              const res = await fetch("/api/meals");
              if (res.ok) {
                const data = await res.json();
                if (data.meals && Array.isArray(data.meals)) {
                  let updated = false;
                  list = list.map((cartItem) => {
                    if (cartItem.image) return cartItem;
                    const match = data.meals.find((m: any) => m.id === cartItem.id);
                    let img = match?.imageUrl;
                    if (!img) {
                      if (cartItem.name?.toLowerCase().includes("biryani")) img = "/biryani_handi_slider.jpg";
                      else if (cartItem.name?.toLowerCase().includes("burger")) img = "/truffle_burger.jpg";
                      else if (cartItem.name?.toLowerCase().includes("pizza")) img = "/margherita_pizza.jpg";
                      else if (cartItem.isVeg) img = "/paneer_bowl_new.png";
                      else img = "/chicken_dum_biryani.png";
                    }
                    if (img) {
                      updated = true;
                      detailsMap[cartItem.id] = { ...cartItem, image: img };
                      return { ...cartItem, image: img };
                    }
                    return cartItem;
                  });

                  if (updated) {
                    localStorage.setItem("qbowl_cart_details", JSON.stringify(detailsMap));
                    setCartItems([...list]);
                  }
                }
              }
            } catch (err) {
              console.error("Failed to enrich cart images:", err);
            }
          }
        } else {
          setCartItems([]);
          router.push("/dashboard");
        }
      } catch (e) {
        console.error("Failed to load cart:", e);
      }
    }
    loadCart();
    window.addEventListener("qbowl-cart-updated", loadCart);
    return () => window.removeEventListener("qbowl-cart-updated", loadCart);
  }, [router]);

  // Load User and Addresses
  useEffect(() => {
    async function loadUserData() {
      try {
        const [profileRes, addrRes] = await Promise.all([
          fetch("/api/user/profile"),
          fetch("/api/user/addresses"),
        ]);

        if (profileRes.ok) {
          const pData = await profileRes.json();
          if (pData.user) setUser(pData.user);
        }

        if (addrRes.ok) {
          const aData = await addrRes.json();
          const addrs: AddressItem[] = aData.addresses || [];
          setAddresses(addrs);
          if (addrs.length > 0) {
            const def = addrs.find((a) => a.isDefault) || addrs[0];
            setSelectedAddressId(def.id);
          }
        }
      } catch (err) {
        console.error("Failed to load addresses:", err);
      } finally {
        setLoadingAddresses(false);
      }
    }
    loadUserData();
  }, []);

  // Update Cart Quantity
  function handleQtyChange(item: CartItem, delta: number) {
    try {
      const detailsStr = localStorage.getItem("qbowl_cart_details");
      const detailsMap: Record<string, CartItem> = detailsStr ? JSON.parse(detailsStr) : {};
      const itemsStr = localStorage.getItem("qbowl_cart_items");
      const itemsMap: Record<string, number> = itemsStr ? JSON.parse(itemsStr) : {};

      const currentQty = detailsMap[item.id]?.quantity || 0;
      const nextQty = Math.max(0, currentQty + delta);

      if (nextQty === 0) {
        delete detailsMap[item.id];
        delete itemsMap[item.id];
      } else {
        detailsMap[item.id] = { ...item, quantity: nextQty };
        itemsMap[item.id] = nextQty;
      }

      const totalCount = Object.values(itemsMap).reduce((a, b) => a + b, 0);
      localStorage.setItem("qbowl_cart_details", JSON.stringify(detailsMap));
      localStorage.setItem("qbowl_cart_items", JSON.stringify(itemsMap));
      localStorage.setItem("qbowl_cart_count", String(totalCount));

      const updated = Object.values(detailsMap) as CartItem[];
      setCartItems(updated);
      window.dispatchEvent(new Event("qbowl-cart-updated"));

      if (updated.length === 0) router.push("/dashboard");

      fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodItemId: item.id, quantity: nextQty }),
      }).catch(console.error);
    } catch (err) {
      console.error(err);
    }
  }

  // Address Helper
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  // Computations
  const subtotal = cartItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;
  const grandTotal = Math.max(0, subtotal - discountAmount);

  // Validate & Apply Coupon Code
  async function handleApplyCoupon(codeToApply?: string) {
    const code = (codeToApply || couponInput).trim();
    if (!code) {
      setCouponError("Please enter a coupon code");
      return;
    }
    if (subtotal <= 0) {
      setCouponError("Cart is empty");
      return;
    }

    setIsValidatingCoupon(true);
    setCouponError(null);

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      });

      const data = await res.json();

      if (!res.ok || !data.valid) {
        setCouponError(data.error || "Invalid coupon code");
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon({
          code: data.code,
          name: data.name || data.code,
          discount: data.discount,
          offerId: data.offerId,
        });
        setCouponInput(data.code);
        setCouponError(null);
        setShowCouponsModal(false);
      }
    } catch (err: any) {
      console.error("Coupon application error:", err);
      setCouponError("Failed to apply coupon. Please try again.");
    } finally {
      setIsValidatingCoupon(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
  }

  // Complete Order & Trigger Razorpay
  async function handleCompleteOrder() {
    if (isSubmittingRef.current || isPlacingOrder) return;

    if (isKitchenClosed) {
      setErrorMsg(kitchenStatusMsg || "The kitchen is currently closed or unavailable for new orders.");
      return;
    }
    if (cartItems.length === 0) {
      setErrorMsg("Your bowl is empty. Please add items to order.");
      return;
    }
    if (!selectedAddressId) {
      setAddressModalOpen(true);
      return;
    }

    isSubmittingRef.current = true;
    setIsPlacingOrder(true);
    setErrorMsg(null);

    try {
      const cartItemsPayload = cartItems.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      // Cash On Delivery (COD) Flow
      if (paymentMethod === "COD") {
        const payload = {
          addressId: selectedAddressId,
          paymentMethod: "COD",
          couponCode: appliedCoupon?.code || undefined,
          notes: appliedCoupon ? `Coupon: ${appliedCoupon.code}. Placed via Checkout Page (Cash on Delivery)` : "Placed via Checkout Page (Cash on Delivery)",
          items: cartItemsPayload,
        };

        const res = await fetch("/api/user/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          handleOrderSuccess(data.orderId);
        } else {
          setErrorMsg(data.error || "Unable to place order. Please try again.");
          setIsPlacingOrder(false);
        }
        return;
      }

      // Online Razorpay Payment Flow
      const mappedMethod =
        paymentMethod === "UPI"
          ? "upi"
          : paymentMethod === "CARD"
            ? "card"
            : "netbanking";

      const createOrderRes = await fetch("/api/payments/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose: "ORDER",
          addressId: selectedAddressId,
          couponCode: appliedCoupon?.code || undefined,
          notes: `The Q Bowl Order via ${paymentMethod} (${selectedUpiApp})${appliedCoupon ? ` [Promo: ${appliedCoupon.code}]` : ""}`,
          items: cartItemsPayload,
        }),
      });

      const createOrderData = await createOrderRes.json();
      if (!createOrderRes.ok || !createOrderData.success) {
        setErrorMsg(createOrderData.error || "Unable to connect to Razorpay. Please try again.");
        setIsPlacingOrder(false);
        return;
      }

      // Open Razorpay Modal with Selected Payment Instrument
      await openRazorpayModal({
        keyId: createOrderData.keyId,
        razorpayOrderId: createOrderData.razorpayOrderId,
        amount: createOrderData.amount,
        currency: createOrderData.currency || "INR",
        name: "The Q Bowl",
        description: "Fresh Food Bowl Delivery",
        preferredMethod: mappedMethod,
        userName: createOrderData.customer?.name || user?.name || "",
        userEmail: createOrderData.customer?.email || user?.email || "",
        userPhone: createOrderData.customer?.phone || user?.phone || "",
        onSuccess: (verifyResult) => {
          isSubmittingRef.current = false;
          handleOrderSuccess(verifyResult.orderId || createOrderData.orderId);
        },
        onError: (errMsg) => {
          isSubmittingRef.current = false;
          setIsPlacingOrder(false);
          setErrorMsg(errMsg || "Payment was cancelled or failed. Please retry.");
        },
      });
    } catch (err: any) {
      isSubmittingRef.current = false;
      console.error("Checkout submission error:", err);
      setErrorMsg(err?.message || "Payment process could not be completed. Please retry.");
      setIsPlacingOrder(false);
    }
  }

  function handleOrderSuccess(orderId: string) {
    setIsPlacingOrder(false);
    setErrorMsg(null);
    setOrderSuccessMsg(`Order ${formatOrderId(orderId)} Placed! 🎉 Awaiting Kitchen Acceptance`);

    // Reset local cart
    localStorage.removeItem("qbowl_cart_items");
    localStorage.removeItem("qbowl_cart_details");
    localStorage.setItem("qbowl_cart_count", "0");
    window.dispatchEvent(new Event("qbowl-cart-updated"));
    window.dispatchEvent(new Event("qbowl-order-placed"));

    setTimeout(() => {
      router.push("/dashboard#active-order");
    }, 1800);
  }

  return (
    <div className="min-h-screen bg-[#FFF8EE] text-black font-sans antialiased flex flex-col">
      {/* Top Navbar Header */}
      <header className="sticky top-0 z-30 bg-[#FFF8EE]/95 backdrop-blur-md border-b-2 border-black">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          {/* Official Website Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 sm:gap-3 group transition-transform hover:scale-105">
            <div className="p-1 rounded-xl border-2 bg-white border-black shadow-[2px_2px_0px_#000000]">
              <Image
                src="/the_q_bowl_logo.png"
                alt="The Q Bowl Logo"
                width={36}
                height={36}
                priority
                className="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded-lg"
              />
            </div>
            <span className="font-outfit text-xl sm:text-2xl font-black uppercase tracking-wider text-black">
              The Q BOWL
            </span>
          </Link>

          {/* Security Assurance Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border-2 border-black shadow-[2px_2px_0px_#000000] text-xs font-bold text-black">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span className="hidden sm:inline">256-Bit SSL Razorpay Encrypted</span>
            <span className="sm:hidden">Secured</span>
          </div>
        </div>
      </header>

      {/* Main Checkout Area */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-8 flex-1">
        {/* Back Link & Title */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-black hover:text-[#E5A00D] transition-colors mb-1 group"
            >
              <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" />
              <span>Back to Menu</span>
            </Link>
            <h1 className="font-outfit text-2xl sm:text-3xl font-black uppercase tracking-wide text-black">
              Checkout &amp; Payment
            </h1>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1.5 rounded-xl">
            <Clock size={14} className="text-emerald-700" />
            <span>Campus Fast Delivery · 25-35 Mins</span>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border-2 border-red-400 text-red-800 text-xs sm:text-sm font-bold flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-800">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Success Modal */}
        {orderSuccessMsg && (
          <div className="mb-6 p-6 rounded-3xl bg-white border-2 border-black shadow-[6px_6px_0px_#000000] text-center space-y-3 animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 bg-[#E5A00D] rounded-full border-2 border-black flex items-center justify-center mx-auto text-black shadow-[2px_2px_0px_#000000]">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="font-outfit text-xl font-black uppercase">{orderSuccessMsg}</h3>
            <p className="text-xs font-bold text-zinc-600 flex items-center justify-center gap-1.5">
              <Loader2 size={14} className="animate-spin text-[#E5A00D]" /> Redirecting to Live Kitchen Tracking...
            </p>
          </div>
        )}

        {/* Kitchen Closed / Unavailable Warning Banner */}
        {isKitchenClosed && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-300 text-red-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <AlertCircle size={20} />
              </div>
              <div>
                <p className="font-outfit font-black text-sm uppercase text-red-950 flex items-center gap-1.5">
                  <span>Kitchen Unavailable</span>
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                </p>
                <p className="text-xs text-red-900/80 font-medium mt-0.5">{kitchenStatusMsg}</p>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-xl bg-black text-white hover:bg-zinc-800 font-outfit font-black text-xs uppercase tracking-wider shrink-0 transition-all text-center"
            >
              Back to Dashboard
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ==========================================
              LEFT COLUMN (7 cols): Address & Payment
          ========================================== */}
          <section className="lg:col-span-7 space-y-6">
            {/* 1. Delivery Address Card */}
            <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000000] p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b-2 border-black/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#E5A00D] border border-black flex items-center justify-center text-black font-bold">
                    <MapPin size={16} />
                  </div>
                  <h2 className="font-outfit font-black text-sm uppercase tracking-wider text-black">
                    Delivery Destination
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setAddressModalOpen(true)}
                  className="text-xs font-black text-black bg-[#FFF8EE] hover:bg-[#E5A00D] border-2 border-black px-3 py-1 rounded-xl shadow-[1px_1px_0px_#000000] transition-all"
                >
                  {selectedAddress ? "Change" : "+ Add Address"}
                </button>
              </div>

              {loadingAddresses ? (
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 py-3">
                  <Loader2 size={16} className="animate-spin text-[#E5A00D]" />
                  <span>Loading delivery locations...</span>
                </div>
              ) : selectedAddress ? (
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-black text-sm">{selectedAddress.label}</span>
                    {selectedAddress.isDefault && (
                      <span className="text-[9px] font-black bg-[#E5A00D] text-black px-1.5 py-0.5 rounded border border-black">
                        DEFAULT
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-600 font-semibold leading-relaxed">
                    {selectedAddress.address}
                    {selectedAddress.area ? `, ${selectedAddress.area}` : ""}
                    {selectedAddress.city ? `, ${selectedAddress.city}` : ""}
                    {selectedAddress.pincode ? ` - ${selectedAddress.pincode}` : ""}
                  </p>
                  {selectedAddress.landmark && (
                    <p className="text-[11px] text-zinc-400 font-medium">Landmark: {selectedAddress.landmark}</p>
                  )}
                </div>
              ) : (
                <div className="py-4 text-center space-y-2">
                  <p className="text-xs font-bold text-zinc-500">No address selected yet</p>
                  <button
                    onClick={() => setAddressModalOpen(true)}
                    className="text-xs font-black bg-black text-[#E5A00D] px-4 py-2 rounded-xl border border-black shadow-[2px_2px_0px_#E5A00D]"
                  >
                    Select Delivery Address
                  </button>
                </div>
              )}
            </div>

            {/* 2. Payment Method Selector */}
            <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000000] p-5 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b-2 border-black/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-black border border-black flex items-center justify-center text-[#E5A00D] font-bold">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <h2 className="font-outfit font-black text-sm uppercase tracking-wider text-black">
                      Payment Method
                    </h2>
                    <p className="text-[10px] text-zinc-500 font-bold">Processed via Razorpay Official Gateway</p>
                  </div>
                </div>
                <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full">
                  Instant Verified
                </span>
              </div>

              {/* Payment Methods Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "UPI", label: "UPI Apps", icon: <Smartphone size={16} />, badge: "FAST" },
                  { id: "CARD", label: "Cards", icon: <CreditCard size={16} />, badge: null },
                  { id: "NETBANKING", label: "NetBanking", icon: <Landmark size={16} />, badge: null },
                  { id: "COD", label: "Cash (COD)", icon: <Banknote size={16} />, badge: null },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as PaymentMethodType)}
                    className={`relative p-3 rounded-xl border-2 text-center flex flex-col items-center gap-1.5 transition-all ${paymentMethod === m.id
                      ? "border-black bg-black text-[#E5A00D] shadow-[2px_2px_0px_#E5A00D]"
                      : "border-zinc-200 bg-white text-zinc-600 hover:border-black/50"
                      }`}
                  >
                    {m.badge && (
                      <span className="absolute -top-2 -right-1 text-[8px] font-black bg-[#E5A00D] text-black px-1 rounded border border-black">
                        {m.badge}
                      </span>
                    )}
                    <span>{m.icon}</span>
                    <span className="font-outfit font-black text-xs uppercase">{m.label}</span>
                  </button>
                ))}
              </div>

              {/* UPI Mode Panel: Select UPI App */}
              {paymentMethod === "UPI" && (
                <div className="space-y-3 pt-2 animate-in fade-in duration-150">
                  <p className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-1.5">
                    <Smartphone size={14} className="text-[#E5A00D]" />
                    <span>Choose your UPI App:</span>
                  </p>
                  <div className="grid grid-cols-5 gap-2">
                    {UPI_APPS.map((app) => (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => setSelectedUpiApp(app.id)}
                        className={`p-2.5 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${selectedUpiApp === app.id
                          ? "border-black bg-[#FFF8EE] shadow-[3px_3px_0px_#000000] scale-[1.02]"
                          : "border-zinc-200 bg-white hover:border-black/50"
                          }`}
                      >
                        {app.icon}
                        <span className="text-[10px] font-bold text-black truncate w-full text-center">
                          {app.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Card Mode Panel */}
              {paymentMethod === "CARD" && (
                <div className="p-3.5 bg-[#FFF8EE] border border-black/10 rounded-xl space-y-1.5 text-xs animate-in fade-in duration-150">
                  <p className="font-bold text-black">Cards Supported</p>
                  <p className="text-zinc-600 font-medium">
                    Visa, MasterCard, RuPay, Maestro &amp; Diners. You will enter card details directly inside the secure Razorpay checkout modal.
                  </p>
                </div>
              )}

              {/* NetBanking Mode Panel */}
              {paymentMethod === "NETBANKING" && (
                <div className="p-3.5 bg-[#FFF8EE] border border-black/10 rounded-xl space-y-1.5 text-xs animate-in fade-in duration-150">
                  <p className="font-bold text-black">All Major Indian Banks Supported</p>
                  <p className="text-zinc-600 font-medium">
                    SBI, HDFC, ICICI, Axis, Kotak, PNB &amp; 50+ institutional banks.
                  </p>
                </div>
              )}

              {/* Cash On Delivery Panel */}
              {paymentMethod === "COD" && (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl space-y-1 text-xs animate-in fade-in duration-150">
                  <p className="font-black text-amber-900">Pay on Handi Arrival</p>
                  <p className="text-amber-800 font-semibold">
                    Pay with Cash or UPI QR at your doorstep upon food delivery.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* ==========================================
              RIGHT COLUMN (5 cols): Order Summary
          ========================================== */}
          <aside className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
            <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000000] p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b-2 border-black/10">
                <h2 className="font-outfit font-black text-sm uppercase tracking-wider text-black">
                  Order Summary
                </h2>
                <span className="text-[10px] font-black bg-[#E5A00D] text-black px-2 py-0.5 rounded-full border border-black">
                  {cartItems.reduce((acc, i) => acc + i.quantity, 0)} Items
                </span>
              </div>

              {/* Cart Items List */}
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1 divide-y divide-zinc-100">
                {cartItems.map((item) => (
                  <div key={item.id} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 text-xs">
                    {/* Food Thumbnail Image */}
                    <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-black/15 bg-[#FFF8EE] shrink-0 shadow-sm flex items-center justify-center">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // If image fails to load, fallback to default bowl icon
                            (e.target as HTMLElement).style.display = "none";
                            const fallback = (e.target as HTMLElement).parentElement?.querySelector(".fallback-icon");
                            if (fallback) fallback.classList.remove("hidden");
                          }}
                        />
                      ) : null}
                      <div className={`fallback-icon ${item.image ? "hidden" : ""} flex items-center justify-center w-full h-full text-[#E5A00D]`}>
                        <Utensils size={18} />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-black truncate">{item.name}</p>
                      <p className="text-[10px] text-zinc-500 font-semibold">
                        ₹{item.price} each {item.specs ? `• ${item.specs}` : ""}
                      </p>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1.5 bg-[#FFF8EE] border border-black rounded-lg px-1.5 py-0.5 shadow-sm">
                      <button
                        onClick={() => handleQtyChange(item, -1)}
                        className="h-5 w-5 rounded bg-white text-black flex items-center justify-center hover:bg-black hover:text-white transition-colors border border-black/10"
                        aria-label="Decrease"
                      >
                        <Minus size={10} />
                      </button>
                      <span className="font-outfit font-black text-xs text-black min-w-[14px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQtyChange(item, 1)}
                        className="h-5 w-5 rounded bg-[#E5A00D] text-black flex items-center justify-center hover:bg-black hover:text-white transition-colors border border-black"
                        aria-label="Increase"
                      >
                        <Plus size={10} />
                      </button>
                    </div>

                    <span className="font-outfit font-black text-xs text-black min-w-[48px] text-right">
                      ₹{item.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              {/* Apply Coupon / Promo Code Card */}
              <div className="border-t-2 border-black/10 pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                    <Tag size={14} className="text-[#E5A00D]" />
                    <span>Have a Coupon?</span>
                  </span>
                  {availableCoupons.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowCouponsModal(true)}
                      className="text-[11px] font-black text-black hover:text-[#E5A00D] underline underline-offset-2 flex items-center gap-0.5"
                    >
                      <Sparkles size={12} className="text-amber-500" />
                      <span>View Offers ({availableCoupons.length})</span>
                    </button>
                  )}
                </div>

                {appliedCoupon ? (
                  <div className="p-3 bg-emerald-50 border-2 border-emerald-500 rounded-xl flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px]">
                        ✓
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-emerald-900">{appliedCoupon.code}</span>
                          <span className="text-[10px] font-bold text-emerald-700">Applied</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700">
                          You saved ₹{appliedCoupon.discount} on this bowl!
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="p-1 rounded-lg hover:bg-emerald-100 text-red-600 font-black text-xs transition-colors"
                      title="Remove coupon"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => {
                            setCouponInput(e.target.value.toUpperCase());
                            setCouponError(null);
                          }}
                          placeholder="Enter Promo Code"
                          className="w-full px-3 py-2 bg-[#FFF8EE] border-2 border-black rounded-xl text-xs font-mono font-black uppercase text-black placeholder:font-sans placeholder:font-medium placeholder:text-zinc-400 focus:outline-none focus:bg-white transition-colors"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={isValidatingCoupon || !couponInput.trim()}
                        onClick={() => handleApplyCoupon()}
                        className="px-4 py-2 bg-black text-[#E5A00D] hover:bg-neutral-800 font-outfit font-black text-xs uppercase tracking-wider rounded-xl border-2 border-black shadow-[2px_2px_0px_#E5A00D] disabled:opacity-40 transition-all shrink-0 flex items-center gap-1"
                      >
                        {isValidatingCoupon ? <Loader2 size={13} className="animate-spin" /> : "Apply"}
                      </button>
                    </div>

                    {couponError && (
                      <p className="text-[11px] font-bold text-red-600 flex items-center gap-1 animate-in fade-in">
                        <AlertCircle size={12} className="shrink-0" />
                        <span>{couponError}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Pricing Breakdown */}
              <div className="border-t-2 border-black/10 pt-3 space-y-2 text-xs font-semibold text-zinc-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-black">₹{subtotal}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-600 font-bold animate-in fade-in">
                    <span className="flex items-center gap-1">
                      <Tag size={12} />
                      <span>Coupon Discount ({appliedCoupon.code})</span>
                    </span>
                    <span>-₹{appliedCoupon.discount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="text-emerald-600 font-bold">FREE</span>
                </div>
                <div className="border-t border-dashed border-black/20 pt-2 flex justify-between font-outfit text-base font-black text-black">
                  <span>Total Payable</span>
                  <span className="text-lg text-black">₹{grandTotal}</span>
                </div>
              </div>

              {/* Primary Action Button */}
              {isKitchenClosed ? (
                <button
                  type="button"
                  disabled={true}
                  className="w-full py-3.5 rounded-xl border-2 border-zinc-300 bg-zinc-200 text-zinc-500 font-outfit font-black text-sm uppercase tracking-wider cursor-not-allowed flex items-center justify-center gap-2 shadow-none"
                >
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  <span>Kitchen Closed (Cannot Place Order)</span>
                </button>
              ) : (
                <button
                  type="button"
                  id="checkout-pay-btn"
                  disabled={isPlacingOrder || cartItems.length === 0}
                  onClick={handleCompleteOrder}
                  className="w-full py-3.5 rounded-xl border-2 border-black bg-black text-[#E5A00D] font-outfit font-black text-sm uppercase tracking-wider shadow-[3px_3px_0px_#E5A00D] hover:bg-zinc-900 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isPlacingOrder ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{paymentMethod === "COD" ? "Placing Order..." : "Opening Razorpay..."}</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {paymentMethod === "COD"
                          ? `Place COD Order (₹${grandTotal})`
                          : `Pay ₹${grandTotal} with Razorpay`}
                      </span>
                      <ChevronRight size={16} />
                    </>
                  )}
                </button>
              )}

              <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-zinc-400">
                <Lock size={11} className="text-emerald-600" />
                <span>Encrypted &amp; Secured by Razorpay Gateway</span>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Address Management Modal */}
      {addressModalOpen && (
        <AddressModal
          isOpen={addressModalOpen}
          initialMode="FORM"
          requireAddressMsg="Please add or choose your delivery address to place the order."
          onClose={() => setAddressModalOpen(false)}
          onAddressSelected={(newAddr: AddressItem) => {
            setAddresses((prev) => [newAddr, ...prev.filter((a) => a.id !== newAddr.id)]);
            setSelectedAddressId(newAddr.id);
            setAddressModalOpen(false);
          }}
        />
      )}

      {/* Available Coupons Drawer / Modal */}
      {showCouponsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border-2 border-black w-full max-w-md rounded-3xl p-6 space-y-4 relative shadow-[8px_8px_0px_#000000] max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b-2 border-black/10 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#E5A00D] border border-black flex items-center justify-center text-black font-black">
                  <Tag size={16} />
                </div>
                <div>
                  <h3 className="font-outfit font-black text-sm uppercase text-black">
                    Available Coupons ({availableCoupons.length})
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-bold">1-Click Apply to your order</p>
                </div>
              </div>
              <button
                onClick={() => setShowCouponsModal(false)}
                className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-black transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {availableCoupons.length === 0 ? (
                <div className="text-center py-8 text-xs font-bold text-zinc-500">
                  No promotional coupons available at the moment.
                </div>
              ) : (
                availableCoupons.map((coupon) => {
                  const meetsMinOrder = subtotal >= coupon.minOrderAmount;
                  const isCurrent = appliedCoupon?.code === coupon.code;

                  return (
                    <div
                      key={coupon.id}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between gap-3 ${isCurrent
                        ? "border-emerald-500 bg-emerald-50 shadow-[2px_2px_0px_#10B981]"
                        : "border-black bg-white hover:bg-[#FFF8EE] shadow-[2px_2px_0px_#000000]"
                        }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-black text-xs bg-black text-[#E5A00D] px-2.5 py-1 rounded-lg border border-amber-400">
                            {coupon.code}
                          </span>
                          <span className="text-[11px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                            {coupon.formattedDiscount}
                          </span>
                        </div>

                        <p className="text-xs font-black text-black">{coupon.displayName}</p>
                        {coupon.description && (
                          <p className="text-[11px] text-zinc-600 font-medium leading-tight">
                            {coupon.description}
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-500 pt-1">
                          {coupon.minOrderAmount > 0 && (
                            <span>Min Order: ₹{coupon.minOrderAmount}</span>
                          )}
                          {coupon.maxDiscount && <span>Max Cap: ₹{coupon.maxDiscount}</span>}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-black/10 flex items-center justify-between">
                        {!meetsMinOrder ? (
                          <span className="text-[10px] font-bold text-amber-800">
                            Add ₹{coupon.minOrderAmount - subtotal} more to unlock
                          </span>
                        ) : isCurrent ? (
                          <span className="text-[11px] font-black text-emerald-700 flex items-center gap-1">
                            <Check size={13} /> Applied
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-700">Eligible for your cart!</span>
                        )}

                        {isCurrent ? (
                          <button
                            type="button"
                            onClick={() => {
                              handleRemoveCoupon();
                              setShowCouponsModal(false);
                            }}
                            className="px-3 py-1 rounded-xl text-xs font-black text-red-600 hover:bg-red-50 border border-red-200"
                          >
                            Remove
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={!meetsMinOrder || isValidatingCoupon}
                            onClick={() => handleApplyCoupon(coupon.code)}
                            className="px-3 py-1.5 rounded-xl bg-black hover:bg-neutral-800 text-[#E5A00D] font-outfit font-black text-xs uppercase tracking-wider border border-black shadow-[2px_2px_0px_#E5A00D] disabled:opacity-40 disabled:pointer-events-none transition-all"
                          >
                            Apply Code
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
