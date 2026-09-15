"use client";

import { useState, useEffect, useRef } from "react";
import {
  QrCode,
  Camera,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Package,
  User,
  Phone,
  MapPin,
  Utensils,
  ArrowRight,
  RefreshCw,
  Upload,
  ShieldCheck,
  Check,
  Sparkles,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { formatOrderId } from "@/lib/utils/orderIdFormatter";

interface VerifiedOrderData {
  orderId: string;
  orderIdDisplay: string;
  status: string;
  qrStatus: string;
  totalAmount: number;
  customer: {
    name: string;
    phone: string;
    email: string;
    address: string;
    area?: string;
    city?: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

interface DeliveryQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetOrderId?: string;
  onDeliveryConfirmed: (orderId: string) => void;
}

export default function DeliveryQrScannerModal({
  isOpen,
  onClose,
  targetOrderId,
  onDeliveryConfirmed,
}: DeliveryQrScannerModalProps) {
  const [activeMode, setActiveMode] = useState<"CAMERA" | "FILE" | "MANUAL">("CAMERA");
  const [scannerActive, setScannerActive] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [verifiedOrder, setVerifiedOrder] = useState<VerifiedOrderData | null>(null);
  const [completingDelivery, setCompletingDelivery] = useState(false);
  const [completedSuccess, setCompletedSuccess] = useState(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "delivery-qr-reader-region";
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCameraScanner();
      setVerifiedOrder(null);
      setErrorMsg(null);
      setErrorDetails(null);
      setCompletedSuccess(false);
      setManualCode("");
      return;
    }

    if (activeMode === "CAMERA" && !verifiedOrder && !completedSuccess) {
      const timer = setTimeout(() => {
        startCameraScanner();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeMode, verifiedOrder, completedSuccess]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCameraScanner();
    };
  }, []);

  async function startCameraScanner() {
    try {
      const container = document.getElementById(scannerContainerId);
      if (!container) return;

      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            await html5QrCodeRef.current.stop();
          }
        } catch (_) {}
      }

      const qrScanner = new Html5Qrcode(scannerContainerId);
      html5QrCodeRef.current = qrScanner;

      await qrScanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleQrDecoded(decodedText);
        },
        () => {
          // Frame error (silently ignore until code scanned)
        }
      );
      setScannerActive(true);
      setErrorMsg(null);
    } catch (err: any) {
      console.warn("Camera start failed or permission denied:", err);
      setScannerActive(false);
      setErrorMsg("Camera access failed or permission denied.");
      setErrorDetails("You can upload a photo of the QR code or enter the code manually.");
    }
  }

  async function stopCameraScanner() {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (err) {
        // Ignore stop error
      }
      html5QrCodeRef.current = null;
    }
    setScannerActive(false);
  }

  async function handleQrDecoded(code: string) {
    if (verifying || verifiedOrder) return;
    await stopCameraScanner();
    await verifyTokenOnServer(code.trim());
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setVerifying(true);
      setErrorMsg(null);
      setErrorDetails(null);

      const html5Qr = new Html5Qrcode("delivery-qr-file-region");
      const decodedText = await html5Qr.scanFile(file, true);
      html5Qr.clear();
      await verifyTokenOnServer(decodedText.trim());
    } catch (err: any) {
      setErrorMsg("Invalid or unreadable QR code image.");
      setErrorDetails("Could not detect a valid The Q-Bowl QR code in this image. Please try again or use live camera scan.");
    } finally {
      setVerifying(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualCode.trim()) return;
    await verifyTokenOnServer(manualCode.trim());
  }

  async function verifyTokenOnServer(token: string) {
    setVerifying(true);
    setErrorMsg(null);
    setErrorDetails(null);

    try {
      const res = await fetch("/api/delivery/verify-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrToken: token,
          orderId: targetOrderId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg("Invalid or unauthorized QR code. This order cannot be marked as delivered.");
        setErrorDetails(data.error || "The QR code is invalid, already used, or not assigned to your delivery fleet account.");
        setVerifiedOrder(null);
        return;
      }

      const rawOrder = data.order || {};
      const normalized: VerifiedOrderData = {
        orderId: rawOrder.orderId || rawOrder.id || "",
        orderIdDisplay: rawOrder.orderIdDisplay || rawOrder.id || "",
        status: rawOrder.status || "CONFIRMED",
        qrStatus: rawOrder.qrStatus || "ACTIVE",
        totalAmount: rawOrder.totalAmount ?? rawOrder.total ?? 0,
        customer: {
          name: rawOrder.customer?.name || rawOrder.customerName || "Customer",
          phone: rawOrder.customer?.phone || rawOrder.customerPhone || "N/A",
          email: rawOrder.customer?.email || rawOrder.customerEmail || "",
          address: rawOrder.customer?.address || rawOrder.address || "Customer Delivery Address",
          area: rawOrder.customer?.area || rawOrder.area || "",
          city: rawOrder.customer?.city || rawOrder.city || "",
        },
        items: Array.isArray(rawOrder.items) ? rawOrder.items : [],
      };

      setVerifiedOrder(normalized);
      setCompletedSuccess(true);
      onDeliveryConfirmed(normalized.orderId);
    } catch (err: any) {
      console.error("QR verification network error:", err);
      setErrorMsg("Verification network failure.");
      setErrorDetails("Could not connect to server to verify QR code. Please check your network.");
    } finally {
      setVerifying(false);
    }
  }

  function handleResetScanner() {
    setVerifiedOrder(null);
    setErrorMsg(null);
    setErrorDetails(null);
    setCompletedSuccess(false);
    setManualCode("");
    setActiveMode("CAMERA");
    setTimeout(() => {
      startCameraScanner();
    }, 200);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white border-3 border-black w-full max-w-lg rounded-3xl shadow-[8px_8px_0_#000] p-5 sm:p-7 space-y-5 relative text-black max-h-[92vh] overflow-y-auto">
        
        {/* Hidden region for file scanning */}
        <div id="delivery-qr-file-region" className="hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b-2 border-black/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-[#E5A00D] border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0_#000]">
              <QrCode size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-outfit text-xl sm:text-2xl font-black uppercase tracking-tight text-black leading-none">
                QR Delivery Scanner
              </h3>
              <p className="text-xs font-bold text-zinc-500 mt-1">
                Scan customer&apos;s phone pass to verify handover
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCameraScanner();
              onClose();
            }}
            className="p-2 rounded-2xl hover:bg-zinc-100 border border-transparent hover:border-black text-black transition-all"
            aria-label="Close scanner"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── STATE 1: COMPLETED SUCCESS & HANDOVER RECEIPT SCREEN ── */}
        {completedSuccess && verifiedOrder && (
          <div className="py-2 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-3">
              <div className="h-16 w-16 mx-auto rounded-3xl bg-emerald-400 border-3 border-black flex items-center justify-center shadow-[4px_4px_0_#000]">
                <CheckCircle2 size={36} className="text-black stroke-[2.5]" />
              </div>

              <div className="space-y-1">
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-outfit text-xs font-black uppercase tracking-wider">
                  Handover Complete ✓
                </span>
                <h4 className="font-outfit text-2xl sm:text-3xl font-black uppercase text-black">
                  Order Delivered!
                </h4>
                <p className="text-xs font-bold text-zinc-600 max-w-sm mx-auto">
                  Order <span className="font-mono text-black font-black">{verifiedOrder.orderIdDisplay}</span> has been verified and marked as delivered in real-time.
                </p>
              </div>
            </div>

            {/* Customer & Handover Receipt Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FFF8EE] border-2 border-black space-y-3.5 text-xs">
              <div className="flex items-center justify-between border-b border-black/10 pb-2.5">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">Order Reference</span>
                  <h4 className="font-outfit text-base font-black uppercase text-black">
                    {verifiedOrder.orderIdDisplay}
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">Amount Collected</span>
                  <span className="font-outfit text-base font-black text-black">₹{verifiedOrder.totalAmount}</span>
                </div>
              </div>

              {/* Customer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1">
                    <User size={12} /> Customer Name
                  </span>
                  <p className="font-outfit font-black text-black text-sm mt-0.5">{verifiedOrder.customer?.name || "Customer"}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1">
                    <Phone size={12} /> Contact Number
                  </span>
                  <a
                    href={`tel:${verifiedOrder.customer?.phone || ""}`}
                    className="font-mono font-bold text-black text-xs mt-0.5 hover:underline flex items-center gap-1"
                  >
                    <span>{verifiedOrder.customer?.phone || "N/A"}</span>
                  </a>
                </div>
              </div>

              {/* Address */}
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1">
                  <MapPin size={12} className="text-rose-500" /> Delivery Address
                </span>
                <p className="font-semibold text-zinc-800 mt-0.5 leading-relaxed">
                  {verifiedOrder.customer?.address || "Customer Delivery Address"}
                  {verifiedOrder.customer?.area && `, ${verifiedOrder.customer.area}`}
                  {verifiedOrder.customer?.city && `, ${verifiedOrder.customer.city}`}
                </p>
              </div>

              {/* Items List */}
              <div className="space-y-1.5 pt-2 border-t border-black/10">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                  <Utensils size={12} className="text-[#E5A00D]" /> Delivered Bowls
                </span>
                <div className="divide-y divide-black/5 bg-white rounded-xl border border-black/15 p-2.5 space-y-1">
                  {verifiedOrder.items && verifiedOrder.items.length > 0 ? (
                    verifiedOrder.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center py-1 text-xs">
                        <span className="font-black text-black">
                          {it.name} <span className="text-zinc-500 font-bold">x{it.quantity}</span>
                        </span>
                        <span className="font-mono font-bold text-zinc-700">₹{it.totalPrice || it.unitPrice * it.quantity}</span>
                      </div>
                    ))
                  ) : (
                    <div className="py-1 text-xs text-zinc-500 font-medium">Standard Prepared Meal Order</div>
                  )}
                </div>
              </div>

              {/* QR Token Status */}
              <div className="flex justify-between items-center font-bold border-t border-black/10 pt-2 text-[11px]">
                <span className="text-zinc-500 uppercase text-[10px]">QR Verification Status:</span>
                <span className="text-emerald-700 uppercase font-black flex items-center gap-1">
                  <Check size={12} className="stroke-[3]" /> Verified &amp; Closed
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                type="button"
                onClick={handleResetScanner}
                className="w-full sm:w-1/2 py-3.5 rounded-2xl border-2 border-black bg-white hover:bg-zinc-100 font-outfit font-black text-xs uppercase tracking-wider text-black transition-all"
              >
                Scan Next Order
              </button>
              <button
                type="button"
                onClick={() => {
                  stopCameraScanner();
                  onClose();
                }}
                className="w-full sm:w-1/2 py-3.5 rounded-2xl bg-black text-[#E5A00D] hover:bg-[#E5A00D] hover:text-black font-outfit font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0_#000] transition-all"
              >
                Done &amp; Close
              </button>
            </div>
          </div>
        )}

        {/* ── STATE 2: SCANNER / UPLOAD / MANUAL INPUT ── */}
        {!completedSuccess && (
          <div className="space-y-4">
            {/* Mode Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-zinc-100 border border-black/15 text-xs font-outfit font-black uppercase">
              <button
                type="button"
                onClick={() => {
                  setActiveMode("CAMERA");
                  setErrorMsg(null);
                }}
                className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeMode === "CAMERA"
                    ? "bg-black text-[#E5A00D] shadow-sm"
                    : "text-zinc-600 hover:text-black"
                }`}
              >
                <Camera size={14} />
                <span>Live Cam</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopCameraScanner();
                  setActiveMode("FILE");
                  setErrorMsg(null);
                }}
                className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeMode === "FILE"
                    ? "bg-black text-[#E5A00D] shadow-sm"
                    : "text-zinc-600 hover:text-black"
                }`}
              >
                <Upload size={14} />
                <span>Upload QR</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopCameraScanner();
                  setActiveMode("MANUAL");
                  setErrorMsg(null);
                }}
                className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeMode === "MANUAL"
                    ? "bg-black text-[#E5A00D] shadow-sm"
                    : "text-zinc-600 hover:text-black"
                }`}
              >
                <Package size={14} />
                <span>Enter Code</span>
              </button>
            </div>

            {/* Error Message Box */}
            {errorMsg && (
              <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-500 text-rose-900 text-xs font-bold flex items-start gap-3 animate-in fade-in duration-200">
                <AlertCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-outfit font-black uppercase tracking-wider">{errorMsg}</p>
                  {errorDetails && <p className="font-medium text-[11px] text-rose-800 leading-relaxed">{errorDetails}</p>}
                  <button
                    type="button"
                    onClick={handleResetScanner}
                    className="inline-flex items-center gap-1 mt-2 text-[11px] font-black uppercase text-rose-900 underline hover:text-black"
                  >
                    <RefreshCw size={11} /> Try Scanning Again
                  </button>
                </div>
              </div>
            )}

            {/* Verifying Spinner */}
            {verifying && (
              <div className="p-8 rounded-3xl bg-[#FFF8EE] border-2 border-black text-center space-y-3">
                <Loader2 size={36} className="animate-spin text-[#E5A00D] mx-auto" />
                <div className="space-y-1">
                  <h4 className="font-outfit text-base font-black uppercase text-black">
                    Verifying Delivery Pass...
                  </h4>
                  <p className="text-xs font-bold text-zinc-500">
                    Checking authorization, order token &amp; driver assignment.
                  </p>
                </div>
              </div>
            )}

            {/* Camera View Mode */}
            {activeMode === "CAMERA" && !verifying && (
              <div className="space-y-3">
                <div className="relative overflow-hidden rounded-3xl border-3 border-black bg-zinc-950 min-h-[280px] flex flex-col items-center justify-center">
                  <div id={scannerContainerId} className="w-full h-full overflow-hidden" />

                  {/* Corner Targets for Visual Aid */}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="w-56 h-56 border-2 border-dashed border-[#E5A00D]/80 rounded-2xl animate-pulse" />
                  </div>
                </div>

                <p className="text-center text-[11px] font-bold text-zinc-500">
                  Point camera directly at customer&apos;s The Q-Bowl QR screen.
                </p>
              </div>
            )}

            {/* File Upload Mode */}
            {activeMode === "FILE" && !verifying && (
              <div className="p-8 rounded-3xl border-2 border-dashed border-black bg-[#FFF8EE]/60 text-center space-y-4">
                <div className="h-14 w-14 rounded-2xl bg-white border-2 border-black flex items-center justify-center mx-auto shadow-[2px_2px_0_#000]">
                  <Upload size={24} className="text-[#E5A00D]" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-outfit text-sm font-black uppercase text-black">
                    Upload Screenshot or Photo of QR
                  </h4>
                  <p className="text-xs font-semibold text-zinc-500 max-w-xs mx-auto">
                    Select an image containing the customer&apos;s unique order QR pass.
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="qr-file-input"
                />
                <label
                  htmlFor="qr-file-input"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black text-[#E5A00D] hover:bg-[#E5A00D] hover:text-black font-outfit font-black text-xs uppercase tracking-wider border-2 border-black cursor-pointer shadow-[2px_2px_0_#000] transition-all"
                >
                  <Upload size={14} /> Choose Image File
                </label>
              </div>
            )}

            {/* Manual Code Input Mode */}
            {activeMode === "MANUAL" && !verifying && (
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase tracking-wider text-black">
                    Enter Verification Code / Token
                  </label>
                  <input
                    type="text"
                    required
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="e.g. QB-QR-xxxxx or Order ID"
                    className="w-full px-4 py-3 rounded-2xl border-2 border-black bg-[#FFF8EE] font-mono font-bold text-xs uppercase text-black focus:outline-none focus:bg-white shadow-[2px_2px_0_#000]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!manualCode.trim()}
                  className="w-full py-3 rounded-2xl bg-black text-[#E5A00D] hover:bg-[#E5A00D] hover:text-black font-outfit font-black text-xs uppercase tracking-wider border-2 border-black shadow-[2px_2px_0_#000] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span>Verify Code</span>
                  <ArrowRight size={14} />
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
