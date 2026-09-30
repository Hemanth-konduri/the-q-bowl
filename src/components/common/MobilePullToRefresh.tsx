"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowDown } from "lucide-react";

const PULL_THRESHOLD = 75; // Distance in px to trigger refresh
const MAX_PULL = 110; // Max visual displacement

export default function MobilePullToRefresh({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setPullDistance(55);

    try {
      // Revalidates Server Components / current page data
      router.refresh();
      // Wait a short moment for smooth animation and network settle
      await new Promise((resolve) => setTimeout(resolve, 800));
    } catch {
      // fallback to full reload if router.refresh fails
      window.location.reload();
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  }, [router]);

  useEffect(() => {
    // Only bind on touch-capable mobile/tablet devices
    const isTouchDevice =
      typeof window !== "undefined" &&
      ("ontouchstart" in window || navigator.maxTouchPoints > 0);

    if (!isTouchDevice) return;

    const onTouchStart = (e: TouchEvent) => {
      // Only initiate pull when user is scrolled to the very top
      if (window.scrollY <= 2 && !isRefreshing) {
        startYRef.current = e.touches[0].clientY;
        isPullingRef.current = true;
      } else {
        isPullingRef.current = false;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isPullingRef.current || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startYRef.current;

      // If user is pulling down at the top
      if (diff > 0 && window.scrollY <= 2) {
        // Damping calculation for smooth rubber-band feeling
        const damping = 0.55;
        const distance = Math.min(diff * damping, MAX_PULL);
        setPullDistance(distance);

        // Prevent browser's default scroll bounce interference
        if (e.cancelable && distance > 10) {
          e.preventDefault();
        }
      } else {
        setPullDistance(0);
      }
    };

    const onTouchEnd = () => {
      if (!isPullingRef.current || isRefreshing) return;
      isPullingRef.current = false;

      if (pullDistance >= PULL_THRESHOLD) {
        handleRefresh();
      } else {
        // Snap back
        setPullDistance(0);
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [pullDistance, isRefreshing, handleRefresh]);

  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const isReadyToTrigger = pullDistance >= PULL_THRESHOLD;

  return (
    <>
      {/* Pull down visual indicator for mobile */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none md:hidden transition-transform duration-100 ease-out"
          style={{
            transform: `translateY(${Math.max(12, pullDistance - 40)}px)`,
          }}
        >
          <div
            className={`flex items-center justify-center w-11 h-11 rounded-full shadow-lg border backdrop-blur-md transition-all duration-200 ${
              isRefreshing || isReadyToTrigger
                ? "bg-[#1B4D3E] text-white border-[#1B4D3E]/20 scale-105"
                : "bg-white/95 text-neutral-800 border-neutral-200 shadow-md"
            }`}
          >
            {isRefreshing ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#E5A00D]" />
            ) : (
              <ArrowDown
                className="w-5 h-5 transition-transform duration-200"
                style={{
                  transform: `rotate(${progress * 180}deg)`,
                  opacity: Math.max(0.4, progress),
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Main Content with smooth spring transform during active pull */}
      <div
        className="min-h-full flex flex-col w-full transition-transform duration-150 ease-out"
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance * 0.4}px)` : "none",
        }}
      >
        {children}
      </div>
    </>
  );
}
