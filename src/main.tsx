import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { preloadRouteChunk } from './routeChunks';
// Replaces Google Analytics, removed from index.html on 2026-08-26. GA4's gtag.js was 147.5 KiB
// transferred -- more than React and this app's entire shell combined -- to record pageviews and
// nothing else, since no custom gtag() event was ever fired anywhere in the codebase. This is
// roughly 1 KiB and reports the same pageviews, top pages, referrers and devices.
//
// Mounted inside the React tree rather than as a script tag in index.html so it is bundled and
// versioned with the app, and so it records a view on client-side route changes -- App.tsx swaps
// routes without a document navigation, which a plain script tag would never see.
import { Analytics } from '@vercel/analytics/react';

const mount = () => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AuthProvider>
        <App />
        <Analytics />
      </AuthProvider>
    </StrictMode>,
  );
};

// Nine route views are split out of the entry bundle so the homepage stops paying for code it can
// never render (see src/routeChunks.ts for the measurements). Mounting is deferred until the
// current URL's chunk is in cache, which is what makes that split safe rather than a regression:
// createRoot() throws away the prerendered HTML inside #root, so mounting first and resolving the
// chunk second would blank a prerendered guide or county page out to a spinner while a visitor is
// looking at it. Waiting costs nothing visually -- the prerendered markup stays on screen the
// whole time, so a slightly later mount is indistinguishable from an earlier one.
//
// On the homepage, and on every already-lazy route (report flow, checkout, admin), this resolves
// immediately and mounts on the same microtask -- there is no added delay for the page the split
// was done for. preloadRouteChunk never rejects, so a failed chunk still mounts and degrades to
// the Suspense fallback instead of leaving a permanently inert page.
preloadRouteChunk(window.location.pathname).then(mount, mount);
