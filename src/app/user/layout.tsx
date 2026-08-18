import type { ReactNode } from "react";
import UserNav from "@/components/user/user-nav";

export default function UserLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5e3cd] text-[#0F3329] flex flex-col justify-between relative selection:bg-[#0F3329] selection:text-white">
      <UserNav />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 relative z-10">
        {children}
      </main>

      <footer className="w-full py-6 border-t-2 border-[#0F3329]/15 text-center text-xs font-sans font-semibold text-[#0F3329]/60">
        <p>© {new Date().getFullYear()} Q1 BOWL • ARTISAN CLOUD KITCHEN &amp; MEAL SUBSCRIPTIONS</p>
      </footer>
    </div>
  );
}
