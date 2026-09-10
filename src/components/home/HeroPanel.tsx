import React from 'react';

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
 * The hero was a stock-looking suburban street at dusk under a navy gradient, with a pair of
 * blurred colour blobs behind it, three checkmark bullets and a photograph doing no work. Those
 * are gone.
 *
 * The CENTRED composition is back by the owner's decision, and it is worth writing down that it is
 * a decision rather than a default: an interim version was left-aligned specifically because
 * everything-centred is a template signature. Centred is a legitimate choice for a hero this
 * short -- one headline, one sentence, one field -- and the things that actually made the old
 * version look generic were the stock photograph, the gradient blobs and the bullet list, not the
 * alignment.
 *
 * It also cost real money: the image had twice been the site's single largest LCP element (a 1.4MB
 * PNG, then a 233KB JPEG, finally a 52KB WebP plus a 23KB mobile crop, a preload hint, and a media
 * query pair that had to stay character-identical to the stylesheet). Removing it deletes all of
 * that machinery, and the LCP element becomes the headline -- text, in the static HTML, painting
 * as soon as the inlined stylesheet lands.
 *
 * WHAT REPLACES IT is nothing, deliberately. An interim version carried a card of live
 * getInspectionPriorities output for an example address, which was good evidence and still one more
 * thing to read before reaching the search box. The hero's job is a headline, a sentence and an
 * address field; the proof belongs in the sections below it, where a visitor who wants it has
 * already decided to keep scrolling.
 *
 * The ground is a flat ink with a hairline grid, which is a plat map and a ledger rather than a
 * gradient, and costs one CSS rule instead of a network request.
 *
 * The worked example that used to sit under the box as its own line is now the search field's
 * placeholder, so it does the same job without spending a line.
 */

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
  <section className="relative isolate overflow-hidden bg-white text-slate-900 border-b border-slate-200">
    {/* Hairline grid. A records product, not a gradient. Pure CSS, no request, and it fades out
        before it reaches the copy so it never competes with the headline. */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-60"
      style={{
        backgroundImage:
          'linear-gradient(to right, rgba(100,116,139,0.09) 1px, transparent 1px), linear-gradient(to bottom, rgba(100,116,139,0.09) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
        maskImage: 'radial-gradient(ellipse 90% 70% at 50% 0%, #000 40%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 90% 70% at 50% 0%, #000 40%, transparent 100%)',
      }}
    />
    {/* One cool wash from the top edge, sized to the section rather than floated as a blurred blob. */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-[420px]"
      style={{ background: 'radial-gradient(ellipse 60% 100% at 50% 0%, rgba(37,99,235,0.06), transparent 70%)' }}
    />

    <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-14 pb-16 sm:pt-20 sm:pb-20">
      <div className="max-w-2xl mx-auto text-center">
          {/* Mixed faces on purpose. Crimson Pro is already loaded for the site and goes unused
              above the fold; setting the one emotional word in it -- the word the brand is named
              for -- gives the headline a voice that Inter alone does not have, without turning
              into a decorative serif hero. */}
          <h1 className="mt-4 font-sans text-[2.1rem] leading-[1.08] sm:text-5xl lg:text-[3.4rem] font-extrabold tracking-[-0.02em] text-slate-900">
            Could you{' '}
            <span className="font-serif font-semibold italic tracking-normal text-blue-600">regret</span>{' '}
            moving here?
          </h1>

          <p className="mt-5 mx-auto max-w-xl text-base sm:text-lg text-slate-600 leading-relaxed">
            Search any US residential address and get the checks that actually matter for a home of
            its age and county, the exact questions to ask the seller, and a clear list of what to
            verify before you sign.
          </p>

          <div ref={searchBoxRef} id="address-search-box" className="mt-8 min-h-[76px] text-left">
            {searchBox ?? (
              /* Non-interactive replica, present only so the static hero is the same height as the
                 mounted one. aria-hidden and inert: it must never take focus or be read out. */
              <div aria-hidden="true" className="rounded-2xl bg-white border border-slate-200 shadow-lg p-3 flex gap-2">
                <div className="flex-1 rounded-xl bg-slate-50 border border-slate-300 px-4 py-3 text-slate-400 text-sm">
                  e.g. 301 Congress Ave, Austin, TX
                </div>
                <div className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white">Search</div>
              </div>
            )}
          </div>

          <p className="mt-4 text-sm font-semibold text-slate-900">Your first report is free.</p>
          <p className="mt-1 text-sm text-slate-500">No credit card required.</p>

          <a
            href="/sample-report/"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800 underline underline-offset-4 decoration-blue-300"
          >
            See a sample report
            <span aria-hidden="true">&rarr;</span>
        </a>
      </div>
    </div>
  </section>
);
