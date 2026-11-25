import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    enqueueContribution,
    getOutboxCount,
    listOutboxItems,
    removeOutboxItem,
    flushContributionOutbox
} from '@/services/contribution-outbox.service';
import type { ContributionItem } from '@/services/offline-sync.service';
import { eventBus } from '@/utils/event-bus';

interface FakeStore {
    keyPath: string;
    records: Map<string, unknown>;
}

function createInMemoryIndexedDb(): IDBFactory {
    const databases = new Map<string, Map<string, FakeStore>>();

    const open = (dbName: string): IDBOpenDBRequest => {
        const req = {
            result: null as unknown as IDBDatabase,
            error: null as DOMException | null,
            onsuccess: null as ((ev: Event) => void) | null,
            onerror: null as ((ev: Event) => void) | null,
            onupgradeneeded: null as ((ev: IDBVersionChangeEvent) => void) | null,
            onblocked: null as ((ev: Event) => void) | null
        } as unknown as IDBOpenDBRequest;

        const isNewDb = !databases.has(dbName);
        if (isNewDb) {
            databases.set(dbName, new Map<string, FakeStore>());
        }
        const stores = databases.get(dbName)!;

        const db = {
            name: dbName,
            objectStoreNames: {
                contains: (storeName: string) => stores.has(storeName)
            } as unknown as DOMStringList,
            createObjectStore: (storeName: string, options?: IDBObjectStoreParameters) => {
                const keyPath = typeof options?.keyPath === 'string' ? options.keyPath : 'id';
                stores.set(storeName, { keyPath, records: new Map<string, unknown>() });
                return {} as IDBObjectStore;
            },
            close: () => {},
            transaction: (storeName: string) => {
                const txState = {
                    aborted: false,
                    pendingOps: 0,
                    finalized: false
                };

                const tx = {
                    error: null as DOMException | null,
                    oncomplete: null as ((ev: Event) => void) | null,
                    onerror: null as ((ev: Event) => void) | null,
                    onabort: null as ((ev: Event) => void) | null,
                    abort: () => {
                        if (txState.finalized) return;
                        txState.aborted = true;
                        txState.finalized = true;
                        queueMicrotask(() => {
                            tx.onabort?.(new Event('abort'));
                        });
                    },
                    objectStore: (name: string) => {
                        const targetStore = stores.get(name) || stores.get(storeName);
                        if (!targetStore) {
                            throw new Error(`Missing store ${name}`);
                        }

                        const scheduleComplete = () => {
                            queueMicrotask(() => {
                                if (!txState.aborted && !txState.finalized && txState.pendingOps === 0) {
                                    txState.finalized = true;
                                    tx.oncomplete?.(new Event('complete'));
                                }
                            });
                        };

                        return {
                            count: () => {
                                const opReq = { result: 0, onsuccess: null as ((ev: Event) => void) | null };
                                txState.pendingOps++;
                                queueMicrotask(() => {
                                    opReq.result = targetStore.records.size;
                                    opReq.onsuccess?.(new Event('success'));
                                    txState.pendingOps--;
                                    scheduleComplete();
                                });
                                return opReq as unknown as IDBRequest<number>;
                            },
                            getAll: () => {
                                const opReq = { result: [] as unknown[], onsuccess: null as ((ev: Event) => void) | null };
                                txState.pendingOps++;
                                queueMicrotask(() => {
                                    opReq.result = Array.from(targetStore.records.values());
                                    opReq.onsuccess?.(new Event('success'));
                                    txState.pendingOps--;
                                    scheduleComplete();
                                });
                                return opReq as unknown as IDBRequest<unknown[]>;
                            },
                            put: (value: Record<string, unknown>) => {
                                const opReq = { result: undefined as unknown, onsuccess: null as ((ev: Event) => void) | null };
                                txState.pendingOps++;
                                queueMicrotask(() => {
                                    if (!txState.aborted) {
                                        const key = String(value[targetStore.keyPath]);
                                        targetStore.records.set(key, value);
                                        opReq.result = key;
                                        opReq.onsuccess?.(new Event('success'));
                                    }
                                    txState.pendingOps--;
                                    scheduleComplete();
                                });
                                return opReq as unknown as IDBRequest<IDBValidKey>;
                            },
                            delete: (key: IDBValidKey) => {
                                const opReq = { result: undefined as unknown, onsuccess: null as ((ev: Event) => void) | null };
                                txState.pendingOps++;
                                queueMicrotask(() => {
                                    if (!txState.aborted) {
                                        targetStore.records.delete(String(key));
                                        opReq.onsuccess?.(new Event('success'));
                                    }
                                    txState.pendingOps--;
                                    scheduleComplete();
                                });
                                return opReq as unknown as IDBRequest<undefined>;
                            }
                        } as unknown as IDBObjectStore;
                    }
                } as unknown as IDBTransaction;

                return tx;
            }
        } as unknown as IDBDatabase;

        Object.defineProperty(req, 'result', { value: db, writable: true, configurable: true });

        queueMicrotask(() => {
            if (isNewDb) {
                req.onupgradeneeded?.(new Event('upgradeneeded') as IDBVersionChangeEvent);
            }
            req.onsuccess?.(new Event('success'));
        });

        return req;
    };

    return { open } as unknown as IDBFactory;
}

function makeItem(id: string, timestamp: number, sizeBytes: number = 16): ContributionItem {
    const payload = new Uint8Array(sizeBytes);
    return {
        id,
        type: 'vocab',
        vietnamese: `Việt ${id}`,
        xodang: `Xơ Đăng ${id}`,
        name: `Việt ${id}`,
        blob: new Blob([payload], { type: 'audio/webm' }),
        timestamp
    };
}

describe('Contribution Outbox IndexedDB Service (UX-12)', () => {
    const originalIdb = globalThis.indexedDB;

    beforeEach(() => {
        vi.stubGlobal('indexedDB', createInMemoryIndexedDb());
        Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
        eventBus.clear();
    });

    afterEach(() => {
        if (originalIdb !== undefined) {
            vi.stubGlobal('indexedDB', originalIdb);
        } else {
            delete (globalThis as { indexedDB?: unknown }).indexedDB;
        }
        eventBus.clear();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('enqueues, counts, lists sorted by timestamp, removes items, and emits outbox:change', async () => {
        const events: number[] = [];
        eventBus.on('outbox:change', (count) => {
            events.push(count as number);
        });

        expect(await getOutboxCount()).toBe(0);
        expect(await listOutboxItems()).toEqual([]);

        await enqueueContribution(makeItem('item-b', 200));
        await enqueueContribution(makeItem('item-a', 100));

        expect(await getOutboxCount()).toBe(2);
        const listed = await listOutboxItems();
        expect(listed.map((i) => i.id)).toEqual(['item-a', 'item-b']);

        await removeOutboxItem('item-a');
        expect(await getOutboxCount()).toBe(1);
        expect((await listOutboxItems()).map((i) => i.id)).toEqual(['item-b']);
        expect(events).toEqual([1, 2, 1]);
    });

    it('flushes outbox items in strict FIFO order and preserves failed items', async () => {
        await enqueueContribution(makeItem('third', 300));
        await enqueueContribution(makeItem('first', 100));
        await enqueueContribution(makeItem('second', 200));

        const sentNames: string[] = [];
        const fetchMock = vi.fn().mockImplementation(async (_url: string, init?: RequestInit) => {
            const payload = JSON.parse(String(init?.body || '{}')) as { vietnamese?: string };
            sentNames.push(payload.vietnamese || '');
            if (payload.vietnamese === 'Việt second') {
                throw new Error('Temporary failure');
            }
            return { ok: true };
        });
        vi.stubGlobal('fetch', fetchMock);

        const changedCounts: number[] = [];
        eventBus.on('outbox:change', (count) => {
            changedCounts.push(count as number);
        });

        const result = await flushContributionOutbox();
        expect(sentNames).toEqual(['Việt first', 'Việt second', 'Việt third']);
        expect(result).toEqual({ sent: 2, failed: 1, remaining: 1 });

        const remaining = await listOutboxItems();
        expect(remaining.map((i) => i.id)).toEqual(['second']);
        expect(changedCounts[changedCounts.length - 1]).toBe(1);
    });

    it('enforces 25-item cap and 50MB total size cap', async () => {
        for (let i = 0; i < 25; i++) {
            await enqueueContribution(makeItem(`cap-${i}`, 1000 + i, 8));
        }
        expect(await getOutboxCount()).toBe(25);

        await expect(enqueueContribution(makeItem('cap-26', 2000, 8))).rejects.toThrow('25');
        expect(await getOutboxCount()).toBe(25);

        vi.stubGlobal('indexedDB', createInMemoryIndexedDb());
        const oversizedBlob = new Blob(['x'], { type: 'audio/webm' });
        Object.defineProperty(oversizedBlob, 'size', { value: 50 * 1024 * 1024 + 1 });
        const oversizedItem: ContributionItem = {
            id: 'too-big',
            type: 'vocab',
            vietnamese: 'Nặng',
            xodang: 'Nặng',
            name: 'Nặng',
            blob: oversizedBlob,
            timestamp: 3000
        };

        await expect(enqueueContribution(oversizedItem)).rejects.toThrow('50 MB');
        expect(await getOutboxCount()).toBe(0);
    });

    it('falls back cleanly when indexedDB is unavailable', async () => {
        vi.stubGlobal('indexedDB', undefined);

        expect(await getOutboxCount()).toBe(0);
        expect(await listOutboxItems()).toEqual([]);
        await expect(removeOutboxItem('any-id')).resolves.toBeUndefined();
        await expect(enqueueContribution(makeItem('no-idb', 100))).rejects.toThrow('IndexedDB');
    });
});
