// The 2026-09-02 guide prune. 155 published guides -> 35, then -> 37 after two were restored on
// 2026-09-03 (see the "off-niche" block below for which two and why the original call was wrong).
//
// WHY. Search Console (90 days) and Bing Webmaster (21 days) were joined against the published
// guide list: 13 guides earned at least one click, 28 more earned impressions without clicks, and
// 114 had never been shown to anyone by either engine. 155 guides were published across 19 days
// (129 of them in the first fortnight, peaking at 17 in one day) on a domain with zero inbound
// links -- the scaled-content shape Google's site-level systems suppress. The pages themselves are
// not thin (33k-41k characters on the ones sampled) and rank when they are seen, which is the point:
// the suppression is about the shape of the library, not the substance of any one page. Cutting the
// unseen majority is what frees crawl allocation for the survivors.
//
// Same reasoning and the same status codes as legacyUrls.ts, which this file deliberately mirrors
// rather than extends -- that file is about the PREVIOUS product's URLs, this one is about this
// product's own over-publishing. Keeping them separate keeps each list's rationale legible.
//
// 301 vs 410. A guide merged into a stronger sibling gets 301: the pages were competing for the
// same query (six separate knob-and-tube guides, eight for termites), so the signal should
// consolidate onto the survivor rather than evaporate. A guide with no successor gets 410, not 404
// -- on a site crawled a few pages a day, 404 invites Google to keep re-checking a page that is
// never coming back, while 410 asks it to drop the URL now.
//
// The deletions are applied as articles.status = 'removed' rather than DELETE, so the rows (and
// their body_markdown) survive in the database and a page can be restored by setting the status
// back to 'published'. Every read path in this codebase already filters status = 'published', so a
// removed article leaves the sitemap, the prerender step, the guides index, the homepage and the
// ad inventory with no further change.

/**
 * Guides folded into a stronger sibling, old slug -> surviving slug. Served as 301.
 * The survivor is the one with the best measured position or clicks, not the longest page.
 */
export const MERGED_GUIDE_SLUGS: Readonly<Record<string, string>> = {
  // Knob and tube: six guides splitting one topic. Survivor ranks position 9; the 48-impression
  // alternative sits at position 71, so impressions alone would have picked the wrong one.
  'what-is-knob-and-tube-wiring': 'knob-tube-wiring-have-be-replaced-before-closing',
  'get-homeowners-insurance-knob-tube-wiring': 'knob-tube-wiring-have-be-replaced-before-closing',
  'i-buy-house-knob-tube-wiring': 'knob-tube-wiring-have-be-replaced-before-closing',
  'knob-tube-fuse-box-look-like': 'knob-tube-wiring-have-be-replaced-before-closing',
  'splice-romex-knob-tube-wiring': 'knob-tube-wiring-have-be-replaced-before-closing',

  // Termites: eight guides, three impressions between them.
  'get-mortgage-house-active-termites': 'standard-home-inspection-include-termites',
  'happens-if-termite-infestation-found-during-home-inspection': 'standard-home-inspection-include-termites',
  'evidence-previous-treatment-mean-termite-report': 'standard-home-inspection-include-termites',
  'termite-damage-vs-wood-rot-inspectors-tell-them-apart': 'standard-home-inspection-include-termites',
  'va-loan-require-termite-inspection': 'standard-home-inspection-include-termites',
  'home-inspector-check-rodent-termite-damage-attic': 'standard-home-inspection-include-termites',

  // Polybutylene: survivor is the site's best-performing Bing page.
  'get-home-insurance-polybutylene-plumbing': 'spot-polybutylene-pipes-before-buying-house',
  'should-replace-polybutylene-pipes-wait-leak': 'spot-polybutylene-pipes-before-buying-house',
  'polybutylene-pipes-always-leak': 'spot-polybutylene-pipes-before-buying-house',

  'federal-pacific-panels-good': 'federal-pacific-stab-lok-panel-inspectors-flag',
  'fpe-panel-fail-home-insurance-like-zinsco': 'federal-pacific-stab-lok-panel-inspectors-flag',

  'eifs-stucco-long-eifs-stucco-last': 'standard-home-inspection-check-eifs-stucco-moisture',
  'spot-eifs-siding-vs-traditional-stucco-before-buying': 'standard-home-inspection-check-eifs-stucco-moisture',

  'aluminum-wiring-remediation-methods': 'get-home-insurance-aluminum-wiring',
  'pigtailing-aluminum-wiring-satisfy-insurers': 'get-home-insurance-aluminum-wiring',

  'challenger-panel-problem-like-zinsco': 'will-zinsco-panel-fail-4-point-inspection',

  'cast-iron-sewer-pipes-fail-standard-home-inspection': 'why-cast-iron-pipes-corrode',
};

/**
 * Guides removed with no successor. Served as 410.
 *
 * Three groups, kept in one list because they get identical treatment:
 *   - 25 county permit guides: the geographic axis, already concluded to be the wrong bet. The six
 *     county permit guides that DO have impressions (Philadelphia, Cook, Miami-Dade, San
 *     Bernardino, Bronx, Middlesex) are deliberately absent from this list.
 *   - 6 "what X wish buyers knew" guides: one headline formula filled six times with a different
 *     trade -- the most legible scaled-content signature in the library.
 *   - 9 off-niche guides, plus 58 on-topic guides that have simply never been shown by either
 *     engine in three months.
 */
export const REMOVED_GUIDE_SLUGS: readonly string[] = [
  // --- county permit guides (25) ---
  'check-building-permit-history-before-buying-travis-county-tx',
  'check-building-permits-alameda-county-ca',
  'check-building-permits-bexar-county-tx',
  'check-building-permits-brooklyn-ny',
  'check-building-permits-broward-county-fl',
  'check-building-permits-clark-county-nv',
  'check-building-permits-dallas-county-tx',
  'check-building-permits-fulton-county-ga',
  'check-building-permits-hillsborough-county-fl',
  'check-building-permits-los-angeles-county-ca',
  'check-building-permits-manhattan-ny',
  'check-building-permits-maricopa-county-az',
  'check-building-permits-orange-county-ca',
  'check-building-permits-orange-county-fl',
  'check-building-permits-palm-beach-county-fl',
  'check-building-permits-queens-ny',
  'check-building-permits-riverside-county-ca',
  'check-building-permits-sacramento-county-ca',
  'check-building-permits-san-diego-county-ca',
  'check-building-permits-santa-clara-county-ca',
  'check-building-permits-seattle-wa',
  'check-building-permits-suffolk-county-ny',
  'check-building-permits-tarrant-county-tx',
  'check-building-permits-wayne-county-mi',
  'check-harris-county-permit-history-before-buying',

  // --- the "what X wish buyers knew" template (6) ---
  'buyers-wish-they-asked-before-waiving-inspection-contingency',
  'contractors-wish-buyers-knew-about-renovation-costs',
  'home-inspectors-wish-buyers-knew-before-closing',
  'hvac-techs-wish-buyers-knew-about-system-age',
  'insurance-agents-wish-buyers-knew-about-coverage',
  'pest-inspectors-wish-buyers-knew-about-termites',

  // --- off-niche (7) ---
  //
  // RESTORED 2026-09-03, two slugs removed from this list: 'get-home-insurance-fuse-box' and
  // 'how-common-are-title-insurance-claims'. Both were cut on an editorial "off-niche" judgement
  // rather than on measurement, and the judgement was wrong. The 2026-09-02 GSC pull that drove
  // this prune showed them at zero impressions -- but the pull covered a window in which Google
  // had not yet started showing them. A day later they had 17 and 5 impressions and a click each,
  // with the fuse-box guide sitting at average position 4.0. Every impression they have ever
  // earned arrived in the seven days ending 2026-09-03; the 21 days before that were genuinely
  // zero, which is why the earlier snapshot looked conclusive and was not.
  //
  // THE LESSON, because it will recur: on a domain this young, "zero impressions" and "not yet
  // crawled into the index" are indistinguishable from inside a single Search Console snapshot.
  // Before cutting on a zero, check whether the zero is stable across two windows (7d vs 28d) --
  // a page whose 7d and 28d figures are IDENTICAL is a page that has only just started being
  // shown, not a page nobody wants. See scripts/gsc-page-coverage.ts.
  //
  // Their topical siblings ('is-title-insurance-a-waste-of-money',
  // 'fuse-boxes-catch-fire-safety-risks-home-buyers') stay cut: they had no impressions in either
  // window and the restored guide now serves that query on its own.
  'data-centers-cause-property-values-drop',
  'houses-near-data-centers-cheaper',
  'land-lease-apartments-so-cheap',
  'purdue-federal-first-time-homebuyer-loans-worth',
  'property-tax-caps-create-lock-effect-buyers',
  'is-title-insurance-a-waste-of-money',
  'fuse-boxes-catch-fire-safety-risks-home-buyers',

  // --- on-topic, never shown by either engine (58) ---
  '100-amp-service-enough-house-re-buying',
  'ask-home-inspector-before-hire-them',
  'backwater-valve-every-house-need-one',
  'bowing-basement-wall-actually-mean',
  'breaker-boxes-go-bad-lifespan-warning-signs',
  'buyers-remorse-after-buying-a-house',
  'buying-house-reset-property-tax-assessment-sale-price',
  'circuit-breaker-box-be-bathroom',
  'close-house-active-roof-leak',
  'did-lender-require-repairs-before-closing',
  'did-my-homeowners-insurance-quote-change-after-inspection-ca',
  'difference-between-home-inspector-structural-engineer',
  'escrow-shortage-mortgage-amount-go-up-year-two',
  'fha-appraisal-vs-home-inspection-which-better',
  'fha-minimum-property-requirements-fails-them',
  'find-out-old-septic-system',
  'galvanized-steel-plumbing-need-replacing',
  'get-home-insurance-flat-roof',
  'get-homeowners-insurance-wood-burning-fireplace-no-chimney-c',
  'happens-if-appraiser-flags-peeling-paint-pre-1978-house',
  'happens-if-house-has-open-building-department-violations',
  'happens-if-miss-inspection-contingency-deadline',
  'happens-if-seller-didn-t-disclose-past-insurance-claim',
  'happens-if-septic-system-fails-before-closing',
  'hoa-foreclose-if-pay-mortgage',
  'home-inspection-check-attic-proper-insulation',
  'home-inspection-check-mold-behind-walls',
  'home-inspection-cover-retaining-walls',
  'home-inspection-include-level-2-chimney-inspection',
  'home-inspection-include-septic-system',
  'home-inspection-test-well-pump-just-water-pressure',
  'home-inspector-actually-enter-crawlspace-just-look',
  'home-solar-panels-don-t-own-affect-getting-insurance',
  'homes-becoming-uninsurable-before-closing-2026',
  'house-pass-full-inspection-but-fail-4-point',
  'houses-sale-show-as-active-when-they-re-under-contract',
  'i-need-sewer-scope-inspection',
  'if-find-problem-after-closing-inspector-missed',
  'if-insurance-canceled-during-escrow-los-angeles',
  'listing-square-footage-differs-from-county-tax-records',
  'my-first-property-tax-bill-higher-than-seller-s-was',
  'needs-be-done-before-home-inspection',
  'old-too-old-water-heater-re-inheriting',
  'older-roof-automatically-fail-4-point-inspection',
  'prove-roof-age-for-insurance',
  'regret-buying-a-house',
  'repair-request-vs-price-credit-vs-escrow-holdback-which-ask',
  'seller-s-pre-listing-inspection-isn-t-substitute-own',
  'sellers-usually-agree-fix-after-inspection',
  'septic-dye-test-enough',
  'should-buy-house-s-already-had-foundation-repair',
  'should-use-home-inspector-recommended-by-realtor',
  'slab-leak-would-inspector-catch-one',
  'split-bus-electrical-panels-problem-buyers',
  'standard-home-inspection-check-asbestos',
  'when-foundation-crack-need-structural-engineer',
  'when-reasonable-walk-away-after-inspection',
  'who-s-responsible-shared-well-shared-driveway',
];

/** The surviving slug for a merged guide, or null if this slug was not merged. */
export function mergedGuideTarget(slug: string): string | null {
  return Object.prototype.hasOwnProperty.call(MERGED_GUIDE_SLUGS, slug)
    ? MERGED_GUIDE_SLUGS[slug]
    : null;
}
