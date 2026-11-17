// Generator for the 22 county files whose evidence is NOT a fact ledger (2026-11-17).
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

const v = (value: unknown, sourceUrl: string, e: Ev, extra: object = {}) => ({ status: 'verified', value, sourceUrl, evidence: [e.ref], checkedOn: e.date, ...extra });
const pv = (value: unknown, sourceUrl: string, e: Ev, limits: string, extra: object = {}) => ({ status: 'partially_verified', value, sourceUrl, evidence: [e.ref], checkedOn: e.date, limits, ...extra });
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
const nycBorough = (county: string, fips: string, borough: string, guide: { slug: string; id: number }) => ({
  schemaVersion: 1, state: 'NY', countyFips: fips, county, guideSlug: guide.slug,
  jurisdictionCoverage: claim(DOB_CLAIM, `guide #${guide.id}, no recorded evidence`, DOB_NOTE),
  jurisdictions: [
    {
      id: `ny-${borough.toLowerCase().replace(/\s+/g, '-')}`, name: `${borough} (New York City)`, kind: 'borough',
      permitsIssuedBy: claim(DOB_CLAIM, `guide #${guide.id}, no recorded evidence`, DOB_NOTE),
      localCaveats: v([lpcCaveat], LPC_URL, BA),
    },
  ],
  tests: [], blocked: [{ url: 'NYC DOB BIS and DOB NOW (addresses not recorded in our notes)', result: 'Access Denied (Akamai)', date: '2026-10-03' }],
});

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
  'fl/12086-miami-dade': unresearched('FL', '12086', 'Miami-Dade County', { slug: 'check-building-permits-miami-dade-county-fl', id: 90, title: 'Miami-Dade Permits by Folio: EnerGov & City Portals', pub: '2026-08-10' }),

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
  'tx/48113-dallas': unresearched('TX', '48113', 'Dallas County', { slug: 'check-building-permits-dallas-county-tx', id: 79, title: 'Dallas County Permit Search: City & Suburban Portals', pub: '2026-08-10' }),

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
  'ca/06037-los-angeles': unresearched('CA', '06037', 'Los Angeles County', { slug: 'check-building-permits-los-angeles-county-ca', id: 222, title: 'LA Permit Search by Address: IDIS, LADBS & EpicLA', pub: '2026-08-16' }, {
    note: 'On 2026-09-04 no LA County permit URL could be verified twice: dpw.lacounty.gov failed, ladbs.org returned 403 to automated requests, EPIC-LA answered once and failed once.',
    blocked: [{ url: 'https://www.ladbs.org/', result: '403 to automated requests', date: '2026-09-04' }],
  }),
  'ca/06059-orange': unresearched('CA', '06059', 'Orange County', { slug: 'check-building-permits-orange-county-ca', id: 221, title: 'Orange County CA Permits: OCPW & City Portals (CPRA)', pub: '2026-08-16' }),
  'ca/06065-riverside': unresearched('CA', '06065', 'Riverside County', { slug: 'check-building-permits-riverside-county-ca', id: 216, title: 'Riverside County Permits: PLUS Portal & City Searches', pub: '2026-08-16' }),
  'ca/06071-san-bernardino': unresearched('CA', '06071', 'San Bernardino County', { slug: 'check-building-permits-san-bernardino-county-ca', id: 215, title: 'San Bernardino Permits: EZ Online Permitting Portal', pub: '2026-08-16' }),

  // ---------- NEW YORK CITY ----------
  'ny/36047-kings': nycBorough('Kings County', '36047', 'Brooklyn', { slug: 'check-building-permits-brooklyn-ny', id: 94 }),
  // HPD Online (verified 2026-10-07) holds housing-maintenance records, not permits, so it is not in this database.
  'ny/36061-new-york': nycBorough('New York County', '36061', 'Manhattan', { slug: 'check-building-permits-manhattan-ny', id: 93 }),
  'ny/36081-queens': nycBorough('Queens County', '36081', 'Queens', { slug: 'check-building-permits-queens-ny', id: 138 }),
  'ny/36005-bronx': nycBorough('Bronx County', '36005', 'Bronx', { slug: 'check-building-permits-bronx-ny', id: 140 }),

  // ---------- OTHER ----------
  'il/17031-cook': unresearched('IL', '17031', 'Cook County', { slug: 'check-building-permits-cook-county-il', id: 89, title: 'Cook County Permit Portal: Search Records by Address', pub: '2026-08-10' }),
  'pa/42101-philadelphia': unresearched('PA', '42101', 'Philadelphia County', { slug: 'check-building-permits-philadelphia-county-pa', id: 92, title: 'Philadelphia L&I Permit & Violation Search by Address', pub: '2026-08-10' }),
  'ma/25017-middlesex': unresearched('MA', '25017', 'Middlesex County', { slug: 'check-building-permits-middlesex-county-ma', id: 213, title: 'Middlesex County MA Permits: Town Halls & Street Files', pub: '2026-08-16' }),
};

for (const [rel, area] of Object.entries(AREAS)) {
  const file = path.join('data/permit-records', rel + '.json');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(area, null, 2) + '\n');
}
console.log(`wrote ${Object.keys(AREAS).length} county files`);
