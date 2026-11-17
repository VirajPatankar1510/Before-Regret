// National permit-records schema (owner-approved 2026-11-17). Internal data for the future
// /tools/permit-records-finder/ page. Nothing here is rendered on the site yet.
//
// THE RULE THIS FILE EXISTS TO ENFORCE: every claim carries its own verification status, source,
// evidence and check date AT THE FIELD LEVEL. A county is never "verified" as a whole; its portal
// URL can be verified while its inspection history is not tested.
//
//   "not_tested"     never means "unavailable".
//   "not_researched" never means "no records".
// Both carry value: null so a renderer has nothing to show except the status itself.
//
// Data lives in data/permit-records/<state>/<countyFips>-<name>.json (one file per county area,
// holding every permitting jurisdiction inside it). scripts/validate-permit-records.ts checks every
// file against the rules below and resolves each evidence reference to a real ledger fact, test or
// script line. Pure module: no imports, so it is safe to load from server and client code.

export const FIELD_STATUSES = ['verified', 'partially_verified', 'not_tested', 'outdated', 'not_researched'] as const;
export type FieldStatus = (typeof FIELD_STATUSES)[number];

/** Owner's labels and definitions, word for word (2026-11-17). */
export const STATUS_LABEL: Record<FieldStatus, string> = {
  verified: 'Verified',
  partially_verified: 'Partially verified',
  not_tested: 'Not tested',
  outdated: 'Outdated',
  not_researched: 'Not researched',
};
export const STATUS_MEANING: Record<FieldStatus, string> = {
  verified: 'Confirmed using an official source or actual test.',
  partially_verified: 'Some information confirmed, but limitations remain.',
  not_tested: 'The portal capability has not been independently tested.',
  outdated: 'Previously verified, but requires another check.',
  not_researched: 'No reliable information collected yet.',
};

/**
 * A verified or partially verified field becomes "outdated" this many days after its check date.
 * 180 is our choice, not the owner's: permit portals do change (Sarasota switched systems on
 * 2023-08-18; Belleair Bluffs moved to SAFEbuilt on 2025-08-15), and Permit Pulse is re-run monthly.
 */
export const REVERIFY_AFTER_DAYS = 180;

/**
 * Evidence reference formats, each resolved by the validator:
 *   ledger:<slug>#<factId>          a quoted fact in data/fact-ledgers/<slug>.json
 *   ledger:<slug>#portalWalk        the dated portal walk in that ledger
 *   test:<testId>                   a test recorded in the same county file's `tests`
 *   script:<path>:<line>            a dated verification note in one of our scripts
 *   quote:<text>                    a short quote read at sourceUrl on checkedOn
 */
export type EvidenceRef = string;

interface Checked<T> {
  value: T;
  sourceUrl: string;
  evidence: EvidenceRef[];
  /** YYYY-MM-DD: the day the source was read or the test was run (not the day this file was written). */
  checkedOn: string;
  note?: string;
}

export type Field<T> =
  | ({ status: 'verified' } & Checked<T>)
  | ({ status: 'partially_verified'; /** what remains unconfirmed */ limits: string } & Checked<T>)
  | ({ status: 'outdated'; /** why it needs another check */ reason: string } & Checked<T>)
  | { status: 'not_tested'; value: null; /** e.g. "portal returns 403 from our region" */ reason: string; checkedOn?: string }
  | {
      status: 'not_researched';
      value: null;
      /** A claim one of our published guides makes without recorded evidence. Re-verification queue only; never shown. */
      unverifiedClaim?: string;
      claimSource?: string;
      note?: string;
    };

/** Capability fields: the only fields that may be "not_tested". */
export const CAPABILITY_FIELDS = ['addressSearchTested', 'inspectionHistoryVisible', 'searchBy'] as const;

export type JurisdictionKind =
  | 'county-unincorporated'
  | 'consolidated-city-county'
  | 'city'
  | 'town'
  | 'township'
  | 'borough'
  | 'city-served-by-county'
  | 'municipality-contracted';

export interface HistoricalSystem {
  name: string;
  url?: string;
  /** e.g. "1989-2011" or "before 1989" */
  covers: string;
}

export interface SearchBy {
  address: boolean | null;
  parcel: boolean | null;
  permitNumber: boolean | null;
  owner?: boolean | null;
  /** e.g. "results default to the last two years" */
  quirks?: string[];
}

export interface Jurisdiction {
  /** <state>-<county>-<place>, lowercase, e.g. "fl-collier-uninc", "fl-collier-naples" */
  id: string;
  name: string;
  kind: JurisdictionKind;

  /**
   * Which department's records hold this area's permits: this jurisdiction's own id, or another
   * one's (a city served by its county). When it points ELSEWHERE, every other field below must be
   * omitted: the finder follows the pointer, so the portal facts live in one place only. When it is
   * itself "not_researched", only fields we actually know need be present; an absent field reads as
   * "not researched". When it points at ITSELF, every field is required.
   */
  permitsIssuedBy: Field<string>;
  buildingDepartment?: Field<string>;
  currentPortal?: Field<{ name: string; platform?: string }>;
  portalUrl?: Field<string>;
  searchBy?: Field<SearchBy>;
  /** Our own anonymous address search on a public property. "not_tested" until we run one. */
  addressSearchTested?: Field<string>;
  /** Year the current online system's records begin. */
  onlineRecordsFrom?: Field<string>;
  historicalSystems?: Field<HistoricalSystem[]>;
  /** How to get records older than, or missing from, the online systems. */
  olderRecordsRequest?: Field<string>;
  inspectionHistoryVisible?: Field<string>;
  /** Local reasons a missing online result does not mean no permit (caps, date windows, splits). */
  localCaveats?: Field<string[]>;
}

/** True when this jurisdiction's permits are held by a different jurisdiction's department. */
export function isServedElsewhere(j: Jurisdiction): boolean {
  return j.permitsIssuedBy.value !== null && j.permitsIssuedBy.value !== j.id;
}

export interface VerificationTest {
  id: string;
  date: string;
  system: string;
  /** Public property only; never a private person's home. */
  subject: string;
  steps: string;
  result: string;
  screenshots?: string[];
  limits: string;
}

export interface CountyArea {
  schemaVersion: 1;
  state: string; // USPS code, e.g. "FL"
  countyFips: string; // 5-digit, from our own Census-derived data files
  county: string;
  /** Our researched guide for this county, if any. */
  guideSlug?: string;
  /** Who issues permits across the county: the county, and the documented exceptions. */
  jurisdictionCoverage: Field<string>;
  jurisdictions: Jurisdiction[];
  tests: VerificationTest[];
  /** Sites we could not reach and did not work around. */
  blocked: Array<{ url: string; result: string; date: string }>;
}

export const JURISDICTION_FIELDS = [
  'permitsIssuedBy',
  'buildingDepartment',
  'currentPortal',
  'portalUrl',
  'searchBy',
  'addressSearchTested',
  'onlineRecordsFrom',
  'historicalSystems',
  'olderRecordsRequest',
  'inspectionHistoryVisible',
  'localCaveats',
] as const satisfies ReadonlyArray<keyof Jurisdiction>;

const DAY = 86_400_000;

/** The status a reader should see today: a stale verified field is shown as outdated. */
export function effectiveStatus(field: Field<unknown>, today: Date = new Date()): FieldStatus {
  if ((field.status === 'verified' || field.status === 'partially_verified') && field.checkedOn) {
    const age = (today.getTime() - Date.parse(field.checkedOn + 'T00:00:00Z')) / DAY;
    if (age > REVERIFY_AFTER_DAYS) return 'outdated';
  }
  return field.status;
}

/** Structural rules (the validator adds evidence resolution on top). Returns problems, empty if fine. */
export function checkField(path: string, name: string, f: Field<unknown> | undefined, today: Date = new Date()): string[] {
  const p: string[] = [];
  if (!f) return [`${path}.${name}: missing (use status "not_researched", never omit a field)`];
  if (!FIELD_STATUSES.includes(f.status)) return [`${path}.${name}: unknown status "${(f as { status: string }).status}"`];
  if (f.status === 'not_tested' || f.status === 'not_researched') {
    if (f.value !== null) p.push(`${path}.${name}: ${f.status} must have value null`);
    if (f.status === 'not_tested') {
      if (!(CAPABILITY_FIELDS as readonly string[]).includes(name)) p.push(`${path}.${name}: "not_tested" is only for capability fields (${CAPABILITY_FIELDS.join(', ')})`);
      if (!f.reason?.trim()) p.push(`${path}.${name}: not_tested needs a reason`);
    }
    return p;
  }
  if (f.value === null || f.value === undefined || (typeof f.value === 'string' && !f.value.trim())) p.push(`${path}.${name}: ${f.status} needs a value`);
  if (!/^https?:\/\//.test(f.sourceUrl ?? '')) p.push(`${path}.${name}: ${f.status} needs a sourceUrl`);
  if (!Array.isArray(f.evidence) || f.evidence.length === 0) p.push(`${path}.${name}: ${f.status} needs at least one evidence reference`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.checkedOn ?? '')) p.push(`${path}.${name}: ${f.status} needs checkedOn YYYY-MM-DD`);
  else if (Date.parse(f.checkedOn + 'T00:00:00Z') > today.getTime()) p.push(`${path}.${name}: checkedOn is in the future`);
  if (f.status === 'partially_verified' && !f.limits?.trim()) p.push(`${path}.${name}: partially_verified must say its limits`);
  if (f.status === 'outdated' && !f.reason?.trim()) p.push(`${path}.${name}: outdated must say why`);
  return p;
}
