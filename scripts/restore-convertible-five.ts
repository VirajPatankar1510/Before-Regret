// Restore the first five removed guides whose queries a reader can actually convert on.
//
//   npx tsx scripts/restore-convertible-five.ts            # dry run
//   APPLY=true npx tsx scripts/restore-convertible-five.ts
//
// -----------------------------------------------------------------------------------------------
// WHY THESE FIVE, AND WHY NOT MORE COUNTY PERMIT GUIDES.
//
// A 28-day Search Console pull classified every query by shape. Of the 341 impressions this site
// earns at positions 1-10, 213 -- 62% -- are structurally unconvertible: navigational queries where
// the searcher wants a government portal (idis los angeles, cook county permit portal), foreign-
// language queries served an English page (qué significa conexión a tierra abierta, open ground
// artinya), and junk ("yes", 12 impressions at position 7.1). The whole page-one band produced ONE
// click in 28 days, and that is the entire explanation for a 0.69% sitewide CTR. It is not a title
// problem. We rank for things people do not want us for.
//
// Measured against that, the county permit cluster is the wrong thing to restore: 13 pages, 2,670
// impressions, 15 clicks, 0.56% CTR at an average position of 16.3 -- ranking ten places better
// than the rest of the site and converting a third worse.
//
// These five are the opposite case. All five are still earning Google impressions WHILE ANSWERING
// 410, all five are decision-shaped, and none is navigational:
//
//     52i        pos 19   standard-home-inspection-check-asbestos
//     41i  1clk  pos 16   when-reasonable-walk-away-after-inspection
//     30i        pos 28   home-inspection-check-mold-behind-walls
//     19i        pos 78   prove-roof-age-for-insurance
//     18i  1clk  pos 13   buying-house-reset-property-tax-assessment-sale-price
//
// The indexing rule does not bite, for the same reason scripts/restore-page-one-removed.ts gives:
// Google already has these, already ranks them, and is already showing them to people. Restoring
// asks for no new crawl budget; it makes URLs resolve that Google points at today.
//
// FIVE, NOT FIFTEEN. The 2026-09-02 prune existed for a real reason -- 155 guides in 19 days on a
// domain with zero inbound links is the scaled-content shape Google suppresses at site level. Ten
// more removed pages still earn impressions; they wait until these five report back.
//
// DELIBERATELY EXCLUDED, and this is the trap in this batch: pest-inspectors-wish-buyers-knew-
// about-termites, contractors-wish-buyers-knew-about-renovation-costs and insurance-agents-wish-
// buyers-knew-about-coverage all earn impressions and all rank between 2 and 7. They are three of
// the six "what X wish buyers knew" pages -- the formula the content standard names as the most
// legible scaled-content marker in the library, and which restore-page-one-removed.ts already
// declined to rebuild for the same reason. Ranking is not the only test.
//
// -----------------------------------------------------------------------------------------------
// EDITED, NOT MERELY RE-PUBLISHED. Each page had a real defect, and flipping status without fixing
// them would republish known-bad pages:
//
//   - mold-behind-walls carried a 158-character meta description, over the 155 budget.
//   - prove-roof-age carried a 500-character quick_answer, over the 450 mobile ceiling. Mobile is
//     the majority of clicks on this property, so that ceiling is a truncation limit, not a style.
//   - four of the five contained ZERO links to another guide, i.e. they would return as dead ends.
//     That is the orphaning that cost this site impressions in early September.
//
// Every link below is placed in a section that already discusses the subject -- the mold guide's
// own "Synthetic Stucco (EIFS) Enclosures" heading, the roof guide's own "Aerial imagery" step --
// rather than a sentence invented to carry a link.
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';

interface Edit {
  slug: string;
  meta?: string;
  quickAnswer?: string;
  /** Each: find this text, append that text after it. Both asserted present/absent first. */
  links: Array<{ anchor: RegExp; append: string; targets: string[] }>;
}

const EDITS: Edit[] = [
  {
    slug: 'standard-home-inspection-check-asbestos',
    links: [{
      // Placed under the section that explains the exclusion, because the point being made there
      // -- a general inspection is not scoped to this -- is the same point the linked guides make.
      anchor: /(## Why Standard Home Inspections Exclude Asbestos\n)/,
      append:
        '\nAsbestos is one of several things a general inspection is not scoped to find. The same limit is why [termites and other wood-destroying organisms](/guides/standard-home-inspection-include-termites/) need their own inspector, and why a report noting [evidence of a prior repair](/guides/evidence-prior-repair-mean-home-inspection-report/) without saying what was repaired is worth a follow-up question.\n',
      targets: ['standard-home-inspection-include-termites', 'evidence-prior-repair-mean-home-inspection-report'],
    }],
  },
  {
    slug: 'when-reasonable-walk-away-after-inspection',
    links: [
      {
        // This guide already has a "Lead-Based Paint and Asbestos" subsection. The asbestos guide
        // restored in this same batch is its continuation.
        anchor: /(### Lead-Based Paint and Asbestos\n)/,
        append:
          '\nWhat a general inspection will and will not tell you about the second of those is a subject in itself: [does a standard home inspection check for asbestos](/guides/standard-home-inspection-check-asbestos/).\n',
        targets: ['standard-home-inspection-check-asbestos'],
      },
      {
        anchor: /(## Structural and Foundation Failures\n)/,
        append:
          '\nThe threshold question here is usually whether the crack is cosmetic or structural, which has its own answer: [when a foundation crack needs a structural engineer](/guides/when-foundation-crack-need-structural-engineer/).\n',
        targets: ['when-foundation-crack-need-structural-engineer'],
      },
      {
        anchor: /(## Systemic Plumbing and Sewer Failures\n)/,
        append:
          '\nOn cast iron specifically, the difference between a spot repair and a full replacement is the difference between a credit and a reason to leave: [what scoping and repairing cast iron actually costs](/guides/why-cast-iron-pipes-corrode/).\n',
        targets: ['why-cast-iron-pipes-corrode'],
      },
    ],
  },
  {
    slug: 'home-inspection-check-mold-behind-walls',
    // 158 -> within budget, and it keeps the answer ("no, it is visual") in the first clause.
    meta:
      'A standard home inspection is visual and non-invasive, so it cannot see mold inside a wall cavity. What an inspector can detect, and what finds the rest.',
    links: [{
      // The guide already has a "Synthetic Stucco (EIFS) Enclosures" section; the EIFS guide is the
      // natural continuation of it rather than an unrelated recommendation.
      anchor: /(### Synthetic Stucco \(EIFS\) Enclosures\n)/,
      append:
        '\nEIFS is a large enough subject on its own that it has a separate guide: [what a standard inspection does and does not check on synthetic stucco](/guides/standard-home-inspection-check-eifs-stucco-moisture/). The same non-invasive limit is why [a septic system is inspected separately](/guides/home-inspection-include-septic-system/) too.\n',
      targets: ['standard-home-inspection-check-eifs-stucco-moisture', 'home-inspection-include-septic-system'],
    }],
  },
  {
    slug: 'prove-roof-age-for-insurance',
    // 500 -> under the 450 mobile ceiling, keeping the ladder and the timing instruction, which are
    // the two things a reader acts on.
    quickAnswer:
      "Start with your county's permit portal: a roofing permit is the strongest evidence of roof age and is usually free to search. If no permit exists, the accepted fallbacks are the seller's contractor invoice, then a written certification from a licensed roofer stating the roof's type, condition and remaining life. Ask the carrier which it accepts before paying for anything, and do it while you are still under contract.",
    links: [{
      // The guide already has a numbered "4. Aerial imagery" step. That is where the aerial guide
      // belongs, not in a footer.
      anchor: /(### 4\. Aerial imagery\n)/,
      append:
        '\nCarriers increasingly read roof condition off aerial photography before anyone visits, which is its own subject: [what insurers see in aerial photos of your roof](/guides/home-insurance-aerial-photos-roof/). A [flat roof](/guides/get-home-insurance-flat-roof/) is underwritten differently again.\n',
      targets: ['home-insurance-aerial-photos-roof', 'get-home-insurance-flat-roof'],
    }],
  },
  {
    slug: 'buying-house-reset-property-tax-assessment-sale-price',
    links: [{
      anchor: /(## Action Step for Buyers Today\n)/,
      append:
        '\nThe same county office that holds the assessment usually holds the permit record, and an unpermitted addition can raise an assessment as surely as a sale can: [how to look up building permits by address](/guides/look-up-building-permits-by-address/).\n',
      targets: ['look-up-building-permits-by-address'],
    }],
  },
];

async function main() {
  let rows: any[] | null = null;
  const slugs = EDITS.map((e) => e.slug);
  for (let a = 1; a <= 4 && !rows; a++) {
    try {
      rows = (await withDb((sql) => sql`
        SELECT slug, title, meta_description, quick_answer, body_markdown, status
        FROM articles WHERE slug = ANY(${slugs})
      `)) as unknown as any[];
    } catch (e) {
      console.error(`  neon attempt ${a}: ${(e as Error).message.slice(0, 70)}`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  if (!rows) throw new Error('ABORT: database unreachable after 4 attempts');
  if (rows.length !== EDITS.length) {
    throw new Error(`ABORT: expected ${EDITS.length} rows, got ${rows.length}`);
  }

  const staged: Array<{ slug: string; title: string; meta: string; tldr: string; body: string }> = [];

  for (const edit of EDITS) {
    const cur = rows.find((r) => r.slug === edit.slug);
    if (!cur) throw new Error(`ABORT: ${edit.slug} not in articles`);
    if (cur.status !== 'removed') throw new Error(`ABORT: ${edit.slug} is "${cur.status}", expected "removed"`);

    let body = String(cur.body_markdown);
    const meta = edit.meta ?? String(cur.meta_description);
    const tldr = edit.quickAnswer ?? String(cur.quick_answer);
    const title = String(cur.title);

    for (const l of edit.links) {
      // Never add a link the page already has -- that is how duplicate anchors get built.
      for (const t of l.targets) {
        if (body.includes(`/guides/${t}/`)) throw new Error(`ABORT: ${edit.slug} already links ${t}`);
      }
      const m = body.match(l.anchor);
      if (!m) throw new Error(`ABORT: ${edit.slug} -- link anchor ${l.anchor} not found; the article changed`);
      body = body.replace(l.anchor, `${m[0]}${l.append}`);
    }

    // --- gates, the same ones assert-canonical-urls.ts enforces on the built page ---
    if (title.length > 60) throw new Error(`ABORT: ${edit.slug} title ${title.length}`);
    if (meta.length > 155 || meta.length < 70) throw new Error(`ABORT: ${edit.slug} meta ${meta.length}`);
    if (tldr.length > 450 || tldr.length < 120) throw new Error(`ABORT: ${edit.slug} tldr ${tldr.length}`);
    for (const re of [/\*\*\[[^\]]*\]\([^)]*\)\*\*/g, /\[\*\*[^\]]*\*\*\]\([^)]*\)/g]) {
      if (re.test(body)) throw new Error(`ABORT: ${edit.slug} bold-wrapped link`);
    }
    const outbound = new Set((body.match(/\/guides\/([a-z0-9-]+)/g) ?? []));
    if (outbound.size < 1) throw new Error(`ABORT: ${edit.slug} still a dead end`);

    staged.push({ slug: edit.slug, title, meta, tldr, body });

    const d = (was: number, now: number) => (was === now ? `${now}` : `${was} -> ${now}`);
    console.log(`\n  ${edit.slug}`);
    console.log(`    title ${title.length} | meta ${d(String(cur.meta_description).length, meta.length)} | tldr ${d(String(cur.quick_answer).length, tldr.length)}`);
    console.log(`    body  ${String(cur.body_markdown).length} -> ${body.length}  | outbound guide links ${outbound.size}`);
  }

  if (!APPLY) { console.log('\n  DRY RUN -- nothing written.\n'); return; }

  for (const s of staged) {
    await withDb((sql) => sql`
      UPDATE articles SET status = 'published', meta_description = ${s.meta},
        quick_answer = ${s.tldr}, body_markdown = ${s.body}, updated_at = now()
      WHERE slug = ${s.slug}`);
    console.log(`  published ${s.slug}`);
  }
  console.log(`\n  ${staged.length} restored. Remove them from src/data/prunedGuides.ts, then rebuild.\n`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
