export interface PushTokenInfo {
  token: string;
  userId: string;
  updatedAt: string;
  userAgent: string;
  deviceType: "desktop" | "mobile";
}

/**
 * Check if the browser supports notifications
 */
export async function isPushSupported(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  return true;
}

/**
 * Registers the Service Worker and sends the active user's ID so that 
 * background polling can run even if the browser tab is completely closed.
 */
export async function registerServiceWorker(userId: string): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    console.log("[Service Worker] Registered successfully with scope:", registration.scope);

    const sendUserMessage = () => {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: "SET_USER",
          userId: userId
        });
        console.log("[Service Worker] Synchronized user ID with background thread:", userId);
      }
    };

    if (navigator.serviceWorker.controller) {
      sendUserMessage();
    } else {
      // Wait for service worker controller to claim the page
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        sendUserMessage();
      });
    }
  } catch (err) {
    console.error("[Service Worker] Registration failed:", err);
  }
}

/**
 * Requests user notification permission and registers/returns a local mock FCM token
 */
export async function requestAndSavePushToken(userId: string): Promise<string | null> {
  const isSupported = await isPushSupported();
  
  const token = `mock_token_${userId}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem(`br_push_token_${userId}`, token);

  if (!isSupported) {
    console.warn("Push notifications are not supported in this environment/browser. Initializing simulated token.");
    return token;
  }

  try {
    let permission: NotificationPermission = "default";
    try {
      permission = await Notification.requestPermission();
    } catch (e) {
      console.warn("Notification.requestPermission failed (likely due to iframe sandbox), using simulated granted state:", e);
      permission = "granted"; // Fallback to simulated granted state for preview
    }

    if (permission !== "granted") {
      console.warn("Push notification permission was not granted. Using simulated granted state for preview.");
    }

    console.log("Registered mock push token successfully:", token);
    
    // Register Service Worker for background operation when permission is granted
    try {
      await registerServiceWorker(userId);
    } catch (swErr) {
      console.warn("Service Worker registration skipped or failed in this environment:", swErr);
    }
    
    return token;
  } catch (error) {
    console.error("Error during requestAndSavePushToken:", error);
    return token;
  }
}

/**
 * Removes saved token from localStorage on logout/opt-out
 */
export async function removePushToken(token: string): Promise<void> {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("br_push_token_")) {
        const val = localStorage.getItem(key);
        if (val === token) {
          localStorage.removeItem(key);
          break;
        }
      }
    }
    console.log("Mock push token removed successfully.");
  } catch (error) {
    console.error("Error removing push token:", error);
  }
}

/**
 * Listen for foreground push notifications when the app is active
 */
export async function listenToForegroundNotifications(onMessageReceived: (payload: any) => void): Promise<() => void> {
  // In our local mockup, this can be a no-op
  return () => {};
}

/**
 * Triggers a test notification by sending a request to our Express server and raising a local HTML5 alert
 */
export async function triggerTestPushNotification(
  userId: string,
  title: string,
  body: string,
  clickAction: string = "/"
): Promise<boolean> {
  try {
    const token = localStorage.getItem(`br_push_token_${userId}`) || `mock_token_${userId}`;

    // Call our Express endpoint to keep notification logs/activity in sync
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

    if (response.ok) {
      console.log("Backend notification logged successfully.");
    }

    // Always trigger high-fidelity HTML5 Notification as feedback
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        if (Notification.permission === "granted") {
          new Notification(title, {
            body,
            icon: "/favicon.svg",
          });
          return true;
        } else {
          // Fall back to standard alert if permission not explicitly granted yet
          console.info(`Notification title: ${title}. Body: ${body}`);
        }
      } catch (notifyErr) {
        console.warn("Could not display native HTML5 Notification:", notifyErr);
      }
    }
    return true;
  } catch (error) {
    console.error("Error triggering test notification:", error);
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/favicon.svg",
      });
      return true;
    }
    return false;
  }
}
