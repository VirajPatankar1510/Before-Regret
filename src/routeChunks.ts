// The nine route components that have prerendered HTML on disk, and the one piece of logic that
// decides which of them (if any) the current URL needs.
//
// Why this file exists at all: these nine used to be static imports in App.tsx, deliberately, and
// the comment there explained the reasoning correctly -- main.tsx mounts with createRoot(), which
// DISCARDS the prerendered markup inside <div id="root"> and re-renders from scratch. Put one of
// these behind React.lazy() with nothing else changed and the prerendered article a visitor is
// already reading gets replaced by a spinner the moment the bundle boots. That is a real
// regression on exactly the pages the site depends on for organic traffic, and it is why the
// straightforward version of this optimization was previously (and correctly) rejected.
//
// What makes it safe now is that main.tsx awaits the chunk this module names BEFORE it calls
// createRoot(). Until React mounts, the prerendered HTML is simply still sitting in the document
// being displayed, so "not mounted yet" looks identical to "mounted" -- there is no intermediate
// state to flash. The Suspense boundary in App.tsx is never reached for these routes, because by
// the time the tree renders, lazy() already has its module resolved synchronously in cache.
//
// The homepage is the entire point: it matches none of these, awaits nothing, and no longer
// carries any of their code. PageSpeed measured 58.9 KiB of the 119 KiB entry bundle as never
// executed on the homepage, and these nine route views -- four SEO page templates plus five legal
// pages, none of which the homepage can ever render -- were the bulk of it. On a Slow 4G profile
// those bytes were not merely idle, they were actively competing with the hero image and the
// stylesheet for bandwidth during the exact window that decides LCP.

export const routeChunkLoaders = {
  guide: () => import('./components/seo/GuidePageView'),
  guidesIndex: () => import('./components/seo/GuidesIndexView'),
  county: () => import('./components/seo/CountyPageView'),
  countiesIndex: () => import('./components/seo/CountiesIndexView'),
  about: () => import('./components/AboutMethodology'),
  support: () => import('./components/ContactUs'),
  terms: () => import('./components/TermsConditions'),
  privacy: () => import('./components/PrivacyPolicy'),
  refunds: () => import('./components/RefundPolicy'),
  disclaimer: () => import('./components/Disclaimer'),
  accessibility: () => import('./components/Accessibility'),
} as const;

export type PrerenderedRouteKey = keyof typeof routeChunkLoaders;

/**
 * The same nine modules as source paths, keyed identically, for build-time use only.
 *
 * Vite's manifest is keyed by source path, and the prerender scripts need that key to look up the
 * hashed chunk filename for a <link rel="modulepreload">. The import() specifiers above cannot be
 * read back out at build time in any way that survives bundling, so this is a deliberate second
 * listing of the same files rather than something derived. That makes drift possible, so it is
 * checked rather than trusted: scripts/lib/routeChunkPreload.ts fails the build if any path here
 * is missing from disk or absent from the manifest. A silent mismatch would not break a page --
 * it would just quietly stop preloading and cost every SEO landing page an extra round trip
 * before mount, which is exactly the kind of regression that never gets noticed.
 */
export const routeChunkSources: Record<PrerenderedRouteKey, string> = {
  guide: 'src/components/seo/GuidePageView.tsx',
  guidesIndex: 'src/components/seo/GuidesIndexView.tsx',
  county: 'src/components/seo/CountyPageView.tsx',
  countiesIndex: 'src/components/seo/CountiesIndexView.tsx',
  about: 'src/components/AboutMethodology.tsx',
  support: 'src/components/ContactUs.tsx',
  terms: 'src/components/TermsConditions.tsx',
  privacy: 'src/components/PrivacyPolicy.tsx',
  refunds: 'src/components/RefundPolicy.tsx',
  disclaimer: 'src/components/Disclaimer.tsx',
  accessibility: 'src/components/Accessibility.tsx',
};

/**
 * Which prerendered route a path belongs to, or null for everything else (the homepage, the
 * post-search report flow, checkout, admin -- all of which either have no prerendered HTML to
 * protect or are already lazy and already behind the Suspense fallback).
 *
 * This mirrors the prerendered subset of resolveRouteFromPath() in App.tsx rather than sharing
 * code with it, because that function is a React state setter (it calls setPseoRoute/setCurrentStep
 * on every branch) and cannot run before a root exists. The duplication is deliberate but narrow:
 * only the nine paths below matter here, and getting one wrong is not a broken page -- App.tsx
 * still resolves the real route on mount. The only cost of a miss is that its chunk loads after
 * mount instead of before, i.e. the old flash risk returns for that one path. Keep the two in sync.
 */
export function prerenderedRouteForPath(pathname: string): PrerenderedRouteKey | null {
  const path = pathname.endsWith('/') ? pathname : `${pathname}/`;

  if (path.startsWith('/about')) return 'about';
  if (path.startsWith('/support')) return 'support';
  if (path.startsWith('/terms')) return 'terms';
  if (path.startsWith('/privacy')) return 'privacy';
  if (path.startsWith('/refunds') || path.startsWith('/refund-policy')) return 'refunds';
  if (path.startsWith('/disclaimer')) return 'disclaimer';
  if (path.startsWith('/accessibility')) return 'accessibility';

  if (path.startsWith('/guides/')) {
    // parts.length >= 2 means /guides/<slug>/; bare /guides/ is the hub index.
    return path.split('/').filter(Boolean).length >= 2 ? 'guide' : 'guidesIndex';
  }

  // Singular /county/<slug>/ for a single county, plural /counties/ for the index -- not a typo,
  // it matches the live URL structure (and resolveRouteFromPath) exactly.
  if (path.startsWith('/county/') && path.split('/').filter(Boolean).length >= 2) return 'county';
  if (path === '/counties/') return 'countiesIndex';

  return null;
}

/**
 * Resolves the current path's route chunk, or resolves immediately when there isn't one.
 *
 * Never rejects. A chunk that fails to download (offline, a stale hashed filename after a deploy)
 * must not leave the page permanently unmounted and inert -- mounting anyway falls back to the
 * Suspense spinner and React's own retry, which is a far better failure mode than a page that
 * never boots. That is why main.tsx can call this without a catch.
 */
export function preloadRouteChunk(pathname: string): Promise<unknown> {
  const key = prerenderedRouteForPath(pathname);
  if (!key) return Promise.resolve();
  return routeChunkLoaders[key]().catch((err) => {
    console.warn(`[routeChunks] Could not preload the "${key}" chunk; mounting anyway.`, err);
  });
}
