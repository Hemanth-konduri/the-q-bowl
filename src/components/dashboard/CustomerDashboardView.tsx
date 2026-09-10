"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  Star,
  Clock,
  MapPin,
  ShoppingBag,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Plus,
  Minus,
  Flame,
  UtensilsCrossed,
  Heart,
  Edit2,
  AlertCircle,
  History,
  Receipt,
  CalendarCheck,
  Settings as SettingsIcon,
  Package,
  Truck,
  CheckCircle2,
  User,
  Phone,
  Loader2,
  RefreshCw,
  X,
  Download,
  FileText,
  CreditCard,
  ShieldCheck,
  Printer,
} from "lucide-react";
import dynamic from "next/dynamic";
import { AddressModal, AddressItem } from "./AddressModal";
import { formatOrderId } from "@/lib/utils/orderIdFormatter";

const LiveTrackingMap = dynamic(() => import("./LiveTrackingMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-60 sm:h-72 rounded-2xl border-2 border-black bg-zinc-900 flex flex-col items-center justify-center gap-2 text-white">
      <Loader2 size={24} className="animate-spin text-[#E5A00D]" />
      <span className="font-outfit font-black text-[11px] uppercase tracking-wider">Loading Live GPS Satellite Tracker...</span>
    </div>
  ),
});

interface SlideItem {
  id: number;
  tag: string;
  rating: string;
  reviews: string;
  title: string;
  description: string;
  promoCode: string;
  ctaText: string;
  image: string;
  dishBadge: string;
  bgColor: string;
  bgImage: string;
}

const slides: SlideItem[] = [
  {
    id: 1,
    tag: "🍲 CHEF'S WEEKEND HANDI DROP",
    rating: "4.9",
    reviews: "2.4k+ reviews",
    title: "Get 25% OFF On Slow-Dum Biryani Feasts",
    description:
      "Aromatic long-grain basmati, heirloom spice blends, slow-cooked in sealed clay handis with zero artificial preservatives. Freshly dum-pukht upon every order.",
    promoCode: "QBOWL25",
    ctaText: "Order Special Bowl Now",
    image: "/biryani_handi_slider.jpg",
    dishBadge: "• Express Handi • 30 Mins",
    bgColor: "from-[#994700] via-[#C96800] to-[#E5A00D]",
    bgImage: "/slider_bg_biryani.jpg",
  },
  {
    id: 2,
    tag: "🥗 HEALTHY ARTISAN GRAIN BOWL",
    rating: "4.85",
    reviews: "1.8k+ reviews",
    title: "Artisan Protein Bowls - Flat 20% OFF",
    description:
      "Smoky charcoal grilled paneer, ripe avocado slices, edamame, tri-color quinoa, roasted sweet potatoes, and herb lemon-tahini dressing.",
    promoCode: "HEALTH20",
    ctaText: "Explore Protein Bowls",
    image: "/artisan_bowl_slider.jpg",
    dishBadge: "• 28g Protein • 15 Mins",
    bgColor: "from-[#1B4D3E] via-[#2E7D32] to-[#4CAF50]",
    bgImage: "/slider_bg_biryani.jpg",
  },
  {
    id: 3,
    tag: "🌱 CHEF'S VEG HANDI SPECIAL",
    rating: "4.9",
    reviews: "2.8k+ reviews",
    title: "Royal Lucknowi Veg Dum Biryani - 30% OFF",
    description:
      "Fragrant saffron long-grain basmati layered with garden-fresh vegetables, golden fried paneer cubes, roasted cashews, and caramelized birista sealed in clay handi.",
    promoCode: "VEGDUM30",
    ctaText: "Order Veg Biryani",
    image: "/veg_biryani_slider.jpg",
    dishBadge: "• Pure Veg Dum • 20 Mins",
    bgColor: "from-[#8B3A00] via-[#C05621] to-[#DD6B20]",
    bgImage: "/slider_bg_biryani.jpg",
  },
  {
    id: 4,
    tag: "🍕 48HR FERMENTED CRUST",
    rating: "4.95",
    reviews: "3.1k+ reviews",
    title: "Wood-Fired Neapolitan Slices - Flat ₹150 OFF",
    description:
      "San Marzano tomato coulis, fresh Fior di Latte buffalo mozzarella, aromatic fresh basil leaves baked in 450°C wood-fired ovens.",
    promoCode: "CRUST150",
    ctaText: "Order Artisanal Pizza",
    image: "/margherita_pizza.jpg",
    dishBadge: "• Wood Oven • 25 Mins",
    bgColor: "from-[#9B2C2C] via-[#C53030] to-[#E53E3E]",
    bgImage: "/slider_bg_pizza.jpg",
  },
];

interface FoodItem {
  id: string;
  name: string;
  category: string;
  tag: string;
  tagType: "NON-VEG" | "ROYAL NON-VEG" | "CRAFT NON-VEG" | "PURE VEG";
  rating: number;
  specs: string;
  calories: string;
  protein: string;
  description: string;
  price: number;
  image: string;
}

export function CustomerDashboardView() {
  // Slider State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Background Food Video Playlist (Food1.mp4 -> Food2.mp4 -> Food3.mp4 -> Food4.mp4 -> Food5.mp4 -> Food1.mp4 ...)
  const foodVideos = [
    "/Food1.mp4",
    "/Food2.mp4",
    "/Food3.mp4",
    "/Food4.mp4",
    "/Food5.mp4",
  ];
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  const handleVideoEnded = () => {
    setCurrentVideoIndex((prev) => (prev + 1) % foodVideos.length);
  };

  // Live Catalog State from Database (No Demo Data)
  const [dbFoodItems, setDbFoodItems] = useState<FoodItem[]>([]);
  const [loadingMeals, setLoadingMeals] = useState(true);

  // Favorites State
  const [favorites, setFavorites] = useState<string[]>([]);

  // Active Delivery Address State & Modal
  const [activeAddress, setActiveAddress] = useState<AddressItem | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addressModalMode, setAddressModalMode] = useState<"LIST" | "FORM">("LIST");
  const [addressToEdit, setAddressToEdit] = useState<AddressItem | null>(null);

  // Fetch real active default delivery address
  async function loadUserAddresses() {
    try {
      setLoadingAddress(true);
      const res = await fetch("/api/user/addresses");
      if (res.ok) {
        const data = await res.json();
        const list: AddressItem[] = data.addresses || [];
        const defaultAddr = list.find((a) => a.isDefault) || list[0] || null;
        setActiveAddress(defaultAddr);
      }
    } catch (e) {
      console.error("Failed to load user address:", e);
    } finally {
      setLoadingAddress(false);
    }
  }

  useEffect(() => {
    loadUserAddresses();

    function handleAddressUpdated() {
      loadUserAddresses();
    }

    window.addEventListener("qbowl-address-updated", handleAddressUpdated);
    return () => window.removeEventListener("qbowl-address-updated", handleAddressUpdated);
  }, []);

  // Category Filter State
  const [activeCategory, setActiveCategory] = useState("All Delicacies");

  // Load Favorites from LocalStorage on mount
  useEffect(() => {
    try {
      const savedFavs = localStorage.getItem("qbowl_customer_favorites");
      if (savedFavs) {
        setFavorites(JSON.parse(savedFavs));
      }
    } catch (e) {
      console.error("Failed to parse favorites:", e);
    }
  }, []);

  // Active Sidebar / Hash View Tab State
  const [activeTab, setActiveTab] = useState<"home" | "active-order" | "history" | "invoices" | "subscriptions" | "settings">("home");
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [invoiceModalOrder, setInvoiceModalOrder] = useState<any | null>(null);

  // Load User Orders from Database
  async function loadUserOrders() {
    try {
      setLoadingOrders(true);
      const res = await fetch("/api/user/orders");
      if (res.ok) {
        const data = await res.json();
        setUserOrders(data.orders || []);
      }
    } catch (e) {
      console.error("Failed to load user orders:", e);
    } finally {
      setLoadingOrders(false);
    }
  }

  // Load orders immediately on mount and listen to order placed events
  useEffect(() => {
    loadUserOrders();

    function handleOrderPlaced() {
      loadUserOrders();
      setActiveTab("active-order");
    }

    window.addEventListener("qbowl-order-placed", handleOrderPlaced);
    return () => window.removeEventListener("qbowl-order-placed", handleOrderPlaced);
  }, []);

  // Live polling: Refresh active orders automatically every 5 seconds when tracking orders
  useEffect(() => {
    if (activeTab === "active-order" || activeTab === "history") {
      const interval = setInterval(() => {
        // Silently fetch latest status without loading spinner
        fetch("/api/user/orders")
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.orders) {
              setUserOrders(data.orders);
            }
          })
          .catch((err) => console.error("Live order poll error:", err));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Listen to hash change & custom category switch event (e.g. Favourites from sidebar)
  useEffect(() => {
    function handleHash() {
      const hash = window.location.hash;
      if (hash === "#favourites") {
        setActiveTab("home");
        setActiveCategory("Favourites");
      } else if (hash === "#active-order" || hash === "#orders") {
        setActiveTab("active-order");
        loadUserOrders();
      } else if (hash === "#history") {
        setActiveTab("history");
        loadUserOrders();
      } else if (hash === "#invoices") {
        setActiveTab("invoices");
        loadUserOrders();
      } else if (hash === "#subscriptions") {
        setActiveTab("subscriptions");
      } else if (hash === "#settings") {
        setActiveTab("settings");
      } else {
        setActiveTab("home");
        setActiveCategory("All Delicacies");
      }
    }

    function handleCategoryEvent(e: any) {
      if (e?.detail?.category) {
        setActiveTab("home");
        setActiveCategory(e.detail.category);
      }
    }

    handleHash();
    window.addEventListener("hashchange", handleHash);
    window.addEventListener("qbowl-select-category", handleCategoryEvent);
    return () => {
      window.removeEventListener("hashchange", handleHash);
      window.removeEventListener("qbowl-select-category", handleCategoryEvent);
    };
  }, []);

  // Toggle favorite helper
  function toggleFavorite(itemId: string, e?: React.MouseEvent) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setFavorites((prev) => {
      const exists = prev.includes(itemId);
      const next = exists ? prev.filter((id) => id !== itemId) : [...prev, itemId];
      localStorage.setItem("qbowl_customer_favorites", JSON.stringify(next));
      return next;
    });
  }

  // Fetch real Master Food Catalog from database
  useEffect(() => {
    async function loadMasterFoodCatalog() {
      setLoadingMeals(true);
      try {
        const res = await fetch("/api/meals");
        if (res.ok) {
          const data = await res.json();
          if (data.meals && Array.isArray(data.meals)) {
            const formatted: FoodItem[] = data.meals.map((item: any) => {
              const catName = item.categoryName || (item.isVeg ? "Veg Delights" : "Artisan Non-Veg");
              const isVegTag = item.isVeg ? "PURE VEG" : "NON-VEG";

              let fallbackImg = item.imageUrl;
              if (!fallbackImg || fallbackImg === "") {
                if (item.name?.toLowerCase().includes("biryani")) fallbackImg = "/biryani_handi_slider.jpg";
                else if (item.name?.toLowerCase().includes("burger")) fallbackImg = "/truffle_burger.jpg";
                else if (item.name?.toLowerCase().includes("pizza")) fallbackImg = "/margherita_pizza.jpg";
                else if (item.isVeg) fallbackImg = "/paneer_bowl_new.png";
                else fallbackImg = "/chicken_dum_biryani.png";
              }

              return {
                id: item.id,
                name: item.name,
                category: catName,
                tag: isVegTag,
                tagType: isVegTag as any,
                rating: item.rating ? Number(item.rating) : 4.9,
                specs: item.mealType ? `${item.mealType} • Fresh Prep` : "Kitchen Special • Slow Dum",
                calories: item.calories ? `${item.calories} kcal` : "580 kcal",
                protein: item.protein || "30g protein",
                description: item.description || "Crafted fresh per order in authentic sealed terracotta handis & wood ovens.",
                price: Number(item.price),
                image: fallbackImg,
              };
            });

            setDbFoodItems(formatted);
          }
        }
      } catch (err) {
        console.error("Error loading master food catalog:", err);
      } finally {
        setLoadingMeals(false);
      }
    }

    loadMasterFoodCatalog();
  }, []);

  // Cart / Quantity State per item
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [subscriptionPass, setSubscriptionPass] = useState(true);

  // Load cart quantities from localStorage if any
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("qbowl_cart_items");
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        setQuantities(parsed);
      }
    } catch (e) {
      console.error("Failed to parse cart items:", e);
    }
  }, []);

  // Synchronize cart changes from other components (e.g. Navbar)
  useEffect(() => {
    function handleCartSync() {
      try {
        const savedCart = localStorage.getItem("qbowl_cart_items");
        if (savedCart) {
          setQuantities(JSON.parse(savedCart));
        } else {
          setQuantities({});
        }
      } catch (e) {
        console.error("Cart sync event error:", e);
      }
    }

    window.addEventListener("qbowl-cart-updated", handleCartSync);
    return () => window.removeEventListener("qbowl-cart-updated", handleCartSync);
  }, []);

  // Auto slide effect (slow & relaxed pace, pauses on hover)
  const [isSliderHovered, setIsSliderHovered] = useState(false);
  useEffect(() => {
    if (isSliderHovered) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 12000);
    return () => clearInterval(timer);
  }, [isSliderHovered]);

  function handleCopyPromo(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  async function updateQuantity(foodItem: FoodItem, delta: number) {
    const itemId = foodItem.id;
    const current = quantities[itemId] || 0;
    const next = Math.max(0, current + delta);
    const updated = { ...quantities, [itemId]: next };
    if (next === 0) {
      delete updated[itemId];
    }

    const totalCount = Object.values(updated).reduce((a, b) => a + b, 0);
    setQuantities(updated);

    try {
      localStorage.setItem("qbowl_cart_items", JSON.stringify(updated));
      localStorage.setItem("qbowl_cart_count", String(totalCount));

      // Also maintain detailed cart item map for Navbar popup
      const existingDetailsStr = localStorage.getItem("qbowl_cart_details");
      const detailsMap: Record<string, any> = existingDetailsStr ? JSON.parse(existingDetailsStr) : {};

      if (next === 0) {
        delete detailsMap[itemId];
      } else {
        detailsMap[itemId] = {
          id: foodItem.id,
          name: foodItem.name,
          price: foodItem.price,
          image: foodItem.image,
          specs: foodItem.specs,
          quantity: next,
        };
      }
      localStorage.setItem("qbowl_cart_details", JSON.stringify(detailsMap));

      // Notify Navbar & other components
      window.dispatchEvent(new Event("qbowl-cart-updated"));

      // Synchronize with backend API in background
      fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodItemId: itemId, quantity: next }),
      }).catch((err) => console.error("API Cart sync error:", err));
    } catch (e) {
      console.error("Failed to update cart storage:", e);
    }
  }

  // Dynamic Categories from real items + Favourites
  const dynamicCategories = [
    "All Delicacies",
    "Favourites",
    ...Array.from(new Set(dbFoodItems.map((i) => i.category))),
  ];

  const filteredItems =
    activeCategory === "All Delicacies"
      ? dbFoodItems
      : activeCategory === "Favourites"
        ? dbFoodItems.filter((item) => favorites.includes(item.id))
        : dbFoodItems.filter(
          (item) => item.category.toLowerCase() === activeCategory.toLowerCase()
        );

  const totalCartCount = Object.values(quantities).reduce((a, b) => a + b, 0);

  const activeSlideData = slides[currentSlide];

  return (
    <div className="space-y-8 w-full">

      {/* ── 0. Live Order Tracking View (Active Orders only) ── */}
      {activeTab === "active-order" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Header Bar - Compact & Luxurious */}
          <div className="rounded-2xl border-2 border-black bg-white p-3.5 sm:p-4 shadow-[4px_4px_0_#000] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-[#E5A00D] border-2 border-black flex items-center justify-center shadow-[2px_2px_0_#000] shrink-0">
                <Truck size={20} className="text-black" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-outfit text-lg sm:text-xl font-black uppercase tracking-tight text-black">
                    Live Order Tracking
                  </h1>
                  <span className="hidden xs:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    Live Satellite
                  </span>
                </div>
                <p className="text-[11px] font-medium text-zinc-500">
                  Real-time kitchen preparation, dispatch &amp; delivery
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={loadUserOrders}
                disabled={loadingOrders}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFF8EE] hover:bg-black text-black hover:text-white border-2 border-black font-outfit font-black text-[11px] uppercase tracking-wider shadow-[2px_2px_0_#000] transition-all disabled:opacity-50"
              >
                <RefreshCw size={12} className={loadingOrders ? "animate-spin" : ""} />
                <span>Refresh</span>
              </button>
              <a
                href="#menu-section"
                onClick={() => setActiveTab("home")}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-black text-[#E5A00D] font-outfit font-black text-[11px] uppercase tracking-wider border-2 border-black shadow-[2px_2px_0_#000] hover:bg-zinc-900 transition-all"
              >
                <Plus size={13} />
                <span>Add Dishes</span>
              </a>
            </div>
          </div>

          {/* Filter active orders (PENDING, CONFIRMED, PREPARING, OUT_FOR_DELIVERY) */}
          {loadingOrders ? (
            <div className="py-12 rounded-2xl border-2 border-black bg-white/70 flex flex-col items-center justify-center gap-2">
              <Loader2 size={26} className="animate-spin text-[#E5A00D]" />
              <p className="font-outfit font-black text-xs text-black">Checking live order status...</p>
            </div>
          ) : userOrders.filter((o) => o.status !== "DELIVERED" && o.status !== "CANCELLED").length === 0 ? (
            <div className="p-8 sm:p-10 text-center rounded-2xl border-2 border-dashed border-black/20 bg-white/80 space-y-3">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-[#FFF8EE] border-2 border-black flex items-center justify-center text-amber-600 shadow-[2px_2px_0_#000]">
                <Package size={24} />
              </div>
              <div>
                <h3 className="font-outfit text-base sm:text-lg font-black uppercase text-black">No Active Orders in Progress</h3>
                <p className="text-xs text-zinc-500 font-medium max-w-sm mx-auto mt-0.5">
                  All your previous feasts are completed. Check your <strong>Order History</strong> or explore our handi menu!
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  onClick={() => {
                    window.location.hash = "history";
                    setActiveTab("history");
                  }}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-100 border-2 border-black font-outfit font-black text-[11px] uppercase tracking-wider text-black shadow-[2px_2px_0_#000]"
                >
                  Past History
                </button>
                <a
                  href="#menu-section"
                  onClick={() => setActiveTab("home")}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#E5A00D] text-black font-outfit font-black text-[11px] uppercase tracking-wider border-2 border-black shadow-[2px_2px_0_#000]"
                >
                  <span>Order Now</span>
                  <ArrowRight size={12} />
                </a>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {userOrders
                .filter((o) => o.status !== "DELIVERED" && o.status !== "CANCELLED")
                .map((ord) => {
                  const stepIndex =
                    ord.status === "DELIVERED"
                      ? 3
                      : ord.status === "OUT_FOR_DELIVERY"
                        ? 3
                        : ord.status === "READY" || ord.status === "PREPARING"
                          ? 2
                          : ord.status === "CONFIRMED"
                            ? 1
                            : 0;

                  const trackingSteps = [
                    {
                      key: "placed",
                      label: "Placed",
                      desc: "Order Received",
                      icon: ShoppingBag,
                    },
                    {
                      key: "confirmed",
                      label: "Confirmed",
                      desc: "Chef Assigned",
                      icon: Check,
                    },
                    {
                      key: "preparing",
                      label: "Preparing",
                      desc: "Kitchen Cooking",
                      icon: Flame,
                    },
                    {
                      key: "enroute",
                      label: "On The Way",
                      desc: "Dispatched",
                      icon: Truck,
                    },
                  ];

                  return (
                    <div
                      key={ord.id}
                      className="rounded-2xl sm:rounded-3xl border-2 sm:border-3 border-black bg-white p-4 sm:p-5 shadow-[5px_5px_0_#000] space-y-3.5 transition-all"
                    >
                      {/* Top Status & Value Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-black/10 pb-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-outfit text-base sm:text-lg font-black text-black">
                              Active Order {formatOrderId(ord.id)}
                            </span>
                            <span
                              className={`px-3 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider border ${
                                ord.status === "OUT_FOR_DELIVERY"
                                  ? "bg-emerald-500 text-white border-emerald-600 shadow-sm"
                                  : ord.status === "READY"
                                  ? "bg-amber-500 text-black border-black shadow-sm"
                                  : ord.status === "PREPARING"
                                  ? "bg-[#E5A00D] text-black border-black shadow-sm"
                                  : ord.status === "CONFIRMED"
                                  ? "bg-amber-100 text-amber-950 border-amber-300"
                                  : "bg-zinc-100 text-zinc-800 border-zinc-300"
                              }`}
                            >
                              {ord.status === "OUT_FOR_DELIVERY"
                                ? "Out for Delivery 🛵"
                                : ord.status === "READY"
                                ? "Handi Packed & Ready 🍲"
                                : ord.status === "PREPARING"
                                ? "Preparing Food 🔥"
                                : ord.status === "CONFIRMED"
                                ? "Order Confirmed ✨"
                                : "Order Received ⏳"}
                            </span>
                          </div>
                          <p className="text-[11px] font-semibold text-zinc-500 mt-0.5">
                            Placed at {new Date(ord.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} • Estimated Delivery: 25-30 Mins
                          </p>
                        </div>

                        <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-1">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider sm:hidden">Total:</span>
                            <span className="font-outfit text-xl sm:text-2xl font-black text-black">
                              ₹{ord.total}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-[#FFF8EE] border border-amber-300/80 text-zinc-800">
                              {ord.payment?.method ? ord.payment.method.replace(/_/g, " ") : "COD / PREPAID"}
                            </span>
                            {ord.payment?.status === "SUCCESS" && (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 border border-emerald-300 text-emerald-800">
                                Paid Online
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Sleek Luxury Live Tracking Bar (Mathematically Centered Circles & Connector Lines) */}
                      <div className="bg-[#FFFDF9] p-3 sm:p-4 rounded-2xl border border-amber-200/80 space-y-3">
                        {/* Status Label & Stage Count */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="flex h-2 w-2 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E5A00D]" />
                            </span>
                            <span className="font-outfit font-black uppercase tracking-wider text-black text-xs">
                              {ord.status === "OUT_FOR_DELIVERY"
                                ? "Rider En Route with Sealed Handi"
                                : ord.status === "READY"
                                ? "Handi Sealed & Awaiting Courier Pickup"
                                : ord.status === "PREPARING"
                                ? "Preparing Your Order in Kitchen"
                                : ord.status === "CONFIRMED"
                                ? "Confirmed • Chef Assigned"
                                : "Order Received by Kitchen"}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-[10px] text-amber-900/70 hidden sm:inline-block">
                            Stage {stepIndex + 1} of 4
                          </span>
                        </div>

                        {/* Progress Track & Nodes: Grid with lines connecting exactly from center of circle to center of circle */}
                        <div className="relative w-full pt-1 pb-0.5">
                          <div className="grid grid-cols-4 w-full relative">
                            {trackingSteps.map((step, idx) => {
                              const isPast = idx < stepIndex;
                              const isCurrent = idx === stepIndex;
                              const IconComp = step.icon;

                              return (
                                <div key={step.key} className="relative flex flex-col items-center text-center">
                                  {/* Line segment from previous circle center to this circle center */}
                                  {idx > 0 && (
                                    <div
                                      className={`absolute top-4 right-1/2 w-full h-1 sm:h-1.5 -translate-y-1/2 z-0 transition-colors duration-500 ${
                                        idx <= stepIndex
                                          ? "bg-[#E5A00D] shadow-[0_0_6px_rgba(229,160,13,0.5)]"
                                          : "bg-zinc-200"
                                      }`}
                                    />
                                  )}

                                  {/* Circle Node: exactly 32px height (top 0, center 16px = top-4), perfectly centered on the line */}
                                  <div
                                    className={`relative z-10 w-8 h-8 rounded-full border-2 transition-all duration-300 flex items-center justify-center shrink-0 ${
                                      isCurrent
                                        ? "bg-[#E5A00D] text-black border-black shadow-[0_0_12px_rgba(229,160,13,0.8)] ring-4 ring-amber-300/60 animate-pulse"
                                        : isPast
                                        ? "bg-black text-[#E5A00D] border-black shadow-sm"
                                        : "bg-white text-zinc-300 border-zinc-300"
                                    }`}
                                  >
                                    {isPast ? (
                                      <Check size={14} className="stroke-[3]" />
                                    ) : (
                                      <IconComp
                                        size={14}
                                        className={isCurrent ? "stroke-[2.5]" : "stroke-[2] text-zinc-400"}
                                      />
                                    )}
                                  </div>

                                  {/* Label directly underneath circle */}
                                  <p
                                    className={`mt-1.5 font-outfit text-[10px] sm:text-[11px] font-black uppercase tracking-wider ${
                                      isCurrent
                                        ? "text-black font-black"
                                        : isPast
                                        ? "text-zinc-800 font-bold"
                                        : "text-zinc-400"
                                    }`}
                                  >
                                    {step.label}
                                  </p>

                                  <p className="text-[9px] text-zinc-400 font-medium hidden sm:block">
                                    {step.desc}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Live GPS Satellite Rider Card (Only when OUT_FOR_DELIVERY) */}
                      {ord.status === "OUT_FOR_DELIVERY" && ord.delivery && (
                        <div className="rounded-2xl border-2 border-black bg-gradient-to-r from-amber-500/10 via-[#FFF8EE] to-emerald-500/10 p-3.5 sm:p-4 shadow-[3px_3px_0_#000] space-y-3 animate-in fade-in slide-in-from-bottom-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="h-10 w-10 rounded-xl bg-black text-[#E5A00D] border-2 border-black flex items-center justify-center shadow-[2px_2px_0_#E5A00D]">
                                  <Truck size={18} className="animate-bounce" />
                                </div>
                                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white animate-ping" />
                                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
                              </div>

                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-outfit font-black text-sm text-black uppercase">
                                    {ord.delivery.staffName || "Express Delivery Partner"}
                                  </span>
                                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-black text-[9px] px-2 py-0.5 rounded-full uppercase">
                                    En Route 🛵
                                  </span>
                                </div>
                                <p className="text-[11px] text-zinc-600 font-semibold flex items-center gap-1 mt-0.5">
                                  <ShieldCheck size={13} className="text-emerald-600" />
                                  <span>Vaccinated • Contactless Sealed Handi Drop</span>
                                </p>
                              </div>
                            </div>

                            {/* Direct Rider Call */}
                            {ord.delivery.staffPhone && (
                              <a
                                href={`tel:${ord.delivery.staffPhone}`}
                                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-black text-[#FFF8EE] hover:bg-[#E5A00D] hover:text-black font-outfit font-black text-xs uppercase tracking-wider border-2 border-black shadow-[2px_2px_0_#000] transition-all self-start sm:self-auto"
                              >
                                <Phone size={12} className="text-[#E5A00D]" />
                                <span>Call Rider ({ord.delivery.staffPhone})</span>
                              </a>
                            )}
                          </div>

                          {/* Compact Live GPS Interactive Map */}
                          <LiveTrackingMap
                            compact={true}
                            driverLat={ord.delivery.currentLat}
                            driverLng={ord.delivery.currentLng}
                            driverName={ord.delivery.staffName || "Express Delivery Partner"}
                            driverPhone={ord.delivery.staffPhone || ""}
                            customerLat={ord.latitude}
                            customerLng={ord.longitude}
                            customerAddress={`${ord.addressString || ""}, ${ord.area || ""}, ${ord.city || ""}`.replace(/^,\s*/, "") || "Your Registered Address"}
                            customerArea={ord.area || "Destination"}
                            orderStatus={ord.status}
                          />
                        </div>
                      )}

                      {/* ── Ordered Delicacies (NO BOX - Seamless Luxury Typography) ── */}
                      <div className="pt-2 border-t border-black/10 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <UtensilsCrossed size={13} className="text-[#E5A00D]" />
                            <span className="font-outfit font-black text-xs uppercase tracking-wider text-black">
                              Ordered Delicacies ({ord.items?.length || 0})
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider">
                            Authentic Handi Feast
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
                          {ord.items?.map((item: any) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between py-1 border-b border-zinc-100 sm:border-b-0 text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0 pr-2">
                                <span className="h-5 px-1.5 rounded-md bg-[#FFF8EE] border border-amber-300/80 font-mono font-black text-amber-900 text-[10px] flex items-center justify-center shrink-0">
                                  {item.quantity}x
                                </span>
                                <span className="font-bold text-zinc-900 truncate">
                                  {item.name}
                                </span>
                              </div>
                              <span className="font-mono font-bold text-zinc-800 shrink-0">
                                ₹{item.totalPrice || item.price * item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* ── Delivery Destination Address (NO BOX - Seamless Luxury Typography) ── */}
                      <div className="pt-2 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-start sm:items-center gap-2 min-w-0 text-zinc-700">
                          <MapPin size={14} className="text-[#E5A00D] shrink-0 mt-0.5 sm:mt-0" />
                          <div className="min-w-0 leading-tight">
                            <span className="font-black text-black uppercase text-[11px] mr-1.5">
                              Delivering to ({ord.addressLabel || "Home"}):
                            </span>
                            <span className="text-zinc-600 font-medium truncate">
                              {ord.addressString || "Flat 402, Royal Palms"}, {ord.area || "Hitec City"}, {ord.city || "Hyderabad"} - {ord.pincode || "500081"}
                            </span>
                          </div>
                        </div>

                        {/* Delivery Partner info if assigned and not in OUT_FOR_DELIVERY view */}
                        {ord.delivery?.staffName && ord.status !== "OUT_FOR_DELIVERY" && (
                          <div className="flex items-center gap-2 shrink-0 text-xs">
                            <span className="font-bold text-zinc-800 flex items-center gap-1 bg-amber-50/80 px-2.5 py-0.5 rounded-full border border-amber-200 text-[11px]">
                              <Truck size={12} className="text-[#E5A00D]" />
                              Partner: <strong>{ord.delivery.staffName}</strong>
                            </span>
                            {ord.delivery.staffPhone && (
                              <a
                                href={`tel:${ord.delivery.staffPhone}`}
                                className="font-mono font-bold text-amber-900 hover:underline text-[11px]"
                              >
                                {ord.delivery.staffPhone}
                              </a>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-black/10">
                        <span className="text-[10px] sm:text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          <span>Contactless Sealed Terracotta Handi Drop</span>
                        </span>

                        <button
                          onClick={() => setInvoiceModalOrder(ord)}
                          className="px-3.5 py-1.5 rounded-xl bg-black text-[#FFF8EE] hover:bg-[#E5A00D] hover:text-black border-2 border-black font-outfit font-black text-xs uppercase tracking-wider transition-all shadow-[2px_2px_0_#000]"
                        >
                          View Bill &amp; Invoice
                        </button>
                      </div>

                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ── 0.1 Order History View (All Past and Delivered Orders) ── */}
      {activeTab === "history" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="rounded-3xl border-3 border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0_#000] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-[#E5A00D] border-2 border-black flex items-center justify-center shadow-[3px_3px_0_#000]">
                <History size={28} className="text-black" />
              </div>
              <div>
                <h1 className="font-outfit text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
                  Past Order History
                </h1>
                <p className="text-xs font-bold text-zinc-600 mt-1">
                  Complete history of all your received deliveries and past feasts
                </p>
              </div>
            </div>

            <button
              onClick={loadUserOrders}
              disabled={loadingOrders}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FFF8EE] hover:bg-black text-black hover:text-white border-2 border-black font-outfit font-black text-xs uppercase tracking-wider shadow-[2px_2px_0_#000] transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={loadingOrders ? "animate-spin" : ""} />
              <span>Refresh History</span>
            </button>
          </div>

          {loadingOrders ? (
            <div className="py-16 rounded-3xl border-3 border-black bg-white/70 flex flex-col items-center justify-center gap-3">
              <Loader2 size={32} className="animate-spin text-[#E5A00D]" />
              <p className="font-outfit font-black text-sm text-black">Loading order history...</p>
            </div>
          ) : userOrders.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border-3 border-dashed border-black/20 bg-white/80 space-y-4">
              <Package size={36} className="mx-auto text-zinc-400" />
              <h3 className="font-outfit text-lg font-black uppercase text-black">No Past Orders Found</h3>
              <p className="text-xs text-zinc-500 font-medium">Your completed and past orders will show up here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {userOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="rounded-2xl border-2 border-black bg-white p-5 shadow-[4px_4px_0_#000] space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/10 pb-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-outfit font-black text-base text-black">
                        {formatOrderId(ord.id)}
                      </span>
                      <span className="text-xs text-zinc-500 font-bold">
                        • {new Date(ord.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${ord.status === "DELIVERED" ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-amber-100 text-amber-800 border-amber-300"
                        }`}>
                        {ord.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-outfit font-black text-lg text-black">₹{ord.total}</span>
                      <button
                        onClick={() => setInvoiceModalOrder(ord)}
                        className="px-3 py-1.5 rounded-xl bg-[#FFF8EE] hover:bg-black hover:text-white border border-black font-outfit font-black text-xs uppercase tracking-wider transition-colors shadow-sm"
                      >
                        Bill / Invoice
                      </button>
                    </div>
                  </div>

                  {/* Dishes in this past order */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {ord.items?.map((item: any) => (
                      <span
                        key={item.id}
                        className="px-2.5 py-1 rounded-lg bg-zinc-100 border border-zinc-200 text-xs font-bold text-zinc-700"
                      >
                        {item.quantity}x {item.name}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs text-zinc-500 font-medium">
                    Delivered to: {ord.addressString || "Flat 402, Royal Palms"}, {ord.area || "Hitec City"}, {ord.city || "Hyderabad"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 0.2 Bills & Invoices Tab ── */}
      {activeTab === "invoices" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="rounded-3xl border-3 border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0_#000] flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-[#E5A00D] border-2 border-black flex items-center justify-center shadow-[3px_3px_0_#000]">
                <Receipt size={28} className="text-black" />
              </div>
              <div>
                <h1 className="font-outfit text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
                  Bills &amp; Invoices
                </h1>
                <p className="text-xs font-bold text-zinc-600 mt-1">
                  Download and print authentic GST tax invoices and payment receipts
                </p>
              </div>
            </div>

            <button
              onClick={loadUserOrders}
              disabled={loadingOrders}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FFF8EE] hover:bg-black text-black hover:text-white border-2 border-black font-outfit font-black text-xs uppercase tracking-wider shadow-[2px_2px_0_#000] transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={loadingOrders ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="rounded-3xl border-3 border-black bg-white p-6 sm:p-8 shadow-[5px_5px_0_#000] space-y-4">
            {userOrders.length === 0 ? (
              <p className="text-center py-8 text-xs font-bold text-zinc-500">No invoices generated yet.</p>
            ) : (
              <div className="divide-y divide-black/10">
                {userOrders.map((ord) => (
                  <div key={ord.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-[#E5A00D]" />
                        <p className="font-outfit font-black text-sm text-black">INVOICE {formatOrderId(ord.id)}</p>
                      </div>
                      <p className="text-zinc-500 font-semibold text-[11px]">
                        Date: {new Date(ord.createdAt).toLocaleDateString("en-IN", { dateStyle: "long" })} • Payment: COD / Online
                      </p>
                      <p className="text-zinc-600 font-bold text-xs">
                        {ord.items?.map((i: any) => `${i.quantity}x ${i.name}`).join(", ")}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-outfit font-black text-xl text-black">₹{ord.total}</span>
                      <button
                        onClick={() => setInvoiceModalOrder(ord)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black text-[#E5A00D] hover:bg-[#E5A00D] hover:text-black border-2 border-black font-outfit font-black text-xs uppercase tracking-wider transition-all shadow-[2px_2px_0_#000]"
                      >
                        <Receipt size={13} />
                        <span>View Invoice</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 0.3 Subscriptions Tab ── */}
      {activeTab === "subscriptions" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="rounded-3xl border-3 border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0_#000] flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-[#E5A00D] border-2 border-black flex items-center justify-center shadow-[3px_3px_0_#000]">
              <CalendarCheck size={28} className="text-black" />
            </div>
            <div>
              <h1 className="font-outfit text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
                Your Meal Subscriptions
              </h1>
              <p className="text-xs font-bold text-zinc-600 mt-1">
                Manage your scheduled corporate and daily meal bowl passes
              </p>
            </div>
          </div>

          <div className="rounded-3xl border-3 border-black bg-white p-8 shadow-[5px_5px_0_#000] text-center space-y-4">
            <CalendarCheck size={40} className="mx-auto text-[#E5A00D]" />
            <h3 className="font-outfit text-xl font-black uppercase text-black">Daily Meal Passes Available</h3>
            <p className="text-xs text-zinc-600 font-medium max-w-md mx-auto">
              Save up to 30% on everyday handcrafted meals with automated doorstep handi deliveries.
            </p>
            <a
              href="/#subscriptions"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#E5A00D] text-black font-outfit font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0_#000]"
            >
              <span>Explore Subscription Plans</span>
              <ArrowRight size={14} />
            </a>
          </div>
        </div>
      )}

      {/* ── 0.4 Settings Tab ── */}
      {activeTab === "settings" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="rounded-3xl border-3 border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0_#000] flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-[#E5A00D] border-2 border-black flex items-center justify-center shadow-[3px_3px_0_#000]">
              <SettingsIcon size={28} className="text-black" />
            </div>
            <div>
              <h1 className="font-outfit text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
                Account &amp; Delivery Settings
              </h1>
              <p className="text-xs font-bold text-zinc-600 mt-1">
                Manage saved addresses, preferences, and notifications
              </p>
            </div>
          </div>

          <div className="rounded-3xl border-3 border-black bg-white p-6 sm:p-8 shadow-[5px_5px_0_#000] space-y-6">
            <div className="flex items-center justify-between border-b-2 border-black/10 pb-4">
              <div>
                <h4 className="font-outfit font-black text-base uppercase text-black">Delivery Addresses</h4>
                <p className="text-xs text-zinc-600 font-medium">Add or edit your saved home, work, and secondary delivery locations.</p>
              </div>
              <button
                onClick={() => {
                  setAddressToEdit(null);
                  setAddressModalMode("LIST");
                  setAddressModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-black text-[#E5A00D] font-outfit font-black text-xs uppercase tracking-wider border-2 border-black shadow-[2px_2px_0_#E5A00D]"
              >
                Manage Addresses
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HOME / DISHES SECTION (Only when activeTab is "home") ── */}
      {activeTab === "home" && (
        <>
          {/* ── 1. Hero Offers & Discount Slider with Real Kitchen Background Images ── */}
          <div
            onMouseEnter={() => setIsSliderHovered(true)}
            onMouseLeave={() => setIsSliderHovered(false)}
            className="relative overflow-hidden rounded-2xl md:rounded-[2.5rem] border-3 md:border-4 border-black bg-zinc-950 p-3.5 sm:p-6 lg:p-12 shadow-[4px_4px_0_#000] md:shadow-[8px_8px_0_#000] text-white select-none"
          >

            {/* Dynamic Video Background playing Food1.mp4 -> Food5.mp4 playlist */}
            <video
              key={foodVideos[currentVideoIndex]}
              src={foodVideos[currentVideoIndex]}
              autoPlay
              muted
              playsInline
              onEnded={handleVideoEnded}
              className="absolute inset-0 w-full h-full object-cover object-center z-0 transition-opacity duration-1000"
            />

            {/* Clean, Bright Gradient Overlays so the vibrant food video is crystal clear */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 lg:via-black/35 to-black/40 lg:to-transparent z-0 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-0 pointer-events-none" />

            {/* Ambient glow & accents */}
            <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-amber-400/20 blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 h-96 w-96 rounded-full bg-black/20 blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-12 gap-3 sm:gap-6 lg:gap-8 items-center">

              {/* Left Hero Content: Takes 8 cols on mobile, 7 on desktop */}
              <div className="col-span-8 sm:col-span-7 lg:col-span-7 space-y-2 sm:space-y-4 lg:space-y-6">

                {/* Top Badges */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-3">
                  <span className="inline-flex items-center gap-1 px-2 sm:px-3.5 py-0.5 sm:py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-amber-300 text-[9px] sm:text-xs font-black uppercase tracking-wider truncate max-w-[180px] sm:max-w-none">
                    {activeSlideData.tag}
                  </span>
                  <span className="hidden xs:inline-flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-white/95 text-black text-[9px] sm:text-xs font-black shadow-sm">
                    <Star size={10} className="fill-amber-500 text-amber-500 sm:w-3 sm:h-3" />
                    <span>{activeSlideData.rating}</span>
                  </span>
                </div>

                {/* Title & Description with smooth keyed fade-in */}
                <div key={`slide-text-${currentSlide}`} className="space-y-1 sm:space-y-2 lg:space-y-3 transition-opacity duration-700">
                  <h1 className="font-outfit text-base sm:text-3xl lg:text-6xl font-black uppercase leading-tight tracking-tight text-white drop-shadow-md line-clamp-2 lg:line-clamp-none">
                    {activeSlideData.title}
                  </h1>
                  <p className="hidden md:block text-xs lg:text-base text-amber-100/90 font-medium leading-relaxed max-w-xl">
                    {activeSlideData.description}
                  </p>
                </div>

                {/* Action Buttons: Promo Code + CTA */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 lg:gap-4 pt-0.5 sm:pt-2">
                  <button
                    onClick={() => handleCopyPromo(activeSlideData.promoCode)}
                    className="group flex items-center gap-1.5 px-2 sm:px-4 py-1.5 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-2xl bg-black/70 backdrop-blur-md border border-amber-300/50 hover:border-amber-300 text-[9px] sm:text-xs font-bold uppercase tracking-wider text-white transition-all active:scale-95 shadow-md"
                    title="Click to copy promo code"
                  >
                    <span className="text-amber-300 font-black text-[9px] sm:text-xs font-mono">{activeSlideData.promoCode}</span>
                    {copiedCode === activeSlideData.promoCode ? (
                      <Check size={11} className="text-emerald-400" />
                    ) : (
                      <Copy size={11} className="text-amber-200 group-hover:text-white transition-colors" />
                    )}
                  </button>

                  <a
                    href="#menu-section"
                    className="inline-flex items-center gap-1 px-2.5 sm:px-5 lg:px-6 py-1.5 sm:py-2.5 lg:py-3.5 rounded-lg sm:rounded-2xl bg-[#E5A00D] text-black font-outfit font-black text-[10px] sm:text-xs lg:text-sm uppercase tracking-wider hover:bg-[#ffb515] border-2 border-black shadow-[2px_2px_0_#FFF8EE] sm:shadow-[4px_4px_0_#FFF8EE] hover:translate-x-0.5 hover:translate-y-0.5 transition-all shrink-0"
                  >
                    <span>Order</span>
                    <ArrowRight size={12} className="text-black sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
                  </a>
                </div>

                {/* Slide Navigation Controls */}
                <div className="flex items-center gap-2 sm:gap-4 pt-0.5 sm:pt-2 lg:pt-4">
                  <div className="flex items-center gap-1 sm:gap-2">
                    {slides.map((s, idx) => (
                      <button
                        key={s.id}
                        onClick={() => setCurrentSlide(idx)}
                        className={`h-1.5 sm:h-2.5 rounded-full transition-all duration-500 ${idx === currentSlide
                            ? "w-4 sm:w-8 bg-[#E5A00D] shadow-sm"
                            : "w-1.5 sm:w-2.5 bg-white/40 hover:bg-white/70"
                          }`}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                  <span className="text-[9px] sm:text-xs font-mono font-bold text-amber-200">
                    {currentSlide + 1}/{slides.length}
                  </span>

                  {/* Prev / Next Arrows */}
                  <div className="flex items-center gap-0.5 sm:gap-1 ml-0.5 sm:ml-2">
                    <button
                      onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
                      className="p-0.5 sm:p-1.5 rounded-md sm:rounded-xl bg-black/40 hover:bg-black text-white transition-colors border border-white/20 active:scale-95"
                      aria-label="Previous Slide"
                    >
                      <ChevronLeft size={12} className="sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
                      className="p-0.5 sm:p-1.5 rounded-md sm:rounded-xl bg-black/40 hover:bg-black text-white transition-colors border border-white/20 active:scale-95"
                      aria-label="Next Slide"
                    >
                      <ChevronRight size={12} className="sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
                    </button>
                  </div>
                </div>

              </div>

              {/* Right Hero Image: Takes 4 cols on mobile, 5 on desktop */}
              <div className="col-span-4 sm:col-span-5 lg:col-span-5 flex flex-col items-center justify-center relative">
                <div className="relative w-24 h-24 xs:w-28 xs:h-28 sm:w-56 sm:h-56 lg:w-96 lg:h-96 rounded-full border-2 sm:border-4 border-black/40 bg-black/30 p-1 sm:p-2 shadow-lg sm:shadow-2xl flex items-center justify-center group overflow-hidden">
                  <div className="relative w-full h-full rounded-full overflow-hidden border border-amber-300/40 sm:border-4 shadow-inner">
                    {slides.map((slide, idx) => {
                      const isActive = idx === currentSlide;
                      return (
                        <div
                          key={slide.id}
                          className={`absolute inset-0 transition-all duration-1000 ease-in-out ${isActive
                              ? "opacity-100 scale-100 z-10"
                              : "opacity-0 scale-105 pointer-events-none z-0"
                            }`}
                        >
                          <Image
                            src={slide.image}
                            alt={slide.title}
                            fill
                            priority={idx === 0 || isActive}
                            className="object-cover transition-transform duration-1000 group-hover:scale-110"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Express Badge below circular image */}
                <div className="mt-1 sm:mt-4 inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-0.5 sm:py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-[8px] sm:text-xs font-bold text-[#FFF8EE] shadow-lg animate-in fade-in duration-500" key={`badge-${currentSlide}`}>
                  <span className="h-1 sm:h-2 w-1 sm:w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="truncate max-w-[90px] sm:max-w-none">{activeSlideData.dishBadge}</span>
                </div>
              </div>

            </div>
          </div>

          {/* ── 2. Delivery & Subscription Status Bar ── */}
          <div className="rounded-3xl border-3 border-black bg-white p-4 sm:p-5 shadow-[4px_4px_0_#000] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">

            {/* Left: Location & Delivery Time */}
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-2xl bg-[#FFF8EE] border-2 border-black text-[#E5A00D] flex items-center justify-center shrink-0 shadow-[2px_2px_0_#000]">
                <MapPin size={22} className="text-black" />
              </div>
              <div className="leading-tight">
                <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase text-black">
                  <span>
                    {activeAddress
                      ? `DELIVERING TO ${activeAddress.label || "HOME"}`
                      : "NO DELIVERY ADDRESS"}
                  </span>
                  <span className="text-zinc-400">•</span>
                  <span className="text-amber-700 flex items-center gap-1 font-bold">
                    <Clock size={12} /> 25–30 mins (2.4 km away)
                  </span>
                  <button
                    onClick={() => {
                      setAddressToEdit(null);
                      setAddressModalMode(activeAddress ? "LIST" : "FORM");
                      setAddressModalOpen(true);
                    }}
                    className="text-black underline font-bold hover:text-[#E5A00D] transition-colors ml-1 cursor-pointer"
                  >
                    {activeAddress ? "Change" : "Add Address"}
                  </button>
                </div>
                {activeAddress ? (
                  <p className="text-xs text-zinc-600 font-semibold mt-0.5">
                    {activeAddress.address}, {activeAddress.area}, {activeAddress.city} - {activeAddress.pincode}
                  </p>
                ) : (
                  <p className="text-xs text-amber-800 font-semibold mt-0.5">
                    Please add a delivery address to ensure speedy doorstep delivery.
                  </p>
                )}
              </div>
            </div>

            {/* Right: Subscription Pass Toggle + View Cart Button */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-zinc-100">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSubscriptionPass(!subscriptionPass)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${subscriptionPass ? "bg-emerald-600" : "bg-zinc-300"
                    }`}
                  aria-label="Toggle Subscription Pass"
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${subscriptionPass ? "translate-x-6" : "translate-x-0"
                      }`}
                  />
                </button>
                <div className="leading-none text-left">
                  <p className="text-xs font-black text-black">Daily Subscription Pass</p>
                  <p className="text-[10px] font-bold text-emerald-700 mt-0.5">1 meal credit available today</p>
                </div>
              </div>

              <button
                onClick={() => {
                  // Trigger navbar cart popover or show cart notice
                  window.dispatchEvent(new CustomEvent("qbowl-open-cart"));
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FFF8EE] hover:bg-black text-black hover:text-[#FFF8EE] border-2 border-black font-outfit font-black text-xs uppercase tracking-wider shadow-[2px_2px_0_#000] transition-all"
              >
                <ShoppingBag size={14} className="text-[#E5A00D]" />
                <span>View Cart ({totalCartCount} Items)</span>
                <ChevronRight size={14} />
              </button>
            </div>

          </div>

          {/* ── 3. Explore Curated Menus Filter Pills ── */}
          <div id="menu-section" className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="font-outfit text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
                Explore Curated Menus
              </h2>
              <span className="text-xs font-bold text-zinc-500 hidden sm:inline-block">
                Showing 44 handcrafted recipes
              </span>
            </div>

            {/* Filter Pills Horizontal Scroll */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
              {dynamicCategories.map((cat) => {
                const isSelected = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setActiveCategory(cat);
                      window.dispatchEvent(
                        new CustomEvent("qbowl-select-category", { detail: { category: cat } })
                      );
                    }}
                    className={`px-5 py-2.5 rounded-full text-xs font-outfit font-black uppercase tracking-wider whitespace-nowrap border-2 transition-all shrink-0 ${isSelected
                        ? "bg-[#E5A00D] text-black border-black shadow-[3px_3px_0_#000]"
                        : "bg-white text-zinc-700 border-black/20 hover:border-black hover:text-black hover:bg-[#FFF8EE]"
                      }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── 4. Popular & Chef's Signatures Food Grid ── */}
          <div className="space-y-4">

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-outfit text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
                  Popular &amp; Chef&apos;s Signatures
                </h3>
                <p className="text-xs text-zinc-600 font-medium mt-0.5">
                  Crafted fresh per order in authentic sealed terracotta handis &amp; wood ovens
                </p>
              </div>
              <Link
                href="/#menu"
                className="flex items-center gap-1 font-outfit text-xs font-black uppercase tracking-wider text-amber-700 hover:text-black transition-colors"
              >
                <span>View All 14 Biryanis</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            {/* Food Items Grid Cards */}
            {loadingMeals ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="rounded-3xl border-3 border-black bg-white overflow-hidden shadow-[5px_5px_0_#000] p-4 space-y-4 animate-pulse"
                  >
                    <div className="h-48 w-full bg-zinc-200 rounded-2xl" />
                    <div className="space-y-2">
                      <div className="h-4 bg-zinc-200 rounded-md w-3/4" />
                      <div className="h-3 bg-zinc-100 rounded-md w-full" />
                      <div className="h-3 bg-zinc-100 rounded-md w-2/3" />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <div className="h-6 bg-zinc-200 rounded-md w-16" />
                      <div className="h-8 bg-zinc-200 rounded-xl w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredItems.map((item) => {
                  const qty = quantities[item.id] || 0;

                  return (
                    <div
                      key={item.id}
                      className="group rounded-3xl border-3 border-black bg-white overflow-hidden shadow-[5px_5px_0_#000] hover:shadow-[7px_7px_0_#000] hover:-translate-y-1 transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Top Image Container with Badges */}
                        <div className="relative h-52 w-full bg-zinc-100 overflow-hidden border-b-2 border-black">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />

                          {/* Tag badge (e.g. NON-VEG, PURE VEG) */}
                          <div className="absolute top-3 left-3 z-10">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md ${item.tagType === "PURE VEG"
                                  ? "bg-emerald-600 text-white"
                                  : item.tagType === "ROYAL NON-VEG"
                                    ? "bg-[#8B3A00] text-amber-200"
                                    : item.tagType === "CRAFT NON-VEG"
                                      ? "bg-black text-[#E5A00D]"
                                      : "bg-red-600 text-white"
                                }`}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-white" />
                              {item.tag}
                            </span>
                          </div>

                          {/* Top Right: Rating Badge + Favourite Heart Icon */}
                          <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                            {/* Rating Badge */}
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-white text-[11px] font-black border border-white/20 shadow-sm">
                              <Star size={11} className="fill-amber-400 text-amber-400" />
                              <span>{item.rating}</span>
                            </span>

                            {/* Favourite Heart Button */}
                            <button
                              onClick={(e) => toggleFavorite(item.id, e)}
                              className={`p-1.5 rounded-full border-2 border-black transition-all shadow-[2px_2px_0_#000] active:scale-90 ${favorites.includes(item.id)
                                  ? "bg-red-50 text-red-600 border-red-950 scale-105"
                                  : "bg-white/95 text-zinc-400 hover:text-red-500 hover:bg-white"
                                }`}
                              aria-label={favorites.includes(item.id) ? "Remove from favourites" : "Add to favourites"}
                              title={favorites.includes(item.id) ? "Favourited" : "Add to Favourites"}
                            >
                              <Heart
                                size={14}
                                className={`transition-colors ${favorites.includes(item.id)
                                    ? "fill-red-600 text-red-600"
                                    : ""
                                  }`}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="p-4 space-y-2.5">
                          {/* Specs / Nutritional subtext */}
                          <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500">
                            <span>{item.specs}</span>
                            <span className="font-mono text-zinc-600">
                              {item.calories} • {item.protein}
                            </span>
                          </div>

                          {/* Dish Title */}
                          <h4 className="font-outfit text-base font-black uppercase leading-snug text-black group-hover:text-[#E5A00D] transition-colors line-clamp-1">
                            {item.name}
                          </h4>

                          {/* Description */}
                          <p className="text-xs text-zinc-600 font-medium leading-relaxed line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      {/* Card Bottom: Price + Action Button / Counter */}
                      <div className="p-4 pt-0 border-t border-zinc-100 flex items-center justify-between gap-3 mt-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Price</span>
                          <span className="font-outfit text-xl font-black text-black">
                            ₹{item.price}
                          </span>
                        </div>

                        {qty > 0 ? (
                          <div className="flex items-center gap-2 bg-[#FFF8EE] border-2 border-black rounded-xl px-2 py-1 shadow-[2px_2px_0_#000]">
                            <button
                              onClick={() => updateQuantity(item, -1)}
                              className="h-6 w-6 rounded-lg bg-white text-black flex items-center justify-center hover:bg-black hover:text-white transition-colors border border-black/20"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="font-outfit font-black text-sm text-black min-w-[16px] text-center">
                              {qty}
                            </span>
                            <button
                              onClick={() => updateQuantity(item, 1)}
                              className="h-6 w-6 rounded-lg bg-[#E5A00D] text-black flex items-center justify-center hover:bg-black hover:text-white transition-colors border border-black"
                              aria-label="Increase quantity"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => updateQuantity(item, 1)}
                            className="px-4 py-2 rounded-xl bg-black text-[#FFF8EE] hover:bg-[#E5A00D] hover:text-black font-outfit font-black text-xs uppercase tracking-wider border-2 border-black shadow-[2px_2px_0_#000] hover:shadow-none transition-all flex items-center gap-1.5"
                          >
                            <span>Add to Bowl</span>
                            <Plus size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center rounded-3xl border-3 border-dashed border-black/20 bg-white/60">
                <p className="font-outfit font-black text-lg text-black">No food items found in this category.</p>
                <p className="text-xs text-zinc-500 font-semibold mt-1">Dishes added in the Master Food Catalog by the admin will appear here immediately.</p>
              </div>
            )}

          </div>
        </>
      )}

      {/* Interactive Delivery Address Modal */}
      <AddressModal
        isOpen={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        initialMode={addressModalMode}
        initialAddressToEdit={addressToEdit}
        onAddressSelected={(addr) => {
          setActiveAddress(addr);
        }}
      />

      {/* ── Bill & Tax Invoice Receipt Modal ── */}
      {invoiceModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#FFF8EE] rounded-3xl border-3 border-black shadow-[8px_8px_0_#000] p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">

            {/* Header */}
            <div className="flex items-start justify-between border-b-2 border-black pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-[#E5A00D] border-2 border-black px-2 py-0.5 rounded-lg text-[10px] font-black uppercase text-black">
                    Official Receipt
                  </span>
                  <span className="text-xs font-mono font-bold text-zinc-500">
                    TAX INVOICE
                  </span>
                </div>
                <h3 className="font-outfit text-2xl font-black uppercase tracking-tight text-black mt-1">
                  The Q-Bowl Handi Kitchen
                </h3>
                <p className="text-[11px] font-bold text-zinc-600">
                  GSTIN: 36AAACT9482Q1Z5 • FSSAI Lic No. 13622014000492
                </p>
              </div>
              <button
                onClick={() => setInvoiceModalOrder(null)}
                className="p-2 rounded-xl bg-white hover:bg-black hover:text-white border-2 border-black transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Order & Customer Metadata */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-white p-4 rounded-2xl border-2 border-black">
              <div>
                <span className="text-[10px] font-bold uppercase text-zinc-400 block">Order ID</span>
                <span className="font-mono font-black text-black">{formatOrderId(invoiceModalOrder.id)}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-zinc-400 block">Date & Time</span>
                <span className="font-bold text-zinc-800">
                  {new Date(invoiceModalOrder.createdAt).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-zinc-400 block">Payment Mode</span>
                <span className="font-bold text-emerald-700 uppercase">{invoiceModalOrder.paymentMethod || "Cash on Delivery"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-zinc-400 block">Status</span>
                <span className="font-black text-black uppercase">{invoiceModalOrder.status.replace(/_/g, " ")}</span>
              </div>
            </div>

            {/* Delivery Destination */}
            <div className="text-xs bg-zinc-50 p-3.5 rounded-2xl border border-black/15">
              <span className="text-[10px] font-bold uppercase text-zinc-400 block">Delivery Address</span>
              <p className="font-semibold text-zinc-800 mt-0.5">
                {invoiceModalOrder.addressString || "Flat 402, Royal Palms"}, {invoiceModalOrder.area || "Hitec City"}, {invoiceModalOrder.city || "Hyderabad"} - {invoiceModalOrder.pincode || "500081"}
              </p>
            </div>

            {/* Itemized Breakdown Table */}
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-black block">Item Breakdown</span>
              <div className="border-2 border-black rounded-2xl bg-white overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FFF8EE] border-b-2 border-black font-outfit font-black text-[11px] uppercase">
                    <tr>
                      <th className="p-3">Dish / Item</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Price</th>
                      <th className="p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10 font-medium">
                    {invoiceModalOrder.items?.map((item: any) => (
                      <tr key={item.id}>
                        <td className="p-3 font-bold text-black">{item.name}</td>
                        <td className="p-3 text-center font-mono font-bold text-zinc-700">{item.quantity}</td>
                        <td className="p-3 text-right font-mono text-zinc-600">₹{item.price}</td>
                        <td className="p-3 text-right font-mono font-bold text-black">₹{item.totalPrice || item.price * item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bill Totals Summary */}
            <div className="bg-zinc-50 p-4 rounded-2xl border-2 border-black space-y-2 text-xs">
              <div className="flex justify-between text-zinc-600 font-semibold">
                <span>Subtotal (Item Total)</span>
                <span className="font-mono">₹{invoiceModalOrder.items?.reduce((s: number, i: any) => s + (i.totalPrice || i.price * i.quantity), 0) || invoiceModalOrder.total}</span>
              </div>
              <div className="flex justify-between text-zinc-600 font-semibold">
                <span>GST &amp; Restaurant Packaging</span>
                <span className="font-mono text-emerald-600">₹0 (Included)</span>
              </div>
              <div className="flex justify-between text-zinc-600 font-semibold">
                <span>Delivery &amp; Handi Packing Fee</span>
                <span className="font-mono text-emerald-600">FREE</span>
              </div>
              <div className="border-t-2 border-black pt-2 flex justify-between items-center">
                <span className="font-outfit font-black text-sm uppercase text-black">Grand Total Paid</span>
                <span className="font-outfit font-black text-2xl text-black">₹{invoiceModalOrder.total}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 rounded-2xl bg-[#E5A00D] text-black font-outfit font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0_#000] hover:bg-black hover:text-[#E5A00D] transition-all flex items-center justify-center gap-2"
              >
                <Printer size={16} />
                <span>Print Tax Invoice</span>
              </button>
              <button
                onClick={() => setInvoiceModalOrder(null)}
                className="px-6 py-3 rounded-2xl bg-white text-black font-outfit font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0_#000] hover:bg-zinc-100 transition-all"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default CustomerDashboardView;
