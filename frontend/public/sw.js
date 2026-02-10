const CACHE_NAME = "contest-reminder-v1";

// Assets to pre-cache on install
const PRECACHE_ASSETS = [
    "/",
    "/manifest.webmanifest",
];

// Install event — pre-cache critical assets
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS);
        })
    );
    // Activate immediately
    self.skipWaiting();
});

// Activate event — clean up old caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    // Take control of all pages immediately
    self.clients.claim();
});

// Fetch event — network-first strategy with cache fallback
self.addEventListener("fetch", (event) => {
    const { request } = event;

    // Skip non-GET requests
    if (request.method !== "GET") return;

    // Skip API requests (they should always be fresh)
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api")) return;

    // Skip Clerk auth requests
    if (url.hostname.includes("clerk")) return;

    // Skip Chrome extension requests
    if (url.protocol === "chrome-extension:") return;

    event.respondWith(
        fetch(request)
            .then((response) => {
                // Clone the response before caching
                const responseClone = response.clone();
                // Only cache successful responses
                if (response.status === 200) {
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Network failed — try to serve from cache
                return caches.match(request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // If the request is a navigation (page load), serve the cached home page
                    if (request.mode === "navigate") {
                        return caches.match("/");
                    }
                    return new Response("Offline", {
                        status: 503,
                        statusText: "Service Unavailable",
                    });
                });
            })
    );
});
