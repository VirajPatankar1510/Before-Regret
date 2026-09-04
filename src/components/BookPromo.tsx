import React from 'react';
import { BookOpen, ArrowUpRight } from 'lucide-react';
import { BOOK, BOOK_LINK_REL } from '../data/book';

// Promo units for the site's own book. Two shapes: a card (guide pages and the homepage) and a
// one-line footer link.
//
// DELIBERATELY HOOK-FREE, AND DELIBERATELY A PLAIN <a>. Every other block that appears both in
// the live app and in the prerendered HTML exists twice in this codebase -- Footer.tsx and
// StaticFooterLinks.tsx, GuidePageView.tsx and prerender-guides.tsx's GuideStaticBody. That
// duplication is intentional there, because those blocks need onNavigate, a client-only handler
// with nothing to render statically.
//
// This one needs no handler at all: it points off-site, so there is no client-side routing to do
// and no state to hold. That means the SAME component can be imported by the React tree and by
// renderToStaticMarkup in the prerender scripts, and there is no twin to drift. If you add
// interactivity here, you will have created a fourth pair of twins -- don't, unless the feature
// genuinely requires it.
//
// NO COVER IMAGE. Amazon's product images may not be hotlinked outside the Product Advertising
// API, and an image would be the only external asset on an otherwise self-contained page. Text
// only, which also means the promo costs nothing on a page whose whole problem is getting crawled.
//
// FRAMING. The label says the book comes from this site, because it does. Presenting a book the
// site owns as a neutral reading recommendation would be an undisclosed material connection --
// the same standard the vendor ad slot already meets with its "Ad" badge in both its sold and
// unsold states.

const LABEL = 'From the team behind BeforeRegret';

// The pitch. Drawn from the book's actual argument -- the three lists, and the twenty minutes a
// viewing gives you -- not from marketing copy. Nothing here claims a result.
const PITCH =
  'A viewing gives you about twenty minutes, and most of it goes on the things you could change ' +
  'later anyway: the paint, the counters, the fixtures. This book is about the other list — which ' +
  'way the house faces, how the ground falls, where the water goes. The conditions no amount of ' +
  'money will change after you sign.';

export const BookPromoCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <aside
    aria-label="Book from BeforeRegret"
    className={`bg-gradient-to-br from-amber-50/70 to-white border border-amber-200/70 rounded-3xl p-6 sm:p-8 shadow-sm ${className}`}
  >
    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-800">
      <BookOpen className="w-3.5 h-3.5" />
      <span>{LABEL}</span>
    </div>

    <h2 className="mt-3 text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
      {BOOK.title}
    </h2>
    <p className="mt-1 text-sm sm:text-base font-medium text-slate-600">{BOOK.subtitle}</p>

    <p className="mt-4 text-sm text-slate-700 leading-relaxed max-w-2xl">{PITCH}</p>

    <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
      <a
        href={BOOK.url}
        target="_blank"
        rel={BOOK_LINK_REL}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors shadow-sm"
      >
        <span>View on Amazon</span>
        <ArrowUpRight className="w-4 h-4" />
      </a>
      <span className="text-xs text-slate-500">
        {BOOK.formats} · by {BOOK.author}
      </span>
    </div>
  </aside>
);

export const BookPromoFooterLink: React.FC = () => (
  <a
    href={BOOK.url}
    target="_blank"
    rel={BOOK_LINK_REL}
    className="hover:text-white cursor-pointer block py-1.5"
  >
    {BOOK.title} <span className="text-slate-500">(our book)</span> →
  </a>
);
