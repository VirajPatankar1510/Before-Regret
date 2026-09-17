// A controlled test: does a meta description that ANSWERS, instead of teasing, build brand search?
//
//   npx tsx scripts/zero-click-meta-test.ts            # dry run
//   APPLY=true npx tsx scripts/zero-click-meta-test.ts
//
// -----------------------------------------------------------------------------------------------
// THE PREMISE, from this site's own numbers rather than anyone's study of zero-click search.
//
// Over 2026-08-18..09-14: 7,291 impressions, 49 clicks. 99.33% of the times Google showed this site
// to someone, they did not visit. That is 7,242 exposures to US home buyers in 28 days -- the shape
// of a display campaign nobody is treating as one.
//
// What those 7,242 exposures currently carry: 38 of 68 guides have a meta description that TEASES
// ("learn", "discover", "find out"), 3 of 68 state a verdict or a figure, and 0 of 68 titles carry
// the brand. Brand queries in the same window: 0.
//
// Conventional practice writes the meta to maximise CTR -- withhold, tease, earn the click. At
// 0.67% CTR that optimises for 49 people and wastes 7,242. The inversion under test: give the
// answer ON the SERP. The reader gets what they came for, does not click, and has a reason to
// remember where it came from.
//
// -----------------------------------------------------------------------------------------------
// WHAT IS DELIBERATELY NOT IN THIS TEST: the brand in the title.
//
// It was half the proposal and it does not survive contact with the character budget. " |
// BeforeRegret" is 14 characters against a 60-character title limit, and of the 24 pages with 60+
// impressions, exactly ONE has a title short enough to take it without cutting keywords
// (federal-pacific-stab-lok, 41 chars). Adding it to the rest would mean shortening titles that
// currently rank, to buy brand exposure Google may already be supplying -- it commonly appends the
// site name to SERP titles on its own, and og:site_name is set to "Before Regret" sitewide.
//
// Testing both at once would also have confounded the result across six pages, which is too few to
// split into arms. One variable.
//
// -----------------------------------------------------------------------------------------------
// DESIGN. Six pages, chosen for impressions and for having a real answer to state -- a county
// permit page's honest meta is "here is the portal", which is not the same kind of claim. Control
// is the other 62 published guides, with every baseline recorded.
//
// The four pages already under the verdict test (va-loan, sump-pump, reverse-polarity) and the
// execution-pivot page (why-cast-iron-pipes-corrode) are EXCLUDED. Running two treatments over one
// page would make both readouts worthless, and the verdict test's control group is where those
// pages currently sit.
//
// PRIMARY METRIC: brand queries, currently a hard zero. Nothing else changed today can move it, so
// movement is attributable. SECONDARY: CTR on the six, which may fall -- a reader who got the
// answer has less reason to click, and that is the trade this whole idea accepts.
//
// LIMITS: n=6; Google rewrites meta descriptions often, so the text shipped is not guaranteed to be
// the text shown; and brand search is slow, so a null result at 4 weeks means nothing either way.
import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withDb } from '../src/server/db.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APPLY = process.env.APPLY === 'true';
const MANIFEST = path.join(ROOT, 'data', 'zero-click-meta-test.json');

const TEASE = /\b(learn|discover|find out|here'?s how|what you need to know|everything you|understand how)\b/i;
const NAMED_CARRIER = /\b(State Farm|Allstate|Geico|Progressive|Farmers|USAA|Liberty Mutual|Nationwide|Travelers|Citizens Property|American Family|Erie Insurance)\b/;
/** "most insurers refuse X" passes a carrier-name regex and is still inventing. */
const BLANKET_CARRIER = /\b(most|all|every|no)\s+(insurers?|carriers?)\s+\w+/i;

interface T { slug: string; meta: string; keep: string[] }

const TREATMENT: T[] = [
  {
    slug: 'open-ground-mean-electrical-inspection',
    meta: 'An open ground means a three-prong outlet has no grounding path: a shock risk that also leaves surge protectors doing nothing. Who can fix it, and how.',
    keep: ['open ground', 'three-prong', 'grounding'],
  },
  {
    slug: 'get-home-insurance-aluminum-wiring',
    meta: 'Often yes, but only once the connections are remediated. What underwriting weighs on single-strand aluminium branch circuits, and how to get it in writing.',
    keep: ['aluminium', 'remediated', 'writing'],
  },
  {
    slug: 'tpr-valve-inspectors-always-check',
    meta: 'A TPR valve dumps excess heat and pressure before a water heater can rupture. Inspectors check it because a blocked one removes the only safeguard.',
    keep: ['TPR valve', 'rupture', 'Inspectors check it'],
  },
  {
    slug: 'who-s-responsible-shared-well-shared-driveway',
    meta: 'Whatever the recorded easement says. With no written agreement, maintenance costs usually fall proportionally on everyone who benefits. What to read first.',
    keep: ['recorded easement', 'maintenance costs', 'proportionally'],
  },
  {
    slug: 'orangeburg-pipe-collapse',
    meta: 'Orangeburg is sewer pipe made from wood fibre and tar, laid 1940s to 1970s. It soaks up water, deforms under soil weight, then collapses. How to spot it.',
    keep: ['wood fibre', 'deforms', 'collapses'],
  },
  {
    slug: 'happens-if-termite-infestation-found-during-home-inspection',
    meta: 'The sale usually pauses for licensed treatment and a clear wood-destroying organism report, which lenders often require. Who pays is then negotiated.',
    keep: ['licensed treatment', 'wood-destroying organism', 'negotiated'],
  },
];

async function main() {
  const slugs = TREATMENT.map((t) => t.slug);
  let rows: any[] | null = null;
  for (let a = 1; a <= 4 && !rows; a++) {
    try {
      rows = (await withDb((sql) => sql`
        SELECT slug, title, meta_description FROM articles WHERE status='published'`)) as unknown as any[];
    } catch (e) {
      console.error(`  neon attempt ${a}: ${(e as Error).message.slice(0, 70)}`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  if (!rows) throw new Error('ABORT: database unreachable after 4 attempts');

  const baseline = rows.map((r) => ({
    slug: r.slug,
    meta_teases: TEASE.test(String(r.meta_description ?? '')),
    meta_len: String(r.meta_description ?? '').length,
    arm: slugs.includes(r.slug) ? 'treatment' : 'control',
  }));

  const staged: Array<{ slug: string; before: string; after: string }> = [];
  for (const t of TREATMENT) {
    const cur = rows.find((r) => r.slug === t.slug);
    if (!cur) throw new Error(`ABORT: ${t.slug} is not published`);
    const before = String(cur.meta_description ?? '');
    if (!TEASE.test(before)) throw new Error(`ABORT: ${t.slug} meta does not currently tease -- nothing to invert`);
    if (TEASE.test(t.meta)) throw new Error(`ABORT: ${t.slug} replacement still teases`);
    if (t.meta.length < 70 || t.meta.length > 155) throw new Error(`ABORT: ${t.slug} meta ${t.meta.length} chars, budget 70-155`);
    if (NAMED_CARRIER.test(t.meta)) throw new Error(`ABORT: ${t.slug} names a carrier`);
    if (BLANKET_CARRIER.test(t.meta)) throw new Error(`ABORT: ${t.slug} makes a blanket carrier claim`);
    for (const k of t.keep) {
      if (!t.meta.includes(k)) throw new Error(`ABORT: ${t.slug} replacement is missing "${k}"`);
    }
    staged.push({ slug: t.slug, before, after: t.meta });
    console.log(`\n  ${t.slug}`);
    console.log(`    ${before.length} -> ${t.meta.length} chars`);
    console.log(`    was  "${before.slice(0, 74)}..."`);
    console.log(`    now  "${t.meta.slice(0, 74)}..."`);
  }

  const teasingControls = baseline.filter((b) => b.arm === 'control' && b.meta_teases).length;
  console.log(`\n  BASELINE`);
  console.log(`    treatment: ${staged.length} pages, all currently teasing`);
  console.log(`    control  : ${baseline.length - staged.length} pages, ${teasingControls} of them still teasing`);
  console.log(`    brand queries at start: 0  (the primary metric, and a hard zero)`);

  if (!APPLY) { console.log('\n  DRY RUN -- nothing written.\n'); return; }
  for (const s of staged) {
    await withDb((sql) => sql`UPDATE articles SET meta_description = ${s.after}, updated_at = now() WHERE slug = ${s.slug}`);
    console.log(`  wrote ${s.slug}`);
  }
  fs.writeFileSync(MANIFEST, `${JSON.stringify({
    hypothesis: 'A meta description that answers the query, instead of teasing it, converts zero-click impressions into brand recall — measurable as brand search appearing where there is currently none.',
    started: new Date().toISOString().slice(0, 10),
    zero_click_rate_at_start: '99.33% (7,291 impressions, 49 clicks, 2026-08-18..09-14)',
    primary_metric: 'brand queries in Search Console — 0 at start',
    secondary_metric: 'CTR on the six treated pages; expected to fall, which the hypothesis accepts',
    not_tested: 'Brand in the title. " | BeforeRegret" is 14 of a 60-character budget and only 1 of 24 pages with 60+ impressions can take it without cutting keywords. Google also commonly appends the site name itself, and og:site_name is set sitewide.',
    excluded_pages: ['va-loan-require-termite-inspection', 'homeowners-insurance-cover-failed-sump-pump', 'reverse-polarity-mean-electrical-inspection', 'why-cast-iron-pipes-corrode'],
    excluded_reason: 'Already carrying another live treatment — two treatments on one page makes both readouts worthless.',
    limits: ['n=6', 'Google rewrites meta descriptions, so the text shipped is not guaranteed to be shown', 'brand search is slow; a null result at 4 weeks means nothing either way'],
    treatment: staged,
    baseline,
  }, null, 2)}\n`);
  console.log(`\n  wrote data/zero-click-meta-test.json -- baseline for all ${baseline.length} pages\n`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
