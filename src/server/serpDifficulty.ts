// Scores how contested a query's search results look, by classifying who already ranks.
//
// WHY THIS IS A SHARED MODULE. The classification tables and the scoring maths were originally
// inline in scripts/organic-difficulty.ts. The admin panel now scores queries too, and two copies
// of a hand-maintained domain list is exactly the drift this codebase already avoids elsewhere
// (contentAudit.ts is shared between its admin route and the article-faqs skill; buildCountyMeta
// is shared between the prerender and its verifier). A domain added to one copy and not the other
// would make the same query score differently depending on where it was checked, silently.
//
// WHAT IT MEASURES, and what it does not. There is no free API returning a real difficulty score,
// and the paid ones derive theirs mostly from backlink graphs this project cannot see. What IS
// observable is the composition of page one, which is the same evidence a human uses eyeballing a
// SERP: forum threads, Reddit, and small lead-generation sites near the top mean Google could not
// find better content and there is a genuine opening. Wikipedia, .gov, and major brands mean the
// opposite. It says nothing whatsoever about whether THIS site can rank -- that is gated by its own
// authority, which is the real constraint today. Use it to choose between candidates, never to
// predict that any of them will rank.

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
  // particular). Added after a run scored rocketmortgage.com and chase.com as "unrecognised",
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
  { match: /\b(pinterest|facebook|youtube|instagram|tiktok)\.com$/i, label: 'social/video', weight: 10 },
];

export type Verdict = { label: string; weight: number; kind: 'strong' | 'weak' | 'neutral' };

/** Small local business sites -- electricians, inspectors, HVAC -- are the commonest weak page-one
 *  filler in this niche. Detected by shape (electric/plumbing/inspection in the host) rather than
 *  by name, since the long tail of them cannot be enumerated. */
function looksLikeSmallTradeSite(host: string): boolean {
  return /(electric|plumb|hvac|inspect|heating|cooling|roofing|contractor|remodel|restoration)/i.test(host)
    && !/\b(nachi|internachi|homeinspector|ashi)\b/i.test(host);
}

export function classifyDomain(domain: string): Verdict {
  const host = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  for (const s of STRONG) if (s.match.test(host)) return { label: s.label, weight: -s.weight, kind: 'strong' };
  for (const w of WEAK) if (w.match.test(host)) return { label: w.label, weight: w.weight, kind: 'weak' };
  if (looksLikeSmallTradeSite(host)) return { label: 'small trade/lead-gen site', weight: 18, kind: 'weak' };
  return { label: 'unrecognised (neutral)', weight: 0, kind: 'neutral' };
}

/**
 * Position weighting, used only when real SERP ranks are available.
 *
 * Without ranks every result counts the same, which erases the difference between a forum thread
 * at #1 and one at #9 -- two very different statements about whether a query is winnable. Weighted
 * so the top of page one dominates (#1 counts roughly 3x a #10), because that is where both the
 * click share and the real barrier to entry sit.
 */
export function positionWeight(position: number): number {
  if (position <= 0) return 1;
  return 1 + 2 / Math.sqrt(position);
}

/** 0 = looks contested, 100 = looks wide open. Centred at 50 so a fully neutral result set reads
 *  as "no signal either way" rather than as an easy win. */
export function scoreResults(entries: Array<{ verdict: Verdict; position?: number }>): number {
  if (entries.length === 0) return 50;
  let weighted = 0;
  let totalWeight = 0;
  for (const e of entries) {
    const w = e.position !== undefined ? positionWeight(e.position) : 1;
    weighted += e.verdict.weight * w;
    totalWeight += w;
  }
  return Math.max(0, Math.min(100, Math.round(50 + (weighted / totalWeight) * 1.6)));
}

export function bandFor(score: number): string {
  if (score >= 70) return 'LOOKS OPEN';
  if (score >= 55) return 'mixed, leaning open';
  if (score >= 45) return 'mixed';
  if (score >= 30) return 'mixed, leaning contested';
  return 'LOOKS CONTESTED';
}
