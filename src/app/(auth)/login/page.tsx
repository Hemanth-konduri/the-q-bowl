"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import AuthBackground from "@/components/auth-background";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const googleError = searchParams.get("error") === "google_failed";

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(googleError ? "Google sign-in failed. Please try again." : "");

  async function sendOtp() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error);
    setStep("otp");
  }

  async function verifyOtp() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error);
    router.push(data.redirect ?? "/");
  }

  return (
    <>
      <AuthBackground />
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="mb-8 flex flex-col items-center">
          <Image src="/the_q_bowl_logo.png" alt="Q1 Bowl" width={72} height={72} className="rounded-2xl shadow-md mb-3" />
          <span className="font-bold text-xl tracking-tight" style={{ color: "#24332B" }}>Q1 Bowl</span>
        </div>

        <div className="w-full max-w-md">
          {step === "email" ? (
            <>
              <h1 className="text-2xl font-bold mb-1 text-center" style={{ color: "#24332B" }}>Welcome back</h1>
              <p className="text-sm text-center mb-8" style={{ color: "#7C817A" }}>
                New here?{" "}
                <Link href="/register" className="font-semibold hover:underline" style={{ color: "#496A5A" }}>Create an account</Link>
              </p>

              {error && (
                <div className="text-sm rounded-xl px-4 py-3 mb-4 border" style={{ background: "#FFF8F5", borderColor: "#D86F45", color: "#D86F45" }}>
                  {error}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#24332B" }}>Email address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && email && sendOtp()}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition border"
                  style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}
                  onFocus={(e) => (e.target.style.borderColor = "#496A5A")}
                  onBlur={(e) => (e.target.style.borderColor = "#DDD9CC")}
                />
              </div>

              <button
                onClick={sendOtp}
                disabled={loading || !email}
                className="w-full rounded-xl py-3 text-sm font-semibold text-white transition disabled:opacity-40 mb-4"
                style={{ background: "#496A5A" }}
              >
                {loading ? "Sending code..." : "Continue with email"}
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px" style={{ background: "#DDD9CC" }} />
                <span className="text-xs" style={{ color: "#7C817A" }}>or</span>
                <div className="flex-1 h-px" style={{ background: "#DDD9CC" }} />
              </div>

              <a
                href="/api/auth/google"
                className="w-full flex items-center justify-center gap-3 rounded-xl py-3 text-sm font-medium border transition hover:bg-gray-50"
                style={{ borderColor: "#DDD9CC", color: "#24332B", background: "#fff" }}
              >
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Continue with Google
              </a>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-1 text-center" style={{ color: "#24332B" }}>Check your email</h1>
              <p className="text-sm text-center mb-8" style={{ color: "#7C817A" }}>
                We sent a 6-digit code to <span className="font-semibold" style={{ color: "#24332B" }}>{email}</span>
              </p>

              {error && (
                <div className="text-sm rounded-xl px-4 py-3 mb-4 border" style={{ background: "#FFF8F5", borderColor: "#D86F45", color: "#D86F45" }}>
                  {error}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#24332B" }}>One-time code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && otp.length === 6 && verifyOtp()}
                  maxLength={6}
                  className="w-full rounded-xl px-4 py-3 text-lg font-mono outline-none transition border text-center tracking-[0.5em]"
                  style={{ borderColor: "#DDD9CC", background: "#fff", color: "#24332B" }}
                  onFocus={(e) => (e.target.style.borderColor = "#496A5A")}
                  onBlur={(e) => (e.target.style.borderColor = "#DDD9CC")}
                />
              </div>

              <button
                onClick={verifyOtp}
                disabled={loading || otp.length !== 6}
                className="w-full rounded-xl py-3 text-sm font-semibold text-white transition disabled:opacity-40 mb-3"
                style={{ background: "#496A5A" }}
              >
                {loading ? "Verifying..." : "Sign in"}
              </button>

              <button
                onClick={() => { setStep("email"); setOtp(""); setError(""); }}
                className="w-full py-2 text-sm transition"
                style={{ color: "#7C817A" }}
              >
                ← Use a different email
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
