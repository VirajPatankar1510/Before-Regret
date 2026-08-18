import React from 'react';
import { ArrowRight, MapPin } from 'lucide-react';
import { HomeCounty, formatCountyName, sortCountiesForDirectory } from '../../utils/homeContent';
import { ContentLink } from './ContentLink';

interface CountyLinksSectionProps {
  counties: HomeCounty[];
  onNavigate?: (path: string) => void;
}

// A flat A-Z directory linking every covered county page directly from the homepage.
//
// Why every county, not a curated few: real Search Console Index Coverage data found the site's
// county pages stuck in "Discovered - currently not indexed" -- Google knows them from the sitemap
// but hasn't prioritized crawling them, because their only inbound path was a single link to the
// /counties/ hub in the footer (see StaticFooterLinks.tsx). Funnelling 100 pages through one hub
// link is exactly what starves them of crawl priority. Linking each county page directly from the
// homepage -- the domain's single strongest page, and where crawls start -- gives every one of them
// a first-class inbound link instead of a third-hop one. This section is the homepage half of that
// fix; the footer's /counties/ hub link stays as the secondary path.
//
// A directory of ~100 substantive, data-backed pages (each carrying real Census housing-age, FEMA
// National Risk Index, EPA radon, and NOAA storm data -- see CountyPageView.tsx) is legitimate
// navigation, not a link farm: the distinction Google draws is whether the targets are real content
// a visitor would want, which these are.
//
// Rendered by BOTH src/components/Hero.tsx (client) and scripts/prerender-homepage.tsx (static
// crawler-facing HTML), in the same position, from the same sortCountiesForDirectory() ordering --
// same discipline GuideCardsSection follows -- so the booted app and the prerendered page show the
// same links in the same order. ContentLink renders a plain <a href> when no onNavigate is passed
// (the prerender case), so the links are crawlable without JS; that is the entire point.
export const CountyLinksSection: React.FC<CountyLinksSectionProps> = ({ counties, onNavigate }) => {
  if (counties.length === 0) return null;

  const sorted = sortCountiesForDirectory(counties);

  return (
    <section className="bg-white border-b border-slate-200/80 py-14 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">

        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-700">
            <MapPin className="w-3.5 h-3.5" />
            <span>County research</span>
          </div>
          <h2 className="font-sans text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Browse property research by county
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Housing-age, hazard, radon, and storm-history data for every county we cover — pulled
            from Census, FEMA, EPA, and NOAA records.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-1">
          {sorted.map((county) => (
            <ContentLink
              key={county.slug}
              href={`/county/${county.slug}/`}
              onNavigate={onNavigate}
              className="text-sm text-slate-700 hover:text-blue-700 py-1.5 border-b border-slate-100 transition-colors truncate"
            >
              {formatCountyName(county.countyName)} County, {county.stateAbbrev}
            </ContentLink>
          ))}
        </div>

        <div className="text-center">
          <ContentLink
            href="/counties/"
            onNavigate={onNavigate}
            className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-800"
          >
            View all {counties.length} counties <ArrowRight className="w-4 h-4" />
          </ContentLink>
        </div>

      </div>
    </section>
  );
};
