// Turn a Search Console or Bing CSV export into a citable capture under data/keywords/.
//
//   npx tsx scripts/import-gsc-export.ts ~/Downloads/Queries.csv
//   npx tsx scripts/import-gsc-export.ts ~/Downloads/bing-queries.csv --source bing
//
// -----------------------------------------------------------------------------------------------
// WHY THIS EXISTS ALONGSIDE THE API PATH.
//
// scripts/capture-keywords.ts pulls MODELLED volumes from DataForSEO -- an estimate of what the
// whole market searches. This imports MEASURED impressions from Search Console: what people actually
// typed and were actually shown this site for. For deciding what to write next, the measured data is
// strictly better, and it is the data this project has been quoting from dashboards all along
// without ever writing to disk. That omission is why src/seo/targetKeywords.ts shipped empty.
//
// It also needs no credentials of any kind. Search Console exports CSV from the browser, which means
// this path works today, while the DataForSEO account is paused and before any OAuth client exists.
//
// A NOTE ON THE TWO PRODUCTS, since they are easy to conflate. OpenSEO (MIT, self-hostable) and
// DataForSEO (paid data vendor) are separate and unaffiliated companies. OpenSEO's Search Console
// feature runs on Google OAuth and needs no DataForSEO key at all; only its keyword, backlink and
// SERP features do. Running OpenSEO would automate what this script does by hand -- this is the
// zero-setup version of the same idea, and captures from either route are interchangeable here.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CAPTURE_DIR = path.join(ROOT, 'data', 'keywords');

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

/** Minimal RFC-4180 reader. Search Console quotes any query containing a comma, and a naive
 *  split(',') silently truncates exactly those multi-word queries -- which are the long-tail terms
 *  this import exists to find. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const s = text.replace(/^﻿/, '').replace(/\r\n/g, '\n');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quoted) {
      if (c === '"') {
        if (s[i + 1] === '"') { cell += '"'; i++; } else quoted = false;
      } else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}

/** Search Console writes "1.5%" and "12.4"; Bing writes plain numbers. Percent strings are stored
 *  as the number of percent, not a fraction, matching what the export shows on screen. */
function num(v: string | undefined): number | null {
  if (v == null) return null;
  const t = v.replace(/[%,]/g, '').trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function main() {
  const file = process.argv[2];
  const source = (arg('source') ?? 'gsc') as 'gsc' | 'bing';
  if (!file || file.startsWith('--')) {
    console.error('Usage: npx tsx scripts/import-gsc-export.ts <Queries.csv> [--source gsc|bing]');
    process.exit(1);
  }
  if (!fs.existsSync(file)) { console.error(`No such file: ${file}`); process.exit(1); }

  const rows = parseCsv(fs.readFileSync(file, 'utf8'));
  if (rows.length < 2) { console.error('CSV has no data rows.'); process.exit(1); }

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = (...names: string[]) => {
    for (const n of names) {
      const i = header.findIndex((h) => h === n || h.startsWith(n));
      if (i >= 0) return i;
    }
    return -1;
  };
  // Search Console: "Top queries, Clicks, Impressions, CTR, Position".
  // Bing Webmaster: "Query, Clicks, Impressions, ...  Avg. position".
  const iQ = col('top queries', 'query', 'queries', 'search term');
  const iC = col('clicks');
  const iI = col('impressions');
  const iP = col('position', 'avg. position', 'average position');

  if (iQ < 0) {
    console.error(`Could not find a query column. Header was: ${rows[0].join(' | ')}`);
    process.exit(1);
  }
  if (iI < 0) {
    console.error(`Could not find an impressions column -- this does not look like a query export.`);
    console.error(`Header was: ${rows[0].join(' | ')}`);
    process.exit(1);
  }

  const keywords = rows.slice(1)
    .map((r) => ({
      keyword: (r[iQ] ?? '').trim(),
      // The gate reads search_volume. For a measured export the honest analogue is impressions:
      // how many times this site was actually shown for the term. It is NOT market volume, and the
      // endpoint field below records that distinction so the two can never be compared blindly.
      search_volume: iI >= 0 ? num(r[iI]) : null,
      clicks: iC >= 0 ? num(r[iC]) : null,
      impressions: iI >= 0 ? num(r[iI]) : null,
      position: iP >= 0 ? num(r[iP]) : null,
    }))
    .filter((k) => k.keyword);

  if (!keywords.length) { console.error('No query rows found.'); process.exit(1); }

  const stamp = new Date().toISOString().slice(0, 10);
  const id = `${stamp}-${source}-queries`;
  const capture = {
    source,
    endpoint: source === 'gsc'
      ? 'google-search-console-export (measured impressions, not market volume)'
      : 'bing-webmaster-export (measured impressions, not market volume)',
    captured_at: new Date().toISOString(),
    location_name: 'United States',
    language_code: 'en',
    cost_usd: 0,
    imported_from: path.basename(file),
    keywords,
  };

  fs.mkdirSync(CAPTURE_DIR, { recursive: true });
  fs.writeFileSync(path.join(CAPTURE_DIR, `${id}.json`), `${JSON.stringify(capture, null, 2)}\n`);

  const withClicks = keywords.filter((k) => (k.clicks ?? 0) > 0);
  console.log(`\n  wrote data/keywords/${id}.json`);
  console.log(`    ${keywords.length} quer(ies), ${withClicks.length} with at least one click\n`);

  // Sort by clicks, then impressions. Clicks are the scarcer and more decisive signal here.
  const top = [...keywords].sort((a, b) =>
    (b.clicks ?? 0) - (a.clicks ?? 0) || (b.impressions ?? 0) - (a.impressions ?? 0)).slice(0, 20);
  console.log(`    clicks  impr   pos   query`);
  for (const k of top) {
    console.log(
      `    ${String(k.clicks ?? 0).padStart(6)}  ${String(k.impressions ?? 0).padStart(5)}  ` +
      `${(k.position == null ? '-' : k.position.toFixed(1)).padStart(5)}   ${k.keyword}`
    );
  }
  console.log(`\n  These are now citable. Add one to src/seo/targetKeywords.ts with capture "${id}".`);
}

main();
