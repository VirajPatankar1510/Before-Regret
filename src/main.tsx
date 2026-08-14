import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { preloadRouteChunk } from './routeChunks';

const mount = () => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AuthProvider>
        <App />
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
