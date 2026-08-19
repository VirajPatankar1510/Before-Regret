// Pre-generation competitive research pass for the admin "Generate with AI" flow.
//
// This runs BEFORE buildArticlePrompt and answers two questions the article writer previously had
// to guess at: what answer is already winning this query, and what do the pages currently ranking
// for it fail to cover. The output is a plain-text brief that gets injected into the article prompt
// as strategy input (see serpBriefBlock in articleGenerator.ts).
//
// TWO HONEST LIMITS, stated here because the UI copy and the prompt below both depend on them:
//
// 1. This does NOT read Google's AI Overview. There is no API that returns AI Overview text --
//    not the Gemini API, not Search Console, not anything Google publishes. What the Google Search
//    grounding tool returns is the retrieved search results for the query plus the model's
//    synthesis of them, which is the same raw material an AI Overview is generated from, by the
//    same vendor's retrieval stack. That makes it a genuine proxy for "what answer is currently
//    being surfaced," and it is deliberately labelled that way everywhere rather than claimed to be
//    the AI Overview itself. Verified live against gemini-2.5-flash: the tool returns
//    groundingChunks with real publisher domains and a real webSearchQueries list.
//
// 2. The retrieved set is NOT a verified rank 1/2/3 ordering. groundingChunks come back in
//    retrieval order, and Google's grounding retrieval is not the same ranking as the public SERP
//    for a signed-out user in a given location. So the prompt asks for "the pages that came back
//    for this query" and the brief must never assert a specific rank position. Calling a page
//    "the #1 result" here would be exactly the kind of confident-but-unverifiable claim the rest of
//    this codebase's grounding discipline exists to prevent.
//
// The grounding chunk URIs are vertexaisearch.cloud.google.com redirect wrappers, not the
// publishers' own URLs -- the real URL is only recoverable by following the redirect. Nothing here
// publishes or cites those URIs; only the human-readable domain titles are surfaced, and only into
// the admin panel for the writer to read. No competitor URL ever reaches an article body, and the
// article's own citation rule (KNOWN_SOURCES codes only, see articleGenerator.ts HARD RULE 8) is
// untouched by any of this.

// QUOTA, and why this route needs its own message instead of the shared per-model one.
//
// This was misdiagnosed twice before the measurements below were taken, so the reasoning is
// recorded in full rather than the conclusion alone.
//
// A 429 on a grounded request has TWO distinct causes that look identical from the status code:
//
//   1. The model's own daily cap is spent. Arrives WITH a QuotaFailure detail naming it exactly
//      (GenerateRequestsPerDayPerProjectPerModel-FreeTier, quotaValue "20").
//   2. The model cannot do grounded search on this project at all. Arrives with NO detail.
//
// Measured against the REST API, all within one minute:
//
//   gemini-2.5-flash  plain -> 429 WITH the quotaValue "20" detail (cap genuinely spent)
//   gemini-3.5-flash  plain -> 200   |  + google_search -> 429, no detail
//   gemini-3.6-flash  plain -> 200   |  + google_search -> 429, no detail
//
// Case 2 is what the 3.x models are hitting, and it is not exhaustion: tool-name spelling was
// ruled out (google_search / googleSearch / googleSearchRetrieval behave identically), and the
// first grounded request ever sent to 3.5-flash was already a 429 -- when exactly one grounded
// call had been made project-wide, far too few to drain any pool. Grounded requests to
// gemini-2.5-flash worked repeatedly on the same key until its own 20/day ran out.
//
// So the accurate statement is NOT "the grounding allowance is used up" -- an earlier version of
// this message said exactly that, and it was wrong. It is: grounded search runs only on the models
// in SEARCH_GROUNDING_MODELS, and those models' own daily caps are what gate this feature.
//
// The consequence worth keeping in the copy: the admin panel's "X of 20 left" bars are per model,
// so the bar for a model that cannot ground at all is irrelevant here, and the only bar that
// matters is the one for the grounding model. Someone reading "15 left" off the wrong bar
// concludes the app is broken.
import { SEARCH_GROUNDING_MODELS } from './geminiModel.js';

export const SERP_RESEARCH_QUOTA_EXHAUSTED_MESSAGE =
  `Out of daily quota on the only model that can run a grounded search here (${SEARCH_GROUNDING_MODELS.join(', ')}). Live search doesn't work on every model -- the others return the same 429 for a grounded request even with model quota to spare, so only that model's own bar below is the one that matters for this button. Ordinary Generate (no search) still works on the other models. Resets at midnight Pacific, or enable billing on the Gemini API project to remove the cap.`;

export const SERP_RESEARCH_SYSTEM_INSTRUCTION = `You are a search strategist doing competitive reconnaissance for a US property-research publisher before it writes an article. You are not writing the article. You are reporting what is already ranking, what answer is already winning, and where the specific, exploitable gaps are.

Rules for this task:
- Report only what the search results you actually retrieved support. If the results are thin, sparse, or mostly off-topic for the query, say so plainly -- an honest "the retrieved results don't really answer this" is a useful finding, and inventing a rich competitive picture is not.
- Never claim a specific rank position ("the #1 result", "ranked third"). You retrieved a set of results; you do not know their exact ordering on a public search page. Describe them as pages that came back for this query.
- Do not invent statistics, dates, or study results when describing what a page says. Describe its angle and coverage, not fabricated specifics.
- Judge gaps concretely. "Could be more detailed" is useless. "None of them explain what the endorsement is actually called on a policy declarations page, or what triggers the exclusion" is a gap a writer can act on.`;

/**
 * @param query           the article's own title/topic -- the query a searcher would actually type.
 * @param additionalTopic DISCONNECTED (see note below) -- accepted for call-site compatibility but
 *                        no longer used. Every call researches exactly the main query with a single
 *                        Google search.
 *
 * WHY DISCONNECTED: this used to also run a second Google search, inside the same call, for the
 * "Additional topic/question to cover" field, on the reasoning that the grounding tool can run
 * multiple queries per call so it wouldn't cost extra *request* quota. That reasoning was about the
 * generate_content_free_tier_requests metric specifically. It did not rule out a separate,
 * unlabeled throttle on grounding/search volume itself -- and after this was wired in, grounded
 * calls on gemini-2.5-flash started 429'ing with a RetryInfo.retryDelay that never cleanly reset
 * even after minutes of zero traffic (see scripts/serp-batch-test.ts's fix commit for the diagnostic
 * that found this). That symptom is consistent with a rolling search-volume window, not the
 * documented 20/day request cap. Since doubling the searches per call is the one change on this path
 * that plausibly doubles pressure on such a window, it was disconnected rather than kept as a
 * suspect. If Google's docs ever confirm search volume isn't separately throttled, this can be
 * re-connected by restoring the additionalTopic branch this comment replaced (see git history).
 */
export function buildSerpResearchPrompt(query: string, additionalTopic: string = ''): string {
  void additionalTopic;
  const trimmed = query.trim();

  return `Search Google for this exact query and study what comes back:

"${trimmed}"

Then produce a brief in EXACTLY the four sections below, using these exact headings, with nothing before or after them:

CONSENSUS ANSWER
The answer the retrieved pages converge on -- written as the 2-4 sentence summary a search engine would synthesise from them and show above the results. Write it as the current incumbent answer, the one a new article has to beat. Then, in one or two additional sentences, name what is weak about it specifically: what it glosses over, over-generalises, hedges into meaninglessness, or gets close to but never actually answers.

PAGES THAT CAME BACK
For each page the search returned (up to five), one entry:
- Publisher/domain -- the angle it takes and who it is written for (an insurer's marketing page, a contractor's lead-generation post, a government page, a genuine editorial guide), then what it genuinely covers well, then what it does not cover.
Say plainly if several of them are near-identical to each other, or if most are commercial pages that answer the question only as a preamble to selling something. That pattern is itself the opening.

WHAT THEY ALL MISS
The concrete, specific gaps across the whole retrieved set -- the follow-up questions a real reader would still have after reading every one of these pages. Be specific enough that each gap could become its own section heading. Prioritise gaps that matter to someone researching a property BEFORE they buy it, since that is this publisher's actual audience and it is frequently not the audience these pages are written for.

HOW TO WIN THIS QUERY
The specific, actionable strategy: what angle the new article should take, which of the gaps above it should own, what the opening direct answer needs to say to be more useful than the consensus answer above, and what structure would serve a reader better than what these pages do. Be concrete and opinionated. Do not suggest keyword stuffing, do not suggest writing longer for its own sake, and do not suggest anything that would require inventing a statistic to pull off.`;
}

export interface SerpResearchResult {
  /** The four-section brief, verbatim from the model. */
  brief: string;
  /** Publisher domains from the grounding metadata -- real retrieved sources, not model-named. */
  sourceDomains: string[];
  /** The queries the grounding tool actually ran, which may differ from what was asked. */
  searchQueries: string[];
  model: string;
}

/**
 * Pulls the real, retrieved-source facts out of a grounded response's metadata rather than out of
 * the model's prose. The model's own list of "pages I found" is unverifiable text; groundingChunks
 * is what the retrieval layer actually returned, so the domains shown to the admin come from there.
 */
export function extractGroundingFacts(response: unknown): { sourceDomains: string[]; searchQueries: string[] } {
  const metadata = (response as { candidates?: Array<{ groundingMetadata?: unknown }> })
    ?.candidates?.[0]?.groundingMetadata as
    | { groundingChunks?: Array<{ web?: { title?: string } }>; webSearchQueries?: string[] }
    | undefined;
  const domains: string[] = [];
  for (const chunk of metadata?.groundingChunks ?? []) {
    const title = chunk?.web?.title?.trim();
    if (title && !domains.includes(title)) domains.push(title);
  }
  const searchQueries = (metadata?.webSearchQueries ?? []).filter(
    (q): q is string => typeof q === 'string' && q.trim().length > 0
  );
  return { sourceDomains: domains, searchQueries };
}
