"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error);
    router.push("/admin");
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#24332B" }}>
      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-16 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, #8FAF8F 0%, transparent 50%), radial-gradient(circle at 80% 20%, #D86F45 0%, transparent 40%)`,
          }}
        />
        <div className="relative">
          <Image src="/the_q_bowl_logo.png" alt="Q1 Bowl" width={56} height={56} className="rounded-xl mb-4" />
          <span className="font-bold text-xl text-white tracking-tight">Q1 Bowl</span>
        </div>
        <div className="relative">
          <p className="text-4xl font-bold text-white leading-tight mb-4">
            Admin <br />Dashboard
          </p>
          <p className="text-sm" style={{ color: "#8FAF8F" }}>
            Manage your cloud kitchen operations from one place.
          </p>
        </div>
        <p className="relative text-xs" style={{ color: "#496A5A" }}>
          © {new Date().getFullYear()} Q1 Bowl
        </p>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center p-8" style={{ background: "#F7F3E8" }}>
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <Image src="/the_q_bowl_logo.png" alt="Q1 Bowl" width={36} height={36} className="rounded-lg" />
            <span className="font-bold text-lg tracking-tight" style={{ color: "#24332B" }}>Q1 Bowl</span>
          </div>

          <h1 className="text-2xl font-bold mb-1" style={{ color: "#24332B" }}>Admin sign in</h1>
          <p className="text-sm mb-8" style={{ color: "#7C817A" }}>Enter your credentials to access the dashboard.</p>

          {error && (
            <div className="text-sm rounded-xl px-4 py-3 mb-4 border" style={{ background: "#FFF8F5", borderColor: "#D86F45", color: "#D86F45" }}>
              {error}
            </div>
          )}

          <div className="space-y-3 mb-5">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#24332B" }}>Email address</label>
              <input
                type="email"
                placeholder="admin@q1bowl.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition border"
                style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}
                onFocus={(e) => (e.target.style.borderColor = "#496A5A")}
                onBlur={(e) => (e.target.style.borderColor = "#DDD9CC")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#24332B" }}>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && email && password && handleLogin()}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition border"
                style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}
                onFocus={(e) => (e.target.style.borderColor = "#496A5A")}
                onBlur={(e) => (e.target.style.borderColor = "#DDD9CC")}
              />
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading || !email || !password}
            className="w-full rounded-xl py-3 text-sm font-semibold text-white transition disabled:opacity-40"
            style={{ background: "#496A5A" }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
