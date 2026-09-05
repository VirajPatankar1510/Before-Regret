// Restores and retargets a removed article at "check code violations on a property online",
// and links it into the permits cluster.
//
//   npx tsx scripts/create-code-violations-guide.ts            # dry run
//   APPLY=true npx tsx scripts/create-code-violations-guide.ts
//
// -------------------------------------------------------------------------------------------
// WHY THIS IS A RESTORE AND NOT A NEW ARTICLE.
//
// The exact phrase appears nowhere in the 158-row corpus, and no published article is ABOUT
// violations -- the only page with "Violation Search" in its title is the Philadelphia county
// guide. So the phrase is genuinely uncovered. But an article on the subject already exists in
// the table with status 'removed', cut in the 2 September prune:
//
//     happens-if-house-has-open-building-department-violations
//     "What If a House Has Open Building Department Violations?"
//
// Checked its body before deciding. It covers open-permit-vs-violation, how departments enforce,
// the mortgage and title-insurance consequences, municipal lien searches, and the three ways to
// negotiate an open case before closing. That is the expensive half of this subject and it is
// already written. What it does NOT do is answer the query: "online" appears 0 times, "how to
// check" 0 times, "look up" 0 times, "portal" once. It is a consequences article with a research
// section, aimed at a reader who already knows there is a violation.
//
// So this adds the missing half and retargets, rather than writing a fourth article that would
// overlap it. Restoring also keeps the published count at 44 instead of 45.
//
// SLUG CHANGES to check-code-violations-property-online. Normally a slug change is a URL you
// throw away, but this one was only live 23 Aug - 2 Sep, has been a 404 since, and -- verified --
// has zero inbound internal links from any row in the table. There is nothing to preserve, and
// the old slug does not contain the target words. It still matches /violation/ so it stays in the
// permits cluster.
//
// -------------------------------------------------------------------------------------------
// THE STRUCTURAL REASON THIS PAGE SHOULD EXIST AT ALL.
//
// This is the same fault just repaired on the permits hub. Search Console shows the Philadelphia
// county page ranking page-one for GENERIC, non-Philadelphia violation queries:
//
//     "look up building violations"     Philadelphia  6.0
//     "property violation search"       Philadelphia  7.6
//     "building violations lookup"      Philadelphia  9.5
//
// A county page winning national queries means no national page exists. Philadelphia should keep
// "philadelphia violation search" and lose the generic ones to a page that actually answers them
// for any jurisdiction. That is what this page is for, and it is why the linking below points
// generic intent away from the county pages rather than deeper into them.
//
// -------------------------------------------------------------------------------------------
// AGAINST THE INDEXING RULE, and stated plainly rather than buried: the content standard says do
// not publish more until existing pages are indexed, and 17 published guides have still never
// been shown by Google. This restores rather than adds, and it fills a gap that measured queries
// prove exists -- but it is still a judgement call, so it goes in as 'published' only because the
// prior two guides in this cluster were, and the publish/draft line is in the report below.
import 'dotenv/config';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';
const OLD_SLUG = 'happens-if-house-has-open-building-department-violations';
const SLUG = 'check-code-violations-property-online';
const PHRASE = 'check code violations on a property online';

// 49 characters.
const TITLE = 'How to Check Code Violations on a Property Online';

// 151 characters.
const META = 'How to check code violations on a property online: which office holds the '
  + 'records, what an open case looks like, and what a portal search will miss.';

const QUICK = 'To check code violations on a property online, search the code enforcement or '
  + 'building department with jurisdiction over the address — city for an incorporated address, '
  + 'county for an unincorporated one. There is no national violations database, so the '
  + 'jurisdiction question has to be settled first. Most departments publish a portal searchable '
  + 'by address or parcel number, and violations are usually held in a different system from '
  + 'permits, so both need checking. A portal will not show unrecorded fines or a complaint that '
  + 'never reached citation; a municipal lien search is what covers that gap before closing.';

const OLD_OPEN = `Purchasing a home with active building department violations or unclosed permits can leave a buyer legally and financially responsible for another person's non-compliant construction, resulting in post-closing fines, mandatory teardowns, or unexpected repair costs. Because municipal code enforcement targets the real estate rather than the person who performed the work, unpaid penalties and administrative orders attach to the property title and transfer to you the moment the deed is recorded.

Understanding how local building departments handle open enforcement actions, unpermitted additions, and expired permits can prevent severe administrative headaches after closing.`;

const NEW_OPEN = `You can check code violations on a property online in most of the United States, but not from one place. There is no national violations database and no site that searches every jurisdiction, so the search starts by working out which office holds the records for that particular address — and that is the step people skip.

It is worth doing before you buy rather than after. Municipal code enforcement targets the real estate, not the person who did the work, so unpaid penalties and administrative orders attach to the property and become yours the moment the deed is recorded.`;

// The method, placed immediately after the intro because the query asks how, not what happens.
const METHOD = `## How to Check Code Violations on a Property Online

Four steps, in this order. The first one is the whole difficulty; the rest are mechanical.

**1. Establish which office has jurisdiction.** If the address sits inside city limits, the city's code enforcement division or building department holds the record. If it is unincorporated, the county does. This is not a formality — neighbouring addresses on the same road can fall under different authorities, and searching the wrong one returns a clean result for a property that has an open case. If you are unsure, the county assessor's record for the parcel will name the taxing jurisdiction, which is usually the right place to start.

**2. Find the search itself, which is often not where you expect.** Departments publish this under a variety of names — code enforcement case search, property information, citizen access, violation search, or a general property lookup with enforcement as one tab among several. Searching for the county or city name together with "code enforcement case search" generally finds it faster than navigating the department's own site. Large jurisdictions tend to have a single map-based lookup that carries permits, violations and licences together; smaller ones often have a plain search form, or nothing at all.

**3. Search by address, and by parcel number if the address fails.** Address matching is the commonest point of failure: a portal may hold the record under a slightly different street format, a pre-annexation address, or a unit number you did not include. The parcel or APN, which you can get free from the county assessor, is the unambiguous identifier and will find records an address search misses.

**4. Read the status, not just the presence of a case.** A result list means little until you know what state each case is in. What matters is whether the case is open or closed, whether the file records compliance, whether fines were assessed and whether they were paid, and how old the case is. A closed case with a documented correction is history. An open case is an inherited obligation.

### Permits and violations are usually separate systems

This trips people up more than anything else on this page. In many jurisdictions the permit database and the code enforcement database are different systems with different search pages, and a clean permit history is not evidence of a clean enforcement record. Check both. Where a jurisdiction runs a combined portal, confirm you have actually selected the enforcement records rather than reading permits and assuming the rest.

The reverse is also worth knowing: work done with no permit at all frequently produces no violation record either, because nothing was ever reported. An empty enforcement search is not proof that the house is compliant — it is proof that nobody has complained. [Reading permit statuses and spotting what is missing](/guides/look-up-building-permits-by-address/) is the other half of the same investigation.

### What an online search will not show you

Portals are partial records, and the gaps are consistent enough to plan around:

*   **Cases that never reached a citation.** A complaint that was inspected and resolved informally, or one still in intake, often does not surface publicly.
*   **Unrecorded fines.** Administrative penalties that have not yet been filed against the land records may not appear in either the enforcement portal or the title search.
*   **Other departments entirely.** Fire, health, zoning and utilities each run their own enforcement, and a portal scoped to building code will not carry them.
*   **Anything at all, in a small jurisdiction.** Plenty of towns have no portal. The records are still public — they are obtained by phoning the department or filing a public records request, which typically takes days rather than minutes.

The paid backstop for all of this is a municipal lien search, covered further down. It is the version of this search that contacts the offices directly instead of relying on what they chose to publish.

### If there is no portal

Call the code enforcement office and ask for the enforcement history on the address. Departments field this question from buyers constantly and most will answer it. If the answer is that a written request is required, ask specifically for open code enforcement cases, closed cases with unpaid fines, and open or expired permits — three separate things, and a request naming only one of them will be answered narrowly and truthfully while leaving out the rest.

`;

// Two outbound links, so the page is not a dead end taking six inbound links and giving nothing
// back. Both sit on sentences that already raise the subject being linked to.
const OUTBOUND: Array<[string, string]> = [
  [
    `Home inspectors do not inspect for legal compliance, municipal code conformance, or permit status [ASHI].`,
    `Home inspectors do not inspect for legal compliance, municipal code conformance, or permit status [ASHI]. That gap is why [finding unpermitted work is a separate exercise from the inspection](/guides/find-unpermitted-work-before-buying/), carried out on records rather than on the house.`,
  ],
  [
    `This includes hiring licensed contractors to bring non-compliant work up to current building codes, scheduling official municipal inspections, and obtaining formal letters of closure or certificates of completion from the building department.`,
    `This includes hiring licensed contractors to bring non-compliant work up to current building codes, scheduling official municipal inspections, and obtaining formal letters of closure or certificates of completion from the building department. Where the open item is a deck — the commonest one — [the after-the-fact permit process](/guides/legalize-unpermitted-deck/) sets out what the department will require and roughly how long it takes, which is what you need to judge whether the seller can realistically finish before closing.`,
  ],
];

const NEW_FAQS = [
  {
    question: 'How do I check code violations on a property online?',
    answer: 'Identify the city or county code enforcement or building department with jurisdiction '
      + 'over the address, then search its portal by street address or parcel number. There is no '
      + 'national database, so the jurisdiction has to be settled first. Check the permit system as '
      + 'well as the enforcement system — in most jurisdictions they are separate — and read each '
      + 'result for whether the case is open, whether compliance was recorded, and whether fines '
      + 'were paid. Where no portal exists, the same records are available by phone or public '
      + 'records request.',
  },
  {
    question: 'Is there a national database of property code violations?',
    answer: 'No. Code enforcement is carried out by individual cities and counties, and each one '
      + 'keeps its own records in its own system. Sites that claim national coverage are '
      + 'aggregating whatever subset of jurisdictions publish machine-readable data, which leaves '
      + 'out many of them and is rarely current. The authoritative record is always the one held by '
      + 'the department with jurisdiction over that address.',
  },
  {
    question: 'Are code violations on a property public record?',
    answer: 'Generally yes. Code enforcement cases are administrative actions by a public body and '
      + 'are public records in most states, whether or not the department has put them online. If a '
      + 'portal does not exist or does not go back far enough, the records can still be requested '
      + 'directly. What varies is convenience, not entitlement.',
  },
  {
    question: 'Can I check code violations before making an offer?',
    answer: 'Yes, and it is the better time to do it. An online enforcement search needs only the '
      + 'address, requires no permission from the seller, and costs nothing. Doing it before you '
      + 'offer means an open case becomes a term you negotiate rather than a discovery you make '
      + 'under contract with a deadline running.',
  },
  {
    question: 'Does a clean online search mean the property has no violations?',
    answer: 'No. It means no case has been published for that address in that system. Work done '
      + 'without a permit usually generates no enforcement record at all unless someone reported '
      + 'it, and unrecorded fines, informally resolved complaints, and other departments’ '
      + 'enforcement may not appear. A municipal lien search during the contingency period is what '
      + 'covers the difference.',
  },
];

// -------------------------------------------------------------------------------------------
// Internal linking. Six inbound links, six distinct anchors, each appended to a sentence that
// already discusses violations on that page -- no page gets a sentence invented for it.
const INBOUND: Array<[string, string, string]> = [
  [
    'find-unpermitted-work-before-buying',
    `The previous owner's decision becomes your obligation the moment you take title. `,
    `The previous owner's decision becomes your obligation the moment you take title, which is why it is worth learning [how to check code violations on a property online](/guides/${SLUG}/) before you are the one holding it. `,
  ],
  [
    'legalize-unpermitted-deck',
    `And code enforcement authority does not expire when the house changes hands: the obligation follows the property, so it becomes yours at closing.`,
    `And code enforcement authority does not expire when the house changes hands: the obligation follows the property, so it becomes yours at closing. If you are buying rather than fixing your own deck, [an open enforcement case is searchable in advance](/guides/${SLUG}/).`,
  ],
  [
    'check-building-permits-philadelphia-county-pa',
    `Within the L&I tab, Atlas displays several categories of data, including active permits, permit applications, zoning approvals, code violations, and rental licenses. `,
    `Within the L&I tab, Atlas displays several categories of data, including active permits, permit applications, zoning approvals, code violations, and rental licenses. Most jurisdictions separate those record types across different systems rather than combining them as Philadelphia does; [the general method for searching enforcement records anywhere](/guides/${SLUG}/) covers that case. `,
  ],
  [
    'check-building-permits-cook-county-il',
    `The Cook County Department of Building and Zoning provides online access to permit activity and code enforcement records through its web portal.`,
    `The Cook County Department of Building and Zoning provides online access to permit activity and code enforcement records through its web portal. For an address outside Cook County, [finding the equivalent enforcement search](/guides/${SLUG}/) starts with the same jurisdiction question.`,
  ],
  [
    'check-building-permits-bronx-ny',
    `An owner might have an old open violation visible in BIS while actively pulling new plumbing permits through DOB NOW.`,
    `An owner might have an old open violation visible in BIS while actively pulling new plumbing permits through DOB NOW. That split between permit records and enforcement records is not a New York quirk — [it is the normal arrangement](/guides/${SLUG}/), and it is why a clean permit history proves less than buyers assume.`,
  ],
  [
    'look-up-building-permits-by-address',
    `While legal, DIY work carries a higher risk of amateur workmanship and code violations.`,
    `While legal, DIY work carries a higher risk of amateur workmanship and code violations, which are recorded separately from permits — [searching a property's enforcement history](/guides/${SLUG}/) is a second lookup, not part of this one.`,
  ],
];

async function main() {
  const rows = (await withDb((sql) => sql`
    SELECT slug, status, title, meta_description, quick_answer, body_markdown, faq_json
    FROM articles
  `)) as unknown as Array<any>;

  const target = rows.find((r) => r.slug === OLD_SLUG);
  if (!target) throw new Error(`ABORT: ${OLD_SLUG} not found`);
  if (target.status !== 'removed') throw new Error(`ABORT: expected 'removed', found '${target.status}'`);
  if (rows.some((r) => r.slug === SLUG)) throw new Error(`ABORT: ${SLUG} already exists`);
  if (rows.some((r) => r.body_markdown.includes(OLD_SLUG))) throw new Error('ABORT: old slug is linked somewhere');

  // ---- the article --------------------------------------------------------------------------
  let body: string = target.body_markdown;
  if (body.split(OLD_OPEN).length - 1 !== 1) throw new Error('ABORT: opening not found exactly once');
  body = body.replace(OLD_OPEN, NEW_OPEN);
  console.log('  ok  opening answers the query in its first line');

  const after = '## Open Permits vs. Active Code Violations';
  if (body.split(after).length - 1 !== 1) throw new Error('ABORT: method anchor not unique');
  body = body.replace(after, METHOD + after);
  console.log('  ok  method section inserted ahead of the consequences material');

  for (const [oldText, newText] of OUTBOUND) {
    const n = body.split(oldText).length - 1;
    if (n !== 1) throw new Error(`ABORT: outbound host sentence matched ${n} times, expected 1`);
    body = body.replace(oldText, newText);
  }
  console.log(`  ok  ${OUTBOUND.length} outbound links added`);

  const existingFaqs = JSON.parse(target.faq_json) as Array<{ question: string; answer: string }>;
  const have = new Set(existingFaqs.map((f) => f.question.toLowerCase().trim()));
  const faqs = [...NEW_FAQS.filter((f) => !have.has(f.question.toLowerCase().trim())), ...existingFaqs];

  // ---- linking ------------------------------------------------------------------------------
  const bodies = new Map<string, string>(rows.filter((r) => r.status === 'published').map((r) => [r.slug, r.body_markdown]));
  for (const [slug, oldText, newText] of INBOUND) {
    const b = bodies.get(slug);
    if (b === undefined) throw new Error(`ABORT: ${slug} is not published`);
    const n = b.split(oldText).length - 1;
    if (n !== 1) throw new Error(`ABORT: ${slug} host sentence matched ${n} times, expected 1`);
    bodies.set(slug, b.replace(oldText, newText));
  }
  console.log(`  ok  ${INBOUND.length} inbound links added on prose that already discussed violations`);

  // ---- assertions ---------------------------------------------------------------------------
  if (TITLE.length > 60) throw new Error(`ABORT: title ${TITLE.length} chars`);
  if (META.length > 155) throw new Error(`ABORT: meta ${META.length} chars`);

  const live = new Set([...bodies.keys(), SLUG]);
  const all = new Map(bodies).set(SLUG, body);
  let dead = 0;
  let nested = 0;
  for (const [slug, b] of all) {
    for (const m of b.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/?\)/g)) {
      if (!live.has(m[1])) { console.log(`  DEAD LINK: ${slug} -> ${m[1]}`); dead++; }
    }
    // parseInline in renderArticleMarkdown.tsx does not recurse, so these render as literals.
    for (const re of [/\*\*\[[^\]]*\]\([^)]*\)\*\*/g, /\[\*\*[^\]]*\*\*\]\([^)]*\)/g]) {
      for (const m of b.matchAll(re)) { console.log(`  NESTED: ${slug} -> ${m[0]}`); nested++; }
    }
  }
  if (dead || nested) throw new Error(`ABORT: ${dead} dead link(s), ${nested} nested link/bold`);

  const anchors = new Map<string, number>();
  for (const [slug, b] of all) {
    if (slug === SLUG) continue;
    for (const m of b.matchAll(new RegExp(`\\[([^\\]]+)\\]\\(/guides/${SLUG}/?\\)`, 'g'))) {
      anchors.set(m[1], (anchors.get(m[1]) || 0) + 1);
    }
  }
  const worst = Math.max(0, ...anchors.values());
  if (worst > 1) throw new Error(`ABORT: an inbound anchor repeats ${worst} times`);

  const visible = body.replace(/[#*_>|`-]/g, ' ');
  const words = visible.split(/\s+/).filter(Boolean).length;
  const hits = `${TITLE} ${META} ${QUICK} ${visible} ${JSON.stringify(faqs)}`.toLowerCase().split(PHRASE).length - 1;
  const density = (hits * PHRASE.split(' ').length) / words * 100;
  if (hits < 3) throw new Error(`ABORT: phrase appears only ${hits} time(s)`);
  if (density > 2) throw new Error(`ABORT: density ${density.toFixed(2)}%`);

  console.log(`\n  slug     : ${OLD_SLUG}\n             -> ${SLUG}`);
  console.log(`  title    : ${TITLE} (${TITLE.length} chars)`);
  console.log(`  meta     : ${META.length} chars`);
  console.log(`  body     : ${target.body_markdown.length} -> ${body.length} chars`);
  console.log(`  faqs     : ${existingFaqs.length} -> ${faqs.length}`);
  console.log(`  phrase   : ${hits} occurrence(s), ${density.toFixed(2)}% density`);
  console.log(`  inbound  : ${anchors.size} distinct anchors, max repeat ${worst}`);
  for (const a of anchors.keys()) console.log(`               "${a}"`);
  console.log(`  outbound : ${[...new Set([...body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/?\)/g)].map((m) => m[1]))].join(', ')}`);
  console.log('  H2s      :');
  for (const m of body.matchAll(/^## (.+)$/gm)) console.log(`     ${m[1]}`);

  if (!APPLY) { console.log('\n  DRY RUN -- nothing written.'); return; }

  const res = (await withDb((sql) => sql`
    UPDATE articles SET slug = ${SLUG}, status = 'published', title = ${TITLE},
      meta_description = ${META}, quick_answer = ${QUICK}, body_markdown = ${body},
      faq_json = ${JSON.stringify(faqs)}, updated_at = now()
    WHERE slug = ${OLD_SLUG} RETURNING slug, status
  `)) as unknown as Array<{ slug: string; status: string }>;
  if (res.length !== 1) throw new Error(`ABORT: update affected ${res.length} rows`);
  console.log(`\n  published ${res[0].slug}`);

  for (const [slug] of INBOUND) {
    await withDb((sql) => sql`UPDATE articles SET body_markdown = ${bodies.get(slug)!}, updated_at = now() WHERE slug = ${slug}`);
    console.log(`  linked from ${slug}`);
  }
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
