import React, { createContext, useContext, useState, useEffect } from 'react';
import { ClerkProvider, useUser, useClerk } from '@clerk/clerk-react';
import { ExpertProfile } from '../types';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  activeRole: 'guest' | 'buyer' | 'expert';
  setActiveRole: (role: 'guest' | 'buyer' | 'expert') => void;
  expertProfile: ExpertProfile | null;
  setExpertProfile: (profile: ExpertProfile | null) => void;
  userExperts: ExpertProfile[];
  setUserExperts: (profiles: ExpertProfile[]) => void;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<User | null>;
  signInWithEmail: (email: string, pass: string) => Promise<User | null>;
  signInWithGoogle: () => Promise<User | null>;
  loginWithMockUser: (mockUserObj: { uid: string; displayName: string; email: string; photoURL?: string }) => Promise<User | null>;
  logout: () => Promise<void>;
  refreshExpertProfile: (uid: string) => Promise<void>;
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
  const [activeRole, setActiveRole] = useState<'guest' | 'buyer' | 'expert'>('guest');
  const [expertProfile, setExpertProfile] = useState<ExpertProfile | null>(null);
  const [userExperts, setUserExperts] = useState<ExpertProfile[]>([]);

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

  const refreshExpertProfile = async (uid: string) => {
    try {
      const res = await fetch('/api/experts');
      if (res.ok) {
        const allExperts = await res.json();
        const matched = allExperts.filter((e: any) => e.userId === uid);
        setUserExperts(matched);
        if (matched.length > 0) {
          setExpertProfile((prev) => {
            if (prev && matched.some((e: any) => e.id === prev.id)) {
              return matched.find((e: any) => e.id === prev.id) || matched[0];
            }
            return matched[0];
          });
          setActiveRole('expert');
          return;
        }
      }
      
      // Fallback local storage lookup
      const expertsRaw = localStorage.getItem('br_experts');
      const allExpertsLocal = expertsRaw ? JSON.parse(expertsRaw) : [];
      const matchedLocal = allExpertsLocal.filter((e: any) => e.userId === uid);
      setUserExperts(matchedLocal);
      if (matchedLocal.length > 0) {
        setExpertProfile((prev) => {
          if (prev && matchedLocal.some((e: any) => e.id === prev.id)) {
            return matchedLocal.find((e: any) => e.id === prev.id) || matchedLocal[0];
          }
          return matchedLocal[0];
        });
        setActiveRole('expert');
      } else {
        setExpertProfile(null);
        setActiveRole('buyer');
      }
    } catch (err) {
      console.error('Error fetching expert profile:', err);
      setExpertProfile(null);
      setUserExperts([]);
      setActiveRole('buyer');
    }
  };

  // Sync state between Clerk and local session variables
  useEffect(() => {
    if (isClerkActive) {
      if (isClerkLoaded) {
        if (isClerkSignedIn && clerkUser) {
          const mappedUser: User = {
            uid: clerkUser.id,
            email: clerkUser.primaryEmailAddress?.emailAddress || null,
            displayName: clerkUser.fullName || clerkUser.firstName || 'Clerk User',
            photoURL: clerkUser.imageUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(clerkUser.id)}`
          };
          setUser(mappedUser);
          localStorage.setItem('br_current_user', JSON.stringify(mappedUser));
          refreshExpertProfile(clerkUser.id).then(() => {
            setLoading(false);
          });
        } else {
          // If Clerk is signed out, clear any stale non-mock user session
          const storedUser = localStorage.getItem('br_current_user');
          if (storedUser) {
            try {
              const parsed = JSON.parse(storedUser);
              if (parsed.uid && !parsed.uid.startsWith('mock_')) {
                setUser(null);
                setExpertProfile(null);
                setActiveRole('guest');
                localStorage.removeItem('br_current_user');
              }
            } catch (e) {
              // ignore
            }
          }
          setLoading(false);
        }
      }
    } else {
      // Mock Auth Fallback Mode - Restore session from localStorage
      const storedUser = localStorage.getItem('br_current_user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed && parsed.uid) {
            setUser(parsed);
            refreshExpertProfile(parsed.uid);
          }
        } catch (e) {
          // ignore
        }
      }
      setLoading(false);
    }
  }, [isClerkActive, isClerkLoaded, isClerkSignedIn, clerkUser]);

  const triggerClerkSignIn = (redirectUrl?: string) => {
    if (clerkInstance) {
      const targetUrl = redirectUrl || (typeof window !== 'undefined' ? window.location.href : '/');
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
      const targetUrl = redirectUrl || (typeof window !== 'undefined' ? window.location.href : '/');
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
      const path = window.location.pathname;
      const isContributor = path.startsWith('/contributor') || path.startsWith('/become-expert') || path.startsWith('/contributor-registration');
      if (isContributor) {
        return `${window.location.origin}/contributor-registration`;
      }
      return window.location.href;
    }
    return '/';
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    if (isClerkActive) {
      triggerClerkSignUp(getTargetRedirectUrl());
      return null;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass, displayName: name })
      });

      if (!res.ok) {
        const errData = await res.json();
        const error = new Error(errData.error || 'Signup failed.');
        if (errData.error?.includes('email is already in use')) {
          (error as any).code = 'auth/email-already-in-use';
        }
        throw error;
      }

      const { user: newUser } = await res.json();
      localStorage.setItem('br_current_user', JSON.stringify(newUser));
      setUser(newUser);
      await refreshExpertProfile(newUser.uid);
      return newUser;
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    if (isClerkActive) {
      triggerClerkSignIn(getTargetRedirectUrl());
      return null;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });

      if (!res.ok) {
        const errData = await res.json();
        const error = new Error(errData.error || 'Incorrect email or password.');
        (error as any).code = 'auth/invalid-credential';
        throw error;
      }

      const { user: loggedUser } = await res.json();
      localStorage.setItem('br_current_user', JSON.stringify(loggedUser));
      setUser(loggedUser);
      await refreshExpertProfile(loggedUser.uid);
      return loggedUser;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    if (isClerkActive) {
      triggerClerkSignIn(getTargetRedirectUrl());
      return null;
    }

    // Fallback Mock Sign-In
    const mockName = 'Google User';
    const mockEmail = 'google.user@example.com';
    const mockUid = `mock_google_${Date.now()}`;
    const mockUser = {
      uid: mockUid,
      displayName: mockName,
      email: mockEmail,
      photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(mockName)}`
    };

    return loginWithMockUser(mockUser);
  };

  const loginWithMockUser = async (mockUserObj: { uid: string; displayName: string; email: string; photoURL?: string }) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: mockUserObj.uid,
          displayName: mockUserObj.displayName,
          email: mockUserObj.email,
          photoURL: mockUserObj.photoURL || null
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed mock registration');
      }

      const { user: standardUser } = await res.json();
      localStorage.setItem('br_current_user', JSON.stringify(standardUser));
      setUser(standardUser);
      await refreshExpertProfile(standardUser.uid);
      return standardUser;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (isClerkActive && clerkInstance) {
        await clerkInstance.signOut();
      }
      localStorage.removeItem('br_current_user');
      setUser(null);
      setExpertProfile(null);
      setActiveRole('guest');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      activeRole,
      setActiveRole,
      expertProfile,
      setExpertProfile,
      userExperts,
      setUserExperts,
      signUpWithEmail,
      signInWithEmail,
      signInWithGoogle,
      loginWithMockUser,
      logout,
      refreshExpertProfile,
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
