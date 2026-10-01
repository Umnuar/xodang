/**
 * Sheets Service
 * Fetches data from Google Sheets API with timeout, in-memory cache, and offline snapshot fallback.
 */

import { APP_CONFIG } from '@/shared/constants/config';
import type { DictionaryEntry } from './dictionary.service';
import { snapshotFallback } from '@snapshot/data';

export interface SheetFetchOptions {
    sheetId?: string;
    range?: string;
    apiKey?: string;
    timeoutMs?: number;
    useCache?: boolean;
}

// In-memory cache
const memoryCache = new Map<string, { timestamp: number; data: string[][] }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches raw cell values from Google Sheets API v4.
 */
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

        return values;
    } catch (err: unknown) {
        // Fallback to offline snapshot if available
        if (range === APP_CONFIG.DICTIONARY_RANGE && snapshotFallback && snapshotFallback.dictionary && snapshotFallback.dictionary.length > 0) {
            return snapshotFallback.dictionary.map((entry: NonNullable<typeof snapshotFallback.dictionary>[number]) => [
                entry.viet,
                entry.ethnic,
                entry.pronunciation || '',
                entry.driveId || '',
                entry.exampleViet || '',
                entry.exampleEthnic || ''
            ]);
        }
        throw err;
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Fetches and parses dictionary rows into structured DictionaryEntry array.
 */
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

/**
 * Clears in-memory sheets cache.
 */
export function clearSheetsCache(): void {
    memoryCache.clear();
}
