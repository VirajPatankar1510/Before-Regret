// Past-tense openings for the two Hurricane Isaias guides, #327 and #328 (site audit 2026-11-19, F9; owner
// approved "Hurricane openings" the same day). Both were published on 2026-10-09, hours before landfall, and
// still opened with that morning's forecast ("expected to reach ... that evening") 41 days later.
//
//   npx tsx scripts/update-hurricane-openings-2026-11.ts            # dry run: prints old and new
//   APPLY=true npx tsx scripts/update-hurricane-openings-2026-11.ts # writes body_markdown only
//
// ONLY the first paragraph of each body changes. Title, meta description, slug and status are not touched.
// The script checks that the current first paragraph is exactly the text below and stops if it isn't, so it
// can't overwrite an edit made since 2026-11-19.
//
// SOURCE for the new sentence, read 2026-11-19 at nhc.noaa.gov (NHC advisory archive, AL092026):
//   Hurricane Isaias Tropical Cyclone Update, 830 PM CDT Fri Oct 09 2026
//   https://www.nhc.noaa.gov/archive/2026/al09/al092026.update.10100129.shtml
//   "NWS Doppler Radar data indicate that Hurricane Isaias made landfall near Destin, Florida, around
//    830 PM CDT (0130 UTC) with maximum sustained winds of 105 mph (165 km/h)."
// The warning areas kept in #327's opening are unchanged from the 10 a.m. CDT advisory the page already cited.
import 'dotenv/config';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';

const EDITS = [
  {
    id: 327,
    slug: 'hurricane-flood-insurance-gulf-coast-homebuyers',
    old: "As of the National Hurricane Center's 10 a.m. CDT advisory on Friday, October 9, 2026, Hurricane Isaias was a major hurricane with maximum sustained winds of about 120 mph, and its center was expected to reach the western Florida Panhandle coast that evening. A Hurricane Warning was in effect from Ocean Springs, Mississippi to the Bay/Gulf County line in Florida, and a Storm Surge Warning from the mouth of the Mississippi River to the Suwannee River.",
    new: "Hurricane Isaias made landfall near Destin, Florida, around 8:30 p.m. CDT on Friday, October 9, 2026, with maximum sustained winds of 105 mph, according to the National Hurricane Center. That morning a Hurricane Warning had been in effect from Ocean Springs, Mississippi to the Bay/Gulf County line in Florida, and a Storm Surge Warning from the mouth of the Mississippi River to the Suwannee River.",
  },
  {
    id: 328,
    slug: 'hurricane-home-checklist-flood-insurance',
    old: "Isaias was forecast to come ashore on the western Florida Panhandle on the evening of October 9, 2026, under a Hurricane Warning stretching east from Ocean Springs, Mississippi (NHC advisory 12, issued at 10 a.m. CDT). Forecasts move by the hour; the [NHC's live advisories](https://www.nhc.noaa.gov/) are the ones to trust.",
    new: "Isaias came ashore near Destin, Florida, around 8:30 p.m. CDT on October 9, 2026, with maximum sustained winds of 105 mph, according to the National Hurricane Center. This checklist is written for the next storm. When one is on the way, forecasts move by the hour, and the [NHC's live advisories](https://www.nhc.noaa.gov/) are the ones to trust.",
  },
];

for (const e of EDITS) {
  const rows: any = await withDb((sql: any) => sql`SELECT body_markdown, status FROM articles WHERE id = ${e.id} AND slug = ${e.slug}`);
  if (!rows.length) throw new Error(`ABORT: #${e.id} ${e.slug} not found`);
  const body: string = rows[0].body_markdown;
  const first = body.split('\n\n')[0];
  if (first !== e.old) throw new Error(`ABORT: #${e.id}'s first paragraph is not the expected text -- it changed since 2026-11-19. Nothing written.\n  found: ${first}`);
  if (body.split(e.old).length !== 2) throw new Error(`ABORT: #${e.id} carries the old paragraph more than once`);
  const next = e.new + body.slice(e.old.length);
  console.log(`\n#${e.id} ${e.slug} (${rows[0].status})\n  OLD: ${e.old}\n  NEW: ${e.new}`);
  if (APPLY) {
    await withDb((sql: any) => sql`UPDATE articles SET body_markdown = ${next}, updated_at = now() WHERE id = ${e.id} AND slug = ${e.slug}`);
    console.log('  written');
  }
}
console.log(APPLY ? '\nDone. Guides are prerendered: rebuild and deploy to publish.' : '\nDRY RUN -- nothing written.');
