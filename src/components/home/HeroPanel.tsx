import React from 'react';
import { getInspectionPriorities } from '../../engine/inspectionPriorities';

/**
 * The homepage hero, shared by src/components/Hero.tsx and scripts/prerender-homepage.tsx.
 *
 * -----------------------------------------------------------------------------------------------
 * WHY THIS IS ONE COMPONENT NOW.
 *
 * The two files each carried their own copy of this markup, kept equal by hand, with a long comment
 * in the prerender explaining that the geometry had to match exactly or LCP would re-fire when
 * React mounted a taller hero over the static one. That is a real constraint held together by
 * discipline. Extracting it makes the constraint structural: there is one definition, so the two
 * renders cannot disagree about height.
 *
 * -----------------------------------------------------------------------------------------------
 * WHY THE PHOTOGRAPH IS GONE.
 *
 * The hero was a stock-looking suburban street at dusk under a navy gradient, with the whole
 * composition centred and a pair of blurred colour blobs behind it. Every one of those is a
 * template signature, and together they made a records-and-documents product look like a generic
 * SaaS landing page.
 *
 * It also cost real money: the image had twice been the site's single largest LCP element (a 1.4MB
 * PNG, then a 233KB JPEG, finally a 52KB WebP plus a 23KB mobile crop, a preload hint, and a media
 * query pair that had to stay character-identical to the stylesheet). Removing it deletes all of
 * that machinery, and the LCP element becomes the headline -- text, in the static HTML, painting
 * as soon as the inlined stylesheet lands.
 *
 * WHAT REPLACES IT is the thing the product actually does. The right-hand card is live output from
 * getInspectionPriorities for a labelled example address, with the engine's own cost figures. A
 * photograph of a house says "houses"; three real findings with real dollar ranges say what you get
 * for typing an address in. It cannot drift out of date, because it is not a screenshot -- it is
 * the engine, called at render.
 *
 * The ground is a flat ink with a hairline grid, which is a plat map and a ledger rather than a
 * gradient, and costs one CSS rule instead of a network request.
 */

// A deliberately ordinary example, labelled as one. 1972 is old enough to carry era rules a buyer
// would not think of, and Harris County is both the largest county this site has permit coverage
// for and one of the documented expansive-soil regions, so the county-gated rules fire and the card
// shows the era-plus-county behaviour rather than the generic national fallback.
const EXAMPLE = { year: 1972, county: 'Harris County', state: 'TX' } as const;

const EXAMPLE_RESULT = getInspectionPriorities(EXAMPLE.year, EXAMPLE.county, EXAMPLE.state);

/** Three is what fits without the card competing with the search box for attention. */
const EXAMPLE_ITEMS = (EXAMPLE_RESULT?.priorities ?? []).slice(0, 3);

/**
 * The engine's costToCheck strings are written for the report, where there is room for a sentence
 * ("Usually included in a general inspection -- just ask them to record the brand"). The card needs
 * the number. This pulls the first dollar figure or range out, and falls back to nothing rather
 * than to a truncated sentence, because a card is not the place to half-quote the engine.
 */
function costChip(value: string | null | undefined): string | null {
  if (!value) return null;
  if (/^free/i.test(value.trim())) return 'Free';
  const range = value.match(/\$[\d,]+(?:\s*[–-]\s*\$?[\d,]+)?/);
  return range ? range[0].replace(/\s*[–-]\s*/, ' – ') : null;
}

const EvidenceCard: React.FC = () => {
  if (!EXAMPLE_RESULT || EXAMPLE_ITEMS.length === 0) return null;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm overflow-hidden">
      <div className="flex items-baseline justify-between gap-3 px-5 py-3.5 border-b border-white/10 bg-white/[0.03]">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-blue-300">
          Example report
        </span>
        <span className="font-mono text-[10px] text-slate-400">
          {EXAMPLE_RESULT.priorities.length} items
        </span>
      </div>

      <p className="px-5 pt-4 pb-3 text-sm text-slate-300">
        A <span className="text-white font-semibold">{EXAMPLE.year}</span> home in{' '}
        <span className="text-white font-semibold">{EXAMPLE_RESULT.regionLabel}</span>
      </p>

      <ul className="px-5 pb-5 space-y-3">
        {EXAMPLE_ITEMS.map((item) => {
          const chip = costChip(item.costToCheck);
          return (
            <li key={item.id} className="flex items-start gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" aria-hidden="true" />
              <span className="flex-1">
                <span className="block text-sm text-white leading-snug">{item.title}</span>
                {chip && (
                  <span className="mt-0.5 block font-mono text-[11px] text-slate-400">{chip} to check</span>
                )}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="px-5 py-3 border-t border-white/10 text-[11px] text-slate-400">
        Plus the questions to ask the seller, and what to verify before you sign.
      </p>
    </div>
  );
};

interface HeroPanelProps {
  /**
   * The live AddressSearchBox. The prerender passes nothing and gets a non-interactive replica of
   * the same height instead -- the box needs client state the static render has no way to provide,
   * and a hero that changes height on mount is what resets LCP.
   */
  searchBox?: React.ReactNode;
  searchBoxRef?: React.RefObject<HTMLDivElement>;
}

export const HeroPanel: React.FC<HeroPanelProps> = ({ searchBox, searchBoxRef }) => (
  <section className="relative isolate overflow-hidden bg-[#0A0F1A] text-white">
    {/* Hairline grid. A records product, not a gradient. Pure CSS, no request, and it fades out
        before it reaches the copy so it never competes with the headline. */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-[0.35]"
      style={{
        backgroundImage:
          'linear-gradient(to right, rgba(148,163,184,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.07) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
        maskImage: 'radial-gradient(ellipse 90% 70% at 50% 0%, #000 40%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 90% 70% at 50% 0%, #000 40%, transparent 100%)',
      }}
    />
    {/* One cool wash from the top edge, sized to the section rather than floated as a blurred blob. */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-[420px]"
      style={{ background: 'radial-gradient(ellipse 60% 100% at 50% 0%, rgba(37,99,235,0.16), transparent 70%)' }}
    />

    <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-14 pb-16 sm:pt-20 sm:pb-20">
      <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">

        <div className="lg:col-span-7">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-blue-300">
            Public records · All 50 states
          </p>

          {/* Mixed faces on purpose. Crimson Pro is already loaded for the site and goes unused
              above the fold; setting the one emotional word in it -- the word the brand is named
              for -- gives the headline a voice that Inter alone does not have, without turning
              into a decorative serif hero. */}
          <h1 className="mt-4 font-sans text-[2.1rem] leading-[1.08] sm:text-5xl lg:text-[3.4rem] font-extrabold tracking-[-0.02em] text-white">
            Could you{' '}
            <span className="font-serif font-semibold italic tracking-normal text-blue-300">regret</span>{' '}
            moving here?
          </h1>

          <p className="mt-5 max-w-xl text-base sm:text-lg text-slate-300 leading-relaxed">
            Search any US residential address and get the checks that actually matter for a home of
            its age and county, the exact questions to ask the seller, and a clear list of what to
            verify before you sign.
          </p>

          <div ref={searchBoxRef} id="address-search-box" className="mt-8 min-h-[76px]">
            {searchBox ?? (
              /* Non-interactive replica, present only so the static hero is the same height as the
                 mounted one. aria-hidden and inert: it must never take focus or be read out. */
              <div aria-hidden="true" className="rounded-2xl bg-slate-900/70 border border-white/10 p-2 flex gap-2">
                <div className="flex-1 rounded-xl bg-slate-950/60 border border-white/10 px-4 py-3 text-slate-500 text-sm">
                  Enter your full street address…
                </div>
                <div className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white">Search</div>
              </div>
            )}
          </div>

          <p className="mt-4 text-sm text-slate-400">
            <span className="text-slate-300">Your first report is free.</span> No credit card required.{' '}
            <span className="text-slate-500">e.g. 301 Congress Ave, Austin, TX</span>
          </p>

          <a
            href="/sample-report/"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-300 hover:text-blue-200 underline underline-offset-4 decoration-blue-300/40"
          >
            See a sample report
            <span aria-hidden="true">&rarr;</span>
          </a>
        </div>

        <div className="lg:col-span-5">
          <EvidenceCard />
        </div>

      </div>
    </div>
  </section>
);
