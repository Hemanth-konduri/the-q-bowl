"use client";

import { useState, useEffect, useRef } from "react";
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
  QrCode,
} from "lucide-react";
import dynamic from "next/dynamic";

const DeliveryMapModal = dynamic(() => import("@/components/delivery/DeliveryMapModal"), {
  ssr: false,
});

const DeliveryQrScannerModal = dynamic(
  () => import("@/components/delivery/DeliveryQrScannerModal"),
  { ssr: false }
);

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
  const heroVideoRef = useRef<HTMLVideoElement>(null);

  const handleVideoEnded = () => {
    setCurrentVideoIndex((prev) => (prev + 1) % heroVideos.length);
  };

  // Safely manage video play promise to prevent AbortError when switching tabs or videos
  useEffect(() => {
    const video = heroVideoRef.current;
    if (!video || activeTab !== "home") return;

    let isMounted = true;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        if (err.name !== "AbortError" && isMounted) {
          console.warn("Delivery hero video auto-play prevented:", err);
        }
      });
    }

    return () => {
      isMounted = false;
      if (video) {
        try {
          video.pause();
        } catch (_) { }
      }
    };
  }, [currentVideoIndex, activeTab]);

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

  // QR Delivery Scanner Modal State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerTargetOrderId, setScannerTargetOrderId] = useState<string | undefined>(undefined);

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
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${isScrolled
          ? "bg-[#f5e3cd]/95 backdrop-blur-md py-2.5 sm:py-3 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border-b-2 border-black/10"
          : "bg-transparent py-3 sm:py-4 border-b-2 border-transparent"
          }`}
      >
        <div className="w-full px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4">

          {/* Brand Logo (Exact Landing / Customer Dashboard Logo) */}
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-3 shrink-0 group transition-transform duration-300 hover:scale-105 min-w-0"
          >
            <div className="p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border-2 bg-[#FFF8EE] border-black shadow-[2px_2px_0px_#000000] sm:shadow-[3px_3px_0px_#000000] shrink-0">
              <Image
                src="/the_q_bowl_logo.png"
                alt="The Q Bowl Logo"
                width={48}
                height={48}
                priority
                className="w-7 h-7 sm:w-10 sm:h-10 object-contain rounded-lg sm:rounded-xl"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-outfit text-lg sm:text-2xl lg:text-3xl font-black uppercase tracking-wide text-black drop-shadow-sm leading-tight truncate">
                The Q BOWL
              </span>
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider sm:tracking-widest text-amber-900 flex items-center gap-1 truncate">
                <Bike size={11} className="text-black shrink-0" />
                <span className="hidden xs:inline">Delivery Partner</span>
                <span className="xs:hidden">Partner</span>
              </span>
            </div>
          </Link>

          {/* Right Action Bar Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 lg:gap-3 shrink-0">

            {/* Scan QR Pass Button */}
            <button
              onClick={() => {
                setScannerTargetOrderId(undefined);
                setIsScannerOpen(true);
              }}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full bg-[#E5A00D] hover:bg-black hover:text-[#E5A00D] text-black font-outfit font-black text-[11px] sm:text-xs uppercase tracking-wider border-2 border-black transition-all shadow-[2px_2px_0_#000] cursor-pointer shrink-0"
            >
              <QrCode size={14} className="stroke-[2.5]" />
              <span>Scan QR</span>
            </button>

            {/* Duty Status Toggle Pill */}
            <button
              onClick={() => setDutyStatus(dutyStatus === "ON_DUTY" ? "OFF_DUTY" : "ON_DUTY")}
              className={`hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full border-2 border-black font-outfit text-xs font-black uppercase tracking-wider transition-all shadow-[2px_2px_0_#000] shrink-0 ${dutyStatus === "ON_DUTY"
                ? "bg-emerald-400 text-black hover:bg-emerald-300"
                : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300"
                }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${dutyStatus === "ON_DUTY" ? "bg-emerald-950 animate-ping" : "bg-zinc-500"}`} />
              <span>{dutyStatus === "ON_DUTY" ? "On Duty (Live)" : "Off Duty (Break)"}</span>
            </button>

            {/* Driver Profile Badge */}
            <div className="flex items-center gap-2 bg-[#FFF8EE] border-2 border-black p-1 sm:px-3.5 sm:py-1.5 rounded-full shadow-[2px_2px_0_#000] shrink-0">
              <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-[#E5A00D] border border-black text-black font-black text-[10px] sm:text-xs flex items-center justify-center">
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
              className="flex items-center gap-1.5 p-2 sm:px-4 sm:py-2 rounded-full bg-black text-[#FFF8EE] hover:bg-[#E5A00D] hover:text-black font-outfit font-black text-xs uppercase tracking-wider border-2 border-black transition-all shadow-[2px_2px_0_#000] shrink-0"
              title="Sign Out"
              aria-label="Sign Out"
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
                {/* Hero Welcome Card with Round Rounded Corners (Compact Sleek Sizing) */}
                <div className="relative overflow-hidden rounded-3xl md:rounded-[2.5rem] border-3 md:border-4 border-black bg-zinc-950 p-4 sm:p-6 lg:p-10 min-h-[170px] sm:min-h-[220px] lg:min-h-0 flex flex-col justify-center shadow-[4px_4px_0_#000] md:shadow-[8px_8px_0_#000] text-white select-none">

                  {/* Dynamic Video Background playing Food1.mp4 -> Food5.mp4 */}
                  <video
                    ref={heroVideoRef}
                    src={heroVideos[currentVideoIndex]}
                    autoPlay
                    muted
                    playsInline
                    onEnded={handleVideoEnded}
                    className="absolute inset-0 w-full h-full object-cover object-center z-0 transition-opacity duration-1000"
                  />

                  {/* Clean, Bright Gradient Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 lg:via-black/35 to-black/40 lg:to-transparent z-0 pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-0 pointer-events-none" />

                  {/* Ambient glow & accents */}
                  <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-amber-400/20 blur-3xl pointer-events-none" />
                  <div className="absolute -left-20 -bottom-20 h-96 w-96 rounded-full bg-black/20 blur-3xl pointer-events-none" />

                  <div className="relative z-10 max-w-3xl space-y-2 sm:space-y-3.5 lg:space-y-5">
                    {/* Top Tag & Status Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-3">
                      <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-amber-300 text-[9px] sm:text-xs font-black uppercase tracking-wider">
                        <Sparkles size={11} className="text-amber-300 sm:w-3.5 sm:h-3.5" />
                        <span>The Q-Bowl Kitchen Express Dispatch</span>
                      </span>
                      <span className="hidden sm:inline-flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-emerald-400 text-black text-[9px] sm:text-xs font-black shadow-sm">
                        <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-950 animate-pulse" />
                        <span>Live Route Active</span>
                      </span>
                    </div>

                    {/* Title & Written Description - Visible on Mobile and Large Screens */}
                    <div className="space-y-1 sm:space-y-2 lg:space-y-2.5">
                      <h1 className="font-outfit text-base sm:text-2xl lg:text-5xl font-black uppercase leading-tight tracking-tight text-white drop-shadow-md">
                        Welcome to, <span className="text-[#E5A00D] underline decoration-[#E5A00D] decoration-2 sm:decoration-4">{deliveryBoyName}</span>!
                      </h1>
                      <p className="text-[10px] sm:text-xs lg:text-base text-amber-100/90 font-medium leading-relaxed max-w-2xl">
                        You are authenticated as an official Delivery Partner for The Q-Bowl. Orders and subscriptions dispatched in your zone will be routed to your driver console.
                      </p>
                    </div>

                    {/* Metadata & Action Badges: Displayed on Large screens, hidden on mobile */}
                    <div className="hidden sm:flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-4 pt-1 sm:pt-2">
                      <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-2xl bg-black/70 backdrop-blur-md border border-amber-300/50 text-xs font-bold uppercase tracking-wider text-white shadow-md">
                        <Clock size={13} className="text-[#E5A00D]" />
                        <span>Live Time: {currentTime}</span>
                      </div>

                      <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-2xl bg-[#FFF8EE] text-black border-2 border-black font-outfit font-black text-xs uppercase tracking-wider shadow-[2px_2px_0_#000]">
                        <MapPin size={13} className="text-rose-600 shrink-0" />
                        <span className="truncate max-w-[200px] lg:max-w-none">Base Kitchen: {kitchenAddress}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsPinPickerOpen(true)}
                        className="inline-flex items-center gap-1.5 px-4 sm:px-5 lg:px-6 py-2 sm:py-2.5 lg:py-3.5 rounded-lg sm:rounded-2xl bg-[#E5A00D] text-black font-outfit font-black text-xs lg:text-sm uppercase tracking-wider hover:bg-[#ffb515] border-2 border-black shadow-[2px_2px_0_#000] sm:shadow-[3px_3px_0_#000] transition-all cursor-pointer"
                      >
                        <MapPin size={14} className="shrink-0" />
                        <span>📍 Pinpoint &amp; Adjust</span>
                      </button>

                      <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-2xl bg-emerald-400 text-black border-2 border-black font-outfit font-black text-xs uppercase tracking-wider shadow-sm">
                        <ShieldCheck size={14} className="text-emerald-950 shrink-0" />
                        <span>Dispatch: Active</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Driver Metrics Cards: 2x2 Grid on Mobile, 4 Cols on Desktop */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
                  <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border-2 sm:border-3 border-black shadow-[3px_3px_0_#000] sm:shadow-[4px_4px_0_#000] flex items-center justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-zinc-500 truncate">Today&apos;s Deliveries</p>
                      <h3 className="text-2xl sm:text-3xl font-black text-black font-outfit">{deliverySummary.totalAssigned}</h3>
                      <p className="text-[9px] sm:text-[10px] font-bold text-zinc-400 truncate">Assigned drop-offs</p>
                    </div>
                    <div className="h-9 w-9 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-[#FFF8EE] border sm:border-2 border-black flex items-center justify-center text-black shadow-[1.5px_1.5px_0_#000] sm:shadow-[2px_2px_0_#000] shrink-0">
                      <Package size={18} className="text-[#E5A00D] sm:w-5 sm:h-5" />
                    </div>
                  </div>

                  <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border-2 sm:border-3 border-black shadow-[3px_3px_0_#000] sm:shadow-[4px_4px_0_#000] flex items-center justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-zinc-500 truncate">Delivered Drops</p>
                      <h3 className="text-2xl sm:text-3xl font-black text-emerald-700 font-outfit">{deliverySummary.deliveredCount}</h3>
                      <p className="text-[9px] sm:text-[10px] font-bold text-emerald-600 font-semibold truncate">{deliverySummary.remainingCount} pending route</p>
                    </div>
                    <div className="h-9 w-9 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-[#FFF8EE] border sm:border-2 border-black flex items-center justify-center text-black shadow-[1.5px_1.5px_0_#000] sm:shadow-[2px_2px_0_#000] shrink-0">
                      <CheckCircle2 size={18} className="text-emerald-600 sm:w-5 sm:h-5" />
                    </div>
                  </div>

                  <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border-2 sm:border-3 border-black shadow-[3px_3px_0_#000] sm:shadow-[4px_4px_0_#000] flex items-center justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-zinc-500 truncate">Average ETA</p>
                      <h3 className="text-2xl sm:text-3xl font-black text-black font-outfit">22 Min</h3>
                      <p className="text-[9px] sm:text-[10px] font-bold text-zinc-400 truncate">Hot dum transit time</p>
                    </div>
                    <div className="h-9 w-9 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-[#FFF8EE] border sm:border-2 border-black flex items-center justify-center text-black shadow-[1.5px_1.5px_0_#000] sm:shadow-[2px_2px_0_#000] shrink-0">
                      <Flame size={18} className="text-rose-600 sm:w-5 sm:h-5" />
                    </div>
                  </div>

                  <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border-2 sm:border-3 border-black shadow-[3px_3px_0_#000] sm:shadow-[4px_4px_0_#000] flex items-center justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-zinc-500 truncate">Driver Phone</p>
                      <h3 className="text-xs sm:text-sm font-black text-black font-mono mt-0.5 sm:mt-1 truncate">{user?.phone || "+91 83285 34576"}</h3>
                      <p className="text-[9px] sm:text-[10px] font-bold text-zinc-400 truncate">Dispatch registered</p>
                    </div>
                    <div className="h-9 w-9 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-[#FFF8EE] border sm:border-2 border-black flex items-center justify-center text-black shadow-[1.5px_1.5px_0_#000] sm:shadow-[2px_2px_0_#000] shrink-0">
                      <Phone size={18} className="text-black sm:w-5 sm:h-5" />
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
                    <div className="space-y-3 sm:space-y-0 sm:divide-y sm:divide-zinc-200/70 sm:-mx-8 sm:px-8">
                      {deliveries.map((item) => (
                        <div
                          key={item.id}
                          className={`p-3.5 sm:py-3.5 sm:px-3 rounded-2xl sm:rounded-xl border-2 sm:border-0 border-black/10 transition-all hover:bg-[#FFF8EE] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm sm:shadow-none ${item.status === "DELIVERED" ? "bg-emerald-50/50 border-emerald-300" : "bg-white"
                            }`}
                        >
                          {/* Top Row on Mobile: Order ID, Amount, Status */}
                          <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3 shrink-0">
                            <div className="flex items-center gap-2">
                              <span className="font-outfit font-black text-sm uppercase text-black tracking-tight">
                                {item.orderIdDisplay}
                              </span>
                              <span
                                className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${item.status === "DELIVERED"
                                    ? "bg-emerald-100 text-emerald-950 border-emerald-400"
                                    : "bg-amber-100 text-amber-950 border-amber-400"
                                  }`}
                              >
                                {item.status.replace(/_/g, " ")}
                              </span>
                            </div>

                            <span className="sm:hidden font-outfit font-black text-sm text-black">
                              ₹{item.totalAmount}
                            </span>
                          </div>

                          {/* Desktop Amount */}
                          <div className="hidden sm:block shrink-0 font-outfit font-black text-sm text-black">
                            ₹{item.totalAmount}
                          </div>

                          {/* Customer Name & Contact */}
                          <div className="flex items-center gap-2 shrink-0 bg-[#FFF8EE] sm:bg-transparent p-2 sm:p-0 rounded-xl sm:rounded-none border border-black/10 sm:border-0">
                            <span className="font-black text-black text-xs">{item.customerName}</span>
                            <span className="text-black font-black">•</span>
                            <a
                              href={`tel:${item.customerPhone}`}
                              className="font-mono font-black text-black hover:text-[#E5A00D] underline decoration-black/40 hover:decoration-[#E5A00D] transition-colors flex items-center gap-1"
                            >
                              <Phone size={12} className="sm:hidden text-zinc-600" />
                              <span>{item.customerPhone}</span>
                            </a>
                          </div>

                          {/* Address & Dish Info */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 flex-1 min-w-0">
                            <div className="flex items-start sm:items-center gap-1.5 text-black font-bold" title={item.address.fullAddress || item.address.street}>
                              <MapPin size={14} className="text-rose-600 shrink-0 stroke-[2.5] mt-0.5 sm:mt-0" />
                              <span className="text-black font-bold line-clamp-2 sm:truncate">{item.address.fullAddress || item.address.street}</span>
                            </div>

                            <div className="flex items-center gap-1.5 text-black font-black" title={item.mealName}>
                              <UtensilsCrossed size={14} className="text-black shrink-0 stroke-[2.5]" />
                              <span className="truncate text-black font-black">{item.mealName}</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-black/5 justify-end">
                            <button
                              type="button"
                              onClick={() => setNavModalItem(item)}
                              className="flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 rounded-xl sm:rounded-lg border-2 border-black bg-white hover:bg-black hover:text-white text-black font-outfit font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-[2px_2px_0_#000] cursor-pointer"
                            >
                              <Navigation size={13} className="text-black" />
                              <span>Live Map</span>
                            </button>

                            {item.status !== "DELIVERED" ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setScannerTargetOrderId(item.orderId || item.id);
                                  setIsScannerOpen(true);
                                }}
                                className="flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 rounded-xl sm:rounded-lg bg-[#E5A00D] hover:bg-black hover:text-[#E5A00D] text-black font-outfit font-black text-xs uppercase tracking-wider border-2 border-black transition-all shadow-[2px_2px_0_#000] flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <QrCode size={13} className="stroke-[2.5]" />
                                <span>Scan QR</span>
                              </button>
                            ) : (
                              <span className="text-xs font-black uppercase text-emerald-950 bg-emerald-100 border border-emerald-400 px-3 py-1.5 sm:py-1 rounded-xl sm:rounded-lg flex items-center gap-1">
                                <CheckCircle2 size={13} className="text-emerald-700 stroke-[2.5]" /> Delivered
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
                  <div className="rounded-3xl border-3 border-black bg-white p-4 sm:p-6 lg:p-8 shadow-[6px_6px_0_#000]">
                    <div className="space-y-3 sm:space-y-0 sm:divide-y sm:divide-zinc-200/70 sm:-mx-8 sm:px-8">
                      {deliveries.map((item) => (
                        <div
                          key={item.id}
                          className={`p-3.5 sm:py-3.5 sm:px-3 rounded-2xl sm:rounded-xl border-2 sm:border-0 border-black/10 transition-all hover:bg-[#FFF8EE] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm sm:shadow-none ${item.status === "DELIVERED" ? "bg-emerald-50/50 border-emerald-300" : "bg-white"
                            }`}
                        >
                          {/* Top Row on Mobile: Order ID, Type, Status */}
                          <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3 shrink-0">
                            <div className="flex items-center gap-2">
                              <span className="font-outfit font-black text-sm uppercase text-black tracking-tight">
                                {item.orderIdDisplay}
                              </span>
                              {item.deliveryType && (
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-zinc-100 text-black border border-black/20">
                                  {item.deliveryType}
                                </span>
                              )}
                              <span
                                className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${item.status === "DELIVERED"
                                    ? "bg-emerald-100 text-emerald-950 border-emerald-400"
                                    : "bg-amber-100 text-amber-950 border-amber-400"
                                  }`}
                              >
                                {item.status.replace(/_/g, " ")}
                              </span>
                            </div>

                            <span className="sm:hidden font-outfit font-black text-sm text-black">
                              ₹{item.totalAmount}
                            </span>
                          </div>

                          {/* Desktop Amount */}
                          <div className="hidden sm:block shrink-0 font-outfit font-black text-sm text-black">
                            ₹{item.totalAmount}
                          </div>

                          {/* Customer Name & Contact */}
                          <div className="flex items-center gap-2 shrink-0 bg-[#FFF8EE] sm:bg-transparent p-2 sm:p-0 rounded-xl sm:rounded-none border border-black/10 sm:border-0">
                            <span className="font-black text-black text-xs">{item.customerName}</span>
                            <span className="text-black font-black">•</span>
                            <a
                              href={`tel:${item.customerPhone}`}
                              className="font-mono font-black text-black hover:text-[#E5A00D] underline decoration-black/40 hover:decoration-[#E5A00D] transition-colors flex items-center gap-1"
                            >
                              <Phone size={12} className="sm:hidden text-zinc-600" />
                              <span>{item.customerPhone}</span>
                            </a>
                          </div>

                          {/* Address & Dish Info */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 flex-1 min-w-0">
                            <div className="flex items-start sm:items-center gap-1.5 text-black font-bold" title={item.address.fullAddress || item.address.street}>
                              <MapPin size={14} className="text-rose-600 shrink-0 stroke-[2.5] mt-0.5 sm:mt-0" />
                              <span className="text-black font-bold line-clamp-2 sm:truncate">{item.address.fullAddress || item.address.street}</span>
                            </div>

                            <div className="flex items-center gap-1.5 text-black font-black" title={item.mealName}>
                              <UtensilsCrossed size={14} className="text-black shrink-0 stroke-[2.5]" />
                              <span className="truncate text-black font-black">{item.mealName}</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-black/5 justify-end">
                            <button
                              type="button"
                              onClick={() => setNavModalItem(item)}
                              className="flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 rounded-xl sm:rounded-lg border-2 border-black bg-white hover:bg-black hover:text-white text-black font-outfit font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-[2px_2px_0_#000] cursor-pointer"
                            >
                              <Navigation size={13} className="text-black" />
                              <span>Live Map</span>
                            </button>

                            {item.status !== "DELIVERED" ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setScannerTargetOrderId(item.orderId || item.id);
                                  setIsScannerOpen(true);
                                }}
                                className="flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 rounded-xl sm:rounded-lg bg-[#E5A00D] hover:bg-black hover:text-[#E5A00D] text-black font-outfit font-black text-xs uppercase tracking-wider border-2 border-black transition-all shadow-[2px_2px_0_#000] flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <QrCode size={13} className="stroke-[2.5]" />
                                <span>Scan QR</span>
                              </button>
                            ) : (
                              <span className="text-xs font-black uppercase text-emerald-950 bg-emerald-100 border border-emerald-400 px-3 py-1.5 sm:py-1 rounded-xl sm:rounded-lg flex items-center gap-1">
                                <CheckCircle2 size={13} className="text-emerald-700 stroke-[2.5]" /> Delivered
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
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

      {/* ── QR Delivery Scanner Modal ── */}
      {isScannerOpen && (
        <DeliveryQrScannerModal
          isOpen={isScannerOpen}
          onClose={() => {
            setIsScannerOpen(false);
            setScannerTargetOrderId(undefined);
          }}
          targetOrderId={scannerTargetOrderId}
          onDeliveryConfirmed={() => {
            loadAssignedDeliveries();
          }}
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
