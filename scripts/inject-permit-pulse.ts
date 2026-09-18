// Put the current Permit Pulse figure into the county permit guides that can carry one.
//
//   npx tsx scripts/inject-permit-pulse.ts          # dry run, writes nothing
//   APPLY=true npx tsx scripts/inject-permit-pulse.ts
//
// -----------------------------------------------------------------------------------------------
// WHY THESE PAGES. Six of them sit at Google positions 8.7 to 12.3 and together are most of this
// site's impressions. The framework's default is to update an existing asset rather than mint a
// new URL, and these are the assets. What they gain is a county-specific figure that changes every
// month, which is the only thing here that gives a ranking page a reason to be re-crawled.
//
// -----------------------------------------------------------------------------------------------
// NOT TEMPLATED. This project has already come within one command of pasting an identical IRC
// paragraph into ten county pages. The rule that came out of that: each page argues from its OWN
// data, in its own words. Miami-Dade's apartments collapsed 40.8% while its houses barely moved;
// Dallas is the cluster's only county where houses ROSE while the total fell; Tarrant's total rose
// 9.4% while houses fell. Those are three different things to say, so they are said differently,
// and OVERLAP_MAX below fails the run if the prose drifts back toward a template.
//
// NUMBERS ARE INTERPOLATED, NEVER TYPED. Every figure comes from docs/data/permit-pulse-figures.json
// at run time. Hand-typed numbers in hand-written prose is how a monthly refresh silently ships
// last month's figures inside this month's sentence.
//
// THE SINGLE-FAMILY SUB-GATE is the one that matters most. The county gate (100+ units, 80%+
// reported) passes Queens on 4,896 units -- but only 27 of those are houses, against 24 a year ago.
// "+12.5%" is arithmetically true and completely meaningless at that volume. Below MIN_SF_FOR_PCT
// the raw count is used and the percentage is never spoken.
import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';
const FIG = path.join(process.cwd(), 'docs', 'data', 'permit-pulse-figures.json');

/** Below this many single-family units, quote the count and never the percentage. */
const MIN_SF_FOR_PCT = 50;
/** Max Jaccard overlap on word trigrams between any two injected blocks. */
const OVERLAP_MAX = 0.25;
/** Heading shape the re-run finds and replaces, so a monthly refresh never stacks two blocks. */
const ANCHOR = /^## .+ Is Permitting Right Now\s*$/m;

interface Block { slug: string; fips: string; heading: string; prose: (c: any, f: any) => string }

const n = (x: number) => x.toLocaleString('en-US');
/** "down 35.3%" / "up 9.4%" — direction in words, so the sentence reads as prose not a readout. */
const dir = (p: number) => (p < 0 ? `down ${Math.abs(p)}%` : `up ${p}%`);

/**
 * Peer counts, computed from the run's own data rather than asserted.
 * A first draft said Philadelphia was "one of the few large counties" with both sides rising.
 * It is one of 17 out of 75 — 23%, which is not "few", and the list includes Los Angeles and
 * Queens, whose blocks on this same site say something different. Vague comparatives are how
 * a set of pages ends up contradicting itself.
 */
function peers(f: any, pred: (c: any) => boolean, minUnits = 2000) {
  const big = f.counties.filter((c: any) =>
    c.unitsCurrent >= minUnits && c.sfChangePct !== null && c.mfChangePct !== null);
  return { matching: big.filter(pred).length, of: big.length };
}

// Twelve counties, twelve different arguments, each drawn from that county's own row.
const BLOCKS: Block[] = [
  {
    slug: 'check-building-permits-miami-dade-county-fl', fips: '12086',
    heading: 'What Miami-Dade Is Permitting Right Now',
    prose: (c) => `Miami-Dade's residential permitting has fallen sharply, but almost none of that is houses. Total permitted units are ${dir(c.unitsChangePct)} year over year, from ${n(c.unitsPrior)} to ${n(c.unitsCurrent)} — and the apartment side accounts for essentially all of it, ${dir(c.mfChangePct)} to ${n(c.mfCurrent)} units. Single-family permits went from ${n(c.sfPrior)} to ${n(c.sfCurrent)}, a difference of ${n(Math.abs(c.sfPrior - c.sfCurrent))} homes. If you are searching records on a single-family property here, the county's headline slowdown is not really about your market.`,
  },
  {
    slug: 'check-building-permits-cook-county-il', fips: '17031',
    heading: 'What Cook County Is Permitting Right Now',
    prose: (c) => `Permitting across Cook County has slowed on both sides of the market at once. Apartment and condo units are ${dir(c.mfChangePct)}, to ${n(c.mfCurrent)}, and single-family permits are ${dir(c.sfChangePct)}, from ${n(c.sfPrior)} to ${n(c.sfCurrent)}. The county total is ${dir(c.unitsChangePct)}, ${n(c.unitsPrior)} to ${n(c.unitsCurrent)} units. For a buyer, the practical read is that recent comparable new construction is thinner than it was a year ago in both categories.`,
  },
  {
    slug: 'check-building-permits-queens-ny', fips: '36081',
    heading: 'What Queens Is Permitting Right Now',
    prose: (c) => `Queens barely permits detached houses at all, and the number is worth seeing before you search: ${n(c.sfCurrent)} single-family units so far this year, against ${n(c.sfPrior)} in the same months last year, in a borough of well over two million people. Everything else — ${n(c.mfCurrent)} units, ${dir(c.mfChangePct)} — is multifamily. At ${n(c.sfCurrent)} new houses across the entire borough, a permit search on an existing one- or two-family property is far more likely to return alterations and conversions than anything newly built.`,
  },
  {
    slug: 'check-building-permits-philadelphia-county-pa', fips: '42101',
    heading: 'What Philadelphia Is Permitting Right Now',
    prose: (c, f) => {
      const p = peers(f, (x: any) => x.sfChangePct > 0 && x.mfChangePct > 0);
      return `Philadelphia is one of ${p.matching} counties out of the ${p.of} permitting 2,000 units or more where both houses and apartments are up this year. Single-family permits are ${dir(c.sfChangePct)}, from ${n(c.sfPrior)} to ${n(c.sfCurrent)}, while multifamily is ${dir(c.mfChangePct)} to ${n(c.mfCurrent)} units — together a total ${dir(c.unitsChangePct)}. The house figure is the one to read carefully: at ${n(c.sfCurrent)} units it is small enough that a single subdivision moves it, so treat the percentage as direction rather than as a trend.`;
    },
  },
  {
    slug: 'check-building-permits-dallas-county-tx', fips: '48113',
    heading: 'What Dallas County Is Permitting Right Now',
    prose: (c) => `Dallas County runs against the national pattern. Nationally, house permits are falling while apartments rise; here it is the reverse — single-family permits are ${dir(c.sfChangePct)}, from ${n(c.sfPrior)} to ${n(c.sfCurrent)}, while multifamily is ${dir(c.mfChangePct)} to ${n(c.mfCurrent)}. The county total is ${dir(c.unitsChangePct)}, which makes Dallas look flat from the outside while the house market underneath it grew.`,
  },
  {
    slug: 'check-harris-county-permit-history-before-buying', fips: '48201',
    heading: 'What Harris County Is Permitting Right Now',
    prose: (c) => `Harris County permits more housing than anywhere else in this comparison — ${n(c.unitsCurrent)} units so far this year — so the direction matters. The total is ${dir(c.unitsChangePct)}, and the split explains it: multifamily is ${dir(c.mfChangePct)}, to ${n(c.mfCurrent)} units, while single-family held far steadier at ${n(c.sfCurrent)}, ${dir(c.sfChangePct)} from ${n(c.sfPrior)}. Houses are still roughly ${Math.round((100 * c.sfCurrent) / c.unitsCurrent)}% of everything permitted in the county.`,
  },
  {
    slug: 'check-building-permits-tarrant-county-tx', fips: '48439',
    heading: 'What Tarrant County Is Permitting Right Now',
    prose: (c) => `Tarrant County is a good reason to read past a headline. Total residential permits are ${dir(c.unitsChangePct)} year over year, to ${n(c.unitsCurrent)} units — but single-family permits are ${dir(c.sfChangePct)}, from ${n(c.sfPrior)} to ${n(c.sfCurrent)}. The entire increase, and then some, is apartments: ${dir(c.mfChangePct)} to ${n(c.mfCurrent)} units. "Permits are up in Tarrant County" is true and tells you the opposite of what is happening to houses.`,
  },
  {
    slug: 'check-building-permits-san-bernardino-county-ca', fips: '06071',
    heading: 'What San Bernardino County Is Permitting Right Now',
    prose: (c) => `Building has slowed across San Bernardino County, with the steeper fall on the apartment side. Multifamily permits are ${dir(c.mfChangePct)} to ${n(c.mfCurrent)} units; single-family is ${dir(c.sfChangePct)}, from ${n(c.sfPrior)} to ${n(c.sfCurrent)}. Total permitted units are ${dir(c.unitsChangePct)}, ${n(c.unitsPrior)} to ${n(c.unitsCurrent)}. In a county this large geographically, a countywide figure hides a lot of variation between the valley cities and the desert — treat it as background, not as a read on one address.`,
  },
  {
    slug: 'check-building-permits-los-angeles-county-ca', fips: '06037',
    heading: 'What Los Angeles County Is Permitting Right Now',
    prose: (c) => `Los Angeles County's permit total is ${dir(c.unitsChangePct)} this year, to ${n(c.unitsCurrent)} units, and almost none of that is houses. Multifamily permits more than doubled, ${dir(c.mfChangePct)} to ${n(c.mfCurrent)} units, while single-family moved from ${n(c.sfPrior)} to ${n(c.sfCurrent)} — ${dir(c.sfChangePct)}, which at this scale is flat. Anyone quoting the county's ${c.unitsChangePct}% rise as evidence of a housing rebound is describing apartment construction.`,
  },
  {
    slug: 'check-building-permits-san-diego-county-ca', fips: '06073',
    heading: 'What San Diego County Is Permitting Right Now',
    prose: (c) => `San Diego County is permitting less housing than a year ago in both categories. Single-family is ${dir(c.sfChangePct)}, ${n(c.sfPrior)} to ${n(c.sfCurrent)} units; multifamily is ${dir(c.mfChangePct)} to ${n(c.mfCurrent)}. The combined total is ${dir(c.unitsChangePct)}. Multifamily still makes up about ${Math.round((100 * c.mfCurrent) / c.unitsCurrent)}% of everything permitted here, so countywide permit counts move mostly with apartment projects rather than with the resale market.`,
  },
  {
    slug: 'check-building-permits-maricopa-county-az', fips: '04013',
    heading: 'What Maricopa County Is Permitting Right Now',
    prose: (c) => `Maricopa County has the steepest decline in single-family permitting of any county in this set: ${dir(c.sfChangePct)}, from ${n(c.sfPrior)} to ${n(c.sfCurrent)} homes, a drop of ${n(c.sfPrior - c.sfCurrent)}. Multifamily fell further in percentage terms, ${dir(c.mfChangePct)} to ${n(c.mfCurrent)}, taking the county total ${dir(c.unitsChangePct)}. Maricopa has been one of the largest new-build markets in the country, which is exactly why a fall of this size in house permits is worth noting before you read a permit history here.`,
  },
  {
    slug: 'check-building-permits-riverside-county-ca', fips: '06065',
    heading: 'What Riverside County Is Permitting Right Now',
    prose: (c) => `Riverside County's apartment pipeline has largely emptied out — multifamily permits are ${dir(c.mfChangePct)}, from ${n(c.mfPrior)} units to ${n(c.mfCurrent)}. Single-family has been far more stable, ${dir(c.sfChangePct)} at ${n(c.sfCurrent)} units, and now accounts for about ${Math.round((100 * c.sfCurrent) / c.unitsCurrent)}% of everything permitted in the county. The total is ${dir(c.unitsChangePct)}. Riverside is also the weakest reporting county in this group, so treat the figures as close rather than exact.`,
  },
];

const trigrams = (s: string) => {
  const w = s.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);
  return new Set(w.slice(0, -2).map((_, i) => w.slice(i, i + 3).join(' ')));
};
const jaccard = (a: Set<string>, b: Set<string>) => {
  const inter = [...a].filter((x) => b.has(x)).length;
  return inter / (a.size + b.size - inter);
};

async function main() {
  const fig = JSON.parse(fs.readFileSync(FIG, 'utf8'));
  const byFips = new Map<string, any>(fig.counties.map((c: any) => [c.fips, c]));
  const monthName = new Date(`${fig.period.yearToDateThrough}-01T00:00:00Z`)
    .toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });
  const year = fig.period.yearToDateThrough.slice(0, 4);
  const priorYear = fig.period.comparedWith.slice(0, 4);

  const rows = (await withDb((sql) => sql`
    SELECT slug, body_markdown FROM articles WHERE status='published'`)) as unknown as any[];
  const bySlug = new Map(rows.map((r) => [r.slug, r]));

  const staged: Array<{ slug: string; body: string; block: string; action: string }> = [];

  for (const b of BLOCKS) {
    const c = byFips.get(b.fips);
    if (!c) throw new Error(`ABORT: ${b.fips} (${b.slug}) is not in the gated Permit Pulse set — it should not have a block`);
    const art = bySlug.get(b.slug);
    if (!art) throw new Error(`ABORT: ${b.slug} is not a published article`);

    // Sub-gate: a percentage on a tiny single-family base is noise. Queens is 27 units.
    if (c.sfCurrent < MIN_SF_FOR_PCT && /sfChangePct/.test(b.prose.toString())) {
      throw new Error(`ABORT: ${b.slug} has only ${c.sfCurrent} single-family units but its prose quotes a percentage`);
    }

    const source = `Source: US Census Bureau Building Permits Survey, county file, year to date through ${monthName} ${year} against the same months of ${priorYear}. ${c.reportedShare}% of these units were reported directly by permit offices; the rest are Census estimates for offices that did not report.`;
    const block = `## ${b.heading}\n\n${b.prose(c, fig)}\n\n${source}`;

    const body = String(art.body_markdown ?? '');
    let next: string, action: string;
    if (ANCHOR.test(body)) {
      // Replace the existing block: from its heading to the next H2 (or end of document).
      next = body.replace(/^## .+ Is Permitting Right Now\s*$[\s\S]*?(?=^## |\s*$)/m, `${block}\n\n`);
      action = 'REFRESH';
    } else {
      // Insert before the final "Looking Up Permits Elsewhere" cross-link if present, else append.
      const tail = body.lastIndexOf('\n## Looking Up Permits Elsewhere');
      next = tail > -1
        ? `${body.slice(0, tail)}\n\n${block}\n${body.slice(tail)}`
        : `${body.trimEnd()}\n\n${block}\n`;
      action = tail > -1 ? 'INSERT (before cross-link)' : 'APPEND';
    }
    staged.push({ slug: b.slug, body: next, block, action });
  }

  // --- the not-templated gate -------------------------------------------------------------------
  // Source lines are deliberately identical across pages; a citation is not content. Compare prose.
  const prose = staged.map((s) => s.block.split('\n\n').slice(1, -1).join(' '));
  let worst = { a: '', b: '', v: 0 };
  for (let i = 0; i < prose.length; i++) {
    for (let j = i + 1; j < prose.length; j++) {
      const v = jaccard(trigrams(prose[i]), trigrams(prose[j]));
      if (v > worst.v) worst = { a: staged[i].slug, b: staged[j].slug, v };
    }
  }
  console.log(`\n  worst pairwise overlap: ${(worst.v * 100).toFixed(1)}%  (${worst.a} vs ${worst.b})`);
  if (worst.v > OVERLAP_MAX) {
    throw new Error(`ABORT: ${(worst.v * 100).toFixed(1)}% overlap exceeds the ${OVERLAP_MAX * 100}% ceiling — this is drifting into a template`);
  }

  for (const s of staged) {
    console.log(`\n  ${s.slug}  [${s.action}]`);
    const body = s.block.split('\n\n')[1];
    console.log(process.env.VERBOSE ? `    ${body}` : `    ${body.slice(0, 150)}...`);
  }

  console.log(`\n  ${staged.length} pages staged, period ${fig.period.yearToDateThrough} vs ${fig.period.comparedWith}`);
  if (!APPLY) { console.log('\n  DRY RUN -- nothing written.\n'); return; }

  for (const s of staged) {
    await withDb((sql) => sql`UPDATE articles SET body_markdown = ${s.body}, updated_at = now() WHERE slug = ${s.slug}`);
    console.log(`  wrote ${s.slug}`);
  }
  console.log(`\n  ${staged.length} guides updated. Guides are prerendered -- run \`npm run build\` or these changes are not live.\n`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
