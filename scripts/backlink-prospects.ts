// Finds real outreach targets by reading who already links to sites that outrank this one.
//
//   npx tsx scripts/backlink-prospects.ts --competitors                 # who competes for our links
//   npx tsx scripts/backlink-prospects.ts structuretech.com nachi.org   # who links to these
//   npx tsx scripts/backlink-prospects.ts structuretech.com --limit 200
//
// WHY THIS EXISTS. This site has zero backlinks (confirmed independently by Bing's GetLinkCounts),
// and that is the most credible explanation for why Google leaves most of its pages in "Discovered
// - currently not indexed" while Bing indexes ~95 of them and ranks several in its top five. The
// content is not the constraint; the absence of any external signal is.
//
// Outreach was previously done by hand -- searching for a plausible site, reading it, checking it
// was real, one target at a time. That produced four verified targets in an afternoon. This asks a
// different and much better question: which publishers have ALREADY chosen to link to a site in
// this niche? Every referring domain of a competitor is a site that demonstrably links out on
// these topics, which is a far stronger prior than "this site looks relevant".
//
// WHAT THIS IS NOT. A list from this script is a RESEARCH STARTING POINT, not a send list. Nothing
// here verifies that a domain is a real, live, currently-publishing site, that it accepts outside
// contributions, or that a human being reads the address on its contact page. Every project rule
// about not fabricating a contact still applies: open the site, read it, and confirm the person
// exists before writing to them. Sending cold email to a scraped list is how a young domain earns
// a spam reputation instead of a link.
//
// COST. Backlink rows are ~$0.06 per 1000, so a 200-row pull is a fraction of a cent. The `--limit`
// default is deliberately modest rather than the API maximum -- see dataForSeoService.ts.
//
// Read-only. Writes nothing to DataForSEO and nothing to this project's database.
import 'dotenv/config';
import {
  isDataForSeoConfigured,
  fetchBacklinkCompetitors,
  fetchReferringDomains,
  fetchBacklinkSummary,
} from '../src/server/dataForSeoService.js';

const SITE = 'beforeregret.com';

/** Domains that will appear in almost any referring-domain pull and are never outreach targets:
 *  platforms anyone can post to, aggregators, and link directories. Filtered so the printed list is
 *  candidates a human should actually look at rather than noise they have to skim past. */
const NOT_A_PROSPECT = [
  /^(www\.)?(facebook|twitter|x|instagram|pinterest|linkedin|reddit|youtube|tiktok)\.com$/i,
  /^(www\.)?(wikipedia|wikimedia)\.org$/i,
  /(blogspot|wordpress|wixsite|weebly|squarespace|medium)\.com$/i,
  /^(www\.)?(google|bing|yahoo|duckduckgo)\./i,
  /\.(ru|cn|tk|ml|ga|cf)$/i,
  /(directory|listings?|backlink|seo-?tools?|linkbuilding)\./i,
];

function isProspect(domain: string): boolean {
  return !NOT_A_PROSPECT.some((re) => re.test(domain));
}

async function main() {
  if (!isDataForSeoConfigured()) {
    console.error('DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD are not set in .env.');
    console.error('Get API-access credentials at https://app.dataforseo.com/api-access');
    console.error('(these are API credentials, not your dashboard login password).');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 100;
  const targets = args.filter((a) => !a.startsWith('--') && a !== String(limit));

  // Baseline, so the competitor numbers below have something to be read against.
  console.log(`Checking ${SITE}'s own backlink profile first...`);
  try {
    const own = await fetchBacklinkSummary(SITE);
    if (own) {
      console.log(`  ${SITE}: rank ${own.rank}, ${own.backlinks} backlinks, ${own.referringMainDomains} referring domains\n`);
    }
  } catch (e: any) {
    console.log(`  (summary unavailable: ${e?.message})\n`);
  }

  if (args.includes('--competitors')) {
    console.log(`Domains sharing a backlink profile with ${SITE}:\n`);
    const comps = await fetchBacklinkCompetitors(SITE, 50);
    if (comps.length === 0) {
      console.log('  None returned. With zero backlinks of its own, this site has no profile to');
      console.log('  intersect against -- which is the expected result here, not an error.');
      console.log('  Pass competitor domains explicitly instead:');
      console.log('    npx tsx scripts/backlink-prospects.ts structuretech.com nachi.org');
      return;
    }
    for (const c of comps) {
      console.log(`  rank ${String(c.rank).padStart(4)}  ${String(c.intersections).padStart(4)} shared  ${c.domain}`);
    }
    return;
  }

  if (targets.length === 0) {
    console.error('Pass at least one competitor domain, or --competitors.');
    console.error('  npx tsx scripts/backlink-prospects.ts structuretech.com nachi.org');
    process.exit(1);
  }

  // domain -> which of the given targets it links to. A domain linking to SEVERAL of them is the
  // strongest kind of prospect: it publishes on this topic repeatedly rather than having linked
  // out once by chance.
  const seen = new Map<string, { rank: number; backlinks: number; linksTo: Set<string> }>();

  for (const target of targets) {
    process.stdout.write(`Pulling referring domains for ${target} ... `);
    try {
      const domains = await fetchReferringDomains(target, limit);
      console.log(`${domains.length}`);
      for (const d of domains) {
        if (!isProspect(d.domain)) continue;
        const existing = seen.get(d.domain);
        if (existing) {
          existing.linksTo.add(target);
          existing.rank = Math.max(existing.rank, d.rank);
          existing.backlinks += d.backlinks;
        } else {
          seen.set(d.domain, { rank: d.rank, backlinks: d.backlinks, linksTo: new Set([target]) });
        }
      }
    } catch (e: any) {
      console.log(`FAILED (${e?.message})`);
    }
  }

  const rows = [...seen.entries()]
    .map(([domain, v]) => ({ domain, ...v, overlap: v.linksTo.size }))
    // Multi-target overlap first, then domain authority. A site that linked to three competitors
    // is a better prospect than a stronger site that linked to one.
    .sort((a, b) => b.overlap - a.overlap || b.rank - a.rank);

  console.log(`\n${'='.repeat(78)}`);
  console.log(`PROSPECTS -- ${rows.length} distinct domains link to at least one of the ${targets.length} target(s)`);
  console.log(`${'='.repeat(78)}\n`);
  console.log(`  rank  links  overlap  domain`);
  for (const r of rows.slice(0, 60)) {
    console.log(`  ${String(r.rank).padStart(4)}  ${String(r.backlinks).padStart(5)}  ${String(r.overlap).padStart(7)}  ${r.domain}`);
  }
  if (rows.length > 60) console.log(`  ... and ${rows.length - 60} more (raise --limit or filter further)`);

  const multi = rows.filter((r) => r.overlap > 1);
  if (multi.length) {
    console.log(`\n${multi.length} domain(s) link to MORE THAN ONE target -- start here:`);
    for (const r of multi.slice(0, 20)) {
      console.log(`  ${r.domain}  ->  ${[...r.linksTo].join(', ')}`);
    }
  }

  console.log(`\nThis is a research starting point, not a send list. Open each site, confirm it is`);
  console.log(`real and currently publishing, and find a genuine named contact before writing.`);
  console.log(`Do not email a scraped list -- see the header comment for why that backfires here.`);
}

main().catch((e) => { console.error(e?.message || e); process.exit(1); });
