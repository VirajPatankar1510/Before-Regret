// The URLs belonging to the previous website that lived on this domain -- an India-focused
// resident / housing-society Q&A platform, entirely unrelated to US property research.
//
// Extracted out of server.ts so the runtime handler and scripts/legacy-url-audit.ts read the same
// list. They used to be one inline Set, which meant an audit could only re-type the list and hope
// it matched. Same reasoning as contentAudit.ts being shared between the admin route and the
// article-faqs skill: two things checking the same rule must not be able to disagree about what
// the rule is.
//
// WHY 410 AND NOT 301. On the four legal-page duplicates, a 301 had already been tried and Google
// kept the old URL as canonical -- on a site crawled at roughly 3 pages/day, waiting for a
// redirect to be re-crawled and re-canonicalised is slow, and every crawl spent on a dead
// duplicate is one not spent on real content. 410 does not ask Google to transfer anything; it
// says the URL is gone. The previous-product pages never had a successor to redirect to at all --
// nothing on a US property-research site answers "find an expert" or "will I regret", and
// /shipping-policy is meaningless for a site selling digital reports. Redirecting those somewhere
// plausible would be worse than 410: Google treats an irrelevant redirect as a soft 404 anyway,
// and a reader who clicked "will I regret" does not want a county page.

/** Exact paths (no trailing slash -- the handler normalises before comparing). */
export const LEGACY_GONE_PATHS: readonly string[] = [
  '/become-expert', '/become-resident', '/court', '/explore', '/will-i-regret',
  '/shipping-policy',
  '/privacy-policy', '/terms-and-conditions', '/legal-disclaimer', '/refund-policy',
  '/guides/breadwinner-resentment-income-disparity',
  '/guides/red-flag-evaluation-boundary-matrix',
];

/**
 * Every /expert/* path from the old platform, including its /ask sub-pages. A prefix rather than a
 * list because the indexed set (exp_amit, exp_rahul, exp_sneha, plus /ask variants) is clearly a
 * sample of a larger generated space, and the current site has no /expert route at all.
 */
export const LEGACY_GONE_PREFIX = '/expert/';

const legacySet = new Set(LEGACY_GONE_PATHS);

/** True when this path belonged to the previous site and should be answered with 410. */
export function isLegacyGonePath(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, '') || '/';
  return legacySet.has(p) || p.startsWith(LEGACY_GONE_PREFIX);
}

/**
 * Concrete legacy URLs worth spot-checking -- the exact paths above plus the specific /expert/
 * URLs Search Console has actually reported impressions for. The prefix rule covers far more than
 * this; these are the ones known to exist in Google's index, so they are the ones whose status is
 * worth asserting on every audit run.
 */
export const LEGACY_URLS_TO_VERIFY: readonly string[] = [
  ...LEGACY_GONE_PATHS,
  '/expert/exp_rahul',
  '/expert/exp_rahul/ask',
  '/expert/exp_amit',
  '/expert/exp_amit/ask',
  '/expert/exp_sneha',
];
