// A controlled test of one hypothesis: does opening quick_answer with a verdict get a page cited
// more often in Google's Generative AI features?
//
//   npx tsx scripts/ai-verdict-test.ts            # dry run
//   APPLY=true npx tsx scripts/ai-verdict-test.ts
//
// -----------------------------------------------------------------------------------------------
// THE HYPOTHESIS, AND WHY IT IS ONLY A HYPOTHESIS.
//
// The first Generative AI Features export (2026-08-18..09-14, see data/keywords/) let each page's
// AI-feature impressions be divided by its web impressions. Comparing the 8 highest-share pages
// (mean 36.2%) against the 8 lowest (4.5%), exactly one attribute separated them:
//
//     quick_answer OPENS with a verdict    5/8   vs   0/8
//     title is a question                  6/8   vs   3/8
//     contains a cost figure               0.0   vs   1.9
//     quick_answer length                  425   vs   415
//     bullet lists                         9.3   vs   9.3
//     h2 count                             7.1   vs   7.4
//
// Length, structure, tables, lists and headings do not discriminate at all. But 5/8 against 0/8
// across 30 pages is suggestive, not established, and the obvious confound is that verdict-opening
// pages might simply answer more answerable questions. Hence a test rather than a rewrite.
//
// -----------------------------------------------------------------------------------------------
// DESIGN.
//
// THREE pages change, chosen for the highest web impressions in the set so a share change is
// readable, and because a verdict can open each one TRUTHFULLY -- which is the constraint that
// picked them, not the other way round. Two have literal yes/no titles; the third asks "Is It
// Dangerous?" in its own title and never answers it in the TL;DR.
//
// CONTROL IS THE REST OF THE SITE, not a hand-picked trio. Every page's baseline share is recorded
// below, so the next export is a difference-in-differences: if AI share rises everywhere, the test
// shows nothing; if it rises on these three against a flat site, that is signal. Picking three
// arbitrary controls would have thrown away the other 27 pages of information.
//
// WHAT IS HELD CONSTANT. Only the opening of quick_answer moves. No title, no meta, no body, no
// FAQ, no schema, no internal link. Each rewrite carries the same facts in the same order after the
// first clause -- the assertions below check that the substantive terms survive, so a rewrite
// cannot quietly become a different claim and take credit for the result.
//
// KNOWN LIMITS, stated so the readout is not over-read:
//   - n=3. This can suggest, it cannot establish.
//   - quick_answer is also the meta-ish block a human sees, so a change could move WEB impressions
//     too. Measuring SHARE (AI/web) partly controls for that; it does not fully.
//   - The export is manual, so the next reading arrives when someone exports it, not on a schedule.
import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withDb } from '../src/server/db.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APPLY = process.env.APPLY === 'true';
const CAPTURE = path.join(ROOT, 'data', 'keywords', '2026-09-17-gsc-ai-features.json');
const MANIFEST = path.join(ROOT, 'data', 'ai-verdict-test.json');

const VERDICT = /^(no|yes|generally|usually|often|in most|not |it can|probably|rarely|sometimes|only)\b/i;
const NAMED_CARRIER = /\b(State Farm|Allstate|Geico|Progressive|Farmers|USAA|Liberty Mutual|Nationwide|Travelers|Citizens Property|American Family|Erie Insurance)\b/;

interface T { slug: string; why: string; next: string; keep: string[] }

const TREATMENT: T[] = [
  {
    slug: 'va-loan-require-termite-inspection',
    // Title is "Does a VA Loan Require a Termite Inspection?" and the TL;DR never says yes or no --
    // it opens by restating the condition. Highest web volume in the set at 448, lowest AI share at
    // 2.9%, so it has the most room to move in either direction.
    why: 'yes/no title, answer buried behind the condition',
    next:
      'Only in designated zones. A VA loan requires a termite inspection where the property sits in an area the Department of Veterans Affairs designates as moderate to very high risk for wood-destroying insect activity. In those zones a clear pest inspection report must reach the lender before the mortgage can close; outside them it is not required.',
    keep: ['Department of Veterans Affairs', 'wood-destroying', 'clear pest inspection report', 'close'],
  },
  {
    slug: 'homeowners-insurance-cover-failed-sump-pump',
    // Title is "Does Homeowners Insurance Cover a Failed Sump Pump?" and the TL;DR opens with the
    // mechanism. "Generally no" is what the existing sentence already says, moved to the front.
    why: 'yes/no title, verdict is present but arrives third',
    next:
      'Generally no. Standard homeowners policies typically exclude damage from sump pump failure or water backing up through drains, treating them as maintenance issues or as flood-related damage. A separate "water backup and sump overflow" endorsement is usually what covers it, and that endorsement is distinct from flood insurance.',
    keep: ['sump pump failure', 'backing up through drains', 'water backup and sump overflow', 'flood insurance'],
  },
  {
    slug: 'reverse-polarity-mean-electrical-inspection',
    // The title asks "Is It Dangerous?" outright and the TL;DR answers it only by implication, in
    // its final clause. Leading with the answer to the question the page's own title asks.
    why: 'title asks "Is It Dangerous?"; TL;DR answers only by implication at the end',
    next:
      'Yes, it is a shock hazard. Reverse polarity means the hot and neutral wires at a standard outlet are reversed at the terminal connections. Plugged-in devices still receive power, but internal components stay energised even when the device is switched off, which is what creates the risk to anyone using them.',
    keep: ['hot and neutral', 'reversed', 'terminal connections', 'energised'],
  },
];

async function main() {
  if (!fs.existsSync(CAPTURE)) throw new Error(`ABORT: ${path.basename(CAPTURE)} not found -- run import-ai-features.ts first`);
  const cap = JSON.parse(fs.readFileSync(CAPTURE, 'utf8'));

  let rows: any[] | null = null;
  for (let a = 1; a <= 4 && !rows; a++) {
    try {
      rows = (await withDb((sql) => sql`
        SELECT slug, title, quick_answer FROM articles WHERE status='published'`)) as unknown as any[];
    } catch (e) {
      console.error(`  neon attempt ${a}: ${(e as Error).message.slice(0, 70)}`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  if (!rows) throw new Error('ABORT: database unreachable after 4 attempts');

  // Baseline for EVERY page, not just the three. This is the control.
  const aiByUrl = new Map<string, number>(cap.pages.map((p: any) => [p.url, p.ai]));
  const baseline = rows.map((r) => {
    const url = `https://www.beforeregret.com/guides/${r.slug}/`;
    return {
      slug: r.slug,
      ai: aiByUrl.get(url) ?? 0,
      qa_opens_with_verdict: VERDICT.test(String(r.quick_answer ?? '').trim()),
      arm: TREATMENT.some((t) => t.slug === r.slug) ? 'treatment' : 'control',
    };
  });

  const staged: Array<{ slug: string; before: string; after: string }> = [];
  for (const t of TREATMENT) {
    const cur = rows.find((r) => r.slug === t.slug);
    if (!cur) throw new Error(`ABORT: ${t.slug} is not published`);
    const before = String(cur.quick_answer ?? '');
    if (VERDICT.test(before.trim())) throw new Error(`ABORT: ${t.slug} already opens with a verdict -- nothing to test`);
    if (!VERDICT.test(t.next.trim())) throw new Error(`ABORT: ${t.slug} replacement does not open with a verdict`);
    if (t.next.length < 120 || t.next.length > 450) throw new Error(`ABORT: ${t.slug} new quick_answer ${t.next.length} chars, budget 120-450`);
    if (NAMED_CARRIER.test(t.next)) throw new Error(`ABORT: ${t.slug} names a carrier`);
    // The rewrite must carry the same claim, not a new one.
    for (const k of t.keep) {
      if (!t.next.includes(k)) throw new Error(`ABORT: ${t.slug} rewrite dropped "${k}" -- that is a different claim, not a reordering`);
    }
    staged.push({ slug: t.slug, before, after: t.next });
    console.log(`\n  ${t.slug}`);
    console.log(`    why   ${t.why}`);
    console.log(`    ${before.length} -> ${t.next.length} chars`);
    console.log(`    was   "${before.slice(0, 72)}..."`);
    console.log(`    now   "${t.next.slice(0, 72)}..."`);
  }

  const treatAi = baseline.filter((b) => b.arm === 'treatment').reduce((s, b) => s + b.ai, 0);
  const ctrlAi = baseline.filter((b) => b.arm === 'control').reduce((s, b) => s + b.ai, 0);
  console.log(`\n  BASELINE (window ${cap.start_date} .. ${cap.end_date})`);
  console.log(`    treatment: ${staged.length} pages, ${treatAi} AI-feature impressions`);
  console.log(`    control  : ${baseline.length - staged.length} pages, ${ctrlAi} AI-feature impressions`);
  console.log(`    control pages already opening with a verdict: ${baseline.filter((b) => b.arm === 'control' && b.qa_opens_with_verdict).length}`);

  if (!APPLY) { console.log('\n  DRY RUN -- nothing written.\n'); return; }

  for (const s of staged) {
    await withDb((sql) => sql`UPDATE articles SET quick_answer = ${s.after}, updated_at = now() WHERE slug = ${s.slug}`);
    console.log(`  wrote ${s.slug}`);
  }
  fs.writeFileSync(MANIFEST, `${JSON.stringify({
    hypothesis: 'A quick_answer opening with a verdict raises the page\'s share of Generative AI Feature impressions.',
    started: new Date().toISOString().slice(0, 10),
    baseline_capture: path.basename(CAPTURE),
    baseline_window: `${cap.start_date}..${cap.end_date}`,
    readout: 'Export Generative AI Features again after >=28 days, run import-ai-features.ts, then compare each page\'s ai/web share against the baseline below. Treatment moving while control stays flat is the only result that means anything.',
    limits: ['n=3', 'quick_answer also faces human readers, so web impressions may move too', 'export is manual, so timing is not controlled'],
    treatment: staged.map((s) => ({ slug: s.slug, before: s.before, after: s.after })),
    baseline,
  }, null, 2)}\n`);
  console.log(`\n  wrote data/ai-verdict-test.json -- baseline for all ${baseline.length} pages\n`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
