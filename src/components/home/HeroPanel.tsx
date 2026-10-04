import React from 'react';

/**
 * The homepage hero, shared by src/components/Hero.tsx and scripts/prerender-homepage.tsx, so the
 * static and the mounted hero can never disagree about height (a hero that changes height on mount
 * resets LCP).
 *
 * 2026-10-04 REDESIGN, at the owner's direction: the homepage felt "pale and bland ... like an
 * under-construction website" and must read as a property website. The photograph comes back,
 * this time the owner's own generated image (no stock), as a full-bleed home at golden hour with
 * the copy resting on a navy wash over its calm left third.
 *
 * The earlier history still applies and is why this is careful about weight: a hero photo was the
 * site's largest LCP element twice (1.4 MB PNG, then 233 KB JPEG). So the photo is a WebP <img>
 * with fetchpriority=high and an explicit size. On phones it is a 240px band above the copy, and
 * `sizes` caps it at the 720/1100 files (29-64 KB) even on 3x screens. Until HERO_PHOTO is set, a painted dusk scene in
 * pure CSS/SVG holds the same geometry, costing no request.
 *
 * THE WORDS DO NOT CHANGE. The h1 keeps the brand line inside it (added 2026-09-24 so the page's
 * primary heading names the site), and the definitional sentence stays word for word: it is the
 * prose an AI answer quotes for "what is Before Regret" (see the 2026-09-20 note in git history).
 *
 * Alignment: the owner chose a centred hero once. This version is left-aligned on desktop because
 * the copy sits over the photo's empty third; HERO_ALIGN flips it back to centred in one edit.
 */

/** Set to the WebP path once the owner's photo is placed, e.g. '/images/home/hero-home.webp'. */
const HERO_PHOTO: string | null = '/images/home/hero-home.webp';
/** Width-matched copies so phones fetch ~29 KB and only large screens the full 1851px file. */
const HERO_SRCSET = '/images/home/hero-home-720.webp 720w, /images/home/hero-home-1100.webp 1100w, /images/home/hero-home.webp 1851w';
const HERO_ALIGN = 'left' as 'left' | 'center';

interface HeroPanelProps {
  /**
   * The live AddressSearchBox. The prerender passes nothing and gets a non-interactive replica of
   * the same height instead -- the box needs client state the static render has no way to provide.
   */
  searchBox?: React.ReactNode;
  searchBoxRef?: React.RefObject<HTMLDivElement>;
}

/** Painted stand-in until the photo arrives: dusk sky, warm sun, a simple house on a lawn. */
const PaintedScene: React.FC = () => (
  <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
    <div
      className="absolute inset-0"
      style={{ background: 'linear-gradient(180deg, #2a3b55 0%, #5b5f74 38%, #c99a72 72%, #e7c39a 100%)' }}
    />
    <div
      className="absolute rounded-full"
      style={{ width: 420, height: 420, right: '18%', bottom: '8%', background: 'radial-gradient(circle, rgba(255,214,160,0.75) 0%, rgba(255,214,160,0) 65%)' }}
    />
    <svg className="absolute right-0 bottom-0 h-[78%] w-auto max-w-none" viewBox="0 0 900 520" preserveAspectRatio="xMaxYMax meet">
      <path d="M0 470 C 220 440, 520 452, 900 430 L 900 520 L 0 520 Z" fill="#3f5a45" />
      <path d="M0 492 C 260 470, 600 482, 900 466 L 900 520 L 0 520 Z" fill="#2f4535" />
      <g transform="translate(330 150)">
        <rect x="40" y="150" width="380" height="190" fill="#e9dfcf" />
        <polygon points="20,160 230,30 440,160" fill="#4a3b33" />
        <rect x="250" y="56" width="26" height="60" fill="#5a4a40" />
        <rect x="70" y="190" width="70" height="80" fill="#f4c983" stroke="#6b5646" strokeWidth="6" />
        <rect x="320" y="190" width="70" height="80" fill="#f4c983" stroke="#6b5646" strokeWidth="6" />
        <rect x="200" y="240" width="56" height="100" fill="#2f3b4f" />
        <rect x="20" y="230" width="420" height="10" fill="#cfc2ad" />
        <rect x="40" y="240" width="8" height="100" fill="#cfc2ad" />
        <rect x="412" y="240" width="8" height="100" fill="#cfc2ad" />
      </g>
      <g fill="#24362a">
        <circle cx="200" cy="330" r="92" />
        <rect x="192" y="330" width="16" height="150" />
        <circle cx="830" cy="360" r="70" />
      </g>
    </svg>
  </div>
);

export const HeroPanel: React.FC<HeroPanelProps> = ({ searchBox, searchBoxRef }) => {
  const centred = HERO_ALIGN === 'center';
  return (
    <section className="relative isolate overflow-hidden bg-home-navy text-white">
      {HERO_PHOTO ? (
        <img
          src={HERO_PHOTO}
          srcSet={HERO_SRCSET}
          sizes="(min-width: 640px) 100vw, 360px"
          alt=""
          width={1851}
          height={850}
          fetchPriority="high"
          decoding="async"
          className="block h-60 w-full object-cover object-[85%_center] sm:absolute sm:inset-0 sm:h-full sm:object-[70%_center]"
        />
      ) : (
        <PaintedScene />
      )}
      {/* Phones (2026-10-04, owner: the hero "doesn't feel interesting" on mobile): the photo used to
          sit behind a 75% wash, cropped to a sliver of porch. Now it is a clear band at the top --
          house, porch lights and sunset sky -- that fades into the navy the copy sits on. */}
      {HERO_PHOTO && (
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-60 sm:hidden bg-gradient-to-b from-transparent from-55% to-home-navy" />
      )}
      {/* Tablet and up: a left-to-right fade so the house stays visible on the right, or an even
          wash when centred. */}
      {centred && (
        <div aria-hidden="true" className="absolute inset-0 hidden sm:block" style={{ background: 'rgba(27,42,64,0.62)' }} />
      )}
      {!centred && (
        <div
          aria-hidden="true"
          className="absolute inset-0 hidden sm:block"
          style={{ background: 'linear-gradient(90deg, rgba(27,42,64,0.86) 0%, rgba(27,42,64,0.72) 34%, rgba(27,42,64,0.22) 60%, rgba(27,42,64,0) 82%)' }}
        />
      )}

      <div className={`relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-16 sm:pt-24 sm:pb-28 ${HERO_PHOTO ? '-mt-6 pt-0 sm:mt-0' : 'pt-16'}`}>
        <div className={centred ? 'max-w-2xl mx-auto text-center' : 'max-w-xl text-center sm:text-left'}>
          <h1 className="font-serif text-[2.4rem] leading-[1.05] sm:text-6xl lg:text-[4.1rem] font-semibold tracking-[-0.01em] text-white">
            <span className="block mb-4 font-sans text-xs sm:text-sm font-bold uppercase tracking-[0.24em] text-home-oak leading-none">
              Before Regret<span className="sr-only">:</span>
            </span>
            Could you <span className="italic text-[#f2c98f]">regret</span> moving here?
          </h1>

          <p className="mt-6 max-w-xl text-base sm:text-lg text-slate-200 leading-relaxed">
            Before Regret is a free property research tool for US home buyers. Search any US
            residential address and get the checks that actually matter for a home of its age and
            county, the exact questions to ask the seller, and a clear list of what to verify before
            you sign.
          </p>

          <div ref={searchBoxRef} id="address-search-box" className="mt-8 min-h-[76px] text-left text-slate-900">
            {searchBox ?? (
              <div aria-hidden="true" className="rounded-2xl bg-white border border-slate-200 shadow-lg p-3 flex gap-2">
                <div className="flex-1 rounded-xl bg-slate-50 border border-slate-300 px-4 py-3 text-slate-400 text-sm">
                  e.g. 301 Congress Ave, Austin, TX
                </div>
                <div className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white">Search</div>
              </div>
            )}
          </div>

          <div className={`mt-5 flex flex-col gap-1 ${centred ? 'items-center' : 'items-center sm:items-start'}`}>
            <p className="text-sm font-semibold text-white">Your first report is free.</p>
            <p className="text-sm text-slate-300">No credit card required.</p>
            <a
              href="/sample-report/"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#f2c98f] hover:text-white underline underline-offset-4 decoration-[#f2c98f]/50"
            >
              See a sample report
              <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
