import fs from 'fs';
import path from 'path';
import { routeChunkSources, type PrerenderedRouteKey } from '../../src/routeChunks.js';

// Turns a prerendered route into the <link rel="modulepreload"> tags for the chunk it will need.
//
// Since the nine route views became lazy (src/routeChunks.ts), main.tsx awaits the current route's
// chunk before it mounts. That await is what stops a prerendered article from blanking out to a
// spinner -- but on its own it also means the chunk can't even be *discovered* until the entry
// bundle has downloaded, parsed, and reached its import() call. Measured in the real built output:
// entry finished at 27ms, GuidePageView started at 33ms. That gap is one full round trip, which on
// the Slow 4G profile PageSpeed grades against is ~150-200ms of delayed interactivity on all 148
// prerendered pages -- a regression traded for the homepage's win, which is not a trade worth
// making silently. Emitting the hint into the HTML head moves that fetch into the initial parse,
// parallel with the entry bundle, so both land together and the gap disappears.
//
// Preloading is not the same as executing: a modulepreload only warms the module cache, so the
// import() in main.tsx still decides when the code actually runs. A hint for a chunk that ends up
// unused costs a download and nothing else, which is why this only ever emits for the one route
// the page was prerendered as.
//
// The manifest is a build-time input, not something to ship: dist/ is the served directory, and it
// was confirmed publicly fetchable at /.vite/manifest.json before `rm -rf dist/.vite` was added to
// the build script after the last prerender step. Nothing secret is in it -- only source paths and
// chunk names, all of which can be inferred from the bundle anyway -- but publishing a map of the
// source tree buys nothing, and this repo has already shipped one build artifact it did not mean
// to (see vite.config.ts on VITE_VERCEL_* env vars reaching the client bundle).

interface ManifestChunk {
  file: string;
  imports?: string[];
}

let manifestCache: Record<string, ManifestChunk> | null = null;

function loadManifest(distDir: string): Record<string, ManifestChunk> {
  if (manifestCache) return manifestCache;
  const manifestPath = path.join(distDir, '.vite', 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(
      `[routeChunkPreload] No Vite manifest at ${manifestPath}. It is produced by build.manifest ` +
        `in vite.config.ts, and these scripts must run after 'vite build' in the npm build chain.`
    );
  }
  manifestCache = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  // Fail loudly on drift rather than quietly emitting nothing. routeChunkSources is a hand-kept
  // mirror of the import() specifiers in routeChunks.ts; if a component is renamed or moved and
  // only one of the two is updated, the cost is an invisible perf regression on every SEO page,
  // so it is worth breaking the build over.
  const missing = Object.entries(routeChunkSources)
    .filter(([, src]) => !manifestCache![src])
    .map(([key, src]) => `${key} -> ${src}`);
  if (missing.length > 0) {
    throw new Error(
      `[routeChunkPreload] routeChunkSources is out of sync with the build. Not in the manifest:\n` +
        missing.map((m) => `  ${m}`).join('\n') +
        `\nUpdate src/routeChunks.ts so its source paths match the real files.`
    );
  }
  return manifestCache;
}

/**
 * Every chunk the given route needs, deepest dependency first, deduped.
 *
 * Walks the manifest's `imports` transitively because a route chunk is rarely alone -- GuidePageView
 * alone pulls in seven shared chunks (icons, pageTitle, ArticleClosingNote). Preloading only the
 * top-level chunk would leave those to be discovered afterwards and reintroduce most of the round
 * trip this exists to remove. The literal `index.html` key that Vite lists among a dynamic entry's
 * imports is the entry bundle itself, already in the HTML as a <script>, and is skipped.
 */
function collectChunkFiles(manifest: Record<string, ManifestChunk>, key: string, seen = new Set<string>()): string[] {
  if (key === 'index.html' || seen.has(key)) return [];
  seen.add(key);
  const chunk = manifest[key];
  if (!chunk) return [];
  const deps = (chunk.imports || []).flatMap((dep) => collectChunkFiles(manifest, dep, seen));
  return [...deps, chunk.file];
}

export function modulePreloadTags(routeKey: PrerenderedRouteKey, distDir = 'dist'): string {
  const manifest = loadManifest(distDir);
  const files = collectChunkFiles(manifest, routeChunkSources[routeKey]);
  return files.map((f) => `<link rel="modulepreload" href="/${f}" />`).join('\n  ');
}
