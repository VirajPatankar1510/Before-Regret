// Publish "Can You Get a Mortgage on a House With Knob and Tube?" (owner request 2026-10-17, after the analysis of
// the 2026-10-17 Bing keyword report and GSC export: knob-and-tube financing questions showed this site at Bing
// positions 3-5 with no clicks, landing on #7, which explains lender trouble only through insurance).
//
//   npx tsx scripts/publish-mortgage-knob-and-tube.ts            # dry run
//   APPLY=true npx tsx scripts/publish-mortgage-knob-and-tube.ts
//
// Facts: data/fact-ledgers/mortgage-house-knob-and-tube-wiring.json -- HUD Handbook 4000.1 (08/13/2025, read from
// the Internet Archive copy of hud.gov's PDF; hud.gov served a Cloudflare check), VA Pamphlet 26-7 ch. 12 (archived
// VA file), VA Change 46, Fannie Mae B4-1.3-06, PRIORITY_RULES knob_and_tube, Census B25034.
//
// READ 2026-11-21: shown on Google or Bing for at least one knob-and-tube financing search (mortgage, lender, FHA,
// VA, bank, appraisal). If not, fold its loan-rule sections into #7 knob-tube-wiring-have-be-replaced-before-closing
// (owner OK first) and 301 this URL there.
import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { validateBriefs, type ArticleBrief } from '../src/seo/articleBrief.js';
import { validateEffortBrief, assertHumanDraft, type EffortBrief } from '../src/seo/effortBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';

const APPLY = process.env.APPLY === 'true';
const SLUG = 'mortgage-house-knob-and-tube-wiring';
const SIBLINGS = ['knob-tube-wiring-have-be-replaced-before-closing', 'what-is-knob-and-tube-wiring', 'splice-romex-knob-tube-wiring', 'get-home-insurance-aluminum-wiring'];
const STOP =
  'Read 2026-11-21: shown on Google or Bing for at least one knob-and-tube financing search. If not, fold the ' +
  'loan-rule sections into #7 (owner OK first) and 301 this URL there.';

const BRIEFS: ArticleBrief[] = [{
  slug: SLUG,
  targetQuery: 'will fha finance a home with knob and tube wiring',
  capture: '2026-10-17-bing-queries',
  intent: 'informational',
  who: 'a buyer financing an older house whose inspector found knob and tube wiring, unsure whether the loan will close',
  want: 'what FHA, VA and conventional rules actually say about knob and tube and what makes an appraiser require repairs',
  achieve: 'to keep the loan on track by fixing or documenting the right things before the appraisal and the contract deadline',
  titlePromise: 'whether you can get a mortgage on a house with knob and tube wiring',
  stopCondition: STOP,
}];

const EFFORT: EffortBrief = {
  slug: SLUG,
  readerGoal: 'Will my FHA, VA or conventional loan close on a house with knob and tube, and what do I fix first?',
  firstScreen: 'The quick answer says usually yes, names the condition triggers for each loan type, and flags insurance as the separate hurdle; the first paragraph says the answer depends on which rulebook the loan follows.',
  firstParty: [
    { what: 'Bing searches that showed this site for knob-and-tube financing questions, used as the questions the page answers', source: 'data/keywords/2026-10-17-bing-queries.json' },
    { what: 'Pre-1950 housing counts computed from our Census B25034 county file', source: 'docs/data/oldest-housing-raw.json' },
    { what: 'Knob-and-tube era window, electrician evaluation and rewire cost from our report engine', source: 'src/engine/inspectionPriorities.ts' },
    { what: 'A full-text search of all 1,871 pages of HUD Handbook 4000.1 for knob and tube and a 60-amp rule (neither found)', source: 'data/fact-ledgers/mortgage-house-knob-and-tube-wiring.json' },
  ],
  evidenceOfWork: [
    'comparison table of the three rulebooks with the section each rule sits in',
    'visible "How we checked this" section naming the versions read, the blocked sites and what we did not read',
    'ledger data/fact-ledgers/mortgage-house-knob-and-tube-wiring.json quoting every rule',
  ],
  beyondCommonFacts: [
    'HUD 4000.1 never mentions knob and tube and has no 60-amp rule, contrary to claims repeated on brokerage sites',
    'An FHA appraiser must operate a sample of switches, fixtures and receptacles; a VA appraiser performs no operational checks',
    'VA topic 44 lets a Veteran ask VA to waive MPR repairs with lender agreement, but not for safety items',
    'Fannie Mae will not buy a loan on a C6-rated house until it is repaired to at least C5',
    'A Limited 203(k) can finance electrical replacement up to $75,000 total; a standard 203(k) consultant must upgrade service to the greater of 100 amp or local code',
  ],
  reproducibilityCheck: 'The top results repeat that FHA allows knob and tube with 60 amps and that insurers balk. None quote the appraiser instructions side by side, test the 60-amp claim against the handbook text, or give the VA operational-check difference and the 203(k) financing route with section references.',
  discussion: 'needed',
  discussionReason: 'The reader must weigh three different rulebooks against their own loan type, and decide whether to fix, finance through 203(k) or seek a VA waiver; insurance is left to guide #7.',
};

const trigrams = (t: string) => {
  const w = t.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  return new Set(w.slice(0, -2).map((_, i) => `${w[i]} ${w[i + 1]} ${w[i + 2]}`));
};
const overlap = (a: string, b: string) => { const A = trigrams(a), B = trigrams(b); let n = 0; A.forEach((g) => { if (B.has(g)) n++; }); return n / A.size; };

async function main() {
  validateBriefs(BRIEFS);
  validateEffortBrief(EFFORT);
  let bad = 0;
  const fail = (m: string) => { console.log(`  FAIL ${m}`); bad++; };

  const raw = fs.readFileSync(path.join(process.cwd(), 'guides', `${SLUG}.md`), 'utf8');
  const front = raw.match(/^---\n([\s\S]*?)\n---\n/)!;
  const field = (k: string) => (front[1].match(new RegExp(`^${k}:[ \\t]*(.*)$`, 'm'))?.[1] ?? '').trim();
  const rest = raw.slice(front[0].length);
  const title = rest.match(/^#\s+(.*)$/m)![1].trim();
  const body = rest.replace(/^#\s.*\n+/, '').trim();
  const meta = field('meta'), quick = field('quick');
  const ledger = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'fact-ledgers', `${SLUG}.json`), 'utf8'));

  assertHumanDraft(SLUG, body, quick);

  const rows = (await withDb((sql) => sql`SELECT slug, status, body_markdown FROM articles`)) as unknown as Array<{ slug: string; status: string; body_markdown: string }>;
  const published = new Map(rows.filter((r) => r.status === 'published').map((r) => [r.slug, r.body_markdown]));
  if (rows.some((r) => r.slug === SLUG)) fail('slug already exists');

  const all = `${title}\n${meta}\n${quick}\n${body}`;
  if (title.length > 60) fail(`title ${title.length} chars`);
  if (meta.length < 70 || meta.length > 155) fail(`meta ${meta.length} chars`);
  if (quick.length < 120 || quick.length > 450) fail(`quick answer ${quick.length} chars`);
  if (guideTopic(SLUG, title) !== 'electrical') fail(`topic ${guideTopic(SLUG, title)}, expected electrical`);
  const ledgerText = JSON.stringify(ledger.facts);
  for (const m of all.replace(/\]\([^)]*\)/g, ']').matchAll(/\$?\d[\d,./-]*/g)) {
    const tok = m[0].replace(/[.,]+$/, '');
    if (!ledgerText.includes(tok)) fail(`number "${tok}" is in no ledger entry`);
  }
  for (const re of [
    /\b(most|many|some) (insurers|carriers|lenders|companies) (will|usually|often|typically)/i,
    /\b(State Farm|Allstate|Progressive|USAA|Liberty Mutual|Farmers|Nationwide|Travelers|Citizens|Security First)\b/,
    /\bguarantee/i, /\bread on\b/i, /\*\*\[[^\]]*\]\([^)]*\)\*\*|\[\*\*/,
  ]) if (re.test(all)) fail(`banned pattern ${re}`);
  for (const m of body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/\)/g)) if (!published.has(m[1])) fail(`dead link ${m[1]}`);
  for (const sib of SIBLINGS) {
    const ov = overlap(body, published.get(sib) ?? '');
    console.log(`    vs ${sib}: ${(ov * 100).toFixed(1)}%`);
    if (ov > 0.08) fail(`overlap ${(ov * 100).toFixed(1)}% with ${sib}`);
  }
  console.log(`\n  ${SLUG}\n    title (${title.length})  ${title}\n    meta  (${meta.length})  ${meta}\n    quick (${quick.length})  ${quick}\n    body  ${body.split(/\s+/).length} words`);
  if (bad) { console.log(`\n  ${bad} problem(s) -- nothing written.`); process.exit(1); }
  if (!APPLY) { console.log('\n  DRY RUN -- all checks pass.\n'); return; }
  await withDb((sql) => sql`
    INSERT INTO articles (slug, title, meta_description, quick_answer, body_markdown, sources_json, status, article_type, ad_tier, published_at)
    VALUES (${SLUG}, ${title}, ${meta}, ${quick}, ${body}, '[]', 'published', 'guide', 'standard', now())`);
  console.log(`  wrote ${SLUG}`);
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
