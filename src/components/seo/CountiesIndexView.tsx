import React, { useEffect, useState } from 'react';
import { applyHeadSeo } from '../../utils/headSeo';
import { ChevronRight, Loader2, MapPin } from 'lucide-react';

interface CountiesIndexViewProps {
  onNavigate: (path: string) => void;
}

interface CountyRow {
  slug: string;
  countyName: string;
  stateName: string;
  stateAbbrev: string;
  population: number | null;
}

// county_data stores county_name in the all-caps form FEMA/NOAA/Census use for matching (e.g.
// "LOS ANGELES") -- the API passes that through unchanged, so every reader-facing use title-cases
// it itself. Same helper, same reasoning, as CountyPageView.tsx's own copy.
function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/(^|[\s-])([a-z])/g, (_, sep, letter) => sep + letter.toUpperCase());
}

// The hub every county page should be reachable from with one click -- before this existed, none
// of the 31 county pages had a single crawlable inbound link anywhere on the site (confirmed by
// walking the built HTML output: 20 of 31 had zero, the rest had at most a handful from county-
// specific guides). Mirrors GuidesIndexView.tsx's reasoning exactly, and reuses the same public,
// cached, rate-limited /api/v1/counties route this app already ships for external consumers rather
// than adding a second internal one. See scripts/prerender-counties.tsx for the crawler-facing
// static twin of this page.
export const CountiesIndexView: React.FC<CountiesIndexViewProps> = ({ onNavigate }) => {
  const [counties, setCounties] = useState<CountyRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    let cancelled = false;
    fetch('/api/v1/counties')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.success && Array.isArray(data.counties)) {
          setCounties(data.counties.map((c: CountyRow) => ({ ...c, countyName: titleCase(c.countyName) })));
        } else {
          setLoadError(data?.error || 'Could not load the county list.');
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError('Could not reach the server.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const canonicalUrl = 'https://www.beforeregret.com/counties/';

  useEffect(() => {
    if (!counties) return;
    applyHeadSeo({
      title: 'County Property Research | BeforeRegret',
      description: `Real EPA radon, Census housing-age, FEMA hazard, and NOAA storm data for ${counties.length} US counties -- every figure sourced, nothing estimated.`,
      canonicalUrl,
      robotsDirective: 'index, follow',
      jsonLdSchema: [
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          'itemListElement': [
            { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://www.beforeregret.com/' },
            { '@type': 'ListItem', 'position': 2, 'name': 'County Research', 'item': canonicalUrl },
          ],
        },
        {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          'itemListElement': counties.map((c, idx) => ({
            '@type': 'ListItem',
            'position': idx + 1,
            'url': `https://www.beforeregret.com/county/${c.slug}/`,
            'name': `${c.countyName} County, ${c.stateAbbrev}`,
          })),
        },
      ],
    });
  }, [counties, canonicalUrl]);

  const grouped = counties
    ? Array.from(
        counties
          .reduce((map, c) => {
            const list = map.get(c.stateAbbrev) ?? [];
            list.push(c);
            map.set(c.stateAbbrev, list);
            return map;
          }, new Map<string, CountyRow[]>())
          .entries()
      )
        .map(([state, list]) => ({
          state,
          counties: list.sort((a, b) => (b.population || 0) - (a.population || 0)),
        }))
        .sort((a, b) => b.counties.length - a.counties.length || a.state.localeCompare(b.state))
    : [];

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      <div className="bg-white border-b border-slate-200 py-3 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center gap-2 text-xs text-slate-500 font-medium">
          <button onClick={() => onNavigate('/')} className="hover:text-blue-600">Home</button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-bold">County Research</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
            <MapPin className="w-3.5 h-3.5" />
            <span>County Research</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
            Every county we hold verified data on
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
            Each page carries that county's real EPA radon zone, Census housing-age breakdown, FEMA
            natural hazard risk, and recorded NOAA storm history -- pulled from the source, not
            estimated. A county with incomplete data from any of the four never gets a page.
          </p>
        </div>

        {loadError && (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-sm text-slate-500">
            {loadError}
          </div>
        )}

        {!counties && !loadError && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        )}

        {grouped.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
            {grouped.map((group) => (
              <div key={group.state} className="space-y-2">
                <div className="flex items-baseline gap-2 pb-1.5 border-b border-slate-200">
                  <span className="text-sm font-extrabold text-slate-900 tracking-tight">{group.state}</span>
                  <span className="text-[11px] font-medium text-slate-400">
                    {group.counties.length} {group.counties.length === 1 ? 'county' : 'counties'}
                  </span>
                </div>
                <ul>
                  {group.counties.map((county) => (
                    <li key={county.slug}>
                      <button
                        onClick={() => onNavigate(`/county/${county.slug}/`)}
                        className="w-full flex items-baseline justify-between gap-3 py-1.5 text-xs text-slate-700 hover:text-blue-700 font-medium text-left cursor-pointer"
                      >
                        <span>{county.countyName} County</span>
                        {county.population && (
                          <span className="text-[11px] text-slate-400 shrink-0">
                            pop. {county.population.toLocaleString()}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
