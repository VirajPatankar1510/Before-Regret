import React from 'react';

interface LogoProps {
  className?: string;
  // Defaults to decorative (empty alt) -- both current call sites (Navbar, Footer) render this
  // directly beside a visible "Before Regret" text label, so a real alt here would just have a
  // screen reader announce the same name twice back to back. Left overridable for any future
  // usage that DOESN'T have adjacent visible text, where a real accessible name would matter.
  alt?: string;
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
// The className goes on BOTH the <picture> and the <img>, and the wrapper additionally gets
// shrink-0 unconditionally. That looks redundant and is not.
//
// <picture> is the element the parent flex row actually lays out -- the <img> is its child, one
// level removed. So a caller writing <Logo className="w-9 h-9 shrink-0" /> was putting shrink-0 on
// the img while the <picture> kept the default flex-shrink: 1, free to be squeezed by a crowded
// row. Reproduced live on 2026-08-29: adding a wide sibling to the navbar row collapsed the mark
// from 36x36 to 0x36 -- the wrapper shrank to nothing and flattened the image inside it.
//
// It only surfaced for signed-in users, which is why it survived: the signed-out navbar has slack,
// and the signed-in one carries an avatar and a display name that consume it. The source artwork
// is a perfect 144x144 square, so any rendered aspect other than 1.000 is this, not the asset.
//
// object-contain is the second guard: if a future layout does manage to constrain the box, the
// mark letterboxes inside it rather than stretching. A distorted logo should not be a possible
// output of this component.
export const Logo: React.FC<LogoProps> = ({ className = "w-8 h-8", alt = "" }) => {
  return (
    <picture className={`${className} shrink-0 inline-block`}>
      <source srcSet="/logo-mark.webp" type="image/webp" />
      <img src="/logo-mark.png" alt={alt} className={`${className} shrink-0 object-contain`} />
    </picture>
  );
};
