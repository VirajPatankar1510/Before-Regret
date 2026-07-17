const cacheName = 'beforeregret-user-cache';

async function saveUserId(userId) {
  try {
    const cache = await caches.open(cacheName);
    await cache.put('/userid', new Response(userId));
    console.log('[Service Worker] Saved userId to cache:', userId);
  } catch (err) {
    console.error('[Service Worker] Error saving userId:', err);
  }
}

async function getUserId() {
  try {
    const cache = await caches.open(cacheName);
    const response = await cache.match('/userid');
    if (response) {
      const text = await response.text();
      return text.trim();
    }
  } catch (err) {
    console.error('[Service Worker] Error reading userId:', err);
  }
  return null;
}

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activated');
  event.waitUntil(clients.claim());
  startPolling();
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_USER') {
    const userId = event.data.userId;
    if (userId) {
      event.waitUntil(
        saveUserId(userId).then(() => {
          startPolling();
        })
      );
    }
  }
});

let pollInterval = null;

function startPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
  }
  
  console.log('[Service Worker] Starting background notification poll loop...');
  
  pollInterval = setInterval(async () => {
    const userId = await getUserId();
    if (!userId) {
      return;
    }

    try {
      const response = await fetch(`/api/notifications/pending/${userId}`);
      if (!response.ok) return;
      
      const data = await response.json();
      if (data.notifications && data.notifications.length > 0) {
        console.log(`[Service Worker] Fetched ${data.notifications.length} new notification(s)`);
        
        for (const notif of data.notifications) {
          self.registration.showNotification(notif.title, {
            body: notif.body,
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            tag: notif.id,
            renotify: true,
            data: { 
              clickAction: notif.clickAction, 
              id: notif.id, 
              userId: userId 
            }
          });
        }
        
        // Mark these notifications as read on the backend
        const notifIds = data.notifications.map(n => n.id);
        await fetch('/api/notifications/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationIds: notifIds, userId })
        });
      }
    } catch (err) {
      console.error('[Service Worker] Background poll error:', err);
    }
  }, 8000); // Check every 8 seconds for real-time responsiveness when tab is closed
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const clickAction = event.notification.data?.clickAction || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(clickAction) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(clickAction);
      }
    })
  );
});
