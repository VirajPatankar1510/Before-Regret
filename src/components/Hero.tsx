import React, { useRef, useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { AddressSearchBox } from './AddressSearchBox';
import { PropertySearchResult } from '../types';
import { HowItWorksSection } from './home/HowItWorksSection';
import { FaqSection } from './home/FaqSection';
import { ClosingCtaSection } from './home/ClosingCtaSection';
import { GuideCardsSection } from './home/GuideCardsSection';
import { WalkthroughToolSection } from './home/WalkthroughToolSection';
import { HeroPanel } from './home/HeroPanel';
import { TrustStrip } from './home/TrustStrip';
import { HouseXraySection } from './home/HouseXraySection';
import { HomeData, buildGuideClusters, pickResearchPages } from '../utils/homeContent';

interface HeroProps {
  onSelectProperty: (property: PropertySearchResult) => void;
  /** Guided research tool (unpublished). */
  onStartResearch?: (property: PropertySearchResult) => void;
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

export const Hero: React.FC<HeroProps> = ({ onSelectProperty, onStartResearch, onNavigate }) => {
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
    <div className="space-y-0">

      {/* 1. HERO -- see src/components/home/HeroPanel.tsx. Shared with the prerender rather than
          duplicated, which is what makes the two renders the same height and keeps LCP landing on
          the static paint instead of resetting when React mounts. */}
      <HeroPanel
        searchBoxRef={searchBoxRef}
        searchBox={<AddressSearchBox onSelectProperty={onSelectProperty} onStartResearch={onStartResearch} />}
      />

      {/* 2026-11-18 SIMPLIFIED ORDER (owner: "remove sections that make the website feel complex") --
          identical in scripts/prerender-homepage.tsx. Sources strip, the cutaway house, how it works
          (now also what's in the report and that it's free), then tools + research in one band.
          Removed: the separate report-contents and pricing sections (merged into how it works), the
          home-age slider, the county map and the research numbers band (one figure moved into the tools band). */}
      <TrustStrip />
      <HouseXraySection onNavigate={onNavigate} />
      <HowItWorksSection />
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

      {/* 2026-11-18 (owner): book promo removed from the homepage -- it weakened the product's focus. */}

      {/* 6. FREQUENTLY ASKED QUESTIONS */}
      <FaqSection />

      {/* 7. CLOSING CALL TO ACTION */}
      <ClosingCtaSection onScrollToSearch={handleScrollToSearch} />

    </div>
  );
};
