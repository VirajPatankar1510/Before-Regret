import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "universal-cogency-hnzsc",
  appId: "1:460841629365:web:b1169df255e43f168430fc",
  apiKey: "AIzaSyBNKPD6M35gu6ITDGxva-mkVKEkamsMbJI",
  authDomain: "universal-cogency-hnzsc.firebaseapp.com",
  storageBucket: "universal-cogency-hnzsc.firebasestorage.app",
  messagingSenderId: "460841629365",
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore. Note that our provisioned databaseId is "ai-studio-8253964b-c896-45ef-848b-790b8f983a8a"
export const db = getFirestore(app, "ai-studio-8253964b-c896-45ef-848b-790b8f983a8a");
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
};
export type { FirebaseUser };
