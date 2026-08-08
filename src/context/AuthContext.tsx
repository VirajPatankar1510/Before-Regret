import React, { createContext, useContext, useState, useEffect } from 'react';
import { ClerkProvider, useUser, useClerk } from '@clerk/clerk-react';

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

// Internal provider implementing auth logic and Clerk hook synchronization
const AuthContextImplProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const clerkPublishableKey = getClerkPublishableKey();
  const isClerkActive = !!clerkPublishableKey;

  // Conditionally hook into Clerk if key is available
  let clerkUser: any = null;
  let isClerkLoaded = false;
  let isClerkSignedIn = false;
  let clerkInstance: any = null;

  if (isClerkActive) {
    try {
      const clerkData = useUser();
      clerkUser = clerkData.user;
      isClerkLoaded = clerkData.isLoaded;
      isClerkSignedIn = clerkData.isSignedIn ?? false;
      clerkInstance = useClerk();
    } catch (err) {
      console.warn("Clerk hooks called outside ClerkProvider scope:", err);
    }
  }

  // Sync state from Clerk -- Clerk is the sole source of truth for who's signed in. No local
  // session is ever created independently of it, so there's nothing to "restore" from
  // localStorage on its own; br_current_user is only ever a cache of what Clerk already reported.
  useEffect(() => {
    if (!isClerkActive) {
      // Missing/invalid publishable key -- a real misconfiguration, not a state to fall back
      // from. Nobody is signed in until it's fixed.
      setUser(null);
      setLoading(false);
      return;
    }
    if (!isClerkLoaded) return;

    if (isClerkSignedIn && clerkUser) {
      const mappedUser: User = {
        uid: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || null,
        displayName: clerkUser.fullName || clerkUser.firstName || 'Account',
        photoURL: clerkUser.imageUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(clerkUser.id)}`
      };
      setUser(mappedUser);
      localStorage.setItem('br_current_user', JSON.stringify(mappedUser));
      setLoading(false);
    } else {
      setUser(null);
      localStorage.removeItem('br_current_user');
      setLoading(false);
    }
  }, [isClerkActive, isClerkLoaded, isClerkSignedIn, clerkUser]);

  const triggerClerkSignIn = (redirectUrl?: string) => {
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
      console.warn("Clerk instance is not initialized or Clerk key is missing.");
    }
  };

  const triggerClerkSignUp = (redirectUrl?: string) => {
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
      console.warn("Clerk instance is not initialized or Clerk key is missing.");
    }
  };

  const getTargetRedirectUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return '/';
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (isClerkActive && clerkInstance) {
        await clerkInstance.signOut();
      }
      localStorage.removeItem('br_current_user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      logout,
      isClerkActive,
      triggerClerkSignIn,
      triggerClerkSignUp
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Main Export wraps children in ClerkProvider only if Publishable Key is specified
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const clerkPublishableKey = getClerkPublishableKey();

  if (clerkPublishableKey) {
    return (
      <ClerkProvider publishableKey={clerkPublishableKey}>
        <AuthContextImplProvider>
          {children}
        </AuthContextImplProvider>
      </ClerkProvider>
    );
  }

  return (
    <AuthContextImplProvider>
      {children}
    </AuthContextImplProvider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
