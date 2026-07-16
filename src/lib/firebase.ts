import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: metaEnv.VITE_FIREBASE_APP_ID,
};

// Check if Firebase configuration is provided and valid (not template/placeholder)
const isConfigured =
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== 'beforeregret-xxxxx';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    console.log('[BeforeRegret Firebase] Firebase initialized successfully.');
  } catch (error) {
    console.warn('[BeforeRegret Firebase] Failed to initialize Firebase:', error);
  }
} else {
  console.log('[BeforeRegret Firebase] Using fallback mock storage mode (Firebase env credentials are not configured).');
}

export function isFirebaseEnabled(): boolean {
  return !!(app && auth);
}

export { auth, db };
