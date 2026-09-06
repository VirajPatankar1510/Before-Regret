// Covers "historical building permits database" on the permits hub, and picks up two orphans.
//
//   npx tsx scripts/add-historical-permits-database.ts            # dry run
//   APPLY=true npx tsx scripts/add-historical-permits-database.ts
//
// -------------------------------------------------------------------------------------------
// THE EVIDENCE HERE IS WEAKER THAN THE LAST TWO REQUESTS, AND THAT CHANGES THE TREATMENT.
//
// The phrase is absent from all 158 rows. But unlike the previous two phrases, Search Console
// shows NOTHING behind it -- across 92 days and 472 query+page pairs there are zero impressions
// for any query containing database, archive, historic, older home, or "how far back". Compare:
//
//     "check code violations on a property online"  -> Philadelphia ranking 6.0-9.5 generic
//     "open permit search by address"               -> hub already at 11.0
//     "historical building permits database"        -> nothing at all
//
// So this is not treated as a third ranking target. Two reasons beyond the missing demand:
//
//   1. It is a SYNONYM, not a new intent. "Historical building permits database" and the hub's
//      primary phrase "building permit history lookup by address" mean the same thing to a
//      searcher: find the old permits on this house. Giving a synonym its own page splits one
//      intent across two URLs.
//   2. That split is a mistake this project has already made and already paid for. server.ts's
//      MERGED_GUIDES comment records it: check-building-permit-history-by-address-any-us-county
//      and look-up-building-permits-by-address both answered "how do I check permits by address",
//      and across 28 days Google handed 39 generic permit queries to the PHILADELPHIA page at
//      position 9.9 while the two real pages sat at 58.3 and 90.0. The draft twin of that page
//      was deleted an hour ago. Writing a new near-duplicate now would rebuild it.
//
// So the phrase gets prose and an FAQ on the page that already owns the subject. Title and meta
// keep the primary phrase; nothing is retargeted.
//
// WHAT IS GENUINELY MISSING, and is worth adding on its own merits: the hub states the
// digitisation cutoff in one sentence and never answers the question a reader on an older home
// actually has -- is there a database, and how far back does it go. "how far back" appears once
// in 44 published guides, "records retention" and "old permits" zero times.
//
// -------------------------------------------------------------------------------------------
// INTERNAL LINKING: TWO ORPHANS PICKED UP, and they are the point of this pass as much as the
// phrase is. 16 of 44 published guides have no inbound internal link at all. The standing rule
// has been to link them only where the prose earns it rather than manufacturing sentences, which
// is why they have stayed orphaned. This section earns two honestly:
//
//   us-housing-age-ranking-oldest-vs-newest-counties -- the digitisation gap matters most in
//     counties whose housing predates 1950, which is exactly what that ranking measures.
//   get-clue-report-before-buying-house -- CLUE is the nearest thing to a national property
//     database a buyer actually meets, and it gets confused with this one. Naming the difference
//     is useful to the reader, not just a link.
//
// Both claims were verified against those articles before writing: CLUE holds seven years of
// insurance claims and a buyer cannot order one directly; Kings County NY leads at 55.6% pre-1950.
import 'dotenv/config';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';
const HUB = 'look-up-building-permits-by-address';
const PHRASE = 'historical building permits database';
// Both existing targets are asserted below so this edit cannot quietly starve either one.
const HELD = ['building permit history lookup by address', 'open permit search by address'];

// The existing H2 and its first paragraph. The paragraph already carries the digitisation cutoff
// and the microfiche point, so this merges rather than prepends -- otherwise the section would
// state the same fact twice, three paragraphs apart.
const OLD = `## What to Do When There Is No Online Portal

Digital portals do not always tell the whole story. In many jurisdictions, online records only date back to the late 1990s or early 2000s. If you are researching an older home, historical permits for major structural changes, electrical overhauls, or plumbing repipes may only exist on microfiche, paper cards, or legacy databases.`;

const NEW = `## Is There a Historical Building Permits Database?

No — not a national one. There is no historical building permits database covering the United States, and in most states no state-level equivalent either. Permits are issued by individual cities and counties, each keeping its own records in its own system, and no higher authority consolidates them. When people search for a historical building permits database they usually mean one of two things: their own jurisdiction's portal, which does exist in most places, or a commercial aggregator, which resells whatever subset of jurisdictions publish machine-readable data and is rarely complete or current.

The more useful question is how far back the local record reaches. Where a portal exists, its coverage generally begins at digitisation — commonly the late 1990s or early 2000s — so for anything built before then the online record is partial by construction. If you are researching an older home, historical permits for major structural changes, electrical overhauls, or plumbing repipes may only exist on microfiche, paper cards, or legacy systems. The gap bites hardest where it is least convenient: in [counties where much of the housing predates 1950](/guides/us-housing-age-ranking-oldest-vs-newest-counties/), the decades that matter most for structural and electrical work sit entirely behind the counter.

One near-miss is worth naming, because the two get confused. A [CLUE report](/guides/get-clue-report-before-buying-house/) does draw on a genuinely national system — but it holds seven years of insurance claims rather than permits, and a buyer cannot order one for a house they do not yet own. Different question, different office, and no substitute for the building department.`;

const FAQ = {
  question: 'Is there a national historical building permits database?',
  answer: 'No. Building permits are issued and held by individual cities and counties, and no '
    + 'federal or state body consolidates them into a single historical building permits database. '
    + 'Where a local portal exists, its coverage usually begins at digitisation — often the late '
    + '1990s or early 2000s — so older permits commonly survive only as microfiche, paper cards or '
    + 'legacy systems held at the department itself. Commercial sites advertising national coverage '
    + 'are aggregating whatever subset of jurisdictions publishes open data, and are rarely '
    + 'complete or current.',
};

async function main() {
  const rows = (await withDb((sql) => sql`
    SELECT slug, status, title, meta_description, quick_answer, body_markdown, faq_json
    FROM articles WHERE status = 'published'
  `)) as unknown as Array<any>;
  const hubRow = rows.find((r) => r.slug === HUB);
  if (!hubRow) throw new Error(`ABORT: ${HUB} not published`);

  let body: string = hubRow.body_markdown;
  if (body.toLowerCase().includes(PHRASE)) throw new Error('ABORT: phrase already present');
  if (body.split(OLD).length - 1 !== 1) throw new Error('ABORT: section not found exactly once');
  body = body.replace(OLD, NEW);
  console.log('  ok  section rewritten to answer the question, digitisation point de-duplicated');

  const faqs = JSON.parse(hubRow.faq_json) as Array<{ question: string; answer: string }>;
  if (faqs.some((f) => f.question.toLowerCase().includes(PHRASE))) throw new Error('ABORT: FAQ exists');
  faqs.push(FAQ);
  console.log('  ok  FAQ carries the exact phrase');

  // ---- assertions ---------------------------------------------------------------------------
  const live = new Set(rows.map((r) => r.slug));
  const targets = [...new Set([...body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/?\)/g)].map((m) => m[1]))];
  const deadLinks = targets.filter((t) => !live.has(t));
  if (deadLinks.length) throw new Error(`ABORT: dead link(s): ${deadLinks.join(', ')}`);

  for (const re of [/\*\*\[[^\]]*\]\([^)]*\)\*\*/g, /\[\*\*[^\]]*\*\*\]\([^)]*\)/g]) {
    const hit = body.match(re);
    if (hit) throw new Error(`ABORT: nested link/bold: ${hit[0]}`);
  }

  // The two orphans must actually be linked now, or the linking half of this pass did nothing.
  for (const orphan of ['us-housing-age-ranking-oldest-vs-newest-counties', 'get-clue-report-before-buying-house']) {
    if (!targets.includes(orphan)) throw new Error(`ABORT: ${orphan} not linked`);
  }

  const visible = body.replace(/[#*_>|`-]/g, ' ');
  const words = visible.split(/\s+/).filter(Boolean).length;
  const blob = `${hubRow.title} ${hubRow.meta_description} ${hubRow.quick_answer} ${visible} ${JSON.stringify(faqs)}`.toLowerCase();
  for (const p of [PHRASE, ...HELD]) {
    const hits = blob.split(p).length - 1;
    const density = (hits * p.split(' ').length) / words * 100;
    if (hits < 3) throw new Error(`ABORT: "${p}" appears only ${hits} time(s)`);
    if (density > 2) throw new Error(`ABORT: "${p}" density ${density.toFixed(2)}%`);
    console.log(`  phrase   : "${p}" x${hits}, ${density.toFixed(2)}%`);
  }

  // Recount orphans across the whole library so the report states the real remaining number.
  const bodies = new Map(rows.map((r) => [r.slug, r.slug === HUB ? body : r.body_markdown]));
  const linked = new Set<string>();
  for (const [slug, b] of bodies) {
    for (const m of b.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/?\)/g)) if (m[1] !== slug) linked.add(m[1]);
  }
  const orphans = [...bodies.keys()].filter((s) => !linked.has(s));

  console.log(`\n  hub body : ${hubRow.body_markdown.length} -> ${body.length} chars`);
  console.log(`  hub faqs : ${faqs.length - 1} -> ${faqs.length}`);
  console.log(`  orphans  : 16 -> ${orphans.length} published guides with no inbound link`);
  console.log('  H2s      :');
  for (const m of body.matchAll(/^## (.+)$/gm)) console.log(`     ${m[1]}`);

  if (!APPLY) { console.log('\n  DRY RUN -- nothing written.'); return; }

  const res = (await withDb((sql) => sql`
    UPDATE articles SET body_markdown = ${body}, faq_json = ${JSON.stringify(faqs)}, updated_at = now()
    WHERE slug = ${HUB} RETURNING slug`)) as unknown as Array<{ slug: string }>;
  if (res.length !== 1) throw new Error(`ABORT: update affected ${res.length} rows`);
  console.log(`\n  updated ${HUB}`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
