"use client";

import { useEffect, useRef, useState } from "react";
import Image, { StaticImageData } from "next/image";
import { Clock, Star } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import heroDishImg from "../../../../public/hero_dish.png";
import dumBiryaniImg from "../../../../public/dum_biryani_hero.png";
import paneerImg from "../../../../public/paneer.png";
import biryaniImg from "../../../../public/biryani.png";

gsap.registerPlugin(ScrollTrigger);

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
  isVeg: boolean;
  image: StaticImageData | string;
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
    image: heroDishImg,
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
    image: dumBiryaniImg,
    rating: 4.9,
    calories: 680,
    protein: "32g",
  },
  {
    id: "3",
    name: "Royal Paneer Tikka Deluxe Bowl",
    price: 239,
    category: "Meals",
    mealType: "DINNER",
    isVeg: true,
    image: paneerImg,
    rating: 4.8,
    calories: 590,
    protein: "24g",
  },
  {
    id: "4",
    name: "Special Artisanal Dum Biryani",
    price: 329,
    category: "Biryani",
    mealType: "DINNER",
    isVeg: false,
    image: biryaniImg,
    rating: 4.9,
    calories: 710,
    protein: "35g",
  },
];

const TOMORROW_ITEMS: MenuItem[] = [
  {
    id: "5",
    name: "Mediterranean Protein Power Bowl",
    price: 349,
    category: "Meals",
    mealType: "LUNCH",
    isVeg: false,
    image: heroDishImg,
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
    image: dumBiryaniImg,
    rating: 4.8,
    calories: 740,
    protein: "36g",
  },
  {
    id: "7",
    name: "Keto Broccoli & Paneer Steak Bowl",
    price: 269,
    category: "Meals",
    mealType: "DINNER",
    isVeg: true,
    image: paneerImg,
    rating: 4.7,
    calories: 410,
    protein: "28g",
  },
  {
    id: "8",
    name: "Chef's Special Heritage Dum Biryani",
    price: 359,
    category: "Biryani",
    mealType: "LUNCH",
    isVeg: false,
    image: biryaniImg,
    rating: 4.9,
    calories: 730,
    protein: "34g",
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

  const items = selectedDay === "today" ? TODAY_ITEMS : TOMORROW_ITEMS;

  const changeDay = (day: "today" | "tomorrow") => {
    if (day === selectedDay || isChanging) return;

    setIsChanging(true);

    if (gridRef.current) {
      gsap.to(gridRef.current.children, {
        opacity: 0,
        y: -20,
        duration: 0.3,
        stagger: 0.05,
        ease: "power2.in",
        onComplete: () => {
          setSelectedDay(day);
          setIsChanging(false);
        },
      });
    } else {
      setSelectedDay(day);
      setIsChanging(false);
    }
  };

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
          duration: 0.8,
          delay: 0.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 75%",
            once: true,
          },
        }
      );

      // Grid items
      if (gridRef.current) {
        gsap.fromTo(
          gridRef.current.children,
          {
            opacity: 0,
            y: 50,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 65%",
              once: true,
            },
          }
        );
      }
    }, section);

    return () => ctx.revert();
  }, []);

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
          duration: 0.5,
          stagger: 0.08,
          ease: "power3.out",
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
        bg-black
        text-[#f5e3cd]
        overflow-hidden
        pt-32
        pb-40
      "
    >
      {/* BACKGROUND GLOW */}
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
          bg-black
          blur-[110px]
          opacity-70
        "
      />

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
        {/* HEADER */}
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

        {/* CONTROLS */}
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
              bg-black
              border
              border-[#E5A00D]/30
              shadow-[0_10px_30px_rgba(0,0,0,0.15)]
            "
          >
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
                    ? "text-black"
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
                    ? "text-black"
                    : "text-[#f5e3cd]"
                }
              `}
            >
              Tomorrow
            </button>
          </div>

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

        {/* MENU GRID */}
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
              <div
                className="
                  relative
                  h-[280px]
                  sm:h-[300px]
                  w-full
                  overflow-hidden
                  rounded-[2rem]
                  bg-black
                  border-2
                  border-[#E5A00D]/30
                  shadow-[0_20px_50px_rgba(0,0,0,0.3)]
                "
              >
                <Image
                  src={dish.image}
                  alt={dish.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  priority
                  className="
                    object-cover
                    w-full
                    h-full
                    transition-transform
                    duration-700
                    ease-out
                    group-hover:scale-110
                  "
                />

                {/* RATING BADGE */}
                <div
                  className="
                    absolute
                    top-4
                    right-4
                    flex
                    items-center
                    gap-1
                    px-3
                    py-1
                    rounded-full
                    bg-black/90
                    backdrop-blur-md
                    border
                    border-[#E5A00D]/40
                    font-sans
                    text-xs
                    font-bold
                    text-[#f5e3cd]
                    shadow-md
                    z-20
                  "
                >
                  <Star className="w-3.5 h-3.5 fill-[#E5A00D] text-[#E5A00D]" />
                  <span>{dish.rating}</span>
                </div>

                {/* VEG / NON-VEG TAG */}
                <div
                  className="
                    absolute
                    top-4
                    left-4
                    px-2.5
                    py-1
                    rounded-full
                    bg-black/90
                    backdrop-blur-md
                    border
                    border-[#E5A00D]/40
                    flex
                    items-center
                    gap-1.5
                    z-20
                  "
                >
                  <span
                    className={`
                      w-2
                      h-2
                      rounded-full
                      ${dish.isVeg ? "bg-black border border-white/60" : "bg-red-400"}
                    `}
                  />
                  <span
                    className="
                      font-outfit
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-wider
                      text-[#f5e3cd]
                    "
                  >
                    {dish.isVeg ? "Veg" : "Non-Veg"}
                  </span>
                </div>
              </div>

              {/* CARD DETAILS */}
              <div className="mt-5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3
                    className="
                      font-outfit
                      text-xl
                      font-extrabold
                      text-[#f5e3cd]
                      uppercase
                      tracking-tight
                      group-hover:text-[#E5A00D]
                      transition-colors
                      line-clamp-1
                    "
                  >
                    {dish.name}
                  </h3>

                  <span
                    className="
                      font-outfit
                      text-xl
                      font-black
                      text-[#E5A00D]
                      shrink-0
                    "
                  >
                    ₹{dish.price}
                  </span>
                </div>

                <div
                  className="
                    flex
                    items-center
                    justify-between
                    font-sans
                    text-xs
                    text-[#D8C4A9]
                  "
                >
                  <span>{dish.calories} kcal</span>
                  <span>•</span>
                  <span>{dish.protein} protein</span>
                  <span>•</span>
                  <span className="uppercase text-[#E5A00D] font-bold">
                    {dish.mealType}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}