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

// Real, current pages. Anything here that showed up as "not published" would be a false alarm
// from the coverage query's own URL-shape matching, not a legacy URL.
const CURRENT_PAGES = new Set([
  '/', '/guides/', '/counties/', '/about/', '/terms/', '/privacy/', '/refunds/',
  '/disclaimer/', '/accessibility/', '/support/', '/advertise/', '/topic-ads/', '/report-ads/',
  // Trailing-slash-less duplicates of real pages. Both serve 200 and both carry a canonical
  // pointing at the slash form, so Google consolidates them -- not an eviction problem.
  '/guides', '/privacy', '/terms', '/about', '/counties',
]);

async function statusOf(path: string, userAgent?: string): Promise<number> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${BASE}${path}`, {
        method: 'GET',
        redirect: 'manual',
        headers: userAgent ? { 'User-Agent': userAgent } : {},
        signal: AbortSignal.timeout(20000),
      });
      return res.status;
    } catch {
      if (attempt === 3) return 0; // 0 = never got an answer, reported as unknown rather than a pass
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  return 0;
}

const GOOGLEBOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

async function main() {
  console.log('=== 1. ARE THE LEGACY URLS STILL GONE? (our code) ===\n');
  let failures = 0;
  for (const path of LEGACY_URLS_TO_VERIFY) {
    // Checked as Googlebot specifically: the thing that matters is what the crawler is told, and a
    // CDN or edge rule that treats bots differently would be invisible to a plain request.
    const [plain, bot] = await Promise.all([statusOf(path), statusOf(path, GOOGLEBOT)]);
    const ok = plain === 410 && bot === 410;
    if (!ok) failures++;
    console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${path.padEnd(46)} plain=${plain} googlebot=${bot}`);
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

  const published = new Set<string>();
  for (const r of (await withDb((sql) => sql`SELECT slug FROM articles WHERE status='published'`)) as any[]) {
    published.add(`${BASE}/guides/${r.slug}/`);
  }
  for (const r of (await withDb((sql) => sql`SELECT slug FROM county_data WHERE data_complete=true`)) as any[]) {
    published.add(`${BASE}/county/${r.slug}/`);
  }

  const windows: Record<number, { urls: number; impressions: number; list: string[] }> = {};
  for (const days of [90, 28, 7]) {
    const pages = await fetchPagePerformance(days);
    const legacy = pages.filter((p) => {
      const path = p.page.replace(BASE, '');
      return !published.has(p.page) && !CURRENT_PAGES.has(path) && !CURRENT_PAGES.has(path.replace(/\/$/, ''));
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
    console.log('\n  !! NOT COVERED by the 410 rules -- add these to src/data/legacyUrls.ts:');
    for (const u of uncovered) console.log(`     ${u}`);
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
