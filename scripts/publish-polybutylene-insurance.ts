// Publish the polybutylene + home insurance guide.
//
//   npx tsx scripts/publish-polybutylene-insurance.ts            # dry run
//   APPLY=true npx tsx scripts/publish-polybutylene-insurance.ts
//
// -----------------------------------------------------------------------------------------------
// WHY THIS GUIDE, from measurement rather than a hunch.
//
// Three insurance-intent polybutylene queries sit in the Bing capture, all ranking position 2-3
// with no page dedicated to the subject: "polybutylene plumbing and home insurance", "polybutylene
// why doesnt insurance like it", "if the main water line is polybutylene is there insurance for
// that". Bing disclosed 100% of its clicks where Google's query dimension disclosed 4%, which is
// why this intent is invisible in Search Console.
//
// DataForSEO sized the head term at 8,100/mo for "polybutylene pipe" and returned NOT ONE insurance
// query. Neither source alone would have found this topic: one has the volume, the other has the
// intent.
//
// The library has one polybutylene page and it covers identification. This covers the decision that
// follows it, which is the one with money attached.
//
// THE CARRIER RULE IS THE WHOLE DESIGN CONSTRAINT. Every query names or implies a specific insurer,
// and we hold no carrier underwriting data -- those guidelines are largely non-public, vary by state
// and year, and change without notice. So this page never says what any named company will do. It
// explains the defect, what underwriting generally weighs, what remediation costs, and how to get a
// written answer from the reader's own carrier before their option period closes.
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';
import { PRIORITY_RULES } from '../src/engine/inspectionPriorities.js';
import { validateBrief, type ArticleBrief } from '../src/seo/articleBrief.js';

const APPLY = process.env.APPLY === 'true';

const BRIEF: ArticleBrief = {
  slug: 'polybutylene-pipes-home-insurance',
  targetQuery: 'polybutylene plumbing and home insurance',
  capture: '2026-09-11-bing-queries',
  intent: 'transactional',
  who: 'a buyer under contract whose inspection just found polybutylene supply lines, now being told by an agent or lender that insurance may be a problem',
  want: 'to know whether they can actually get a policy bound before closing, and what it costs to make the house insurable',
  achieve: 'close on time — either by getting cover bound as-is, or by pricing a repipe and negotiating it into the deal',
  titlePromise: 'whether the house can be insured, and what a repipe costs',
};

// Cost comes from the engine at run time. A figure retyped here drifts from the report the same
// engine generates for the same house.
const rule = (PRIORITY_RULES as any[]).find((r) => r.id === 'polybutylene_supply');
if (!rule) throw new Error('ABORT: engine rule "polybutylene_supply" no longer exists');
const REPAIR = (String(rule.typicalRepairCost).match(/\$[\d,]+\s*[–-]\s*\$?[\d,]+\+?/) ?? [])[0];
if (!REPAIR) throw new Error(`ABORT: no cost range in engine rule: "${rule.typicalRepairCost}"`);
const ERA = `${rule.minYear}–${rule.maxYear}`;

const TITLE = 'Can You Insure a House With Polybutylene Pipes? Repipe Cost';
const META =
  'Polybutylene supply lines make a policy harder to bind. What underwriters weigh, what a repipe costs, and how to get a written answer before closing.';

const QUICK_ANSWER =
  `Usually yes, but not always, and rarely without conditions. Many carriers decline or surcharge homes that still have polybutylene supply piping, and the ones that write it often want a repipe scheduled. A whole-home repipe runs ${REPAIR}. Get a written yes from an agent before your option period ends — an inspection report is not a binder.`;

const BODY = `Polybutylene supply piping was installed in US homes from roughly ${ERA}. If your inspector found it, the plumbing question is usually settled — the harder question is whether anyone will insure the house, and a mortgage will not fund without a bound policy.

This page is about that second question: what underwriters weigh, what it costs to fix, and how to get a real answer before your contingency period closes.

## Why insurers treat polybutylene differently from old pipe generally

Galvanized steel corrodes slowly and tells you it is failing — pressure drops, water discolors. Polybutylene does not behave that way, and that is the underwriting problem.

The material was covered by **ASTM D3309**, the specification for polybutylene hot- and cold-water distribution systems. That standard was **withdrawn in 2010**, and the reasons are the same ones that show up in a claims file. Failures were attributed largely to the polyacetal fittings used in those systems, and to the tubing's resistance to hot chlorinated water and to slow crack growth. The resin's main North American supplier stopped producing pipe-grade material in the late 1990s.

The practical consequence for a policy is that failures tend to be sudden and interior. A fitting lets go inside a wall or above a ceiling, and the loss is water damage to finishes rather than a plumbing repair. That is a claim shape carriers price carefully.

## What this actually costs

| | |
|---|---|
| Confirming the material | Usually included in a general inspection |
| Whole-home repipe | **${REPAIR}** |

The repipe figure is the one that matters in a negotiation, because it is the number that converts an uninsurable house into an insurable one. It varies with the number of bathrooms, whether the runs are accessible through a crawlspace or an attic, and how much drywall has to come out and go back.

Ask for the quote to separate the plumbing from the drywall repair and paint. Those are often different trades, and a seller crediting "the repipe" may be crediting only the first half.

## What underwriting generally weighs

No two carriers treat this identically, and nothing here predicts what any particular company will do. What tends to come up:

- **Whether any polybutylene remains.** A partial repipe that left the underground service line or a section behind finished walls is frequently treated as an untreated risk.
- **Documentation.** A plumber's invoice naming the material installed, with the date, is worth more than a homeowner's description of the work.
- **Prior claims on the property.** A previous water loss on the same system changes the file. Pull the [CLUE report](/guides/get-clue-report-before-buying-house/) before you commit.
- **The fittings, not just the pipe.** Some systems used copper crimp fittings with PB tubing; others used the polyacetal fittings implicated in most of the failures. An inspector who can tell you which is in the house gives your agent something specific to quote against.

## Do this before your option period ends

The mistake worth avoiding is treating an inspection finding as a plumbing item and discovering the insurance problem a week before closing.

1. **Get the material confirmed in writing.** Polybutylene is usually gray, sometimes blue or black, and flexible rather than rigid. It is easiest to see at the water heater and the main shutoff. If you are not certain what you are looking at, the [identification guide](/guides/spot-polybutylene-pipes-before-buying-house/) covers the markings.
2. **Call your own agent with the address, not a hypothetical.** Underwriting answers are property-specific. "Would you write a house with polybutylene" gets a different answer from a quote on a real address with a real inspection report attached.
3. **Ask for a written quote or a declination, not a verbal read.** An agent saying it should be fine is not a binder, and it is not something you can take to a lender.
4. **If the answer is conditional, get the condition in writing too.** Cover contingent on a repipe within a set period is common; you need to know the period and what happens if the work slips.
5. **Price the repipe before you negotiate.** A seller credit argued from a real quote lands differently from one argued from a range on a website.

## If you are declined

A declination is not the end of the transaction, and it is worth knowing the order of options before you are under time pressure.

- **Another carrier.** Appetite for this varies more than buyers expect. An independent agent who can approach several markets is more useful here than a captive one.
- **A repipe before closing, funded from escrow.** Where the seller agrees, this converts the problem into a scheduling question rather than a coverage one.
- **Your state's FAIR plan.** Most states operate one as an insurer of last resort for properties that cannot get standard cover. Terms are usually narrower and cost more, and it is a fallback rather than a plan.
- **Surplus lines.** Non-admitted carriers write risks the standard market declines. They are legitimate, and they are not backed by state guaranty funds in the way admitted carriers are.

If you reach the point of comparing a repipe against years of surcharged premium, the repipe usually wins on a house you intend to keep — but that is a calculation with your numbers in it, not a rule.

## What to ask, in the words that get an answer

- "Can you bind a policy on this address with polybutylene supply lines present, yes or no?"
- "If yes, is there a surcharge, an exclusion, or a repipe condition — and can I have that in writing?"
- "If the seller repipes before closing, what documentation do you need to remove the condition?"
- "Does your quote exclude water damage originating from the supply lines?"

That last one is the question buyers most often skip. A policy that is bound but excludes the specific failure mode you are worried about is not the protection you think you bought.

## The honest summary

Polybutylene does not make a house unsellable and it does not automatically make it uninsurable. It makes insurance a step you have to complete early rather than assume, and it puts a ${REPAIR} number on the table that belongs in your negotiation rather than in your first year of ownership.

Get the written answer before your option period closes. Everything else is easier from there.`;

async function main() {
  validateBrief(BRIEF);

  if (TITLE.length > 60) throw new Error(`ABORT: title ${TITLE.length} chars, over 60`);
  if (META.length > 155 || META.length < 70) throw new Error(`ABORT: meta ${META.length} chars`);
  if (QUICK_ANSWER.length < 120 || QUICK_ANSWER.length > 450) {
    throw new Error(`ABORT: quick_answer ${QUICK_ANSWER.length} chars, must be 120-450`);
  }

  // The `requires` gate: metadata may only promise what the body delivers.
  const hay = BODY.toLowerCase();
  for (const need of ['repipe', 'astm d3309', 'fair plan', 'surplus lines', 'in writing']) {
    if (!hay.includes(need)) throw new Error(`ABORT: metadata relies on "${need}", body lacks it`);
  }
  if (!BODY.includes(REPAIR)) throw new Error('ABORT: engine cost figure absent from body');

  let rows: any[] | null = null;
  for (let a = 1; a <= 4 && !rows; a++) {
    try {
      rows = (await withDb((sql) => sql`SELECT slug FROM articles WHERE status = 'published'`)) as any[];
    } catch { await new Promise((r) => setTimeout(r, 3000)); }
  }
  if (!rows) throw new Error('ABORT: database unreachable');
  const live = new Set(rows.map((r) => r.slug));
  if (live.has(BRIEF.slug)) throw new Error(`ABORT: ${BRIEF.slug} already published`);

  // Dead-link and nested-bold-link checks, same as every other publishing script here.
  for (const m of BODY.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/?\)/g)) {
    if (!live.has(m[1])) throw new Error(`ABORT: dead guide link -> ${m[1]}`);
  }
  for (const re of [/\*\*\[[^\]]*\]\([^)]*\)\*\*/g, /\[\*\*[^\]]*\*\*\]\([^)]*\)/g]) {
    if (re.test(BODY)) throw new Error('ABORT: bold-wrapped link');
  }

  console.log(`\n  ${BRIEF.slug}`);
  console.log(`    title  ${TITLE.length}/60   ${TITLE}`);
  console.log(`    meta   ${META.length}/155`);
  console.log(`    tldr   ${QUICK_ANSWER.length}/450`);
  console.log(`    body   ${BODY.length} chars`);
  console.log(`    cost   ${REPAIR}  (read from engine rule polybutylene_supply)`);
  console.log(`    cites  ASTM D3309, withdrawn 2010`);
  console.log(`    links  ${[...BODY.matchAll(/\]\(\/guides\/([a-z0-9-]+)\//g)].map((m) => m[1]).join(', ')}`);
  console.log(`\n  ok  brief valid, budgets met, every link resolves\n`);

  if (!APPLY) { console.log('  DRY RUN -- nothing written.\n'); return; }
  await withDb((sql) => sql`
    INSERT INTO articles (slug, title, meta_description, quick_answer, body_markdown, status, article_type, created_at, updated_at)
    VALUES (${BRIEF.slug}, ${TITLE}, ${META}, ${QUICK_ANSWER}, ${BODY}, 'published', 'guide', now(), now())`);
  console.log(`  published ${BRIEF.slug}\n`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
