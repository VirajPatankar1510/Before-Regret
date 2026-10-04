import React, { useMemo, useState } from 'react';
import { ArrowRight, MapPin } from 'lucide-react';
import { ContentLink } from './ContentLink';
import type { HomeArticle } from '../../utils/homeContent';

/**
 * "Look it up by address" (2026-10-04): a US tile map of the county permit guides. The list of
 * counties is DERIVED from the published articles (slug pattern check-building-permits-<place>-<st>,
 * plus Harris's older slug), so a newly restored county appears here with no code change and a
 * removed one disappears. A tapped state lists its counties as plain links below the map; the
 * full list was dropped at the owner's request (too long on phones).
 */

// Standard 12-column US tile grid (col, row). Includes DC.
const TILES: Record<string, [number, number]> = {
  AK: [0, 0], ME: [11, 0], WI: [6, 1], VT: [10, 1], NH: [11, 1],
  WA: [1, 2], ID: [2, 2], MT: [3, 2], ND: [4, 2], MN: [5, 2], IL: [6, 2], MI: [7, 2], NY: [9, 2], MA: [10, 2],
  OR: [1, 3], NV: [2, 3], WY: [3, 3], SD: [4, 3], IA: [5, 3], IN: [6, 3], OH: [7, 3], PA: [8, 3], NJ: [9, 3], CT: [10, 3], RI: [11, 3],
  CA: [1, 4], UT: [2, 4], CO: [3, 4], NE: [4, 4], MO: [5, 4], KY: [6, 4], WV: [7, 4], VA: [8, 4], MD: [9, 4], DE: [10, 4],
  AZ: [2, 5], NM: [3, 5], KS: [4, 5], AR: [5, 5], TN: [6, 5], NC: [7, 5], SC: [8, 5], DC: [9, 5],
  OK: [4, 6], LA: [5, 6], MS: [6, 6], AL: [7, 6], GA: [8, 6],
  HI: [0, 7], TX: [4, 7], FL: [9, 7],
};

interface CountyGuide { state: string; place: string; slug: string }

const titleCase = (s: string) => s.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');

function countyGuides(articles: HomeArticle[]): CountyGuide[] {
  const out: CountyGuide[] = [];
  for (const a of articles) {
    if (a.slug === 'check-harris-county-permit-history-before-buying') { out.push({ state: 'TX', place: 'Harris County', slug: a.slug }); continue; }
    const m = a.slug.match(/^check-building-permits-(.+)-([a-z]{2})$/);
    if (!m) continue;
    const state = m[2].toUpperCase();
    if (!TILES[state]) continue;
    out.push({ state, place: titleCase(m[1]).replace('Miami Dade', 'Miami-Dade'), slug: a.slug });
  }
  return out.sort((x, y) => x.state.localeCompare(y.state) || x.place.localeCompare(y.place));
}

export const CountyMapSection: React.FC<{ articles: HomeArticle[]; onNavigate?: (path: string) => void }> = ({ articles, onNavigate }) => {
  const guides = useMemo(() => countyGuides(articles), [articles]);
  const byState = useMemo(() => {
    const m = new Map<string, CountyGuide[]>();
    for (const g of guides) m.set(g.state, [...(m.get(g.state) ?? []), g]);
    return m;
  }, [guides]);
  const [picked, setPicked] = useState<string | null>(null);
  // 2026-10-04, owner: the full 20-county list "feels too long". The list now appears only for a
  // tapped state. The live homepage linked no county guide before this redesign, so dropping the
  // full list leaves their internal links where they were.
  const shown = picked ? byState.get(picked) ?? [] : [];

  return (
    <section className="bg-home-navy text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div aria-hidden="true" className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
      <div className="relative max-w-6xl mx-auto home-reveal">
        {/* 2026-10-04: the owner's street photo (licence plate blurred). Lazy-loaded, below the fold;
            cropped taller on phones so the houses, not the sky, fill the frame. */}
        <img
          src="/images/home/street-1000.webp"
          srcSet="/images/home/street-640.webp 640w, /images/home/street-1000.webp 1000w, /images/home/street-1500.webp 1500w"
          sizes="(min-width: 1152px) 72rem, 100vw"
          width={1500}
          height={688}
          loading="lazy"
          decoding="async"
          alt="A tree-lined American street of older homes -- a brick colonial, a craftsman bungalow with a deep porch, and clapboard houses -- in late afternoon sun"
          className="mb-10 sm:mb-14 w-full h-56 sm:h-auto object-cover object-[70%_center] rounded-3xl ring-1 ring-white/10 shadow-2xl"
        />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-14 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-home-oak">Public records, by address</p>
            <h2 className="mt-3 font-serif text-3xl sm:text-5xl font-semibold tracking-tight">Look it up before you sign</h2>
            <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
              Permits, violations and landmark records are public, but every county keeps them somewhere different.
              Our county guides show exactly where to search and what the result means.
            </p>
            <ContentLink
              href="/guides/look-up-building-permits-by-address/"
              onNavigate={onNavigate}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white text-home-navy px-5 py-3 text-sm font-bold hover:bg-home-stone transition-colors"
            >
              How to look up any address <ArrowRight className="w-4 h-4" />
            </ContentLink>
          </div>

          <div>
            <div className="grid grid-cols-12 gap-1 sm:gap-1.5" role="group" aria-label="States with county permit guides">
              {Object.entries(TILES).map(([st, [c, r]]) => {
                const has = byState.has(st);
                const on = picked === st;
                return (
                  <button
                    key={st}
                    type="button"
                    disabled={!has}
                    onClick={() => setPicked(on ? null : st)}
                    aria-pressed={on}
                    aria-label={has ? `${st}: ${byState.get(st)!.length} county guide${byState.get(st)!.length > 1 ? 's' : ''}` : st}
                    className={`aspect-square rounded-md text-[9px] sm:text-[11px] font-bold flex items-center justify-center transition-all ${
                      on ? 'bg-home-oak text-home-navy scale-110 shadow-lg' : has ? 'bg-[#f2c98f] text-home-navy hover:bg-home-oak cursor-pointer' : 'bg-white/10 text-white/35'
                    }`}
                    style={{ gridColumnStart: c + 1, gridRowStart: r + 1 }}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
            {/* With no guide list (the content request failed), never print "show all 0" -- point to
                the hub, which lists every county itself. */}
            <p className="mt-3 text-xs text-slate-400">
              {guides.length > 0
                ? `Tap a highlighted state to see its county guides (${guides.length} counties in all).`
                : 'County guides are listed in the address lookup guide above.'}
            </p>
          </div>
        </div>

        {shown.length > 0 && (
        <ul className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {shown.map((g) => (
            <li key={g.slug}>
              <ContentLink
                href={`/guides/${g.slug}/`}
                onNavigate={onNavigate}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3.5 py-2.5 text-sm transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-home-oak shrink-0" />
                <span className="truncate">{g.place}, {g.state}</span>
              </ContentLink>
            </li>
          ))}
        </ul>
        )}
      </div>
    </section>
  );
};
