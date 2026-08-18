"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function useGsapAnimations() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    gsap.registerPlugin(ScrollTrigger);

    // Hero 3D Bowl Parallax Scale & Float on Scroll
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

    // Hero Text Stagger Pop Entrance
    gsap.fromTo(
      ".gsap-pop",
      { y: 50, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 1, ease: "back.out(1.4)", stagger: 0.12 }
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
