// One-off repair for the 2026-09-02 guide prune: three surviving guides linked to guides the
// prune removed. Run once, after the prune's status update, then kept in the repo as the record
// of what was rewritten and why.
//
//   npx tsx scripts/fix-pruned-internal-links.ts          # dry run, prints the diff
//   APPLY=true npx tsx scripts/fix-pruned-internal-links.ts
//
// Left as dead links these would be 26 internal links into 410s from look-up-building-permits-by-
// address alone -- a page that earns clicks -- which is exactly the low-quality signal the prune
// exists to remove. One of them was worse than dead: why-cast-iron-pipes-corrode linked to
// cast-iron-sewer-pipes-fail-standard-home-inspection, which the prune merges INTO that same page,
// so the link would have redirected the reader back to the page they were already on.
//
// Every edit keeps the surrounding sentence's meaning and drops only the pointer. Nothing here
// invents a replacement fact or a new claim.
import 'dotenv/config';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';

interface Fix { slug: string; find: string; replace: string; note: string; }

const FIXES: Fix[] = [
  {
    slug: 'look-up-building-permits-by-address',
    note: 'County list: 32 links -> the 6 county guides that survived the prune. State subheadings dropped, since grouping 6 entries under 5 headings (two of which would be empty) reads as a gutted list rather than an index.',
    find: `### California
- [Alameda County](/guides/check-building-permits-alameda-county-ca/)
- [Los Angeles County](/guides/check-building-permits-los-angeles-county-ca/)
- [Orange County](/guides/check-building-permits-orange-county-ca/)
- [Riverside County](/guides/check-building-permits-riverside-county-ca/)
- [Sacramento County](/guides/check-building-permits-sacramento-county-ca/)
- [San Bernardino County](/guides/check-building-permits-san-bernardino-county-ca/)
- [San Diego County](/guides/check-building-permits-san-diego-county-ca/)
- [Santa Clara County](/guides/check-building-permits-santa-clara-county-ca/)

### Texas
- [Harris County](/guides/check-harris-county-permit-history-before-buying/)
- [Travis County](/guides/check-building-permit-history-before-buying-travis-county-tx/)
- [Bexar County](/guides/check-building-permits-bexar-county-tx/)
- [Dallas County](/guides/check-building-permits-dallas-county-tx/)
- [Tarrant County](/guides/check-building-permits-tarrant-county-tx/)

### New York
- [Manhattan](/guides/check-building-permits-manhattan-ny/)
- [Brooklyn](/guides/check-building-permits-brooklyn-ny/)
- [Queens](/guides/check-building-permits-queens-ny/)
- [The Bronx](/guides/check-building-permits-bronx-ny/)
- [Suffolk County](/guides/check-building-permits-suffolk-county-ny/)

### Florida
- [Miami-Dade County](/guides/check-building-permits-miami-dade-county-fl/)
- [Broward County](/guides/check-building-permits-broward-county-fl/)
- [Orange County](/guides/check-building-permits-orange-county-fl/)
- [Hillsborough County](/guides/check-building-permits-hillsborough-county-fl/)
- [Palm Beach County](/guides/check-building-permits-palm-beach-county-fl/)

### Other Major Counties
- [Cook County, IL](/guides/check-building-permits-cook-county-il/)
- [Maricopa County, AZ](/guides/check-building-permits-maricopa-county-az/)
- [Clark County, NV](/guides/check-building-permits-clark-county-nv/)
- [Fulton County, GA](/guides/check-building-permits-fulton-county-ga/)
- [Middlesex County, MA](/guides/check-building-permits-middlesex-county-ma/)
- [Wayne County, MI](/guides/check-building-permits-wayne-county-mi/)
- [Seattle, WA](/guides/check-building-permits-seattle-wa/)
- [Philadelphia County, PA](/guides/check-building-permits-philadelphia-county-pa/)`,
    replace: `- [Philadelphia County, PA](/guides/check-building-permits-philadelphia-county-pa/)
- [Cook County, IL](/guides/check-building-permits-cook-county-il/)
- [Miami-Dade County, FL](/guides/check-building-permits-miami-dade-county-fl/)
- [San Bernardino County, CA](/guides/check-building-permits-san-bernardino-county-ca/)
- [The Bronx, NY](/guides/check-building-permits-bronx-ny/)
- [Middlesex County, MA](/guides/check-building-permits-middlesex-county-ma/)`,
  },
  {
    slug: 'look-up-building-permits-by-address',
    note: 'Roof-age insurance point: keeps the observation, drops the pointer to a removed guide.',
    find: `One increasingly common reason to search a permit before closing is insurance: carriers now routinely ask buyers to prove how old the roof is, and the roofing permit is the strongest free evidence there is. See [how to prove your roof's age for insurance](/guides/prove-roof-age-for-insurance/).`,
    replace: `One increasingly common reason to search a permit before closing is insurance: carriers now routinely ask buyers to prove how old the roof is, and the roofing permit is often the strongest free evidence there is.`,
  },
  {
    slug: 'why-cast-iron-pipes-corrode',
    note: 'Sewer scope: keeps the instruction, drops the pointer to a removed guide.',
    find: `A standard home inspection does not include this and cannot substitute for it — see [Do I Need a Sewer Scope Inspection?](/guides/i-need-sewer-scope-inspection/) for what the scope covers and where its own limits are.`,
    replace: `A standard home inspection does not include this and cannot substitute for it, so it has to be booked separately with a licensed plumber.`,
  },
  {
    slug: 'why-cast-iron-pipes-corrode',
    note: 'Self-reference: the linked guide is merged INTO this page by the prune, so the link would have pointed the reader back here. Replaced with the substance it was pointing at.',
    find: `2. **Understand what an inspection can and cannot flag.** [Can Cast Iron Sewer Pipes Fail a Standard Home Inspection?](/guides/cast-iron-sewer-pipes-fail-standard-home-inspection/) covers how this interacts with the inspection contingency and with negotiations.`,
    replace: `2. **Understand what an inspection can and cannot flag.** A general inspection can note visible corrosion, slow drains and staining, but it does not open walls or run a camera down the line — so a clean inspection report is not evidence the line is sound. That gap is why the contingency period, rather than the report itself, is where this usually gets resolved.`,
  },
  {
    slug: 'not-inspected-due-storage-mean-inspection-report',
    note: 'Crawlspace access: keeps the point, drops the pointer to a removed guide.',
    find: `The same access rules apply to the crawlspace itself -- see [what an inspector can and cannot reach once inside](/guides/home-inspector-actually-enter-crawlspace-just-look/) for what a restricted crawlspace entry can still miss even without a storage blockage.`,
    replace: `The same access rules apply to the crawlspace itself: where an inspector cannot physically reach a run of foundation wall or subfloor, those same conditions go unexamined, with or without a storage blockage.`,
  },
];

async function main() {
  const slugs = [...new Set(FIXES.map((f) => f.slug))];
  const rows = await withDb((sql) => sql`
    SELECT slug, body_markdown FROM articles WHERE slug = ANY(${slugs})
  `) as unknown as Array<{ slug: string; body_markdown: string }>;

  const bodies = new Map(rows.map((r) => [r.slug, r.body_markdown]));
  if (bodies.size !== slugs.length) throw new Error(`ABORT: expected ${slugs.length} articles, found ${bodies.size}`);

  for (const fix of FIXES) {
    const body = bodies.get(fix.slug);
    if (body === undefined) throw new Error(`ABORT: no body for ${fix.slug}`);
    const occurrences = body.split(fix.find).length - 1;
    if (occurrences !== 1) {
      throw new Error(`ABORT: "${fix.note}" matched ${occurrences} times in ${fix.slug}, expected exactly 1`);
    }
    bodies.set(fix.slug, body.replace(fix.find, fix.replace));
    console.log(`  ok  ${fix.slug}\n      ${fix.note}`);
  }

  // Nothing should still point at a removed guide once the edits are applied.
  const { MERGED_GUIDE_SLUGS, REMOVED_GUIDE_SLUGS } = await import('../src/data/prunedGuides.js');
  const gone = new Set<string>([...Object.keys(MERGED_GUIDE_SLUGS), ...REMOVED_GUIDE_SLUGS]);
  let remaining = 0;
  for (const [slug, body] of bodies) {
    for (const m of body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/?\)/g)) {
      if (gone.has(m[1])) { console.log(`  STILL DEAD: ${slug} -> ${m[1]}`); remaining++; }
    }
  }
  if (remaining > 0) throw new Error(`ABORT: ${remaining} dead link(s) remain after the fixes`);
  console.log('\nno dead guide links remain in these articles');

  if (!APPLY) {
    console.log('\nDRY RUN -- nothing written. Re-run with APPLY=true to persist.');
    return;
  }

  for (const [slug, body] of bodies) {
    const res = await withDb((sql) => sql`
      UPDATE articles SET body_markdown = ${body}, updated_at = now()
      WHERE slug = ${slug} RETURNING slug, length(body_markdown) AS len
    `) as unknown as Array<{ slug: string; len: number }>;
    if (res.length !== 1) throw new Error(`ABORT: update of ${slug} affected ${res.length} rows`);
    console.log(`  wrote ${res[0].slug} (${res[0].len} chars)`);
  }
  console.log('\nApplied.');
}

main().catch((e) => { console.error('FAILED:', e?.message ?? e); process.exit(1); });
