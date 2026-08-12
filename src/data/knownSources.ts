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
];

export function resolveKnownSource(key: string): KnownSource | undefined {
  const normalized = key.trim().toUpperCase();
  return KNOWN_SOURCES.find((s) => s.key === normalized);
}
