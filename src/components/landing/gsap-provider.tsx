"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function useGsapAnimations() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    gsap.registerPlugin(ScrollTrigger);

    // Hero 3D Bowl Parallax Scale & Float on Scroll (Desktop)
    const heroDish = document.querySelector(".gsap-hero-dish");
    if (heroDish) {
      gsap.to(heroDish, {
        y: 80,
        scale: 1.15,
        rotate: 8,
        ease: "none",
        scrollTrigger: {
          trigger: "#hero",
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });
    }

    // Hero Sequential Entrance Timeline: 1. "THE", 2. Dish, 3. "BOWL"
    const tl = gsap.timeline({ defaults: { ease: "back.out(1.5)" } });

    tl.fromTo(
      ".gsap-pop-the",
      { y: -35, opacity: 0, scale: 0.85 },
      { y: 0, opacity: 1, scale: 1, duration: 0.65 }
    )
      .fromTo(
        ".gsap-dish-entry",
        { y: 40, opacity: 0, scale: 0.7, rotate: -15 },
        { y: 0, opacity: 1, scale: 1, rotate: 0, duration: 0.75, ease: "back.out(1.8)" },
        "-=0.2"
      )
      .fromTo(
        ".gsap-pop-bowl",
        { y: 35, opacity: 0, scale: 0.85 },
        { y: 0, opacity: 1, scale: 1, duration: 0.65 },
        "-=0.3"
      )
      .fromTo(
        ".gsap-pop",
        { y: 30, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.08 },
        "-=0.3"
      );

    // Parallax Drift for Floating Badge Labels
    const floatBadges = document.querySelectorAll(".gsap-float");
    floatBadges.forEach((badge, idx) => {
      gsap.to(badge, {
        y: idx % 2 === 0 ? -40 : 40,
        rotate: idx % 2 === 0 ? 5 : -5,
        ease: "none",
        scrollTrigger: {
          trigger: "#hero",
          start: "top top",
          end: "bottom top",
          scrub: 1.5,
        },
      });
    });

    // Scroll Trigger Reveal Elements
    const revealElements = document.querySelectorAll(".gsap-reveal");
    revealElements.forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 50, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            toggleActions: "play none none reverse",
          },
        }
      );
    });
  }, []);
}
