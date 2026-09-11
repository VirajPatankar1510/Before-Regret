// Add inbound links to the new polybutylene insurance guide, and source one carrier claim.
//
//   npx tsx scripts/link-polybutylene-insurance.ts            # dry run
//   APPLY=true npx tsx scripts/link-polybutylene-insurance.ts
//
// -----------------------------------------------------------------------------------------------
// Every anchor below is a sentence that ALREADY discusses the target, found by
// scripts/suggest-inbound-links.ts. No prose is invented to carry a link, which is §3's rule and
// the reason that tool suggests rather than writes.
//
// Anchor wording is varied deliberately. Identical anchors repeated into one page are a footprint,
// and the anchor should predict the destination rather than say "click here".
//
// THE CITATION IS NOT COSMETIC. Rule 1 of the pre-publish gate fails any sentence naming an insurer
// beside an underwriting verb, because we hold no carrier underwriting data and an invented claim
// about a named company is a real harm. The Citizens sentence in the identification guide is the
// exception the rule now recognises: it is attributed, it is TRUE -- verified against Citizens' own
// published FAQ -- and it was simply missing the link. Adding the source turns an unsourced carrier
// assertion into a sourced one, which is what §4 asks for and what the refined rule permits.
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';
const TARGET = '/guides/polybutylene-pipes-home-insurance/';

type Edit = { slug: string; from: string; to: string; why: string };

const EDITS: Edit[] = [
  {
    slug: 'spot-polybutylene-pipes-before-buying-house',
    from: 'Polybutylene belongs to a small group of defects that can stop a policy outright rather than merely raise its price.',
    to: `Polybutylene belongs to a small group of defects that can [stop a policy outright rather than merely raise its price](${TARGET}).`,
    why: 'the sentence already states the insurance consequence; the link is where that consequence is worked through',
  },
  {
    slug: 'spot-polybutylene-pipes-before-buying-house',
    from: 'Citizens Property Insurance Corporation, Florida\'s insurer of last resort, states that dwellings 20 years old or newer with polybutylene piping may be eligible for coverage if there are no signs of leaks, unrepaired water damage, disrepair or hazards.',
    to: '[Citizens Property Insurance Corporation](https://securesupport.citizensfla.com/app/answers/detail/a_id/1713/~/will-citizens-insure-dwellings-with-polybutylene-pipes%3F), Florida\'s insurer of last resort, states that dwellings 20 years old or newer with polybutylene piping may be eligible for coverage if there are no signs of leaks, unrepaired water damage, disrepair or hazards.',
    why: 'sources a true but uncited carrier claim against Citizens’ own published FAQ',
  },
];

async function main() {
  let rows: any[] | null = null;
  for (let a = 1; a <= 4 && !rows; a++) {
    try {
      rows = (await withDb((sql) => sql`
        SELECT slug, body_markdown FROM articles WHERE status = 'published'
      `)) as unknown as any[];
    } catch { await new Promise((r) => setTimeout(r, 3000)); }
  }
  if (!rows) throw new Error('ABORT: database unreachable');

  const byslug = new Map(rows.map((r) => [r.slug, r]));
  if (!byslug.has('polybutylene-pipes-home-insurance')) throw new Error('ABORT: target guide not published');

  const next = new Map<string, string>();
  const get = (s: string) => next.get(s) ?? String(byslug.get(s)?.body_markdown ?? '');

  for (const e of EDITS) {
    if (!byslug.has(e.slug)) throw new Error(`ABORT: ${e.slug} not published`);
    const body = get(e.slug);
    const n = body.split(e.from).length - 1;
    if (n !== 1) throw new Error(`ABORT: ${e.slug} anchor matched ${n} times, expected 1:\n  "${e.from.slice(0, 70)}"`);
    next.set(e.slug, body.replace(e.from, e.to));
  }

  // Guards this project has needed before.
  const anchors: string[] = [];
  for (const [slug, body] of next) {
    for (const re of [/\*\*\[[^\]]*\]\([^)]*\)\*\*/g, /\[\*\*[^\]]*\*\*\]\([^)]*\)/g]) {
      if (re.test(body)) throw new Error(`ABORT: ${slug} contains a bold-wrapped link`);
    }
    for (const m of body.matchAll(new RegExp(`\\[([^\\]]+)\\]\\(${TARGET}\\)`, 'g'))) anchors.push(m[1]);
  }
  if (new Set(anchors).size !== anchors.length) throw new Error('ABORT: duplicate anchor text into one target');

  console.log(`\n  ${EDITS.length} edit(s), ${anchors.length} new inbound link(s) to ${TARGET}\n`);
  for (const e of EDITS) {
    console.log(`  ${e.slug}`);
    console.log(`    ${e.why}`);
    console.log(`    +  ${e.to.slice(0, 150)}${e.to.length > 150 ? '…' : ''}\n`);
  }
  console.log(`  anchors: ${anchors.map((a) => `"${a}"`).join(', ')}`);

  if (!APPLY) { console.log('\n  DRY RUN -- nothing written.\n'); return; }
  for (const [slug, body] of next) {
    await withDb((sql) => sql`
      UPDATE articles SET body_markdown = ${body}, updated_at = now() WHERE slug = ${slug}`);
    console.log(`  wrote ${slug}`);
  }
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
