import React from 'react';
import countyGuideData from '../../data/countyGuideData.json';
import { ContentLink } from '../home/ContentLink';

/**
 * County figures under a county permit guide (P4 option A, owner 2026-10-21): data we already published as studies,
 * shown on the 21 permit guides instead of on new county URLs. The August 2026 county pages failed as templated
 * pages; see docs/research/pseo-good-vs-bad-2026-10.md for the rules this section follows:
 *   - no generated prose: labels plus the county's own numbers, each with source and vintage;
 *   - a module appears only when we know what its data means; an unexplained gap is hidden, never explained away;
 *   - the figures describe the county, never a house (reports and guides are area-based).
 * Data: src/data/countyGuideData.json, built by scripts/build-county-guide-data.ts.
 * Rollout (owner, 2026-10-21): a split test. These 10 got the section on 2026-10-21; the other 11 county permit
 * guides are the comparison group and get it after the read on 2026-11-25. Groups were balanced by alternating down
 * the list sorted by 28-day Google impressions -- see data/experiments/2026-10-21-county-data-split.json for the
 * baseline and the decision rule. Do not add a comparison-group slug here before the read.
 */
export const COUNTY_DATA_ENABLED: ReadonlySet<string> = new Set([
  'check-building-permits-riverside-county-ca',
  'check-building-permits-philadelphia-county-pa',
  'check-building-permits-los-angeles-county-ca',
  'check-building-permits-orange-county-ca',
  'check-building-permits-queens-ny',
  'check-building-permits-miami-dade-county-fl',
  'check-building-permits-cook-county-il',
  'check-building-permits-middlesex-county-ma',
  'check-building-permits-santa-clara-county-ca',
  'check-building-permits-sacramento-county-ca',
]);

// Shapes written by scripts/build-county-guide-data.ts. Optional modules carry `absent` (a documented reason) or are
// null (no documented reason, so hidden).
interface County {
  county: string; stateAbbrev: string;
  housing: { source: string; vintage: string; study: string; housingUnits: number; medianYearBuilt: number; medianInOpenBracket: boolean;
    sharePre1940: number; olderThanPctOfCounties: number; national: { sharePre1940: number }; decades: Array<{ label: string; share: number }> };
  permits: { absent?: string; source?: string; period: { yearToDateThrough: string; comparedWith: string }; unitsChangePct: number;
    unitsCurrent: number; unitsPrior: number; singleFamilyChangePct: number | null; singleFamilyCurrent: number; singleFamilyPrior: number;
    multifamilyCurrent: number; multifamilyPrior: number; national: { unitsChangePct: number; singleFamilyChangePct: number } };
  floodOutsideZone: { absent?: string; claimsThrough?: string; classifiableClaims: number; shareOutsideZone: number; national: { shareOutsideZone: number } };
  floodTakeup: { asOf: string; study: string; takeupPct: number; floodZoneHomes: number; national: { takeupPct: number } } | null;
  dams: { highHazard: number; highHazardPoorOrUnsatisfactory: number; highHazardNoEmergencyPlan: number; note?: string; updated: string; study: string };
}

const n = (v: number) => v.toLocaleString('en-US');
const pct = (v: number) => `${v > 0 ? '+' : ''}${v}%`;
const month = (ym: string) => new Date(`${ym}-01T12:00:00Z`).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const fullDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

const Block: React.FC<{ title: string; children: React.ReactNode; source: string; study: string; onNavigate?: (p: string) => void }> = ({ title, children, source, study, onNavigate }) => (
  <div className="border-t border-home-linen pt-5 first:border-t-0 first:pt-0">
    <h3 className="text-sm font-bold text-home-ink">{title}</h3>
    <div className="mt-2 text-[15px] text-slate-700 leading-relaxed space-y-2">{children}</div>
    <p className="mt-2 text-xs text-slate-500">
      {source} &middot;{' '}
      <ContentLink href={study} onNavigate={onNavigate} className="underline underline-offset-2 hover:text-home-ink">How we built this</ContentLink>
    </p>
  </div>
);

export const CountyDataSection: React.FC<{ slug: string; onNavigate?: (p: string) => void }> = ({ slug, onNavigate }) => {
  if (!COUNTY_DATA_ENABLED.has(slug)) return null;
  const c = (countyGuideData.counties as unknown as Record<string, County>)[slug];
  if (!c) return null;
  const h = c.housing;
  const maxShare = Math.max(...h.decades.map((x) => x.share));
  const p = c.permits;
  const f = c.floodOutsideZone;
  const t = c.floodTakeup;
  const d = c.dams;
  const place = `${c.county}, ${c.stateAbbrev}`;

  return (
    <section aria-labelledby="county-data-heading" className="rounded-3xl bg-white border border-home-linen shadow-sm p-6 sm:p-8">
      <h2 id="county-data-heading" className="font-serif text-2xl sm:text-[1.75rem] font-semibold text-home-ink tracking-tight">
        {place}: the housing in numbers
      </h2>
      <p className="mt-2 text-sm text-slate-500">County-wide figures from public data we analysed. They describe the area, not any one house.</p>

      <div className="mt-6 space-y-5">
        <Block title="When the homes were built" source={`${h.source}, ${h.vintage}`} study={h.study} onNavigate={onNavigate}>
          <p>
            Median year built: <strong className="text-home-ink">{h.medianInOpenBracket ? '1939 or earlier' : h.medianYearBuilt}</strong>.
            {' '}That&apos;s older than the median home in {h.olderThanPctOfCounties}% of US counties.
            {' '}{h.sharePre1940}% of the {n(h.housingUnits)} homes here were built before 1940 (US: {h.national.sharePre1940}%).
          </p>
          <div role="img" aria-label={`Share of ${c.county} homes by decade built: ${h.decades.map((x) => `${x.label} ${x.share}%`).join(', ')}`} className="space-y-1 pt-1">
            {h.decades.map((x) => (
              <div key={x.label} className="flex items-center gap-2 text-xs">
                <span className="w-24 shrink-0 text-slate-500">{x.label}</span>
                <span className="flex-1 h-3 rounded bg-home-stone overflow-hidden">
                  <span className="block h-full rounded bg-home-oak" style={{ width: `${(x.share / maxShare) * 100}%` }} />
                </span>
                <span className="w-12 shrink-0 text-right tabular-nums text-slate-600">{x.share}%</span>
              </div>
            ))}
          </div>
        </Block>

        <Block title="Building permits this year" source={p.source ?? 'U.S. Census Bureau, Building Permits Survey'} study="/research/permit-pulse/" onNavigate={onNavigate}>
          {p.absent ? (
            <p>Not reported for this county: {p.absent.replace(/^This county /, 'it ')}</p>
          ) : (
            <>
              <p>
                {n(p.unitsCurrent)} housing units were permitted from January to {month(p.period.yearToDateThrough)}, against {n(p.unitsPrior)} in
                the same months of {p.period.comparedWith.slice(0, 4)} ({pct(p.unitsChangePct)}; US: {pct(p.national.unitsChangePct)}).
              </p>
              <p className="text-sm text-slate-600">
                Single-family: {n(p.singleFamilyCurrent)} vs {n(p.singleFamilyPrior)}
                {p.singleFamilyChangePct !== null ? ` (${pct(p.singleFamilyChangePct)}; US: ${pct(p.national.singleFamilyChangePct)})` : ''}.
                {' '}Multifamily: {n(p.multifamilyCurrent)} vs {n(p.multifamilyPrior)}.
              </p>
            </>
          )}
        </Block>

        <Block title="Flood claims outside the high-risk zone" source={`FEMA OpenFEMA NFIP claims, through ${fullDate(f.claimsThrough ?? '2026-06-01')}`} study="/research/outside-the-zone/" onNavigate={onNavigate}>
          {f.absent ? (
            <p>Too few flood claims here to report: {f.absent.charAt(0).toLowerCase() + f.absent.slice(1)}</p>
          ) : (
            <>
              <p>
                <strong className="text-home-ink">{f.shareOutsideZone}%</strong> of the {n(f.classifiableClaims)} NFIP flood claims in this county with a recorded
                flood zone were on policies rated outside the mapped high-risk zone (US: {f.national.shareOutsideZone}%).
              </p>
              <p className="text-sm text-slate-600">The zone is the one each policy was rated in when the claim was paid. Maps have been redrawn since.</p>
            </>
          )}
        </Block>

        {t && (
          <Block title="Flood insurance in mapped flood zones" source={`FEMA OpenFEMA NFIP penetration rates, as of ${fullDate(t.asOf)}`} study={t.study} onNavigate={onNavigate}>
            <p>
              {t.takeupPct}% of the {n(t.floodZoneHomes)} homes inside the county&apos;s mapped flood zones had an NFIP policy (US: {t.national.takeupPct}%).
              Private flood policies aren&apos;t counted.
            </p>
          </Block>
        )}

        <Block title="High-hazard dams" source={`U.S. Army Corps of Engineers, National Inventory of Dams, updated ${fullDate(d.updated)}`} study={d.study} onNavigate={onNavigate}>
          {d.highHazard === 0 ? (
            <p>{d.note}</p>
          ) : (
            <p>
              The inventory records <strong className="text-home-ink">{n(d.highHazard)}</strong> high-hazard dam{d.highHazard === 1 ? '' : 's'} in the county
              {d.highHazardPoorOrUnsatisfactory > 0 ? `; ${n(d.highHazardPoorOrUnsatisfactory)} rated poor or unsatisfactory` : ''}
              {d.highHazardNoEmergencyPlan > 0 ? `; ${n(d.highHazardNoEmergencyPlan)} with no emergency action plan on file` : ''}.
              {' '}&ldquo;High hazard&rdquo; describes what is downstream if a dam failed, not how likely it is to fail.
            </p>
          )}
        </Block>
      </div>
    </section>
  );
};
