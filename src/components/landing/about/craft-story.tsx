"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import biryaniImg from "../../../../public/biryani.png";
import paneerImg from "../../../../public/paneer.png";
import heroDish from "../../../../public/hero_dish.png"

gsap.registerPlugin(ScrollTrigger);

export default function CraftStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);
  const card3Ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const cards = cardsRef.current;
    const card1 = card1Ref.current;
    const card2 = card2Ref.current;
    const card3 = card3Ref.current;

    if (!section || !cards || !card1 || !card2 || !card3) return;

    const ctx = gsap.context(() => {
      // ------------------------------------------
      // HEADER TEXT REVEALS
      // ------------------------------------------
      const textElements = section.querySelectorAll(".gsap-reveal");
      if (textElements.length > 0) {
        gsap.fromTo(
          textElements,
          {
            opacity: 0,
            y: 40,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            stagger: 0.15,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 80%",
              once: true,
            },
          }
        );
      }

      const mm = gsap.matchMedia();

      // ------------------------------------------
      // DESKTOP ANIMATION
      // ------------------------------------------
      mm.add("(min-width: 768px)", () => {
        // Initial setup for cards
        gsap.set(card1, {
          x: 0,
          y: 20,
          rotation: -8,
          scale: 0.96,
          opacity: 0,
        });

        gsap.set(card2, {
          x: 0,
          y: -15,
          rotation: -2,
          scale: 1,
          opacity: 0,
        });

        gsap.set(card3, {
          x: 0,
          y: 15,
          rotation: 9,
          scale: 0.96,
          opacity: 0,
        });

        // Entrance animation
        gsap.to([card1, card2, card3], {
          opacity: 1,
          duration: 1,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: cards,
            start: "top 85%",
            once: true,
          },
        });

        // Main smooth scroll spread animation
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top 70%",
            end: "bottom 20%",
            scrub: 1.4,
          },
        });

        tl.to(
          card1,
          {
            x: "-4vw",
            y: 30,
            rotation: -10,
            scale: 1.02,
            ease: "none",
          },
          0
        )
          .to(
            card2,
            {
              x: "0vw",
              y: -10,
              rotation: 0,
              scale: 1.06,
              ease: "none",
            },
            0
          )
          .to(
            card3,
            {
              x: "4vw",
              y: 25,
              rotation: 11,
              scale: 1.02,
              ease: "none",
            },
            0
          );

        // ------------------------------------------
        // SUBTLE FLOATING LEVITATION MOTION
        // ------------------------------------------
        gsap.to(card1, {
          y: "+=12",
          duration: 3.2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });

        gsap.to(card2, {
          y: "-=14",
          duration: 3.8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: 0.4,
        });

        gsap.to(card3, {
          y: "+=12",
          duration: 3.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: 0.8,
        });

        // ------------------------------------------
        // HOVER EFFECT
        // ------------------------------------------
        [card1, card2, card3].forEach((card) => {
          const image = card.querySelector(".story-image");
          if (!image) return;

          card.addEventListener("mouseenter", () => {
            gsap.to(card, {
              scale: 1.06,
              y: -12,
              duration: 0.4,
              ease: "power3.out",
              overwrite: "auto",
            });

            gsap.to(image, {
              scale: 1.08,
              duration: 0.6,
              ease: "power3.out",
              overwrite: "auto",
            });
          });

          card.addEventListener("mouseleave", () => {
            gsap.to(card, {
              scale: 1,
              duration: 0.5,
              ease: "power3.out",
              overwrite: "auto",
            });

            gsap.to(image, {
              scale: 1,
              duration: 0.6,
              ease: "power3.out",
              overwrite: "auto",
            });
          });
        });
      });

      // ------------------------------------------
      // MOBILE ANIMATION
      // ------------------------------------------
      mm.add("(max-width: 767px)", () => {
        gsap.fromTo(
          [card1, card2, card3],
          {
            opacity: 0,
            y: 40,
            scale: 0.95,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.9,
            stagger: 0.15,
            ease: "power3.out",
            scrollTrigger: {
              trigger: cards,
              start: "top 85%",
              once: true,
            },
          }
        );
      });

      return () => {
        mm.revert();
      };
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="about"
      data-nav-dark="false"
      className="relative z-20 overflow-hidden bg-[#f5e3cd] py-24 sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* ----------------------------------------
            SECTION INTRO
        ----------------------------------------- */}

        <div className="text-center">

          <p className="gsap-reveal inline-block rounded-full border border-black/20 bg-[#E5A00D]/20 px-4 py-1 font-mouse-memoirs text-2xl uppercase tracking-widest text-black sm:text-3xl">
            Artisan Cloud Kitchen
          </p>

          <h2 className="gsap-reveal mx-auto mt-6 max-w-5xl font-outfit text-4xl font-extrabold uppercase leading-none tracking-tight text-black sm:text-6xl lg:text-7xl">
            Juicy, Cheesy &amp; Fully Loaded Bowls
          </h2>

          <p className="gsap-reveal mx-auto mt-6 max-w-3xl font-sans text-base font-normal leading-relaxed text-black/80 sm:text-xl">
            Q1 Bowl delivers gourmet chef-marinated meals cooked fresh daily
            with zero preservatives. Choose single orders or build a flexible
            subscription plan on your schedule.
          </p>

          <div className="gsap-reveal pt-7 pb-16">
            <Link
              href="/login"
              className="inline-flex items-center gap-3 rounded-full border-2 border-black bg-black px-8 py-4 font-outfit text-xl font-bold uppercase tracking-wider text-white shadow-[4px_4px_0px_#000000] transition-all hover:scale-105 hover:bg-[#E5A00D] hover:text-black"
            >
              <span>Order Now</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

        </div>


        {/* ----------------------------------------
            FLOATING IMAGE SHOWCASE
        ----------------------------------------- */}

        <div
          ref={cardsRef}
          className="
            relative
            mx-auto
            h-[520px]
            w-full
            max-w-[1250px]
            sm:h-[580px]
            lg:h-[620px]
          "
        >

          {/* --------------------------------------
              CARD 1
          --------------------------------------- */}

          <div
            ref={card1Ref}
            className="
              absolute
              left-[2%]
              top-[8%]
              z-10
              w-[30%]
              will-change-transform
            "
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border-4 border-black/10 bg-white shadow-[0_25px_60px_rgba(0,0,0,0.18)]">

              <Image
                src={heroDish}
                alt="Signature Protein Bowl"
                fill
                className="story-image object-cover"
                sizes="(max-width: 768px) 90vw, 30vw"
              />

            </div>

            <p className="mt-5 text-center font-outfit text-xl font-bold text-black sm:text-2xl">
              Signature Protein Bowl
            </p>
          </div>


          {/* --------------------------------------
              CARD 2 — CENTER
          --------------------------------------- */}

          <div
            ref={card2Ref}
            className="
              absolute
              left-1/2
              top-[3%]
              z-20
              w-[32%]
              -translate-x-1/2
              will-change-transform
            "
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border-4 border-[#E5A00D] bg-white shadow-[0_30px_70px_rgba(0,0,0,0.22)]">

              <Image
                src={biryaniImg}
                alt="Hyderabadi Dum Biryani"
                fill
                className="story-image object-cover"
                sizes="(max-width: 768px) 90vw, 32vw"
              />

            </div>

            <p className="mt-5 text-center font-outfit text-xl font-bold text-black sm:text-2xl">
              Hyderabadi Dum Biryani
            </p>
          </div>


          {/* --------------------------------------
              CARD 3
          --------------------------------------- */}

          <div
            ref={card3Ref}
            className="
              absolute
              right-[2%]
              top-[8%]
              z-10
              w-[30%]
              will-change-transform
            "
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border-4  bg-white shadow-[0_25px_60px_rgba(0,0,0,0.18)]">

              <Image
                src={paneerImg}
                alt="Royal Paneer Tikka Thali"
                fill
                className="story-image object-cover"
                sizes="(max-width: 768px) 90vw, 30vw"
              />

            </div>

            <p className="mt-5 text-center font-outfit text-xl font-bold text-black sm:text-2xl">
              Royal Paneer Tikka Thali
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}