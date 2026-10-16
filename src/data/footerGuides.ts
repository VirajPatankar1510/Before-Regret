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
 * Refreshed 2026-10-15 from the 28-day page dimension (owner request). "inbound" counts prose links
 * from other published guides, not the footer or related-guides block.
 *
 * What the 2026-09-21 four did with the footer (28 days then -> 28 days to 2026-10-15): positions
 * improved, impressions fell -- va-loan-require-termite-inspection 461 at 37.3 -> 128 at 19.3;
 * check-building-permits-miami-dade-county-fl 377 at 30.8 -> 77 at 8.8; san-bernardino 493 at 8.7 ->
 * 310 at 8.1; los-angeles 465 at 11.1 -> 304 at 9.0. VA termite, Miami-Dade and San Bernardino leave the
 * footer; read all three on 2026-11-12 for any slide after losing ~70 inbound links each.
 */
export const FOOTER_PRIORITY_SLUGS: readonly string[] = [
  // 950 impressions, 2 clicks, position 10.6, 3 inbound. The most-shown guide on the site, sitting on
  // the page-one boundary, where a position gained is worth the most.
  'open-ground-mean-electrical-inspection',
  // 510 impressions, 12 clicks, position 5.5, 1 inbound. Already earns clicks on page one with a
  // single prose link to its name: the biggest link gap among the top pages.
  'splice-romex-knob-tube-wiring',
  // 308 impressions, 1 click, position 6.0, 1 inbound. Page one, under-linked.
  'negotiate-radon-mitigation-after-inspection',
  // 304 impressions, 5 clicks, position 9.0, 1 inbound. Kept from the 2026-09-21 list: still on the
  // page-one boundary with one prose link, and the only permit guide left in the footer.
  'check-building-permits-los-angeles-county-ca',
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
