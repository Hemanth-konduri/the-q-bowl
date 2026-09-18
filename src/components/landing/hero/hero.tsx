"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import biryaniImg from "../../../../public/q_bowl_hero_pristine.png";

export default function Hero() {
  return (
    <section
      data-nav-dark="false"
      id="hero"
      className="
        relative min-h-[100dvh] md:h-screen w-full
        flex flex-col
        items-center justify-between
        bg-[#f5e3cd]
        overflow-hidden
        px-4 sm:px-8
        pt-[68px] sm:pt-[76px] md:pt-[5vw]
        pb-6 md:pb-4
      "
    >
      {/* =========================================================
          DESKTOP 3D BIRYANI DISH (CENTERPIECE)
          ========================================================= */}
      <div
        className="
          gsap-hero-dish
          hidden md:flex
          absolute
          z-10
          pointer-events-none
          items-center justify-center

          md:w-[48vw]
          md:h-[48vw]

          lg:w-[44vw]
          lg:h-[44vw]

          md:max-w-[650px]
          md:max-h-[650px]

          md:left-[47%]
          md:top-[47%]

          -translate-x-1/2
          -translate-y-1/2
        "
      >
        <Image
          src={biryaniImg}
          alt="Q1 Bowl Artisan Hyderabadi Dum Biryani"
          priority
          className="
            w-full
            h-full
            object-contain
            drop-shadow-[0_35px_55px_rgba(0,0,0,0.5)]
          "
        />
      </div>

      {/* =========================================================
          DESKTOP MAIN HEADLINE (THE / BOWL + STICKERS)
          ========================================================= */}
      <div
        className="
          hidden md:block
          relative
          z-20
          w-full
          max-w-[1600px]
          mx-auto
          md:h-[45vh]
          md:min-h-[360px]
        "
      >
        {/* DESKTOP LEFT STICKER: SMASHED FRESH */}
        <p
          className="
            absolute
            z-30
            top-[28%]
            left-[4%]
            text-[#E5A00D]
            font-modak
            text-4xl
            leading-none
            text-center
            uppercase
            rotate-[-10deg]
            text-stroke-small sm:text-stroke-180
            drop-shadow-md
            select-none
          "
        >
          SMASHED
          <br />
          FRESH
        </p>

        {/* DESKTOP RIGHT STICKER: BOLD FLAVOR */}
        <p
          className="
            absolute
            z-30
            top-[38%]
            right-[3%]
            text-[#E5A00D]
            font-modak
            text-4xl
            leading-none
            text-center
            uppercase
            rotate-[10deg]
            text-stroke-small sm:text-stroke-180
            drop-shadow-md
            select-none
          "
        >
          BOLD
          <br />
          FLAVOR
        </p>

        {/* DESKTOP THE / BOWL DISPLAY TEXT */}
        <h1
          className="
            absolute
            inset-0
            font-mouse-memoirs
            text-[25vw]
            leading-[0.72]
            text-black
            text-stroke-small sm:text-stroke-180
            uppercase
            tracking-tight
            select-none
          "
        >
          <span className="absolute left-[4%] top-[8%]">THE</span>
          <span className="absolute right-[0%] top-[7%]">BOWL</span>
        </h1>
      </div>

      {/* =========================================================
          MOBILE HERO SECTION ("THE" -> BIG BIRYANI -> "BOWL")
          ========================================================= */}
      <div className="md:hidden relative z-20 w-full flex-1 flex flex-col items-center justify-center pt-2">

        {/* TOP: "THE" + STICKER */}
        <div className="relative w-full text-center flex items-center justify-center">
          <p
            className="
              gsap-float
              absolute
              z-30
              left-2
              top-1/2
              -translate-y-1/2
              text-[#E5A00D]
              font-modak
              text-lg
              leading-none
              uppercase
              rotate-[-12deg]
              text-stroke-small
              drop-shadow-md
              select-none
            "
          >
            SMASHED
            <br />
            FRESH
          </p>

          <h1
            className="
              gsap-pop-the
              font-mouse-memoirs
              text-[38vw]
              leading-[0.7]
              text-black
              text-stroke-small
              uppercase
              tracking-tight
              select-none
            "
          >
            <span className="animate-title-the">THE</span>
          </h1>

          <p
            className="
              gsap-float
              absolute
              z-30
              right-2
              top-1/2
              -translate-y-1/2
              text-[#E5A00D]
              font-modak
              text-lg
              leading-none
              uppercase
              rotate-[12deg]
              text-stroke-small
              drop-shadow-md
              select-none
            "
          >
            BOLD
            <br />
            FLAVOR
          </p>
        </div>

        {/* MIDDLE: ENLARGED BIRYANI IMAGE WITH AMBIENT GLOW */}
        <div
          className="
            gsap-hero-dish
            gsap-dish-entry
            relative
            z-10
            w-[88vw]
            h-[88vw]
            max-w-[380px]
            max-h-[380px]
            mt-[5vw]
            mb-[-8vw]
            translate-y-11
            mx-auto
            flex items-center justify-center
            pointer-events-none
          "
        >
          {/* Subtle Warm Amber Glow Halo */}
          <div className="absolute w-[75%] h-[75%] rounded-full bg-[#E5A00D]/25 blur-2xl animate-warm-glow pointer-events-none" />

          <Image
            src={biryaniImg}
            alt="Q1 Bowl Artisan Hyderabadi Dum Biryani"
            priority
            className="
              relative
              z-10
              w-full
              h-full
              object-contain
              animate-dish-float-3d
            "
          />
        </div>

        {/* BOTTOM: "BOWL" */}
        <div className="relative w-full text-center">
          <h1
            className="
              gsap-pop-bowl
              font-mouse-memoirs
              text-[38vw]
              leading-[0.7]
              text-black
              text-stroke-small
              uppercase
              tracking-tight
              select-none
            "
          >
            <span className="animate-title-bowl">BOWL</span>
          </h1>
        </div>
      </div>

      {/* =========================================================
          DESKTOP BACKGROUND Q1 BOWL TEXT
          ========================================================= */}
      <div
        className="
          hidden md:block
          absolute
          z-30
          left-1/2
          -translate-x-1/2
          bottom-[8vh]
          w-full
          text-center
          pointer-events-none
        "
      >
        <p
          className="
            gsap-pop
            font-modak
            text-[13vw]
            leading-none
            uppercase
            text-[#E5A00D]
            text-stroke-small sm:text-stroke-180
            select-none
            whitespace-nowrap
          "
        >
          Q1 BOWL
        </p>
      </div>

      {/* =========================================================
          BOTTOM CTA & DESCRIPTIONS
          ========================================================= */}
      <div
        className="
          relative md:absolute
          z-40
          md:bottom-[1vh]
          md:left-1/2
          md:-translate-x-1/2
          w-full
          max-w-7xl
          px-2 sm:px-8
          flex
          flex-col
          md:flex-row
          items-center
          md:items-end
          justify-between
          gap-3 md:gap-5
        "
      >
        {/* LEFT DESCRIPTION (DESKTOP) */}
        <div
          className="
            hidden md:block
            md:w-[30%]
            text-center
            md:text-left
          "
        >
          <p
            className="
              font-mouse-memoirs
              text-xl
              sm:text-2xl
              leading-snug
              text-black
              uppercase
            "
          >
            Slow-cooked in our cloud kitchen, our prime meal bowls
            lock in ultimate juiciness under a caramelized finish.
          </p>
        </div>

        {/* CTA BUTTONS (RESPONSIVE) */}
        <div
          className="
            flex
            items-center
            justify-center
            gap-2 sm:gap-3
            shrink-0
            w-full sm:w-auto
          "
        >
          <a
            href="#menu"
            className="
              flex-1 sm:flex-initial
              px-6 sm:px-6
              py-2.5 sm:py-2.5
              rounded-full

              font-mouse-memoirs
              text-2xl sm:text-2xl
              uppercase
              tracking-wide

              text-[#f5e3cd]
              bg-black

              border-2
              border-black

              hover:bg-[#E5A00D]
              hover:text-black

              transition-all
              transform
              hover:scale-105
              active:scale-95

              shadow-[3px_3px_0px_#000]

              flex
              items-center
              justify-center
              gap-1.5 sm:gap-2

              whitespace-nowrap
            "
          >
            <span>Browse Menu</span>
            <ArrowRight className="w-5 h-5" />
          </a>

          <a
            href="#subscriptions"
            className="
              flex-1 sm:flex-initial
              px-6 sm:px-6
              py-2.5 sm:py-2.5
              rounded-full

              font-mouse-memoirs
              text-2xl sm:text-2xl
              uppercase
              tracking-wide

              text-black
              bg-[#FFF8EE]

              border-2
              border-black

              hover:bg-black
              hover:text-white

              transition-all
              transform
              hover:scale-105
              active:scale-95

              shadow-[3px_3px_0px_#000000]

              text-center
              whitespace-nowrap
            "
          >
            Subscriptions
          </a>
        </div>

        {/* RIGHT DESCRIPTION (DESKTOP) */}
        <div
          className="
            hidden md:block
            md:w-[30%]
            text-center
            md:text-right
          "
        >
          <p
            className="
              font-mouse-memoirs
              text-xl
              sm:text-2xl
              leading-snug
              text-black
              uppercase
            "
          >
            Topped with signature marinades and authentic Hyderabadi
            spices crafted to satisfy your cravings daily.
          </p>
        </div>
      </div>
    </section>
  );
}