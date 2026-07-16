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
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<User | null>;
  signInWithEmail: (email: string, pass: string) => Promise<User | null>;
  signInWithGoogle: () => Promise<User | null>;
  loginWithMockUser: (mockUserObj: { uid: string; displayName: string; email: string; photoURL?: string }) => Promise<User | null>;
  logout: () => Promise<void>;
  refreshExpertProfile: (uid: string) => Promise<void>;
  isClerkActive: boolean;
  triggerClerkSignIn: () => void;
  triggerClerkSignUp: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to check if Clerk Publishable Key is present and configured
export const getClerkPublishableKey = (): string => {
  const rawKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';
  if (!rawKey || rawKey === 'YOUR_CLERK_PUBLISHABLE_KEY' || rawKey.trim() === '' || rawKey.startsWith('YOUR_')) {
    return '';
  }
  // Robust extraction of pk_test_... or pk_live_... to handle accidental multi-variable paste errors gracefully
  const match = rawKey.match(/pk_(test|live)_[a-zA-Z0-9$]+/);
  const keyToUse = match ? match[0] : rawKey;

  // If the key is a live key but we are not on the production domain (beforeregret.com),
  // using it directly will crash the client due to Clerk domain/CORS restrictions.
  // We fall back to the development test key for local/preview testing.
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isProductionDomain = hostname === 'beforeregret.com' || hostname.endsWith('.beforeregret.com');
    if (keyToUse.startsWith('pk_live_') && !isProductionDomain) {
      console.warn("Clerk live key detected on development domain. Falling back to development test key to prevent domain mismatch crash.");
      return 'pk_test_YW11c2luZy1nYXplbGxlLTQ4LmNsZXJrLmFjY291bnRzLmRldiQ';
    }
  }

  return keyToUse;
};

// Internal provider implementing auth logic and Clerk hook synchronization
const AuthContextImplProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeRole, setActiveRole] = useState<'guest' | 'buyer' | 'expert'>('guest');
  const [expertProfile, setExpertProfile] = useState<ExpertProfile | null>(null);

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
        const matched = allExperts.find((e: any) => e.userId === uid);
        if (matched) {
          setExpertProfile(matched);
          setActiveRole('expert');
          return;
        }
      }
      
      // Fallback local storage lookup
      const expertsRaw = localStorage.getItem('br_experts');
      const allExpertsLocal = expertsRaw ? JSON.parse(expertsRaw) : [];
      const matchedLocal = allExpertsLocal.find((e: any) => e.userId === uid);
      if (matchedLocal) {
        setExpertProfile(matchedLocal);
        setActiveRole('expert');
      } else {
        setExpertProfile(null);
        setActiveRole('buyer');
      }
    } catch (err) {
      console.error('Error fetching expert profile:', err);
      setExpertProfile(null);
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
      // Mock Auth Fallback Mode
      const savedUser = localStorage.getItem('br_current_user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
          refreshExpertProfile(parsed.uid).then(() => {
            setLoading(false);
          });
        } catch (e) {
          localStorage.removeItem('br_current_user');
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
  }, [isClerkActive, isClerkLoaded, isClerkSignedIn, clerkUser]);

  const triggerClerkSignIn = () => {
    if (clerkInstance) {
      clerkInstance.openSignIn();
    } else {
      console.warn("Clerk instance is not initialized or Clerk key is missing.");
    }
  };

  const triggerClerkSignUp = () => {
    if (clerkInstance) {
      clerkInstance.openSignUp();
    } else {
      console.warn("Clerk instance is not initialized or Clerk key is missing.");
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    if (isClerkActive) {
      triggerClerkSignUp();
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
      triggerClerkSignIn();
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
      triggerClerkSignIn();
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
