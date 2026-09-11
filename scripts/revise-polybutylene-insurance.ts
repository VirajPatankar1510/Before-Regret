// Revise the polybutylene insurance guide against outside review.
//
//   npx tsx scripts/revise-polybutylene-insurance.ts            # dry run
//   APPLY=true npx tsx scripts/revise-polybutylene-insurance.ts
//
// -----------------------------------------------------------------------------------------------
// WHAT THE REVIEW GOT RIGHT, AND THE ONE THING IT UNDERSTATED.
//
// The cost figure needed sourcing. It goes deeper than the reviewer saw: the engine holds 21
// typicalRepairCost figures and NONE of them carries a source, and this same $4,000-$15,000 range
// is attached to three different rules. It is a generic whole-home repipe planning range, not a
// polybutylene-specific quote.
//
// That rules out the reviewer's Option A. Finding a citation now, to justify a number that did not
// come from it, would be reasoning backwards -- the citation would decorate the figure rather than
// source it. Option B is the honest one: say plainly that it is a planning range and that a local
// quote is what belongs in a negotiation. The engine's own header already says costs are "always
// ranges, never point estimates"; this makes that visible to the reader instead of implicit.
//
// The technical claims DID have sources, verified before they were written -- they just were not on
// the page. ASTM D3309 and PPI TN-31 are now linked at the claim they support.
//
// "A mortgage will not fund without a bound policy" was too absolute and is softened. Lender
// practice varies; the defensible statement is that a lender generally requires evidence of
// insurance before closing.
//
// Two additions the review asked for, both of which make the page more useful rather than longer:
// an explicit answer to "does this make a house uninsurable" (no, and the web is split on it), and
// a walk / negotiate / repipe table, which is the decision the reader is actually making.
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';
const SLUG = 'polybutylene-pipes-home-insurance';

const ASTM = 'https://store.astm.org/d3309-96ar02.html';
const PPI = 'https://plasticpipe.org/common/Uploaded%20files/1-PPI/News%20Releases/PPI%20BCD%20TN-31%20News%20Release_03-07-24.pdf';

type Edit = { from: string; to: string; why: string };

const EDITS: Edit[] = [
  {
    why: 'too absolute — lender practice varies, so state what is defensible',
    from: 'the harder question is whether anyone will insure the house, and a mortgage will not fund without a bound policy.',
    to: 'the harder question is whether anyone will insure the house, and a lender will generally require evidence of homeowners insurance before closing.',
  },
  {
    why: 'the technical claims had sources; they were verified before writing but never shown',
    from: 'The material was covered by **ASTM D3309**, the specification for polybutylene hot- and cold-water distribution systems. That standard was **withdrawn in 2010**, and the reasons are the same ones that show up in a claims file. Failures were attributed largely to the polyacetal fittings used in those systems, and to the tubing\'s resistance to hot chlorinated water and to slow crack growth. The resin\'s main North American supplier stopped producing pipe-grade material in the late 1990s.',
    to: `The material was covered by [ASTM D3309](${ASTM}), the specification for polybutylene hot- and cold-water distribution systems, and that standard was withdrawn in 2010. The Plastics Pipe Institute's technical note [TN-31](${PPI}) sets out the reasons: many failures were attributed to the polyacetal fittings used in those systems, and some failures of the tubing itself to insufficient resistance to hot chlorinated water or to slow crack growth. The main pipe-grade resin supplier stopped supplying North America by the late 1990s.`,
  },
  {
    why: 'makes the planning-range status explicit rather than implicit',
    from: 'The repipe figure is the one that matters in a negotiation, because it is the number that converts an uninsurable house into an insurable one. It varies with the number of bathrooms, whether the runs are accessible through a crawlspace or an attic, and how much drywall has to come out and go back.',
    to: 'Treat that as a planning range, not a quote. It is a national range for a whole-home repipe, and the real number moves with house size, fixture count, whether the runs are reachable through a crawlspace or an attic, slab construction, local labor rates, and how much drywall has to come out and go back. Get a local plumber to put a figure on your actual house before you take one into a negotiation.',
  },
  {
    why: 'the review is right that "a declination is not the end" should be a heading, not a buried line',
    from: '## If you are declined\n\nA declination is not the end of the transaction, and it is worth knowing the order of options before you are under time pressure.',
    to: '## A declination is not the end of the transaction\n\nIt is worth knowing the order of options before you are under time pressure.',
  },
  {
    why: 'resolves the ambiguity the rest of the web leaves open, and adds the decision table',
    from: '## Do this before your option period ends',
    to: `## Does polybutylene automatically make a house uninsurable?

No. There is no universal rule that makes every home with polybutylene uninsurable, and treating it as one will cost you houses that were financeable.

What varies is the terms. Some carriers decline the property outright. Others write it with a surcharge, a repipe condition, or a limitation on water damage originating from the supply lines. The only reliable answer is the one an insurer gives after looking at the actual address, in writing.

This is worth saying plainly because the rest of the internet is split on it. Plenty of pages state flatly that the material is uninsurable, and plenty of brokers say cover is available depending on circumstances. Both are describing real experiences of different properties in different states. Neither is a rule you can apply to your house.

## Walk, negotiate, or repipe

The question underneath all of this is not what polybutylene is. It is what to do with the house in front of you.

| What the insurer says | What to do next |
|---|---|
| Writes it normally | Proceed, and keep the plumbing documentation with your closing file |
| Writes it with an exclusion | Find out exactly what is excluded before you remove the contingency |
| Requires a repipe | Get a plumbing quote and negotiate the credit against that number |
| One carrier declines | Have an independent agent check other markets before assuming the worst |
| Several decline | Price the repipe, then decide whether the house is still worth it to you |
| Seller agrees to repipe | Get documentation naming what was replaced, not just an invoice total |

## Do this before your option period ends`,
  },
];

async function main() {
  let rows: any[] | null = null;
  for (let a = 1; a <= 4 && !rows; a++) {
    try {
      rows = (await withDb((sql) => sql`
        SELECT slug, body_markdown FROM articles WHERE slug = ${SLUG}
      `)) as unknown as any[];
    } catch { await new Promise((r) => setTimeout(r, 3000)); }
  }
  if (!rows?.length) throw new Error(`ABORT: ${SLUG} not found`);

  let body = String(rows[0].body_markdown);
  const before = body;

  for (const e of EDITS) {
    const n = body.split(e.from).length - 1;
    if (n !== 1) throw new Error(`ABORT: anchor matched ${n} times, expected 1:\n  "${e.from.slice(0, 80)}"`);
    body = body.replace(e.from, e.to);
  }

  // Guards. The bold-wrapped link has shipped on this site once before, and this edit converts a
  // bold phrase into a link, which is exactly how it happens.
  for (const re of [/\*\*\[[^\]]*\]\([^)]*\)\*\*/g, /\[\*\*[^\]]*\*\*\]\([^)]*\)/g]) {
    if (re.test(body)) throw new Error('ABORT: bold-wrapped link');
  }
  // No named carrier may appear beside an underwriting verb, and the new sections talk about
  // carriers constantly.
  for (const c of ['state farm', 'allstate', 'geico', 'liberty mutual', 'usaa', 'citizens property']) {
    if (body.toLowerCase().includes(c)) throw new Error(`ABORT: names carrier "${c}"`);
  }
  // GFM tables need a separator row or they render as garbled prose.
  for (const m of body.matchAll(/^\|.+\|$/gm)) void m;
  // The separator row is |---|---|, so the character class must allow the pipe itself. Without it
  // this matched nothing and the guard failed on correct content -- a false alarm, not a defect.
  const tableHeads = [...body.matchAll(/\n\|[^\n]+\|\n\|[\s:|-]+\|\n/g)].length;
  if (tableHeads < 2) throw new Error(`ABORT: expected 2 well-formed tables, found ${tableHeads}`);

  console.log(`\n  ${SLUG}`);
  console.log(`  body ${before.length} -> ${body.length} chars\n`);
  for (const e of EDITS) console.log(`  - ${e.why}`);
  console.log(`\n  sources now on the page: ASTM D3309, PPI TN-31`);
  console.log(`  tables: ${tableHeads}   carriers named: 0`);

  if (!APPLY) { console.log('\n  DRY RUN -- nothing written.\n'); return; }
  await withDb((sql) => sql`
    UPDATE articles SET body_markdown = ${body}, updated_at = now() WHERE slug = ${SLUG}`);
  console.log(`\n  wrote ${SLUG}\n`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
