// Generator for the 22 county files not built by build-pinellas.ts or by hand (2026-11-17).
// Eight of them (LA, Cook, Miami-Dade, Philadelphia, Dallas, Orange, Riverside, Middlesex) and the
// four NYC boroughs were re-verified in the browser on 2026-11-17 and now cite fact ledgers.
//
//   npx tsx scripts/permit-records/build-from-guide-notes.ts      # writes data/permit-records/<st>/*.json
//
// The owner's rule: extract only what has already been verified, and record verification per field.
// The evidence for these counties is the dated verification notes in our own publish/restore scripts.
// Each field below cites the exact note line, and the validator checks that the line mentions
// verification and that the script contains the date.
//
//   2026-10-02  publish-hillsborough-permit-guide.ts:21   browser, "every portal fact"       -> verified
//   2026-10-02  harris-retitle-and-oce-fix.ts:15           browser                            -> verified
//   2026-10-03  restore-county-batch-a.ts:27               browser / primary source           -> verified
//   2026-10-04  publish-accela-citizen-access-permit-search.ts:19  browser (Tampa, Fort Worth) -> verified
//   2026-10-07  publish-batch-b.ts:22                      browser / primary source           -> verified
//   2026-09-04  restore-county-permit-guides.ts:87/98/109/120  link answered 200 on two runs,
//               no quote kept                                                                 -> PARTIALLY verified
//
// Everything else a guide says, with no recorded evidence, goes in `unverifiedClaim` on a
// "not_researched" field: a re-verification queue, never shown to readers. Where a note says a
// claim was cut or a site was blocked, that is recorded too.
import fs from 'node:fs';
import path from 'node:path';

type Ev = { ref: string; date: string };
const HB: Ev = { ref: 'script:scripts/publish-hillsborough-permit-guide.ts:21', date: '2026-10-02' };
const HR: Ev = { ref: 'script:scripts/harris-retitle-and-oce-fix.ts:15', date: '2026-10-02' };
const BA: Ev = { ref: 'script:scripts/restore-county-batch-a.ts:27', date: '2026-10-03' };
const AC: Ev = { ref: 'script:scripts/publish-accela-citizen-access-permit-search.ts:19', date: '2026-10-04' };
const BB: Ev = { ref: 'script:scripts/publish-batch-b.ts:22', date: '2026-10-07' };
const RS = (line: number): Ev => ({ ref: `script:scripts/restore-county-permit-guides.ts:${line}`, date: '2026-09-04' });
const RS_LIMITS = 'Recorded as verified on 2026-09-04 in our restore script (the link answered on two separate runs), but no quote of the page was kept. Re-read before relying on it.';

const refs = (e: Ev | Ev[]) => ({ evidence: ([] as Ev[]).concat(e).map((x) => x.ref), checkedOn: ([] as Ev[]).concat(e)[0].date });
const v = (value: unknown, sourceUrl: string, e: Ev | Ev[], extra: object = {}) => ({ status: 'verified', value, sourceUrl, ...refs(e), ...extra });
const pv = (value: unknown, sourceUrl: string, e: Ev | Ev[], limits: string, extra: object = {}) => ({ status: 'partially_verified', value, sourceUrl, ...refs(e), limits, ...extra });
/** Facts re-verified in the browser and quoted in data/fact-ledgers/<slug>.json. */
const led = (slug: string, date: string) => (...ids: string[]): Ev[] => ids.map((id) => ({ ref: `ledger:${slug}#${id}`, date }));
const nr = (extra: object = {}) => ({ status: 'not_researched', value: null, ...extra });
const nt = (reason: string) => ({ status: 'not_tested', value: null, reason });
const claim = (unverifiedClaim: string, claimSource: string, note?: string) => nr(note ? { unverifiedClaim, claimSource, note } : { unverifiedClaim, claimSource });

/** Every field a self-issuing jurisdiction must carry, defaulting to the honest empty states. */
function selfIssuing(id: string, name: string, kind: string, permitsIssuedBy: object, fields: Record<string, object>) {
  return {
    id, name, kind, permitsIssuedBy,
    buildingDepartment: nr(),
    currentPortal: nr(),
    portalUrl: nr(),
    searchBy: nr(),
    addressSearchTested: nt('No address search recorded.'),
    onlineRecordsFrom: nr(),
    historicalSystems: nr(),
    olderRecordsRequest: nr(),
    inspectionHistoryVisible: nt('No permit record opened.'),
    localCaveats: nr(),
    ...fields,
  };
}

const LPC_URL = 'https://www.nyc.gov/site/lpc/applications/permit-search.page';
const lpcCaveat = 'If the building is a designated landmark or in a historic district, the Landmarks Preservation Commission keeps a separate permit record: its online permit search covers applications from January 1, 2016; older ones need a Records Access Request.';
const DOB_CLAIM = 'NYC Department of Buildings issues building permits citywide (records in DOB BIS and DOB NOW).';
const DOB_NOTE = 'DOB BIS and DOB NOW answered "Access Denied" (Akamai) to our browser on 2026-10-03 and 2026-10-07, so nothing about them is verified. An older script note (publish-batch-b.ts:38) says the DOB walkthrough was verified for batch A; batch A\'s own note says DOB was blocked, so that line is wrong.';
// Re-verified 2026-11-17 in the browser (ledger nyc-dob-permit-records). DOB's information pages and
// NYC Open Data load; BIS and DOB NOW refuse connections from outside the US, so no search was run.
const NYC = led('nyc-dob-permit-records', '2026-11-17');
const NYC_DATA = 'https://data.cityofnewyork.us/Housing-Development/DOB-Permit-Issuance/ipu4-2q9a/about_data';
const NYC_OBTAIN = 'https://www.nyc.gov/site/buildings/property-or-business-owner/obtaining-a-permit.page';
const NYC_GUIDE = 'https://www.nyc.gov/site/buildings/property-or-business-owner/guide-to-bis-dobnow-efiling.page';
const US_ONLY: Ev = { ref: 'quote:Access is restricted to locations within the United States. For security reasons, any attempt to connect from outside the country will be blocked.', date: '2026-11-17' };
const nycBorough = (county: string, fips: string, borough: string, guide: { slug: string; id: number }) => {
  const id = `ny-${borough.toLowerCase().replace(/\s+/g, '-')}`;
  return {
    schemaVersion: 1, state: 'NY', countyFips: fips, county, guideSlug: guide.slug,
    jurisdictionCoverage: v('The NYC Department of Buildings issues construction and demolition permits across the City of New York, including this borough.', NYC_DATA, NYC('f1')),
    jurisdictions: [
      selfIssuing(id, `${borough} (New York City)`, 'borough', v(id, NYC_DATA, NYC('f1')), {
        buildingDepartment: v('NYC Department of Buildings (DOB)', NYC_DATA, NYC('f1')),
        currentPortal: v({ name: 'DOB NOW: Build' }, NYC_OBTAIN, NYC('f2')),
        portalUrl: v('https://a810-dobnow.nyc.gov/publish/#!/', 'https://www.nyc.gov/site/buildings/index.page', NYC('f5')),
        searchBy: nt('BIS and DOB NOW refuse connections from outside the United States, so their search options could not be checked.'),
        addressSearchTested: nt('BIS and DOB NOW refuse connections from outside the United States.'),
        historicalSystems: pv([{ name: 'Buildings Information System (BIS)', url: 'http://www.nyc.gov/bis', covers: 'jobs filed in BIS; complaints, violations, actions, applications and inspections' }, { name: 'NYC Open Data: DOB Permit Issuance', url: NYC_DATA, covers: 'permits issued in BIS only' }], NYC_GUIDE, NYC('f3', 'f4'), 'How far back BIS and the dataset reach is not stated on the pages we read.'),
        inspectionHistoryVisible: nt('DOB says BIS shows inspections, but BIS refuses connections from outside the United States, so we could not open one.'),
        localCaveats: v([
          'Permits are split between DOB NOW (most current permits) and BIS (older jobs); search both before concluding a permit is missing.',
          'NYC Open Data publishes BIS permits and DOB NOW permits as separate datasets.',
          'BIS and DOB NOW accept connections only from inside the United States.',
          lpcCaveat,
        ], NYC_OBTAIN, [...NYC('f2', 'f4', 'f6'), US_ONLY]),
      }),
    ],
    tests: [],
    blocked: [
      { url: 'https://a810-bisweb.nyc.gov/bisweb/bsqpm01.jsp', result: "HTTP 403 'Access is restricted to locations within the United States.'", date: '2026-11-17' },
      { url: 'https://a810-dobnow.nyc.gov/publish/#!/', result: "HTTP 403 'Access is restricted to locations within the United States.'", date: '2026-11-17' },
    ],
  };
};

const unresearched = (state: string, fips: string, county: string, guide: { slug: string; id: number; title: string; pub: string }, extra: { jurisdictions?: object[]; blocked?: object[]; note?: string } = {}) => ({
  schemaVersion: 1, state, countyFips: fips, county, guideSlug: guide.slug,
  jurisdictionCoverage: claim(`Our guide's title: "${guide.title}".`, `guide #${guide.id} (published ${guide.pub}), no recorded evidence`, extra.note),
  jurisdictions: extra.jurisdictions ?? [],
  tests: [], blocked: extra.blocked ?? [],
});

const AREAS: Record<string, object> = {
  // ---------- FLORIDA ----------
  'fl/12057-hillsborough': {
    schemaVersion: 1, state: 'FL', countyFips: '12057', county: 'Hillsborough County', guideSlug: 'check-building-permits-hillsborough-county-fl',
    jurisdictionCoverage: claim('The county (HillsGovHub) holds unincorporated permits; Tampa, Temple Terrace and Plant City hold their own.', 'guide #208', 'Portal facts for the county and Tampa were verified 2026-10-02; the city split itself was not quoted, and Temple Terrace and Plant City could not be checked (403 / no permit links).'),
    jurisdictions: [
      selfIssuing('fl-hillsborough-uninc', 'Unincorporated Hillsborough County', 'county-unincorporated',
        pv('fl-hillsborough-uninc', 'https://hcfl.gov/businesses/hillsgovhub', HB, 'The 2026-10-02 note covers portal facts; that HillsGovHub holds exactly the unincorporated area was not quoted.'), {
          currentPortal: v({ name: 'HillsGovHub' }, 'https://hcfl.gov/businesses/hillsgovhub', HB),
          portalUrl: v('https://hcfl.gov/businesses/hillsgovhub', 'https://hcfl.gov/businesses/hillsgovhub', HB),
          searchBy: v({ address: true, parcel: true, permitNumber: null, quirks: ['Check Permit Status needs no login', 'A Permits by Address report is available'] }, 'https://hcfl.gov/businesses/hillsgovhub', HB),
          addressSearchTested: nt('The 2026-10-02 check read the search options; no search result on an address was recorded.'),
          historicalSystems: v([{ name: 'PGM Store', url: 'https://hcfl.gov/businesses/permits-and-records/permits/rezoning-plans-and-permit-documents-and-records-pgm-store', covers: 'older permit files (shared login public/public); it does not contain HillsGovHub records' }], 'https://hcfl.gov/businesses/permits-and-records/permits/rezoning-plans-and-permit-documents-and-records-pgm-store', HB),
          localCaveats: v(['Older files are in the PGM Store and newer ones in HillsGovHub; neither contains the other, so search both.', 'The county removes records exempt under Florida Statutes 119.071 from public view.'], 'https://hcfl.gov/businesses/hillsgovhub', HB),
        }),
      selfIssuing('fl-hillsborough-tampa', 'City of Tampa', 'city',
        pv('fl-hillsborough-tampa', 'https://www.tampa.gov/construction-services', HB, 'Inferred from the city running its own permit portal; the city/county split was not quoted.'), {
          buildingDepartment: v('City of Tampa Construction Services Division', 'https://www.tampa.gov/construction-services', HB),
          currentPortal: v({ name: 'Accela Citizen Access', platform: 'Accela' }, 'https://aca-prod.accela.com/TAMPA/Default.aspx', AC),
          portalUrl: v('https://aca-prod.accela.com/TAMPA/Default.aspx', 'https://aca-prod.accela.com/TAMPA/Default.aspx', AC),
          searchBy: v({ address: true, parcel: true, permitNumber: true, quirks: ['Many functions work without a log-in', 'Search by Address includes a Parcel No. box', 'A Comprehensive Permit Summary by Address is offered'] }, 'https://aca-prod.accela.com/TAMPA/Default.aspx', AC),
          addressSearchTested: nt('No search was submitted on 2026-10-04 (the note says so).'),
          olderRecordsRequest: claim('Records requests through the city portal at cityoftampa.govqa.us.', 'guide #208 link; not in the verification note'),
          localCaveats: v(['General Search defaults to the last 12 months; move the start date back before concluding a permit is missing.'], 'https://aca-prod.accela.com/TAMPA/Default.aspx', AC),
        }),
      { id: 'fl-hillsborough-temple-terrace', name: 'City of Temple Terrace', kind: 'city', permitsIssuedBy: claim('Holds its own permits.', 'guide #208', 'Site could not be checked on 2026-10-02 (403 / no permit links).') },
      { id: 'fl-hillsborough-plant-city', name: 'City of Plant City', kind: 'city', permitsIssuedBy: claim('Holds its own permits.', 'guide #208', 'Site could not be checked on 2026-10-02 (403 / no permit links).') },
    ],
    tests: [], blocked: [],
  },
  'fl/12011-broward': {
    schemaVersion: 1, state: 'FL', countyFips: '12011', county: 'Broward County', guideSlug: 'check-building-permits-broward-county-fl',
    jurisdictionCoverage: pv('The county\'s own list counts 31 cities plus unincorporated Broward. Which department holds each city\'s permits is recorded only for Fort Lauderdale (LauderBuild).', 'https://dpepp.broward.org/BCS/Default.aspx?PossePresentation=ParcelSearchByAddress', BA, 'The city count was read on 2026-10-03; the departments of the other 30 cities were not researched.'),
    jurisdictions: [
      selfIssuing('fl-broward-uninc', 'Unincorporated Broward County', 'county-unincorporated',
        pv('fl-broward-uninc', 'https://dpepp.broward.org/BCS/Default.aspx?PossePresentation=ParcelSearchByAddress', BA, 'The county search page was read; its exact service area was not quoted.'), {
          currentPortal: v({ name: 'BCS Search for Permit by Address' }, 'https://dpepp.broward.org/BCS/Default.aspx?PossePresentation=ParcelSearchByAddress', BA),
          portalUrl: v('https://dpepp.broward.org/BCS/Default.aspx?PossePresentation=ParcelSearchByAddress', 'https://dpepp.broward.org/BCS/Default.aspx?PossePresentation=ParcelSearchByAddress', BA),
          searchBy: v({ address: true, parcel: true, permitNumber: null, quirks: ['Searches by address, folio or parcel number'] }, 'https://dpepp.broward.org/BCS/Default.aspx?PossePresentation=ParcelSearchByAddress', BA),
          addressSearchTested: nt('The 2026-10-03 check read the search fields and formats; no address result was recorded.'),
        }),
      selfIssuing('fl-broward-fort-lauderdale', 'City of Fort Lauderdale', 'city',
        pv('fl-broward-fort-lauderdale', 'https://www.fortlauderdale.gov/Government/Departments/Development-Services/LauderBuild', BA, 'Inferred from the city running its own LauderBuild permit system.'), {
          currentPortal: v({ name: 'LauderBuild' }, 'https://www.fortlauderdale.gov/Government/Departments/Development-Services/LauderBuild', BA),
          portalUrl: pv('https://www.fortlauderdale.gov/Government/Departments/Development-Services/LauderBuild', 'https://www.fortlauderdale.gov/Government/Departments/Development-Services/LauderBuild', BA, "This is the city's LauderBuild page; the search application's own address was not recorded."),
          searchBy: nt('The city says anyone can search without an account; the search fields were not recorded.'),
        }),
    ],
    tests: [], blocked: [{ url: 'https://bcpa.net/', result: 'would not load', date: '2026-10-03' }],
  },
  // Re-verified 2026-11-17 in the browser (ledger check-building-permits-miami-dade-county-fl).
  'fl/12086-miami-dade': (() => {
    const MD = led('check-building-permits-miami-dade-county-fl', '2026-11-17');
    const MF = 'https://www.miamidade.gov/global/economy/building/microfilm-plan-library.page';
    const MENU = 'https://www.miamidade.gov/Apps/RER/ePermittingMenu/Home/Permits';
    return {
      schemaVersion: 1, state: 'FL', countyFips: '12086', county: 'Miami-Dade County', guideSlug: 'check-building-permits-miami-dade-county-fl',
      jurisdictionCoverage: v('Miami-Dade County holds permits and plans for unincorporated areas, where folio numbers start with 30. For any other folio, the municipality holds the records.', MF, MD('f1')),
      jurisdictions: [
        selfIssuing('fl-miami-dade-uninc', 'Unincorporated Miami-Dade County', 'county-unincorporated', v('fl-miami-dade-uninc', MF, MD('f1')), {
          buildingDepartment: pv('Miami-Dade County Regulatory and Economic Resources (RER), Building and Construction', MF, MD('f1'), "Read from the page's breadcrumb, not quoted."),
          currentPortal: v({ name: 'e-Permitting Building Permit Selection Menu' }, MENU, MD('f6', 'f5')),
          portalUrl: v(MENU, MENU, MD('f6')),
          searchBy: v({ address: true, parcel: true, permitNumber: true, quirks: ['By address: a cross-reference to permit numbers, and open master permits', 'By folio: open permits only', 'Most lookups (history, inspections, fees) need the permit number'] }, MENU, MD('f6')),
          addressSearchTested: nt('The search form carries a reCAPTCHA; we do not complete bot checks, so no search was submitted (2026-11-17).'),
          historicalSystems: v([{ name: 'E-Microfilm', covers: 'building plans already digitized' }, { name: 'Microfilm Section (by appointment)', covers: 'plans still on film' }], MF, MD('f2')),
          olderRecordsRequest: v('Digitized plans download from E-Microfilm; plans still on film need an appointment with the Microfilm Section (786-315-2340). A non-refundable research fee of $18.75 (residential) or $46.34 (commercial) is paid first.', MF, MD('f2', 'f4')),
          inspectionHistoryVisible: pv('The menu offers Permit Inspection History by permit number.', MENU, MD('f6'), 'Not opened: the form carries a reCAPTCHA.'),
          localCaveats: v(['The county says plans are not available for single-family homes built 1961-1972 and parts of 1973-1978, or for anything built before 1938; 1979-1989 may be available.', 'Records are filed by permit number; find it from the address or folio first.'], MF, MD('f3', 'f2')),
        }),
        ...['Miami', 'Miami Beach', 'Coral Gables', 'Hialeah'].map((c) => ({ id: `fl-miami-dade-${c.toLowerCase().replace(/\s+/g, '-')}`, name: `City of ${c}`, kind: 'city', permitsIssuedBy: claim('Holds its own permits (our guide names iBuild for Miami, Citizen Access for Miami Beach, EnerGov for Coral Gables, records requests for Hialeah).', 'guide #90', 'City portals not checked on 2026-11-17.') })),
      ],
      tests: [],
      blocked: [{ url: MENU, result: 'Form carries a reCAPTCHA; no search submitted', date: '2026-11-17' }],
    };
  })(),

  // ---------- TEXAS ----------
  'tx/48201-harris': {
    schemaVersion: 1, state: 'TX', countyFips: '48201', county: 'Harris County', guideSlug: 'check-harris-county-permit-history-before-buying',
    jurisdictionCoverage: claim('The county holds permits for unincorporated areas; the City of Houston holds its own.', 'guide #78', 'The county permits page was browser-verified 2026-10-02; Houston\'s permitting center answered with a Cloudflare challenge and was not read.'),
    jurisdictions: [
      selfIssuing('tx-harris-uninc', 'Unincorporated Harris County', 'county-unincorporated',
        pv('tx-harris-uninc', 'https://oce.harriscountytx.gov/Services/Permits', HR, 'The county permits page was confirmed; that it covers only unincorporated areas was not quoted.'), {
          buildingDepartment: v('Harris County Office of the County Engineer', 'https://oce.harriscountytx.gov/Services/Permits', HR),
          currentPortal: v({ name: 'ePermits (with the OCE Permits Search Tool)' }, 'https://oce.harriscountytx.gov/Services/Permits', HR, { note: 'ePermits itself is at epermits.harriscountytx.gov ("Check Project Status").' }),
          portalUrl: v('https://oce.harriscountytx.gov/Services/Permits', 'https://oce.harriscountytx.gov/Services/Permits', HR, { note: 'The county permits page that links both search tools.' }),
          searchBy: nt('Tools confirmed on the page; no search run.'),
          localCaveats: v(['The old county link (eng.hctx.net/permits) now redirects to the home page of the renamed Office of the County Engineer, not to permits.'], 'https://oce.harriscountytx.gov/Services/Permits', HR),
        }),
      { id: 'tx-harris-houston', name: 'City of Houston', kind: 'city', permitsIssuedBy: claim('The Houston Permitting Center holds permits for addresses inside city limits; our guide names its portal iPermits.', 'guide #78', 'houstonpermittingcenter.org answered with a Cloudflare challenge on 2026-10-02; not bypassed.') },
    ],
    tests: [], blocked: [{ url: 'https://www.houstonpermittingcenter.org/', result: 'Cloudflare challenge (and 403 to automated requests on 2026-09-04)', date: '2026-10-02' }],
  },
  'tx/48439-tarrant': {
    schemaVersion: 1, state: 'TX', countyFips: '48439', county: 'Tarrant County', guideSlug: 'check-building-permits-tarrant-county-tx',
    jurisdictionCoverage: claim('Our guide\'s title: "Tarrant County Permits: Fort Worth & Arlington Portals".', 'guide #223 (published 2026-08-16), no recorded evidence for the city split'),
    jurisdictions: [
      selfIssuing('tx-tarrant-fort-worth', 'City of Fort Worth', 'city',
        pv('tx-tarrant-fort-worth', 'https://aca-prod.accela.com/CFW/', AC, 'Inferred from the city running its own Accela permitting system.'), {
          currentPortal: v({ name: 'Online Permitting System', platform: 'Accela' }, 'https://aca-prod.accela.com/CFW/', AC),
          portalUrl: v('https://aca-prod.accela.com/CFW/', 'https://aca-prod.accela.com/CFW/', AC),
          searchBy: v({ address: true, parcel: null, permitNumber: true, quirks: ['The same six search types as other Accela portals (General, Address, Licensed Professional, Record Information, Trade Name, Contact)'] }, 'https://aca-prod.accela.com/CFW/', AC),
          addressSearchTested: nt('No search was submitted on 2026-10-04 (the note says so).'),
          localCaveats: v(['General Search defaults to a five-year window; move the start date back for older permits.'], 'https://aca-prod.accela.com/CFW/', AC),
        }),
    ],
    tests: [], blocked: [],
  },
  // Re-verified 2026-11-17 in the browser (ledger check-building-permits-dallas-county-tx).
  'tx/48113-dallas': (() => {
    const DL = led('check-building-permits-dallas-county-tx', '2026-11-17');
    const DEPT = 'https://dallascityhall.com/departments/sustainabledevelopment/Pages/default.aspx';
    const NOW = 'https://dallascityhall.com/departments/sustainabledevelopment/Pages/DallasNow.aspx';
    const ACA = 'https://aca-prod.accela.com/DALLASTX/Cap/CapHome.aspx?module=Building&TabName=Building';
    return {
      schemaVersion: 1, state: 'TX', countyFips: '48113', county: 'Dallas County', guideSlug: 'check-building-permits-dallas-county-tx',
      jurisdictionCoverage: claim('Each city in Dallas County keeps its own permits; unincorporated areas go to Dallas County. The appraisal district record shows which city taxes a property.', 'guide #79, no recorded evidence', 'Only the City of Dallas was checked (2026-11-17); dallascounty.org was not reachable from our browser.'),
      jurisdictions: [
        selfIssuing('tx-dallas-city', 'City of Dallas', 'city', pv('tx-dallas-city', NOW, DL('f2'), 'Inferred from the city running its own permitting system; which addresses it covers was not quoted.'), {
          buildingDepartment: v('City of Dallas Planning and Development', DEPT, DL('f1')),
          currentPortal: v({ name: 'DallasNow', platform: 'Accela Citizen Access' }, NOW, DL('f2')),
          portalUrl: v(ACA, ACA, DL('f3', 'portalWalk')),
          searchBy: v({ address: true, parcel: true, permitNumber: true, quirks: ['Search by Address has an Appraisal Parcel ID box', 'No login needed to search'] }, ACA, DL('f3', 'portalWalk')),
          addressSearchTested: v('Anonymous Search by Address for 1500 Marilla St (Dallas City Hall) listed 100+ records; a General Search limited to 1980-2024 found 54 older records on the street.', ACA, DL('portalWalk')),
          onlineRecordsFrom: pv('2009 or earlier (the oldest record we found on the street searched)', ACA, DL('portalWalk'), 'The city does not state how far back DallasNow reaches. Older records carry an older number format, so they appear to be migrated, and one street is all we searched.'),
          historicalSystems: pv([{ name: 'Records from earlier city systems, shown inside DallasNow', covers: 'before DallasNow; an older record-number format (e.g. 2411213061_194396666-001)' }], NOW, DL('f2', 'portalWalk'), 'DallasNow says it integrates 15 systems including PDOX; that the older-format records came from those systems is our reading, not stated.'),
          inspectionHistoryVisible: nt('No record detail page was opened.'),
          localCaveats: v(['General Search starts at a default date (12/05/2015 when we checked); set the Start Date earlier before concluding an older permit is missing.', 'An address search lists only the newest 100 records; use General Search with a date range to reach older ones.', 'The address number filter in General Search is loose, so check each result\'s address.'], ACA, DL('portalWalk')),
        }),
        { id: 'tx-dallas-uninc', name: 'Unincorporated Dallas County', kind: 'county-unincorporated', permitsIssuedBy: claim('Dallas County Public Works or the county development department handles unincorporated permits; records usually by Texas Public Information Act request.', 'guide #79', 'dallascounty.org was not reachable from our browser on 2026-11-17.') },
      ],
      tests: [],
      blocked: [{ url: 'https://www.dallascounty.org/departments/pubworks/', result: "Navigation denied (site not on the browser's allowed list)", date: '2026-11-17' }],
    };
  })(),

  // ---------- ARIZONA / NEVADA ----------
  'az/04013-maricopa': {
    schemaVersion: 1, state: 'AZ', countyFips: '04013', county: 'Maricopa County', guideSlug: 'check-building-permits-maricopa-county-az',
    jurisdictionCoverage: claim('The county Permit Center holds unincorporated permits; Phoenix and other cities hold their own.', 'guide #82'),
    jurisdictions: [
      selfIssuing('az-maricopa-uninc', 'Unincorporated Maricopa County', 'county-unincorporated',
        pv('az-maricopa-uninc', 'https://www.maricopa.gov/6003/Maricopa-Countys-Permit-Center', RS(98), RS_LIMITS), {
          currentPortal: pv({ name: 'Maricopa County Permit Center' }, 'https://www.maricopa.gov/6003/Maricopa-Countys-Permit-Center', RS(98), RS_LIMITS),
          portalUrl: pv('https://www.maricopa.gov/6003/Maricopa-Countys-Permit-Center', 'https://www.maricopa.gov/6003/Maricopa-Countys-Permit-Center', RS(98), RS_LIMITS),
          onlineRecordsFrom: pv('May 2009', 'https://www.maricopa.gov/6003/Maricopa-Countys-Permit-Center', RS(98), RS_LIMITS),
          historicalSystems: pv([{ name: 'Permit Viewer', covers: 'closed permits, planning cases and violations, 1999 to June 2024' }], 'https://www.maricopa.gov/6003/Maricopa-Countys-Permit-Center', RS(98), RS_LIMITS),
          localCaveats: pv(['The county replaced its permitting system in June 2024, so a house altered before and after that date can have records in two systems.'], 'https://www.maricopa.gov/6003/Maricopa-Countys-Permit-Center', RS(98), RS_LIMITS),
        }),
      { id: 'az-maricopa-phoenix', name: 'City of Phoenix', kind: 'city', permitsIssuedBy: claim('Holds its own permits.', 'guide #82 title "Maricopa County & Phoenix Permit History Search"') },
    ],
    tests: [], blocked: [],
  },
  'nv/32003-clark': {
    schemaVersion: 1, state: 'NV', countyFips: '32003', county: 'Clark County', guideSlug: 'check-building-permits-clark-county-nv',
    jurisdictionCoverage: claim('The county holds permits for unincorporated townships (Paradise, Spring Valley, Enterprise, Sunrise Manor, Winchester); Las Vegas, North Las Vegas and Henderson hold their own.', 'guide #87'),
    jurisdictions: [
      selfIssuing('nv-clark-uninc', 'Unincorporated Clark County', 'county-unincorporated',
        pv('nv-clark-uninc', 'https://www.clarkcountynv.gov/government/departments/public_works_department/development/online-records-research', RS(120), RS_LIMITS), {
          currentPortal: claim('Citizen Access', 'guide #87', 'Its host resolved in DNS but would not connect from here on repeated attempts (2026-09-04).'),
          portalUrl: pv('https://www.clarkcountynv.gov/government/departments/public_works_department/development/online-records-research', 'https://www.clarkcountynv.gov/government/departments/public_works_department/development/online-records-research', RS(120), "This is the county's index of what is searchable and where, not the search portal itself. " + RS_LIMITS),
        }),
      ...['Las Vegas', 'North Las Vegas', 'Henderson'].map((c) => ({ id: `nv-clark-${c.toLowerCase().replace(/\s+/g, '-')}`, name: `City of ${c}`, kind: 'city', permitsIssuedBy: claim('Holds its own permits.', 'guide #87') })),
    ],
    tests: [], blocked: [],
  },

  // ---------- CALIFORNIA ----------
  'ca/06073-san-diego': {
    schemaVersion: 1, state: 'CA', countyFips: '06073', county: 'San Diego County', guideSlug: 'check-building-permits-san-diego-county-ca',
    jurisdictionCoverage: claim('The county holds unincorporated permits; the City of San Diego and each other incorporated city (Chula Vista, Oceanside, Escondido, Carlsbad and the rest) hold their own.', 'guide #91'),
    jurisdictions: [
      selfIssuing('ca-san-diego-uninc', 'Unincorporated San Diego County', 'county-unincorporated',
        pv('ca-san-diego-uninc', 'https://publicservices.sandiegocounty.gov/CitizenAccess', RS(109), RS_LIMITS), {
          currentPortal: pv({ name: 'Accela Citizen Access', platform: 'Accela' }, 'https://publicservices.sandiegocounty.gov/CitizenAccess', RS(109), RS_LIMITS),
          portalUrl: pv('https://publicservices.sandiegocounty.gov/CitizenAccess', 'https://publicservices.sandiegocounty.gov/CitizenAccess', RS(109), RS_LIMITS),
        }),
      selfIssuing('ca-san-diego-city', 'City of San Diego', 'city',
        pv('ca-san-diego-city', 'https://opendsd.sandiego.gov', RS(109), RS_LIMITS), {
          buildingDepartment: pv('City of San Diego Development Services Department', 'https://opendsd.sandiego.gov', RS(109), RS_LIMITS),
          currentPortal: pv({ name: 'OpenDSD' }, 'https://opendsd.sandiego.gov', RS(109), RS_LIMITS),
          portalUrl: pv('https://opendsd.sandiego.gov', 'https://opendsd.sandiego.gov', RS(109), RS_LIMITS),
        }),
    ],
    tests: [], blocked: [],
  },
  'ca/06085-santa-clara': {
    schemaVersion: 1, state: 'CA', countyFips: '06085', county: 'Santa Clara County', guideSlug: 'check-building-permits-santa-clara-county-ca',
    jurisdictionCoverage: claim('The county portal holds unincorporated permits; San Jose (SJPermits) and the other cities hold their own.', 'guide #220', 'Both portals were verified 2026-10-03; the split itself and other cities were not. plandev.santaclaracounty.gov sits behind a Cloudflare check.'),
    jurisdictions: [
      selfIssuing('ca-santa-clara-uninc', 'Unincorporated Santa Clara County', 'county-unincorporated',
        pv('ca-santa-clara-uninc', 'https://aca-prod.accela.com/sccgov/Default.aspx', BA, 'County portal confirmed; its service area was not quoted.'), {
          currentPortal: v({ name: 'Public Permit Portal', platform: 'Accela' }, 'https://aca-prod.accela.com/sccgov/Default.aspx', BA),
          portalUrl: v('https://aca-prod.accela.com/sccgov/Default.aspx', 'https://aca-prod.accela.com/sccgov/Default.aspx', BA),
          searchBy: v({ address: true, parcel: true, permitNumber: true, quirks: ['Development > Search Records', 'No account needed'] }, 'https://aca-prod.accela.com/sccgov/Default.aspx', BA),
        }),
      selfIssuing('ca-santa-clara-san-jose', 'City of San Jose', 'city',
        pv('ca-santa-clara-san-jose', 'https://www.sanjoseca.gov/business/development-services-permit-center/online-permits-at-sjpermits-org/how-to-check-your-permit-status', BA, 'Inferred from the city running its own SJPermits system.'), {
          currentPortal: v({ name: 'SJPermits' }, 'https://www.sanjoseca.gov/business/development-services-permit-center/online-permits-at-sjpermits-org/how-to-check-your-permit-status', BA),
          portalUrl: pv('https://www.sanjoseca.gov/business/development-services-permit-center/online-permits-at-sjpermits-org/how-to-check-your-permit-status', 'https://www.sanjoseca.gov/business/development-services-permit-center/online-permits-at-sjpermits-org/how-to-check-your-permit-status', BA, "This is the city's how-to page for SJPermits; the search application's own address was not recorded."),
          searchBy: nt('Search fields were read on the city\'s how-to page but not recorded; no search run.'),
          onlineRecordsFrom: nr({ note: "San Jose's online date range was cut as unverifiable on 2026-10-03." }),
        }),
    ],
    tests: [], blocked: [{ url: 'https://plandev.santaclaracounty.gov/', result: 'Cloudflare check; not worked around', date: '2026-10-03' }],
  },
  'ca/06067-sacramento': {
    schemaVersion: 1, state: 'CA', countyFips: '06067', county: 'Sacramento County', guideSlug: 'check-building-permits-sacramento-county-ca',
    jurisdictionCoverage: pv('The City of Sacramento and the county run separate permit portals.', 'https://aca-prod.accela.com/SACRAMENTO/Cap/CapHome.aspx?module=Building&TabName=Building', BB, "The other cities' building departments in Sacramento County were not verified (the 2026-10-07 note says so)."),
    jurisdictions: [
      selfIssuing('ca-sacramento-city', 'City of Sacramento', 'city',
        pv('ca-sacramento-city', 'https://aca-prod.accela.com/SACRAMENTO/Cap/CapHome.aspx?module=Building&TabName=Building', BB, 'Inferred from the city running its own permit portal.'), {
          currentPortal: v({ name: 'Public Permit Portal', platform: 'Accela' }, 'https://aca-prod.accela.com/SACRAMENTO/Cap/CapHome.aspx?module=Building&TabName=Building', BB),
          portalUrl: v('https://aca-prod.accela.com/SACRAMENTO/Cap/CapHome.aspx?module=Building&TabName=Building', 'https://aca-prod.accela.com/SACRAMENTO/Cap/CapHome.aspx?module=Building&TabName=Building', BB),
          searchBy: v({ address: true, parcel: true, permitNumber: true, owner: null, quirks: ['No account needed', 'Site address is street number plus street name', 'Contractor licence search too'] }, 'https://aca-prod.accela.com/SACRAMENTO/Cap/CapHome.aspx?module=Building&TabName=Building', BB),
          addressSearchTested: pv('A search on a one-letter street name returned "100+" results.', 'https://aca-prod.accela.com/SACRAMENTO/Cap/CapHome.aspx?module=Building&TabName=Building', BB, 'A street-name search, not a full public address.'),
        }),
      selfIssuing('ca-sacramento-uninc', 'Unincorporated Sacramento County', 'county-unincorporated',
        pv('ca-sacramento-uninc', 'https://actonline.saccounty.gov/CitizenAccess/', BB, 'County portal confirmed; its service area was not quoted.'), {
          currentPortal: v({ name: 'Sacramento County Citizen Access (ACA)', platform: 'Accela' }, 'https://actonline.saccounty.gov/CitizenAccess/', BB),
          portalUrl: v('https://actonline.saccounty.gov/CitizenAccess/', 'https://actonline.saccounty.gov/CitizenAccess/', BB),
          searchBy: nt('Building search "requires registration and/or login"; we did not register.'),
          localCaveats: v(['The county\'s Building search requires registration and/or login.'], 'https://actonline.saccounty.gov/CitizenAccess/', BB),
        }),
    ],
    tests: [], blocked: [],
  },
  // Re-verified 2026-11-17 in the browser (ledger check-building-permits-los-angeles-county-ca).
  'ca/06037-los-angeles': (() => {
    const LA = led('check-building-permits-los-angeles-county-ca', '2026-11-17');
    const ABOUT = 'https://dpw.lacounty.gov/building-and-safety/about';
    const HOME = 'https://dpw.lacounty.gov/building-and-safety/';
    const EPIC = 'https://losangelescountyca-energovweb.tylerhost.net/apps/selfservice#/search';
    const contract = ['Cerritos', 'Industry', 'La Mirada', 'Rolling Hills', 'Westlake Village'];
    return {
      schemaVersion: 1, state: 'CA', countyFips: '06037', county: 'Los Angeles County', guideSlug: 'check-building-permits-los-angeles-county-ca',
      jurisdictionCoverage: pv('LA County Public Works (Building and Safety) serves unincorporated communities and contract cities. Its page says 8 contract city offices but its office list names 5. Other incorporated cities, including the City of Los Angeles, are not covered by the county.', ABOUT, LA('f1', 'f2'), "The 3 unnamed contract cities and which incorporated cities run their own departments are not confirmed; ladbs.org (City of LA) blocks our region."),
      jurisdictions: [
        selfIssuing('ca-la-uninc', 'Unincorporated Los Angeles County', 'county-unincorporated', v('ca-la-uninc', ABOUT, LA('f1')), {
          buildingDepartment: v('Los Angeles County Public Works, Building and Safety Division', ABOUT, LA('f1')),
          currentPortal: v({ name: 'EPIC-LA', platform: 'Tyler EnerGov Self Service' }, HOME, LA('f3', 'f4')),
          portalUrl: v(EPIC, EPIC, LA('f4', 'portalWalk')),
          searchBy: v({ address: true, parcel: null, permitNumber: null, quirks: ['One keyword-or-address box; filter by Permit, Plan, Inspection, License or Project', 'No account needed to search'] }, EPIC, LA('f4', 'portalWalk')),
          addressSearchTested: v('Anonymous search for 13650 Mindanao Way (Burton Chace Park, a county park) returned 53 records: road, utility, film and vending permits, issued 2016 to 2026.', EPIC, LA('portalWalk')),
          onlineRecordsFrom: pv('2015 or earlier (a record applied for in 2015 at the address we searched)', EPIC, LA('portalWalk'), 'The county does not state where EPIC-LA records begin, and no building permit appeared at our test address, so building-permit coverage is unconfirmed.'),
          historicalSystems: pv([{ name: 'Building Permit Viewer', url: 'https://dpw.lacounty.gov/bsd/bpv/', covers: 'not stated' }], HOME, LA('f3'), 'Linked from the county page; it stayed on its loading screen for us, so what it holds is unknown.'),
          inspectionHistoryVisible: nt('EPIC-LA offers an Inspection search type, but we did not open an inspection record.'),
          localCaveats: v(['EPIC-LA results mix building permits with road, utility, film and vending permits; filter by type.', 'Since July 6, 2026, permits for the unincorporated Torrance and Harbor City areas are handled by the Lomita District Office.'], HOME, LA('portalWalk', 'f5')),
        }),
        ...contract.map((c) => ({ id: `ca-la-${c.toLowerCase().replace(/\s+/g, '-')}`, name: `City of ${c}`, kind: 'city-served-by-county',
          permitsIssuedBy: pv('ca-la-uninc', ABOUT, LA('f2'), 'Listed among the county\'s Contract City Offices. The page\'s text says 8 contract city offices, so the list may be incomplete.') })),
        { id: 'ca-la-los-angeles', name: 'City of Los Angeles', kind: 'city', permitsIssuedBy: claim('The Los Angeles Department of Building and Safety (LADBS) holds permits; scanned records are in IDIS.', 'guide #222', 'ladbs.org answered HTTP 403 "The request is blocked." on 2026-11-17 (and to automated requests on 2026-09-04).') },
      ],
      tests: [],
      blocked: [
        { url: 'https://www.ladbs.org/', result: "HTTP 403 'The request is blocked.'", date: '2026-11-17' },
        { url: 'https://dpw.lacounty.gov/bsd/bpv/', result: 'Building Permit Viewer stayed on its loading screen', date: '2026-11-17' },
      ],
    };
  })(),
  // Re-verified 2026-11-17 in the browser (ledger check-building-permits-orange-county-ca).
  'ca/06059-orange': (() => {
    const OC = led('check-building-permits-orange-county-ca', '2026-11-17');
    const BS = 'https://pwds.oc.gov/service-areas/oc-development-services/building-safety';
    const PS = 'https://pwds.oc.gov/service-areas/oc-development-services/permitting-services';
    const PRR = 'https://pw.oc.gov/';
    return {
      schemaVersion: 1, state: 'CA', countyFips: '06059', county: 'Orange County', guideSlug: 'check-building-permits-orange-county-ca',
      jurisdictionCoverage: pv('OC Public Works Building and Safety covers the unincorporated areas of Orange County. Properties inside a city go to that city.', BS, OC('f1'), 'The county page names only its own area; the list of cities and their departments was not checked.'),
      jurisdictions: [
        selfIssuing('ca-orange-uninc', 'Unincorporated Orange County', 'county-unincorporated', v('ca-orange-uninc', BS, OC('f1')), {
          buildingDepartment: v('OC Public Works, OC Development Services, Building and Safety', BS, OC('f1')),
          currentPortal: pv({ name: 'myOC eServices (applications, payments, service requests)' }, 'https://myoceservices.ocgov.com/', OC('f3'), 'We found no option to search a property\'s permit history in it.'),
          searchBy: nt('No public permit-history search found on the county pages we read, so nothing could be tested.'),
          addressSearchTested: nt('No public permit-history search found to test.'),
          olderRecordsRequest: v('Ask Permitting Services for property records research ((714) 667-8888), or file a public records request on the county\'s NextRequest portal.', PS, OC('f2', 'f4')),
          localCaveats: v(['We found no public online permit-history search for unincorporated Orange County; records come through Permitting Services or a public records request.'], PS, OC('f2', 'f3')),
        }),
      ],
      tests: [],
      blocked: [{ url: 'https://ocpw.ocgov.com/', result: 'ERR_NAME_NOT_RESOLVED (old hostname)', date: '2026-11-17' }],
    };
  })(),
  // Re-verified 2026-11-17 in the browser (ledger check-building-permits-riverside-county-ca).
  'ca/06065-riverside': (() => {
    const RV = led('check-building-permits-riverside-county-ca', '2026-11-17');
    const RR = 'https://building.rctlma.org/records-request';
    const LOOKUP = 'https://publiclookup.rivco.org/';
    const INSP: Ev = { ref: 'quote:Repeat these steps on "Building Permit Inspection history" to see the individual inspections.', date: '2026-11-17' };
    return {
      schemaVersion: 1, state: 'CA', countyFips: '06065', county: 'Riverside County', guideSlug: 'check-building-permits-riverside-county-ca',
      jurisdictionCoverage: claim('The county (TLMA Building and Safety) holds permits for unincorporated areas; each incorporated city holds its own.', 'guide #216, no recorded evidence', 'The county pages read on 2026-11-17 do not state which areas they cover.'),
      jurisdictions: [
        selfIssuing('ca-riverside-uninc', 'Unincorporated Riverside County', 'county-unincorporated', pv('ca-riverside-uninc', RR, RV('f5'), 'The county runs its own permit records; the pages we read do not say which areas they cover.'), {
          buildingDepartment: v('Riverside County Transportation and Land Management Agency (TLMA), Department of Building and Safety', RR, RV('f5')),
          currentPortal: v({ name: 'PLUS Online and TLMA Permit Lookup', platform: 'Tyler EnerGov Self Service (PLUS Online)' }, RR, RV('f2', 'f7')),
          portalUrl: v(LOOKUP, LOOKUP, RV('f6', 'portalWalk')),
          searchBy: v({ address: true, parcel: true, permitNumber: true, quirks: ['Permit Lookup searches by street name, APN (no dashes), tract, lot, dates and permit type', 'Map My County\'s parcel report lists permits under "Building and Safety Cases"', 'No login needed'] }, LOOKUP, RV('portalWalk', 'f6')),
          addressSearchTested: v('Anonymous Permit Lookup searches: a street name returned 30 permits; a county park address (37701 Warren Rd, Winchester) returned none.', LOOKUP, RV('portalWalk')),
          onlineRecordsFrom: v('1997 (permits issued after 1997 are online; the earliest issued date in Permit Lookup was 1997-06-20)', RR, [...RV('f2'), { ref: 'test:riverside-lookup-earliest', date: '2026-11-17' }]),
          historicalSystems: v([{ name: 'Archived permit records, Records Division', covers: 'about 1963 to 1997 (not online)' }, { name: 'Assessor CAP report / Residential Building Record', url: 'https://www.rivcoacr.org/Contact-Us', covers: 'before 1963, building history or details such as year built' }], RR, RV('f1', 'f2')),
          olderRecordsRequest: v('Request archived records from the Building and Safety Records Division (Records@rivco.org, 951-955-2017) with the address or APN; a fee applies to copies or research. Before 1963, ask the Assessor for a CAP report.', RR, RV('f5', 'f1')),
          inspectionHistoryVisible: pv('The county says individual inspections can be viewed online by permit number.', RR, [INSP], 'We did not open an inspection record.'),
          localCaveats: v(['Permit records before about 1963 were destroyed.', 'Only permits issued after 1997 are online; 1963-1997 permits need a records request.', 'Residential building plans are not kept: they are returned to the applicant or destroyed once the project is complete.', 'Permit Lookup is updated once a day and can be up to 24 hours behind.'], RR, RV('f1', 'f2', 'f4', 'f6')),
        }),
      ],
      tests: [
        {
          id: 'riverside-lookup-earliest', date: '2026-11-17', system: 'TLMA Permit Lookup, https://publiclookup.rivco.org/',
          subject: 'The whole Permit Lookup database (no property).',
          steps: 'Issued To 1990-01-01; then Issued From 1990-01-01 sorted by Issued Date ascending.',
          result: 'Before 1990: "No results found for your search." From 1990: Total Rows 658098, Permit Count 471219, earliest issued date 1997-06-20.',
          limits: 'Permits with no issued date are not covered by an issued-date filter.',
        },
      ],
      blocked: [],
    };
  })(),
  'ca/06071-san-bernardino': unresearched('CA', '06071', 'San Bernardino County', { slug: 'check-building-permits-san-bernardino-county-ca', id: 215, title: 'San Bernardino Permits: EZ Online Permitting Portal', pub: '2026-08-16' }, {
    note: 'Re-verification attempted 2026-11-17: sbcounty.gov is not approved for our browser, so nothing could be read.',
    blocked: [{ url: 'https://sbcounty.gov/ and https://lus.sbcounty.gov/', result: 'Navigation denied (site not approved for the browser)', date: '2026-11-17' }],
  }),

  // ---------- NEW YORK CITY ----------
  'ny/36047-kings': nycBorough('Kings County', '36047', 'Brooklyn', { slug: 'check-building-permits-brooklyn-ny', id: 94 }),
  // HPD Online (verified 2026-10-07) holds housing-maintenance records, not permits, so it is not in this database.
  'ny/36061-new-york': nycBorough('New York County', '36061', 'Manhattan', { slug: 'check-building-permits-manhattan-ny', id: 93 }),
  'ny/36081-queens': nycBorough('Queens County', '36081', 'Queens', { slug: 'check-building-permits-queens-ny', id: 138 }),
  'ny/36005-bronx': nycBorough('Bronx County', '36005', 'Bronx', { slug: 'check-building-permits-bronx-ny', id: 140 }),

  // ---------- OTHER ----------
  // Re-verified 2026-11-17 in the browser (ledger check-building-permits-cook-county-il).
  'il/17031-cook': (() => {
    const CK = led('check-building-permits-cook-county-il', '2026-11-17');
    const BZ = 'https://www.cookcountyil.gov/agency/building-and-zoning';
    const STATUS = 'https://bzpermits.cookcountyil.gov/permit-status/';
    const DATA = 'https://data.cityofchicago.org/Buildings/Building-Permits/ydr8-5enu/about_data';
    return {
      schemaVersion: 1, state: 'IL', countyFips: '17031', county: 'Cook County', guideSlug: 'check-building-permits-cook-county-il',
      jurisdictionCoverage: v('Cook County Building and Zoning handles unincorporated Cook County and the Forest Preserves. The City of Chicago and the suburban cities and villages handle their own permits.', BZ, CK('f1', 'f2')),
      jurisdictions: [
        selfIssuing('il-cook-uninc', 'Unincorporated Cook County', 'county-unincorporated', v('il-cook-uninc', BZ, CK('f1')), {
          buildingDepartment: v('Cook County Department of Building and Zoning', BZ, CK('f1')),
          currentPortal: pv({ name: 'Building Permit Status Search' }, STATUS, CK('f4', 'f3'), 'Built for applicants checking their own application; we found no public permit search by address on the county\'s pages. The ePermit portal only takes applications.'),
          portalUrl: v(STATUS, STATUS, CK('f4')),
          searchBy: v({ address: false, parcel: false, permitNumber: true, quirks: ['Needs the permit application number AND the Property Index Number (PIN) together'] }, STATUS, CK('f4')),
          addressSearchTested: v('Not possible in the county tool: it asks for the permit number and the PIN, not an address.', STATUS, CK('f4')),
          localCaveats: v(["The county's online status search needs both the permit number and the PIN, so it cannot find permits you don't already know about.", 'Check with CookViewer whether a property is unincorporated; the county cannot process permits inside Chicago or the suburban municipalities.'], 'https://www.cookcountyil.gov/service/e-permits', CK('f2', 'f4')),
        }),
        selfIssuing('il-cook-chicago', 'City of Chicago', 'city', v('il-cook-chicago', DATA, CK('f5')), {
          buildingDepartment: v('City of Chicago Department of Buildings', DATA, CK('f5')),
          currentPortal: v({ name: 'Building Permits dataset, Chicago Data Portal' }, DATA, CK('f5')),
          portalUrl: v(DATA, DATA, CK('f5')),
          searchBy: pv({ address: true, parcel: null, permitNumber: true, quirks: ['The dataset page links a City search for issued permits by permit number or street address'] }, DATA, CK('f6'), 'The linked City search was not opened.'),
          onlineRecordsFrom: v('2006', DATA, CK('f5')),
          localCaveats: v(['The data covers permits issued from 2006; older permits are not in it.', 'Permits voided or revoked after issuance are left out of the data.'], DATA, CK('f5')),
        }),
      ],
      tests: [], blocked: [],
    };
  })(),
  // Re-verified 2026-11-17 in the browser (ledger check-building-permits-philadelphia-county-pa).
  'pa/42101-philadelphia': (() => {
    const PH = led('check-building-permits-philadelphia-county-pa', '2026-11-17');
    const ATLAS = 'https://atlas.phila.gov/';
    const PROP = 'https://li.phila.gov/Property-History/';
    return {
      schemaVersion: 1, state: 'PA', countyFips: '42101', county: 'Philadelphia County', guideSlug: 'check-building-permits-philadelphia-county-pa',
      jurisdictionCoverage: pv('The City of Philadelphia Department of Licenses & Inspections (L&I) is the source of permit records for Philadelphia addresses in Atlas.', ATLAS, PH('f2'), 'Philadelphia is one consolidated city and county, but no page we read says so; recorded from the L&I source line only.'),
      jurisdictions: [
        selfIssuing('pa-philadelphia', 'City of Philadelphia', 'consolidated-city-county', v('pa-philadelphia', ATLAS, PH('f2')), {
          buildingDepartment: v('City of Philadelphia Department of Licenses & Inspections (L&I)', ATLAS, PH('f2')),
          currentPortal: v({ name: 'Atlas (L&I tab) and L&I Property History' }, ATLAS, PH('f1', 'f3')),
          portalUrl: v(ATLAS, ATLAS, PH('f1')),
          searchBy: v({ address: true, parcel: true, permitNumber: null, quirks: ['Atlas also takes an intersection or a Department of Records Map Registry number', '"Parcel" here is the property assessment (OPA) account number', 'No login needed'] }, ATLAS, PH('f1')),
          addressSearchTested: v('Anonymous searches for 1400 John F Kennedy Blvd (City Hall) and 1901 Vine St (Parkway Central Library) returned 250 and 95 permits, with inspections and violations, in both Atlas and L&I Property History.', PROP, PH('portalWalk', 'f3')),
          onlineRecordsFrom: pv('2007', PROP, PH('portalWalk', 'f3'), 'At both public buildings we searched, the earliest permit was issued in 2007. The city does not state a start year on the pages we read, and no house was searched.'),
          inspectionHistoryVisible: v('Yes: Atlas lists inspections with their results (for example PASSED or FAILED) at the address.', ATLAS, PH('portalWalk', 'f2')),
          localCaveats: pv(['Online permit lists started in 2007 at both addresses we searched; a house built or renovated earlier may have permits that are not online.', 'Atlas shows a summary; the full permit list is on L&I Property History.', 'City Hall showed exactly 250 permits in both tools, which may be a display limit.'], PROP, PH('portalWalk', 'f3'), 'Read at two public buildings; the 2007 start and the 250 figure are observations, not stated by the city.'),
        }),
      ],
      tests: [], blocked: [],
    };
  })(),
  // Re-verified 2026-11-17 in the browser for Cambridge only (ledger check-building-permits-middlesex-county-ma).
  'ma/25017-middlesex': (() => {
    const MX = led('check-building-permits-middlesex-county-ma', '2026-11-17');
    const ISD = 'https://www.cambridgema.gov/inspection';
    const DATA = 'https://data.cambridgema.gov/Inspectional-Services/Building-Permits-Addition-Alteration/qu2z-8suj/about_data';
    return {
      ...unresearched('MA', '25017', 'Middlesex County', { slug: 'check-building-permits-middlesex-county-ma', id: 213, title: 'Middlesex County MA Permits: Town Halls & Street Files', pub: '2026-08-16' }, { note: 'Only Cambridge was checked (2026-11-17). No state source for "each city and town issues its own permits" was read.' }),
      jurisdictions: [
        selfIssuing('ma-middlesex-cambridge', 'City of Cambridge', 'city', pv('ma-middlesex-cambridge', ISD, MX('f1'), 'Inferred from the city running its own permit department; which department covers which addresses was not quoted.'), {
          buildingDepartment: v('City of Cambridge Inspectional Services Department', ISD, MX('f1')),
          currentPortal: pv({ name: 'City of Cambridge Permitting and Licensing System', platform: 'OpenGov' }, 'https://cambridgema.portal.opengov.com/', MX('f2'), 'For applying; no public record search on its public page.'),
          searchBy: nt('The open data datasets can be filtered, but we did not search them by address.'),
          historicalSystems: pv([{ name: 'Cambridge Open Data: Building Permits datasets', url: DATA, covers: 'not stated (Housing Permits dataset: 1996 to present)' }], DATA, MX('f3'), 'Start years of the building-permit datasets are not stated, and we did not search them.'),
          localCaveats: v(['Cambridge\'s Building Permits: Addition/Alteration open dataset lists only completed applications.'], DATA, MX('f3')),
        }),
      ],
      blocked: [{ url: 'https://search.mass.gov/', result: 'No readable results returned to our browser', date: '2026-11-17' }],
    };
  })(),
};

for (const [rel, area] of Object.entries(AREAS)) {
  const file = path.join('data/permit-records', rel + '.json');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(area, null, 2) + '\n');
}
console.log(`wrote ${Object.keys(AREAS).length} county files`);
