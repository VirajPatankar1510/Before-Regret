// Build gate: every targeted keyword must trace to a capture a real API returned.
//
//   npx tsx scripts/assert-keyword-provenance.ts
//
// -----------------------------------------------------------------------------------------------
// WHAT THIS IS FOR, stated plainly.
//
// An agent asked "what keywords should we target" will always produce an answer. It costs nothing
// to generate a plausible list with plausible volumes, the output is fluent, and nothing about it
// looks different from a list that was measured. That is the whole problem: the failure is silent
// and it is invisible at review time.
//
// Connecting a data source does not fix this. An MCP server, an API client, a subscription -- all
// of them make good data AVAILABLE. None of them make it MANDATORY. The gap between "we have an SEO
// API wired up" and "every keyword we act on came out of it" is exactly where invented numbers live.
//
// So this runs in the build, before anything is compiled, and it fails loudly. It is the same shape
// as scripts/assert-walkthrough-checks.ts and the `requires` gate in scripts/ctr-round-3-eifs-la.ts:
// a claim may only be made if the artifact backing it already exists.
//
// It is deliberately boring and deliberately strict. An empty registry passes -- claiming nothing is
// always honest. Claiming something you cannot show is what fails.
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TARGET_KEYWORDS,
  VALID_SOURCES,
  STALE_AFTER_DAYS,
  type ProvenanceSource,
} from '../src/seo/targetKeywords.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CAPTURE_DIR = path.join(ROOT, 'data', 'keywords');

/** The on-disk shape written by scripts/capture-keywords.ts. Anything under data/keywords/ that
 *  does not match is rejected rather than skipped -- a malformed capture must never read as an
 *  absent one, because absent is the state that silently permits an unbacked claim. */
interface Capture {
  source: ProvenanceSource;
  endpoint: string;
  captured_at: string;
  location_name: string;
  language_code: string;
  cost_usd: number;
  keywords: Array<{ keyword: string; search_volume: number | null }>;
}

const problems: string[] = [];
const warnings: string[] = [];

function loadCaptures(): Map<string, Capture> {
  const out = new Map<string, Capture>();
  if (!fs.existsSync(CAPTURE_DIR)) return out;
  for (const f of fs.readdirSync(CAPTURE_DIR).filter((f) => f.endsWith('.json'))) {
    const id = f.replace(/\.json$/, '');
    let c: Capture;
    try {
      c = JSON.parse(fs.readFileSync(path.join(CAPTURE_DIR, f), 'utf8')) as Capture;
    } catch (e) {
      problems.push(`capture ${f} is not valid JSON: ${(e as Error).message}`);
      continue;
    }
    // Validate the envelope. A capture missing its provenance is worse than no capture at all.
    if (!VALID_SOURCES.includes(c.source)) {
      problems.push(`capture ${f} has source "${c.source}", not one of ${VALID_SOURCES.join(', ')}`);
      continue;
    }
    if (!c.endpoint) problems.push(`capture ${f} does not record which endpoint produced it`);
    if (!c.captured_at || Number.isNaN(Date.parse(c.captured_at))) {
      problems.push(`capture ${f} has no parseable captured_at`);
      continue;
    }
    if (!Array.isArray(c.keywords)) {
      problems.push(`capture ${f} has no keywords array`);
      continue;
    }
    out.set(id, c);
  }
  return out;
}

function main() {
  const captures = loadCaptures();

  // Live slugs, so a keyword cannot be aimed at a page that does not exist. Read from the sitemap
  // rather than the database: this runs at build time on Vercel, where the DB may be unreachable,
  // and a gate that cannot run is a gate that gets removed.
  const sitemapPath = path.join(ROOT, 'public', 'sitemap.xml');
  const slugs = new Set<string>();
  if (fs.existsSync(sitemapPath)) {
    for (const m of fs.readFileSync(sitemapPath, 'utf8').matchAll(/\/guides\/([a-z0-9-]+)\//g)) {
      slugs.add(m[1]);
    }
  }

  const seen = new Set<string>();
  for (const t of TARGET_KEYWORDS) {
    const label = `"${t.keyword}"`;

    if (seen.has(t.keyword)) problems.push(`${label} is listed twice`);
    seen.add(t.keyword);

    const c = captures.get(t.capture);
    if (!c) {
      problems.push(`${label} cites capture "${t.capture}", which does not exist in data/keywords/`);
      continue;
    }

    // THE CORE CHECK. The keyword must actually appear inside the capture it cites. Citing a real
    // file that does not contain the term is the most likely way an invented keyword would slip
    // through, because the citation looks correct from the registry alone.
    const hit = c.keywords.find((k) => k.keyword.toLowerCase() === t.keyword.toLowerCase());
    if (!hit) {
      problems.push(`${label} is not present in capture "${t.capture}" -- the citation does not check out`);
      continue;
    }

    if (hit.search_volume === null) {
      warnings.push(`${label} was returned with NO volume; it is real but unquantified`);
    }

    if (t.slug && slugs.size && !slugs.has(t.slug)) {
      problems.push(`${label} targets slug "${t.slug}", which is not in the sitemap`);
    }
    if (!t.rationale || t.rationale.trim().length < 20) {
      problems.push(`${label} has no real rationale -- say why it is worth targeting`);
    }

    const ageDays = (Date.now() - Date.parse(c.captured_at)) / 86_400_000;
    if (ageDays > STALE_AFTER_DAYS) {
      warnings.push(`${label} rests on a capture ${Math.round(ageDays)} days old; re-pull before acting on it`);
    }
  }

  // Report.
  console.log(`\n  keyword provenance`);
  console.log(`    ${TARGET_KEYWORDS.length} targeted keyword(s), ${captures.size} capture file(s)`);

  for (const w of warnings) console.log(`    warn  ${w}`);

  if (problems.length) {
    console.error(`\n  FAILED -- ${problems.length} unbacked or malformed claim(s):`);
    for (const p of problems) console.error(`    - ${p}`);
    console.error(
      `\n  A keyword may only be listed in src/seo/targetKeywords.ts once an API has actually\n` +
      `  returned it. Capture one with:  npx tsx scripts/capture-keywords.ts --seed "<phrase>"\n`
    );
    process.exit(1);
  }

  if (!TARGET_KEYWORDS.length) {
    console.log(`    ok  registry is empty -- nothing claimed, nothing to back up`);
  } else {
    console.log(`    ok  every targeted keyword traces to a capture that contains it`);
  }
}

main();
