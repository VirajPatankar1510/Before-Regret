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
import { WalkthroughToolSection } from './home/WalkthroughToolSection';
import { HeroPanel } from './home/HeroPanel';
import { BookPromoCard } from './BookPromo';
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

      {/* 1. HERO -- see src/components/home/HeroPanel.tsx. Shared with the prerender rather than
          duplicated, which is what makes the two renders the same height and keeps LCP landing on
          the static paint instead of resetting when React mounts. */}
      <HeroPanel
        searchBoxRef={searchBoxRef}
        searchBox={<AddressSearchBox onSelectProperty={onSelectProperty} />}
      />

      {/* 2. WHAT A LISTING WON'T TELL YOU */}
      <ListingOmissionsSection />

      {/* 3. HOW IT WORKS & DATA SYNTHESIS WORKFLOW */}
      <HowItWorksSection />

      {/* 4. PLAIN, TRANSPARENT PRICING -- directly after the product explanation, before the
          content library. A landing page makes its offer early; the library below is there for
          whoever isn't ready yet, not a detour before the price. */}
      <PricingSection onScrollToSearch={handleScrollToSearch} />

      {/* 4b. FREE WALKTHROUGH TOOL -- the no-signup entry point to /walkthrough/. After pricing,
          not before it: a free call to action immediately above a price competes with the one
          commercial ask the homepage makes. Same position in scripts/prerender-homepage.tsx. */}
      <WalkthroughToolSection onNavigate={onNavigate} />

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

      {/* 5c. OUR BOOK -- same position as scripts/prerender-homepage.tsx so the static and
          client renders match. Below the hero search and pricing on purpose: the homepage's job
          is turning an address lookup into a report. */}
      <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <BookPromoCard />
        </div>
      </section>

      {/* 6. FREQUENTLY ASKED QUESTIONS */}
      <FaqSection />

      {/* 7. CLOSING CALL TO ACTION */}
      <ClosingCtaSection onScrollToSearch={handleScrollToSearch} />

    </div>
  );
};
