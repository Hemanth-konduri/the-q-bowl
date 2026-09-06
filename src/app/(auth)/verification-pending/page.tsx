"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell, primaryButtonClassName } from "../components/auth-shell";

export default function VerificationPendingPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkStatus() {
      try {
        const response = await fetch("/api/auth/identity");
        if (!response.ok) return;
        const result = await response.json();
        if (!active) return;

        setStatus(result.verificationStatus || "PENDING");
        setMessage(result.request?.reviewNotes ?? "");

        if (result.verificationStatus === "APPROVED") {
          router.replace("/dashboard");
        } else if (!result.hasUploadedDocs) {
          router.replace("/identity-verification");
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    }

    checkStatus();
    const interval = window.setInterval(checkStatus, 5000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [router]);

  return (
    <div className="animate-in fade-in zoom-in-95 duration-300 w-full">
      <AuthShell
        eyebrow="Verification Status"
        title={
          status === "REJECTED"
            ? "Verification Rejected"
            : status === "APPROVED"
            ? "Account Approved!"
            : "Review In Progress"
        }
        description={
          status === "REJECTED"
            ? "Your document verification request was reviewed and requires updates."
            : status === "APPROVED"
            ? "Your identity has been verified. Accessing your dashboard..."
            : "Your documents have been submitted securely and are awaiting admin approval."
        }
      >
        <div className="space-y-5">
          {/* Status Indicator Card */}
          <div className="flex items-center gap-4 rounded-2xl border-2 border-black bg-[#FFF8EE]/90 p-4 shadow-[3px_3px_0px_#000]">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-black font-extrabold text-lg shadow-[2px_2px_0px_#000] ${
                status === "PENDING"
                  ? "bg-[#E5A00D] animate-pulse text-black"
                  : status === "REJECTED"
                  ? "bg-red-500 text-white"
                  : "bg-green-500 text-white"
              }`}
            >
              {status === "PENDING" ? "⏳" : status === "REJECTED" ? "❌" : "✓"}
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-black">
                {status === "PENDING"
                  ? "Verification Pending"
                  : status === "REJECTED"
                  ? "Action Required"
                  : "Approved"}
              </p>
              <p className="mt-0.5 text-xs font-bold text-black/60">
                {status === "PENDING"
                  ? "Checking automatically every 5 seconds..."
                  : status === "REJECTED"
                  ? "Re-upload documents to proceed."
                  : "Redirecting..."}
              </p>
            </div>
          </div>

          {/* Rejection Note Display */}
          {status === "REJECTED" && message && (
            <div className="rounded-2xl border-2 border-red-900 bg-red-100 p-4 text-xs text-red-950 shadow-[3px_3px_0px_#000]">
              <p className="font-extrabold uppercase tracking-wider text-red-900">Rejection Reason:</p>
              <p className="mt-1 font-bold text-black">{message}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-2">
            {status === "REJECTED" ? (
              <button
                type="button"
                onClick={() => router.push("/identity-verification")}
                className={primaryButtonClassName}
              >
                Re-upload Documents →
              </button>
            ) : (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className={primaryButtonClassName}
              >
                {loading ? "Checking Status..." : "Refresh Status Now 🔄"}
              </button>
            )}

            <div className="text-center pt-1">
              <Link
                href="/"
                className="text-xs font-extrabold text-black/70 hover:text-black underline"
              >
                Return to Home Page
              </Link>
            </div>
          </div>
        </div>
      </AuthShell>
    </div>
  );
}
