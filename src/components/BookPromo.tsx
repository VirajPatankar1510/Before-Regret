import React from 'react';
import { ArrowUpRight, Check, Gift, Scissors } from 'lucide-react';
import { BOOK, BOOK_CLICK_PATH, BOOK_LINK_REL } from '../data/book';

// The promo card for the owner's book, rendered on every guide page and on the homepage.
//
// DELIBERATELY HOOK-FREE, AND DELIBERATELY A PLAIN <a>. Every other block that appears both in
// the live app and in the prerendered HTML exists twice in this codebase -- Footer.tsx and
// StaticFooterLinks.tsx, GuidePageView.tsx and prerender-guides.tsx's GuideStaticBody. That
// duplication is intentional there, because those blocks need onNavigate, a client-only handler
// with nothing to render statically. This one points off-site and holds no state, so the SAME
// component is imported by the React tree and by renderToStaticMarkup in the prerender scripts,
// and there is no twin to drift. Don't add interactivity unless a feature genuinely needs it.
//
// IMAGE IS SELF-HOSTED, NOT HOTLINKED. Amazon's own product images may not be used outside the
// Product Advertising API, so the file in public/images is the book photo the owner supplied on
// 2026-11-15 (the paperback on a wooden table, 1536x1024 original), resized to 720x480: enough for
// a retina screen at the widest it renders (a phone-width card, ~340px). One file serves both the
// card and the rail. It's webp with a jpg fallback, lazy, with explicit width/height so the card
// doesn't reflow the page as it loads. It is landscape, so the card gives it a wide column on
// desktop and the full width on a phone, where a flat portrait cover used to sit in a narrow column.
//
// THE COPY (2026-11-15, owner asked for "hooks" and a salesperson's design). How it persuades:
//   - a contrast hook (head vs wall) that names the one thing this book has that most
//     manifestation books don't: a physical yantra you cut out;
//   - specific, countable contents (7 worksheets, 9 chapters, several sizes), because specifics
//     read as real and vague promises read as hype;
//   - a bonus line, the value-stack;
//   - a plain "View the book on Amazon" button (owner's wording) plus reassurance microcopy.
// What it deliberately does NOT do, and why:
//   - promise a result (money, love, health outcomes). This card sits on a site whose guides are
//     held to primary sources, and a result claim is the one line that would undercut them;
//   - repeat the listing's comparative claims ("more effective than a bracelet...");
//   - fake urgency or scarcity. The owner has rejected fear-driven copy;
//   - show a star rating. It changes without notice, and 4 ratings is thin social proof. If one
//     is ever wanted, it needs the live count and a date.
// Every content fact below is from the Amazon listing the owner pasted in on 2026-11-15.

// The photo's alt text: what the picture shows, and nothing else. Not alt="", because Bing
// Webmaster reports an empty alt as missing; aria-hidden on the wrapping link keeps it silent.
const COVER_ALT = `The paperback of ${BOOK.title}, lying on a wooden table`;

// One <picture> for both placements.
const BookPhoto: React.FC<{ className: string }> = ({ className }) => (
  <picture>
    <source srcSet="/images/manifestation-book-photo.webp" type="image/webp" />
    <img
      src="/images/manifestation-book-photo.jpg"
      alt={COVER_ALT}
      width={720}
      height={480}
      loading="lazy"
      decoding="async"
      className={className}
    />
  </picture>
);

const HOOK_LEAD = 'Most manifestation stays in your head.';
const HOOK_TURN = 'This one goes on your wall.';

const LEDE =
  'Cut out the Shri Yantra printed inside, charge it with the mantras and rituals in the book, ' +
  'and start your practice the same day.';

const INSIDE = [
  'A Shri Yantra in several sizes, ready to cut out',
  'Step-by-step mantras, rituals and instructions for using the Yantra',
  '7 worksheets with affirmations',
  'A breathing technique to center yourself fast',
];

const BONUS = 'Bonus: the Kuber Yantra for wealth';

const TRUST = `${BOOK.format} · 9 chapters · Beginner-friendly`;
// The rail is 260px wide; the full line wraps mid-phrase there.
const TRUST_SHORT = `${BOOK.format} · 9 chapters`;

const CTA_LABEL = 'View the book on Amazon';

// The pill that opens both units: the tangible thing, said first.
const CutOutPill: React.FC<{ small?: boolean }> = ({ small }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-300/10 font-semibold text-amber-200 ${
      small ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1 text-xs'
    }`}
  >
    <Scissors className={small ? 'w-3 h-3' : 'w-3.5 h-3.5'} aria-hidden="true" />
    Includes a cut-out Shri Yantra
  </span>
);

const cardSurface =
  'relative overflow-hidden border border-amber-300/25 bg-gradient-to-br from-[#0b1026] via-[#131938] to-[#22163d] text-white shadow-xl';

// The soft gold glow behind the cover. Decorative only.
const Glow: React.FC = () => (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute -top-24 -left-16 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl"
  />
);

// Right-rail skyscraper for guide pages, desktop only. The caller owns the sticky wrapper and the
// breakpoint that hides it -- see GuideArticleLayout.tsx -- so this component is just the unit.
export const BookPromoSkyscraper: React.FC = () => (
  <aside aria-label={`Book: ${BOOK.title}`} className={`${cardSurface} rounded-2xl p-5`}>
    <Glow />
    <div className="relative">
      <h2 className="font-serif text-xl font-semibold leading-snug text-amber-200 text-center [text-wrap:balance]">
        {BOOK.title}.
      </h2>
      <p className="mt-1 text-center text-[11px] text-slate-400">by {BOOK.author}</p>

      <a href={BOOK_CLICK_PATH} target="_blank" rel={BOOK_LINK_REL} aria-hidden="true" tabIndex={-1} className="mt-4 block">
        <BookPhoto className="w-full h-auto rounded-xl shadow-2xl shadow-black/60 ring-1 ring-amber-200/20" />
      </a>

      <div className="mt-4">
        <CutOutPill small />
      </div>

      <p className="mt-3 text-lg font-extrabold leading-snug">
        {HOOK_LEAD} <span className="text-amber-300">{HOOK_TURN}</span>
      </p>

      <ul className="mt-3 space-y-1.5 text-xs text-slate-200">
        {[INSIDE[0], INSIDE[1]].map((line) => (
          <li key={line} className="flex gap-2">
            <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-300" aria-hidden="true" />
            <span>{line}</span>
          </li>
        ))}
        <li className="flex gap-2 font-semibold text-amber-200">
          <Gift className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
          <span>{BONUS}</span>
        </li>
      </ul>

      <a
        href={BOOK_CLICK_PATH}
        target="_blank"
        rel={BOOK_LINK_REL}
        className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-300 hover:bg-amber-200 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-amber-500/20"
      >
        <span>{CTA_LABEL}</span>
        <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
      </a>
      <p className="mt-2 text-center text-[11px] text-slate-400">{TRUST_SHORT}</p>
    </div>
  </aside>
);

export const BookPromoCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <aside aria-label={`Book: ${BOOK.title}`} className={`${cardSurface} rounded-3xl p-6 sm:p-8 ${className}`}>
    <Glow />
    {/* Centred, with a closing full stop on the displayed title only (owner, 2026-11-15). Justified
        was asked for and tried the same day: it opened wide gaps between words on a phone and left
        "universe." alone on a second line on desktop, so the title is centred with balanced lines
        (text-wrap:balance) instead, which splits it into two even lines.
        The book's name is the card's heading and sits above the photo (owner, 2026-11-15): it is
        the thing a reader has to remember to find it on Amazon. The hook below it is a styled
        paragraph, not a second heading. */}
    <header className="relative border-b border-amber-300/20 pb-5 mb-6 text-center">
      <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold leading-tight tracking-tight text-amber-200 text-center [text-wrap:balance]">
        {BOOK.title}.
      </h2>
      <p className="mt-1.5 text-sm text-slate-400">by {BOOK.author}</p>
    </header>
    <div className="relative flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8">
      {/* The cover links too: on a promo card the artwork is what a reader reaches for first.
          aria-hidden with tabIndex -1 keeps it from being a second identical link for screen
          readers and keyboards. Full width on a phone; a fixed wide column beside the text from
          the sm breakpoint up. */}
      <a
        href={BOOK_CLICK_PATH}
        target="_blank"
        rel={BOOK_LINK_REL}
        aria-hidden="true"
        tabIndex={-1}
        className="block w-full sm:w-64 lg:w-80 shrink-0 self-start sm:self-center"
      >
        <BookPhoto className="w-full h-auto rounded-2xl shadow-2xl shadow-black/60 ring-1 ring-amber-200/20" />
      </a>

      <div className="min-w-0">
        <CutOutPill />

        <p className="mt-3 text-2xl lg:text-3xl font-extrabold leading-tight tracking-tight">
          {HOOK_LEAD} <span className="text-amber-300">{HOOK_TURN}</span>
        </p>

        <p className="mt-4 text-sm sm:text-base text-slate-200 leading-relaxed">{LEDE}</p>

        <ul className="mt-4 grid gap-y-2 text-sm text-slate-200">
          {INSIDE.map((line) => (
            <li key={line} className="flex gap-2">
              <Check className="w-4 h-4 mt-0.5 shrink-0 text-amber-300" aria-hidden="true" />
              <span>{line}</span>
            </li>
          ))}
          <li className="flex gap-2 font-semibold text-amber-200">
            <Gift className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>{BONUS}</span>
          </li>
        </ul>

        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
          <a
            href={BOOK_CLICK_PATH}
            target="_blank"
            rel={BOOK_LINK_REL}
            className="inline-flex shrink-0 whitespace-nowrap items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-300 hover:bg-amber-200 text-slate-950 font-bold text-sm transition-colors shadow-lg shadow-amber-500/20"
          >
            <span>{CTA_LABEL}</span>
            <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
          </a>
          <span className="text-xs text-slate-400 whitespace-nowrap">{TRUST}</span>
        </div>
      </div>
    </div>
  </aside>
);
