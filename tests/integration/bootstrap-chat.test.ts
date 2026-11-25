import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as sheetsService from '@/services/sheets.service';
import { eventBus } from '@/utils/event-bus';

describe('Bootstrap Chat Toggle Race Regression Tests (UX-14)', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="app"></div><div id="app-loading"></div>';
        window.location.hash = '#home';
        Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
        vi.spyOn(sheetsService, 'fetchDictionaryData').mockResolvedValue([
            { viet: 'Nhà', ethnic: 'Hngêi' }
        ]);
        vi.spyOn(sheetsService, 'fetchChatData').mockResolvedValue([
            ['Xin chào?', 'Bơ rơ ha']
        ]);
    });

    afterEach(() => {
        eventBus.clear();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('opens chat even when clicked while idle preload is in flight and supports repeated toggles', async () => {
        let idleCb: (() => void) | null = null;
        vi.stubGlobal('requestIdleCallback', (cb: () => void) => {
            idleCb = cb;
            return 1;
        });

        await import('@/main');

        await vi.waitFor(() => {
            expect(idleCb).not.toBeNull();
        }, { timeout: 5000 });

        idleCb!();
        const stubBtn = document.getElementById('chatToggleBtn')!;
        stubBtn.click();

        await vi.waitFor(() => {
            const chatWindow = document.getElementById('chatWindow');
            expect(chatWindow).not.toBeNull();
            expect(chatWindow!.classList.contains('active')).toBe(true);
        }, { timeout: 5000 });

        document.getElementById('closeChatBtn')!.click();
        expect(document.getElementById('chatWindow')!.classList.contains('active')).toBe(false);

        document.getElementById('chatToggleBtn')!.click();
        expect(document.getElementById('chatWindow')!.classList.contains('active')).toBe(true);
    });
});
