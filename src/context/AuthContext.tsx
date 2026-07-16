import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth, isFirebaseEnabled } from '../lib/firebase';
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeRole, setActiveRole] = useState<'guest' | 'buyer' | 'expert'>('guest');
  const [expertProfile, setExpertProfile] = useState<ExpertProfile | null>(null);

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
      
      // Fallback to local storage if API is slow/not loaded
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

  // 1. Hook into Firebase onAuthStateChanged if enabled
  useEffect(() => {
    if (isFirebaseEnabled() && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const mappedUser: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(firebaseUser.displayName || firebaseUser.email || 'user')}`
          };
          setUser(mappedUser);
          localStorage.setItem('br_current_user', JSON.stringify(mappedUser));
          await refreshExpertProfile(firebaseUser.uid);
        } else {
          // Only clear if we were using Firebase
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
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Load active session from local storage on mount (Mock fallback mode)
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
  }, []);

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    setLoading(true);
    try {
      if (isFirebaseEnabled() && auth) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(userCredential.user, {
          displayName: name,
          photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`
        });

        const newUser: User = {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: name,
          photoURL: userCredential.user.photoURL
        };

        // Sync with our backend mock database as well if needed
        try {
          await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: newUser.uid, email, displayName: name, photoURL: newUser.photoURL })
          });
        } catch (e) {
          console.warn('Backend sync failed, continuing client auth:', e);
        }

        setUser(newUser);
        localStorage.setItem('br_current_user', JSON.stringify(newUser));
        await refreshExpertProfile(newUser.uid);
        return newUser;
      } else {
        // Fallback mock signup API
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
      }
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      if (isFirebaseEnabled() && auth) {
        const userCredential = await signInWithEmailAndPassword(auth, email, pass);
        const loggedUser: User = {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
          photoURL: userCredential.user.photoURL
        };
        setUser(loggedUser);
        localStorage.setItem('br_current_user', JSON.stringify(loggedUser));
        await refreshExpertProfile(loggedUser.uid);
        return loggedUser;
      } else {
        // Fallback mock signin API
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
      }
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      if (isFirebaseEnabled() && auth) {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        const firebaseUser = userCredential.user;
        const displayName = firebaseUser.displayName || 'Google User';
        const photoURL = firebaseUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(displayName)}`;

        const loggedInUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: displayName,
          photoURL: photoURL
        };

        // Sync with backend mock database to ensure user record exists
        try {
          await fetch('/api/auth/mock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: firebaseUser.uid,
              displayName,
              email: firebaseUser.email || '',
              photoURL
            })
          });
        } catch (e) {
          console.warn('Backend sync failed, continuing:', e);
        }

        setUser(loggedInUser);
        localStorage.setItem('br_current_user', JSON.stringify(loggedInUser));
        await refreshExpertProfile(firebaseUser.uid);
        return loggedInUser;
      } else {
        // Fallback mock login
        const mockName = 'Google User';
        const mockEmail = 'google.user@example.com';
        const mockUid = `mock_google_${Date.now()}`;
        const mockUser = {
          uid: mockUid,
          displayName: mockName,
          email: mockEmail,
          photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(mockName)}`
        };

        const loggedInUser = await loginWithMockUser(mockUser);
        return loggedInUser;
      }
    } finally {
      setLoading(false);
    }
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
      if (isFirebaseEnabled() && auth) {
        await firebaseSignOut(auth);
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
      refreshExpertProfile
    }}>
      {children}
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
