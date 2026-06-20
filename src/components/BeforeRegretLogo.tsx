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
  // Try loading your exact uploaded logo.png; fall back to the vector SVG if it doesn't exist
  const [imgFailed, setImgFailed] = useState(false);

  // Define colors based on theme
  const navyColor = lightTheme ? '#1B2B3E' : '#F8FAFC';
  const coralColor = '#E07A5F'; // Constant warm coral color
  const mutedTextColor = lightTheme ? '#57606A' : '#94A3B8';
  const lineDividerColor = lightTheme ? '#CCCCCC' : '#4B5563';

  // If we should use the loaded PNG, we render it directly
  if (!imgFailed) {
    return (
      <div className={`flex flex-col items-center justify-center text-center ${className}`}>
        <img
          src="/logo.png"
          alt="Before Regret Logo"
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          style={{
            width: size + (showText ? 40 : 0),
            height: 'auto',
            maxHeight: size * 1.5,
            objectFit: 'contain'
          }}
          className="transform hover:scale-105 transition-transform duration-300"
        />
      </div>
    );
  }

  // Fallback: pristine custom vector SVG that mirrors your uploaded image style
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      {/* Emblem SVG */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transform hover:scale-105 transition-transform duration-300"
      >
        {/* Heart background outline */}
        <path
          d="M 100 52 C 75 25, 45 42, 45 74 C 45 105, 80 128, 100 144"
          fill="none"
          stroke={coralColor}
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M 100 52 C 125 25, 155 42, 155 74 C 155 105, 120 128, 100 144"
          fill="none"
          stroke={navyColor}
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Balance Scales */}
        <g stroke={navyColor} strokeWidth="2.5" fill="none" strokeLinecap="round">
          <path d="M 88 152 L 112 152 M 94 146 L 106 146" strokeWidth="3" />
          <circle cx="100" cy="38" r="4.5" fill={navyColor} stroke="none" />
          <path d="M 40 62 Q 100 42 160 62" strokeWidth="3.5" />
          
          {/* Left pan */}
          <line x1="40" y1="62" x2="25" y2="100" strokeWidth="1.2" />
          <line x1="40" y1="62" x2="55" y2="100" strokeWidth="1.2" />
          <path d="M 22 100 C 22 108, 58 108, 58 100 Z" fill={coralColor} stroke="none" />
          <line x1="22" y1="100" x2="58" y2="100" strokeWidth="2" stroke={navyColor} />

          {/* Right pan */}
          <line x1="160" y1="62" x2="145" y2="100" strokeWidth="1.2" />
          <line x1="160" y1="62" x2="175" y2="100" strokeWidth="1.2" />
          <path d="M 142 100 C 142 108, 178 108, 178 100 Z" fill={navyColor} stroke="none" />
          <line x1="142" y1="100" x2="178" y2="100" strokeWidth="2" stroke={navyColor} />
        </g>

        {/* Diagonal Gavel */}
        <g transform="translate(100, 96) rotate(-35)">
          <path d="M -16 15 L 16 15 C 16 15, 12 10, 10 10 L -10 10 C -12 10, -16 15, -16 15 Z" fill={navyColor} />
          <path d="M -2.2 -24 L 2.2 -24 L 2.2 10 L -2.2 10 Z" fill={navyColor} />
          <circle cx="0" cy="11" r="2.5" fill={navyColor} />
          <rect x="-14" y="-8" width="28" height="14" rx="2" fill={navyColor} />
          <rect x="-17" y="-10" width="4" height="18" rx="1.2" fill={coralColor} />
          <rect x="13" y="-10" width="4" height="18" rx="1.2" fill={coralColor} />
          <circle cx="0" cy="-1" r="2.5" fill={coralColor} />
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

