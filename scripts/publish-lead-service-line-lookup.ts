// Publish "Lead Service Line Lookup: Is the Pipe to This House Lead?".
//
//   npx tsx scripts/publish-lead-service-line-lookup.ts            # dry run
//   APPLY=true npx tsx scripts/publish-lead-service-line-lookup.ts
//
// A RESEARCH-COUNCIL DECISION (2026-10-02), executed through write-guide.
//   Segment (Moskowitz): the permit cluster wins on its JOB -- "look up a public record for this
//     address" -- not on the permit topic. This guide gives that same searcher a new record: the water
//     utility's service line inventory. One variable: a new record, same job.
//   Phrasing: gl=us results page 2026-10-02 (capture 2026-10-02-observed-how-to-find-out-if-a-house-
//     has-a-lead-se): PAA "How do I know if my house has a lead service line?", "Can you sell a house
//     with lead pipes?", "Do all old houses have lead pipes?", "What do lead pipes look like?". Top
//     results included utility address-lookup pages, so the title promises the lookup.
//   Verification (Feynman), all read 2026-10-03:
//     - 40 CFR 141.84(a) on eCFR: inventory of material + location of every line, both ownership
//       portions; initial inventory to the State by October 16, 2024; street address per line;
//       publicly accessible; online for systems serving > 50,000. 40 CFR 141.2: the four labels and
//       "galvanized requiring replacement".
//     - 40 CFR 141.80(a)(4)(i): between 2024-10-30 and 2027-11-01 systems must already comply with
//       141.84(a)(1)-(10) (minus (6),(7)) and 141.85(e) (notification) -- so those are stated in the
//       present tense. Mandatory replacement (141.84(d), 10%/yr average) is NOT in that list, so the
//       page says it begins November 1, 2027 under the rule as written.
//     - 42 U.S.C. 300g-6(a)(1) (Cornell LII; uscode.house.gov was down): no lead pipe in installation
//       or repair after June 19, 1986.
//     - 40 CFR Part 745 Subpart F: the federal disclosure covers lead-based PAINT in pre-1978 housing,
//       not pipes.
//     - EPA "Protect Your Tap" (interactive guide, walked through in the browser): meter location,
//       where the line enters, key/coin scratch test, magnet test, wording on testing and programs.
//     - DC Water's Service Line Inventory Map (geo.dcwater.com/Lead/, 200). Milwaukee's lookup is
//       behind a Cloudflare bot check, not worked around, so it is not cited.
//   CUT as unverifiable: the AP figure on unknown lines nationally, survey stats, any health claim
//     beyond EPA's own wording, "many utilities have started early".
//   Tone (owner rule): calm. No fear framing; "unknown" is explained as a gap, not a finding.
//   Re-confirmed by the council 2026-10-03: title changed from "Check a House's Pipes by Address" (glance test:
//     implied interior plumbing) and a sentence added that the inventory covers the service line only.
//   Read (Deming): 2026-11-07. Stop condition below.

import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { validateBrief, type ArticleBrief } from '../src/seo/articleBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';

const APPLY = process.env.APPLY === 'true';

const BRIEF: ArticleBrief = {
  slug: 'lead-service-line-lookup-by-address',
  targetQuery: 'how to find out if a house has a lead service line',
  capture: '2026-10-02-observed-how-to-find-out-if-a-house-has-a-lead-se',
  intent: 'informational',
  who: 'a buyer touring an older house who wants to know, before making an offer, whether the buried water line from the street is lead',
  want: "where to look the address up in the water utility's inventory, what its four labels mean, and how to check the pipe where it enters",
  achieve: 'to know before going under contract whether the line is lead, unknown or clear, and what to ask the seller and the utility',
  titlePromise: "a way to check a specific house's water service line by its address, plus a quick pipe check on a viewing",
  stopCondition:
    'About 5 weeks after publishing (read 2026-11-07): shown on Google for at least one lead-service-line search. If not, do not ' +
    'extend the "other public records by address" line (internet map, parcel map); fall back to the regret guide and aging-parents guide.',
};

const TITLE = 'Lead Service Line Lookup: Is the Pipe to This House Lead?';
const META = "See if a house has a lead service line before you buy: look up the address in the water utility's inventory, read its labels, then check the pipe.";
const QUICK_ANSWER =
  "Look the address up in the water utility's service line inventory. Every water system had to submit one by October 16, 2024, " +
  'listing each line by street address as lead, galvanized requiring replacement, lead status unknown or non-lead, and it must be ' +
  'public; large systems post it online. Then check the pipe where it enters: soft gray metal that a magnet will not stick to may be lead.';
const SOURCES: string[] = [];
const SRC_MD = path.join(process.cwd(), 'guides', 'lead-service-line-lookup.md');

const REQUIRED = ['40 CFR 141.84', '40 CFR 141.2', '40 CFR 141.85(e)', '42 U.S.C. 300g-6', '40 CFR Part 745', 'October 16, 2024', 'June 19, 1986', 'November 1, 2027', '50,000', 'magnet', 'service line only'];
const BANNED = [
  /\bdelve|furthermore|crucial|regulatory landscape|when it comes to\b/i, /read on|we'll explain below/i,
  /\b(most|many|some) (insurers|carriers|lenders|utilities) (will |won't |refuse|require|decline|have)/i,
  /poison|toxic|deadly|alarming|shocking|danger(ous)?\b/i, // calm tone: EPA's facts carry it, not adjectives
];

async function main() {
  validateBrief(BRIEF);
  let bad = 0;
  const fail = (m: string) => { console.log(`  FAIL ${m}`); bad++; };
  const raw = fs.readFileSync(SRC_MD, 'utf8');
  const h1 = raw.match(/^#\s+(.*)$/m)?.[1]?.trim();
  if (h1 !== TITLE) fail(`markdown H1 "${h1}" does not match TITLE`);
  const body = raw.replace(/^#\s.*\n+/, '').trim();
  if (TITLE.length > 60) fail(`title ${TITLE.length}`);
  if (META.length < 70 || META.length > 155) fail(`meta ${META.length}`);
  if (QUICK_ANSWER.length < 120 || QUICK_ANSWER.length > 450) fail(`quick_answer ${QUICK_ANSWER.length}`);
  const topic = guideTopic(BRIEF.slug, TITLE);
  if (topic !== 'plumbing') fail(`cluster "${topic}"`);
  for (const r of REQUIRED) if (!body.includes(r)) fail(`missing "${r}"`);
  for (const b of BANNED) for (const t of [body, QUICK_ANSWER, META]) { const m = t.match(b); if (m) fail(`banned "${m[0]}"`); }
  if (/\*\*\[[^\]]+\]\([^)]+\)\*\*|\[\*\*[^\]]+\*\*\]\([^)]+\)/.test(body)) fail('link nested in bold');
  const heads = body.match(/^#{2,3} .*/gm) ?? [];
  if (new Set(heads).size !== heads.length) fail('duplicate heading');
  const rows = (await withDb((sql) => sql`SELECT slug, status FROM articles`)) as unknown as Array<{ slug: string; status: string }>;
  const published = new Set(rows.filter((r) => r.status === 'published').map((r) => r.slug));
  if (rows.some((r) => r.slug === BRIEF.slug)) fail('slug exists');
  for (const m of body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/\)/g)) if (!published.has(m[1])) fail(`dead link ${m[1]}`);
  console.log(`\n  ${BRIEF.slug}  [${topic}]\n    title (${TITLE.length})  ${TITLE}\n    meta  (${META.length})  ${META}\n    quick (${QUICK_ANSWER.length})  ${QUICK_ANSWER}\n    body  ${body.split(/\s+/).length} words\n    ${heads.join('\n    ')}`);
  if (bad) { console.log(`\n  ${bad} problem(s) -- nothing written.`); process.exit(1); }
  if (!APPLY) { console.log('\n  DRY RUN -- all checks pass.\n'); return; }
  await withDb((sql) => sql`
    INSERT INTO articles (slug, title, meta_description, quick_answer, body_markdown, sources_json, status, article_type, ad_tier, published_at)
    VALUES (${BRIEF.slug}, ${TITLE}, ${META}, ${QUICK_ANSWER}, ${body}, ${JSON.stringify(SOURCES)}, 'published', 'guide', 'standard', now())`);
  console.log(`  wrote ${BRIEF.slug}\n  next: article-faqs, targetKeywords, inbound links, build\n`);
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
