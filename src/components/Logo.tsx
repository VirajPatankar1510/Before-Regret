import React from 'react';

interface LogoProps {
  className?: string;
  color?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-8 h-8", color = "#1A6CFF" }) => {
  return (
    <svg 
      viewBox="0 0 512 512" 
      className={className} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill={color}
        fillRule="evenodd"
        clipRule="evenodd"
        d="
          M 135 82
          H 295
          C 365 82 395 118 395 175
          C 395 220 370 248 320 256
          C 380 266 402 305 402 355
          C 402 412 365 430 295 430
          H 135
          V 82
          Z

          M 210 150
          H 285
          C 318 150 338 166 338 198
          C 338 230 318 246 285 246
          H 210
          V 150
          Z

          M 267 292
          L 339 345
          V 430
          H 288
          V 372
          H 246
          V 430
          H 195
          V 345
          L 267 292
          Z
        "
      />
    </svg>
  );
};
