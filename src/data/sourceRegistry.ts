export interface SourceRegistryEntry {
  id: string;
  name: string;
  agency: string;
  governmentLevel: 'Federal' | 'State' | 'County' | 'Municipal';
  officialUrl: string;
  licenseTerms: string; // e.g. "Public Domain (U.S. Government Work 17 U.S.C. § 105)", "CC0 1.0 Universal", "Open Government License"
  licenseType: 'Public Domain' | 'CC0 Universal' | 'Open Government License' | 'Public Commercial Reuse License';
  dataTypes: string[];
  refreshCadence: 'Real-Time Sync' | 'Daily API Refresh' | 'Weekly Sync' | 'Monthly Batch' | 'Quarterly Update' | 'Annual Assessor Cycle';
  isRealTime: boolean;
  lastVerifiedActiveDate: string;
  quarterlyAuditStatus: 'Audited & Confirmed' | 'Pending Next Cycle';
  scrapingStatus: 'No Scraping (Direct API / Licensed Open Data Only)';
  notes: string;
}

export const OFFICIAL_SOURCE_REGISTRY: SourceRegistryEntry[] = [
  {
    id: 'src_fema_nfhl',
    name: 'FEMA National Flood Hazard Layer (NFHL) REST API',
    agency: 'Federal Emergency Management Agency (DHS)',
    governmentLevel: 'Federal',
    officialUrl: 'https://msc.fema.gov/portal/search',
    licenseTerms: 'Public Domain (U.S. Government Work - 17 U.S.C. § 105)',
    licenseType: 'Public Domain',
    dataTypes: ['Flood Zone Classification', 'FIRM Panel Numbers', 'Special Flood Hazard Areas (SFHA)', 'Base Flood Elevations'],
    refreshCadence: 'Quarterly Update',
    isRealTime: false,
    lastVerifiedActiveDate: '2026-08-01',
    quarterlyAuditStatus: 'Audited & Confirmed',
    scrapingStatus: 'No Scraping (Direct API / Licensed Open Data Only)',
    notes: 'Direct spatial query via ArcGIS REST Endpoint on FEMA MSC GIS service.'
  },
  {
    id: 'src_census_geocoder',
    name: 'U.S. Census Bureau Geocoding Services API',
    agency: 'U.S. Census Bureau (Dept. of Commerce)',
    governmentLevel: 'Federal',
    officialUrl: 'https://geocoding.geo.census.gov/',
    licenseTerms: 'Public Domain (U.S. Government Work - 17 U.S.C. § 105)',
    licenseType: 'Public Domain',
    dataTypes: ['Address Resolution', 'Parcel Coordinates', 'County & Tract Identifiers', 'Congressional District'],
    refreshCadence: 'Real-Time Sync',
    isRealTime: true,
    lastVerifiedActiveDate: '2026-08-01',
    quarterlyAuditStatus: 'Audited & Confirmed',
    scrapingStatus: 'No Scraping (Direct API / Licensed Open Data Only)',
    notes: 'Layer 1 Address format and resolution gate API.'
  },
  {
    id: 'src_hifld_gov_facilities',
    name: 'Homeland Infrastructure Foundation-Level Data (HIFLD) Government Facilities',
    agency: 'Department of Homeland Security / NGA',
    governmentLevel: 'Federal',
    officialUrl: 'https://hifld-geoplatform.opendata.arcgis.com/',
    licenseTerms: 'Public Domain (U.S. Government Work - Open Data)',
    licenseType: 'Public Domain',
    dataTypes: ['Federal Facility Boundaries', 'Military Bases', 'Courthouses', 'Correctional Facilities'],
    refreshCadence: 'Quarterly Update',
    isRealTime: false,
    lastVerifiedActiveDate: '2026-08-01',
    quarterlyAuditStatus: 'Audited & Confirmed',
    scrapingStatus: 'No Scraping (Direct API / Licensed Open Data Only)',
    notes: 'Layer 2 Federal/Government facility exclusion boundary check.'
  },
  {
    id: 'src_usgs_radon',
    name: 'USGS Geologic Radon Potential & EPA Zone Index',
    agency: 'U.S. Geological Survey / EPA',
    governmentLevel: 'Federal',
    officialUrl: 'https://www.epa.gov/radon/epa-map-radon-zones',
    licenseTerms: 'Public Domain (U.S. Government Work - 17 U.S.C. § 105)',
    licenseType: 'Public Domain',
    dataTypes: ['County Radon Zone Potential', 'Geologic Formation Classification', 'Predicted Indoor Radon Baseline'],
    refreshCadence: 'Annual Assessor Cycle',
    isRealTime: false,
    lastVerifiedActiveDate: '2026-08-01',
    quarterlyAuditStatus: 'Audited & Confirmed',
    scrapingStatus: 'No Scraping (Direct API / Licensed Open Data Only)',
    notes: 'EPA Zone 1/2/3 regional geologic radon potential lookup.'
  },
  {
    id: 'src_fcc_broadband',
    name: 'FCC National Broadband Map API',
    agency: 'Federal Communications Commission',
    governmentLevel: 'Federal',
    officialUrl: 'https://broadbandmap.fcc.gov/',
    licenseTerms: 'Public Domain (U.S. Open Government License)',
    licenseType: 'Open Government License',
    dataTypes: ['Fiber Availability', 'Cable/DSL Speeds', 'Fixed Wireless Service Providers'],
    refreshCadence: 'Quarterly Update',
    isRealTime: false,
    lastVerifiedActiveDate: '2026-08-01',
    quarterlyAuditStatus: 'Audited & Confirmed',
    scrapingStatus: 'No Scraping (Direct API / Licensed Open Data Only)',
    notes: 'Location-level provider and technology availability query.'
  },
  {
    id: 'src_epa_envirofacts',
    name: 'EPA Envirofacts API (Superfund, FRS, TRI, RCRA)',
    agency: 'U.S. Environmental Protection Agency',
    governmentLevel: 'Federal',
    officialUrl: 'https://www.epa.gov/enviro/envirofacts-data-service-api',
    licenseTerms: 'Public Domain (U.S. Government Work - 17 U.S.C. § 105)',
    licenseType: 'Public Domain',
    dataTypes: ['NPL Superfund Proximity', 'Hazardous Waste Handlers', 'Toxic Release Inventory Facilities'],
    refreshCadence: 'Monthly Batch',
    isRealTime: false,
    lastVerifiedActiveDate: '2026-08-01',
    quarterlyAuditStatus: 'Audited & Confirmed',
    scrapingStatus: 'No Scraping (Direct API / Licensed Open Data Only)',
    notes: 'Proximity radius query for federally registered environmental facilities.'
  },
  {
    id: 'src_faa_noise',
    name: 'FAA Airport Noise Contour & Airspace Maps',
    agency: 'Federal Aviation Administration',
    governmentLevel: 'Federal',
    officialUrl: 'https://www.faa.gov/about/office_org/headquarters_offices/apl/noise_emissions/airport_noise',
    licenseTerms: 'Public Domain (U.S. Government Work)',
    licenseType: 'Public Domain',
    dataTypes: ['Part 150 65+ DNL Noise Contours', 'Low-Altitude Flight Arrival Tracks'],
    refreshCadence: 'Quarterly Update',
    isRealTime: false,
    lastVerifiedActiveDate: '2026-08-01',
    quarterlyAuditStatus: 'Audited & Confirmed',
    scrapingStatus: 'No Scraping (Direct API / Licensed Open Data Only)',
    notes: 'Acoustic flight corridor spatial mapping.'
  },
  {
    id: 'src_muni_permits',
    name: 'Municipal Building Permit Open Data Archives',
    agency: 'City / County Building & Permitting Departments',
    governmentLevel: 'Municipal',
    officialUrl: 'https://data.gov',
    licenseTerms: 'Municipal Open Data License (CC0 / Open Public Domain)',
    licenseType: 'CC0 Universal',
    dataTypes: ['Building Permits', 'Electrical Upgrades', 'Plumbing Modifications', 'Roofing Permits', 'HVAC Replacements'],
    refreshCadence: 'Weekly Sync',
    isRealTime: false,
    lastVerifiedActiveDate: '2026-08-01',
    quarterlyAuditStatus: 'Audited & Confirmed',
    scrapingStatus: 'No Scraping (Direct API / Licensed Open Data Only)',
    notes: 'Digitized municipal permit archives via Socrata / ArcGIS open data APIs.'
  },
  {
    id: 'src_county_assessor',
    name: 'County Assessor & Clerk Land Records Database',
    agency: 'County Tax Assessor / County Clerk',
    governmentLevel: 'County',
    officialUrl: 'https://data.gov',
    licenseTerms: 'County Open Data Public Records License',
    licenseType: 'Open Government License',
    dataTypes: ['Parcel Boundary', 'Land Use Classification', 'Assessed Value History', 'Year Built Record'],
    refreshCadence: 'Annual Assessor Cycle',
    isRealTime: false,
    lastVerifiedActiveDate: '2026-08-01',
    quarterlyAuditStatus: 'Audited & Confirmed',
    scrapingStatus: 'No Scraping (Direct API / Licensed Open Data Only)',
    notes: 'Layer 3 County Assessor classification gate data.'
  }
];
