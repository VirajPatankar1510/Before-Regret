// Generates docs/florida-flood-declaration.html -- a regional study tied to a live news event:
// FEMA major disaster declaration DR-4956-FL (severe storms and flooding, declared 2026-11-24).
//
//   npx tsx scripts/build-florida-flood-declaration-study.ts
//   -> docs/florida-flood-declaration.html
//   -> docs/data/florida-flood-declaration-figures.json, docs/data/florida-flood-declaration-by-county.csv
//
// WHY IT EXISTS (owner, 2026-11-27): a newsjacking test. The declaration is in the news this week;
// reporters covering it need county numbers, and we already hold three first-party analyses that
// cover every county in it. Nothing here is new data collection except the declaration itself,
// which is read live from FEMA's own API at build time.
//
// WHAT IT MUST NOT DO
// - Describe THIS flood. Our NFIP claims run to 2026-06-01 and our FEMA aid data to declarations
//   up to 2026-10-27, both before the 2026-10-31 storms. The page says so, twice. Every figure is
//   history: what the record shows in the same seven counties.
// - Scare. Calm, practical, for a buyer or owner in these counties (owner rule: no fear-bait).
// - Rank Hardee. It has 128 classifiable claims, under the 500 the Outside the Zone study set as its
//   floor for ranked comparisons, so it is shown with that caveat and left out of every ranking.
//
// THE HEADLINE IS ASSERTED, NOT TYPED: the build fails if Brevard is not the highest out-of-zone
// share among the seven, or if every declared county is not in all three datasets.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { KF_CSS, keyFindingsBlock, assertKeyFindingsNumbers } from './lib/keyFindings.js';

const DR = 4956;
const PUBLISHED = '27 November 2026';
const READ_ON = '2026-11-27'; // the day the declaration was read from FEMA's API for publication
const STUDY_URL = 'https://www.beforeregret.com/research/florida-flood-declaration/';
const D = (f: string) => path.join(process.cwd(), 'docs', 'data', f);
const read = (f: string) => JSON.parse(fs.readFileSync(D(f), 'utf8'));

// ---- The declaration, from FEMA's API ------------------------------------------------------------
const API = `https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries?$filter=disasterNumber%20eq%20${DR}`;
const apiBody = execFileSync('curl', ['-s', '-L', '--max-time', '60', API], { maxBuffer: 8 * 1024 * 1024 }).toString();
const decl: any[] = JSON.parse(apiBody).DisasterDeclarationsSummaries;
if (!decl?.length) throw new Error(`ABORT: FEMA API returned no rows for DR-${DR}`);
const declDate = decl[0].declarationDate.slice(0, 10);
const incidentBegin = decl[0].incidentBeginDate.slice(0, 10);
if (decl.some((r) => r.state !== 'FL' || r.declarationType !== 'DR')) throw new Error('ABORT: unexpected declaration rows');
const declCounties = decl.map((r) => ({
  name: String(r.designatedArea).replace(/\s*\(County\)\s*$/, ''),
  households: !!r.ihProgramDeclared,
  publicAssistance: !!r.paProgramDeclared,
})).sort((a, b) => a.name.localeCompare(b.name));

// ---- Our three datasets -------------------------------------------------------------------------
const zone = read('flood-outside-zone.json');
if (JSON.stringify(zone.countyCols) !== JSON.stringify(['county', 'st', 'claims', 'share', 'paidOutside', 'takeupSfha'])) throw new Error('ABORT: flood-outside-zone columns changed');
const flState = zone.states.find((s: any) => s.st === 'FL');
const takeup = read('flood-takeup.json');
if (JSON.stringify(takeup.cols) !== JSON.stringify(['county', 'st', 'takeup', 'pol', 'homes', 'rate'])) throw new Error('ABORT: flood-takeup columns changed');
const flTakeupState = takeup.states.FL; // stateCols: takeup, takeupRank, risk, riskRank, pol, homes, n, name
const aid = read('fema-aid-gap-lookup.json');
const aidFig = read('fema-aid-gap-figures.json');
const CAP = aidFig.ihpMaximum.declaredOnOrAfter20261001 as number; // applies: declared 2026-11-24
if (declDate < '2026-10-01') throw new Error('ABORT: cap choice assumes a declaration on or after 2026-10-01');

const RANK_FLOOR = zone.minRank as number; // 500
const flZoneCounties = zone.counties.filter((c: any[]) => c[1] === 'FL' && c[2] >= RANK_FLOOR).sort((a: any[], b: any[]) => b[3] - a[3]);

type Row = {
  county: string; households: boolean;
  claims: number; outsideShare: number; paidOutside: number; flRank: number | null;
  takeup: number; policies: number; zoneHomes: number;
  aidRegs: number; aidApproved: number; aidUsd: number; aidDisasters: number; aidPerApproved: number; aidApprovalShare: number;
  topDisaster: { title: string; regs: number; approved: number; usd: number };
};
const rows: Row[] = declCounties.map((dc) => {
  const z = zone.counties.find((c: any[]) => c[0] === dc.name && c[1] === 'FL');
  const t = takeup.counties.find((c: any[]) => c[0] === dc.name && c[1] === 'FL');
  const a = aid.c.find((c: any[]) => c[0] === `${dc.name} County, FL`);
  if (!z || !t || !a) throw new Error(`ABORT: ${dc.name} missing from a dataset (zone ${!!z}, takeup ${!!t}, aid ${!!a})`);
  const rank = flZoneCounties.findIndex((c: any[]) => c[0] === dc.name);
  const [n, regs, appr, usd] = a[9][0];
  return {
    county: dc.name, households: dc.households,
    claims: z[2], outsideShare: z[3], paidOutside: z[4], flRank: rank >= 0 ? rank + 1 : null,
    takeup: t[2], policies: t[3], zoneHomes: t[4],
    aidRegs: a[1], aidApproved: a[2], aidUsd: a[3], aidDisasters: a[8],
    aidPerApproved: Math.round(a[3] / a[2]), aidApprovalShare: a[2] / a[1],
    topDisaster: { title: aid.d[String(n)], regs, approved: appr, usd },
  };
});
const ranked = rows.filter((r) => r.claims >= RANK_FLOOR).sort((a, b) => b.outsideShare - a.outsideShare);
const aboveState = ranked.filter((r) => r.outsideShare > flState.share).length;
const brevard = rows.find((r) => r.county === 'Brevard')!;
const palm = rows.find((r) => r.county === 'Palm Beach')!;
const martin = rows.find((r) => r.county === 'Martin')!;
const hardee = rows.find((r) => r.county === 'Hardee')!;
if (ranked[0].county !== 'Brevard') throw new Error(`ABORT: headline says Brevard leads, data says ${ranked[0].county}`);
if (!(brevard.outsideShare > flState.share * 3)) throw new Error('ABORT: Brevard is not >3x the Florida share; rewrite the standfirst');
const unranked = rows.filter((r) => r.claims < RANK_FLOOR);
if (unranked.map((r) => r.county).join() !== 'Hardee,Okeechobee') throw new Error(`ABORT: unranked counties changed: ${unranked.map((r) => r.county)}`);
if (brevard.flRank !== 1) throw new Error('ABORT: prose says Brevard is the highest in Florida');
if (aboveState !== ranked.length) throw new Error('ABORT: prose says all ranked counties are above the state share');
const totalClaims = rows.reduce((s, r) => s + r.claims, 0);
const totalPaidOutside = rows.reduce((s, r) => s + r.paidOutside, 0);
const allRegs = rows.reduce((s, r) => s + r.aidRegs, 0);
const allAppr = rows.reduce((s, r) => s + r.aidApproved, 0);
const allUsd = rows.reduce((s, r) => s + r.aidUsd, 0);
const allPerAppr = Math.round(allUsd / allAppr);
const highestTakeup = [...rows].sort((a, b) => b.takeup - a.takeup)[0];
const lowestTakeup = [...rows].sort((a, b) => a.takeup - b.takeup)[0];
if (highestTakeup.county !== 'Martin') throw new Error('ABORT: prose names Martin as the highest take-up');

// ---- Formatting -------------------------------------------------------------------------------
const num = (n: number) => n.toLocaleString('en-US');
const pct1 = (n: number) => `${n.toFixed(1)}%`;
const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;
const usdM = (n: number) => `$${(n / 1e6).toFixed(1)} million`;
const ord = (n: number) => `${n}${['th', 'st', 'nd', 'rd'][n % 100 > 10 && n % 100 < 14 ? 0 : Math.min(n % 10, 4) % 4] || 'th'}`;
const fmtDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const countyList = (names: string[]) => `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
const hhCounties = rows.filter((r) => r.households).map((r) => r.county);
const noHh = rows.filter((r) => !r.households).map((r) => r.county);

const zoneRows = [...ranked, ...unranked].map((r) => `      <tr${r.county === 'Brevard' ? ' class="me"' : ''}><td>${r.county}${r.claims < RANK_FLOOR ? '*' : ''}</td><td class="n">${num(r.claims)}</td><td class="n"><b>${pct1(r.outsideShare)}</b></td><td class="n">${usdM(r.paidOutside)}</td><td class="n">${r.flRank ? `${ord(r.flRank)} of ${flZoneCounties.length}` : '&ndash;'}</td></tr>`).join('\n');
const takeupRows = [...rows].sort((a, b) => b.takeup - a.takeup).map((r) => `      <tr><td>${r.county}</td><td class="n">${num(r.zoneHomes)}</td><td class="n">${num(r.policies)}</td><td class="n"><b>${pct1(r.takeup)}</b></td></tr>`).join('\n');
const aidRows = [...rows].sort((a, b) => b.aidRegs - a.aidRegs).map((r) => `      <tr><td>${r.county}</td><td class="n">${r.aidDisasters}</td><td class="n">${num(r.aidRegs)}</td><td class="n">${Math.round(r.aidApprovalShare * 100)}%</td><td class="n"><b>${usd(r.aidPerApproved)}</b></td><td>${r.topDisaster.title}</td></tr>`).join('\n');

const KEY_FINDINGS = keyFindingsBlock([
  `In Brevard County, Florida, ${pct1(brevard.outsideShare)} of the ${num(brevard.claims)} National Flood Insurance Program claims on record were on homes rated outside FEMA&rsquo;s mapped high-risk flood zone, against ${pct1(flState.share)} for Florida as a whole (NFIP claims to ${fmtDate(zone.claimsThrough)}).`,
  `Brevard&rsquo;s ${pct1(brevard.outsideShare)} is the highest out-of-zone share of the ${flZoneCounties.length} Florida counties with at least ${num(RANK_FLOOR)} NFIP claims on record, and all ${ranked.length} DR-${DR}-FL counties with that many claims are above Florida&rsquo;s ${pct1(flState.share)}.`,
  `Inside the mapped high-risk zone, NFIP take-up in the seven DR-${DR} counties runs from ${pct1(lowestTakeup.takeup)} of homes in ${lowestTakeup.county} County to ${pct1(highestTakeup.takeup)} in ${highestTakeup.county} County.`,
  `In past major disasters, FEMA approved ${Math.round(allAppr / allRegs * 100)}% of ${num(allRegs)} homeowner registrations from these seven counties and paid ${usd(allPerAppr)} on average per approved registration; the housing-assistance maximum for a disaster declared on or after 1 October 2026 is ${usd(CAP)}.`,
], `Sources: FEMA OpenFEMA NFIP claims and residential penetration rates; FEMA Housing Assistance (Owners) and Disaster Declarations Summaries, read ${fmtDate(READ_ON)}; analysis by Before Regret. Figures describe past claims and past disasters, not the ${fmtDate(incidentBegin)} storms.`);

const html = `<style>
  .wrap{max-width:46rem;margin:0 auto;padding:2.5rem 1.25rem 4rem;font:16px/1.65 Charter,Georgia,'Times New Roman',serif;color:#1a1a1a}
  .wrap *{box-sizing:border-box}
  .kicker{font:700 11px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#8a6d3b;margin:0 0 .9rem}
  .wrap h1{font-size:2.35rem;line-height:1.12;margin:0 0 1rem;font-weight:600;letter-spacing:-.015em}
  .standfirst{font-size:1.16rem;line-height:1.6;color:#3d3d3d;margin:0 0 2rem}
  .wrap h2{font:700 12px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#8a6d3b;margin:2.75rem 0 .5rem;padding-top:1.5rem;border-top:1px solid #e5e0d8}
  .wrap h3{font-size:1.32rem;line-height:1.35;font-weight:600;margin:0 0 .9rem;letter-spacing:-.01em}
  .wrap p{margin:0 0 1.1rem}
  .figs{display:grid;grid-template-columns:repeat(auto-fit,minmax(9rem,1fr));gap:1px;background:#e5e0d8;border:1px solid #e5e0d8;margin:0 0 2rem}
  .fig{background:#fdfcfa;padding:1rem .9rem}
  .fig b{display:block;font:700 1.65rem/1.1 ui-sans-serif,system-ui,sans-serif;letter-spacing:-.02em}
  .fig span{display:block;font:400 12px/1.4 ui-sans-serif,system-ui,sans-serif;color:#6b6b6b;margin-top:.3rem}
  .note{background:#faf8f4;border-left:3px solid #8a6d3b;padding:1rem 1.2rem;margin:0 0 1.6rem;font:400 14px/1.6 ui-sans-serif,system-ui,sans-serif}
  .note p{margin:0}
  table{width:100%;border-collapse:collapse;font:400 13px/1.45 ui-sans-serif,system-ui,sans-serif;margin:0 0 .6rem}
  th{text-align:left;font-weight:700;border-bottom:2px solid #1a1a1a;padding:.5rem .4rem;font-size:11px;letter-spacing:.04em;text-transform:uppercase;color:#4a4a4a}
  td{border-bottom:1px solid #ece8e1;padding:.45rem .4rem}
  td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}
  tr.me td{background:#fdf6e7}
  .scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;margin:0 0 1rem}
  .cap{font:400 12px/1.5 ui-sans-serif,system-ui,sans-serif;color:#6b6b6b;margin:0 0 1.8rem}
  .wrap ul.plain{margin:0 0 1.2rem;padding-left:1.2rem}
  .wrap ul.plain li{margin:0 0 .5rem}
  .cite{background:#f5f2ec;border:1px solid #e5e0d8;padding:1.1rem 1.2rem;font:400 13px/1.6 ui-sans-serif,system-ui,sans-serif;margin:2.5rem 0 0}
  .cite b{display:block;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#8a6d3b;margin-bottom:.5rem}
  .wrap a{color:#8a6d3b}
  footer.spine{margin:2rem 0 0;padding-top:1.2rem;border-top:1px solid #e5e0d8;font:400 12.5px/1.7 ui-sans-serif,system-ui,sans-serif;color:#6b6b6b}
  @media(max-width:560px){.wrap h1{font-size:1.85rem}}
${KF_CSS}
</style>

<div class="wrap">
  <p class="kicker">Regional analysis &middot; FEMA disaster declaration DR-${DR}-FL &middot; ${PUBLISHED}</p>
  <h1>The flood-zone line in Florida&rsquo;s newest disaster counties</h1>
  <p class="standfirst">FEMA declared a major disaster for severe storms and flooding in seven
  Florida counties on ${fmtDate(declDate)}: ${countyList(rows.map((r) => r.county))}. We went back
  through the flood-insurance and disaster-aid records we already hold for those same counties.
  In Brevard, ${pct1(brevard.outsideShare)} of past flood claims came from homes outside the mapped
  high-risk zone: more than three times the Florida share, and the highest of any Florida county
  with enough claims to compare.</p>

  <div class="figs">
    <div class="fig"><b>${pct1(brevard.outsideShare)}</b><span>of Brevard County&rsquo;s ${num(brevard.claims)} flood claims were outside the mapped zone</span></div>
    <div class="fig"><b>${pct1(flState.share)}</b><span>the same share for Florida as a whole</span></div>
    <div class="fig"><b>${pct1(palm.outsideShare)}</b><span>in Palm Beach County, across ${num(palm.claims)} claims</span></div>
    <div class="fig"><b>${usd(CAP)}</b><span>FEMA&rsquo;s housing-assistance maximum for this declaration</span></div>
  </div>

  <div class="note"><p><b>What these numbers are not.</b> None of them describes the storms that
  began on ${fmtDate(incidentBegin)}. Our flood-claims data runs to ${fmtDate(zone.claimsThrough)}
  and our FEMA aid data covers disasters declared up to ${fmtDate(aidFig.declarationRange.last)}.
  They are the record of the same seven counties before this event, which is the record a buyer or
  owner there can actually use.</p></div>

  ${KEY_FINDINGS}

  <h2>The declaration</h2>
  <h3>Seven counties, and help for households in ${hhCounties.length} of them.</h3>
  <p>FEMA&rsquo;s declaration DR-${DR}-FL, for severe storms and flooding that began on
  ${fmtDate(incidentBegin)}, names ${countyList(rows.map((r) => r.county))} counties. FEMA&rsquo;s
  own declaration record shows its Individuals and Households Program, the aid a homeowner applies
  for, declared in ${countyList(hhCounties)}. ${noHh.length === 1 ? `${noHh[0]} County is listed for Public Assistance, the program that pays local governments, and not for household aid.` : ''}
  Designations can be added after a declaration, so <a href="https://www.fema.gov/disaster/${DR}" rel="noopener">FEMA&rsquo;s
  page for DR-${DR}</a> is the current word on who can apply.</p>

  <h2>Flood insurance claims outside the flood zone</h2>
  <h3>In Brevard, most flood claims were on homes the map placed outside the high-risk zone.</h3>
  <p>The National Flood Insurance Program records the flood zone each policy was rated in. Zones
  starting with A or V are FEMA&rsquo;s Special Flood Hazard Area, the mapped high-risk zone where a
  federally backed mortgage requires flood insurance. Zones X, B and C sit outside it. In Florida as
  a whole, ${pct1(flState.share)} of ${num(flState.claims)} classifiable claims were outside the
  mapped zone. In all ${ranked.length} declared counties with enough claims to compare, the share is
  higher.</p>

  <div class="scroll">
    <table>
      <thead><tr><th>County</th><th class="n">Claims on record</th><th class="n">Outside mapped zone</th><th class="n">Paid on those claims</th><th class="n">Rank in Florida</th></tr></thead>
      <tbody>
${zoneRows}
      </tbody>
    </table>
  </div>
  <p class="cap">Classifiable NFIP claims, 1970s to ${fmtDate(zone.claimsThrough)}, by the zone the
  policy was rated in; zone D and blank-zone claims are excluded. Rank among the ${flZoneCounties.length}
  Florida counties with at least ${num(RANK_FLOOR)} claims (1st = highest out-of-zone share).
  *${unranked.map((r) => `${r.county} has ${num(r.claims)}`).join(' and ')} claims, too few to rank. Paid amounts are building and contents,
  nominal dollars.</p>

  <p>Brevard&rsquo;s figure is the highest of the ${flZoneCounties.length} Florida counties with
  enough claims to rank, and Palm Beach&rsquo;s is the ${ord(palm.flRank!)} highest. Across all seven counties, claims on homes rated
  outside the mapped zone were paid ${usdM(totalPaidOutside)}, out of ${num(totalClaims)} claims on
  record.</p>
  <p>A high share does not mean the map is wrong about any one street. It means that, in these
  counties, a &ldquo;not in a flood zone&rdquo; answer has not kept flood claims away in the past.
  Flood zones are also redrawn, and a claim is counted by the zone its policy was rated in at the
  time. Our <a href="/research/outside-the-zone/">Outside the Zone</a> study has the same measure
  for 1,921 US counties.</p>

  <h2>Who carries flood insurance inside the zone</h2>
  <h3>Inside the mapped zone, coverage runs from under one home in six to more than three in four.</h3>
  <p>Inside the mapped high-risk zone, the share of homes with an NFIP policy varies widely across
  the seven counties. Florida&rsquo;s statewide figure is ${pct1(flTakeupState[0])}.</p>
  <div class="scroll">
    <table>
      <thead><tr><th>County</th><th class="n">Homes in mapped zone</th><th class="n">NFIP policies</th><th class="n">Take-up</th></tr></thead>
      <tbody>
${takeupRows}
      </tbody>
    </table>
  </div>
  <p class="cap">FEMA NFIP residential penetration rates, as of ${fmtDate(zone.penetrationAsOf)}. NFIP
  policies only: private flood insurance is not in this data, so true coverage can be higher.</p>

  <h2>What FEMA has paid here before</h2>
  <h3>Disaster aid in these counties has averaged ${usd(allPerAppr)} per approved homeowner.</h3>
  <p>FEMA&rsquo;s Housing Assistance data for owners covers every major disaster declared from 2002.
  Across the seven counties, ${num(allRegs)} homeowner registrations were made and
  ${Math.round(allAppr / allRegs * 100)}% were approved for any aid. Approved owners received
  ${usd(allPerAppr)} on average, in nominal dollars. FEMA aid is not insurance: by regulation it
  does not pay for losses insurance covers (44 CFR 206.113), and repair aid restores a home to a
  safe and sanitary condition, not to how it was (44 CFR 206.117).</p>
  <div class="scroll">
    <table>
      <thead><tr><th>County</th><th class="n">Disasters</th><th class="n">Registrations</th><th class="n">Approved</th><th class="n">Per approved</th><th>Largest disaster</th></tr></thead>
      <tbody>
${aidRows}
      </tbody>
    </table>
  </div>
  <p class="cap">FEMA Housing Assistance (Owners), disasters declared ${fmtDate(aidFig.declarationRange.first)}
  to ${fmtDate(aidFig.declarationRange.last)}; aid is repair, rental and other needs assistance,
  nominal dollars. &ldquo;Largest disaster&rdquo; is by homeowner registrations. Our
  <a href="/research/fema-aid-gap/">What FEMA Pays Homeowners</a> study covers every US county.</p>
  <p>The ceiling for this declaration is ${usd(CAP)}, the maximum set for disasters declared on or
  after 1 October 2026 in FEMA&rsquo;s annual adjustment, published in the Federal Register.</p>

  <h2>If you are buying in one of these counties</h2>
  <h3>Questions the records above make worth asking.</h3>
  <ul class="plain">
    <li><b>Ask the seller about past flood claims</b> and whether the house took water in the
    storms that began on ${fmtDate(incidentBegin)}.</li>
    <li><b>Price flood insurance even outside a high-risk flood zone.</b> In Brevard, Palm Beach, Martin and Indian
    River, ${pct1(Math.min(brevard.outsideShare, palm.outsideShare, martin.outsideShare, rows.find((r) => r.county === 'Indian River')!.outsideShare))} or more of past claims came from homes the map placed outside it.</li>
    <li><b>Check the permit record for past repairs.</b> If the house was repaired after a flood, the permit record shows what was filed. Our guides
    for <a href="/guides/check-building-permits-brevard-county-fl/">Brevard County permits</a> and
    <a href="/guides/check-building-permits-martin-county-fl/">Martin County permits</a> show where
    to look.</li>
  </ul>

  <h2>How we checked this</h2>
  <p>On ${fmtDate(READ_ON)} we read the declaration for DR-${DR}
  from FEMA&rsquo;s Disaster Declarations Summaries API: its counties, its incident start date and
  which programs each county was designated for. The county figures come from three analyses we
  had already built from OpenFEMA data: NFIP claims to ${fmtDate(zone.claimsThrough)} (Outside the
  Zone), NFIP residential penetration rates as of ${fmtDate(zone.penetrationAsOf)} (Risk Without
  Cover) and Housing Assistance for owners (What FEMA Pays Homeowners). This page adds nothing to
  those datasets; it reads the seven declared counties out of them and compares them with Florida.</p>
  <p>What this page does not know: anything about the ${fmtDate(incidentBegin)} storms themselves,
  how many homes flooded, or what any one house&rsquo;s risk is. These are county records, not
  findings about a particular property.</p>

  <div class="cite"><b>Cite this</b>Before Regret, &ldquo;The flood-zone line in Florida&rsquo;s
  newest disaster counties,&rdquo; ${PUBLISHED}, ${STUDY_URL}. Free to reuse under
  <a href="https://creativecommons.org/licenses/by/4.0/" rel="license noopener">CC BY 4.0</a> with a
  link back. County table: <a href="/research/data/florida-flood-declaration-by-county.csv">CSV</a>,
  figures: <a href="/research/data/florida-flood-declaration-figures.json">JSON</a>.</div>

  <footer class="spine">Published ${PUBLISHED}. Part of <a href="/research/">Before Regret research</a>.</footer>
</div>`;

assertKeyFindingsNumbers(html, 'build-florida-flood-declaration-study');
for (const r of rows) if (!html.includes(`<td>${r.county}`)) throw new Error(`ABORT: ${r.county} missing from a table`);

const figures = {
  title: 'The flood-zone line in Florida’s newest disaster counties',
  generated: new Date().toISOString().slice(0, 10),
  declaration: { disasterNumber: DR, state: 'FL', declared: declDate, incidentBegin, title: decl[0].declarationTitle, source: API.replace('%20', ' ').replace(/%20/g, ' '), counties: declCounties },
  sources: {
    claims: 'docs/data/flood-outside-zone.json (OpenFEMA FimaNfipClaims, claims through ' + zone.claimsThrough + ')',
    takeup: 'docs/data/flood-takeup.json (OpenFEMA NfipResidentialPenetrationRates, as of ' + zone.penetrationAsOf + ')',
    aid: 'docs/data/fema-aid-gap-lookup.json (OpenFEMA HousingAssistanceOwners, declared ' + aidFig.declarationRange.first + ' to ' + aidFig.declarationRange.last + ')',
  },
  florida: { classifiableClaims: flState.claims, outsideShare: flState.share, takeupInsideZone: flTakeupState[0] },
  rankFloorClaims: RANK_FLOOR,
  floridaCountiesRanked: flZoneCounties.length,
  ihpMaximumUsd: CAP,
  sevenCounties: { claims: totalClaims, paidOutsideUsd: totalPaidOutside, aidRegistrations: allRegs, aidApproved: allAppr, aidUsd: allUsd, aidPerApprovedUsd: allPerAppr },
  counties: rows,
};
const csvHead = ['county', 'state', 'household_aid_declared_dr4956', 'classifiable_nfip_claims', 'pct_claims_outside_mapped_zone', 'paid_on_out_of_zone_claims_usd', 'florida_rank_out_of_zone_share', 'nfip_takeup_inside_mapped_zone_pct', 'nfip_policies_inside_zone', 'homes_inside_mapped_zone', 'fema_owner_registrations_since_2002', 'fema_owner_approved', 'fema_owner_aid_usd', 'fema_aid_per_approved_usd'];
const csv = [csvHead.join(','), ...rows.map((r) => [r.county, 'FL', r.households, r.claims, r.outsideShare, r.paidOutside, r.flRank ?? '', r.takeup, r.policies, r.zoneHomes, r.aidRegs, r.aidApproved, r.aidUsd, r.aidPerApproved].join(','))].join('\n') + '\n';

fs.writeFileSync(path.join(process.cwd(), 'docs', 'florida-flood-declaration.html'), html);
fs.writeFileSync(D('florida-flood-declaration-figures.json'), JSON.stringify(figures, null, 2) + '\n');
fs.writeFileSync(D('florida-flood-declaration-by-county.csv'), csv);
console.log(`wrote docs/florida-flood-declaration.html (${(html.length / 1024).toFixed(1)} KB); Brevard ${brevard.outsideShare}% (FL rank ${brevard.flRank}/${flZoneCounties.length}), FL ${flState.share}%; aid ${allRegs} regs, $${allPerAppr}/approved; cap $${CAP}`);
for (const r of rows) console.log(`  ${r.county.padEnd(13)} claims ${String(r.claims).padStart(6)} out ${String(r.outsideShare).padStart(5)}% rank ${r.flRank ?? '-'}  takeup ${r.takeup}%  aid ${r.aidRegs} regs ${Math.round(r.aidApprovalShare * 100)}% $${r.aidPerApproved}  hh:${r.households}`);
