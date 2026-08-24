// Scores how hard a query looks to rank for ORGANICALLY, by reading who already ranks.
//
//   npx tsx scripts/organic-difficulty.ts "knob and tube wiring" "knob and tube fuse box"
//   npx tsx scripts/organic-difficulty.ts --file queries.txt
//
// SOURCES, best first: Serper.dev (SERPER_API_KEY -- 2500 free queries, no card, real positions),
// then DataForSEO (DATAFORSEO_LOGIN/PASSWORD), then Gemini grounded search as a last resort. Only
// the first two return ranks; the fallback does not, and the report says which one produced a run.
//
// WHY THIS EXISTS. Google Ads Keyword Planner's "Competition" column, which is the only difficulty
// signal this project had, measures ADVERTISER BIDDING -- how many people buy that keyword -- not
// how hard the organic result set is to break into. The two routinely disagree: "knob and tube
// wiring" reports Low competition in Keyword Planner while its organic SERP carries Wikipedia at
// position 2. Acting on the paid number alone would have read an unwinnable SERP as an easy one.
//
// WHAT IT ACTUALLY MEASURES. There is no free API that returns a real difficulty score, and the
// paid ones (Ahrefs KD, Semrush KD) derive theirs mostly from backlink profiles this project has no
// access to. What IS observable for free is the composition of the result set, which is the same
// evidence a human uses when eyeballing a SERP: a page-one carrying forum threads, a lead-gen
// contractor blog, or a page that does not actually answer the query is page-one that Google filled
// because it could not find something better. That is a real, checkable signal of an opening. A
// page-one of Wikipedia, .gov, and dedicated guides from major associations is the opposite.
//
// So this reports a WEAKNESS SCORE over the retrieved set, and prints the classification for every
// domain so the number is auditable rather than trusted blind. It is a triage tool for ranking a
// candidate list, not a precise metric -- treat a 2-point gap as noise and a 40-point gap as real.
//
// HONEST LIMITS, worth knowing before acting on the output:
//   - Grounded retrieval is not a rank-tracker. The domains come back without positions, so a weak
//     domain at #9 and a weak domain at #1 count the same here. Position matters and this misses it.
//   - The retrieved set is typically 5-10 domains, not a full page one.
//   - Domain tiers below are a hand-maintained list. An unrecognised domain scores as neutral, so a
//     major publisher not on the list will make a SERP look weaker than it is. Add to it over time.
//   - None of this measures the one thing that actually gates this site today: its own domain
//     authority. A genuinely low-difficulty SERP is still not winnable this month if Google will not
//     index the page. Use this to CHOOSE among candidates, not to predict that any of them will rank.
import 'dotenv/config';
import fs from 'fs';
import {
  SERP_RESEARCH_SYSTEM_INSTRUCTION,
  buildSerpResearchPrompt,
  extractGroundingFacts,
} from '../src/server/serpResearch.js';
import { isDataForSeoConfigured, fetchSerpResults } from '../src/server/dataForSeoService.js';
import { isSerperConfigured, fetchSerperResults } from '../src/server/serperService.js';

/** Domains whose presence means the query is genuinely contested. Points are subtracted. */
const STRONG: Array<{ match: RegExp; label: string; weight: number }> = [
  { match: /\bwikipedia\.org$/i, label: 'Wikipedia', weight: 30 },
  { match: /\.gov$|\.gov\./i, label: 'government', weight: 30 },
  { match: /\.edu$|\.edu\./i, label: 'university', weight: 20 },
  { match: /\b(nachi|internachi)\.org$/i, label: 'InterNACHI (industry body)', weight: 15 },
  { match: /\bhomeinspector\.org$/i, label: 'ASHI (industry body)', weight: 15 },
  { match: /\b(nfpa|epa|cpsc|fema|noaa|hud|cdc|usgs)\.(org|gov)$/i, label: 'standards/agency', weight: 25 },
  { match: /\b(zillow|realtor|redfin|trulia|homes)\.com$/i, label: 'major portal', weight: 25 },
  { match: /\b(forbes|nytimes|wsj|washingtonpost|cnn|bbc)\.com$/i, label: 'major publisher', weight: 25 },
  { match: /\b(nerdwallet|bankrate|investopedia|thisoldhouse|bobvila|familyhandyman)\.com$/i, label: 'major vertical publisher', weight: 20 },
  { match: /\b(consumerreports|angi|homeadvisor|thumbtack)\.com$/i, label: 'large commercial aggregator', weight: 12 },
  // Mortgage and banking brands dominate loan-adjacent inspection queries (FHA/VA checklists in
  // particular). Added after a first run scored rocketmortgage.com and chase.com as "unrecognised",
  // which made a lender-dominated SERP read as neutral when it is anything but.
  { match: /\b(rocketmortgage|quickenloans|lendingtree|freedommortgage|guildmortgage|pennymac|loandepot)\.com$/i, label: 'major mortgage lender', weight: 22 },
  { match: /\b(chase|bankofamerica|wellsfargo|citi|usbank|pnc|truist)\.com$/i, label: 'major bank', weight: 22 },
  { match: /\b(fha|hud|va|benefits)\.(com|gov)$/i, label: 'loan-program authority', weight: 20 },
  { match: /\b(valoannetwork|veteransunited|navyfederal)\.(com|org)$/i, label: 'VA-loan specialist', weight: 15 },
];

/** Domains whose presence means Google is filling page one with whatever it can find. Points added. */
const WEAK: Array<{ match: RegExp; label: string; weight: number }> = [
  { match: /\breddit\.com$/i, label: 'Reddit (UGC)', weight: 25 },
  { match: /\b(quora|answers\.yahoo)\.com$/i, label: 'Q&A site (UGC)', weight: 25 },
  { match: /forums?\./i, label: 'forum thread', weight: 25 },
  { match: /\bstackexchange\.com$|\bstackoverflow\.com$/i, label: 'Stack Exchange (UGC)', weight: 15 },
  { match: /\b(pinterest|facebook|youtube)\.com$/i, label: 'social/video', weight: 10 },
];

type Verdict = { label: string; weight: number; kind: 'strong' | 'weak' | 'neutral' };

/** Small local business sites -- electricians, inspectors, HVAC -- are the commonest weak page-one
 *  filler in this niche. Detected by shape (llc/electric/plumbing/inspection in the host) rather
 *  than by name, since the long tail of them cannot be enumerated. */
function looksLikeSmallTradeSite(host: string): boolean {
  return /(electric|plumb|hvac|inspect|heating|cooling|roofing|contractor|remodel|restoration)/i.test(host)
    && !/\b(nachi|internachi|homeinspector|ashi)\b/i.test(host);
}

function classify(domain: string): Verdict {
  const host = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  for (const s of STRONG) if (s.match.test(host)) return { label: s.label, weight: -s.weight, kind: 'strong' };
  for (const w of WEAK) if (w.match.test(host)) return { label: w.label, weight: w.weight, kind: 'weak' };
  if (looksLikeSmallTradeSite(host)) return { label: 'small trade/lead-gen site', weight: 18, kind: 'weak' };
  return { label: 'unrecognised (neutral)', weight: 0, kind: 'neutral' };
}

interface Scored {
  query: string;
  score: number;
  domains: Array<{ domain: string; verdict: Verdict; position?: number }>;
  /** Which data source produced this row -- the two are not comparable and the report says so. */
  source: 'serp' | 'grounding';
  error?: string;
}

/**
 * Position weighting, used only when real SERP ranks are available.
 *
 * Without ranks every retrieved domain counts the same, which was this tool's single worst defect:
 * a forum thread at #9 and a forum thread at #1 say very different things about whether a query is
 * winnable, and averaging them flat erases that difference. Weighted so the top of page one
 * dominates -- #1 counts ~3x a #10 -- because that is where the click share and the actual barrier
 * to entry live.
 */
function positionWeight(position: number): number {
  if (position <= 0) return 1;
  return 1 + 2 / Math.sqrt(position);
}

/** 0 = looks contested, 100 = looks wide open. Centred at 50 so a fully neutral set reads as
 *  "no signal either way" rather than as an easy win. */
function scoreOf(entries: Array<{ verdict: Verdict; position?: number }>): number {
  if (entries.length === 0) return 50;
  let weighted = 0;
  let totalWeight = 0;
  for (const e of entries) {
    const w = e.position !== undefined ? positionWeight(e.position) : 1;
    weighted += e.verdict.weight * w;
    totalWeight += w;
  }
  const avg = weighted / totalWeight;
  return Math.max(0, Math.min(100, Math.round(50 + avg * 1.6)));
}

function band(score: number): string {
  if (score >= 70) return 'LOOKS OPEN';
  if (score >= 55) return 'mixed, leaning open';
  if (score >= 45) return 'mixed';
  if (score >= 30) return 'mixed, leaning contested';
  return 'LOOKS CONTESTED';
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set.');

  const args = process.argv.slice(2);
  let queries: string[];
  const fileIdx = args.indexOf('--file');
  if (fileIdx !== -1) {
    const path = args[fileIdx + 1];
    if (!path) throw new Error('--file needs a path.');
    queries = fs.readFileSync(path, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean);
  } else {
    queries = args.filter((a) => !a.startsWith('--'));
  }
  if (queries.length === 0) throw new Error('Pass at least one query, or --file <path>.');

  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });

  // The free tier allows 5 requests/minute on this model, so calls must be spaced ~12s apart. A
  // first version used a 1.2s delay and burned through the quota after six queries, failing every
  // remaining one -- the pacing is not politeness, it is the difference between a complete run and
  // a half-empty result table.
  const MIN_SPACING_MS = 13000;
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  /** A 429 carries the wait it wants in its own message; obey that rather than guessing. */
  const parseRetrySeconds = (err: any): number | null => {
    const m = String(err?.message ?? '').match(/retry in ([\d.]+)s/i) || String(err?.message ?? '').match(/"retryDelay":\s*"(\d+)s"/);
    return m ? Math.ceil(parseFloat(m[1])) : null;
  };

  const results: Scored[] = [];

  // Source preference, best first. Either real-SERP path fixes all three defects of the grounding
  // fallback (no positions, a 5 req/min free-tier wall, and ~40% of queries returning no domains).
  // Serper is preferred over DataForSEO for this particular job: it answers the same question at
  // this scale on a no-card free tier, while DataForSEO needs a verified account with a $50 minimum
  // before it responds at all. DataForSEO earns its place elsewhere (backlinks), not here.
  const serpSource: { name: string; run: (q: string) => Promise<Array<{ domain: string; position: number }>> } | null =
    isSerperConfigured()
      ? { name: 'Serper.dev', run: (q) => fetchSerperResults(q, { num: 10 }) }
      : isDataForSeoConfigured()
        ? { name: 'DataForSEO', run: (q) => fetchSerpResults(q, { depth: 10 }) }
        : null;

  if (serpSource) {
    console.log(`Using ${serpSource.name} SERP data (real positions).\n`);
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      process.stdout.write(`[${i + 1}/${queries.length}] ${query} ... `);
      try {
        const serp = await serpSource.run(query);
        const domains = serp.map((r) => ({ domain: r.domain, verdict: classify(r.domain), position: r.position }));
        if (domains.length === 0) {
          results.push({ query, score: -2, domains: [], source: 'serp', error: 'SERP returned no organic results' });
          console.log('no organic results -- NO DATA');
        } else {
          const score = scoreOf(domains);
          results.push({ query, score, domains, source: 'serp' });
          console.log(`${domains.length} results, score ${score}`);
        }
      } catch (e: any) {
        results.push({ query, score: -1, domains: [], source: 'serp', error: e?.message || String(e) });
        console.log(`FAILED (${String(e?.message || e).slice(0, 90)})`);
      }
    }
    report(results);
    return;
  }

  console.log('No SERP API configured (set SERPER_API_KEY) -- falling back to grounded search (no positions, quota-limited).\n');
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    process.stdout.write(`[${i + 1}/${queries.length}] ${query} ... `);
    let done = false;
    for (let attempt = 1; attempt <= 3 && !done; attempt++) {
      try {
        const r: any = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: buildSerpResearchPrompt(query),
          config: { systemInstruction: SERP_RESEARCH_SYSTEM_INSTRUCTION, temperature: 0.2, tools: [{ googleSearch: {} }] },
        });
        const { sourceDomains } = extractGroundingFacts(r);
        const domains = sourceDomains.map((d) => ({ domain: d, verdict: classify(d) }));
        // No retrieved domains is NOT a mid-range score -- it is an absence of evidence, and
        // scoring it 50 would rank it alongside genuinely-measured mixed SERPs. Marked -2 and
        // reported separately so it can never be mistaken for a measurement.
        if (domains.length === 0) {
          results.push({ query, score: -2, domains: [], source: 'grounding', error: 'grounding returned no domains' });
          console.log('no domains retrieved -- NO DATA');
        } else {
          const score = scoreOf(domains);
          results.push({ query, score, domains, source: 'grounding' });
          console.log(`${domains.length} domains, score ${score}`);
        }
        done = true;
      } catch (e: any) {
        const retry = parseRetrySeconds(e);
        if (e?.status === 429 && retry !== null && attempt < 3) {
          console.log(`rate-limited, waiting ${retry + 3}s`);
          await sleep((retry + 3) * 1000);
          process.stdout.write(`[${i + 1}/${queries.length}] ${query} (retry ${attempt}) ... `);
          continue;
        }
        results.push({ query, score: -1, domains: [], source: 'grounding', error: e?.message || String(e) });
        console.log(`FAILED (${String(e?.message || e).slice(0, 90)})`);
        done = true;
      }
    }
    if (i < queries.length - 1) await sleep(MIN_SPACING_MS);
  }

  report(results);
}

function report(results: Scored[]) {
  const usedSerp = results.some((r) => r.source === 'serp');
  console.log(`\n${'='.repeat(74)}\nRANKED BY APPARENT OPENNESS (higher = weaker result set = better opening)\n${'='.repeat(74)}`);
  for (const r of results.filter((x) => x.score >= 0).sort((a, b) => b.score - a.score)) {
    console.log(`\n  ${String(r.score).padStart(3)}  ${band(r.score).padEnd(26)} "${r.query}"`);
    for (const { domain, verdict, position } of r.domains) {
      const sign = verdict.kind === 'weak' ? '+' : verdict.kind === 'strong' ? '-' : ' ';
      const pos = position !== undefined ? `#${String(position).padEnd(2)} ` : '';
      console.log(`         ${sign} ${pos}${domain}  [${verdict.label}]`);
    }
  }
  const noData = results.filter((x) => x.score === -2);
  if (noData.length) {
    console.log(`\n--- ${noData.length} NO DATA (nothing retrieved -- not a score of 50) ---`);
    for (const f of noData) console.log(`  ${f.query}`);
  }
  const failed = results.filter((x) => x.score === -1);
  if (failed.length) {
    console.log(`\n--- ${failed.length} FAILED ---`);
    for (const f of failed) console.log(`  ${f.query}: ${String(f.error).slice(0, 120)}`);
  }

  if (usedSerp) {
    console.log(`\nScored from real SERP positions, weighted so the top of page one dominates.`);
    console.log(`Still a triage aid, not a difficulty metric: it reads who ranks, and says nothing`);
    console.log(`about this site's own authority, which is the thing actually gating it today.`);
  } else {
    console.log(`\nScores are a triage aid over the retrieved set, not a rank-tracked metric --`);
    console.log(`this fallback path returns domains WITHOUT positions, so a weak result at #9 counts`);
    console.log(`the same as one at #1. Set SERPER_API_KEY (free tier, no card) for real ranked data.`);
  }
}

main().catch((e) => { console.error(e?.message || e); process.exit(1); });
