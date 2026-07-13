import { db, auth } from "./firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs, 
  query, 
  where,
  orderBy,
  deleteDoc,
  increment,
  onSnapshot
} from "firebase/firestore";
import { Neighborhood, ExpertProfile, DirectQuery, Review, Wallet } from "../types";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
    }
  };
  console.error("Firestore operation failure:", errInfo);
  throw new Error(`[BeforeRegret Firestore Error] ${errInfo.error} during ${operationType} on ${path}`);
}

// ---------------------- NEIGHBORHOOD SERVICE ----------------------
export async function getNeighborhood(id: string): Promise<Neighborhood | null> {
  const docRef = doc(db, "neighborhoods", id);
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as Neighborhood;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `neighborhoods/${id}`);
  }
}

export async function listNeighborhoods(): Promise<Neighborhood[]> {
  const colRef = collection(db, "neighborhoods");
  try {
    const snap = await getDocs(colRef);
    return snap.docs.map(d => d.data() as Neighborhood);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "neighborhoods");
  }
}

// ---------------------- EXPERTS SERVICE ----------------------
export async function getExpertProfile(id: string): Promise<ExpertProfile | null> {
  const docRef = doc(db, "experts", id);
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as ExpertProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `experts/${id}`);
  }
}

export async function saveExpertProfile(expert: ExpertProfile): Promise<void> {
  const docRef = doc(db, "experts", expert.id);
  try {
    await setDoc(docRef, expert, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `experts/${expert.id}`);
  }
}

export async function listExpertsForLocality(localityId: string): Promise<ExpertProfile[]> {
  const colRef = collection(db, "experts");
  const q = query(colRef, where("localityId", "==", localityId));
  try {
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as ExpertProfile);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `experts?localityId=${localityId}`);
  }
}

// ---------------------- DIRECT QUERIES ----------------------
export async function createDirectQuery(queryData: DirectQuery): Promise<void> {
  const docRef = doc(db, "queries", queryData.id);
  try {
    await setDoc(docRef, queryData);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `queries/${queryData.id}`);
  }
}

export async function getDirectQuery(id: string): Promise<DirectQuery | null> {
  const docRef = doc(db, "queries", id);
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as DirectQuery;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `queries/${id}`);
  }
}

export function subscribeToDirectQuery(id: string, onUpdate: (q: DirectQuery | null) => void): () => void {
  const docRef = doc(db, "queries", id);
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      onUpdate(snapshot.data() as DirectQuery);
    } else {
      onUpdate(null);
    }
  }, (error) => {
    console.error(`Subscription error for queries/${id}:`, error);
  });
}
