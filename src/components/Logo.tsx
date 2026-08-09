import React from 'react';

interface LogoProps {
  className?: string;
  color?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-8 h-8", color = "#1A6CFF" }) => {
  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill={color}
        fillRule="evenodd"
        clipRule="evenodd"
        d="
          M 40 30
          L 160 30
          L 160 380
          L 40 380
          Z

          M 160 30
          L 250 30
          A 110 175 0 0 1 250 380
          L 160 380
          Z

          M 195 65
          L 222 65
          A 68 55 0 0 1 222 175
          L 195 175
          Z

          M 245 235
          L 300 288
          L 300 355
          L 190 355
          L 190 288
          Z

          M 220 315
          L 270 315
          L 270 355
          L 220 355
          Z
        "
      />
    </svg>
  );
};
