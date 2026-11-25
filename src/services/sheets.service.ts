import { APP_CONFIG } from '@/shared/constants/config';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys';
import { getStorageItemByKey, removeStorageKeysByPrefix, setStorageItemByKey } from './storage.service';
import type { DictionaryEntry } from './dictionary.service';
import { snapshotFallback } from '@snapshot/data';

export interface SheetFetchOptions {
    sheetId?: string;
    range?: string;
    apiKey?: string;
    timeoutMs?: number;
    useCache?: boolean;
}

interface PersistedSheetCache {
    timestamp: number;
    version?: string;
    data: string[][];
}

const memoryCache = new Map<string, { timestamp: number; data: string[][] }>();
const inFlightRequests = new Map<string, Promise<string[][]>>();
const CACHE_TTL_MS = 5 * 60 * 1000;
const PERSISTENT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function readPersistentCache(range: string): string[][] | null {
    const cached = getStorageItemByKey<PersistedSheetCache | null>(
        `${STORAGE_KEYS.SHEETS_CACHE_PREFIX}${range}`,
        null
    );
    if (!cached || !Array.isArray(cached.data) || cached.data.length === 0) {
        return null;
    }
    if (cached.version && cached.version !== APP_CONFIG.APP_CACHE_NAME) {
        return null;
    }
    if (typeof cached.timestamp === 'number' && Date.now() - cached.timestamp > PERSISTENT_CACHE_TTL_MS) {
        return null;
    }
    return cached.data;
}

function writePersistentCache(range: string, data: string[][]): void {
    if (data.length === 0) return;
    setStorageItemByKey<PersistedSheetCache>(`${STORAGE_KEYS.SHEETS_CACHE_PREFIX}${range}`, {
        timestamp: Date.now(),
        version: APP_CONFIG.APP_CACHE_NAME,
        data
    });
}

function getOfflineFallbackValues(range: string): string[][] | null {
    if (range === APP_CONFIG.DICTIONARY_RANGE && snapshotFallback?.dictionary && snapshotFallback.dictionary.length > 0) {
        return snapshotFallback.dictionary.map((entry: NonNullable<typeof snapshotFallback.dictionary>[number]) => [
            entry.viet,
            entry.ethnic,
            entry.pronunciation || '',
            entry.driveId || '',
            entry.exampleViet || '',
            entry.exampleEthnic || ''
        ]);
    }
    if (range === APP_CONFIG.QUIZ_RANGE && snapshotFallback?.quiz && snapshotFallback.quiz.length > 0) {
        return snapshotFallback.quiz;
    }
    if (range === APP_CONFIG.CHAT_RANGE && snapshotFallback?.chat && snapshotFallback.chat.length > 0) {
        return snapshotFallback.chat;
    }
    return null;
}

function resolveOfflineOrPersistedFallback(
    cacheKey: string,
    range: string,
    useCache: boolean
): string[][] | null {
    const persisted = readPersistentCache(range);
    if (persisted) {
        if (useCache) {
            memoryCache.set(cacheKey, { timestamp: Date.now(), data: persisted });
        }
        return persisted;
    }
    const fallback = getOfflineFallbackValues(range);
    if (fallback) {
        if (useCache) {
            memoryCache.set(cacheKey, { timestamp: Date.now(), data: fallback });
        }
        return fallback;
    }
    return null;
}

export async function fetchSheetValues(options: SheetFetchOptions = {}): Promise<string[][]> {
    const sheetId = options.sheetId || APP_CONFIG.SHEET_ID;
    const range = options.range || APP_CONFIG.DICTIONARY_RANGE;
    const apiKey = options.apiKey || APP_CONFIG.GOOGLE_API_KEY;
    const timeoutMs = options.timeoutMs || APP_CONFIG.REQUEST_TIMEOUT_MS;
    const useCache = options.useCache !== false;

    const cacheKey = `${sheetId}:${range}`;
    if (useCache && memoryCache.has(cacheKey)) {
        const cached = memoryCache.get(cacheKey)!;
        if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
            return cached.data;
        }
    }

    if (inFlightRequests.has(cacheKey)) {
        return inFlightRequests.get(cacheKey)!;
    }

    const requestPromise = (async (): Promise<string[][]> => {
        const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
        if (isOffline) {
            const offlineResult = resolveOfflineOrPersistedFallback(cacheKey, range, useCache);
            if (offlineResult) {
                return offlineResult;
            }
            if (memoryCache.has(cacheKey)) {
                return memoryCache.get(cacheKey)!.data;
            }
            throw new Error('Network offline');
        }

        if (!apiKey || apiKey.trim() === '') {
            const fallbackResult = resolveOfflineOrPersistedFallback(cacheKey, range, useCache);
            if (fallbackResult) {
                return fallbackResult;
            }
            throw new Error('Missing Google Sheets API key');
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`;
            const response = await fetch(url, { signal: controller.signal });

            if (!response.ok) {
                throw new Error(`Google Sheets API error: ${response.status} ${response.statusText}`);
            }

            const json = await response.json();
            const values: string[][] = json.values || [];

            if (useCache) {
                memoryCache.set(cacheKey, { timestamp: Date.now(), data: values });
            }
            writePersistentCache(range, values);

            return values;
        } catch (err: unknown) {
            const fallbackResult = resolveOfflineOrPersistedFallback(cacheKey, range, useCache);
            if (fallbackResult) {
                return fallbackResult;
            }
            throw err;
        } finally {
            clearTimeout(timeoutId);
        }
    })();

    inFlightRequests.set(cacheKey, requestPromise);
    try {
        return await requestPromise;
    } finally {
        inFlightRequests.delete(cacheKey);
    }
}

export async function fetchDictionaryEntries(options: SheetFetchOptions = {}): Promise<DictionaryEntry[]> {
    const rows = await fetchSheetValues({
        ...options,
        range: options.range || APP_CONFIG.DICTIONARY_RANGE
    });

    return rows.map(row => ({
        viet: (row[0] || '').trim(),
        ethnic: (row[1] || '').trim(),
        pronunciation: (row[2] || '').trim(),
        driveId: (row[3] || '').trim(),
        exampleViet: (row[4] || '').trim(),
        exampleEthnic: (row[5] || '').trim()
    })).filter(entry => entry.viet && entry.ethnic);
}

export function clearSheetsCache(clearPersistent: boolean = false): void {
    memoryCache.clear();
    if (clearPersistent) {
        removeStorageKeysByPrefix(STORAGE_KEYS.SHEETS_CACHE_PREFIX);
    }
}

export async function fetchDictionaryData(): Promise<DictionaryEntry[]> {
    return fetchDictionaryEntries();
}

export async function fetchChatData(): Promise<string[][]> {
    return fetchSheetValues({ range: APP_CONFIG.CHAT_RANGE });
}

export async function fetchQuizData(): Promise<string[][]> {
    return fetchSheetValues({ range: APP_CONFIG.QUIZ_RANGE });
}
