// Generates the per-county narrative for one or more counties and stores it on county_data.
//
//   npx tsx scripts/generate-county-narratives.ts <slug> [<slug> ...]   # named counties
//   npx tsx scripts/generate-county-narratives.ts --dry-run <slug>      # print, don't store
//
// See src/server/countyNarrativeGenerator.ts for why this exists. Short version: Search Console
// reports every /county/ page as "Discovered - currently not indexed" while the hubs above them
// are indexed, and two unrelated county pages measure 79% identical -- one template, numbers
// swapped, 100 times. This writes the county-specific prose that the template never had.
//
// Deliberately a script and not a batch admin button: this is a PILOT over a handful of counties
// whose output a human reads before anything is rolled out to the other 95, and a one-click
// "generate all" invites exactly the un-reviewed bulk generation that created the problem.
import 'dotenv/config';
import { withDb, isDbConfigured } from '../src/server/db.js';
import {
  buildCountyNarrativePrompt,
  COUNTY_NARRATIVE_SYSTEM_INSTRUCTION,
  COUNTY_NARRATIVE_RESPONSE_SCHEMA,
} from '../src/server/countyNarrativeGenerator.js';
import { generateContentWithFallback } from '../src/server/geminiModel.js';
import { getInspectionPriorities } from '../src/engine/inspectionPriorities.js';
import { KNOWN_SOURCES } from '../src/data/knownSources.js';

const DRY_RUN = process.argv.includes('--dry-run');
const slugs = process.argv.slice(2).filter((a) => !a.startsWith('--'));

/** Mirrors countyEventsApi.ts's own dominant-era read so both features agree on the same county. */
function pickDominantEraYear(censusYearBuiltJson: string): { year: number; label: string } | null {
  let buckets: Record<string, number> = {};
  try { buckets = JSON.parse(censusYearBuiltJson || '{}'); } catch { return null; }
  const entries = Object.entries(buckets).filter(([, v]) => typeof v === 'number' && v > 0);
  if (entries.length === 0) return null;
  const [label] = entries.sort((a, b) => b[1] - a[1])[0];
  const m = label.match(/(\d{4})/);
  if (!m) return null;
  return { year: parseInt(m[1], 10), label };
}

async function main() {
  if (!isDbConfigured()) throw new Error('DATABASE_URL is not set.');
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set.');
  if (slugs.length === 0) throw new Error('Pass at least one county slug.');

  const guideRows = await withDb((sql) => sql`
    SELECT title FROM articles WHERE status = 'published' ORDER BY published_at DESC LIMIT 40
  `);
  const relatedGuideTitles = (guideRows as any[]).map((g) => g.title);
  const approvedSourceCodes = KNOWN_SOURCES.map((s) => s.key);

  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });

  for (const slug of slugs) {
    const row = await withDb(async (sql) => {
      const r = await sql`SELECT * FROM county_data WHERE slug = ${slug} AND data_complete = true LIMIT 1`;
      return (r as any[])[0];
    });
    if (!row) { console.log(`\n!! ${slug}: no complete county_data row -- skipped`); continue; }

    const dominant = pickDominantEraYear(row.census_year_built_json);
    const eraResult = dominant ? getInspectionPriorities(dominant.year, row.county_name, row.state_abbrev) : null;
    const era = eraResult
      ? { regionLabel: eraResult.regionLabel, priorities: eraResult.priorities, insuranceRedFlags: eraResult.insuranceRedFlags }
      : { regionLabel: `${row.county_name} County, ${row.state_abbrev}`, priorities: [], insuranceRedFlags: [] };

    const { contents } = buildCountyNarrativePrompt({
      county: {
        countyName: row.county_name,
        stateAbbrev: row.state_abbrev,
        countyUrl: `https://www.beforeregret.com/county/${slug}/`,
        femaRiskRating: row.fema_risk_rating,
        femaRiskScore: row.fema_risk_score,
        femaHazards: JSON.parse(row.fema_hazards_json || '{}'),
        noaaEventCounts: JSON.parse(row.noaa_event_counts_json || '{}'),
        noaaYearsCovered: row.noaa_years_covered,
        radonZone: row.radon_zone,
        dominantEraLabel: dominant?.label || 'not available',
      },
      era,
      relatedGuideTitles,
      approvedSourceCodes,
    });

    process.stdout.write(`\n=== ${row.county_name} County, ${row.state_abbrev} (${slug}) ... `);
    const { result: response, model } = await generateContentWithFallback(ai, {
      contents,
      config: {
        systemInstruction: COUNTY_NARRATIVE_SYSTEM_INSTRUCTION,
        temperature: 0.75, // higher than the event generator's 0.6 -- divergence between counties is the entire point
        responseMimeType: 'application/json',
        responseSchema: COUNTY_NARRATIVE_RESPONSE_SCHEMA,
      },
    });
    const parsed = JSON.parse(response.text?.trim() || '{}');
    const angle = String(parsed.angle || '').trim();
    const narrative = String(parsed.narrativeMarkdown || '').trim();
    if (!angle || !narrative) { console.log('FAILED (incomplete response)'); continue; }
    console.log(`${narrative.split(/\s+/).length} words [${model}]`);
    console.log(`    angle: ${angle}`);
    console.log(`    headings: ${(narrative.match(/^##\s+.+$/gm) || []).map((h) => h.replace(/^##\s+/, '')).join(' | ')}`);

    if (DRY_RUN) { console.log('    (dry run -- not stored)'); continue; }
    await withDb((sql) => sql`
      UPDATE county_data
      SET narrative_markdown = ${narrative}, narrative_angle = ${angle}, narrative_generated_at = now()
      WHERE slug = ${slug}
    `);
    console.log('    stored.');
  }
}

main().catch((e) => { console.error(e?.message || e); process.exit(1); });
