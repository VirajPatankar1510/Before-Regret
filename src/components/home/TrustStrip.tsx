import React from 'react';

/**
 * Names the public sources the site actually uses (2026-10-04): USGS (live seismic lookup), US Census
 * Bureau (address validation, housing age, building permits), FEMA (flood claims, hazard index), EPA
 * (radon zones, lead rules), NOAA (storm events). Plain text on purpose -- agency seals or logos
 * would read as an endorsement these agencies have not given.
 */
const SOURCES = ['USGS', 'US Census Bureau', 'FEMA', 'EPA', 'NOAA'];

export const TrustStrip: React.FC = () => (
  <div className="bg-white border-b border-home-linen px-4 sm:px-6 lg:px-8">
    <div className="max-w-6xl mx-auto py-5 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8">
      <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 shrink-0">Built on public records from</span>
      <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        {SOURCES.map((s) => (
          <li key={s} className="font-serif text-lg sm:text-xl font-semibold text-home-navy/80 tracking-tight">{s}</li>
        ))}
      </ul>
    </div>
  </div>
);
