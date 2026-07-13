import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 32 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={`rounded-lg overflow-hidden select-none ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Symmetrical/beautiful radial-like or linear gradient matching the uploaded logo */}
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f48163" />    {/* Soft warm coral */}
          <stop offset="45%" stopColor="#fbd351" />   {/* Bright glowing yellow-gold */}
          <stop offset="100%" stopColor="#da9845" />  {/* Warm golden amber */}
        </linearGradient>
      </defs>

      {/* Gradient Background */}
      <rect width="120" height="120" fill="url(#logoGradient)" />

      {/* Symmetrical Pillars (BTS-style logo) */}
      <g fill="#ffffff">
        {/* Left Pillar: outer edge (left) is long, slants down-right to a shorter inner edge (right) */}
        {/* Points: (44, 24) [top-left], (55, 30) [top-right], (55, 96) [bottom-right], (44, 96) [bottom-left] */}
        <polygon points="44,24 55,30 55,96 44,96" />

        {/* Right Pillar: inner edge (left) is short, slants up-right to a longer outer edge (right) */}
        {/* Points: (65, 30) [top-left], (76, 24) [top-right], (76, 96) [bottom-right], (65, 96) [bottom-left] */}
        <polygon points="65,30 76,24 76,96 65,96" />
      </g>
    </svg>
  );
};
