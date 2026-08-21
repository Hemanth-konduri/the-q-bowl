"use client";

import { useState } from "react";
import { ChevronDown, Star, Quote } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: "How does the 1 Meal = 1 Subscription Day entitlement work?",
    answer: "A subscription meal entitlement represents a full subscription day. If you choose 'Lunch + Dinner' in your plan, both lunch and dinner on that day count as ONE subscription day entitlement. A 30-day subscription provides 30 full days of meals.",
  },
  {
    question: "When can I pause or skip an upcoming meal?",
    answer: "You can pause or skip an entire day or an individual meal slot (e.g. Lunch or Dinner) directly from your customer dashboard as long as you do so before the daily cutoff hour (10:00 PM the previous night for Lunch, 11:30 AM same day for Dinner). Skipped meals are saved and automatically extend your plan end date.",
  },
  {
    question: "What is your refund policy for subscriptions?",
    answer: "Subscriptions are eligible for a full refund if zero (0) subscription meals have been consumed. Once one or more subscription meals have been prepared or consumed, refunds are non-eligible; however, you retain full flexibility to pause/skip remaining entitlements at any time.",
  },
  {
    question: "Can I deliver meals to multiple addresses?",
    answer: "Yes! You can save multiple delivery addresses (e.g., Home, Work, Gym) in your account. You can toggle your active delivery location for any upcoming subscription day before the kitchen cutoff.",
  },
  {
    question: "Can I order normal food items alongside an active subscription?",
    answer: "Absolutely. Having an active subscription does not prevent you from placing normal food orders for biryanis, desserts, or snacks anytime from today's active menu.",
  },
];

const REVIEWS = [
  {
    name: "Ananya Sharma",
    role: "Software Engineer, Gachibowli",
    comment: "The subscription pause flexibility is a lifesaver. When I travel for work, I just pause my days with one click before cutoff. Fresh taste every time!",
    rating: 5,
  },
  {
    name: "Vikram Reddy",
    role: "Product Designer, Hitec City",
    comment: "Best cloud kitchen in Hyderabad! The Hyderabadi Biryani on today's menu is restaurant quality, and the high-protein harvest bowl keeps me energized.",
    rating: 5,
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section data-nav-dark="false" className="py-24 bg-[#E5A00D] text-black relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Customer Proof Reviews Grid */}
        <div className="mb-16">
          <div className="gsap-reveal text-center max-w-2xl mx-auto mb-10">
            <span className="font-mouse-memoirs text-2xl text-black uppercase font-bold tracking-widest block mb-2">
              REAL CUSTOMER REVIEWS
            </span>
            <h3 className="font-outfit text-4xl sm:text-6xl font-extrabold text-black uppercase tracking-tight leading-none">
              LOVED BY BUSY PROFESSIONALS
            </h3>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {REVIEWS.map((r, i) => (
              <div key={i} className="gsap-reveal p-8 rounded-[2rem] bg-[#FFF8EE] border-4 border-black text-black relative shadow-[6px_6px_0px_#000000]">
                <Quote className="w-8 h-8 text-[#E5A00D] mb-4" />
                <p className="font-sans text-base sm:text-lg text-black font-medium leading-relaxed mb-6">
                  &ldquo;{r.comment}&rdquo;
                </p>
                <div className="flex items-center justify-between border-t border-black/20 pt-4">
                  <div>
                    <h4 className="font-outfit text-xl font-extrabold text-black">{r.name}</h4>
                    <span className="font-sans text-xs text-black/70 font-semibold">{r.role}</span>
                  </div>
                  <div className="flex text-[#E5A00D] gap-1">
                    {[...Array(r.rating)].map((_, idx) => (
                      <Star key={idx} className="w-4 h-4 fill-current text-[#E5A00D]" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Accordion Section */}
        <div className="max-w-4xl mx-auto">
          <div className="gsap-reveal text-center mb-10">
            <span className="font-mouse-memoirs text-2xl text-black uppercase font-bold tracking-widest block mb-1">
              KNOW BEFORE YOU ORDER
            </span>
            <h2 className="font-outfit text-4xl sm:text-6xl font-extrabold text-black uppercase tracking-tight leading-none">
              FREQUENTLY ASKED QUESTIONS
            </h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={index}
                  className="gsap-reveal overflow-hidden rounded-2xl bg-black border-2 border-black shadow-[4px_4px_0px_#000000] transition-all"
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4 focus:outline-none"
                  >
                    <span className="font-outfit text-lg sm:text-xl font-bold text-[#E5A00D]">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#E5A00D] shrink-0 transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 font-sans text-xs sm:text-sm text-[#f5e3cd] font-light leading-relaxed border-t border-[#E5A00D]/20 pt-4 animate-in fade-in">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
