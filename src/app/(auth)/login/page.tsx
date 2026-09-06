"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthShell, fieldClassName, primaryButtonClassName } from "../components/auth-shell";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Invalid credentials.");
      router.push(result.redirect);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to log in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-in fade-in zoom-in-95 duration-300 w-full">
      <AuthShell
        eyebrow="Welcome Back"
        title="Sign In to Q1 Bowl"
        description="Access your bowl subscriptions, saved preferences, and account status."
      >
        <form onSubmit={submit} className="space-y-2.5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-black">
              Email or Username
            </label>
            <input
              required
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="you@example.com or alex_chef"
              className={fieldClassName}
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-black">
                Password
              </label>
            </div>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className={fieldClassName}
            />
          </div>

          {error && (
            <div className="rounded-xl border-2 border-red-900 bg-red-100 p-2.5 text-xs font-bold text-red-900 shadow-[2px_2px_0px_#000]">
              ⚠️ {error}
            </div>
          )}

          <button disabled={loading} type="submit" className={primaryButtonClassName}>
            {loading ? "Logging in..." : "Sign In →"}
          </button>

          {/* ── Divider ── */}
          <div className="relative my-2 flex items-center justify-center">
            <div className="w-full border-t-2 border-black/20" />
            <span className="absolute bg-[#f5e3cd] px-3 text-[10px] font-extrabold uppercase tracking-widest text-black/50">
              OR
            </span>
          </div>

          {/* ── Google OAuth Button ── */}
          <a
            href="/api/auth/google"
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border-2 border-black bg-white px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-black shadow-[2.5px_2.5px_0px_#000] transition-all hover:bg-[#FFF8EE] hover:shadow-[3px_3px_0px_#E5A00D] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google</span>
          </a>

          <p className="pt-1 text-center text-xs font-bold text-black/60">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="underline decoration-2 hover:text-black">
              Register here
            </Link>
          </p>
        </form>
      </AuthShell>
    </div>
  );
}
