import React, { useState } from 'react';

interface BeforeRegretLogoProps {
  className?: string;
  size?: number; // width/height of the emblem area
  showText?: boolean; // whether to show "Before Regret" text & tagline below
  lightTheme?: boolean; // whether the container background is light or dark
}

export default function BeforeRegretLogo({
  className = '',
  size = 140,
  showText = true,
  lightTheme = false,
}: BeforeRegretLogoProps) {
  // Define colors based on theme
  const navyColor = lightTheme ? '#24324A' : '#FAF8F2';
  const coralColor = '#E15A3E'; // The exact vibrant orange-coral from the user's uploaded logo
  const mutedTextColor = lightTheme ? '#57606A' : '#94A3B8';
  const lineDividerColor = lightTheme ? '#E5E7EB' : '#4B5563';

  // Return pristine custom two-heart vector SVG that matches the uploaded logo perfectly
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      {/* Emblem SVG */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 115 115"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transform hover:scale-105 transition-transform duration-300"
      >
        {/* Heart 1: Slate Blue (Navy) */}
        <path 
          d="M 50 30 C 50 30 45 15 30 15 C 15 15 5 25 5 40 C 5 60 30 80 50 95 C 70 80 95 60 95 40 C 95 25 85 15 70 15 C 55 15 50 30 50 30 Z" 
          fill={navyColor}
          transform="translate(5, 5) scale(0.7)"
        />
        {/* Heart 2: Orange Coral with stroke separation */}
        <path 
          d="M 50 30 C 50 30 45 15 30 15 C 15 15 5 25 5 40 C 5 60 30 80 50 95 C 70 80 95 60 95 40 C 95 25 85 15 70 15 C 55 15 50 30 50 30 Z" 
          fill={coralColor}
          stroke={lightTheme ? '#FAF8F2' : '#1A1D20'}
          strokeWidth="8"
          strokeLinejoin="round"
          transform="translate(40, 40) scale(0.7)"
        />
      </svg>

      {/* Brand Text */}
      {showText && (
        <div className="mt-3 font-sans max-w-sm">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-none">
            <span style={{ color: navyColor }}>Before</span>
            <span style={{ color: coralColor }}>Regret</span>
          </h1>
          
          <div className="flex items-center justify-center gap-2.5 my-1.5 px-3">
            <div className="h-[1px] flex-1" style={{ backgroundColor: lineDividerColor }} />
            <svg className="w-2.5 h-2.5" style={{ fill: coralColor }} viewBox="0 0 115 115">
              <path d="M 50 30 C 50 30 45 15 30 15 C 15 15 5 25 5 40 C 5 60 30 80 50 95 C 70 80 95 60 95 40 C 95 25 85 15 70 15 C 55 15 50 30 50 30 Z" />
            </svg>
            <div className="h-[1px] flex-1" style={{ backgroundColor: lineDividerColor }} />
          </div>

          <p
            className="text-[6.5px] uppercase tracking-[0.2em] font-black font-sans leading-none"
            style={{ color: mutedTextColor }}
          >
            RELATIONSHIP COURT • REAL PEOPLE • REAL VERDICTS
          </p>
        </div>
      )}
    </div>
  );
}

