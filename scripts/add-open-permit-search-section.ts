// Adds "open permit search by address" to the permits hub, and repairs two link defects.
//
//   npx tsx scripts/add-open-permit-search-section.ts            # dry run
//   APPLY=true npx tsx scripts/add-open-permit-search-section.ts
//
// -------------------------------------------------------------------------------------------
// WHY THIS IS AN EDIT TO THE HUB AND NOT A NEW ARTICLE.
//
// The exact phrase appears nowhere in the 159-row corpus, and no page is ABOUT open permits --
// "open permit" is scattered across 13 published guides and "unclosed permit" appears zero times.
// On the face of it that reads like a gap wanting a new article. Search Console says otherwise:
//
//     "how to find open permits on a house"    pos 11.0  -> look-up-building-permits-by-address
//     "cook county permit status"              pos 18.0  -> check-building-permits-cook-county-il
//     "how to check for open permits ... "     pos 56.6  -> check-building-permits-miami-dade-county-fl
//
// Google has ALREADY mapped open-permit intent onto the hub, and put it at position 11 -- striking
// distance, one page-one slot away. A new article would be built to compete with a page of ours
// that is already nearly ranking for the thing, on a domain where 17 published guides have never
// been shown at all. Strengthening the page Google has already chosen is the cheaper win.
//
// It is also not a dilution of the retarget shipped two commits ago. The hub's primary phrase is
// "building permit history lookup by address"; this one is "open permit search by address". Same
// noun, same "by address", narrower filter -- and the hub's own quick answer ALREADY promises this
// content ("what was permitted and never finalled, which is a different and commoner problem than
// work with no permit at all") while the body never delivers a section on it. This closes a
// promise the page already makes rather than bolting on a second subject.
//
// The primary phrase is left in sole possession of the title and meta. The new phrase gets an H2,
// body copy and an FAQ, which is the right weight for a secondary target.
//
// -------------------------------------------------------------------------------------------
// AND THE SAME STRUCTURAL FAULT, A THIRD TIME. Generic queries are landing on a county page:
//
//     "permit search by address"        pos 8.5  -> check-building-permits-philadelphia-county-pa
//     "look up permits by address"      pos 7.3  -> check-building-permits-philadelphia-county-pa
//     "permit look up by address"       pos 9.0  -> check-building-permits-philadelphia-county-pa
//
// while the hub sits at 47.7 for "building permit search". Philadelphia should hold
// "philadelphia l&i permit search by address" (9 impressions, pos 10.1) and give up the rest.
// Nothing here forces that, but every link added below points open-permit intent at the hub.
//
// -------------------------------------------------------------------------------------------
// TWO LINK DEFECTS REPAIRED, both found while checking the anchor inventory:
//
//   1. Philadelphia links to the hub TWICE. The second anchor quotes the hub's OLD title verbatim
//      -- "How to Check Building Permit History by Address in Any US County" -- which stopped
//      being the title in the retarget two commits ago. An anchor quoting a title that no longer
//      exists is stale on its face, so it is rewritten descriptively.
//   2. The hub does not link to legalize-unpermitted-deck at all, despite closing out an open
//      permit being exactly what that guide documents. The new section earns that link honestly.
import 'dotenv/config';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';
const HUB = 'look-up-building-permits-by-address';
const PHRASE = 'open permit search by address';
const PRIMARY = 'building permit history lookup by address';

// Goes after "Deciphering Permit Statuses" -- which already defines what an open permit is and how
// one gets closed -- so this covers the SEARCH and the transaction, not the definition again.
const SECTION = `## Open Permit Search by Address

An open permit search by address is the same lookup narrowed to one question: not what was built here, but what was started here and never signed off. It is worth running deliberately, because it is the commonest real finding in permit research and the easiest to read past.

**Run the search, then filter by status.** Few portals offer a dedicated open-permit filter. Most return the property's entire permit history and leave you to read the status column, which is why the step is skipped so often — the record is right there, in a list of twelve rows, in a column nobody told you mattered. Sort or scan by status rather than by date.

**Treat more than one status as open.** This is where the search usually fails. "Expired" is not "closed": an expired permit is an open permit that ran out of time, and the work behind it was never inspected either. Depending on the jurisdiction, issued, active, in progress, pending final, pending inspection and expired all describe a file the municipality has not finished with. Only an explicit finaled, closed, completed or CO-issued status means the department signed off.

**Search by address, not by owner name.** Permits attach to the property and outlive the people who pulled them. An owner-name search returns what the current seller filed and silently omits everything the three owners before them left open, which is generally the older and more interesting half of the record.

**Know what an empty result means.** No open permits found is a narrower statement than it sounds. It means nothing is open in that system for that address format — it does not mean the work was permitted, because work done with no permit at all leaves no open permit behind. An empty result and a clean house are different findings.

### Why it matters more to a seller than they expect

Buyers run this search to price a risk. Sellers often meet it as an emergency: the buyer's title company flags an open permit from 2009, and the closing cannot proceed until the file is resolved. Resolution runs through the same municipal queue as any other inspection, so it is measured in weeks — a renewal permit, sometimes exposing finished work, then an inspection slot. Where the open item is a deck, which is the commonest one, [the after-the-fact permit process](/guides/legalize-unpermitted-deck/) sets out what the department will want to see.

Running the search early is what turns that emergency into a scheduling problem.

`;

const FAQ = {
  question: 'How do I run an open permit search by address?',
  answer: 'Search the building department that has jurisdiction over the property, then read the '
    + 'status column on every result rather than only the most recent permit. Most portals have no '
    + 'dedicated open-permit filter, so the filtering is yours to do. Treat issued, active, in '
    + 'progress, pending final and expired as open — an expired permit is an open permit that ran '
    + 'out of time — and treat only finaled, closed or completed as signed off. Search by address '
    + 'rather than owner name, because permits stay with the property when the owners change.',
};

// Anchor for the insertion point.
const AFTER = '## What to Look For in a Permit Record';

// -------------------------------------------------------------------------------------------
// Link repairs and additions. Only two new inbound links: every permits page already links to the
// hub once, and stacking a second link on all of them would be a footprint rather than a signal.
// These two are the pages whose open-permit prose genuinely earns a differently-scoped anchor.
const EDITS: Array<[string, string, string, string]> = [
  [
    'check-building-permits-philadelphia-county-pa',
    'stale anchor quoting the hub\'s old title, rewritten descriptively',
    `[How to Check Building Permit History by Address in Any US County](/guides/${HUB}/)`,
    `[the permit lookup process for any US county](/guides/${HUB}/)`,
  ],
  [
    'check-building-permits-clark-county-nv',
    'open-permit sentence now points at the open-permit section',
    `An open permit leaves the legal liability unresolved, and local building authorities may require a new inspection or corrective work before closing out the file.`,
    `An open permit leaves the legal liability unresolved, and local building authorities may require a new inspection or corrective work before closing out the file. [Running an open permit search by address](/guides/${HUB}/) works the same way in any jurisdiction, and the statuses that count as open are not always labelled that way.`,
  ],
  [
    'check-code-violations-property-online',
    'the open-permit definition now links to how you search for one',
    `While an open permit indicates that the owner initially intended to follow local building codes, the lack of a final municipal sign-off means the municipality never confirmed that the work was completed safely or up to code.`,
    `While an open permit indicates that the owner initially intended to follow local building codes, the lack of a final municipal sign-off means the municipality never confirmed that the work was completed safely or up to code. [Finding the ones left open on a given address](/guides/${HUB}/) is a matter of reading the status column rather than the permit list.`,
  ],
];

async function main() {
  const rows = (await withDb((sql) => sql`
    SELECT slug, status, title, meta_description, quick_answer, body_markdown, faq_json
    FROM articles WHERE status = 'published'
  `)) as unknown as Array<any>;
  const bodies = new Map<string, string>(rows.map((r) => [r.slug, r.body_markdown]));
  const hubRow = rows.find((r) => r.slug === HUB);
  if (!hubRow) throw new Error(`ABORT: ${HUB} not published`);

  // ---- the section ---------------------------------------------------------------------------
  let hub = bodies.get(HUB)!;
  if (hub.toLowerCase().includes(PHRASE)) throw new Error('ABORT: phrase already present');
  if (hub.split(AFTER).length - 1 !== 1) throw new Error('ABORT: insertion anchor not unique');
  hub = hub.replace(AFTER, SECTION + AFTER);
  bodies.set(HUB, hub);
  console.log('  ok  open-permit section inserted after the status material');

  const faqs = JSON.parse(hubRow.faq_json) as Array<{ question: string; answer: string }>;
  if (faqs.some((f) => f.question.toLowerCase().includes(PHRASE))) throw new Error('ABORT: FAQ exists');
  faqs.splice(1, 0, FAQ);
  console.log('  ok  FAQ carries the exact phrase');

  // ---- link repairs --------------------------------------------------------------------------
  for (const [slug, note, oldText, newText] of EDITS) {
    const b = bodies.get(slug);
    if (b === undefined) throw new Error(`ABORT: ${slug} not published`);
    const n = b.split(oldText).length - 1;
    if (n !== 1) throw new Error(`ABORT: ${slug} -- "${note}" matched ${n} times, expected 1`);
    bodies.set(slug, b.replace(oldText, newText));
    console.log(`  ok  ${slug}: ${note}`);
  }

  // ---- assertions ----------------------------------------------------------------------------
  const live = new Set(bodies.keys());
  let dead = 0;
  let nested = 0;
  for (const [slug, b] of bodies) {
    for (const m of b.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/?\)/g)) {
      if (!live.has(m[1])) { console.log(`  DEAD LINK: ${slug} -> ${m[1]}`); dead++; }
    }
    // parseInline in renderArticleMarkdown.tsx does not recurse; these would render as literals.
    for (const re of [/\*\*\[[^\]]*\]\([^)]*\)\*\*/g, /\[\*\*[^\]]*\*\*\]\([^)]*\)/g]) {
      for (const m of b.matchAll(re)) { console.log(`  NESTED: ${slug} -> ${m[0]}`); nested++; }
    }
  }
  if (dead || nested) throw new Error(`ABORT: ${dead} dead link(s), ${nested} nested link/bold`);

  const anchors = new Map<string, number>();
  for (const [slug, b] of bodies) {
    if (slug === HUB) continue;
    for (const m of b.matchAll(new RegExp(`\\[([^\\]]+)\\]\\(/guides/${HUB}/?\\)`, 'g'))) {
      anchors.set(m[1], (anchors.get(m[1]) || 0) + 1);
    }
  }
  const worst = Math.max(0, ...anchors.values());
  if (worst > 1) throw new Error(`ABORT: an inbound anchor repeats ${worst} times`);

  // Both phrases are measured. The new one must land, and the primary one must not be pushed
  // below its own floor by the words added around it.
  const visible = hub.replace(/[#*_>|`-]/g, ' ');
  const words = visible.split(/\s+/).filter(Boolean).length;
  const blob = `${hubRow.title} ${hubRow.meta_description} ${hubRow.quick_answer} ${visible} ${JSON.stringify(faqs)}`.toLowerCase();
  const report: Record<string, [number, number]> = {};
  for (const p of [PHRASE, PRIMARY]) {
    const hits = blob.split(p).length - 1;
    const density = (hits * p.split(' ').length) / words * 100;
    report[p] = [hits, density];
    if (hits < 3) throw new Error(`ABORT: "${p}" appears only ${hits} time(s)`);
    if (density > 2) throw new Error(`ABORT: "${p}" density ${density.toFixed(2)}%`);
  }

  console.log(`\n  hub body : ${hubRow.body_markdown.length} -> ${hub.length} chars`);
  console.log(`  hub faqs : ${faqs.length - 1} -> ${faqs.length}`);
  for (const [p, [h, d]] of Object.entries(report)) console.log(`  phrase   : "${p}" x${h}, ${d.toFixed(2)}%`);
  console.log(`  inbound  : ${anchors.size} distinct anchors to the hub, max repeat ${worst}`);
  console.log(`  outbound : ${[...new Set([...hub.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/?\)/g)].map((m) => m[1]))].length} distinct targets`);
  console.log('  H2s      :');
  for (const m of hub.matchAll(/^## (.+)$/gm)) console.log(`     ${m[1]}`);

  if (!APPLY) { console.log('\n  DRY RUN -- nothing written.'); return; }

  await withDb((sql) => sql`
    UPDATE articles SET body_markdown = ${hub}, faq_json = ${JSON.stringify(faqs)}, updated_at = now()
    WHERE slug = ${HUB}`);
  console.log(`\n  updated ${HUB}`);
  for (const [slug] of EDITS) {
    await withDb((sql) => sql`UPDATE articles SET body_markdown = ${bodies.get(slug)!}, updated_at = now() WHERE slug = ${slug}`);
    console.log(`  updated ${slug}`);
  }
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
