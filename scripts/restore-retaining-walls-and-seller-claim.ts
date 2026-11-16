// Restores two guides cut in the 2026-09-02 prune, corrected against primary sources first.
//
//   npx tsx --import ./scripts/lib/neon-curl.ts scripts/restore-retaining-walls-and-seller-claim.ts            # dry run
//   APPLY=true npx tsx --import ./scripts/lib/neon-curl.ts scripts/restore-retaining-walls-and-seller-claim.ts
//
// WHY THESE TWO (owner, 2026-11-16: "do a check again and then restore ... if you think it's the right thing").
// Both still draw Google impressions eleven weeks after answering 410, at an average position near 6
// (Search Console, last 28 days to 2026-11-16):
//   home-inspection-cover-retaining-walls                   39 impressions, 1 click, position 5.8
//   happens-if-seller-didn-t-disclose-past-insurance-claim  55 impressions, 2 clicks, position 6.1
// No live guide answers either question (the C.L.U.E. guide #13 is the before-you-buy side of the second).
//
// WHY NOT AS THEY WERE. Both were written by the August generation pipeline, and the check found:
//   - retaining walls: the ASHI paraphrase ("walls that support the home, driveways, or primary
//     walkways") is not in the standard; an unsourced "tens of thousands of dollars"; and "most
//     municipalities require a permit over four feet" with no survey behind it.
//   - seller claim: claims #13's rewrite already cut (a buyer's agent pulling loss history, inquiries
//     logged as zero-dollar claims), an unsourced "five to seven years" disclosure rule, carrier
//     behaviour stated as fact (denials, non-renewals, exclusions), and a "pocket the insurance money"
//     line the content standard forbids.
// Every fact on the corrected pages is in data/fact-ledgers/<slug>.json, quoted at its source.
//
// INBOUND LINKS ARE NOT ADDED HERE. Adding a link to a live, ranking guide needs the owner's OK
// (feedback_dont_touch_ranking_pages). Candidates are printed by suggest-inbound-links.ts after the
// restore. Outbound links on the restored pages point only at live guides.
//
// FAQs are reset to '[]' (the old faq_json repeated the cut claims) and rewritten afterwards with the
// article-faqs skill, grounded in the new bodies.
//
// READ ON 2026-12-21 (5 weeks): still shown, and position held or improved. Stop condition: neither
// shown in Google by then -> return both to 'removed' (410) and drop the restore from memory.
import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { REMOVED_GUIDE_SLUGS } from '../src/data/prunedGuides.js';
import { assertHumanDraft } from '../src/seo/effortBrief.js';

const APPLY = process.env.APPLY === 'true';
const PRUNED_FILE = path.join(process.cwd(), 'src', 'data', 'prunedGuides.ts');

interface Restore {
  id: number;
  slug: string;
  title: string; // unchanged: the title Google still shows
  meta: string;
  quickAnswer: string;
  sources: string[];
  body: string;
  /** Specifics the meta and quick answer promise; each must be in the body. */
  requires: string[];
}

const RETAINING: Restore = {
  id: 195,
  slug: 'home-inspection-cover-retaining-walls',
  title: 'Does a Home Inspection Cover Retaining Walls?',
  meta: 'Only walls likely to affect the house. What the ASHI standard leaves out, when the building code wants an engineer, and what to check before closing.',
  quickAnswer:
    "Only partly. Under ASHI's Standard of Practice, a home inspector inspects retaining walls that are likely to adversely affect the building, and isn't required to inspect boundary walls, soil conditions or earth stabilization. Even for a wall they do look at, the inspector isn't required to judge its strength or whether it will fail. For a tall, leaning or load-bearing wall, that answer comes from a structural engineer.",
  sources: ['ASHI', 'ICC', 'USGS'],
  requires: ['4.2', 'R404.4', 'structural engineer', 'boundary walls'],
  body: `Inspection reports often give a retaining wall a single line, sometimes with a disclaimer beside it, and that line is easy to read as "checked." What the inspector was asked to do is narrower than that, and the gap matters most for the walls that would cost the most to fix: tall ones, ones on a slope, and ones holding up a driveway.

## What the inspection standard covers

Home inspectors work to a written standard of practice, either their state's or a professional association's. The American Society of Home Inspectors' [Standard of Practice](https://www.homeinspector.org/resources/standard-of-practice/) (effective March 1, 2014) is a common baseline, and on retaining walls it is specific.

Section 4.1 says the inspector shall inspect "vegetation, grading, surface drainage, and retaining walls that are likely to adversely affect the building." Section 4.2 then lists what the inspector is not required to inspect, including:

- "fences, boundary walls, and similar structures"
- "geological and soil conditions"
- "erosion control and earth stabilization measures"

The general exclusions in section 13.2 add that the inspector isn't required to determine "the strength, adequacy, effectiveness, and efficiency of systems and components," or "future conditions including but not limited to failure."

Put together: a wall that could send water or soil toward the house is in scope, so the inspector should look at it and report what they see. A terraced garden wall at the back of the lot, or a wall along the property line, may not be looked at at all. And for any wall, the report can tell you it is leaning or cracked, but it isn't a verdict on whether the wall will hold.

The standard itself says it doesn't stop inspectors from meeting their state's licensing rules, and many states set their own. Ask your inspector which standard their report follows, and read the exclusions page before you rely on it.

## Why a walk-around can't clear a wall

What keeps a retaining wall standing is mostly out of sight. Wet soil pushes harder than dry soil, and water trapped behind a wall adds pressure of its own, so a well-built wall depends on parts you can't see:

- **Gravel backfill** behind the wall, so water drains down instead of building up against it.
- **Filter fabric**, so fine soil doesn't clog that gravel over time.
- **Weep holes or a perforated drain pipe** at the base, to carry the water away.
- **Geogrid or tiebacks** on taller walls, reaching back into the soil to hold the wall in place.

A visual inspection can't confirm any of these were installed. It can only catch the symptoms of a wall that is already struggling.

## Signs of trouble you can see on a showing

You don't need an inspector to notice these, and they're worth photographing so you can show them to one:

- **Leaning or tilting.** The top has moved out further than the base. The wall may be rotating on a footing that's too shallow, or it may lack the weight or reinforcement to resist the soil behind it.
- **Bowing or bulging** in the middle, common in timber walls as the wood softens, and in block walls where water has no way out.
- **Horizontal cracks** in poured concrete, or **gaps opening between blocks** in a modular wall. In a block wall, shifting units can mean the reinforcement behind it is failing or was never installed.
- **Heavy white staining** (efflorescence) with wet soil at the base. A little is common; a lot, with standing water, points to drainage that isn't working.

## Timber, poured concrete and block walls

- **Timber and railroad ties** are cheap to build and usually the first to go. Even pressure-treated wood eventually rots in constant contact with wet soil, and these walls rarely have much drainage behind them.
- **Poured concrete** is strong but rigid. If the ground moves, it tends to crack rather than flex, and a cracked, leaning concrete wall often has to be rebuilt rather than patched.
- **Segmental block walls** (dry-stacked interlocking units) tolerate a little movement, but they depend entirely on the base, the backfill and the reinforcement behind them.

## When the building code wants an engineer

The International Residential Code (IRC), the model code many US cities and counties adopt for houses, draws two lines in its 2021 edition.

IRC R105.2 exempts from a permit "retaining walls that are not over 4 feet (1219 mm) in height measured from the bottom of the footing to the top of the wall, unless supporting a surcharge." Two details in that sentence trip people up. The height is measured from the bottom of the footing, so a wall that shows less than 4 feet above ground can still be over the line. And a surcharge is extra load on the retained soil, like a driveway or more slope above the wall, which takes away the exemption at any height.

IRC R404.4 says walls that retain more than 48 inches of unbalanced fill without support at the top, or walls over 24 inches that "resist lateral loads in addition to soil," "shall be designed in accordance with accepted engineering practice to ensure stability against overturning, sliding, excessive foundation pressure and water uplift."

Your city or county adopts the code with its own amendments, so the local building department has the final word on the numbers. But under the model code, a wall over those lines, or one holding up a driveway, should have had a permit and an engineered design. If the [permit history for the address](/guides/look-up-building-permits-by-address/) shows nothing for it, nobody may ever have checked that design.

## Sloped lots

On a steep lot, a failing wall can be a sign of a slope problem rather than just a wall problem. The U.S. Geological Survey's Landslide Hazards Program publishes a [U.S. Landslide Inventory and Susceptibility Map](https://www.usgs.gov/programs/landslide-hazards/maps) showing recorded landslides and how susceptible an area is. It's a regional picture, not a verdict on one lot, but it tells you whether to bring in a geotechnical engineer.

## Who owns a wall on the property line

Boundary walls are left out of the ASHI standard, and they're also where disputes start, because it isn't always obvious who has to repair one. Depending on where you live, that can turn on which lot the wall stands on, which lot it holds up, or what a recorded agreement says. Don't assume a wall is yours because it faces your yard, or the neighbor's because it doesn't. A boundary survey by a licensed land surveyor shows where the wall sits relative to the line, and a real estate attorney can tell you what that means for repairs in your state.

## What to do before your inspection contingency ends

1. **Read the report's exclusions.** Look for wording like "retaining walls not inspected," "site walls excluded," or a note that soil or drainage conditions weren't evaluated. If the wall that worries you is outside the inspection, treat it as unchecked.
2. **Check the permit record.** For a tall wall, or one beside the driveway or the house, see whether a permit and plans were filed.
3. **Bring in a structural engineer** for any wall that is tall, holds up a driveway, or shows leaning, bowing or cracking. Unlike an inspector, an engineer can assess whether the wall is adequate and what a fix would involve. Our guide to [when a foundation crack needs a structural engineer](/guides/when-foundation-crack-need-structural-engineer/) covers what that visit looks like and what to ask.
4. **Add a geotechnical engineer** on a steep lot, or where the area has a history of slope movement.

## How we checked this

- **What we read, on November 16, 2026.** The ASHI Standard of Practice for Home Inspections, effective March 1, 2014, which is the version ASHI's site links as its standard; the quotes in sections 4.1, 4.2 and 13.2 above are from it. Sections R105.2 and R404.4 of the 2021 International Residential Code, on the International Code Council's code site. The USGS Landslide Hazards Program's maps page.
- **What we didn't check.** Every state's own inspection standard, and local amendments to the 4-foot and 48-inch lines. Both vary, which is why this page sends you to your inspector and your building department for the last word. Who must repair a boundary wall is state law, and we haven't surveyed it.`,
};

const SELLER_CLAIM: Restore = {
  id: 165,
  slug: 'happens-if-seller-didn-t-disclose-past-insurance-claim',
  title: "What If the Seller Didn't Disclose a Past Insurance Claim?",
  meta: "A claim left off the disclosure form can still show up on a C.L.U.E. report. What it means for your policy, your loan and your options after you find out.",
  quickAnswer:
    "It depends on when you find out. Before closing, a past claim is information you can still act on: ask what was repaired and by whom, and get your insurance quote in writing. After closing, whether the seller owed you the information depends on your state's disclosure rules and the form they signed, which is a question for a local real estate attorney. Either way, the repair behind the claim usually matters more than the claim.",
  sources: ['CFPB'],
  requires: ['C.L.U.E.', 'B7-3-01', '5.008', 'attorney'],
  body: `Insurance claims leave a record attached to the house, not only to the person who filed them. That's why an undisclosed claim tends to surface sooner or later, and it's also how you can look for one before you're committed to the purchase.

## Where a past claim shows up

Two consumer reporting companies keep the property claims histories insurers use: LexisNexis, with the C.L.U.E. report, and Verisk, with A-PLUS Property. Both are on the Consumer Financial Protection Bureau's list of consumer reporting companies. The CFPB's listing for C.L.U.E. describes "seven years of home insurance and personal property claims," and LexisNexis says its property reports show the date of loss, the cause of loss and the amounts paid.

Three things about these reports matter here:

- **As a buyer, you can't order one yourself.** The Connecticut Insurance Department says C.L.U.E. reports "can be accessed only by the owner, insurer, or lender for the property," and that a buyer can ask the current owner to order one. Utah's insurance department says the same.
- **A claim that paid nothing can still appear; a phone call shouldn't.** Connecticut says insurers have been instructed by C.L.U.E. not to report inquiries about possible coverage, but a claim that was actually filed and paid nothing may still be recorded.
- **The history can be older than the seller's ownership.** Connecticut notes there are no laws that specifically govern the use of a prior owner's loss history, and that an insurer that can show a relationship between that loss and the chance of a future loss to the home may use it.

Our guide to [getting a C.L.U.E. report before you buy](/guides/get-clue-report-before-buying-house/) has the wording to send the seller and where each report is requested.

## If you find out before closing

This is the better time to find out, because you can still act on it.

- **Ask what the claim was for and what was done.** Request the claim paperwork, the contractor's invoices, and the permits if the repair needed them. A roof claim with a new roof and a final inspection on file is a different story from a water claim with no paperwork at all.
- **Get your insurance quote in writing.** The insurer underwriting your policy can see the property's claim history, and it's the one that prices it. A past water or roof claim may change what you're offered, so get the actual quote, not an estimate, before your contingency deadline.
- **Remember the lender needs that policy.** Fannie Mae's Selling Guide, section B7-3-01, sets property insurance requirements for every first mortgage it buys, and says the lender must ensure the insurer, policy and coverage meet them. If the claim history makes coverage hard to place, that's a problem for closing day, not just for later.
- **Have the repair looked at by the right specialist.** A general home inspection is visual. For a past water, mold, fire or foundation claim, a specialist in that trade can tell you whether the repair is holding up. If the repair needed a permit, our guide to [buying a house with unpermitted work](/guides/find-unpermitted-work-before-buying/) covers what you take on when it wasn't pulled.

## If you find out after closing

The claim itself is history. What matters now is the repair behind it.

- **Check the repair first.** A claim paid for water damage, a roof or a foundation means something was fixed, and a fix that wasn't done properly can keep getting worse. Get the specialist out before anything else.
- **Ask your insurer before you need to.** If a new leak looks like an old problem coming back, ask your insurer in writing how your policy treats it, so you know where you stand before you file.
- **Find the disclosure form the seller signed.** Whether the seller owed you this information depends on your state's law and on what that form asked.

## What the disclosure form actually asks

Seller disclosure forms differ from state to state, and many ask about the condition of the house rather than its insurance history.

Texas is a useful example because its form is written into the statute. The seller's disclosure notice in [Texas Property Code § 5.008](https://statutes.capitol.texas.gov/Docs/PR/htm/PR.5.htm) asks: "Have you (Seller) ever filed a claim for flood damage to the property with any insurance provider, including the National Flood Insurance Program (NFIP)?" That question covers flood claims only. Other damage comes in through the form's questions about the property's condition, such as whether the seller is aware of any item, equipment or system "in need of repair."

So on a form like that, a past roof or plumbing claim may not be a question of its own, but known damage that was never fixed would be. If you think a seller left something off, take the signed form and the claim history to a real estate attorney in your state. They can tell you whether there's a case and what it would take.

## Why a claim can be missing without anyone hiding it

- **It was a previous owner's.** A seller who has owned the house for a couple of years may never have heard of a claim filed before them.
- **They didn't think it counted.** A claim that was filed and paid nothing may not feel like "a claim" to the person who filed it.
- **They thought it was fixed.** A ceiling stain painted over can look like a finished repair to someone who never saw the joists above it.

None of this makes the history less useful to you. It's the reason to ask for the report early instead of relying on the form.

## How we checked this

- **What we read.** The Consumer Financial Protection Bureau's listings for C.L.U.E. and Verisk A-PLUS Property, the C.L.U.E. FAQs from the Connecticut and Utah insurance departments, and LexisNexis's C.L.U.E. Property page, all read on October 19, 2026 for our C.L.U.E. guide. On November 16, 2026 we read the seller's disclosure notice in Texas Property Code § 5.008 and section B7-3-01 of Fannie Mae's Selling Guide.
- **What we didn't check.** Other states' disclosure forms: Texas is one example, not a rule for everywhere. How any particular insurer prices a past claim, which isn't public. Utah's page says up to five years of history and Connecticut's says seven; we've quoted the CFPB's listing.`,
};

const RESTORES = [RETAINING, SELLER_CLAIM];

/** Every number on a page must appear in its fact ledger (quotes, claims or URLs). */
function assertNumbersInLedger(r: Restore) {
  const ledger = fs.readFileSync(path.join(process.cwd(), 'data', 'fact-ledgers', `${r.slug}.json`), 'utf8');
  const text = `${r.quickAnswer}\n${r.meta}\n${r.body.replace(/\]\([^)]*\)/g, ']')}`;
  const nums = new Set([...text.matchAll(/\b[A-Z]?\d[\d.,-]*\d|\b\d\b/g)].map((m) => m[0].replace(/[.,]$/, '')));
  const missing = [...nums].filter((n) => !ledger.includes(n) && !['1', '2', '3', '4'].includes(n));
  if (missing.length) throw new Error(`ABORT ${r.slug}: numbers not in the ledger: ${missing.join(', ')}`);
}

async function main() {
  const rows = (await withDb((sql) => sql`SELECT id, slug, status, title FROM articles`)) as unknown as Array<any>;
  const byId = new Map(rows.map((r) => [r.id, r]));
  const live = new Set(rows.filter((r) => r.status === 'published').map((r) => r.slug));
  const willBeLive = new Set([...live, ...RESTORES.map((r) => r.slug)]);

  let bad = 0;
  for (const r of RESTORES) {
    const row = byId.get(r.id);
    if (!row || row.slug !== r.slug) throw new Error(`ABORT: id ${r.id} is not ${r.slug}`);
    if (row.status !== 'removed') throw new Error(`ABORT: ${r.slug} is '${row.status}', expected 'removed'`);
    if (row.title !== r.title) throw new Error(`ABORT: ${r.slug} title changed in the DB since this script was written`);
    if (r.title.length > 60) throw new Error(`ABORT: ${r.slug} title ${r.title.length} > 60`);
    if (r.meta.length < 70 || r.meta.length > 155) throw new Error(`ABORT: ${r.slug} meta ${r.meta.length} outside 70-155`);
    if (r.quickAnswer.length < 120 || r.quickAnswer.length > 450) throw new Error(`ABORT: ${r.slug} quick answer ${r.quickAnswer.length} outside 120-450`);
    assertHumanDraft(r.slug, r.body, r.quickAnswer);
    assertNumbersInLedger(r);
    for (const req of r.requires) if (!r.body.includes(req)) throw new Error(`ABORT: ${r.slug} promises "${req}" but the body lacks it`);
    for (const m of r.body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/?\)/g))
      if (!willBeLive.has(m[1])) { console.log(`  DEAD GUIDE LINK: ${r.slug} -> ${m[1]}`); bad++; }
    for (const re of [/\*\*\[[^\]]*\]\([^)]*\)\*\*/g, /\[\*\*[^\]]*\*\*\]\([^)]*\)/g])
      for (const m of r.body.matchAll(re)) { console.log(`  NESTED LINK: ${r.slug} -> ${m[0]}`); bad++; }
    if (/\]\(#/.test(r.body)) { console.log(`  IN-PAGE ANCHOR: ${r.slug}`); bad++; }
  }
  if (bad) throw new Error(`ABORT: ${bad} link defect(s)`);

  // prunedGuides.ts: drop the two restored slugs (the list is audit input for the link fixers).
  const src = fs.readFileSync(PRUNED_FILE, 'utf8');
  let next = src;
  for (const r of RESTORES) {
    if (!REMOVED_GUIDE_SLUGS.includes(r.slug)) throw new Error(`ABORT: ${r.slug} not in REMOVED_GUIDE_SLUGS`);
    const line = new RegExp(`^\\s*'${r.slug.replace(/[.*+?^\${}()|[\]\\]/g, '\\$&')}',\\n`, 'm');
    if (!line.test(next)) throw new Error(`ABORT: no list line for ${r.slug}`);
    next = next.replace(line, '');
  }

  for (const r of RESTORES) {
    console.log(`\n  RESTORE /guides/${r.slug}/  (410 -> 200)`);
    console.log(`    title (${r.title.length})  ${r.title}`);
    console.log(`    meta  (${r.meta.length})  ${r.meta}`);
    console.log(`    quick (${r.quickAnswer.length})  ${r.quickAnswer.slice(0, 90)}...`);
    console.log(`    body  ${r.body.length} chars, ${(r.body.match(/^## /gm) || []).length} sections`);
    console.log(`    outbound: ${[...r.body.matchAll(/\]\(\/guides\/([a-z0-9-]+)/g)].map((m) => m[1]).join(', ')}`);
  }
  console.log(`\n  prunedGuides.ts: dropping ${RESTORES.length} entries; library ${live.size} -> ${live.size + RESTORES.length}`);

  if (!APPLY) { console.log('\n  DRY RUN -- nothing written.'); return; }

  for (const r of RESTORES) {
    await withDb((sql) => sql`UPDATE articles SET status = 'published', meta_description = ${r.meta},
      quick_answer = ${r.quickAnswer}, body_markdown = ${r.body}, sources_json = ${JSON.stringify(r.sources)},
      faq_json = '[]', published_at = coalesce(published_at, now()), updated_at = now()
      WHERE id = ${r.id} AND slug = ${r.slug} AND status = 'removed'`);
    console.log(`  restored ${r.slug}`);
  }
  fs.writeFileSync(PRUNED_FILE, next); // last, so a failed DB write leaves the list untouched
  console.log(`  wrote ${path.relative(process.cwd(), PRUNED_FILE)}`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
