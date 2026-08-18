// Verifies the per-county titles and meta descriptions that prerender-counties.tsx now generates.
//
//   npx tsx scripts/check-county-meta.ts          # summary + failures
//   npx tsx scripts/check-county-meta.ts --all    # also print every county's title
//
// Exists because the defect being fixed was invisible at sample size: three county pages spot-
// checked by hand all looked reasonable, and all 100 were still byte-identical apart from the
// county name. A rule that "degrades gracefully" is also exactly the kind of thing that quietly
// stops degrading gracefully for the one county with the longest name and the longest hazard
// label, so every row gets checked rather than a handful.
//
// Read-only: reads county_data and runs the same pure function the build does.
import 'dotenv/config';
import { withDb } from '../src/server/db.js';
import { buildCountyMeta } from './prerender-counties.js';

const TITLE_MAX = 60;
const DESC_MAX = 158;

async function main() {
  const showAll = process.argv.includes('--all');
  const rows = await withDb((sql) => sql`
    SELECT slug, county_name, state_name, state_abbrev, population, radon_zone,
           census_total_units, census_year_built_json, fema_risk_rating, fema_risk_score,
           fema_hazards_json, noaa_event_counts_json, noaa_years_covered, fetched_at
    FROM county_data WHERE data_complete = true ORDER BY slug
  `) as unknown as any[];

  const titleCase = (s: string) =>
    s.toLowerCase().replace(/(^|[\s'-])([a-z])/g, (_, p, c) => p + c.toUpperCase());

  const titles = new Map<string, string[]>();
  const descs = new Map<string, string[]>();
  const tooLongTitle: string[] = [];
  const tooLongDesc: string[] = [];
  const noHazard: string[] = [];
  const noEra: string[] = [];

  for (const raw of rows) {
    const row = { ...raw, county_name: titleCase(raw.county_name) };
    const { title, description } = buildCountyMeta(row);

    (titles.get(title) ?? titles.set(title, []).get(title)!).push(row.slug);
    (descs.get(description) ?? descs.set(description, []).get(description)!).push(row.slug);
    if (title.length > TITLE_MAX) tooLongTitle.push(`${row.slug} (${title.length}) ${title}`);
    if (description.length > DESC_MAX) tooLongDesc.push(`${row.slug} (${description.length})`);
    if (!/Radon Zone|Risk|Homes/.test(title)) noHazard.push(row.slug);
    if (!/most homes built/.test(description)) noEra.push(row.slug);

    if (showAll) console.log(`${String(title.length).padStart(3)}  ${title}`);
  }

  const dupTitles = [...titles.entries()].filter(([, s]) => s.length > 1);
  const dupDescs = [...descs.entries()].filter(([, s]) => s.length > 1);

  console.log(`\n=== ${rows.length} counties ===`);
  console.log(`distinct titles       : ${titles.size}`);
  console.log(`distinct descriptions : ${descs.size}`);
  console.log(`titles over ${TITLE_MAX}       : ${tooLongTitle.length}`);
  console.log(`descriptions over ${DESC_MAX}: ${tooLongDesc.length}`);
  console.log(`no era clause         : ${noEra.length}`);

  for (const [t, slugs] of dupTitles) console.log(`DUPLICATE TITLE  "${t}" -> ${slugs.join(', ')}`);
  for (const [, slugs] of dupDescs) console.log(`DUPLICATE DESC   -> ${slugs.join(', ')}`);
  for (const t of tooLongTitle) console.log(`OVER-LENGTH TITLE ${t}`);
  for (const d of tooLongDesc) console.log(`OVER-LENGTH DESC  ${d}`);

  const failed = dupTitles.length + dupDescs.length + tooLongTitle.length + tooLongDesc.length;
  if (failed > 0) {
    console.log(`\nFAILED: ${failed} problem(s).`);
    process.exit(1);
  }
  console.log('\nPASS: every county has a unique title and description, all within budget.');
}

main().catch((err) => {
  console.error('FAILED:', err?.message ?? err);
  process.exit(1);
});
