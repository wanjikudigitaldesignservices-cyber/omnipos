import React from "react";
import Image from "next/image";

interface BrandLogoProps {
  customLogoUrl?: string | null;
  customName?: string | null;
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

export function BrandLogo({
  customLogoUrl,
  customName,
  className = "",
  iconOnly = false,
  size = "md",
}: BrandLogoProps) {
  const sizeMap = {
    sm: { icon: 28, text: "text-lg", sub: "text-[10px]" },
    md: { icon: 36, text: "text-xl", sub: "text-xs" },
    lg: { icon: 48, text: "text-2xl", sub: "text-sm" },
    xl: { icon: 64, text: "text-3xl", sub: "text-base" },
  };

  const currentSize = sizeMap[size];

  // If SME uploaded custom logo inside their workspace
  if (customLogoUrl) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div
          className="relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/80 p-1 shadow-md shadow-indigo-500/10"
          style={{ width: currentSize.icon, height: currentSize.icon }}
        >
          {/* Support base64 or external url */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={customLogoUrl}
            alt={customName || "Business Logo"}
            className="h-full w-full object-contain rounded-lg"
          />
        </div>
        {!iconOnly && (
          <div className="flex flex-col">
            <span className={`font-black tracking-tight text-slate-100 ${currentSize.text}`}>
              {customName || "OmniPOS"}
            </span>
            <span className={`font-medium tracking-wider text-emerald-400 uppercase ${currentSize.sub}`}>
              Verified SME
            </span>
          </div>
        )}
      </div>
    );
  }

  // OmniPOS default branding: geometric cube-and-barcode vector
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div
        className="relative flex items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-indigo-600 p-2 shadow-lg shadow-emerald-500/20"
        style={{ width: currentSize.icon, height: currentSize.icon }}
      >
        {/* Isometric Cube + Barcode Symbol SVG */}
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full"
        >
          {/* Cube Top Face */}
          <path
            d="M50 15 L82 33 L50 51 L18 33 Z"
            fill="#ffffff"
            fillOpacity="0.95"
          />
          {/* Cube Left Face with Barcode slit details */}
          <path
            d="M18 37 L50 55 L50 88 L18 70 Z"
            fill="#0f172a"
            fillOpacity="0.4"
          />
          {/* Barcode Lines on Left Face */}
          <line x1="26" y1="45" x2="26" y2="65" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="33" y1="49" x2="33" y2="69" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="39" y1="52" x2="39" y2="72" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
          <line x1="45" y1="55" x2="45" y2="76" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />

          {/* Cube Right Face with Highlighting */}
          <path
            d="M50 55 L82 37 L82 70 L50 88 Z"
            fill="#10b981"
            fillOpacity="0.8"
          />
          {/* POS Scanner Beam across right face */}
          <line x1="53" y1="67" x2="79" y2="52" stroke="#6ee7b7" strokeWidth="2" strokeDasharray="3 2" />
        </svg>
      </div>

      {!iconOnly && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className={`font-extrabold tracking-tight text-white ${currentSize.text}`}>
              Omni<span className="text-emerald-400">POS</span>
            </span>
          </div>
          <span className={`font-semibold tracking-widest text-slate-400 uppercase ${currentSize.sub}`}>
            Universal SME ERP
          </span>
        </div>
      )}
    </div>
  );
}
