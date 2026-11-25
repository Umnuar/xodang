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

export function getAudioUrl(driveId: string): string {
    const cleanId = (driveId || '').trim();
    if (!cleanId || cleanId === 'null' || cleanId === 'undefined') {
        return '';
    }
    return `./audio/${encodeURIComponent(cleanId)}.webm`;
}

export function filterValidDriveIds(driveIds: Array<string | undefined | null>): string[] {
    const seen = new Set<string>();
    const validIds: string[] = [];
    for (const rawId of driveIds) {
        const cleanId = (rawId || '').trim();
        if (!cleanId || cleanId === 'null' || cleanId === 'undefined' || seen.has(cleanId)) {
            continue;
        }
        seen.add(cleanId);
        validIds.push(cleanId);
    }
    return validIds;
}

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

export function convertBlobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = typeof reader.result === 'string' ? reader.result : '';
            const base64 = result.split(',')[1] || '';
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function getExtensionFromMime(mimeType: string): string {
    const lower = (mimeType || '').toLowerCase();
    if (lower.includes('mp4') || lower.includes('m4a')) return 'm4a';
    if (lower.includes('mpeg') || lower.includes('mp3')) return 'mp3';
    if (lower.includes('ogg')) return 'ogg';
    if (lower.includes('wav')) return 'wav';
    if (lower.includes('flac')) return 'flac';
    return 'webm';
}

export function isAppsScriptEndpoint(url: string): boolean {
    return url.includes('script.google.com');
}

export async function sendContribution(data: {
    type: 'vocab' | 'voice';
    vietnamese?: string;
    xodang?: string;
    readingContent?: string;
    name?: string;
    filename?: string;
    blob: Blob;
    endpointUrl?: string;
}): Promise<{ success: boolean; message: string }> {
    const mimeType = data.blob.type || 'audio/webm';
    const ext = getExtensionFromMime(mimeType);
    const baseName = sanitizeFilename(data.filename || data.name || 'audio') || 'audio';
    const filename = `${baseName}_${Date.now()}.${ext}`;
    const targetUrl = (data.endpointUrl || APP_CONFIG.CONTRIBUTE_API_URL || APP_CONFIG.CONTRIBUTE_URL).trim();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), APP_CONFIG.REQUEST_TIMEOUT_MS);

    try {
        if (!isAppsScriptEndpoint(targetUrl)) {
            const formData = new FormData();
            formData.append('type', data.type);
            formData.append('vietnamese', data.vietnamese || '');
            formData.append('xodang', data.xodang || '');
            formData.append('readingContent', data.readingContent || data.name || '');
            formData.append('filename', filename);
            formData.append('audio', data.blob, filename);

            const response = await fetch(targetUrl, {
                method: 'POST',
                body: formData,
                signal: controller.signal
            });

            let parsed: { success?: boolean; message?: string } | null = null;
            try {
                parsed = (await response.json()) as { success?: boolean; message?: string };
            } catch {
                parsed = null;
            }

            if (!response.ok || (parsed && parsed.success === false)) {
                throw new Error(parsed?.message || `Upload failed (${response.status})`);
            }

            return {
                success: true,
                message: parsed?.message || 'Đã gửi đóng góp thành công'
            };
        }

        const base64Audio = await convertBlobToBase64(data.blob);
        const payload = {
            type: data.type,
            vietnamese: data.vietnamese || '',
            xodang: data.xodang || '',
            readingContent: data.readingContent || data.name || '',
            audioData: base64Audio,
            mimeType,
            filename
        };

        await fetch(targetUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(payload),
            signal: controller.signal
        });
    } finally {
        clearTimeout(timeoutId);
    }

    return { success: true, message: 'Đã gửi yêu cầu đóng góp tới máy chủ' };
}

async function getCachedAudioFilenameSet(cache: Cache): Promise<Set<string>> {
    const cachedFilenames = new Set<string>();
    const cachedRequests = await cache.keys();
    for (const req of cachedRequests) {
        const rawUrl = typeof req === 'string' ? req : req.url;
        const cleanPath = rawUrl.split('?')[0].split('#')[0];
        const filename = cleanPath.substring(cleanPath.lastIndexOf('/') + 1);
        if (filename) {
            cachedFilenames.add(filename);
        }
    }
    return cachedFilenames;
}

function isDriveIdCached(id: string, cachedFilenames: Set<string>): boolean {
    return cachedFilenames.has(`${encodeURIComponent(id)}.webm`) || cachedFilenames.has(`${id}.webm`);
}

export async function getOfflineAudioStatus(
    driveIds: Array<string | undefined | null>
): Promise<{ cached: number; total: number }> {
    const validIds = filterValidDriveIds(driveIds);
    if (typeof window === 'undefined' || !('caches' in window) || validIds.length === 0) {
        return { cached: 0, total: validIds.length };
    }
    try {
        const cache = await caches.open(APP_CONFIG.AUDIO_CACHE_NAME);
        const cachedFilenames = await getCachedAudioFilenameSet(cache);
        let cached = 0;
        for (const id of validIds) {
            if (isDriveIdCached(id, cachedFilenames)) {
                cached++;
            }
        }
        return { cached, total: validIds.length };
    } catch {
        return { cached: 0, total: validIds.length };
    }
}

export async function downloadOfflineAudio(
    driveIds: Array<string | undefined | null>,
    onProgress?: (loaded: number, total: number, percent: number) => void
): Promise<{ cached: number; total: number }> {
    const validIds = filterValidDriveIds(driveIds);
    const total = validIds.length;
    if (typeof window === 'undefined' || !('caches' in window) || total === 0) {
        return { cached: 0, total };
    }

    const cache = await caches.open(APP_CONFIG.AUDIO_CACHE_NAME);
    const cachedFilenames = await getCachedAudioFilenameSet(cache);
    let loaded = 0;
    let cached = 0;

    const concurrency = 5;
    const queue = [...validIds];

    async function worker(): Promise<void> {
        while (queue.length > 0) {
            const id = queue.shift()!;
            if (isDriveIdCached(id, cachedFilenames)) {
                cached++;
            } else {
                const url = getAudioUrl(id);
                if (url) {
                    try {
                        const res = await fetch(url);
                        if (res.ok) {
                            await cache.put(url, res.clone());
                            cached++;
                        }
                    } catch {
                    }
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
