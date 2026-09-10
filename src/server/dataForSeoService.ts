// DataForSEO API v3 -- read-only helpers for SERP positions and backlink profiles.
//
// WHY THIS EXISTS. Two things this project needs have no free source:
//
//   1. SERP RESULTS WITH POSITIONS. scripts/organic-difficulty.ts scores how contested a query
//      looks by reading who ranks, but its underlying source (Gemini grounded search) returns
//      domains with no rank attached, so a weak site at #9 and a weak site at #1 score identically.
//      That is the single biggest defect in that tool, and it is not fixable without real SERP data.
//   2. BACKLINK PROFILES. Bing's GetLinkCounts confirms this site has zero backlinks, which is the
//      likeliest reason Google leaves most of its pages in "Discovered - currently not indexed".
//      Knowing *who links to the sites that outrank us* is what turns outreach from hand-researching
//      one target at a time into a real list. Nothing free exposes that.
//
// COST. Pay-as-you-go, no subscription. SERP live mode is ~$0.002/query; backlinks are ~$0.06 per
// 1000 rows. A full sweep of this project's ~107 candidate keywords is roughly $0.21. That is the
// entire reason this is worth wiring up rather than paying a per-seat SEO suite -- but it IS real
// money per call, so every function here is deliberately explicit about how much data it requests
// (`limit`) rather than defaulting to the API's maximum.
//
// Read-only by construction: every endpoint used here retrieves data. Nothing in this file writes
// to DataForSEO or to this project's own database.
const BASE = 'https://api.dataforseo.com/v3';

export function isDataForSeoConfigured(): boolean {
  return Boolean(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD);
}

/** DataForSEO uses HTTP Basic with the API credentials from app.dataforseo.com/api-access --
 *  these are API-access credentials, NOT the dashboard login, and they are distinct from the
 *  account password. */
function authHeader(): string {
  const login = process.env.DATAFORSEO_LOGIN!;
  const password = process.env.DATAFORSEO_PASSWORD!;
  return `Basic ${Buffer.from(`${login}:${password}`).toString('base64')}`;
}

/**
 * Every v3 endpoint wraps its payload in the same envelope: a top-level status_code, then a
 * `tasks` array whose entries carry their OWN status_code and a `result` array. A request can
 * return HTTP 200 with a top-level 20000 while an individual task failed -- so both levels are
 * checked here rather than trusting the HTTP status, which is exactly the kind of partial failure
 * that otherwise reads downstream as "this domain has no backlinks".
 */
async function post<T>(path: string, body: unknown[]): Promise<T[]> {
  if (!isDataForSeoConfigured()) {
    throw new Error('DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD are not set.');
  }
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) {
    throw new Error(`DataForSEO ${path} failed (HTTP ${res.status}): ${(await res.text()).slice(0, 300)}`);
  }
  const json = (await res.json()) as {
    status_code?: number;
    status_message?: string;
    tasks?: Array<{ status_code?: number; status_message?: string; result?: T[] | null }>;
  };
  if (json.status_code !== 20000) {
    throw new Error(`DataForSEO ${path} error ${json.status_code}: ${json.status_message}`);
  }
  const task = json.tasks?.[0];
  if (!task) throw new Error(`DataForSEO ${path} returned no tasks.`);
  if (task.status_code !== 20000) {
    throw new Error(`DataForSEO ${path} task error ${task.status_code}: ${task.status_message}`);
  }
  return task.result ?? [];
}

// --- SERP ---------------------------------------------------------------------------------------

export interface SerpOrganicResult {
  /** Position among organic results specifically (rank_group), which is what "ranking #3" means
   *  colloquially. rank_absolute counts ads and SERP features too and is not comparable. */
  position: number;
  domain: string;
  url: string;
  title: string;
}

/**
 * Live Google organic results for one query, WITH positions.
 *
 * Defaults to the United States / English because every keyword this project researches is a US
 * property-buying query; a default-locale SERP would silently answer a different question. Costs
 * roughly $0.002 per call in live mode.
 */
export async function fetchSerpResults(
  keyword: string,
  opts: { locationName?: string; languageCode?: string; depth?: number } = {}
): Promise<SerpOrganicResult[]> {
  const result = await post<{ items?: Array<Record<string, unknown>> }>(
    '/serp/google/organic/live/advanced',
    [{
      keyword,
      location_name: opts.locationName ?? 'United States',
      language_code: opts.languageCode ?? 'en',
      depth: opts.depth ?? 20,
    }]
  );
  const items = result[0]?.items ?? [];
  return items
    .filter((i) => i.type === 'organic')
    .map((i) => ({
      position: Number(i.rank_group ?? 0),
      domain: String(i.domain ?? ''),
      url: String(i.url ?? ''),
      title: String(i.title ?? ''),
    }))
    .filter((i) => i.domain);
}

// --- Backlinks ----------------------------------------------------------------------------------

export interface BacklinkCompetitor {
  /** A domain whose backlink profile overlaps the target's. */
  domain: string;
  /** DataForSEO's own domain-authority score for that domain. */
  rank: number;
  /** How many referring domains it shares with the target. */
  intersections: number;
}

/** Domains that share part of a target's backlink profile -- i.e. who competes for the same links. */
export async function fetchBacklinkCompetitors(target: string, limit = 50): Promise<BacklinkCompetitor[]> {
  const result = await post<{ items?: Array<Record<string, unknown>> }>(
    '/backlinks/competitors/live',
    [{ target, limit, exclude_large_domains: true, main_domain: true, order_by: ['intersections,desc'] }]
  );
  return (result[0]?.items ?? []).map((i) => ({
    domain: String(i.target ?? ''),
    rank: Number(i.rank ?? 0),
    intersections: Number(i.intersections ?? 0),
  })).filter((i) => i.domain);
}

export interface ReferringDomain {
  domain: string;
  /** DataForSEO domain-authority score, 0-1000 on the default scale. */
  rank: number;
  backlinks: number;
  /** True when every link from this domain is nofollow -- worth knowing before spending outreach
   *  effort, though a nofollow link from a genuinely relevant site is still worth having. */
  isBroken: boolean;
  firstSeen: string | null;
}

/**
 * The domains linking TO a target. Run against a competitor rather than against this site (which
 * has none), this is the actual outreach list: every one of these is a real publisher that has
 * already chosen to link to a site in this niche.
 */
export async function fetchReferringDomains(target: string, limit = 100): Promise<ReferringDomain[]> {
  const result = await post<{ items?: Array<Record<string, unknown>> }>(
    '/backlinks/referring_domains/live',
    [{ target, limit, order_by: ['rank,desc'], exclude_internal_backlinks: true }]
  );
  return (result[0]?.items ?? []).map((i) => ({
    domain: String(i.domain ?? ''),
    rank: Number(i.rank ?? 0),
    backlinks: Number(i.backlinks ?? 0),
    isBroken: Boolean(i.is_broken ?? false),
    firstSeen: (i.first_seen as string) ?? null,
  })).filter((i) => i.domain);
}

export interface BacklinkSummary {
  target: string;
  rank: number;
  backlinks: number;
  referringDomains: number;
  referringMainDomains: number;
}

/** Headline backlink numbers for one domain -- the cheapest way to size up a competitor. */
export async function fetchBacklinkSummary(target: string): Promise<BacklinkSummary | null> {
  const result = await post<Record<string, unknown>>('/backlinks/summary/live', [{ target, main_domain: true }]);
  const r = result[0];
  if (!r) return null;
  return {
    target: String(r.target ?? target),
    rank: Number(r.rank ?? 0),
    backlinks: Number(r.backlinks ?? 0),
    referringDomains: Number(r.referring_domains ?? 0),
    referringMainDomains: Number(r.referring_main_domains ?? 0),
  };
}

// --- Keywords -----------------------------------------------------------------------------------
//
// WHY THIS SECTION EXISTS, and it is not a nice-to-have. Every other kind of number in this project
// is sourced: costs come from src/engine/inspectionPriorities.ts, positions come from fetchSerpResults
// above, backlink counts come from the endpoints above. KEYWORDS WERE THE ONE EXCEPTION -- they were
// being reasoned out rather than measured, which is a polite way of saying invented. A search volume
// that came from judgement rather than an API is indistinguishable, once written into a script, from
// one that was measured, and it is wrong far more often than it feels wrong.
//
// These two functions close that gap, and scripts/assert-keyword-provenance.ts makes closing it
// mandatory rather than optional.

export interface KeywordVolume {
  keyword: string;
  /** Google Ads average monthly searches. NULL IS MEANINGFUL and is preserved rather than coerced
   *  to 0: it means Google returned no volume for this term, which is a different fact from "this
   *  term is searched zero times" and must not be silently rounded into it. */
  searchVolume: number | null;
  /** Google Ads competition for ADVERTISERS. This is not ranking difficulty and the two are
   *  routinely confused -- see docs/organic-difficulty notes. Kept because it is returned, not
   *  because it answers "can we rank". */
  competition: string | null;
  competitionIndex: number | null;
  cpc: number | null;
  lowTopOfPageBid: number | null;
  highTopOfPageBid: number | null;
}

/**
 * Real Google Ads search volumes for a batch of keywords.
 *
 * Batched deliberately: this endpoint prices per REQUEST, not per keyword, so one call carrying
 * 200 terms costs the same as one carrying 2. Ask for everything at once.
 */
export async function fetchKeywordVolumes(
  keywords: string[],
  opts: { locationName?: string; languageCode?: string } = {}
): Promise<KeywordVolume[]> {
  if (!keywords.length) return [];
  if (keywords.length > 1000) throw new Error('DataForSEO accepts at most 1000 keywords per request.');
  const result = await post<Record<string, unknown>>('/keywords_data/google_ads/search_volume/live', [{
    keywords,
    location_name: opts.locationName ?? 'United States',
    language_code: opts.languageCode ?? 'en',
  }]);
  return result.map((r) => ({
    keyword: String(r.keyword ?? ''),
    searchVolume: r.search_volume == null ? null : Number(r.search_volume),
    competition: r.competition == null ? null : String(r.competition),
    competitionIndex: r.competition_index == null ? null : Number(r.competition_index),
    cpc: r.cpc == null ? null : Number(r.cpc),
    lowTopOfPageBid: r.low_top_of_page_bid == null ? null : Number(r.low_top_of_page_bid),
    highTopOfPageBid: r.high_top_of_page_bid == null ? null : Number(r.high_top_of_page_bid),
  }));
}

export interface KeywordSuggestion extends KeywordVolume {
  /** DataForSEO Labs' own 0-100 ranking-difficulty estimate. Unlike `competition` above, this one
   *  IS about organic difficulty -- but it is a modelled score, not a measurement, and it says
   *  nothing about whether THIS domain can rank. Treat it as a sort key, never as a verdict. */
  keywordDifficulty: number | null;
}

/**
 * Long-tail expansions of a seed phrase, each with its own volume.
 *
 * This is the function that replaces guessing. Asked "what should we target for polybutylene",
 * the honest answer is whatever this returns -- not whatever sounds plausible.
 */
export async function fetchKeywordSuggestions(
  seed: string,
  opts: { limit?: number; locationName?: string; languageCode?: string } = {}
): Promise<KeywordSuggestion[]> {
  const result = await post<{ items?: Array<Record<string, unknown>> }>(
    '/dataforseo_labs/google/keyword_suggestions/live',
    [{
      keyword: seed,
      location_name: opts.locationName ?? 'United States',
      language_code: opts.languageCode ?? 'en',
      limit: opts.limit ?? 100,
      include_serp_info: false,
    }]
  );
  return (result[0]?.items ?? []).map((i) => {
    const info = (i.keyword_info ?? {}) as Record<string, unknown>;
    const props = (i.keyword_properties ?? {}) as Record<string, unknown>;
    return {
      keyword: String(i.keyword ?? ''),
      searchVolume: info.search_volume == null ? null : Number(info.search_volume),
      competition: info.competition == null ? null : String(info.competition),
      competitionIndex: info.competition_index == null ? null : Number(info.competition_index),
      cpc: info.cpc == null ? null : Number(info.cpc),
      lowTopOfPageBid: info.low_top_of_page_bid == null ? null : Number(info.low_top_of_page_bid),
      highTopOfPageBid: info.high_top_of_page_bid == null ? null : Number(info.high_top_of_page_bid),
      keywordDifficulty:
        props.keyword_difficulty == null ? null : Number(props.keyword_difficulty),
    };
  }).filter((k) => k.keyword);
}
