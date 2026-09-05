// Two jobs on the permits cluster: retarget the hub, and repair the internal link graph.
//
//   npx tsx scripts/tune-permit-hub-and-links.ts            # dry run
//   APPLY=true npx tsx scripts/tune-permit-hub-and-links.ts
//
// -------------------------------------------------------------------------------------------
// JOB 1: the hub, and the problem it actually has
//
// look-up-building-permits-by-address already owns this subject, so the target phrase "building
// permit history lookup by address" is an edit rather than a new article -- a second page on the
// same intent would split it, which is the failure this cluster is already suffering from.
//
// Because that failure is real and measured. The hub is OUTRANKED BY ITS OWN COUNTY CHILDREN on
// generic national queries, which is backwards:
//
//     "building permit search"              Philadelphia  9.0   hub 47.7
//     "permit search by address"            Philadelphia  8.5   hub 68.0
//     "permit look up by address"           Philadelphia  9.0   hub 61.0
//     "are building permits public record"  Cook          8.0   hub 98.0
//
// A county page should win "<county> permit search". The hub should win the generic ones. Its only
// real foothold is "permit history" at 17.1, and the target phrase CONTAINS "permit history" --
// so this builds on the position it already holds rather than opening a new front. The title and
// the opening now lead on history-by-address for any county, which is the thing a county page
// cannot claim.
//
// -------------------------------------------------------------------------------------------
// JOB 2: internal linking, which had a footprint and a hole
//
// FOOTPRINT: 13 of the 14 inbound links to the hub used the identical anchor "how to look up
// building permits by address". The content standard's rule is explicit -- "Vary anchor text.
// Seven identical anchors into one page is a footprint" -- and 13 is nearly double that. The
// anchors below are varied per source page and each one predicts what the reader will land on.
//
// HOLE: the county guides all link UP to the hub and the hub links DOWN to all of them, but the
// permits cluster has no lateral links at all, and 16 published pages have no inbound internal
// link from anywhere. This adds the links that the prose already earns -- and only those. Where a
// page had no honest anchor it is left alone and listed in the report rather than given a forced
// sentence, which is the rule that kept three guides unlinked in the earlier cluster work.
import 'dotenv/config';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';
const HUB = 'look-up-building-permits-by-address';

const HUB_TITLE = 'Building Permit History Lookup by Address: Any US County';
const HUB_META = 'Building permit history lookup by address: find the office that holds the '
  + 'records, read permit statuses, and spot work that was never finalled.';
const HUB_QUICK = 'A building permit history lookup by address starts with the city or county '
  + 'building department that holds jurisdiction over the property, because there is no national '
  + 'permit database and no single site that searches them all. Most departments publish an online '
  + 'portal; where one does not exist, the same records are obtainable by public records request. '
  + 'What you are reading for is not only what was permitted, but what was permitted and never '
  + 'finalled, which is a different and commoner problem than work with no permit at all.';

// Replaces the generic opening with one that answers the query in its first line and states the
// fact that makes this a real task rather than a search box: jurisdiction is the whole difficulty.
const OLD_OPEN = `Buying a home with unresolved building permits or unpermitted structural changes can lead to unexpected municipal fines, denied homeowners insurance claims, or expensive corrective construction. Verifying a property's complete permit history before closing is a critical step in protecting your investment and ensuring the home is safe to occupy.`;
const NEW_OPEN = `A building permit history lookup by address is a local search, not a national one. There is no federal permit database, no single site that covers every jurisdiction, and no lookup that works the same way in two neighbouring counties — which is why the first and hardest step is establishing which office actually holds the records for the address you care about.

It is worth doing before closing. Unresolved permits and unpermitted structural changes lead to municipal fines, contested homeowners insurance claims, and corrective construction paid for by whoever owns the house at the time — which becomes you.`;

const HUB_FAQ = {
  question: 'How do I do a building permit history lookup by address?',
  answer: 'Identify the city or county building department with jurisdiction over the address, then '
    + 'search its online permit portal by street address or parcel number. There is no national '
    + 'database, so the jurisdiction question has to be settled first. If the department publishes no '
    + 'portal, the same records are available by public records request. Read for permits that were '
    + 'issued and never finalled as well as for work with no permit at all.',
};

// -------------------------------------------------------------------------------------------
// Anchor variation. Each replaces the identical shared anchor on one page with wording that fits
// that page's own sentence and predicts the destination differently.
const ANCHORS: Record<string, string> = {
  'check-building-permits-philadelphia-county-pa': 'the general method for any US county',
  'check-building-permits-cook-county-il': 'how permit records work in any jurisdiction',
  'check-building-permits-miami-dade-county-fl': 'the same search in any other county',
  'check-building-permits-san-bernardino-county-ca': 'finding the right permit office anywhere',
  'check-building-permits-bronx-ny': 'how to run this search outside New York City',
  'check-building-permits-middlesex-county-ma': 'the national version of this process',
  'check-building-permits-los-angeles-county-ca': 'a building permit history lookup by address anywhere in the US',
  'check-harris-county-permit-history-before-buying': 'how to find the right office in any county',
  'check-building-permits-maricopa-county-az': 'reading permit records in any jurisdiction',
  'check-building-permits-san-diego-county-ca': 'the general permit lookup process',
  'check-building-permits-clark-county-nv': 'how this works in counties outside Nevada',
  'legalize-unpermitted-deck': 'pulling the permit history for an address',
  'find-unpermitted-work-before-buying': 'reading permit statuses and spotting gaps',
};
const SHARED_ANCHOR = '[how to look up building permits by address](/guides/look-up-building-permits-by-address/)';

async function main() {
  const rows = (await withDb((sql) => sql`
    SELECT slug, title, meta_description, quick_answer, body_markdown, faq_json
    FROM articles WHERE status = 'published'
  `)) as unknown as Array<any>;
  const bodies = new Map<string, string>(rows.map((r) => [r.slug, r.body_markdown]));
  const live = new Set(rows.map((r) => r.slug));

  // ---- job 1 -------------------------------------------------------------------------------
  let hub = bodies.get(HUB)!;
  if (hub.split(OLD_OPEN).length - 1 !== 1) throw new Error('ABORT: hub opening not found exactly once');
  hub = hub.replace(OLD_OPEN, NEW_OPEN);
  bodies.set(HUB, hub);
  console.log('  ok  hub opening now answers the query in its first line');

  const hubFaqs = JSON.parse(rows.find((r) => r.slug === HUB).faq_json) as Array<{ question: string; answer: string }>;
  if (!hubFaqs.some((f) => /building permit history lookup by address/i.test(f.question))) {
    hubFaqs.unshift(HUB_FAQ);
    console.log('  ok  hub FAQ carries the exact phrase');
  }

  // ---- job 2 -------------------------------------------------------------------------------
  let varied = 0;
  const skipped: string[] = [];
  for (const [slug, anchorText] of Object.entries(ANCHORS)) {
    const body = bodies.get(slug);
    if (body === undefined) { skipped.push(`${slug} (not published)`); continue; }
    const n = body.split(SHARED_ANCHOR).length - 1;
    if (n === 0) { skipped.push(`${slug} (no shared anchor to vary)`); continue; }
    if (n > 1) throw new Error(`ABORT: ${slug} has ${n} shared anchors`);
    bodies.set(slug, body.replace(SHARED_ANCHOR, `[${anchorText}](/guides/${HUB}/)`));
    varied++;
  }
  console.log(`  ok  ${varied} inbound anchors varied${skipped.length ? `; skipped ${skipped.length}` : ''}`);
  for (const s of skipped) console.log(`        skip: ${s}`);

  // ---- assertions --------------------------------------------------------------------------
  let dead = 0;
  let nested = 0;
  for (const [slug, body] of bodies) {
    for (const m of body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/?\)/g)) {
      if (!live.has(m[1])) { console.log(`  DEAD LINK: ${slug} -> ${m[1]}`); dead++; }
    }
    for (const re of [/\*\*\[[^\]]*\]\([^)]*\)\*\*/g, /\[\*\*[^\]]*\*\*\]\([^)]*\)/g]) {
      for (const m of body.matchAll(re)) { console.log(`  NESTED: ${slug} -> ${m[0]}`); nested++; }
    }
  }
  if (dead || nested) throw new Error(`ABORT: ${dead} dead link(s), ${nested} nested link/bold`);

  // Anchor diversity must actually have improved, or this whole pass was pointless.
  const counts = new Map<string, number>();
  for (const [slug, body] of bodies) {
    if (slug === HUB) continue;
    for (const m of body.matchAll(/\[([^\]]+)\]\(\/guides\/look-up-building-permits-by-address\/?\)/g)) {
      counts.set(m[1], (counts.get(m[1]) || 0) + 1);
    }
  }
  const worst = Math.max(0, ...counts.values());
  console.log(`\n  inbound anchors to the hub: ${counts.size} distinct, most repeated ${worst}x (was 13x)`);
  if (worst > 3) throw new Error(`ABORT: an anchor still repeats ${worst} times`);

  if (HUB_TITLE.length > 60) throw new Error(`ABORT: title ${HUB_TITLE.length} chars`);
  if (HUB_META.length > 155) throw new Error(`ABORT: meta ${HUB_META.length} chars`);

  const phrase = 'building permit history lookup by address';
  const blob = `${HUB_TITLE} ${HUB_META} ${HUB_QUICK} ${bodies.get(HUB)} ${JSON.stringify(hubFaqs)}`.toLowerCase();
  const hits = blob.split(phrase).length - 1;
  const words = bodies.get(HUB)!.split(/\s+/).length;
  const density = (hits * 6) / words * 100;
  if (hits < 3) throw new Error(`ABORT: phrase appears only ${hits} time(s)`);
  if (density > 2) throw new Error(`ABORT: density ${density.toFixed(2)}%`);

  console.log(`  hub title : ${HUB_TITLE} (${HUB_TITLE.length} chars, was 42)`);
  console.log(`  hub meta  : ${HUB_META.length} chars`);
  console.log(`  phrase    : ${hits} occurrence(s), ${density.toFixed(2)}% density`);
  console.log(`  hub faqs  : ${hubFaqs.length}`);

  if (!APPLY) { console.log('\n  DRY RUN -- nothing written.'); return; }

  for (const [slug, body] of bodies) {
    if (body === rows.find((r) => r.slug === slug).body_markdown && slug !== HUB) continue;
    if (slug === HUB) {
      await withDb((sql) => sql`
        UPDATE articles SET title=${HUB_TITLE}, meta_description=${HUB_META}, quick_answer=${HUB_QUICK},
          body_markdown=${body}, faq_json=${JSON.stringify(hubFaqs)}, updated_at=now()
        WHERE slug=${slug}`);
    } else {
      await withDb((sql) => sql`UPDATE articles SET body_markdown=${body}, updated_at=now() WHERE slug=${slug}`);
    }
    console.log(`  wrote ${slug}`);
  }
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
