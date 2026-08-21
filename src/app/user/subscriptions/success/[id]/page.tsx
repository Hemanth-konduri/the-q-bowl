"use client";

import React, { useState, useEffect, use } from "react";
import SuccessScreen from "@/components/shared/success-screen";

export default function SubscriptionSuccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [subData, setSubData] = useState<any>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSub() {
      try {
        setLoading(true);
        const res = await fetch(`/api/subscriptions/${id}`);
        if (res.ok) {
          const data = await res.json();
          setSubData(data);
        } else {
          setErrorStatus(res.status);
        }
      } catch (err) {
        console.error("Failed to load subscription success details:", err);
        setErrorStatus(500);
      } finally {
        setLoading(false);
      }
    }
    fetchSub();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto p-12 bg-[#FFF8EE] border-2 border-[#0F3329] rounded-3xl text-center space-y-4 animate-pulse">
        <div className="w-16 h-16 rounded-full bg-[#0F3329]/10 mx-auto" />
        <div className="h-6 bg-[#0F3329]/15 rounded w-1/2 mx-auto" />
      </div>
    );
  }

  if (errorStatus === 403 || errorStatus === 404 || !subData?.subscription) {
    return (
      <div className="max-w-md mx-auto p-8 bg-[#FFF8EE] border-2 border-[#0F3329] rounded-3xl text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center mx-auto text-xl">
          ✕
        </div>
        <h2 className="font-outfit font-black text-xl text-[#0F3329] uppercase">
          {errorStatus === 403 ? "Unauthorized Subscription Access" : "Subscription Not Found"}
        </h2>
        <p className="font-sans text-xs text-[#0F3329]/70">
          {errorStatus === 403
            ? "You do not have authorization to view this subscription."
            : "The requested subscription ID could not be located."}
        </p>
        <a
          href="/user/dashboard"
          className="inline-block px-6 py-2.5 rounded-2xl bg-[#0F3329] text-[#f5e3cd] font-outfit text-xs font-black uppercase tracking-wider"
        >
          Return to Dashboard
        </a>
      </div>
    );
  }

  const sub = subData?.subscription;
  const addressSummary = sub
    ? `${sub.addressString || ""}, ${sub.area || ""}, ${sub.city || ""}`
    : "Hyderabad Locality";

  const details = [
    { label: "PLAN NAME", value: sub?.planName || "Balanced Plan" },
    { label: "START DATE", value: sub?.startDate || "Tomorrow" },
    { label: "MEALS REMAINING", value: `${sub?.mealsRemaining || 30} Meals` },
    { label: "PREFERRED SLOT", value: sub?.preferredDeliveryTime || "12:00 PM - 1:00 PM" },
    { label: "DIETARY PREF", value: sub?.dietaryPreference || "VEG" },
    { label: "PAUSE & SKIP", value: "Available Anytime" },
  ];

  return (
    <SuccessScreen
      type="SUBSCRIPTION"
      title="WELCOME TO THE Q BOWL FEAST CLUB!"
      subtitle="Your subscription has been successfully activated. Freshly prepared, dietitian-balanced meal bowls will be dispatched to your doorstep."
      idLabel="SUBSCRIPTION ID"
      idValue={id}
      details={details}
      addressSummary={addressSummary}
      primaryButtonText="Manage Subscription & Schedule"
      primaryButtonHref="/user/subscriptions"
      secondaryButtonText="Go to Dashboard"
      secondaryButtonHref="/user/dashboard"
    />
  );
}
