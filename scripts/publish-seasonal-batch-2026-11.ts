// Publish the owner's five seasonal guides (owner, 2026-11-17: "All 5 now", "Your exact titles", title 2 with
// "or Cords" added).
//
//   python3 scripts/render-seasonal-diagrams.py && APPLY=1 python3 scripts/render-seasonal-diagrams.py   # images
//   npx tsx scripts/publish-seasonal-batch-2026-11.ts            # dry run
//   APPLY=true npx tsx scripts/publish-seasonal-batch-2026-11.ts
//
// Pages (facts: data/fact-ledgers/<slug>.json):
//   - thanksgiving-home-cooking-fires-what-to-check     NFPA Thanksgiving + CPSC-commissioned alarm survey; our diagram
//   - daisy-chaining-power-strips-holiday-decorations   ULSE 2026 survey, UL XBYS guidance, IRC E3702.14; our diagram
//   - snow-hide-winter-home-inspection                  WAC 308-408C read in full; Fannie Mae B4-1.2-05; engine roof/HVAC
//   - leaving-home-thanksgiving-checklist               Red Cross, MA DOI, CT CID, USPS; our regulator comparison + diagram
//   - best-time-to-buy-house-christmas-by-city          our FHFA analysis, scripts/analyze-fhfa-seasonality.py
//
// Demand (data/keywords/2026-11-17-demand-thanksgiving-cooking-fire-*.json): this site has no Google queries on any
// of them; Bing market counts exist for "smoke alarm", "power strip", "extension cord", and are zero (= unknown)
// for the winter-buying, Thanksgiving-travel and Christmas-buying phrasings. These are experiments.
// Note: the two Thanksgiving pages go live a week before the holiday and will mostly be judged by November 2027.
//
// READ 2026-12-22 (5 weeks): Google and Bing impressions per page. Stop condition below.
import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { validateBriefs, type ArticleBrief } from '../src/seo/articleBrief.js';
import { validateEffortBrief, assertHumanDraft, type EffortBrief } from '../src/seo/effortBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';
import { getInspectionPriorities } from '../src/engine/inspectionPriorities.js';

const APPLY = process.env.APPLY === 'true';
const CAPTURE = '2026-11-17-demand-thanksgiving-cooking-fire-bing';
const STOP = 'Read 2026-12-22: if fewer than 2 of the 5 are shown by Google or Bing at all, do not add more seasonal pages; the two Thanksgiving pages are judged again in late November 2027.';
const LIVE_SIBLINGS = ['fall-home-maintenance-checklist-new-homeowners', 'need-gfci-outlets-pass-home-inspection', 'open-ground-mean-electrical-inspection',
  'dont-skip-the-home-inspection', 'how-to-tell-how-old-a-roof-is', 'hvac-techs-wish-buyers-knew-about-system-age', 'not-inspected-due-storage-mean-inspection-report'];

type Spec = { brief: ArticleBrief; effort: EffortBrief; topic: string };
const S = (topic: string, brief: Omit<ArticleBrief, 'capture' | 'stopCondition'>, effort: EffortBrief): Spec => ({ topic, brief: { ...brief, capture: CAPTURE, stopCondition: STOP }, effort });
const LEDGER = (slug: string) => `data/fact-ledgers/${slug}.json`;

const SPECS: Spec[] = [
  S('holiday-safety', { slug: 'thanksgiving-home-cooking-fires-what-to-check', targetQuery: 'smoke alarm', intent: 'informational',
      who: 'someone hosting Thanksgiving dinner who wants the house itself ready, not another list of cooking tips',
      want: 'which checks on the kitchen smoke alarm, its age and the kitchen circuits are worth doing before Thursday',
      achieve: 'to move or replace an alarm that is too close or too old, and spread the appliances across circuits, before the day',
      titlePromise: 'the house checks that matter on the peak day for home cooking fires' },
    { slug: 'thanksgiving-home-cooking-fires-what-to-check', readerGoal: 'I\'m hosting Thanksgiving. What should I check in the house first?',
      firstScreen: 'NFPA\'s 1,139 Thanksgiving cooking fires, then the first check: half the alarms nearest a kitchen sit inside NFPA\'s 10-foot line.',
      firstParty: [{ what: 'Diagram of distance bands from the stove drawn from NFPA advice and the CPSC-commissioned survey tables', source: 'public/images/kitchen-smoke-alarm-distance-from-stove.webp' }],
      evidenceOfWork: ['"How we checked this" naming the NFPA pages, the full CPSC-commissioned report and its caveats, read 2026-11-17', 'figures taken from the report\'s own tables (pages cited in the ledger)'],
      beyondCommonFacts: ['53% of alarms nearest the kitchen were within 10 feet of the stove, 13% under 6 feet', 'average manufacture year 2015 across 528 dated alarms, so the average is already past NFPA\'s 10 years', '27% of households with non-working alarms had disabled them on purpose', 'IRC E3703.2 requires two 20-amp kitchen circuits only for new work'],
      reproducibilityCheck: 'Top results repeat NFPA\'s cooking tips. None uses the CPSC-commissioned field survey\'s placement, age and nuisance-alarm tables, or ties them to kitchen circuits.',
      discussion: 'not-needed', discussionReason: 'A practical pre-holiday check; the reader needs the checks in order, not a debate.' }),
  S('holiday-safety', { slug: 'daisy-chaining-power-strips-holiday-decorations', targetQuery: 'power strip', intent: 'informational',
      who: 'someone decorating for the holidays with power strips plugged into other strips or extension cords to reach the tree and porch',
      want: 'why chaining strips is a problem and what to plug in instead',
      achieve: 'to rewire the setup so each strip goes into its own wall outlet and the big displays sit on different circuits',
      titlePromise: 'why daisy-chaining power strips or cords matters, from the survey figure to the circuit math' },
    { slug: 'daisy-chaining-power-strips-holiday-decorations', readerGoal: 'Is it actually a problem to plug one power strip into another for the decorations?',
      firstScreen: 'ULSE\'s 2026 survey figure (46%), then UL\'s own listing words: strips are meant for a wall outlet, not another strip or cord.',
      firstParty: [{ what: 'Diagram contrasting a chained setup with one strip per outlet, with our 15/20-amp watt arithmetic', source: 'public/images/daisy-chained-power-strips-one-circuit.webp' }],
      evidenceOfWork: ['"How we checked this" naming the ULSE survey method, UL\'s published answer, UL 588 page, NFPA and the IRC table', 'watt figures shown as our arithmetic from the code\'s amp limits'],
      beyondCommonFacts: ['UL lists power strips (category XBYS) for direct connection to a receptacle and not for routing through windows or walls', 'NEC Article 590 limits decorative holiday lighting strings to 90 days', 'UL 588 Supplement SD requires a watt-limit marking on year-round string lights'],
      reproducibilityCheck: 'Top results say "don\'t daisy-chain" without the listing text. None quotes UL\'s XBYS guidance, the NEC 90-day rule or the UL 588 marking, or shows the circuit arithmetic.',
      discussion: 'not-needed', discussionReason: 'The reader wants the reason and the fix; no trade-off to weigh.' }),
  S('seasonal-buying', { slug: 'snow-hide-winter-home-inspection', targetQuery: 'buying house winter', intent: 'informational',
      who: 'a buyer under contract in December or January whose inspection is booked while the roof and yard are under snow',
      want: 'which parts of the house snow and cold keep the inspector from seeing, and what to do about each',
      achieve: 'to get the report to record what was not inspected and to price the roof and AC before the inspection deadline',
      titlePromise: 'the eight things snow and cold can hide from a home inspection, and how to cover each' },
    { slug: 'snow-hide-winter-home-inspection', readerGoal: 'We\'re buying in winter. What will the inspector not be able to see?',
      firstScreen: 'The quick answer naming the three winter limits in Washington\'s rule, then the eight items with the rule\'s own words.',
      firstParty: [{ what: 'Item-by-item table mapping each winter blind spot to what to ask for and the WAC section, built from reading WAC 308-408C in full on 2026-11-17; engine roof and HVAC costs', source: LEDGER('snow-hide-winter-home-inspection') }],
      evidenceOfWork: ['"How we checked this" naming the WAC chapter (WSR 26-15-037) and Fannie Mae B4-1.2-05 and the blocked InterNACHI source', 'quoted rule text for each limit'],
      beyondCommonFacts: ['Washington\'s rule does not require running cooling below 60 F but does require reporting the alternate method when the roof is not walked', 'Fannie Mae\'s inclement-weather postponement applies to new or proposed construction; on an existing house worn roof shingles must be completed and verified before the loan is sold'],
      reproducibilityCheck: 'Top results list winter inspection tips. None quotes a state standard of practice clause by clause, or catches that the weather-escrow rule people cite is for new construction.',
      discussion: 'needed', discussionReason: 'The buyer has to weigh what was not seen against the deadline and the lender\'s rules.' }),
  S('holiday-safety', { slug: 'leaving-home-thanksgiving-checklist', targetQuery: 'leaving home thanksgiving', intent: 'informational',
      who: 'a homeowner leaving the house empty for a few days over Thanksgiving in a cold part of the country',
      want: 'the short list of things to do before locking up, and what their insurance expects',
      achieve: 'to leave the heat, sinks, garage, mail and a key set up so a cold snap or a burst pipe is caught or covered',
      titlePromise: 'seven things to do before leaving home for Thanksgiving' },
    { slug: 'leaving-home-thanksgiving-checklist', readerGoal: 'We\'re away for Thanksgiving. What do I need to do to the house before we go?',
      firstScreen: 'The quick answer with the 55 F floor first, then the Massachusetts regulator line on heated and unoccupied homes.',
      firstParty: [{ what: 'Side-by-side reading of the Massachusetts and Connecticut insurance regulators\' frozen-pipe wording, and our diagram of where pipes freeze', source: 'public/images/where-pipes-freeze-first.webp' }],
      evidenceOfWork: ['"How we checked this" naming the four sources read 2026-11-17 and the policy form we could not find', 'regulator comparison table'],
      beyondCommonFacts: ['Massachusetts DOI: 48.6% of 2024 homeowners claims were non-flood water and freezing damage, and cover hinges on the home being heated and not unoccupied', 'Connecticut: cover may not apply if the furnace was turned off without winterizing', 'USPS Hold Mail holds every person\'s mail at the address, 3 to 30 days'],
      reproducibilityCheck: 'Top results give generic travel checklists. None puts two state regulators\' frozen-pipe wording side by side or points out that neither defines unoccupied.',
      discussion: 'not-needed', discussionReason: 'A checklist; the one judgement (policy wording) is flagged, not debated.' }),
  S('seasonal-buying', { slug: 'best-time-to-buy-house-christmas-by-city', targetQuery: 'buy house christmas', intent: 'informational',
      who: 'a buyer deciding whether to keep house-hunting through December instead of waiting for spring',
      want: 'whether prices really dip at Christmas where they are buying, and by how much',
      achieve: 'to judge the winter discount in their own metro before choosing when to buy',
      titlePromise: 'how big the winter price dip is in each city, and whether Christmas falls in it' },
    { slug: 'best-time-to-buy-house-christmas-by-city', readerGoal: 'Is it cheaper to buy a house at Christmas where I live?',
      firstScreen: 'The quick answer with the 100-metro median (2.29 points) and the Seattle/Miami range, then the national January low.',
      firstParty: [{ what: 'Seasonal factor (NSA/SA) for the US, 9 divisions and 100 metros, 2016-2025, computed by our script', source: 'docs/data/fhfa-seasonality-2016-2025.json' }],
      evidenceOfWork: ['two tables built from our data file, each with its source line', '"How we checked this" naming the script, the FHFA FAQ and the blocked or unusable sources'],
      beyondCommonFacts: ['FHFA dates sales by loan origination, so the January factor (-0.85%) is the closest proxy for a Christmas deal, not December', 'in Seattle and Denver the low quarter is Oct-Dec and Jan-Mar sits above trend', 'median winter dip 2.29 points across 100 metros, 0.47 to 4.89'],
      reproducibilityCheck: 'Top results repeat national "best month" claims from portals. None measures the seasonal factor by metro from public FHFA data or shows that the Christmas deal can land above trend in some cities.',
      discussion: 'needed', discussionReason: 'The answer differs by city and by which winter quarter is low; the reader has to weigh it against what the data does not cover.' }),
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

async function main() {
  validateBriefs(SPECS.map((s) => s.brief));
  for (const s of SPECS) validateEffortBrief(s.effort);
  // Engine figures quoted on the winter-inspection page must still be what the engine says.
  const pr = getInspectionPriorities(1990, 'King', 'WA')?.priorities ?? [];
  const roof = pr.find((p) => p.id === 'roof_age'), hvac = pr.find((p) => p.id === 'hvac_age');
  if (!roof || !String(roof.typicalRepairCost).includes('$8,000 – $25,000+')) throw new Error('ABORT: engine roof_age cost changed; update snow-hide-winter-home-inspection');
  if (!hvac || !String(hvac.typicalRepairCost).includes('$6,000 – $15,000')) throw new Error('ABORT: engine hvac_age cost changed; update snow-hide-winter-home-inspection');

  let bad = 0; const fail = (m: string) => { console.log(`  FAIL ${m}`); bad++; };
  const rows = (await withDb((sql) => sql`SELECT id, slug, title, status, body_markdown FROM articles`)) as unknown as Array<{ id: number; slug: string; title: string; status: string; body_markdown: string }>;
  const published = new Map(rows.filter((r) => r.status === 'published').map((r) => [r.slug, r.body_markdown]));
  const batchSlugs = new Set(SPECS.map((s) => s.brief.slug));
  const drafts = new Map(SPECS.map((s) => [s.brief.slug, readDraft(s.brief.slug)]));
  const canon = fs.readFileSync('scripts/assert-canonical-urls.ts', 'utf8');

  for (const s of SPECS) {
    const slug = s.brief.slug; const d = drafts.get(slug)!;
    const ledger = JSON.parse(fs.readFileSync(LEDGER(slug), 'utf8'));
    try { assertHumanDraft(slug, d.body, d.quick); } catch (e: any) { fail(`${slug}: ${String(e.message).slice(0, 200)}`); }
    if (rows.find((r) => r.slug === slug)) fail(`${slug}: slug already exists`);
    // Owner's exact titles: allowed over 60 only when listed in OWNER_LONG_TITLES.
    if (d.title.length > 60 && !canon.includes(`'/guides/${slug}/'`)) fail(`${slug}: title ${d.title.length} chars and not in OWNER_LONG_TITLES`);
    if (d.meta.length < 70 || d.meta.length > 155) fail(`${slug}: meta ${d.meta.length} chars`);
    const isQ = /\?/.test(d.title);
    if (isQ && (d.quick.length < 120 || d.quick.length > 450)) fail(`${slug}: quick answer ${d.quick.length} chars`);
    if (!isQ && d.quick) fail(`${slug}: quick answer on a non-question title`);
    if (guideTopic(slug, d.title) !== s.topic) fail(`${slug}: topic ${guideTopic(slug, d.title)}, expected ${s.topic}`);
    if (!/^## How we checked this/m.test(d.body)) fail(`${slug}: no How we checked this`);
    // Images: the file must exist, and alt text must carry the labels (checked by eye against the renderer).
    for (const m of d.body.matchAll(/!\[([^\]]*)\]\((\/images\/[^ )]+)/g)) {
      if (m[1].length < 80) fail(`${slug}: image alt text too short for ${m[2]}`);
      if (!fs.existsSync(path.join('public', m[2]))) fail(`${slug}: image file missing public${m[2]} (run APPLY=1 python3 scripts/render-seasonal-diagrams.py)`);
    }
    const all = `${d.title}\n${d.meta}\n${d.quick}\n${d.body}`;
    const ledgerAll = JSON.stringify(ledger.facts);
    for (const m of all.replace(/\]\([^)]*\)/g, ']').matchAll(/\$?\d[\d,./-]*/g)) {
      const tok = m[0].replace(/[.,/-]+$/, '');
      if (!ledgerAll.includes(tok)) fail(`${slug}: number "${tok}" in no ledger entry`);
    }
    const quotes = norm(ledger.facts.map((f: any) => f.quote).join(' '));
    // Image markdown is ours (alt text and caption), not a quotation, so it is left out of the quote check.
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
