import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { BOOK, BOOK_CLICK_PATH, BOOK_LINK_REL } from '../data/book';

// The promo for the owner's book on guide pages (owner request 2026-11-25): a sticky skyscraper in
// the right rail on desktop, and a compact card in the middle of the article on phones and tablets.
//
// THE DESIGN BRIEF was "how would Apple make this ad", with the cover as the hero. So: one product,
// one line, one button. A quiet white panel (the guide page itself is light grey), the owner's own hook as the only big type, the
// cover large with a real shadow, and nothing competing with it -- no badges, no checklists, no
// stars, no countdowns.
//
// THE COPY (hook, promise, reason to read now) is explained beside the constants below. The first
// version (2026-11-25) used the owner's poster hook, "You feel it. But why?".
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

// Copy chosen by the owner 2026-11-26, from hooks pulled out of the book's own text:
//   HOOK     "Is a house lucky?" -- the book asks exactly this in chapter 1 and answers it honestly
//            ("Not lucky. Just conditions that are with you rather than against you").
//   SUBHOOK  the owner's line, built on the book's title word.
//   NOTE     the owner's note, in italics at the foot: the book is for owners as well as buyers.
// An earlier draft used "You can repaint a house. You can't move it." plus "Read it before your
// next showing."; the owner replaced both. Never add urgency, scarcity or fear here (owner rules).
const HOOK = 'Is a house lucky?';
const SUBHOOK = 'Before you ask if a house is beautiful, ask if it’s fruitful.';
const NOTE =
  'You don’t have to be buying a house to discover what it has to tell you. The house you already live in deserves a closer look, too.';
const CTA = 'Get it on Amazon';

const surface = 'rounded-3xl bg-white text-[#1d1d1f]';
const button =
  'inline-flex items-center justify-center gap-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors';

// Right-rail skyscraper, desktop only. GuideArticleLayout owns the sticky wrapper and breakpoint.
export const BookPromoSkyscraper: React.FC = () => (
  <aside aria-label={`Book: ${BOOK.title}`} className={`${surface} px-6 pt-7 pb-6 text-center`}>
    <p className="text-[28px] font-semibold leading-[1.08] tracking-tight">{HOOK}</p>
    <p className="mt-3 text-[15px] leading-snug text-[#424245]">{SUBHOOK}</p>
    <a href={BOOK_CLICK_PATH} target="_blank" rel={BOOK_LINK_REL} aria-hidden="true" tabIndex={-1} className="mt-6 block">
      <Cover className="mx-auto w-[190px] h-auto rounded-[4px] shadow-[0_24px_40px_-12px_rgba(0,0,0,0.45)]" />
    </a>
    <p className="mt-6 text-[15px] font-semibold leading-snug">{BOOK.title}</p>
    <p className="text-[13px] text-[#6e6e73]">by {BOOK.author}</p>
    <a href={BOOK_CLICK_PATH} target="_blank" rel={BOOK_LINK_REL} className={`${button} mt-5 w-full px-5 py-2.5 text-sm`}>
      <span>{CTA}</span>
      <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
    </a>
    <p className="mt-5 text-[13px] italic leading-relaxed text-[#6e6e73]">{NOTE}</p>
  </aside>
);

// Phones and tablets: the headline on top, then the cover beside the title and button. `inArticle` is the version
// placed between two sections inside the white article sheet (GuideArticleLayout), so it takes the
// page's light grey instead of white -- otherwise it would vanish into the sheet around it.
export const BookPromoCard: React.FC<{ className?: string; inArticle?: boolean }> = ({ className = '', inArticle = false }) => (
  <aside
    aria-label={`Book: ${BOOK.title}`}
    className={`${inArticle ? 'rounded-3xl bg-[#f5f5f7] text-[#1d1d1f]' : surface} p-5 sm:p-7 ${className}`}
  >
    {/* Headline across the full card first: beside the cover, a 375px phone squeezed it to three
        words a line and wrapped the button. The cover then sits beside the title and the button. */}
    <p className="text-[28px] sm:text-3xl font-semibold leading-[1.08] tracking-tight">{HOOK}</p>
    <p className="mt-2 text-[15px] leading-snug text-[#424245]">{SUBHOOK}</p>
    <div className="mt-5 flex gap-4 sm:gap-7 items-center">
      <a href={BOOK_CLICK_PATH} target="_blank" rel={BOOK_LINK_REL} aria-hidden="true" tabIndex={-1} className="shrink-0">
        <Cover className="w-[84px] sm:w-[130px] h-auto rounded-[3px] shadow-[0_16px_28px_-10px_rgba(0,0,0,0.45)]" />
      </a>
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-snug">{BOOK.title}</p>
        <p className="text-[13px] text-[#6e6e73]">by {BOOK.author}</p>
        <a href={BOOK_CLICK_PATH} target="_blank" rel={BOOK_LINK_REL} className={`${button} mt-3 whitespace-nowrap px-4 sm:px-5 py-2.5 text-sm`}>
          <span>{CTA}</span>
          <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
        </a>
      </div>
    </div>
    <p className="mt-5 text-[13px] italic leading-relaxed text-[#6e6e73]">{NOTE}</p>
  </aside>
);
