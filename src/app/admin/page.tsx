"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Admin login failed.");
      router.push("/admin/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5e3cd] px-4 py-12 text-black">
      <div className="w-full max-w-md bg-white/80 p-8 rounded-2xl border border-amber-900/15 shadow-none">
        <h1 className="text-2xl font-black text-stone-900 text-center mb-1">
          Admin Sign In
        </h1>
        <p className="text-xs text-stone-600 text-center mb-6 font-medium">
          Enter admin credentials to access the Admin Dashboard.
        </p>

        <form onSubmit={submit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-stone-800 uppercase tracking-wider mb-1">
              Admin Email
            </label>
            <input
              required
              type="email"
              placeholder="admin@qbowl.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-stone-300 bg-white p-3 text-xs font-semibold text-stone-900 focus:outline-none focus:border-amber-800 shadow-none"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-800 uppercase tracking-wider mb-1">
              Admin Password
            </label>
            <input
              required
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-stone-300 bg-white p-3 text-xs font-semibold text-stone-900 focus:outline-none focus:border-amber-800 shadow-none"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-300 bg-red-50 p-2.5 text-xs font-bold text-red-800 shadow-none">
              ⚠️ {error}
            </div>
          )}

          <button
            disabled={loading}
            type="submit"
            className="w-full py-3 bg-[#78350f] hover:bg-[#58270b] text-white font-bold text-xs rounded-xl transition-colors shadow-none disabled:opacity-50 uppercase tracking-wider"
          >
            {loading ? "Authenticating..." : "Sign In to Admin Dashboard →"}
          </button>
        </form>
      </div>
    </div>
  );
}
