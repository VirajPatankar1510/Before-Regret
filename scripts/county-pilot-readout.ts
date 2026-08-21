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

/** Untouched. Chosen to sit in the same population/traffic band as the pilot set so the only
 *  deliberate difference between the groups is the narrative. */
const CONTROL = ['dallas-county-tx', 'clark-county-nv', 'orange-county-ca'];

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

  const pilot = await inspect(PILOT, 'PILOT (rewritten)');
  const control = await inspect(CONTROL, 'CONTROL (untouched)');

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

  if (pilotMoved && !controlMoved) {
    console.log('  DEPTH IS THE LEVER. Rewritten pages got indexed and untouched ones did not.');
    console.log('  -> Roll the narrative out to the remaining 95 counties.');
    console.log('  -> The same reasoning now justifies expanding the national permits hub');
    console.log('     (634 words of prose, "Discovered - currently not indexed", and its advice');
    console.log('     for 75 of 100 counties is currently "search Google").');
  } else if (!pilotMoved && !controlMoved) {
    console.log('  DEPTH IS NOT THE LEVER at this size. Nothing moved either way.');
    console.log('  -> Do NOT roll out to 95 counties, and do NOT expand the hub on this theory.');
    console.log('  -> The constraint is site-level authority, which page length does not touch.');
    console.log('     Effort belongs on brand signal and external citation instead');
    console.log('     (see scripts/brand-signal-report.ts).');
    console.log('  This outcome saves the most work. It is a result, not a failure.');
  } else if (pilotMoved && controlMoved) {
    console.log('  INCONCLUSIVE. Both groups moved, so something other than the rewrite did it');
    console.log('  (site age, a crawl pass, a Google-side change). The pilot proved nothing --');
    console.log('  do not credit the narrative for this.');
  } else {
    console.log('  ODD: controls indexed while rewritten pages did not. Nothing about the rewrite');
    console.log('  should cause that. Check for a crawl error or noindex on the pilot pages before');
    console.log('  drawing any conclusion.');
  }
}

main().catch((e) => { console.error(e?.message || e); process.exit(1); });
