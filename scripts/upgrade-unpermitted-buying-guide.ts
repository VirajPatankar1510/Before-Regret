// Retargets find-unpermitted-work-before-buying at "buying a house with unpermitted work".
//
//   npx tsx scripts/upgrade-unpermitted-buying-guide.ts            # dry run
//   APPLY=true npx tsx scripts/upgrade-unpermitted-buying-guide.ts
//
// THE PAGE HAS NOTHING TO LOSE, which is why a retitle is safe here and would not be on a page
// that ranks. Checked before touching it: find-unpermitted-work-before-buying is in Search
// Console's NEVER SHOWN list -- zero Google impressions in 28 days, despite being published since
// 23 August. Bing shows it (6 impressions, 2 clicks), Google does not. There is no Google ranking
// to protect, so the title can be aimed at the query we actually want.
//
// WHAT WAS ACTUALLY WRONG WITH IT. The page answers "how do I FIND unpermitted work" very well --
// pulling records, reading permit statuses, physical red flags, what an inspector will and will not
// tell you. The query "buying a house with unpermitted work" is a different question with the same
// subject: what happens to me if I buy it. That is answered only in fragments here -- one insurance
// paragraph at the very bottom, and a clause in the intro. Someone searching the target phrase
// wants the consequences first and the discovery method second.
//
// So this adds the missing half rather than rewriting the good half: a consequences section placed
// immediately after the intro, ahead of the discovery steps, because that is the order the query
// asks for.
//
// TITLE DEVIATES FROM THE ONE SUGGESTED, deliberately. The suggestion was "What Happens If You Buy
// a House with Unpermitted Work? A Buyer's Survival Guide". Two problems: it does not contain the
// target phrase (it has "Buy a House", the query is "Buying a House"), and "Survival Guide" is the
// register this project's content standard warns about -- the library was suppressed partly for
// formula titles. The title below leads with the exact phrase and says what the page delivers.
import 'dotenv/config';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';
const SLUG = 'find-unpermitted-work-before-buying';

const NEW_TITLE = 'Buying a House With Unpermitted Work: What You Are Taking On';

const NEW_META = 'Buying a house with unpermitted work: what the liability actually is, who it '
  + 'follows at closing, how insurers and appraisers treat it, and how to price it before you sign.';

const NEW_QUICK = 'Buying a house with unpermitted work means inheriting the obligation to bring it '
  + 'into compliance, because code enforcement authority attaches to the property rather than to the '
  + 'person who did the work. The practical risks are an insurer that limits or denies a claim traced '
  + 'to unpermitted work, an appraiser who declines to count unpermitted square footage toward value, '
  + 'and a future buyer who discovers it during your own sale. None of that makes a house unbuyable; '
  + 'it makes it a price you should establish before closing rather than after.';

// The opening sentence is a comma splice in the original and buries the answer. Rewritten to lead
// with the query and state the liability plainly.
const OLD_INTRO = `Buying a house with unpermitted work, structural, electrical, or plumbing modifications can expose you to structural failures, denied insurance claims, and retroactive municipal fines. Discovering these issues after closing often leaves the new owner financially responsible for bringing the entire system up to current building codes. `;

const NEW_INTRO = `Buying a house with unpermitted work — structural, electrical or plumbing modifications made without a permit — exposes you to three things at once: work nobody inspected, an insurer that may decline a claim traced back to it, and a municipality that can require it be brought up to current code. Discovering it after closing leaves the new owner paying for all three.

The reason it lands on the buyer is simple and worth stating early: code enforcement authority attaches to the property, not to whoever built the thing. The previous owner's decision becomes your obligation the moment you take title. `;

// Placed BEFORE the discovery steps, because the query asks what happens, not how to look.
const CONSEQUENCES = `## What Actually Happens If You Buy It

Most unpermitted work never causes a dramatic event. What it does instead is create four specific exposures, and they are worth separating because they carry very different weights.

**The obligation transfers to you.** This is the one people misunderstand. A municipality's ability to require compliance runs with the property, so it does not expire when the house is sold and it does not stay with the person who did the work. If the city issues a correction notice two years after you move in, it is addressed to you.

**Insurance can behave differently than you expect.** Some carriers restrict coverage, deny a claim, or decline to renew where a loss is traced to a structure or system built without the required permits and inspections. The exposure is not that the policy is void; it is that the one claim you most need — a fire that started in uninspected wiring — is the one most likely to be contested. Ask before closing rather than after.

**Unpermitted square footage may not count.** An appraiser may decline to include a finished basement, a converted garage or an addition that has no permit on file. That matters for what a lender will lend, and it matters again when you sell: you paid for the space, and the next appraisal may not credit it either.

**It resurfaces when you sell.** Most states require a seller to disclose known unpermitted work. So the problem does not simply go away by living with it; it returns at your own closing, with a buyer's inspector finding it at the least convenient moment.

What is genuinely not on that list is criminal exposure or a forced demolition in the ordinary case. Demolition is a last resort for work that cannot be corrected, and it is rare. The realistic worst case for most buyers is a bill of unknown size, which is exactly why it is worth quantifying before you commit rather than discovering afterwards.

`;

// A deck is the single commonest piece of unpermitted work, and this bullet already names deck
// construction, so the anchor is earned rather than inserted.
const OLD_DECK = `*   Hire a **licensed structural engineer** to evaluate any unpermitted additions, load-bearing wall removals, or deck construction.`;
const NEW_DECK = `*   Hire a **licensed structural engineer** to evaluate any unpermitted additions, load-bearing wall removals, or deck construction. Decks are the commonest unpermitted structure on a US house and the one with the most consequential hidden connections; [how to legalize an unpermitted deck](/guides/legalize-unpermitted-deck/) covers the after-the-fact permit process and what an inspector will need to see.`;

const NEW_FAQS = [
  {
    question: 'What happens if you buy a house with unpermitted work?',
    answer: 'The obligation to bring it into compliance passes to you, because code enforcement '
      + 'authority attaches to the property rather than to the person who did the work. In practice '
      + 'that means possible restrictions on an insurance claim traced to the work, an appraiser who '
      + 'may not count unpermitted square footage toward value, and a disclosure obligation when you '
      + 'come to sell. Forced demolition exists but is a last resort for work that cannot be corrected.',
  },
  {
    question: 'Can you get a mortgage on a house with unpermitted work?',
    answer: 'Often yes, but it depends on the lender, the loan programme and what the appraiser does '
      + 'with the space. The common problem is not outright refusal: it is that an appraiser declines '
      + 'to count unpermitted square footage, which lowers the appraised value and therefore the '
      + 'amount the lender will advance against the price you agreed.',
  },
  {
    question: 'Is buying a house with unpermitted work a dealbreaker?',
    answer: 'Usually not on its own. It is a cost of currently unknown size, and the useful step is '
      + 'to convert it into a number before closing by asking the building department how they handle '
      + 'after-the-fact permits and getting contractor estimates for whatever correction is likely. '
      + 'Walking away makes sense when the work is structural and cannot be verified, or when the '
      + 'seller will not cooperate with either permitting it or pricing it.',
  },
  {
    question: 'Who is liable for unpermitted work after closing, the buyer or the seller?',
    answer: 'The buyer, in the sense that matters day to day: the municipality enforces against the '
      + 'current owner of the property. A seller who knowingly concealed unpermitted work may still '
      + 'carry liability under state disclosure law, but that is a legal claim you would have to '
      + 'pursue after the fact rather than a defence against a correction notice.',
  },
];

async function main() {
  const [row] = (await withDb((sql) => sql`
    SELECT slug, status, title, meta_description, quick_answer, body_markdown, faq_json
    FROM articles WHERE slug = ${SLUG}
  `)) as unknown as Array<any>;
  if (!row) throw new Error(`ABORT: ${SLUG} not found`);
  if (row.status !== 'published') throw new Error(`ABORT: ${SLUG} is '${row.status}'`);

  let body: string = row.body_markdown;

  const edits: Array<[string, string, string]> = [
    ['intro rewritten (comma splice fixed; leads with the query and the liability)', OLD_INTRO, NEW_INTRO],
    ['deck bullet now links the new legalisation guide', OLD_DECK, NEW_DECK],
  ];
  for (const [note, oldText, newText] of edits) {
    const n = body.split(oldText).length - 1;
    if (n !== 1) throw new Error(`ABORT: "${note}" matched ${n} times, expected 1`);
    body = body.replace(oldText, newText);
    console.log(`  ok  ${note}`);
  }

  const anchor = '## Step-by-Step Guide to Pulling Permit Records';
  if (body.split(anchor).length - 1 !== 1) throw new Error('ABORT: consequences anchor not unique');
  body = body.replace(anchor, CONSEQUENCES + anchor);
  console.log('  ok  consequences section inserted ahead of the discovery steps');

  // Merge FAQs, keeping the existing four and dropping any duplicate question.
  const existing = JSON.parse(row.faq_json) as Array<{ question: string; answer: string }>;
  const have = new Set(existing.map((f) => f.question.toLowerCase().trim()));
  const merged = [...NEW_FAQS.filter((f) => !have.has(f.question.toLowerCase().trim())), ...existing];

  // --- assertions -------------------------------------------------------------------------
  const live = new Set((await withDb((sql) => sql`SELECT slug FROM articles WHERE status='published'`) as unknown as Array<{ slug: string }>).map((r) => r.slug));
  const dead = [...new Set([...body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/?\)/g)].map((m) => m[1]))].filter((s) => !live.has(s));
  if (dead.length) throw new Error(`ABORT: dead internal link(s): ${dead.join(', ')}`);

  for (const re of [/\*\*\[[^\]]*\]\([^)]*\)\*\*/g, /\[\*\*[^\]]*\*\*\]\([^)]*\)/g]) {
    const hit = body.match(re);
    if (hit) throw new Error(`ABORT: nested link/bold: ${hit[0]}`);
  }

  const blob = `${NEW_TITLE} ${NEW_META} ${NEW_QUICK} ${body} ${JSON.stringify(merged)}`.toLowerCase();
  const phrase = 'buying a house with unpermitted work';
  const count = blob.split(phrase).length - 1;
  if (count < 3) throw new Error(`ABORT: target phrase appears only ${count} time(s)`);

  console.log(`\n  title    : ${NEW_TITLE}`);
  console.log(`  phrase   : "${phrase}" x${count} (title, meta, quick answer, body, FAQs)`);
  console.log(`  body     : ${row.body_markdown.length} -> ${body.length} chars`);
  console.log(`  faqs     : ${existing.length} -> ${merged.length}`);
  console.log(`  links    : ${[...new Set([...body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/?\)/g)].map((m) => m[1]))].join(', ')}`);

  if (!APPLY) { console.log('\n  DRY RUN -- nothing written.'); return; }

  const res = (await withDb((sql) => sql`
    UPDATE articles SET title = ${NEW_TITLE}, meta_description = ${NEW_META},
      quick_answer = ${NEW_QUICK}, body_markdown = ${body},
      faq_json = ${JSON.stringify(merged)}, updated_at = now()
    WHERE slug = ${SLUG} RETURNING slug, length(body_markdown) AS len
  `)) as unknown as Array<{ slug: string; len: number }>;
  if (res.length !== 1) throw new Error(`ABORT: update affected ${res.length} rows`);
  console.log(`\n  updated ${res[0].slug} (${res[0].len} chars)`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
