// One-off generator for data/permit-records/fl/12103-pinellas.json from the Pinellas fact ledger
// (data/fact-ledgers/check-building-permits-pinellas-county-fl.json, read 2026-11-16). Kept so the
// mapping from ledger facts to fields can be reviewed. Re-running overwrites the file.
import fs from 'node:fs';

const L = 'ledger:check-building-permits-pinellas-county-fl#';
const D = '2026-11-16';
const DEPTS = 'https://pinellas.gov/building-departments-in-pinellas-county/';
const PORTAL = 'https://aca-prod.accela.com/PINELLAS/Cap/CapHome.aspx?module=Building&TabName=Building';
const slug = (s: string) => 'fl-pinellas-' + s.toLowerCase().replace(/^city of |^town of /, '').replace(/[^a-z0-9]+/g, '-').replace(/-$/, '');

const servedByCounty = ['Belleair Beach', 'Belleair Shore', 'Indian Rocks Beach', 'Kenneth City', 'Safety Harbor', 'Oldsmar'];
const ownDept = ['Belleair', 'Clearwater', 'Dunedin', 'Gulfport', 'Indian Shores', 'Largo', 'Madeira Beach', 'North Redington Beach', 'Pinellas Park', 'Redington Shores', 'St. Pete Beach', 'St. Petersburg', 'Seminole', 'South Pasadena', 'Tarpon Springs', 'Treasure Island'];

const uninc = 'fl-pinellas-uninc';
const v = (value: unknown, sourceUrl: string, ev: string[], extra: object = {}) => ({ status: 'verified', value, sourceUrl, evidence: ev.map((e) => (e.includes(':') ? e : L + e)), checkedOn: D, ...extra });
const nr = (extra: object = {}) => ({ status: 'not_researched', value: null, ...extra });
const nt = (reason: string) => ({ status: 'not_tested', value: null, reason });

const jurisdictions: any[] = [
  {
    id: uninc, name: 'Unincorporated Pinellas County', kind: 'county-unincorporated',
    permitsIssuedBy: v(uninc, DEPTS, ['f1']),
    buildingDepartment: v('Pinellas County Building and Development Review Services', DEPTS, ['f1']),
    currentPortal: v({ name: 'Access Portal', platform: 'Accela Citizen Access' }, PORTAL, [L + 'portalWalk', 'f20'], { note: 'Name as the county uses it for lien searches; the portal host is aca-prod.accela.com/PINELLAS.' }),
    portalUrl: v(PORTAL, PORTAL, [L + 'portalWalk', 'f5']),
    searchBy: v({ address: true, parcel: true, permitNumber: true, quirks: ['Search by address, then pick the matching parcel', 'Results default to records created in the past two years; change the start date for older records', '% is a wildcard for part of a record number'] }, PORTAL, ['f5', L + 'portalWalk']),
    addressSearchTested: v('Anonymous Search by Address at 12520 Ulmerton Rd (county-owned Florida Botanical Gardens) returned 8 address entries holding different records: 22, 18, 19, 15, 0, 5 and 5 permits.', PORTAL, [L + 'portalWalk', 'f6']),
    onlineRecordsFrom: { status: 'partially_verified', value: '2007 or earlier (PER-H permits from 2007 appeared at the address we searched)', sourceUrl: PORTAL, evidence: [L + 'f6', L + 'portalWalk'], checkedOn: D, limits: 'The county does not state where online records begin; this is the oldest record seen at one public address.' },
    historicalSystems: nr({ note: 'No separate older system identified in our research.' }),
    olderRecordsRequest: nr(),
    inspectionHistoryVisible: v('Yes, without an account: open the permit, Record Info, then Inspections. Results show dates and outcomes such as Approved and Red tag. The county also offers results by text message.', 'https://pinellas.gov/building-inspections/', ['f8', 'f7']),
    localCaveats: v([
      'Results default to the past two years; widen the date range before concluding a permit is missing.',
      'One street address can appear as several address entries, each holding different permits; open every entry.',
      'The mailing city does not show the jurisdiction: unincorporated properties carry St. Petersburg, Largo or Clearwater addresses. Confirm it with My Neighborhood Services or pcpao.gov.',
      "Belleair Bluffs moved permitting to SAFEbuilt on August 15, 2025; permits already open then stay with the county through final inspection.",
      'The code-enforcement lien search is separate from permits and needs an Access Portal account.',
    ], DEPTS, ['f5', 'f6', 'f23', 'f2', 'f3', 'f20']),
  },
  ...servedByCounty.map((c) => ({ id: slug(c), name: c, kind: 'city-served-by-county', permitsIssuedBy: v(uninc, DEPTS, ['f1']) })),
  {
    id: slug('Belleair Bluffs'), name: 'Belleair Bluffs', kind: 'municipality-contracted',
    permitsIssuedBy: v(slug('Belleair Bluffs'), DEPTS, ['f3'], { note: 'Since August 15, 2025. Permits already open on that date stay with the county through final inspection.' }),
    buildingDepartment: v('SAFEbuilt (contracted building services)', DEPTS, ['f3']),
    currentPortal: nr(), portalUrl: nr(), searchBy: nr(),
    addressSearchTested: nt('No Belleair Bluffs portal identified or searched.'),
    onlineRecordsFrom: nr(), historicalSystems: nr(),
    olderRecordsRequest: nr({ note: 'Permits from before August 15, 2025 were county permits: search the county Access Portal.' }),
    inspectionHistoryVisible: nt('No Belleair Bluffs permit opened.'),
    localCaveats: v(['Permits from before August 15, 2025 are county permits; open ones stay with the county through final inspection.'], DEPTS, ['f3']),
  },
  ...ownDept.map((c) => ({
    id: slug(c), name: c, kind: 'city',
    permitsIssuedBy: v(slug(c), DEPTS, ['f4']),
    buildingDepartment: v(`${c} building department`, DEPTS, ['f4'], { note: "The county's list says the city has its own building department; the department's own name was not read." }),
    currentPortal: nr(), portalUrl: nr(), searchBy: nr(),
    addressSearchTested: nt('Not researched yet.'),
    onlineRecordsFrom: nr(), historicalSystems: nr(), olderRecordsRequest: nr(),
    inspectionHistoryVisible: nt('Not researched yet.'),
    localCaveats: nr(),
  })),
  { id: slug('Redington Beach'), name: 'Redington Beach', kind: 'city', permitsIssuedBy: v(slug('Redington Shores'), DEPTS, ['f4'], { note: "The county's list says Redington Shores' department also serves Redington Beach." }) },
];

const area = {
  schemaVersion: 1, state: 'FL', countyFips: '12103', county: 'Pinellas County', guideSlug: 'check-building-permits-pinellas-county-fl',
  jurisdictionCoverage: { status: 'partially_verified', value: 'The county issues permits for unincorporated Pinellas and six cities; Belleair Bluffs contracts SAFEbuilt; sixteen cities run their own departments, one of which (Redington Shores) also serves Redington Beach.', sourceUrl: DEPTS, evidence: [L + 'f1', L + 'f3', L + 'f4'], checkedOn: D, limits: "Taken from the county's list of building departments; we have not confirmed it against each city." },
  jurisdictions,
  tests: [],
  blocked: [],
};
fs.writeFileSync('data/permit-records/fl/12103-pinellas.json', JSON.stringify(area, null, 2) + '\n');
console.log('wrote', jurisdictions.length, 'jurisdictions');
