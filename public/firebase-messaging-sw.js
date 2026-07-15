// Import and configure the Firebase SDK
// These scripts are only available within the Service Worker context
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyBNKPD6M35gu6ITDGxva-mkVKEkamsMbJI",
  authDomain: "universal-cogency-hnzsc.firebaseapp.com",
  projectId: "universal-cogency-hnzsc",
  storageBucket: "universal-cogency-hnzsc.firebasestorage.app",
  messagingSenderId: "460841629365",
  appId: "1:460841629365:web:b1169df255e43f168430fc"
});

// Retrieve an instance of Firebase Cloud Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  
  const notificationTitle = payload.notification?.title || 'BeforeRegret Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'New message on BeforeRegret.',
    icon: '/favicon.svg', // Fallback to app favicon
    badge: '/favicon.svg',
    data: payload.data || {},
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click to redirect user to appropriate view
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const targetUrl = event.notification.data?.click_action || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, focus it
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
