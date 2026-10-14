import React from "react";

interface AHFLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  light?: boolean;
}

export default function AHFLogo({ className = "", size = "md", light = false }: AHFLogoProps) {
  const isSm = size === "sm";
  const isLg = size === "lg";

  return (
    <div className={`flex flex-col items-center select-none text-center ${className}`}>
      {/* Rich official dark red square */}
      <div 
        className={`bg-[#A1231E] flex items-center justify-center shadow-xs border border-[#8f1e1a] rounded-sm transition-all duration-300 ${
          isSm ? "w-10 h-10" : isLg ? "w-20 h-20" : "w-14 h-14"
        }`}
      >
        <span 
          className={`text-white font-serif font-bold tracking-tight leading-none uppercase select-none ${
            isSm ? "text-lg" : isLg ? "text-4xl" : "text-2xl"
          }`}
          style={{ fontFamily: "'Space Grotesk', 'Georgia', serif" }}
        >
          AHF
        </span>
      </div>
      {/* ZAMBIA descriptor underneath */}
      <span 
        className={`font-serif font-bold tracking-[0.25em] uppercase mt-1 px-1 leading-none select-none ${
          isSm ? "text-[8px]" : isLg ? "text-xs mt-2" : "text-[10px]"
        } ${light ? "text-slate-100" : "text-slate-900"}`}
        style={{ fontFamily: "'Space Grotesk', 'Georgia', serif" }}
      >
        ZAMBIA
      </span>
    </div>
  );
}
