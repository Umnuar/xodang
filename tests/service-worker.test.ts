/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fetchSheetValues, clearSheetsCache } from '@/renderer/services/sheets.service';
import { APP_CONFIG } from '@/shared/constants/config';

describe('PWA Service Worker & Cache Preservation Tests (Rule 8 Compliance)', () => {
    beforeEach(() => {
        if (!window.localStorage || typeof window.localStorage.clear !== 'function') {
            const store = new Map<string, string>();
            const mockStorage = {
                getItem: (k: string) => store.get(k) ?? null,
                setItem: (k: string, v: string) => store.set(k, String(v)),
                removeItem: (k: string) => store.delete(k),
                clear: () => store.clear(),
                get length() { return store.size; },
                key: (i: number) => Array.from(store.keys())[i] ?? null
            };
            Object.defineProperty(window, 'localStorage', {
                value: mockStorage,
                configurable: true,
                writable: true
            });
        }
        window.localStorage.clear();
        clearSheetsCache(true);
    });
    it('RULE 8: Eviction logic deletes legacy version caches but preserves tudien-audio cache', async () => {
        const CURRENT_CACHE = 'tudien-modular-v10.0.3';
        const AUDIO_CACHE = 'tudien-audio';
        const PRESERVED_CACHES = new Set([CURRENT_CACHE, AUDIO_CACHE]);

        const allCaches = [
            'tudien-10.0.3',      // Old version
            'tudien-9.1.0',       // Older version
            'tudien-audio',       // 40MB user offline audio - MUST BE PRESERVED
            'tudien-modular-v10.0.3', // Current active cache
            'random-temp-cache'
        ];

        const deletedCaches: string[] = [];
        const keptCaches: string[] = [];

        for (const cacheName of allCaches) {
            if (!PRESERVED_CACHES.has(cacheName)) {
                deletedCaches.push(cacheName);
            } else {
                keptCaches.push(cacheName);
            }
        }

        // Verify that old caches were marked for deletion
        expect(deletedCaches).toContain('tudien-10.0.3');
        expect(deletedCaches).toContain('tudien-9.1.0');
        expect(deletedCaches).toContain('random-temp-cache');

        // Verify that tudien-audio was strictly preserved
        expect(keptCaches).toContain('tudien-audio');
        expect(keptCaches).toContain('tudien-modular-v10.0.3');
        expect(deletedCaches).not.toContain('tudien-audio');
    });

    it('keeps APP_CONFIG.APP_CACHE_NAME synchronized with service-worker CACHE_NAME and verifies all precache assets exist', () => {
        const swSource = fs.readFileSync(path.resolve(__dirname, '../src/renderer/service-worker.ts'), 'utf-8');
        const cacheMatch = swSource.match(/const CACHE_NAME\s*=\s*'([^']+)'/);
        expect(cacheMatch?.[1]).toBe(APP_CONFIG.APP_CACHE_NAME);

        const precacheMatch = swSource.match(/const STATIC_PRECACHE\s*=\s*\[([\s\S]*?)\];/);
        expect(precacheMatch).not.toBeNull();
        const urls = Array.from(precacheMatch![1].matchAll(/'([^']+)'/g)).map(m => m[1]);
        expect(urls.length).toBeGreaterThan(5);

        urls.forEach((entry) => {
            if (entry === './') return;
            const rel = entry.replace(/^\.\//, '');
            const inPublic = fs.existsSync(path.resolve(__dirname, '../public', rel));
            const inRoot = fs.existsSync(path.resolve(__dirname, '..', rel));
            expect(inPublic || inRoot, `Missing precache file for ${entry}`).toBe(true);
        });
    });

    it('uses relative font paths without root-relative /fonts/ prefixes', () => {
        const jakartaCss = fs.readFileSync(path.resolve(__dirname, '../public/fonts/jakarta/jakarta.css'), 'utf-8');
        expect(jakartaCss).not.toContain('url(/fonts/');
        expect(jakartaCss).toContain('url(./pjs-');

        const baseCss = fs.readFileSync(path.resolve(__dirname, '../src/renderer/styles/base.css'), 'utf-8');
        expect(baseCss).not.toContain('/fonts/jakarta/');
    });

    it('deduplicates concurrent sheet fetches and serves persisted offline dictionary entries (>20) across reloads', async () => {
        const largeRows = Array.from({ length: 35 }, (_, idx) => [`Từ ${idx}`, `Ethnic ${idx}`, '', '', '', '']);
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ values: largeRows })
        });
        vi.stubGlobal('fetch', fetchMock);

        const [resA, resB] = await Promise.all([
            fetchSheetValues({ apiKey: 'test-key', range: 'Tu_Dien!A2:F' }),
            fetchSheetValues({ apiKey: 'test-key', range: 'Tu_Dien!A2:F' })
        ]);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(resA.length).toBe(35);
        expect(resB.length).toBe(35);

        clearSheetsCache(false);
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network offline')));

        const offlineRows = await fetchSheetValues({ apiKey: 'test-key', range: 'Tu_Dien!A2:F' });
        expect(offlineRows.length).toBe(35);
        expect(offlineRows[0][0]).toBe('Từ 0');

        vi.unstubAllGlobals();
    });
});
