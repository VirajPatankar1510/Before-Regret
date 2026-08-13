import React from 'react';
import { CoverageStats, formatCompact } from '../../utils/homeContent';

interface ProofStripProps {
  stats: CoverageStats;
}

/**
 * Credibility band directly under the hero. Exists because the homepage's first impression was
 * "one search box and a price" -- nothing signalled that a real research library sits behind it.
 *
 * Deliberately one number, not a stat-tile row: housing units is the figure that scales with the
 * data itself (Census units across every county we hold verified data on) rather than with how
 * much has been written, so it reads as coverage rather than a content-volume brag. Counted from
 * live rows, never hardcoded, so it can only ever understate the library as it grows.
 */
export const ProofStrip: React.FC<ProofStripProps> = ({ stats }) => {
  if (!stats.totalHousingUnits) return null;

  return (
    <section className="bg-slate-950 border-t border-slate-800/60 px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="max-w-6xl mx-auto text-center space-y-1">
        <div className="font-sans text-4xl sm:text-5xl font-extrabold text-white tracking-tight tabular-nums">
          {formatCompact(stats.totalHousingUnits)}
        </div>
        <div className="text-xs sm:text-sm font-medium text-slate-400">
          Housing units covered
        </div>

        <p className="mt-6 pt-6 border-t border-slate-800/60 text-[11px] sm:text-xs text-slate-500 leading-relaxed">
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
