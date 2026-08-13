import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { renderToStaticMarkup } from 'react-dom/server';
import { ListingOmissionsSection } from '../src/components/home/ListingOmissionsSection';
import { HowItWorksSection } from '../src/components/home/HowItWorksSection';
import { PricingSection } from '../src/components/home/PricingSection';
import { ClosingCtaSection } from '../src/components/home/ClosingCtaSection';
import { HOMEPAGE_FAQS } from '../src/components/home/FaqSection';
import { ProofStrip } from '../src/components/home/ProofStrip';
import { LibrarySnapshotSection } from '../src/components/home/LibrarySnapshotSection';
import { isDbConfigured } from '../src/server/db.js';
import { loadHomepageData } from '../src/server/homepageApi.js';
import {
  HomeData,
  buildGuideClusters,
  pickResearchPages,
  pickCountyUpdates,
  computeCoverageStats,
} from '../src/utils/homeContent.js';

const EMPTY_HOME_DATA: HomeData = { articles: [], counties: [] };

// Static HTML generator for the homepage, run after `vite build` alongside
// scripts/prerender-guides.tsx.
//
// Overwrites dist/index.html in place with real content, and preserves the original empty-#root
// shell as dist/shell.html for dead URLs. This is the opposite of the first version of this
// script, which wrote to a separate dist/home.html and added a `{"source": "/", "destination":
// "/home.html"}` rewrite in vercel.json -- that rewrite never fired in production, because Vercel
// resolves the exact path '/' to an existing static file (dist/index.html) via filesystem
// priority *before* consulting `rewrites` at all (confirmed live). Since dist/index.html already
// exists and always will, the only way to put real content at '/' is to put it in that literal
// file. vercel.json's catch-all was changed to point unmatched paths at the new dist/shell.html
// instead, so dead URLs (which the client-side 404 fix in src/App.tsx handles at the JS layer)
// keep getting an empty, non-homepage shell rather than the real homepage content injected here.
//
// Deliberately skips AddressSearchBox (the actual interactive search UI) -- it's a heavy,
// browser-dependent component (geocoding calls, map tiles, etc.) with no reason to exist in a
// static crawler-facing shell. A real browser loads the same JS bundle referenced in this file
// and boots the normal interactive homepage on top via createRoot() (not hydrateRoot() -- see
// src/main.tsx), so there's no mismatch risk from this simplified markup being replaced.

function noop() {}

function HomeStaticBody({ data }: { data: HomeData }) {
  // Same derivations the client runs in src/components/Hero.tsx, from the same shared module in
  // src/utils/homeContent.ts -- that's what guarantees the crawler-facing HTML and the booted app
  // show the same clusters, in the same order, with the same counts.
  const clusters = buildGuideClusters(data.articles);
  const research = pickResearchPages(data.articles);
  const updates = pickCountyUpdates(data.articles);
  const stats = computeCoverageStats(data);

  return (
    <div className="space-y-0 pb-16">
      {/* Geometry here is a deliberate mirror of the real hero in src/components/Hero.tsx, not an
          approximation: same min-h-[85vh], same absolutely-positioned background layers. That
          matters for more than looks. The background photo is this page's LCP element, and LCP
          re-fires whenever a *larger* candidate paints -- so a shorter static hero (this was
          min-h-[40vh] with a flat bg-slate-950) doesn't just miss the win, it actively wastes it:
          the small version paints early, then React mounts the full-height one and LCP resets to
          whenever the JS bundle finished. Rendering it at the final size means the photo painted
          from this static HTML *is* the largest paint, so LCP lands on the preloaded image
          arriving rather than on React booting.

          Section height is driven purely by min-h-[85vh] (690px at a 375x812 mobile viewport,
          measured) -- the centered content is only ~370px -- so leaving AddressSearchBox out
          below cannot change the height of these background layers. */}
      <section className="relative min-h-[85vh] flex flex-col justify-center text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden shadow-2xl">
        {/* url() intentionally unquoted: React escapes quotes inside a style attribute, and
            unquoted is valid CSS anyway. Paired with the rel=preload hint injected into <head>
            further down, so the bytes are already in flight when this paints. */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-scroll md:bg-fixed"
          style={{ backgroundImage: 'url(/hero-bg.jpg)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/10 via-slate-950/25 to-slate-950/50" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <div className="space-y-4">
            <h1 className="font-sans text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
              Could you regret moving here?
            </h1>
            <p className="text-base sm:text-xl text-slate-300 font-sans font-normal max-w-2xl mx-auto leading-relaxed">
              Search any US residential address. Get the checks that actually matter for a home of its age and county, the exact questions to ask the seller, and a clear list of what to verify before you sign.
            </p>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            Your first report is free. No credit card required.
          </p>
        </div>
      </section>

      <ProofStrip stats={stats} />
      <ListingOmissionsSection />
      <HowItWorksSection />
      <PricingSection onScrollToSearch={noop} />

      {/* Same order and position as src/components/Hero.tsx. No onNavigate is passed, so
          ContentLink renders plain crawlable <a href> markup here -- the point of prerendering
          this section: its guide and county links get picked up from the domain's strongest page. */}
      <LibrarySnapshotSection
        clusters={clusters}
        research={research}
        counties={data.counties}
        updates={updates}
        totalGuides={stats.guideCount}
      />

      <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              How this differs from a home inspection, and how we stay independent.
            </p>
          </div>
          <div className="space-y-4">
            {HOMEPAGE_FAQS.map((faq, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="w-full p-6 text-left font-sans text-lg font-bold text-slate-900">{faq.q}</div>
                <div className="px-6 pb-6 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 font-sans">
                  {faq.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ClosingCtaSection onScrollToSearch={noop} />
    </div>
  );
}

function buildFaqJsonLd(): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: HOMEPAGE_FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  };
}

function escapeJsonForScriptTag(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

async function run() {
  const distPath = path.join(process.cwd(), 'dist');
  const templatePath = path.join(distPath, 'index.html');
  if (!fs.existsSync(templatePath)) {
    console.error('[prerender-homepage] dist/index.html not found -- run `vite build` first.');
    process.exit(1);
  }
  // dist/index.html at this point is still the pristine, empty-#root file vite build produced --
  // scripts/prerender-guides.tsx (which runs before this script) only reads it as a template, it
  // never writes to it. Preserve that pristine copy as dist/shell.html *before* overwriting
  // dist/index.html below: Vercel resolves the exact path '/' to dist/index.html via its own
  // filesystem-priority static serving, before rewrites are even consulted (confirmed live -- a
  // `{"source": "/", "destination": "/home.html"}` rewrite never fired, because a real file
  // already existed at '/'). So the real content has to live at dist/index.html itself, and the
  // dead-URL catch-all needs a *different* file to point to instead -- see vercel.json.
  const template = fs.readFileSync(templatePath, 'utf8');
  fs.writeFileSync(path.join(distPath, 'shell.html'), template, 'utf8');

  // Reuses the exact loader GET /api/homepage serves, rather than a second hand-written query, so
  // the build-time content and the runtime fallback can't drift apart in either shape or filtering.
  const data: HomeData = isDbConfigured() ? await loadHomepageData() : EMPTY_HOME_DATA;

  const bodyHtml = renderToStaticMarkup(<HomeStaticBody data={data} />);
  const faqScript = `<script type="application/ld+json" data-seo="prerendered">${escapeJsonForScriptTag(buildFaqJsonLd())}</script>`;

  // Hand the same dataset to the client so React's first paint already has it -- see useHomeData()
  // in src/components/Hero.tsx. Without this the booted app would briefly render the content
  // sections empty and then pop them in once /api/homepage resolved, undoing the whole point of
  // prerendering them.
  const preloadScript = `<script>window.__PRELOADED_HOME__=${escapeJsonForScriptTag(data)}</script>`;

  // Preload the hero photo. It's the homepage's LCP element, but it's a CSS background-image on a
  // div that only exists once React has booted -- the static markup above deliberately renders a
  // plain bg-slate-950 hero instead. So without this hint the browser can't even discover the
  // image until the JS bundle has downloaded, parsed, and rendered, which is exactly the
  // "resource load delay" PageSpeed measured as the single largest slice of LCP. The preload
  // scanner sees this during initial HTML parse and fetches it in parallel with the CSS and JS,
  // so the bytes are already there by the time the real hero mounts.
  //
  // Injected here rather than in the source index.html on purpose: this script only rewrites
  // dist/index.html, so the hint lands on the homepage alone. hero-bg.jpg isn't a visible
  // background on guide or county pages (they only cite it as JSON-LD `image` metadata), and
  // shell.html is written above before this replace runs, so dead URLs don't pay for it either.
  const heroPreload = `<link rel="preload" as="image" href="/hero-bg.jpg" fetchpriority="high" />`;

  const html = template
    .replace('</head>', `${heroPreload}\n  ${faqScript}\n  ${preloadScript}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`);

  fs.writeFileSync(templatePath, html, 'utf8');
  console.log(
    `[prerender-homepage] Wrote dist/shell.html (empty, for dead-URL fallback) and overwrote dist/index.html ` +
      `with real homepage content (${data.articles.length} published pages, ${data.counties.length} counties)`
  );
}

run().catch((err) => {
  console.error('[prerender-homepage] Failed:', err);
  process.exit(1);
});
