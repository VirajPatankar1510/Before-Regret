// Reads out the county-narrative pilot: did giving 5 county pages genuinely county-specific prose
// move them off "Discovered - currently not indexed"?
//
//   npx tsx scripts/county-pilot-readout.ts
//
// WHY THIS EXISTS AS A SCRIPT. The experiment was designed on 2026-08-21 and cannot be judged for
// a couple of weeks. An experiment whose design lives only in a chat log is one nobody can read
// out honestly later -- by then it is tempting to look at whatever the numbers are and construct a
// story. The pilot set, the control set, and the decision rule are therefore written down HERE,
// before the result is known, so the readout is a lookup rather than an interpretation.
//
// THE DESIGN. Five counties were rewritten with prose driven by their own hazard/era profile,
// dropping pairwise similarity from 83.8% to 53.2% and roughly doubling page length. The controls
// were left untouched and still measure ~85% similar to each other at ~700 words. Everything else
// about the two sets is identical: same template, same internal linking, same sitemap, same
// domain, same crawl budget. So index status is the only thing that should differ, and only if
// depth is what Google was withholding indexing over.
//
// WHAT THE ANSWER MEANS -- both outcomes are worth having, which is the point of running it:
//   pilot indexed, controls not -> depth is the lever. Roll out to the other 95, and the same
//                                  reasoning justifies expanding the national permits hub.
//   neither indexed             -> depth is NOT the lever at this site's size; the constraint is
//                                  site-level authority. Expanding pages changes nothing, and the
//                                  effort belongs somewhere else entirely. This is the outcome
//                                  that saves the most work, so do not treat it as a failure.
//   both indexed                -> something else moved (age, crawl, a Google-side change). The
//                                  pilot proved nothing; do not credit it.
import 'dotenv/config';
import { fetchUrlInspection, isSearchConsoleConfigured } from '../src/server/searchConsoleService.js';

const BASE = 'https://www.beforeregret.com/county';

/** The day the pilot narratives went live. The maturity gate below is measured from this. */
const REWRITTEN_ON = '2026-08-21';
/** Below this, a null result is indistinguishable from "Google has not been back yet". */
const MIN_DAYS_FOR_VERDICT = 14;

/** Rewritten 2026-08-21 with county-specific narratives. */
const PILOT = ['cook-county-il', 'maricopa-county-az', 'miami-dade-county-fl', 'king-county-wa', 'harris-county-tx'];

/** Untouched, and NOT submitted via Request Indexing. */
const CONTROL = ['dallas-county-tx', 'clark-county-nv', 'orange-county-ca'];

/**
 * The confound, and the accidental control that rescues this experiment.
 *
 * On 2026-08-21 the five pilot counties were submitted through Search Console's Request Indexing.
 * The three controls deliberately were not -- advice I gave, and it was wrong. It meant the two
 * groups differed in TWO ways (rewritten, and manually submitted), so "pilot indexed, controls not"
 * cannot distinguish which one did it. A clean design would have submitted both groups and left
 * only the content different.
 *
 * The national permits hub happens to separate them. It was submitted at the same time and never
 * rewritten -- still the same 634 words of thin prose. So:
 *
 *   pilot    rewritten  + submitted
 *   hub      unchanged  + submitted   <- isolates submission from content
 *   control  unchanged  + not submitted
 *
 * If the hub is indexed, submission alone is sufficient and the rewrite is unproven. That is why
 * the verdict below checks the hub FIRST: it is the only group that can falsify the depth theory,
 * and reading pilot-vs-control without it produces a confident wrong answer.
 */
const HUB_UNCHANGED_BUT_SUBMITTED = 'https://www.beforeregret.com/guides/check-building-permit-history-by-address-any-us-county/';

const INDEXED = /indexed/i;
const NOT_INDEXED = /discovered|crawled - currently not indexed|not indexed/i;

function isIndexed(state: string): boolean {
  // "Submitted and indexed" / "Indexed, not submitted in sitemap" both count; anything containing
  // "not indexed" does not, and is checked first because it also contains the word "indexed".
  if (NOT_INDEXED.test(state)) return false;
  return INDEXED.test(state);
}

async function inspect(slugs: string[], label: string) {
  console.log(`\n--- ${label} ---`);
  let indexed = 0;
  for (const slug of slugs) {
    const url = `${BASE}/${slug}/`;
    const r = await fetchUrlInspection(url);
    const state = r.error ? `ERROR: ${r.error}` : (r.coverageState || 'unknown');
    const ok = !r.error && isIndexed(state);
    if (ok) indexed++;
    console.log(`  ${ok ? 'IDX' : '   '}  ${slug.padEnd(24)} ${state}`);
    await new Promise((res) => setTimeout(res, 400)); // same courtesy delay as the sweep script
  }
  return { indexed, total: slugs.length };
}

async function main() {
  if (!isSearchConsoleConfigured()) throw new Error('Search Console is not configured.');

  console.log('=== COUNTY NARRATIVE PILOT READOUT ===');
  console.log('  pilot rewritten 2026-08-21: similarity 83.8% -> 53.2%, ~700 -> ~1200 words');
  console.log('  controls untouched: still ~85% similar at ~700 words');

  const pilot = await inspect(PILOT, 'PILOT (rewritten + submitted)');
  const control = await inspect(CONTROL, 'CONTROL (untouched, not submitted)');

  const hubResult = await fetchUrlInspection(HUB_UNCHANGED_BUT_SUBMITTED);
  const hubState = hubResult.error ? `ERROR: ${hubResult.error}` : (hubResult.coverageState || 'unknown');
  const hubIndexed = !hubResult.error && isIndexed(hubState);
  console.log('\n--- HUB (NOT rewritten, but submitted) ---');
  console.log(`  ${hubIndexed ? 'IDX' : '   '}  national permits hub     ${hubState}`);

  console.log(`\n  pilot   : ${pilot.indexed}/${pilot.total} indexed`);
  console.log(`  control : ${control.indexed}/${control.total} indexed`);

  console.log('\n=== VERDICT ===\n');
  const pilotMoved = pilot.indexed > 0;
  const controlMoved = control.indexed > 0;

  // The maturity gate has to come BEFORE the verdict, not as a footnote after it. The first run of
  // this script was on the same day the pilot shipped and it printed "DEPTH IS NOT THE LEVER" --
  // a confident, wrong conclusion that happened to be indistinguishable in wording from the real
  // negative result it will print later. A caveat underneath does not fix that; anyone skimming
  // reads the verdict line. Google had not had time to re-crawl anything, so on that day there was
  // no verdict to give and the script should have said so instead.
  const daysSince = Math.floor((Date.now() - Date.parse(REWRITTEN_ON)) / 86400000);
  if (daysSince < MIN_DAYS_FOR_VERDICT && !pilotMoved) {
    console.log(`  TOO EARLY -- no conclusion available.`);
    console.log(`  ${daysSince} day(s) since the pilot shipped on ${REWRITTEN_ON}; this needs about`);
    console.log(`  ${MIN_DAYS_FOR_VERDICT}. Google has to re-crawl each page before its index status can change,`);
    console.log(`  and at roughly 3 pages/day for this site that takes time.`);
    console.log(`\n  "Discovered - currently not indexed" today is the EXPECTED reading, not evidence`);
    console.log(`  against the rewrite. Re-run after ${REWRITTEN_ON} + ${MIN_DAYS_FOR_VERDICT} days.`);
    return;
  }

  // The hub decides this, and it is checked before anything else. It was submitted for indexing
  // on the same day as the pilot but its content was never touched, so if it is indexed then
  // submission alone is sufficient and the rewrite has not been shown to do anything. Reading
  // pilot-vs-control without this check produced a confident "DEPTH IS THE LEVER" on 2026-08-22
  // while the hub sat indexed and unchanged three lines above it.
  if (hubIndexed) {
    console.log('  CONFOUNDED -- and the answer is probably submission, not depth.');
    console.log('');
    console.log('  The national permits hub is indexed. It was submitted through Request Indexing');
    console.log('  at the same time as the pilot, but its content was never rewritten -- still the');
    console.log('  same thin 634 words. Manual submission alone therefore explains indexing here,');
    console.log('  and the county rewrites have NOT been shown to contribute anything.');
    console.log('');
    console.log('  -> Do NOT roll the narrative out to the remaining 95 counties on this evidence.');
    console.log('  -> DO treat Request Indexing as a real, cheap lever: these URLs were crawled');
    console.log('     within hours of submission, against a background crawl rate of ~3 pages/day.');
    console.log('');
    console.log('  To actually test depth, submit the three controls too and wait. Once every group');
    console.log('  has been submitted, content is the only remaining difference.');
    return;
  }

  if (pilotMoved && !controlMoved) {
    console.log('  DEPTH IS THE LEVER. Rewritten pages got indexed, untouched ones did not, and');
    console.log('  the unchanged-but-submitted hub did NOT get indexed -- so submission alone does');
    console.log('  not explain it.');
    console.log('  -> Roll the narrative out to the remaining 95 counties.');
  } else if (!pilotMoved && !controlMoved) {
    console.log('  DEPTH IS NOT THE LEVER at this size. Nothing moved either way.');
    console.log('  -> Do NOT roll out to 95 counties, and do NOT expand the hub on this theory.');
    console.log('  -> The constraint is site-level authority, which page length does not touch.');
    console.log('  This outcome saves the most work. It is a result, not a failure.');
  } else if (pilotMoved && controlMoved) {
    console.log('  INCONCLUSIVE. Both groups moved, so something other than the rewrite did it');
    console.log('  (site age, a crawl pass, a Google-side change). Do not credit the narrative.');
  } else {
    console.log('  ODD: controls indexed while rewritten pages did not. Check the pilot pages for a');
    console.log('  crawl error or an accidental noindex before drawing any conclusion.');
  }
}

main().catch((e) => { console.error(e?.message || e); process.exit(1); });
