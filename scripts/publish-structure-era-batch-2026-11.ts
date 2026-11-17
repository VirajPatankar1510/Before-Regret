// Publish three owner-requested guides (owner, 2026-11-17: "i think we do not currently have dedicated standalone URLs
// for these topics"; aluminum angle changed to repair cost after the overlap check with #30, owner chose
// "Different angle" then "Repair cost").
//
//   npx tsx scripts/build-1970s-housing-figures.ts                       # first-party data for page 3
//   python3 scripts/render-structure-era-diagrams.py && APPLY=1 python3 scripts/render-structure-era-diagrams.py
//   npx tsx scripts/publish-structure-era-batch-2026-11.ts               # dry run
//   APPLY=true npx tsx scripts/publish-structure-era-batch-2026-11.ts
//
// Pages (facts: data/fact-ledgers/<slug>.json):
//   - aluminum-wiring-repair-cost-before-closing    CPSC Pub 516 read in full; Fannie Mae B3-4.1-02; engine; our diagram
//   - pier-and-beam-foundation-inspection-red-flags  22 TAC 535.228 + WAC 308-408C; IRC R317.1 / R408; engine; our diagram
//   - buying-1970s-house-problems-inspection         engine split by build year + Census B25034 count (our script); diagram
//
// Demand (data/keywords/2026-11-17-demand-aluminum-wiring-*.json): every Google query for aluminum wiring already
// lands on #30 (insurance); Bing market counts exist for "aluminum wiring" and "pier and beam foundation" and are
// zero (= unknown) for the 1970s-house and aluminum-cost phrasings. Pier and beam and 1970s are tier-2/3 experiments.
//
// READ 2026-12-22 (5 weeks): Google and Bing impressions per page. Stop condition below.
import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { withDb } from '../src/server/db.js';
import { validateBriefs, type ArticleBrief } from '../src/seo/articleBrief.js';
import { validateEffortBrief, assertHumanDraft, type EffortBrief } from '../src/seo/effortBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';
import { PRIORITY_RULES } from '../src/engine/inspectionPriorities.js';

const APPLY = process.env.APPLY === 'true';
const CAPTURE = '2026-11-17-demand-aluminum-wiring-bing';
const STOP = 'Read 2026-12-22: a page with no Google or Bing impressions at all by then gets no siblings; if the aluminum cost page is shown only for #30\'s insurance queries, fold its cost section into a reviewed #30 instead of keeping both.';
const LIVE_SIBLINGS = ['get-home-insurance-aluminum-wiring', 'knob-and-tube-removal-cost-permits', 'option-period-negotiating-home-repairs',
  'when-foundation-crack-need-structural-engineer', 'should-buy-house-s-already-had-foundation-repair', 'snow-hide-winter-home-inspection',
  'when-was-my-house-built-by-address', 'spot-polybutylene-pipes-before-buying-house', 'standard-home-inspection-check-asbestos', 'sewer-scope-before-buying-house'];

type Spec = { brief: ArticleBrief; effort: EffortBrief; topic: string };
const S = (topic: string, brief: Omit<ArticleBrief, 'capture' | 'stopCondition'>, effort: EffortBrief): Spec => ({ topic, brief: { ...brief, capture: CAPTURE, stopCondition: STOP }, effort });
const LEDGER = (slug: string) => `data/fact-ledgers/${slug}.json`;

const SPECS: Spec[] = [
  S('electrical', { slug: 'aluminum-wiring-repair-cost-before-closing', targetQuery: 'aluminum wiring', intent: 'transactional',
      who: 'a buyer whose inspection report says the house has aluminum branch wiring, with a few days left to send a repair request',
      want: 'what a proper repair costs and exactly what to ask the seller to do or pay for',
      achieve: 'to send a repair request that names a CPSC-accepted method, covers every connection and survives the lender\'s credit cap',
      titlePromise: 'what aluminum wiring repair costs and the wording to ask for before closing' },
    { slug: 'aluminum-wiring-repair-cost-before-closing', readerGoal: 'The inspector found aluminum wiring. What will fixing it cost and what do I ask the seller for?',
      firstScreen: 'Our engine\'s $2,000 – $8,000+ and $150 – $350, and the point that the price is a count of connections.',
      firstParty: [{ what: 'Repair-scope diagram drawn from CPSC Publication 516 (what is in the repair and what the booklet does not cover)', source: 'public/images/aluminum-wiring-connection-points-repair-scope.webp' },
        { what: 'Engine repair range and the credit-cap thresholds computed from it', source: LEDGER('aluminum-wiring-repair-cost-before-closing') }],
      evidenceOfWork: ['"How we checked this" naming CPSC Publication 516 read in full and Fannie Mae B3-4.1-02, read 2026-11-17', 'credit thresholds shown as our arithmetic'],
      beyondCommonFacts: ['Publication 516 says some electricians recommend twist-on pigtails and CO/ALR devices because they are substantially less expensive, and CPSC accepts neither as permanent', 'the booklet does not cover range, dryer or service-entrance aluminum, or copper-clad cable', 'an $8,000 credit at the 3% cap needs a price of at least $266,667'],
      reproducibilityCheck: 'Top results quote a cost range and list repair methods. None turns the CPSC scope into the wording of a repair request, or works the engine range against the lender\'s credit cap.',
      discussion: 'needed', discussionReason: 'Repair, credit or price reduction is a real trade-off here because the method is the whole question.' }),
  S('structural', { slug: 'pier-and-beam-foundation-inspection-red-flags', targetQuery: 'pier and beam foundation', intent: 'informational',
      who: 'a buyer under contract on an older house on piers over a crawl space, with the inspection about to be booked or just back',
      want: 'what the inspection should cover underneath and which findings are real red flags',
      achieve: 'to make sure someone actually enters the crawl space and to read the report against the code numbers',
      titlePromise: 'the red flags in a pier-and-beam inspection, above and below the floor' },
    { slug: 'pier-and-beam-foundation-inspection-red-flags', readerGoal: 'I\'m buying a pier-and-beam house. What should the inspection look for?',
      firstScreen: 'The vantage-point line Texas requires in the report, and the 18-inch headroom limit under which inspectors may skip the crawl space.',
      firstParty: [{ what: 'Crawl-space cross-section drawn from IRC R317.1 and R408 with the red flags inspectors must report', source: 'public/images/pier-and-beam-crawl-space-clearances-red-flags.webp' },
        { what: 'Engine pier_and_beam rule and county list; vent and fan sizing worked for a 1,500 sq ft crawl space', source: LEDGER('pier-and-beam-foundation-inspection-red-flags') }],
      evidenceOfWork: ['"How we checked this" naming 22 TAC 535.228, WAC 308-408C and the 2021 IRC sections, read 2026-11-17, and the TREC site we could not reach', 'our arithmetic shown as ours'],
      beyondCommonFacts: ['Texas requires the report to state the vantage point the crawl space was inspected from; both Texas and Washington let inspectors skip under 18 inches of headroom', 'IRC R317.1 decay-resistant wood within 18 in. of soil for joists and 12 in. for girders', 'a sealed crawl space under IRC R408.3 needs an exhaust fan, supply air or a dehumidifier, not only plastic'],
      reproducibilityCheck: 'Top results list generic foundation warning signs. None reads two state inspection standards for what the inspector may skip, or holds findings against the IRC clearances and the sealed-crawl-space requirements.',
      discussion: 'needed', discussionReason: 'Findings have other explanations and older houses predate the code; the reader has to weigh them.' }),
  S('house-age', { slug: 'buying-1970s-house-problems-inspection', targetQuery: 'buying a 1970s house', intent: 'informational',
      who: 'a buyer looking at a house built sometime in the 1970s who wants to know which era problems apply to it',
      want: 'which inspection checks matter for the exact year the house was built',
      achieve: 'to book the right extra checks (sewer scope, electrician, lead test) for that build year before the deadline',
      titlePromise: 'the hidden problems and inspection checks for a 1970s house, by build year' },
    { slug: 'buying-1970s-house-problems-inspection', readerGoal: 'We\'re buying a house built in the 70s. What problems should the inspection look for?',
      firstScreen: 'The quick answer splitting the decade in three, then the table of checks and costs by build year.',
      firstParty: [{ what: 'Engine rules run for every build year 1970-1979 and the Census B25034 1970s count, both written by our script', source: 'docs/data/1970s-housing-figures.json' },
        { what: 'Timeline diagram of the checks by build year, drawn from the same file', source: 'public/images/1970s-house-inspection-checks-by-year.webp' }],
      evidenceOfWork: ['table generated from our data file with its source named', '"How we checked this" naming the script, the Census table and the EPA and CPSC pages with read dates'],
      beyondCommonFacts: ['the decade splits at 1973 and 1977 in our engine: aluminum and cast iron end, then lead disclosure ends and polybutylene starts', 'EPA and HUD date the 1978 line by permit, not completion', 'EPA\'s renovation rule binds any contractor paid to disturb paint in a pre-1978 house, even sole proprietorships', '14.2% of US housing units were built in the 1970s; 25.8% in Broward County'],
      reproducibilityCheck: 'Top results list 1970s house problems as one era. None splits the decade by build year from a working rules engine or counts where the decade\'s housing is from the Census table.',
      discussion: 'not-needed', discussionReason: 'The reader needs the checks for their year; the one edge case (1977/1978) is explained, not debated.' }),
];

const trigrams = (t: string) => { const w = t.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean); return new Set(w.slice(0, -2).map((_, i) => `${w[i]} ${w[i + 1]} ${w[i + 2]}`)); };
const overlap = (a: string, b: string) => { const A = trigrams(a), B = trigrams(b); let n = 0; A.forEach((g) => { if (B.has(g)) n++; }); return n / A.size; };
const norm = (x: string) => x.toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').replace(/[.,;:]+$/, '');

function readDraft(slug: string) {
  const raw = fs.readFileSync(path.join(process.cwd(), 'guides', `${slug}.md`), 'utf8');
  const front = raw.match(/^---\n([\s\S]*?)\n---\n/)!;
  const field = (k: string) => (front[1].match(new RegExp(`^${k}:[ \\t]*(.*)$`, 'm'))?.[1] ?? '').trim();
  const rest = raw.slice(front[0].length);
  return { title: rest.match(/^#\s+(.*)$/m)![1].trim(), body: rest.replace(/^#\s.*\n+/, '').trim(), meta: field('meta'), quick: field('quick') };
}

function assertEngine(drafts: Map<string, { body: string; quick: string }>) {
  const rule = (id: string) => { const r = PRIORITY_RULES.find((x) => x.id === id); if (!r) throw new Error(`ABORT: engine rule ${id} missing`); return r; };
  const need = (id: string, field: 'costToCheck' | 'typicalRepairCost', s: string) => {
    if (!String(rule(id)[field] ?? '').includes(s)) throw new Error(`ABORT: engine ${id}.${field} no longer contains "${s}" -- update the pages that quote it`);
  };
  need('electrical_aluminum_wiring', 'costToCheck', '$150 – $350');
  need('electrical_aluminum_wiring', 'typicalRepairCost', '$2,000 – $8,000+');
  need('pier_and_beam', 'typicalRepairCost', '$3,000 – $15,000+');
  need('sewer_cast_iron', 'costToCheck', '$300 – $500');
  need('sewer_cast_iron', 'typicalRepairCost', 'Spot repair $1,500 – $5,000; full replacement $4,000 – $15,000+');
  need('polybutylene_supply', 'typicalRepairCost', '$4,000 – $15,000');
  need('electrical_panel_brand', 'typicalRepairCost', '$1,500 – $4,000');
  need('asbestos_materials', 'costToCheck', '$200 – $600');
  const al = rule('electrical_aluminum_wiring'), pb = rule('pier_and_beam'), pbu = rule('polybutylene_supply'), panel = rule('electrical_panel_brand');
  if (al.minYear !== 1965 || al.maxYear !== 1973) throw new Error('ABORT: aluminum window changed');
  if (pb.maxYear !== 1965 || (pb.counties ?? []).length !== 13) throw new Error('ABORT: pier_and_beam window or county count changed');
  if (pbu.minYear !== 1978 || pbu.maxYear !== 1996 || panel.minYear !== 1950 || panel.maxYear !== 1989) throw new Error('ABORT: polybutylene or panel window changed');
  // The 1970s bands: rebuild the figures file and compare with what the page says.
  execFileSync('npx', ['tsx', 'scripts/build-1970s-housing-figures.ts'], { stdio: 'ignore' });
  const figs = JSON.parse(fs.readFileSync('docs/data/1970s-housing-figures.json', 'utf8'));
  const bands = figs.engine.bands.map((b: any) => `${b.from}-${b.to}:${b.rules.join('+')}`).join(' ');
  const want = '1970-1973:lead_paint_disclosure+electrical_aluminum_wiring+sewer_cast_iron 1974-1977:lead_paint_disclosure 1978-1979:polybutylene_supply';
  if (bands !== want) throw new Error(`ABORT: engine bands changed: ${bands}`);
  if (figs.national.share1970sPct !== 14.2 || figs.national.countiesWhere1970sIsLargestDecade !== 751) throw new Error('ABORT: Census figures changed');
  const c = drafts.get('buying-1970s-house-problems-inspection')!;
  if (!c.body.includes('docs/data/1970s-housing-figures.json')) throw new Error('ABORT: 1970s page must name its data file');
}

async function main() {
  validateBriefs(SPECS.map((s) => s.brief));
  for (const s of SPECS) validateEffortBrief(s.effort);
  const drafts = new Map(SPECS.map((s) => [s.brief.slug, readDraft(s.brief.slug)]));
  assertEngine(drafts);

  let bad = 0; const fail = (m: string) => { console.log(`  FAIL ${m}`); bad++; };
  const rows = (await withDb((sql) => sql`SELECT id, slug, title, status, body_markdown FROM articles`)) as unknown as Array<{ id: number; slug: string; title: string; status: string; body_markdown: string }>;
  const published = new Map(rows.filter((r) => r.status === 'published').map((r) => [r.slug, r.body_markdown]));
  const batchSlugs = new Set(SPECS.map((s) => s.brief.slug));
  const canon = fs.readFileSync('scripts/assert-canonical-urls.ts', 'utf8');

  // The new house-age pattern must not move any existing row out of its bucket.
  const moved = rows.filter((r) => guideTopic(r.slug, r.title) === 'house-age' && !/when[- ]was[- ]\w+[- ]house[- ]built|year[- ]built/.test(`${r.slug} ${r.title}`.toLowerCase()));
  if (moved.length) fail(`house-age decade pattern reclassifies ${moved.map((r) => r.slug).join(', ')}`);

  for (const s of SPECS) {
    const slug = s.brief.slug; const d = drafts.get(slug)!;
    const ledger = JSON.parse(fs.readFileSync(LEDGER(slug), 'utf8'));
    try { assertHumanDraft(slug, d.body, d.quick); } catch (e: any) { fail(`${slug}: ${String(e.message).slice(0, 200)}`); }
    if (rows.find((r) => r.slug === slug)) fail(`${slug}: slug already exists`);
    if (d.title.length > 60 && !canon.includes(`'/guides/${slug}/'`)) fail(`${slug}: title ${d.title.length} chars and not in OWNER_LONG_TITLES`);
    if (d.meta.length < 70 || d.meta.length > 155) fail(`${slug}: meta ${d.meta.length} chars`);
    const isQ = /\?/.test(d.title);
    if (isQ && (d.quick.length < 120 || d.quick.length > 450)) fail(`${slug}: quick answer ${d.quick.length} chars`);
    if (!isQ && d.quick) fail(`${slug}: quick answer on a non-question title`);
    if (guideTopic(slug, d.title) !== s.topic) fail(`${slug}: topic ${guideTopic(slug, d.title)}, expected ${s.topic}`);
    if (!/^## How we checked this/m.test(d.body)) fail(`${slug}: no How we checked this`);
    for (const m of d.body.matchAll(/!\[([^\]]*)\]\((\/images\/[^ )]+)/g)) {
      if (m[1].length < 80) fail(`${slug}: image alt text too short for ${m[2]}`);
      if (!fs.existsSync(path.join('public', m[2]))) fail(`${slug}: image file missing public${m[2]} (run APPLY=1 python3 scripts/render-structure-era-diagrams.py)`);
    }
    const all = `${d.title}\n${d.meta}\n${d.quick}\n${d.body}`;
    const ledgerAll = JSON.stringify(ledger.facts);
    // Ordered-list markers ("1. ") are not figures.
    for (const m of all.replace(/\]\([^)]*\)/g, ']').replace(/^\d+\.\s/gm, '').matchAll(/\$?\d[\d,./-]*/g)) {
      const tok = m[0].replace(/[.,/-]+$/, '');
      if (!ledgerAll.includes(tok)) fail(`${slug}: number "${tok}" in no ledger entry`);
    }
    const quotes = norm(ledger.facts.map((f: any) => f.quote).join(' '));
    for (const m of all.replace(/!\[[^\]]*\]\([^)]*\)/g, '').matchAll(/"([^"\n]*)"/g)) { if (m[1].length >= 12 && !quotes.includes(norm(m[1]))) fail(`${slug}: quote not in ledger: "${m[1].slice(0, 70)}"`); }
    for (const re of [/\b(most|many|some) (insurers|carriers|lenders) (will|usually|often|typically|refuse|won't)/i, /\b(State Farm|Allstate|Progressive|USAA|Liberty Mutual|Farmers|Nationwide|Travelers|Chubb|Citizens Property|Lemonade|Hippo|Erie|Amica)\b/i, /\bguarantee/i, /\bread on\b/i, /\*\*\[[^\]]*\]\([^)]*\)\*\*|\[\*\*/])
      if (re.test(all)) fail(`${slug}: banned pattern ${re}`);
    for (const m of d.body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/\)/g)) if (!published.has(m[1]) && !batchSlugs.has(m[1])) fail(`${slug}: dead link ${m[1]}`);
    for (const sib of [...LIVE_SIBLINGS, ...batchSlugs]) {
      if (sib === slug) continue;
      const other = drafts.get(sib)?.body ?? published.get(sib);
      if (!other) { fail(`${slug}: sibling ${sib} missing`); continue; }
      const ov = overlap(d.body, other);
      if (ov > 0.08) fail(`${slug}: overlap ${(ov * 100).toFixed(1)}% with ${sib}`);
    }
    console.log(`  NEW ${slug}  [${s.topic}]\n    title (${d.title.length}) ${d.title}\n    meta  (${d.meta.length})  quick (${d.quick.length})  body ${d.body.split(/\s+/).length} words`);
  }
  if (bad) { console.log(`\n  ${bad} problem(s) -- nothing written.`); process.exit(1); }
  if (!APPLY) { console.log('\n  DRY RUN -- all checks pass.\n'); return; }

  for (const s of SPECS) {
    const slug = s.brief.slug; const d = drafts.get(slug)!;
    await withDb((sql) => sql`
      INSERT INTO articles (slug, title, meta_description, quick_answer, body_markdown, sources_json, status, article_type, ad_tier, published_at)
      VALUES (${slug}, ${d.title}, ${d.meta}, ${d.quick}, ${d.body}, '[]', 'published', 'guide', 'standard', now())`);
    console.log(`  wrote ${slug}`);
  }
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
