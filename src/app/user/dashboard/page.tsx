"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthBackground from "@/components/auth-background";
import { Button } from "@/components/ui/button";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
}

const featuredItems: MenuItem[] = [
  {
    id: "1",
    name: "Superfood Bowl",
    description: "Quinoa, kale, avocado, chickpeas, and tahini dressing",
    price: 14.99,
    image: "🥗",
    category: "Healthy",
  },
  {
    id: "2",
    name: "Protein Power Bowl",
    description: "Grilled chicken, brown rice, roasted vegetables, and pesto",
    price: 16.99,
    image: "🍗",
    category: "High Protein",
  },
  {
    id: "3",
    name: "Vegan Delight",
    description: "Tofu, sweet potato, black beans, and lime-cilantro dressing",
    price: 13.99,
    image: "🌱",
    category: "Vegan",
  },
  {
    id: "4",
    name: "Mediterranean Feast",
    description: "Falafel, hummus, tabbouleh, and pita bread",
    price: 15.99,
    image: "🍞",
    category: "Mediterranean",
  },
];

const subscriptionPlans = [
  {
    name: "Weekly",
    price: 79.99,
    features: ["5 meals per week", "Fresh ingredients", "Flexible schedule", "Free delivery"],
    recommended: false,
  },
  {
    name: "Bi-Weekly",
    price: 149.99,
    features: ["10 meals per week", "Fresh ingredients", "Flexible schedule", "Free delivery", "10% discount"],
    recommended: true,
  },
  {
    name: "Monthly",
    price: 299.99,
    features: ["20 meals per week", "Fresh ingredients", "Flexible schedule", "Free delivery", "15% discount", "Free meal on birthday"],
    recommended: false,
  },
];

export default function UserDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"order" | "subscribe">("order");

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <AuthBackground />

      {/* Navbar */}
      <nav className="w-full px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#496A5A" }}>
            <span className="text-white font-bold text-lg">Q</span>
          </div>
          <span className="font-bold text-xl tracking-tight" style={{ color: "#24332B" }}>Q1 Bowl</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm" style={{ color: "#7C817A" }}>
            Welcome, <span className="font-semibold" style={{ color: "#24332B" }}>User</span>
          </span>
          <Button variant="outline" asChild className="rounded-xl px-4 py-2 text-sm border-2" style={{ borderColor: "#496A5A", color: "#496A5A" }}>
            <Link href="/api/auth/logout">Sign Out</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="px-6 py-16 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: "#24332B" }}>
            Ready to eat healthier?
          </h1>
          <p className="text-lg mb-8" style={{ color: "#7C817A" }}>
            Order fresh meals or choose a subscription plan that fits your lifestyle.
          </p>
          
          {/* Tabs */}
          <div className="flex justify-center gap-4 mb-12">
            <button
              onClick={() => setActiveTab("order")}
              className={`px-8 py-3 rounded-xl font-semibold transition-all ${
                activeTab === "order"
                  ? "bg-[#496A5A] text-white shadow-lg"
                  : "bg-white/50 text-[#24332B] hover:bg-white"
              }`}
            >
              Order Meals
            </button>
            <button
              onClick={() => setActiveTab("subscribe")}
              className={`px-8 py-3 rounded-xl font-semibold transition-all ${
                activeTab === "subscribe"
                  ? "bg-[#496A5A] text-white shadow-lg"
                  : "bg-white/50 text-[#24332B] hover:bg-white"
              }`}
            >
              Subscriptions
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 pb-20">
        {activeTab === "order" ? (
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold" style={{ color: "#24332B" }}>
                Featured Meals
              </h2>
              <Button asChild variant="outline" className="rounded-xl" style={{ borderColor: "#496A5A", color: "#496A5A" }}>
                <Link href="/menu">View All Menu</Link>
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 bg-white"
                >
                  <div className="aspect-square bg-gradient-to-br from-[#496A5A]/10 to-[#8FAF8F]/10 flex items-center justify-center">
                    <span className="text-8xl">{item.image}</span>
                  </div>
                  <div className="p-5">
                    <div className="text-xs font-semibold px-2 py-1 rounded-full inline-block mb-3" style={{ background: "#FFF8F5", color: "#D86F45" }}>
                      {item.category}
                    </div>
                    <h3 className="text-lg font-bold mb-2" style={{ color: "#24332B" }}>
                      {item.name}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: "#7C817A" }}>
                      {item.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold" style={{ color: "#24332B" }}>
                        ${item.price.toFixed(2)}
                      </span>
                      <Button
                        onClick={() => router.push("/user/checkout")}
                        className="rounded-lg px-4 py-2 text-sm"
                        style={{ background: "#496A5A" }}
                      >
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Stats */}
            <div className="mt-16 grid md:grid-cols-3 gap-6">
              {[
                { icon: "⭐", title: "5-Star Rating", value: "4.9/5" },
                { icon: "🍽️", title: "Meals Served", value: "50,000+" },
                { icon: "🚚", title: "Happy Customers", value: "10,000+" },
              ].map((stat, i) => (
                <div key={i} className="text-center p-8 rounded-2xl" style={{ background: "#F7F3E8" }}>
                  <div className="text-4xl mb-3">{stat.icon}</div>
                  <h3 className="text-3xl font-bold mb-1" style={{ color: "#24332B" }}>
                    {stat.value}
                  </h3>
                  <p className="text-sm" style={{ color: "#7C817A" }}>
                    {stat.title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold mb-4" style={{ color: "#24332B" }}>
                Choose Your Subscription Plan
              </h2>
              <p className="text-lg" style={{ color: "#7C817A" }}>
                Save more with longer subscription periods. All plans include fresh ingredients and free delivery.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {subscriptionPlans.map((plan, i) => (
                <div
                  key={i}
                  className={`rounded-3xl p-8 transition-all ${
                    plan.recommended
                      ? "bg-[#496A5A] text-white shadow-2xl scale-105"
                      : "bg-white text-[#24332B] shadow-lg hover:shadow-xl"
                  }`}
                >
                  {plan.recommended && (
                    <div className="text-center mb-4">
                      <span className="px-4 py-1 rounded-full text-xs font-bold" style={{ background: "#D86F45" }}>
                        MOST POPULAR
                      </span>
                    </div>
                  )}
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold mb-6">
                    ${plan.price} <span className="text-lg font-normal opacity-70">/mo</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-3">
                        <span className="text-lg">✓</span>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full py-3 rounded-xl font-semibold"
                    style={{ background: plan.recommended ? "#D86F45" : "#496A5A" }}
                  >
                    Choose {plan.name}
                  </Button>
                </div>
              ))}
            </div>

            {/* Subscription Benefits */}
            <div className="mt-16 grid md:grid-cols-4 gap-6">
              {[
                { icon: "🥗", title: "Fresh Ingredients", desc: "Locally sourced, organic produce" },
                { icon: "📅", title: "Flexible Scheduling", desc: "Skip or cancel anytime" },
                { icon: "🥗", title: "Dietary Options", desc: "Vegan, vegetarian, gluten-free" },
                { icon: "🚚", title: "Free Delivery", desc: "Direct to your doorstep" },
              ].map((benefit, i) => (
                <div key={i} className="text-center p-6 rounded-2xl" style={{ background: "#F7F3E8" }}>
                  <div className="text-3xl mb-3">{benefit.icon}</div>
                  <h4 className="font-bold mb-2" style={{ color: "#24332B" }}>
                    {benefit.title}
                  </h4>
                  <p className="text-sm" style={{ color: "#7C817A" }}>
                    {benefit.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 border-t" style={{ borderColor: "#DDD9CC" }}>
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm" style={{ color: "#7C817A" }}>
            © {new Date().getFullYear()} Q1 Bowl. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
