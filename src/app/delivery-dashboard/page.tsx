"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bike,
  LogOut,
  User,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Sparkles,
  Loader2,
  Package,
  Check,
  Flame,
  UtensilsCrossed,
  Compass,
  ArrowRight,
  Bell,
  Search,
  Navigation,
  ChevronRight,
  RefreshCw,
  Sun,
  Shield,
  Award,
  Receipt,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  History,
  Lock,
  Key,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import dynamic from "next/dynamic";

const DeliveryMapModal = dynamic(() => import("@/components/delivery/DeliveryMapModal"), {
  ssr: false,
});

const InteractiveMapPinPickerModal = dynamic(
  () => import("@/components/common/InteractiveMapPinPickerModal"),
  { ssr: false }
);

interface DeliveryUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
}

interface DeliveryItemRecord {
  id: string;
  orderId?: string;
  orderIdDisplay: string;
  deliveryType: "NORMAL" | "SUBSCRIPTION";
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  mealName: string;
  mealType: string;
  items: Array<{ name: string; quantity: number; unitPrice?: number }>;
  totalAmount: number;
  status: string;
  deliveredAt: string | null;
  mealsRemaining: number;
  notes: string;
  address: {
    label: string;
    fullAddress: string;
    street: string;
    area: string;
    city: string;
    pincode: string;
    latitude: number;
    longitude: number;
  };
}

export default function DeliveryDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<DeliveryUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [dutyStatus, setDutyStatus] = useState<"ON_DUTY" | "OFF_DUTY">("ON_DUTY");
  const [currentTime, setCurrentTime] = useState<string>("");

  // Live Assigned Deliveries State
  const [deliveries, setDeliveries] = useState<DeliveryItemRecord[]>([]);
  const [deliverySummary, setDeliverySummary] = useState({
    totalAssigned: 0,
    deliveredCount: 0,
    remainingCount: 0,
    currentSession: "Lunch",
  });
  const [loadingDeliveries, setLoadingDeliveries] = useState(true);
  const [completingDeliveryId, setCompletingDeliveryId] = useState<string | null>(null);

  // Navigation / View Tabs
  const [activeTab, setActiveTab] = useState<"home" | "orders" | "settings">("home");
  const [sidebarOpen, setSidebarOpen] = useState(true);
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

  // Background Video Playlist (Delivery.mp4 -> Delivery2.mp4 -> Delivery.mp4 ...)
  const heroVideos = ["/Delivery.mp4", "/Delivery2.mp4"];
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  const handleVideoEnded = () => {
    setCurrentVideoIndex((prev) => (prev + 1) % heroVideos.length);
  };

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "SUCCESS" | "ERROR" | ""; text: string }>({
    type: "",
    text: "",
  });

  // In-App Turn-by-Turn Map Navigation State
  const [navModalItem, setNavModalItem] = useState<DeliveryItemRecord | null>(null);

  // Interactive Pin Picker Modal State
  const [isPinPickerOpen, setIsPinPickerOpen] = useState(false);
  const [kitchenCoords, setKitchenCoords] = useState<{ lat: number; lng: number }>({
    lat: 17.0605,
    lng: 81.8640,
  });
  const [kitchenAddress, setKitchenAddress] = useState(
    "The Q Bowl, Bridge County, Canteen, Rajanagaram, Velugubanda, Andhra Pradesh 533296"
  );

  useEffect(() => {
    fetch("/api/kitchen/update-location")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.kitchen) {
          setKitchenCoords({ lat: d.kitchen.lat, lng: d.kitchen.lng });
          if (d.kitchen.name) setKitchenAddress(d.kitchen.name);
        }
      })
      .catch(() => { });
  }, []);

  async function loadAssignedDeliveries() {
    try {
      setLoadingDeliveries(true);
      const res = await fetch("/api/delivery/dashboard");
      if (res.ok) {
        const data = await res.json();
        setDeliveries(data.deliveries || []);
        if (data.summary) setDeliverySummary(data.summary);
      }
    } catch (err) {
      console.error("Error loading assigned deliveries:", err);
    } finally {
      setLoadingDeliveries(false);
    }
  }

  async function handleMarkDelivered(item: DeliveryItemRecord) {
    setCompletingDeliveryId(item.id);
    try {
      const res = await fetch("/api/delivery/mark-delivered", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryId: item.id,
          deliveryType: item.deliveryType,
        }),
      });

      if (res.ok) {
        setDeliveries((prev) =>
          prev.map((d) =>
            d.id === item.id
              ? { ...d, status: "DELIVERED", deliveredAt: new Date().toISOString() }
              : d
          )
        );
        setDeliverySummary((prev) => ({
          ...prev,
          deliveredCount: prev.deliveredCount + 1,
          remainingCount: Math.max(0, prev.remainingCount - 1),
        }));
      }
    } catch (err) {
      console.error("Error completing delivery:", err);
    } finally {
      setCompletingDeliveryId(null);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMsg({ type: "", text: "" });

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "ERROR", text: "New password and confirmation password do not match." });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMsg({ type: "ERROR", text: "New password must be at least 6 characters long." });
      return;
    }

    setUpdatingPassword(true);

    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPasswordMsg({ type: "SUCCESS", text: "Password changed successfully!" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordMsg({ type: "ERROR", text: data.error || "Failed to update password." });
      }
    } catch (err) {
      setPasswordMsg({ type: "ERROR", text: "Network error. Failed to change password." });
    } finally {
      setUpdatingPassword(false);
    }
  }

  useEffect(() => {
    async function loadDeliveryProfile() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          router.push("/login");
        }
      } catch (err) {
        console.error("Error loading delivery staff profile:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDeliveryProfile();
    loadAssignedDeliveries();

    // Clock updater
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    const orderPoll = setInterval(loadAssignedDeliveries, 10000); // 10s live order sync

    // HTML5 GPS Location Broadcast to Server (watchPosition throttled)
    let watchId: number | null = null;
    let lastBroadcastTime = 0;
    let abortController: AbortController | null = null;

    if (typeof window !== "undefined" && "geolocation" in navigator && dutyStatus === "ON_DUTY") {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const now = Date.now();
          // Throttle to at most once every 10 seconds
          if (now - lastBroadcastTime < 10000) return;
          lastBroadcastTime = now;

          if (abortController) {
            abortController.abort();
          }
          abortController = new AbortController();

          const { latitude, longitude } = position.coords;
          fetch("/api/delivery/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ latitude, longitude }),
            signal: abortController.signal,
          }).catch((err) => {
            if (err.name !== "AbortError") {
              console.warn("Background GPS broadcast error:", err);
            }
          });
        },
        (error) => {
          console.warn("GPS Geolocation error/permission:", error.message);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
      );
    }

    return () => {
      clearInterval(interval);
      clearInterval(orderPoll);
      if (abortController) {
        abortController.abort();
      }
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [router, dutyStatus]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      router.push("/login");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5e3cd] flex flex-col items-center justify-center gap-3">
        <Loader2 size={40} className="animate-spin text-[#E5A00D]" />
        <p className="font-outfit font-black text-sm uppercase tracking-wider text-black">
          Authenticating Driver Portal...
        </p>
      </div>
    );
  }

  const deliveryBoyName = user?.name || "Delivery Partner";
  const initials = user?.name
    ? user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : "DP";

  const navItems = [
    { id: "home", name: "Overview", icon: Bike },
    { id: "orders", name: "Orders & Dispatches", icon: Receipt },
    { id: "settings", name: "Driver Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#f5e3cd] text-black font-sans flex flex-col">

      {/* ── 1. Top Navbar (Sticky Floating with Smooth Backdrop on Scroll) ── */}
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          isScrolled
            ? "bg-[#f5e3cd]/95 backdrop-blur-md py-3 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border-b-2 border-black/10"
            : "bg-transparent py-4 border-b-2 border-transparent"
        }`}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">

          {/* Brand Logo (Exact Landing / Customer Dashboard Logo) */}
          <Link
            href="/"
            className="flex items-center gap-2.5 sm:gap-3 shrink-0 group transition-transform duration-300 hover:scale-105"
          >
            <div className="p-1.5 rounded-2xl border-2 bg-[#FFF8EE] border-black shadow-[3px_3px_0px_#000000]">
              <Image
                src="/the_q_bowl_logo.png"
                alt="The Q Bowl Logo"
                width={48}
                height={48}
                priority
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-xl"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-outfit text-2xl sm:text-3xl font-black uppercase tracking-wider text-black text-stroke-small leading-tight">
                The Q BOWL
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-900 flex items-center gap-1">
                <Bike size={12} className="text-black" />
                <span>Delivery Fleet Partner</span>
              </span>
            </div>
          </Link>

          {/* Right Action Bar Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3">

            {/* Duty Status Toggle Pill */}
            <button
              onClick={() => setDutyStatus(dutyStatus === "ON_DUTY" ? "OFF_DUTY" : "ON_DUTY")}
              className={`hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full border-2 border-black font-outfit text-xs font-black uppercase tracking-wider transition-all shadow-[2px_2px_0_#000] ${dutyStatus === "ON_DUTY"
                  ? "bg-emerald-400 text-black hover:bg-emerald-300"
                  : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300"
                }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${dutyStatus === "ON_DUTY" ? "bg-emerald-950 animate-ping" : "bg-zinc-500"}`} />
              <span>{dutyStatus === "ON_DUTY" ? "On Duty (Live)" : "Off Duty (Break)"}</span>
            </button>

            {/* Driver Profile Badge */}
            <div className="flex items-center gap-2.5 bg-[#FFF8EE] border-2 border-black px-3.5 py-1.5 rounded-full shadow-[2px_2px_0_#000]">
              <div className="h-7 w-7 rounded-full bg-[#E5A00D] border border-black text-black font-black text-xs flex items-center justify-center">
                {initials}
              </div>
              <div className="hidden md:flex flex-col text-left pr-1">
                <span className="text-xs font-black text-black leading-none">{deliveryBoyName}</span>
                <span className="text-[9px] font-bold text-zinc-500 uppercase font-mono">ID: {user?.id?.slice(-6).toUpperCase()}</span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-black text-[#FFF8EE] hover:bg-[#E5A00D] hover:text-black font-outfit font-black text-xs uppercase tracking-wider border-2 border-black transition-all shadow-[2px_2px_0_#000]"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>

        </div>
      </header>

      {/* ── 2. Side Navigation + Main Dashboard Body ── */}
      <div className="flex flex-1 w-full px-3 sm:px-6 lg:px-8 relative pb-24 md:pb-12">

        {/* ── Desktop Stationary Floating Sidebar (Hidden on mobile) ── */}
        <aside className="hidden md:flex fixed left-3 sm:left-6 lg:left-8 top-28 z-30 flex-col items-center py-2 shrink-0 transition-all duration-300">
          {sidebarOpen ? (
            <div className="flex flex-col items-center animate-in fade-in slide-in-from-left-2 duration-200">
              <nav className="flex flex-col items-center gap-3 bg-white/90 backdrop-blur-md p-2 rounded-3xl border-2 border-black shadow-[4px_4px_0px_#000000]">

                {/* Collapse / Hide Navigation Toggle */}
                <div className="relative group flex items-center justify-center pb-1 border-b-2 border-black/10 w-full">
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center justify-center w-10 h-8 rounded-xl bg-zinc-100 hover:bg-black hover:text-[#FFF8EE] text-zinc-600 transition-all border border-transparent hover:border-black"
                    aria-label="Hide navigation bar"
                    title="Hide navigation bar"
                  >
                    <PanelLeftClose size={16} />
                  </button>

                  <div
                    role="tooltip"
                    className="absolute left-full ml-3.5 px-3 py-1.5 bg-black text-[#FFF8EE] text-xs font-outfit font-black uppercase tracking-wider rounded-xl whitespace-nowrap opacity-0 pointer-events-none -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-50 shadow-[3px_3px_0px_#E5A00D] border border-black flex items-center gap-1.5"
                  >
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-black" />
                    <span>Hide Navigation</span>
                  </div>
                </div>

                {/* Sidebar Navigation Items (Overview, Orders, Settings) */}
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <div key={item.id} className="relative group flex items-center justify-center">
                      <button
                        onClick={() => setActiveTab(item.id as any)}
                        className={`flex items-center justify-center w-12 h-12 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${isActive
                            ? "bg-[#E5A00D] border-black text-black shadow-[2px_2px_0px_#000000] scale-105"
                            : "bg-[#FFF8EE] border-transparent text-black/70 hover:text-black hover:bg-[#E5A00D] hover:border-black hover:shadow-[2px_2px_0px_#000000] hover:scale-110"
                          }`}
                        aria-label={item.name}
                      >
                        <Icon size={22} className="shrink-0 pointer-events-none transition-transform duration-200 group-hover:scale-110" />
                      </button>

                      {/* Tooltip on Hover */}
                      <div
                        role="tooltip"
                        className="absolute left-full ml-3.5 px-3 py-1.5 bg-black text-[#FFF8EE] text-xs font-outfit font-black uppercase tracking-wider rounded-xl whitespace-nowrap opacity-0 pointer-events-none -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-50 shadow-[3px_3px_0px_#E5A00D] border border-black flex items-center gap-1.5"
                      >
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-black" />
                        <span>{item.name}</span>
                      </div>
                    </div>
                  );
                })}

              </nav>
            </div>
          ) : (
            /* Collapsed Restore Button */
            <div className="relative group flex items-center justify-center animate-in fade-in slide-in-from-left duration-200">
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex items-center justify-center w-11 h-11 rounded-2xl bg-white/95 hover:bg-[#E5A00D] border-2 border-black shadow-[3px_3px_0px_#000000] text-black hover:scale-110 transition-all"
                aria-label="Show navigation bar"
              >
                <PanelLeftOpen size={18} />
              </button>

              <div
                role="tooltip"
                className="absolute left-full ml-3.5 px-3 py-1.5 bg-black text-[#FFF8EE] text-xs font-outfit font-black uppercase tracking-wider rounded-xl whitespace-nowrap opacity-0 pointer-events-none -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-50 shadow-[3px_3px_0px_#E5A00D] border border-black flex items-center gap-1.5"
              >
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-black" />
                <span>Show Navigation</span>
              </div>
            </div>
          )}
        </aside>

        {/* ── Mobile Bottom Navigation Dock (Visible only on mobile/tablet) ── */}
        <nav className="md:hidden fixed bottom-3 left-3 right-3 z-40 bg-white/95 backdrop-blur-lg px-3 py-2 rounded-3xl border-2 border-black shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const label = item.id === "home" ? "Overview" : item.id === "orders" ? "Live Drops" : "Settings";

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-3.5 rounded-2xl transition-all ${isActive
                    ? "bg-[#E5A00D] text-black border-2 border-black shadow-[2px_2px_0_#000] scale-105"
                    : "text-zinc-600 hover:text-black hover:bg-[#FFF8EE]"
                  }`}
              >
                <Icon size={20} className={isActive ? "text-black" : "text-zinc-600"} />
                <span className="text-[10px] font-outfit font-black uppercase tracking-wider leading-none">
                  {label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* ── Main Dashboard Content (Expanded Full Width, responsive padding) ── */}
        <main
          className={`flex-1 min-w-0 pb-12 transition-all duration-300 ${sidebarOpen
              ? "pl-0 md:pl-16 lg:pl-20"
              : "pl-0 md:pl-14 lg:pl-16"
            }`}
        >
          <div className="space-y-8 w-full">

            {/* ── TAB 1: OVERVIEW ── */}
            {activeTab === "home" && (
              <div className="space-y-8 animate-in fade-in duration-200 w-full">
                {/* Hero Welcome Card with Full Wide Video Background */}
                <div className="relative overflow-hidden rounded-3xl border-3 border-black bg-zinc-950 p-6 sm:p-10 lg:p-12 min-h-[420px] sm:min-h-[480px] shadow-[8px_8px_0_#000] text-white flex flex-col justify-between w-full">

                  {/* Full Background Video spanning entire width with automatic playlist switching */}
                  <video
                    key={heroVideos[currentVideoIndex]}
                    src={heroVideos[currentVideoIndex]}
                    autoPlay
                    muted
                    playsInline
                    onEnded={handleVideoEnded}
                    className="absolute inset-0 w-full h-full object-cover object-center z-0 transition-opacity duration-700"
                  />

                  {/* Clean, Bright gradient overlay across the video to see full video crystal clearly */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent z-0 pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent z-0 pointer-events-none" />

                  <div className="relative z-10 max-w-3xl space-y-5">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E5A00D] border-2 border-black text-xs font-outfit font-black uppercase tracking-wider text-black shadow-[2px_2px_0_#000]">
                      <Sparkles size={14} className="text-black" />
                      <span>The Q-Bowl Kitchen Express Dispatch</span>
                    </div>

                    <div className="space-y-2">
                      <h1 className="font-outfit text-3xl sm:text-5xl lg:text-7xl font-black uppercase tracking-tight text-white leading-none drop-shadow-lg">
                        Welcome to, <span className="text-[#E5A00D] underline decoration-[#E5A00D] decoration-4">{deliveryBoyName}</span>!
                      </h1>
                      <p className="font-outfit text-sm sm:text-base lg:text-lg font-bold text-zinc-100 pt-2 leading-relaxed max-w-2xl drop-shadow-md">
                        You are authenticated as an official Delivery Partner for The Q-Bowl. Orders and subscriptions dispatched in your zone will be routed to your driver console.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-3">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/90 backdrop-blur-sm text-[#FFF8EE] border-2 border-white/40 font-outfit font-black text-xs uppercase tracking-wider shadow-sm">
                        <Clock size={15} className="text-[#E5A00D]" />
                        <span>Live Time: {currentTime}</span>
                      </div>

                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FFF8EE] text-black border-2 border-black font-outfit font-black text-xs uppercase tracking-wider shadow-sm">
                        <MapPin size={15} className="text-rose-600 shrink-0" />
                        <span>Base Kitchen: {kitchenAddress}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsPinPickerOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E5A00D] hover:bg-black hover:text-[#E5A00D] text-black border-2 border-black font-outfit font-black text-xs uppercase tracking-wider shadow-[3px_3px_0_#000] transition-all cursor-pointer"
                      >
                        <MapPin size={15} />
                        <span>📍 Pinpoint &amp; Adjust On Map</span>
                      </button>

                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-400 text-black border-2 border-black font-outfit font-black text-xs uppercase tracking-wider shadow-sm">
                        <ShieldCheck size={15} className="text-emerald-950" />
                        <span>Dispatch Status: Active</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Driver Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div className="p-5 rounded-3xl bg-white border-3 border-black shadow-[4px_4px_0_#000] flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-black uppercase tracking-wider text-zinc-500">Today&apos;s Deliveries</p>
                      <h3 className="text-3xl font-black text-black font-outfit">{deliverySummary.totalAssigned}</h3>
                      <p className="text-[10px] font-bold text-zinc-400">Assigned drop-offs</p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-[#FFF8EE] border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0_#000]">
                      <Package size={22} className="text-[#E5A00D]" />
                    </div>
                  </div>

                  <div className="p-5 rounded-3xl bg-white border-3 border-black shadow-[4px_4px_0_#000] flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-black uppercase tracking-wider text-zinc-500">Delivered Drops</p>
                      <h3 className="text-3xl font-black text-emerald-700 font-outfit">{deliverySummary.deliveredCount}</h3>
                      <p className="text-[10px] font-bold text-emerald-600 font-semibold">{deliverySummary.remainingCount} pending route</p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-[#FFF8EE] border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0_#000]">
                      <CheckCircle2 size={22} className="text-emerald-600" />
                    </div>
                  </div>

                  <div className="p-5 rounded-3xl bg-white border-3 border-black shadow-[4px_4px_0_#000] flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-black uppercase tracking-wider text-zinc-500">Average ETA</p>
                      <h3 className="text-3xl font-black text-black font-outfit">22 Min</h3>
                      <p className="text-[10px] font-bold text-zinc-400">Hot dum transit time</p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-[#FFF8EE] border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0_#000]">
                      <Flame size={22} className="text-rose-600" />
                    </div>
                  </div>

                  <div className="p-5 rounded-3xl bg-white border-3 border-black shadow-[4px_4px_0_#000] flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-black uppercase tracking-wider text-zinc-500">Driver Phone</p>
                      <h3 className="text-sm font-black text-black font-mono mt-1">{user?.phone || "+91 83285 34576"}</h3>
                      <p className="text-[10px] font-bold text-zinc-400">Dispatch registered</p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-[#FFF8EE] border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0_#000]">
                      <Phone size={22} className="text-black" />
                    </div>
                  </div>
                </div>

                {/* Active Dispatch Console */}
                <div className="rounded-3xl border-3 border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0_#000] space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black/10 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-[#E5A00D] border-2 border-black flex items-center justify-center shadow-[2px_2px_0_#000]">
                        <Navigation size={20} className="text-black" />
                      </div>
                      <div>
                        <h3 className="font-outfit text-xl font-black uppercase tracking-tight text-black">
                          Active Dispatch Console
                        </h3>
                        <p className="text-xs font-bold text-zinc-500">
                          Real-time incoming orders &amp; assigned drops ({deliveries.length} orders assigned)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={loadAssignedDeliveries}
                        className="px-3 py-1.5 rounded-xl border border-black bg-zinc-100 hover:bg-black hover:text-[#FFF8EE] font-outfit font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5"
                      >
                        <RefreshCw size={12} className={loadingDeliveries ? "animate-spin" : ""} />
                        <span>Refresh</span>
                      </button>
                      <span className="px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-[11px] font-black uppercase text-emerald-800 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                        <span>Listening for Order Dispatches</span>
                      </span>
                    </div>
                  </div>

                  {loadingDeliveries ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-3">
                      <Loader2 size={32} className="animate-spin text-[#E5A00D]" />
                      <p className="font-outfit font-black text-xs uppercase text-zinc-600">Loading assigned deliveries...</p>
                    </div>
                  ) : deliveries.length === 0 ? (
                    <div className="p-8 sm:p-12 text-center rounded-2xl border-2 border-dashed border-black/20 bg-[#FFF8EE]/60 space-y-4">
                      <div className="h-16 w-16 mx-auto rounded-3xl bg-white border-2 border-black flex items-center justify-center shadow-[3px_3px_0_#000]">
                        <Bike size={32} className="text-[#E5A00D]" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-outfit text-xl font-black uppercase text-black">
                          Ready For Live Pickups
                        </h4>
                        <p className="text-xs sm:text-sm font-semibold text-zinc-600 max-w-md mx-auto">
                          No active delivery drops assigned to your account right now. When the kitchen admin dispatcher assigns an order to you, it will appear here automatically.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {deliveries.map((item) => (
                        <div
                          key={item.id}
                          className={`p-5 rounded-2xl border-2 border-black transition-all space-y-3 ${item.status === "DELIVERED"
                              ? "bg-zinc-50 opacity-75"
                              : "bg-[#FFF8EE] shadow-[3px_3px_0_#000]"
                            }`}
                        >
                          <div className="flex items-center justify-between gap-2 border-b-2 border-black/10 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-outfit font-black text-sm uppercase text-black">
                                {item.orderIdDisplay}
                              </span>
                              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${item.status === "DELIVERED"
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                  : "bg-[#E5A00D] text-black border-black"
                                }`}>
                                {item.status.replace(/_/g, " ")}
                              </span>
                            </div>
                            <span className="font-outfit font-black text-sm text-black">
                              ₹{item.totalAmount}
                            </span>
                          </div>

                          <div className="space-y-1 text-xs">
                            <p className="font-bold text-black flex items-center gap-1.5">
                              <User size={13} className="text-slate-500" />
                              <span>{item.customerName}</span>
                            </p>
                            <p className="font-mono font-bold text-slate-700 flex items-center gap-1.5">
                              <Phone size={13} className="text-slate-500" />
                              <a href={`tel:${item.customerPhone}`} className="hover:underline">{item.customerPhone}</a>
                            </p>
                            <p className="font-bold text-slate-800 flex items-start gap-1.5 pt-0.5">
                              <MapPin size={13} className="text-rose-600 shrink-0 mt-0.5" />
                              <span>{item.address.fullAddress || item.address.street}</span>
                            </p>
                            <p className="font-medium text-amber-900 bg-amber-50 p-2 rounded-xl border border-amber-200 mt-2">
                              🍲 {item.mealName}
                            </p>
                          </div>

                          <div className="pt-2 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => setNavModalItem(item)}
                              className="px-3 py-1.5 rounded-xl border-2 border-black bg-white hover:bg-black hover:text-white text-black font-outfit font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-[2px_2px_0_#000]"
                            >
                              <Navigation size={13} className="text-[#E5A00D]" />
                              <span>Live Map</span>
                            </button>

                            {item.status !== "DELIVERED" ? (
                              <button
                                onClick={() => handleMarkDelivered(item)}
                                disabled={completingDeliveryId === item.id}
                                className="px-4 py-1.5 rounded-xl border-2 border-black bg-black text-[#E5A00D] hover:bg-[#E5A00D] hover:text-black font-outfit font-black text-xs uppercase tracking-wider transition-all shadow-[2px_2px_0_#000] disabled:opacity-50 flex items-center gap-1.5"
                              >
                                {completingDeliveryId === item.id ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <CheckCircle2 size={13} />
                                )}
                                <span>Mark Delivered</span>
                              </button>
                            ) : (
                              <span className="text-xs font-black uppercase text-emerald-700 flex items-center gap-1">
                                <CheckCircle2 size={14} /> Completed
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB 2: ORDERS & DISPATCHES ── */}
            {activeTab === "orders" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="rounded-3xl border-3 border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0_#000] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-[#E5A00D] border-2 border-black flex items-center justify-center shadow-[3px_3px_0_#000]">
                      <Receipt size={28} className="text-black" />
                    </div>
                    <div>
                      <h2 className="font-outfit text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
                        Assigned Orders &amp; Dispatches
                      </h2>
                      <p className="text-xs font-bold text-zinc-600 mt-1">
                        All orders dispatched to you by the kitchen admin console ({deliveries.length} orders).
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={loadAssignedDeliveries}
                    className="px-4 py-2 rounded-xl border-2 border-black bg-[#FFF8EE] hover:bg-black hover:text-[#FFF8EE] font-outfit font-black text-xs uppercase tracking-wider transition-all shadow-[2px_2px_0_#000] flex items-center gap-2 self-start sm:self-auto"
                  >
                    <RefreshCw size={14} className={loadingDeliveries ? "animate-spin" : ""} />
                    <span>Sync Orders</span>
                  </button>
                </div>

                {loadingDeliveries ? (
                  <div className="p-12 text-center rounded-3xl border-3 border-black bg-white/80 space-y-3">
                    <Loader2 size={36} className="animate-spin text-[#E5A00D] mx-auto" />
                    <p className="font-outfit font-black text-sm uppercase text-black">Loading your assigned dispatch orders...</p>
                  </div>
                ) : deliveries.length === 0 ? (
                  <div className="p-12 text-center rounded-3xl border-3 border-dashed border-black/20 bg-white/80 space-y-3">
                    <Receipt size={36} className="mx-auto text-zinc-400" />
                    <h3 className="font-outfit text-lg font-black uppercase text-black">No Assigned Orders in Queue</h3>
                    <p className="text-xs text-zinc-500 font-medium">When orders are assigned to you by the kitchen dispatcher, they will be listed here with customer contact details and navigation routes.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {deliveries.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-3xl border-3 border-black bg-white p-6 sm:p-8 shadow-[5px_5px_0_#000] space-y-5"
                      >
                        {/* Order Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black/10 pb-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="font-outfit text-xl font-black text-black">
                                {item.orderIdDisplay}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border-2 border-black ${item.status === "DELIVERED"
                                  ? "bg-emerald-300 text-black"
                                  : "bg-[#E5A00D] text-black"
                                }`}>
                                {item.status.replace(/_/g, " ")}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-lg bg-zinc-100 border border-zinc-300 text-[10px] font-black uppercase text-zinc-700">
                                {item.deliveryType}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-500 font-medium">
                              Customer: <strong className="text-black">{item.customerName}</strong> • Phone: <a href={`tel:${item.customerPhone}`} className="text-amber-900 font-bold hover:underline">{item.customerPhone}</a>
                            </p>
                          </div>

                          <div className="text-left sm:text-right">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Order Value</span>
                            <span className="font-outfit text-2xl font-black text-black">₹{item.totalAmount}</span>
                          </div>
                        </div>

                        {/* Order Content & Drop-off info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 rounded-2xl bg-[#FFF8EE] border-2 border-black space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">
                              Ordered Items ({item.items.length || 1})
                            </span>
                            <p className="font-outfit font-black text-sm text-black">
                              {item.mealName}
                            </p>
                            {item.notes && (
                              <p className="text-xs text-zinc-600 italic bg-white/70 p-2 rounded-xl border border-zinc-200">
                                Note: {item.notes}
                              </p>
                            )}
                          </div>

                          <div className="p-4 rounded-2xl bg-[#FFF8EE] border-2 border-black space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">
                              Delivery Destination
                            </span>
                            <p className="font-bold text-black text-xs">
                              {item.address.fullAddress || item.address.street}
                            </p>
                            <p className="text-[11px] font-bold text-zinc-600">
                              {[item.address.area, item.address.city, item.address.pincode].filter(Boolean).join(", ")}
                            </p>
                          </div>
                        </div>

                        {/* Action Footer */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t-2 border-black/10">
                          <button
                            type="button"
                            onClick={() => setNavModalItem(item)}
                            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border-2 border-black bg-[#FFF8EE] hover:bg-black hover:text-white font-outfit font-black text-xs uppercase tracking-wider text-black transition-all flex items-center justify-center gap-2 shadow-[2px_2px_0_#000]"
                          >
                            <Navigation size={14} className="text-[#E5A00D]" />
                            <span>Open In-App Map</span>
                          </button>

                          {item.status !== "DELIVERED" ? (
                            <button
                              onClick={() => handleMarkDelivered(item)}
                              disabled={completingDeliveryId === item.id}
                              className="w-full sm:w-auto px-6 py-2.5 rounded-xl border-2 border-black bg-black text-[#E5A00D] hover:bg-[#E5A00D] hover:text-black font-outfit font-black text-xs uppercase tracking-wider transition-all shadow-[3px_3px_0_#000] disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              {completingDeliveryId === item.id ? (
                                <>
                                  <Loader2 size={14} className="animate-spin" />
                                  <span>Updating status...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 size={15} />
                                  <span>Mark Order As Delivered</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <span className="px-4 py-2 rounded-xl bg-emerald-100 border-2 border-emerald-400 font-outfit font-black text-xs uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                              <CheckCircle2 size={15} />
                              <span>Delivered on {item.deliveredAt ? new Date(item.deliveredAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "Today"}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 3: DRIVER SETTINGS ── */}
            {activeTab === "settings" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="rounded-3xl border-3 border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0_#000] flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-[#E5A00D] border-2 border-black flex items-center justify-center shadow-[3px_3px_0_#000]">
                    <Settings size={28} className="text-black" />
                  </div>
                  <div>
                    <h2 className="font-outfit text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
                      Driver Profile &amp; Preferences
                    </h2>
                    <p className="text-xs font-bold text-zinc-600 mt-1">
                      Manage your contact details, duty schedules, and vehicle preferences.
                    </p>
                  </div>
                </div>

                {/* Driver Profile Details */}
                <div className="rounded-3xl border-3 border-black bg-white p-6 sm:p-8 shadow-[5px_5px_0_#000] space-y-4">
                  <h3 className="font-outfit text-base font-black uppercase text-black">Account Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-2xl bg-[#FFF8EE] border-2 border-black">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Staff Name</span>
                      <span className="font-outfit font-black text-black text-base">{deliveryBoyName}</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#FFF8EE] border-2 border-black">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Login Email</span>
                      <span className="font-mono font-bold text-zinc-800 text-sm">{user?.email}</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#FFF8EE] border-2 border-black">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Phone Number</span>
                      <span className="font-mono font-bold text-zinc-800 text-sm">{user?.phone || "+91 83285 34576"}</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#FFF8EE] border-2 border-black">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Duty Status</span>
                      <span className="font-outfit font-black text-emerald-700 uppercase text-sm">{dutyStatus === "ON_DUTY" ? "Active (On Duty)" : "Paused (Off Duty)"}</span>
                    </div>
                  </div>
                </div>

                {/* Change Password Form Card */}
                <div className="rounded-3xl border-3 border-black bg-white p-6 sm:p-8 shadow-[5px_5px_0_#000] space-y-5">
                  <div className="flex items-center gap-3 border-b-2 border-black/10 pb-4">
                    <div className="h-10 w-10 rounded-xl bg-[#FFF8EE] border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0_#000]">
                      <Key size={18} className="text-[#E5A00D]" />
                    </div>
                    <div>
                      <h3 className="font-outfit text-base font-black uppercase text-black">Security &amp; Password</h3>
                      <p className="text-xs text-zinc-500 font-semibold">Change your driver dashboard login password</p>
                    </div>
                  </div>

                  {passwordMsg.text && (
                    <div
                      className={`p-4 rounded-2xl border-2 flex items-center gap-2.5 text-xs font-bold animate-in fade-in duration-200 ${passwordMsg.type === "SUCCESS"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-900"
                          : "bg-rose-50 border-rose-500 text-rose-900"
                        }`}
                    >
                      {passwordMsg.type === "SUCCESS" ? (
                        <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle size={18} className="text-rose-600 shrink-0" />
                      )}
                      <span>{passwordMsg.text}</span>
                    </div>
                  )}

                  <form onSubmit={handlePasswordChange} className="space-y-4 max-w-xl text-xs">
                    <div>
                      <label className="block font-black text-black uppercase tracking-wider mb-1.5">
                        Current Password *
                      </label>
                      <div className="relative">
                        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                          required
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter your current password"
                          className="w-full pl-9 pr-10 py-3 rounded-2xl border-2 border-black bg-[#FFF8EE] font-semibold text-black focus:outline-none focus:bg-white shadow-[2px_2px_0_#000]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black"
                        >
                          {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-black text-black uppercase tracking-wider mb-1.5">
                          New Password * (Min 6 chars)
                        </label>
                        <div className="relative">
                          <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                          <input
                            required
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New password"
                            className="w-full pl-9 pr-10 py-3 rounded-2xl border-2 border-black bg-[#FFF8EE] font-semibold text-black focus:outline-none focus:bg-white shadow-[2px_2px_0_#000]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black"
                          >
                            {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block font-black text-black uppercase tracking-wider mb-1.5">
                          Confirm New Password *
                        </label>
                        <div className="relative">
                          <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                          <input
                            required
                            type={showNewPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            className="w-full pl-9 pr-4 py-3 rounded-2xl border-2 border-black bg-[#FFF8EE] font-semibold text-black focus:outline-none focus:bg-white shadow-[2px_2px_0_#000]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        disabled={updatingPassword}
                        type="submit"
                        className="px-6 py-3 rounded-2xl bg-black text-[#FFF8EE] hover:bg-[#E5A00D] hover:text-black font-outfit font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0_#000] hover:shadow-none transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        {updatingPassword ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>Updating Password...</span>
                          </>
                        ) : (
                          <>
                            <Key size={16} />
                            <span>Update Password</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* ── Delivery Turn-by-Turn Map Modal ── */}
      {navModalItem && (
        <DeliveryMapModal
          isOpen={!!navModalItem}
          onClose={() => setNavModalItem(null)}
          customerName={navModalItem.customerName}
          customerPhone={navModalItem.customerPhone}
          customerAddress={navModalItem.address.fullAddress || navModalItem.address.street}
          customerLat={navModalItem.address.latitude}
          customerLng={navModalItem.address.longitude}
          orderIdDisplay={navModalItem.orderIdDisplay}
          mealName={navModalItem.mealName}
        />
      )}

      {/* ── Interactive Map Pin Dropper Modal ── */}
      {isPinPickerOpen && (
        <InteractiveMapPinPickerModal
          isOpen={isPinPickerOpen}
          onClose={() => setIsPinPickerOpen(false)}
          initialKitchenLat={kitchenCoords.lat}
          initialKitchenLng={kitchenCoords.lng}
          initialKitchenAddress={kitchenAddress}
          onLocationSaved={(newLat, newLng, newAddr) => {
            setKitchenCoords({ lat: newLat, lng: newLng });
            if (newAddr) setKitchenAddress(newAddr);
            loadAssignedDeliveries();
          }}
        />
      )}

      {/* ── Footer ── */}
      <footer className="mt-auto py-6 text-center text-xs font-bold text-zinc-500 border-t-2 border-black/10">
        <p>© {new Date().getFullYear()} The Q-Bowl Artisan Cloud Kitchen Fleet Services • Hyderabad</p>
      </footer>

    </div>
  );
}
