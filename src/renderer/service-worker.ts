/**
 * PWA Service Worker (Modern Modular Version)
 * Cleans legacy caches (tudien-10.0.3, tudien-9.1.0) while strictly preserving
 * the 'tudien-audio' cache containing ~40MB of offline audio files.
 */

const CACHE_NAME = 'tudien-modular-v10.0.3';
const AUDIO_CACHE_NAME = 'tudien-audio';
const OFFLINE_URL = './offline.html';

const STATIC_PRECACHE = [
    './',
    './index.html',
    './offline.html',
    './manifest.json',
    './fonts/fontawesome/all.min.css',
    './fonts/jakarta/plus-jakarta-sans-v8-latin-regular.woff2',
    './fonts/jakarta/plus-jakarta-sans-v8-latin-600.woff2',
    './fonts/jakarta/plus-jakarta-sans-v8-latin-700.woff2'
];

interface ExtendableEvent extends Event {
    waitUntil(fn: Promise<unknown>): void;
}

interface FetchEvent extends Event {
    request: Request;
    respondWith(response: Promise<Response> | Response): void;
}

interface SWClients {
    claim(): Promise<void>;
}

// Service worker global scope reference
const sw = globalThis as unknown as {
    skipWaiting(): Promise<void>;
    clients: SWClients;
    location: Location;
    addEventListener(type: string, listener: (event: any) => void): void;
};

sw.addEventListener('install', (event: ExtendableEvent) => {
    sw.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_PRECACHE).catch((err) => {
                console.warn('[SW] Precache partial warning:', err);
            });
        })
    );
});

sw.addEventListener('activate', (event: ExtendableEvent) => {
    const PRESERVED_CACHES = new Set([CACHE_NAME, AUDIO_CACHE_NAME]);

    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (!PRESERVED_CACHES.has(key)) {
                        console.log(`[SW] Evicting legacy cache: ${key}`);
                        return caches.delete(key);
                    }
                    return Promise.resolve(true);
                })
            );
        }).then(() => {
            console.log('[SW] Modular Service Worker activated & claimed clients.');
            return sw.clients.claim();
        })
    );
});

sw.addEventListener('fetch', (event: FetchEvent) => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    // 1. Audio Cache: Cache-First strategy targeting tudien-audio cache
    if (url.pathname.includes('/audio/') || url.pathname.endsWith('.webm')) {
        event.respondWith(
            caches.open(AUDIO_CACHE_NAME).then(async (audioCache) => {
                const cached = await audioCache.match(event.request);
                if (cached) return cached;

                try {
                    const response = await fetch(event.request);
                    if (response.ok) {
                        audioCache.put(event.request, response.clone());
                    }
                    return response;
                } catch {
                    return new Response('', { status: 404, statusText: 'Audio Offline Unavailable' });
                }
            })
        );
        return;
    }

    // 2. Navigation Request: Network-First with cache fallback and offline.html fallback
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(async () => {
                const cachedPage = await caches.match(event.request);
                if (cachedPage) return cachedPage;

                const offlinePage = await caches.match(OFFLINE_URL);
                if (offlinePage) return offlinePage;

                return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
            })
        );
        return;
    }

    // 3. Static Assets: Stale-While-Revalidate
    if (url.origin === sw.location.origin) {
        event.respondWith(
            caches.match(event.request).then(async (cachedResponse) => {
                const fetchPromise = fetch(event.request).then((networkResponse) => {
                    if (networkResponse.ok) {
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
                    }
                    return networkResponse;
                }).catch(() => undefined);

                const response = cachedResponse || (await fetchPromise);
                return response || new Response('', { status: 404 });
            })
        );
    }
});
