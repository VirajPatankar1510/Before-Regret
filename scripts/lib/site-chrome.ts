// Shared page chrome for the prerendered static pages -- the site nav, footer, analytics beacon,
// extra CSS, and the escaping helpers.
//
// Extracted from scripts/prerender-research.tsx when /sunlight/ needed the same chrome. It was a
// MOVE rather than a retype, and the research pages were verified byte-identical afterwards: two
// copies of a footer is two footers that drift, and the one that drifts is always the page nobody
// is looking at.
import fs from 'node:fs';
import path from 'node:path';

export const OG_IMAGE = 'https://www.beforeregret.com/og-image.png';

// Plain HTML, styled off the study's own custom properties. StaticFooterLinks is not reusable here:
// it is Tailwind-classed, and this document never loads the app's stylesheet.
// On a STUDY page "Research" is a link up to the index; on the index itself it is the current page
// and stays plain text. Splitting them is what gives /research/ four inbound links from the studies
// -- before this the word was inert on every page and the index had no inbound links at all.
export const SITE_NAV = `
<nav class="sitebar" aria-label="Before Regret">
  <a href="/" class="brand">Before&nbsp;Regret</a>
  <span class="sitebar-sep" aria-hidden="true">&#183;</span>
  <a href="/research/" class="brand">Research</a>
</nav>`;

export const SITE_NAV_INDEX = `
<nav class="sitebar" aria-label="Before Regret">
  <a href="/" class="brand">Before&nbsp;Regret</a>
  <span class="sitebar-sep" aria-hidden="true">&#183;</span>
  <span class="sitebar-here">Research</span>
</nav>`;

// Deliberately NOT added to the embeds, which have their own shell below. An embed runs on someone
// else's page, and putting a tracker in a widget you are asking a newsroom to trust is a cost that
// outweighs knowing the number.
// The inline block registers a beforeSend handler on window.vaq BEFORE the deferred script runs,
// which is what lets it filter our own traffic on these pages the way <Analytics beforeSend> does
// in the React app. The script replays window.vaq inside its init, ahead of the first pageview, so
// the opening view is filtered too. Kept inline and dependency-free because these pages load no
// bundle at all -- that is the whole reason they needed a beacon of their own.
export const ANALYTICS_BEACON = `<script>
(function(){try{
  var F='br-no-analytics',u=new URL(location.href);
  if(u.searchParams.has('no-analytics')){
    if(u.searchParams.get('no-analytics')!=='0')localStorage.setItem(F,'1');else localStorage.removeItem(F);
  }
  window.vaq=window.vaq||[];
  window.vaq.push(['beforeSend',function(e){return localStorage.getItem(F)==='1'?null:e;}]);
}catch(e){}})();
</script>
<script defer src="/_vercel/insights/script.js"></script>`;

/**
 * The site footer.
 *
 * The second column is a parameter because it was wrong the moment a page that is not a study used
 * this footer: /sunlight/ was rendering a heading that said "This study" above links to ACS and the
 * FEMA National Risk Index, neither of which it uses. A footer that cites sources the page does not
 * have is worse than no citation.
 *
 * The first column now carries /sunlight/. That link is the reason the tool has any chance of being
 * indexed: it is otherwise reachable only from the sitemap, and on this property "discovered but
 * not indexed" is the normal fate of a page nothing links to.
 */
export function siteFooter(second?: { heading: string; links: Array<{ href: string; text: string; external?: boolean }> }): string {
  const col = second ?? {
    heading: 'This study',
    links: [
      { href: 'https://www.census.gov/programs-surveys/acs/', text: 'U.S. Census Bureau, ACS', external: true },
      { href: 'https://hazards.fema.gov/nri/', text: 'FEMA National Risk Index', external: true },
      { href: '/support/', text: 'Corrections &amp; questions' },
    ],
  };
  return `
<nav class="sitelinks" aria-label="Site sections">
  <div>
    <h4>Before Regret</h4>
    <ul>
      <li><a href="/">Research a property</a></li>
      <li><a href="/guides/">Editorial guides</a></li>
      <li><a href="/sunlight/">Sunlight by room</a></li>
      <li><a href="/about/">About &amp; methodology</a></li>
      <li><a href="/advertise/">Advertise with us</a></li>
    </ul>
  </div>
  <div>
    <h4>${col.heading}</h4>
    <ul>
${col.links.map((l) => `      <li><a href="${l.href}"${l.external ? ' rel="noopener"' : ''}>${l.text}</a></li>`).join('\n')}
    </ul>
  </div>
</nav>`;
}

export const SITE_FOOTER = siteFooter();

export const EXTRA_CSS = `
.sitebar{max-width:1000px;margin:0 auto;padding:22px 0 0;display:flex;align-items:baseline;gap:10px;
  font-family:var(--mono);font-size:.74rem;letter-spacing:.14em;text-transform:uppercase}
.sitebar .brand{color:var(--ink);text-decoration:none;font-weight:600;border-bottom:1px solid var(--rule)}
.sitebar .brand:hover{border-bottom-color:var(--price)}
.sitebar-sep,.sitebar-here{color:var(--muted)}
.sitelinks{max-width:1000px;margin:0 auto;padding:44px 0 0;border-top:1px solid var(--rule);
  display:grid;grid-template-columns:1fr;gap:28px;font-family:var(--mono);font-size:.78rem}
@media(min-width:640px){.sitelinks{grid-template-columns:1fr 1fr}}
.sitelinks h4{margin:0 0 10px;font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;
  color:var(--muted);font-weight:600}
.sitelinks ul{list-style:none;margin:0;padding:0}
.sitelinks li{margin:0 0 7px}
.sitelinks a{color:var(--ink);text-decoration:none;border-bottom:1px solid var(--rule)}
.sitelinks a:hover{border-bottom-color:var(--price);color:var(--price)}`;

export function escapeHtmlAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function escapeJsonForScriptTag(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

// The block deliberately keeps index.html's shape, including carrying no data-seo attribute. On a
// guide that attribute governs whether src/utils/headSeo.ts strips the node on a client-side route
// change; these documents never load the React app, so it is inert here, but matching the source
// exactly is what lets the assertion be a straight comparison.
export function readSiteEntityLd(distPath: string): string {
  const indexPath = path.join(distPath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    throw new Error('[prerender-research] dist/index.html not found -- run `vite build` first.');
  }
  const html = fs.readFileSync(indexPath, 'utf8');
  // The GLOBAL block is the one with no data-seo attribute; page-specific blocks carry one.
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (blocks.length !== 1) {
    throw new Error(`[prerender-research] expected exactly 1 unattributed ld+json block in dist/index.html, found ${blocks.length}`);
  }
  const raw = blocks[0][1];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`[prerender-research] the site entity block in dist/index.html does not parse: ${(e as Error).message}`);
  }
  const nodes = (Array.isArray(parsed) ? parsed : [parsed]) as Array<Record<string, unknown>>;
  const ids = nodes.map((n) => String(n['@id'] ?? ''));
  for (const need of ['https://www.beforeregret.com/#organization', 'https://www.beforeregret.com/#website']) {
    if (!ids.includes(need)) {
      throw new Error(`[prerender-research] dist/index.html entity block is missing @id ${need} -- got ${ids.join(', ')}`);
    }
  }
  return `  <script type="application/ld+json">${raw}</script>`;
}
