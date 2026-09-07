"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "../components/AdminSidebar";
import { AdminNavbar } from "../components/AdminNavbar";
import {
  Settings,
  Store,
  ChefHat,
  Shield,
  Bell,
  Sliders,
  Database,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Key,
  Lock,
  Download,
  Upload,
  RefreshCw,
  Clock,
  Phone,
  Mail,
  MapPin,
  FileText,
  DollarSign,
  Globe,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  UserCheck,
} from "lucide-react";

interface AppSettings {
  kitchenName: string;
  phone: string;
  email: string;
  address: string;
  gstNumber: string;
  logoUrl: string;
  openingTime: string;
  closingTime: string;
  autoAcceptOrders: boolean;
  sameDayOrdering: boolean;
  deliveryRadiusKm: number;
  enable2fa: boolean;
  emailNotifications: boolean;
  newOrderAlerts: boolean;
  newSubscriptionAlerts: boolean;
  paymentAlerts: boolean;
  timeZone: string;
  currency: string;
  dateFormat: string;
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [activeTab, setActiveTab] = useState<
    "RESTAURANT" | "KITCHEN" | "SECURITY" | "NOTIFICATIONS" | "SYSTEM" | "DATA"
  >("RESTAURANT");

  // Form State
  const [formData, setFormData] = useState<AppSettings>({
    kitchenName: "Q1 Bowl - Artisan Cloud Kitchen",
    phone: "+91 98765 43210",
    email: "admin@q1bowl.com",
    address: "Gachibowli, Hyderabad, Telangana 500032",
    gstNumber: "36AAAAA0000A1Z5",
    logoUrl: "/the_q_bowl_logo.png",
    openingTime: "07:00 AM",
    closingTime: "10:30 PM",
    autoAcceptOrders: true,
    sameDayOrdering: true,
    deliveryRadiusKm: 7.5,
    enable2fa: false,
    emailNotifications: true,
    newOrderAlerts: true,
    newSubscriptionAlerts: true,
    paymentAlerts: true,
    timeZone: "Asia/Kolkata (GMT+5:30)",
    currency: "INR (₹)",
    dateFormat: "DD/MM/YYYY",
  });

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState({ type: "", text: "" });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Backup & Restore State
  const [backupMsg, setBackupMsg] = useState("");

  async function fetchSettings() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings/all");
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setFormData(data.settings);
        }
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSettings();
  }, []);

  // Handle Save Settings
  async function handleSaveSettings(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setSaveError("");

    try {
      const res = await fetch("/api/admin/settings/all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        const err = await res.json();
        setSaveError(err.error || "Failed to save settings.");
      }
    } catch (err: any) {
      setSaveError("Network error while saving settings.");
    } finally {
      setSaving(false);
    }
  }

  // Handle Password Update
  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMsg({ type: "", text: "" });
    setUpdatingPassword(true);

    try {
      const res = await fetch("/api/admin/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPasswordMsg({ type: "SUCCESS", text: "Password updated successfully!" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordMsg({ type: "ERROR", text: data.error || "Failed to update password." });
      }
    } catch (err) {
      setPasswordMsg({ type: "ERROR", text: "Failed to update password." });
    } finally {
      setUpdatingPassword(false);
    }
  }

  // Handle Database Backup Download
  function handleBackupDatabase() {
    const backupObj = {
      app: "Q1 Bowl Cloud Kitchen Admin",
      backupTimestamp: new Date().toISOString(),
      settings: formData,
      version: "1.0.0",
    };
    const blob = new Blob([JSON.stringify(backupObj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Q1_Bowl_Database_Backup_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setBackupMsg("Database backup JSON snapshot downloaded successfully.");
    setTimeout(() => setBackupMsg(""), 5000);
  }

  // Handle Export Customers CSV
  async function handleExportCustomersCSV() {
    try {
      const res = await fetch("/api/admin/customers");
      if (res.ok) {
        const data = await res.json();
        const customers = data.customers || [];
        if (!customers.length) return;
        const headers = ["ID", "Name", "Email", "Phone", "Account Type", "Status", "Joined Date"];
        const rows = customers.map((c: any) => [
          `"${c.id}"`,
          `"${c.name || ""}"`,
          `"${c.email || ""}"`,
          `"${c.phone || ""}"`,
          `"${c.accountType || ""}"`,
          `"${c.accountStatus || ""}"`,
          `"${new Date(c.createdAt).toLocaleDateString()}"`,
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.href = encodedUri;
        link.download = `Q1_Bowl_Customers_Export_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error("Export customers CSV error:", err);
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <AdminSidebar />
      <div className="pl-64 flex flex-col min-h-screen bg-white">
        <AdminNavbar />

        <main className="flex-1 p-8 space-y-8 bg-white">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-[#E5A00D] text-black flex items-center justify-center font-extrabold shadow-sm border border-amber-400">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-black uppercase tracking-tight font-sans">
                  Application Settings &amp; Configuration
                </h1>
                <p className="text-xs font-bold text-slate-500">
                  Manage restaurant profile, operational rules, notifications, security, and data backups.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {saveSuccess && (
                <span className="px-3 py-1.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-black flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Saved Successfully
                </span>
              )}

              {saveError && (
                <span className="px-3 py-1.5 bg-rose-100 text-rose-900 border border-rose-300 rounded-xl text-xs font-black flex items-center gap-1.5">
                  <AlertCircle size={14} /> {saveError}
                </span>
              )}

              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-[#E5A00D] font-extrabold text-xs rounded-xl flex items-center gap-2 transition-all shadow-none"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save All Settings</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-16 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <Loader2 className="w-8 h-8 text-[#E5A00D] animate-spin mx-auto" />
              <p className="text-xs font-black text-black uppercase">Loading Settings Config...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Left Column: Vertical Setting Categories Navigation */}
              <div className="lg:col-span-1 space-y-2">
                {[
                  { id: "RESTAURANT", label: "Restaurant Info", icon: Store },
                  { id: "KITCHEN", label: "Kitchen Operational", icon: ChefHat },
                  { id: "SECURITY", label: "Account & Security", icon: Shield },
                  { id: "NOTIFICATIONS", label: "Notification Alerts", icon: Bell },
                  { id: "SYSTEM", label: "System Preferences", icon: Sliders },
                  { id: "DATA", label: "Data & Backups", icon: Database },
                ].map((cat) => {
                  const Icon = cat.icon;
                  const isActive = activeTab === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveTab(cat.id as any)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-xs transition-all text-left ${
                        isActive
                          ? "bg-black text-[#E5A00D] font-black shadow-sm"
                          : "bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-black border border-slate-200"
                      }`}
                    >
                      <Icon size={16} className={isActive ? "text-[#E5A00D]" : "text-slate-500"} />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Right Column: Setting Form Panels */}
              <div className="lg:col-span-3 bg-white border border-slate-200 p-6 rounded-2xl space-y-6">
                {/* ════════════════════════════════════════════════════════════ */}
                {/* TAB 1: RESTAURANT & BRAND INFORMATION                       */}
                {/* ════════════════════════════════════════════════════════════ */}
                {activeTab === "RESTAURANT" && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-3">
                      <h2 className="text-base font-black text-black uppercase tracking-tight">
                        Restaurant &amp; Brand Profile
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Public branding information, contact info, and tax identity.
                      </p>
                    </div>

                    <div className="space-y-4 text-xs">
                      <div>
                        <label className="font-extrabold text-slate-700 block mb-1">
                          Kitchen / Brand Name *
                        </label>
                        <input
                          type="text"
                          value={formData.kitchenName}
                          onChange={(e) => setFormData({ ...formData, kitchenName: e.target.value })}
                          className="w-full p-3 border border-slate-300 rounded-xl font-bold text-black focus:outline-none focus:border-black"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="font-extrabold text-slate-700 block mb-1">
                            Contact Phone Number *
                          </label>
                          <input
                            type="text"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full p-3 border border-slate-300 rounded-xl font-bold text-black font-mono focus:outline-none focus:border-black"
                          />
                        </div>

                        <div>
                          <label className="font-extrabold text-slate-700 block mb-1">
                            Official Email Address *
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full p-3 border border-slate-300 rounded-xl font-bold text-black font-mono focus:outline-none focus:border-black"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="font-extrabold text-slate-700 block mb-1">
                          Central Kitchen Address *
                        </label>
                        <textarea
                          rows={2}
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className="w-full p-3 border border-slate-300 rounded-xl font-bold text-black focus:outline-none focus:border-black"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="font-extrabold text-slate-700 block mb-1">
                            GST / Tax Identification Number
                          </label>
                          <input
                            type="text"
                            value={formData.gstNumber}
                            onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                            className="w-full p-3 border border-slate-300 rounded-xl font-bold text-black font-mono focus:outline-none focus:border-black"
                          />
                        </div>

                        <div>
                          <label className="font-extrabold text-slate-700 block mb-1">
                            Logo Asset URL
                          </label>
                          <input
                            type="text"
                            value={formData.logoUrl}
                            onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                            className="w-full p-3 border border-slate-300 rounded-xl font-bold text-black font-mono focus:outline-none focus:border-black"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ════════════════════════════════════════════════════════════ */}
                {/* TAB 2: KITCHEN OPERATIONAL CONTROLS                         */}
                {/* ════════════════════════════════════════════════════════════ */}
                {activeTab === "KITCHEN" && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-3">
                      <h2 className="text-base font-black text-black uppercase tracking-tight">
                        Kitchen Operational Controls
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Configure daily timings, automated order intake, and delivery perimeters.
                      </p>
                    </div>

                    <div className="space-y-5 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="font-extrabold text-slate-700 block mb-1">
                            Default Opening Time
                          </label>
                          <input
                            type="text"
                            value={formData.openingTime}
                            onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                            className="w-full p-3 border border-slate-300 rounded-xl font-bold text-black font-mono focus:outline-none focus:border-black"
                          />
                        </div>

                        <div>
                          <label className="font-extrabold text-slate-700 block mb-1">
                            Default Closing Time
                          </label>
                          <input
                            type="text"
                            value={formData.closingTime}
                            onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                            className="w-full p-3 border border-slate-300 rounded-xl font-bold text-black font-mono focus:outline-none focus:border-black"
                          />
                        </div>
                      </div>

                      {/* Toggles */}
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-black text-black text-xs">Auto-Accept Daily Orders</div>
                            <div className="text-[11px] text-slate-500 font-medium">
                              Automatically set new incoming daily orders to &apos;PREPARING&apos; status.
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setFormData({ ...formData, autoAcceptOrders: !formData.autoAcceptOrders })
                            }
                            className={`px-3 py-1.5 rounded-full text-xs font-black uppercase transition-all ${
                              formData.autoAcceptOrders
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {formData.autoAcceptOrders ? "ENABLED" : "DISABLED"}
                          </button>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                          <div>
                            <div className="font-black text-black text-xs">Same-Day Order Availability</div>
                            <div className="text-[11px] text-slate-500 font-medium">
                              Allow customers to place one-time daily orders for immediate same-day delivery.
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setFormData({ ...formData, sameDayOrdering: !formData.sameDayOrdering })
                            }
                            className={`px-3 py-1.5 rounded-full text-xs font-black uppercase transition-all ${
                              formData.sameDayOrdering
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {formData.sameDayOrdering ? "ENABLED" : "DISABLED"}
                          </button>
                        </div>
                      </div>

                      {/* Delivery Radius */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-extrabold text-slate-700 block">
                            Maximum Delivery Radius (km)
                          </label>
                          <span className="font-black text-black font-mono text-sm">
                            {formData.deliveryRadiusKm} km
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="25"
                          step="0.5"
                          value={formData.deliveryRadiusKm}
                          onChange={(e) =>
                            setFormData({ ...formData, deliveryRadiusKm: parseFloat(e.target.value) })
                          }
                          className="w-full accent-black cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ════════════════════════════════════════════════════════════ */}
                {/* TAB 3: ACCOUNT & SECURITY                                    */}
                {/* ════════════════════════════════════════════════════════════ */}
                {activeTab === "SECURITY" && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-3">
                      <h2 className="text-base font-black text-black uppercase tracking-tight">
                        Account &amp; Security Controls
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Change admin password, manage 2FA, and review active sessions.
                      </p>
                    </div>

                    {/* Change Password Form */}
                    <form onSubmit={handlePasswordChange} className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4 text-xs">
                      <h3 className="font-black text-black uppercase text-xs flex items-center gap-1.5">
                        <Key className="w-4 h-4 text-[#E5A00D]" /> Change Admin Password
                      </h3>

                      {passwordMsg.text && (
                        <div
                          className={`p-3 rounded-xl text-xs font-bold ${
                            passwordMsg.type === "SUCCESS"
                              ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                              : "bg-rose-100 text-rose-900 border border-rose-300"
                          }`}
                        >
                          {passwordMsg.text}
                        </div>
                      )}

                      <div>
                        <label className="font-extrabold text-slate-700 block mb-1">Current Password *</label>
                        <input
                          type="password"
                          required
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-black"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="font-extrabold text-slate-700 block mb-1">New Password *</label>
                          <input
                            type="password"
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-black"
                          />
                        </div>
                        <div>
                          <label className="font-extrabold text-slate-700 block mb-1">Confirm New Password *</label>
                          <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-black"
                          />
                        </div>
                      </div>

                      <div className="text-right">
                        <button
                          type="submit"
                          disabled={updatingPassword}
                          className="px-4 py-2 bg-black text-[#E5A00D] font-extrabold rounded-xl text-xs flex items-center gap-1.5 ml-auto"
                        >
                          {updatingPassword && <Loader2 size={14} className="animate-spin" />}
                          Update Password
                        </button>
                      </div>
                    </form>

                    {/* 2FA Toggle */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <div className="font-black text-black">Two-Factor Authentication (2FA)</div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          Add an extra layer of security to admin account logins.
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, enable2fa: !formData.enable2fa })}
                        className={`px-3 py-1.5 rounded-full text-xs font-black uppercase transition-all ${
                          formData.enable2fa ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {formData.enable2fa ? "ACTIVE" : "INACTIVE"}
                      </button>
                    </div>
                  </div>
                )}

                {/* ════════════════════════════════════════════════════════════ */}
                {/* TAB 4: NOTIFICATION SETTINGS                                 */}
                {/* ════════════════════════════════════════════════════════════ */}
                {activeTab === "NOTIFICATIONS" && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-3">
                      <h2 className="text-base font-black text-black uppercase tracking-tight">
                        Notification Alerts &amp; Triggers
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Configure push alerts, email dispatches, and dashboard notifications.
                      </p>
                    </div>

                    <div className="space-y-3 text-xs">
                      {[
                        {
                          key: "emailNotifications",
                          label: "Master Email Notifications",
                          desc: "Send transaction & order summaries via email.",
                        },
                        {
                          key: "newOrderAlerts",
                          label: "New Order Real-time Alerts",
                          desc: "Play sound & show banner when a new order is received.",
                        },
                        {
                          key: "newSubscriptionAlerts",
                          label: "New Subscription Alerts",
                          desc: "Notify when a new customer purchases a meal plan.",
                        },
                        {
                          key: "paymentAlerts",
                          label: "Payment & Refund Notifications",
                          desc: "Notify admin on successful payments or processed refunds.",
                        },
                      ].map((item) => {
                        const isVal = (formData as any)[item.key];
                        return (
                          <div
                            key={item.key}
                            className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                          >
                            <div>
                              <div className="font-black text-black">{item.label}</div>
                              <div className="text-[11px] text-slate-500 font-medium">{item.desc}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, [item.key]: !isVal })}
                              className={`px-3 py-1.5 rounded-full text-xs font-black uppercase transition-all ${
                                isVal ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {isVal ? "ON" : "OFF"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ════════════════════════════════════════════════════════════ */}
                {/* TAB 5: SYSTEM PREFERENCES                                   */}
                {/* ════════════════════════════════════════════════════════════ */}
                {activeTab === "SYSTEM" && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-3">
                      <h2 className="text-base font-black text-black uppercase tracking-tight">
                        System Preferences &amp; Regional Formatting
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Set default time zone, currency display, and date formats.
                      </p>
                    </div>

                    <div className="space-y-4 text-xs">
                      <div>
                        <label className="font-extrabold text-slate-700 block mb-1">Timezone Settings</label>
                        <select
                          value={formData.timeZone}
                          onChange={(e) => setFormData({ ...formData, timeZone: e.target.value })}
                          className="w-full p-3 border border-slate-300 rounded-xl font-bold text-black focus:outline-none focus:border-black"
                        >
                          <option value="Asia/Kolkata (GMT+5:30)">Asia/Kolkata (GMT+5:30)</option>
                          <option value="UTC (GMT+0:00)">UTC (GMT+0:00)</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="font-extrabold text-slate-700 block mb-1">Display Currency</label>
                          <input
                            type="text"
                            value={formData.currency}
                            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                            className="w-full p-3 border border-slate-300 rounded-xl font-bold text-black focus:outline-none focus:border-black"
                          />
                        </div>

                        <div>
                          <label className="font-extrabold text-slate-700 block mb-1">Date Format</label>
                          <select
                            value={formData.dateFormat}
                            onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value })}
                            className="w-full p-3 border border-slate-300 rounded-xl font-bold text-black focus:outline-none focus:border-black"
                          >
                            <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 07/09/2026)</option>
                            <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 09/07/2026)</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-09-07)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ════════════════════════════════════════════════════════════ */}
                {/* TAB 6: DATA MANAGEMENT & BACKUPS                            */}
                {/* ════════════════════════════════════════════════════════════ */}
                {activeTab === "DATA" && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="border-b border-slate-100 pb-3">
                      <h2 className="text-base font-black text-black uppercase tracking-tight">
                        Data Management &amp; System Backups
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Export database records to CSV and create system configuration backups.
                      </p>
                    </div>

                    {backupMsg && (
                      <div className="p-3 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold">
                        {backupMsg}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      {/* Customer Export */}
                      <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                        <div>
                          <div className="font-black text-black text-sm">Export Customers</div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            Download customer profile records as CSV file.
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleExportCustomersCSV}
                          className="w-full py-2.5 bg-black text-[#E5A00D] font-extrabold rounded-xl flex items-center justify-center gap-1.5"
                        >
                          <Download size={14} /> Export Customers CSV
                        </button>
                      </div>

                      {/* Database Backup */}
                      <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                        <div>
                          <div className="font-black text-black text-sm">Database Snapshot Backup</div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            Download timestamped JSON configuration &amp; schema backup.
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleBackupDatabase}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl flex items-center justify-center gap-1.5"
                        >
                          <Database size={14} /> Download Backup
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
