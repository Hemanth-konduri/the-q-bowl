"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Clock, Star } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
  isVeg: boolean;
  image: string;
  rating: number;
  calories: number;
  protein: string;
}

const TODAY_ITEMS: MenuItem[] = [
  {
    id: "1",
    name: "Signature Protein Harvest Bowl",
    price: 249,
    category: "Meals",
    mealType: "LUNCH",
    isVeg: false,
    image: "/hero_dish.png",
    rating: 4.9,
    calories: 540,
    protein: "38g",
  },
  {
    id: "2",
    name: "Hyderabadi Chicken Dum Biryani",
    price: 299,
    category: "Biryani",
    mealType: "LUNCH",
    isVeg: false,
    image: "/dum_biryani_hero.png",
    rating: 4.9,
    calories: 680,
    protein: "32g",
  },
  {
    id: "3",
    name: "Royal Paneer Tikka Deluxe Thali",
    price: 239,
    category: "Meals",
    mealType: "DINNER",
    isVeg: true,
    image: "/paneer.png",
    rating: 4.8,
    calories: 590,
    protein: "24g",
  },
  {
    id: "4",
    name: "South-Indian Super Millet Dosa Set",
    price: 149,
    category: "Breakfast",
    mealType: "BREAKFAST",
    isVeg: true,
    image: "/paneer.png",
    rating: 4.7,
    calories: 340,
    protein: "12g",
  },
];

const TOMORROW_ITEMS: MenuItem[] = [
  {
    id: "5",
    name: "Mediterranean Grilled Salmon Bowl",
    price: 349,
    category: "Meals",
    mealType: "LUNCH",
    isVeg: false,
    image: "/hero_dish.png",
    rating: 4.9,
    calories: 520,
    protein: "42g",
  },
  {
    id: "6",
    name: "Awadhi Mutton Dum Biryani",
    price: 389,
    category: "Biryani",
    mealType: "DINNER",
    isVeg: false,
    image: "/dum_biryani_hero.png",
    rating: 4.8,
    calories: 740,
    protein: "36g",
  },
  {
    id: "7",
    name: "Keto Broccoli & Cottage Cheese Steak",
    price: 269,
    category: "Meals",
    mealType: "DINNER",
    isVeg: true,
    image: "/paneer.png",
    rating: 4.7,
    calories: 410,
    protein: "28g",
  },
];

export default function DailyMenuPreview() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const [selectedDay, setSelectedDay] = useState<"today" | "tomorrow">(
    "today"
  );

  const [isChanging, setIsChanging] = useState(false);

  const items =
    selectedDay === "today" ? TODAY_ITEMS : TOMORROW_ITEMS;

  /*
  =====================================================
  INITIAL SCROLL ANIMATION
  =====================================================
  */

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) return;

    const ctx = gsap.context(() => {
      // Header
      gsap.fromTo(
        headerRef.current,
        {
          opacity: 0,
          y: 70,
        },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 75%",
            once: true,
          },
        }
      );

      // Controls
      gsap.fromTo(
        controlsRef.current,
        {
          opacity: 0,
          y: 40,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          delay: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 75%",
            once: true,
          },
        }
      );

      // Cards
      if (gridRef.current) {
        gsap.fromTo(
          gridRef.current.children,
          {
            opacity: 0,
            y: 70,
            scale: 0.96,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.9,
            stagger: 0.12,
            delay: 0.25,
            ease: "power3.out",
            scrollTrigger: {
              trigger: gridRef.current,
              start: "top 85%",
              once: true,
            },
          }
        );
      }
    }, section);

    return () => ctx.revert();
  }, []);

  /*
  =====================================================
  TODAY / TOMORROW TRANSITION
  =====================================================
  */

  const changeDay = (day: "today" | "tomorrow") => {
    if (day === selectedDay || isChanging) return;

    if (!gridRef.current) {
      setSelectedDay(day);
      return;
    }

    setIsChanging(true);

    gsap.to(gridRef.current.children, {
      opacity: 0,
      y: 25,
      scale: 0.97,
      duration: 0.25,
      stagger: 0.04,
      ease: "power2.in",
      onComplete: () => {
        setSelectedDay(day);
      },
    });
  };

  /*
  =====================================================
  ANIMATE NEW MENU ITEMS
  =====================================================
  */

  useEffect(() => {
    if (!isChanging || !gridRef.current) return;

    requestAnimationFrame(() => {
      gsap.fromTo(
        gridRef.current!.children,
        {
          opacity: 0,
          y: 30,
          scale: 0.97,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.55,
          stagger: 0.08,
          ease: "power3.out",
          onComplete: () => {
            setIsChanging(false);
          },
        }
      );
    });
  }, [selectedDay, isChanging]);

  return (
    <section
      ref={sectionRef}
      id="menu"
      data-nav-dark="true"
      className="
        relative
        bg-[#0F3329]
        text-[#f5e3cd]
        overflow-hidden
        pt-32
        pb-40
      "
    >
      {/* =================================================
          BACKGROUND GLOW
      ================================================= */}

      <div
        className="
          absolute
          pointer-events-none
          left-1/2
          top-[10%]
          -translate-x-1/2
          w-[850px]
          h-[650px]
          rounded-full
          bg-[#1B4D3E]
          blur-[110px]
          opacity-70
        "
      />

      <div
        className="
          absolute
          pointer-events-none
          left-1/2
          top-[15%]
          -translate-x-1/2
          w-[500px]
          h-[400px]
          rounded-full
          bg-[#E5A00D]/[0.035]
          blur-[100px]
        "
      />

      {/* =================================================
          CONTENT
      ================================================= */}

      <div
        className="
          relative
          z-10
          max-w-7xl
          mx-auto
          px-4
          sm:px-6
          lg:px-8
        "
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <div
          ref={headerRef}
          className="
            relative
            z-10
            text-center
            max-w-3xl
            mx-auto
            mb-16
          "
        >
          <span
            className="
              font-mouse-memoirs
              text-xl
              sm:text-2xl
              text-[#E5A00D]
              uppercase
              tracking-[0.25em]
              block
              mb-4
            "
          >
            DAILY CHANGING KITCHEN MENU
          </span>

          <h2
            className="
              font-outfit
              text-5xl
              sm:text-6xl
              lg:text-7xl
              font-extrabold
              text-[#f5e3cd]
              uppercase
              tracking-tight
              leading-[0.9]
            "
          >
            FRESH FROM
            <br />
            THE KITCHEN
          </h2>

          <p
            className="
              font-sans
              text-base
              sm:text-lg
              text-[#D8C4A9]
              mt-6
              max-w-2xl
              mx-auto
              leading-relaxed
            "
          >
            Fresh ingredients, chef-crafted recipes and bold flavors —
            prepared daily in our cloud kitchen.
          </p>
        </div>

        {/* =================================================
            CONTROLS
        ================================================= */}

        <div
          ref={controlsRef}
          className="
            relative
            z-20
            flex
            flex-col
            sm:flex-row
            items-center
            justify-between
            gap-6
            mb-16
          "
        >
          {/* DAY SWITCH */}

          <div
            className="
              relative
              flex
              items-center
              p-1
              rounded-full
              bg-[#1B4D3E]
              border
              border-[#E5A00D]/30
              shadow-[0_10px_30px_rgba(0,0,0,0.15)]
            "
          >
            {/* Sliding yellow pill */}

            <div
              className="
                absolute
                top-1
                bottom-1
                left-1
                w-[calc(50%-4px)]
                rounded-full
                bg-[#E5A00D]
                shadow-[3px_3px_0px_#000]
                transition-transform
                duration-500
                ease-[cubic-bezier(0.76,0,0.24,1)]
              "
              style={{
                transform:
                  selectedDay === "tomorrow"
                    ? "translateX(calc(100% + 4px))"
                    : "translateX(0)",
              }}
            />

            <button
              type="button"
              onClick={() => changeDay("today")}
              className={`
                relative
                z-10
                w-32
                sm:w-36
                py-3
                rounded-full
                font-outfit
                text-sm
                font-bold
                uppercase
                tracking-wide
                transition-colors
                duration-300
                ${
                  selectedDay === "today"
                    ? "text-[#0F3329]"
                    : "text-[#f5e3cd]"
                }
              `}
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => changeDay("tomorrow")}
              className={`
                relative
                z-10
                w-32
                sm:w-36
                py-3
                rounded-full
                font-outfit
                text-sm
                font-bold
                uppercase
                tracking-wide
                transition-colors
                duration-300
                ${
                  selectedDay === "tomorrow"
                    ? "text-[#0F3329]"
                    : "text-[#f5e3cd]"
                }
              `}
            >
              Tomorrow
            </button>
          </div>

          {/* CUTOFF */}

          <div
            className="
              flex
              items-center
              gap-2
              font-sans
              text-sm
              text-[#E5A00D]
            "
          >
            <Clock className="w-4 h-4" />

            <span>
              {selectedDay === "today"
                ? "Lunch cutoff 11:30 AM · Dinner cutoff 7:00 PM"
                : "Tomorrow's menu · Reserve before 10:00 PM"}
            </span>
          </div>
        </div>

        {/* =================================================
            MENU GRID
        ================================================= */}

        <div
          ref={gridRef}
          className="
            relative
            z-10
            grid
            sm:grid-cols-2
            lg:grid-cols-4
            gap-x-6
            gap-y-14
          "
        >
          {items.map((dish) => (
            <article
              key={dish.id}
              className="
                group
                cursor-pointer
              "
            >
              {/* IMAGE */}

              <div
                className="
                  relative
                  h-[300px]
                  sm:h-[330px]
                  w-full
                  overflow-hidden
                  rounded-[2rem]
                  bg-[#1B4D3E]
                  border
                  border-[#E5A00D]/20
                  shadow-[0_20px_50px_rgba(0,0,0,0.25)]
                "
              >
                <Image
                  src={dish.image}
                  alt={dish.name}
                  fill
                  sizes="(max-width: 640px) 100vw,
                         (max-width: 1024px) 50vw,
                         25vw"
                  className="
                    object-cover
                    transition-transform
                    duration-700
                    ease-out
                    group-hover:scale-110
                  "
                />

                {/* IMAGE GRADIENT */}

                <div
                  className="
                    absolute
                    inset-0
                    bg-gradient-to-t
                    from-[#0F3329]/60
                    via-transparent
                    to-transparent
                    opacity-60
                  "
                />

                {/* RATING */}

                <div
                  className="
                    absolute
                    top-4
                    right-4
                    flex
                    items-center
                    gap-1
                    px-3
                    py-1.5
                    rounded-full
                    bg-[#0F3329]/90
                    backdrop-blur-md
                    border
                    border-[#E5A00D]/30
                    text-[#E5A00D]
                    font-outfit
                    text-xs
                    font-bold
                  "
                >
                  <Star className="w-3.5 h-3.5 fill-[#E5A00D]" />

                  {dish.rating}
                </div>

                {/* VEG */}

                <div
                  className="
                    absolute
                    top-4
                    left-4
                    w-7
                    h-7
                    rounded-full
                    bg-[#0F3329]/90
                    backdrop-blur-md
                    flex
                    items-center
                    justify-center
                  "
                >
                  <div
                    className={`
                      w-3
                      h-3
                      rounded-full
                      ${
                        dish.isVeg
                          ? "bg-emerald-400"
                          : "bg-red-400"
                      }
                    `}
                  />
                </div>
              </div>

              {/* INFORMATION */}

              <div className="mt-5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3
                    className="
                      font-outfit
                      text-lg
                      sm:text-xl
                      font-bold
                      leading-tight
                      text-[#f5e3cd]
                      transition-colors
                      duration-300
                      group-hover:text-[#E5A00D]
                    "
                  >
                    {dish.name}
                  </h3>

                  <p
                    className="
                      mt-2
                      font-sans
                      text-xs
                      text-[#D8C4A9]
                    "
                  >
                    {dish.calories} kcal · {dish.protein} protein
                  </p>
                </div>

                <span
                  className="
                    shrink-0
                    font-outfit
                    text-xl
                    font-extrabold
                    text-[#E5A00D]
                  "
                >
                  ₹{dish.price}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}