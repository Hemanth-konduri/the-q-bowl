import type { ReactNode } from "react";

const steps = ["Account", "Identity Verification"];

export function AuthShell({
  eyebrow,
  title,
  description,
  step,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  step?: number;
  children: ReactNode;
}) {
  return (
    <div className="w-full">
      <div className="mb-3 text-center sm:text-left">
        <span className="inline-block rounded-full bg-[#E5A00D]/20 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#000000]">
          {eyebrow}
        </span>
        <h1 className="mt-1.5 font-outfit text-3xl font-black tracking-tight text-black sm:text-4xl">
          {title}
        </h1>
        <p className="mt-1 text-xs leading-relaxed text-black/70">
          {description}
        </p>
      </div>

      {step ? (
        <div className="mb-3 flex items-center justify-center gap-2 border-y border-black/15 py-2 sm:justify-start">
          {steps.map((label, index) => {
            const active = index + 1 <= step;
            return (
              <div key={label} className="flex items-center gap-1.5">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-black transition-all ${
                    active
                      ? "bg-black text-[#f5e3cd] shadow-[1.5px_1.5px_0px_#E5A00D]"
                      : "border border-black/30 text-black/40"
                  }`}
                >
                  {index + 1}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    active ? "text-black" : "text-black/40"
                  }`}
                >
                  {label}
                </span>
                {index < steps.length - 1 && (
                  <span className="mx-1 h-0.5 w-4 bg-black/20" />
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="w-full">{children}</div>
    </div>
  );
}

export const fieldClassName =
  "mt-1 w-full rounded-xl border-2 border-black bg-[#FFF8EE]/95 px-3.5 py-2.5 text-xs font-semibold text-black placeholder:text-black/40 outline-none transition-all duration-200 focus:bg-[#FFF8EE] focus:border-[#E5A00D] focus:shadow-[2px_2px_0px_#000] focus:ring-0";

export const primaryButtonClassName =
  "group relative flex w-full items-center justify-center gap-2 rounded-xl border-2 border-black bg-black px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#f5e3cd] shadow-[3px_3px_0px_#E5A00D] transition-all duration-200 hover:bg-[#E5A00D] hover:text-black hover:shadow-[3px_3px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:opacity-50";


