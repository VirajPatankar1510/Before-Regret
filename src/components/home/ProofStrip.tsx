import React from 'react';
import { CoverageStats, formatCompact } from '../../utils/homeContent';

interface ProofStripProps {
  stats: CoverageStats;
}

/**
 * Credibility band directly under the hero. Exists because the homepage's first impression was
 * "one search box and a price" -- nothing signalled that a real research library sits behind it.
 *
 * Every figure is counted from live rows (published articles, verified counties, Census housing
 * units), never hardcoded, so it can only ever understate the library as it grows. Wording is
 * deliberately literal: "housing units covered" is the Census unit count for counties we hold
 * verified data on -- not a claim that each home was individually examined.
 */
export const ProofStrip: React.FC<ProofStripProps> = ({ stats }) => {
  if (!stats.countyCount && !stats.guideCount) return null;

  const items = [
    { value: String(stats.guideCount), label: 'Research pages published' },
    { value: String(stats.countyCount), label: `Counties with verified data` },
    { value: formatCompact(stats.totalHousingUnits), label: 'Housing units covered' },
    { value: String(stats.stateCount), label: 'States represented' },
  ];

  return (
    <section className="bg-slate-950 border-t border-slate-800/60 px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {items.map((item) => (
            <div key={item.label} className="text-center lg:text-left space-y-1">
              <div className="font-sans text-3xl sm:text-4xl font-extrabold text-white tracking-tight tabular-nums">
                {item.value}
              </div>
              <div className="text-[11px] sm:text-xs font-medium text-slate-400 leading-snug">
                {item.label}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 pt-6 border-t border-slate-800/60 text-[11px] sm:text-xs text-slate-500 leading-relaxed text-center lg:text-left">
          Built on public data from the <span className="text-slate-400 font-medium">US Census Bureau (ACS)</span>,{' '}
          <span className="text-slate-400 font-medium">FEMA National Risk Index</span>,{' '}
          <span className="text-slate-400 font-medium">USGS / ASCE 7-22 seismic</span>, and{' '}
          <span className="text-slate-400 font-medium">NOAA storm records</span> — every figure on this
          site traces back to a named source.
        </p>
      </div>
    </section>
  );
};
