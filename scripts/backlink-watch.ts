// Tracks who links to beforeregret.com: finds new referring pages through Bing, and re-checks that
// every known one still carries the link.
//
//   npx tsx scripts/backlink-watch.ts                  # discover + verify, update the ledger
//   npx tsx scripts/backlink-watch.ts --add <url> [--business "..."] [--trade plumbing] \
//        [--area "Las Vegas, NV"] [--notes "..."]      # record a page you found yourself
//
// WHY. The first earned backlink (a Las Vegas plumber citing why-cast-iron-pipes-corrode,
// 2026-09-24) was spotted by the owner by chance, not by any tool. The one programmatic source of
// referring pages is Bing Webmaster's GetLinkCounts/GetUrlLinks -- Search Console's Links report
// has no API -- and Bing lists a new link slowly, so manual additions are first-class here, not a
// fallback.
//
// WHY A LEDGER AND NOT JUST A REPORT. A trade business that cites a guide has publicly vouched for
// the content, which makes it the warmest ad prospect there will ever be. The ledger keeps who they
// are, their trade and their area next to the link, so when a guide starts drawing readers in their
// area the list of who to talk to already exists. It is not a pitch list today: see
// memory/beforeregret_zip_ads_unsold -- sell only where there are readers.
//
// Run it monthly, alongside the Permit Pulse re-run. It reads and writes data/backlinks/ledger.json
// and nothing else.

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import {
  isBingWebmasterConfigured,
  fetchBingLinkCounts,
  fetchBingUrlLinks,
} from '../src/server/bingWebmasterService.js';

const LEDGER_PATH = path.resolve('data/backlinks/ledger.json');
const SITE_URL = 'https://www.beforeregret.com/';
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

interface LedgerLink {
  sourceUrl: string;
  targetUrl: string;
  anchorText: string;
  rel: string;
  firstSeen: string;
  sourcePublished?: string;
  foundBy: 'owner' | 'bing';
  business?: string;
  trade?: string;
  area?: string;
  notes?: string;
  lastChecked: string;
  lastStatus: string;
}
interface Ledger { _about: string; links: LedgerLink[] }

const today = new Date().toISOString().slice(0, 10);

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

/** Comparable form of a URL: https, www host, no query or fragment, trailing slash on paths. */
function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw.replace(/&amp;/g, '&'));
    const host = u.hostname.toLowerCase();
    const p = u.pathname.endsWith('/') || /\.[a-z0-9]+$/i.test(u.pathname) ? u.pathname : `${u.pathname}/`;
    return `https://${host}${p}`;
  } catch {
    return raw;
  }
}

function isOurs(href: string): boolean {
  try {
    return /(^|\.)beforeregret\.com$/i.test(new URL(href.replace(/&amp;/g, '&')).hostname);
  } catch {
    return false;
  }
}

/** Our canonical form for a target: always the www host. */
function canonicalTarget(href: string): string {
  return normalizeUrl(href).replace('://beforeregret.com', '://www.beforeregret.com');
}

interface FoundLink { targetUrl: string; anchorText: string; rel: string }

async function fetchLinksToUs(sourceUrl: string): Promise<{ status: number; links: FoundLink[]; published?: string }> {
  let res: Response;
  try {
    res = await fetch(sourceUrl, { headers: { 'User-Agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(30000) });
  } catch (e: any) {
    return { status: 0, links: [] };
  }
  if (!res.ok) return { status: res.status, links: [] };
  const html = await res.text();
  const links: FoundLink[] = [];
  for (const m of html.matchAll(/<a\s([^>]*?)>([\s\S]*?)<\/a>/gi)) {
    const href = /href\s*=\s*["']([^"']+)["']/i.exec(m[1])?.[1];
    if (!href || !isOurs(href)) continue;
    const rel = /rel\s*=\s*["']([^"']*)["']/i.exec(m[1])?.[1] ?? '';
    const anchorText = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    links.push({ targetUrl: canonicalTarget(href), anchorText, rel });
  }
  const published = /"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})/.exec(html)?.[1];
  return { status: res.status, links, published };
}

/** What a link passes, in plain words. nofollow/ugc/sponsored are hints Google may ignore, but a
 *  link without them is the one that counts as an editorial vote. */
function describeRel(rel: string): string {
  const r = rel.toLowerCase();
  const flags = ['nofollow', 'ugc', 'sponsored'].filter((f) => r.includes(f));
  return flags.length ? flags.join('+') : 'followed';
}

function loadLedger(): Ledger {
  return JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf8'));
}

function saveLedger(ledger: Ledger) {
  fs.writeFileSync(LEDGER_PATH, `${JSON.stringify(ledger, null, 2)}\n`);
}

async function addSource(sourceUrl: string) {
  const ledger = loadLedger();
  const { status, links, published } = await fetchLinksToUs(sourceUrl);
  if (status !== 200) throw new Error(`${sourceUrl} returned HTTP ${status || 'no response'}`);
  if (links.length === 0) throw new Error(`No link to beforeregret.com found on ${sourceUrl}`);
  const src = normalizeUrl(sourceUrl);
  for (const l of links) {
    if (ledger.links.some((x) => normalizeUrl(x.sourceUrl) === src && x.targetUrl === l.targetUrl)) {
      console.log(`already recorded: ${l.targetUrl}`);
      continue;
    }
    ledger.links.push({
      sourceUrl: src,
      targetUrl: l.targetUrl,
      anchorText: l.anchorText,
      rel: l.rel,
      firstSeen: today,
      ...(published ? { sourcePublished: published } : {}),
      foundBy: 'owner',
      ...(arg('--business') ? { business: arg('--business') } : {}),
      ...(arg('--trade') ? { trade: arg('--trade') } : {}),
      ...(arg('--area') ? { area: arg('--area') } : {}),
      ...(arg('--notes') ? { notes: arg('--notes') } : {}),
      lastChecked: today,
      lastStatus: 'live',
    });
    console.log(`added: ${src} -> ${l.targetUrl} [${describeRel(l.rel)}] "${l.anchorText}"`);
  }
  saveLedger(ledger);
}

async function verifyAndDiscover() {
  const ledger = loadLedger();

  // 1. Verify every known link is still there, and still what it was.
  console.log(`Verifying ${ledger.links.length} known link(s)\n`);
  const bySource = new Map<string, LedgerLink[]>();
  for (const l of ledger.links) bySource.set(l.sourceUrl, [...(bySource.get(l.sourceUrl) || []), l]);
  for (const [sourceUrl, entries] of bySource) {
    const { status, links } = await fetchLinksToUs(sourceUrl);
    for (const entry of entries) {
      const found = links.find((l) => l.targetUrl === entry.targetUrl);
      const prev = entry.lastStatus;
      entry.lastChecked = today;
      if (status !== 200) entry.lastStatus = `page HTTP ${status || 'no response'}`;
      else if (!found) entry.lastStatus = 'LOST';
      else {
        entry.lastStatus = 'live';
        if (found.rel !== entry.rel) console.log(`  rel changed on ${sourceUrl}: "${entry.rel}" -> "${found.rel}"`);
        entry.rel = found.rel;
        entry.anchorText = found.anchorText;
      }
      const flag = entry.lastStatus === 'live' ? 'ok  ' : '!!  ';
      console.log(`${flag}${entry.lastStatus.padEnd(12)} ${describeRel(entry.rel).padEnd(10)} ${entry.business ?? new URL(sourceUrl).hostname}`);
      console.log(`      ${sourceUrl}\n      -> ${entry.targetUrl}${prev !== entry.lastStatus ? `   (was: ${prev})` : ''}`);
    }
  }

  // 2. Discover referring pages Bing has seen that the ledger does not have yet.
  console.log('\nBing inbound links');
  if (!isBingWebmasterConfigured()) {
    console.log('  skipped: BING_WEBMASTER_API_KEY is not set');
  } else {
    const known = new Set(ledger.links.map((l) => normalizeUrl(l.sourceUrl)));
    const counts = await fetchBingLinkCounts(SITE_URL);
    if (counts.length === 0) {
      console.log('  Bing lists no inbound links yet. It is slow to list new ones, so this is "not seen", not "none".');
    }
    let fresh = 0;
    for (const c of counts) {
      const details = await fetchBingUrlLinks(SITE_URL, c.url);
      for (const d of details) {
        if (isOurs(d.url) || known.has(normalizeUrl(d.url))) continue;
        fresh++;
        console.log(`  NEW  ${d.url}\n       -> ${c.url}  "${d.anchorText}"`);
        console.log(`       record it: npx tsx scripts/backlink-watch.ts --add "${d.url}" --business "..." --trade ... --area "..."`);
      }
    }
    if (counts.length > 0) console.log(`  ${counts.length} of our pages have links in Bing; ${fresh} new referring page(s).`);
  }

  saveLedger(ledger);
}

const addUrl = arg('--add');
(addUrl ? addSource(addUrl) : verifyAndDiscover()).catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
