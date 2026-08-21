"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CalendarCheck,
  Check,
  ChevronRight,
  Flame,
  Clock,
  ShieldCheck,
  MapPin,
  Utensils,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  X,
  Plus,
} from "lucide-react";
import AddressSelector, { AddressType } from "@/components/shared/address-selector";
import PaymentMethodSelector, { PaymentMethodType } from "@/components/shared/payment-method-selector";
import PriceSummary from "@/components/shared/price-summary";

function SubscriptionCustomiserContent() {
  const searchParams = useSearchParams();
  const initialPlanId = searchParams.get("planId") || "plan-balanced";

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [plansList, setPlansList] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  // Step 1: Duration
  const [duration, setDuration] = useState<"WEEKLY" | "MONTHLY">("MONTHLY");

  // Step 2: Meal Preferences
  const [dietaryPref, setDietaryPref] = useState<"VEG" | "NON_VEG" | "ANY">("VEG");
  const [mealSlots, setMealSlots] = useState<string[]>(["LUNCH", "DINNER"]);
  const [spiceLevel, setSpiceLevel] = useState<"MILD" | "MEDIUM" | "FIERY">("MEDIUM");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [customAllergyInput, setCustomAllergyInput] = useState("");
  const [excludeIngredients, setExcludeIngredients] = useState<string[]>([]);
  const [customExcludeInput, setCustomExcludeInput] = useState("");

  // Step 3: Delivery Schedule
  const [startDate, setStartDate] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [deliveryDays, setDeliveryDays] = useState<string[]>(["MON", "TUE", "WED", "THU", "FRI", "SAT"]);
  const [preferredTime, setPreferredTime] = useState("12:00 PM - 1:00 PM");
  const [pauseRules, setPauseRules] = useState("Rollover unconsumed meals to wallet credit");

  // Step 4: Address
  const [selectedAddress, setSelectedAddress] = useState<AddressType | null>(null);
  const [showBlockingPinModal, setShowBlockingPinModal] = useState(false);

  // Step 5: Payment Method
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("UPI");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/user/subscriptions");
      if (res.ok) {
        const data = await res.json();
        const plans = data.availablePlans || [];
        setPlansList(plans);
        const match = plans.find((p: any) => p.id === initialPlanId) || plans[0];
        setSelectedPlan(match);
      }
    } catch (err) {
      console.error("Failed to load plans:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [initialPlanId]);

  const allDays = [
    { code: "MON", label: "Mon" },
    { code: "TUE", label: "Tue" },
    { code: "WED", label: "Wed" },
    { code: "THU", label: "Thu" },
    { code: "FRI", label: "Fri" },
    { code: "SAT", label: "Sat" },
    { code: "SUN", label: "Sun" },
  ];

  const commonAllergies = ["Gluten Free", "Dairy Free", "Nut Allergy", "Soy Free", "Egg Free"];

  const toggleDay = (code: string) => {
    setDeliveryDays((prev) =>
      prev.includes(code) ? prev.filter((d) => d !== code) : [...prev, code]
    );
  };

  const toggleAllergy = (item: string) => {
    setAllergies((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const addCustomAllergy = () => {
    if (customAllergyInput.trim() && !allergies.includes(customAllergyInput.trim())) {
      setAllergies((prev) => [...prev, customAllergyInput.trim()]);
      setCustomAllergyInput("");
    }
  };

  const addCustomExclude = () => {
    if (customExcludeInput.trim() && !excludeIngredients.includes(customExcludeInput.trim())) {
      setExcludeIngredients((prev) => [...prev, customExcludeInput.trim()]);
      setCustomExcludeInput("");
    }
  };

  const handleStepSubmit = async () => {
    setErrorMsg(null);

    if (currentStep === 1) {
      if (!selectedPlan) {
        setErrorMsg("Please select a valid subscription plan.");
        return;
      }
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      if (mealSlots.length === 0) {
        setErrorMsg("Please select at least one meal slot (Breakfast, Lunch, or Dinner).");
        return;
      }
      setCurrentStep(3);
      return;
    }

    if (currentStep === 3) {
      if (deliveryDays.length === 0) {
        setErrorMsg("Please select at least 1 delivery day per week.");
        return;
      }
      setCurrentStep(4);
      return;
    }

    if (currentStep === 4) {
      if (!selectedAddress) {
        setErrorMsg("Please select or add a delivery address.");
        return;
      }
      if (!selectedAddress.latitude || !selectedAddress.longitude) {
        setShowBlockingPinModal(true);
        return;
      }
      setCurrentStep(5);
      return;
    }

    // Step 5: Final Subscribe Submission
    if (currentStep === 5) {
      if (!selectedAddress || !selectedAddress.latitude || !selectedAddress.longitude) {
        setShowBlockingPinModal(true);
        return;
      }

      try {
        setSubmitting(true);
        const finalPrice =
          duration === "WEEKLY"
            ? selectedPlan.weeklyPrice || selectedPlan.price
            : selectedPlan.monthlyPrice || selectedPlan.price;

        const res = await fetch("/api/user/subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "CREATE_SUBSCRIPTION",
            planId: selectedPlan.id,
            duration,
            mealTypes: mealSlots,
            dietaryPreference: dietaryPref,
            spicePreference: spiceLevel,
            allergies,
            excludeIngredients,
            deliveryDays,
            preferredDeliveryTime: preferredTime,
            addressId: selectedAddress.id,
            pricePaid: finalPrice,
            startDate,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setSubmitting(false);
          setErrorMsg(data.error || "Failed to activate subscription");
          return;
        }

        // Process Payment simulation
        const payRes = await fetch("/api/payments/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscriptionId: data.subscriptionId,
            paymentMethod,
            amount: finalPrice,
            transactionToken: `TXN-SUB-${data.subscriptionId}-${Date.now()}`,
          }),
        });

        setSubmitting(false);
        if (payRes.ok) {
          window.location.href = `/user/subscriptions/success/${data.subscriptionId}`;
        } else {
          setErrorMsg("Subscription created, but payment processing failed.");
        }
      } catch (err) {
        setSubmitting(false);
        setErrorMsg("Error creating subscription.");
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-12 bg-[#FFF8EE] border-2 border-[#0F3329] rounded-3xl text-center space-y-4 animate-pulse">
        <Loader2 className="w-8 h-8 animate-spin text-[#E5A00D] mx-auto" />
        <span className="font-outfit text-xs font-bold uppercase text-[#0F3329]">
          Loading Plan Configuration...
        </span>
      </div>
    );
  }

  const calculatedPrice = selectedPlan
    ? duration === "WEEKLY"
      ? selectedPlan.weeklyPrice || selectedPlan.price
      : selectedPlan.monthlyPrice || selectedPlan.price
    : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* HEADER & STEPPER PROGRESS */}
      <div className="bg-[#FFF8EE] border-2 border-[#0F3329] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#0F3329]/15 pb-4">
          <div>
            <span className="px-3 py-1 rounded-full bg-[#E5A00D] text-[#0F3329] font-outfit text-[11px] font-black uppercase tracking-wider">
              CUSTOMIZE MEAL PLAN
            </span>
            <h1 className="font-outfit font-black text-2xl sm:text-3xl text-[#0F3329] uppercase tracking-tight mt-1">
              SUBSCRIPTION PURCHASING FLOW
            </h1>
          </div>

          <div className="font-outfit font-black text-xs uppercase text-[#0F3329] bg-[#f5e3cd] px-4 py-2 rounded-2xl border border-[#0F3329]/20 self-start sm:self-auto">
            STEP {currentStep} OF 5
          </div>
        </div>

        {/* STEP PROGRESS BAR */}
        <div className="grid grid-cols-5 gap-2 text-center font-outfit text-[10px] sm:text-xs font-black uppercase">
          {[
            { step: 1, name: "1. Plan Details" },
            { step: 2, name: "2. Preferences" },
            { step: 3, name: "3. Schedule" },
            { step: 4, name: "4. Address" },
            { step: 5, name: "5. Payment" },
          ].map((s) => (
            <div
              key={s.step}
              onClick={() => {
                if (s.step < currentStep) setCurrentStep(s.step);
              }}
              className={`py-2 px-1 rounded-xl border-2 transition-all cursor-pointer ${
                currentStep === s.step
                  ? "bg-[#0F3329] text-[#f5e3cd] border-[#0F3329]"
                  : currentStep > s.step
                  ? "bg-[#E5A00D] text-[#0F3329] border-[#0F3329]"
                  : "bg-white/60 text-[#0F3329]/40 border-[#0F3329]/15"
              }`}
            >
              <span className="truncate block">{s.name}</span>
            </div>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-100 border-2 border-red-400 text-red-900 text-xs font-sans font-bold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-700" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: PLAN DETAILS */}
      {currentStep === 1 && (
        <div className="bg-[#FFF8EE] border-2 border-[#0F3329] rounded-3xl p-6 sm:p-8 space-y-6 animate-in fade-in">
          <div className="space-y-1">
            <h2 className="font-outfit font-black text-xl sm:text-2xl uppercase tracking-tight text-[#0F3329]">
              SELECT YOUR SUBSCRIPTION PLAN & DURATION
            </h2>
            <p className="font-sans text-xs text-[#0F3329]/70">
              Choose your commitment cycle and baseline meal frequency.
            </p>
          </div>

          {/* DURATION TOGGLE */}
          <div className="flex items-center gap-2 bg-[#f5e3cd] p-1.5 rounded-2xl border-2 border-[#0F3329]/20 w-fit">
            <button
              type="button"
              onClick={() => setDuration("WEEKLY")}
              className={`px-5 py-2 rounded-xl font-outfit text-xs font-black uppercase transition-all ${
                duration === "WEEKLY" ? "bg-[#0F3329] text-[#f5e3cd]" : "text-[#0F3329]/70"
              }`}
            >
              7-Day Weekly Pass
            </button>
            <button
              type="button"
              onClick={() => setDuration("MONTHLY")}
              className={`px-5 py-2 rounded-xl font-outfit text-xs font-black uppercase transition-all ${
                duration === "MONTHLY" ? "bg-[#0F3329] text-[#E5A00D]" : "text-[#0F3329]/70"
              }`}
            >
              30-Day Monthly Membership (Best Value)
            </button>
          </div>

          {/* PLANS SELECTION CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plansList.map((plan) => {
              const isSelected = selectedPlan?.id === plan.id;
              const pPrice = duration === "WEEKLY" ? plan.weeklyPrice || plan.price : plan.monthlyPrice || plan.price;

              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-4 ${
                    isSelected
                      ? "bg-white border-[#0F3329] shadow-md ring-2 ring-[#0F3329]"
                      : "bg-white/60 border-[#0F3329]/20 hover:border-[#0F3329]/50"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-[#0F3329] text-[#E5A00D] font-outfit text-[10px] font-black uppercase">
                        {plan.mealsPerDay || 1} Meal / Day
                      </span>
                      {plan.isPopular && (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#E5A00D] text-[#0F3329] font-outfit text-[10px] font-black uppercase">
                          Most Popular
                        </span>
                      )}
                    </div>

                    <h3 className="font-outfit font-black text-xl text-[#0F3329] uppercase tracking-tight">
                      {plan.name}
                    </h3>
                    <p className="font-sans text-xs text-[#0F3329]/70 line-clamp-2">
                      {plan.description}
                    </p>

                    <div className="p-3 rounded-2xl bg-[#f5e3cd]/60 border border-[#0F3329]/15">
                      <span className="font-outfit font-black text-2xl text-[#0F3329]">₹{pPrice}</span>
                      <span className="font-sans text-xs text-[#0F3329]/70 font-semibold"> / {duration.toLowerCase()}</span>
                    </div>

                    <div className="space-y-1.5 pt-2 text-xs font-sans text-[#0F3329]/80 font-medium">
                      {(plan.features || []).map((feat: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`w-full py-2.5 rounded-xl font-outfit text-xs font-black uppercase transition-all ${
                      isSelected
                        ? "bg-[#0F3329] text-[#f5e3cd]"
                        : "bg-[#0F3329]/10 text-[#0F3329] hover:bg-[#0F3329] hover:text-white"
                    }`}
                  >
                    {isSelected ? "Plan Selected" : "Select Plan"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 2: MEAL PREFERENCES */}
      {currentStep === 2 && (
        <div className="bg-[#FFF8EE] border-2 border-[#0F3329] rounded-3xl p-6 sm:p-8 space-y-6 animate-in fade-in">
          <div className="space-y-1">
            <h2 className="font-outfit font-black text-xl sm:text-2xl uppercase tracking-tight text-[#0F3329]">
              CUSTOMIZE DIETARY & MEAL PREFERENCES
            </h2>
            <p className="font-sans text-xs text-[#0F3329]/70">
              Personalize ingredients, spice level, and daily meal slots.
            </p>
          </div>

          {/* DIETARY PREFERENCE */}
          <div className="space-y-2">
            <label className="font-outfit text-xs font-black uppercase text-[#0F3329] block">
              1. Primary Dietary Choice
            </label>
            <div className="flex gap-3">
              {[
                { type: "VEG", label: "100% Pure Veg", color: "bg-emerald-700" },
                { type: "NON_VEG", label: "Non-Veg & Chicken", color: "bg-red-700" },
                { type: "ANY", label: "Mixed / Flexible", color: "bg-amber-700" },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setDietaryPref(item.type as any)}
                  className={`px-5 py-3 rounded-2xl border-2 font-outfit text-xs font-black uppercase transition-all ${
                    dietaryPref === item.type
                      ? `${item.color} text-white border-[#0F3329]`
                      : "bg-white text-[#0F3329] border-[#0F3329]/20 hover:border-[#0F3329]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* MEAL SLOTS */}
          <div className="space-y-2">
            <label className="font-outfit text-xs font-black uppercase text-[#0F3329] block">
              2. Preferred Daily Meal Slots
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { slot: "BREAKFAST", title: "Breakfast Slot", desc: "8:00 AM - 9:30 AM" },
                { slot: "LUNCH", title: "Lunch Slot", desc: "12:00 PM - 1:30 PM" },
                { slot: "DINNER", title: "Dinner Slot", desc: "7:30 PM - 9:00 PM" },
              ].map((s) => {
                const isChecked = mealSlots.includes(s.slot);
                return (
                  <div
                    key={s.slot}
                    onClick={() => {
                      setMealSlots((prev) =>
                        isChecked ? prev.filter((m) => m !== s.slot) : [...prev, s.slot]
                      );
                    }}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      isChecked
                        ? "bg-[#0F3329] text-[#f5e3cd] border-[#0F3329]"
                        : "bg-white text-[#0F3329] border-[#0F3329]/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-outfit font-black text-xs uppercase">{s.title}</span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isChecked ? "border-[#E5A00D] bg-[#E5A00D] text-[#0F3329]" : "border-[#0F3329]/30"}`}>
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                    <span className="font-sans text-[11px] opacity-70 block mt-1">{s.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SPICE LEVEL */}
          <div className="space-y-2">
            <label className="font-outfit text-xs font-black uppercase text-[#0F3329] block">
              3. Spice Intensity Preference
            </label>
            <div className="flex gap-3">
              {[
                { level: "MILD", label: "Mild & Gentle" },
                { level: "MEDIUM", label: "Medium Artisanal Spice" },
                { level: "FIERY", label: "Fiery & Bold" },
              ].map((sp) => (
                <button
                  key={sp.level}
                  type="button"
                  onClick={() => setSpiceLevel(sp.level as any)}
                  className={`px-4 py-2.5 rounded-2xl border-2 font-outfit text-xs font-bold uppercase transition-all ${
                    spiceLevel === sp.level
                      ? "bg-[#0F3329] text-[#E5A00D] border-[#0F3329]"
                      : "bg-white text-[#0F3329] border-[#0F3329]/20"
                  }`}
                >
                  {sp.label}
                </button>
              ))}
            </div>
          </div>

          {/* ALLERGIES & EXCLUSIONS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <label className="font-outfit text-xs font-black uppercase text-[#0F3329] block">
                4. Allergies (Optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {commonAllergies.map((alg) => {
                  const active = allergies.includes(alg);
                  return (
                    <button
                      key={alg}
                      type="button"
                      onClick={() => toggleAllergy(alg)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-outfit font-bold uppercase transition-all ${
                        active
                          ? "bg-[#0F3329] text-[#f5e3cd] border-[#0F3329]"
                          : "bg-white text-[#0F3329]/80 border-[#0F3329]/20"
                      }`}
                    >
                      {alg}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-outfit text-xs font-black uppercase text-[#0F3329] block">
                5. Exclude Ingredients (Optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customExcludeInput}
                  onChange={(e) => setCustomExcludeInput(e.target.value)}
                  placeholder="e.g. Mushrooms, Capsicum, Peanuts"
                  className="flex-1 px-3 py-2 rounded-xl border-2 border-[#0F3329]/30 bg-white font-sans text-xs text-[#0F3329]"
                />
                <button
                  type="button"
                  onClick={addCustomExclude}
                  className="px-3 py-2 rounded-xl bg-[#0F3329] text-[#f5e3cd] font-outfit text-xs font-black uppercase"
                >
                  Add
                </button>
              </div>
              {excludeIngredients.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {excludeIngredients.map((ex, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-red-100 text-red-800 text-xs font-outfit font-bold uppercase flex items-center gap-1"
                    >
                      <span>{ex}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setExcludeIngredients((prev) => prev.filter((i) => i !== ex))
                        }
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: DELIVERY SCHEDULE */}
      {currentStep === 3 && (
        <div className="bg-[#FFF8EE] border-2 border-[#0F3329] rounded-3xl p-6 sm:p-8 space-y-6 animate-in fade-in">
          <div className="space-y-1">
            <h2 className="font-outfit font-black text-xl sm:text-2xl uppercase tracking-tight text-[#0F3329]">
              CONFIGURE DELIVERY SCHEDULE & START DATE
            </h2>
            <p className="font-sans text-xs text-[#0F3329]/70">
              Select your dispatch days, start date, and preferred time window.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="font-outfit text-xs font-black uppercase text-[#0F3329] block">
                1. Subscription Start Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-3 rounded-2xl border-2 border-[#0F3329]/30 bg-white font-sans text-xs text-[#0F3329] font-bold"
              />
            </div>

            <div className="space-y-2">
              <label className="font-outfit text-xs font-black uppercase text-[#0F3329] block">
                2. Preferred Delivery Time Window
              </label>
              <select
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-2 border-[#0F3329]/30 bg-white font-outfit text-xs font-extrabold uppercase text-[#0F3329]"
              >
                <option value="8:00 AM - 9:00 AM">8:00 AM - 9:00 AM (Breakfast Slot)</option>
                <option value="12:00 PM - 1:00 PM">12:00 PM - 1:00 PM (Lunch Slot 1)</option>
                <option value="1:00 PM - 2:00 PM">1:00 PM - 2:00 PM (Lunch Slot 2)</option>
                <option value="7:30 PM - 8:30 PM">7:30 PM - 8:30 PM (Dinner Slot)</option>
              </select>
            </div>
          </div>

          {/* DAYS SELECTOR */}
          <div className="space-y-2">
            <label className="font-outfit text-xs font-black uppercase text-[#0F3329] block">
              3. Weekly Delivery Days (Select Mon - Sun)
            </label>
            <div className="flex flex-wrap gap-2">
              {allDays.map((d) => {
                const active = deliveryDays.includes(d.code);
                return (
                  <button
                    key={d.code}
                    type="button"
                    onClick={() => toggleDay(d.code)}
                    className={`w-12 h-12 rounded-2xl border-2 font-outfit text-xs font-black uppercase flex items-center justify-center transition-all ${
                      active
                        ? "bg-[#0F3329] text-[#E5A00D] border-[#0F3329] shadow-sm"
                        : "bg-white text-[#0F3329]/60 border-[#0F3329]/20"
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* PAUSE RULES OPTION */}
          <div className="p-4 rounded-2xl bg-white border border-[#0F3329]/20 space-y-2">
            <label className="font-outfit text-xs font-black uppercase text-[#0F3329] block">
              4. Pause & Skip Guarantee Policy
            </label>
            <p className="font-sans text-xs text-[#0F3329]/80">
              You can pause your subscription or skip individual meal days at any time from your dashboard with 1-click. Unconsumed meals automatically roll over to your wallet balance.
            </p>
          </div>
        </div>
      )}

      {/* STEP 4: ADDRESS SELECTION */}
      {currentStep === 4 && (
        <div className="bg-[#FFF8EE] border-2 border-[#0F3329] rounded-3xl p-6 sm:p-8 space-y-6 animate-in fade-in">
          <div className="space-y-1">
            <h2 className="font-outfit font-black text-xl sm:text-2xl uppercase tracking-tight text-[#0F3329]">
              SELECT DELIVERY ADDRESS & MAP PIN
            </h2>
            <p className="font-sans text-xs text-[#0F3329]/70">
              A pinned map location is mandatory to ensure accurate insulated doorstep delivery.
            </p>
          </div>

          <AddressSelector
            selectedAddressId={selectedAddress?.id || null}
            onSelectAddress={(addr) => {
              setSelectedAddress(addr);
              if (!addr.latitude || !addr.longitude) {
                setShowBlockingPinModal(true);
              }
            }}
            showBlockingPinModal={showBlockingPinModal}
            onCloseBlockingPinModal={() => setShowBlockingPinModal(false)}
          />
        </div>
      )}

      {/* STEP 5: PAYMENT & BILLING RECAP */}
      {currentStep === 5 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-in fade-in">
          <div className="lg:col-span-2 space-y-6">
            {/* PLAN & PREFERENCES RECAP */}
            <div className="bg-[#FFF8EE] border-2 border-[#0F3329] rounded-3xl p-6 space-y-4">
              <h3 className="font-outfit font-black text-sm uppercase text-[#0F3329] border-b border-[#0F3329]/15 pb-3">
                Subscription Order Summary
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-[#0F3329]/15">
                  <span className="font-outfit text-[10px] font-black uppercase text-[#0F3329]/60 block">
                    SELECTED PLAN
                  </span>
                  <span className="font-outfit font-black text-sm text-[#0F3329]">
                    {selectedPlan?.name}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#0F3329]/15">
                  <span className="font-outfit text-[10px] font-black uppercase text-[#0F3329]/60 block">
                    DURATION
                  </span>
                  <span className="font-outfit font-black text-sm text-[#0F3329]">
                    {duration}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#0F3329]/15">
                  <span className="font-outfit text-[10px] font-black uppercase text-[#0F3329]/60 block">
                    DIET PREFERENCE
                  </span>
                  <span className="font-outfit font-black text-sm text-[#0F3329]">
                    {dietaryPref}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#0F3329]/15">
                  <span className="font-outfit text-[10px] font-black uppercase text-[#0F3329]/60 block">
                    START DATE
                  </span>
                  <span className="font-outfit font-black text-sm text-[#0F3329]">
                    {startDate}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#0F3329]/15">
                  <span className="font-outfit text-[10px] font-black uppercase text-[#0F3329]/60 block">
                    DELIVERY DAYS
                  </span>
                  <span className="font-outfit font-black text-sm text-[#0F3329]">
                    {deliveryDays.join(", ")}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#0F3329]/15">
                  <span className="font-outfit text-[10px] font-black uppercase text-[#0F3329]/60 block">
                    TIME SLOT
                  </span>
                  <span className="font-outfit font-black text-sm text-[#0F3329]">
                    {preferredTime}
                  </span>
                </div>
              </div>
            </div>

            {/* PAYMENT METHOD SELECTOR */}
            <div className="bg-[#FFF8EE] border-2 border-[#0F3329] rounded-3xl p-6 space-y-4">
              <h3 className="font-outfit font-black text-sm uppercase text-[#0F3329]">
                Choose Payment Method
              </h3>
              <PaymentMethodSelector
                selectedMethod={paymentMethod}
                onSelectMethod={(m) => setPaymentMethod(m)}
              />
            </div>
          </div>

          <div className="space-y-6">
            <PriceSummary
              subtotal={calculatedPrice}
              deliveryFee={0}
              discount={0}
              total={calculatedPrice}
              title="Subscription Summary"
              isSubscription={true}
            />

            <button
              type="button"
              onClick={handleStepSubmit}
              disabled={submitting}
              className="w-full py-4 rounded-2xl bg-[#0F3329] text-[#f5e3cd] font-outfit font-black text-sm uppercase tracking-wider hover:bg-[#1B4D3E] transition-all flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] disabled:opacity-40"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#E5A00D]" />
                  <span>Activating Subscription...</span>
                </>
              ) : (
                <>
                  <span>Pay & Activate Subscription</span>
                  <ArrowRight className="w-4 h-4 text-[#E5A00D]" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* FOOTER ACTION NAVIGATION */}
      {currentStep < 5 && (
        <div className="flex items-center justify-between pt-4 border-t-2 border-[#0F3329]/15">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="px-6 py-3 rounded-2xl border-2 border-[#0F3329] text-[#0F3329] font-outfit font-bold text-xs uppercase flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={handleStepSubmit}
            className="px-8 py-3.5 rounded-2xl bg-[#0F3329] text-[#f5e3cd] font-outfit font-black text-xs uppercase tracking-wider hover:bg-[#1B4D3E] transition-all flex items-center gap-2 shadow-lg"
          >
            <span>Continue to Step {currentStep + 1}</span>
            <ArrowRight className="w-4 h-4 text-[#E5A00D]" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function SubscriptionCustomiserPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto p-12 text-center text-[#0F3329] font-outfit font-bold uppercase">
        Loading Subscription Customizer...
      </div>
    }>
      <SubscriptionCustomiserContent />
    </Suspense>
  );
}
