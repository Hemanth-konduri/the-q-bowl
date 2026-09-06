"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface SubscriptionDraftState {
  currentStep: number;
  mealId?: string | null;
  packageId?: string | null;
  isCustomCredits?: boolean;
  customCredits?: number | null;
  mealCredits?: number;
  mealsPerDay?: number;
  mealTiming?: "LUNCH" | "DINNER" | "BOTH";
  startDate?: string;
  deliveryDays?: string[];
  preferredTime?: string;
  addressId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  subtotal?: number;
  discount?: number;
  totalAmount?: number;
}

const LOCAL_STORAGE_KEY = "qbowl_subscription_draft";

export function useSubscriptionDraft() {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingStateRef = useRef<SubscriptionDraftState | null>(null);

  // Monitor Network Connectivity
  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOffline(!navigator.onLine);

    const handleOnline = () => {
      setIsOffline(false);
      // Auto-sync pending local draft to server when connection returns
      if (pendingStateRef.current) {
        saveToServer(pendingStateRef.current);
      } else {
        const local = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (local) {
          try {
            const parsed = JSON.parse(local);
            saveToServer(parsed);
          } catch (e) {}
        }
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Save to Server
  const saveToServer = async (draftData: SubscriptionDraftState) => {
    try {
      setIsSaving(true);
      const res = await fetch("/api/user/subscriptions/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftData),
      });

      if (res.ok) {
        const data = await res.json();
        const savedTime = data.lastSavedAt ? new Date(data.lastSavedAt) : new Date();
        setLastSavedAt(savedTime);
        pendingStateRef.current = null;
      }
    } catch (error) {
      console.warn("Failed to sync draft to server, saved locally:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Save Draft (Local + Debounced Server Sync)
  const saveDraft = useCallback((draftData: SubscriptionDraftState) => {
    pendingStateRef.current = draftData;

    // 1. Synchronously save to localStorage
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
          ...draftData,
          savedAt: new Date().toISOString(),
        }));
        setLastSavedAt(new Date());
      } catch (e) {
        console.error("LocalStorage save error:", e);
      }
    }

    // 2. Debounced save to Server if online
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (navigator.onLine) {
      debounceTimerRef.current = setTimeout(() => {
        saveToServer(draftData);
      }, 600);
    }
  }, []);

  // Clear Draft
  const clearDraft = useCallback(async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
    pendingStateRef.current = null;
    setLastSavedAt(null);

    try {
      await fetch("/api/user/subscriptions/draft", { method: "DELETE" });
    } catch (e) {
      console.warn("Failed to delete server draft:", e);
    }
  }, []);

  // Fetch Active Draft from Server
  const fetchServerDraft = useCallback(async () => {
    try {
      const res = await fetch("/api/user/subscriptions/draft");
      if (res.ok) {
        const data = await res.json();
        if (data.hasDraft && data.draft) {
          return {
            draft: data.draft as SubscriptionDraftState,
            livePricing: data.livePricing,
          };
        }
      }
    } catch (e) {
      console.warn("Error fetching server draft:", e);
    }

    // Fallback to local storage
    if (typeof window !== "undefined") {
      const local = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (local) {
        try {
          const parsed = JSON.parse(local);
          return { draft: parsed as SubscriptionDraftState, livePricing: null };
        } catch (e) {}
      }
    }

    return null;
  }, []);

  return {
    saveDraft,
    clearDraft,
    fetchServerDraft,
    isSaving,
    isOffline,
    lastSavedAt,
  };
}
