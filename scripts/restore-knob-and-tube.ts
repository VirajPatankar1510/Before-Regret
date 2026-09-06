// Restores what-is-knob-and-tube-wiring, repairing what the prune left behind it.
//
//   npx tsx scripts/restore-knob-and-tube.ts            # dry run
//   APPLY=true npx tsx scripts/restore-knob-and-tube.ts
//
// -------------------------------------------------------------------------------------------
// WHY IT IS SAFE, which was the open question. This is the second-largest removed page by Google
// impressions (84 across 44 queries) and the worry was cannibalising the live
// knob-tube-wiring-have-be-replaced-before-closing -- the two-pages-one-intent failure that
// server.ts's MERGED_GUIDES comment records costing 39 generic permit queries to Philadelphia.
//
// The check came back clean, and decisively:
//
//     what-is-knob-and-tube-wiring (removed)          44 queries, 84 impressions
//     knob-tube-...-before-closing (live)              1 query,    1 impression
//     queries BOTH pages appear for                    0
//
// Zero overlap. Google is already separating "what is it" from "must I replace it to close", so
// this is not the MERGED_GUIDES pattern -- that was two pages fighting over the SAME query set.
// Here the live page has almost no presence and the removed one holds the entire definitional
// cluster. Worth stating plainly though: those 84 impressions sit at positions 54-91, so this
// buys a page Google already associates with 44 queries, not immediate traffic.
//
// -------------------------------------------------------------------------------------------
// WHAT A NAIVE RESTORE WOULD HAVE SHIPPED. Three defects, none of which existed when the page was
// written -- they were created by the prune removing its neighbours around it:
//
//   1. THREE DEAD INTERNAL LINKS, to knob-tube-fuse-box-look-like,
//      get-homeowners-insurance-knob-tube-wiring and i-buy-house-knob-tube-wiring, all still
//      removed. Restoring without fixing these would have put three 410s in front of readers and
//      broken the zero-dead-links property established earlier today.
//
//      Two of them are whole sentences that exist only to make the cross-reference, so the
//      sentence goes with the link -- unlinking would leave "For what the panel itself looks
//      like ... see ." The third sits in a sentence that ALSO links the live before-closing
//      guide, so only the dead half is dropped and the sentence still reads.
//
//      Nothing is repointed at a near-neighbour to keep the link count up. There is a live
//      get-home-insurance-fuse-box, but it answers an insurance question and the anchor promises
//      what a fuse box LOOKS like, so sending the reader there would be a worse outcome than not
//      linking at all.
//
//   2. TITLE AT 66 CHARACTERS, over the 60 budget buildPageTitle enforces. Trimmed to 48. The
//      cost angle it dropped is still in the meta and the body.
//
//   3. NO INBOUND LINK, so it would have restored as an orphan.
import 'dotenv/config';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';
const SLUG = 'what-is-knob-and-tube-wiring';
const HUB = 'look-up-building-permits-by-address';
const SIBLING = 'knob-tube-wiring-have-be-replaced-before-closing';

// 66 -> 48.
const TITLE = 'What Is Knob-and-Tube Wiring? How to Identify It';

// Dead-link repairs on the restored page. Empty replacement = the sentence goes too.
const REPAIRS: Array<[string, string, string]> = [
  [
    'fuse-box cross-reference: its own paragraph, removed whole with its blank line',
    '\n\nFor what the panel itself looks like, and how to tell a knob-and-tube fuse box from a later one, see [What Does a Knob and Tube Fuse Box Look Like?](/guides/knob-tube-fuse-box-look-like/).',
    '',
  ],
  [
    'insurance sentence: dead half dropped, live half kept',
    '[Can You Get Homeowners Insurance with Knob and Tube Wiring?](/guides/get-homeowners-insurance-knob-tube-wiring/) and [Does Knob-and-Tube Wiring Need Replacing Before Closing?](/guides/knob-tube-wiring-have-be-replaced-before-closing/)',
    '[Does Knob-and-Tube Wiring Need Replacing Before Closing?](/guides/knob-tube-wiring-have-be-replaced-before-closing/)',
  ],
  [
    'buy-a-house cross-reference removed mid-paragraph; that angle is already linked above',
    'For the buying-specific version of this decision, see [Can I Buy a House with Knob-and-Tube Wiring?](/guides/i-buy-house-knob-tube-wiring/). ',
    '',
  ],
];

// Inbound, so it does not restore as an orphan. Reciprocal with its sibling, which is honest here
// precisely BECAUSE the two answer different questions -- the check above proves Google agrees.
const INBOUND: [string, string, string] = [
  SIBLING,
  'Discovering active knob and tube wiring days before closing can immediately derail a purchase, putting earnest money deposits at risk and jeopardizing mortgage approval.',
  ' If you are not yet sure that is what you are looking at, [what knob-and-tube wiring is and how to identify it](/guides/what-is-knob-and-tube-wiring/) covers the attic tells and what replacement actually costs.',
];

async function main() {
  const rows = (await withDb((sql) => sql`
    SELECT slug, status, title, meta_description, body_markdown FROM articles
  `)) as unknown as Array<any>;
  const byslug = new Map(rows.map((r) => [r.slug, r]));

  const target = byslug.get(SLUG);
  if (!target) throw new Error(`ABORT: ${SLUG} not found`);
  if (target.status !== 'removed') throw new Error(`ABORT: ${SLUG} is '${target.status}'`);
  if (byslug.get(SIBLING)?.status !== 'published') throw new Error(`ABORT: ${SIBLING} is not published`);

  const live = new Set([...rows.filter((r) => r.status === 'published').map((r) => r.slug), SLUG]);
  const bodies = new Map<string, string>([...live].map((s) => [s, byslug.get(s)!.body_markdown]));

  let body = bodies.get(SLUG)!;
  for (const [note, oldText, newText] of REPAIRS) {
    const n = body.split(oldText).length - 1;
    if (n !== 1) throw new Error(`ABORT: "${note}" matched ${n} times, expected 1`);
    body = body.replace(oldText, newText);
    console.log(`  ok  ${note}`);
  }
  bodies.set(SLUG, body);

  const [src, tail, addition] = INBOUND;
  const sb = bodies.get(src)!;
  if (sb.split(tail).length - 1 !== 1) throw new Error(`ABORT: inbound tail on ${src} not unique`);
  bodies.set(src, sb.replace(tail, tail + addition));
  console.log(`  ok  inbound link from ${src}`);

  // ---- assertions -----------------------------------------------------------------------------
  let bad = 0;
  for (const [slug, b] of bodies) {
    for (const m of b.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/?\)/g)) {
      if (!live.has(m[1])) { console.log(`  DEAD LINK: ${slug} -> ${m[1]}`); bad++; }
      if (m[1] === slug) { console.log(`  SELF LINK: ${slug}`); bad++; }
    }
    for (const re of [/\*\*\[[^\]]*\]\([^)]*\)\*\*/g, /\[\*\*[^\]]*\*\*\]\([^)]*\)/g]) {
      for (const m of b.matchAll(re)) { console.log(`  NESTED: ${slug} -> ${m[0]}`); bad++; }
    }
  }
  if (TITLE.length > 60) { console.log(`  TITLE ${TITLE.length}`); bad++; }
  if ((byslug.get(SLUG)!.meta_description || '').length > 155) { console.log('  META too long'); bad++; }
  // Removing sentences must not leave doubled spaces or a space before punctuation.
  if (body.includes('  ') || body.includes(' .') || body.includes('\n\n\n')) { console.log('  WHITESPACE artifact after sentence removal'); bad++; }
  if (bad) throw new Error(`ABORT: ${bad} defect(s)`);

  const adj = new Map<string, Set<string>>();
  for (const [slug, b] of bodies) {
    adj.set(slug, new Set([...b.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/?\)/g)].map((m) => m[1]).filter((t) => t !== slug)));
  }
  const inbound = new Map<string, number>();
  for (const [, t] of adj) for (const x of t) inbound.set(x, (inbound.get(x) || 0) + 1);
  const orphans = [...live].filter((s) => !inbound.has(s));
  const deadEnds = [...live].filter((s) => (adj.get(s) || new Set()).size === 0);
  const seen = new Set([HUB]);
  const q = [HUB];
  while (q.length) for (const t of adj.get(q.shift()!) || []) if (!seen.has(t)) { seen.add(t); q.push(t); }

  console.log(`\n  title     : ${TITLE} (${TITLE.length}, was ${target.title.length})`);
  console.log(`  body      : ${target.body_markdown.length} -> ${body.length} chars`);
  console.log(`  outbound  : ${[...adj.get(SLUG)!].join(', ')}`);
  console.log(`  published : 48 -> ${live.size}`);
  console.log(`  orphans   : ${orphans.length}${orphans.length ? ` (${orphans.join(', ')})` : ''}`);
  console.log(`  dead ends : ${deadEnds.length}${deadEnds.length ? ` (${deadEnds.join(', ')})` : ''}`);
  console.log(`  reachable : ${seen.size}/${live.size}`);
  if (orphans.length) throw new Error('ABORT: orphans');
  if (deadEnds.length) throw new Error('ABORT: dead ends');
  if (seen.size !== live.size) throw new Error(`ABORT: only ${seen.size}/${live.size} reachable`);

  if (!APPLY) { console.log('\n  DRY RUN -- nothing written.'); return; }

  await withDb((sql) => sql`UPDATE articles SET status='published', title=${TITLE},
    body_markdown=${bodies.get(SLUG)!}, updated_at=now() WHERE slug=${SLUG} AND status='removed'`);
  console.log(`  restored ${SLUG}`);
  await withDb((sql) => sql`UPDATE articles SET body_markdown=${bodies.get(src)!}, updated_at=now() WHERE slug=${src}`);
  console.log(`  linked from ${src}`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
