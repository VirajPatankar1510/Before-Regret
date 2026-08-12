import React, { createContext, useContext, useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
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

  // Starting the Clerk chunk download is deferred to idle time, same reasoning as the Google Tag
  // Manager deferral in index.html -- ClerkProvider previously mounted unconditionally at app
  // root, so its ~296KB downloaded on every single page view, homepage included, regardless of
  // whether that visitor was ever going to sign in.
  useEffect(() => {
    if (!isClerkActive) return;
    const trigger = () => setShouldLoadBridge(true);
    const win = window as any;
    if (typeof win.requestIdleCallback === 'function') {
      const id = win.requestIdleCallback(trigger, { timeout: 4000 });
      return () => win.cancelIdleCallback?.(id);
    }
    window.addEventListener('load', trigger);
    return () => window.removeEventListener('load', trigger);
  }, [isClerkActive]);

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
    <AuthContext.Provider value={{ user, loading, logout, isClerkActive, triggerClerkSignIn, triggerClerkSignUp }}>
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
