// Audits the eviction of the previous website from this domain.
//
//   npx tsx scripts/legacy-url-audit.ts            # check live production
//   npx tsx scripts/legacy-url-audit.ts --no-gsc   # HTTP checks only, skip Search Console
//
// WHY THIS EXISTS. Two separate questions get confused when someone asks "is the old site gone
// yet", and only one of them is about our code:
//
//   1. Do the legacy URLs still serve 410? That is ours, it is verifiable in seconds, and it has
//      silently regressed on this project before -- twice a static file written by a prerender
//      script shadowed a route, because Vercel resolves a real file BEFORE consulting rewrites, so
//      Express never sees the request (see the /refund-policy incident). A passing audit today is
//      not evidence it still passes after the next prerender script is added.
//   2. Has Google acted on them? That is not ours and cannot be fixed by deploying. A 410 only
//      does anything once Google re-crawls the URL, and this site is crawled at roughly 3
//      pages/day. Search Console's Removals tool is the only accelerator, and it is UI-only.
//
// Reporting them together, clearly separated, is the point. Otherwise "still getting impressions"
// reads as "the fix did not work" when the fix is fine and the crawler simply has not been back.
//
// The impression counts are also easy to misread, which is the trap this script exists to close:
// Search Console's default 90-day window includes days from BEFORE the 410s shipped, so a
// perfectly working eviction still shows a large 90-day number forever. Only the short window
// says anything about now, which is why 7-day is what the verdict is based on.
import 'dotenv/config';
import { LEGACY_URLS_TO_VERIFY, isLegacyGonePath } from '../src/data/legacyUrls.js';

const BASE = 'https://www.beforeregret.com';
const SKIP_GSC = process.argv.includes('--no-gsc');

// What this site currently claims is live, READ FROM THE SITEMAP rather than hand-kept.
//
// FIXED 2026-09-17. This used to be a hardcoded Set, and it had gone wrong in both directions:
//
//   - It omitted /research/ and the seven study URLs, which are prerendered from docs/ and appear
//     in no database table. The audit therefore counted seven LIVE pages as surviving legacy URLs
//     -- 23 of the 27 "legacy" impressions in the last 7 days were the research studies doing
//     exactly what they are supposed to do. It then told you to add them to legacyUrls.ts, which
//     would have 410'd the site's best content.
//   - It listed '/counties/' and '/counties' as CURRENT. They are 410 and are IN the legacy list.
//     A genuinely dead URL was whitelisted as healthy, which is the failure mode that matters:
//     the audit could never have reported it.
//
// The sitemap is the site's own statement of what is live, generated at build time from the
// database and the prerender scripts. Reading it means this set cannot drift from reality the way
// a hand-kept copy did. Fetched once, from production, so it reflects what is deployed rather than
// what is on this machine.
async function fetchLivePaths(): Promise<Set<string>> {
  const paths = new Set<string>();
  const index = await fetch(`${BASE}/sitemap.xml`, { signal: AbortSignal.timeout(20000) }).then((r) => r.text());
  const children = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (children.length === 0) throw new Error('ABORT: /sitemap.xml listed no child sitemaps -- cannot establish what is live');
  for (const child of children) {
    const xml = await fetch(child, { signal: AbortSignal.timeout(20000) }).then((r) => r.text());
    for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const path = m[1].replace(BASE, '');
      paths.add(path);
      paths.add(path.replace(/\/$/, '')); // the slash-less shape 308s to this one; not an eviction problem
    }
  }
  if (paths.size < 20) throw new Error(`ABORT: sitemap yielded only ${paths.size} paths -- refusing to audit against a truncated list`);
  return paths;
}

/** The status a path SETTLES on, following our own redirects, plus the chain that got there.
 *
 *  FIXED 2026-09-17. This used to return the first status and stop, so the five /guides/ legacy
 *  URLs were reported FAIL at 308 and the script declared "the eviction has REGRESSED" on every
 *  run. They were fine: server.ts normalises /guides/<slug> to /guides/<slug>/ before any handler
 *  sees it, so the real answer is one hop away and it is 410. A checker that cannot follow its own
 *  site's redirect cannot tell a working eviction from a broken one -- and a verdict that cries
 *  wolf every run is worse than no verdict, because it trains you to skip reading it.
 *
 *  Still manual rather than redirect:'follow' so the hops are visible in the output: a legacy URL
 *  that 301s somewhere REAL is a different bug from one that 410s, and both would look identical
 *  under an automatic follow. Cross-origin hops are refused rather than chased.
 */
async function resolveStatus(path: string, userAgent?: string): Promise<{ status: number; chain: number[] }> {
  const chain: number[] = [];
  let target = path;
  for (let hop = 0; hop < 4; hop++) {
    let res: Response | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        res = await fetch(`${BASE}${target}`, {
          method: 'GET',
          redirect: 'manual',
          headers: userAgent ? { 'User-Agent': userAgent } : {},
          signal: AbortSignal.timeout(20000),
        });
        break;
      } catch {
        if (attempt === 3) return { status: 0, chain }; // 0 = no answer; reported as unknown, never as a pass
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
    if (!res) return { status: 0, chain };
    chain.push(res.status);
    if (res.status < 300 || res.status >= 400) return { status: res.status, chain };
    const loc = res.headers.get('location');
    if (!loc) return { status: res.status, chain };
    if (/^https?:\/\//i.test(loc) && !loc.startsWith(BASE)) return { status: res.status, chain }; // off-site: not ours to follow
    target = loc.startsWith(BASE) ? loc.slice(BASE.length) : loc;
  }
  return { status: 0, chain }; // redirect loop
}

async function statusOf(path: string, userAgent?: string): Promise<number> {
  return (await resolveStatus(path, userAgent)).status;
}

const GOOGLEBOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

async function main() {
  console.log('=== 1. ARE THE LEGACY URLS STILL GONE? (our code) ===\n');
  let failures = 0;
  for (const path of LEGACY_URLS_TO_VERIFY) {
    // Checked as Googlebot specifically: the thing that matters is what the crawler is told, and a
    // CDN or edge rule that treats bots differently would be invisible to a plain request.
    const [plain, bot] = await Promise.all([resolveStatus(path), resolveStatus(path, GOOGLEBOT)]);
    const ok = plain.status === 410 && bot.status === 410;
    if (!ok) failures++;
    const via = bot.chain.length > 1 ? ` via ${bot.chain.join(' -> ')}` : '';
    console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${path.padEnd(46)} plain=${plain.status} googlebot=${bot.status}${via}`);
  }
  console.log(`\n  ${failures === 0 ? `All ${LEGACY_URLS_TO_VERIFY.length} legacy URLs return 410 to both.` : `${failures} URL(s) NOT returning 410 -- the eviction has regressed.`}`);

  // A path the prefix rule should cover but that is not in any list -- proves the rule is still a
  // prefix and has not quietly become an exact-match lookup.
  const probe = await statusOf('/expert/exp_audit_probe_not_a_real_person');
  console.log(`  ${probe === 410 ? 'OK  ' : 'FAIL'} /expert/* prefix rule still active (probe returned ${probe})`);

  // And the opposite failure: a real page must NOT be caught by the legacy rules.
  const realPageMisfires = ['/terms/', '/privacy/', '/guides/', '/'].filter((p) => isLegacyGonePath(p));
  console.log(`  ${realPageMisfires.length === 0 ? 'OK  ' : 'FAIL'} no current page matches a legacy rule${realPageMisfires.length ? `: ${realPageMisfires.join(', ')}` : ''}`);

  if (SKIP_GSC) return;

  console.log('\n=== 2. HAS GOOGLE ACTED ON THEM YET? (not our code -- time + Removals) ===\n');
  const { fetchPagePerformance, isSearchConsoleConfigured } = await import('../src/server/searchConsoleService.js');
  const { withDb } = await import('../src/server/db.js');
  if (!isSearchConsoleConfigured()) { console.log('  Search Console is not configured -- skipping.'); return; }

  const live = await fetchLivePaths();
  console.log(`  (sitemap says ${live.size / 2} URLs are live)\n`);

  // Guides the 2026-09-02 prune removed. They 410 too, but they are THIS product's own pages --
  // counting them as "the previous website" overstates the eviction and, worse, invites someone to
  // add a current-product slug to legacyUrls.ts. Reported separately for that reason.
  const prunedPaths = new Set<string>();
  for (const r of (await withDb((sql) => sql`SELECT slug FROM articles WHERE status='removed'`)) as any[]) {
    prunedPaths.add(`/guides/${r.slug}/`);
    prunedPaths.add(`/guides/${r.slug}`);
  }

  const windows: Record<number, { urls: number; impressions: number; list: string[] }> = {};
  for (const days of [90, 28, 7]) {
    const pages = await fetchPagePerformance(days);
    const legacy = pages.filter((p) => {
      const path = p.page.replace(BASE, '');
      return !live.has(path) && !prunedPaths.has(path);
    });
    windows[days] = {
      urls: legacy.length,
      impressions: legacy.reduce((n, p) => n + p.impressions, 0),
      list: legacy.sort((a, b) => b.impressions - a.impressions).map((p) => `${String(p.impressions).padStart(3)} imp  ${p.page.replace(BASE, '')}`),
    };
  }

  for (const days of [90, 28, 7]) {
    console.log(`  last ${String(days).padStart(2)} days: ${String(windows[days].urls).padStart(2)} legacy URL(s), ${String(windows[days].impressions).padStart(3)} impressions`);
  }
  console.log('\n  still appearing in the last 7 days:');
  console.log(windows[7].list.length ? windows[7].list.map((l) => `    ${l}`).join('\n') : '    (none)');

  // Anything in the 7-day list that our own rules do NOT cover is a legacy URL nobody has found
  // yet -- the case this section is most worth running for.
  const uncovered = windows[7].list
    .map((l) => l.split('  ').pop()!.trim())
    .filter((p) => !isLegacyGonePath(p));
  if (uncovered.length > 0) {
    console.log('\n  !! NOT COVERED by any 410 rule -- these are URLs Google still shows that this');
    console.log('     site neither publishes nor tombstones. Check each before adding it anywhere:');
    for (const u of uncovered) {
      const st = await resolveStatus(u, GOOGLEBOT);
      const verdict = st.status === 410 ? 'already 410 (covered by another rule)'
        : st.status === 404 ? 'answers 404 -- should be 410 if it is a previous-product URL'
        : st.status === 200 ? 'answers 200 -- this is a LIVE page; do NOT tombstone it'
        : `answers ${st.status}`;
      console.log(`     ${u.padEnd(60)} ${verdict}`);
    }
  }

  console.log('\n=== VERDICT ===');
  if (failures > 0) {
    console.log('  The eviction has REGRESSED. Fix the failing URLs above before anything else.');
  } else if (windows[7].impressions === 0) {
    console.log('  Done. Every legacy URL returns 410 and none has been shown in the last 7 days.');
  } else {
    console.log(`  Code side is complete -- every legacy URL returns 410 to Googlebot.`);
    console.log(`  Google has not finished re-crawling: ${windows[7].impressions} impression(s) across`);
    console.log(`  ${windows[7].urls} URL(s) in the last 7 days. Nothing further to deploy; this needs`);
    console.log('  Search Console > Removals (UI only) and time. Re-run this to track it down to zero.');
  }
}

main().catch((e) => { console.error(e?.message || e); process.exit(1); });
