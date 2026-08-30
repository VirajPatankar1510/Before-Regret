// Shared by both the AI generation prompt (src/server/articleGenerator.ts) and the article
// rendering surfaces (GuidePageView.tsx, SeoAdminPanel.tsx) -- one file, imported both
// server-side and client-side, so there's exactly one place that maps a citation code to a real
// URL. Gemini is only ever allowed to cite by KEY (see articleGenerator.ts's prompt); the actual
// link always comes from here, never from the model, so a citation can never point to a broken
// or invented page. Add an entry here before an article can cite a new organization.
export interface KnownSource {
  key: string;
  name: string;
  url: string;
}

export const KNOWN_SOURCES: KnownSource[] = [
  { key: 'CPSC', name: 'U.S. Consumer Product Safety Commission', url: 'https://www.cpsc.gov' },
  { key: 'EPA', name: 'U.S. Environmental Protection Agency', url: 'https://www.epa.gov' },
  { key: 'FEMA', name: 'Federal Emergency Management Agency', url: 'https://www.fema.gov' },
  { key: 'NOAA', name: 'National Oceanic and Atmospheric Administration', url: 'https://www.noaa.gov' },
  { key: 'HUD', name: 'U.S. Department of Housing and Urban Development', url: 'https://www.hud.gov' },
  { key: 'CFPB', name: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov' },
  { key: 'IRS', name: 'Internal Revenue Service', url: 'https://www.irs.gov' },
  { key: 'USGS', name: 'U.S. Geological Survey', url: 'https://www.usgs.gov' },
  { key: 'NAR', name: 'National Association of REALTORS', url: 'https://www.nar.realtor' },
  { key: 'ASHI', name: 'American Society of Home Inspectors', url: 'https://www.homeinspector.org' },
  { key: 'NFPA', name: 'National Fire Protection Association', url: 'https://www.nfpa.org' },
  { key: 'CDC', name: 'Centers for Disease Control and Prevention', url: 'https://www.cdc.gov' },
  // Title insurance has no federal regulator to cite the way EPA covers radon, so the two bodies
  // that actually publish the industry's claims data go here. NAIC is where insurers file the
  // financials the loss ratios are derived from; ALTA commissions and hosts the independent
  // Milliman claims analyses. naic.org redirects to content.naic.org, so the canonical host is
  // used directly.
  { key: 'NAIC', name: 'National Association of Insurance Commissioners', url: 'https://content.naic.org' },
  { key: 'ALTA', name: 'American Land Title Association', url: 'https://www.alta.org' },
  // GAO-07-401 is the definitive independent study of title insurance economics, so this entry is
  // needed for that citation. UNVERIFIED URL: unlike every other entry here, gao.gov could not be
  // reached from the machine this was added on -- DNS returned SERVFAIL, and the same resolver has
  // been failing on api.census.gov and Neon in this environment, so this reads as a local network
  // fault rather than a dead host. The report itself was read at govinfo.gov (the GPO archive,
  // which did resolve): govinfo.gov/content/pkg/GAOREPORTS-GAO-07-401. Worth clicking once to
  // confirm before relying on it.
  { key: 'GAO', name: 'U.S. Government Accountability Office', url: 'https://www.gao.gov' },
];

export function resolveKnownSource(key: string): KnownSource | undefined {
  const normalized = key.trim().toUpperCase();
  return KNOWN_SOURCES.find((s) => s.key === normalized);
}
