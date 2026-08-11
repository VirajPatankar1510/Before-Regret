import React from 'react';

interface LogoProps {
  className?: string;
}

// Exact provided artwork (public/logo-mark.png), not a redrawn approximation -- a hand-traced SVG
// version of this mark didn't match closely enough, so this renders the source file directly.
// Transparent background, opaque blue letterform -- safe on both the light navbar and dark footer.
//
// WebP source is a lossless re-encode of the exact same PNG (pixel-diffed to confirm, not just
// visually eyeballed) -- 13.1KB -> 5.5KB, format overhead only, no compression tradeoff. The PNG
// stays as the <img> fallback for the sliver of browsers without WebP support rather than being
// deleted, so nothing regresses there; every browser that reaches the <source> just never
// downloads it.
export const Logo: React.FC<LogoProps> = ({ className = "w-8 h-8" }) => {
  return (
    <picture>
      <source srcSet="/logo-mark.webp" type="image/webp" />
      <img src="/logo-mark.png" alt="Before Regret" className={className} />
    </picture>
  );
};
