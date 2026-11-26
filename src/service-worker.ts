const CACHE_NAME = 'tudien-modular-v10.0.4';
const AUDIO_CACHE_NAME = 'tudien-audio';
const STT_RUNTIME_CACHE_NAME = 'tudien-stt-runtime';
const OFFLINE_URL = './offline.html';

const STATIC_PRECACHE = [
    './',
    './index.html',
    './offline.html',
    './manifest.json',
    './theme-init.js',
    './icons/icon-192x192.png',
    './fonts/be-vietnam-pro/be-vietnam-pro.css',
    './fonts/be-vietnam-pro/be-vietnam-pro-400.woff2',
    './fonts/be-vietnam-pro/be-vietnam-pro-500.woff2',
    './fonts/be-vietnam-pro/be-vietnam-pro-600.woff2',
    './fonts/be-vietnam-pro/be-vietnam-pro-700.woff2'
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

const sw = globalThis as unknown as {
    skipWaiting(): Promise<void>;
    clients: SWClients;
    location: Location;
    addEventListener(type: string, listener: (event: any) => void): void;
};

sw.addEventListener('install', (event: ExtendableEvent) => {
    sw.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) =>
            Promise.allSettled(STATIC_PRECACHE.map((url) => cache.add(url)))
        )
    );
});

sw.addEventListener('activate', (event: ExtendableEvent) => {
    const PRESERVED_CACHES = new Set([CACHE_NAME, AUDIO_CACHE_NAME, STT_RUNTIME_CACHE_NAME]);

    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (!PRESERVED_CACHES.has(key)) {
                        return caches.delete(key);
                    }
                    return Promise.resolve(true);
                })
            );
        }).then(() => sw.clients.claim())
    );
});

sw.addEventListener('fetch', (event: FetchEvent) => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    if (
        url.origin === 'https://cdn.jsdelivr.net' &&
        (url.pathname.includes('transformers') || url.pathname.includes('onnxruntime-web'))
    ) {
        event.respondWith(
            caches.open(STT_RUNTIME_CACHE_NAME).then(async (sttCache) => {
                const cached = await sttCache.match(event.request);
                if (cached) return cached;

                try {
                    const response = await fetch(event.request);
                    if (response.ok) {
                        sttCache.put(event.request, response.clone());
                    }
                    return response;
                } catch {
                    return new Response('', { status: 503, statusText: 'STT Runtime Offline Unavailable' });
                }
            })
        );
        return;
    }

    if (url.pathname.endsWith('/audio-pack.bin') || url.pathname.endsWith('/audio-pack.index.json')) {
        return;
    }

    if (url.pathname.endsWith('/dict-manifest.json')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response && response.ok && url.origin === self.location.origin) {
                        const copy = response.clone();
                        void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                    }
                    return response;
                })
                .catch(() =>
                    caches.match(event.request).then(
                        (cached) =>
                            cached ||
                            new Response(JSON.stringify({ error: 'Offline' }), {
                                status: 503,
                                headers: { 'Content-Type': 'application/json' }
                            })
                    )
                )
        );
        return;
    }

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

    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    if (networkResponse.ok) {
                        const copy = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                    }
                    return networkResponse;
                })
                .catch(async () => {
                    const cachedPage = await caches.match(event.request);
                    if (cachedPage) return cachedPage;

                    const offlinePage = await caches.match(OFFLINE_URL);
                    if (offlinePage) return offlinePage;

                    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
                })
        );
        return;
    }

    if (url.origin === sw.location.origin) {
        event.respondWith(
            caches.match(event.request).then(async (cachedResponse) => {
                const fetchPromise = fetch(event.request).then((networkResponse) => {
                    if (networkResponse.ok) {
                        const copy = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                    }
                    return networkResponse;
                }).catch(() => undefined);

                const response = cachedResponse || (await fetchPromise);
                return response || new Response('', { status: 404 });
            })
        );
    }
});
