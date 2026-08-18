"use client";

import Image from "next/image";

interface StickerPeelProps {
  src: string;
  alt: string;
  className?: string;
  rotation?: string;
}

export default function StickerPeel({ src, alt, className = "", rotation = "rotate-6" }: StickerPeelProps) {
  return (
    <div className={`relative group sticker-container inline-block ${rotation} ${className}`}>
      <div className="relative rounded-2xl overflow-hidden p-2 bg-white border-2 border-[#1B4D3E] shadow-[4px_4px_0px_#1B4D3E] transition-all duration-300">
        <div className="relative w-full h-full rounded-xl overflow-hidden">
          <Image
            src={src}
            alt={alt}
            width={300}
            height={300}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        {/* Subtle shine lighting */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}
