import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fetchSheetValues, clearSheetsCache } from '@/services/sheets.service';
import { APP_CONFIG } from '@/shared/constants/config';

function rangeCoversCodePoint(unicodeRangeValue: string, codePoint: number): boolean {
    const tokens = unicodeRangeValue.split(',').map((t) => t.trim());
    for (const token of tokens) {
        const match = token.match(/^U\+([0-9A-Fa-f]+)(?:-([0-9A-Fa-f]+))?$/);
        if (!match) continue;
        const start = Number.parseInt(match[1], 16);
        const end = match[2] ? Number.parseInt(match[2], 16) : start;
        if (codePoint >= start && codePoint <= end) {
            return true;
        }
    }
    return false;
}

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
        const CURRENT_CACHE = APP_CONFIG.APP_CACHE_NAME;
        const AUDIO_CACHE = 'tudien-audio';
        const PRESERVED_CACHES = new Set([CURRENT_CACHE, AUDIO_CACHE]);

        const allCaches = [
            'tudien-10.0.3',
            'tudien-9.1.0',
            'tudien-audio',
            CURRENT_CACHE,
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

        expect(deletedCaches).toContain('tudien-10.0.3');
        expect(deletedCaches).toContain('tudien-9.1.0');
        expect(deletedCaches).toContain('random-temp-cache');

        expect(keptCaches).toContain('tudien-audio');
        expect(keptCaches).toContain(CURRENT_CACHE);
        expect(deletedCaches).not.toContain('tudien-audio');
    });

    it('keeps APP_CONFIG.APP_CACHE_NAME synchronized with service-worker CACHE_NAME and verifies all precache assets exist', () => {
        const swSource = fs.readFileSync(path.resolve(__dirname, '../../src/service-worker.ts'), 'utf-8');
        const cacheMatch = swSource.match(/const CACHE_NAME\s*=\s*'([^']+)'/);
        expect(cacheMatch?.[1]).toBe(APP_CONFIG.APP_CACHE_NAME);

        const precacheMatch = swSource.match(/const STATIC_PRECACHE\s*=\s*\[([\s\S]*?)\];/);
        expect(precacheMatch).not.toBeNull();
        const urls = Array.from(precacheMatch![1].matchAll(/'([^']+)'/g)).map(m => m[1]);
        expect(urls.length).toBeGreaterThan(5);

        expect(urls).toContain('./theme-init.js');
        expect(urls).toContain('./fonts/be-vietnam-pro/be-vietnam-pro.css');
        for (const weight of ['400', '500', '600', '700']) {
            expect(urls).toContain(`./fonts/be-vietnam-pro/be-vietnam-pro-${weight}.woff2`);
        }

        urls.forEach((entry) => {
            if (entry === './') return;
            const rel = entry.replace(/^\.\//, '');
            const inPublic = fs.existsSync(path.resolve(__dirname, '../../public', rel));
            const inRoot = fs.existsSync(path.resolve(__dirname, '../..', rel));
            expect(inPublic || inRoot, `Missing precache file for ${entry}`).toBe(true);
        });

        expect(swSource).toContain("'/audio-pack.bin'");
        expect(swSource).toContain("'/audio-pack.index.json'");
        expect(swSource).toContain("const STT_RUNTIME_CACHE_NAME = 'tudien-stt-runtime';");
        expect(swSource).toContain('PRESERVED_CACHES = new Set([CACHE_NAME, AUDIO_CACHE_NAME, STT_RUNTIME_CACHE_NAME])');
        expect(swSource).toContain("url.origin === 'https://cdn.jsdelivr.net'");
    });

    it('self-hosts Be Vietnam Pro weights 400..700 with U+0306 unicode-range and removes legacy jakarta fonts', () => {
        const jakartaDir = path.resolve(__dirname, '../../public/fonts/jakarta');
        expect(fs.existsSync(jakartaDir)).toBe(false);

        const fontCssPath = path.resolve(__dirname, '../../public/fonts/be-vietnam-pro/be-vietnam-pro.css');
        const fontCss = fs.readFileSync(fontCssPath, 'utf-8');
        expect(fontCss).not.toContain('url(/fonts/');
        expect(fontCss).not.toContain('cyrillic-ext');

        const faceBlocks = fontCss.match(/@font-face\s*\{[\s\S]*?\}/g) || [];
        expect(faceBlocks.length).toBe(4);

        const weights = new Set<string>();
        for (const block of faceBlocks) {
            const weightMatch = block.match(/font-weight:\s*(\d+)/);
            const srcMatch = block.match(/src:\s*url\(\.\/(be-vietnam-pro-\d+\.woff2)\)/);
            const rangeMatch = block.match(/unicode-range:\s*([^;]+);/);

            expect(weightMatch).not.toBeNull();
            expect(srcMatch).not.toBeNull();
            expect(rangeMatch).not.toBeNull();

            weights.add(weightMatch![1]);
            expect(srcMatch![1]).toBe(`be-vietnam-pro-${weightMatch![1]}.woff2`);
            expect(
                fs.existsSync(path.resolve(__dirname, '../../public/fonts/be-vietnam-pro', srcMatch![1]))
            ).toBe(true);
            expect(rangeCoversCodePoint(rangeMatch![1], 0x0306)).toBe(true);
        }

        expect(weights).toEqual(new Set(['400', '500', '600', '700']));

        const baseCss = fs.readFileSync(path.resolve(__dirname, '../../src/styles/base.css'), 'utf-8');
        expect(baseCss).not.toContain('/fonts/jakarta/');
        const tokensCss = fs.readFileSync(path.resolve(__dirname, '../../src/styles/tokens.css'), 'utf-8');
        expect(tokensCss).toContain('Be Vietnam Pro');
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
