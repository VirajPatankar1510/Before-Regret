// Pulls the inputs for the FEMA housing-aid study (/research/fema-aid-gap/):
//
//   1. OpenFEMA HousingAssistanceOwners v2 -- homeowner registrations, FEMA inspections, FEMA-recorded
//      damage (FEMA Verified Loss, real + personal property) and approved Individuals and Households
//      Program (IHP) dollars, by disaster x state x county x city x ZIP, from DR-1439 (Nov 2002) on.
//   2. OpenFEMA DisasterDeclarationsSummaries v2 -- incident type, title and declaration date for each
//      disaster number (one row per disaster, the first county row is enough for those fields).
//
//   npx tsx scripts/fetch-fema-aid-gap-data.ts     # -> docs/data/fema-aid-gap-raw.json (gitignored)
//   npx tsx scripts/build-fema-aid-gap-study.ts    # -> page, embed, CSVs, figures
//
// Public API, no key. curl rather than fetch() for the same reason as the other fetch scripts.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const OUT = path.join(process.cwd(), 'docs', 'data', 'fema-aid-gap-raw.json');
const API = 'https://www.fema.gov/api/open';
const PAGE = 10_000;

const get = (url: string) => {
  const body = execFileSync('curl', ['-s', '-L', '--fail', '--max-time', '240', url], { maxBuffer: 512 * 1024 * 1024 }).toString();
  if (!body.trim().startsWith('{')) throw new Error(`ABORT: not JSON from ${url}: ${body.slice(0, 200)}`);
  return JSON.parse(body);
};
function pullAll(entity: string, version: string, select: string, filter = ''): Record<string, unknown>[] {
  const base = `${API}/${version}/${entity}?$select=${select}${filter ? `&$filter=${encodeURIComponent(filter)}` : ''}`;
  const count = get(`${base}&$inlinecount=allpages&$top=1`).metadata.count as number;
  const rows: Record<string, unknown>[] = [];
  for (let skip = 0; skip < count; skip += PAGE) {
    const j = get(`${base}&$orderby=id&$top=${PAGE}&$skip=${skip}`);
    rows.push(...j[entity]);
    process.stdout.write(`\r${entity}: ${rows.length}/${count}`);
  }
  process.stdout.write('\n');
  if (rows.length !== count) throw new Error(`ABORT: ${entity} returned ${rows.length}, expected ${count}`);
  return rows;
}

const OWN_FIELDS = ['id', 'disasterNumber', 'state', 'county', 'city', 'zipCode', 'validRegistrations', 'totalInspected', 'totalDamage',
  'noFemaInspectedDamage', 'femaInspectedDamageBetween1And10000', 'femaInspectedDamageBetween10001And20000', 'femaInspectedDamageBetween20001And30000',
  'femaInspectedDamageGreaterThan30000', 'approvedForFemaAssistance', 'totalApprovedIhpAmount', 'repairReplaceAmount', 'rentalAmount',
  'otherNeedsAmount', 'approvedBetween1And10000', 'approvedBetween10001And25000', 'approvedBetween25001AndMax', 'totalMaxGrants'];
const owners = pullAll('HousingAssistanceOwners', 'v2', OWN_FIELDS.join(','));
// Columnar to keep the file small: header + rows of values.
const ownersCols = { fields: OWN_FIELDS.slice(1), rows: owners.map((r) => OWN_FIELDS.slice(1).map((f) => r[f])) };

const nums = [...new Set(owners.map((r) => r.disasterNumber as number))];
const decl = pullAll('DisasterDeclarationsSummaries', 'v2', 'id,disasterNumber,state,declarationType,declarationDate,incidentType,declarationTitle,incidentBeginDate,ihProgramDeclared',
  `disasterNumber ge ${Math.min(...nums)}`);
const disasters: Record<number, { state: string; type: string; date: string; incidentType: string; title: string; begin: string }> = {};
for (const d of decl) {
  const n = d.disasterNumber as number;
  if (!nums.includes(n) || disasters[n]) continue;
  disasters[n] = { state: d.state as string, type: d.declarationType as string, date: String(d.declarationDate).slice(0, 10),
    incidentType: d.incidentType as string, title: d.declarationTitle as string, begin: String(d.incidentBeginDate).slice(0, 10) };
}
const missing = nums.filter((n) => !disasters[n]);
console.log(`owners rows ${owners.length}, disasters ${nums.length}, declarations matched ${nums.length - missing.length}, missing ${missing.length}`);

fs.writeFileSync(OUT, JSON.stringify({
  fetchedAt: new Date().toISOString(),
  sources: {
    owners: `${API}/v2/HousingAssistanceOwners`,
    declarations: `${API}/v2/DisasterDeclarationsSummaries`,
  },
  owners: ownersCols, disasters, missingDisasters: missing,
}));
console.log(`Wrote ${OUT} (${Math.round(fs.statSync(OUT).size / 1024)} KB)`);
