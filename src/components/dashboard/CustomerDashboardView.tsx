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
  ArrowLeft,
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
  Upload,
  Image as ImageIcon,
  MessageSquare,
  ChefHat,
  Megaphone,
  Info,
  Bell,
  Calendar,
  AlertTriangle,
  Play,
  Pause,
  Zap,
} from "lucide-react";
import dynamic from "next/dynamic";
import { AddressModal, AddressItem } from "./AddressModal";
import { formatOrderId } from "@/lib/utils/orderIdFormatter";
import { openRazorpayModal } from "@/lib/razorpay-client";

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

  // Kitchen Operational Status State & Modals
  const [kitchenStatus, setKitchenStatus] = useState({
    kitchenStatus: "OPEN",
    openingTime: "07:00 AM",
    closingTime: "10:30 PM",
    isOrderingPaused: false,
    estimatedPrepTime: "25 - 35 mins",
    isNoticeBannerActive: true,
    noticeBannerText: "Kitchen is open and serving fresh homemade bowls! Pre-orders welcome.",
    noticeBannerType: "INFO" as "INFO" | "WARNING" | "ALERT" | "SUCCESS",
    subscriberExemptionNote: "Active subscribers continue receiving daily scheduled meals on time without interruption.",
    kitchenName: "The Q Bowl Cloud Kitchen, Bridge County Canteen Hub, Rajanagaram, Velugubanda, AP",
    kitchenLat: 17.0605,
    kitchenLng: 81.8640,
    deliveryRadiusKm: 20.0,
  });
  const [showKitchenModal, setShowKitchenModal] = useState(false);
  const [showKitchenPausedModal, setShowKitchenPausedModal] = useState(false);
  const [dismissedNotice, setDismissedNotice] = useState(false);

  // Fetch live kitchen operational status from backend (with fast 4s polling + window focus sync)
  useEffect(() => {
    async function fetchKitchenStatus() {
      try {
        const res = await fetch(`/api/kitchen/status?t=${Date.now()}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setKitchenStatus((prev) => ({ ...prev, ...data.settings }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch kitchen status:", err);
      }
    }

    fetchKitchenStatus();
    const interval = setInterval(fetchKitchenStatus, 4000);
    window.addEventListener("focus", fetchKitchenStatus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", fetchKitchenStatus);
    };
  }, []);

  // Lock body scroll and enable ESC key to close full-screen Kitchen view
  useEffect(() => {
    if (showKitchenModal) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setShowKitchenModal(false);
          setShowKitchenPausedModal(false);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [showKitchenModal]);

  // Active Delivery Address State & Modal
  const [activeAddress, setActiveAddress] = useState<AddressItem | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addressModalMode, setAddressModalMode] = useState<"LIST" | "FORM">("LIST");
  const [addressToEdit, setAddressToEdit] = useState<AddressItem | null>(null);

  // Active Subscription & Recent Deliveries State
  interface DashboardSubscription {
    id: string;
    status: string;
    totalMeals: number;
    mealsUsed: number;
    mealsRemaining: number;
    startDate: string;
    endDate?: string;
    expectedEndDate?: string;
    pricePaid?: number;
    planName?: string;
    mealName?: string;
    planDescription?: string;
    preferredDeliveryTime?: string;
  }

  interface DashboardDelivery {
    id: string;
    date: string;
    mealType: string;
    itemsSummary: string;
    status: string;
    quantity: number;
    type: "SUBSCRIPTION" | "ORDER";
  }

  const [activeSubscription, setActiveSubscription] = useState<DashboardSubscription | null>(null);
  const [recentDeliveries, setRecentDeliveries] = useState<DashboardDelivery[]>([]);
  const [loadingDashboardData, setLoadingDashboardData] = useState(true);

  // ── Feedback & Complaint System State ──
  interface PendingFeedbackData {
    orderId: string;
    deliveryDate: string;
    mealType: string;
    foodItemName: string;
    itemCount: number;
  }

  const [pendingHomeFeedback, setPendingHomeFeedback] = useState<PendingFeedbackData | null>(null);
  const [reviewedOrderIds, setReviewedOrderIds] = useState<string[]>([]);
  const [loadingFeedbackStatus, setLoadingFeedbackStatus] = useState(true);

  // Feedback Modal State
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackOrderId, setFeedbackOrderId] = useState<string | null>(null);
  const [feedbackFoodName, setFeedbackFoodName] = useState<string>("");
  const [feedbackDate, setFeedbackDate] = useState<string>("");
  const [feedbackOverallRating, setFeedbackOverallRating] = useState<number>(5);
  const [feedbackFoodRating, setFeedbackFoodRating] = useState<number>(5);
  const [feedbackDeliveryRating, setFeedbackDeliveryRating] = useState<number>(5);
  const [feedbackComment, setFeedbackComment] = useState<string>("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccessNotice, setFeedbackSuccessNotice] = useState<string | null>(null);

  // Complaint Modal State
  const [complaintModalOpen, setComplaintModalOpen] = useState(false);
  const [complaintOrderId, setComplaintOrderId] = useState<string | null>(null);
  const [complaintCategory, setComplaintCategory] = useState<string>("Food Quality");
  const [complaintSubject, setComplaintSubject] = useState<string>("");
  const [complaintDescription, setComplaintDescription] = useState<string>("");
  const [complaintImage, setComplaintImage] = useState<string>("");
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [complaintSuccessNotice, setComplaintSuccessNotice] = useState<string | null>(null);

  // My Complaints View State
  const [myComplaintsModalOpen, setMyComplaintsModalOpen] = useState(false);
  const [userComplaintsList, setUserComplaintsList] = useState<any[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);

  const fetchUserFeedbackStatus = async () => {
    try {
      setLoadingFeedbackStatus(true);
      const res = await fetch("/api/user/feedback");
      if (res.ok) {
        const data = await res.json();
        setPendingHomeFeedback(data.pendingFeedbackCard || null);
        setReviewedOrderIds(data.reviewedOrderIds || []);
      }
    } catch (e) {
      console.error("Failed to fetch user feedback status:", e);
    } finally {
      setLoadingFeedbackStatus(false);
    }
  };

  const fetchUserComplaints = async () => {
    try {
      setLoadingComplaints(true);
      const res = await fetch("/api/user/complaints");
      if (res.ok) {
        const data = await res.json();
        setUserComplaintsList(data.complaints || []);
      }
    } catch (e) {
      console.error("Failed to fetch user complaints:", e);
    } finally {
      setLoadingComplaints(false);
    }
  };

  useEffect(() => {
    fetchUserFeedbackStatus();
    fetchUserComplaints();
  }, []);

  const handleSubmitFeedback = async (e: React.FormEvent, targetOrderId?: string) => {
    e.preventDefault();
    const oid = targetOrderId || feedbackOrderId || pendingHomeFeedback?.orderId;
    if (!oid) return;

    setSubmittingFeedback(true);
    try {
      const res = await fetch("/api/user/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: oid,
          rating: feedbackOverallRating,
          foodRating: feedbackFoodRating,
          deliveryRating: feedbackDeliveryRating,
          comment: feedbackComment,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit feedback.");

      setFeedbackSuccessNotice("Thank you! Your feedback has been submitted successfully ✓");
      setTimeout(() => setFeedbackSuccessNotice(null), 5000);

      setReviewedOrderIds((prev) => [...prev, oid]);
      if (pendingHomeFeedback?.orderId === oid) {
        setPendingHomeFeedback(null);
      }

      setFeedbackModalOpen(false);
      setFeedbackComment("");
      setFeedbackOverallRating(5);
      setFeedbackFoodRating(5);
      setFeedbackDeliveryRating(5);
      fetchUserFeedbackStatus();
    } catch (err: any) {
      alert(err.message || "Unable to submit feedback.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setComplaintImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintSubject.trim() || !complaintDescription.trim()) return;

    setSubmittingComplaint(true);
    try {
      const res = await fetch("/api/user/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: complaintOrderId,
          category: complaintCategory,
          subject: complaintSubject,
          description: complaintDescription,
          imageUrl: complaintImage,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit complaint.");

      setComplaintSuccessNotice("Complaint submitted successfully! Our support team will resolve it shortly ✓");
      setTimeout(() => setComplaintSuccessNotice(null), 5000);

      setComplaintModalOpen(false);
      setComplaintSubject("");
      setComplaintDescription("");
      setComplaintImage("");
      fetchUserComplaints();
    } catch (err: any) {
      alert(err.message || "Unable to submit complaint.");
    } finally {
      setSubmittingComplaint(false);
    }
  };

  useEffect(() => {
    async function loadDashboardData() {
      setLoadingDashboardData(true);
      try {
        const res = await fetch("/api/user/dashboard");
        if (res.ok) {
          const data = await res.json();
          if (data.activeSubscription) {
            setActiveSubscription(data.activeSubscription);
          } else {
            setActiveSubscription(null);
          }
          if (data.recentDeliveries && Array.isArray(data.recentDeliveries)) {
            setRecentDeliveries(data.recentDeliveries);
          }
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoadingDashboardData(false);
      }
    }

    loadDashboardData();
  }, []);

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

  // ── Subscription State ──
  const [dbSubPackages, setDbSubPackages] = useState<any[]>([]);
  const [dbSubMeals, setDbSubMeals] = useState<any[]>([]);
  const [selectedSubPlan, setSelectedSubPlan] = useState<string>("pkg-30-meals");
  const [subMealTiming, setSubMealTiming] = useState<"LUNCH" | "DINNER" | "BOTH">("LUNCH");
  const [subStartDate, setSubStartDate] = useState<string>(() => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return tomorrow.toISOString().split("T")[0];
  });
  const [activeSubRecord, setActiveSubRecord] = useState<any | null>(null);
  const [allUserSubs, setAllUserSubs] = useState<any[]>([]);
  const [subDeliveries, setSubDeliveries] = useState<any[]>([]);
  const [subVegMeal, setSubVegMeal] = useState<any | null>(null);
  const [loadingSubData, setLoadingSubData] = useState(false);
  const [subSubmitting, setSubSubmitting] = useState(false);
  const [subSuccessMsg, setSubSuccessMsg] = useState<string | null>(null);
  const [subErrorMsg, setSubErrorMsg] = useState<string | null>(null);

  // Load User Subscriptions, Active Packages & Active Meals from Database
  async function loadSubscriptionData() {
    try {
      setLoadingSubData(true);
      const res = await fetch("/api/user/subscriptions");
      if (res.ok) {
        const data = await res.json();
        setActiveSubRecord(data.activeSubscription || null);
        setAllUserSubs(data.allSubscriptions || []);
        setSubDeliveries(data.deliveries || []);
        
        // Active packages from DB (only active ones returned by API)
        const pkgs = data.availablePackages || [];
        setDbSubPackages(pkgs);
        if (pkgs.length > 0) {
          // If currently selected plan is no longer in active packages, select the first available or featured
          setSelectedSubPlan((current) => {
            const exists = pkgs.some((p: any) => p.id === current);
            if (exists) return current;
            const featured = pkgs.find((p: any) => p.isFeatured);
            return featured ? featured.id : pkgs[0].id;
          });
        }

        // Active meals with active subscription pricing
        const activeMeals = data.availableMeals || [];
        setDbSubMeals(activeMeals);
        
        // Prefer Full Veg Meal if present among active pricing, else first active meal
        const veg = activeMeals.find((m: any) => m.isVeg) || activeMeals[0] || null;
        setSubVegMeal(veg);
      }
    } catch (e) {
      console.error("Failed to load subscription data:", e);
    } finally {
      setLoadingSubData(false);
    }
  }

  // Toggle Pause on active subscription
  async function handleToggleSubPause(subId: string) {
    try {
      setSubSubmitting(true);
      const res = await fetch("/api/user/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "TOGGLE_PAUSE", subscriptionId: subId }),
      });
      if (res.ok) {
        await loadSubscriptionData();
      } else {
        const err = await res.json();
        setSubErrorMsg(err.error || "Failed to update subscription status");
      }
    } catch (e: any) {
      setSubErrorMsg(e.message || "Failed to update subscription");
    } finally {
      setSubSubmitting(false);
    }
  }

  // Subscribe to Selected Package Plan
  async function handleSubscribePlan(pkgCredits: number, pkgName: string, packageId?: string) {
    if (!activeAddress?.id) {
      setAddressModalOpen(true);
      return;
    }
    // Resolve target meal: from subscription pricing, or from active catalog
    const targetMeal =
      subVegMeal ||
      dbSubMeals.find((m) => m.isVeg) ||
      dbSubMeals[0] ||
      dbFoodItems.find((f) => f.tagType === "PURE VEG") ||
      dbFoodItems[0];

    if (!targetMeal?.id) {
      setSubErrorMsg("Please wait a moment while meals are loading...");
      return;
    }

    setSubSubmitting(true);
    setSubErrorMsg(null);
    setSubSuccessMsg(null);

    const matchedPkgId =
      packageId || (pkgCredits === 20 ? "pkg-20-meals" : pkgCredits === 30 ? "pkg-30-meals" : "pkg-60-meals");

    try {
      // 1. Create official Razorpay Order for Subscription
      const createRes = await fetch("/api/payments/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose: "SUBSCRIPTION",
          packageId: matchedPkgId,
          mealId: targetMeal.id,
          addressId: activeAddress.id,
          mealCredits: pkgCredits,
          mealsPerDay: subMealTiming === "BOTH" ? 2 : 1,
          mealTiming: subMealTiming,
          deliveryDays: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
        }),
      });

      const createData = await createRes.json();

      if (!createRes.ok || !createData.success) {
        // Fallback: If Razorpay keys are in demo/unconfigured mode or validation error
        if (createData.error && !createData.error.includes("Razorpay credentials")) {
          setSubErrorMsg(createData.error);
          setSubSubmitting(false);
          return;
        }

        // Direct subscribe fallback via backend API
        const directRes = await fetch("/api/user/subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "CREATE_SUBSCRIPTION",
            packageId: matchedPkgId,
            mealId: targetMeal.id,
            addressId: activeAddress.id,
            mealCredits: pkgCredits,
            mealsPerDay: subMealTiming === "BOTH" ? 2 : 1,
            mealTiming: subMealTiming,
            deliveryDays: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
            preferredDeliveryTime: subMealTiming === "DINNER" ? "07:30 PM - 08:30 PM" : "12:00 PM - 01:00 PM",
            startDate: subStartDate,
          }),
        });

        const directData = await directRes.json();
        if (directRes.ok && directData.success) {
          setSubSuccessMsg(`🎉 Congratulations! Your ${pkgName} is activated! (Total: ₹${pkgCredits * 55})`);
          await loadSubscriptionData();
        } else {
          setSubErrorMsg(directData.error || "Unable to activate subscription. Please try again.");
        }
        setSubSubmitting(false);
        return;
      }

      // 2. Open Official Razorpay Checkout Modal
      await openRazorpayModal({
        keyId: createData.keyId,
        razorpayOrderId: createData.razorpayOrderId || createData.orderId,
        amount: createData.amount,
        currency: createData.currency || "INR",
        name: "The Q Bowl - Meal Subscriptions",
        description: `${pkgName} · Full Veg Meal Plan`,
        userEmail: createData.customer?.email || "",
        userName: createData.customer?.name || "",
        userPhone: createData.customer?.phone || "",
        onSuccess: async (payData) => {
          setSubSuccessMsg(`🎉 Payment verified! Your ${pkgName} is now active.`);
          await loadSubscriptionData();
          setSubSubmitting(false);
          // Scroll up to the active plan card smoothly
          window.scrollTo({ top: 0, behavior: "smooth" });
        },
        onError: (errMsg) => {
          setSubErrorMsg(errMsg || "Payment was not completed.");
          setSubSubmitting(false);
        },
      });
    } catch (err: any) {
      console.error("Subscription purchase error:", err);
      setSubErrorMsg(err?.message || "Failed to process subscription checkout.");
      setSubSubmitting(false);
    }
  }

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

  // Load orders and subscriptions immediately on mount and listen to order placed events
  useEffect(() => {
    loadUserOrders();
    loadSubscriptionData();

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
        loadSubscriptionData();
      } else if (hash === "#settings") {
        setActiveTab("settings");
      } else if (hash === "#kitchen" || hash === "#kitchen-info") {
        setShowKitchenModal(true);
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
    // If customer is adding a new dish and kitchen ordering is paused or closed
    if (delta > 0 && (kitchenStatus.isOrderingPaused || kitchenStatus.kitchenStatus !== "OPEN")) {
      setShowKitchenModal(true);
      return;
    }

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

  // Kitchen availability state: when closed, closed for today, temporarily unavailable, or ordering paused
  const isKitchenClosedOrUnavailable =
    kitchenStatus.kitchenStatus !== "OPEN" || Boolean(kitchenStatus.isOrderingPaused);

  return (
    <div className="space-y-8 w-full">

      {/* ── LIVE KITCHEN ANNOUNCEMENT BANNER (Broadcast from Admin Kitchen) ── */}
      {kitchenStatus.isNoticeBannerActive && !dismissedNotice && kitchenStatus.noticeBannerText && (
        <div
          className={`relative overflow-hidden rounded-2xl border-2 border-black p-3.5 sm:p-4 shadow-[4px_4px_0_#000] flex items-center justify-between gap-3 transition-all animate-in fade-in duration-300 ${kitchenStatus.noticeBannerType === "ALERT"
              ? "bg-rose-100 text-rose-950"
              : kitchenStatus.noticeBannerType === "WARNING"
                ? "bg-amber-100 text-amber-950"
                : kitchenStatus.noticeBannerType === "SUCCESS"
                  ? "bg-emerald-100 text-emerald-950"
                  : "bg-[#FFF8EE] text-black"
            }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`h-9 w-9 rounded-xl border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0_#000] ${kitchenStatus.noticeBannerType === "ALERT"
                  ? "bg-rose-500 text-white"
                  : kitchenStatus.noticeBannerType === "WARNING"
                    ? "bg-amber-500 text-black"
                    : kitchenStatus.noticeBannerType === "SUCCESS"
                      ? "bg-emerald-500 text-white"
                      : "bg-[#E5A00D] text-black"
                }`}
            >
              <Megaphone size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-outfit text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-black text-[#E5A00D]">
                  Kitchen Broadcast
                </span>
                <span className="hidden xs:inline-flex items-center gap-1 text-[10px] font-bold text-zinc-600">
                  <Clock size={11} /> Live Update
                </span>
              </div>
              <p className="text-xs sm:text-sm font-black mt-0.5 leading-snug line-clamp-2 sm:line-clamp-none">
                {kitchenStatus.noticeBannerText}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowKitchenModal(true)}
              className="hidden sm:flex items-center gap-1 text-[11px] font-black uppercase text-black underline hover:text-[#E5A00D] transition-colors cursor-pointer"
            >
              <ChefHat size={14} />
              <span>Kitchen Info</span>
            </button>
            <button
              onClick={() => setDismissedNotice(true)}
              title="Dismiss announcement"
              className="h-8 w-8 rounded-xl border border-black/20 hover:border-black flex items-center justify-center text-black/60 hover:text-black transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

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
                              className={`px-3 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider border ${ord.status === "OUT_FOR_DELIVERY"
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
                                      className={`absolute top-4 right-1/2 w-full h-1 sm:h-1.5 -translate-y-1/2 z-0 transition-colors duration-500 ${idx <= stepIndex
                                          ? "bg-[#E5A00D] shadow-[0_0_6px_rgba(229,160,13,0.5)]"
                                          : "bg-zinc-200"
                                        }`}
                                    />
                                  )}

                                  {/* Circle Node: exactly 32px height (top 0, center 16px = top-4), perfectly centered on the line */}
                                  <div
                                    className={`relative z-10 w-8 h-8 rounded-full border-2 transition-all duration-300 flex items-center justify-center shrink-0 ${isCurrent
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
                                    className={`mt-1.5 font-outfit text-[10px] sm:text-[11px] font-black uppercase tracking-wider ${isCurrent
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

            <div className="flex items-center gap-2">
              <button
                onClick={() => setMyComplaintsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-red-50 text-red-700 border-2 border-black font-outfit font-black text-xs uppercase tracking-wider shadow-[2px_2px_0_#000] transition-all"
              >
                <AlertCircle size={14} />
                <span>My Support Complaints</span>
              </button>

              <button
                onClick={loadUserOrders}
                disabled={loadingOrders}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FFF8EE] hover:bg-black text-black hover:text-white border-2 border-black font-outfit font-black text-xs uppercase tracking-wider shadow-[2px_2px_0_#000] transition-all disabled:opacity-50"
              >
                <RefreshCw size={14} className={loadingOrders ? "animate-spin" : ""} />
                <span>Refresh History</span>
              </button>
            </div>
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

                    <div className="flex items-center gap-2 flex-wrap sm:justify-end">
                      <span className="font-outfit font-black text-lg text-black mr-2">₹{ord.total}</span>
                      
                      {ord.status === "DELIVERED" && (
                        <>
                          {reviewedOrderIds.includes(ord.id) ? (
                            <span className="px-3 py-1.5 rounded-xl bg-zinc-100 text-zinc-600 font-bold text-xs border border-zinc-300">
                              Feedback Submitted ✓
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setFeedbackOrderId(ord.id);
                                setFeedbackFoodName(ord.items?.map((i: any) => i.name).join(", ") || "Gourmet Order");
                                setFeedbackDate(new Date(ord.createdAt).toLocaleDateString("en-IN"));
                                setFeedbackModalOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-[#E5A00D] text-black hover:bg-black hover:text-[#E5A00D] border-2 border-black font-outfit font-black text-xs uppercase tracking-wider transition-all shadow-[2px_2px_0_#000] flex items-center gap-1.5"
                            >
                              <Star size={13} className="fill-black" />
                              <span>Give Feedback</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setComplaintOrderId(ord.id);
                              setComplaintModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-white text-red-700 hover:bg-red-50 border-2 border-black font-outfit font-black text-xs uppercase tracking-wider transition-all shadow-[2px_2px_0_#000] flex items-center gap-1"
                          >
                            <AlertCircle size={13} />
                            <span>Report Issue</span>
                          </button>
                        </>
                      )}

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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* ── Mobile-Optimized Subscription Header & Address Pill ── */}
          <div className="rounded-2xl border-2 border-black bg-white p-3.5 sm:p-4 shadow-[3px_3px_0_#000] space-y-3">
            {/* Top Row: Title + Pure Veg Badge + Status Pill */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-8 w-8 rounded-xl bg-[#E5A00D] border border-black flex items-center justify-center shrink-0 shadow-[1px_1px_0_#000]">
                  <CalendarCheck size={16} className="text-black" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h1 className="font-outfit text-sm sm:text-base font-black uppercase tracking-tight text-black">
                      Meal Subscriptions
                    </h1>
                    <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                      Pure Veg
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Pill */}
              <div className="shrink-0">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border border-black shadow-[1px_1px_0_#000] ${
                  activeSubRecord ? "bg-emerald-400 text-black" : "bg-zinc-100 text-zinc-700"
                }`}>
                  {activeSubRecord ? "Active" : "No Plan"}
                </span>
              </div>
            </div>

            {/* Bottom Row: Mobile-First Address Card */}
            <div className="flex items-center justify-between gap-2.5 rounded-xl bg-[#FFF8EE] border border-amber-300/80 px-2.5 py-2">
              <div className="flex items-start gap-2 min-w-0">
                <MapPin size={14} className="text-amber-700 shrink-0 mt-0.5" />
                <div className="min-w-0 text-xs text-zinc-800 leading-snug">
                  {activeAddress ? (
                    <div>
                      <span className="font-black text-[10px] uppercase bg-black text-[#E5A00D] px-1.5 py-0.2 rounded mr-1.5 inline-block">
                        {activeAddress.label || "Home"}
                      </span>
                      <span className="font-medium text-zinc-800 break-words">
                        {activeAddress.address}
                        {activeAddress.area ? `, ${activeAddress.area}` : ""}
                        {activeAddress.city ? `, ${activeAddress.city}` : ""}
                        {activeAddress.pincode ? ` - ${activeAddress.pincode}` : ""}
                      </span>
                    </div>
                  ) : (
                    <span className="text-zinc-500 font-medium text-xs">No address selected</span>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  setAddressModalMode("LIST");
                  setAddressModalOpen(true);
                }}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-white hover:bg-zinc-50 text-black font-outfit font-black text-[10px] uppercase tracking-wider border border-black shadow-[1px_1px_0_#000] active:scale-95 transition-transform cursor-pointer"
              >
                {activeAddress ? "Change" : "Add"}
              </button>
            </div>
          </div>

          {/* Feedback messages */}
          {subSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-500 text-emerald-900 text-xs sm:text-sm font-bold flex items-center justify-between gap-3 animate-in fade-in zoom-in-95 shadow-[4px_4px_0_#059669]">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={20} className="text-emerald-700 shrink-0" />
                <span>{subSuccessMsg}</span>
              </div>
              <button onClick={() => setSubSuccessMsg(null)} className="text-emerald-700 hover:text-black">
                <X size={16} />
              </button>
            </div>
          )}

          {subErrorMsg && (
            <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-500 text-red-900 text-xs sm:text-sm font-bold flex items-center justify-between gap-3 animate-in fade-in zoom-in-95 shadow-[4px_4px_0_#dc2626]">
              <div className="flex items-center gap-2">
                <AlertCircle size={20} className="text-red-700 shrink-0" />
                <span>{subErrorMsg}</span>
              </div>
              <button onClick={() => setSubErrorMsg(null)} className="text-red-700 hover:text-black">
                <X size={16} />
              </button>
            </div>
          )}

          {/* Active Subscription Overview Card (If User Has Active Plan) */}
          {activeSubRecord && (
            <div className="rounded-3xl border-3 border-black bg-gradient-to-br from-[#1B4D3E] via-[#245e4c] to-[#0f3227] text-white p-6 sm:p-8 shadow-[6px_6px_0_#000] space-y-6 transition-transform hover:scale-[1.005]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/20 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-[#E5A00D] text-black font-black flex items-center justify-center border-2 border-black shadow-[2px_2px_0_#000] shrink-0">
                    <Sparkles size={22} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 block">
                      Active Member Pass
                    </span>
                    <h3 className="font-outfit text-xl sm:text-2xl font-black uppercase text-white">
                      {activeSubRecord.packageName || "Full Veg Meal Subscription"}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border-2 ${
                      activeSubRecord.status === "ACTIVE"
                        ? "bg-emerald-400 text-black border-black shadow-[2px_2px_0_#000]"
                        : "bg-amber-400 text-black border-black shadow-[2px_2px_0_#000]"
                    }`}
                  >
                    {activeSubRecord.status === "ACTIVE" ? "Active" : "Paused"}
                  </span>

                  <button
                    disabled={subSubmitting}
                    onClick={() => handleToggleSubPause(activeSubRecord.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-black hover:bg-[#E5A00D] border-2 border-black font-outfit font-black text-xs uppercase tracking-wider shadow-[2px_2px_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                  >
                    {activeSubRecord.status === "ACTIVE" ? (
                      <>
                        <Pause size={13} />
                        <span>Pause Plan</span>
                      </>
                    ) : (
                      <>
                        <Play size={13} />
                        <span>Resume Plan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Progress & Stats Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-black/30 backdrop-blur-md rounded-2xl p-4 border border-white/10 transition-colors hover:bg-black/40">
                  <span className="text-[10px] font-black uppercase text-amber-300 block">Meals Remaining</span>
                  <span className="font-outfit text-3xl font-black text-white block mt-1">
                    {activeSubRecord.mealsRemaining}
                    <span className="text-xs text-zinc-300 font-bold ml-1">/ {activeSubRecord.totalMeals || activeSubRecord.mealCreditsPurchased}</span>
                  </span>
                </div>

                <div className="bg-black/30 backdrop-blur-md rounded-2xl p-4 border border-white/10 transition-colors hover:bg-black/40">
                  <span className="text-[10px] font-black uppercase text-amber-300 block">Next Scheduled Delivery</span>
                  <span className="font-outfit text-xl font-black text-white block mt-2">
                    {activeSubRecord.nextDeliveryDate || "Tomorrow"}
                  </span>
                  <span className="text-[10px] text-zinc-300 block font-semibold">Hot &amp; Fresh Handi</span>
                </div>

                <div className="col-span-2 sm:col-span-1 bg-black/30 backdrop-blur-md rounded-2xl p-4 border border-white/10 transition-colors hover:bg-black/40">
                  <span className="text-[10px] font-black uppercase text-amber-300 block">Plan Valid Until</span>
                  <span className="font-outfit text-xl font-black text-white block mt-2">
                    {activeSubRecord.expectedEndDate || activeSubRecord.endDate || "Ongoing"}
                  </span>
                  <span className="text-[10px] text-emerald-300 block font-bold">Auto-extends on pause</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Active Subscription Plans (Directly Synced with Admin Toggle) ── */}
          <div className="space-y-6">
            <div className="border-b-2 border-black/10 pb-4">
              <span className="text-xs font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <UtensilsCrossed size={14} className="text-black" />
                <span>Choose Your Plan</span>
              </span>
              <h2 className="font-outfit text-2xl sm:text-3xl font-black uppercase text-black mt-1">
                {subVegMeal?.name || "Full Veg Meal Subscriptions"}
              </h2>
              <p className="text-xs text-zinc-600 font-semibold mt-0.5">
                {subVegMeal?.description || "Steamed Rice, Fresh Pappu, and Veg Curry served hot in insulated clay handi."}
              </p>
            </div>

            {/* If no plans are active */}
            {dbSubPackages.length === 0 ? (
              <div className="rounded-3xl border-3 border-black bg-[#FFF8EE] p-8 text-center space-y-3 shadow-[5px_5px_0_#000]">
                <UtensilsCrossed size={36} className="mx-auto text-[#E5A00D]" />
                <h3 className="font-outfit text-xl font-black uppercase text-black">
                  Subscription Plans Temporarily Unavailable
                </h3>
                <p className="text-xs text-zinc-600 font-semibold max-w-md mx-auto">
                  Our kitchen is currently updating seasonal subscription meal packages. Please check back shortly or enjoy ordering single bowls directly from our menu!
                </p>
              </div>
            ) : (
              /* The Dynamic Cards Grid: directly driven by Admin active plans */
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {dbSubPackages.map((pkg) => {
                  const mealRate = subVegMeal?.pricePerMeal || 55;
                  const originalSinglePrice = subVegMeal?.standardPrice || 60;
                  const regularTotal = originalSinglePrice * pkg.mealCredits;
                  const discountSavings = pkg.discount > 0 ? pkg.discount : Math.max(0, regularTotal - (mealRate * pkg.mealCredits));
                  const finalTotal = Math.max(0, (mealRate * pkg.mealCredits) - (pkg.discount || 0));
                  const isSelected = selectedSubPlan === pkg.id;

                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedSubPlan(pkg.id)}
                      className={`group relative rounded-3xl border-3 p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 cursor-pointer hover:-translate-y-1.5 ${
                        isSelected
                          ? "bg-[#FFF8EE] border-black shadow-[7px_7px_0_#000] ring-2 ring-black"
                          : "bg-white border-black/30 hover:border-black shadow-[3px_3px_0_#000] hover:shadow-[6px_6px_0_#000]"
                      }`}
                    >
                      {pkg.isFeatured && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#E5A00D] text-black px-4 py-0.5 rounded-full border-2 border-black font-outfit font-black text-[10px] uppercase tracking-wider shadow-[2px_2px_0_#000] flex items-center gap-1">
                          <Sparkles size={11} className="text-black animate-spin" />
                          <span>Most Popular</span>
                        </div>
                      )}

                      <div className="space-y-4">
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 px-3 py-1 rounded-full border border-amber-300">
                            {pkg.mealCredits >= 60 ? "Best Value" : pkg.mealCredits >= 30 ? "Full Month" : "Weekday Care"}
                          </span>
                          {discountSavings > 0 && (
                            <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-300">
                              Save ₹{discountSavings}
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="font-outfit text-2xl sm:text-3xl font-black uppercase tracking-tight text-black group-hover:text-amber-900 transition-colors">
                            {pkg.name}
                          </h3>
                          <p className="text-xs text-zinc-600 font-medium mt-1">
                            {pkg.mealCredits >= 60
                              ? "2 meals daily (Lunch + Dinner) for 30 days."
                              : pkg.mealCredits >= 30
                              ? "1 wholesome meal every single day of the month."
                              : "Ideal for regular lunches or weekday dining."}
                          </p>
                        </div>

                        {/* Clean Price Display */}
                        <div className="p-4 rounded-2xl bg-white border-2 border-black shadow-[2px_2px_0_#000] flex items-baseline justify-between">
                          <div>
                            <span className="text-[10px] font-black uppercase text-zinc-400 block">Total Price</span>
                            <span className="font-outfit text-3xl font-black text-black">₹{finalTotal.toLocaleString()}</span>
                          </div>
                          {regularTotal > finalTotal && (
                            <span className="text-xs line-through text-zinc-400 font-bold">
                              ₹{regularTotal.toLocaleString()}
                            </span>
                          )}
                        </div>

                        {/* Highlights */}
                        <ul className="space-y-2 text-xs font-semibold text-zinc-700 pt-1">
                          <li className="flex items-center gap-2">
                            <Check size={14} className="text-emerald-600 shrink-0" />
                            <span>{pkg.mealCredits} Complete Fresh Homestyle Meals</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check size={14} className="text-emerald-600 shrink-0" />
                            <span>Fresh hot handi delivery to your door</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check size={14} className="text-emerald-600 shrink-0" />
                            <span>Pause or skip days anytime on dashboard</span>
                          </li>
                        </ul>
                      </div>

                      <div className="pt-6">
                        <button
                          disabled={subSubmitting}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSubscribePlan(pkg.mealCredits, pkg.name, pkg.id);
                          }}
                          className={`w-full py-3.5 rounded-2xl font-outfit font-black text-xs uppercase tracking-wider border-2 border-black transition-all flex items-center justify-center gap-2 cursor-pointer active:translate-x-0.5 active:translate-y-0.5 ${
                            isSelected
                              ? "bg-black text-[#E5A00D] shadow-[3px_3px_0_#E5A00D] hover:bg-zinc-900"
                              : "bg-white text-black shadow-[2px_2px_0_#000] hover:bg-[#FFF8EE]"
                          }`}
                        >
                          {subSubmitting && selectedSubPlan === pkg.id ? (
                            <Loader2 size={16} className="animate-spin text-[#E5A00D]" />
                          ) : (
                            <>
                              <span>Subscribe {pkg.mealCredits} Meals (₹{finalTotal.toLocaleString()})</span>
                              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Meal Details & Dish Transparency Section (Premium Culinary Showcase) ── */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FFFBF2] via-[#FFF8EE] to-[#FFF3E0] border border-amber-200/80 p-6 sm:p-10">
            {/* Subtle background glow */}
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left 7 cols: Story & Dish details */}
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/80 text-amber-900 border border-amber-300/60 text-[11px] font-black uppercase tracking-wider">
                  <Sparkles size={13} className="text-[#E5A00D]" />
                  <span>What’s Inside Every Subscription Bowl</span>
                </div>

                <div className="space-y-2">
                  <h3 className="font-outfit font-black text-2xl sm:text-3xl text-zinc-900 tracking-tight leading-tight">
                    Rice, Pappu &amp; Fresh Seasonal Veg Curry
                  </h3>
                  <p className="text-sm text-zinc-600 font-medium leading-relaxed">
                    Every meal is prepared fresh in clay handis using farm-sourced produce, authentic South Indian lentils (pappu), and aromatic steamed rice. Cooked with zero artificial preservatives and served piping hot.
                  </p>
                </div>

                {/* 3 Food Elements */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                  <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/90 border border-amber-200/70 shadow-sm backdrop-blur-sm">
                    <span className="text-2xl p-1 bg-amber-50 rounded-xl">🍚</span>
                    <div>
                      <span className="text-xs font-black text-zinc-900 block leading-tight">Steamed Rice</span>
                      <span className="text-[10px] text-zinc-500 font-medium">Aromatic &amp; Fluffy</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/90 border border-amber-200/70 shadow-sm backdrop-blur-sm">
                    <span className="text-2xl p-1 bg-amber-50 rounded-xl">🥣</span>
                    <div>
                      <span className="text-xs font-black text-zinc-900 block leading-tight">Homestyle Dal</span>
                      <span className="text-[10px] text-zinc-500 font-medium">Authentic Pappu</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/90 border border-amber-200/70 shadow-sm backdrop-blur-sm">
                    <span className="text-2xl p-1 bg-amber-50 rounded-xl">🥬</span>
                    <div>
                      <span className="text-xs font-black text-zinc-900 block leading-tight">Seasonal Sabzi</span>
                      <span className="text-[10px] text-zinc-500 font-medium">Daily Rotating</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right 5 cols: Subscriber Advantage Perks */}
              <div className="lg:col-span-5 bg-white/95 rounded-2xl p-5 sm:p-6 border border-amber-200/80 shadow-md space-y-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-100">
                  <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-black">
                    <Check size={18} className="stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="font-outfit font-black text-base text-zinc-900">Subscriber Advantage</h4>
                    <p className="text-[11px] text-zinc-500 font-medium">Included with every plan</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold mt-0.5 shrink-0">✓</span>
                    <div>
                      <span className="text-xs font-black text-zinc-900 block">Special Discounted Rates Locked</span>
                      <span className="text-[11px] text-zinc-500 font-medium">Save on every single meal compared to daily ordering</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold mt-0.5 shrink-0">✓</span>
                    <div>
                      <span className="text-xs font-black text-zinc-900 block">Guaranteed Priority Dispatch</span>
                      <span className="text-[11px] text-zinc-500 font-medium">Your hot meal is prioritized for everyday on-time delivery</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Scheduled Deliveries Table (If active subscription exists) ── */}
          {activeSubRecord && subDeliveries.length > 0 && (
            <div className="rounded-3xl border-3 border-black bg-white p-6 sm:p-8 shadow-[5px_5px_0_#000] space-y-4 transition-all hover:shadow-[7px_7px_0_#000]">
              <div className="flex items-center justify-between border-b-2 border-black/10 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-[#E5A00D]" />
                  <h3 className="font-outfit font-black text-base uppercase text-black">
                    Upcoming Scheduled Deliveries
                  </h3>
                </div>
                <span className="text-xs font-bold text-zinc-500">
                  Showing next {Math.min(subDeliveries.length, 10)} scheduled drops
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-black/10 text-[10px] font-black uppercase text-zinc-400">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Session</th>
                      <th className="py-2.5 px-3">Meal Item</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-medium text-zinc-800">
                    {subDeliveries.slice(0, 10).map((d) => (
                      <tr key={d.id} className="hover:bg-[#FFF8EE] transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-black">{d.deliveryDate}</td>
                        <td className="py-3 px-3 uppercase text-[11px] font-bold text-zinc-600">{d.mealType}</td>
                        <td className="py-3 px-3 font-bold text-black">{d.mealName || "Full Veg Meal"}</td>
                        <td className="py-3 px-3 text-right">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              d.status === "DELIVERED"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : d.status === "SCHEDULED"
                                ? "bg-amber-100 text-amber-900 border border-amber-300"
                                : "bg-zinc-100 text-zinc-600"
                            }`}
                          >
                            {d.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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
          {/* ── 0.5 Pending Order Feedback Card (Auto-appears for unreviewed delivered orders) ── */}
          {pendingHomeFeedback && (
            <div className="rounded-3xl border-3 border-black bg-[#FFF8EE] shadow-[6px_6px_0_#000] p-6 sm:p-8 relative overflow-hidden transition-all hover:shadow-[8px_8px_0_#000] space-y-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#E5A00D] border-2 border-black flex items-center justify-center text-black font-black shadow-[3px_3px_0_#000]">
                    <Star className="w-6 h-6 fill-black text-black" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-black text-[#E5A00D] px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-black shadow-[2px_2px_0_#000]">
                        Post-Delivery Review
                      </span>
                      <span className="text-[11px] font-mono font-bold text-zinc-500">
                        {pendingHomeFeedback.deliveryDate}
                      </span>
                    </div>
                    <h4 className="font-outfit text-xl sm:text-2xl font-black uppercase text-black mt-0.5">
                      How was your recent meal?
                    </h4>
                    <p className="text-xs font-semibold text-zinc-600">
                      {pendingHomeFeedback.foodItemName} ({formatOrderId(pendingHomeFeedback.orderId)})
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setPendingHomeFeedback(null)}
                  className="text-xs font-bold text-zinc-400 hover:text-black self-start sm:self-center"
                >
                  Dismiss ✕
                </button>
              </div>

              <form onSubmit={(e) => handleSubmitFeedback(e, pendingHomeFeedback.orderId)} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-2xl border-2 border-black shadow-[3px_3px_0_#000]">
                  {/* Overall Rating */}
                  <div className="space-y-1 text-center sm:text-left">
                    <span className="text-[11px] font-black uppercase tracking-wider text-black block">Overall Experience</span>
                    <div className="flex items-center justify-center sm:justify-start gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackOverallRating(star)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`w-6 h-6 ${star <= feedbackOverallRating ? "fill-amber-400 text-amber-500" : "text-zinc-300"}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Food Quality Rating */}
                  <div className="space-y-1 text-center sm:text-left">
                    <span className="text-[11px] font-black uppercase tracking-wider text-black block">Food Quality</span>
                    <div className="flex items-center justify-center sm:justify-start gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackFoodRating(star)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`w-6 h-6 ${star <= feedbackFoodRating ? "fill-amber-400 text-amber-500" : "text-zinc-300"}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Experience Rating */}
                  <div className="space-y-1 text-center sm:text-left">
                    <span className="text-[11px] font-black uppercase tracking-wider text-black block">Delivery Experience</span>
                    <div className="flex items-center justify-center sm:justify-start gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackDeliveryRating(star)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`w-6 h-6 ${star <= feedbackDeliveryRating ? "fill-amber-400 text-amber-500" : "text-zinc-300"}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Review Comment Textarea */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                    Written Review <span className="text-zinc-400 font-semibold">(Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="Tell us about the taste, packaging, heat retention, or delivery speed..."
                    className="w-full rounded-2xl border-2 border-black p-3 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-[#E5A00D]"
                  />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setComplaintOrderId(pendingHomeFeedback.orderId);
                      setComplaintModalOpen(true);
                    }}
                    className="text-xs font-extrabold text-red-700 hover:text-black underline flex items-center gap-1"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    Report an Issue / Complaint
                  </button>

                  <button
                    disabled={submittingFeedback}
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-black text-[#FFF8EE] hover:bg-[#E5A00D] hover:text-black font-outfit font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0_#000] hover:shadow-none transition-all flex items-center gap-2"
                  >
                    {submittingFeedback ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <span>Submit Review ✓</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
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

                  {isKitchenClosedOrUnavailable ? (
                    <button
                      onClick={() => setShowKitchenModal(true)}
                      className="inline-flex items-center gap-1.5 px-2.5 sm:px-5 lg:px-6 py-1.5 sm:py-2.5 lg:py-3.5 rounded-lg sm:rounded-2xl bg-zinc-900 hover:bg-black text-zinc-200 font-outfit font-black text-[10px] sm:text-xs lg:text-sm uppercase tracking-wider border-2 border-zinc-700 shadow-[2px_2px_0_#FFF8EE] sm:shadow-[4px_4px_0_#FFF8EE] transition-all shrink-0 cursor-pointer"
                      title="Kitchen is currently closed or unavailable"
                    >
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                      <span>Kitchen Closed</span>
                    </button>
                  ) : (
                    <a
                      href="#menu-section"
                      className="inline-flex items-center gap-1 px-2.5 sm:px-5 lg:px-6 py-1.5 sm:py-2.5 lg:py-3.5 rounded-lg sm:rounded-2xl bg-[#E5A00D] text-black font-outfit font-black text-[10px] sm:text-xs lg:text-sm uppercase tracking-wider hover:bg-[#ffb515] border-2 border-black shadow-[2px_2px_0_#FFF8EE] sm:shadow-[4px_4px_0_#FFF8EE] hover:translate-x-0.5 hover:translate-y-0.5 transition-all shrink-0"
                    >
                      <span>Order</span>
                      <ArrowRight size={12} className="text-black sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
                    </a>
                  )}
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
                            className={`object-cover transition-transform duration-1000 group-hover:scale-110 ${isKitchenClosedOrUnavailable ? "filter blur-[2px] grayscale-[20%]" : ""
                              }`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Express Badge below circular image */}
                {isKitchenClosedOrUnavailable ? (
                  <div
                    onClick={() => setShowKitchenModal(true)}
                    className="mt-1 sm:mt-4 inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-0.5 sm:py-1.5 rounded-full bg-red-950/85 backdrop-blur-md border border-red-500/50 text-[8px] sm:text-xs font-bold text-red-200 shadow-lg animate-in fade-in duration-500 cursor-pointer hover:bg-red-900"
                  >
                    <span className="h-1.5 sm:h-2 w-1.5 sm:w-2 rounded-full bg-red-500 animate-ping" />
                    <span className="truncate max-w-[90px] sm:max-w-none">Kitchen Unavailable</span>
                  </div>
                ) : (
                  <div className="mt-1 sm:mt-4 inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-0.5 sm:py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-[8px] sm:text-xs font-bold text-[#FFF8EE] shadow-lg animate-in fade-in duration-500" key={`badge-${currentSlide}`}>
                    <span className="h-1 sm:h-2 w-1 sm:w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="truncate max-w-[90px] sm:max-w-none">{activeSlideData.dishBadge}</span>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* ── 2. Delivery & Subscription Status Bar (Mobile Clean Address Only) ── */}
          <div className="rounded-2xl sm:rounded-3xl border-2 sm:border-3 border-black bg-white p-3 sm:p-5 shadow-[2px_2px_0_#000] sm:shadow-[4px_4px_0_#000] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">

            {/* Left: Location & Delivery Details */}
            <div className="flex items-start sm:items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
              <div className="h-8 w-8 sm:h-11 sm:w-11 rounded-xl sm:rounded-2xl bg-[#FFF8EE] border border-black sm:border-2 text-[#E5A00D] flex items-center justify-center shrink-0 shadow-[1.5px_1.5px_0_#000] sm:shadow-[2px_2px_0_#000] mt-0.5 sm:mt-0">
                <MapPin size={16} className="text-black sm:w-[22px] sm:h-[22px]" />
              </div>

              <div className="leading-tight min-w-0 flex-1">
                {/* Top Row: Label, Prep Time, Change Button */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-black uppercase text-black">
                  <span>
                    {activeAddress
                      ? `DELIVERING TO ${activeAddress.label || "HOME"}`
                      : "NO DELIVERY ADDRESS"}
                  </span>
                  <span className="text-zinc-300">•</span>
                  <span className="text-amber-700 flex items-center gap-1 font-bold whitespace-nowrap">
                    <Clock size={11} /> {kitchenStatus.estimatedPrepTime || "25–30m"}
                  </span>
                  <span className="text-zinc-300">•</span>
                  <button
                    onClick={() => {
                      setAddressToEdit(null);
                      setAddressModalMode(activeAddress ? "LIST" : "FORM");
                      setAddressModalOpen(true);
                    }}
                    className="text-black underline font-bold hover:text-[#E5A00D] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {activeAddress ? "Change" : "Add Address"}
                  </button>

                  {/* Live Kitchen Operational Status Pill (Hidden on mobile, visible on sm+) */}
                  <button
                    onClick={() => setShowKitchenModal(true)}
                    className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border cursor-pointer transition-all hover:scale-105 shadow-sm ml-1 ${kitchenStatus.kitchenStatus === "OPEN" && !kitchenStatus.isOrderingPaused
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                        : kitchenStatus.kitchenStatus === "TEMPORARILY_UNAVAILABLE" || kitchenStatus.isOrderingPaused
                          ? "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
                          : "bg-rose-50 text-rose-900 border-rose-300 hover:bg-rose-100"
                      }`}
                  >
                    <span className="relative flex h-1.5 w-1.5">
                      <span
                        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${kitchenStatus.kitchenStatus === "OPEN" && !kitchenStatus.isOrderingPaused
                            ? "bg-emerald-400"
                            : kitchenStatus.kitchenStatus === "TEMPORARILY_UNAVAILABLE" || kitchenStatus.isOrderingPaused
                              ? "bg-amber-400"
                              : "bg-rose-400"
                          }`}
                      />
                      <span
                        className={`relative inline-flex rounded-full h-1.5 w-1.5 ${kitchenStatus.kitchenStatus === "OPEN" && !kitchenStatus.isOrderingPaused
                            ? "bg-emerald-500"
                            : kitchenStatus.kitchenStatus === "TEMPORARILY_UNAVAILABLE" || kitchenStatus.isOrderingPaused
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          }`}
                      />
                    </span>
                    <span>
                      {kitchenStatus.kitchenStatus === "OPEN" && !kitchenStatus.isOrderingPaused
                        ? "Kitchen Live"
                        : kitchenStatus.kitchenStatus === "TEMPORARILY_UNAVAILABLE" || kitchenStatus.isOrderingPaused
                          ? "Kitchen Busy"
                          : "Kitchen Closed"}
                    </span>
                    <ChefHat size={10} className="opacity-70 ml-0.5" />
                  </button>
                </div>

                {/* Bottom Row: Full readable Address line */}
                {activeAddress ? (
                  <p className="text-[11px] sm:text-xs text-zinc-600 font-semibold mt-1 break-words">
                    {activeAddress.address}, {activeAddress.area}, {activeAddress.city} - {activeAddress.pincode}
                  </p>
                ) : (
                  <p className="text-[11px] sm:text-xs text-amber-800 font-semibold mt-1">
                    Please add a delivery address to ensure speedy doorstep delivery.
                  </p>
                )}
              </div>
            </div>

            {/* Right: Subscription Status Badge + View Cart Button (Desktop/Tablet only, hidden on mobile) */}
            <div className="hidden md:flex items-center gap-4 justify-end">
              {activeSubRecord ? (
                <button
                  onClick={() => {
                    window.location.hash = "subscriptions";
                    setActiveTab("subscriptions");
                  }}
                  className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-500/80 text-emerald-900 transition-all text-left shadow-sm group"
                >
                  <div className="h-7 w-7 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <Sparkles size={13} />
                  </div>
                  <div className="leading-tight">
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-black uppercase text-black tracking-tight">Active</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                    </div>
                    <p className="text-[10px] font-bold text-emerald-800">
                      {activeSubRecord.mealsRemaining ?? activeSubRecord.totalMeals ?? 0} left
                    </p>
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => {
                    window.location.hash = "subscriptions";
                    setActiveTab("subscriptions");
                  }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FFF8EE] hover:bg-amber-100 border border-amber-300/80 text-amber-900 transition-all text-left group"
                >
                  <CalendarCheck size={14} className="text-amber-700 group-hover:scale-110 transition-transform shrink-0" />
                  <div className="leading-tight">
                    <span className="text-[10px] font-black uppercase text-amber-950 block">Meal Subs</span>
                    <span className="text-[9px] font-semibold text-zinc-600">Pure Veg @ ₹55</span>
                  </div>
                </button>
              )}

              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("qbowl-open-cart"));
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FFF8EE] hover:bg-black text-black hover:text-[#FFF8EE] border-2 border-black font-outfit font-black text-xs uppercase tracking-wider shadow-[2px_2px_0_#000] transition-all"
              >
                <ShoppingBag size={14} className="text-[#E5A00D]" />
                <span>Cart ({totalCartCount})</span>
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
              <span className="text-xs font-bold text-zinc-500">
                {filteredItems.length} {filteredItems.length === 1 ? "dish" : "dishes"} available
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
            </div>

            {/* Kitchen Offline / Unavailable Banner Notice above Food Grid */}
            {isKitchenClosedOrUnavailable && (
              <div className="rounded-2xl border-2 border-black bg-[#FFF8EE] p-3.5 sm:p-4 shadow-[4px_4px_0_#000] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-black animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#E5A00D] border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0_#000]">
                    <ChefHat size={20} className="text-black" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-outfit font-black text-sm uppercase tracking-wide text-black">
                        Kitchen Currently {kitchenStatus.kitchenStatus === "TEMPORARILY_UNAVAILABLE" || kitchenStatus.isOrderingPaused ? "Unavailable" : "Closed"}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black text-[#E5A00D] border border-black shadow-sm flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                        Ordering Offline
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 font-medium mt-0.5">
                      Dishes are shown for preview. Daily kitchen timings: <strong>{kitchenStatus.openingTime} – {kitchenStatus.closingTime}</strong>.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowKitchenModal(true)}
                  className="px-4 py-2 rounded-xl bg-black text-[#FFF8EE] hover:bg-[#E5A00D] hover:text-black font-outfit font-black text-xs uppercase tracking-wider border-2 border-black shadow-[2px_2px_0_#000] hover:shadow-none transition-all shrink-0 cursor-pointer flex items-center gap-1.5 self-start sm:self-center"
                >
                  <Clock size={13} className="text-[#E5A00D]" />
                  <span>View Kitchen Hours</span>
                </button>
              </div>
            )}

            {/* Food Items Grid Cards - 1 item per row on mobile for clean focus */}
            {loadingMeals ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="rounded-3xl border-3 border-black bg-white overflow-hidden shadow-[4px_4px_0_#000] sm:shadow-[5px_5px_0_#000] p-3 sm:p-4 space-y-3 sm:space-y-4 animate-pulse"
                  >
                    <div className="h-44 sm:h-48 w-full bg-zinc-200 rounded-2xl" />
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {filteredItems.map((item) => {
                  const qty = quantities[item.id] || 0;

                  return (
                    <div
                      key={item.id}
                      className="group rounded-3xl border-3 border-black bg-white overflow-hidden shadow-[4px_4px_0_#000] sm:shadow-[5px_5px_0_#000] hover:shadow-[6px_6px_0_#000] sm:hover:shadow-[7px_7px_0_#000] hover:-translate-y-0.5 sm:hover:-translate-y-1 transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Top Image Container with Badges */}
                        <div
                          className="relative h-44 sm:h-52 w-full bg-zinc-100 overflow-hidden border-b-2 border-black cursor-pointer"
                          onClick={() => {
                            if (isKitchenClosedOrUnavailable) {
                              setShowKitchenModal(true);
                            }
                          }}
                        >
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className={`object-cover transition-all duration-500 ${isKitchenClosedOrUnavailable
                                ? "filter blur-[2.5px] scale-105 brightness-[0.72] saturate-[0.8]"
                                : "group-hover:scale-105"
                              }`}
                          />

                          {/* Cinematic Dark Vignette when Kitchen is Unavailable */}
                          {isKitchenClosedOrUnavailable && (
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/35 pointer-events-none" />
                          )}

                          {/* Tag badge (e.g. NON-VEG, PURE VEG) */}
                          <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-10 pointer-events-none">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-md ${item.tagType === "PURE VEG"
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
                          <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-10 flex items-center gap-1.5 sm:gap-2">
                            {/* Rating Badge */}
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-black border border-white/20 shadow-sm pointer-events-none">
                              <Star size={10} className="fill-amber-400 text-amber-400 sm:w-[11px] sm:h-[11px]" />
                              <span>{item.rating}</span>
                            </span>

                            {/* Favourite Heart Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(item.id, e);
                              }}
                              className={`p-1.5 rounded-full border-2 border-black transition-all shadow-[1.5px_1.5px_0_#000] sm:shadow-[2px_2px_0_#000] active:scale-90 ${favorites.includes(item.id)
                                  ? "bg-red-50 text-red-600 border-red-950 scale-105"
                                  : "bg-white/95 text-zinc-400 hover:text-red-500 hover:bg-white"
                                }`}
                              aria-label={favorites.includes(item.id) ? "Remove from favourites" : "Add to favourites"}
                              title={favorites.includes(item.id) ? "Favourited" : "Add to Favourites"}
                            >
                              <Heart
                                size={13}
                                className={`transition-colors sm:w-[14px] sm:h-[14px] ${favorites.includes(item.id) ? "fill-red-600 text-red-600" : ""
                                  }`}
                              />
                            </button>
                          </div>

                          {/* Sleek Minimalist Floating Glass Unavailable Pill */}
                          {isKitchenClosedOrUnavailable && (
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-3 text-center pointer-events-none">
                              <span className="px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-black/85 backdrop-blur-md border border-white/25 text-white font-outfit font-black text-xs uppercase tracking-wider shadow-2xl flex items-center gap-1.5 sm:gap-2">
                                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                                <span>Unavailable</span>
                              </span>
                              <span className="text-[9px] sm:text-[10px] font-bold text-amber-200/90 mt-1 drop-shadow tracking-wide">
                                {kitchenStatus.kitchenStatus === "CLOSED_TODAY"
                                  ? "Closed today"
                                  : kitchenStatus.kitchenStatus === "TEMPORARILY_UNAVAILABLE"
                                    ? "Paused"
                                    : kitchenStatus.isOrderingPaused
                                      ? "Kitchen busy"
                                      : `Opens ${kitchenStatus.openingTime || "07:00 AM"}`}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Card Content */}
                        <div className="p-3.5 sm:p-4 space-y-1.5 sm:space-y-2.5">
                          {/* Specs / Nutritional subtext */}
                          <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-zinc-500">
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
                      <div className="p-3.5 sm:p-4 pt-0 border-t border-zinc-100 flex items-center justify-between gap-3 mt-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Price</span>
                          <span className="font-outfit text-lg sm:text-xl font-black text-black">
                            ₹{item.price}
                          </span>
                        </div>

                        {isKitchenClosedOrUnavailable ? (
                          <button
                            onClick={() => setShowKitchenModal(true)}
                            className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-black text-[#FFF8EE] font-outfit font-black text-xs uppercase tracking-wider border-2 border-black shadow-[2px_2px_0_#000] hover:shadow-none transition-all flex items-center gap-1.5 cursor-pointer"
                            title="Kitchen unavailable"
                          >
                            <Clock size={12} className="text-[#E5A00D]" />
                            <span>Unavailable</span>
                          </button>
                        ) : qty > 0 ? (
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
                            <Plus size={13} />
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

          {/* ── 4. Subscription Status & Recent Deliveries Section ── */}
          <div className="pt-6 space-y-8">
            
            {/* Section Title */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b-2 border-black/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-[#E5A00D] border-2 border-black px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-black shadow-[2px_2px_0_#000]">
                    Dashboard Hub
                  </span>
                  <span className="text-[11px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
                    Real-Time Tracking
                  </span>
                </div>
                <h3 className="font-outfit text-2xl sm:text-3xl font-black uppercase tracking-tight text-black mt-1">
                  Subscription Status &amp; Deliveries
                </h3>
                <p className="text-xs text-zinc-600 font-medium mt-0.5">
                  Manage your active meal plan balance, daily dispatches, and recent order history
                </p>
              </div>
            </div>

            {/* 1. Subscription Status Card Container */}
            {loadingDashboardData ? (
              <div className="rounded-3xl border-3 border-black bg-[#FFF8EE] shadow-[6px_6px_0_#000] p-6 sm:p-8 space-y-6 animate-pulse">
                <div className="flex justify-between items-center">
                  <div className="h-6 bg-zinc-200 rounded-lg w-48" />
                  <div className="h-6 bg-zinc-200 rounded-full w-24" />
                </div>
                <div className="h-4 bg-zinc-200 rounded-full w-full" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-16 bg-zinc-200 rounded-2xl" />
                  ))}
                </div>
              </div>
            ) : activeSubscription ? (
              (() => {
                const totalMeals = activeSubscription.totalMeals || 30;
                const mealsRemaining = activeSubscription.mealsRemaining ?? 0;
                const mealsConsumed = activeSubscription.mealsUsed ?? Math.max(0, totalMeals - mealsRemaining);
                const progressPercent = Math.min(100, Math.max(0, Math.round((mealsConsumed / totalMeals) * 100)));

                const isExpiringSoon = mealsRemaining <= 5 || activeSubscription.status === "EXPIRING_SOON";
                const computedStatus = isExpiringSoon ? "EXPIRING SOON" : activeSubscription.status;

                // Days remaining calculation
                const expDateStr = activeSubscription.expectedEndDate || activeSubscription.endDate;
                let daysRemaining: number | null = null;
                if (expDateStr) {
                  const diffMs = new Date(expDateStr).getTime() - new Date().getTime();
                  daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
                }

                const startDateFormatted = activeSubscription.startDate
                  ? new Date(activeSubscription.startDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "N/A";

                const endDateFormatted = expDateStr
                  ? new Date(expDateStr).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "N/A";

                return (
                  <div className="rounded-3xl border-3 border-black bg-[#FFF8EE] shadow-[6px_6px_0_#000] p-6 sm:p-8 space-y-6 relative overflow-hidden transition-all hover:shadow-[8px_8px_0_#000]">
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black/10 pb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#E5A00D] border-2 border-black flex items-center justify-center text-black font-black shadow-[3px_3px_0_#000]">
                          <UtensilsCrossed className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold uppercase text-zinc-500">
                              Active Subscription
                            </span>
                            {daysRemaining !== null && (
                              <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md text-[10px] font-bold">
                                {daysRemaining} {daysRemaining === 1 ? "day" : "days"} left
                              </span>
                            )}
                          </div>
                          <h4 className="font-outfit text-xl sm:text-2xl font-black uppercase text-black">
                            {activeSubscription.planName || activeSubscription.mealName || "Gourmet Meal Pass"}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border-2 border-black shadow-[2px_2px_0_#000] ${
                            isExpiringSoon
                              ? "bg-amber-300 text-black"
                              : "bg-emerald-400 text-black"
                          }`}
                        >
                          <span className="h-2 w-2 rounded-full bg-black animate-ping" />
                          {computedStatus}
                        </span>

                        <Link
                          href="/subscriptions"
                          className="px-4 py-2 rounded-xl bg-black text-[#FFF8EE] hover:bg-[#E5A00D] hover:text-black font-outfit font-black text-xs uppercase tracking-wider border-2 border-black shadow-[2px_2px_0_#000] transition-all flex items-center gap-1.5"
                        >
                          <span>Manage</span>
                          <ChevronRight size={14} />
                        </Link>
                      </div>
                    </div>

                    {/* Progress Bar Section */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                        <span className="text-zinc-600 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-[#E5A00D]" />
                          Meal Consumption Progress
                        </span>
                        <span className="font-outfit font-black text-black">
                          {mealsConsumed} of {totalMeals} Meals Used ({progressPercent}%)
                        </span>
                      </div>
                      <div className="h-4 w-full bg-zinc-200 rounded-full border-2 border-black overflow-hidden p-0.5 shadow-[inner_0_2px_4px_rgba(0,0,0,0.1)]">
                        <div
                          className="h-full bg-[#E5A00D] rounded-full transition-all duration-500 border border-black"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                      <div className="bg-white p-4 rounded-2xl border-2 border-black shadow-[3px_3px_0_#000]">
                        <span className="text-[10px] font-bold uppercase text-zinc-400 block">Meals Remaining</span>
                        <span className="font-outfit text-2xl sm:text-3xl font-black text-emerald-700">
                          {mealsRemaining}
                        </span>
                        <span className="text-[10px] font-semibold text-zinc-500 block mt-0.5">Ready for dispatch</span>
                      </div>

                      <div className="bg-white p-4 rounded-2xl border-2 border-black shadow-[3px_3px_0_#000]">
                        <span className="text-[10px] font-bold uppercase text-zinc-400 block">Meals Consumed</span>
                        <span className="font-outfit text-2xl sm:text-3xl font-black text-black">
                          {mealsConsumed}
                        </span>
                        <span className="text-[10px] font-semibold text-zinc-500 block mt-0.5">Successfully delivered</span>
                      </div>

                      <div className="bg-white p-4 rounded-2xl border-2 border-black shadow-[3px_3px_0_#000]">
                        <span className="text-[10px] font-bold uppercase text-zinc-400 block">Start Date</span>
                        <span className="font-outfit text-sm sm:text-base font-black text-black mt-1 block">
                          {startDateFormatted}
                        </span>
                        <span className="text-[10px] font-semibold text-zinc-500 block">Subscription activated</span>
                      </div>

                      <div className="bg-[#FFF8EE] p-4 rounded-2xl border-2 border-black shadow-[3px_3px_0_#000]">
                        <span className="text-[10px] font-bold uppercase text-zinc-400 block">Expiry Date</span>
                        <span className="font-outfit text-sm sm:text-base font-black text-black mt-1 block">
                          {endDateFormatted}
                        </span>
                        <span className="text-[10px] font-semibold text-zinc-500 block">Plan validity end</span>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              /* 2. No Active Subscription Empty State */
              <div className="rounded-3xl border-3 border-black bg-white shadow-[6px_6px_0_#000] p-8 sm:p-12 text-center space-y-5">
                <div className="w-16 h-16 rounded-3xl bg-[#FFF8EE] border-3 border-black mx-auto flex items-center justify-center text-black shadow-[4px_4px_0_#000]">
                  <Package className="w-8 h-8 stroke-[2.5]" />
                </div>

                <div className="max-w-md mx-auto space-y-2">
                  <h4 className="font-outfit text-xl sm:text-2xl font-black uppercase text-black">
                    You don&apos;t have an active meal subscription
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-600 font-medium leading-relaxed">
                    Unlock flat savings of up to 35% with daily automated dispatches cooked fresh in authentic terracotta handis.
                  </p>
                </div>

                <div className="pt-2">
                  <Link
                    href="/subscriptions"
                    className="px-6 py-3.5 rounded-2xl bg-[#E5A00D] text-black hover:bg-black hover:text-[#E5A00D] font-outfit font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0_#000] hover:shadow-none transition-all inline-flex items-center gap-2"
                  >
                    <span>Browse Meal Plans</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            )}

            {/* 3. Recent Deliveries Section (Immediately below Subscription Status) */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-outfit text-xl sm:text-2xl font-black uppercase tracking-tight text-black">
                    Recent Deliveries
                  </h4>
                  <p className="text-xs text-zinc-600 font-medium">
                    Latest meal dispatches and order fulfillments
                  </p>
                </div>

                <Link
                  href="/orders"
                  className="flex items-center gap-1 font-outfit text-xs font-black uppercase tracking-wider text-amber-700 hover:text-black transition-colors bg-white px-3 py-1.5 rounded-xl border-2 border-black shadow-[2px_2px_0_#000]"
                >
                  <span>View All</span>
                  <ChevronRight size={14} />
                </Link>
              </div>

              {loadingDashboardData ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-zinc-200 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : recentDeliveries.length > 0 ? (
                <div className="space-y-3">
                  {recentDeliveries.map((del) => {
                    const isDelivered = del.status === "DELIVERED" || del.status === "COMPLETED";
                    const isCancelled = del.status === "CANCELLED" || del.status === "SKIPPED";

                    const formattedDate = del.date
                      ? new Date(del.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "Recent";

                    return (
                      <div
                        key={del.id}
                        className="rounded-2xl border-2 border-black bg-white p-4 sm:p-5 shadow-[4px_4px_0_#000] flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:translate-x-[-1px] hover:translate-y-[-1px]"
                      >
                        <div className="flex items-start sm:items-center gap-3.5">
                          <div
                            className={`w-10 h-10 rounded-xl border-2 border-black flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0_#000] ${
                              isDelivered
                                ? "bg-emerald-300 text-black"
                                : isCancelled
                                ? "bg-red-200 text-black"
                                : "bg-[#E5A00D] text-black"
                            }`}
                          >
                            {isDelivered ? (
                              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                            ) : isCancelled ? (
                              <X className="w-5 h-5 stroke-[2.5]" />
                            ) : (
                              <Truck className="w-5 h-5 stroke-[2.5]" />
                            )}
                          </div>

                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-outfit font-black text-sm uppercase text-black line-clamp-1">
                                {del.itemsSummary}
                              </span>
                              <span className="text-[10px] font-mono font-bold bg-zinc-100 border border-black/20 px-2 py-0.5 rounded-md text-zinc-700">
                                Qty: {del.quantity}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-[11px] font-bold text-zinc-500">
                              <span>{formattedDate}</span>
                              <span>•</span>
                              <span className="uppercase text-amber-900 font-extrabold">{del.mealType}</span>
                              <span>•</span>
                              <span className="font-mono text-zinc-600">
                                {del.id ? formatOrderId(del.id) : "#QB-ORDER"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-zinc-100 pt-2 sm:pt-0">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-black ${
                              isDelivered
                                ? "bg-emerald-100 text-emerald-900 border-emerald-950"
                                : isCancelled
                                ? "bg-red-100 text-red-900 border-red-950"
                                : "bg-amber-100 text-amber-950 border-amber-950"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isDelivered ? "bg-emerald-600" : isCancelled ? "bg-red-600" : "bg-amber-600"
                              }`}
                            />
                            {del.status.replace(/_/g, " ")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl border-2 border-dashed border-black/20 bg-white/60">
                  <p className="font-outfit font-black text-sm text-black">No delivery records found yet.</p>
                  <p className="text-xs text-zinc-500 font-semibold mt-0.5">Your meal dispatches and orders will be logged here in real-time.</p>
                </div>
              )}
            </div>

          </div>
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

      {/* ── Feedback Submission Modal ── */}
      {feedbackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#FFF8EE] rounded-3xl border-3 border-black shadow-[8px_8px_0_#000] p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b-2 border-black pb-4">
              <div>
                <span className="bg-black text-[#E5A00D] px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Delivered Order Review
                </span>
                <h3 className="font-outfit text-xl sm:text-2xl font-black uppercase text-black mt-1">
                  Give Order Feedback
                </h3>
                <p className="text-xs font-semibold text-zinc-600">
                  {feedbackFoodName || "Gourmet Dish"} {feedbackOrderId ? `(${formatOrderId(feedbackOrderId)})` : ""}
                </p>
              </div>
              <button
                onClick={() => setFeedbackModalOpen(false)}
                className="p-2 rounded-xl bg-white hover:bg-black hover:text-white border-2 border-black transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitFeedback} className="space-y-5">
              <div className="space-y-4 bg-white p-4 rounded-2xl border-2 border-black shadow-[3px_3px_0_#000]">
                {/* Overall Rating */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-black">Overall Experience</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackOverallRating(star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-5 h-5 ${star <= feedbackOverallRating ? "fill-amber-400 text-amber-500" : "text-zinc-300"}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Food Quality Rating */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-black">Food Quality</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackFoodRating(star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-5 h-5 ${star <= feedbackFoodRating ? "fill-amber-400 text-amber-500" : "text-zinc-300"}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Delivery Experience Rating */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-black">Delivery Experience</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackDeliveryRating(star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-5 h-5 ${star <= feedbackDeliveryRating ? "fill-amber-400 text-amber-500" : "text-zinc-300"}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                  Written Review <span className="text-zinc-400 font-semibold">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Share details about flavor, portion size, packaging, or delivery..."
                  className="w-full rounded-2xl border-2 border-black p-3 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-[#E5A00D]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFeedbackModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-white border-2 border-black font-outfit font-black text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  disabled={submittingFeedback}
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-black text-[#FFF8EE] hover:bg-[#E5A00D] hover:text-black font-outfit font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0_#000] transition-all flex items-center gap-2"
                >
                  {submittingFeedback ? "Submitting..." : "Submit Review ✓"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Complaint / Support Ticket Submission Modal ── */}
      {complaintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#FFF8EE] rounded-3xl border-3 border-black shadow-[8px_8px_0_#000] p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b-2 border-black pb-4">
              <div>
                <span className="bg-red-600 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Support &amp; Issue Resolution
                </span>
                <h3 className="font-outfit text-xl sm:text-2xl font-black uppercase text-black mt-1">
                  Report Order Issue
                </h3>
                {complaintOrderId && (
                  <p className="text-xs font-semibold text-zinc-600">
                    Order ID: {formatOrderId(complaintOrderId)}
                  </p>
                )}
              </div>
              <button
                onClick={() => setComplaintModalOpen(false)}
                className="p-2 rounded-xl bg-white hover:bg-black hover:text-white border-2 border-black transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitComplaint} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                  Complaint Category <span className="text-red-600">*</span>
                </label>
                <select
                  value={complaintCategory}
                  onChange={(e) => setComplaintCategory(e.target.value)}
                  className="w-full rounded-2xl border-2 border-black p-3 text-xs font-black bg-white focus:outline-none focus:ring-2 focus:ring-[#E5A00D]"
                >
                  <option value="Food Quality">Food Quality (Taste, Spoilage, Temperature)</option>
                  <option value="Delivery Issue">Delivery Issue (Delayed, Driver Behavior)</option>
                  <option value="Missing Item">Missing Item / Portion Defect</option>
                  <option value="Packaging">Packaging Damage / Spillage</option>
                  <option value="Other">Other Query / Support Ticket</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                  Subject <span className="text-red-600">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={complaintSubject}
                  onChange={(e) => setComplaintSubject(e.target.value)}
                  placeholder="e.g., Leaking terracotta handi lid / Missing mint chutney"
                  className="w-full rounded-2xl border-2 border-black p-3 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-[#E5A00D]"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                  Detailed Description <span className="text-red-600">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={complaintDescription}
                  onChange={(e) => setComplaintDescription(e.target.value)}
                  placeholder="Please describe the issue in detail so our kitchen quality manager can assist you..."
                  className="w-full rounded-2xl border-2 border-black p-3 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-[#E5A00D]"
                />
              </div>

              {/* Proof Image Upload */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                  Attach Photo Proof <span className="text-zinc-400 font-semibold">(Optional)</span>
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 cursor-pointer rounded-2xl border-2 border-dashed border-black bg-white p-3 text-center transition-all hover:bg-[#FFF8EE]">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                    <div className="flex items-center justify-center gap-2 text-xs font-bold text-black">
                      <Upload size={14} />
                      <span>{complaintImage ? "Change Photo" : "Upload Photo Proof"}</span>
                    </div>
                  </label>
                </div>
                {complaintImage && (
                  <div className="mt-2 relative h-24 w-24 rounded-xl border-2 border-black overflow-hidden shadow-[2px_2px_0_#000]">
                    <img src={complaintImage} alt="Proof" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setComplaintImage("")}
                      className="absolute top-1 right-1 bg-black text-white p-1 rounded-full text-[10px]"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setComplaintModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-white border-2 border-black font-outfit font-black text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  disabled={submittingComplaint}
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-red-600 text-white hover:bg-black font-outfit font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0_#000] transition-all flex items-center gap-2"
                >
                  {submittingComplaint ? "Submitting..." : "Submit Complaint ✓"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── My Support Complaints List Drawer Modal ── */}
      {myComplaintsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[#FFF8EE] rounded-3xl border-3 border-black shadow-[8px_8px_0_#000] p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b-2 border-black pb-4">
              <div>
                <span className="bg-[#E5A00D] border-2 border-black px-2 py-0.5 rounded-lg text-[10px] font-black uppercase text-black">
                  Customer Support Hub
                </span>
                <h3 className="font-outfit text-xl sm:text-2xl font-black uppercase text-black mt-1">
                  My Support Complaints &amp; Tickets
                </h3>
                <p className="text-xs font-semibold text-zinc-600">
                  Track resolution status &amp; read responses from Q-Bowl Admin Care
                </p>
              </div>
              <button
                onClick={() => setMyComplaintsModalOpen(false)}
                className="p-2 rounded-xl bg-white hover:bg-black hover:text-white border-2 border-black transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {loadingComplaints ? (
              <div className="py-12 text-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#E5A00D]" />
                <p className="text-xs font-bold text-zinc-600">Fetching your support tickets...</p>
              </div>
            ) : userComplaintsList.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border-2 border-dashed border-black/20 bg-white">
                <p className="font-outfit font-black text-sm text-black">No support complaints filed.</p>
                <p className="text-xs text-zinc-500 font-semibold mt-0.5">If you ever encounter an issue with your meal or delivery, file a ticket here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {userComplaintsList.map((cmp) => {
                  const isResolved = cmp.status === "RESOLVED";
                  const isInProgress = cmp.status === "IN_PROGRESS";

                  return (
                    <div
                      key={cmp.id}
                      className="rounded-2xl border-2 border-black bg-white p-5 shadow-[4px_4px_0_#000] space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/10 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold bg-amber-100 border border-amber-300 px-2 py-0.5 rounded text-amber-900">
                              {cmp.category}
                            </span>
                            {cmp.orderId && (
                              <span className="text-[10px] font-mono font-bold text-zinc-500">
                                Order: {formatOrderId(cmp.orderId)}
                              </span>
                            )}
                          </div>
                          <h4 className="font-outfit font-black text-base uppercase text-black mt-1">
                            {cmp.subject}
                          </h4>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-black ${
                            isResolved
                              ? "bg-emerald-100 text-emerald-900 border-emerald-950"
                              : isInProgress
                              ? "bg-amber-100 text-amber-950 border-amber-950"
                              : "bg-red-100 text-red-900 border-red-950"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isResolved ? "bg-emerald-600" : isInProgress ? "bg-amber-600" : "bg-red-600"
                            }`}
                          />
                          {cmp.status.replace(/_/g, " ")}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-700 font-semibold leading-relaxed">
                        {cmp.description}
                      </p>

                      {cmp.imageUrl && (
                        <div className="pt-1">
                          <span className="text-[10px] font-bold text-zinc-400 block mb-1">Attached Photo Proof:</span>
                          <img src={cmp.imageUrl} alt="Proof" className="h-20 w-20 object-cover rounded-xl border border-black" />
                        </div>
                      )}

                      {cmp.adminNotes && (
                        <div className="bg-[#FFF8EE] p-3 rounded-xl border border-black/20 text-xs space-y-1">
                          <span className="font-outfit font-black uppercase text-black flex items-center gap-1 text-[11px]">
                            <MessageSquare className="w-3.5 h-3.5 text-[#E5A00D]" />
                            Response from Q-Bowl Support Team:
                          </span>
                          <p className="text-zinc-800 font-medium">{cmp.adminNotes}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── FULL-SCREEN KITCHEN INFORMATION HUB (Slides down from top, covers screen, dashboard aesthetic) ── */}
      {showKitchenModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="The Q Bowl Central Kitchen Hub"
          className="fixed inset-0 z-[100] bg-[#f5e3cd] overflow-y-auto animate-slide-down-top flex flex-col justify-between selection:bg-[#E5A00D] selection:text-black"
        >
          {/* Top Sticky Bar */}
          <header className="sticky top-0 z-50 bg-[#f5e3cd]/95 backdrop-blur-md border-b-3 border-black px-4 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
            {/* Left: Back to Dashboard */}
            <button
              onClick={() => {
                setShowKitchenModal(false);
                setShowKitchenPausedModal(false);
              }}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-2xl bg-white hover:bg-black text-black hover:text-[#FFF8EE] border-2 border-black shadow-[3px_3px_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all font-outfit font-black text-xs uppercase tracking-wider cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </button>

            {/* Middle: Brand & Live Status Indicator */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#E5A00D] border-2 border-black flex items-center justify-center shadow-[2px_2px_0_#000]">
                <ChefHat size={18} className="text-black" />
              </div>
              <div className="text-left hidden xs:block">
                <span className="font-outfit font-black text-xs sm:text-sm uppercase tracking-wider text-black block leading-tight">
                  Central Kitchen Hub
                </span>
                <span className="text-[10px] font-bold text-zinc-600 block">
                  Live Dum Operations &amp; Craft
                </span>
              </div>
              <span
                className={`ml-1 inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border-2 border-black shadow-[2px_2px_0_#000] ${
                  kitchenStatus.kitchenStatus === "OPEN" && !kitchenStatus.isOrderingPaused
                    ? "bg-emerald-300 text-black"
                    : kitchenStatus.kitchenStatus === "TEMPORARILY_UNAVAILABLE" || kitchenStatus.isOrderingPaused
                      ? "bg-[#E5A00D] text-black"
                      : "bg-rose-400 text-black"
                }`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-black" />
                </span>
                <span>
                  {kitchenStatus.kitchenStatus === "OPEN" && !kitchenStatus.isOrderingPaused
                    ? "Kitchen Live & Cooking"
                    : kitchenStatus.kitchenStatus === "TEMPORARILY_UNAVAILABLE" || kitchenStatus.isOrderingPaused
                      ? "Orders Paused Briefly"
                      : "Kitchen Closed Right Now"}
                </span>
              </span>
            </div>

            {/* Right: Close Button */}
            <button
              onClick={() => {
                setShowKitchenModal(false);
                setShowKitchenPausedModal(false);
              }}
              className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-[#E5A00D] hover:bg-[#ffb515] text-black border-2 border-black shadow-[3px_3px_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 flex items-center justify-center transition-all cursor-pointer"
              title="Close Kitchen View (Esc)"
              aria-label="Close Kitchen View"
            >
              <X size={20} className="stroke-[2.5]" />
            </button>
          </header>

          {/* Main Content Area */}
          <main className="max-w-6xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-10 space-y-8 flex-1">

            {/* 1. Hero Operations Card (Dashboard Neo-Brutalist Style) */}
            <section className="relative rounded-3xl border-3 border-black bg-white p-6 sm:p-8 lg:p-10 shadow-[6px_6px_0_#000] overflow-hidden">
              {/* Subtle decorative glow in top corner */}
              <div className="absolute -top-16 -right-16 w-60 h-60 bg-[#E5A00D]/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-6">
                {/* Meta Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black/10 pb-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF8EE] border-2 border-black text-[11px] font-black uppercase tracking-wider text-black shadow-[2px_2px_0_#000]">
                    <Sparkles size={13} className="text-[#E5A00D]" />
                    <span>Slow Dum Craft &bull; Zero Aluminum</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Auto-Synced with Master Kitchen Desk</span>
                  </div>
                </div>

                {/* Hero Headline */}
                <div className="space-y-3">
                  <h1 className="font-outfit font-black text-2xl sm:text-3xl lg:text-4xl uppercase tracking-tight text-black leading-tight">
                    {kitchenStatus.kitchenStatus === "OPEN" && !kitchenStatus.isOrderingPaused
                      ? "Authentic Clay Handis Cooking Fresh on Slow Dum"
                      : kitchenStatus.kitchenStatus === "TEMPORARILY_UNAVAILABLE" || kitchenStatus.isOrderingPaused
                        ? "High Demand Surge — Orders Paused Briefly for Quality"
                        : "Central Kitchen Resting — Closed Until Next Shift"}
                  </h1>
                  <p className="text-sm sm:text-base text-zinc-700 font-medium leading-relaxed max-w-4xl">
                    {kitchenStatus.kitchenStatus === "OPEN" && !kitchenStatus.isOrderingPaused
                      ? "Every single delicacy is individually packed and sealed in an unlacquered earthen clay pot with whole-wheat dough. Cooked slowly over gentle heat to seal in natural aromas, authentic royal spices, and nutrition."
                      : kitchenStatus.kitchenStatus === "TEMPORARILY_UNAVAILABLE" || kitchenStatus.isOrderingPaused
                        ? "Our master chefs are currently managing a heavy rush of simmering handis. On-demand ordering is paused briefly to ensure every bowl leaves the kitchen with zero compromise on Dum-Pukht perfection."
                        : `Our central cloud kitchen operates daily from ${kitchenStatus.openingTime} to ${kitchenStatus.closingTime}. Active scheduled subscribers continue receiving their daily meals right on time!`}
                  </p>
                </div>

                {/* 4 Telemetry Metrics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-2">
                  <div className="rounded-2xl border-2 border-black bg-[#FFF8EE] p-4 shadow-[3px_3px_0_#000] flex flex-col justify-between">
                    <div className="flex items-center justify-between text-zinc-600 mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider">Operating Shift</span>
                      <Clock size={16} className="text-[#E5A00D]" />
                    </div>
                    <div>
                      <span className="font-outfit font-black text-base sm:text-lg text-black block leading-tight">
                        {kitchenStatus.openingTime} &ndash; {kitchenStatus.closingTime}
                      </span>
                      <span className="text-[11px] font-semibold text-zinc-500 mt-0.5 block">Daily Dum Timings</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border-2 border-black bg-[#FFF8EE] p-4 shadow-[3px_3px_0_#000] flex flex-col justify-between">
                    <div className="flex items-center justify-between text-zinc-600 mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider">Est. Prep Time</span>
                      <Flame size={16} className="text-amber-600" />
                    </div>
                    <div>
                      <span className="font-outfit font-black text-base sm:text-lg text-black block leading-tight">
                        {kitchenStatus.estimatedPrepTime || "25 - 35 mins"}
                      </span>
                      <span className="text-[11px] font-semibold text-zinc-500 mt-0.5 block">Clay Pot Dum Simmer</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border-2 border-black bg-[#FFF8EE] p-4 shadow-[3px_3px_0_#000] flex flex-col justify-between">
                    <div className="flex items-center justify-between text-zinc-600 mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider">Service Radius</span>
                      <MapPin size={16} className="text-emerald-600" />
                    </div>
                    <div>
                      <span className="font-outfit font-black text-base sm:text-lg text-black block leading-tight">
                        ~{kitchenStatus.deliveryRadiusKm || 20} KM Radius
                      </span>
                      <span className="text-[11px] font-semibold text-zinc-500 mt-0.5 block">GPS Thermal Bag Delivery</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border-2 border-black bg-[#FFF8EE] p-4 shadow-[3px_3px_0_#000] flex flex-col justify-between">
                    <div className="flex items-center justify-between text-zinc-600 mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider">Kitchen Status</span>
                      <ShieldCheck size={16} className="text-black" />
                    </div>
                    <div>
                      <span className={`font-outfit font-black text-base sm:text-lg block leading-tight ${
                        kitchenStatus.kitchenStatus === "OPEN" && !kitchenStatus.isOrderingPaused
                          ? "text-emerald-700"
                          : kitchenStatus.kitchenStatus === "TEMPORARILY_UNAVAILABLE" || kitchenStatus.isOrderingPaused
                            ? "text-amber-700"
                            : "text-rose-700"
                      }`}>
                        {kitchenStatus.kitchenStatus === "OPEN" && !kitchenStatus.isOrderingPaused
                          ? "Open & Cooking"
                          : kitchenStatus.kitchenStatus === "TEMPORARILY_UNAVAILABLE" || kitchenStatus.isOrderingPaused
                            ? "Paused Temporarily"
                            : "Closed for Today"}
                      </span>
                      <span className="text-[11px] font-semibold text-zinc-500 mt-0.5 block">Live Telemetry</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Official Kitchen Notice Broadcast (if active) */}
            {kitchenStatus.isNoticeBannerActive && kitchenStatus.noticeBannerText && (
              <section className="rounded-3xl border-3 border-black bg-[#FFF8EE] p-5 sm:p-6 shadow-[5px_5px_0_#000] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-[#E5A00D] border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0_#000]">
                    <Megaphone size={22} className="text-black" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-outfit font-black text-xs uppercase tracking-wider text-black">
                        Active Kitchen Broadcast
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black text-[#FFF8EE]">
                        Live Notice
                      </span>
                    </div>
                    <p className="text-sm font-bold text-black mt-1 leading-snug">
                      {kitchenStatus.noticeBannerText}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* 3. Three Core Pillars Grid */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Pillar 1: Clay Handi Dum Standards */}
              <div className="rounded-3xl border-3 border-black bg-[#FFF8EE] p-6 sm:p-7 shadow-[5px_5px_0_#000] flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-[#E5A00D] border-2 border-black flex items-center justify-center shadow-[2px_2px_0_#000]">
                      <Flame size={20} className="text-black" />
                    </div>
                    <div>
                      <h2 className="font-outfit font-black text-base uppercase tracking-wider text-black">
                        Earthen Handi Dum
                      </h2>
                      <span className="text-[11px] font-bold text-zinc-500">Royal Dum-Pukht Craft</span>
                    </div>
                  </div>

                  <ul className="space-y-2.5 text-xs text-zinc-800 font-semibold">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>100% natural, unlacquered clay pots (zero aluminum or teflon)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>Sealed with whole-wheat dough to lock pure spice aromas</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>Zero artificial food coloring, zero MSG, artisanal cold-pressed oils</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>Individually simmered per order &mdash; never bulk re-heated</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-2 border-t-2 border-black/10 text-[11px] font-bold text-amber-800 flex items-center gap-1.5">
                  <Sparkles size={13} />
                  <span>Retains essential earthen minerals</span>
                </div>
              </div>

              {/* Pillar 2: Central Hub & Dispatch Logistics */}
              <div className="rounded-3xl border-3 border-black bg-white p-6 sm:p-7 shadow-[5px_5px_0_#000] flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-[#FFF8EE] border-2 border-black text-[#E5A00D] flex items-center justify-center shadow-[2px_2px_0_#000]">
                      <MapPin size={20} className="text-black" />
                    </div>
                    <div>
                      <h2 className="font-outfit font-black text-base uppercase tracking-wider text-black">
                        Central Hub Dispatch
                      </h2>
                      <span className="text-[11px] font-bold text-zinc-500">Express Thermal Corridor</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border-2 border-black/15 bg-zinc-50 p-3 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">Hub Location</span>
                    <p className="text-xs text-black font-bold leading-snug">
                      {kitchenStatus.kitchenName || "The Q Bowl Cloud Kitchen, Bridge County Canteen Hub, Rajanagaram, Velugubanda, AP 533296"}
                    </p>
                  </div>

                  <ul className="space-y-2.5 text-xs text-zinc-800 font-semibold">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>Dispatched directly in insulated thermal rider bags</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>Tamper-proof seal ensures virgin kitchen-to-door delivery</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>Fast GPS rider routing to keep handis steaming hot</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-2 border-t-2 border-black/10 text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
                  <Check size={14} className="text-emerald-600" />
                  <span>Covering ~{kitchenStatus.deliveryRadiusKm || 20} KM delivery perimeter</span>
                </div>
              </div>

              {/* Pillar 3: Active Subscriber Protection */}
              <div className="rounded-3xl border-3 border-black bg-emerald-50 p-6 sm:p-7 shadow-[5px_5px_0_#000] flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-emerald-400 border-2 border-black flex items-center justify-center shadow-[2px_2px_0_#000]">
                      <ShieldCheck size={22} className="text-black" />
                    </div>
                    <div>
                      <h2 className="font-outfit font-black text-base uppercase tracking-wider text-black">
                        Subscriber Protection
                      </h2>
                      <span className="text-[11px] font-bold text-emerald-800">VIP Guaranteed Allocation</span>
                    </div>
                  </div>

                  <p className="text-xs font-bold text-emerald-950 leading-relaxed bg-white/70 border-2 border-emerald-300 rounded-2xl p-3.5 shadow-sm">
                    {kitchenStatus.subscriberExemptionNote || "Active scheduled daily subscribers continue receiving their daily handi meals seamlessly without any interruption, even during peak rush pauses."}
                  </p>

                  <ul className="space-y-2 text-xs text-emerald-900 font-semibold">
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-emerald-700 shrink-0" />
                      <span>Guaranteed daily chef prep slot reserved</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-emerald-700 shrink-0" />
                      <span>Priority rider dispatch for lunch &amp; dinner</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-emerald-700 shrink-0" />
                      <span>Never affected by temporary order pauses</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => {
                    setShowKitchenModal(false);
                    setShowKitchenPausedModal(false);
                    setActiveTab("subscriptions");
                  }}
                  className="w-full py-2.5 rounded-2xl bg-black hover:bg-zinc-800 text-[#FFF8EE] font-outfit font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CalendarCheck size={14} className="text-[#E5A00D]" />
                  <span>View My Subscriptions</span>
                </button>
              </div>

            </section>

            {/* 4. Daily Shift Timings & Chef Quality Desk */}
            <section className="rounded-3xl border-3 border-black bg-white p-6 sm:p-8 shadow-[5px_5px_0_#000] grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF8EE] border-2 border-black text-[10px] font-black uppercase text-black">
                  <Clock size={12} className="text-[#E5A00D]" />
                  <span>Daily Handi Shifts</span>
                </div>
                <h3 className="font-outfit font-black text-xl sm:text-2xl uppercase tracking-tight text-black">
                  Two Daily Dum Sessions
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 font-medium leading-relaxed">
                  Our handi stoves are prepared fresh twice every single day. We seal fresh batches of earthenware pots to match peak dining hours with maximum crispness and aroma.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="rounded-2xl border-2 border-black bg-[#FFF8EE] p-3.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">Lunch Dum Shift</span>
                    <span className="font-outfit font-black text-sm text-black block mt-1">11:30 AM &ndash; 03:30 PM</span>
                    <span className="text-[10px] font-bold text-zinc-500 block mt-0.5">Fresh Midday Dum</span>
                  </div>
                  <div className="rounded-2xl border-2 border-black bg-[#FFF8EE] p-3.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">Dinner Dum Shift</span>
                    <span className="font-outfit font-black text-sm text-black block mt-1">06:30 PM &ndash; 10:30 PM</span>
                    <span className="text-[10px] font-bold text-zinc-500 block mt-0.5">Evening Slow Ember Dum</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border-2 border-black bg-[#FFF8EE] p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-black text-[#FFF8EE] flex items-center justify-center border-2 border-black">
                    <ShieldCheck size={18} className="text-[#E5A00D]" />
                  </div>
                  <div>
                    <h4 className="font-outfit font-black text-sm uppercase tracking-wider text-black">
                      Chef's Quality Guarantee
                    </h4>
                    <span className="text-[10px] font-bold text-zinc-600">FSSAI Certified Cloud Kitchen</span>
                  </div>
                </div>

                <p className="text-xs text-zinc-700 font-medium leading-relaxed">
                  Every clay pot is individually inspected, sanitized, and sealed. No recycled earthenware, no chemical glazing. If you ever have specific dietary requirements or bulk handi queries, our master chef desk is always at your service.
                </p>

                <div className="flex items-center justify-between pt-2 border-t-2 border-black/10 text-xs font-bold text-black">
                  <span className="flex items-center gap-1.5">
                    <Phone size={14} className="text-[#E5A00D]" />
                    <span>Kitchen Desk: +91 99887 76655</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-200 text-emerald-950 font-black text-[10px] uppercase">
                    100% Certified
                  </span>
                </div>
              </div>
            </section>

            {/* 5. Bottom Neo-brutalist Action Bar */}
            <section className="rounded-3xl border-3 border-black bg-black text-[#FFF8EE] p-6 sm:p-8 shadow-[6px_6px_0_#000] flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center md:text-left">
                <h3 className="font-outfit font-black text-lg sm:text-xl uppercase tracking-tight text-[#FFF8EE]">
                  Craving Earthen Clay Handi Flavors?
                </h3>
                <p className="text-xs sm:text-sm text-zinc-300 font-medium">
                  Experience healthy royal Indian slow-cooking with zero toxic metals and natural clay richness.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <a
                  href="#menu-section"
                  onClick={() => {
                    setShowKitchenModal(false);
                    setShowKitchenPausedModal(false);
                  }}
                  className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#E5A00D] hover:bg-[#ffb515] text-black font-outfit font-black text-xs uppercase tracking-wider border-2 border-[#FFF8EE] shadow-[3px_3px_0_#FFF8EE] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer"
                >
                  <UtensilsCrossed size={16} />
                  <span>Explore Handi Dishes</span>
                </a>

                <button
                  onClick={() => {
                    setShowKitchenModal(false);
                    setShowKitchenPausedModal(false);
                  }}
                  className="flex-1 md:flex-initial px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-[#FFF8EE] font-outfit font-black text-xs uppercase tracking-wider border border-white/30 cursor-pointer transition-all text-center"
                >
                  Close
                </button>
              </div>
            </section>

          </main>
        </div>
      )}

    </div>
  );
}

export default CustomerDashboardView;
