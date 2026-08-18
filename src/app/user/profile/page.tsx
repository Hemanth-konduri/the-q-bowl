"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Save,
  AlertCircle,
} from "lucide-react";

export default function UserProfilePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [googleLinked, setGoogleLinked] = useState(false);
  const [role, setRole] = useState("CUSTOMER");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/user/profile");
        if (!res.ok) throw new Error("Failed to load user profile");
        const json = await res.json();
        const u = json.user;
        setName(u.name || "");
        setEmail(u.email || "");
        setPhone(u.phone || "");
        setGoogleLinked(Boolean(u.googleId));
        setRole(u.role || "CUSTOMER");
      } catch (err: any) {
        console.error("Profile fetch error:", err);
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  async function handleSave() {
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
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      console.error("Profile save error:", err);
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#0F3329] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="font-outfit text-sm font-bold uppercase tracking-wider text-[#0F3329]">
          Fetching user profile from database...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500 max-w-4xl mx-auto">
      
      {/* =========================================================
          PAGE HEADER (NO SHADOWS)
          ========================================================= */}

      <div className="p-8 sm:p-10 bg-[#FFF8EE] border-2 border-[#0F3329]/20 rounded-[2rem] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <span className="font-outfit text-xs font-bold uppercase text-[#E5A00D] bg-[#0F3329] px-3 py-1 rounded-full block w-fit mb-2">
            DATABASE MEMBER RECORD
          </span>
          <h1 className="font-outfit font-black text-3xl sm:text-5xl text-[#0F3329] uppercase tracking-tight leading-none">
            MY ACCOUNT PROFILE
          </h1>
          <p className="font-sans text-sm sm:text-base text-[#0F3329]/70 font-medium mt-2">
            Update your personal name, contact phone number, and view your verified sign-in credentials.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3.5 rounded-2xl bg-[#0F3329] text-[#f5e3cd] border border-[#0F3329] font-outfit text-xs sm:text-sm font-black uppercase tracking-wider hover:bg-[#E5A00D] hover:text-[#0F3329] transition-colors flex items-center gap-2 shrink-0 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Saving..." : savedSuccess ? "✓ Saved!" : "Save Profile"}</span>
        </button>
      </div>


      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-400 text-emerald-900 font-sans font-bold text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-700" />
          <span>Your member profile has been updated in the database!</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-300 text-red-800 font-sans text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span>{error}</span>
        </div>
      )}


      {/* =========================================================
          PROFILE DETAILS FORM (NO SHADOWS)
          ========================================================= */}

      <div className="p-8 bg-[#FFF8EE] border-2 border-[#0F3329]/20 rounded-[2rem] space-y-6">
        <div className="border-b border-[#0F3329]/15 pb-4">
          <span className="font-outfit text-xs font-black uppercase text-[#0F3329] block">
            AUTHENTICATED CREDS
          </span>
          <h2 className="font-outfit font-black text-2xl text-[#0F3329] uppercase">
            PERSONAL DETAILS
          </h2>
        </div>

        <div className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="block font-outfit text-xs font-extrabold uppercase tracking-wider text-[#0F3329]">
              Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full rounded-2xl px-4 py-3.5 pl-11 text-sm font-sans font-semibold outline-none border-2 border-[#0F3329]/30 bg-white text-[#0F3329]"
              />
              <User className="w-5 h-5 text-[#0F3329]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Email Address (Read-only) */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="block font-outfit text-xs font-extrabold uppercase tracking-wider text-[#0F3329]">
                Email Address
              </label>
              <span className="font-sans text-xs font-bold text-emerald-800 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Verified Credential
              </span>
            </div>
            <div className="relative">
              <input
                type="email"
                value={email}
                disabled
                className="w-full rounded-2xl px-4 py-3.5 pl-11 text-sm font-sans font-semibold outline-none border-2 border-[#0F3329]/20 bg-[#f5e3cd]/50 text-[#0F3329]/80 cursor-not-allowed"
              />
              <Mail className="w-5 h-5 text-[#0F3329]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Phone Number */}
          <div className="space-y-1">
            <label className="block font-outfit text-xs font-extrabold uppercase tracking-wider text-[#0F3329]">
              Phone Number
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full rounded-2xl px-4 py-3.5 pl-11 text-sm font-sans font-semibold outline-none border-2 border-[#0F3329]/30 bg-white text-[#0F3329]"
              />
              <Phone className="w-5 h-5 text-[#0F3329]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Account Role & Method */}
          <div className="pt-4 border-t border-[#0F3329]/15 flex flex-wrap items-center justify-between gap-4 font-outfit text-xs font-extrabold uppercase text-[#0F3329]">
            <div>
              <span className="opacity-70 block">ACCOUNT ROLE:</span>
              <span className="bg-[#0F3329] text-[#E5A00D] px-3 py-1 rounded-md inline-block mt-1">
                {role}
              </span>
            </div>

            <div>
              <span className="opacity-70 block">SIGN-IN METHOD:</span>
              <span className="text-[#0F3329] bg-[#f5e3cd] px-3 py-1 rounded-md border border-[#0F3329]/30 inline-block mt-1">
                {googleLinked ? "Google OAuth 2.0" : "Email Passcode OTP"}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 rounded-2xl bg-[#0F3329] text-[#f5e3cd] font-outfit text-sm font-black uppercase tracking-wider hover:bg-[#E5A00D] hover:text-[#0F3329] transition-colors disabled:opacity-50"
        >
          {saving ? "Saving Changes to Database..." : "Save Profile Changes"}
        </button>
      </div>

    </div>
  );
}
