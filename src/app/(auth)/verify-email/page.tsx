"use client";

import { Suspense, FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell, fieldClassName, primaryButtonClassName } from "../components/auth-shell";

function VerifyEmailForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const username = params.get("username") ?? "";
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, otp }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Invalid verification code.");
      router.push("/identity-verification");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Invalid code.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-in fade-in zoom-in-95 duration-300 w-full">
      <AuthShell
        eyebrow="Step 1 of 2 • Email Verification"
        title="Verify Email"
        description="Enter the 6-digit code sent to your inbox to continue your registration."
        step={1}
      >
        <form onSubmit={submit} className="space-y-4">
          <div className="rounded-2xl border-2 border-black bg-[#FFF8EE]/90 p-3.5 text-xs text-black shadow-[3px_3px_0px_#000]">
            Code sent to: <strong className="font-extrabold text-black">{email || "your email address"}</strong>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-black">
              6-Digit Verification Code
            </label>
            <input
              required
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              placeholder="000000"
              className={`${fieldClassName} text-center font-mono text-2xl tracking-[0.4em] font-black`}
            />
          </div>

          {error && (
            <div className="rounded-xl border-2 border-red-900 bg-red-100 p-3 text-xs font-bold text-red-900 shadow-[2px_2px_0px_#000]">
              ⚠️ {error}
            </div>
          )}

          <button disabled={loading || !email} className={primaryButtonClassName}>
            {loading ? "Verifying Code..." : "Verify & Continue →"}
          </button>
        </form>
      </AuthShell>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="w-full text-center text-xs font-bold">Loading...</div>}>
      <VerifyEmailForm />
    </Suspense>
  );
}
