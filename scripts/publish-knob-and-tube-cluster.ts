// Publish the knob-and-tube cluster: five pages in one go (owner, 2026-11-14), two of them restored at their
// pruned addresses (owner chose "reuse the old URLs") and three new.
//
//   npx tsx scripts/publish-knob-and-tube-cluster.ts            # dry run
//   APPLY=true npx tsx scripts/publish-knob-and-tube-cluster.ts
//
// Why this cluster: largest Bing demand of the old-house topics checked 2026-11-14 ("knob and tube wiring",
// relative counts only), #338 already earning impressions, head terms sitting at positions 50-85, and the
// stucco cluster showing that full coverage pays on this site (350 impressions/page/28d).
//
// Pages (each answers a distinct search seen in data/keywords/2026-11-14-demand-knob-and-tube-bing.json):
//   - knob-and-tube-wiring-insulation            NEW      CEC 394.12(5) + exception; WAC 296-46B-394; Iowa WAP; DOE 1988
//   - is-knob-and-tube-wiring-still-live         NEW      WAC 308-408C-110; Berkeley/EWEB/Snohomish forms
//   - knob-and-tube-removal-cost-permits         NEW      fee math from LA County 2026-27 and Boston schedules
//   - get-homeowners-insurance-knob-tube-wiring  RESTORE  #16; forms as a letter checklist; RCW 48.18.290/.2901
//   - i-buy-house-knob-tube-wiring               RESTORE  #22; hub; our pre-1940 Census study
// Facts: data/fact-ledgers/<slug>.json. Our own work: the fee calculations, the three-form comparison, the
// pre-1940 state table (docs/data/oldest-housing-figures.json), our report engine's knob_and_tube rule.
//
// Also required before the build: remove the two restored slugs from MERGED_GUIDE_SLUGS in src/data/prunedGuides.ts,
// otherwise the function would 301 them to #7.
//
// READ 2026-12-19 (5 weeks): impressions per page for the cluster (the 5 new + #7, #288, #289, #338) against the
// 2026-11-14 baseline, and our position for "knob and tube wiring" (head terms at 50-85 today). Stop condition: if
// fewer than 3 of the 5 are shown by Google at all, hold the next cluster (polybutylene) and report before adding more.
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
const CAPTURE = '2026-11-14-demand-knob-and-tube-bing';
const STOP = 'Read 2026-12-19: if fewer than 3 of the 5 cluster pages are shown by Google at all, hold the polybutylene cluster and report before adding more.';
const LIVE_SIBLINGS = ['knob-tube-wiring-have-be-replaced-before-closing', 'what-is-knob-and-tube-wiring', 'splice-romex-knob-tube-wiring', 'mortgage-house-knob-and-tube-wiring'];
const RESTORE: Record<string, number> = { 'get-homeowners-insurance-knob-tube-wiring': 16, 'i-buy-house-knob-tube-wiring': 22 };

type Spec = { brief: ArticleBrief; effort: EffortBrief };
const S = (brief: Omit<ArticleBrief, 'capture' | 'stopCondition'>, effort: EffortBrief): Spec => ({ brief: { ...brief, capture: CAPTURE, stopCondition: STOP }, effort });
const LEDGER = (slug: string) => `data/fact-ledgers/${slug}.json`;

const SPECS: Spec[] = [
  S({ slug: 'knob-and-tube-wiring-insulation', targetQuery: 'knob and tube wiring attic', intent: 'informational',
      who: 'a buyer or new owner of a pre-1950 house who finds insulation lying over porcelain knobs in the attic, or wants to add some',
      want: 'whether insulation over knob and tube is allowed where the house is, and on what conditions',
      achieve: 'to insulate, or accept an insulated attic, without breaking the local electrical rule and with the paperwork that proves it',
      titlePromise: 'what the electrical codes allow when insulating over knob and tube, state by state' },
    { slug: 'knob-and-tube-wiring-insulation', readerGoal: 'Can I put insulation over the knob and tube in my attic, and what do I need first?',
      firstScreen: 'The quick answer: not under the base rule, but California and Washington allow it after an electrician certifies the wiring in writing.',
      firstParty: [{ what: 'Side-by-side comparison of California\'s exception and Washington\'s WAC 296-46B-394, built from the Berkeley form and the WAC text read 2026-11-14', source: LEDGER('knob-and-tube-wiring-insulation') }],
      evidenceOfWork: ['"How we checked this" naming each code text and form read, and what was blocked', 'comparison table built from the two primary texts'],
      beyondCommonFacts: ['Washington bans foam insulation over knob and tube and requires Class I with flame spread 25 or less', 'Snohomish PUD approves insulating by area with initials, not check marks', 'Iowa dams uncertified wiring with batts 14 inches wide, R-38, and leaves those walls uninsulated', 'a 1988 DOE memo names states that chose not to adopt the NEC knob-and-tube change'],
      reproducibilityCheck: 'Top results say "don\'t insulate over knob and tube" or quote a contractor. None compares the actual California and Washington exceptions, the certification forms, or the weatherization dam spec.',
      discussion: 'needed', discussionReason: 'The answer changes by state and by whether the wiring is certified; the reader has to weigh the local rule.' }),
  S({ slug: 'is-knob-and-tube-wiring-still-live', targetQuery: 'how bad is it to purchase a home with active knob and tube', intent: 'informational',
      who: 'a buyer whose inspection report says knob and tube was observed but cannot say whether it still carries power',
      want: 'to know whether the old wiring is live, partly live or abandoned, and who can say so',
      achieve: 'to get a written, circuit-by-circuit answer from an electrician before the inspection deadline',
      titlePromise: 'how to find out whether knob and tube is active or abandoned' },
    { slug: 'is-knob-and-tube-wiring-still-live', readerGoal: 'The report says knob and tube. Is it actually still in use?',
      firstScreen: 'The quick answer: you cannot tell by looking, inspectors usually are not required to test, an electrician has to trace it and put it in writing.',
      firstParty: [{ what: 'Reading of three public certification forms (Berkeley, EWEB, Snohomish PUD) as the written answer a buyer should ask for', source: LEDGER('is-knob-and-tube-wiring-still-live') }],
      evidenceOfWork: ['"How we checked this" naming the inspection standard and forms read 2026-11-14', 'quoted inspector duties and limits from WAC 308-408C-110'],
      beyondCommonFacts: ['Washington inspectors are not required to insert testing devices into panels, activate de-energized circuits, operate breakers or pull fuses', 'Berkeley\'s form has exactly three outcomes including disconnected and not live', 'Snohomish PUD lists every circuit with breaker or S-fuse, amps and gauge, signed by a journeyman'],
      reproducibilityCheck: 'Top results describe how to spot knob and tube. None quotes what an inspector is and is not required to test, or the exact outcomes an electrician certifies.',
      discussion: 'not-needed', discussionReason: 'A practical, direct page: what each professional can confirm and what to ask for.' }),
  S({ slug: 'knob-and-tube-removal-cost-permits', targetQuery: 'knob and tube wiring', intent: 'informational',
      who: 'a buyer pricing a knob-and-tube house who has a rewire range but no idea what the permit and the interim fixes add',
      want: 'what the permit, the fuse or breaker fix and the electrician letter actually cost',
      achieve: 'to read a rewire quote line by line and negotiate a credit with numbers they can check',
      titlePromise: 'the permit fees and smaller costs around removing knob and tube, worked from real schedules' },
    { slug: 'knob-and-tube-removal-cost-permits', readerGoal: 'What will dealing with the knob and tube really cost me, beyond the rewire?',
      firstScreen: 'Our rewire and evaluation ranges, then the permit fee worked out from LA County\'s 2026-27 schedule.',
      firstParty: [{ what: 'Permit fee calculations from the LA County 2026-27 and Boston schedules', source: LEDGER('knob-and-tube-removal-cost-permits') }, { what: 'Pre-1940 housing shares from our Census study', source: 'docs/data/oldest-housing-figures.json' }],
      evidenceOfWork: ['fee table computed from the LA County schedule', '"How we checked this" naming the schedules and what could not load'],
      beyondCommonFacts: ['LA County charges at least $504.47 to investigate electrical work done without a permit', 'a 15-circuit rewire with a new panel is $467.25 in LA County permit fees, 5.8% of the low-end rewire', 'Boston charges $20 plus $0.25 per amp for a service upgrade', 'Iowa rule of thumb: 15 amp fuses for 14-gauge, 20 amp for 12-gauge'],
      reproducibilityCheck: 'Top results give national rewire ranges from lead-generation sites. None works a permit fee from a real 2026 schedule or prices the unpermitted-work penalty.',
      discussion: 'needed', discussionReason: 'The reader weighs an interim fuse fix against a rewire and reads a quote line by line.' }),
  S({ slug: 'get-homeowners-insurance-knob-tube-wiring', targetQuery: 'what insurance company will insure a home with some knob and tube wiring', intent: 'transactional',
      who: 'a buyer under contract on a house with knob and tube who has to bind homeowners insurance before closing',
      want: 'whether an insurer will write the policy and what it will want to see',
      achieve: 'a written insurance answer before the inspection deadline, with the electrician letter that makes yes possible',
      titlePromise: 'how to get a homeowners policy on a house with knob and tube' },
    { slug: 'get-homeowners-insurance-knob-tube-wiring', readerGoal: 'Can I insure this house with knob and tube, and how do I get a yes?',
      firstScreen: 'The quick answer: only the insurer can say; what you control is disclosure and an electrician\'s written evaluation.',
      firstParty: [{ what: 'A three-form comparison turned into a checklist for the electrician letter', source: LEDGER('get-homeowners-insurance-knob-tube-wiring') }, { what: 'Our report engine flags knob and tube as an insurance red flag through 1955', source: 'src/engine/inspectionPriorities.ts' }],
      evidenceOfWork: ['comparison table of the Berkeley, EWEB and Snohomish forms', '"How we checked this" stating that no insurer is named and why'],
      beyondCommonFacts: ['Washington inspectors must describe the branch wiring type, so the wiring will be in the report', 'Washington insurers must give 60 days notice with the actual reason to nonrenew', 'the three certification forms differ on who signs and how fuse sizing is recorded'],
      reproducibilityCheck: 'Top results are insurer marketing pages repeating that some insurers refuse. None turns public certification forms into a letter checklist or quotes the notice statute.',
      discussion: 'needed', discussionReason: 'There is no single answer; the reader weighs disclosure, documentation and timing.' }),
  S({ slug: 'i-buy-house-knob-tube-wiring', targetQuery: 'buying a house with knob and tube wiring', intent: 'informational',
      who: 'a buyer who just learned the older house they love has knob and tube and wonders whether to walk away',
      want: 'whether the purchase can still work and what decides it',
      achieve: 'four written answers before the deadline: live or not, insurable, lender condition, removal cost',
      titlePromise: 'whether you can buy a house with knob and tube, and the four answers that decide it' },
    { slug: 'i-buy-house-knob-tube-wiring', readerGoal: 'I found knob and tube. Can I still buy this house?',
      firstScreen: 'The quick answer: yes; FHA, VA and Fannie Mae rules do not name it; four answers decide each purchase.',
      firstParty: [{ what: 'Share of homes built before 1940 by state, from our Census study', source: 'docs/data/oldest-housing-figures.json' }],
      evidenceOfWork: ['state table from docs/data/oldest-housing-figures.json', '"How we checked this" naming the study and code texts'],
      beyondCommonFacts: ['16,880,456 US homes, 11.74%, were built before 1940; 582 counties are at least a quarter pre-1940', 'a full-text search of FHA\'s 1,871-page handbook finds no mention of knob'],
      reproducibilityCheck: 'Top results say yes with caveats. None gives where such houses are concentrated from Census data or orders the four decisions with sources.',
      discussion: 'needed', discussionReason: 'The buy decision depends on four separate answers the reader has to gather and weigh.' }),
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
  // Engine figures quoted on the pages must still be what the engine says (never retyped silently).
  const kt = getInspectionPriorities(1930, 'Cook', 'IL')?.priorities.find((p) => p.id === 'knob_and_tube');
  if (!kt || !String(kt.typicalRepairCost).includes('$8,000 – $30,000+') || !String(kt.costToCheck).includes('$150 – $350')) throw new Error('ABORT: engine knob_and_tube figures changed; update the pages');

  let bad = 0; const fail = (m: string) => { console.log(`  FAIL ${m}`); bad++; };
  const rows = (await withDb((sql) => sql`SELECT id, slug, title, status, body_markdown FROM articles`)) as unknown as Array<{ id: number; slug: string; title: string; status: string; body_markdown: string }>;
  const published = new Map(rows.filter((r) => r.status === 'published').map((r) => [r.slug, r.body_markdown]));
  const batchSlugs = new Set(SPECS.map((s) => s.brief.slug));
  const drafts = new Map(SPECS.map((s) => [s.brief.slug, readDraft(s.brief.slug)]));

  for (const s of SPECS) {
    const slug = s.brief.slug; const d = drafts.get(slug)!;
    const ledger = JSON.parse(fs.readFileSync(LEDGER(slug), 'utf8'));
    try { assertHumanDraft(slug, d.body, d.quick); } catch (e: any) { fail(`${slug}: ${String(e.message).slice(0, 200)}`); }
    const existing = rows.find((r) => r.slug === slug);
    if (RESTORE[slug]) { if (!existing || existing.id !== RESTORE[slug] || existing.status !== 'removed') fail(`${slug}: expected removed row #${RESTORE[slug]}`); }
    else if (existing) fail(`${slug}: slug already exists`);
    if (d.title.length > 60) fail(`${slug}: title ${d.title.length} chars`);
    if (d.meta.length < 70 || d.meta.length > 155) fail(`${slug}: meta ${d.meta.length} chars`);
    const isQ = /\?/.test(d.title); // same as assert-article-quality: a "?" anywhere
    if (isQ && (d.quick.length < 120 || d.quick.length > 450)) fail(`${slug}: quick answer ${d.quick.length} chars`);
    if (!isQ && d.quick) fail(`${slug}: quick answer on a non-question title`);
    if (guideTopic(slug, d.title) !== 'electrical') fail(`${slug}: topic ${guideTopic(slug, d.title)}`);
    if (!/^## How we checked this/m.test(d.body)) fail(`${slug}: no How we checked this`);
    const all = `${d.title}\n${d.meta}\n${d.quick}\n${d.body}`;
    const ledgerAll = JSON.stringify(ledger.facts);
    for (const m of all.replace(/\]\([^)]*\)/g, ']').matchAll(/\$?\d[\d,./-]*/g)) {
      const tok = m[0].replace(/[.,]+$/, '');
      if (!ledgerAll.includes(tok)) fail(`${slug}: number "${tok}" in no ledger entry`);
    }
    const quotes = norm(ledger.facts.map((f: any) => f.quote).join(' '));
    for (const m of all.matchAll(/"([^"\n]*)"/g)) { if (m[1].length >= 12 && !quotes.includes(norm(m[1]))) fail(`${slug}: quote not in ledger: "${m[1].slice(0, 70)}"`); }
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
    console.log(`  ${RESTORE[slug] ? 'RESTORE' : 'NEW    '} ${slug}\n    title (${d.title.length}) ${d.title}\n    meta  (${d.meta.length})  quick (${d.quick.length})  body ${d.body.split(/\s+/).length} words`);
  }
  if (bad) { console.log(`\n  ${bad} problem(s) -- nothing written.`); process.exit(1); }
  if (!APPLY) { console.log('\n  DRY RUN -- all checks pass.\n'); return; }

  fs.mkdirSync('backups', { recursive: true });
  for (const s of SPECS) {
    const slug = s.brief.slug; const d = drafts.get(slug)!;
    if (RESTORE[slug]) {
      const old = (await withDb((sql) => sql`SELECT * FROM articles WHERE id = ${RESTORE[slug]}`)) as unknown as any[];
      fs.writeFileSync(`backups/${slug}-before-restore-${Date.now()}.json`, JSON.stringify(old, null, 2));
      // Slug is never written. Old FAQs described the old text, so they are cleared and rewritten after.
      const res = (await withDb((sql) => sql`
        UPDATE articles SET title = ${d.title}, meta_description = ${d.meta}, quick_answer = ${d.quick}, body_markdown = ${d.body},
          sources_json = '[]', faq_json = '[]', status = 'published', published_at = coalesce(published_at, now()), updated_at = now()
        WHERE id = ${RESTORE[slug]} AND slug = ${slug} AND status = 'removed' RETURNING id`)) as unknown as any[];
      if (res.length !== 1) throw new Error(`ABORT: ${slug} restore affected ${res.length} rows`);
      console.log(`  restored #${RESTORE[slug]} ${slug}`);
    } else {
      await withDb((sql) => sql`
        INSERT INTO articles (slug, title, meta_description, quick_answer, body_markdown, sources_json, status, article_type, ad_tier, published_at)
        VALUES (${slug}, ${d.title}, ${d.meta}, ${d.quick}, ${d.body}, '[]', 'published', 'guide', 'standard', now())`);
      console.log(`  wrote ${slug}`);
    }
  }
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
