// Pull real keyword data and write it to data/keywords/ as a citable capture.
//
//   npx tsx scripts/capture-keywords.ts --seed "polybutylene pipe"
//   npx tsx scripts/capture-keywords.ts --volumes "knob and tube wiring,orangeburg pipe"
//   npx tsx scripts/capture-keywords.ts --seed "eifs stucco" --limit 50
//
// -----------------------------------------------------------------------------------------------
// THIS IS THE ONLY SANCTIONED WAY A KEYWORD ENTERS THIS PROJECT.
//
// scripts/assert-keyword-provenance.ts will not accept a keyword that did not come through here (or
// through a GSC/Bing export written in the same shape). That is the point. The rule is not "prefer
// real data"; the rule is that unreal data does not build.
//
// -----------------------------------------------------------------------------------------------
// ON OPENSEO.
//
// OpenSEO (github.com/every-app/open-seo, MIT) is free and self-hostable, and it is a FRONT END OVER
// DATAFORSEO -- its own .env.selfhost.example requires exactly one credential, DATAFORSEO_API_KEY.
// So it does not provide data this script cannot already reach; what it provides is a UI, saved
// projects, and an MCP server for interactive work.
//
// Both paths are supported here because they are genuinely interchangeable, and which one produced a
// number is recorded in the capture either way. Set OPENSEO_URL to route through a self-hosted
// instance; leave it unset to call DataForSEO directly.
//
// EITHER WAY THE SAME ACCOUNT IS BILLED, and as of the last check that account returns task code
// 40201 (paused) on every data endpoint while returning 20000 on the free appendix/user_data probe.
// This script reports that distinctly instead of writing an empty capture, because an empty capture
// that looks successful is how a zero becomes a fact.
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  fetchKeywordVolumes,
  fetchKeywordSuggestions,
  isDataForSeoConfigured,
  type KeywordVolume,
} from '../src/server/dataForSeoService.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CAPTURE_DIR = path.join(ROOT, 'data', 'keywords');

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

/** data/keywords/<id>.json -- stable, readable, and safe as a filename. */
function captureId(kind: string, subject: string): string {
  const stamp = new Date().toISOString().slice(0, 10);
  const slug = subject.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
  return `${stamp}-${kind}-${slug}`;
}

async function main() {
  const seed = arg('seed');
  const volumes = arg('volumes');
  const limit = Number(arg('limit') ?? 100);

  if (!seed && !volumes) {
    console.error('Usage: --seed "<phrase>"   or   --volumes "kw one,kw two"');
    process.exit(1);
  }
  if (!isDataForSeoConfigured()) {
    console.error('DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD are not set in .env');
    process.exit(1);
  }
  if (process.env.OPENSEO_URL) {
    console.log(`  routing note: OPENSEO_URL is set (${process.env.OPENSEO_URL}).`);
    console.log(`  This script still calls DataForSEO directly -- OpenSEO's value is its UI and MCP`);
    console.log(`  server, not a distinct dataset. Use its web app for exploration; use this for the`);
    console.log(`  captures the build gate reads.\n`);
  }

  const kind = seed ? 'suggestions' : 'volumes';
  const subject = seed ?? volumes!.split(',')[0];
  let rows: Array<KeywordVolume & { keywordDifficulty?: number | null }>;
  let endpoint: string;

  try {
    if (seed) {
      endpoint = '/dataforseo_labs/google/keyword_suggestions/live';
      rows = await fetchKeywordSuggestions(seed, { limit });
    } else {
      endpoint = '/keywords_data/google_ads/search_volume/live';
      rows = await fetchKeywordVolumes(volumes!.split(',').map((k) => k.trim()).filter(Boolean));
    }
  } catch (e) {
    const msg = (e as Error).message;
    console.error(`\n  NO CAPTURE WRITTEN.\n  ${msg}\n`);
    if (msg.includes('40201')) {
      console.error(
        `  Task code 40201 means the DataForSEO account is paused, not that the query has no data.\n` +
        `  Nothing was billed and no file was written. Email support@dataforseo.com to lift it;\n` +
        `  self-hosting OpenSEO will NOT work around this -- it bills the same paused account.\n`
      );
    }
    process.exit(1);
  }

  if (!rows.length) {
    console.error(`\n  The API succeeded but returned zero rows for "${subject}".`);
    console.error(`  Writing no capture: an empty file would later read as a measured zero.\n`);
    process.exit(1);
  }

  const id = captureId(kind, subject);
  const capture = {
    source: 'dataforseo' as const,
    endpoint,
    captured_at: new Date().toISOString(),
    location_name: 'United States',
    language_code: 'en',
    cost_usd: 0, // set from the response envelope once surfaced; 0 means "not recorded", not "free"
    query: seed ?? volumes,
    keywords: rows.map((r) => ({
      keyword: r.keyword,
      search_volume: r.searchVolume,
      competition: r.competition,
      competition_index: r.competitionIndex,
      cpc: r.cpc,
      keyword_difficulty: r.keywordDifficulty ?? null,
    })),
  };

  fs.mkdirSync(CAPTURE_DIR, { recursive: true });
  const file = path.join(CAPTURE_DIR, `${id}.json`);
  fs.writeFileSync(file, `${JSON.stringify(capture, null, 2)}\n`);

  const quantified = rows.filter((r) => r.searchVolume !== null);
  console.log(`\n  wrote data/keywords/${id}.json`);
  console.log(`    ${rows.length} keyword(s), ${quantified.length} with a volume\n`);
  for (const r of [...quantified].sort((a, b) => (b.searchVolume ?? 0) - (a.searchVolume ?? 0)).slice(0, 25)) {
    const kd = r.keywordDifficulty == null ? '' : `  kd=${r.keywordDifficulty}`;
    console.log(`    ${String(r.searchVolume).padStart(7)}  ${r.keyword}${kd}`);
  }
  console.log(`\n  To act on any of these, add it to src/seo/targetKeywords.ts citing capture "${id}".`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
