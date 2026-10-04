import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import stats from '../../data/homeStats.json';
import { ContentLink } from './ContentLink';

/**
 * "What your home's age tells you" (2026-10-04). Every year range here is READ from PRIORITY_RULES,
 * the same table the paid report runs on, never typed: if a rule's range changes, this graphic
 * changes with it. Only rules decided by build year alone are shown -- region-scoped rules
 * (foundation soils, termite states, radon zones) depend on the address, so they belong in the
 * report, not on a page that knows no address.
 *
 * Static render (prerender) shows the default year with its full list, so crawlers and no-JS
 * readers get real content and links; the slider only changes which ones are highlighted.
 */

const ERA_RULES: Array<{ id: string; short: string; href: string }> = [
  { id: 'knob_and_tube', short: 'Knob-and-tube wiring', href: '/guides/what-is-knob-and-tube-wiring/' },
  { id: 'galvanized_supply', short: 'Galvanized water pipes', href: '/guides/spot-polybutylene-pipes-before-buying-house/' },
  { id: 'sewer_cast_iron', short: 'Cast iron sewer line', href: '/guides/why-cast-iron-pipes-corrode/' },
  // No lead-PAINT guide exists (the lead guide is about water pipes), so this one goes to EPA's own page.
  { id: 'lead_paint_disclosure', short: 'Lead paint disclosure', href: 'https://www.epa.gov/lead/real-estate-disclosures-about-potential-lead-hazards' },
  { id: 'asbestos_materials', short: 'Asbestos materials', href: '/guides/standard-home-inspection-check-asbestos/' },
  { id: 'electrical_panel_brand', short: 'Electrical panel brand', href: '/guides/federal-pacific-stab-lok-panel-inspectors-flag/' },
  { id: 'electrical_aluminum_wiring', short: 'Aluminum branch wiring', href: '/guides/get-home-insurance-aluminum-wiring/' },
  { id: 'polybutylene_supply', short: 'Polybutylene supply pipes', href: '/guides/spot-polybutylene-pipes-before-buying-house/' },
  { id: 'eifs_stucco', short: 'Synthetic stucco (EIFS)', href: '/guides/standard-home-inspection-check-eifs-stucco-moisture/' },
];

const START = 1900;
const END = 2015;
const DEFAULT_YEAR = 1962;

const rows = ERA_RULES.map((r) => {
  // Ranges come from homeStats.json, which build-home-stats.ts copies from PRIORITY_RULES at build.
  const rule = stats.eraRules.find((p) => p.id === r.id);
  if (!rule) throw new Error(`HomeAgeTimeline: rule ${r.id} missing from homeStats.eraRules`);
  return { ...r, title: rule.title, from: Math.max(START, rule.minYear), to: Math.min(END, rule.maxYear), rawFrom: rule.minYear, rawTo: rule.maxYear };
});

const pct = (y: number) => ((y - START) / (END - START)) * 100;
const span = (r: { rawFrom: number; rawTo: number }) => (r.rawFrom <= 1800 ? `before ${r.rawTo + 1}` : `${r.rawFrom}–${r.rawTo}`);

export const HomeAgeTimeline: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  const [year, setYear] = useState(DEFAULT_YEAR);
  const active = rows.filter((r) => year >= r.rawFrom && year <= r.rawTo);

  return (
    <section className="bg-home-sage/60 border-y border-home-linen py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto home-reveal">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-12 items-center">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-home-moss">The year it was built</p>
            <h2 className="mt-3 font-serif text-3xl sm:text-5xl font-semibold text-home-ink tracking-tight">What your home&rsquo;s age tells you</h2>
            <p className="mt-4 text-base sm:text-lg text-slate-700 leading-relaxed">
              Every era of American building left its own materials behind the walls. Move the slider to the year a
              house was built and see what is worth checking.
            </p>
          </div>
          {/* 2026-10-04: the owner's basement photo, cropped to the panel wall -- the generated water
              heater beside it had an impossible vent and relief-valve line, so it was cut out. */}
          <img
            src="/images/home/basement-948.webp"
            srcSet="/images/home/basement-600.webp 600w, /images/home/basement-948.webp 948w"
            sizes="(min-width: 1024px) 30rem, 100vw"
            width={948}
            height={711}
            loading="lazy"
            decoding="async"
            alt="An unfinished basement with the electrical panel on a plywood board, a small window, and water stains along the bottom of the concrete foundation wall"
            className="w-full h-auto rounded-3xl border border-home-linen shadow-sm"
          />
        </div>

        <div className="mt-10 rounded-3xl bg-white/90 border border-home-linen shadow-sm p-5 sm:p-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Built in</div>
              <div className="font-serif text-5xl sm:text-6xl font-semibold text-home-navy tabular-nums leading-none">{year}</div>
            </div>
            <div className="text-right text-sm text-slate-600">
              <span className="font-bold text-home-ink tabular-nums">{active.length}</span> of {rows.length} era checks apply
            </div>
          </div>

          <input
            type="range"
            min={START}
            max={END}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            aria-label="Year the house was built"
            className="mt-6 w-full accent-[#9c7742] cursor-pointer"
          />
          <div className="mt-1 flex justify-between text-[11px] font-semibold text-slate-400 tabular-nums">
            {[1900, 1920, 1940, 1960, 1980, 2000].map((d) => (
              <button key={d} type="button" onClick={() => setYear(d + 5)} className="hover:text-home-brass">{d}s</button>
            ))}
          </div>

          {/* The bars: each material's era, with a marker at the chosen year. */}
          <div className="mt-6 space-y-2.5 relative">
            {rows.map((r) => {
              const on = year >= r.rawFrom && year <= r.rawTo;
              return (
                <div key={r.id} className="grid grid-cols-[9.5rem_1fr] sm:grid-cols-[13rem_1fr] items-center gap-3">
                  <div className={`text-xs sm:text-sm truncate ${on ? 'font-bold text-home-ink' : 'text-slate-400'}`}>{r.short}</div>
                  <div className="relative h-3 rounded-full bg-home-stone">
                    <div
                      className={`absolute top-0 h-3 rounded-full transition-colors ${on ? 'bg-home-brass' : 'bg-home-linen'}`}
                      style={{ left: `${pct(r.from)}%`, width: `${Math.max(1.5, pct(r.to) - pct(r.from))}%` }}
                    />
                    <div aria-hidden="true" className="absolute -top-1 -bottom-1 w-0.5 rounded bg-home-navy/70" style={{ left: `${pct(year)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(active.length ? active : []).map((r) => (
              <ContentLink
                key={r.id}
                href={r.href}
                onNavigate={r.href.startsWith('/') ? onNavigate : undefined}
                className="group rounded-2xl border border-home-linen bg-home-stone/60 hover:bg-white hover:border-home-oak p-4 transition-colors"
              >
                <div className="text-[11px] font-bold uppercase tracking-wider text-home-brass">{span(r)}</div>
                <div className="mt-1 text-sm font-bold text-home-ink leading-snug">{r.title}</div>
                <div className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 group-hover:gap-2 transition-all">
                  {r.href.startsWith('/') ? 'Read the guide' : 'EPA guidance'} <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </ContentLink>
            ))}
            {active.length === 0 && (
              <p className="text-sm text-slate-600 sm:col-span-3">
                None of these era-specific materials apply to a house built in {year}. A full report still covers what
                depends on the address itself, like the county and local hazards.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
