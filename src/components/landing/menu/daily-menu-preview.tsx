"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image, { StaticImageData } from "next/image";
import { Star } from "lucide-react";
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
  image: StaticImageData | string;
  rating: number;
  calories: number;
  protein: string;
}

export default function DailyMenuPreview() {
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);

  const handleDishClick = async (dish: MenuItem) => {
    const foodDetailData = {
      id: dish.id,
      name: dish.name,
      category: dish.category,
      tag: dish.isVeg ? "Veg" : "Non-Veg",
      tagType: dish.isVeg ? "PURE VEG" : "NON-VEG",
      rating: dish.rating,
      calories: `${dish.calories} kcal`,
      protein: dish.protein,
      description: "Chef-crafted fresh culinary creation from our cloud kitchen.",
      price: dish.price,
      image: typeof dish.image === "string" ? dish.image : (dish.image as any)?.src || "/chicken_dum_biryani.png",
    };

    try {
      sessionStorage.setItem("qbowl_selected_meal", JSON.stringify(foodDetailData));
    } catch {
      // ignore
    }

    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const user = await res.json();
        if (user && user.id) {
          router.push(`/dashboard#meal-${dish.id}`);
          return;
        }
      }
    } catch {
      // ignore network errors and fallback to login
    }
    router.push(`/login?redirect=${encodeURIComponent(`/dashboard#meal-${dish.id}`)}`);
  };

  // Fetch real master food catalog from DB (No Demo Data)
  useEffect(() => {
    async function loadRealMenu() {
      setLoadingMenu(true);
      try {
        const res = await fetch("/api/meals");
        if (res.ok) {
          const data = await res.json();
          if (data.meals && Array.isArray(data.meals) && data.meals.length > 0) {
            const formatted: MenuItem[] = data.meals.map((m: any, idx: number) => {
              let img = m.imageUrl;
              if (!img || img === "") {
                if (m.name?.toLowerCase().includes("biryani")) img = "/biryani_handi_slider.jpg";
                else if (m.name?.toLowerCase().includes("burger")) img = "/truffle_burger.jpg";
                else if (m.name?.toLowerCase().includes("pizza")) img = "/margherita_pizza.jpg";
                else if (m.isVeg) img = "/paneer_bowl_new.png";
                else img = "/chicken_dum_biryani.png";
              }

              return {
                id: m.id,
                name: m.name,
                price: Number(m.price),
                category: m.categoryName || (m.isVeg ? "Veg Delights" : "Artisan Bowls"),
                mealType: (m.mealType as any) || (idx % 2 === 0 ? "LUNCH" : "DINNER"),
                isVeg: Boolean(m.isVeg),
                image: img,
                rating: m.rating ? Number(m.rating) : 4.9,
                calories: m.calories ? Number(m.calories) : 580,
                protein: m.protein || "32g",
              };
            });

            setItems(formatted);
          }
        }
      } catch (err) {
        console.error("Error loading meals for landing page:", err);
      } finally {
        setLoadingMenu(false);
      }
    }

    loadRealMenu();
  }, []);

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
    }, section);

    return () => ctx.revert();
  }, []);

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
      </div>

      {/* SINGLE-LINE AUTO-SLIDING FOOD ROW WITH SIDE MARGINS */}
      <div className="relative z-10 w-full max-w-[1600px] mx-auto overflow-hidden py-4 px-4 sm:px-8 md:px-12 lg:px-16">
        {loadingMenu ? (
          <div className="flex gap-6 sm:gap-8 overflow-hidden py-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                className="w-[280px] sm:w-[320px] shrink-0 h-[380px] rounded-[2rem] bg-zinc-900 border-2 border-[#E5A00D]/20 p-4 space-y-4 animate-pulse"
              >
                <div className="h-[260px] rounded-[1.5rem] bg-zinc-800" />
                <div className="space-y-2">
                  <div className="h-4 bg-zinc-800 rounded w-3/4" />
                  <div className="h-3 bg-zinc-800/60 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="animate-food-slider flex gap-6 sm:gap-8 items-center py-2">
            {[...items, ...items].map((dish, idx) => (
              <article
                key={`${dish.id}-${idx}`}
                onClick={() => handleDishClick(dish)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleDishClick(dish);
                  }
                }}
                className="
                  group
                  cursor-pointer
                  w-[280px]
                  sm:w-[320px]
                  shrink-0
                  transition-transform
                  duration-300
                  hover:-translate-y-2
                  focus:outline-none
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
                    sizes="(max-width: 640px) 280px, 320px"
                    priority={idx < 4}
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
                <div className="mt-5 space-y-2 px-1">
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
        ) : (
          <div className="max-w-3xl mx-auto p-12 text-center rounded-3xl border-2 border-[#E5A00D]/20 bg-zinc-900/50">
            <p className="font-outfit font-black text-xl text-[#f5e3cd]">Kitchen Menu Loading</p>
            <p className="text-sm text-[#D8C4A9] mt-1">Today&apos;s specials are being freshly prepared in our cloud kitchen.</p>
          </div>
        )}
      </div>
    </section>
  );
}