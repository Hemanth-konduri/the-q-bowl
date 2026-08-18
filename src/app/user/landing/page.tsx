import Link from "next/link";
import AuthBackground from "@/components/auth-background";
import { Button } from "@/components/ui/button";

export default function UserLandingPage() {
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
          <Link href="/login" className="text-sm font-medium transition hover:opacity-80" style={{ color: "#24332B" }}>
            Sign In
          </Link>
          <Button asChild className="rounded-xl px-6 py-2.5 text-sm font-semibold shadow-sm">
            <Link href="/login" style={{ background: "#496A5A" }}>
              Get Started
            </Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="max-w-4xl w-full">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8" style={{ background: "#FFF8F5" }}>
            <span className="text-sm font-medium" style={{ color: "#D86F45" }}>✨ Fresh, Healthy, Delicious</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6" style={{ color: "#24332B" }}>
            Eat Well, Live Better <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#496A5A] to-[#8FAF8F]" style={{ color: "#496A5A" }}>
              With Q1 Bowl
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-center mb-10 max-w-2xl mx-auto" style={{ color: "#7C817A" }}>
            Order fresh, nutritious meals or subscribe for regular deliveries. 
            We bring healthy eating to your doorstep with convenience and care.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button asChild className="h-12 px-8 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
              <Link href="/login" style={{ background: "#496A5A" }}>
                Order Now
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-12 px-8 text-base font-semibold rounded-xl border-2 hover:bg-white/50 transition-all">
              <Link href="/login" style={{ borderColor: "#496A5A", color: "#496A5A" }}>
                View Menu
              </Link>
            </Button>
          </div>

          {/* Hero Image/Visual */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl mx-auto max-w-5xl">
            <div className="aspect-[16/9] md:aspect-[21/9] bg-gradient-to-br from-[#496A5A]/10 to-[#8FAF8F]/10 rounded-3xl flex items-center justify-center">
              <div className="text-center">
                <div className="text-9xl mb-4 opacity-20">🥗</div>
                <p className="text-lg font-medium" style={{ color: "#7C817A" }}>
                  Fresh meals • Healthy subscriptions • Fast delivery
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "#24332B" }}>
              Why Choose Q1 Bowl?
            </h2>
            <p className="text-lg" style={{ color: "#7C817A" }}>
              We make healthy eating easy, convenient, and delicious
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-2xl transition-all hover:shadow-lg hover:-translate-y-1" style={{ background: "#F7F3E8" }}>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6" style={{ background: "#FFF8F5" }}>
                <span className="text-3xl">🥗</span>
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#24332B" }}>
                Fresh & Nutritious
              </h3>
              <p className="text-base" style={{ color: "#7C817A" }}>
                Every meal is prepared with fresh, high-quality ingredients to ensure maximum nutrition and taste.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-2xl transition-all hover:shadow-lg hover:-translate-y-1" style={{ background: "#F7F3E8" }}>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6" style={{ background: "#FFF8F5" }}>
                <span className="text-3xl">📋</span>
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#24332B" }}>
                Flexible Subscriptions
              </h3>
              <p className="text-base" style={{ color: "#7C817A" }}>
                Choose from weekly, bi-weekly, or monthly subscriptions that fit your lifestyle and schedule.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-2xl transition-all hover:shadow-lg hover:-translate-y-1" style={{ background: "#F7F3E8" }}>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6" style={{ background: "#FFF8F5" }}>
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#24332B" }}>
                Fast Delivery
              </h3>
              <p className="text-base" style={{ color: "#7C817A" }}>
                Hot, fresh meals delivered right to your doorstep within 30 minutes of your order.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6" style={{ background: "#F7F3E8" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "#24332B" }}>
              How It Works
            </h2>
            <p className="text-lg" style={{ color: "#7C817A" }}>
              Three simple steps to get your healthy meals
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Create Account", desc: "Sign up with your email or Google account" },
              { step: "2", title: "Choose Plan", desc: "Select from a la carte orders or subscription plans" },
              { step: "3", title: "Enjoy Meals", desc: "Receive fresh, healthy meals at your doorstep" }
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl" style={{ background: "#496A5A", color: "#fff" }}>
                  {item.step}
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: "#24332B" }}>
                    {item.title}
                  </h3>
                  <p className="text-base" style={{ color: "#7C817A" }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 rounded-3xl" style={{ background: "#496A5A" }}>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
              Ready to eat healthier?
            </h2>
            <p className="text-lg mb-8 text-white/90 max-w-2xl mx-auto">
              Join thousands of happy customers who trust Q1 Bowl for their daily nutrition needs.
            </p>
            <Button asChild className="h-14 px-10 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 bg-white text-[#496A5A] hover:bg-gray-50">
              <Link href="/login">
                Start Your Journey
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t" style={{ borderColor: "#DDD9CC" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#496A5A" }}>
                  <span className="text-white font-bold">Q</span>
                </div>
                <span className="font-bold text-lg" style={{ color: "#24332B" }}>Q1 Bowl</span>
              </div>
              <p className="text-sm" style={{ color: "#7C817A" }}>
                Making healthy eating simple, convenient, and delicious for everyone.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4" style={{ color: "#24332B" }}>Quick Links</h4>
              <ul className="space-y-2 text-sm" style={{ color: "#7C817A" }}>
                <li><Link href="/login" className="hover:underline">Home</Link></li>
                <li><Link href="/login" className="hover:underline">Menu</Link></li>
                <li><Link href="/login" className="hover:underline">Subscriptions</Link></li>
                <li><Link href="/login" className="hover:underline">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4" style={{ color: "#24332B" }}>Legal</h4>
              <ul className="space-y-2 text-sm" style={{ color: "#7C817A" }}>
                <li><a href="#" className="hover:underline">Privacy Policy</a></li>
                <li><a href="#" className="hover:underline">Terms of Service</a></li>
                <li><a href="#" className="hover:underline">Cookie Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4" style={{ color: "#24332B" }}>Contact</h4>
              <ul className="space-y-2 text-sm" style={{ color: "#7C817A" }}>
                <li>support@q1bowl.com</li>
                <li>+1 (555) 123-4567</li>
                <li>123 Healthy St, Food City</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t" style={{ borderColor: "#DDD9CC" }}>
            <p className="text-center text-sm" style={{ color: "#7C817A" }}>
              © {new Date().getFullYear()} Q1 Bowl. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
