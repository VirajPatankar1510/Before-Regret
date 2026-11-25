import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { BOOK, BOOK_CLICK_PATH, BOOK_LINK_REL } from '../data/book';

// The promo for the owner's book on guide pages (owner request 2026-11-25): a sticky skyscraper in
// the right rail on desktop, and a compact card after the article on phones and tablets.
//
// THE DESIGN BRIEF was "how would Apple make this ad", with the cover as the hero. So: one product,
// one line, one button. A quiet white panel (the guide page itself is light grey), the owner's own hook as the only big type, the
// cover large with a real shadow, and nothing competing with it -- no badges, no checklists, no
// stars, no countdowns.
//
// THE HOOK, "You feel it. But why?", is the owner's (from the poster they made). It is true to the
// book: every chapter puts the felt sign first and the physical reason under it. The one supporting
// line (owner's wording, 2026-11-25) frames the book instead of promising an outcome.
//
// The headline is live HTML text, not baked into an image: it stays sharp at every size, screen
// readers can read it, and the cover file stays small. The "Our book" label was removed on the
// owner's request (2026-11-25).
//
// Hook-free and a plain <a>, so the same component renders in the React tree and in
// renderToStaticMarkup for the prerendered guides. Clicks go through /out/book, which counts them.

const COVER_ALT = `Cover of ${BOOK.title}: ${BOOK.subtitle}, by ${BOOK.author}`;

const Cover: React.FC<{ className: string }> = ({ className }) => (
  <picture>
    <source srcSet="/images/fruitful-home-cover.webp" type="image/webp" />
    <img
      src="/images/fruitful-home-cover.jpg"
      alt={COVER_ALT}
      width={600}
      height={960}
      loading="lazy"
      decoding="async"
      className={className}
    />
  </picture>
);

const HOOK_A = 'You feel it.';
const HOOK_B = 'But why?';
// Owner's wording, 2026-11-25.
const SUBHOOK = 'A house leaves clues.';
const LINE = 'A different way to think about what you’re buying.';
const CTA = 'Get it on Amazon';

const surface = 'rounded-3xl bg-white text-[#1d1d1f]';
const button =
  'inline-flex items-center justify-center gap-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors';

// Right-rail skyscraper, desktop only. GuideArticleLayout owns the sticky wrapper and breakpoint.
export const BookPromoSkyscraper: React.FC = () => (
  <aside aria-label={`Book: ${BOOK.title}`} className={`${surface} px-6 pt-7 pb-6 text-center`}>
    <p className="text-[28px] font-semibold leading-[1.08] tracking-tight">
      {HOOK_A}
      <br />
      {HOOK_B}
    </p>
    <p className="mt-3 text-[15px] leading-snug text-[#424245]">{SUBHOOK}</p>
    <a href={BOOK_CLICK_PATH} target="_blank" rel={BOOK_LINK_REL} aria-hidden="true" tabIndex={-1} className="mt-6 block">
      <Cover className="mx-auto w-[190px] h-auto rounded-[4px] shadow-[0_24px_40px_-12px_rgba(0,0,0,0.45)]" />
    </a>
    <p className="mt-6 text-[15px] font-semibold leading-snug">{BOOK.title}</p>
    <p className="text-[13px] text-[#6e6e73]">by {BOOK.author}</p>
    <p className="mt-3 text-[13px] leading-relaxed text-[#424245]">{LINE}</p>
    <a href={BOOK_CLICK_PATH} target="_blank" rel={BOOK_LINK_REL} className={`${button} mt-5 w-full px-5 py-2.5 text-sm`}>
      <span>{CTA}</span>
      <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
    </a>
  </aside>
);

// Phones and tablets: after the article, cover on the left, the same words on the right.
export const BookPromoCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <aside aria-label={`Book: ${BOOK.title}`} className={`${surface} p-5 sm:p-7 ${className}`}>
    <div className="flex gap-5 sm:gap-7 items-center">
      <a href={BOOK_CLICK_PATH} target="_blank" rel={BOOK_LINK_REL} aria-hidden="true" tabIndex={-1} className="shrink-0">
        <Cover className="w-[104px] sm:w-[150px] h-auto rounded-[3px] shadow-[0_16px_28px_-10px_rgba(0,0,0,0.45)]" />
      </a>
      <div className="min-w-0">
        <p className="text-2xl sm:text-3xl font-semibold leading-[1.08] tracking-tight">
          {HOOK_A}
          <br />
          {HOOK_B}
        </p>
        <p className="mt-2 text-sm leading-snug text-[#424245]">{SUBHOOK}</p>
        <p className="mt-2 text-sm font-semibold leading-snug">
          {BOOK.title} <span className="font-normal text-[#6e6e73]">by {BOOK.author}</span>
        </p>
        <p className="mt-2 hidden sm:block text-sm leading-relaxed text-[#424245]">{LINE}</p>
        <a href={BOOK_CLICK_PATH} target="_blank" rel={BOOK_LINK_REL} className={`${button} mt-4 px-5 py-2.5 text-sm`}>
          <span>{CTA}</span>
          <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
        </a>
      </div>
    </div>
  </aside>
);
