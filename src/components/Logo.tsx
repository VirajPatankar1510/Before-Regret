import React from 'react';

interface LogoProps {
  className?: string;
  color?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-8 h-8", color = "#2563EB" }) => {
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
          M 88 40
          H 320
          C 390 40 430 80 430 135
          C 430 190 390 230 330 238
          C 400 248 435 292 435 365
          C 435 435 390 472 325 472
          H 88
          V 40
          Z

          M 188 122
          H 295
          C 325 122 340 135 340 162
          C 340 190 325 202 295 202
          H 188
          V 122
          Z

          M 175 472
          V 360
          L 256 295
          L 337 360
          V 472
          H 278
          V 402
          H 232
          V 472
          H 175
          Z
        "
      />
    </svg>
  );
};
