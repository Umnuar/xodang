import { eventBus } from '@/utils/event-bus';
import { sendContribution, type ContributionItem } from './offline-sync.service';

const DB_NAME = 'tudien-xedang-outbox';
const DB_VERSION = 1;
const STORE_NAME = 'contributions';
const MAX_OUTBOX_ITEMS = 25;
const MAX_OUTBOX_BYTES = 50 * 1024 * 1024;

let isFlushing = false;

function isIndexedDbSupported(): boolean {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
}

function openOutboxDatabase(): Promise<IDBDatabase | null> {
    if (!isIndexedDbSupported()) {
        return Promise.resolve(null);
    }

    return new Promise((resolve) => {
        try {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            };

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                resolve(null);
            };

            request.onblocked = () => {
                resolve(null);
            };
        } catch {
            resolve(null);
        }
    });
}

function isValidContributionItem(value: unknown): value is ContributionItem {
    if (!value || typeof value !== 'object') return false;
    const item = value as Partial<ContributionItem>;
    return (
        typeof item.id === 'string' &&
        item.id.length > 0 &&
        (item.type === 'vocab' || item.type === 'voice') &&
        typeof item.name === 'string' &&
        typeof item.timestamp === 'number' &&
        item.blob instanceof Blob
    );
}

function getBlobSize(blob: unknown): number {
    if (typeof Blob !== 'undefined' && blob instanceof Blob) {
        return blob.size;
    }
    if (blob && typeof blob === 'object' && typeof (blob as { size?: unknown }).size === 'number') {
        return (blob as { size: number }).size;
    }
    return 0;
}

export async function getOutboxCount(): Promise<number> {
    const db = await openOutboxDatabase();
    if (!db) return 0;

    return new Promise((resolve) => {
        try {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const countReq = store.count();
            let count = 0;

            countReq.onsuccess = () => {
                count = typeof countReq.result === 'number' ? countReq.result : 0;
            };

            tx.oncomplete = () => {
                db.close();
                resolve(count);
            };

            tx.onerror = () => {
                db.close();
                resolve(0);
            };

            tx.onabort = () => {
                db.close();
                resolve(0);
            };
        } catch {
            db.close();
            resolve(0);
        }
    });
}

export async function listOutboxItems(): Promise<ContributionItem[]> {
    const db = await openOutboxDatabase();
    if (!db) return [];

    return new Promise((resolve) => {
        try {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.getAll();
            let items: ContributionItem[] = [];

            req.onsuccess = () => {
                const rawList = Array.isArray(req.result) ? req.result : [];
                items = rawList
                    .filter(isValidContributionItem)
                    .sort((a, b) => a.timestamp - b.timestamp);
            };

            tx.oncomplete = () => {
                db.close();
                resolve(items);
            };

            tx.onerror = () => {
                db.close();
                resolve([]);
            };

            tx.onabort = () => {
                db.close();
                resolve([]);
            };
        } catch {
            db.close();
            resolve([]);
        }
    });
}

export async function enqueueContribution(item: ContributionItem): Promise<void> {
    const db = await openOutboxDatabase();
    if (!db) {
        throw new Error('Bộ nhớ ngoại tuyến (IndexedDB) không khả dụng trên trình duyệt này.');
    }

    await new Promise<void>((resolve, reject) => {
        try {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const allReq = store.getAll();

            let nextCount = 0;
            let limitError: Error | null = null;

            allReq.onsuccess = () => {
                const rawList = Array.isArray(allReq.result) ? allReq.result : [];
                const existingOthers = rawList.filter(
                    (entry): entry is ContributionItem =>
                        Boolean(entry && typeof entry === 'object' && (entry as { id?: string }).id !== item.id)
                );

                nextCount = existingOthers.length + 1;
                if (nextCount > MAX_OUTBOX_ITEMS) {
                    limitError = new Error(`Hàng đợi đóng góp đã đầy (tối đa ${MAX_OUTBOX_ITEMS} mục). Vui lòng đồng bộ khi có mạng.`);
                    tx.abort();
                    return;
                }

                const existingBytes = existingOthers.reduce((sum, entry) => sum + getBlobSize(entry.blob), 0);
                const nextBytes = existingBytes + getBlobSize(item.blob);
                if (nextBytes > MAX_OUTBOX_BYTES) {
                    limitError = new Error('Hàng đợi đóng góp đã vượt quá giới hạn 50 MB. Vui lòng đồng bộ khi có mạng.');
                    tx.abort();
                    return;
                }

                store.put(item);
            };

            tx.oncomplete = () => {
                db.close();
                eventBus.emit('outbox:change', nextCount);
                resolve();
            };

            tx.onerror = () => {
                db.close();
                reject(limitError || tx.error || new Error('Không thể lưu bản ghi vào hàng đợi ngoại tuyến.'));
            };

            tx.onabort = () => {
                db.close();
                reject(limitError || tx.error || new Error('Không thể lưu bản ghi vào hàng đợi ngoại tuyến.'));
            };
        } catch (err) {
            db.close();
            reject(err instanceof Error ? err : new Error('Không thể lưu bản ghi vào hàng đợi ngoại tuyến.'));
        }
    });
}

export async function removeOutboxItem(id: string): Promise<void> {
    const db = await openOutboxDatabase();
    if (!db) return;

    await new Promise<void>((resolve) => {
        try {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.delete(id);

            tx.oncomplete = () => {
                db.close();
                resolve();
            };

            tx.onerror = () => {
                db.close();
                resolve();
            };

            tx.onabort = () => {
                db.close();
                resolve();
            };
        } catch {
            db.close();
            resolve();
        }
    });

    const remaining = await getOutboxCount();
    eventBus.emit('outbox:change', remaining);
}

export async function flushContributionOutbox(): Promise<{ sent: number; failed: number; remaining: number }> {
    if (isFlushing) {
        return { sent: 0, failed: 0, remaining: await getOutboxCount() };
    }

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        return { sent: 0, failed: 0, remaining: await getOutboxCount() };
    }

    isFlushing = true;
    try {
        const items = await listOutboxItems();
        if (items.length === 0) {
            return { sent: 0, failed: 0, remaining: 0 };
        }

        let sent = 0;
        let failed = 0;

        for (const item of items) {
            if (typeof navigator !== 'undefined' && navigator.onLine === false) {
                break;
            }
            try {
                const res = await sendContribution({
                    type: item.type,
                    vietnamese: item.vietnamese,
                    xodang: item.xodang,
                    readingContent: item.readingContent,
                    name: item.name,
                    blob: item.blob
                });
                if (res && res.success !== false) {
                    await removeOutboxItem(item.id);
                    sent++;
                } else {
                    failed++;
                }
            } catch {
                failed++;
            }
        }

        const remaining = await getOutboxCount();
        eventBus.emit('outbox:change', remaining);
        return { sent, failed, remaining };
    } finally {
        isFlushing = false;
    }
}
