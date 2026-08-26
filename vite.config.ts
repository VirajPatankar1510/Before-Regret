import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  // Vercel's "Automatically expose System Environment Variables" setting mirrors its git
  // metadata (VERCEL_GIT_COMMIT_MESSAGE, _SHA, _AUTHOR_NAME, etc.) into VITE_-prefixed
  // duplicates so framework tooling can read them. Excluding VITE_VERCEL_ from the custom
  // `envDefine` map below is NOT enough on its own -- Vite has its own built-in import.meta.env
  // exposure that independently picks up every VITE_-prefixed process.env var regardless of
  // this file's `define` block. That's the actual mechanism that shipped every commit message
  // (including ones describing security fixes) into the public client bundle, readable by
  // anyone via browser devtools. Deleting these from process.env here, before Vite's own env
  // loading runs, is what actually keeps them out. Nothing in src/ reads VITE_VERCEL_* today
  // (see src/context/AuthContext.tsx's getEnv), so removing the whole namespace is safe.
  for (const key of Object.keys(process.env)) {
    if (key.startsWith('VITE_VERCEL_')) {
      delete process.env[key];
    }
  }

  const envDefine = Object.keys(process.env).reduce((acc, key) => {
    if (key.startsWith('VITE_')) {
      acc[`import.meta.env.${key}`] = JSON.stringify(process.env[key]);
    }
    return acc;
  }, {} as Record<string, string>);

  return {
    plugins: [react(), tailwindcss()],
    build: {
      // Emits dist/.vite/manifest.json, which the prerender scripts read to turn a source module
      // path into the hashed chunk filename it was built into. Needed because the nine prerendered
      // route views are lazy now (see src/routeChunks.ts): without a hint in the HTML, the browser
      // cannot discover a route's chunk until the entry bundle has downloaded, parsed, and called
      // import() -- a full extra round trip before React can mount, measured as a clean serial gap
      // in the waterfall. Emitting <link rel="modulepreload"> for the right chunk lets that fetch
      // start during the initial HTML parse instead, in parallel with the entry bundle. Globbing
      // dist/assets for a name prefix would avoid this flag, but the manifest also lists each
      // chunk's transitive imports, which is what makes the hint complete rather than partial.
      manifest: true,
      rollupOptions: {
        output: {
          // Split ONLY React itself into its own chunk, by explicit allowlist.
          //
          // The obvious version of this rule -- `if (id.includes('node_modules')) return 'vendor'`
          // -- is actively harmful here and was measured before being rejected: it sweeps in
          // maplibre-gl, which AddressSearchBox.tsx deliberately loads on demand via a dynamic
          // import (see the comment there). Forcing it into an eagerly-loaded vendor chunk took
          // first-load JS from 158 KB gzipped to 471 KB, roughly triple, because every visitor
          // reading a guide would download a mapping library they never use.
          //
          // React and its scheduler are different: every page needs them immediately, so they are
          // already eager, and this only decides which file they live in. The gain is caching --
          // React does not change between deploys, so a returning visitor re-downloads only the
          // app chunk when content or features change, instead of the two bundled together.
          //
          // Anything not named here keeps Rollup's own chunking, which is what preserves the lazy
          // route chunks and maplibre.
          manualChunks(id) {
            if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react-vendor';
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    define: envDefine,
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
