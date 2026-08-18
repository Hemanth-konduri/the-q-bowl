import type { LayoutProps } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function UserLayout({ children }: LayoutProps<"/user">) {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Navbar */}
      <nav className="w-full px-6 py-4 flex justify-between items-center bg-white/80 backdrop-blur-sm border-b" style={{ borderColor: "#DDD9CC" }}>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#496A5A" }}>
            <span className="text-white font-bold text-lg">Q</span>
          </div>
          <span className="font-bold text-xl tracking-tight" style={{ color: "#24332B" }}>Q1 Bowl</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/user/landing" className="text-sm font-medium transition hover:opacity-80" style={{ color: "#24332B" }}>
            Home
          </Link>
          <Link href="/user/dashboard" className="text-sm font-medium transition hover:opacity-80" style={{ color: "#24332B" }}>
            Dashboard
          </Link>
          <Link href="/user/orders" className="text-sm font-medium transition hover:opacity-80" style={{ color: "#24332B" }}>
            Orders
          </Link>
          <Link href="/user/profile" className="text-sm font-medium transition hover:opacity-80" style={{ color: "#24332B" }}>
            Profile
          </Link>
          <Button variant="outline" asChild className="rounded-xl px-4 py-2 text-sm border-2" style={{ borderColor: "#496A5A", color: "#496A5A" }}>
            <Link href="/api/auth/logout">Sign Out</Link>
          </Button>
        </div>
      </nav>
      
      <main className="flex-1">{children}</main>
      
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
