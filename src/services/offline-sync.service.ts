import { APP_CONFIG } from '@/shared/constants/config';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys';
import { getStorageItemByKey, setStorageItemByKey } from './storage.service';

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
    const timeoutId = setTimeout(() => controller.abort(), APP_CONFIG.UPLOAD_TIMEOUT_MS);

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

export interface AudioPackIndex {
    version: string;
    totalBytes: number;
    count: number;
    files: Record<string, [number, number, string]>;
}

const AUDIO_PACK_INDEX_URL = './audio-pack.index.json';
const AUDIO_PACK_BIN_URL = './audio-pack.bin';
const PACK_DOWNLOAD_THRESHOLD = 30;

let activeAudioSync: Promise<{ cached: number; total: number }> | null = null;
const activeProgressListeners = new Set<(loaded: number, total: number, percent: number) => void>();

export function shouldAutoDownloadOfflineAudio(): boolean {
    if (typeof window === 'undefined' || !('caches' in window)) {
        return false;
    }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        return false;
    }
    const nav = typeof navigator !== 'undefined'
        ? (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
        : undefined;
    const conn = nav?.connection;
    if (conn?.saveData === true) {
        return false;
    }
    if (conn?.effectiveType === 'slow-2g' || conn?.effectiveType === '2g') {
        return false;
    }
    return true;
}

async function fetchAudioPackIndex(): Promise<AudioPackIndex | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), Math.min(APP_CONFIG.REQUEST_TIMEOUT_MS, 5000));
    try {
        const res = await fetch(AUDIO_PACK_INDEX_URL, {
            cache: 'no-store',
            signal: controller.signal
        });
        if (!res.ok) return null;
        const parsed = (await res.json()) as Partial<AudioPackIndex>;
        if (!parsed || typeof parsed.version !== 'string' || !parsed.files || typeof parsed.files !== 'object') {
            return null;
        }
        return {
            version: parsed.version,
            totalBytes: typeof parsed.totalBytes === 'number' ? parsed.totalBytes : 0,
            count: typeof parsed.count === 'number' ? parsed.count : Object.keys(parsed.files).length,
            files: parsed.files as Record<string, [number, number, string]>
        };
    } catch {
        return null;
    } finally {
        clearTimeout(timeoutId);
    }
}

async function readResponseBytes(
    response: Response,
    totalBytesHint: number,
    onFraction: (fraction: number) => void
): Promise<ArrayBuffer> {
    const contentLenHeader = response.headers?.get('content-length');
    const expectedTotal = contentLenHeader ? parseInt(contentLenHeader, 10) || totalBytesHint : totalBytesHint;
    if (!response.body || typeof response.body.getReader !== 'function') {
        const buf = await response.arrayBuffer();
        onFraction(1);
        return buf;
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value && value.byteLength > 0) {
            chunks.push(value);
            received += value.byteLength;
            if (expectedTotal > 0) {
                onFraction(Math.min(1, received / expectedTotal));
            }
        }
    }

    const combined = new Uint8Array(received);
    let cursor = 0;
    for (const chunk of chunks) {
        combined.set(chunk, cursor);
        cursor += chunk.byteLength;
    }
    onFraction(1);
    return combined.buffer;
}

async function pruneObsoleteAudioCache(
    cache: Cache,
    validIdSet: Set<string>,
    storedHashes: Record<string, string>
): Promise<boolean> {
    let hashesChanged = false;
    const requests = await cache.keys();
    for (const req of requests) {
        const rawUrl = typeof req === 'string' ? req : req.url;
        const cleanPath = rawUrl.split('?')[0].split('#')[0];
        const filename = cleanPath.substring(cleanPath.lastIndexOf('/') + 1);
        if (!filename.endsWith('.webm')) continue;
        const rawStem = filename.slice(0, -5);
        let decodedStem = rawStem;
        try {
            decodedStem = decodeURIComponent(rawStem);
        } catch {
            decodedStem = rawStem;
        }
        if (!validIdSet.has(rawStem) && !validIdSet.has(decodedStem)) {
            if (typeof cache.delete === 'function') {
                await cache.delete(req);
            }
        }
    }
    for (const key of Object.keys(storedHashes)) {
        if (!validIdSet.has(key)) {
            delete storedHashes[key];
            hashesChanged = true;
        }
    }
    return hashesChanged;
}

function isEntryUpToDate(
    id: string,
    cachedFilenames: Set<string>,
    storedHashes: Record<string, string>,
    packIndex: AudioPackIndex | null
): boolean {
    if (!isDriveIdCached(id, cachedFilenames)) {
        return false;
    }
    const indexEntry = packIndex?.files[id];
    if (indexEntry && storedHashes[id] !== indexEntry[2]) {
        return false;
    }
    return true;
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

export async function hasOfflineAudioUpdates(
    driveIds: Array<string | undefined | null>
): Promise<{ needsSync: boolean; cached: number; total: number }> {
    const validIds = filterValidDriveIds(driveIds);
    const total = validIds.length;
    if (typeof window === 'undefined' || !('caches' in window) || total === 0) {
        return { needsSync: false, cached: 0, total };
    }
    try {
        const cache = await caches.open(APP_CONFIG.AUDIO_CACHE_NAME);
        const cachedFilenames = await getCachedAudioFilenameSet(cache);
        const storedHashes = getStorageItemByKey<Record<string, string>>(STORAGE_KEYS.AUDIO_PACK_HASHES, {});
        const isOnline = typeof navigator === 'undefined' || navigator.onLine !== false;
        const packIndex = isOnline ? await fetchAudioPackIndex() : null;
        let upToDate = 0;
        for (const id of validIds) {
            if (isEntryUpToDate(id, cachedFilenames, storedHashes, packIndex)) {
                upToDate++;
            }
        }
        return {
            needsSync: upToDate < total,
            cached: upToDate,
            total
        };
    } catch {
        return { needsSync: false, cached: 0, total };
    }
}

function notifyProgress(loaded: number, total: number, percent: number): void {
    activeProgressListeners.forEach(listener => listener(loaded, total, percent));
}

async function fetchIndividualAudioIds(
    ids: string[],
    cache: Cache,
    storedHashes: Record<string, string>,
    packIndex: AudioPackIndex | null,
    baseLoaded: number,
    total: number
): Promise<number> {
    if (ids.length === 0) return 0;
    const queue = [...ids];
    let loaded = baseLoaded;
    let added = 0;
    const concurrency = 5;

    async function worker(): Promise<void> {
        while (queue.length > 0) {
            const id = queue.shift()!;
            const url = getAudioUrl(id);
            if (url) {
                try {
                    const res = await fetch(url, { cache: 'no-store' });
                    if (res.ok) {
                        await cache.put(url, res.clone());
                        const entry = packIndex?.files[id];
                        if (entry) {
                            storedHashes[id] = entry[2];
                        }
                        added++;
                        loaded++;
                        notifyProgress(loaded, total, Math.round((loaded / total) * 100));
                    }
                } catch {
                }
            }
        }
    }

    const workers = Array.from({ length: Math.min(concurrency, ids.length) }, () => worker());
    await Promise.all(workers);
    return added;
}

async function executeOfflineAudioDownload(
    validIds: string[]
): Promise<{ cached: number; total: number }> {
    const total = validIds.length;
    const validIdSet = new Set(validIds);
    const cache = await caches.open(APP_CONFIG.AUDIO_CACHE_NAME);
    const cachedFilenames = await getCachedAudioFilenameSet(cache);
    const storedHashes = getStorageItemByKey<Record<string, string>>(STORAGE_KEYS.AUDIO_PACK_HASHES, {});
    const packIndex = await fetchAudioPackIndex();

    let upToDateCount = 0;
    const needsDownload: string[] = [];
    for (const id of validIds) {
        if (isEntryUpToDate(id, cachedFilenames, storedHashes, packIndex)) {
            upToDateCount++;
        } else {
            needsDownload.push(id);
        }
    }

    if (needsDownload.length === 0) {
        const pruned = await pruneObsoleteAudioCache(cache, validIdSet, storedHashes);
        if (pruned) {
            setStorageItemByKey(STORAGE_KEYS.AUDIO_PACK_HASHES, storedHashes);
        }
        notifyProgress(total, total, 100);
        return { cached: total, total };
    }

    let cached = upToDateCount;
    const packableIds = packIndex
        ? needsDownload.filter(id => Boolean(packIndex.files[id]))
        : [];
    const remainingAfterPack = packIndex
        ? needsDownload.filter(id => !packIndex.files[id])
        : needsDownload;

    let usedPack = false;
    if (packIndex && packableIds.length >= PACK_DOWNLOAD_THRESHOLD) {
        try {
            const packRes = await fetch(AUDIO_PACK_BIN_URL, { cache: 'no-store' });
            if (packRes.ok) {
                const packBuffer = await readResponseBytes(packRes, packIndex.totalBytes, (fraction) => {
                    const percent = Math.round(fraction * 60);
                    notifyProgress(upToDateCount, total, percent);
                });

                const queue = [...packableIds];
                let processedPack = 0;
                const putWorker = async (): Promise<void> => {
                    while (queue.length > 0) {
                        const id = queue.shift()!;
                        const entry = packIndex.files[id];
                        if (!entry) continue;
                        const [offset, len, hash] = entry;
                        if (offset >= 0 && len > 0 && offset + len <= packBuffer.byteLength) {
                            const slice = packBuffer.slice(offset, offset + len);
                            const response = new Response(slice, {
                                status: 200,
                                headers: {
                                    'Content-Type': 'audio/webm',
                                    'Content-Length': String(len)
                                }
                            });
                            await cache.put(getAudioUrl(id), response);
                            storedHashes[id] = hash;
                            cached++;
                        }
                        processedPack++;
                        const writeFraction = processedPack / packableIds.length;
                        const overallLoaded = upToDateCount + processedPack;
                        const overallPercent = Math.min(99, Math.round(60 + writeFraction * 35));
                        notifyProgress(overallLoaded, total, overallPercent);
                    }
                };

                const putWorkers = Array.from({ length: Math.min(20, packableIds.length) }, () => putWorker());
                await Promise.all(putWorkers);
                usedPack = true;
            }
        } catch {
            usedPack = false;
        }
    }

    if (usedPack) {
        if (remainingAfterPack.length > 0) {
            cached += await fetchIndividualAudioIds(
                remainingAfterPack,
                cache,
                storedHashes,
                packIndex,
                upToDateCount + packableIds.length,
                total
            );
        } else {
            notifyProgress(total, total, 100);
        }
    } else {
        cached += await fetchIndividualAudioIds(
            needsDownload,
            cache,
            storedHashes,
            packIndex,
            upToDateCount,
            total
        );
    }

    if (cached >= total) {
        await pruneObsoleteAudioCache(cache, validIdSet, storedHashes);
    }
    setStorageItemByKey(STORAGE_KEYS.AUDIO_PACK_HASHES, storedHashes);
    return { cached, total };
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
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        return getOfflineAudioStatus(validIds);
    }

    if (onProgress) {
        activeProgressListeners.add(onProgress);
    }

    if (!activeAudioSync) {
        activeAudioSync = executeOfflineAudioDownload(validIds).finally(() => {
            activeAudioSync = null;
        });
    }

    try {
        return await activeAudioSync;
    } finally {
        if (onProgress) {
            activeProgressListeners.delete(onProgress);
        }
    }
}
