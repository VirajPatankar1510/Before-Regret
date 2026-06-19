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
  deleteDoc
} from "firebase/firestore";
import { Story, StoryComment, UserProfile } from "../types";

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
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Dynamic Stories
export async function saveStoryToFirestore(story: Story): Promise<void> {
  const pathForWrite = `stories/${story.id}`;
  try {
    const storyRef = doc(db, "stories", story.id);
    await setDoc(storyRef, story);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
  }
}

export async function fetchStoriesFromFirestore(): Promise<Story[]> {
  const pathForGetDocs = "stories";
  try {
    const storiesCol = collection(db, "stories");
    const q = query(storiesCol, orderBy("dateAdded", "desc"));
    const snapshot = await getDocs(q);
    const stories: Story[] = [];
    snapshot.forEach((snapshotDoc) => {
      stories.push(snapshotDoc.data() as Story);
    });
    return stories;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, pathForGetDocs);
  }
}

export async function deleteStoryFromFirestore(storyId: string): Promise<void> {
  const pathForDelete = `stories/${storyId}`;
  try {
    const storyRef = doc(db, "stories", storyId);
    await deleteDoc(storyRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, pathForDelete);
  }
}

// Comments / Responses
export async function saveCommentToFirestore(comment: StoryComment): Promise<void> {
  const pathForWrite = `comments/${comment.id}`;
  try {
    const commentRef = doc(db, "comments", comment.id);
    await setDoc(commentRef, comment);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
  }
}

export async function fetchCommentsFromFirestore(storyId?: string): Promise<StoryComment[]> {
  const pathForGetDocs = "comments";
  try {
    const commentsCol = collection(db, "comments");
    let q = query(commentsCol, orderBy("dateAdded", "asc"));
    if (storyId) {
      q = query(commentsCol, where("storyId", "==", storyId), orderBy("dateAdded", "asc"));
    }
    const snapshot = await getDocs(q);
    const comments: StoryComment[] = [];
    snapshot.forEach((snapshotDoc) => {
      comments.push(snapshotDoc.data() as StoryComment);
    });
    return comments;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, pathForGetDocs);
  }
}

// User Profiles
export async function saveUserProfileToFirestore(uid: string, profile: UserProfile): Promise<void> {
  const pathForWrite = `users/${uid}`;
  try {
    const profileRef = doc(db, "users", uid);
    await setDoc(profileRef, profile);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
  }
}

export async function fetchUserProfileFromFirestore(uid: string): Promise<UserProfile | null> {
  const pathForGetDoc = `users/${uid}`;
  try {
    const profileRef = doc(db, "users", uid);
    const snapshot = await getDoc(profileRef);
    if (snapshot.exists()) {
      return snapshot.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, pathForGetDoc);
  }
}
