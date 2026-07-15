import { db, app } from "./firebase";
import { doc, setDoc, deleteDoc, getDoc, collection, getDocs } from "firebase/firestore";

// Public VAPID Key for Firebase Cloud Messaging
// Users can configure this in their .env/Vite environment, otherwise we use a fallback demo key
const VAPID_KEY = (import.meta as any).env?.VITE_FIREBASE_VAPID_KEY || "BPEg3-G6qK251rLp9rA_D3hZ7FvR6Uj9k-w_z1W0Kj-7x_5G7Z7h8G-Yk1v2D8H9i0J_9K8L7M6N5O4P3Q2R1S0";

export interface PushTokenInfo {
  token: string;
  userId: string;
  updatedAt: string;
  userAgent: string;
  deviceType: "desktop" | "mobile";
}

/**
 * Check if the browser supports notifications and FCM
 */
export async function isPushSupported(): Promise<boolean> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("Notification" in window)) {
    return false;
  }
  try {
    const { isSupported } = await import("firebase/messaging");
    return await isSupported();
  } catch (e) {
    return false;
  }
}

/**
 * Requests user notification permission and registers/returns FCM token
 */
export async function requestAndSavePushToken(userId: string): Promise<string | null> {
  if (!(await isPushSupported())) {
    console.warn("Push notifications are not supported in this environment/browser.");
    return null;
  }

  try {
    // 1. Request user permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Push notification permission was denied by the user.");
      return null;
    }

    // 2. Load messaging module dynamically
    const { getMessaging, getToken } = await import("firebase/messaging");
    const messaging = getMessaging(app);

    // Register our Service Worker explicitly
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
      scope: "/",
    });

    // 3. Get FCM Token
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      // 4. Save the token to Firestore
      const tokenRef = doc(db, "fcm_tokens", token);
      const tokenData: PushTokenInfo = {
        token,
        userId,
        updatedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
        deviceType: /Mobi|Android|iPhone/i.test(navigator.userAgent) ? "mobile" : "desktop",
      };

      await setDoc(tokenRef, tokenData, { merge: true });
      console.log("FCM Token successfully retrieved and saved to Firestore:", token);
      
      // Also save a reference inside the user's document for convenience
      const userRef = doc(db, "users", userId);
      await setDoc(userRef, { pushToken: token, lastUpdated: new Date().toISOString() }, { merge: true });
      
      return token;
    } else {
      console.warn("No FCM token returned from Firebase.");
      return null;
    }
  } catch (error) {
    console.error("Error during requestAndSavePushToken:", error);
    return null;
  }
}

/**
 * Removes saved token from Firestore on logout/opt-out
 */
export async function removePushToken(token: string): Promise<void> {
  try {
    const tokenRef = doc(db, "fcm_tokens", token);
    await deleteDoc(tokenRef);
    console.log("FCM Token removed successfully from Firestore.");
  } catch (error) {
    console.error("Error removing FCM token:", error);
  }
}

/**
 * Listen for foreground push notifications when the app is active
 */
export async function listenToForegroundNotifications(onMessageReceived: (payload: any) => void): Promise<() => void> {
  if (!(await isPushSupported())) {
    return () => {};
  }

  try {
    const { getMessaging, onMessage } = await import("firebase/messaging");
    const messaging = getMessaging(app);

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("Foreground message received:", payload);
      onMessageReceived(payload);
    });

    return unsubscribe;
  } catch (error) {
    console.error("Error listening to foreground messages:", error);
    return () => {};
  }
}

/**
 * Triggers a test push notification by sending a request to our full-stack server
 */
export async function triggerTestPushNotification(
  userId: string,
  title: string,
  body: string,
  clickAction: string = "/"
): Promise<boolean> {
  try {
    // 1. Fetch user's registered FCM token from Firestore
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    let token = "";
    
    if (userSnap.exists()) {
      token = userSnap.data().pushToken || "";
    }

    if (!token) {
      // Look up in the fcm_tokens collection as fallback
      const q = collection(db, "fcm_tokens");
      const snap = await getDocs(q);
      const matched = snap.docs.find(d => d.data().userId === userId);
      if (matched) {
        token = matched.data().token;
      }
    }

    // 2. Call our full-stack API endpoint
    const response = await fetch("/api/notifications/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        userId,
        title,
        body,
        clickAction,
      }),
    });

    const data = await response.json();
    if (response.ok && data.success) {
      console.log("Test notification triggered successfully!");
      return true;
    } else {
      console.warn("Backend notification failed. Falling back to local browser notification.", data);
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        new Notification(title, {
          body: `${body} (Local Preview Simulation)`,
          icon: "/favicon.svg",
        });
        return true;
      }
      return false;
    }
  } catch (error) {
    console.error("Error triggering test notification:", error);
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body: `${body} (Local Fallback)`,
        icon: "/favicon.svg",
      });
      return true;
    }
    return false;
  }
}
