"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { UploadCloud, X, RefreshCw, Loader2, CheckCircle2, AlertCircle, ImageIcon } from "lucide-react";

interface ImageUploaderProps {
  folder: "meals" | "categories" | "offers" | "subscriptions" | "users/avatars" | "branding";
  value?: string | null;
  name?: string; // Form input name e.g. "imageUrl"
  onChange?: (publicUrl: string) => void;
  onRemove?: () => void;
  label?: string;
  maxSizeMB?: number;
  allowedTypes?: string[];
  disabled?: boolean;
}

export default function ImageUploader({
  folder,
  value = "",
  name = "imageUrl",
  onChange,
  onRemove,
  label = "Upload Image",
  maxSizeMB = 5,
  allowedTypes = ["image/jpeg", "image/png", "image/webp"],
  disabled = false,
}: ImageUploaderProps) {
  const [currentUrl, setCurrentUrl] = useState<string>(value || "");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync internal state if value prop changes
  React.useEffect(() => {
    setCurrentUrl(value || "");
  }, [value]);

  const validateAndUploadFile = async (file: File) => {
    setErrorMsg(null);

    // Validate type
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setErrorMsg("Invalid file format. Please upload JPG, PNG, or WEBP.");
      return;
    }

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setErrorMsg(`File size exceeds ${maxSizeMB}MB limit.`);
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(20);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      setUploadProgress(50);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(85);

      const data = await res.json();
      setIsUploading(false);

      if (!res.ok) {
        setErrorMsg(data.error || "Failed to upload image.");
        return;
      }

      setUploadProgress(100);
      const url = data.publicUrl;
      setCurrentUrl(url);
      if (onChange) onChange(url);
    } catch (err) {
      setIsUploading(false);
      setErrorMsg("Network error occurred during upload.");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndUploadFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndUploadFile(files[0]);
    }
  };

  const handleRemove = () => {
    setCurrentUrl("");
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (onChange) onChange("");
    if (onRemove) onRemove();
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-outfit font-black uppercase text-[#0F3329]">
          {label}
        </label>
      )}

      {/* Hidden input to ensure native form submission works */}
      <input type="hidden" name={name} value={currentUrl} />

      {/* Hidden file input element */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* PREVIEW STATE */}
      {currentUrl ? (
        <div className="relative rounded-2xl border-2 border-[#0F3329] overflow-hidden bg-[#f5e3cd]/50 p-3 space-y-3">
          <div className="w-full h-44 sm:h-52 relative rounded-xl border border-[#0F3329]/20 overflow-hidden bg-white">
            <Image
              src={currentUrl}
              alt="Uploaded preview"
              fill
              className="object-cover"
            />
            <div className="absolute top-2 right-2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-3 py-1.5 rounded-xl bg-[#0F3329] text-[#E5A00D] font-outfit text-xs font-black uppercase flex items-center gap-1 shadow-md hover:bg-[#1B4D3E] transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Replace</span>
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={isUploading}
                className="p-1.5 rounded-xl bg-red-700 text-white font-outfit text-xs font-black uppercase shadow-md hover:bg-red-800 transition-all"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-outfit font-extrabold uppercase text-[#0F3329]">
            <span className="flex items-center gap-1 text-emerald-800">
              <CheckCircle2 className="w-4 h-4" />
              Stored in Supabase bucket ({folder}/)
            </span>
            <span className="truncate max-w-[200px] text-[#0F3329]/60">
              {currentUrl.split("/").pop()}
            </span>
          </div>
        </div>
      ) : (
        /* UPLOAD DRAG & DROP ZONE */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center text-center space-y-3 ${
            isDragOver
              ? "border-[#0F3329] bg-[#0F3329]/10 scale-[1.01]"
              : "border-[#0F3329]/30 bg-[#FFF8EE] hover:border-[#0F3329]"
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-[#0F3329] text-[#E5A00D] flex items-center justify-center shadow-sm">
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>

          <div className="space-y-1">
            <p className="font-outfit font-black text-xs sm:text-sm uppercase text-[#0F3329]">
              {isUploading ? "Uploading Image to Supabase..." : "Drag & Drop Image or Click to Browse"}
            </p>
            <p className="font-sans text-[11px] text-[#0F3329]/60 font-semibold">
              Supports JPG, PNG, WEBP (Max {maxSizeMB}MB)
            </p>
          </div>

          {isUploading && (
            <div className="w-full max-w-xs space-y-1">
              <div className="w-full h-2 rounded-full bg-[#0F3329]/20 overflow-hidden">
                <div
                  className="h-full bg-[#0F3329] rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="font-outfit text-[10px] font-bold uppercase text-[#0F3329]/70">
                {uploadProgress}% Uploaded
              </span>
            </div>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-100 border border-red-400 text-red-900 text-xs font-sans font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-700" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
