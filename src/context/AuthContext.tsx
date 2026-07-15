import React, { createContext, useContext, useState, useEffect } from 'react';
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
  loginWithMockUser: (mockUserObj: { uid: string; displayName: string; email: string; photoURL?: string }) => Promise<User | null>;
  logout: () => Promise<void>;
  refreshExpertProfile: (uid: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultRegisteredUsers = [
  {
    uid: 'mock_buyer_amit',
    displayName: 'Amit Kumar',
    email: 'amit.buyer@beforeregret.com',
    password: 'password123',
    photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100'
  },
  {
    uid: 'user_rahul',
    displayName: 'Rahul K.',
    email: 'rahul.expert@beforeregret.com',
    password: 'password123',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'
  }
];

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

  useEffect(() => {
    // Load active session from local storage on mount
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
  }, []);

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
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
