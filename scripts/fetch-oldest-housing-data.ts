// Fetches the data behind /research/oldest-housing/ -- housing units by year structure built, every
// US county, from the Census Bureau's American Community Survey 5-year estimates (table B25034).
//
//   npx tsx scripts/fetch-oldest-housing-data.ts
//   -> docs/data/oldest-housing-raw.json
//
// Reproducible by anyone: one public API call with a free Census key. Nothing here is estimated by
// us -- every count and margin of error is the Bureau's own.
//
// The variable LABELS are read from the Census metadata for the vintage used, never assumed. If the
// Bureau ever renumbers B25034 (it reordered the decade bins when 2020-or-later was added), a hard-
// coded "B25034_011E = 1939 or earlier" would silently publish the wrong decade. So the script maps
// each variable to its label and aborts if the decades it needs are not all present.
//
// curl rather than fetch(): Node's fetch hangs on api.census.gov in this environment (see the note in
// src/server/countyDataFetcher.ts).
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const KEY = (process.env.CENSUS_API_KEY || '').replace(/^["']|["']$/g, '');
if (!KEY) throw new Error('ABORT: CENSUS_API_KEY is not set');
const OUT = path.join(process.cwd(), 'docs', 'data', 'oldest-housing-raw.json');

const get = (url: string) => {
  const body = execFileSync('curl', ['-s', '-L', '--max-time', '120', url], { maxBuffer: 64 * 1024 * 1024 }).toString();
  if (!body.trim().startsWith('[') && !body.trim().startsWith('{')) throw new Error(`ABORT: Census API did not return JSON: ${body.slice(0, 200)}`);
  return JSON.parse(body);
};

// Newest 5-year vintage the API serves.
let vintage = 0;
for (const y of [2025, 2024, 2023]) {
  try {
    const g = get(`https://api.census.gov/data/${y}/acs/acs5/groups/B25034.json`);
    if (g?.variables) { vintage = y; break; }
  } catch { /* not published yet */ }
}
if (!vintage) throw new Error('ABORT: no ACS 5-year vintage with B25034 found');

const meta = get(`https://api.census.gov/data/${vintage}/acs/acs5/groups/B25034.json`).variables as Record<string, { label: string }>;
const want: Record<string, string> = {
  total: 'Estimate!!Total:',
  built2020OrLater: 'Estimate!!Total:!!Built 2020 or later',
  built2010to2019: 'Estimate!!Total:!!Built 2010 to 2019',
  built2000to2009: 'Estimate!!Total:!!Built 2000 to 2009',
  built1990to1999: 'Estimate!!Total:!!Built 1990 to 1999',
  built1980to1989: 'Estimate!!Total:!!Built 1980 to 1989',
  built1970to1979: 'Estimate!!Total:!!Built 1970 to 1979',
  built1960to1969: 'Estimate!!Total:!!Built 1960 to 1969',
  built1950to1959: 'Estimate!!Total:!!Built 1950 to 1959',
  built1940to1949: 'Estimate!!Total:!!Built 1940 to 1949',
  built1939OrEarlier: 'Estimate!!Total:!!Built 1939 or earlier',
};
const varFor: Record<string, string> = {};
for (const [k, label] of Object.entries(want)) {
  const hit = Object.entries(meta).find(([v, m]) => v.endsWith('E') && m.label === label);
  if (!hit) throw new Error(`ABORT: B25034 ${vintage} has no variable labelled "${label}"`);
  varFor[k] = hit[0];
}

const estVars = Object.values(varFor);
const moeVars = estVars.map((v) => v.replace(/E$/, 'M'));
const rows = get(`https://api.census.gov/data/${vintage}/acs/acs5?get=NAME,${[...estVars, ...moeVars].join(',')}&for=county:*&key=${KEY}`) as string[][];
const head = rows[0];
const idx = (v: string) => head.indexOf(v);

const counties = rows.slice(1).map((r) => {
  const est: Record<string, number> = {};
  const moe: Record<string, number> = {};
  for (const [k, v] of Object.entries(varFor)) {
    est[k] = Number(r[idx(v)]);
    moe[k] = Number(r[idx(v.replace(/E$/, 'M'))]);
  }
  return { geoid: r[idx('state')] + r[idx('county')], name: r[idx('NAME')], est, moe };
});

// Sanity: the decade bins must sum to the total in every county (they are an exhaustive split).
let off = 0;
for (const c of counties) {
  const sum = Object.entries(c.est).filter(([k]) => k !== 'total').reduce((a, [, v]) => a + v, 0);
  if (sum !== c.est.total) off++;
}
if (off) throw new Error(`ABORT: decade bins do not sum to the total in ${off} counties`);

// Median year structure built (table B25035), added 2026-10-09 for "how old is the average house".
// Census codes a median that falls in the open "1939 or earlier" bin as 1938 with the annotation
// "1939-"; kept as a flag so the page can print "1939 or earlier" instead of a year Census never gave.
const medMeta = get(`https://api.census.gov/data/${vintage}/acs/acs5/groups/B25035.json`).variables as Record<string, { label: string }>;
if (medMeta.B25035_001E?.label !== 'Estimate!!Median year structure built') throw new Error('ABORT: B25035_001E is not the median year built');
const medianRows = (geo: string) => {
  const r = get(`https://api.census.gov/data/${vintage}/acs/acs5?get=NAME,B25035_001E,B25035_001M,B25035_001EA&${geo}&key=${KEY}`) as Array<Array<string | null>>;
  const h = r[0] as string[];
  return r.slice(1).map((x) => ({
    name: String(x[h.indexOf('NAME')]),
    geoid: h.includes('county') ? `${x[h.indexOf('state')]}${x[h.indexOf('county')]}` : String(x[h.indexOf(h.includes('state') ? 'state' : 'us')]),
    median: Number(x[h.indexOf('B25035_001E')]),
    moe: Number(x[h.indexOf('B25035_001M')]),
    openBottom: x[h.indexOf('B25035_001EA')] === '1939-',
  }));
};
const medCounty = new Map(medianRows('for=county:*').map((m) => [m.geoid, m]));
const medStates = medianRows('for=state:*');
const medUs = medianRows('for=us:1')[0];
for (const c of counties as Array<any>) {
  const m = medCounty.get(c.geoid);
  if (!m) throw new Error(`ABORT: no median year built for ${c.name}`);
  c.median = { year: m.median, moe: m.moe, openBottom: m.openBottom };
}

fs.writeFileSync(OUT, JSON.stringify({
  medianYearBuilt: { us: medUs, states: medStates },
  source: 'U.S. Census Bureau, American Community Survey 5-year estimates, table B25034 (Year Structure Built)',
  vintage: `${vintage - 4}-${vintage}`,
  api: `https://api.census.gov/data/${vintage}/acs/acs5`,
  variables: varFor,
  fetchedAt: new Date().toISOString(),
  counties,
}, null, 0));
console.log(`wrote ${path.relative(process.cwd(), OUT)}: ${counties.length} counties, ACS ${vintage - 4}-${vintage} 5-year, variables ${JSON.stringify(varFor)}`);
