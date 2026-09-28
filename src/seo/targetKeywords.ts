// The keywords this project claims to target, and the ONLY place such a claim may be written.
//
// -----------------------------------------------------------------------------------------------
// WHY THIS FILE EXISTS
//
// Every other number in this codebase is sourced. Repair costs come from the engine. SERP positions
// come from a SERP endpoint. Backlink counts come from a backlinks endpoint. Keywords were the one
// exception: they were produced by reasoning about what people probably search, and reasoning about
// search volume is indistinguishable from making it up once the number is written down.
//
// This file plus scripts/assert-keyword-provenance.ts converts that from a habit into a rule that
// the build enforces. A keyword listed here MUST be backed by a capture file under data/keywords/
// that a real API returned. Add an entry without a capture and `npm run build` fails.
//
// -----------------------------------------------------------------------------------------------
// WHY IT IS EMPTY
//
// Because right now, honestly, nothing qualifies.
//
// The query data cited throughout this project's history -- "eifs stucco evaluations, 178
// impressions, position 45.6", "idis los angeles, 22 impressions at 8.0", the polybutylene Bing
// clicks -- was read off dashboards during conversations and never written to disk. Those numbers
// may well be right. But nothing in this repository can confirm them, which means they fail the
// same reproducibility test being applied to everything else, and seeding this file with them would
// launder recalled figures into apparently-sourced ones. That is precisely the failure this file is
// meant to prevent, so the file starts empty and fills up only as captures land.
//
// To populate it (first-party only since 2026-09-27 -- see RETIRED_SOURCES below):
//   npx tsx scripts/pull-gsc-queries.ts                      # queries this site is shown for
//   npx tsx scripts/pull-bing-queries.ts                     # the same, from Bing
//   npx tsx scripts/topic-demand.ts "seed phrase" ...        # evidence for a subject with no page yet
//   npx tsx scripts/record-observation.ts --query ... --where ... --by ...   # what a person saw
// Then add the keyword here with the capture id the script prints.

export type ProvenanceSource =
  /** DataForSEO, called directly by scripts/capture-keywords.ts. RETIRED 2026-09-27: credits ran
   *  out and the owner chose to stop depending on paid or third-party SEO services. Existing
   *  captures stay valid as dated measurements; the gate refuses any new one. */
  | 'dataforseo'
  /** A self-hosted OpenSEO instance -- a front end over DataForSEO. RETIRED with it, same terms. */
  | 'openseo'
  /** Google Search Console, this site's own account (scripts/pull-gsc-queries.ts,
   *  scripts/topic-demand.ts, or a UI export). Measured, not modelled: these are OUR impressions. */
  | 'gsc'
  /** Bing Webmaster Tools, this site's own account: our query report, plus Bing's keyword counts
   *  (thin sample -- relative only). */
  | 'bing'
  /** A person looked at a live results page and wrote down what the engine suggested
   *  (scripts/record-observation.ts). Proves a query exists; never carries a volume. */
  | 'observation';

/** Sources no new capture may use. A capture from one of these dated after RETIRED_ON fails the
 *  gate, so the retired services cannot quietly come back through a stray script. */
export const RETIRED_SOURCES: ProvenanceSource[] = ['dataforseo', 'openseo'];
export const RETIRED_ON = '2026-09-27';

export interface TargetKeyword {
  keyword: string;
  /** Basename of the file under data/keywords/ that contains this keyword. The assertion resolves
   *  it and fails if the keyword is not actually inside. */
  capture: string;
  /** Which page this keyword is meant to earn. Must be a live slug -- the assertion checks. */
  slug: string;
  /** Why this one is worth targeting, in a sentence. Written by a human after reading the capture,
   *  not generated from it. */
  rationale: string;
}

export const TARGET_KEYWORDS: TargetKeyword[] = [
  {
    keyword: 'eifs stucco evaluations',
    capture: '2026-09-08-gsc-queries',
    slug: 'standard-home-inspection-check-eifs-stucco-moisture',
    rationale:
      '2 clicks from 197 impressions at position 44.8 — earning clicks from page five means the ' +
      'intent match is real and the ranking is the only thing missing. (An earlier version of this ' +
      'note called it the only clicked query on the site. That was wrong: the query dimension omits ' +
      'anonymised low-volume queries, and page-level data shows 50 clicks across 26 pages.)',
  },
  {
    keyword: 'idis los angeles',
    capture: '2026-09-08-gsc-queries',
    slug: 'check-building-permits-los-angeles-county-ca',
    rationale:
      '22 impressions at position 8.0 and zero clicks. Page one, real demand, no click -- the ' +
      'definition of a title and snippet problem rather than a ranking one.',
  },
  {
    keyword: 'va termite inspection',
    capture: '2026-09-08-gsc-queries',
    slug: 'va-loan-require-termite-inspection',
    rationale:
      '17 impressions at position 22.2, the largest striking-distance query pointing at a guide ' +
      'that already exists and now carries real WDI cost figures from the engine.',
  },
  {
    keyword: 'does va require termite inspection',
    capture: '2026-09-08-gsc-queries',
    slug: 'va-loan-require-termite-inspection',
    rationale:
      'Same page, 5 impressions at position 9.6 -- already on page one, so the two together show ' +
      'the question form ranks far better than the noun form and the page should lean that way.',
  },
  {
    keyword: 'south facing house',
    capture: '2026-09-18-volumes-south-facing-house',
    slug: 'south-facing-house-sun-by-direction',
    rationale:
      '1,300 US searches a month, the largest single query in the capture, with west (720), north ' +
      '(590) and east (590) behind it -- more measured demand than any subject the library already ' +
      'answered. /sunlight/ keeps "which direction should a house face" (the choosing intent); this ' +
      'page takes the evaluating one, a buyer told a specific house faces a specific way.',
  },
  {
    keyword: 'contractor found unpermitted work',
    capture: '2026-09-28-observed-what-happens-if-an-inspector-finds-unper',
    slug: 'unpermitted-work-behind-the-wall',
    rationale:
      'OBSERVED, not measured: seen on a US Google results page on 2026-09-28 with "what happens if an inspector finds ' +
      'unpermitted work" in People also ask on all three related searches. Written for contractors, who buy the ads and cite ' +
      'the site. An experiment: by 2026-12-27 it must be shown for a contractor query or cited by a trade site, or it is folded ' +
      'into amateur-workmanship-mean-home-inspection-report.',
  },
];

/** Sources that constitute measurement. Anything else is someone's opinion wearing a number. */
export const VALID_SOURCES: ProvenanceSource[] = ['dataforseo', 'openseo', 'gsc', 'bing', 'observation'];

/** A capture older than this is stale enough that volumes should be re-pulled before being used to
 *  justify new work. The assertion warns rather than fails -- an old measurement is still a
 *  measurement, and failing the build over it would just push people to delete the file. */
export const STALE_AFTER_DAYS = 180;
