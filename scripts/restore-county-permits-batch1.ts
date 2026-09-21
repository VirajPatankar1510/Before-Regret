// Batch 1 of the county permit restore: the five largest removed counties by population.
//
//   npx tsx scripts/restore-county-permits-batch1.ts            # dry run
//   APPLY=true npx tsx scripts/restore-county-permits-batch1.ts
//
// -----------------------------------------------------------------------------------------------
// FIVE, NOT TEN, AND NOT TWENTY. The prune cut 155 guides to 35 for the SHAPE of the publishing --
// 129 pages in a fortnight on a domain with no inbound links -- not for the substance of any page.
// Ten near-simultaneous restores rebuilds that shape. scripts/restore-page-one-removed.ts and
// prunedGuides.ts both say five at a time; this follows them. The other five wait for the index
// result on these.
//
// WHY THESE FIVE: largest removed counties by population, read from county_data rather than
// assumed -- Orange CA 3,183,647 / Dallas TX 2,607,218 / Riverside CA 2,416,838 / Queens NY
// 2,404,353 / Tarrant TX 2,106,939.
//
// -----------------------------------------------------------------------------------------------
// THE TEMPLATING PROBLEM, AND WHAT IS ACTUALLY WRONG WITH THESE PAGES.
//
// Measured before deciding: 5-gram Jaccard between the ten removed county guides is 2.0% mean,
// 2.7% max. The four live earners sit at 1.3%. Genuine non-duplication on this site measures ~1.6%.
// So the PROSE is not templated -- each page names a different portal, a different agency, a
// different statute (a California Public Records Act step in CA, an unincorporated-county step in
// TX). What IS templated is the heading skeleton and the title formula.
//
// The first draft of this script would have made that materially worse: it inserted ONE identical
// IRC R105.2 paragraph into all ten pages. Ten pages about US building permits citing the same code
// section is correct and normal; ten pages carrying the same 600-character block is a footprint.
// The distinction is duplicate CONTENT, not duplicate CITATIONS.
//
// So each page below gets a paragraph written for that county specifically, and the argument
// CHANGES with the county's own number rather than being one sentence with a variable in it:
//
//   Queens NY     83.6% pre-1980 -- an absent digital record is the norm, not a red flag
//   Orange CA     57.4%          -- majority older stock in a heavy-remodel county
//   Dallas TX     45.9%          -- near an even split, and TX has no countywide registry
//   Tarrant TX    33.8%          -- mostly newer; the trail should exist, so a gap is a question
//   Riverside CA  30.2%          -- the inverse case: a missing permit is anomalous, not expected
//
// Every figure is READ FROM county_data AT RUN TIME, never retyped, so it cannot drift from the
// report the same data generates. Same rule as PRIORITY_RULES in update-cast-iron-damage.ts.
//
// IRC R105.2 ("Work exempt from permit") was verified against codes.iccsafe.org on 2026-09-17, not
// recalled: one-story detached accessory structures not exceeding 200 square feet, fences not over
// 7 feet, retaining walls not over 4 feet measured from the bottom of the footing. The IRC is a
// model code and local adoption varies -- the fence height differs between versions and
// jurisdictions -- which the prose says rather than hides.
//
// ALSO FIXED, per page, because publishing moves them into assert-article-quality.ts's scope:
//   orange 156 / bexar 157 / broward 160 / alameda 160 char metas (budget 155)  [4 in the full ten]
//   dallas 595-char quick_answer (mobile ceiling 450)
//   clichés: "Furthermore" (dallas), "regulatory landscape" (tarrant)
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';

/** article slug -> county_data slug */
const COUNTY: Record<string, string> = {
  'check-building-permits-orange-county-ca': 'orange-county-ca',
  'check-building-permits-dallas-county-tx': 'dallas-county-tx',
  'check-building-permits-riverside-county-ca': 'riverside-county-ca',
  'check-building-permits-queens-ny': 'queens-county-ny',
  'check-building-permits-tarrant-county-tx': 'tarrant-county-tx',
};

const PRE_1980_KEYS = ['built1970to1979', 'built1960to1969', 'built1950to1959', 'built1940to1949', 'built1939OrEarlier'];

/** Prose written per county. `f` receives that county's OWN figures, read live. */
type Fig = { units: number; pre: number; pct: string };
const PARAGRAPH: Record<string, (f: Fig) => string> = {
  'check-building-permits-orange-county-ca': (f) =>
    `## What the county's housing age tells you before you search\n\n` +
    `Orange County has ${f.units.toLocaleString()} housing units and ${f.pre.toLocaleString()} of them -- ${f.pct}% -- were built before 1980 (US Census, via Before Regret's county data). In a county where most of the stock is that old and remodelling is common, the gap you are searching for is rarely the original construction. It is the kitchen, the garage conversion, the second bathroom. Work done before roughly 1980 may also predate the county's digital records entirely, so an empty search result is ambiguous rather than clean.\n\n` +
    `It is worth knowing what never needed a permit in the first place. The International Residential Code exempts a short list of work at IRC R105.2 -- one-story detached accessory structures not exceeding 200 square feet, fences under about 7 feet, retaining walls under 4 feet measured from the bottom of the footing. The IRC is a model code and jurisdictions amend it, so treat those as the shape of the exemption rather than the local rule, and confirm the number with the city before assuming a shed was legal.\n`,

  'check-building-permits-dallas-county-tx': (f) =>
    `## What the county's housing age tells you before you search\n\n` +
    `Of Dallas County's ${f.units.toLocaleString()} housing units, ${f.pre.toLocaleString()} predate 1980 -- ${f.pct}%, close to an even split (US Census, via Before Regret's county data). That split matters here more than it would elsewhere, because Texas has no countywide permit registry to fall back on. A house from the older half is likely to have a paper trail held by a city that has since changed its records system at least once; a house from the newer half should have a searchable digital history, and its absence is a question worth asking rather than a filing quirk.\n\n` +
    `Before treating any gap as unpermitted work, check whether a permit was required at all. The International Residential Code exempts, at IRC R105.2, one-story detached accessory structures up to 200 square feet, fences under roughly 7 feet and retaining walls under 4 feet from the footing -- and an exemption from the permit is not an exemption from the code itself. Local amendments are common, so confirm the threshold with the issuing city.\n`,

  'check-building-permits-riverside-county-ca': (f) =>
    `## What the county's housing age tells you before you search\n\n` +
    `Riverside County is the inverse of the older coastal counties: only ${f.pre.toLocaleString()} of its ${f.units.toLocaleString()} housing units were built before 1980, or ${f.pct}% (US Census, via Before Regret's county data). That changes how to read a missing permit. In a county where roughly seven homes in ten went up after 1980, the digital record should exist -- so a finished room, a patio cover or a pool with no corresponding permit is anomalous rather than expected, and is worth pressing on before you remove a contingency.\n\n` +
    `The exception is work that never required a permit. IRC R105.2, in the International Residential Code, exempts one-story detached accessory structures not exceeding 200 square feet, fences to about 7 feet, and retaining walls under 4 feet measured from the bottom of the footing. Jurisdictions amend those numbers, so check the local threshold rather than assuming the model code applies unchanged.\n`,

  'check-building-permits-queens-ny': (f) =>
    `## What the borough's housing age tells you before you search\n\n` +
    `Queens is one of the oldest housing stocks in the country: ${f.pre.toLocaleString()} of its ${f.units.toLocaleString()} units predate 1980 -- ${f.pct}% (US Census, via Before Regret's county data). Five homes in six is enough to invert the usual advice. An absent digital record here is the norm rather than a red flag, because the work often predates the record system, and treating every gap as concealed work will produce far more false alarms than findings. What matters is the opposite signal: a recent alteration with no matching filing.\n\n` +
    `Some work legitimately never generated a permit anywhere. The International Residential Code lists the exemptions at IRC R105.2 -- detached one-story accessory structures under 200 square feet, fences under roughly 7 feet, retaining walls under 4 feet from the footing. New York City administers its own code rather than adopting the IRC unchanged, so use that list as the general shape and confirm against the city's own rules.\n`,

  'check-building-permits-tarrant-county-tx': (f) =>
    `## What the county's housing age tells you before you search\n\n` +
    `Tarrant County's stock is comparatively new -- ${f.pre.toLocaleString()} of ${f.units.toLocaleString()} units were built before 1980, just ${f.pct}% (US Census, via Before Regret's county data). In a county that grew mostly after digital permitting arrived, the trail should be there to find. That makes a gap more informative than it would be in an older market: it is more likely to mean the work was not filed than that the record was lost, which is a reasonable thing to raise with the seller in writing.\n\n` +
    `Not every gap is a violation. The International Residential Code sets the exemptions out at IRC R105.2: one-story detached accessory structures up to 200 square feet, fences under about 7 feet and retaining walls under 4 feet measured from the footing -- though an exemption covers the permit, not compliance with the code. Cities amend the list, so confirm the local version before concluding a structure was fine.\n`,
};

const META: Record<string, string> = {
  // 156 -> within budget, and drops "navigate" for a verb that says what the reader does.
  'check-building-permits-orange-county-ca':
    'Unpermitted work in Orange County can derail a purchase. How to search the right city and county permit records before your contingency ends.',
};

const QUICK: Record<string, string> = {
  // 595 -> under the 450 mobile ceiling, keeping the jurisdiction instruction, which is the
  // part a reader acts on.
  'check-building-permits-dallas-county-tx':
    'Search the permit portal for the city the home sits in, not the county -- Texas permits are held by municipal building departments, and there is no countywide registry. Identify the right jurisdiction first through the Dallas Central Appraisal District, then check Dallas County Development Services only if the property is unincorporated. Open records requests can surface additions and structural work that was never filed.',
};

const CLICHE_FIX: Record<string, Array<{ find: string; replace: string }>> = {
  'check-building-permits-dallas-county-tx': [
    { find: 'Furthermore, local code enforcement officers', replace: 'Local code enforcement officers' },
  ],
  'check-building-permits-tarrant-county-tx': [
    { find: 'the regulatory landscape is different', replace: 'the process is different' },
  ],
};

const ANCHOR = '## Looking Up Permits Elsewhere';
const CLICHES = /\b(delve|furthermore|crucial|regulatory landscape|when it comes to|moreover|navigate the)\b/i;
const STD = /\b(NFPA|NEC|IRC|IBC|ASTM|ASCE|ANSI|UL)\s*[A-Z]?\s?[\d][\d.\-]*/i;

async function main() {
  const slugs = Object.keys(COUNTY);
  let arts: any[] | null = null;
  let cty: any[] | null = null;
  for (let a = 1; a <= 4 && !arts; a++) {
    try {
      arts = (await withDb((sql) => sql`
        SELECT slug, title, meta_description, quick_answer, body_markdown, status
        FROM articles WHERE slug = ANY(${slugs})`)) as unknown as any[];
      cty = (await withDb((sql) => sql`
        SELECT slug, census_total_units, census_year_built_json
        FROM county_data WHERE slug = ANY(${Object.values(COUNTY)}) AND data_complete`)) as unknown as any[];
    } catch (e) {
      console.error(`  neon attempt ${a}: ${(e as Error).message.slice(0, 70)}`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  if (!arts || !cty) throw new Error('ABORT: database unreachable after 4 attempts');
  if (arts.length !== slugs.length) throw new Error(`ABORT: expected ${slugs.length} articles, got ${arts.length}`);

  const staged: Array<{ slug: string; meta: string; tldr: string; body: string }> = [];
  const added: string[] = [];

  for (const slug of slugs) {
    const cur = arts.find((r) => r.slug === slug);
    if (!cur) throw new Error(`ABORT: ${slug} missing`);
    if (cur.status !== 'removed') throw new Error(`ABORT: ${slug} is "${cur.status}", expected "removed"`);

    const c = cty.find((r) => r.slug === COUNTY[slug]);
    if (!c) throw new Error(`ABORT: no complete county_data row for ${COUNTY[slug]}`);
    const buckets = JSON.parse(c.census_year_built_json || '{}');
    const units = Number(c.census_total_units) || 0;
    const pre = PRE_1980_KEYS.reduce((s, k) => s + (Number(buckets[k]) || 0), 0);
    if (!units || !pre) throw new Error(`ABORT: ${COUNTY[slug]} has no usable Census housing-age figures`);
    const fig: Fig = { units, pre, pct: ((pre / units) * 100).toFixed(1) };

    let body = String(cur.body_markdown);
    for (const fix of CLICHE_FIX[slug] ?? []) {
      const n = body.split(fix.find).length - 1;
      if (n !== 1) throw new Error(`ABORT: ${slug} cliché "${fix.find.slice(0, 30)}" matched ${n}, expected 1`);
      body = body.replace(fix.find, fix.replace);
    }

    const para = PARAGRAPH[slug](fig);
    if (added.includes(para)) throw new Error(`ABORT: ${slug} paragraph is identical to another in this batch`);
    added.push(para);

    const at = body.indexOf(ANCHOR);
    if (at < 0) throw new Error(`ABORT: ${slug} has no "${ANCHOR}" section`);
    body = `${body.slice(0, at)}${para}\n${body.slice(at)}`;

    const meta = META[slug] ?? String(cur.meta_description);
    const tldr = QUICK[slug] ?? String(cur.quick_answer);
    const title = String(cur.title);

    // --- gates ---------------------------------------------------------------------------------
    if (title.length > 60) throw new Error(`ABORT: ${slug} title ${title.length}`);
    if (meta.length > 155 || meta.length < 70) throw new Error(`ABORT: ${slug} meta ${meta.length}`);
    if (tldr.length > 450 || tldr.length < 120) throw new Error(`ABORT: ${slug} tldr ${tldr.length}`);
    if (!STD.test(body)) throw new Error(`ABORT: ${slug} has no numbered standard`);
    const cl = body.match(CLICHES);
    if (cl) throw new Error(`ABORT: ${slug} cliché "${cl[0]}"`);
    for (const re of [/\*\*\[[^\]]*\]\([^)]*\)\*\*/g, /\[\*\*[^\]]*\*\*\]\([^)]*\)/g]) {
      if (re.test(body)) throw new Error(`ABORT: ${slug} bold-wrapped link`);
    }
    // The figures must actually be in the prose that claims them.
    for (const need of [fig.units.toLocaleString(), fig.pre.toLocaleString(), `${fig.pct}%`]) {
      if (!body.includes(need)) throw new Error(`ABORT: ${slug} body lacks its own figure "${need}"`);
    }

    staged.push({ slug, meta, tldr, body });
    console.log(`\n  ${slug.replace('check-building-permits-', '')}`);
    console.log(`    census  ${fig.pre.toLocaleString()} of ${fig.units.toLocaleString()} pre-1980 = ${fig.pct}%`);
    console.log(`    meta ${String(cur.meta_description).length}${META[slug] ? ` -> ${meta.length}` : ''} | tldr ${String(cur.quick_answer).length}${QUICK[slug] ? ` -> ${tldr.length}` : ''} | body ${String(cur.body_markdown).length} -> ${body.length}`);
  }

  // Cross-page duplication check: the whole point of this batch.
  function shingles(s: string) {
    const w = s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
    const o = new Set<string>();
    for (let i = 0; i < w.length - 4; i++) o.add(w.slice(i, i + 5).join(' '));
    return o;
  }
  let worst = 0, pair = '';
  for (let i = 0; i < added.length; i++) {
    for (let j = i + 1; j < added.length; j++) {
      const a = shingles(added[i]), b = shingles(added[j]);
      let n = 0; for (const x of a) if (b.has(x)) n++;
      const v = n / (a.size + b.size - n);
      if (v > worst) { worst = v; pair = `${staged[i].slug} <-> ${staged[j].slug}`; }
    }
  }
  console.log(`\n  worst overlap between the five NEW paragraphs: ${(worst * 100).toFixed(1)}%  (${pair})`);
  if (worst > 0.25) throw new Error(`ABORT: the added paragraphs are ${(worst * 100).toFixed(1)}% alike -- that is a template, not five analyses`);

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
