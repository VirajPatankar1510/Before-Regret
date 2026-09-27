// Record what a person saw on a live search results page, as a citable capture.
//
//   npx tsx scripts/record-observation.ts \
//     --query "contractor found unpermitted work" --query "who pays to fix unpermitted work" \
//     --where "Google autocomplete, private window" --by owner [--note "..."]
//
// WHY. With paid keyword tools retired (2026-09-27), a subject with no first-party signal
// (scripts/topic-demand.ts tier 3) has exactly one honest source left: someone typing it into a
// search engine and writing down what the engine itself suggests -- autocomplete, People Also Ask,
// related searches. Google only suggests what people search, so an observed suggestion proves the
// query exists. It proves nothing about HOW MANY, which is why every row is written with
// search_volume null and the provenance gate reports it as real-but-unquantified.
//
// A person, not a script, does the looking. Automated querying of a search engine is scraping,
// trips bot checks, and is not something this project does.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CAPTURE_DIR = path.join(ROOT, 'data', 'keywords');

const all = (name: string) => process.argv.flatMap((a, i) => (a === `--${name}` ? [process.argv[i + 1]] : [])).filter(Boolean);
const one = (name: string) => all(name)[0];

const queries = all('query').map((q) => q.trim().toLowerCase());
const where = one('where');
const by = one('by');
if (!queries.length || !where || !by) {
  console.error('usage: --query "<text>" [--query ...] --where "<engine + feature + context>" --by "<who looked>" [--note "..."]');
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const tag = queries[0].replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
const id = `${today}-observed-${tag}`;
fs.mkdirSync(CAPTURE_DIR, { recursive: true });
fs.writeFileSync(path.join(CAPTURE_DIR, `${id}.json`), `${JSON.stringify({
  source: 'observation',
  endpoint: `seen by a person on a live results page: ${where}`,
  captured_at: new Date().toISOString(),
  location_name: 'United States', language_code: 'en', cost_usd: 0,
  observed_where: where,
  observed_by: by,
  ...(one('note') ? { note: one('note') } : {}),
  keywords: queries.map((keyword) => ({ keyword, search_volume: null })),
}, null, 2)}\n`);
console.log(`wrote data/keywords/${id}.json (${queries.length} observed quer${queries.length === 1 ? 'y' : 'ies'}, no volumes)`);
