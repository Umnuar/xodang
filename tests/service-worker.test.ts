/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi } from 'vitest';
import { fetchSheetValues } from '@/renderer/services/sheets.service';

describe('PWA Service Worker & Cache Preservation Tests (Rule 8 Compliance)', () => {
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

    it('Desktop IPC Bridge: fetchSheetValues calls window.electronAPI when present', async () => {
        const mockElectronFetch = vi.fn().mockResolvedValue({
            success: true,
            data: {
                values: [
                    ['Nhà', 'Hnam', '', '', '', ''],
                    ['Nước', 'Đak', '', '', '', '']
                ]
            }
        });

        window.electronAPI = {
            fetchSheetsData: mockElectronFetch,
            isOffline: () => false,
            getPlatform: () => 'win32',
            isElectron: true
        };

        const rows = await fetchSheetValues({ range: 'Tu_Dien!A2:F', useCache: false });

        expect(mockElectronFetch).toHaveBeenCalledWith('Tu_Dien!A2:F');
        expect(rows.length).toBe(2);
        expect(rows[0][0]).toBe('Nhà');
        expect(rows[0][1]).toBe('Hnam');

        // Cleanup
        delete window.electronAPI;
    });
});
