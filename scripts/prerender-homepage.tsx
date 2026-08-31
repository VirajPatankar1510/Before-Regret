import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { renderToStaticMarkup } from 'react-dom/server';
import { Check } from 'lucide-react';
import { ListingOmissionsSection } from '../src/components/home/ListingOmissionsSection';
import { HowItWorksSection } from '../src/components/home/HowItWorksSection';
import { PricingSection } from '../src/components/home/PricingSection';
import { ClosingCtaSection } from '../src/components/home/ClosingCtaSection';
import { HOMEPAGE_FAQS } from '../src/components/home/FaqSection';
import { GuideCardsSection } from '../src/components/home/GuideCardsSection';
import { StaticFooterLinks, FooterGuideSummary } from '../src/components/StaticFooterLinks';
import { isDbConfigured } from '../src/server/db.js';
import { loadHomepageData } from '../src/server/homepageApi.js';
import { HomeData, buildGuideClusters, pickResearchPages } from '../src/utils/homeContent.js';

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
        {/* The background-image itself is the .hero-bg rule in src/index.css (a WebP with a JPEG
            fallback -- see that rule), not an inline style, so this static markup and the real
            Hero component stay on one definition. Paired with the rel=preload hint injected into
            <head> further down, so the bytes are already in flight when this paints. */}
        <div className="hero-bg absolute inset-0 bg-cover bg-center bg-scroll md:bg-fixed" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/10 via-slate-950/25 to-slate-950/50" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <div className="space-y-5">
            <h1 className="font-sans text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
              Could you regret moving here?
            </h1>
            <p className="text-base sm:text-xl text-slate-300 font-sans font-normal max-w-2xl mx-auto leading-relaxed">
              Search any US residential address and get:
            </p>
            <ul className="max-w-md mx-auto text-left space-y-2.5 pt-1">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 shrink-0 mt-0.5" />
                <span className="text-sm sm:text-base text-slate-300 leading-snug">
                  The checks that actually matter for a home of its age and county
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 shrink-0 mt-0.5" />
                <span className="text-sm sm:text-base text-slate-300 leading-snug">
                  The exact questions to ask the seller
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 shrink-0 mt-0.5" />
                <span className="text-sm sm:text-base text-slate-300 leading-snug">
                  A clear list of what to verify before you sign
                </span>
              </li>
            </ul>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            Your first report is free. No credit card required.
          </p>
          {/* Mirrors src/components/Hero.tsx's own sample-report link -- same href, same styling,
              same position relative to the subtext above it. A plain <a>, same as the live
              component, so this needs no onNavigate wiring to render correctly here. */}
          <a
            href="/sample-report/"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-200 border border-white/20 rounded-full hover:bg-white/10 hover:text-white hover:border-white/30 transition-colors"
          >
            See a sample report
            <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </section>

      <ListingOmissionsSection />
      <HowItWorksSection />
      <PricingSection onScrollToSearch={noop} />

      {/* Same order and position as src/components/Hero.tsx. No onNavigate is passed, so
          ContentLink renders plain crawlable <a href> markup here -- the point of prerendering
          this section: its guide card links get picked up from the domain's strongest page. */}
      <GuideCardsSection
        clusters={clusters}
        research={research}
        totalGuides={data.articles.length}
      />

      {/* Same position as src/components/Hero.tsx (section 5b). No onNavigate is passed, so every
          county link renders as a plain crawlable <a href> -- the point of prerendering this: 100
          county pages get a direct inbound link from the domain's strongest page instead of only a
          third-hop path through the footer's /counties/ hub link. See CountyLinksSection.tsx. */}

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

      {/* This link -- specifically /counties/, and every guide/legal link alongside it -- was
          entirely absent from the homepage's static HTML before this. Real Search Console data
          found 106 URLs stuck in "Discovered - currently not indexed," heavily concentrated in the
          county section, which had no path in from the one page every crawl of this domain starts
          at. See StaticFooterLinks.tsx for the full story -- this was a known, considered gap in
          the code ("no SEO cost") that real index-coverage data proved wrong. */}
      <StaticFooterLinks
        guides={data.articles
          .filter((a) => (a.articleType ?? 'guide') === 'guide')
          .slice(0, 4)
          .map((a): FooterGuideSummary => ({ slug: a.slug, title: a.title }))}
      />
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

// Inlines the ENTIRE built stylesheet into the homepage and removes its <link>, so the homepage
// ships with zero render-blocking stylesheet requests.
//
// This replaces an earlier attempt that inlined only the .hero-bg background-image rule. That
// attempt did nothing measurable, and the reason is worth recording so it isn't repeated: the LCP
// element is
//   <div class="hero-bg absolute inset-0 bg-cover bg-center bg-scroll md:bg-fixed">
// inside a section carrying min-h-[85vh] flex flex-col justify-center. Every one of those layout
// utilities lives in the built stylesheet, not in the hand-inlined snippet -- so the browser had
// the image URL early but not the rules giving the element its ~690px of height. An element with
// no computed size cannot paint and cannot become an LCP candidate, so the early URL bought
// nothing. Above-the-fold markup needs its LAYOUT rules inlined, not just its paint rules.
//
// Why the whole file rather than a critical subset: this is Tailwind v4 output -- 71 @property
// registrations, 5 cascade @layers, 33 :where() wrappers, 73 @supports blocks. A hand-rolled
// subset extractor across that is very easy to get subtly wrong, and the failure mode is silent
// visual breakage across the highest-traffic page rather than a build error. The whole file is
// 76KB raw but only ~13KB gzipped, against a homepage already ~24KB gzipped, and inlining removes
// a full request round trip that Lighthouse measured as 150ms of render-blocking on Slow 4G.
// Correctness beats the last few KB here.
//
// Deliberately homepage-only. Guide and county pages (235 of them) keep the external stylesheet so
// it stays cacheable across a browsing session; only the single highest-value entry point trades
// cacheability for a faster first paint.
//
// Honest scope note: this targets FCP and the render-blocking round trip. It does NOT address the
// ~1.6s "element render delay", which is React's createRoot() discarding the prerendered DOM and
// re-mounting the hero (see the comment in src/main.tsx that says so outright). That needs
// hydrateRoot and a prerender that matches what React renders -- a separate, larger change.
function inlineStylesheet(html: string, distPath: string): string {
  const linkMatch = html.match(/<link[^>]*rel="stylesheet"[^>]*href="(\/assets\/index-[^"]+\.css)"[^>]*>/);
  if (!linkMatch) {
    throw new Error('[prerender-homepage] Could not find the main stylesheet <link> in dist/index.html.');
  }
  const cssPath = path.join(distPath, linkMatch[1]);
  const css = fs.readFileSync(cssPath, 'utf8');
  // </style> inside CSS content would terminate the tag early. Tailwind output has no reason to
  // contain it, but a content: "..." string legitimately could, so this is escaped rather than
  // assumed safe.
  const safeCss = css.replace(/<\/style>/gi, '<\\/style>');
  return html.replace(linkMatch[0], `<style>${safeCss}</style>`);
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
  //
  // Injected at the END OF <body>, not into <head>, and that placement is the whole point of this
  // comment. This blob is the single largest thing on the homepage -- 134 articles + 100 counties,
  // ~58KB, 59% of the total HTML at time of writing -- and it grows with every article published.
  // In <head> it sat entirely BEFORE the hero markup in byte order, so the parser had to stream and
  // chew through ~70KB before it even reached the LCP element (measured: hero-bg div at byte 69,972
  // of 100,003). Desktop hides that completely; under Lighthouse's mobile profile (4x CPU slowdown,
  // Slow 4G) it showed up as 1,790ms of "element render delay" -- the dominant slice of a 4.5s LCP,
  // and the reason an earlier attempt at inlining the hero's critical CSS moved nothing: the
  // bottleneck was never the CSS rule, it was the parser's distance to the element.
  //
  // Safe at end-of-body because nothing reads it during parse. useHomeData() reads it from inside a
  // useState lazy initializer (so: at React mount), and the app bundle is <script type="module">,
  // which is deferred and therefore executes only after the document is fully parsed. A plain
  // <script> like this one executes the moment the parser hits it, which is still strictly before
  // any deferred module. Even if that ordering ever broke, useHomeData falls back to
  // GET /api/homepage rather than rendering empty.
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
  // dist/index.html, so the hint lands on the homepage alone. The hero image isn't a visible
  // background on guide or county pages (they only cite it as JSON-LD `image` metadata), and
  // shell.html is written above before this replace runs, so dead URLs don't pay for it either.
  //
  // Preloads the WebP, matching what .hero-bg (src/index.css) actually resolves to in any browser
  // that supports image-set(). type="image/webp" is what keeps this honest for the browsers that
  // don't: a preload carrying a `type` is only fetched by a browser that can decode it, so they
  // skip this and pick up the JPEG fallback from the stylesheet instead of eagerly downloading
  // 52KB they would never paint.
  //
  // Two links, not one, because .hero-bg now resolves to a different file on portrait phones (a
  // 640px center crop, 22.8 KiB vs 52.3 KiB -- see the @media rule in src/index.css for why the
  // crop is lossless here). The `media` attribute is what keeps that a saving rather than a
  // regression: a preload without it would start the desktop image on every phone, and the
  // stylesheet would then request the mobile one too, downloading both and making LCP worse than
  // before the split. These two queries are mutually exclusive and must stay character-for-
  // character identical to the ones in src/index.css -- if they ever disagree, the preload scanner
  // races the wrong file and the stylesheet quietly fetches the right one on top of it.
  const heroPreload =
    `<link rel="preload" as="image" href="/hero-bg-mobile.webp" type="image/webp" fetchpriority="high" media="(max-width: 500px) and (orientation: portrait)" />\n  ` +
    `<link rel="preload" as="image" href="/hero-bg.webp" type="image/webp" fetchpriority="high" media="not all and (max-width: 500px) and (orientation: portrait)" />`;

  // preloadScript is deliberately NOT in this <head> group -- see its own comment above. faqScript
  // stays in <head>: it's JSON-LD for crawlers, small, and belongs with the other metadata.
  // inlineStylesheet runs last so it operates on the finished document and can't be undone by a
  // later replace re-introducing the <link>.
  // heroPreload goes at the TOP of <head>, not the bottom, and that ordering is load-bearing once
  // the stylesheet is inlined below: inlining puts ~76KB of CSS into <head>, and anything after it
  // is 76KB further from the preload scanner. Injected at the end of <head> (as it was before this
  // change) the image preload landed at byte ~83,000 instead of ~7,900, which would have given back
  // the resource-load-delay improvement measured the day before (410ms -> 220ms) to buy a smaller
  // saving elsewhere. First bytes of <head> is the only correct home for it.
  const html = inlineStylesheet(
    template
      .replace('<head>', `<head>\n    ${heroPreload}`)
      .replace('</head>', `${faqScript}\n  </head>`)
      .replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`)
      .replace('</body>', `  ${preloadScript}\n  </body>`),
    distPath
  );

  // Both assertions guard against a silent no-op shipping to production: a missed preload injection
  // renders the content sections empty until /api/homepage resolves (the exact flash the preload
  // exists to prevent), and a surviving stylesheet <link> means the homepage still blocks render on
  // a request this whole change exists to remove. Failing the build is the cheaper outcome.
  if (!html.includes('__PRELOADED_HOME__')) {
    console.error('[prerender-homepage] Failed to inject __PRELOADED_HOME__ -- no </body> in the template?');
    process.exit(1);
  }
  if (/<link[^>]*rel="stylesheet"[^>]*\/assets\/index-[^"]+\.css/.test(html)) {
    console.error('[prerender-homepage] Stylesheet <link> survived inlining -- the homepage would still block render.');
    process.exit(1);
  }

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
