import React, { useEffect } from 'react';
import { ClerkProvider, useUser, useClerk } from '@clerk/clerk-react';
import type { User } from './AuthContext';

export interface ClerkBridgeState {
  user: User | null;
  loading: boolean;
  clerkInstance: any;
}

interface ClerkAuthBridgeProps {
  publishableKey: string;
  onStateChange: (state: ClerkBridgeState) => void;
}

// Every direct dependency on @clerk/clerk-react lives in this one file specifically so Vite
// code-splits it into its own chunk (~296KB across Clerk's own internal sub-chunks) -- AuthContext
// imports it via React.lazy(), only downloaded once the browser is idle (see the useEffect there).
// Previously ClerkProvider wrapped the entire app unconditionally at root, so every single page
// view -- including anonymous homepage visitors who never sign in -- paid for the full SDK before
// first paint.
//
// Renders no visible UI (ClerkStateSync returns null). Its only job is reporting real auth state
// up to AuthProvider's plain React state via onStateChange, which flows back down to the rest of
// the app through the SAME stable AuthContext.Provider that's been wrapping `children` since first
// paint. `children` are never inside this component's subtree -- this mounts as a sibling, not a
// wrapper -- so nothing here can ever cause the rest of the app to remount or lose local state
// (e.g. in-progress search input) when Clerk finishes loading and reports real auth state.
function ClerkStateSync({ onStateChange }: { onStateChange: ClerkAuthBridgeProps['onStateChange'] }) {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const clerkInstance = useClerk();

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn && clerkUser) {
      const mappedUser: User = {
        uid: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || null,
        displayName: clerkUser.fullName || clerkUser.firstName || 'Account',
        photoURL: clerkUser.imageUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(clerkUser.id)}`,
      };
      localStorage.setItem('br_current_user', JSON.stringify(mappedUser));
      onStateChange({ user: mappedUser, loading: false, clerkInstance });
    } else {
      localStorage.removeItem('br_current_user');
      onStateChange({ user: null, loading: false, clerkInstance });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, clerkUser, clerkInstance]);

  return null;
}

export default function ClerkAuthBridge({ publishableKey, onStateChange }: ClerkAuthBridgeProps) {
  return (
    <ClerkProvider publishableKey={publishableKey}>
      <ClerkStateSync onStateChange={onStateChange} />
    </ClerkProvider>
  );
}
