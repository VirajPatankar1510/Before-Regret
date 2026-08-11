// Renders a county's real hazard data (already sitting in county_data -- see
// countyDataFetcher.ts / fetch-county-data.ts) as a small SVG scorecard. Deliberately not an
// AI-generated image: every value plotted here is read directly from the same row the page's own
// text already cites, so the image can never say something the page doesn't, and can never
// fabricate a boundary, a score, or a category the way asking a model to "draw a hazard map"
// risks doing. Plain SVG string templating, no charting library -- same "small protocol code over
// a heavy dependency" convention as the hand-rolled TOTP/JWT auth elsewhere in this project.
//
// Note: there is no seismic data in county_data -- that finding is a live, per-address property-
// report result (src/engine/seismicHazard.ts), not a county-level static field. The three real
// county-level metrics this renders are FEMA's National Risk Index, EPA's radon zone, and NOAA's
// storm-event history.

export interface CountyHazardInput {
  countyName: string;
  stateAbbrev: string;
  radonZone: number | null;
  femaRiskRating: string | null;
  femaRiskScore: number | null;
  femaHazards: Record<string, { rating: string; score: number | null }>;
  noaaEventCounts: Record<string, number>;
  noaaYearsCovered: string | null;
}

const WIDTH = 640;
const HEIGHT = 240;

// FEMA's own short codes -> human labels. Duplicated from CountyPageView.tsx's FEMA_HAZARD_LABELS
// rather than imported -- this module runs server-side (see countiesApi.ts) and that file is a
// client React component; a small, stable 18-entry static lookup is cheap enough to keep in sync
// by hand rather than restructure the import graph for.
const FEMA_HAZARD_LABELS: Record<string, string> = {
  AVLN: 'Avalanche', CFLD: 'Coastal Flooding', CWAV: 'Cold Wave', DRGT: 'Drought',
  ERQK: 'Earthquake', HAIL: 'Hail', HWAV: 'Heat Wave', HRCN: 'Hurricane',
  ISTM: 'Ice Storm', LNDS: 'Landslide', LTNG: 'Lightning', IFLD: 'Inland Flooding',
  SWND: 'Strong Wind', TRND: 'Tornado', TSUN: 'Tsunami', VLCN: 'Volcanic Activity',
  WFIR: 'Wildfire', WNTW: 'Winter Weather',
};

// FEMA's National Risk Index score is a 0-100 percentile (higher = higher relative risk) --
// this is a plain severity gradient over that real number, not an invented threshold specific to
// this app (FEMA's own NRI documentation uses the same five-band language: Very Low/Relatively
// Low/Relatively Moderate/Relatively High/Very High).
function scoreColor(score: number): string {
  if (score >= 80) return '#dc2626';
  if (score >= 60) return '#f97316';
  if (score >= 40) return '#eab308';
  if (score >= 20) return '#84cc16';
  return '#16a34a';
}

// Radon zone 1 = EPA's highest-potential band, 3 = lowest -- see src/data/countyRadonZones.ts for
// the same real zone-to-description mapping used elsewhere on the county page.
const RADON_ZONE_COLOR: Record<number, string> = { 1: '#dc2626', 2: '#eab308', 3: '#16a34a' };
const RADON_ZONE_LABEL: Record<number, string> = {
  1: 'Zone 1 -- highest potential',
  2: 'Zone 2 -- moderate potential',
  3: 'Zone 3 -- low potential',
};

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Highest-count entry only -- NOAA's per-county event log has 10-15 categories, and plotting all
// of them turns this into a cluttered bar chart no reader can act on. The single most frequent
// real event type is the one fact worth surfacing visually; the full breakdown still lives in the
// page's own text for anyone who wants it.
function topHazard(counts: Record<string, number>): { type: string; count: number } | null {
  const entries = Object.entries(counts).filter(([, n]) => typeof n === 'number' && n > 0);
  if (entries.length === 0) return null;
  entries.sort((a, b) => b[1] - a[1]);
  return { type: entries[0][0], count: entries[0][1] };
}

// Top 2 real per-hazard-type FEMA scores, by human label -- e.g. Travis County's real breakdown
// has Tornado (99.68) and Hail (99.40) as its two highest-scored individual hazard types, well
// ahead of everything else FEMA scores for that county. This is what actually answers "why is the
// overall score what it is" -- derived from the same fema_hazards_json every time, never a guessed
// or generic explanation (a wrong "driven by" claim would be worse than showing nothing).
function topFemaContributors(hazards: Record<string, { rating: string; score: number | null }>): string[] {
  return Object.entries(hazards)
    .filter(([, v]) => v && typeof v.score === 'number')
    .sort((a, b) => (b[1].score as number) - (a[1].score as number))
    .slice(0, 2)
    .map(([code]) => FEMA_HAZARD_LABELS[code] || code);
}

export function buildCountyHazardSvg(county: CountyHazardInput): string {
  const title = `${county.countyName} County, ${county.stateAbbrev} -- real hazard data`;
  const rows: string[] = [];

  // Row 1: FEMA National Risk Index
  if (county.femaRiskRating && county.femaRiskScore != null) {
    const pct = Math.max(0, Math.min(100, county.femaRiskScore));
    const color = scoreColor(pct);
    const barWidth = 380;
    const contributors = topFemaContributors(county.femaHazards);
    rows.push(`
      <text x="24" y="44" font-family="Helvetica, Arial, sans-serif" font-size="13" font-weight="700" fill="#0f172a">FEMA National Risk Index</text>
      <rect x="24" y="54" width="${barWidth}" height="14" rx="7" fill="#e2e8f0" />
      <rect x="24" y="54" width="${(pct / 100) * barWidth}" height="14" rx="7" fill="${color}" />
      <text x="${24 + barWidth + 12}" y="65" font-family="Helvetica, Arial, sans-serif" font-size="13" font-weight="700" fill="${color}">${escapeXml(county.femaRiskRating)}</text>
      <text x="24" y="80" font-family="Helvetica, Arial, sans-serif" font-size="11" fill="#64748b">Percentile vs. all US counties: ${pct.toFixed(1)}</text>
      ${contributors.length > 0 ? `<text x="24" y="95" font-family="Helvetica, Arial, sans-serif" font-size="11" font-style="italic" fill="#94a3b8">Largest contributing hazard${contributors.length > 1 ? 's' : ''}: ${escapeXml(contributors.join(' & '))}</text>` : ''}
    `);
  }

  // Row 2: EPA radon zone -- inactive zone numbers/segments are drawn at reduced opacity so the
  // active zone reads as the obviously correct one at a glance, not just the differently-colored
  // one among three equally-weighted pills.
  if (county.radonZone && RADON_ZONE_COLOR[county.radonZone]) {
    const zoneY = 130;
    const segW = 60;
    const segments = [1, 2, 3].map((z) => {
      const active = z === county.radonZone;
      const fill = active ? RADON_ZONE_COLOR[z] : '#e2e8f0';
      const x = 24 + (z - 1) * (segW + 6);
      return `<g opacity="${active ? '1' : '0.45'}">
                <rect x="${x}" y="${zoneY}" width="${segW}" height="14" rx="7" fill="${fill}" />
                <text x="${x + segW / 2}" y="${zoneY + 10}" font-family="Helvetica, Arial, sans-serif" font-size="9" font-weight="700" text-anchor="middle" fill="${active ? '#ffffff' : '#94a3b8'}">${z}</text>
              </g>`;
    }).join('');
    rows.push(`
      <text x="24" y="${zoneY - 10}" font-family="Helvetica, Arial, sans-serif" font-size="13" font-weight="700" fill="#0f172a">EPA Radon Zone</text>
      ${segments}
      <text x="${24 + segW * 3 + 6 * 2 + 12}" y="${zoneY + 11}" font-family="Helvetica, Arial, sans-serif" font-size="13" font-weight="700" fill="${RADON_ZONE_COLOR[county.radonZone]}">${escapeXml(RADON_ZONE_LABEL[county.radonZone])}</text>
    `);
  }

  // Row 3: most frequent real NOAA storm event, rendered as a badge (not a loose baseline-aligned
  // string) so the count reads as one clean unit next to the hazard name instead of trailing low.
  const top = topHazard(county.noaaEventCounts);
  if (top) {
    const labelY = 170;
    const nameBaseline = 195;
    const badgeText = `${top.count.toLocaleString()} Events${county.noaaYearsCovered ? ` · ${county.noaaYearsCovered}` : ''}`;
    const badgeX = 24 + top.type.length * 12.5 + 16;
    const badgeWidth = badgeText.length * 6.4 + 20;
    const badgeHeight = 20;
    const badgeY = nameBaseline - 15; // optically centered against the bold hazard name's cap-height, not its baseline
    rows.push(`
      <text x="24" y="${labelY}" font-family="Helvetica, Arial, sans-serif" font-size="13" font-weight="700" fill="#0f172a">Most Frequent Recorded Hazard</text>
      <text x="24" y="${nameBaseline}" font-family="Helvetica, Arial, sans-serif" font-size="20" font-weight="800" fill="#1d4ed8">${escapeXml(top.type)}</text>
      <rect x="${badgeX}" y="${badgeY}" width="${badgeWidth}" height="${badgeHeight}" rx="10" fill="#eff6ff" />
      <text x="${badgeX + badgeWidth / 2}" y="${badgeY + badgeHeight / 2 + 4}" font-family="Helvetica, Arial, sans-serif" font-size="11" font-weight="700" text-anchor="middle" fill="#1d4ed8">${escapeXml(badgeText)}</text>
    `);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" role="img" aria-label="${escapeXml(title)}">
  <title>${escapeXml(title)}</title>
  <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" rx="16" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" />
  <text x="24" y="24" font-family="Helvetica, Arial, sans-serif" font-size="11" font-weight="700" letter-spacing="0.5" fill="#2563eb">${escapeXml(`${county.countyName.toUpperCase()} COUNTY, ${county.stateAbbrev.toUpperCase()}`)}</text>
  ${rows.join('\n')}
</svg>`;
}
