import Link from "next/link";
import { ArrowLeft, Home, Utensils, Sparkles, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FFF8EE] text-black flex flex-col justify-between selection:bg-[#E5A00D] selection:text-black">
      {/* Top Brand Banner */}
      <header className="border-b-4 border-black bg-[#E5A00D] px-6 py-4 flex items-center justify-between shadow-[0_4px_0_#000]">
        <Link href="/" className="font-mouse-memoirs text-3xl sm:text-4xl text-black font-black uppercase tracking-wider">
          THE Q BOWL
        </Link>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
          <span className="font-outfit text-xs font-black uppercase tracking-wider bg-black text-[#E5A00D] px-3 py-1 rounded-full">
            404 • Lost in Flavor
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 py-12 sm:py-16 text-center flex-1 flex flex-col items-center justify-center">
        {/* Playful Floating Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E5A00D]/20 border-2 border-black text-black font-outfit text-xs sm:text-sm font-extrabold uppercase tracking-widest mb-6 shadow-[2px_2px_0_#000] animate-bounce">
          <Sparkles className="w-4 h-4 text-[#E5A00D] fill-[#E5A00D]" />
          <span>Recipe Missing From The Kitchen</span>
        </div>

        {/* Big Giant 404 Headline */}
        <div className="relative mb-6">
          <h1 className="font-mouse-memoirs text-[28vw] sm:text-[180px] leading-none text-black font-black select-none tracking-tighter drop-shadow-[6px_6px_0px_#E5A00D]">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="font-outfit text-xs sm:text-sm font-black uppercase tracking-widest px-4 py-1 bg-black text-[#FFF8EE] rounded-lg border-2 border-black shadow-[3px_3px_0_#E5A00D] -rotate-6">
              Bowl Empty!
            </span>
          </div>
        </div>

        {/* Friendly explanation */}
        <h2 className="font-outfit text-2xl sm:text-4xl font-black uppercase tracking-tight text-zinc-900 mb-4 max-w-xl">
          Looks like this dish got eaten or moved!
        </h2>
        <p className="font-sans text-sm sm:text-base text-zinc-600 max-w-md mx-auto mb-8 font-medium leading-relaxed">
          The page you are looking for doesn’t exist or might have been relocated to another part of our kitchen.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#E5A00D] text-black font-outfit text-sm font-extrabold uppercase tracking-wider border-2 border-black shadow-[4px_4px_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-black text-[#FFF8EE] hover:text-[#E5A00D] font-outfit text-sm font-extrabold uppercase tracking-wider border-2 border-black shadow-[4px_4px_0_#E5A00D] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-2"
          >
            <Utensils className="w-4 h-4 text-[#E5A00D]" />
            <span>Go to Dashboard</span>
          </Link>
        </div>

        {/* Quick Hub Links */}
        <div className="mt-12 pt-8 border-t-2 border-black/10 w-full max-w-lg">
          <p className="font-outfit text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">
            Looking for something specific?
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/#menu"
              className="px-3 py-1.5 rounded-xl bg-white border border-black text-xs font-bold font-sans hover:bg-[#E5A00D] transition-colors shadow-[2px_2px_0_#000]"
            >
              Today&apos;s Menu
            </Link>
            <Link
              href="/dashboard#subscriptions"
              className="px-3 py-1.5 rounded-xl bg-white border border-black text-xs font-bold font-sans hover:bg-[#E5A00D] transition-colors shadow-[2px_2px_0_#000]"
            >
              Subscription Plans
            </Link>
            <Link
              href="/#delivery"
              className="px-3 py-1.5 rounded-xl bg-white border border-black text-xs font-bold font-sans hover:bg-[#E5A00D] transition-colors shadow-[2px_2px_0_#000]"
            >
              Check Delivery Zone
            </Link>
          </div>
        </div>
      </main>

      {/* Footer Strip */}
      <footer className="border-t-4 border-black bg-black py-4 px-6 text-center text-[#E5A00D] text-xs font-outfit font-bold uppercase tracking-wider">
        © 2026 The Q Bowl Cloud Kitchen • Rajamahendravaram &amp; Rajanagaram
      </footer>
    </div>
  );
}
