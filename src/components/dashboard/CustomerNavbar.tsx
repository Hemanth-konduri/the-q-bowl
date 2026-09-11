"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  User,
  LogOut,
  UtensilsCrossed,
  Package,
  CheckCircle2,
  ChevronRight,
  X,
  Loader2,
  Sparkles,
  ShoppingBag,
  ShoppingCart,
  MapPin,
  CreditCard,
  Landmark,
  QrCode,
  Smartphone,
  Banknote,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { AddressModal, AddressItem } from "./AddressModal";
import { formatOrderId } from "@/lib/utils/orderIdFormatter";
import { openRazorpayModal } from "@/lib/razorpay-client";

interface CustomerUser {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  avatarUrl?: string | null;
}

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  time: string;
  isRead: boolean;
}

interface SearchResult {
  meals: Array<{
    id: string;
    name: string;
    price: number;
    isVeg: boolean;
    description?: string | null;
  }>;
  orders: Array<{
    id: string;
    total: number;
    status: string;
    createdAt: string;
  }>;
}

export function CustomerNavbar() {
  const router = useRouter();

  // User State
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Notification State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Monitor page scroll to give navbar distinct visibility and backdrop
  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 15);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch user profile on mount
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
          }
        }
      } catch (err) {
        console.error("Failed to load customer profile:", err);
      }
    }
    loadUser();
  }, []);

  // Fetch notifications
  async function loadNotifications() {
    setLoadingNotifs(true);
    try {
      const res = await fetch("/api/user/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoadingNotifs(false);
    }
  }

  // Load initial notification count
  useEffect(() => {
    loadNotifications();
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setSearchOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/user/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || { meals: [], orders: [] });
          setSearchOpen(true);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Cart State
  const [cartOpen, setCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [cartItemsList, setCartItemsList] = useState<
    Array<{ id: string; name: string; price: number; image?: string; specs?: string; quantity: number }>
  >([]);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);

  // Sync cart count & cart items from localStorage & custom event
  useEffect(() => {
    function syncCart() {
      try {
        const savedCount = localStorage.getItem("qbowl_cart_count");
        if (savedCount !== null) {
          setCartCount(Number(savedCount));
        } else {
          setCartCount(0);
        }

        const detailsStr = localStorage.getItem("qbowl_cart_details");
        if (detailsStr) {
          const detailsMap = JSON.parse(detailsStr);
          setCartItemsList(Object.values(detailsMap));
        } else {
          setCartItemsList([]);
        }
      } catch (err) {
        console.error("Failed to read cart data from localStorage:", err);
      }
    }
    syncCart();

    window.addEventListener("qbowl-cart-updated", syncCart);
    return () => window.removeEventListener("qbowl-cart-updated", syncCart);
  }, []);

  function handleNavbarQtyChange(item: any, delta: number) {
    try {
      const detailsStr = localStorage.getItem("qbowl_cart_details");
      const detailsMap: Record<string, any> = detailsStr ? JSON.parse(detailsStr) : {};

      const currentQty = detailsMap[item.id]?.quantity || item.quantity || 0;
      const nextQty = Math.max(0, currentQty + delta);

      const itemsStr = localStorage.getItem("qbowl_cart_items");
      const itemsMap: Record<string, number> = itemsStr ? JSON.parse(itemsStr) : {};

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

      setCartCount(totalCount);
      setCartItemsList(Object.values(detailsMap));

      window.dispatchEvent(new Event("qbowl-cart-updated"));

      fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodItemId: item.id, quantity: nextQty }),
      }).catch((e) => console.error("Cart API update error:", e));
    } catch (e) {
      console.error("Navbar qty change error:", e);
    }
  }

  // Payment Method Selection State: UPI (default with PhonePe, GPay, Navi, Paytm, Amazon Pay), CARD, NETBANKING, COD
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"UPI" | "CARD" | "NETBANKING" | "COD">("UPI");
  const [paymentErrorMsg, setPaymentErrorMsg] = useState<string | null>(null);

  // Address modal state during checkout
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [checkoutPending, setCheckoutPending] = useState(false);

  // Kitchen operational state
  const [kitchenClosed, setKitchenClosed] = useState(false);

  useEffect(() => {
    async function checkKitchenStatus() {
      try {
        const res = await fetch(`/api/kitchen/status?t=${Date.now()}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setKitchenClosed(data.kitchenStatus !== "OPEN" || Boolean(data.isOrderingPaused));
        }
      } catch (err) {}
    }
    checkKitchenStatus();
    const interval = setInterval(checkKitchenStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Listen for open-cart event
  useEffect(() => {
    function handleOpenCart() {
      setCartOpen(true);
      setProfileOpen(false);
      setNotifOpen(false);
      setSearchOpen(false);
    }
    window.addEventListener("qbowl-open-cart", handleOpenCart);
    return () => window.removeEventListener("qbowl-open-cart", handleOpenCart);
  }, []);

  async function handleCheckout(overrideAddressId?: string) {
    if (cartItemsList.length === 0) return;
    setIsPlacingOrder(true);
    setOrderSuccessMsg(null);
    setPaymentErrorMsg(null);

    try {
      // First ensure user has an active session
      const userRes = await fetch("/api/auth/me");
      if (!userRes.ok) {
        alert("Please log in to complete your order.");
        router.push("/login");
        return;
      }

      // Check user addresses
      const addrRes = await fetch("/api/user/addresses");
      let targetAddressId = overrideAddressId;

      if (addrRes.ok) {
        const addrData = await addrRes.json();
        const userAddrs: AddressItem[] = addrData.addresses || [];
        if (userAddrs.length === 0 && !targetAddressId) {
          // Open Address Modal to add first address
          setIsPlacingOrder(false);
          setCheckoutPending(true);
          setAddressModalOpen(true);
          return;
        } else if (!targetAddressId && userAddrs.length > 0) {
          const def = userAddrs.find((a) => a.isDefault) || userAddrs[0];
          targetAddressId = def.id;
        }
      }

      const cartItemsPayload = cartItemsList.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      // ==========================================
      // FLOW 1: CASH ON DELIVERY (COD)
      // ==========================================
      if (selectedPaymentMethod === "COD") {
        const payload = {
          addressId: targetAddressId,
          paymentMethod: "COD",
          notes: "Placed via Customer Dashboard Cart (Cash on Delivery)",
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
        } else if (data.code === "NO_ADDRESS") {
          setCheckoutPending(true);
          setAddressModalOpen(true);
        } else {
          setPaymentErrorMsg(data.error || "Unable to place order. Please check delivery address.");
        }
        return;
      }

      // ==========================================
      // FLOW 2: RAZORPAY ONLINE (UPI / CARD / NETBANKING)
      // ==========================================
      const createOrderRes = await fetch("/api/payments/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose: "ORDER",
          addressId: targetAddressId,
          notes: `Food Order via ${selectedPaymentMethod}`,
          items: cartItemsPayload,
        }),
      });

      const createOrderData = await createOrderRes.json();
      if (!createOrderRes.ok || !createOrderData.success) {
        if (createOrderData.error?.includes("delivery zone")) {
          setPaymentErrorMsg(createOrderData.error);
        } else {
          setPaymentErrorMsg(createOrderData.error || "Unable to initialize Razorpay checkout. Please try again.");
        }
        setIsPlacingOrder(false);
        return;
      }

      // Open Razorpay Modal with preselected method (UPI, CARD, or NETBANKING)
      await openRazorpayModal({
        keyId: createOrderData.keyId,
        razorpayOrderId: createOrderData.razorpayOrderId,
        amount: createOrderData.amount,
        currency: createOrderData.currency || "INR",
        name: "The Q Bowl",
        description: "Fresh Food Bowl Delivery Order",
        preferredMethod: selectedPaymentMethod.toLowerCase(),
        userName: createOrderData.customer?.name || user?.name || "",
        userEmail: createOrderData.customer?.email || user?.email || "",
        userPhone: createOrderData.customer?.phone || user?.phone || "",
        onSuccess: (verifyResult) => {
          const finalOrderId = verifyResult.orderId || createOrderData.orderId;
          handleOrderSuccess(finalOrderId);
        },
        onError: (errMsg) => {
          setIsPlacingOrder(false);
          setPaymentErrorMsg(errMsg || "Payment was not completed.");
        },
      });

    } catch (err: any) {
      console.error("Checkout error:", err);
      setPaymentErrorMsg(err?.message || "Order could not be processed. Please try again.");
      setIsPlacingOrder(false);
    }
  }

  function handleOrderSuccess(orderId: string) {
    setIsPlacingOrder(false);
    setPaymentErrorMsg(null);
    setOrderSuccessMsg(`Order ${formatOrderId(orderId)} placed successfully!`);

    // Clear cart
    localStorage.removeItem("qbowl_cart_items");
    localStorage.removeItem("qbowl_cart_details");
    localStorage.setItem("qbowl_cart_count", "0");
    setCartCount(0);
    setCartItemsList([]);
    window.dispatchEvent(new Event("qbowl-cart-updated"));
    window.dispatchEvent(new Event("qbowl-order-placed"));

    setTimeout(() => {
      setCartOpen(false);
      setOrderSuccessMsg(null);
      // Redirect to active order live tracking section
      window.location.hash = "active-order";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    }, 1200);
  }

  // Calculate cart subtotal
  const cartSubtotal = cartItemsList.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
        setNotifOpen(false);
        setSearchOpen(false);
        setCartOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      router.push("/login");
    }
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "QB";

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? "bg-[#f5e3cd]/95 backdrop-blur-md py-3 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border-b-2 border-black/10"
          : "bg-transparent py-4 border-b-2 border-transparent"
      }`}
      ref={containerRef}
    >
      <div className="w-full px-4 sm:px-8 lg:px-12 flex items-center justify-between gap-4 sm:gap-8">
        
        {/* 1. Website Logo (Left - Matching Landing Page) */}
        <Link
          href="/"
          className="flex items-center gap-2.5 sm:gap-3 shrink-0 group transition-transform duration-300 hover:scale-105"
        >
          <div className="p-1 rounded-xl border-2 bg-[#FFF8EE] border-black shadow-[2px_2px_0px_#000000]">
            <Image
              src="/the_q_bowl_logo.png"
              alt="The Q Bowl Logo"
              width={48}
              height={48}
              priority
              className="w-7 h-7 sm:w-9 sm:h-9 object-contain rounded-lg"
            />
          </div>
          <span className="font-outfit text-2xl sm:text-4xl font-black uppercase tracking-wider text-black text-stroke-small">
            The Q BOWL
          </span>
        </Link>

        {/* 2. Middle Search Bar */}
        <div className="relative flex-1 max-w-xl lg:max-w-2xl mx-auto hidden sm:block">
          <div className="flex items-center gap-3 rounded-full border-2 border-black bg-white px-5 py-2.5 shadow-[2px_2px_0px_#000000] focus-within:shadow-[4px_4px_0px_#000000] focus-within:border-black transition-all">
              {isSearching ? (
                <Loader2 size={18} className="text-[#E5A00D] animate-spin shrink-0" />
              ) : (
                <Search size={18} className="text-black/60 shrink-0" />
              )}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bowls, meals, orders..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400 text-black font-semibold"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults(null);
                    setSearchOpen(false);
                  }}
                  className="text-zinc-400 hover:text-black p-0.5 rounded-full hover:bg-zinc-100 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Search Results Popover */}
            {searchOpen && searchResults && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-white border-2 border-black rounded-2xl shadow-[6px_6px_0px_#000000] p-3 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-96 overflow-y-auto space-y-3">
                {/* Food & Bowls */}
                {searchResults.meals.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 px-2 mb-1.5 text-xs font-black uppercase tracking-wider text-[#E5A00D]">
                      <UtensilsCrossed size={14} />
                      <span>Bowls &amp; Meals ({searchResults.meals.length})</span>
                    </div>
                    <div className="space-y-1">
                      {searchResults.meals.map((meal) => (
                        <div
                          key={meal.id}
                          className="flex items-center justify-between p-2.5 hover:bg-[#FFF8EE] rounded-xl border border-transparent hover:border-black/10 transition-colors group cursor-pointer"
                          onClick={() => {
                            setSearchOpen(false);
                            router.push("/#menu");
                          }}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                meal.isVeg ? "bg-emerald-500" : "bg-red-500"
                              }`}
                              title={meal.isVeg ? "Veg" : "Non-Veg"}
                            />
                            <div>
                              <p className="text-sm font-bold text-black group-hover:text-[#E5A00D] transition-colors">
                                {meal.name}
                              </p>
                              {meal.description && (
                                <p className="text-xs text-zinc-500 line-clamp-1">
                                  {meal.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="text-xs font-black text-black bg-[#FFF8EE] px-2 py-1 rounded-lg border border-black/10">
                            ₹{meal.price}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Orders */}
                {searchResults.orders.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 px-2 mb-1.5 text-xs font-black uppercase tracking-wider text-black/60">
                      <Package size={14} />
                      <span>Your Orders ({searchResults.orders.length})</span>
                    </div>
                    <div className="space-y-1">
                      {searchResults.orders.map((ord) => (
                        <div
                          key={ord.id}
                          className="flex items-center justify-between p-2.5 hover:bg-[#FFF8EE] rounded-xl border border-transparent hover:border-black/10 transition-colors group cursor-pointer"
                          onClick={() => setSearchOpen(false)}
                        >
                          <div className="flex items-center gap-2.5">
                            <ShoppingBag size={16} className="text-[#E5A00D]" />
                            <div>
                              <p className="text-xs font-mono font-bold text-black">
                                {formatOrderId(ord.id)}
                              </p>
                              <p className="text-[11px] text-zinc-500 capitalize">
                                Status: {ord.status.toLowerCase().replace(/_/g, " ")}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-black">₹{ord.total}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {searchResults.meals.length === 0 && searchResults.orders.length === 0 && (
                  <div className="text-center py-6 text-xs text-zinc-500 font-semibold">
                    No meals or orders found for &quot;{searchQuery}&quot;.
                  </div>
                )}
              </div>
            )}
          </div>

        {/* 3 & 4. Right Actions: Bell + Profile */}
        <div className="flex items-center gap-3 shrink-0">
          {/* 3. Bell Icon (Notifications) */}
          <div className="relative">
              <button
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  setProfileOpen(false);
                  setSearchOpen(false);
                }}
                className={`relative p-2.5 sm:p-3 rounded-full border-2 border-black bg-white transition-all shadow-[2px_2px_0px_#000000] hover:shadow-[3px_3px_0px_#000000] hover:bg-[#FFF8EE] active:translate-x-0.5 active:translate-y-0.5 ${
                  notifOpen ? "bg-[#E5A00D]" : ""
                }`}
                aria-label="Notifications"
                title="Notifications"
              >
                <Bell size={18} className="text-black" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 bg-[#E5A00D] text-black font-black text-[10px] rounded-full flex items-center justify-center border-2 border-black animate-pulse shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Popover */}
              {notifOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white border-2 border-black rounded-2xl shadow-[6px_6px_0px_#000000] p-4 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3">
                  <div className="flex items-center justify-between border-b-2 border-black/10 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Bell size={16} className="text-[#E5A00D]" />
                      <h4 className="font-outfit font-black text-sm uppercase tracking-wider text-black">
                        Notifications
                      </h4>
                    </div>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-black bg-[#E5A00D] text-black px-2 py-0.5 rounded-full border border-black">
                        {unreadCount} New
                      </span>
                    )}
                  </div>

                  {loadingNotifs ? (
                    <div className="flex justify-center py-8 text-[#E5A00D]">
                      <Loader2 size={24} className="animate-spin" />
                    </div>
                  ) : notifications.length > 0 ? (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className="p-3 rounded-xl bg-[#FFF8EE] border border-black/10 flex items-start gap-3 text-xs hover:border-black/30 transition-colors"
                        >
                          <div className="h-7 w-7 rounded-lg bg-[#E5A00D] text-black flex items-center justify-center shrink-0 mt-0.5 border border-black font-bold">
                            <Sparkles size={14} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-black text-xs">{n.title}</p>
                              <span className="text-[10px] font-medium text-zinc-500">{n.time}</span>
                            </div>
                            <p className="text-[11px] text-zinc-600 mt-1 leading-snug">{n.body}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-zinc-500 font-semibold">
                      You are all caught up! No new alerts.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3.5 Cart Icon Button */}
            <div className="relative">
              <button
                onClick={() => {
                  setCartOpen(!cartOpen);
                  setNotifOpen(false);
                  setProfileOpen(false);
                  setSearchOpen(false);
                }}
                className={`relative p-2.5 sm:p-3 rounded-full border-2 border-black bg-white transition-all shadow-[2px_2px_0px_#000000] hover:shadow-[3px_3px_0px_#000000] hover:bg-[#FFF8EE] active:translate-x-0.5 active:translate-y-0.5 ${
                  cartOpen ? "bg-[#E5A00D]" : ""
                }`}
                aria-label="View Shopping Cart"
                title="Your Food Bowl Cart"
              >
                <ShoppingCart size={18} className="text-black" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 bg-black text-[#E5A00D] font-black text-[10px] rounded-full flex items-center justify-center border-2 border-[#E5A00D] shadow-sm">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Cart Popover */}
              {cartOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-88 bg-white border-2 border-black rounded-2xl shadow-[6px_6px_0px_#000000] p-4 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3">
                  <div className="flex items-center justify-between border-b-2 border-black/10 pb-2.5">
                    <div className="flex items-center gap-2">
                      <ShoppingCart size={16} className="text-[#E5A00D]" />
                      <h4 className="font-outfit font-black text-sm uppercase tracking-wider text-black">
                        Your Bowl Cart
                      </h4>
                    </div>
                    <span className="text-[10px] font-black bg-[#E5A00D] text-black px-2 py-0.5 rounded-full border border-black">
                      {cartCount} Items
                    </span>
                  </div>

                  {/* Cart Items List */}
                  {cartItemsList.length > 0 ? (
                    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 divide-y divide-zinc-100">
                      {cartItemsList.map((item) => (
                        <div
                          key={item.id}
                          className="pt-2 first:pt-0 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-black truncate">{item.name}</p>
                            <p className="text-[10px] text-zinc-500 font-semibold">
                              ₹{item.price} each {item.specs ? `• ${item.specs}` : ""}
                            </p>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-1.5 bg-[#FFF8EE] border border-black rounded-lg px-1.5 py-0.5 shadow-sm">
                            <button
                              onClick={() => handleNavbarQtyChange(item, -1)}
                              className="h-5 w-5 rounded bg-white text-black flex items-center justify-center hover:bg-black hover:text-white transition-colors border border-black/10"
                              aria-label="Decrease quantity"
                            >
                              -
                            </button>
                            <span className="font-outfit font-black text-xs text-black min-w-[14px] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleNavbarQtyChange(item, 1)}
                              className="h-5 w-5 rounded bg-[#E5A00D] text-black flex items-center justify-center hover:bg-black hover:text-white transition-colors border border-black"
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>

                          <span className="font-outfit font-black text-xs text-black min-w-[44px] text-right">
                            ₹{item.price * item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center space-y-2">
                      <div className="mx-auto w-10 h-10 rounded-full bg-[#FFF8EE] border border-black/10 flex items-center justify-center text-zinc-400">
                        <ShoppingBag size={18} />
                      </div>
                      <p className="text-xs font-bold text-zinc-600">Your bowl is currently empty</p>
                      <p className="text-[10px] text-zinc-400">Click &ldquo;Add to Bowl&rdquo; on any dish to begin</p>
                    </div>
                  )}

                  {paymentErrorMsg && (
                    <div className="p-2.5 rounded-xl bg-red-50 border border-red-400 text-red-700 text-xs font-semibold flex items-start gap-2 animate-in fade-in">
                      <X
                        size={15}
                        className="shrink-0 mt-0.5 cursor-pointer text-red-500 hover:text-red-700"
                        onClick={() => setPaymentErrorMsg(null)}
                      />
                      <span className="flex-1">{paymentErrorMsg}</span>
                    </div>
                  )}

                  {orderSuccessMsg && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-500 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <span>{orderSuccessMsg}</span>
                    </div>
                  )}

                  {kitchenClosed && (
                    <div className="p-2.5 rounded-xl bg-red-50 border border-red-300 text-red-800 text-xs font-bold flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                      <span>Kitchen is closed / unavailable for orders</span>
                    </div>
                  )}

                      <div className="border-t-2 border-black/10 pt-3 flex items-center justify-between font-outfit text-sm font-black">
                        <span>Subtotal</span>
                        <span className="text-base text-black">₹{cartSubtotal}</span>
                      </div>

                      <button
                        type="button"
                        disabled={kitchenClosed}
                        onClick={() => {
                          if (kitchenClosed) return;
                          setCartOpen(false);
                          router.push("/checkout");
                        }}
                        className={`w-full py-3 rounded-xl border-2 font-outfit font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                          kitchenClosed
                            ? "bg-zinc-200 text-zinc-500 border-zinc-300 cursor-not-allowed shadow-none"
                            : "border-black bg-black text-[#E5A00D] shadow-[3px_3px_0_#E5A00D] hover:bg-zinc-900 cursor-pointer"
                        }`}
                      >
                        <span>{kitchenClosed ? "Kitchen Closed (Unavailable)" : `Proceed to Checkout (₹${cartSubtotal})`}</span>
                        {!kitchenClosed && <ChevronRight size={15} />}
                      </button>
                </div>
              )}
            </div>

            {/* 4. Profile Icon */}
            <div className="relative">
              <button
                onClick={() => {
                  setProfileOpen(!profileOpen);
                  setNotifOpen(false);
                  setSearchOpen(false);
                }}
                className="flex items-center gap-2.5 rounded-full border-2 border-black bg-white px-2 py-1.5 sm:px-3 sm:py-2 shadow-[2px_2px_0px_#000000] hover:shadow-[3px_3px_0px_#000000] hover:bg-[#FFF8EE] transition-all text-left"
                aria-label="User Profile Menu"
              >
                {/* Avatar Icon */}
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-[#E5A00D] text-black font-black flex items-center justify-center text-xs sm:text-sm border-2 border-black shrink-0 shadow-sm">
                  {initials}
                </div>
                <div className="hidden md:block leading-tight pr-1">
                  <p className="text-xs font-black text-black max-w-[120px] truncate">
                    {user?.name || "Customer"}
                  </p>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                    {user?.role || "Member"}
                  </p>
                </div>
              </button>

              {/* Profile Dropdown */}
              {profileOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white border-2 border-black rounded-2xl shadow-[6px_6px_0px_#000000] p-3 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2">
                  
                  {/* Profile Header */}
                  <div className="p-2.5 rounded-xl bg-[#FFF8EE] border border-black/10">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-[#E5A00D] text-black font-black flex items-center justify-center text-xs border border-black">
                        {initials}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-black text-black truncate">
                          {user?.name || "Customer Account"}
                        </p>
                        <p className="text-[11px] font-mono text-zinc-500 truncate">
                          {user?.email || "customer@theqbowl.com"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <CheckCircle2 size={12} />
                      <span>Verified Customer</span>
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div className="py-1 space-y-0.5">
                    <Link
                      href="/dashboard"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center justify-between px-3 py-2 text-xs font-bold text-black hover:bg-[#FFF8EE] rounded-xl transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <User size={15} className="text-[#E5A00D]" />
                        <span>Customer Dashboard</span>
                      </div>
                      <ChevronRight size={14} className="text-zinc-400 group-hover:text-black transition-colors" />
                    </Link>
                    <Link
                      href="/complaints"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center justify-between px-3 py-2 text-xs font-bold text-black hover:bg-[#FFF8EE] rounded-xl transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <ShieldAlert size={15} className="text-rose-500" />
                        <span>My Complaints</span>
                      </div>
                      <ChevronRight size={14} className="text-zinc-400 group-hover:text-black transition-colors" />
                    </Link>
                  </div>

                  {/* Logout Action */}
                  <div className="border-t-2 border-black/10 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <LogOut size={15} />
                      <span>Sign Out</span>
                    </button>
                  </div>

                </div>
              )}
            </div>

          </div>
        </div>

        {/* Address Modal for Order Checkout Flow */}
        <AddressModal
          isOpen={addressModalOpen}
          initialMode="FORM"
          requireAddressMsg="Please add a delivery address to complete placing your order."
          onClose={() => {
            setAddressModalOpen(false);
            setCheckoutPending(false);
          }}
          onAddressSelected={(addr) => {
            setAddressModalOpen(false);
            if (checkoutPending) {
              setCheckoutPending(false);
              // Automatically proceed with placing order
              handleCheckout(addr.id);
            }
          }}
        />
    </header>
  );
}

export default CustomerNavbar;
