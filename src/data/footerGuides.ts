// Which four guides hold the sitewide footer slots.
//
// -----------------------------------------------------------------------------------------------
// WHY THIS FILE EXISTS. The footer is the strongest internal signal on this property by a wide
// margin: its four guides are linked from ~70 pages each, while a typical guide has 3 to 9 inbound
// internal links in total. Until 2026-09-21 that signal was allocated by ACCIDENT. Both the
// prerender and the live Footer took the articles list, which arrives ORDER BY published_at DESC,
// and sliced the first four -- so the strongest links on the site pointed at whatever had been
// written most recently.
//
// Measured that day, 28-day window, Search Console page dimension:
//
//   the four guides then in the footer   147 impressions,    1 click
//   the four highest-earning guides    1,849 impressions,    8 clicks
//
// The footer was aimed at 8% of the traffic the top four earn. That is not a ranking theory, it is
// an allocation mistake -- nobody chose it, it fell out of a default sort.
//
// WHY A SHARED LIST RATHER THAN A SORT. The honest ordering is by search performance, and neither
// caller can compute that: scripts/prerender-guides.tsx runs without Search Console credentials in
// CI, and src/components/Footer.tsx runs in a browser against /api/guides, which returns articles
// with no performance data attached. A list both sides import is the only way they cannot disagree
// -- and they must not, because a footer that differs between the served HTML and the hydrated
// page is the drift this codebase has been bitten by before.
//
// HOW TO REFRESH IT, and it does need refreshing as positions move:
//
//   npx tsx scripts/gsc-page-coverage.ts 28     # NOTE: prints only the top 15 -- never sum it
//
// Then pick four by impressions AND by how few inbound internal links they already have. A page
// with real demand and three inbound links has more to gain from this slot than one with the same
// demand and eleven.
// -----------------------------------------------------------------------------------------------

/**
 * Chosen 2026-09-21 from the 28-day page dimension. Each line records why, so the next person
 * editing this can tell a measured choice from a guess.
 */
export const FOOTER_PRIORITY_SLUGS: readonly string[] = [
  // 493 impressions, position 8.7, 5 inbound. The best-performing guide on the site and already on
  // page one, so the distance left to run is short.
  'check-building-permits-san-bernardino-county-ca',
  // 465 impressions, position 11.1, 7 inbound. Sitting directly on the page-one boundary, which is
  // where a position gained is worth the most.
  'check-building-permits-los-angeles-county-ca',
  // 461 impressions, position 37.3, 5 inbound. Demand is proven and the position is poor, so this
  // is the slot with the most headroom -- and the one most likely to show nothing, since a page at
  // 37 does not reach page one on internal links alone.
  'va-loan-require-termite-inspection',
  // 377 impressions, position 30.8, 3 inbound. The worst link gap on the site: more impressions
  // than all four previous footer guides combined, with three inbound links to its name.
  'check-building-permits-miami-dade-county-fl',
];

/**
 * The footer's four guides, priority list first, newest-first for anything left over.
 *
 * The fallback is what makes the list safe to leave alone: if a slug here is unpublished, renamed
 * or pruned it simply drops out and a recent guide fills the slot, rather than the footer rendering
 * three links or a dead one. `articles` is expected newest-first, which is what both callers hold.
 */
export function pickFooterGuides<T extends { slug: string; title: string; articleType?: string | null }>(
  articles: T[],
  count = 4,
): T[] {
  const evergreen = articles.filter((a) => (a.articleType ?? 'guide') === 'guide');
  const bySlug = new Map(evergreen.map((a) => [a.slug, a]));
  const picked: T[] = [];
  for (const slug of FOOTER_PRIORITY_SLUGS) {
    const found = bySlug.get(slug);
    if (found && picked.length < count) picked.push(found);
  }
  for (const a of evergreen) {
    if (picked.length >= count) break;
    if (!picked.some((p) => p.slug === a.slug)) picked.push(a);
  }
  return picked.slice(0, count);
}
