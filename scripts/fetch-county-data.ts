import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { spawnSync } from 'child_process';
import { withDb, isDbConfigured } from '../src/server/db.js';
import { fetchCensusHousingAge, fetchFemaRiskIndex, type CountyIdentity } from '../src/server/countyDataFetcher.js';
import { findCountyRadonZone } from '../src/data/countyRadonZones.js';
import { submitUrlsToIndexNow } from '../src/utils/indexNowService.js';
import { COVERED_COUNTIES } from '../src/data/coveredCounties.js';

// Populates county_data for the counties listed in src/data/coveredCounties.ts. This is the
// enforcement point for the "no data, no page" rule described when this feature was scoped: a
// county is only ever written with data_complete = true when all four real sources below
// returned genuine data. Any source that fails leaves data_complete = false, and
// src/server/countiesApi.ts's public read route treats that exactly like the county doesn't
// exist (404) -- there's no partial/best-effort page.
//
// Counties to process are a hardcoded list, not a batch-all-3,142-counties run -- deliberately,
// same reasoning as scripts/generate-draft-articles.ts's TOPIC_LIMIT: publishing thousands of new
// pages at once is itself a red flag to search engines regardless of whether the underlying data
// is real, so this scales one deliberate batch at a time.
const COUNTIES = COVERED_COUNTIES;

// NOAA Storm Events Database: bulk annual CSVs, not a queryable-by-county API (see
// https://www.ncei.noaa.gov/stormevents/faq.jsp) -- so all 3,142 counties' event history for a
// given year lives in the same file. Downloaded once per run into a local cache (gitignored) and
// reused across every county in COUNTIES above, rather than re-fetched per county.
const NOAA_YEARS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
const NOAA_CACHE_DIR = path.join(process.cwd(), '.cache', 'storm-events');
const NOAA_FILE_LIST_URL = 'https://www.ncei.noaa.gov/pub/data/swdi/stormevents/csvfiles/';
const NOAA_FILE_BASE_URL = 'https://www.ncei.noaa.gov/pub/data/swdi/stormevents/csvfiles/';

async function ensureNoaaFilesCached(): Promise<string[]> {
  fs.mkdirSync(NOAA_CACHE_DIR, { recursive: true });
  const listing = await fetch(NOAA_FILE_LIST_URL).then((r) => r.text());
  const paths: string[] = [];
  for (const year of NOAA_YEARS) {
    const match = listing.match(new RegExp(`StormEvents_details-ftp_v1\\.0_d${year}_c[0-9]+\\.csv\\.gz`));
    if (!match) {
      console.warn(`[fetch-county-data] No NOAA Storm Events file found for ${year} -- skipping that year.`);
      continue;
    }
    const filename = match[0];
    const localPath = path.join(NOAA_CACHE_DIR, filename);
    if (!fs.existsSync(localPath)) {
      console.log(`[fetch-county-data] Downloading ${filename}...`);
      // Node's native fetch() has repeatedly hit ETIMEDOUT on these ~10MB files even though the
      // exact same URL downloads reliably via curl -- shelling out rather than fighting undici's
      // timeout/keep-alive behavior for a one-off batch script.
      const result = spawnSync('curl', ['-sL', '--fail', NOAA_FILE_BASE_URL + filename, '-o', localPath], { stdio: 'inherit' });
      if (result.status !== 0) {
        console.warn(`[fetch-county-data] Failed to download ${filename} via curl (exit ${result.status}).`);
        continue;
      }
    }
    paths.push(localPath);
  }
  return paths;
}

// Minimal CSV line parser handling quoted fields with embedded commas -- the storm narrative
// fields (EPISODE_NARRATIVE, EVENT_NARRATIVE) routinely contain both.
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { cur += ch; }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { fields.push(cur); cur = ''; }
      else { cur += ch; }
    }
  }
  fields.push(cur);
  return fields;
}

// NOAA's Storm Events Database (CZ_NAME field) occasionally spells a county differently from the
// Census/FEMA convention this app otherwise uses everywhere -- confirmed by grepping the actual
// cached CSVs, not guessed: DuPage County, IL is 'DU PAGE' (two words) in NOAA's own data, while
// Census and FEMA both match on 'DUPAGE' (one word, and FEMA's fetch for it already succeeds).
// This is NOAA's own data quirk, not a wrong identity -- so it's aliased only for this one lookup
// rather than changing identity.countyName, which would break the other two fetchers that already
// agree on the standard spelling.
const NOAA_CZ_NAME_ALIASES: Record<string, string> = {
  'IL:DUPAGE': 'DU PAGE',
};

async function countNoaaEventsForCounty(filePaths: string[], identity: CountyIdentity): Promise<{ eventCounts: Record<string, number>; yearsCovered: string } | null> {
  const counts: Record<string, number> = {};
  let total = 0;
  const targetState = identity.stateName.toUpperCase();
  const targetCounty = NOAA_CZ_NAME_ALIASES[`${identity.stateAbbrev}:${identity.countyName.toUpperCase()}`] || identity.countyName.toUpperCase();

  for (const filePath of filePaths) {
    const decompressed = zlib.gunzipSync(fs.readFileSync(filePath)).toString('utf8');
    const lines = decompressed.split('\n');
    if (lines.length === 0) continue;
    const header = parseCsvLine(lines[0]);
    const stateIdx = header.indexOf('STATE');
    const countyIdx = header.indexOf('CZ_NAME');
    const eventTypeIdx = header.indexOf('EVENT_TYPE');
    if (stateIdx === -1 || countyIdx === -1 || eventTypeIdx === -1) continue;

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const fields = parseCsvLine(lines[i]);
      if (fields[stateIdx]?.trim().toUpperCase() !== targetState) continue;
      if (fields[countyIdx]?.trim().toUpperCase() !== targetCounty) continue;
      const eventType = fields[eventTypeIdx]?.trim();
      if (!eventType) continue;
      counts[eventType] = (counts[eventType] || 0) + 1;
      total++;
    }
  }

  if (total === 0 || filePaths.length === 0) return null;
  return { eventCounts: counts, yearsCovered: `${NOAA_YEARS[0]}-${NOAA_YEARS[NOAA_YEARS.length - 1]}` };
}

async function run() {
  if (!isDbConfigured()) {
    console.error('[fetch-county-data] DATABASE_URL not set.');
    process.exit(1);
  }
  const censusApiKey = process.env.CENSUS_API_KEY;
  if (!censusApiKey) {
    console.error('[fetch-county-data] CENSUS_API_KEY not set.');
    process.exit(1);
  }

  console.log(`[fetch-county-data] Caching NOAA Storm Events files for ${NOAA_YEARS[0]}-${NOAA_YEARS[NOAA_YEARS.length - 1]}...`);
  const noaaFiles = await ensureNoaaFilesCached();

  for (const county of COUNTIES) {
    console.log(`\n[fetch-county-data] Processing ${county.countyName} County, ${county.stateAbbrev}...`);

    const radon = findCountyRadonZone(county.stateAbbrev, county.countyName);
    if (!radon) console.warn(`  - No hand-verified EPA radon zone entry for this county (see src/data/countyRadonZones.ts).`);

    let census = null;
    try {
      census = await fetchCensusHousingAge(county, censusApiKey);
    } catch (err) {
      console.warn(`  - Census fetch failed: ${(err as Error).message}`);
    }

    let fema = null;
    try {
      fema = await fetchFemaRiskIndex(county);
    } catch (err) {
      console.warn(`  - FEMA fetch failed: ${(err as Error).message}`);
    }

    const noaa = await countNoaaEventsForCounty(noaaFiles, county);
    if (!noaa) console.warn(`  - No NOAA storm event records found for this county in ${NOAA_YEARS[0]}-${NOAA_YEARS[NOAA_YEARS.length - 1]}.`);

    const dataComplete = Boolean(radon && census && fema && noaa);
    console.log(`  - EPA radon: ${radon ? `Zone ${radon.zone}` : 'MISSING'}`);
    console.log(`  - Census housing age: ${census ? `${census.totalUnits} total units` : 'MISSING'}`);
    console.log(`  - FEMA risk index: ${fema ? fema.riskRating : 'MISSING'}`);
    console.log(`  - NOAA storm events: ${noaa ? `${Object.values(noaa.eventCounts).reduce((a, b) => a + b, 0)} events` : 'MISSING'}`);
    console.log(`  -> data_complete = ${dataComplete}`);

    await withDb(async (sql) => {
      await sql`
        INSERT INTO county_data (
          slug, county_name, state_name, state_abbrev, population,
          radon_zone, census_total_units, census_year_built_json,
          fema_risk_rating, fema_risk_score, fema_hazards_json,
          noaa_event_counts_json, noaa_years_covered, data_complete, fetched_at, updated_at
        ) VALUES (
          ${county.slug}, ${county.countyName}, ${county.stateName}, ${county.stateAbbrev}, ${fema?.population ?? null},
          ${radon?.zone ?? null}, ${census?.totalUnits ?? null}, ${JSON.stringify(census?.yearBuiltBuckets ?? {})},
          ${fema?.riskRating ?? null}, ${fema?.riskScore ?? null}, ${JSON.stringify(fema?.hazards ?? {})},
          ${JSON.stringify(noaa?.eventCounts ?? {})}, ${noaa?.yearsCovered ?? null}, ${dataComplete}, now(), now()
        )
        ON CONFLICT (slug) DO UPDATE SET
          population = EXCLUDED.population,
          radon_zone = EXCLUDED.radon_zone,
          census_total_units = EXCLUDED.census_total_units,
          census_year_built_json = EXCLUDED.census_year_built_json,
          fema_risk_rating = EXCLUDED.fema_risk_rating,
          fema_risk_score = EXCLUDED.fema_risk_score,
          fema_hazards_json = EXCLUDED.fema_hazards_json,
          noaa_event_counts_json = EXCLUDED.noaa_event_counts_json,
          noaa_years_covered = EXCLUDED.noaa_years_covered,
          data_complete = EXCLUDED.data_complete,
          fetched_at = now(),
          updated_at = now()
      `;
    });
    console.log(`  Saved to county_data (slug: ${county.slug}).`);

    // County pages never fired IndexNow at all -- only the guide publish route did. Unlike that
    // route, this is a one-shot script, not a long-lived server, so the submission is awaited
    // rather than fire-and-forget: nothing would keep the process alive long enough for a detached
    // promise to resolve before `run()` returns and the script exits.
    if (dataComplete) {
      const result = await submitUrlsToIndexNow([`https://www.beforeregret.com/county/${county.slug}/`]);
      if (!result.success) {
        console.warn(`  - IndexNow submission failed: ${result.message}`);
      }
    }
  }

  console.log('\n[fetch-county-data] Done.');
}

run().catch((err) => {
  console.error('[fetch-county-data] Fatal error:', err);
  process.exit(1);
});
