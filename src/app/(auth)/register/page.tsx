"use client";

import { Suspense, FormEvent, useState, ChangeEvent, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AuthShell, fieldClassName, primaryButtonClassName } from "../components/auth-shell";

type Step = 1 | 1.5 | 2 | 3;

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
  const [step, setStep] = useState<Step>(1);

  // Step 1 State
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // Step 1.5 OTP State
  const [otp, setOtp] = useState("");

  // Step 2 Upload State
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [idProofFile, setIdProofFile] = useState<File | null>(null);
  const [aadhaarPreview, setAadhaarPreview] = useState<string | null>(null);
  const [idProofPreview, setIdProofPreview] = useState<string | null>(null);

  // Status & Error
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (urlError === "google_failed") {
      setError("Google Sign-In failed or was cancelled. Please try again or create an account below.");
    }
  }, [urlError]);

  // ── Handlers ──
  async function handleStep1Submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Create account
      const registerRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password, phone }),
      });
      const registerData = await registerRes.json();
      if (!registerRes.ok) throw new Error(registerData.error || "Failed to create account.");

      // 2. Send OTP
      const otpRes = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!otpRes.ok) throw new Error("Account created, but failed to send email verification code.");

      // Smooth slide to Step 1.5 (OTP)
      setStep(1.5);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const verifyRes = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, otp }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error || "Invalid verification code.");

      // Smooth slide to Step 2 (Identity Verification)
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(
    e: ChangeEvent<HTMLInputElement>,
    type: "aadhaar" | "idProof"
  ) {
    const file = e.target.files?.[0] || null;
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      if (type === "aadhaar") {
        setAadhaarFile(file);
        setAadhaarPreview(objectUrl);
      } else {
        setIdProofFile(file);
        setIdProofPreview(objectUrl);
      }
    }
  }

  async function handleIdentitySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!aadhaarFile || !idProofFile) {
      setError("Please upload both your Aadhaar Card and Institutional ID.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("aadhaar", aadhaarFile);
      formData.append("idProof", idProofFile);

      const identityRes = await fetch("/api/auth/identity", {
        method: "POST",
        body: formData,
      });
      const identityData = await identityRes.json();
      if (!identityRes.ok) throw new Error(identityData.error || "Failed to upload identity documents.");

      // Transition to Success State
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Identity submission failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative w-full overflow-hidden transition-all duration-300">
      {/* ── STEP 1: CREATE ACCOUNT ── */}
      {step === 1 && (
        <div className="animate-in fade-in slide-in-from-right-8 duration-500">
          <AuthShell
            eyebrow="Step 1 of 2"
            title="Create Account"
            description="Join Q1 Bowl for daily fresh meals. Enter your details to get started."
            step={1}
          >
            <form onSubmit={handleStep1Submit} className="space-y-2.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black">
                  Username
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. alex_chef"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={fieldClassName}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black">
                  Email Address
                </label>
                <input
                  required
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={fieldClassName}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={fieldClassName}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black">
                  Password
                </label>
                <input
                  required
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={fieldClassName}
                />
              </div>

              {error && (
                <div className="rounded-xl border-2 border-red-900 bg-red-100 p-2.5 text-xs font-bold text-red-900 shadow-[2px_2px_0px_#000]">
                  ⚠️ {error}
                </div>
              )}

              <button disabled={loading} type="submit" className={primaryButtonClassName}>
                {loading ? "Creating Account..." : "Continue →"}
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
                Already registered?{" "}
                <Link href="/login" className="underline decoration-2 hover:text-black">
                  Log in here
                </Link>
              </p>
            </form>
          </AuthShell>
        </div>
      )}

      {/* ── STEP 1.5: EMAIL OTP VERIFICATION ── */}
      {step === 1.5 && (
        <div className="animate-in fade-in slide-in-from-right-8 duration-500">
          <AuthShell
            eyebrow="Step 1 of 2 • Email Verification"
            title="Verify Email"
            description={`We sent a 6-digit OTP code to ${email}. Enter it below.`}
            step={1}
          >
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black">
                  6-Digit Verification Code
                </label>
                <input
                  required
                  maxLength={6}
                  pattern="[0-9]{6}"
                  inputMode="numeric"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className={`${fieldClassName} text-center font-mono text-2xl tracking-[0.4em] font-black`}
                />
              </div>

              {error && (
                <div className="rounded-xl border-2 border-red-900 bg-red-100 p-3 text-xs font-bold text-red-900 shadow-[2px_2px_0px_#000]">
                  ⚠️ {error}
                </div>
              )}

              <button disabled={loading} type="submit" className={primaryButtonClassName}>
                {loading ? "Verifying OTP..." : "Verify & Continue →"}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-center text-xs font-bold text-black/60 underline hover:text-black"
              >
                ← Back to details
              </button>
            </form>
          </AuthShell>
        </div>
      )}

      {/* ── STEP 2: IDENTITY VERIFICATION ── */}
      {step === 2 && (
        <div className="animate-in fade-in slide-in-from-right-8 duration-500">
          <AuthShell
            eyebrow="Step 2 of 2"
            title="Identity Verification"
            description="Upload valid identification documents for admin verification."
            step={2}
          >
            <form onSubmit={handleIdentitySubmit} className="space-y-4">
              {/* Aadhaar Upload Box */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black">
                  Aadhaar Card <span className="text-red-600">*</span>
                </label>
                <label className="group relative mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-black bg-[#FFF8EE]/90 p-4 transition-all hover:bg-[#FFF8EE] hover:border-[#E5A00D] hover:shadow-[3px_3px_0px_#000]">
                  <input
                    required
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(e, "aadhaar")}
                    className="hidden"
                  />
                  {aadhaarPreview ? (
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-black">
                        <Image src={aadhaarPreview} alt="Aadhaar preview" fill className="object-cover" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-extrabold text-black truncate max-w-[200px]">
                          {aadhaarFile?.name}
                        </p>
                        <p className="text-[10px] font-bold text-green-700">✓ Aadhaar Card Attached</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="mx-auto mb-1 flex h-9 w-9 items-center justify-center rounded-full bg-[#E5A00D]/20 text-black">
                        📄
                      </div>
                      <p className="text-xs font-extrabold text-black">Click to upload Aadhaar Card</p>
                      <p className="text-[10px] font-bold text-black/50">JPG, PNG, WEBP, or PDF (Max 8MB)</p>
                    </div>
                  )}
                </label>
              </div>

              {/* College / Institutional ID Upload Box */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black">
                  College ID / Institutional ID <span className="text-red-600">*</span>
                </label>
                <label className="group relative mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-black bg-[#FFF8EE]/90 p-4 transition-all hover:bg-[#FFF8EE] hover:border-[#E5A00D] hover:shadow-[3px_3px_0px_#000]">
                  <input
                    required
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(e, "idProof")}
                    className="hidden"
                  />
                  {idProofPreview ? (
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-black">
                        <Image src={idProofPreview} alt="Institutional ID preview" fill className="object-cover" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-extrabold text-black truncate max-w-[200px]">
                          {idProofFile?.name}
                        </p>
                        <p className="text-[10px] font-bold text-green-700">✓ Institutional ID Attached</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="mx-auto mb-1 flex h-9 w-9 items-center justify-center rounded-full bg-[#E5A00D]/20 text-black">
                        🎴
                      </div>
                      <p className="text-xs font-extrabold text-black">Click to upload College / Institutional ID</p>
                      <p className="text-[10px] font-bold text-black/50">JPG, PNG, WEBP, or PDF (Max 8MB)</p>
                    </div>
                  )}
                </label>
              </div>

              {error && (
                <div className="rounded-xl border-2 border-red-900 bg-red-100 p-3 text-xs font-bold text-red-900 shadow-[2px_2px_0px_#000]">
                  ⚠️ {error}
                </div>
              )}

              <button disabled={loading} type="submit" className={primaryButtonClassName}>
                {loading ? "Submitting Documents..." : "Submit Verification ✓"}
              </button>
            </form>
          </AuthShell>
        </div>
      )}

      {/* ── STEP 3: SUCCESS STATE ── */}
      {step === 3 && (
        <div className="animate-in fade-in zoom-in-95 duration-500 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-black bg-[#E5A00D] text-3xl shadow-[3px_3px_0px_#000]">
            ⏳
          </div>
          <span className="inline-block rounded-full bg-[#E5A00D]/20 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#000000]">
            Verification Submitted
          </span>
          <h2 className="mt-3 font-outfit text-3xl font-black text-black">
            Request Awaiting Review
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-black/80">
            Your verification request has been submitted. You&apos;ll receive full application access once an admin approves your account.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => router.push("/verification-pending")}
              className={primaryButtonClassName}
            >
              Check Status →
            </button>
            <Link
              href="/"
              className="text-xs font-extrabold text-black/70 hover:text-black underline"
            >
              Return to Home Page
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="w-full text-center text-xs font-bold text-black/60">Loading registration...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
