import React, { useRef, useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { AddressSearchBox } from './AddressSearchBox';
import { PropertySearchResult } from '../types';
import { ListingOmissionsSection } from './home/ListingOmissionsSection';
import { HowItWorksSection } from './home/HowItWorksSection';
import { PricingSection } from './home/PricingSection';
import { FaqSection } from './home/FaqSection';
import { ClosingCtaSection } from './home/ClosingCtaSection';
import { GuideCardsSection } from './home/GuideCardsSection';
import { HomeData, buildGuideClusters, pickResearchPages } from '../utils/homeContent';

interface HeroProps {
  onSelectProperty: (property: PropertySearchResult) => void;
  onNavigate?: (path: string) => void;
}

const EMPTY_HOME_DATA: HomeData = { articles: [], counties: [] };

/**
 * Homepage content comes from whichever source is available, in that order:
 *
 *  1. `window.__PRELOADED_HOME__`, embedded in dist/index.html by scripts/prerender-homepage.tsx.
 *     On a real page load this is always present, so the content sections render on the very first
 *     paint with no fetch and no layout shift -- the same trick CountyPageView uses with
 *     __PRELOADED_COUNTY__.
 *  2. GET /api/homepage, for dev (where no prerender has run) and for client-side navigations back
 *     to '/' that never reloaded the document.
 */
function useHomeData(): HomeData {
  const [data, setData] = useState<HomeData>(() => {
    if (typeof window === 'undefined') return EMPTY_HOME_DATA;
    const preloaded = (window as any).__PRELOADED_HOME__;
    return preloaded && Array.isArray(preloaded.articles) ? (preloaded as HomeData) : EMPTY_HOME_DATA;
  });

  useEffect(() => {
    if (data.articles.length > 0 || data.counties.length > 0) return;
    let cancelled = false;
    fetch('/api/homepage')
      .then((res) => res.json())
      .then((json) => {
        if (cancelled || !json?.success) return;
        setData({ articles: json.articles || [], counties: json.counties || [] });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // Runs once on mount; the guard above is what prevents a refetch when the preload already
    // supplied content.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return data;
}

export const Hero: React.FC<HeroProps> = ({ onSelectProperty, onNavigate }) => {
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const homeData = useHomeData();

  const clusters = buildGuideClusters(homeData.articles);
  const research = pickResearchPages(homeData.articles);

  const handleScrollToSearch = () => {
    if (searchBoxRef.current) {
      searchBoxRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-0 pb-16">

      {/* 1. HERO SECTION (Address Search Container Untouched) */}
      {/* min-h-[85vh]: background-attachment: fixed positions relative to the viewport, not this
          section, so the section needs to be close to viewport height for bg-center's cover-fit
          math to land the image the way it would in a normal (non-fixed) section -- otherwise a
          short section only ever windows into a narrow, arbitrary slice of the fixed image, and
          there's no scroll distance left to actually feel the parallax. flex centering keeps the
          content vertically centered now that the section is taller than its content. */}
      <section className="relative min-h-[85vh] flex flex-col justify-center text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden shadow-2xl">

        {/* Background image -- real photograph of a suburban street at dusk (2.28:1). The actual
            background-image lives in the .hero-bg rule in src/index.css, which serves a 52KB WebP
            with the 233KB JPEG as fallback; see that rule for why it's there and not inline here.
            It has twice been the site's single largest LCP cost per PageSpeed Insights: first as a
            1.4MB lossless PNG (re-encoded to JPEG), then as that JPEG. Sky is already near-black at the top
            (where the headline sits), so the overlay is kept light there and only slightly
            heavier toward the bottom -- just enough for the free-report subtext to stay
            readable, while letting the house row show through clearly rather than washing it
            out. The search bar has its own solid card background (see AddressSearchBox.tsx), so
            it doesn't depend on this overlay for contrast. bg-fixed anchors the image
            to the viewport rather than this section, so it stays put while the section's own
            content scrolls over it -- the section's overflow-hidden + rounded corners clip it to
            a fixed "window," giving a parallax feel without a scroll-listener. Mobile browsers
            (especially iOS Safari) are notoriously unreliable with background-attachment: fixed
            on a non-body element inside an overflow-hidden container -- rather than degrading to
            a normal static background, several of them fail to paint it at all. bg-scroll below
            md is the safe default there; the parallax only kicks in from md up, where desktop
            browsers handle it correctly. */}
        <div className="hero-bg absolute inset-0 bg-cover bg-center bg-scroll md:bg-fixed" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/10 via-slate-950/25 to-slate-950/50" />

        {/* Ambient background lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">

          {/* Main Risk-Framed Headline & Subhead */}
          <div className="space-y-5">
            <h1 className="font-sans text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
              Could you regret moving here?
            </h1>
            <p className="text-base sm:text-xl text-slate-300 font-sans font-normal max-w-2xl mx-auto leading-relaxed">
              Search any US residential address and get:
            </p>
            {/* Broken out from one dense sentence into a scannable checklist -- three distinct
                deliverables read faster as three lines than buried in one "X, Y, and Z" clause. */}
            <ul className="max-w-md mx-auto text-left space-y-2.5 pt-1">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 shrink-0 mt-0.5" />
                <span className="text-sm sm:text-base text-slate-300 leading-snug">
                  The checks that actually matter for a home of its age and county
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 shrink-0 mt-0.5" />
                <span className="text-sm sm:text-base text-slate-300 leading-snug">
                  The exact questions to ask the seller
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 shrink-0 mt-0.5" />
                <span className="text-sm sm:text-base text-slate-300 leading-snug">
                  A clear list of what to verify before you sign
                </span>
              </li>
            </ul>
          </div>

          {/* Search Box Container */}
          <div ref={searchBoxRef} id="address-search-box" className="pt-2">
            <AddressSearchBox onSelectProperty={onSelectProperty} />
          </div>

          {/* Concrete example -- the placeholder alone ("Enter your full street address...")
              says what format to type but not what it actually looks like, or that a full report
              is what comes out the other end. */}
          <p className="text-xs text-slate-500">
            e.g., 301 Congress Ave, Austin, TX
          </p>

          {/* Subtext */}
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            Your first report is free. No credit card required.
          </p>

          {/* Sample report link -- for a visitor deciding whether to trust the product with a real
              address before typing one in. Plain <a>, not onNavigate/ContentLink: /sample-report/
              is a static file in public/ (see that file's own comments), not an SPA route, so it
              needs a real document load the same way the footer's link to it does. Styled as a
              quiet outlined pill on the dark hero background, deliberately lighter weight than the
              search box above it -- this is a secondary path for the undecided, not competing with
              the primary flow. */}
          <a
            href="/sample-report/"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-200 border border-white/20 rounded-full hover:bg-white/10 hover:text-white hover:border-white/30 transition-colors"
          >
            See a sample report
            <span aria-hidden="true">&rarr;</span>
          </a>

        </div>
      </section>

      {/* 2. WHAT A LISTING WON'T TELL YOU */}
      <ListingOmissionsSection />

      {/* 3. HOW IT WORKS & DATA SYNTHESIS WORKFLOW */}
      <HowItWorksSection />

      {/* 4. PLAIN, TRANSPARENT PRICING -- directly after the product explanation, before the
          content library. A landing page makes its offer early; the library below is there for
          whoever isn't ready yet, not a detour before the price. */}
      <PricingSection onScrollToSearch={handleScrollToSearch} />

      {/* 5. GUIDE LIBRARY -- a diverse sample of real guide cards, explicitly framed as free
          content separate from the report (see GuideCardsSection.tsx for why the framing matters
          here specifically). Everything not shown inline is one click away at /guides/. */}
      <GuideCardsSection
        clusters={clusters}
        research={research}
        totalGuides={homeData.articles.length}
        onNavigate={onNavigate}
      />

      {/* 5b. COUNTY DIRECTORY -- every covered county page linked directly from the homepage, the
          internal-linking fix for county pages stuck in "Discovered - not indexed" (see
          CountyLinksSection.tsx). Sits right after the guide library, before the FAQ, mirroring the
          exact position in scripts/prerender-homepage.tsx so the static and client renders match. */}

      {/* 6. FREQUENTLY ASKED QUESTIONS */}
      <FaqSection />

      {/* 7. CLOSING CALL TO ACTION */}
      <ClosingCtaSection onScrollToSearch={handleScrollToSearch} />

    </div>
  );
};
