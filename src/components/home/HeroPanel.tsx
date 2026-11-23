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
 * THE DEFINITIONAL SENTENCE DOES NOT CHANGE. The h1 keeps the brand line inside it (added 2026-09-24
 * so the page's primary heading names the site), and the paragraph under it stays word for word: it
 * is the prose an AI answer quotes for "what is Before Regret" (see the 2026-09-20 note in git history).
 *
 * The headline changed 2026-10-10/11 at the owner's direction, from "Could you regret moving here?"
 * to "Know what to check, ask and verify before you buy a home." Its three verbs name the report's
 * three sections (inspection priorities, seller questions, records to pull). Two drafts were dropped:
 * "...before your inspection deadline" read as only for buyers already under contract, and "...about
 * any house" implied house-specific findings -- the report is built from the home's age, county and
 * census tract, not from records about that house. "Before you buy a home" promises guidance, not
 * findings.
 *
 * 2026-11-23 (owner, Apple-style pass, step 7): the hero is light. A centred headline, subhead and search
 * on white. The navy wash, the oak eyebrow and the painted stand-in scene are gone. The house photo sat
 * under the search in a rounded frame for one review, then the owner removed it ("i think we should remove
 * this image"), so the hero is type only and the headline is the LCP element. The image files stay in
 * public/images/home/ in case it returns.
 */

interface HeroPanelProps {
  /**
   * The live AddressSearchBox. The prerender passes nothing and gets a non-interactive replica of
   * the same height instead -- the box needs client state the static render has no way to provide.
   */
  searchBox?: React.ReactNode;
  searchBoxRef?: React.RefObject<HTMLDivElement>;
}

export const HeroPanel: React.FC<HeroPanelProps> = ({ searchBox, searchBoxRef }) => (
  <section className="bg-white text-home-ink">
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-14 pb-16 sm:pt-24 sm:pb-24 text-center">
      {/* 2026-11-18 (owner): the small brand line reads "Figuring out how to buy a house?" (owner's words;
          was "Don't buy a house blind."). The H1 text itself is unchanged -- "Before Regret:" stays inside it
          for screen readers and crawlers, so the page's main heading still names the site. */}
      <p className="mb-4 text-sm sm:text-base font-semibold text-slate-500 leading-snug">
        Figuring out how to buy a house?
      </p>
      <h1 className="font-serif text-[2.4rem] leading-[1.06] sm:text-6xl lg:text-7xl font-semibold tracking-[-0.03em] text-home-ink [text-wrap:balance]">
        <span className="sr-only">Before Regret: </span>
        Know what to check, ask and verify before you <span className="text-blue-600">buy a home</span>.
      </h1>

      <p className="mt-6 mx-auto max-w-2xl text-lg sm:text-xl text-slate-500 leading-relaxed [text-wrap:pretty]">
        {/* 2026-11-18 (owner): shortened so it doesn't feel overwhelming. The first sentence stays as written:
            it is the definition AI answers quote. The second matches the two buttons below. */}
        Before Regret is a free property research tool for US home buyers. Enter an address, and
        we&rsquo;ll walk you through it step by step or give you a quick report right away.
      </p>

      <div ref={searchBoxRef} id="address-search-box" className="mt-10 mx-auto max-w-2xl min-h-[190px] sm:min-h-[140px] text-left text-slate-900">
        {searchBox ?? (
          <div aria-hidden="true" className="space-y-4">
            <div className="rounded-2xl bg-white border border-slate-200 shadow-lg p-3 sm:p-4">
              <div className="rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-slate-400 text-xs sm:text-sm">
                Street address, city, state
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="rounded-full bg-blue-600 px-5 py-3.5 text-sm font-bold text-white text-center leading-tight">Start research<span className="block mt-0.5 text-xs font-medium text-blue-100">One question at a time</span></div>
              <div className="rounded-full bg-white border border-slate-300 px-5 py-3.5 text-sm font-bold text-slate-900 text-center leading-tight">Get the quick report<span className="block mt-0.5 text-xs font-medium text-slate-500">Everything at once, in seconds</span></div>
            </div>
          </div>
        )}
      </div>

      {/* 2026-11-23 (owner approved copy sheet H4): was "100% Free. No Sign-Up Required." */}
      <p className="mt-5 text-sm font-medium text-slate-500">Free. No sign-up.</p>
    </div>

  </section>
);
