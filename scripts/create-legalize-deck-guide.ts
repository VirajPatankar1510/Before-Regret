// Creates the "how to legalize an unpermitted deck" guide.
//
//   npx tsx scripts/create-legalize-deck-guide.ts            # dry run
//   APPLY=true npx tsx scripts/create-legalize-deck-guide.ts
//
// WHY A NEW ARTICLE AND NOT AN EDIT. Checked first: no published guide covers this. The phrase
// "how to legalize unpermitted deck" appears nowhere in the corpus, "legalize" appears in only two
// articles and both are removed county permit guides where it is incidental, and no slug or title
// in the whole 158-row table is about decks or after-the-fact permits. The closest published guide,
// find-unpermitted-work-before-buying, is about DISCOVERY -- zero occurrences of "legaliz", two of
// "deck", and its remediation section is negotiation advice for a buyer, not a permitting process.
// Bolting a legalisation section onto it would blur a page that currently answers one question well.
//
// CREATED AS A DRAFT, NOT PUBLISHED. The content standard's first rule is "do not publish more
// until existing pages are indexed", and right now 16 of 42 published guides have zero impressions
// in 28 days -- including all five county permit guides restored yesterday, which Google has not
// crawled yet. Publishing a 43rd today would break the rule this project set after the prune. The
// row is written ready to go; flipping status to 'published' is the whole of the remaining work.
//
// CLUSTER: permits. GUIDE_TOPIC_PATTERNS matches /permit|unpermitted|code[- ]enforcement|zoning|
// violation/ against slug + title, and this slug carries "unpermitted", so it joins the eleven-
// member permits cluster rather than becoming a singleton.
//
// INTENT NOTE, stated plainly because it affects what this page can be expected to do: the person
// searching this phrase is usually an OWNER who already has the deck, not a buyer. It sits in the
// permits cluster and serves a buyer deciding what a defect will cost to cure, but it will convert
// to reports and vendor ads less well than a pre-purchase query does. It is here because the
// permits cluster is the one thing on this domain that ranks, not because it is core intent.
import 'dotenv/config';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';

const SLUG = 'legalize-unpermitted-deck';
const TITLE = 'How to Legalize an Unpermitted Deck';

const META = 'How to legalize an unpermitted deck: the after-the-fact permit process, what inspectors '
  + 'need to see, why framing gets exposed, and what it costs to bring a deck up to code.';

const QUICK = 'To legalize an unpermitted deck you apply to your local building department for an '
  + 'after-the-fact permit, submit as-built drawings showing the existing structure, and open up the '
  + 'framing so an inspector can verify the footings, ledger attachment and connections that are '
  + 'normally checked during construction. Fees are commonly charged at a penalty multiple, and the '
  + 'deck must meet the code edition your jurisdiction currently enforces, not the one in force when '
  + 'it was built.';

// Sentence-level notes on why particular claims are worded the way they are live inline, because a
// future editor tightening the prose is exactly who needs to see them.
const BODY = `An unpermitted deck is one of the most common pieces of unpermitted work on a US house, and one of the more straightforward to put right — which is not the same as cheap or quick. This guide covers **how to legalize an unpermitted deck**: what an after-the-fact permit is, what a building department will ask you to prove, why the framing usually has to be opened up, and what tends to drive the cost.

It is written for two people. The owner who has found out the deck was never permitted, usually because a sale, a refinance or an insurance inspection surfaced it. And the buyer deciding whether a deck they have just discovered is a negotiating point or a reason to walk.

## What "Legalizing" a Deck Actually Means

There is no separate legal status a deck can be moved into. Legalizing an unpermitted deck means obtaining the permit that should have been pulled before it was built, and passing the inspections that permit would have required — after the fact.

Building departments generally call this an **after-the-fact permit** or a **retroactive permit**. Some call it a legalization permit. The name varies; the substance does not. You are asking the authority having jurisdiction to inspect finished work and certify that it meets code.

The consequential detail, and the one most people get wrong: the deck must satisfy the code edition your jurisdiction enforces **now**, not the edition in force when the deck was built. A deck built to a 2009 standard in a county that has since adopted a later edition of the International Residential Code has to meet the later one [ICC]. Grandfathering protects lawfully permitted work. Work that was never permitted has nothing to be grandfathered into.

## Why Decks Specifically

Decks are over-represented in unpermitted work for a reason that has nothing to do with dishonesty. They look like carpentry. A homeowner who would never touch a service panel will happily build a deck, and a contractor working without a permit can finish one in a weekend without anything visibly amiss.

They are also the residential structure that fails most consequentially. A deck holds a crowd, at height, on connections that are hidden from view once the boards go down. The International Residential Code did not carry a dedicated deck section until R507 was added in the 2015 edition, which is part of why decks built before then vary so widely [ICC]. The American Wood Council's DCA6 is the prescriptive deck guide many building departments hand out and some adopt by reference; if your inspector mentions it, that is the document they mean [AWC].

## The Process, Step by Step

### 1. Confirm the deck really is unpermitted

Do this before you apply for anything. Pull the property's permit history from the building department and read what is actually on file. A deck may have been permitted under a description you would not recognise — "rear addition", "structural alteration" — or permitted and never finalled, which is a different problem with a different fix.

An open permit that was never signed off usually needs a final inspection, not a new application. Our guide on [how to look up building permits by address](/guides/look-up-building-permits-by-address/) covers finding the right authority and reading what comes back.

### 2. Ask the building department how they want it handled

Call before you file. This is the step people skip, and it is the one that decides how much the rest costs.

What you want to establish: whether they issue after-the-fact permits at all for this kind of work, what the fee multiplier is, whether they require drawings stamped by a licensed engineer or will accept owner-drawn as-builts, and how much of the structure they expect to see opened up. Departments differ on all four, and the answer to the last one is the difference between a few hundred dollars and a few thousand.

### 3. Produce as-built drawings

An as-built is a drawing of what exists, rather than what was proposed. For a deck it typically shows the plan dimensions, the height above grade, the joist and beam sizes and spans, the footing size and depth, how the deck attaches to the house, and the guard and stair details.

Some departments accept a careful hand drawing from the owner. Others require a licensed engineer or architect, particularly where the deck is elevated, cantilevered, or attached to the house in a way that cannot be verified visually. If the original builder is unknown and no framing plan exists, an engineer is usually the faster route regardless of what is strictly required.

### 4. Expose the framing

This is the part owners are least prepared for, and it is not negotiable in most jurisdictions.

An inspector's job on a new deck is to look at the parts that get covered up: the footings before concrete, the ledger connection before the boards go on, the flashing before the siding closes over it. On a finished deck, none of that is visible. So the inspection typically requires removing decking boards over the ledger, and excavating at one or more footings to confirm depth and size.

Three things get looked at hardest:

**The ledger connection.** How the deck attaches to the house is the single most common cause of catastrophic deck collapse, and it is what an inspector will want to see first. Nails instead of through-bolts or approved structural screws is a failure. So is attachment to a rim joist that cannot carry the load, or to a brick veneer, which cannot carry it at all.

**Flashing at the ledger.** Water that gets behind an unflashed ledger rots the band joist it is bolted to, which is the structural member holding the deck up. This is a slow failure that produces no symptom until it produces a total one.

**Footing depth.** Footings have to bear below the local frost line, and the required depth is a local number — it varies from essentially nothing in the far south to four feet or more in the northern states. A deck on shallow piers in a freezing climate will heave, and no amount of good framing above compensates.

### 5. Correct what fails, then re-inspect

Expect at least one correction list. Common ones on older decks are guards that are too low or have gaps that fail the spacing rule, stair rise and run that is inconsistent, missing joist hangers, undersized beams for the span, and lag screws where through-bolts are required.

None of these are exotic. All of them are cheaper to fix with the framing already open, which is an argument for doing the whole process in one pass rather than opening the deck up twice.

## What It Costs

Nobody can quote you a number for this, and any page that gives you one is guessing. The cost is set by four things that are all local:

- **The permit fee**, which is commonly charged at a penalty multiple of the normal fee. Double is the figure that comes up most often, but jurisdictions set their own and some charge a flat investigation fee on top.
- **Whether you need an engineer.** This is the biggest single swing in the whole process.
- **How much has to be opened up**, which depends on how much the inspector can determine from the drawings and from what is visible.
- **What fails.** A deck that needs new footings is a different project from one that needs a guard raised.

The honest framing for a buyer: an unpermitted deck is a cost of unknown size until the building department has told you what they will require, and that is a call you can make before closing rather than after.

## If You Are Buying, Not Owning

An unpermitted deck is a negotiation item, not usually a deal-breaker. What matters is that it is priced before you sign rather than discovered afterwards.

Two things are worth knowing. Insurers and lenders treat unpermitted structures inconsistently — some are indifferent, some will not cover the structure, and an appraiser may decline to count unpermitted square footage toward value, which matters more for an addition than a deck. And code enforcement authority does not expire when the house changes hands: the obligation follows the property, so it becomes yours at closing.

If you are still at the discovery stage, [how to find unpermitted work before buying](/guides/find-unpermitted-work-before-buying/) covers pulling the records and spotting the physical signs. A home inspector will flag a deck that looks wrong, but an inspection is not a code compliance review and will not tell you whether a permit exists [ASHI].

## The One Thing Not to Do

Do not remove the deck to avoid the conversation, and do not leave it undisclosed and hope.

Removing it can be the right answer if the structure is genuinely unsound and the cost of correction exceeds the cost of rebuilding. But doing it to conceal rather than to solve creates a disclosure problem in the next sale, and most states require sellers to disclose known unpermitted work. Leaving it undisclosed is worse: an unpermitted structure discovered by a future buyer's inspector is a renegotiation at the worst possible moment, and in some jurisdictions an open code enforcement case attaches to the property record where anyone can find it.

The process above is tedious and it costs money. It is also finite, and it ends with a deck that has a permit and a final inspection on file — which is the thing that makes the problem stop being yours.
`;

const FAQ = [
  {
    question: 'How do you legalize an unpermitted deck?',
    answer: 'You apply to your local building department for an after-the-fact permit, submit as-built '
      + 'drawings showing the deck that exists, and open up the framing so an inspector can verify the '
      + 'footings, the ledger connection and the flashing that would normally be checked during '
      + 'construction. Any items that fail are corrected and re-inspected before the permit is finalled.',
  },
  {
    question: 'Does an unpermitted deck have to meet current code or the code when it was built?',
    answer: 'Current code, in most jurisdictions. Grandfathering protects work that was lawfully '
      + 'permitted at the time; work that was never permitted has no prior approval to be grandfathered '
      + 'into, so it is assessed against the code edition the jurisdiction enforces now.',
  },
  {
    question: 'Will they make me tear up the deck boards?',
    answer: 'Usually some of them, yes. The connections an inspector most needs to see — the ledger '
      + 'attachment to the house and the flashing behind it — are covered by decking once a deck is '
      + 'finished. Expect to remove boards over the ledger and to excavate at one or more footings to '
      + 'confirm depth and size.',
  },
  {
    question: 'How much does an after-the-fact deck permit cost?',
    answer: 'It varies too much by jurisdiction to quote. Permit fees for after-the-fact work are '
      + 'commonly charged at a penalty multiple of the normal fee, and the larger costs are usually '
      + 'whether an engineer is required to produce or stamp the drawings, how much of the structure '
      + 'has to be opened up, and what fails inspection.',
  },
  {
    question: 'Can I sell a house with an unpermitted deck?',
    answer: 'Generally yes, but most states require a seller to disclose known unpermitted work, and '
      + 'the obligation to bring it into compliance follows the property to the new owner rather than '
      + 'expiring at closing. Buyers commonly treat it as a price adjustment once it is quantified.',
  },
  {
    question: 'What part of a deck fails inspection most often?',
    answer: 'The ledger connection — how the deck attaches to the house. Nails instead of through-bolts '
      + 'or approved structural screws, attachment to a member that cannot carry the load, and missing '
      + 'flashing behind the ledger are the recurring findings, and the ledger is where deck failures '
      + 'are most consequential.',
  },
];

async function main() {
  const existing = (await withDb((sql) => sql`SELECT slug, status FROM articles WHERE slug = ${SLUG}`)) as unknown as Array<{ slug: string; status: string }>;
  if (existing.length) throw new Error(`ABORT: ${SLUG} already exists with status '${existing[0].status}'`);

  // Every internal link must point at a published guide.
  const live = new Set((await withDb((sql) => sql`SELECT slug FROM articles WHERE status='published'`) as unknown as Array<{ slug: string }>).map((r) => r.slug));
  const linked = [...new Set([...BODY.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/?\)/g)].map((m) => m[1]))];
  const dead = linked.filter((s) => !live.has(s));
  if (dead.length) throw new Error(`ABORT: dead internal link(s): ${dead.join(', ')}`);

  // renderArticleMarkdown's parseInline does not recurse: a link inside bold, or bold inside a
  // link, reaches the reader as literal markdown. This shipped once; never again from a script.
  for (const re of [/\*\*\[[^\]]*\]\([^)]*\)\*\*/g, /\[\*\*[^\]]*\*\*\]\([^)]*\)/g]) {
    const hit = BODY.match(re);
    if (hit) throw new Error(`ABORT: nested link/bold: ${hit[0]}`);
  }

  // Citations must resolve, or they render as dangling bracket codes.
  const { resolveKnownSource } = await import('../src/data/knownSources.js');
  const cites = [...new Set([...BODY.matchAll(/\[([A-Z]{2,6})\]/g)].map((m) => m[1]))];
  const bad = cites.filter((c) => !resolveKnownSource(c));
  if (bad.length) throw new Error(`ABORT: unresolvable citation(s): ${bad.join(', ')}`);

  console.log(`slug      : ${SLUG}`);
  console.log(`title     : ${TITLE}`);
  console.log(`body      : ${BODY.length} chars`);
  console.log(`links     : ${linked.join(', ')}  (all published)`);
  console.log(`citations : ${cites.join(', ')}  (all resolve)`);
  console.log(`faqs      : ${FAQ.length}`);
  console.log(`phrase    : "how to legalize an unpermitted deck" present: ${/how to legalize an unpermitted deck/i.test(BODY + TITLE)}`);
  console.log(`cluster   : ${/permit|unpermitted|code[- ]enforcement|zoning|violation/.test(`${SLUG} ${TITLE}`) ? 'permits' : 'NO MATCH -- would be a singleton'}`);

  if (!APPLY) { console.log('\nDRY RUN -- nothing written.'); return; }

  const res = (await withDb((sql) => sql`
    INSERT INTO articles (slug, title, meta_description, body_markdown, status, quick_answer,
                          sources_json, faq_json, article_type, ad_tier, created_at, updated_at)
    VALUES (${SLUG}, ${TITLE}, ${META}, ${BODY}, 'draft', ${QUICK},
            ${JSON.stringify(['ICC', 'AWC', 'ASHI'])}, ${JSON.stringify(FAQ)}, 'guide', 'standard',
            now(), now())
    RETURNING slug, status, length(body_markdown) AS len
  `)) as unknown as Array<{ slug: string; status: string; len: number }>;
  console.log(`\ncreated ${res[0].slug} (${res[0].status}, ${res[0].len} chars)`);
  console.log('Publish with: UPDATE articles SET status=\'published\', published_at=now() WHERE slug=\'' + SLUG + '\';');
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
