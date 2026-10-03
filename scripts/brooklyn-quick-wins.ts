// Brooklyn guide (#94), reader-review additions, 2026-10-03 -- each verified at the primary source today.
//
//   npx tsx scripts/brooklyn-quick-wins.ts            # dry run
//   APPLY=true npx tsx scripts/brooklyn-quick-wins.ts
//
// TAKEN from the review, made Brooklyn-specific:
//   - A glossary, but of the terms a buyer meets in LPC records -- the three permit types, read on
//     LPC's own pages (certificate-of-no-effect, permit-for-minor-work, certificate-of-appropriateness),
//     incl. "brownstone resurfacing" as LPC's own PMW example and "about 95% ... issued by the staff".
//   - The lead-line cross-link, carried by real NYC content rather than a bolted-on sentence: DEP's
//     "Lead and Drinking Water" page -- homeowners own the whole service line; lead service lines banned
//     since 1961, lead in household plumbing since 1987; the NYC Service Line Map; free test kit via 311.
//   - An unpermitted-work link where the text already discusses work that was never approved.
// LEFT OUT: the generic DOB glossary (BIS / DOB NOW / C of O / LNO / SWO / OATH-ECB). The Bronx guide
//   already explains those and this page links it; repeating them is the duplication the owner ruled
//   out, and the suggested dates ("pre-2021", "post-2019/2021") contradict each other and could not be
//   verified (DOB's portals answer Access Denied here). The deck-guide link: that guide is about
//   legalizing a backyard deck, not LPC approval of a landmarked roof deck. The emoji box: not site style.
// Applied as exact string replacements to BOTH the markdown source and the stored body, because the
// stored body also carries the injected Permit Pulse block that the markdown does not.

import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';
const MD = 'guides/brooklyn-permit-search.md';

const EDITS: Array<[string, string]> = [
  [
    `It covers applications filed and permits issued since January 1, 2016. For anything older, LPC asks you to make a Records Access Request. Read pending results with care: LPC notes that the work types shown on a pending application are what the applicant described, and may not match the scope LPC finally approves.`,
    `It covers applications filed and permits issued since January 1, 2016. For anything older, LPC asks you to make a Records Access Request. Read pending results with care: LPC notes that the work types shown on a pending application are what the applicant described, and may not match the scope LPC finally approves.

### Reading the permit type

Each issued LPC permit is one of three types, and the type tells you what kind of work it was:

- **Certificate of No Effect (CNE):** work that needs a Department of Buildings permit but does not affect the building's protected features, such as interior renovations, plumbing and heating equipment, or rooftop mechanical equipment.
- **Permit for Minor Work (PMW):** exterior work that does not need a DOB permit and is restorative or appropriate, such as window or door replacement in existing openings, masonry cleaning and brownstone resurfacing.
- **Certificate of Appropriateness (C of A):** work that affects the protected features or does not conform to LPC's rules, such as additions, demolitions, new construction, or removing a stoop or cornice.

The search also shows whether a permit was approved at staff or Commission level. LPC says about 95% of its permits are issued by staff, without a public hearing; the rest are decided by the full Commission.`,
  ],
  [
    `Where DOB shows the work and LPC shows nothing since 2016, or the reverse, ask the seller when the work was done and whether LPC approved it.`,
    `Where DOB shows the work and LPC shows nothing since 2016, or the reverse, ask the seller when the work was done and whether LPC approved it. If it turns out the work was never approved by either agency, see [what you take on with a house that has unpermitted work](/guides/find-unpermitted-work-before-buying/).`,
  ],
  [
    `## Before you sign`,
    `## One more record by address: the water line

Brooklyn's row houses and brownstones are the kind of older one- to four-family homes that NYC's Department of Environmental Protection says may still have lead pipes, even though lead service lines have been banned in the city since 1961 and lead in household plumbing since 1987. DEP publishes a [Service Line Map](https://nycdep.maps.arcgis.com/apps/View/index.html?appid=fe8c7a4dd6d24959ac765660ba3a7c1a) you can search by address. One local detail matters to a buyer: in New York City, DEP says homeowners own and are responsible for their service line in its entirety, not just the part on their side of the property line. Our guide to [reading a water utility's lead service line record](/guides/lead-service-line-lookup-by-address/) explains what its labels mean, and DEP offers a free lead test kit through 311.

## Before you sign`,
  ],
  [
    `4. Ask the seller, in writing, about any exterior work that appears in one record but not the other.`,
    `4. Look the address up on DEP's Service Line Map.
5. Ask the seller, in writing, about any exterior work that appears in one record but not the other.`,
  ],
];

const apply = (s: string, where: string) => {
  for (const [a, b] of EDITS) { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`ABORT (${where}): anchor matched ${n} times: "${a.slice(0, 60)}"`); s = s.replace(a, b); }
  return s;
};

async function main() {
  const row = (await withDb((sql) => sql`SELECT id, slug, status, body_markdown FROM articles WHERE id = 94`) as unknown as any[])[0];
  if (!row || row.slug !== 'check-building-permits-brooklyn-ny' || row.status !== 'published') throw new Error('ABORT: not the Brooklyn guide');
  const body = apply(row.body_markdown, 'db'); const md = apply(fs.readFileSync(MD, 'utf8'), 'md');
  const published = new Set(((await withDb((sql) => sql`SELECT slug FROM articles WHERE status='published'`)) as unknown as any[]).map((r) => r.slug));
  for (const m of body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/\)/g)) if (!published.has(m[1])) throw new Error(`ABORT: dead link ${m[1]}`);
  if (/\*\*\[[^\]]+\]\([^)]+\)\*\*|\[\*\*[^\]]+\*\*\]\([^)]+\)/.test(body)) throw new Error('ABORT: nested bold link');
  if (!body.includes('Is Permitting Right Now')) throw new Error('ABORT: Permit Pulse block would be lost');
  console.log(`  body ${row.body_markdown.split(/\s+/).length} -> ${body.split(/\s+/).length} words\n  headings: ${(body.match(/^#{2,3} .*/gm) || []).join(' | ')}`);
  if (!APPLY) { console.log('\n  DRY RUN -- nothing written.'); return; }
  const res = (await withDb((sql) => sql`UPDATE articles SET body_markdown = ${body}, updated_at = now() WHERE id = 94 AND body_markdown = ${row.body_markdown} RETURNING id`) as unknown as any[]);
  if (res.length !== 1) throw new Error('ABORT: body changed during run');
  fs.writeFileSync(MD, md);
  console.log('\n  wrote #94 and the markdown source');
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
