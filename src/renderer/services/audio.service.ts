/**
 * Audio Service
 * Manages audio playback, Web Audio sound effects, and offline audio caching via Cache Storage.
 */

import { APP_CONFIG } from '@/shared/constants/config';

/**
 * Returns the relative audio file path for a driveId.
 */
export function getAudioUrl(driveId: string): string {
    const cleanId = (driveId || '').trim();
    return cleanId ? `./audio/${cleanId}.webm` : '';
}

/**
 * Plays a synthesized audio beep using Web Audio API.
 * Works offline without external audio assets.
 */
export function playSyntheticBeep(frequency: number = 800, durationSec: number = 0.5): void {
    try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return;

        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.value = frequency;
        osc.type = 'sine';

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + durationSec);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + durationSec);
    } catch (e) {
        // Ignore audio context autoplay policy restrictions
    }
}

/**
 * Plays flip sound for flashcards.
 */
export function playCardFlipSound(): void {
    playSyntheticBeep(600, 0.3);
}

/**
 * Checks how many audio files from the provided driveIds are already stored in Cache Storage.
 */
export async function checkOfflineAudioStatus(driveIds: string[]): Promise<{
    cachedCount: number;
    totalWithAudio: number;
    isComplete: boolean;
}> {
    const validIds = driveIds.filter(id => id && id.trim() !== '' && id !== 'null');
    const totalWithAudio = validIds.length;

    if (typeof window === 'undefined' || !('caches' in window) || totalWithAudio === 0) {
        return { cachedCount: 0, totalWithAudio, isComplete: false };
    }

    try {
        const cache = await caches.open(APP_CONFIG.AUDIO_CACHE_NAME);
        let cachedCount = 0;

        for (const id of validIds) {
            const url = getAudioUrl(id);
            const match = await cache.match(url);
            if (match) cachedCount++;
        }

        return {
            cachedCount,
            totalWithAudio,
            isComplete: cachedCount === totalWithAudio
        };
    } catch {
        return { cachedCount: 0, totalWithAudio, isComplete: false };
    }
}

/**
 * Downloads audio files to Cache Storage in parallel with concurrency limiting.
 */
export async function downloadAudioOffline(
    driveIds: string[],
    concurrency: number = 5,
    onProgress?: (loaded: number, total: number) => void
): Promise<{ successCount: number; total: number }> {
    const validIds = driveIds.filter(id => id && id.trim() !== '' && id !== 'null');
    const total = validIds.length;

    if (typeof window === 'undefined' || !('caches' in window) || total === 0) {
        return { successCount: 0, total };
    }

    const cache = await caches.open(APP_CONFIG.AUDIO_CACHE_NAME);
    let loaded = 0;
    let successCount = 0;

    const queue = [...validIds];

    async function worker(): Promise<void> {
        while (queue.length > 0) {
            const id = queue.shift();
            if (!id) break;

            const url = getAudioUrl(id);
            const cached = await cache.match(url);

            if (cached) {
                loaded++;
                successCount++;
                onProgress?.(loaded, total);
                continue;
            }

            try {
                const response = await fetch(url);
                if (response.ok) {
                    await cache.put(url, response);
                    successCount++;
                }
            } catch {
                // Ignore single audio download failure to allow remainder to finish
            } finally {
                loaded++;
                onProgress?.(loaded, total);
            }
        }
    }

    const workers = Array.from({ length: Math.min(concurrency, total) }, () => worker());
    await Promise.all(workers);

    return { successCount, total };
}
