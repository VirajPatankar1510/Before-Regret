// Statewide tally of the Florida Water Management Inventory (Florida Department of Health): how built residential
// parcels are labelled for wastewater (central sewer vs onsite septic) and drinking water (public vs private well),
// and how certain each label is (Known / Likely / Somewhat Likely). First-party computation for the guide
// "City Utilities vs Septic: Don't Be Surprised by Water & Sewer Costs" (2026-11-03).
//
//   npx tsx scripts/fetch-flwmi-wastewater-stats.ts      # writes docs/data/flwmi-wastewater-stats.json
//
// Uses only aggregate statistics queries on the public FeatureServer. Never requests the SUB_* fields, which hold
// the names, emails and phone numbers of people who submitted corrections.
import fs from 'node:fs';
import path from 'node:path';

const LAYER = 'https://maps.floridahealth.gov/server/rest/services/FLWMI/FLWMI_Wastewater/FeatureServer/0/query';
const WHERE = "LANDUSE='RES' AND BLT_STATUS='BLT'";

async function groupCount(field: string): Promise<Record<string, number>> {
  const qs = new URLSearchParams({
    where: WHERE,
    outStatistics: JSON.stringify([{ statisticType: 'count', onStatisticField: 'OBJECTID', outStatisticFieldName: 'n' }]),
    groupByFieldsForStatistics: field,
    f: 'json',
  });
  const res = await fetch(`${LAYER}?${qs}`, { headers: { 'User-Agent': 'Mozilla/5.0 (BeforeRegret research)' } });
  const j = (await res.json()) as { error?: unknown; features?: Array<{ attributes: Record<string, string | number> }> };
  if (j.error || !j.features) throw new Error(`FLWMI query failed for ${field}: ${JSON.stringify(j.error)}`);
  const out: Record<string, number> = {};
  for (const f of j.features) out[String(f.attributes[field])] = Number(f.attributes.n);
  return out;
}

const pct = (n: number, d: number) => Math.round((1000 * n) / d) / 10;

async function main() {
  const ww = await groupCount('WW');
  const dw = await groupCount('DW');
  const wwYear = await groupCount('WW_UPD');
  const total = Object.values(ww).reduce((a, b) => a + b, 0);
  const septic = (ww.KnownSeptic ?? 0) + (ww.LikelySeptic ?? 0) + (ww.SWLSeptic ?? 0);
  const sewer = (ww.KnownSewer ?? 0) + (ww.LikelySewer ?? 0) + (ww.SWLSewer ?? 0);
  const well = (dw.KnownWell ?? 0) + (dw.LikelyWell ?? 0) + (dw.SWLWell ?? 0);
  const figures = {
    source: 'Florida Department of Health, Florida Water Management Inventory (FLWMI), wastewater layer',
    endpoint: LAYER,
    filter: WHERE,
    fetchedAt: new Date().toISOString(),
    builtResidentialParcels: total,
    wastewater: ww,
    drinkingWater: dw,
    wastewaterLabelYear: wwYear,
    derived: {
      septicParcels: septic,
      septicSharePct: pct(septic, total),
      sewerParcels: sewer,
      sewerSharePct: pct(sewer, total),
      unknownSharePct: pct(ww.UNK ?? 0, total),
      septicKnownSharePct: pct(ww.KnownSeptic ?? 0, septic),
      septicInferredSharePct: pct((ww.LikelySeptic ?? 0) + (ww.SWLSeptic ?? 0), septic),
      wellParcels: well,
      wellSharePct: pct(well, total),
    },
  };
  const out = path.join(process.cwd(), 'docs', 'data', 'flwmi-wastewater-stats.json');
  fs.writeFileSync(out, `${JSON.stringify(figures, null, 2)}\n`);
  console.log(JSON.stringify(figures.derived, null, 2));
  console.log('label years', wwYear);
  console.log(`wrote ${path.relative(process.cwd(), out)}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
