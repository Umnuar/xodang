import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import homeHtml from '@/features/home/home.html?raw';
import { initHome } from '@/features/home/home';
import * as sheetsService from '@/services/sheets.service';
import * as speechService from '@/services/speech.service';
import { eventBus } from '@/utils/event-bus';

describe('Home Search, Audio & STT Regression Tests (UX-04, UX-06, UX-07, UX-20, UX-21)', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="toastContainer" role="status" aria-live="polite"></div>
            <main>
                ${homeHtml}
            </main>
        `;
        vi.spyOn(sheetsService, 'fetchDictionaryData').mockResolvedValue([
            {
                viet: 'Rừng',
                ethnic: 'Bri',
                pronunciation: 'Bri',
                driveId: '1raUfN0CewaGXr0GTORjCblECdbcSc6M-',
                exampleViet: 'Đi vào rừng.',
                exampleEthnic: 'Lám tung bri.'
            },
            {
                viet: 'Nước',
                ethnic: 'Đak',
                pronunciation: 'Đak',
                driveId: '1XbDDuKnswKTFCRKenrjtWX0c0iDGFww0'
            }
        ]);
    });

    afterEach(() => {
        eventBus.clear();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('UX-06 & UX-07: auto-switches direction to viet_to_ethnic on STT start and cancels speech on tab:change', async () => {
        await initHome();

        const directionSelect = document.getElementById('direction') as HTMLSelectElement;
        const speechButton = document.getElementById('speechButton') as HTMLButtonElement;
        directionSelect.value = 'ethnic_to_viet';
        directionSelect.dispatchEvent(new Event('change'));

        const firstChipText = document.querySelector('#quickChipsList .suggest-chip')?.textContent;
        expect(firstChipText).toBe('Bơ rơ ha');

        const cancelSpy = vi.fn();
        vi.spyOn(speechService, 'startSmartVietnameseSpeech').mockImplementation(async (cbs) => {
            cbs.onTierSelected?.('cloud');
            cbs.onStart?.('cloud');
            return {
                tier: 'cloud',
                state: 'listening',
                stop: vi.fn(),
                cancel: cancelSpy
            };
        });

        speechButton.click();

        await vi.waitFor(() => {
            expect(directionSelect.value).toBe('viet_to_ethnic');
            expect(speechButton.classList.contains('recording')).toBe(true);
            expect(speechButton.getAttribute('aria-pressed')).toBe('true');
        });

        const updatedFirstChip = document.querySelector('#quickChipsList .suggest-chip')?.textContent;
        expect(updatedFirstChip).toBe('Xin chào');

        eventBus.emit('tab:change', 'quiz');

        expect(cancelSpy).toHaveBeenCalledTimes(1);
        expect(speechButton.classList.contains('recording')).toBe(false);
        expect(speechButton.getAttribute('aria-pressed')).toBe('false');
    });

    it('UX-04: pauses previous word audio when playing another and pauses all audio on tab:change', async () => {
        await initHome();

        const wordInput = document.getElementById('word') as HTMLInputElement;
        const searchForm = document.getElementById('searchForm') as HTMLFormElement;
        wordInput.value = 'r';
        searchForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

        const resultDiv = document.getElementById('result')!;
        const audioA = document.createElement('audio');
        const audioB = document.createElement('audio');
        let pausedA = false;
        let pausedB = false;
        Object.defineProperty(audioA, 'paused', { get: () => pausedA, configurable: true });
        Object.defineProperty(audioB, 'paused', { get: () => pausedB, configurable: true });
        audioA.pause = vi.fn(() => { pausedA = true; });
        audioB.pause = vi.fn(() => { pausedB = true; });

        resultDiv.appendChild(audioA);
        resultDiv.appendChild(audioB);

        audioB.dispatchEvent(new Event('play', { bubbles: false }));
        expect(audioA.pause).toHaveBeenCalledTimes(1);

        pausedB = false;
        eventBus.emit('tab:change', 'contribute');
        expect(audioB.pause).toHaveBeenCalledTimes(1);
    });
});
