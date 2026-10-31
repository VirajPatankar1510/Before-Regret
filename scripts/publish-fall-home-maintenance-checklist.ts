// Publish "Fall Home Maintenance Checklist for New Homeowners" (owner, 2026-10-30: picked from the outside content
// report's Topic 2, "fall home maintenance checklist", run as an experiment).
//
//   npx tsx scripts/publish-fall-home-maintenance-checklist.ts            # dry run
//   APPLY=true npx tsx scripts/publish-fall-home-maintenance-checklist.ts
//
// Facts: data/fact-ledgers/fall-home-maintenance-checklist-new-homeowners.json -- ENERGY STAR, USFA, CPSC, NFPA,
// American Red Cross, US DOE, Natural Resources Canada. First-party: the "if your report mentioned..." table (our
// own mapping from the findings our guides and the Inspection Report Decoder cover) and our Bing demand capture.
// Demand: tier 2 -- Bing records "home maintenance checklist" and "fall home maintenance checklist"; this site was
// shown for neither, and "after closing" phrasings show nothing. A new segment (owners after closing) -> experiment.
//
// READ 2026-12-04: shown on Google or Bing for at least one maintenance-checklist search. If not, fold the
// inspection-report table into an existing guide (owner OK first) and stop the post-closing line.
import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { validateBriefs, type ArticleBrief } from '../src/seo/articleBrief.js';
import { validateEffortBrief, assertHumanDraft, type EffortBrief } from '../src/seo/effortBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';

const APPLY = process.env.APPLY === 'true';
const SLUG = 'fall-home-maintenance-checklist-new-homeowners';
const TITLE = 'Fall Home Maintenance Checklist for New Homeowners';
const SIBLINGS = ['hurricane-home-checklist-flood-insurance', 'homeowners-insurance-cover-failed-sump-pump', 'hvac-techs-wish-buyers-knew-about-system-age', 'home-insurance-with-wood-stove', 'not-inspected-due-storage-mean-inspection-report'];
const STOP =
  'Read 2026-12-04: shown on Google or Bing for at least one maintenance-checklist search. ' +
  'If not, fold the inspection-report table into an existing guide (owner OK first) and stop the post-closing line.';

const BRIEFS: ArticleBrief[] = [{
  slug: SLUG,
  targetQuery: 'fall home maintenance checklist',
  capture: '2026-10-30-demand-after-closing-checklist-bing',
  intent: 'informational',
  who: 'someone who closed on a house this year and is heading into the first fall and winter as its owner',
  want: 'a short, trustworthy list of what to do before the cold, starting with what their own inspection report flagged',
  achieve: 'to have heating checked, alarms working, outdoor taps drained and pipes protected before the first freeze',
  titlePromise: 'a fall home maintenance checklist written for people who just bought their home',
  stopCondition: STOP,
}];

const EFFORT: EffortBrief = {
  slug: SLUG,
  readerGoal: 'I just bought this house. What do I need to do before its first winter with me as the owner?',
  firstScreen: 'The opening sends the reader to their own inspection report first, and the first section is a table that turns common report findings into before-winter tasks.',
  firstParty: [
    { what: 'A table mapping inspection-report findings to fall tasks, drawn from the findings our guides and Inspection Report Decoder cover', source: 'src/data/inspectionDecoderTerms.ts' },
    { what: 'Our Bing demand capture showing maintenance-checklist wording has searches and after-closing wording has none', source: 'data/keywords/2026-10-30-demand-after-closing-checklist-bing.json' },
  ],
  evidenceOfWork: [
    'visible "How we checked this" naming the eight official sources read on 30 October 2026 and what we left out',
    'ledger data/fact-ledgers/fall-home-maintenance-checklist-new-homeowners.json quoting each recommendation',
    'the report-findings table, which no generic checklist has',
  ],
  beyondCommonFacts: [
    'Failure to clean was the leading factor in home clothes dryer fires 2018-2020, at 31% (USFA, NFIRS)',
    'Smoke alarms are replaced 10 years from the manufacture date, so inherited alarms need their date checked (USFA)',
    'The Red Cross order for outdoor taps: close the inside valve, then open the outside tap and leave it open',
    'Condensation often gets worse right after new windows, because the old leaky ones were lowering humidity (NRCan)',
    'Half of home heating fires are reported in December, January and February (NFPA)',
  ],
  reproducibilityCheck: 'Top results give a generic fall list (gutters, furnace, smoke alarms). They do not start from the reader\'s own inspection report, pair each task with the official source, or carry the inherited-alarm date check, the outdoor-tap order, the new-window condensation effect or the dryer-fire data.',
  discussion: 'not-needed',
  discussionReason: 'A checklist: the reader needs clear steps in order, not trade-offs. The one judgement (report findings first) is made in the opening.',
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

  const rows = (await withDb((sql) => sql`SELECT slug, title, status, body_markdown FROM articles`)) as unknown as Array<{ slug: string; title: string; status: string; body_markdown: string }>;
  // The new 'maintenance' topic bucket must not move any existing guide out of its cluster.
  const moved = rows.filter((r) => r.status === 'published' && r.slug !== SLUG && guideTopic(r.slug, r.title) === 'maintenance');
  if (moved.length) fail(`maintenance bucket reclassifies existing guides: ${moved.map((r) => r.slug).join(', ')}`);
  const published = new Map(rows.filter((r) => r.status === 'published').map((r) => [r.slug, r.body_markdown]));
  if (rows.some((r) => r.slug === SLUG)) fail('slug already exists');

  const all = `${title}\n${meta}\n${quick}\n${body}`;
  if (title !== TITLE) fail('title changed from the planned title');
  if (title.length > 60) fail(`title ${title.length} chars`);
  if (meta.length < 70 || meta.length > 155) fail(`meta ${meta.length} chars`);
  if (quick) fail('non-question title carries a quick answer');
  if (guideTopic(SLUG, title) !== 'maintenance') fail(`topic ${guideTopic(SLUG, title)}, expected maintenance`);
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
  console.log(`\n  ${SLUG}\n    title (${title.length})  ${title}\n    meta  (${meta.length})  ${meta}\n    quick: none (non-question title)\n    body  ${body.split(/\s+/).length} words`);
  if (bad) { console.log(`\n  ${bad} problem(s) -- nothing written.`); process.exit(1); }
  if (!APPLY) { console.log('\n  DRY RUN -- all checks pass.\n'); return; }
  await withDb((sql) => sql`
    INSERT INTO articles (slug, title, meta_description, quick_answer, body_markdown, sources_json, status, article_type, ad_tier, published_at)
    VALUES (${SLUG}, ${title}, ${meta}, ${quick}, ${body}, '[]', 'published', 'guide', 'standard', now())`);
  console.log(`  wrote ${SLUG}`);
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
