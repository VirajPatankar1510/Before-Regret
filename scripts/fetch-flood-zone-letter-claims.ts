// Pulls every OpenFEMA NfipClaims v3 record (zone letter, year of loss, occupancy, amounts paid) and
// aggregates them by the flood zone each claim was RATED in, for the guide on what FEMA flood zone
// letters mean (data/fact-ledgers/fema-flood-zone-letters-meaning.json).
//
//   npx tsx scripts/fetch-flood-zone-letter-claims.ts   # -> docs/data/flood-zone-letter-claims.json
//
// Only aggregates are written (no claim-level rows), so the output is small and committed.
// Public API, no key. curl rather than fetch() for the same reason as the other fetch scripts.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const OUT = path.join(process.cwd(), 'docs', 'data', 'flood-zone-letter-claims.json');
const API = 'https://www.fema.gov/api/open/v3/NfipClaims';
const PAGE = 10_000;
const SELECT = 'id,ratedFloodZone,amountPaidOnBuildingClaim,amountPaidOnContentsClaim,yearOfLoss,occupancyType';

const get = (url: string) => {
  for (let attempt = 1; ; attempt++) {
    try {
      const body = execFileSync('curl', ['-s', '-L', '--fail', '--max-time', '300', url], { maxBuffer: 512 * 1024 * 1024 }).toString();
      if (!body.trim().startsWith('{')) throw new Error(`not JSON: ${body.slice(0, 120)}`);
      return JSON.parse(body);
    } catch (e) {
      if (attempt >= 4) throw new Error(`ABORT after ${attempt} tries: ${url}: ${(e as Error).message}`);
      execFileSync('perl', ['-e', `sleep ${attempt * 10}`]);
    }
  }
};

// Zone codes as FEMA writes them (field definition, NfipClaims v3 ratedFloodZone) -> the group the
// guide uses. Numbered A1-A30 / V1-V30 are the pre-1986 names for AE / VE; FEMA's own definition says so.
const group = (z: string | null): string => {
  if (!z) return 'not recorded';
  const s = z.trim().toUpperCase();
  // Seen 2026-11-25: the numbered zones also arrive zero-padded (A01-A09, V01-V09), about 400,000 claims.
  if (/^A(0?[1-9]|[12][0-9]|30)$/.test(s)) return 'A1-A30';
  if (/^V(0?[1-9]|[12][0-9]|30)$/.test(s)) return 'V1-V30';
  if (['A', 'AE', 'AH', 'AHB', 'AO', 'AOB', 'A99', 'V', 'VE', 'B', 'C', 'X', 'D'].includes(s)) return s === 'AHB' ? 'AH' : s === 'AOB' ? 'AO' : s;
  if (/^AR/.test(s)) return 'AR';
  return 'other code';
};

type Agg = { claims: number; paidClaims: number; building: number; contents: number; sfr: number; sfrPaid: number; sfrBuilding: number; since2000: number; since2000Paid: number; since2000Building: number };
const blank = (): Agg => ({ claims: 0, paidClaims: 0, building: 0, contents: 0, sfr: 0, sfrPaid: 0, sfrBuilding: 0, since2000: 0, since2000Paid: 0, since2000Building: 0 });
// Aggregated per RAW code, then grouped at the end, so a grouping fix never needs a re-pull.
const byCode: Record<string, Agg> = {};
const rawCodes: Record<string, number> = {};

// The $inlinecount total has come back a few hundred below the rows actually served (2026-11-25: 2,730,808 vs
// 2,731,064), so the loop pages until a short page, de-duplicates by claim id, and checks the unique count
// against FEMA's published recordCount for the dataset.
const meta = get(`https://www.fema.gov/api/open/v1/DataSets?$filter=name%20eq%20'NfipClaims'%20and%20version%20eq%203&$select=lastRefresh,recordCount`).DataSets[0];
const count = meta.recordCount as number;
const ids = new Set<number>();
let seen = 0, dupes = 0;
for (let skip = 0; ; skip += PAGE) {
  const rows = get(`${API}?$select=${SELECT}&$orderby=id&$top=${PAGE}&$skip=${skip}`).NfipClaims as Array<Record<string, number | string | null>>;
  for (const r of rows) {
    if (ids.has(Number(r.id))) { dupes++; continue; }
    ids.add(Number(r.id));
    const code = (r.ratedFloodZone as string | null) ?? '';
    rawCodes[code || '(null)'] = (rawCodes[code || '(null)'] ?? 0) + 1;
    const a = (byCode[code.trim().toUpperCase() || '(null)'] ??= blank());
    const b = Math.max(0, Number(r.amountPaidOnBuildingClaim) || 0), c = Math.max(0, Number(r.amountPaidOnContentsClaim) || 0);
    const paid = b + c > 0;
    const sfr = Number(r.occupancyType) === 1 || Number(r.occupancyType) === 11;
    const recent = Number(r.yearOfLoss) >= 2000;
    a.claims++; a.building += b; a.contents += c; if (paid) a.paidClaims++;
    if (sfr) { a.sfr++; if (b > 0) { a.sfrPaid++; a.sfrBuilding += b; } }
    if (recent) { a.since2000++; if (b > 0) { a.since2000Paid++; a.since2000Building += b; } }
  }
  seen += rows.length;
  process.stdout.write(`\rNfipClaims: ${seen}/${count}`);
  if (rows.length < PAGE) break;
}
process.stdout.write('\n');
console.log(`rows served ${seen}, unique ids ${ids.size}, duplicates skipped ${dupes}, FEMA recordCount ${count}`);
if (ids.size !== count) throw new Error(`ABORT: ${ids.size} unique claims, FEMA lists ${count}`);
const byZone: Record<string, Agg> = {};
for (const [code, c] of Object.entries(byCode)) {
  const a = (byZone[group(code === '(null)' ? null : code)] ??= blank());
  for (const k of Object.keys(c) as Array<keyof Agg>) a[k] += c[k];
}
for (const a of [...Object.values(byZone), ...Object.values(byCode)]) { a.building = Math.round(a.building); a.contents = Math.round(a.contents); a.sfrBuilding = Math.round(a.sfrBuilding); a.since2000Building = Math.round(a.since2000Building); }
fs.writeFileSync(OUT, JSON.stringify({
  fetchedAt: new Date().toISOString(),
  datasetLastRefresh: meta.lastRefresh,
  source: `${API} (field ratedFloodZone: the zone used to rate the insured property)`,
  notes: 'Amounts are building + contents paid, nominal dollars; negative amounts (re-issued checks) counted as 0. sfr = occupancyType 1 or 11 (single family). paid = amount > 0. since2000 = yearOfLoss >= 2000.',
  totalClaims: ids.size,
  duplicateRowsSkipped: dupes,
  byZone,
  byCode,
  rawCodes,
}, null, 2));
console.log(`Wrote ${OUT}`);
console.log(Object.entries(byZone).sort((a, b) => b[1].claims - a[1].claims).map(([z, a]) => `${z}: ${a.claims} claims, ${a.sfrPaid} sfr paid, avg sfr bldg $${Math.round(a.sfrBuilding / Math.max(1, a.sfrPaid))}`).join('\n'));
