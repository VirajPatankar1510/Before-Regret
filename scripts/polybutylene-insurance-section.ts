// Adds an insurance section to the polybutylene guide and links it from the insurance cluster.
//
//   npx tsx scripts/polybutylene-insurance-section.ts            # dry run
//   APPLY=true npx tsx scripts/polybutylene-insurance-section.ts
//
// -------------------------------------------------------------------------------------------
// WHY THIS PAGE, AND WHY IT IS AN EDIT RATHER THAN A NEW GUIDE.
//
// Polybutylene was dismissed from a content shortlist on the strength of 7 Google impressions.
// That was the wrong instrument. On Bing the topic draws 49 impressions and 6 clicks -- a 12.2%
// CTR against 0.77% site-wide on Google -- which makes it the best-converting subject on the site.
// Scoring a page on Search Console alone is the specific error that reading produced.
//
// Bing's queries split into three intents:
//
//   identification (~15 impr)   "polybutylene pipe", "what is polybutylene piping", "how to tell
//                               if you have polybutylene pipes"  -- SERVED, and taking the clicks
//   insurance      (4 queries)  "polybutylene why doesnt insurance like it", "polybutylene
//                               plumbing and home insurance", "if the main water line is
//                               polybutylene is there insurance for that", and one naming a
//                               Florida carrier and a DP-1 form  -- NOT SERVED, 0 clicks
//   negotiation    (~2 impr)    "polybutylene pipes negotiation tips"  -- partly served
//
// The article covers insurance in one bullet inside "Professional Evaluation: Steps Before
// Closing". A bullet is not a section, and nothing in the title, meta or headings signals that the
// page answers an insurance question, so the insurance queries see a result about identification.
//
// AN EDIT, NOT A NEW PAGE. A dedicated "can you insure a house with polybutylene" guide would
// match those queries more precisely, and on a mature domain that is what this would be. It is the
// wrong move here: the domain is a month old with zero backlinks, 56 guides already compete for a
// rationed crawl budget, and the insurance intent is currently four impressions a month. A new URL
// would start from nothing. This page already ranks and already converts, so the traffic is better
// spent deepening it. If insurance-intent impressions grow, splitting it out is the later move.
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';
const SLUG = 'spot-polybutylene-pipes-before-buying-house';

// Insert before this heading, so the insurance question is answered before the closing call to
// action rather than after it.
const ANCHOR = '## Immediate Action Step for Home Buyers';

const SECTION = `## Polybutylene and Home Insurance: Why Carriers Decline

Polybutylene belongs to a small group of defects that can stop a policy outright rather than merely raise its price. For a buyer, that makes it a financing problem as well as a plumbing one: no binder means no mortgage, and the discovery usually happens late.

The discovery route is almost always the 4-Point inspection, which covers roof, plumbing, HVAC and electrical, and which carriers in constrained markets require on older homes. The timing is not a coincidence. Polybutylene was installed from the late 1970s through the mid-1990s, so every house that still has it is now old enough to trigger that inspection requirement automatically.

Carriers respond in one of three ways. Some decline new business outright. Some non-renew an existing policy once the piping is documented, unless the owner can show proof of replacement. Others will write the risk but attach conditions, typically a water damage exclusion for pipe rupture or a substantially higher deductible.

The published rules are stricter than most buyers expect. Citizens Property Insurance Corporation, Florida's insurer of last resort, states that dwellings 20 years old or newer with polybutylene piping may be eligible for coverage if there are no signs of leaks, unrepaired water damage, disrepair or hazards. Read alongside the installation dates, that window has effectively closed for original polybutylene: a house plumbed at the very end of the material's run is now past 30. The rule is one carrier's, in one state, and other markets are written differently — but it shows the shape underwriters use, which is age plus condition rather than condition alone.

Two practical consequences follow.

Settle the insurance question before your contingency expires, not after. Take the plumber's findings to an independent agent who represents several carriers and ask for a real quote on the address. An agent can tell you within a day whether the property is writable at all, which is information worth more than any estimate of what a repipe might cost.

A partial repipe may not satisfy an underwriter. This is where the [stub-out problem](#the-stub-out-trap-why-visual-inspections-can-deceive) becomes an insurance problem: carriers asking for proof of replacement generally mean the whole supply system, not the visible sections. Documentation of a full repipe by a licensed contractor, with the permit closed where the jurisdiction required one, is what restores insurability. A seller's assurance that the pipes "were replaced" is not.`;

const NEW_META =
  'How to identify polybutylene pipes by color, markings, and location, and why home insurance carriers decline or non-renew houses that still have them.';

// One inbound link, from the guide whose prose already names plumbing as one of the four points.
const INBOUND = {
  slug: 'get-home-insurance-fuse-box',
  find:
    'If you are buying an older home, your insurance company will likely require a 4-Point inspection covering the roof, plumbing, HVAC, and electrical system.',
  add:
    ' The plumbing leg of that report is where [polybutylene supply lines](/guides/spot-polybutylene-pipes-before-buying-house/) surface, and they can block a policy as decisively as the panel can.',
};

async function main() {
  const rows = (await withDb((sql) => sql`
    SELECT slug, title, meta_description, body_markdown FROM articles WHERE status = 'published'
  `)) as unknown as Array<any>;
  const live = new Set(rows.map((r) => r.slug));
  const byslug = new Map(rows.map((r) => [r.slug, r]));

  const row = byslug.get(SLUG);
  if (!row) throw new Error(`ABORT: ${SLUG} is not published`);

  // ---- the article edit -----------------------------------------------------------------------
  const n = row.body_markdown.split(ANCHOR).length - 1;
  if (n !== 1) throw new Error(`ABORT: anchor heading matched ${n} times, expected 1`);
  if (/## Polybutylene and Home Insurance/.test(row.body_markdown)) throw new Error('ABORT: section already present');
  const body = row.body_markdown.replace(ANCHOR, `${SECTION}\n\n${ANCHOR}`);

  // The in-page anchor must correspond to a heading that actually exists, or the link is dead.
  const target = 'The "Stub-Out" Trap: Why Visual Inspections Can Deceive';
  if (!body.includes(`## ${target}`)) throw new Error(`ABORT: no heading "${target}" for the in-page anchor`);

  // Claims in the new section that must be traceable, mirroring the checks used on the aerial guide.
  for (const q of ['4-Point inspection', 'Citizens Property Insurance Corporation', '20 years old or newer', 'independent agent']) {
    if (!SECTION.includes(q)) throw new Error(`ABORT: sourced claim missing: "${q}"`);
  }
  // Things this section must not assert. A repipe price range circulates widely on contractor blogs
  // and is not something we have a defensible source for, so no number is quoted.
  for (const q of ['$4,000', '$10,000', 'all carriers', 'every carrier', 'guaranteed']) {
    if (SECTION.includes(q)) throw new Error(`ABORT: unsupported claim present: "${q}"`);
  }

  if (NEW_META.length > 155) throw new Error(`ABORT: meta ${NEW_META.length} chars, over 155`);
  if (NEW_META.length < 70) throw new Error(`ABORT: meta only ${NEW_META.length} chars`);

  // ---- the inbound edit -----------------------------------------------------------------------
  const host = byslug.get(INBOUND.slug);
  if (!host) throw new Error(`ABORT: host ${INBOUND.slug} is not published`);
  const hn = host.body_markdown.split(INBOUND.find).length - 1;
  if (hn !== 1) throw new Error(`ABORT: host anchor matched ${hn} times, expected 1`);
  if (host.body_markdown.includes(`/guides/${SLUG}/`)) throw new Error(`ABORT: ${INBOUND.slug} already links to ${SLUG}`);
  const hostBody = host.body_markdown.replace(INBOUND.find, INBOUND.find + INBOUND.add);

  // ---- link integrity -------------------------------------------------------------------------
  let bad = 0;
  for (const [slug, text] of [[SLUG, body], [INBOUND.slug, hostBody]] as Array<[string, string]>) {
    for (const m of text.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/?\)/g))
      if (!live.has(m[1])) { console.log(`  DEAD GUIDE LINK: ${slug} -> ${m[1]}`); bad++; }
    for (const re of [/\*\*\[[^\]]*\]\([^)]*\)\*\*/g, /\[\*\*[^\]]*\*\*\]\([^)]*\)/g])
      for (const m of text.matchAll(re)) { console.log(`  NESTED LINK: ${slug} -> ${m[0]}`); bad++; }
  }
  if (bad) throw new Error(`ABORT: ${bad} defect(s)`);

  console.log(`\n  ${SLUG}`);
  console.log(`    title unchanged (${row.title.length}): ${row.title}`);
  console.log(`      Bing converts on this title at 12.2%. Nothing about it is the problem.`);
  console.log(`    meta  ${row.meta_description.length} -> ${NEW_META.length}`);
  console.log(`      -  ${row.meta_description}`);
  console.log(`      +  ${NEW_META}`);
  console.log(`    body  ${row.body_markdown.length} -> ${body.length} chars`);
  console.log(`    H2s   ${(row.body_markdown.match(/^## /gm) || []).length} -> ${(body.match(/^## /gm) || []).length}`);
  console.log(`\n  ${INBOUND.slug}  ${host.body_markdown.length} -> ${hostBody.length} chars (inbound link added)`);

  if (!APPLY) { console.log('\n  DRY RUN -- nothing written.'); return; }

  await withDb((sql) => sql`UPDATE articles SET body_markdown = ${body}, meta_description = ${NEW_META},
    updated_at = now() WHERE slug = ${SLUG}`);
  console.log(`  wrote ${SLUG}`);
  await withDb((sql) => sql`UPDATE articles SET body_markdown = ${hostBody}, updated_at = now()
    WHERE slug = ${INBOUND.slug}`);
  console.log(`  wrote ${INBOUND.slug}`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
