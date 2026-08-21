"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Save,
  AlertCircle,
  Camera,
  Calendar,
  Lock,
  Smartphone,
  CreditCard,
  Wallet,
  Sparkles,
  HelpCircle,
  Headphones,
  FileText,
  LogOut,
  ChevronRight,
  X,
  Check,
  Share2,
  Copy,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import gsap from "gsap";

type UserProfileData = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  role: string;
  googleId?: string | null;
  createdAt: string;
};

export default function UserProfilePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState("");

  // Personal Info Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [dob, setDob] = useState("1998-06-15");
  const [gender, setGender] = useState<"Male" | "Female" | "Other">("Male");
  const [createdAt, setCreatedAt] = useState("2026-08-01");
  const [googleLinked, setGoogleLinked] = useState(false);
  const [role, setRole] = useState("CUSTOMER");

  // Delivery Preferences State
  const [mealTime, setMealTime] = useState<"LUNCH" | "DINNER" | "BOTH">("BOTH");
  const [dietaryPref, setDietaryPref] = useState<"VEG" | "NON_VEG" | "ANY">("ANY");
  const [smsNotif, setSmsNotif] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);
  const [whatsappNotif, setWhatsappNotif] = useState(true);

  // Security Toggles & Modals
  const [twoFactor, setTwoFactor] = useState(false);
  const [activeModal, setActiveModal] = useState<"password" | "devices" | "privacy" | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/user/profile");
        if (!res.ok) throw new Error("Failed to load user profile");
        const json = await res.json();
        const u = json.user as UserProfileData;
        setName(u.name || "");
        setEmail(u.email || "");
        setPhone(u.phone || "");
        setAvatarUrl(u.avatarUrl || "");
        setGoogleLinked(Boolean(u.googleId));
        setRole(u.role || "CUSTOMER");
        if (u.createdAt) setCreatedAt(u.createdAt);
      } catch (err: any) {
        console.error("Profile fetch error:", err);
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    try {
      setUploadingAvatar(true);
      setError("");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "users/avatars");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.error || "Failed to upload avatar image");
      }

      const newAvatarUrl = uploadData.publicUrl;
      setAvatarUrl(newAvatarUrl);

      // Automatically update user profile in DB
      await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: newAvatarUrl }),
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      console.error("Avatar upload error:", err);
      setError(err.message || "Failed to update profile photo");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // GSAP Entrance Animations
  useEffect(() => {
    if (!loading && containerRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          ".gsap-prof-fade",
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power2.out" }
        );
      }, containerRef);

      return () => ctx.revert();
    }
  }, [loading]);

  async function handleSaveProfile() {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      console.error("Profile save error:", err);
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  const handleCopyReferral = () => {
    navigator.clipboard.writeText("QBOWL2026");
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4 max-w-md mx-auto">
        <div className="w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="font-outfit text-xs font-bold uppercase tracking-wider text-black">
          Loading your member profile...
        </p>
      </div>
    );
  }

  const initials = (name || email || "User").slice(0, 2).toUpperCase();

  return (
    <div ref={containerRef} className="space-y-6 pb-16 max-w-5xl mx-auto">
      
      {/* Animated Success Toast Notification */}
      {savedSuccess && (
        <div className="fixed top-6 right-6 z-[9999] bg-emerald-700 text-white px-5 py-3 rounded-[10px] shadow-[4px_4px_0px_#000000] border-2 border-black font-outfit text-xs font-bold uppercase flex items-center gap-2 animate-in fade-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>Profile changes saved successfully!</span>
        </div>
      )}


      {/* =========================================================
          1. PROFILE HEADER CARD
          ========================================================= */}
      <div className="gsap-prof-fade p-6 sm:p-8 bg-[#FFF8EE] border-2 border-black/15 rounded-[12px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar with Camera Upload Icon Overlay */}
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarFileSelect}
            className="hidden"
          />

          <div className="relative group shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[12px] bg-black text-[#E5A00D] border-2 border-black font-outfit text-2xl sm:text-3xl font-black flex items-center justify-center shadow-[3px_3px_0px_#000] overflow-hidden relative">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={name || "User Avatar"}
                  fill
                  className="object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 p-2 rounded-[8px] bg-[#E5A00D] text-black border-2 border-black hover:bg-white transition-all shadow-[2px_2px_0px_#000] disabled:opacity-50"
              title="Change Profile Photo (Upload to Supabase)"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* User Details */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="font-outfit font-black text-2xl sm:text-4xl text-black uppercase tracking-tight">
                {name || "Valued Customer"}
              </h1>
              <span className="px-2.5 py-0.5 rounded-[6px] bg-black text-[#E5A00D] font-outfit text-[10px] font-black uppercase">
                {role}
              </span>
            </div>
            <p className="font-sans text-xs text-black/70 font-semibold">{email}</p>
            <div className="flex flex-wrap items-center gap-3 pt-1 font-sans text-xs text-black/60 font-medium">
              <span>Phone: {phone || "Not linked"}</span>
              <span>•</span>
              <span>Member since {new Date(createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => infoRef.current?.scrollIntoView({ behavior: "smooth" })}
          className="px-5 py-2.5 rounded-[10px] bg-black text-[#f5e3cd] font-outfit text-xs font-bold uppercase tracking-wider hover:bg-[#E5A00D] hover:text-black transition-all shrink-0 shadow-[2px_2px_0px_#000]"
        >
          Edit Profile
        </button>
      </div>


      {/* =========================================================
          2. PERSONAL INFORMATION CARD
          ========================================================= */}
      <div ref={infoRef} className="gsap-prof-fade p-6 sm:p-7 bg-[#FFF8EE] border-2 border-black/15 rounded-[12px] space-y-5">
        <div className="flex items-center justify-between border-b-2 border-black/15 pb-4">
          <div>
            <span className="font-outfit text-[11px] font-black uppercase text-black bg-[#E5A00D] px-2.5 py-0.5 rounded-[6px] tracking-wider inline-block mb-1">
              ACCOUNT IDENTITY
            </span>
            <h2 className="font-outfit font-black text-2xl text-black uppercase tracking-tight">
              Personal Information
            </h2>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="px-5 py-2 rounded-[8px] bg-black text-[#f5e3cd] font-outfit text-xs font-bold uppercase tracking-wider hover:bg-[#E5A00D] hover:text-black transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-[8px] bg-red-50 border border-red-300 text-red-800 font-sans text-xs">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="block font-outfit text-xs font-extrabold uppercase tracking-wider text-black">
              Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                className="w-full rounded-[10px] px-4 py-2.5 pl-10 text-xs font-sans font-semibold outline-none border-2 border-black/20 bg-white text-black focus:border-black transition-colors"
              />
              <User className="w-4 h-4 text-black/50 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Email Address (Read-only) */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="block font-outfit text-xs font-extrabold uppercase tracking-wider text-black">
                Email Address
              </label>
              <span className="font-sans text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                Verified
              </span>
            </div>
            <div className="relative">
              <input
                type="email"
                value={email}
                disabled
                className="w-full rounded-[10px] px-4 py-2.5 pl-10 text-xs font-sans font-semibold outline-none border-2 border-black/15 bg-[#f5e3cd]/50 text-black/70 cursor-not-allowed"
              />
              <Mail className="w-4 h-4 text-black/50 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Phone Number */}
          <div className="space-y-1">
            <label className="block font-outfit text-xs font-extrabold uppercase tracking-wider text-black">
              Phone Number
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full rounded-[10px] px-4 py-2.5 pl-10 text-xs font-sans font-semibold outline-none border-2 border-black/20 bg-white text-black focus:border-black transition-colors"
              />
              <Phone className="w-4 h-4 text-black/50 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Date of Birth */}
          <div className="space-y-1">
            <label className="block font-outfit text-xs font-extrabold uppercase tracking-wider text-black">
              Date of Birth
            </label>
            <div className="relative">
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full rounded-[10px] px-4 py-2.5 pl-10 text-xs font-sans font-semibold outline-none border-2 border-black/20 bg-white text-black focus:border-black transition-colors"
              />
              <Calendar className="w-4 h-4 text-black/50 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Gender */}
          <div className="sm:col-span-2 space-y-1">
            <label className="block font-outfit text-xs font-extrabold uppercase tracking-wider text-black">
              Gender
            </label>
            <div className="flex gap-3">
              {(["Male", "Female", "Other"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`px-4 py-2 rounded-[8px] font-outfit text-xs font-bold uppercase border-2 transition-all ${
                    gender === g
                      ? "bg-black text-[#E5A00D] border-black shadow-[2px_2px_0px_#000]"
                      : "bg-white text-black border-black/20 hover:border-black"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>


      {/* =========================================================
          3. DELIVERY PREFERENCES CARD
          ========================================================= */}
      <div className="gsap-prof-fade p-6 sm:p-7 bg-[#FFF8EE] border-2 border-black/15 rounded-[12px] space-y-5">
        <div className="border-b-2 border-black/15 pb-4">
          <span className="font-outfit text-[11px] font-black uppercase text-black bg-[#E5A00D] px-2.5 py-0.5 rounded-[6px] tracking-wider inline-block mb-1">
            KITCHEN CUSTOMIZATION
          </span>
          <h2 className="font-outfit font-black text-2xl text-black uppercase tracking-tight">
            Delivery &amp; Meal Preferences
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans text-xs">
          {/* Preferred Time */}
          <div className="p-4 rounded-[10px] bg-[#f5e3cd]/60 border border-black/15 space-y-2">
            <span className="font-outfit text-xs font-extrabold uppercase text-black block">
              Preferred Meal Slot
            </span>
            <div className="space-y-1 font-outfit text-xs font-bold uppercase">
              {(["LUNCH", "DINNER", "BOTH"] as const).map((slot) => (
                <button
                  key={slot}
                  onClick={() => setMealTime(slot)}
                  className={`w-full py-1.5 px-3 rounded-[6px] text-left border transition-colors flex items-center justify-between ${
                    mealTime === slot
                      ? "bg-black text-[#E5A00D] border-black"
                      : "bg-white text-black border-black/15 hover:border-black/50"
                  }`}
                >
                  <span>{slot === "BOTH" ? "Both Lunch & Dinner" : slot}</span>
                  {mealTime === slot && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Dietary Choice */}
          <div className="p-4 rounded-[10px] bg-[#f5e3cd]/60 border border-black/15 space-y-2">
            <span className="font-outfit text-xs font-extrabold uppercase text-black block">
              Dietary Preference
            </span>
            <div className="space-y-1 font-outfit text-xs font-bold uppercase">
              {[
                { id: "ANY", label: "No Restriction" },
                { id: "VEG", label: "Vegetarian Only" },
                { id: "NON_VEG", label: "Non-Veg Friendly" },
              ].map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDietaryPref(d.id as any)}
                  className={`w-full py-1.5 px-3 rounded-[6px] text-left border transition-colors flex items-center justify-between ${
                    dietaryPref === d.id
                      ? "bg-black text-[#E5A00D] border-black"
                      : "bg-white text-black border-black/15 hover:border-black/50"
                  }`}
                >
                  <span>{d.label}</span>
                  {dietaryPref === d.id && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications Toggles */}
          <div className="p-4 rounded-[10px] bg-[#f5e3cd]/60 border border-black/15 space-y-2">
            <span className="font-outfit text-xs font-extrabold uppercase text-black block">
              Notification Preferences
            </span>
            <div className="space-y-2 font-outfit text-xs font-bold uppercase pt-1">
              <div className="flex items-center justify-between">
                <span>SMS Order Alerts</span>
                <button onClick={() => setSmsNotif(!smsNotif)} className="text-black">
                  {smsNotif ? <ToggleRight className="w-6 h-6 text-black fill-black" /> : <ToggleLeft className="w-6 h-6 text-black/40" />}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span>Email Receipts</span>
                <button onClick={() => setEmailNotif(!emailNotif)} className="text-black">
                  {emailNotif ? <ToggleRight className="w-6 h-6 text-black fill-black" /> : <ToggleLeft className="w-6 h-6 text-black/40" />}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span>WhatsApp Dispatch Updates</span>
                <button onClick={() => setWhatsappNotif(!whatsappNotif)} className="text-black">
                  {whatsappNotif ? <ToggleRight className="w-6 h-6 text-black fill-black" /> : <ToggleLeft className="w-6 h-6 text-black/40" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* =========================================================
          4. ACCOUNT & SECURITY CARD
          ========================================================= */}
      <div className="gsap-prof-fade p-6 sm:p-7 bg-[#FFF8EE] border-2 border-black/15 rounded-[12px] space-y-5">
        <div className="border-b-2 border-black/15 pb-4">
          <span className="font-outfit text-[11px] font-black uppercase text-black bg-[#E5A00D] px-2.5 py-0.5 rounded-[6px] tracking-wider inline-block mb-1">
            PROTECTION &amp; CREDENTIALS
          </span>
          <h2 className="font-outfit font-black text-2xl text-black uppercase tracking-tight">
            Account &amp; Security
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Change Password */}
          <div
            onClick={() => setActiveModal("password")}
            className="p-4 rounded-[10px] bg-[#f5e3cd]/60 border border-black/15 hover:border-black cursor-pointer transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-[8px] bg-black text-[#E5A00D]">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-outfit font-bold text-sm text-black uppercase">Change Password</h4>
                <p className="font-sans text-[11px] text-black/60">Update security passcode</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-black/50" />
          </div>

          {/* 2FA Toggle */}
          <div className="p-4 rounded-[10px] bg-[#f5e3cd]/60 border border-black/15 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-[8px] bg-black text-[#E5A00D]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-outfit font-bold text-sm text-black uppercase">Two-Factor Authentication</h4>
                <p className="font-sans text-[11px] text-black/60">Email OTP protection on login</p>
              </div>
            </div>
            <button onClick={() => setTwoFactor(!twoFactor)}>
              {twoFactor ? <ToggleRight className="w-7 h-7 text-black fill-black" /> : <ToggleLeft className="w-7 h-7 text-black/40" />}
            </button>
          </div>

          {/* Active Devices */}
          <div
            onClick={() => setActiveModal("devices")}
            className="p-4 rounded-[10px] bg-[#f5e3cd]/60 border border-black/15 hover:border-black cursor-pointer transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-[8px] bg-black text-[#E5A00D]">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-outfit font-bold text-sm text-black uppercase">Login Devices</h4>
                <p className="font-sans text-[11px] text-black/60">2 Active sessions</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-black/50" />
          </div>

          {/* Privacy Controls */}
          <div
            onClick={() => setActiveModal("privacy")}
            className="p-4 rounded-[10px] bg-[#f5e3cd]/60 border border-black/15 hover:border-black cursor-pointer transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-[8px] bg-black text-[#E5A00D]">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-outfit font-bold text-sm text-black uppercase">Privacy Settings</h4>
                <p className="font-sans text-[11px] text-black/60">Manage data &amp; consents</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-black/50" />
          </div>
        </div>
      </div>


      {/* =========================================================
          5. SAVED PAYMENT METHODS CARD
          ========================================================= */}
      <div className="gsap-prof-fade p-6 sm:p-7 bg-[#FFF8EE] border-2 border-black/15 rounded-[12px] space-y-5">
        <div className="flex items-center justify-between border-b-2 border-black/15 pb-4">
          <div>
            <span className="font-outfit text-[11px] font-black uppercase text-black bg-[#E5A00D] px-2.5 py-0.5 rounded-[6px] tracking-wider inline-block mb-1">
              PAYMENT WALLET &amp; CARDS
            </span>
            <h2 className="font-outfit font-black text-2xl text-black uppercase tracking-tight">
              Payment Methods
            </h2>
          </div>
          <button className="px-3.5 py-1.5 rounded-[8px] bg-black text-white font-outfit text-xs font-bold uppercase hover:bg-[#E5A00D] hover:text-black transition-colors">
            + Add Method
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* UPI */}
          <div className="p-4 rounded-[10px] bg-[#f5e3cd]/60 border border-black/15 space-y-2">
            <div className="flex items-center justify-between text-xs font-outfit font-bold uppercase text-black">
              <span>UPI Handle</span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px]">Verified</span>
            </div>
            <p className="font-outfit font-black text-sm text-black">hemanth@upi</p>
            <span className="font-sans text-[11px] text-black/60 block">Default Instant Checkout</span>
          </div>

          {/* Card */}
          <div className="p-4 rounded-[10px] bg-[#f5e3cd]/60 border border-black/15 space-y-2">
            <div className="flex items-center justify-between text-xs font-outfit font-bold uppercase text-black">
              <span>Visa Card</span>
              <CreditCard className="w-4 h-4 text-black" />
            </div>
            <p className="font-outfit font-black text-sm text-black">•••• •••• •••• 4242</p>
            <span className="font-sans text-[11px] text-black/60 block">Expires 08/28</span>
          </div>

          {/* Q1 Pay Wallet */}
          <div className="p-4 rounded-[10px] bg-black text-[#f5e3cd] border border-black space-y-2">
            <div className="flex items-center justify-between text-xs font-outfit font-bold uppercase text-[#E5A00D]">
              <span>Q1 Pay Wallet</span>
              <Wallet className="w-4 h-4 text-[#E5A00D]" />
            </div>
            <p className="font-outfit font-black text-2xl text-white">₹1,250</p>
            <span className="font-sans text-[11px] text-[#f5e3cd]/70 block">Auto-applied at checkout</span>
          </div>
        </div>
      </div>


      {/* =========================================================
          6. REWARDS & WALLET CARD
          ========================================================= */}
      <div className="gsap-prof-fade p-6 sm:p-8 bg-black text-[#f5e3cd] border-2 border-black rounded-[12px] flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 max-w-xl">
          <span className="px-3 py-1 rounded-[6px] bg-[#E5A00D] text-black font-outfit text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>MEMBER CLUB REWARDS</span>
          </span>
          <h2 className="font-outfit font-black text-2xl sm:text-4xl text-white uppercase tracking-tight leading-tight">
            EARN ₹200 ON EVERY REFERRAL
          </h2>
          <p className="font-sans text-xs sm:text-sm text-[#f5e3cd]/80 font-normal">
            Share your unique referral code <strong className="text-white bg-[#f5e3cd]/20 px-2 py-0.5 rounded border border-white/20">QBOWL2026</strong> with friends and family.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleCopyReferral}
            className="px-5 py-3 rounded-[10px] bg-[#f5e3cd] text-black font-outfit text-xs font-bold uppercase hover:bg-white transition-all flex items-center gap-1.5"
          >
            <Copy className="w-4 h-4" />
            <span>{copiedCode ? "Copied!" : "Copy Code"}</span>
          </button>
          <button className="px-6 py-3 rounded-[10px] bg-[#E5A00D] text-black font-outfit text-xs font-extrabold uppercase tracking-wider hover:bg-white transition-all shadow-[3px_3px_0px_#000] flex items-center gap-1.5">
            <Share2 className="w-4 h-4" />
            <span>Invite Friends</span>
          </button>
        </div>
      </div>


      {/* =========================================================
          7. SUPPORT & HELP GRID
          ========================================================= */}
      <div className="gsap-prof-fade grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Help Center", icon: HelpCircle, href: "#" },
          { label: "Contact Support", icon: Headphones, href: "#" },
          { label: "FAQs", icon: FileText, href: "/user/subscriptions" },
          { label: "Terms & Privacy", icon: ShieldCheck, href: "#" },
        ].map((sup, idx) => {
          const Icon = sup.icon;
          return (
            <Link
              key={idx}
              href={sup.href}
              className="p-4 bg-[#FFF8EE] border-2 border-black/15 rounded-[10px] hover:border-black hover:scale-[1.02] transition-all flex items-center gap-3"
            >
              <div className="p-2 rounded-[8px] bg-black text-[#E5A00D]">
                <Icon className="w-4 h-4" />
              </div>
              <span className="font-outfit font-bold text-xs text-black uppercase">{sup.label}</span>
            </Link>
          );
        })}
      </div>


      {/* =========================================================
          8. LOGOUT BUTTON (VISUALLY SEPARATED)
          ========================================================= */}
      <div className="gsap-prof-fade pt-4 text-center">
        <a
          href="/api/auth/logout"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-[10px] bg-red-100 text-red-900 border-2 border-red-400 font-outfit text-xs sm:text-sm font-extrabold uppercase tracking-wider hover:bg-red-800 hover:text-white transition-all shadow-[3px_3px_0px_#000]"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of All Devices</span>
        </a>
      </div>


      {/* Modals for Security Settings */}
      {activeModal === "password" && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFF8EE] border-2 border-black rounded-[12px] p-6 max-w-md w-full space-y-4 shadow-[8px_8px_0px_#000]">
            <div className="flex justify-between items-center border-b-2 border-black/15 pb-3">
              <h3 className="font-outfit font-black text-xl uppercase text-black">Change Security Password</h3>
              <button onClick={() => setActiveModal(null)}><X className="w-5 h-5" /></button>
            </div>
            <input type="password" placeholder="Current Password" className="w-full p-2.5 rounded-[8px] border-2 border-black/20 text-xs font-sans" />
            <input type="password" placeholder="New Password" className="w-full p-2.5 rounded-[8px] border-2 border-black/20 text-xs font-sans" />
            <button onClick={() => setActiveModal(null)} className="w-full py-2.5 bg-black text-[#E5A00D] font-outfit text-xs font-bold uppercase rounded-[8px]">
              Update Password
            </button>
          </div>
        </div>
      )}

      {activeModal === "devices" && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFF8EE] border-2 border-black rounded-[12px] p-6 max-w-md w-full space-y-4 shadow-[8px_8px_0px_#000]">
            <div className="flex justify-between items-center border-b-2 border-black/15 pb-3">
              <h3 className="font-outfit font-black text-xl uppercase text-black">Active Login Devices</h3>
              <button onClick={() => setActiveModal(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-3 bg-[#f5e3cd]/60 border border-black/15 rounded-[8px] font-sans text-xs space-y-1">
              <p className="font-bold text-black">Chrome on Windows (Current Session)</p>
              <p className="text-black/60">Hyderabad, India • Active Now</p>
            </div>
            <button onClick={() => setActiveModal(null)} className="w-full py-2.5 bg-black text-white font-outfit text-xs font-bold uppercase rounded-[8px]">
              Close Sessions Window
            </button>
          </div>
        </div>
      )}

      {activeModal === "privacy" && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFF8EE] border-2 border-black rounded-[12px] p-6 max-w-md w-full space-y-4 shadow-[8px_8px_0px_#000]">
            <div className="flex justify-between items-center border-b-2 border-black/15 pb-3">
              <h3 className="font-outfit font-black text-xl uppercase text-black">Privacy Settings</h3>
              <button onClick={() => setActiveModal(null)}><X className="w-5 h-5" /></button>
            </div>
            <p className="font-sans text-xs text-black/70 leading-relaxed">
              Your personal data is encrypted and used strictly for food dispatches. You can request a data export or account deletion anytime.
            </p>
            <button onClick={() => setActiveModal(null)} className="w-full py-2.5 bg-black text-[#E5A00D] font-outfit text-xs font-bold uppercase rounded-[8px]">
              Acknowledge Privacy Settings
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
