const CACHE_NAME = 'contest-reminder-v3';
const urlsToCache = [
    '/',
    '/settings',
    '/icon.png'
];

// Install event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
    );
});

// Activate event
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response && response.status === 200 && response.type === 'basic') {
                    const cloned = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
                }
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});

// ===== PUSH NOTIFICATION HANDLING =====

self.addEventListener('push', (event) => {
    if (!event.data) return;

    let data;
    try {
        data = event.data.json();
    } catch (e) {
        data = {
            title: 'Contest Reminder',
            body: event.data.text(),
            icon: '/icons/icon-192x192.svg'
        };
    }

    const options = {
        body: data.body || '',
        icon: data.icon || '/icons/icon-192x192.svg',
        badge: data.badge || '/icons/icon-192x192.svg',
        vibrate: [100, 50, 100, 50, 200],
        data: data.data || { url: '/' },
        tag: data.type || 'default',
        renotify: true,
        requireInteraction: data.type === 'reminder',
        actions: []
    };

    // Customize actions based on notification type
    if (data.type === 'reminder' && data.data?.url) {
        options.actions = [
            { action: 'open_contest', title: '🚀 Join Now' },
            { action: 'dismiss', title: 'Dismiss' }
        ];
    } else if (data.type === 'daily_digest') {
        options.actions = [
            { action: 'open_app', title: '📋 View Contests' },
            { action: 'dismiss', title: 'Dismiss' }
        ];
    }

    event.waitUntil(
        self.registration.showNotification(data.title || 'Contest Reminder', options)
    );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    let url = '/';

    if (event.action === 'open_contest' && event.notification.data?.url) {
        url = event.notification.data.url;
    } else if (event.action === 'open_app') {
        url = '/';
    } else if (event.action === 'dismiss') {
        return;
    } else if (event.notification.data?.url) {
        url = event.notification.data.url;
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // If the app is already open, focus it
            for (const client of windowClients) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(url);
                    return client.focus();
                }
            }
            // Otherwise open a new window
            return clients.openWindow(url);
        })
    );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
    // Analytics could go here
    console.log('[SW] Notification closed:', event.notification.tag);
});
