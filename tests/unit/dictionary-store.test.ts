import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    clearDictionaryStore,
    isDictionaryStoreSupported,
    readStoredChunk,
    readStoredManifest,
    unpackVocabTuples,
    writeStoredChunk,
    writeStoredManifest,
    type StaticDictManifest
} from '@/services/dictionary-store.service';
import {
    clearSheetsCache,
    fetchDictionaryData,
    fetchSheetValues,
    syncStaticCorpusDelta
} from '@/services/sheets.service';
import { eventBus } from '@/utils/event-bus';

function installMockLocalStorage() {
    const store = new Map<string, string>();
    const mockStorage: Storage = {
        get length() {
            return store.size;
        },
        clear: () => {
            store.clear();
        },
        getItem: (key: string) => store.get(key) ?? null,
        key: (index: number) => Array.from(store.keys())[index] ?? null,
        removeItem: (key: string) => {
            store.delete(key);
        },
        setItem: (key: string, value: string) => {
            store.set(key, String(value));
        }
    };
    vi.stubGlobal('localStorage', mockStorage);
    return mockStorage;
}

function installMockIndexedDb() {
    const stores = new Map<string, Map<string, unknown>>();

    const makeRequest = <T>(executor: () => T) => {
        const req: {
            result?: T;
            error?: Error | null;
            onsuccess: ((ev: unknown) => void) | null;
            onerror: ((ev: unknown) => void) | null;
            onupgradeneeded?: ((ev: unknown) => void) | null;
        } = {
            result: undefined,
            error: null,
            onsuccess: null,
            onerror: null
        };
        queueMicrotask(() => {
            try {
                req.result = executor();
                req.onsuccess?.({});
            } catch (err) {
                req.error = err instanceof Error ? err : new Error(String(err));
                req.onerror?.({});
            }
        });
        return req;
    };

    const dbApi = {
        objectStoreNames: {
            contains: (name: string) => stores.has(name)
        },
        createObjectStore: (name: string) => {
            if (!stores.has(name)) {
                stores.set(name, new Map());
            }
            return {};
        },
        transaction: (storeNames: string | string[]) => {
            const names = Array.isArray(storeNames) ? storeNames : [storeNames];
            const tx: {
                oncomplete: ((ev: unknown) => void) | null;
                onerror: ((ev: unknown) => void) | null;
                objectStore: (name: string) => {
                    get: (key: string) => ReturnType<typeof makeRequest>;
                    put: (value: unknown, key: string) => void;
                    clear: () => void;
                };
            } = {
                oncomplete: null,
                onerror: null,
                objectStore: (name: string) => {
                    if (!stores.has(name) && names.includes(name)) {
                        stores.set(name, new Map());
                    }
                    const map = stores.get(name)!;
                    return {
                        get: (key: string) => makeRequest(() => map.get(key)),
                        put: (value: unknown, key: string) => {
                            map.set(key, value);
                            queueMicrotask(() => tx.oncomplete?.({}));
                        },
                        clear: () => {
                            map.clear();
                            queueMicrotask(() => tx.oncomplete?.({}));
                        }
                    };
                }
            };
            return tx;
        },
        close: () => {}
    };

    const mockIndexedDb = {
        open: () => {
            const openReq: {
                result: typeof dbApi;
                error: Error | null;
                onupgradeneeded: ((ev: unknown) => void) | null;
                onsuccess: ((ev: unknown) => void) | null;
                onerror: ((ev: unknown) => void) | null;
            } = {
                result: dbApi,
                error: null,
                onupgradeneeded: null,
                onsuccess: null,
                onerror: null
            };
            queueMicrotask(() => {
                openReq.onupgradeneeded?.({});
                openReq.onsuccess?.({});
            });
            return openReq;
        }
    };

    vi.stubGlobal('indexedDB', mockIndexedDb);
    return stores;
}

function buildManifest(hashes: { words: string; phrases: string }): StaticDictManifest {
    return {
        version: 1,
        generatedAt: '2026-11-26T00:00:00.000Z',
        totalEntries: 2,
        chunks: {
            words: { path: 'words.json', sha256: hashes.words, count: 1, bytes: 20 },
            phrases: { path: 'phrases.json', sha256: hashes.phrases, count: 1, bytes: 24 },
            quiz: { path: 'quiz.json', sha256: 'q1', count: 0, bytes: 2 },
            chat: { path: 'chat.json', sha256: 'c1', count: 0, bytes: 2 }
        }
    };
}

describe('dictionary-store and delta sync', () => {
    beforeEach(() => {
        installMockLocalStorage();
        clearSheetsCache(false);
    });

    afterEach(() => {
        clearSheetsCache(false);
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('unpacks compact tuples and normalizes Unicode NFC', () => {
        const decomposedViet = 'me\u0323'.normalize('NFD');
        const entries = unpackVocabTuples(
            [
                [decomposedViet, 'Kơ-nă', 'Kơ nă', 'drv1'],
                ['bố', 'bă'],
                ['', 'missing']
            ],
            'word'
        );

        expect(entries).toHaveLength(2);
        expect(entries[0]).toEqual({
            viet: 'mẹ',
            ethnic: 'Kơ-nă',
            pronunciation: 'Kơ nă',
            driveId: 'drv1',
            kind: 'word'
        });
        expect(entries[1]).toEqual({
            viet: 'bố',
            ethnic: 'bă',
            kind: 'word'
        });
    });

    it('degrades gracefully when indexedDB is unavailable', async () => {
        vi.stubGlobal('indexedDB', undefined);
        expect(isDictionaryStoreSupported()).toBe(false);
        expect(await readStoredManifest()).toBeNull();
        expect(await readStoredChunk('words')).toBeNull();
        expect(await writeStoredChunk('words', [['ăn', 'ka']], 'h1')).toBe(false);
        expect(await writeStoredManifest(buildManifest({ words: 'w1', phrases: 'p1' }))).toBe(false);
        expect(await clearDictionaryStore()).toBe(false);
    });

    it('stores manifest and chunks in IndexedDB and performs SHA-256 delta sync', async () => {
        installMockIndexedDb();

        const manifestV1 = buildManifest({ words: 'w1', phrases: 'p1' });
        const manifestV2 = buildManifest({ words: 'w2', phrases: 'p1' });

        let activeManifest = manifestV1;
        let activeWords = [['ăn', 'ka']];
        const activePhrases = [['uống nước suối', 'ngă dak đe']];
        const fetchedUrls: string[] = [];

        vi.stubGlobal(
            'fetch',
            vi.fn(async (input: RequestInfo | URL) => {
                const url = String(input);
                fetchedUrls.push(url);
                if (url.endsWith('/dict-manifest.json')) {
                    return new Response(JSON.stringify(activeManifest), { status: 200 });
                }
                if (url.includes('/words.json')) {
                    return new Response(JSON.stringify(activeWords), { status: 200 });
                }
                if (url.includes('/phrases.json')) {
                    return new Response(JSON.stringify(activePhrases), { status: 200 });
                }
                return new Response('[]', { status: 200 });
            })
        );

        const coldEntries = await fetchDictionaryData();
        expect(coldEntries).toHaveLength(2);
        expect(fetchedUrls.some((u) => u.includes('/words.json?v=w1'))).toBe(true);
        expect(fetchedUrls.some((u) => u.includes('/phrases.json?v=p1'))).toBe(true);

        clearSheetsCache(false);
        fetchedUrls.length = 0;

        activeManifest = manifestV2;
        activeWords = [
            ['ăn', 'ka'],
            ['cơm', 'piăng']
        ];

        const updatedEvents: number[] = [];
        const off = eventBus.on('dictionary:updated', (entries) => {
            if (Array.isArray(entries)) {
                updatedEvents.push(entries.length);
            }
        });

        const warmEntries = await fetchDictionaryData();
        expect(warmEntries).toHaveLength(2);

        const changed = await syncStaticCorpusDelta();
        off();

        expect(changed).toBe(true);
        expect(updatedEvents).toEqual([3]);
        expect(fetchedUrls.some((u) => u.includes('/words.json?v=w2'))).toBe(true);
        expect(fetchedUrls.some((u) => u.includes('/phrases.json'))).toBe(false);

        fetchedUrls.length = 0;
        const unchanged = await syncStaticCorpusDelta();
        expect(unchanged).toBe(false);
        expect(fetchedUrls).toHaveLength(1);
        expect(fetchedUrls[0].endsWith('/dict-manifest.json')).toBe(true);
    });

    it('skips oversized localStorage sheet cache while persisting small ranges', async () => {
        const mockStorage = installMockLocalStorage();
        const bigRows = Array.from({ length: 1500 }, (_, i) => [
            `từ ${i} `.repeat(8),
            `nghĩa ${i} `.repeat(8)
        ]);
        const smallRows = [['Xin chào', 'Hơtô']];

        vi.stubGlobal(
            'fetch',
            vi.fn(async (input: RequestInfo | URL) => {
                const url = String(input);
                if (url.includes('Data_Chat')) {
                    return new Response(JSON.stringify({ values: smallRows }), { status: 200 });
                }
                return new Response(JSON.stringify({ values: bigRows }), { status: 200 });
            })
        );

        const bigResult = await fetchSheetValues({ range: 'Tu_Dien!A2:F', apiKey: 'k' });
        expect(bigResult).toHaveLength(1500);
        expect(mockStorage.length).toBe(0);

        const smallResult = await fetchSheetValues({ range: 'Data_Chat!A2:B', apiKey: 'k' });
        expect(smallResult).toEqual(smallRows);
        expect(mockStorage.length).toBe(1);
    });
});
