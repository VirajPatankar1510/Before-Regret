// Google autocomplete keyword discovery -- the real phrasings people type, for a domain that has
// almost no impression history of its own to learn from.
//
// Why this exists alongside the two services already here. Search Console (searchConsoleService.ts)
// reports only queries this site ALREADY appears for; it is the highest-quality signal available
// but structurally cannot suggest anything outside the small set Google has already matched. Bing
// Webmaster (bingKeywordService.ts) reports interest independent of this site, but from Bing's
// much smaller share of US search, so long-tail property queries come back thin or empty.
// Autocomplete fills the specific gap between them: Google-sourced, independent of this site's own
// history, and richest exactly where the other two are weakest -- the long, question-shaped tail.
//
// What it does and does not give you: real query STRINGS, no volume numbers. That tradeoff is the
// right one for a site with no ranking authority, where knowing a phrase is searched at all
// matters far more than knowing whether it is searched 50 or 5,000 times a month -- a low-volume
// query that can actually be won beats a high-volume one that cannot.
//
// Honest caveat, deliberately recorded rather than buried: this endpoint is public and
// unauthenticated and is what SEO tooling broadly uses, but Google does not document it and offers
// no stability guarantee. Every failure path below degrades to an empty array rather than throwing,
// so the admin route keeps working from its other sources if Google ever changes or blocks it.

const ENDPOINT = 'https://suggestqueries.google.com/complete/search';

// Question prefixes, ordered roughly by how often each yields a distinct informational query for
// property-research topics. These are what turn a flat topic into FAQ-shaped questions -- the
// exact form needed for the 119 published articles that currently carry no FAQ block.
const QUESTION_PREFIXES = [
  'can', 'should', 'is', 'does', 'why', 'how much', 'what', 'do', 'will', 'when',
] as const;

// Suffix expansion catches the other half of the tail: modifiers people append rather than
// question words they prepend ("... cost", "... insurance", "... near me").
const ALPHABET_SUFFIXES = 'abcdefghijklmnopqrstuvwxyz'.split('');

export interface AutocompleteRow {
  query: string;
  /** Which expansion produced it -- lets the admin UI group results by intent. */
  kind: 'seed' | 'question' | 'modifier';
  /** True when the string is phrased as a question, the strongest FAQ candidate. */
  isQuestion: boolean;
}

export function isGoogleAutocompleteConfigured(): boolean {
  // No credentials of any kind. Always available -- stated explicitly so a reader doesn't go
  // looking for an env var that was never needed.
  return true;
}

const QUESTION_STARTERS = /^(can|should|is|are|does|do|did|why|how|what|when|where|will|would|which|who|if)\b/i;

async function suggest(term: string, signal?: AbortSignal): Promise<string[]> {
  const url = `${ENDPOINT}?${new URLSearchParams({
    client: 'firefox', // returns a plain JSON array; the default 'psy-ab' client returns JSONP.
    hl: 'en',
    gl: 'us',          // US results -- this site covers US property only.
    q: term,
  })}`;
  try {
    const res = await fetch(url, { signal, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BeforeRegretKeywordTool/1.0)' } });
    if (!res.ok) return [];
    const json = (await res.json()) as [string, string[]];
    return Array.isArray(json?.[1]) ? json[1] : [];
  } catch {
    // Network error, abort, or a shape change at Google's end. Empty is the correct degradation:
    // this is one of three sources feeding an admin research tool, never a critical path.
    return [];
  }
}

/**
 * Expands a seed term into real Google query suggestions across three passes: the bare seed,
 * question-prefixed variants, and single-letter modifier suffixes.
 *
 * Requests run with a bounded concurrency rather than all at once. ~37 requests fired in parallel
 * at an undocumented endpoint is exactly the pattern that earns a rate-limit block, and this is an
 * interactive admin tool where a couple of seconds is invisible anyway.
 */
export async function fetchAutocompleteKeywords(
  seedTerm: string,
  opts: { includeModifiers?: boolean; timeoutMs?: number } = {}
): Promise<AutocompleteRow[]> {
  const seed = seedTerm.trim();
  if (!seed) return [];

  const { includeModifiers = true, timeoutMs = 12_000 } = opts;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const tasks: Array<{ term: string; kind: AutocompleteRow['kind'] }> = [
      { term: seed, kind: 'seed' },
      ...QUESTION_PREFIXES.map((p) => ({ term: `${p} ${seed}`, kind: 'question' as const })),
      ...(includeModifiers ? ALPHABET_SUFFIXES.map((c) => ({ term: `${seed} ${c}`, kind: 'modifier' as const })) : []),
    ];

    // Deduplicated by the query string itself, keeping the FIRST kind that produced it. Ordering of
    // `tasks` above is therefore meaningful: a query reachable both as a question and as a modifier
    // is labelled a question, which is the more useful classification for FAQ work.
    const seen = new Map<string, AutocompleteRow>();
    const CONCURRENCY = 5;

    for (let i = 0; i < tasks.length; i += CONCURRENCY) {
      const batch = tasks.slice(i, i + CONCURRENCY);
      const results = await Promise.all(batch.map((t) => suggest(t.term, controller.signal)));
      results.forEach((queries, idx) => {
        const kind = batch[idx].kind;
        for (const q of queries) {
          const norm = q.trim().toLowerCase();
          if (!norm || seen.has(norm)) continue;
          // Drop suggestions that lost the seed entirely -- Google sometimes pivots a
          // single-letter modifier onto an unrelated term, which is noise for topic research.
          if (!norm.includes(seed.toLowerCase().split(' ')[0])) continue;
          seen.set(norm, { query: q.trim(), kind, isQuestion: QUESTION_STARTERS.test(norm) });
        }
      });
    }

    // Questions first (most actionable for FAQs and long-tail articles), then alphabetical so the
    // list is stable between runs rather than reordering on every call.
    return [...seen.values()].sort((a, b) =>
      a.isQuestion === b.isQuestion ? a.query.localeCompare(b.query) : a.isQuestion ? -1 : 1
    );
  } finally {
    clearTimeout(timer);
  }
}
