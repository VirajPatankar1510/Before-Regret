// Static noindex shells for the two commercial checkout routes /topic-ads/ and /report-ads/.
//
// The problem this fixes: neither route is prerendered with content (deliberately -- they're
// interactive, client-rendered checkout/landing flows, and they are noindex on purpose: payment
// funnels with nothing for a searcher to find). But because no dist file existed for them, Vercel's
// catch-all served dist/shell.html for both -- and shell.html carries the HOMEPAGE's <title> and,
// worse, `robots: index, follow`. So a crawler reading raw HTML (before executing the JS that calls
// applyHeadSeo) saw these pages as indexable, with the homepage's title, directly contradicting the
// noindex intent. A live audit flagged exactly this.
//
// The fix is NOT to prerender their content -- we don't want them indexed, so there's nothing to
// bake. It's to write a minimal shell per route whose <head> already says `noindex, nofollow` with
// the route's own real title/description/canonical, so the raw HTML agrees with what applyHeadSeo
// sets after mount (src/App.tsx, pseoRoute 'guideAds' and 'vendors'). #root stays empty; the client
// boots the real interactive page on top via createRoot() exactly as before -- this only changes
// the head metadata a non-JS crawler reads, nothing a human sees.
//
// Runs after prerender-homepage (which writes dist/shell.html) in the build chain. Values below
// must stay in sync by hand with the applyHeadSeo() calls in src/App.tsx for these two routes --
// same discipline prerender-advertise.tsx and prerender-legal-pages.tsx already rely on.
import fs from 'fs';
import path from 'path';

interface NoindexRoute {
  dir: string; // dist subdirectory, e.g. 'topic-ads'
  title: string;
  description: string;
  canonical: string;
}

// Mirrors src/App.tsx: pseoRoute.type === 'guideAds' (/topic-ads) and === 'vendors' (/report-ads),
// plus the post-checkout confirmations and the signed-in placement dashboard below.
//
// Every route here ALREADY sets 'noindex, nofollow' client-side via applyHeadSeo (see the
// pseoRoute branches in src/App.tsx) -- so a JS-rendering crawler has always seen the right
// directive. What this script fixes is the raw HTML those routes serve BEFORE the JS runs, which
// otherwise falls through to dist/shell.html's homepage title and 'index, follow'. The two layers
// must agree; that is the whole point of the file.
//
// Only FIXED, enumerable paths belong here -- one static shell is written per directory below.
// The per-report routes (/report/<id>, /insights/<id>) deliberately are NOT in this list and never
// can be: their ids are unbounded and unknown at build time, so they are covered by robots.txt
// Disallow instead (see generateRobotsTxt in src/utils/sitemapGenerator.ts for that reasoning).
const ROUTES: NoindexRoute[] = [
  {
    dir: 'topic-ads',
    title: 'Topic Ads | BeforeRegret',
    description:
      'Self-serve topic-based ad placements on BeforeRegret -- $7.99 per slot, 30 days, open to any business.',
    canonical: 'https://www.beforeregret.com/topic-ads/',
  },
  {
    dir: 'report-ads',
    title: 'Report Ads | BeforeRegret',
    description:
      'Vendor marketplace for home inspectors, contractors, and specialists to reach property buyers.',
    canonical: 'https://www.beforeregret.com/report-ads/',
  },
  // Post-checkout confirmations. Titles match the 'vendorsSuccess' / 'guideAdsSuccess' branches in
  // App.tsx. A confirmation page is the classic never-index case: it is meaningless without the
  // transaction that produced it, and a searcher landing on one has arrived at a dead end.
  {
    dir: 'report-ads/success',
    title: 'Payment Confirmation | BeforeRegret',
    description: 'Confirmation of a completed BeforeRegret report ad placement purchase.',
    canonical: 'https://www.beforeregret.com/report-ads/success/',
  },
  {
    dir: 'topic-ads/success',
    title: 'Payment Confirmation | BeforeRegret',
    description: 'Confirmation of a completed BeforeRegret topic ad placement purchase.',
    canonical: 'https://www.beforeregret.com/topic-ads/success/',
  },
  {
    dir: 'payment-success',
    title: 'Payment Confirmation | BeforeRegret',
    description: 'Confirmation of a completed BeforeRegret payment.',
    canonical: 'https://www.beforeregret.com/payment-success/',
  },
  {
    dir: 'payment-cancelled',
    title: 'Payment Cancelled | BeforeRegret',
    description: 'A BeforeRegret payment was cancelled before completing.',
    canonical: 'https://www.beforeregret.com/payment-cancelled/',
  },
  // Signed-in advertiser dashboard ('myAds' in App.tsx) -- per-user content behind Clerk auth,
  // with nothing a search visitor could act on.
  {
    dir: 'my-ads',
    title: 'My Placements | BeforeRegret',
    description: 'Manage your active BeforeRegret ad placements.',
    canonical: 'https://www.beforeregret.com/my-ads/',
  },
];

function escapeHtmlAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function run() {
  const distPath = path.join(process.cwd(), 'dist');
  const shellPath = path.join(distPath, 'shell.html');
  if (!fs.existsSync(shellPath)) {
    console.error('[prerender-noindex-routes] dist/shell.html not found -- run scripts/prerender-homepage.tsx first.');
    process.exit(1);
  }
  const template = fs.readFileSync(shellPath, 'utf8');

  for (const route of ROUTES) {
    let html = template;
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtmlAttr(route.title)}</title>`);
    html = html.replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${escapeHtmlAttr(route.description)}"`);
    // The load-bearing line: shell.html ships `index, follow`; these routes must say otherwise.
    html = html.replace(/<meta name="robots" content="[^"]*"/, `<meta name="robots" content="noindex, nofollow"`);
    html = html.replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${escapeHtmlAttr(route.canonical)}"`);
    html = html.replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${escapeHtmlAttr(route.canonical)}"`);
    html = html.replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${escapeHtmlAttr(route.title)}"`);
    html = html.replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${escapeHtmlAttr(route.description)}"`);
    html = html.replace(/<meta name="twitter:title" content="[^"]*"/, `<meta name="twitter:title" content="${escapeHtmlAttr(route.title)}"`);
    html = html.replace(/<meta name="twitter:description" content="[^"]*"/, `<meta name="twitter:description" content="${escapeHtmlAttr(route.description)}"`);

    // Guard: fail the build if the robots directive didn't actually get rewritten -- a silent
    // no-op here would ship the exact index,follow contradiction this script exists to remove.
    if (!/<meta name="robots" content="noindex, nofollow"/.test(html)) {
      console.error(`[prerender-noindex-routes] Failed to set noindex on /${route.dir}/ -- shell.html robots meta not found.`);
      process.exit(1);
    }

    const outDir = path.join(distPath, route.dir);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
  }

  console.log(`[prerender-noindex-routes] Wrote noindex shells for ${ROUTES.map((r) => `/${r.dir}/`).join(', ')}`);
}

run();
