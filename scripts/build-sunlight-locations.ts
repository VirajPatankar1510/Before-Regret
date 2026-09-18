// County coordinates for the /sunlight/ tool, from the Census Gazetteer.
//
//   npx tsx scripts/build-sunlight-locations.ts
//
// -----------------------------------------------------------------------------------------------
// The tool needs a latitude, a longitude and a time zone for wherever the reader's house is. None
// of those were anywhere in this project: county_data carries population, radon zone and hazard
// ratings but no geometry. So they come from the Census Bureau's Gazetteer file, which publishes an
// internal point (INTPTLAT / INTPTLONG) for every US county -- the same standard every other figure
// on this site follows, rather than a hand-typed list of city coordinates.
//
// The county set is the one Permit Pulse already gates as substantial, so the dropdown is not
// 3,143 entries long and every county in it is somewhere people actually buy houses.
//
// -----------------------------------------------------------------------------------------------
// TIME ZONES ARE A BEST GUESS AND THE PAGE SAYS SO.
//
// The Gazetteer carries no time zone, and there is no federal file that maps county to IANA zone.
// Thirteen states straddle a zone boundary and several of the splits are not longitudinal at all --
// Indiana's is county-by-county and genuinely irregular. So this assigns a zone from state plus
// longitude, marks every county in a split state as `approx`, and the tool exposes a time-zone
// selector the reader can correct. Latitude and longitude drive the sun's POSITION and are exact;
// the zone only converts that to a wall clock.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'docs', 'data', 'sunlight-locations.json');
const GAZ = 'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2023_Gazetteer/2023_Gaz_counties_national.zip';

/** Single-zone states. */
const SINGLE: Record<string, string> = {
  AL: 'America/Chicago', AK: 'America/Anchorage', AZ: 'America/Phoenix', AR: 'America/Chicago',
  CA: 'America/Los_Angeles', CO: 'America/Denver', CT: 'America/New_York', DE: 'America/New_York',
  DC: 'America/New_York', GA: 'America/New_York', HI: 'Pacific/Honolulu', IL: 'America/Chicago',
  IA: 'America/Chicago', LA: 'America/Chicago', ME: 'America/New_York', MD: 'America/New_York',
  MA: 'America/New_York', MN: 'America/Chicago', MS: 'America/Chicago', MO: 'America/Chicago',
  MT: 'America/Denver', NV: 'America/Los_Angeles', NH: 'America/New_York', NJ: 'America/New_York',
  NM: 'America/Denver', NY: 'America/New_York', NC: 'America/New_York', OH: 'America/New_York',
  OK: 'America/Chicago', PA: 'America/New_York', RI: 'America/New_York', SC: 'America/New_York',
  UT: 'America/Denver', VT: 'America/New_York', VA: 'America/New_York', WA: 'America/Los_Angeles',
  WV: 'America/New_York', WI: 'America/Chicago', WY: 'America/Denver',
};

/**
 * States crossed by a zone boundary. `at` is the approximate longitude of the split; counties west
 * of it get `west`, the rest `east`. Indiana is deliberately handled as a single guess because its
 * real boundary is county-by-county and a longitude cut would be confidently wrong.
 */
const SPLIT: Record<string, { at: number; east: string; west: string }> = {
  FL: { at: -85.0, east: 'America/New_York', west: 'America/Chicago' },
  MI: { at: -87.0, east: 'America/New_York', west: 'America/Chicago' },
  IN: { at: -999, east: 'America/Indiana/Indianapolis', west: 'America/Indiana/Indianapolis' },
  KY: { at: -85.5, east: 'America/New_York', west: 'America/Chicago' },
  TN: { at: -85.3, east: 'America/New_York', west: 'America/Chicago' },
  ND: { at: -100.5, east: 'America/Chicago', west: 'America/Denver' },
  SD: { at: -100.0, east: 'America/Chicago', west: 'America/Denver' },
  NE: { at: -100.5, east: 'America/Chicago', west: 'America/Denver' },
  KS: { at: -101.5, east: 'America/Chicago', west: 'America/Denver' },
  TX: { at: -104.9, east: 'America/Chicago', west: 'America/Denver' },
  ID: { at: -999, east: 'America/Boise', west: 'America/Boise' },
  OR: { at: -117.5, east: 'America/Los_Angeles', west: 'America/Los_Angeles' },
  NE_DUP: { at: 0, east: '', west: '' },
};
delete (SPLIT as any).NE_DUP;

function zoneFor(state: string, lon: number): { tz: string; approx: boolean } {
  const s = SPLIT[state];
  if (s) return { tz: lon < s.at ? s.west : s.east, approx: true };
  const tz = SINGLE[state];
  if (!tz) return { tz: 'America/New_York', approx: true };
  return { tz, approx: false };
}

async function main() {
  const ppPath = path.join(ROOT, 'docs', 'data', 'permit-pulse-by-county.csv');
  if (!fs.existsSync(ppPath)) throw new Error('ABORT: run scripts/build-permit-pulse.ts first');
  const wanted = new Set(
    fs.readFileSync(ppPath, 'utf8').trim().split('\n').slice(1).map((l) => l.split(',')[0]),
  );
  console.log(`  ${wanted.size} counties requested from the Permit Pulse gated set`);

  const res = await fetch(GAZ);
  if (!res.ok) throw new Error(`ABORT: gazetteer returned ${res.status}`);
  const zip = Buffer.from(await res.arrayBuffer());

  // The archive holds one stored/deflated text member; unzip via the system tool rather than
  // adding a dependency for a once-a-decade file.
  const tmp = path.join(ROOT, 'node_modules', '.cache');
  fs.mkdirSync(tmp, { recursive: true });
  const zipPath = path.join(tmp, 'gaz.zip');
  fs.writeFileSync(zipPath, zip);
  const { execFileSync } = await import('node:child_process');
  execFileSync('unzip', ['-o', '-q', zipPath, '-d', tmp]);
  const txtName = fs.readdirSync(tmp).find((f) => /Gaz_counties/.test(f) && f.endsWith('.txt'));
  if (!txtName) throw new Error('ABORT: no gazetteer text file inside the archive');
  const lines = fs.readFileSync(path.join(tmp, txtName), 'utf8').trim().split('\n');

  const head = lines[0].split('\t').map((h) => h.trim());
  const iState = head.indexOf('USPS'), iGeo = head.indexOf('GEOID'), iName = head.indexOf('NAME');
  const iLat = head.indexOf('INTPTLAT'), iLon = head.indexOf('INTPTLONG');
  if ([iState, iGeo, iName, iLat, iLon].some((i) => i < 0)) {
    throw new Error(`ABORT: gazetteer columns moved -- got ${head.join(',')}`);
  }

  const out: any[] = [];
  let approxCount = 0;
  for (const line of lines.slice(1)) {
    const f = line.split('\t');
    const fips = f[iGeo].trim();
    if (!wanted.has(fips)) continue;
    const state = f[iState].trim();
    const lat = Number(f[iLat]), lon = Number(f[iLon]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const { tz, approx } = zoneFor(state, lon);
    if (approx) approxCount++;
    out.push({
      f: fips,
      n: f[iName].trim().replace(/\s+(County|Parish|Borough|Census Area|Municipality|city)$/i, ''),
      s: state,
      y: Math.round(lat * 1e4) / 1e4,
      x: Math.round(lon * 1e4) / 1e4,
      z: tz,
      ...(approx ? { a: 1 } : {}),
    });
  }
  out.sort((a, b) => (a.s === b.s ? a.n.localeCompare(b.n) : a.s.localeCompare(b.s)));

  const missing = [...wanted].filter((w) => !out.some((o) => o.f === w));
  console.log(`  matched ${out.length}, unmatched ${missing.length}`);
  if (out.length < wanted.size * 0.9) throw new Error(`ABORT: only ${out.length} of ${wanted.size} counties matched -- FIPS format mismatch?`);

  // Sanity: no county may land outside the plausible bounds of the 50 states + DC.
  for (const o of out) {
    if (o.y < 17 || o.y > 72 || o.x < -180 || o.x > -64) {
      throw new Error(`ABORT: ${o.n}, ${o.s} at ${o.y},${o.x} is outside plausible US bounds`);
    }
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, `${JSON.stringify({
    source: 'US Census Bureau, 2023 Gazetteer Files, counties (INTPTLAT/INTPTLONG)',
    sourceUrl: GAZ,
    generatedAt: new Date().toISOString(),
    note: 'Time zone is derived from state and longitude, not from a federal file. Counties in states crossed by a zone boundary carry a:1 and the tool lets the reader correct it.',
    counties: out,
  })}\n`);
  console.log(`  time zone marked approximate for ${approxCount} counties in split states`);
  console.log(`  wrote ${path.relative(ROOT, OUT)}  (${(fs.statSync(OUT).size / 1024).toFixed(1)} KB, ${out.length} counties, ${new Set(out.map((o) => o.s)).size} states)`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
