// Experiment: can one grounded call research several article titles at once, without the briefs
// getting thinner than a single-title brief?
//
// WHY THIS MATTERS. Grounded Google Search works on exactly one model on this project
// (SEARCH_GROUNDING_MODELS in src/server/geminiModel.ts), and its free-tier cap is 20 requests a
// day. That caps "Run live search research" at 20 briefs/day. The grounding tool runs MULTIPLE
// searches per call -- already proven in production, where the article title and the additional
// question are searched in one request -- so N titles per call would multiply the ceiling by N.
// At four titles a call, 20/day becomes ~80/day, which is the difference between researching a
// 61-title queue in four days and doing it in one.
//
// The open question is quality, not mechanics. Asking for four briefs in one response could easily
// produce four shallower ones, or let one topic's competitive picture bleed into another's. That is
// exactly the failure this whole feature exists to prevent, so it has to be measured before the
// batching prompt goes anywhere near production.
//
// DELIBERATELY SELF-CONTAINED. The batched prompt lives in this file, not in serpResearch.ts.
// Production keeps its verified one-title-per-call path until this experiment says otherwise --
// an untested prompt shape must not be sitting in the module the admin panel calls.
//
// COST: 2 grounded calls out of the day's 20 (one control, one batch). Run it after the quota
// resets at 00:00 Pacific, and not alongside other research work.
//
//   npx tsx scripts/serp-batch-test.ts
//
// Writes .tmp-serp-batch-control.txt and .tmp-serp-batch-batched.txt for side-by-side reading, and
// prints the comparison numbers. Judging depth is a human read of those two files; the numbers here
// only say whether it is worth reading them.
import 'dotenv/config';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import {
  SERP_RESEARCH_SYSTEM_INSTRUCTION,
  buildSerpResearchPrompt,
  extractGroundingFacts,
} from '../src/server/serpResearch.js';
import { SEARCH_GROUNDING_MODELS } from '../src/server/geminiModel.js';

// Four real titles from the approved queue, deliberately all from ONE cluster (radon). Same-cluster
// batching is the realistic use -- the queue is written as clusters, and it is also the HARDEST
// case for bleed, since four adjacent radon questions share much of their SERP. If separation holds
// here it holds for unrelated titles; if it fails here, batching is only safe across clusters.
const TITLES = [
  "What Counts as a Safe Radon Level in a House You're Buying?",
  'What Does a Radon Mitigation System Actually Do?',
  'How Long Does a Radon Test Take Before Closing?',
  "Does a Finished Basement Change a House's Radon Risk?",
];

const SECTION_HEADS = ['CONSENSUS ANSWER', 'PAGES THAT CAME BACK', 'WHAT THEY ALL MISS', 'HOW TO WIN THIS QUERY'];

function buildBatchedPrompt(titles: string[]): string {
  return `You are researching ${titles.length} separate articles in one pass. Run a SEPARATE Google search for EACH of the following queries -- all ${titles.length} of them, individually, not one combined search:

${titles.map((t, i) => `${i + 1}. "${t}"`).join('\n')}

Then produce ${titles.length} completely separate briefs, one per query, in the order listed above. Begin each with a line reading exactly:

=== BRIEF <n>: <the query, copied verbatim> ===

and then the same four sections, with these exact headings, that a single brief uses:

CONSENSUS ANSWER
The answer the retrieved pages converge on for THIS query -- the 2-4 sentence summary a search engine would synthesise and show above the results, written as the incumbent answer a new article has to beat. Then one or two sentences on what is specifically weak about it.

PAGES THAT CAME BACK
For each page returned for THIS query (up to five): publisher/domain, the angle it takes and who it is written for, what it covers well, what it does not cover. Say plainly if several are near-identical, or if most are commercial pages answering the question only as a preamble to selling something.

WHAT THEY ALL MISS
The concrete gaps across the retrieved set for THIS query, specific enough that each could become a section heading. Prioritise gaps that matter to someone researching a property BEFORE buying it.

HOW TO WIN THIS QUERY
The specific, opinionated strategy for THIS query: the angle, which gaps to own, what the opening direct answer must say to beat the consensus answer, and what structure serves a reader better. No keyword stuffing, no writing longer for its own sake, nothing that needs an invented statistic.

CRITICAL -- these queries are closely related and it would be easy to blur them together. Do not. Each brief must stand alone and be about its own query only. Do not write "as noted above", do not cross-reference another brief, and do not let one query's pages or gaps be reported under another's. If two queries genuinely return the same page, describe it separately under each, in terms of what it does for that specific query. Give every brief the same depth you would give it if it were the only one you had been asked for -- a batch is not a reason for any one of them to be shorter or vaguer.`;
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set.');
  const model = SEARCH_GROUNDING_MODELS[0];
  const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });

  // A 429 on this model is NOT automatically a spent daily cap. The free tier also enforces a
  // short-window burst throttle that comes back as 429 with the SAME misleading
  // "...PerDayPerProjectPerModel..." quotaId but a RetryInfo.retryDelay of only ~20s -- proven by
  // a diagnostic where a single wait-and-retry succeeded on a "quota exhausted" key. A rejected 429
  // does not consume the daily allowance, so honoring Google's own retryDelay (bounded) costs
  // nothing and is what keeps two back-to-back grounded calls -- exactly what this script makes --
  // from being misread as the day being over. A genuinely spent daily cap still surfaces: its
  // retryDelay is hours, so it exceeds MAX_RETRY_WAIT and is rethrown rather than waited out.
  const MAX_RETRY_WAIT_S = 90;
  const parseRetrySeconds = (err: any): number | null => {
    const msg = String(err?.message ?? '');
    const m = msg.match(/retry in ([\d.]+)s/i) || msg.match(/"retryDelay":\s*"(\d+)s"/);
    return m ? Math.ceil(parseFloat(m[1])) : null;
  };
  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const call = async (contents: string) => {
    for (let attempt = 1; ; attempt++) {
      try {
        const r: any = await ai.models.generateContent({
          model,
          contents,
          config: { systemInstruction: SERP_RESEARCH_SYSTEM_INSTRUCTION, temperature: 0.2, tools: [{ googleSearch: {} }] },
        });
        const text = typeof r.text === 'string' ? r.text : '';
        return { text, facts: extractGroundingFacts(r), usage: r.usageMetadata, finish: r.candidates?.[0]?.finishReason };
      } catch (err: any) {
        const retry = parseRetrySeconds(err);
        // Retry only a short-window 429 (bounded retryDelay), and only a couple of times. A missing
        // retryDelay, an over-long one (the real daily reset), or a non-429 falls straight through.
        if (err?.status === 429 && retry !== null && retry <= MAX_RETRY_WAIT_S && attempt <= 3) {
          const wait = retry + 5;
          console.log(`   429 short-window throttle (retryDelay ${retry}s); waiting ${wait}s and retrying (attempt ${attempt})...`);
          await sleep(wait * 1000);
          continue;
        }
        throw err;
      }
    }
  };

  console.log(`model: ${model}\n`);

  // CONTROL: title 1 on its own, through the exact production prompt. This is the bar -- a batched
  // brief for the same title is only acceptable if it stands up next to this one.
  console.log('1/2  control (single title, production prompt)...');
  const control = await call(buildSerpResearchPrompt(TITLES[0]));
  if (!control.text.trim()) throw new Error('Control returned empty text -- rerun; that is the known intermittent empty response.');
  fs.writeFileSync('.tmp-serp-batch-control.txt', control.text);

  console.log(`2/2  batch (${TITLES.length} titles, one call)...`);
  const batched = await call(buildBatchedPrompt(TITLES));
  if (!batched.text.trim()) throw new Error('Batch returned empty text -- rerun.');
  fs.writeFileSync('.tmp-serp-batch-batched.txt', batched.text);

  // Split the batched output per title so each can be measured against the control on its own.
  const parts = batched.text.split(/^=== BRIEF \d+:/m).slice(1);

  console.log('\n--- SEARCHES ACTUALLY RUN ---');
  console.log(`control: ${JSON.stringify(control.facts.searchQueries)}`);
  console.log(`batch  : ${batched.facts.searchQueries.length} queries -> ${JSON.stringify(batched.facts.searchQueries)}`);
  // The single most important mechanical check. If the batch ran fewer searches than titles, some
  // briefs were written from another title's results or from the model's own memory -- which is the
  // ungrounded-guess failure this feature exists to avoid, and would sink batching outright.
  console.log(batched.facts.searchQueries.length >= TITLES.length
    ? `PASS: at least one search per title (${batched.facts.searchQueries.length} >= ${TITLES.length})`
    : `FAIL: ${batched.facts.searchQueries.length} searches for ${TITLES.length} titles -- some brief was not actually researched`);

  console.log('\n--- DEPTH PER BRIEF (chars; control is the bar) ---');
  console.log(`control              : ${control.text.length}`);
  parts.forEach((p, i) => {
    const missing = SECTION_HEADS.filter((h) => !p.includes(h));
    const pct = Math.round((p.length / control.text.length) * 100);
    console.log(`batch brief ${i + 1}        : ${p.length}  (${pct}% of control)${missing.length ? `  MISSING SECTIONS: ${missing.join(', ')}` : ''}`);
  });
  if (parts.length !== TITLES.length) console.log(`FAIL: parsed ${parts.length} briefs, expected ${TITLES.length}`);

  console.log('\n--- SOURCES ---');
  console.log(`control domains: ${control.facts.sourceDomains.join(', ')}`);
  console.log(`batch domains  : ${batched.facts.sourceDomains.join(', ')}`);

  console.log('\n--- COST ---');
  const cost = (u: any) => `prompt=${u?.promptTokenCount} output=${u?.candidatesTokenCount} thinking=${u?.thoughtsTokenCount} total=${u?.totalTokenCount}`;
  console.log(`control: ${cost(control.usage)} finish=${control.finish}`);
  console.log(`batch  : ${cost(batched.usage)} finish=${batched.finish}`);
  // Truncation would silently produce a short final brief that looks like thin writing rather than
  // a cut-off response, so it is called out explicitly rather than left to the length numbers.
  if (batched.finish && batched.finish !== 'STOP') console.log(`FAIL: batch finishReason ${batched.finish} -- output was cut off, not merely brief`);

  console.log('\nWrote .tmp-serp-batch-control.txt and .tmp-serp-batch-batched.txt.');
  console.log('Now READ both: the numbers cannot tell you whether brief 1 is as specific and as');
  console.log('genuinely about its own query as the control, and that judgement is the actual result.');
}

main().catch((err) => {
  // A short-window 429 is already waited out and retried inside call(). Reaching here with a 429
  // means the retryDelay was too long to be a burst throttle -- i.e. the daily cap really is spent
  // and won't clear until the 00:00 Pacific reset. Any other error prints as-is.
  console.error('\nFAILED:', err?.status === 429
    ? '429 after bounded retry -- the retryDelay was hours, so the daily cap is genuinely spent; reset is 00:00 Pacific.'
    : err);
  process.exit(1);
});
