import React from 'react';
import { ArrowRight } from 'lucide-react';
import { ContentLink } from './ContentLink';
import stats from '../../data/homeStats.json';

/**
 * Original research, as three numbers (2026-10-04). Every figure comes from src/data/homeStats.json,
 * which scripts/build-home-stats.ts writes from the real study figure files at every build -- never
 * typed here, so the monthly Permit Pulse refresh updates the homepage on its own.
 */

const fmt = (n: number) => n.toLocaleString('en-US');

export const ResearchStatsSection: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  const cards = [
    {
      big: `${stats.outsideZone.sharePct}%`,
      line: `of ${fmt(stats.outsideZone.claims)} federal flood insurance claims were paid on homes rated outside the high-risk flood zone.`,
      source: stats.outsideZone.source,
      href: stats.outsideZone.href,
      label: 'Outside the Zone',
    },
    {
      big: fmt(stats.dams.high),
      line: `dams in the US are classed as high hazard potential, and ${stats.dams.pctPoor}% of them carry a poor or unsatisfactory condition rating.`,
      source: stats.dams.source,
      href: stats.dams.href,
      label: 'High-Hazard Dams by County',
    },
    {
      big: `${stats.permits.singleFamilyPct > 0 ? '+' : stats.permits.singleFamilyPct < 0 ? '\u2212' : ''}${Math.abs(stats.permits.singleFamilyPct)}%`,
      line: `change in single-family home permits this year through ${stats.permits.through}. House permits fell in ${stats.permits.countiesFell} of ${stats.permits.counties} large counties.`,
      source: stats.permits.source,
      href: stats.permits.href,
      label: 'Permit Pulse',
    },
  ];

  return (
    <section className="bg-home-stone py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto home-reveal">
        <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-8 lg:gap-12 items-center">
          {/* 2026-10-04: the owner's row-house photo, cropped to leave out a car with a made-up badge.
              Lazy-loaded, below the fold. Comes after the text on phones, before it on desktop. */}
          <img
            src="/images/home/rowhouses-1000.webp"
            srcSet="/images/home/rowhouses-640.webp 640w, /images/home/rowhouses-1000.webp 1000w"
            sizes="(min-width: 1024px) 32rem, 100vw"
            width={1000}
            height={625}
            loading="lazy"
            decoding="async"
            alt="A block of older brick row houses with stoops, wrought-iron railings, window boxes and a street tree"
            className="order-2 lg:order-1 w-full h-auto rounded-3xl border border-home-linen shadow-sm"
          />
          <div className="order-1 lg:order-2 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-home-brass">Original research</p>
            <h2 className="mt-3 font-serif text-3xl sm:text-5xl font-semibold text-home-ink tracking-tight">The numbers behind the house</h2>
            <p className="mt-4 text-base sm:text-lg text-slate-700 leading-relaxed">
              We analyse public federal data and publish every figure, free, with the data files beside it.
            </p>
            <ContentLink href="/research/" onNavigate={onNavigate} className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-blue-700 hover:gap-2.5 transition-all">
              All research <ArrowRight className="w-4 h-4" />
            </ContentLink>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
          {cards.map((c) => (
            <ContentLink
              key={c.label}
              href={c.href}
              onNavigate={onNavigate}
              className="group flex flex-col rounded-3xl bg-white border border-home-linen p-6 sm:p-7 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="font-serif text-5xl sm:text-6xl font-semibold text-home-navy tabular-nums tracking-tight">{c.big}</div>
              <p className="mt-3 text-sm sm:text-base text-slate-700 leading-relaxed flex-1">{c.line}</p>
              <div className="mt-5 pt-4 border-t border-home-linen flex items-center justify-between gap-3">
                <span className="text-[11px] text-slate-500 leading-snug">Source: {c.source}</span>
                <span className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-blue-700">
                  {c.label} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </ContentLink>
          ))}
        </div>
      </div>
    </section>
  );
};
