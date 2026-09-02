// Adds in-body contextual links across the eight electrical guides.
//
//   npx tsx scripts/add-electrical-cluster-links.ts            # dry run, asserts every match
//   APPLY=true npx tsx scripts/add-electrical-cluster-links.ts
//
// WHY. Measured 2026-09-02 across the 35 surviving guides: 14 in-body links site-wide, and 26 of
// 35 pages had none at all. All eight electrical guides had zero. With no inbound links from
// anywhere else, internal links are both the only way authority moves between pages and the main
// way a crawler reaches them, so a cluster that never links to itself is eight pages Googlebot has
// little reason to walk between. The "Related Guides" module was retuned separately (see
// src/utils/relatedGuides.ts) but a module is a weaker signal than a link a human placed in a
// sentence, and Google says so.
//
// EVERY LINK BELOW SITS ON TEXT THAT ALREADY DISCUSSED THE TARGET. Nothing was inserted to create
// an excuse for a link, and no new factual claim is introduced -- each edit either wraps existing
// words in a link or, in the single case noted, appends a clause that the destination article
// itself already establishes. Anchors are the words a reader would click, not "click here" and not
// the bare title.
//
// TWO DELIBERATE GAPS, recorded so nobody assumes they were missed:
//   - get-home-insurance-aluminum-wiring links out to nothing and receives nothing. No sibling
//     mentions aluminum wiring, and it mentions no sibling. Manufacturing an anchor would have
//     meant writing a claim into the article purely to justify a link, which is the exact
//     bolted-on linking this is meant to replace.
//   - double-tapped-breaker links out but receives nothing, for the same reason: nothing else in
//     the cluster discusses double-taps.
// Both are still reachable: the /guides/ hub links all 35 published guides.
import 'dotenv/config';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';
const G = (slug: string) => `/guides/${slug}/`;

interface Edit { slug: string; find: string; replace: string; to: string; }

const EDITS: Edit[] = [
  // ---- open-ground ----
  {
    slug: 'open-ground-mean-electrical-inspection',
    to: 'need-gfci-outlets-pass-home-inspection',
    find: 'The NEC permits the installation of Ground Fault Circuit Interrupter (GFCI) protection on ungrounded circuits as an alternative to rewiring [NFPA].',
    replace: `The NEC permits the installation of [Ground Fault Circuit Interrupter (GFCI) protection on ungrounded circuits](${G('need-gfci-outlets-pass-home-inspection')}) as an alternative to rewiring [NFPA].`,
  },
  {
    slug: 'open-ground-mean-electrical-inspection',
    to: 'reverse-polarity-mean-electrical-inspection',
    find: 'If the bootleg jumper is installed on a receptacle whose hot and neutral are also swapped, the grounding pin is energised the moment power is on.',
    replace: `If the bootleg jumper is installed on a receptacle whose [hot and neutral are also swapped](${G('reverse-polarity-mean-electrical-inspection')}), the grounding pin is energised the moment power is on.`,
  },

  // ---- reverse-polarity ----
  {
    slug: 'reverse-polarity-mean-electrical-inspection',
    to: 'open-ground-mean-electrical-inspection',
    find: 'Standard light combinations indicate correct wiring, open ground, open neutral, open hot, or hot/neutral reverse.',
    replace: `Standard light combinations indicate correct wiring, [open ground](${G('open-ground-mean-electrical-inspection')}), open neutral, open hot, or hot/neutral reverse.`,
  },
  {
    slug: 'reverse-polarity-mean-electrical-inspection',
    to: 'need-gfci-outlets-pass-home-inspection',
    find: 'without installing proper grounding pathways or GFCI protection, reverse polarity errors were frequently introduced during those unpermitted upgrades.',
    replace: `without installing proper grounding pathways or [GFCI protection](${G('need-gfci-outlets-pass-home-inspection')}), reverse polarity errors were frequently introduced during those unpermitted upgrades.`,
  },

  // ---- need-gfci ----
  {
    slug: 'need-gfci-outlets-pass-home-inspection',
    to: 'open-ground-mean-electrical-inspection',
    find: 'This creates an **open ground** condition, which is a major safety defect that home inspectors easily detect with their testing equipment.',
    replace: `This creates an **[open ground](${G('open-ground-mean-electrical-inspection')})** condition, which is a major safety defect that home inspectors easily detect with their testing equipment.`,
  },
  {
    slug: 'need-gfci-outlets-pass-home-inspection',
    to: 'reverse-polarity-mean-electrical-inspection',
    find: "won't trip because of a larger wiring problem, such as reversed polarity or a shared neutral circuit.",
    replace: `won't trip because of a larger wiring problem, such as [reversed polarity](${G('reverse-polarity-mean-electrical-inspection')}) or a shared neutral circuit.`,
  },
  {
    slug: 'need-gfci-outlets-pass-home-inspection',
    to: 'knob-tube-wiring-have-be-replaced-before-closing',
    find: 'These older electrical systems do not have an equipment grounding conductor (the third wire that provides a safe path for stray electricity).',
    replace: `[These older electrical systems](${G('knob-tube-wiring-have-be-replaced-before-closing')}) do not have an equipment grounding conductor (the third wire that provides a safe path for stray electricity).`,
  },
  {
    slug: 'need-gfci-outlets-pass-home-inspection',
    to: 'will-zinsco-panel-fail-4-point-inspection',
    find: 'A different standard applies to specialized inspections, such as a four-point inspection required by insurance carriers for older homes.',
    replace: `A different standard applies to specialized inspections, such as a [four-point inspection required by insurance carriers](${G('will-zinsco-panel-fail-4-point-inspection')}) for older homes.`,
  },

  // ---- knob-and-tube ----
  {
    slug: 'knob-tube-wiring-have-be-replaced-before-closing',
    to: 'open-ground-mean-electrical-inspection',
    find: 'using fake ground connections, known as open grounds or false grounds.',
    replace: `using fake ground connections, known as [open grounds or false grounds](${G('open-ground-mean-electrical-inspection')}).`,
  },
  {
    slug: 'knob-tube-wiring-have-be-replaced-before-closing',
    to: 'need-gfci-outlets-pass-home-inspection',
    find: 'GFCI protection provides personal shock protection on ungrounded circuits, though it does not provide an equipment ground for sensitive electronics.',
    replace: `[GFCI protection](${G('need-gfci-outlets-pass-home-inspection')}) provides personal shock protection on ungrounded circuits, though it does not provide an equipment ground for sensitive electronics.`,
  },

  // ---- panel brands ----
  {
    slug: 'will-zinsco-panel-fail-4-point-inspection',
    to: 'federal-pacific-stab-lok-panel-inspectors-flag',
    find: 'Zinsco panels are categorized alongside Federal Pacific Electric Stab-Lok panels as non-insurable hazards.',
    replace: `Zinsco panels are categorized alongside [Federal Pacific Electric Stab-Lok panels](${G('federal-pacific-stab-lok-panel-inspectors-flag')}) as non-insurable hazards.`,
  },
  {
    slug: 'federal-pacific-stab-lok-panel-inspectors-flag',
    to: 'need-gfci-outlets-pass-home-inspection',
    find: 'such as Arc-Fault Circuit Interrupters (AFCI) and Ground-Fault Circuit Interrupters (GFCI) integrated directly at the panel level',
    replace: `such as Arc-Fault Circuit Interrupters (AFCI) and [Ground-Fault Circuit Interrupters (GFCI)](${G('need-gfci-outlets-pass-home-inspection')}) integrated directly at the panel level`,
  },
  {
    // The one edit that appends rather than wraps. The added clause states only what this article's
    // own destination establishes at length -- that specific panel brands are declined outright --
    // and gives the reader worried about coverage the page that actually answers it.
    slug: 'double-tapped-breaker-did-inspector-flag',
    to: 'will-zinsco-panel-fail-4-point-inspection',
    find: 'or even a denial of coverage in more severe cases.',
    replace: `or even a denial of coverage in more severe cases; [certain panel brands are declined outright](${G('will-zinsco-panel-fail-4-point-inspection')}), regardless of how the breakers inside them are wired.`,
  },
];

async function main() {
  const slugs = [...new Set(EDITS.map((e) => e.slug))];
  const rows = (await withDb((sql) => sql`
    SELECT slug, body_markdown FROM articles WHERE slug = ANY(${slugs}) AND status = 'published'
  `)) as unknown as Array<{ slug: string; body_markdown: string }>;
  const bodies = new Map(rows.map((r) => [r.slug, r.body_markdown]));
  if (bodies.size !== slugs.length) throw new Error(`ABORT: expected ${slugs.length} articles, found ${bodies.size}`);

  const published = (await withDb((sql) => sql`
    SELECT slug FROM articles WHERE status = 'published'
  `)) as unknown as Array<{ slug: string }>;
  const live = new Set(published.map((p) => p.slug));

  for (const e of EDITS) {
    if (!live.has(e.to)) throw new Error(`ABORT: link target ${e.to} is not a published guide`);
    const body = bodies.get(e.slug)!;
    const n = body.split(e.find).length - 1;
    if (n !== 1) throw new Error(`ABORT: anchor for ${e.slug} -> ${e.to} matched ${n} times, expected exactly 1`);
    bodies.set(e.slug, body.replace(e.find, e.replace));
    console.log(`  ok  ${e.slug}\n        -> ${e.to}`);
  }

  // Nothing may point at a guide that is not published.
  let bad = 0;
  for (const [slug, body] of bodies) {
    for (const m of body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/?\)/g)) {
      if (!live.has(m[1])) { console.log(`  DEAD LINK: ${slug} -> ${m[1]}`); bad++; }
    }
  }
  if (bad) throw new Error(`ABORT: ${bad} link(s) point at unpublished guides`);
  console.log(`\n${EDITS.length} links across ${slugs.length} articles; all targets published.`);

  if (!APPLY) { console.log('\nDRY RUN -- nothing written. Re-run with APPLY=true.'); return; }

  for (const [slug, body] of bodies) {
    const res = (await withDb((sql) => sql`
      UPDATE articles SET body_markdown = ${body}, updated_at = now()
      WHERE slug = ${slug} AND status = 'published' RETURNING slug
    `)) as unknown as Array<{ slug: string }>;
    if (res.length !== 1) throw new Error(`ABORT: update of ${slug} affected ${res.length} rows`);
    console.log(`  wrote ${slug}`);
  }
  console.log('\nApplied.');
}

main().catch((e) => { console.error('FAILED:', e?.message ?? e); process.exit(1); });
