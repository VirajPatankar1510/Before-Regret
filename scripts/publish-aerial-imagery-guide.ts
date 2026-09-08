// Publishes the aerial-imagery underwriting guide and links it into the insurance cluster.
//
//   npx tsx scripts/publish-aerial-imagery-guide.ts            # dry run
//   APPLY=true npx tsx scripts/publish-aerial-imagery-guide.ts
//
// -------------------------------------------------------------------------------------------
// WHY THIS PAGE AND NOT THE ONE THAT WAS BRIEFED.
//
// The brief asked for a news-pegged piece built on three URLs. Two of the three did not survive
// checking: the "Michigan Government" source is Globe Midwest Adjusters International, a public
// adjusting firm's marketing blog, and uphelp.org returns 403 to everything from this machine so
// its article could not be confirmed to exist at all. The premium figures in it are real but come
// from Cotality, not United Policyholders.
//
// The third thread was worse. California AB 75 is written up everywhere as a 2026 protection. It
// is not law: held under submission in Senate Appropriations on 29 August 2025, no action in 2026,
// expired with the two-year session on 31 August 2026. A guide telling Californians they have a
// 180-day rule would be actively harmful, so the page carries the correction instead.
//
// -------------------------------------------------------------------------------------------
// THE SOURCING WAS REBUILT ON PRIMARY DOCUMENTS.
//
// Six state bulletins were retrieved and read in full: Pennsylvania 2024-06, Delaware 150, North
// Carolina 25-B-09, Tennessee 25-03, West Virginia 25-02 and Maine 483. Every regulator quote on
// the page comes out of one of those PDFs rather than a secondary summary. Seven more states'
// bulletins (Alabama, Louisiana, Maryland, Massachusetts, Michigan, New Hampshire, Rhode Island)
// 403 from this environment, which is why the page says "at least thirteen states" -- a count
// sourced from Troutman's tracker -- and quotes only the six actually read.
//
// That same 6-of-13 retrieval rate is why the state-by-state tracker was NOT built. A tracker with
// six verified rows and seven guessed ones is worse than no tracker.
//
// -------------------------------------------------------------------------------------------
// LINKING. Two inbound anchors, each added to a paragraph that already discusses how carriers
// assess a roof, so the link sits in prose that was already about the target subject. Both host
// sentences are new but true of the linked page. One outbound to the permits hub, which the body
// already reaches for when it tells a buyer to verify a roof's installation date.
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';
import fs from 'node:fs';
import path from 'node:path';

const APPLY = process.env.APPLY === 'true';

const SLUG = 'home-insurance-aerial-photos-roof';
const TITLE = 'Home Insurance Aerial Photos: Why Roofs Get Flagged';
const META =
  'Insurers score roofs from drone and satellite images, and regulators keep finding the images wrong. What to check before you waive your contingency.';
const QUICK_ANSWER =
  'Home insurers routinely underwrite roofs from aerial images rather than physical inspections, and state regulators reviewing consumer complaints have documented nonrenewals based on images that were outdated, obstructed, or of the wrong property entirely. Cosmetic algae streaking is the most common false flag. Before waiving your contingency, photograph any overhanging branches, ask the seller for the roof invoice and closed permit, and get a real quote from a carrier that has looked at the address.';
const SOURCES = ['PA DOI', 'NC DOI', 'ME BOI', 'WV OIC', 'TN TDCI', 'DE DOI'];

const SRC_MD = path.join(process.cwd(), 'guides', 'aerial-imagery-home-insurance.md');

// Inbound links. `find` must appear exactly once in the host body; `add` is appended to it.
const INBOUND: Array<{ slug: string; find: string; add: string }> = [
  {
    slug: 'get-home-insurance-flat-roof',
    find:
      'When applying for home insurance, particularly on homes over 20 years old, the insurance company will typically require a **4-Point Inspection** or a dedicated roof inspection.',
    add:
      ' Increasingly, that assessment starts before anyone visits: carriers screen roofs from aerial and satellite imagery first, and a low-slope surface with ponding stains is exactly the condition those models flag. What that screening gets right and wrong is covered in our guide to [home insurance aerial photos](/guides/home-insurance-aerial-photos-roof/).',
  },
  {
    slug: 'get-home-insurance-aluminum-wiring',
    find:
      'In states with constrained property insurance markets or frequent severe weather events, insurers require a formal 4-Point inspection report focusing on four major systems: roofing, plumbing, HVAC, and electrical.',
    add:
      ' Of those four, roofing is the one a carrier may judge without entering the property at all, using [aerial imagery of the roof](/guides/home-insurance-aerial-photos-roof/) rather than an inspector.',
  },
];

function bodyFromMarkdown(): string {
  const raw = fs.readFileSync(SRC_MD, 'utf8');
  // Drop the H1 -- prerender-guides.tsx renders <h1>{article.title}</h1> from the title column, so
  // an H1 in the body would produce two.
  const body = raw.replace(/^#\s.*\n+/, '').replace(/^---\n+### Sources/m, '## Sources').trim();
  if (/^#\s/m.test(body)) throw new Error('ABORT: an H1 survived in the body');
  return body;
}

async function main() {
  const rows = (await withDb((sql) => sql`
    SELECT slug, status, title, body_markdown FROM articles WHERE status = 'published'
  `)) as unknown as Array<any>;
  const live = new Set(rows.map((r) => r.slug));
  const byslug = new Map(rows.map((r) => [r.slug, r]));

  if (live.has(SLUG)) throw new Error(`ABORT: ${SLUG} is already published`);

  const body = bodyFromMarkdown();

  // ---- budgets -------------------------------------------------------------------------------
  if (TITLE.length > 60) throw new Error(`ABORT: title ${TITLE.length} chars, over 60`);
  if (META.length > 155) throw new Error(`ABORT: meta ${META.length} chars, over 155`);
  if (META.length < 70) throw new Error(`ABORT: meta only ${META.length} chars`);
  if (!/^## /m.test(body)) throw new Error('ABORT: body has no H2');

  // ---- link integrity ------------------------------------------------------------------------
  const STUDIES = new Set(['risk-without-price', 'risk-without-cover', 'outside-the-zone',
    'high-hazard-dams', 'allegheny-storm-premium', 'north-texas-roof-age', 'raise-or-remove']);
  let bad = 0;
  const check = (slug: string, text: string) => {
    for (const m of text.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/?\)/g)) {
      if (!live.has(m[1]) && m[1] !== SLUG) { console.log(`  DEAD GUIDE LINK: ${slug} -> ${m[1]}`); bad++; }
    }
    for (const m of text.matchAll(/\]\(\/research\/([a-z0-9-]+)\/?\)/g)) {
      if (!STUDIES.has(m[1])) { console.log(`  DEAD STUDY LINK: ${slug} -> ${m[1]}`); bad++; }
    }
    // parseInline in renderArticleMarkdown.tsx does not recurse; these ship as literal markdown.
    for (const re of [/\*\*\[[^\]]*\]\([^)]*\)\*\*/g, /\[\*\*[^\]]*\*\*\]\([^)]*\)/g]) {
      for (const m of text.matchAll(re)) { console.log(`  NESTED LINK: ${slug} -> ${m[0]}`); bad++; }
    }
  };
  check(SLUG, body);

  // ---- claims in the body must match what was actually read ----------------------------------
  // Each of these is a quote or fact taken from a bulletin PDF retrieved and read in full. If the
  // prose is later edited away from the source, this fires rather than letting a paraphrase drift.
  const REQUIRED = [
    'well-manicured flower beds',        // NC 25-B-09, verbatim from the bulletin
    '18 months old',                     // ME 483
    'sole evidence',                     // PA 2024-06
    'held under submission',             // AB 75 legislative history
    '29 August 2025',                    // AB 75, date of that action
    'Cotality',                          // the premium projection's real source
  ];
  for (const q of REQUIRED) {
    if (!body.includes(q)) { console.log(`  MISSING SOURCED CLAIM: "${q}"`); bad++; }
  }
  // Things the page must NOT say, because checking showed they are false or unattributable.
  const BANNED = [
    'United Policyholders',              // the cited article could not be confirmed to exist
    'globemw',                           // an adjuster's blog, not the state of Michigan
    'takes effect July 1, 2026',         // AB 75 never took effect
    'is now law',
  ];
  for (const q of BANNED) {
    if (body.toLowerCase().includes(q.toLowerCase())) { console.log(`  BANNED CLAIM PRESENT: "${q}"`); bad++; }
  }

  // ---- inbound edits --------------------------------------------------------------------------
  const hostWrites: Array<{ slug: string; body: string }> = [];
  for (const ib of INBOUND) {
    const host = byslug.get(ib.slug);
    if (!host) throw new Error(`ABORT: host ${ib.slug} is not published`);
    const n = host.body_markdown.split(ib.find).length - 1;
    if (n !== 1) throw new Error(`ABORT: anchor in ${ib.slug} matched ${n} times, expected exactly 1`);
    if (host.body_markdown.includes(`/guides/${SLUG}/`)) throw new Error(`ABORT: ${ib.slug} already links to ${SLUG}`);
    const next = host.body_markdown.replace(ib.find, ib.find + ib.add);
    check(ib.slug, next);
    hostWrites.push({ slug: ib.slug, body: next });
  }

  if (bad) throw new Error(`ABORT: ${bad} defect(s)`);

  // ---- report ---------------------------------------------------------------------------------
  console.log(`\n  NEW  /guides/${SLUG}/`);
  console.log(`    title (${TITLE.length})  ${TITLE}`);
  console.log(`    meta  (${META.length})  ${META}`);
  console.log(`    body  ${body.length} chars, ${(body.match(/^## /gm) || []).length} H2s, ${body.split(/\s+/).length} words`);
  console.log(`    outbound: ${[...body.matchAll(/\]\(\/guides\/([a-z0-9-]+)/g)].map((m) => m[1]).join(', ') || 'none'}`);
  console.log(`\n  INBOUND (${hostWrites.length})`);
  for (const h of hostWrites) console.log(`    ${h.slug}  ${byslug.get(h.slug)!.body_markdown.length} -> ${h.body.length} chars`);
  console.log(`\n  ok  ${REQUIRED.length} sourced claims present, ${BANNED.length} unsupported claims absent`);
  console.log(`  ok  published library ${rows.length} -> ${rows.length + 1}`);

  if (!APPLY) { console.log('\n  DRY RUN -- nothing written.'); return; }

  await withDb((sql) => sql`
    INSERT INTO articles (slug, title, meta_description, quick_answer, body_markdown,
                          sources_json, status, article_type, ad_tier, published_at)
    VALUES (${SLUG}, ${TITLE}, ${META}, ${QUICK_ANSWER}, ${body},
            ${JSON.stringify(SOURCES)}, 'published', 'guide', 'standard', now())`);
  console.log(`  wrote ${SLUG}`);
  for (const h of hostWrites) {
    await withDb((sql) => sql`UPDATE articles SET body_markdown = ${h.body}, updated_at = now()
      WHERE slug = ${h.slug}`);
    console.log(`  wrote ${h.slug}`);
  }
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
