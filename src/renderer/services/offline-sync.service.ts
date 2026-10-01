/**
 * Offline Sync Service
 * Manages contribution recording queue and submission to Google Apps Script.
 */

import { APP_CONFIG } from '@/shared/constants/config';

export interface ContributionItem {
    id: string;
    type: 'vocab' | 'voice';
    vietnamese?: string;
    xodang?: string;
    readingContent?: string;
    name: string;
    blob: Blob;
    timestamp: number;
}

/**
 * Sanitizes Vietnamese text to ASCII safe filename.
 */
export function sanitizeFilename(text: string): string {
    return (text || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .toLowerCase()
        .substring(0, 30);
}

/**
 * Converts a Blob to base64 string.
 */
export function convertBlobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1] || '';
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Sends a contribution payload to Google Apps Script.
 */
export async function sendContribution(data: {
    type: 'vocab' | 'voice';
    vietnamese?: string;
    xodang?: string;
    readingContent?: string;
    name?: string;
    filename?: string;
    blob: Blob;
}): Promise<{ success: boolean; message: string }> {
    const base64Audio = await convertBlobToBase64(data.blob);
    const mimeType = data.blob.type || 'audio/webm';
    const ext = mimeType.includes('mp3') ? 'mp3' : 'webm';
    const filename = `${sanitizeFilename(data.filename || data.name || 'audio')}_${Date.now()}.${ext}`;

    const payload = {
        type: data.type,
        vietnamese: data.vietnamese || '',
        xodang: data.xodang || '',
        readingContent: data.readingContent || data.name || '',
        audioData: base64Audio,
        mimeType,
        filename
    };

    // Google Apps Script requires mode: 'no-cors' from browsers
    await fetch(APP_CONFIG.CONTRIBUTE_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    return { success: true, message: 'File đã được gửi thành công' };
}

/**
 * Checks cache status for an array of audio driveIds.
 */
export async function getOfflineAudioStatus(driveIds: string[]): Promise<{ cached: number; total: number }> {
    if (typeof window === 'undefined' || !('caches' in window)) {
        return { cached: 0, total: driveIds.length };
    }
    try {
        const cache = await caches.open(APP_CONFIG.AUDIO_CACHE_NAME);
        let cached = 0;
        for (const id of driveIds) {
            const url = `./audio/${encodeURIComponent(id)}.webm`;
            const match = await cache.match(url);
            if (match) cached++;
        }
        return { cached, total: driveIds.length };
    } catch {
        return { cached: 0, total: driveIds.length };
    }
}

/**
 * Downloads audio files into the offline audio cache with progress callback.
 */
export async function downloadOfflineAudio(
    driveIds: string[],
    onProgress?: (loaded: number, total: number, percent: number) => void
): Promise<{ cached: number; total: number }> {
    if (typeof window === 'undefined' || !('caches' in window)) {
        return { cached: 0, total: driveIds.length };
    }
    const cache = await caches.open(APP_CONFIG.AUDIO_CACHE_NAME);
    const total = driveIds.length;
    let loaded = 0;
    let cached = 0;

    const concurrency = 5;
    const queue = [...driveIds];

    async function worker(): Promise<void> {
        while (queue.length > 0) {
            const id = queue.shift()!;
            const url = `./audio/${encodeURIComponent(id)}.webm`;
            const existing = await cache.match(url);
            if (existing) {
                cached++;
            } else {
                try {
                    const res = await fetch(url);
                    if (res.ok) {
                        await cache.put(url, res.clone());
                        cached++;
                    }
                } catch {
                    // Ignore single fetch failure
                }
            }
            loaded++;
            onProgress?.(loaded, total, Math.round((loaded / total) * 100));
        }
    }

    const workers = Array.from({ length: Math.min(concurrency, total) }, () => worker());
    await Promise.all(workers);
    return { cached, total };
}

