"use client";

import { useEffect, useState } from "react";

export default function Preloader() {
  const [progress, setProgress] = useState(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setHidden(true), 400);
          return 100;
        }
        return prev + 12;
      });
    }, 80);

    return () => clearInterval(interval);
  }, []);

  if (hidden) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] bg-[#0F3329] flex flex-col items-center justify-center transition-all duration-700 ${
        progress >= 100 ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Central Animated Badge */}
      <div className="relative text-center space-y-4 max-w-md px-6">
        <h2 className="font-modak text-6xl text-[#E5A00D] tracking-wider uppercase text-stroke-small text-[#0F3329] animate-bounce">
          Q1 BOWL
        </h2>
        <p className="font-mouse-memoirs text-2xl text-[#f5e3cd] tracking-widest uppercase">
          PREPARING ARTISAN KITCHEN...
        </p>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden border border-[#E5A00D]/40 p-0.5 mt-4">
          <div
            className="h-full bg-[#E5A00D] rounded-full transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
