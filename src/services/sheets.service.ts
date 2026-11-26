import { APP_CONFIG } from '@/shared/constants/config';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys';
import { eventBus } from '@/utils/event-bus';
import { getStorageItemByKey, setStorageItemByKey, removeStorageKeysByPrefix } from './storage.service';
import { snapshotFallback } from '@snapshot/data';
import { classifyEntryKind, normalizeUnicodeNFC, type DictionaryEntry } from './dictionary.service';
import {
    clearDictionaryStore,
    isDictionaryStoreSupported,
    readStoredChunk,
    readStoredManifest,
    requestPersistentStorage,
    unpackVocabTuples,
    writeStoredChunk,
    writeStoredManifest,
    type ChunkKey,
    type StaticChunkMeta,
    type StaticDictManifest
} from './dictionary-store.service';

interface SheetResponsePayload {
    values?: string[][];
}

interface PersistedSheetCache {
    timestamp: number;
    version: string;
    data: string[][];
}

export interface FetchSheetOptions {
    range?: string;
    apiKey?: string;
    sheetId?: string;
}

const MAX_PERSISTENT_CACHE_CHARS = 80_000;

const memoryCache = new Map<string, string[][]>();
const inFlightRequests = new Map<string, Promise<string[][]>>();
let dictionaryMemoryCache: DictionaryEntry[] | null = null;
let inFlightDictionaryPromise: Promise<DictionaryEntry[]> | null = null;
let inFlightManifestPromise: Promise<StaticDictManifest | null> | null = null;
let inFlightDeltaSyncPromise: Promise<boolean> | null = null;
let hasTriggeredBackgroundSync = false;

function readPersistentCache(range: string): string[][] | null {
    const parsed = getStorageItemByKey<PersistedSheetCache | null>(
        `${STORAGE_KEYS.SHEETS_CACHE_PREFIX}${range}`,
        null
    );
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.data) || parsed.data.length === 0) {
        return null;
    }
    return parsed.data;
}

function writePersistentCache(range: string, data: string[][]): void {
    if (data.length === 0) return;
    const payload: PersistedSheetCache = {
        timestamp: Date.now(),
        version: APP_CONFIG.APP_CACHE_NAME,
        data
    };
    try {
        if (JSON.stringify(payload).length > MAX_PERSISTENT_CACHE_CHARS) {
            return;
        }
    } catch {
        return;
    }
    setStorageItemByKey<PersistedSheetCache>(`${STORAGE_KEYS.SHEETS_CACHE_PREFIX}${range}`, payload);
}

function resolveOfflineOrPersistedFallback(range: string): string[][] {
    const persisted = readPersistentCache(range);
    if (persisted && persisted.length > 0) {
        return persisted;
    }
    if (range === APP_CONFIG.QUIZ_RANGE && Array.isArray(snapshotFallback.quiz)) {
        return snapshotFallback.quiz;
    }
    if (range === APP_CONFIG.CHAT_RANGE && Array.isArray(snapshotFallback.chat)) {
        return snapshotFallback.chat;
    }
    if (range === APP_CONFIG.DICTIONARY_RANGE && Array.isArray(snapshotFallback.dictionary)) {
        return snapshotFallback.dictionary.map((entry) => [
            entry.viet,
            entry.ethnic,
            entry.pronunciation || '',
            entry.driveId || '',
            entry.exampleViet || '',
            entry.exampleEthnic || ''
        ]);
    }
    return [];
}

async function fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), APP_CONFIG.REQUEST_TIMEOUT_MS);
    try {
        return await fetch(url, { signal: controller.signal });
    } finally {
        clearTimeout(timeoutId);
    }
}

async function fetchStaticJson<T>(relativePath: string): Promise<T | null> {
    try {
        const cleanRel = relativePath.replace(/^\/+/, '');
        const url = `${APP_CONFIG.DATA_BASE_URL}/${cleanRel}`;
        const response = await fetchWithTimeout(url);
        if (!response || !response.ok) {
            return null;
        }
        return (await response.json()) as T;
    } catch {
        return null;
    }
}

function isValidManifest(candidate: unknown): candidate is StaticDictManifest {
    if (!candidate || typeof candidate !== 'object') return false;
    const obj = candidate as Partial<StaticDictManifest>;
    return Boolean(
        obj.chunks &&
            obj.chunks.words &&
            obj.chunks.phrases &&
            obj.chunks.quiz &&
            obj.chunks.chat
    );
}

async function fetchStaticManifest(): Promise<StaticDictManifest | null> {
    if (inFlightManifestPromise) {
        return inFlightManifestPromise;
    }
    inFlightManifestPromise = (async () => {
        const parsed = await fetchStaticJson<unknown>('dict-manifest.json');
        return isValidManifest(parsed) ? parsed : null;
    })();
    try {
        return await inFlightManifestPromise;
    } finally {
        inFlightManifestPromise = null;
    }
}

async function fetchStaticChunkRows(meta: StaticChunkMeta): Promise<string[][] | null> {
    const parsed = await fetchStaticJson<unknown>(meta.path);
    return Array.isArray(parsed) ? (parsed as string[][]) : null;
}

function mapSnapshotDictionaryFallback(): DictionaryEntry[] {
    if (!Array.isArray(snapshotFallback.dictionary)) {
        return [];
    }
    return snapshotFallback.dictionary.map((entry) => {
        const viet = normalizeUnicodeNFC(entry.viet || '').trim();
        const ethnic = normalizeUnicodeNFC(entry.ethnic || '').trim();
        const mapped: DictionaryEntry = {
            viet,
            ethnic,
            kind: classifyEntryKind(viet, ethnic)
        };
        if (entry.pronunciation) mapped.pronunciation = normalizeUnicodeNFC(entry.pronunciation).trim();
        if (entry.driveId) mapped.driveId = entry.driveId.trim();
        if (entry.exampleViet) mapped.exampleViet = normalizeUnicodeNFC(entry.exampleViet).trim();
        if (entry.exampleEthnic) mapped.exampleEthnic = normalizeUnicodeNFC(entry.exampleEthnic).trim();
        return mapped;
    });
}

function unpackDictionaryChunks(wordsRows: string[][], phrasesRows: string[][]): DictionaryEntry[] {
    return [
        ...unpackVocabTuples(wordsRows, 'word'),
        ...unpackVocabTuples(phrasesRows, 'phrase')
    ];
}

async function persistManifestChunk(
    key: ChunkKey,
    data: string[][],
    sha256: string
): Promise<void> {
    if (!isDictionaryStoreSupported()) return;
    await writeStoredChunk(key, data, sha256);
}

export async function syncStaticCorpusDelta(): Promise<boolean> {
    if (inFlightDeltaSyncPromise) {
        return inFlightDeltaSyncPromise;
    }
    inFlightDeltaSyncPromise = (async () => {
        const remoteManifest = await fetchStaticManifest();
        if (!remoteManifest) {
            return false;
        }
        const [storedManifest, storedWords, storedPhrases] = await Promise.all([
            readStoredManifest(),
            readStoredChunk<string[][]>('words'),
            readStoredChunk<string[][]>('phrases')
        ]);

        const wordsDirty = !storedWords || storedWords.sha256 !== remoteManifest.chunks.words.sha256;
        const phrasesDirty = !storedPhrases || storedPhrases.sha256 !== remoteManifest.chunks.phrases.sha256;

        if (!wordsDirty && !phrasesDirty) {
            if (!storedManifest || storedManifest.generatedAt !== remoteManifest.generatedAt) {
                await writeStoredManifest(remoteManifest);
            }
            return false;
        }

        const [nextWordsRows, nextPhrasesRows] = await Promise.all([
            wordsDirty ? fetchStaticChunkRows(remoteManifest.chunks.words) : Promise.resolve(storedWords.data),
            phrasesDirty ? fetchStaticChunkRows(remoteManifest.chunks.phrases) : Promise.resolve(storedPhrases.data)
        ]);

        if (!nextWordsRows || !nextPhrasesRows) {
            return false;
        }

        const writes: Promise<unknown>[] = [];
        if (wordsDirty) {
            writes.push(writeStoredChunk('words', nextWordsRows, remoteManifest.chunks.words.sha256));
        }
        if (phrasesDirty) {
            writes.push(writeStoredChunk('phrases', nextPhrasesRows, remoteManifest.chunks.phrases.sha256));
        }
        writes.push(writeStoredManifest(remoteManifest));
        await Promise.all(writes);

        const updatedEntries = unpackDictionaryChunks(nextWordsRows, nextPhrasesRows);
        dictionaryMemoryCache = updatedEntries;
        eventBus.emit('dictionary:updated', updatedEntries);
        return true;
    })();

    try {
        return await inFlightDeltaSyncPromise;
    } finally {
        inFlightDeltaSyncPromise = null;
    }
}

export async function fetchSheetValues(options: FetchSheetOptions = {}): Promise<string[][]> {
    const range = options.range || APP_CONFIG.DICTIONARY_RANGE;
    const apiKey = options.apiKey ?? APP_CONFIG.GOOGLE_API_KEY;
    const sheetId = options.sheetId || APP_CONFIG.SHEET_ID;

    if (memoryCache.has(range)) {
        return memoryCache.get(range)!;
    }

    if (inFlightRequests.has(range)) {
        return inFlightRequests.get(range)!;
    }

    const requestPromise = (async (): Promise<string[][]> => {
        if (!apiKey || apiKey === 'YOUR_GOOGLE_SHEETS_API_KEY_HERE') {
            const fallback = resolveOfflineOrPersistedFallback(range);
            if (fallback.length > 0) memoryCache.set(range, fallback);
            return fallback;
        }

        try {
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?key=${encodeURIComponent(apiKey)}`;
            const response = await fetchWithTimeout(url);
            if (!response.ok) {
                const fallback = resolveOfflineOrPersistedFallback(range);
                if (fallback.length > 0) memoryCache.set(range, fallback);
                return fallback;
            }
            const payload = (await response.json()) as SheetResponsePayload;
            const values = Array.isArray(payload.values) ? payload.values : [];
            if (values.length > 0) {
                memoryCache.set(range, values);
                writePersistentCache(range, values);
                return values;
            }
            const fallback = resolveOfflineOrPersistedFallback(range);
            if (fallback.length > 0) memoryCache.set(range, fallback);
            return fallback;
        } catch {
            const fallback = resolveOfflineOrPersistedFallback(range);
            if (fallback.length > 0) memoryCache.set(range, fallback);
            return fallback;
        }
    })();

    inFlightRequests.set(range, requestPromise);
    try {
        return await requestPromise;
    } finally {
        inFlightRequests.delete(range);
    }
}

async function fetchStaticRowChunkWithCache(
    chunkKey: 'quiz' | 'chat',
    fallbackRange: string,
    snapshotRows: string[][] | null
): Promise<string[][]> {
    if (memoryCache.has(fallbackRange)) {
        return memoryCache.get(fallbackRange)!;
    }

    if (inFlightRequests.has(fallbackRange)) {
        return inFlightRequests.get(fallbackRange)!;
    }

    const requestPromise = (async (): Promise<string[][]> => {
        const stored = await readStoredChunk<string[][]>(chunkKey);
        if (stored && stored.data.length > 0) {
            memoryCache.set(fallbackRange, stored.data);
            void (async () => {
                const manifest = await fetchStaticManifest();
                if (!manifest) return;
                const remoteMeta = manifest.chunks[chunkKey];
                if (remoteMeta.sha256 === stored.sha256) return;
                const fresh = await fetchStaticChunkRows(remoteMeta);
                if (!fresh || fresh.length === 0) return;
                await persistManifestChunk(chunkKey, fresh, remoteMeta.sha256);
                memoryCache.set(fallbackRange, fresh);
            })().catch(() => {});
            return stored.data;
        }

        const manifest = await fetchStaticManifest();
        if (manifest) {
            const rows = await fetchStaticChunkRows(manifest.chunks[chunkKey]);
            if (rows && rows.length > 0) {
                memoryCache.set(fallbackRange, rows);
                writePersistentCache(fallbackRange, rows);
                await persistManifestChunk(chunkKey, rows, manifest.chunks[chunkKey].sha256);
                return rows;
            }
        }

        const persisted = readPersistentCache(fallbackRange);
        if (persisted && persisted.length > 0) {
            memoryCache.set(fallbackRange, persisted);
            return persisted;
        }

        if (Array.isArray(snapshotRows) && snapshotRows.length > 0) {
            memoryCache.set(fallbackRange, snapshotRows);
            return snapshotRows;
        }

        return [];
    })();

    inFlightRequests.set(fallbackRange, requestPromise);
    try {
        return await requestPromise;
    } finally {
        inFlightRequests.delete(fallbackRange);
    }
}

export function clearSheetsCache(clearPersistent: boolean = false): void {
    memoryCache.clear();
    dictionaryMemoryCache = null;
    inFlightDictionaryPromise = null;
    inFlightManifestPromise = null;
    inFlightDeltaSyncPromise = null;
    hasTriggeredBackgroundSync = false;
    if (clearPersistent) {
        removeStorageKeysByPrefix(STORAGE_KEYS.SHEETS_CACHE_PREFIX);
        void clearDictionaryStore();
    }
}

export async function fetchDictionaryData(): Promise<DictionaryEntry[]> {
    if (dictionaryMemoryCache && dictionaryMemoryCache.length > 0) {
        return dictionaryMemoryCache;
    }

    if (inFlightDictionaryPromise) {
        return inFlightDictionaryPromise;
    }

    inFlightDictionaryPromise = (async (): Promise<DictionaryEntry[]> => {
        const [storedWords, storedPhrases] = await Promise.all([
            readStoredChunk<string[][]>('words'),
            readStoredChunk<string[][]>('phrases')
        ]);

        if (storedWords && storedPhrases) {
            const entries = unpackDictionaryChunks(storedWords.data, storedPhrases.data);
            if (entries.length > 0) {
                dictionaryMemoryCache = entries;
                if (!hasTriggeredBackgroundSync) {
                    hasTriggeredBackgroundSync = true;
                    void syncStaticCorpusDelta().catch(() => {});
                }
                return entries;
            }
        }

        const manifest = await fetchStaticManifest();
        if (manifest) {
            const [wordsRows, phrasesRows] = await Promise.all([
                storedWords && storedWords.sha256 === manifest.chunks.words.sha256
                    ? Promise.resolve(storedWords.data)
                    : fetchStaticChunkRows(manifest.chunks.words),
                storedPhrases && storedPhrases.sha256 === manifest.chunks.phrases.sha256
                    ? Promise.resolve(storedPhrases.data)
                    : fetchStaticChunkRows(manifest.chunks.phrases)
            ]);

            if (wordsRows && phrasesRows) {
                const entries = unpackDictionaryChunks(wordsRows, phrasesRows);
                dictionaryMemoryCache = entries;
                if (isDictionaryStoreSupported()) {
                    await Promise.all([
                        persistManifestChunk('words', wordsRows, manifest.chunks.words.sha256),
                        persistManifestChunk('phrases', phrasesRows, manifest.chunks.phrases.sha256),
                        writeStoredManifest(manifest)
                    ]);
                    void requestPersistentStorage();
                }
                return entries;
            }
        }

        const fallback = mapSnapshotDictionaryFallback();
        if (fallback.length > 0) {
            dictionaryMemoryCache = fallback;
        }
        return fallback;
    })();

    try {
        return await inFlightDictionaryPromise;
    } finally {
        inFlightDictionaryPromise = null;
    }
}

export async function fetchChatData(): Promise<string[][]> {
    return fetchStaticRowChunkWithCache('chat', APP_CONFIG.CHAT_RANGE, snapshotFallback.chat);
}

export async function fetchQuizData(): Promise<string[][]> {
    return fetchStaticRowChunkWithCache('quiz', APP_CONFIG.QUIZ_RANGE, snapshotFallback.quiz);
}
