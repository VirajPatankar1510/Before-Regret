import React, { createContext, useContext, useState, useRef, useCallback, lazy, Suspense } from 'react';
import type { ClerkBridgeState } from './ClerkAuthBridge';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  isClerkActive: boolean;
  triggerClerkSignIn: (redirectUrl?: string) => void;
  triggerClerkSignUp: (redirectUrl?: string) => void;
  // Resolves to the current session's JWT (or null if signed out / Clerk not yet loaded) -- the
  // one thing a server route can actually verify, unlike `user.uid` which is just a plain string
  // the client could type in. Callers send this as `Authorization: Bearer <token>` on any request
  // that writes or reads vendor-scoped data (see GuideAdsCheckout.tsx, VendorSignupForm.tsx,
  // MyAdsPanel.tsx); the server verifies it in src/server/clerkAuth.ts.
  getToken: () => Promise<string | null>;
  // Starts the Clerk chunk downloading. Safe to call from anywhere, any number of times --
  // backed by a single boolean flip, so the first caller wins and the rest are no-ops. Every
  // consumer that can show UI depending on real auth state (not just a click handler that fires
  // well after page load) needs to call this itself now that there's no automatic page-wide
  // trigger -- see AuthProvider below for why that trigger was removed.
  requestClerkLoad: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to get environment variables securely at runtime (Express-injected or fallback to Vite build env)
export const getEnv = (key: string): string => {
  if (typeof window !== 'undefined' && (window as any).__ENV__ && (window as any).__ENV__[key] !== undefined) {
    return (window as any).__ENV__[key];
  }
  return import.meta.env[key] || '';
};

// Helper to check if Clerk Publishable Key is present and configured
export const getClerkPublishableKey = (): string => {
  const rawKey = getEnv('VITE_CLERK_PUBLISHABLE_KEY');
  let extractedKey = '';

  if (rawKey && rawKey !== 'YOUR_CLERK_PUBLISHABLE_KEY' && rawKey.trim() !== '' && !rawKey.startsWith('YOUR_')) {
    const match = rawKey.match(/pk_(test|live)_[a-zA-Z0-9$]+/);
    extractedKey = match ? match[0] : rawKey;
  }

  // Fallback domain detection for preview & production hosting
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isProductionDomain = hostname === 'beforeregret.com' || hostname.endsWith('.beforeregret.com');

    if (isProductionDomain) {
      if (extractedKey && extractedKey.startsWith('pk_live_')) {
        return extractedKey;
      }
      return 'pk_live_Y2xlcmsuYmVmb3JlcmVncmV0LmNvbSQ';
    } else {
      // In non-production preview/dev domains, production live keys will crash with origin error.
      // Always enforce test key in preview/dev mode.
      if (extractedKey && extractedKey.startsWith('pk_test_')) {
        return extractedKey;
      }
      return 'pk_test_YW11c2luZy1nYXplbGxlLTQ4LmNsZXJrLmFjY291bnRzLmRldiQ';
    }
  }

  return extractedKey || 'pk_test_YW11c2luZy1nYXplbGxlLTQ4LmNsZXJrLmFjY291bnRzLmRldiQ';
};

const CLERK_NOT_READY_WARNING = 'Clerk instance is not initialized or Clerk key is missing.';

// Isolates every direct dependency on @clerk/clerk-react (~296KB across its own internal chunks --
// ui-common, vendors, framework, plus the core clerk.browser bundle) into its own lazy-loaded
// module. See ClerkAuthBridge.tsx for the full reasoning; this is just the import() boundary.
const ClerkAuthBridge = lazy(() => import('./ClerkAuthBridge'));

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const clerkPublishableKey = getClerkPublishableKey();
  const isClerkActive = !!clerkPublishableKey;

  // loading starts true only when there's actually a key to resolve against -- with no key at
  // all there was never anything to wait for, matching the previous behavior exactly (the old
  // code's effect set loading=false immediately in that branch).
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(isClerkActive);
  const [shouldLoadBridge, setShouldLoadBridge] = useState(false);
  // Imperative handle, not state -- changing it should never itself trigger a re-render; it's
  // only read inside the trigger*/logout callbacks below, at the moment they're actually called.
  const clerkInstanceRef = useRef<any>(null);

  // Was previously an automatic requestIdleCallback trigger, firing on every page view a few
  // hundred ms after load regardless of whether that visitor ever went near auth. That got Clerk
  // off the render-blocking critical path, but the bytes still downloaded every time -- Lighthouse's
  // "reduce unused JavaScript" audit kept flagging ~190KB of Clerk code that never actually ran
  // (57-94% unused across its own chunks), because most homepage visitors just browse and search,
  // never sign in. requestClerkLoad() replaces that: nothing loads Clerk until a real consumer
  // calls it, which now happens at the specific points in Navbar.tsx, AuthModal.tsx,
  // ReportGatingModal.tsx, GuideAdsCheckout.tsx, and VendorSignupForm.tsx that actually need to
  // know real auth state, not on every page view.
  const requestClerkLoad = useCallback(() => {
    setShouldLoadBridge(true);
  }, []);

  // Stable across renders (empty deps) so ClerkStateSync's own effect, which lists this in its
  // dependency array, never re-fires just because this component re-rendered.
  const handleBridgeState = useCallback((next: ClerkBridgeState) => {
    clerkInstanceRef.current = next.clerkInstance;
    setUser(next.user);
    setLoading(next.loading);
  }, []);

  const getTargetRedirectUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return '/';
  };

  const triggerClerkSignIn = (redirectUrl?: string) => {
    const clerkInstance = clerkInstanceRef.current;
    if (clerkInstance) {
      const targetUrl = redirectUrl || getTargetRedirectUrl();
      clerkInstance.openSignIn({
        forceRedirectUrl: targetUrl,
        fallbackRedirectUrl: targetUrl,
        signUpForceRedirectUrl: targetUrl,
        signInForceRedirectUrl: targetUrl,
        afterSignInUrl: targetUrl,
        redirectUrl: targetUrl,
      });
    } else {
      console.warn(CLERK_NOT_READY_WARNING);
    }
  };

  const triggerClerkSignUp = (redirectUrl?: string) => {
    const clerkInstance = clerkInstanceRef.current;
    if (clerkInstance) {
      const targetUrl = redirectUrl || getTargetRedirectUrl();
      clerkInstance.openSignUp({
        forceRedirectUrl: targetUrl,
        fallbackRedirectUrl: targetUrl,
        signUpForceRedirectUrl: targetUrl,
        signUpFallbackRedirectUrl: targetUrl,
        signInForceRedirectUrl: targetUrl,
        afterSignUpUrl: targetUrl,
        redirectUrl: targetUrl,
      });
    } else {
      console.warn(CLERK_NOT_READY_WARNING);
    }
  };

  // clerkInstance.session is the active Session object once signed in (same instance
  // triggerClerkSignIn/logout already pull off the ref) -- its own getToken() fetches (and
  // transparently refreshes) a short-lived JWT. No session yet, or Clerk hasn't loaded, both just
  // resolve to null rather than throwing -- callers treat "no token" as "not signed in."
  const getToken = async (): Promise<string | null> => {
    const clerkInstance = clerkInstanceRef.current;
    if (!clerkInstance?.session) return null;
    try {
      return await clerkInstance.session.getToken();
    } catch {
      return null;
    }
  };

  const logout = async () => {
    const clerkInstance = clerkInstanceRef.current;
    setLoading(true);
    try {
      if (clerkInstance) {
        await clerkInstance.signOut();
      }
      localStorage.removeItem('br_current_user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, isClerkActive, triggerClerkSignIn, triggerClerkSignUp, getToken, requestClerkLoad }}>
      {children}
      {isClerkActive && shouldLoadBridge && (
        <Suspense fallback={null}>
          <ClerkAuthBridge publishableKey={clerkPublishableKey} onStateChange={handleBridgeState} />
        </Suspense>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
