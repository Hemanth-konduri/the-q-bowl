"use client";

import React from "react";
import { Plus, Minus, Trash2 } from "lucide-react";

interface QuantityStepperProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove?: () => void;
  min?: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

export default function QuantityStepper({
  quantity,
  onIncrease,
  onDecrease,
  onRemove,
  min = 0,
  max = 99,
  size = "md",
  disabled = false,
}: QuantityStepperProps) {
  const sizeClasses = {
    sm: "px-2 py-1 text-xs gap-1.5 rounded-lg",
    md: "px-3 py-1.5 text-sm gap-2.5 rounded-xl",
    lg: "px-4 py-2.5 text-base gap-3 rounded-2xl",
  };

  const buttonSizes = {
    sm: "w-5 h-5",
    md: "w-7 h-7",
    lg: "w-8 h-8",
  };

  return (
    <div
      className={`inline-flex items-center bg-[#FFF8EE] border-2 border-[#0F3329] font-outfit font-bold text-[#0F3329] transition-all shadow-sm ${sizeClasses[size]}`}
    >
      {quantity === 1 && onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className={`${buttonSizes[size]} flex items-center justify-center rounded-lg hover:bg-red-500 hover:text-white transition-colors text-red-700`}
          title="Remove item"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      ) : (
        <button
          type="button"
          onClick={onDecrease}
          disabled={disabled || quantity <= min}
          className={`${buttonSizes[size]} flex items-center justify-center rounded-lg hover:bg-[#0F3329] hover:text-[#f5e3cd] transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-inherit`}
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
      )}

      <span className="min-w-[1.25rem] text-center font-extrabold text-[#0F3329] select-none">
        {quantity}
      </span>

      <button
        type="button"
        onClick={onIncrease}
        disabled={disabled || quantity >= max}
        className={`${buttonSizes[size]} flex items-center justify-center rounded-lg hover:bg-[#0F3329] hover:text-[#f5e3cd] transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-inherit`}
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
