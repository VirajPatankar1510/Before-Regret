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
  const navyColor = lightTheme ? '#1B2B3E' : '#F8FAFC';
  const coralColor = '#E07A5F'; // Constant warm coral color
  const mutedTextColor = lightTheme ? '#57606A' : '#94A3B8';
  const lineDividerColor = lightTheme ? '#CCCCCC' : '#4B5563';

  // Return pristine custom two-heart vector SVG that is highly polished
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      {/* Emblem SVG */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transform hover:scale-105 transition-transform duration-300"
      >
        {/* Left / Background Heart (Theme Navy/White) */}
        <g transform="translate(14, 18) scale(2.2)" opacity="0.9">
          <path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            fill={navyColor}
          />
        </g>
        
        {/* Right / Foreground Heart (Coral Red, overlapping) */}
        <g transform="translate(38, 34) scale(2.2)">
          {/* Stroke separator to give clear separation between the overlapping hearts */}
          <path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            fill={coralColor}
            stroke={lightTheme ? '#FAF9F6' : '#1A1D20'}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </g>
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
            <svg className="w-2.5 h-2.5" style={{ fill: coralColor }} viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
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

