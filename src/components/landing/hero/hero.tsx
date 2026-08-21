"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import biryaniImg from "../../../../public/dum_biryani_hero.png";

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
        pt-[16vw] sm:pt-[10vw] md:pt-[5vw]
        pb-6 md:pb-4
      "
    >

      {/* =========================================================
          3D BIRYANI DISH (CENTERPIECE)
          ========================================================= */}

      <div
        className="
          gsap-hero-dish
          absolute
          z-10
          pointer-events-none
          flex items-center justify-center

          w-[82vw]
          h-[82vw]

          sm:w-[64vw]
          sm:h-[64vw]

          md:w-[52vw]
          md:h-[52vw]

          lg:w-[48vw]
          lg:h-[48vw]

          max-w-[340px] sm:max-w-[500px] md:max-w-[720px]
          max-h-[340px] sm:max-h-[500px] md:max-h-[720px]

          left-1/2
          top-[44%] sm:top-[46%] md:top-[47%]

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
            drop-shadow-[0_20px_35px_rgba(0,0,0,0.4)]
            md:drop-shadow-[0_35px_55px_rgba(0,0,0,0.5)]
          "
        />
      </div>


      {/* =========================================================
          MAIN HEADLINE (THE / BOWL + STICKERS)
          ========================================================= */}

      <div
        className="
          relative
          z-20
          w-full
          max-w-[1600px]
          mx-auto
          h-[35vh] sm:h-[40vh] md:h-[45vh]
          min-h-[220px] sm:min-h-[300px] md:min-h-[360px]
        "
      >

        {/* -------------------------
            LEFT STICKER: SMASHED FRESH
        -------------------------- */}

        <p
          className="
            gsap-float
            absolute
            z-30

            top-[18%] sm:top-[28%] md:top-[30%]
            left-[1%] sm:left-[4%] md:left-[6%]

            text-[#E5A00D]
            font-modak

            text-xl sm:text-2xl md:text-4xl

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


        {/* -------------------------
            RIGHT STICKER: BOLD FLAVOR
        -------------------------- */}

        <p
          className="
            gsap-float
            absolute
            z-30

            top-[22%] sm:top-[36%] md:top-[42%]
            right-[1%] sm:right-[3%] md:right-[5%]

            text-[#E5A00D]
            font-modak

            text-xl sm:text-2xl md:text-4xl

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


        {/* =====================================================
            THE / BOWL DISPLAY TEXT
            ===================================================== */}

        <h1
          className="
            gsap-pop
            absolute
            inset-0

            font-mouse-memoirs

            text-[32vw]
            sm:text-[27vw]
            md:text-[25vw]

            leading-[0.72]

            text-black
            text-stroke-small sm:text-stroke-180

            uppercase
            tracking-tight

            select-none
          "
        >

          {/* THE - pushed left */}
          <span
            className="
              absolute
              left-[1%]
              sm:left-[3%]
              md:left-[4%]

              top-[4%] sm:top-[6%] md:top-[8%]
            "
          >
            THE
          </span>


          {/* BOWL - pushed right */}
          <span
            className="
              absolute

              right-[0%]
              sm:right-[0%]
              md:right-[1%]

              top-[3%] sm:top-[5%] md:top-[7%]
            "
          >
            BOWL
          </span>

        </h1>

      </div>


      {/* =========================================================
          BACKGROUND Q1 BOWL TEXT
          ========================================================= */}

      <div
        className="
          absolute
          z-30

          left-1/2
          -translate-x-1/2

          bottom-[11vh] sm:bottom-[9vh] md:bottom-[8vh]

          w-full
          text-center

          pointer-events-none
        "
      >
        <p
          className="
            gsap-pop

            font-modak

            text-[18vw]
            sm:text-[15vw]
            md:text-[13vw]

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
          BOTTOM CONTENT (RESPONSIVE FOR MOBILE)
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
        {/* LEFT DESCRIPTION (HIDDEN ON SMALL MOBILE TO PREVENT OVERLAP) */}
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


        {/* CTA BUTTONS (STACKED/CENTERED ON MOBILE) */}
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
              px-5 sm:px-6
              py-2 sm:py-2.5
              rounded-full

              font-mouse-memoirs
              text-xl sm:text-2xl
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

              shadow-[3px_3px_0px_#000]

              flex
              items-center
              justify-center
              gap-1.5 sm:gap-2

              whitespace-nowrap
            "
          >
            <span>Browse Menu</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </a>

          <a
            href="#subscriptions"
            className="
              flex-1 sm:flex-initial
              px-5 sm:px-6
              py-2 sm:py-2.5
              rounded-full

              font-mouse-memoirs
              text-xl sm:text-2xl
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

              shadow-[3px_3px_0px_#000000]

              text-center
              whitespace-nowrap
            "
          >
            Subscriptions
          </a>
        </div>


        {/* RIGHT DESCRIPTION (HIDDEN ON SMALL MOBILE TO PREVENT OVERLAP) */}
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