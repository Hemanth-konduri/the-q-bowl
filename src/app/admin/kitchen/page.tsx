"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "../components/AdminSidebar";
import { AdminNavbar } from "../components/AdminNavbar";
import {
  ChefHat,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  PauseCircle,
  Power,
  Info,
  Calendar,
  Sliders,
  ShieldCheck,
  ShoppingBag,
  Save,
  RotateCcw,
  Sparkles,
  Megaphone,
  Utensils,
  Flame,
  AlertCircle,
  Users,
  Eye,
  Check,
} from "lucide-react";

type KitchenStatus = "OPEN" | "CLOSED" | "CLOSED_TODAY" | "TEMPORARILY_UNAVAILABLE";
type NoticeType = "INFO" | "WARNING" | "ALERT" | "SUCCESS";

interface KitchenSettingsState {
  kitchenStatus: KitchenStatus;
  openingTime: string;
  closingTime: string;
  isOrderingPaused: boolean;
  maxOrdersPerDay: number;
  currentOrdersToday: number;
  isSameDayOrderingEnabled: boolean;
  estimatedPrepTime: string;
  isHolidayClosure: boolean;
  holidayReason: string;
  holidayReopeningDate: string;
  isNoticeBannerActive: boolean;
  noticeBannerText: string;
  noticeBannerType: NoticeType;
  subscriberExemptionNote: string;
}

export default function AdminKitchenPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [settings, setSettings] = useState<KitchenSettingsState>({
    kitchenStatus: "OPEN",
    openingTime: "07:00 AM",
    closingTime: "10:30 PM",
    isOrderingPaused: false,
    maxOrdersPerDay: 250,
    currentOrdersToday: 142,
    isSameDayOrderingEnabled: true,
    estimatedPrepTime: "25 - 35 mins",
    isHolidayClosure: false,
    holidayReason: "Diwali Special Holiday",
    holidayReopeningDate: "2026-09-10",
    isNoticeBannerActive: true,
    noticeBannerText: "Kitchen is open and serving fresh homemade bowls! Pre-orders welcome.",
    noticeBannerType: "INFO",
    subscriberExemptionNote:
      "Active subscribers continue receiving daily scheduled meals normally without interruption.",
  });

  const [previewTab, setPreviewTab] = useState<"REGULAR" | "SUBSCRIBER">("REGULAR");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/kitchen/settings");
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings((prev) => ({ ...prev, ...data.settings }));
      }
    } catch (err) {
      console.error("Failed to load kitchen settings", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (explicitSettings?: KitchenSettingsState) => {
    const payload = explicitSettings || settings;
    try {
      setSaving(true);
      setSaveSuccess(false);
      const res = await fetch("/api/admin/kitchen/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err) {
      console.error("Failed to save kitchen settings", err);
    } finally {
      setSaving(false);
    }
  };

  const updateAndSave = (updater: (prev: KitchenSettingsState) => KitchenSettingsState) => {
    setSettings((prev) => {
      const next = updater(prev);
      handleSave(next);
      return next;
    });
  };

  const handlePresetNotice = (text: string, type: NoticeType = "INFO") => {
    updateAndSave((prev) => ({
      ...prev,
      isNoticeBannerActive: true,
      noticeBannerText: text,
      noticeBannerType: type,
    }));
  };

  // Helper status color classes
  const getStatusBadge = (status: KitchenStatus) => {
    switch (status) {
      case "OPEN":
        return {
          label: "Open & Accepting Orders",
          badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
          dot: "bg-emerald-500",
        };
      case "CLOSED":
        return {
          label: "Kitchen Closed",
          badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
          icon: <XCircle className="w-5 h-5 text-rose-600" />,
          dot: "bg-rose-500",
        };
      case "CLOSED_TODAY":
        return {
          label: "Closed for Today",
          badgeClass: "bg-red-100 text-red-900 border-red-300",
          icon: <AlertCircle className="w-5 h-5 text-red-600" />,
          dot: "bg-red-600",
        };
      case "TEMPORARILY_UNAVAILABLE":
        return {
          label: "Temporarily Unavailable",
          badgeClass: "bg-amber-100 text-amber-900 border-amber-300",
          icon: <PauseCircle className="w-5 h-5 text-amber-600" />,
          dot: "bg-amber-500 animate-pulse",
        };
    }
  };

  const currentBadge = getStatusBadge(settings.kitchenStatus);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <AdminSidebar />

      <div className="pl-64 flex flex-col min-h-screen bg-white">
        <AdminNavbar />

        <main className="flex-1 p-8 space-y-8 bg-white max-w-[1600px] mx-auto w-full">
          {/* Header Action Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-black text-[#E5A00D] flex items-center justify-center font-bold shadow-none border border-black shrink-0">
                <ChefHat className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-black uppercase tracking-tight">
                    Kitchen Operations & Availability
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-black text-[#E5A00D]">
                    Live Control
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  Manage operational status, timing windows, order capacity limits, and public announcements.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {saveSuccess && (
                <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold animate-fadeIn">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Settings Saved Live!
                </div>
              )}

              <button
                onClick={fetchSettings}
                disabled={loading || saving}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                <RotateCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Reset
              </button>

              <button
                onClick={() => handleSave()}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-[#E5A00D] hover:bg-[#d4920b] text-black font-extrabold text-xs flex items-center gap-2 shadow-none border border-black/20 transition-all active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving Changes..." : "Save All Settings"}
              </button>
            </div>
          </div>

          {/* Subscriber Protection Notice Banner */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900">
              <span className="font-extrabold uppercase tracking-wide text-amber-950 mr-1.5">
                Subscriber Protection Guarantee:
              </span>
              Any changes made here to kitchen status or order pausing will strictly apply to regular meal orders on the customer app.{" "}
              <strong className="font-bold underline decoration-amber-400">
                Active subscribers remain 100% unaffected
              </strong>{" "}
              and will continue receiving their daily scheduled breakfast, lunch, and dinner meals normally.
            </div>
          </div>

          {/* 1. KITCHEN OPERATIONAL STATUS SELECTOR */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-black uppercase tracking-tight flex items-center gap-2">
                  <Power className="w-5 h-5 text-[#E5A00D]" />
                  1. Primary Kitchen Operational Status
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Select current operational state. Controls regular meal ordering availability on the user app.
                </p>
              </div>

              {/* Current Active Status Pill */}
              <div className={`px-4 py-1.5 rounded-full border text-xs font-black flex items-center gap-2 ${currentBadge.badgeClass}`}>
                <span className={`w-2 h-2 rounded-full ${currentBadge.dot}`} />
                <span>{currentBadge.label}</span>
              </div>
            </div>

            {/* 4 Status Option Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Option 1: OPEN */}
              <button
                type="button"
                onClick={() => updateAndSave((prev) => ({ ...prev, kitchenStatus: "OPEN", isOrderingPaused: false }))}
                className={`p-5 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between h-full ${
                  settings.kitchenStatus === "OPEN"
                    ? "bg-emerald-50/70 border-emerald-600 ring-2 ring-emerald-600/20"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  {settings.kitchenStatus === "OPEN" && (
                    <span className="px-2 py-0.5 bg-emerald-600 text-white font-extrabold text-[10px] uppercase rounded-md tracking-wider">
                      Active State
                    </span>
                  )}
                </div>
                <div className="mt-4">
                  <h3 className="text-base font-extrabold text-black">Open</h3>
                  <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
                    Kitchen is fully operational. Accepting both regular meal orders and subscriber dispatches.
                  </p>
                </div>
              </button>

              {/* Option 2: CLOSED */}
              <button
                type="button"
                onClick={() => updateAndSave((prev) => ({ ...prev, kitchenStatus: "CLOSED", isOrderingPaused: true }))}
                className={`p-5 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between h-full ${
                  settings.kitchenStatus === "CLOSED"
                    ? "bg-rose-50/70 border-rose-600 ring-2 ring-rose-600/20"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700">
                    <XCircle className="w-6 h-6" />
                  </div>
                  {settings.kitchenStatus === "CLOSED" && (
                    <span className="px-2 py-0.5 bg-rose-600 text-white font-extrabold text-[10px] uppercase rounded-md tracking-wider">
                      Active State
                    </span>
                  )}
                </div>
                <div className="mt-4">
                  <h3 className="text-base font-extrabold text-black">Closed</h3>
                  <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
                    Kitchen is closed outside operating hours. Regular orders disabled. Subscribers unaffected.
                  </p>
                </div>
              </button>

              {/* Option 3: CLOSED FOR TODAY */}
              <button
                type="button"
                onClick={() =>
                  updateAndSave((prev) => ({
                    ...prev,
                    kitchenStatus: "CLOSED_TODAY",
                    isOrderingPaused: true,
                    isNoticeBannerActive: true,
                    noticeBannerText: "Kitchen is closed for today. Regular orders will resume tomorrow.",
                    noticeBannerType: "ALERT",
                  }))
                }
                className={`p-5 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between h-full ${
                  settings.kitchenStatus === "CLOSED_TODAY"
                    ? "bg-red-50/70 border-red-600 ring-2 ring-red-600/20"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-xl bg-red-100 text-red-700">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  {settings.kitchenStatus === "CLOSED_TODAY" && (
                    <span className="px-2 py-0.5 bg-red-600 text-white font-extrabold text-[10px] uppercase rounded-md tracking-wider">
                      Active State
                    </span>
                  )}
                </div>
                <div className="mt-4">
                  <h3 className="text-base font-extrabold text-black">Closed for Today</h3>
                  <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
                    Full day closure (e.g. emergency, staff event, sold out). Auto-resumes tomorrow.
                  </p>
                </div>
              </button>

              {/* Option 4: TEMPORARILY UNAVAILABLE */}
              <button
                type="button"
                onClick={() =>
                  updateAndSave((prev) => ({
                    ...prev,
                    kitchenStatus: "TEMPORARILY_UNAVAILABLE",
                    isOrderingPaused: true,
                    isNoticeBannerActive: true,
                    noticeBannerText: "Orders temporarily paused due to high kitchen volume. We'll reopen shortly!",
                    noticeBannerType: "WARNING",
                  }))
                }
                className={`p-5 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between h-full ${
                  settings.kitchenStatus === "TEMPORARILY_UNAVAILABLE"
                    ? "bg-amber-50/70 border-amber-600 ring-2 ring-amber-600/20"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
                    <PauseCircle className="w-6 h-6" />
                  </div>
                  {settings.kitchenStatus === "TEMPORARILY_UNAVAILABLE" && (
                    <span className="px-2 py-0.5 bg-amber-600 text-white font-extrabold text-[10px] uppercase rounded-md tracking-wider">
                      Active State
                    </span>
                  )}
                </div>
                <div className="mt-4">
                  <h3 className="text-base font-extrabold text-black">Temporarily Unavailable</h3>
                  <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
                    Temporary pause due to rush hour backlog or equipment cleaning. Resume anytime.
                  </p>
                </div>
              </button>
            </div>
          </section>

          {/* MAIN 2-COLUMN GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* LEFT COLUMN: OPERATIONAL CONTROLS & TIMINGS (7 COLS) */}
            <div className="lg:col-span-7 space-y-8">
              {/* 2. OPENING & CLOSING TIMINGS */}
              <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-none">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-black text-[#E5A00D]">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-black uppercase tracking-tight">
                        2. Opening & Closing Timings
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Set daily operating hours. Editable at any time.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400">Timezone: IST (UTC+5:30)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Opening Time */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                      Kitchen Opening Time
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={settings.openingTime}
                        onChange={(e) => setSettings((prev) => ({ ...prev, openingTime: e.target.value }))}
                        placeholder="e.g. 07:00 AM"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-black focus:outline-none focus:border-black"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">First order acceptance window opens.</p>
                  </div>

                  {/* Closing Time */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                      Kitchen Closing Time
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={settings.closingTime}
                        onChange={(e) => setSettings((prev) => ({ ...prev, closingTime: e.target.value }))}
                        placeholder="e.g. 10:30 PM"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-black focus:outline-none focus:border-black"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">Last order checkout window closes.</p>
                  </div>
                </div>

                {/* Quick Preset Buttons */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Quick Timing Presets:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSettings((prev) => ({ ...prev, openingTime: "07:00 AM", closingTime: "10:30 PM" }))}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:border-black text-xs font-extrabold text-slate-800 transition-all"
                    >
                      Standard (7:00 AM – 10:30 PM)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettings((prev) => ({ ...prev, openingTime: "02:00 PM", closingTime: "11:00 PM" }))}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:border-black text-xs font-extrabold text-slate-800 transition-all"
                    >
                      Late Start (2:00 PM – 11:00 PM)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettings((prev) => ({ ...prev, openingTime: "07:00 AM", closingTime: "08:00 PM" }))}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:border-black text-xs font-extrabold text-slate-800 transition-all"
                    >
                      Early Close (7:00 AM – 8:00 PM)
                    </button>
                  </div>
                </div>
              </section>

              {/* 3. SPECIAL NOTICE / ANNOUNCEMENT BANNER */}
              <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-none">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-black text-[#E5A00D]">
                      <Megaphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-black uppercase tracking-tight">
                        3. Special Notice & Public Announcement Banner
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Display live announcements at the top of the user meal ordering screen.
                      </p>
                    </div>
                  </div>

                  {/* Toggle Banner Switch */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs font-bold text-slate-700">Show Banner:</span>
                    <input
                      type="checkbox"
                      checked={settings.isNoticeBannerActive}
                      onChange={(e) => updateAndSave((prev) => ({ ...prev, isNoticeBannerActive: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black relative"></div>
                  </label>
                </div>

                {/* Banner Style Selector */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                    Banner Severity Level
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { type: "INFO", label: "Info (Blue)", bg: "bg-blue-50 text-blue-800 border-blue-200" },
                      { type: "WARNING", label: "Warning (Amber)", bg: "bg-amber-50 text-amber-900 border-amber-200" },
                      { type: "ALERT", label: "Alert (Red)", bg: "bg-rose-50 text-rose-900 border-rose-200" },
                      { type: "SUCCESS", label: "Notice (Green)", bg: "bg-emerald-50 text-emerald-900 border-emerald-200" },
                    ].map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => updateAndSave((prev) => ({ ...prev, noticeBannerType: item.type as NoticeType }))}
                        className={`p-2.5 rounded-xl border text-xs font-extrabold transition-all text-center ${item.bg} ${
                          settings.noticeBannerType === item.type
                            ? "ring-2 ring-black font-black"
                            : "opacity-75 hover:opacity-100"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preset Message Quick Chips */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Quick Preset Messages:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handlePresetNotice("Kitchen closed today due to routine maintenance.", "ALERT")}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-black bg-slate-50 text-xs font-bold text-slate-800"
                    >
                      "Kitchen closed today"
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetNotice("Kitchen opening late today at 2:00 PM.", "WARNING")}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-black bg-slate-50 text-xs font-bold text-slate-800"
                    >
                      "Opening late at 2:00 PM"
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetNotice("Orders unavailable due to maintenance. Back soon!", "ALERT")}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-black bg-slate-50 text-xs font-bold text-slate-800"
                    >
                      "Orders unavailable due to maintenance"
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetNotice("High order volume! Estimated prep time +15 mins.", "INFO")}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-black bg-slate-50 text-xs font-bold text-slate-800"
                    >
                      "High order volume delay"
                    </button>
                  </div>
                </div>

                {/* Custom Notice Input */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                    Custom Announcement Text
                  </label>
                  <textarea
                    rows={3}
                    value={settings.noticeBannerText}
                    onChange={(e) => setSettings((prev) => ({ ...prev, noticeBannerText: e.target.value }))}
                    placeholder="Type custom public notice..."
                    className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-black focus:outline-none focus:border-black"
                  />
                </div>
              </section>

              {/* 4. HOLIDAY & SPECIAL CLOSURE TOGGLE */}
              <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-none">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-black text-[#E5A00D]">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-black uppercase tracking-tight">
                        Holiday & Special Closure Engine
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Schedule upcoming multi-day festival or seasonal closures.
                      </p>
                    </div>
                  </div>

                  {/* Holiday Switch */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs font-bold text-slate-700">Holiday Mode:</span>
                    <input
                      type="checkbox"
                      checked={settings.isHolidayClosure}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          isHolidayClosure: e.target.checked,
                          kitchenStatus: e.target.checked ? "CLOSED" : prev.kitchenStatus,
                          isOrderingPaused: e.target.checked ? true : prev.isOrderingPaused,
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600 relative"></div>
                  </label>
                </div>

                {settings.isHolidayClosure && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-black text-rose-950 uppercase tracking-wider block mb-1">
                          Closure Occasion / Reason
                        </label>
                        <input
                          type="text"
                          value={settings.holidayReason}
                          onChange={(e) => setSettings((prev) => ({ ...prev, holidayReason: e.target.value }))}
                          placeholder="e.g. Diwali Break / Annual Kitchen Overhaul"
                          className="w-full px-3 py-2 bg-white border border-rose-300 rounded-lg text-xs font-bold text-black"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-black text-rose-950 uppercase tracking-wider block mb-1">
                          Expected Re-Opening Date
                        </label>
                        <input
                          type="date"
                          value={settings.holidayReopeningDate}
                          onChange={(e) => setSettings((prev) => ({ ...prev, holidayReopeningDate: e.target.value }))}
                          className="w-full px-3 py-2 bg-white border border-rose-300 rounded-lg text-xs font-bold text-black"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* RIGHT COLUMN: ADDITIONAL CONTROLS & LIVE USER REFLECTION PREVIEW (5 COLS) */}
            <div className="lg:col-span-5 space-y-8">
              {/* 5. ADDITIONAL ADMIN OPTIONS CARDS */}
              <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-none">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="p-2 rounded-xl bg-black text-[#E5A00D]">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-black uppercase tracking-tight">
                      Order Capacity & SLA Controls
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Configure capacity caps, SLA prep timings, and instant order switches.
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  {/* Switch 1: Accepting vs Pausing Regular Orders */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
                    <div className="space-y-0.5">
                      <div className="text-xs font-black text-black uppercase tracking-wide">
                        Regular Order Acceptance
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {settings.isOrderingPaused
                          ? "🔴 Regular orders currently PAUSED"
                          : "🟢 Regular orders ACCEPTING"}
                      </p>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!settings.isOrderingPaused}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, isOrderingPaused: !e.target.checked }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 relative"></div>
                    </label>
                  </div>

                  {/* Switch 2: Same-Day Order Availability */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
                    <div className="space-y-0.5">
                      <div className="text-xs font-black text-black uppercase tracking-wide">
                        Same-Day Immediate Ordering
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {settings.isSameDayOrderingEnabled
                          ? "Enabled (Instant delivery available)"
                          : "Disabled (Pre-orders for tomorrow only)"}
                      </p>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.isSameDayOrderingEnabled}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, isSameDayOrderingEnabled: e.target.checked }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black relative"></div>
                    </label>
                  </div>

                  {/* Card 3: Maximum Orders for the Day */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-black uppercase tracking-wide">
                        Maximum Orders for the Day
                      </label>
                      <span className="text-xs font-extrabold text-black">
                        {settings.currentOrdersToday} / {settings.maxOrdersPerDay} Orders
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#E5A00D]"
                        style={{
                          width: `${Math.min(
                            100,
                            (settings.currentOrdersToday / settings.maxOrdersPerDay) * 100
                          )}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-xs text-slate-500 font-bold">Cap Limit:</span>
                      <input
                        type="number"
                        value={settings.maxOrdersPerDay}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, maxOrdersPerDay: parseInt(e.target.value) || 100 }))
                        }
                        className="w-24 px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-extrabold text-black"
                      />
                      <span className="text-[11px] text-slate-500">Auto-pauses when limit reached.</span>
                    </div>
                  </div>

                  {/* Card 4: Estimated Preparation Time */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                    <label className="text-xs font-black text-black uppercase tracking-wide block">
                      Estimated Preparation Time (SLA)
                    </label>
                    <input
                      type="text"
                      value={settings.estimatedPrepTime}
                      onChange={(e) => setSettings((prev) => ({ ...prev, estimatedPrepTime: e.target.value }))}
                      placeholder="e.g. 25 - 35 mins"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-black"
                    />

                    <div className="flex flex-wrap gap-1.5">
                      {["15-20 mins", "25-35 mins", "40-50 mins", "60+ mins"].map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setSettings((prev) => ({ ...prev, estimatedPrepTime: time }))}
                          className="px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:border-black text-[11px] font-bold text-slate-800"
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* 6. USER REFLECTION (LIVE CUSTOMER VIEW PREVIEW) */}
              <section className="bg-slate-900 text-white rounded-2xl p-6 space-y-6 shadow-none border border-black relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-[#E5A00D]" />
                    <h2 className="text-sm font-black uppercase tracking-wider text-white">
                      Live Customer App Preview
                    </h2>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#E5A00D] text-black">
                    Real-time Simulator
                  </span>
                </div>

                {/* View Switcher: Regular User vs Subscriber View */}
                <div className="flex bg-slate-800 p-1 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => setPreviewTab("REGULAR")}
                    className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                      previewTab === "REGULAR" ? "bg-[#E5A00D] text-black" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Regular Customer View
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab("SUBSCRIBER")}
                    className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                      previewTab === "SUBSCRIBER" ? "bg-[#E5A00D] text-black" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Active Subscriber View
                  </button>
                </div>

                {/* SIMULATED APP CONTAINER */}
                <div className="bg-white text-slate-900 rounded-xl p-4 space-y-4 border border-slate-200">
                  {/* Public Notice Banner if Active */}
                  {settings.isNoticeBannerActive && (
                    <div
                      className={`p-3 rounded-lg text-xs font-bold flex items-start gap-2 ${
                        settings.noticeBannerType === "ALERT"
                          ? "bg-rose-100 text-rose-900 border border-rose-300"
                          : settings.noticeBannerType === "WARNING"
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : settings.noticeBannerType === "SUCCESS"
                          ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                          : "bg-blue-100 text-blue-900 border border-blue-300"
                      }`}
                    >
                      <Megaphone className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{settings.noticeBannerText}</span>
                    </div>
                  )}

                  {/* Kitchen Header Pill */}
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2">
                      <Utensils className="w-4 h-4 text-[#E5A00D]" />
                      <div>
                        <div className="text-xs font-black text-black">Q1 Bowl Kitchen</div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          Today: {settings.openingTime} – {settings.closingTime}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        settings.kitchenStatus === "OPEN" && !settings.isOrderingPaused
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {settings.kitchenStatus === "OPEN" && !settings.isOrderingPaused
                        ? "Kitchen Open"
                        : "Kitchen Closed"}
                    </span>
                  </div>

                  {/* Simulated Meal Item Card & Action Button */}
                  {previewTab === "REGULAR" ? (
                    <div className="p-3 border border-slate-200 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-extrabold text-black">Gourmet Dal Tadka & Jeera Rice</div>
                          <div className="text-[10px] text-slate-500">Prep time: {settings.estimatedPrepTime}</div>
                        </div>
                        <span className="text-xs font-black text-black">₹180</span>
                      </div>

                      {settings.kitchenStatus === "OPEN" && !settings.isOrderingPaused ? (
                        <button className="w-full py-2 bg-[#E5A00D] text-black font-extrabold text-xs rounded-lg shadow-none border border-black/10">
                          Add to Cart • Instant Dispatch
                        </button>
                      ) : (
                        <button
                          disabled
                          className="w-full py-2 bg-slate-200 text-slate-500 font-extrabold text-xs rounded-lg cursor-not-allowed"
                        >
                          Orders Paused by Kitchen
                        </button>
                      )}
                    </div>
                  ) : (
                    /* Subscriber View */
                    <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 bg-amber-200 text-amber-900 font-black text-[10px] rounded uppercase">
                          Subscriber Active Meal Plan
                        </span>
                        <span className="text-xs font-extrabold text-amber-950">1 Meal Credit</span>
                      </div>
                      <p className="text-xs font-bold text-amber-950">
                        Today's Scheduled Lunch: Paneer Butter Masala Bowl
                      </p>

                      <div className="p-2 bg-white rounded border border-amber-300 text-[11px] text-amber-900 font-semibold flex items-start gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>
                          Guaranteed Dispatch Active: Scheduled delivery window 12:30 PM - 1:15 PM.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
