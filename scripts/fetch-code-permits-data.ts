// Pulls the two public inputs for the building-codes study (/research/built-to-code/):
//
//   1. FEMA Building Code Adoption Tracking (BCAT), the jurisdiction layer behind FEMA's own BCAT
//      portal (FEMA_BCAT_Government_Jurisdictions, FeatureServer/0). One row per local government
//      FEMA tracks: the residential code it has adopted, FEMA's combined hazard rating, and its
//      weakening notes. Attributes only, no geometry.
//   2. Census Bureau Building Permits Survey, ANNUAL PLACE files for 2025 (four regional files).
//      One row per permit-issuing office: a city, town, township, or a county's unincorporated area.
//
//   npx tsx scripts/fetch-code-permits-data.ts   # -> docs/data/built-to-code-raw.json
//   npx tsx scripts/build-built-to-code-study.ts  # joins, checks, writes the page and data files
//
// Why the place files and not the county files: a county is not one building code. Inside one county
// a city can be on the 2024 IRC while the unincorporated land around it has no residential code at
// all. The permit office that issued the permit is the government whose code applied, and BPS
// reports permits by permit office, so the join is office to jurisdiction, not county to county.
//
// curl rather than fetch(): Node's fetch hangs on census.gov hosts in this environment (see
// fetch-oldest-housing-data.ts). Both sources are public with no account or key.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const OUT = path.join(process.cwd(), 'docs', 'data', 'built-to-code-raw.json');
const BCAT = 'https://services.arcgis.com/DN2fPfpggEPlLhP6/arcgis/rest/services/FEMA_BCAT_Government_Jurisdictions/FeatureServer/0';
const BPS_YEAR = 2025;
const BPS_REGIONS: Array<[string, string]> = [
  ['Northeast%20Region', 'ne'], ['Midwest%20Region', 'mw'], ['South%20Region', 'so'], ['West%20Region', 'we'],
];
const BPS_COUNTY = `https://www2.census.gov/econ/bps/County/co${BPS_YEAR}a.txt`;

const curl = (url: string) =>
  execFileSync('curl', ['-s', '-L', '--fail', '--max-time', '180', url], { maxBuffer: 256 * 1024 * 1024 }).toString();
const getJson = (url: string) => {
  const body = curl(url);
  if (!body.trim().startsWith('{')) throw new Error(`ABORT: not JSON from ${url}: ${body.slice(0, 200)}`);
  const j = JSON.parse(body);
  if (j.error) throw new Error(`ABORT: ArcGIS error from ${url}: ${JSON.stringify(j.error)}`);
  return j;
};

// Minimal CSV line split that respects double quotes (BPS names are unquoted today, but cheap insurance).
function splitCsv(line: string): string[] {
  const out: string[] = []; let cur = ''; let q = false;
  for (const ch of line) {
    if (ch === '"') { q = !q; continue; }
    if (ch === ',' && !q) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

// ---- 1. FEMA BCAT ---------------------------------------------------------------------------
const meta = getJson(`${BCAT}?f=json`);
const dataLastEdit = new Date(meta.editingInfo?.dataLastEditDate ?? 0).toISOString();
const FIELDS = [
  'OBJECTID', 'Place', 'County', 'State_abbr', 'Res_Code', 'Building_Code', 'Combined_Hazard_Code',
  'Flood_Code', 'Wind_Code', 'Hurricane_Code', 'Tornado_Code', 'Seismic_Code',
  'Local_Code_Weakening_Note', 'Adoption_Notes', 'Pop_2020', 'Data_Currency',
];
const count = getJson(`${BCAT}/query?where=1%3D1&returnCountOnly=true&f=json`).count as number;
const page = Math.min(2000, meta.maxRecordCount ?? 2000);
const jurisdictions: Record<string, unknown>[] = [];
for (let offset = 0; offset < count; offset += page) {
  const j = getJson(`${BCAT}/query?where=1%3D1&outFields=${FIELDS.join(',')}&returnGeometry=false&orderByFields=OBJECTID&resultOffset=${offset}&resultRecordCount=${page}&f=json`);
  for (const f of j.features) jurisdictions.push(f.attributes);
}
if (jurisdictions.length !== count) throw new Error(`ABORT: BCAT returned ${jurisdictions.length} rows, layer says ${count}`);
const currency = [...new Set(jurisdictions.map((r) => r.Data_Currency))];
console.log(`BCAT: ${jurisdictions.length} jurisdictions, data currency ${currency.map((c) => new Date(Number(c)).toISOString().slice(0, 10)).join(', ')}, layer edited ${dataLastEdit}`);

// ---- 2. Census BPS place files (2025 annual) --------------------------------------------------
type Office = {
  state: string; id6: string; county: string; placeFips: string; mcdFips: string; pop: number;
  monthsReported: number; name: string;
  units: { u1: number; u2: number; u34: number; u5: number }; reported: { u1: number; u2: number; u34: number; u5: number };
};
const offices: Office[] = [];
for (const [dir, code] of BPS_REGIONS) {
  const url = `https://www2.census.gov/econ/bps/Place/${dir}/${code}${BPS_YEAR}a.txt`;
  const rows = curl(url).split(/\r?\n/).slice(2).filter((l) => /^\d{4},/.test(l));
  for (const l of rows) {
    const c = splitCsv(l);
    if (c.length < 41) throw new Error(`ABORT: short BPS row in ${url}: ${l}`);
    const n = (i: number) => Number(c[i] || 0);
    offices.push({
      state: c[1], id6: c[2], county: c[3], placeFips: c[5], mcdFips: c[6], pop: n(7),
      monthsReported: n(15), name: c[16],
      units: { u1: n(18), u2: n(21), u34: n(24), u5: n(27) },
      reported: { u1: n(30), u2: n(33), u34: n(36), u5: n(39) },
    });
  }
  console.log(`BPS ${code}${BPS_YEAR}a.txt: ${rows.length} permit offices`);
}

// County names and county totals (the control the place files must add up to).
const counties: Array<{ state: string; county: string; name: string; units: number }> = [];
for (const l of curl(BPS_COUNTY).split(/\r?\n/).slice(2).filter((x) => /^\d{4},/.test(x))) {
  const c = splitCsv(l);
  counties.push({ state: c[1], county: c[2], name: c[5], units: Number(c[7]) + Number(c[10]) + Number(c[13]) + Number(c[16]) });
}
console.log(`BPS county file: ${counties.length} counties`);

fs.writeFileSync(OUT, JSON.stringify({
  fetchedAt: new Date().toISOString(),
  sources: {
    bcat: { url: BCAT, dataLastEdit, dataCurrency: currency.map((c) => new Date(Number(c)).toISOString().slice(0, 10)) },
    bpsPlace: BPS_REGIONS.map(([d, c]) => `https://www2.census.gov/econ/bps/Place/${d}/${c}${BPS_YEAR}a.txt`),
    bpsCounty: BPS_COUNTY,
  },
  bpsYear: BPS_YEAR,
  jurisdictions, offices, counties,
}));
console.log(`Wrote ${OUT} (${Math.round(fs.statSync(OUT).size / 1024)} KB)`);
