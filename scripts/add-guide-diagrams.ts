// Places rendered diagrams into the guides they illustrate.
//
//   npx tsx scripts/add-guide-diagrams.ts            # dry run
//   APPLY=true npx tsx scripts/add-guide-diagrams.ts
//
// -----------------------------------------------------------------------------------------------
// WHICH PAGES AND WHY. Not the pages that look like they need a picture -- the pages Google already
// cites. Over 2026-08-18..09-14 the AI-features export shows 889 impressions across 64 pages, and
// seven of the top eight carry no image at all. In an AI Overview the image is downstream of the
// citation: Google picks its sources, then may show an image FROM a source it already chose. So the
// highest-value place for a diagram is a page that is already being pulled into answers.
//
// THE GOLDEN RULE, ENFORCED RATHER THAN INTENDED. Nothing may live only in pixels. Every label
// drawn in a diagram has to be findable as text in the article body, and the script refuses to
// insert an image whose labels the prose does not already use. A crawler that never renders the
// image must lose nothing.
//
// Body-only changes. quick_answer is untouched, so pages stay in whichever arm of the
// Generative-AI verdict test they are already in -- that test's variable is the opening of the
// quick answer, and a diagram in the body does not touch it.
//
// THREE STEPS, IN THIS ORDER. Miss the middle one and the page still builds, which is why it is
// worth writing down: the schema quietly falls back to a bare URL string with no width or height.
//
//   APPLY=1 python3 scripts/render-guide-diagrams.py    # draw it
//   APPLY=1 python3 scripts/measure-images.py           # regenerate src/data/imageDimensions.ts
//   APPLY=true npx tsx scripts/add-guide-diagrams.ts    # place it, then `npm run build`
//
// The measure step is Python and the build is Node, so it cannot join the build chain -- the same
// reason scripts/render-research-charts.py sits outside it.
import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { extractFirstArticleImage } from '../src/utils/articleImage.js';

const APPLY = process.env.APPLY === 'true';

interface Placement {
  slug: string;
  image: string;
  /** Heading to insert directly beneath. */
  anchor: string;
  alt: string;
  /** Words drawn in the image. Each must already appear in the article body. */
  labels: string[];
}

const PLACEMENTS: Placement[] = [
  {
    slug: 'get-home-insurance-aluminum-wiring',
    image: '/images/single-strand-aluminum-vs-copper-wiring-identification.webp',
    anchor: '## How Inspectors and Underwriters Spot Aluminum Wiring',
    alt:
      'Diagram comparing single-strand aluminum and copper branch wiring at a terminal screw. The ' +
      'aluminum cable jacket is stamped AL or ALUMINUM and the bare conductor is silver-grey; the ' +
      'copper cable carries no AL marking and its conductor is reddish-gold. Period brand names ' +
      'Alcan, Kaiser and General Cable also appear on aluminum jackets. Inspectors look behind the ' +
      'panel dead-front cover, inside open junction boxes and at sampled outlet receptacles.',
    labels: ['single-strand', 'aluminum', 'copper', 'silver-grey', 'reddish-gold',
             'dead-front', 'junction box', 'receptacle', 'Alcan', 'Kaiser', 'General Cable'],
  },
  {
    slug: 'who-s-responsible-shared-well-shared-driveway',
    image: '/images/shared-well-and-y-shaped-driveway-responsibility.webp',
    anchor: '## The Legal Risks of Shared Property and Shared Utility Wells',
    alt:
      'Site diagram of two homes sharing a well and a Y-shaped driveway. The shared well feeds both ' +
      'houses through a pump, pressure tank and water lines, with the pump wired to one house’s ' +
      'panel so that owner pays the electricity. The driveway shares a single entrance from the ' +
      'public road before splitting into private branches, and the shared portion is typically ' +
      'split fifty-fifty. A recorded easement, a written maintenance agreement and a Shared Well ' +
      'Agreement are enforceable; a handshake with the current neighbour is not.',
    labels: ['easement', 'recorded', 'deed', 'maintenance agreement', 'shared well',
             'driveway', 'pressure tank', 'fifty-fifty', 'handshake'],
  },
  {
    slug: 'get-home-insurance-fuse-box',
    image: '/images/edison-base-fuse-over-fusing-risk.webp',
    anchor: '## The Three Main Risks That Trigger Insurance Refusals',
    alt:
      'Diagram showing why a fuse panel worries an underwriter. Screw-in Edison-base fuses rated ' +
      '15A, 20A and 30A share an identical thread, so all three fit the same socket and nothing in ' +
      'the panel prevents the wrong one being fitted. The branch wiring remains 15-amp and carries ' +
      'more current than the conductors can handle, heating inside the wall. This is over-fusing. ' +
      'A modern breaker panel matches breakers to the bus slot so the wrong rating does not fit.',
    labels: ['Edison', 'over-fusing', 'branch wiring', 'breaker', 'amp', 'panel', 'fuse'],
  },
  {
    slug: 'reverse-polarity-mean-electrical-inspection',
    image: '/images/reverse-polarity-vs-correct-receptacle-wiring.webp',
    anchor: '## Understanding Polarity in Standard Electrical Circuits',
    alt:
      'Two receptacles shown face-on for comparison. Correctly wired, the black hot conductor lands ' +
      'on a brass terminal screw and the white neutral on a silver screw, with bare copper on the ' +
      'green ground screw. With reverse polarity the two are swapped: white goes to the brass screw ' +
      'and black to the silver one. The outlet still works, but the metal shell of a lamp socket ' +
      'plugged into it stays energized.',
    labels: ['brass', 'silver', 'hot', 'neutral', 'terminal', 'receptacle', 'shell', 'ground'],
  },
];

async function main() {
  const slugs = PLACEMENTS.map((p) => p.slug);
  const rows = (await withDb((sql) => sql`
    SELECT slug, body_markdown FROM articles WHERE slug = ANY(${slugs}) AND status='published'`)) as unknown as any[];

  const staged: Array<{ slug: string; body: string; before: string | null; after: string | null }> = [];

  for (const p of PLACEMENTS) {
    const row = rows.find((r) => r.slug === p.slug);
    if (!row) throw new Error(`ABORT: ${p.slug} is not published`);
    const body = String(row.body_markdown);

    if (!fs.existsSync(path.join(process.cwd(), 'public', p.image))) {
      throw new Error(`ABORT: ${p.image} has not been rendered`);
    }
    // Already placed is a skip, not a failure. This script holds every placement, so it gets
    // re-run whenever one is added, and aborting on the first one already done would mean the
    // list could never grow.
    if (body.includes(p.image)) { console.log(`  ${p.slug}: already carries this diagram, skipping`); continue; }
    if (!body.includes(p.anchor)) throw new Error(`ABORT: ${p.slug} has no heading "${p.anchor}"`);

    // The rule that matters: nothing may exist only inside the image.
    const missing = p.labels.filter((l) => !new RegExp(l.replace(/[-\s]/g, '[-\\s]'), 'i').test(body));
    if (missing.length) {
      throw new Error(`ABORT: ${p.slug} draws ${missing.join(', ')} but the prose never uses ${missing.length > 1 ? 'those words' : 'that word'}`);
    }

    const next = body.replace(p.anchor, `${p.anchor}\n\n![${p.alt}](${p.image})`);
    const after = extractFirstArticleImage(next);
    if (!after) throw new Error(`ABORT: ${p.slug} image is not recognised as a block image`);

    staged.push({ slug: p.slug, body: next, before: extractFirstArticleImage(body), after });

    console.log(`\n  ${p.slug}`);
    console.log(`    image        : ${p.image.split('/').pop()}`);
    console.log(`    under        : ${p.anchor}`);
    console.log(`    alt          : ${p.alt.length} chars`);
    console.log(`    labels checked: ${p.labels.length}, all present in the prose`);
    console.log(`    schema image : ${(extractFirstArticleImage(body) ?? 'hero-bg.jpg fallback').split('/').pop()} -> ${after.split('/').pop()}`);
  }

  console.log(`\n  ${staged.length} page(s) staged. quick_answer, title, meta, slug, canonical unchanged.`);
  if (!APPLY) { console.log('\n  DRY RUN -- nothing written.\n'); return; }
  for (const s of staged) {
    await withDb((sql) => sql`UPDATE articles SET body_markdown = ${s.body}, updated_at = now() WHERE slug = ${s.slug}`);
    console.log(`  wrote ${s.slug}`);
  }
  console.log('\n  Guides are prerendered -- run `npm run build` or this is not live.\n');
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
