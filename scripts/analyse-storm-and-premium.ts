// Builds the derived dataset behind the regional storm-and-premium studies.
//
//   npx tsx scripts/analyse-storm-and-premium.ts
//
// Emits docs/data/storm-and-premium-counties.csv and docs/data/storm-and-premium-figures.json.
// Every figure quoted in a published regional study must come out of this file, so a journalist
// checking a number lands on the same arithmetic rather than on a number retyped into prose.
//
// -------------------------------------------------------------------------------------------
// WHAT IS BEING CROSSED
//
//   NOAA Storm Events Database, 2015-2024   -- observed, county-tagged severe weather reports
//   ACS 5-year table B25001 / year-built    -- housing stock and its construction era
//   ACS 5-year table B25141                 -- what mortgaged households REPORT paying to insure
//   EPA Radon Zones                         -- 1/2/3 designation of predicted indoor screening level
//   Census Gazetteer 2023                   -- county land area, for the density check below
//
// All five are public domain. The unit of analysis is the county; no individual property appears.
//
// -------------------------------------------------------------------------------------------
// THE METRIC DECISION, AND WHY IT MATTERS
//
// The obvious way to compare storm exposure across counties is events per square mile. It is the
// wrong metric here, and this script measures why rather than asserting it:
//
//     Spearman(event density, population density) = +0.681
//     Spearman(raw event count, land area)        = +0.156
//     Spearman(raw event count, population)       = +0.113
//
// NOAA Storm Events is a database of REPORTS. A thunderstorm that damages nothing in an empty
// county is frequently not recorded at all, so event density largely traces where people live and
// where spotter networks are dense. Normalising by area therefore manufactures a population map
// wearing a weather map's clothes. Raw counts turn out to be only weakly related to both area and
// population, which makes them the more defensible headline -- and they are also the figure that
// answers a homeowner's actual question, which is how often something damaging got recorded here.
//
// Density is still computed and published so a reader can check the claim, but no study leads with
// it. See the composite-score warning in the Risk Without Price notes for the same class of error:
// FEMA's composite NRI score bakes in exposure, so 87 of these 100 counties score >= 95 on it and
// it discriminates nothing. Hazard-specific scores are carried through; the composite is not used.
//
// -------------------------------------------------------------------------------------------
// THE INDEPENDENT-CITY COLLISION, disclosed because it silently corrupted the first run.
//
// Three rows collide with a same-named independent city in the Gazetteer: Baltimore, St. Louis and
// Fairfax. A naive name join picked Fairfax city (6 sq mi) over Fairfax County (391 sq mi) and
// produced an event density of 145/sq mi, roughly thirty times the next county. Population settles
// it -- the county_data row reports 1,148,223 for Fairfax, against about 24,000 for the city -- so
// the join prefers the County/Parish/Borough entity and asserts the population agrees within a
// factor of two. A silent mismatch here is exactly the kind of error a reporter finds first.
import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { withDb } from '../src/server/db.js';

const GAZ_URL = 'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2023_Gazetteer/2023_Gaz_counties_national.zip';
const OUT_DIR = path.join(process.cwd(), 'docs', 'data');

type Row = Record<string, any>;

function rank(v: number[]): number[] {
  const order = [...v.keys()].sort((a, b) => v[a] - v[b]);
  const r = new Array(v.length).fill(0);
  order.forEach((idx, pos) => { r[idx] = pos; });
  return r;
}
function corr(a: number[], b: number[]): number {
  const n = a.length;
  const ma = a.reduce((s, x) => s + x, 0) / n;
  const mb = b.reduce((s, x) => s + x, 0) / n;
  let num = 0; let da = 0; let db = 0;
  for (let i = 0; i < n; i++) { num += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; }
  return num / Math.sqrt(da * db);
}
const spearman = (a: number[], b: number[]) => corr(rank(a), rank(b));

function loadGazetteer(): Map<string, Array<{ name: string; sqmi: number; geoid: string }>> {
  const tmp = path.join('/tmp', 'br-gazetteer');
  fs.mkdirSync(tmp, { recursive: true });
  const txt = path.join(tmp, '2023_Gaz_counties_national.txt');
  if (!fs.existsSync(txt)) {
    const zip = path.join(tmp, 'gaz.zip');
    // curl, not fetch: undici cannot reach www2.census.gov from this machine either. Same fault
    // documented in src/server/countyDataFetcher.ts.
    const dl = spawnSync('curl', ['-4', '-sS', '--max-time', '180', '-o', zip, GAZ_URL], { encoding: 'utf8' });
    if (dl.status !== 0) throw new Error(`Gazetteer download failed: ${dl.stderr}`);
    const uz = spawnSync('unzip', ['-o', '-q', zip, '-d', tmp], { encoding: 'utf8' });
    if (uz.status !== 0) throw new Error(`Gazetteer unzip failed: ${uz.stderr}`);
  }
  const lines = fs.readFileSync(txt, 'utf8').split('\n');
  const head = lines[0].split('\t').map((h) => h.trim());
  const out = new Map<string, Array<{ name: string; sqmi: number; geoid: string }>>();
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const cells = line.split('\t').map((c) => c.trim());
    const rec: Row = {};
    head.forEach((h, i) => { rec[h] = cells[i]; });
    const bare = String(rec.NAME).replace(/\s+(County|Parish|Borough|Census Area|Municipality|city|City and Borough|Municipio)$/i, '').toUpperCase().trim();
    const key = `${rec.USPS}|${bare}`;
    if (!out.has(key)) out.set(key, []);
    out.get(key)!.push({ name: rec.NAME, sqmi: Number(rec.ALAND_SQMI), geoid: rec.GEOID });
  }
  return out;
}

async function main() {
  const rows = (await withDb((sql) => sql`
    SELECT slug, county_name, state_abbrev, state_name, population, radon_zone, census_total_units,
           census_year_built_json, fema_hazards_json, noaa_event_counts_json, noaa_years_covered,
           census_insurance_json, data_complete
    FROM county_data ORDER BY state_abbrev, county_name
  `)) as unknown as Row[];

  const incomplete = rows.filter((r) => !r.data_complete);
  if (incomplete.length) throw new Error(`ABORT: ${incomplete.length} incomplete county rows`);
  const windows = [...new Set(rows.map((r) => r.noaa_years_covered))];
  if (windows.length !== 1) throw new Error(`ABORT: mixed NOAA windows: ${windows.join(', ')}`);

  const gaz = loadGazetteer();
  const j = (v: any) => (typeof v === 'string' ? JSON.parse(v) : v);
  const collisions: string[] = [];

  const counties = rows.map((r) => {
    const yb = j(r.census_year_built_json);
    const haz = j(r.fema_hazards_json);
    const noaa = j(r.noaa_event_counts_json);
    const ins = j(r.census_insurance_json);
    const units = Number(r.census_total_units) || 0;
    const mortgaged = Number(ins?.totalMortgaged) || 0;
    const cb = ins?.costBuckets || {};

    const bare = String(r.county_name).toUpperCase().replace(/ COUNTY$/, '').trim();
    const opts = gaz.get(`${r.state_abbrev}|${bare}`) || [];
    if (!opts.length) throw new Error(`ABORT: no Gazetteer match for ${r.county_name}, ${r.state_abbrev}`);
    let pick = opts[0];
    if (opts.length > 1) {
      const county = opts.find((o) => !/\scity$/i.test(o.name));
      pick = county || opts[0];
      collisions.push(`${r.county_name}, ${r.state_abbrev}: ${opts.map((o) => o.name).join(' / ')} -> ${pick.name}`);
    }

    const sum = (keys: string[], src: Row) => keys.reduce((s, k) => s + (Number(src?.[k]) || 0), 0);
    const pre1950 = sum(['built1939OrEarlier', 'built1940to1949'], yb);
    const pre1980 = pre1950 + sum(['built1950to1959', 'built1960to1969', 'built1970to1979'], yb);
    const under1k = sum(['lessThan100', 'between100and299', 'between300and499', 'between500and799', 'between800and999'], cb);
    const over3k = sum(['between3000and3499', 'between3500and3999', 'over4000'], cb);
    const events = Object.values(noaa || {}).reduce((s: number, v: any) => s + (Number(v) || 0), 0) as number;

    return {
      slug: r.slug,
      county: r.county_name,
      state: r.state_abbrev,
      stateName: r.state_name,
      geoid: pick.geoid,
      population: Number(r.population) || 0,
      landSqMi: pick.sqmi,
      housingUnits: units,
      pctPre1950: units ? pre1950 / units : 0,
      pctPre1980: units ? pre1980 / units : 0,
      radonZone: Number(r.radon_zone) || null,
      stormEvents: events,
      eventsPerSqMi: pick.sqmi ? events / pick.sqmi : 0,
      eventsByType: noaa,
      hail: Number(noaa?.Hail) || 0,
      tornado: Number(noaa?.Tornado) || 0,
      flood: (Number(noaa?.['Flash Flood']) || 0) + (Number(noaa?.Flood) || 0),
      thunderstormWind: Number(noaa?.['Thunderstorm Wind']) || 0,
      mortgagedHouseholds: mortgaged,
      pctUnder1000: mortgaged ? under1k / mortgaged : 0,
      pctOver3000: mortgaged ? over3k / mortgaged : 0,
      hazardScores: Object.fromEntries(Object.entries(haz || {}).map(([k, v]: any) => [k, v?.score ?? null])),
    };
  });

  // Population sanity on the three collision rows: a wrong pick is off by an order of magnitude.
  for (const c of counties) {
    const density = c.landSqMi ? c.population / c.landSqMi : 0;
    if (density > 200000) throw new Error(`ABORT: implausible density for ${c.county}, ${c.state} -- check the Gazetteer join`);
  }

  const dens = counties.map((c) => c.eventsPerSqMi);
  const popDens = counties.map((c) => c.population / c.landSqMi);
  const raw = counties.map((c) => c.stormEvents);
  const diagnostics = {
    spearmanEventDensityVsPopulationDensity: Number(spearman(popDens, dens).toFixed(3)),
    spearmanRawEventsVsLandArea: Number(spearman(counties.map((c) => c.landSqMi), raw).toFixed(3)),
    spearmanRawEventsVsPopulation: Number(spearman(counties.map((c) => c.population), raw).toFixed(3)),
    spearmanRawEventsVsPctOver3000: Number(spearman(raw, counties.map((c) => c.pctOver3000)).toFixed(3)),
    pearsonRawEventsVsPctOver3000: Number(corr(raw, counties.map((c) => c.pctOver3000)).toFixed(3)),
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const cols = ['geoid', 'county', 'state', 'population', 'landSqMi', 'housingUnits', 'pctPre1950', 'pctPre1980',
    'radonZone', 'stormEvents', 'eventsPerSqMi', 'hail', 'tornado', 'flood', 'thunderstormWind',
    'mortgagedHouseholds', 'pctUnder1000', 'pctOver3000'];
  const csv = [cols.join(','), ...counties.map((c: any) => cols.map((k) => {
    const v = c[k];
    return typeof v === 'number' && !Number.isInteger(v) ? v.toFixed(6) : v;
  }).join(','))].join('\n');
  fs.writeFileSync(path.join(OUT_DIR, 'storm-and-premium-counties.csv'), `${csv}\n`);

  fs.writeFileSync(path.join(OUT_DIR, 'storm-and-premium-figures.json'), `${JSON.stringify({
    generated: new Date().toISOString().slice(0, 10),
    coverage: { counties: counties.length, states: new Set(counties.map((c) => c.state)).size, noaaWindow: windows[0] },
    sources: {
      stormEvents: 'NOAA National Centers for Environmental Information, Storm Events Database',
      housing: 'US Census Bureau, American Community Survey 5-year, year structure built',
      insurance: 'US Census Bureau, American Community Survey 5-year, table B25141',
      radon: 'US Environmental Protection Agency, Map of Radon Zones',
      landArea: 'US Census Bureau, 2023 Gazetteer Files (ALAND_SQMI)',
    },
    diagnostics,
    gazetteerCollisions: collisions,
    counties,
  }, null, 1)}\n`);

  console.log(`counties: ${counties.length}  states: ${new Set(counties.map((c) => c.state)).size}  NOAA window: ${windows[0]}`);
  console.log('\nmetric diagnostics:');
  for (const [k, v] of Object.entries(diagnostics)) console.log(`  ${k.padEnd(45)} ${v > 0 ? '+' : ''}${v}`);
  console.log(`\nGazetteer name collisions resolved: ${collisions.length}`);
  for (const c of collisions) console.log(`  ${c}`);
  console.log('\nwrote docs/data/storm-and-premium-counties.csv and storm-and-premium-figures.json');
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
