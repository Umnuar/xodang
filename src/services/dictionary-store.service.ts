import {
    classifyEntryKind,
    normalizeUnicodeNFC,
    type DictionaryEntry,
    type EntryKind
} from './dictionary.service';

export type ChunkKey = 'words' | 'phrases' | 'quiz' | 'chat';

export interface StaticChunkMeta {
    path: string;
    sha256: string;
    count: number;
    bytes: number;
}

export interface StaticDictManifest {
    version: number;
    generatedAt: string;
    totalEntries: number;
    chunks: {
        words: StaticChunkMeta;
        phrases: StaticChunkMeta;
        quiz: StaticChunkMeta;
        chat: StaticChunkMeta;
    };
}

export interface StoredChunk<T = string[][]> {
    sha256: string;
    data: T;
}

const DB_NAME = 'tudien-xedang-corpus';
const DB_VERSION = 1;
const META_STORE = 'meta';
const CHUNKS_STORE = 'chunks';
const MANIFEST_KEY = 'manifest';

export function isDictionaryStoreSupported(): boolean {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
}

function openCorpusDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (!isDictionaryStoreSupported()) {
            reject(new Error('IndexedDB is unavailable'));
            return;
        }
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(META_STORE)) {
                db.createObjectStore(META_STORE);
            }
            if (!db.objectStoreNames.contains(CHUNKS_STORE)) {
                db.createObjectStore(CHUNKS_STORE);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error('Failed to open corpus database'));
    });
}

async function readStoreValue<T>(storeName: string, key: string): Promise<T | null> {
    if (!isDictionaryStoreSupported()) return null;
    let db: IDBDatabase | null = null;
    try {
        db = await openCorpusDatabase();
        const database = db;
        return await new Promise<T | null>((resolve, reject) => {
            const tx = database.transaction(storeName, 'readonly');
            const req = tx.objectStore(storeName).get(key);
            req.onsuccess = () => resolve((req.result as T | undefined) ?? null);
            req.onerror = () => reject(req.error || new Error(`Failed reading ${storeName}/${key}`));
        });
    } catch {
        return null;
    } finally {
        db?.close();
    }
}

async function writeStoreValue<T>(storeName: string, key: string, value: T): Promise<boolean> {
    if (!isDictionaryStoreSupported()) return false;
    let db: IDBDatabase | null = null;
    try {
        db = await openCorpusDatabase();
        const database = db;
        return await new Promise<boolean>((resolve, reject) => {
            const tx = database.transaction(storeName, 'readwrite');
            tx.objectStore(storeName).put(value, key);
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error || new Error(`Failed writing ${storeName}/${key}`));
        });
    } catch {
        return false;
    } finally {
        db?.close();
    }
}

export async function readStoredManifest(): Promise<StaticDictManifest | null> {
    return readStoreValue<StaticDictManifest>(META_STORE, MANIFEST_KEY);
}

export async function writeStoredManifest(manifest: StaticDictManifest): Promise<boolean> {
    return writeStoreValue(META_STORE, MANIFEST_KEY, manifest);
}

export async function readStoredChunk<T = string[][]>(key: ChunkKey): Promise<StoredChunk<T> | null> {
    const record = await readStoreValue<StoredChunk<T>>(CHUNKS_STORE, key);
    if (!record || typeof record !== 'object' || !('data' in record)) {
        return null;
    }
    return record;
}

export async function writeStoredChunk<T = string[][]>(
    key: ChunkKey,
    data: T,
    sha256: string
): Promise<boolean> {
    const record: StoredChunk<T> = { sha256, data };
    return writeStoreValue(CHUNKS_STORE, key, record);
}

export async function clearDictionaryStore(): Promise<boolean> {
    if (!isDictionaryStoreSupported()) return false;
    let db: IDBDatabase | null = null;
    try {
        db = await openCorpusDatabase();
        const database = db;
        return await new Promise<boolean>((resolve, reject) => {
            const tx = database.transaction([META_STORE, CHUNKS_STORE], 'readwrite');
            tx.objectStore(META_STORE).clear();
            tx.objectStore(CHUNKS_STORE).clear();
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error || new Error('Failed clearing corpus store'));
        });
    } catch {
        return false;
    } finally {
        db?.close();
    }
}

export async function requestPersistentStorage(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.storage || typeof navigator.storage.persist !== 'function') {
        return false;
    }
    try {
        if (typeof navigator.storage.persisted === 'function') {
            const alreadyPersisted = await navigator.storage.persisted();
            if (alreadyPersisted) return true;
        }
        return await navigator.storage.persist();
    } catch {
        return false;
    }
}

export function unpackVocabTuples(tuples: string[][], kind?: EntryKind): DictionaryEntry[] {
    if (!Array.isArray(tuples)) return [];
    const entries: DictionaryEntry[] = [];
    for (const row of tuples) {
        if (!Array.isArray(row)) continue;
        const viet = normalizeUnicodeNFC(String(row[0] || '')).trim();
        const ethnic = normalizeUnicodeNFC(String(row[1] || '')).trim();
        if (!viet || !ethnic) continue;
        const entry: DictionaryEntry = {
            viet,
            ethnic,
            kind: kind || classifyEntryKind(viet, ethnic)
        };
        const pronunciation = normalizeUnicodeNFC(String(row[2] || '')).trim();
        const driveId = String(row[3] || '').trim();
        const exampleViet = normalizeUnicodeNFC(String(row[4] || '')).trim();
        const exampleEthnic = normalizeUnicodeNFC(String(row[5] || '')).trim();
        if (pronunciation) entry.pronunciation = pronunciation;
        if (driveId) entry.driveId = driveId;
        if (exampleViet) entry.exampleViet = exampleViet;
        if (exampleEthnic) entry.exampleEthnic = exampleEthnic;
        entries.push(entry);
    }
    return entries;
}
