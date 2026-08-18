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
// Google Search grounding is metered SEPARATELY from the per-model request allowance, and the two
// run out independently. Verified directly against the REST API, same key, same minute:
//
//   gemini-3.5-flash, plain request                 -> 200
//   gemini-3.5-flash, same request + google_search  -> 429
//   gemini-3.6-flash, plain request                 -> 200
//   gemini-3.6-flash, same request + google_search  -> 429
//   gemini-2.5-flash, plain request                 -> 429, and this one names its quota:
//       GenerateRequestsPerDayPerProjectPerModel-FreeTier, quotaValue "20"
//
// So the model-quota 429 arrives with a quotaMetric/quotaValue naming exactly what was hit, while
// the grounding 429 arrives with no violation details at all -- indistinguishable from the other
// by status code alone, and pointing at a different, project-wide allowance.
//
// The practical consequence, and the reason this is written down: the admin panel's "X of 20 left"
// counters track model requests, so when the grounding allowance is what's exhausted, this feature
// fails hard while those counters still show plenty remaining and never move. That is not a bug in
// the counters -- a grounded call rejected at the quota gate never reaches the model, spends no
// model quota, and correctly logs nothing. Reusing the generic "quota used up on every fallback
// model" copy here sends someone straight to those counters to check a number that cannot explain
// what they are seeing. Confirmed live: that is exactly what happened.
export const SERP_RESEARCH_QUOTA_EXHAUSTED_MESSAGE =
  "Google Search grounding's daily free-tier allowance is used up. That's a separate, project-wide limit from the per-model counters below -- those can still show calls remaining while this is exhausted, because a grounded call rejected at the quota gate never reaches the model. Ordinary Generate (no search) may still work. Resets tomorrow, or enable billing on the Gemini API project to remove the cap.";

export const SERP_RESEARCH_SYSTEM_INSTRUCTION = `You are a search strategist doing competitive reconnaissance for a US property-research publisher before it writes an article. You are not writing the article. You are reporting what is already ranking, what answer is already winning, and where the specific, exploitable gaps are.

Rules for this task:
- Report only what the search results you actually retrieved support. If the results are thin, sparse, or mostly off-topic for the query, say so plainly -- an honest "the retrieved results don't really answer this" is a useful finding, and inventing a rich competitive picture is not.
- Never claim a specific rank position ("the #1 result", "ranked third"). You retrieved a set of results; you do not know their exact ordering on a public search page. Describe them as pages that came back for this query.
- Do not invent statistics, dates, or study results when describing what a page says. Describe its angle and coverage, not fabricated specifics.
- Judge gaps concretely. "Could be more detailed" is useless. "None of them explain what the endorsement is actually called on a policy declarations page, or what triggers the exclusion" is a gap a writer can act on.`;

export function buildSerpResearchPrompt(query: string): string {
  const trimmed = query.trim();
  return `Search Google for this exact query and study what comes back:

"${trimmed}"

Then produce a brief in EXACTLY the four sections below, using these exact headings, with nothing before or after:

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
