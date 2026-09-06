"use client";

import { FormEvent, useState, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AuthShell, primaryButtonClassName } from "../components/auth-shell";

export default function IdentityVerificationPage() {
  const router = useRouter();
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [idProofFile, setIdProofFile] = useState<File | null>(null);
  const [aadhaarPreview, setAadhaarPreview] = useState<string | null>(null);
  const [idProofPreview, setIdProofPreview] = useState<string | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check current status to see if rejected with review notes
    async function fetchStatus() {
      try {
        const res = await fetch("/api/auth/identity");
        if (!res.ok) return;
        const data = await res.json();
        if (data.verificationStatus === "APPROVED") {
          router.replace("/dashboard");
        } else if (data.verificationStatus === "PENDING" && data.hasUploadedDocs) {
          router.replace("/verification-pending");
        } else if (data.verificationStatus === "REJECTED" && (data.reviewNotes || data.request?.reviewNotes)) {
          setRejectionNotes(data.reviewNotes || data.request?.reviewNotes);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchStatus();
  }, [router]);

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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!aadhaarFile || !idProofFile) {
      setError("Please select both your Aadhaar Card and Institutional ID.");
      return;
    }

    setLoading(true);

    const body = new FormData();
    body.append("aadhaar", aadhaarFile);
    body.append("idProof", idProofFile);

    try {
      const response = await fetch("/api/auth/identity", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to submit identity documents.");
      router.push("/verification-pending");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to submit documents.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-in fade-in zoom-in-95 duration-300 w-full">
      <AuthShell
        eyebrow="Step 2 of 2"
        title="Identity Verification"
        description="Upload two valid identification documents for admin verification."
        step={2}
      >
        <form onSubmit={submit} className="space-y-4">
          {rejectionNotes && (
            <div className="rounded-2xl border-2 border-red-900 bg-red-100 p-4 text-xs font-bold text-red-900 shadow-[3px_3px_0px_#000]">
              <p className="font-extrabold text-sm uppercase tracking-wider">⚠️ Previous Submission Rejected</p>
              <p className="mt-1 text-black/80">{rejectionNotes}</p>
              <p className="mt-2 text-[11px] font-bold text-red-950">Please re-upload clear copies of your documents below.</p>
            </div>
          )}

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
            {loading ? "Submitting Documents..." : "Send for Review ✓"}
          </button>
        </form>
      </AuthShell>
    </div>
  );
}
