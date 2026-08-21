"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface JellyWaveProps {
  fillColor?: string; // Color of section below wave (bottom)
  bgColor?: string;   // Color of section above wave (top)
  flip?: boolean;     // Wave shape variation
  className?: string;
}

export default function JellyWave({
  fillColor = "#000000",
  bgColor = "#f5e3cd",
  flip = false,
  className = "",
}: JellyWaveProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current || !pathRef.current) return;

    gsap.registerPlugin(ScrollTrigger);

    // SVG paths pinned to top (Y=0)
    const pathsNormal = [
      "M 0 0 L 1000 0 L 1000 150 C 840 210, 670 70, 480 170 C 310 230, 140 90, 0 160 Z",
      "M 0 0 L 1000 0 L 1000 85 C 820 135, 620 40, 420 105 C 260 155, 120 55, 0 85 Z",
      "M 0 0 L 1000 0 L 1000 25 C 800 50, 600 15, 400 35 C 240 50, 100 15, 0 20 Z",
    ];

    const pathsFlipped = [
      "M 0 0 L 1000 0 L 1000 165 C 840 85, 650 185, 450 95 C 280 35, 120 145, 0 95 L 0 0 Z",
      "M 0 0 L 1000 0 L 1000 90 C 820 40, 620 110, 420 50 C 260 20, 120 80, 0 45 L 0 0 Z",
      "M 0 0 L 1000 0 L 1000 25 C 800 15, 600 40, 400 15 C 240 10, 100 20, 0 10 L 0 0 Z",
    ];

    const targetPaths = flip ? pathsFlipped : pathsNormal;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 95%",
          end: "bottom 25%",
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });

      tl.to(pathRef.current, {
        attr: { d: targetPaths[1] },
        ease: "none",
        duration: 1,
      }).to(pathRef.current, {
        attr: { d: targetPaths[2] },
        ease: "none",
        duration: 1,
      });
    }, containerRef);

    return () => ctx.revert();
  }, [flip]);

  // Geometric guarantee:
  // Top of box (actualPathFill) matches bgColor (section above wave)
  // Bottom of box (actualWrapperBg) matches fillColor (section below wave)
  const actualPathFill = bgColor;
  const actualWrapperBg = fillColor;

  return (
    <div
      ref={containerRef}
      className={`w-full overflow-hidden leading-none z-30 pointer-events-none relative -my-[1px] ${className}`}
      style={{ backgroundColor: actualWrapperBg }}
    >
      <svg
        className="block w-full h-[100px] sm:h-[160px] md:h-[220px]"
        viewBox="0 0 1000 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <path
          ref={pathRef}
          d={
            flip
              ? "M 0 0 L 1000 0 L 1000 165 C 840 85, 650 185, 450 95 C 280 35, 120 145, 0 95 L 0 0 Z"
              : "M 0 0 L 1000 0 L 1000 150 C 840 210, 670 70, 480 170 C 310 230, 140 90, 0 160 Z"
          }
          fill={actualPathFill}
          shapeRendering="geometricPrecision"
        />
      </svg>
    </div>
  );
}
