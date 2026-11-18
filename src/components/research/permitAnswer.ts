// Permit question: from a Census-resolved government (Layer 0) to whatever our database has verified for it.
// Plan: docs/plans/permit-coverage-usa-2026-11.md. Data: src/data/permitRecords/permitIndex.json (built by
// scripts/build-permit-index.ts from data/permit-records/, verified values only).
//
// Safe failure: any name that doesn't match falls back to the general route, never to a guessed office.

import { authorityLabel, nameKeys, type PermitAuthority } from '../../data/permitRecords/authority';
import { effectiveStatus, type Field, type FieldStatus } from '../../data/permitRecords/schema';

export interface IndexJurisdiction {
  id: string;
  name: string;
  kind: string;
  [field: string]: unknown;
}
interface IndexCounty {
  state: string;
  countyFips: string;
  county: string;
  guideSlug: string | null;
  coverage: Field<unknown>;
  jurisdictions: IndexJurisdiction[];
}
export interface PermitIndex { schemaVersion: 1; counties: IndexCounty[] }

let indexPromise: Promise<PermitIndex> | null = null;
/** The index is ~130 KB of JSON, so it loads only when the permit question opens. */
export function loadPermitIndex(): Promise<PermitIndex> {
  if (!indexPromise) indexPromise = import('../../data/permitRecords/permitIndex.json').then((m) => (m.default || m) as unknown as PermitIndex);
  return indexPromise;
}

export type PermitLevel = 'full' | 'portal' | 'office' | 'general';

export interface PermitAnswer {
  level: PermitLevel;
  authority: PermitAuthority | null;
  /** "the City of Clearwater", "Riverside County" -- the likely government, from Census boundaries. */
  officeLabel: string | null;
  /** The database record whose department holds the records (after following permitsIssuedBy). */
  record: IndexJurisdiction | null;
  /** The record matched for this address before following the pointer (differs when a city is served by the county). */
  matched: IndexJurisdiction | null;
  guideSlug: string | null;
}

/** A field the tool may show: verified or partly verified, and not past its re-check date. */
export function shown<T>(j: IndexJurisdiction | null, name: string): (Field<T> & { status: 'verified' | 'partially_verified' }) | null {
  const f = j?.[name] as Field<T> | undefined;
  if (!f) return null;
  const s: FieldStatus = effectiveStatus(f as Field<unknown>);
  return s === 'verified' || s === 'partially_verified' ? (f as Field<T> & { status: 'verified' | 'partially_verified' }) : null;
}

const WHOLE_COUNTY_KINDS = ['consolidated-city-county', 'borough'];

function matchInCounty(county: IndexCounty, a: PermitAuthority): IndexJurisdiction | null {
  const js = county.jurisdictions;
  if (a.kind === 'county') {
    return js.find((j) => j.kind === 'county-unincorporated') || js.find((j) => WHOLE_COUNTY_KINDS.includes(j.kind)) || null;
  }
  const want = new Set([...nameKeys(a.name), ...nameKeys(a.baseName)]);
  const byName = js.find((j) => j.kind !== 'county-unincorporated' && nameKeys(j.name).some((k) => want.has(k)));
  if (byName) return byName;
  // New York City's boroughs: the incorporated place is "New York city" in every borough's county, and each
  // borough file holds one whole-county jurisdiction.
  const whole = js.filter((j) => WHOLE_COUNTY_KINDS.includes(j.kind));
  return whole.length === 1 ? whole[0] : null;
}

function levelOf(j: IndexJurisdiction | null): PermitLevel {
  if (!j) return 'general';
  const portal = shown<string>(j, 'portalUrl');
  const tested = shown<string>(j, 'addressSearchTested');
  const online = shown<string>(j, 'onlineRecordsFrom');
  if (portal?.status === 'verified' && tested && online) return 'full';
  if (portal) return 'portal';
  if (shown<string>(j, 'permitsIssuedBy') || shown<string>(j, 'buildingDepartment')) return 'office';
  return 'general';
}

export function answerFor(index: PermitIndex, authority: PermitAuthority | null): PermitAnswer {
  const base: PermitAnswer = { level: 'general', authority, officeLabel: authority ? authorityLabel(authority) : null, record: null, matched: null, guideSlug: null };
  if (!authority) return base;
  const county = index.counties.find((c) => c.countyFips === authority.countyFips);
  if (!county) return base;
  const matched = matchInCounty(county, authority);
  if (!matched) return base;

  // Follow "permits issued by" when it points at another jurisdiction (a city served by its county).
  let record: IndexJurisdiction = matched;
  const issuedBy = shown<string>(matched, 'permitsIssuedBy');
  if (issuedBy && issuedBy.value && issuedBy.value !== matched.id) {
    const target = index.counties.flatMap((c) => c.jurisdictions).find((j) => j.id === issuedBy.value);
    if (target) record = target;
  }
  return { ...base, matched, record, level: levelOf(record), guideSlug: county.guideSlug };
}
