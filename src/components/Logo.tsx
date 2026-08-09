import React from 'react';

interface LogoProps {
  className?: string;
}

// Exact provided artwork (public/logo-mark.png), not a redrawn approximation -- a hand-traced SVG
// version of this mark didn't match closely enough, so this renders the source file directly.
// Transparent background, opaque blue letterform -- safe on both the light navbar and dark footer.
export const Logo: React.FC<LogoProps> = ({ className = "w-8 h-8" }) => {
  return <img src="/logo-mark.png" alt="Before Regret" className={className} />;
};
