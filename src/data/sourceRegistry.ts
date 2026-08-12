export interface SourceRegistryEntry {
  id: string;
  name: string;
  agency: string;
  governmentLevel: 'Federal' | 'State' | 'County' | 'Municipal';
  officialUrl: string;
  dataTypes: string[];
  // Whether BeforeRegret actually queries this source in real time right now, as opposed to
  // just linking to it for the requester to check themselves. This used to be a fabricated
  // "quarterlyAuditStatus: Audited & Confirmed" claim applied identically to every entry,
  // including sources that were never queried at all (a decommissioned HIFLD portal, county
  // assessor records that don't exist anywhere in this codebase). That was pure invented
  // compliance theater -- see docs/ADDRESS_VALIDATION_GATE.md and the Layer 3 self-declaration
  // design for why county-level records specifically aren't live, and stay that way honestly.
  isLive: boolean;
  statusNote: string;
}

export const OFFICIAL_SOURCE_REGISTRY: SourceRegistryEntry[] = [
  // --- Genuinely live right now ---
  {
    id: 'src_census_geocoder',
    name: 'U.S. Census Bureau Geocoding Services API',
    agency: 'U.S. Census Bureau (Dept. of Commerce)',
    governmentLevel: 'Federal',
    officialUrl: 'https://geocoding.geo.census.gov/',
    dataTypes: ['Address Resolution', 'Parcel Coordinates'],
    isLive: true,
    statusNote: 'Queried live on every address submitted -- this is the Layer 1 address resolution check.',
  },
  {
    id: 'src_federal_lands',
    name: 'USA Federal Lands (NPS / BLM / USFS / FWS)',
    agency: 'Esri Living Atlas',
    governmentLevel: 'Federal',
    officialUrl: 'https://www.arcgis.com/home/item.html?id=5f0225a6bd0f4d75b873456565a99c0e',
    dataTypes: ['Federal Land Parcel Boundaries'],
    isLive: true,
    statusNote: 'Queried live on every address submitted -- part of the Layer 2 federal-facility exclusion check.',
  },
  {
    id: 'src_military_bases',
    name: 'NTAD Military Bases',
    agency: 'U.S. DOT / Bureau of Transportation Statistics',
    governmentLevel: 'Federal',
    officialUrl: 'https://data-usdot.opendata.arcgis.com/',
    dataTypes: ['Military Installation Boundaries'],
    isLive: true,
    statusNote: 'Queried live on every address submitted -- part of the Layer 2 federal-facility exclusion check.',
  },
  {
    id: 'src_gsa_buildings',
    name: 'GSA Owned & Leased Buildings (IOLP)',
    agency: 'U.S. General Services Administration',
    governmentLevel: 'Federal',
    officialUrl: 'https://www.gsa.gov/real-estate/gsa-properties',
    dataTypes: ['Federal Office Building Locations'],
    isLive: true,
    statusNote: 'Queried live on every address submitted -- part of the Layer 2 federal-facility exclusion check.',
  },
  {
    id: 'src_padus',
    name: 'PAD-US Protected Areas National',
    agency: 'U.S. Geological Survey',
    governmentLevel: 'Federal',
    officialUrl: 'https://www.usgs.gov/programs/gap-analysis-project/science/pad-us-data-download',
    dataTypes: ['Parks, Refuges & Protected Land Boundaries'],
    isLive: true,
    statusNote: 'Queried live on every address submitted -- part of the Layer 2 federal-facility exclusion check.',
  },
  {
    id: 'src_usgs_seismic',
    name: 'USGS Seismic Design Maps (ASCE 7-22)',
    agency: 'U.S. Geological Survey',
    governmentLevel: 'Federal',
    officialUrl: 'https://earthquake.usgs.gov/ws/designmaps/',
    dataTypes: ['Seismic Design Category', 'Spectral Acceleration Values'],
    isLive: true,
    statusNote: 'Queried live for every generated report -- BeforeRegret\'s first live-confirmed report finding.',
  },

  // --- Reference links only -- not yet queried by BeforeRegret ---
  {
    id: 'src_fema_nfhl',
    name: 'FEMA National Flood Hazard Layer (NFHL)',
    agency: 'Federal Emergency Management Agency',
    governmentLevel: 'Federal',
    officialUrl: 'https://msc.fema.gov/portal/search',
    dataTypes: ['Flood Zone Classification', 'FIRM Panel Numbers'],
    isLive: false,
    statusNote: 'Not integrated: FEMA\'s own flood-data API is not reachable from BeforeRegret\'s servers. Check the official portal directly.',
  },
  {
    id: 'src_muni_permits',
    name: 'Municipal Building Permit Archives',
    agency: 'City / County Building & Permitting Departments',
    governmentLevel: 'Municipal',
    officialUrl: 'https://www.usa.gov/local-governments',
    dataTypes: ['Building, Electrical, Roofing & HVAC Permits'],
    isLive: false,
    statusNote: 'Not integrated: permit records are fragmented across thousands of separate municipal systems with no single free API.',
  },
  {
    id: 'src_county_assessor',
    name: 'County Assessor & Clerk Land Records',
    agency: 'County Tax Assessor / County Clerk',
    governmentLevel: 'County',
    officialUrl: 'https://www.usa.gov/local-governments',
    dataTypes: ['Parcel Boundary', 'Assessed Value History', 'Year Built'],
    isLive: false,
    statusNote: 'Not integrated: no county in the U.S. currently has a live, legally-cleared assessor connection in BeforeRegret. This is exactly why property type is requester-declared rather than auto-detected -- see the report\'s property type disclosure.',
  },
  {
    id: 'src_epa_envirofacts',
    name: 'EPA Envirofacts (Superfund, FRS, TRI)',
    agency: 'U.S. Environmental Protection Agency',
    governmentLevel: 'Federal',
    officialUrl: 'https://www.epa.gov/enviro/envirofacts-data-service-api',
    dataTypes: ['Superfund Proximity', 'Hazardous Waste Handlers'],
    isLive: false,
    statusNote: 'Not integrated yet: reachable, but returns unstructured facility data with no built-in proximity search.',
  },
  {
    id: 'src_faa_noise',
    name: 'FAA Airport Noise Contours',
    agency: 'Federal Aviation Administration',
    governmentLevel: 'Federal',
    officialUrl: 'https://www.faa.gov/about/office_org/headquarters_offices/apl/noise_emissions/airport_noise',
    dataTypes: ['Flight Path Noise Contours'],
    isLive: false,
    statusNote: 'Not integrated yet -- provided as a reference link.',
  },
  {
    id: 'src_fcc_broadband',
    name: 'FCC National Broadband Map',
    agency: 'Federal Communications Commission',
    governmentLevel: 'Federal',
    officialUrl: 'https://broadbandmap.fcc.gov/',
    dataTypes: ['Fiber & Broadband Availability'],
    isLive: false,
    statusNote: 'Not integrated yet: the public API requires an authenticated developer token BeforeRegret does not currently hold.',
  },
  {
    id: 'src_radon',
    name: 'EPA / USGS Indoor Radon Zone Map',
    agency: 'U.S. Geological Survey / EPA',
    governmentLevel: 'Federal',
    officialUrl: 'https://www.epa.gov/radon/epa-map-radon-zones',
    dataTypes: ['County Radon Zone Classification'],
    isLive: false,
    statusNote: 'Not integrated yet -- provided as a reference link.',
  },
  {
    id: 'src_usgs_landslide',
    name: 'USGS Landslide Hazards Program',
    agency: 'U.S. Geological Survey',
    governmentLevel: 'Federal',
    officialUrl: 'https://www.usgs.gov/programs/landslide-hazards',
    dataTypes: ['Landslide Susceptibility Mapping'],
    isLive: false,
    statusNote: 'Not integrated yet -- provided as a reference link. See the Inspection Budget Priorities section for the states where this is surfaced.',
  },
];
