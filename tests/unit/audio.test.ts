import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    getAudioUrl,
    filterValidDriveIds,
    getOfflineAudioStatus,
    hasOfflineAudioUpdates,
    downloadOfflineAudio,
    shouldAutoDownloadOfflineAudio,
    sanitizeFilename,
    sendContribution
} from '@/services/offline-sync.service';
import { isValidAudioFile, MAX_AUDIO_FILE_SIZE } from '@/features/contribute/contribute';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys';

describe('Audio & Filename Utility Tests', () => {
    beforeEach(() => {
        if (!window.localStorage || typeof window.localStorage.clear !== 'function') {
            const store = new Map<string, string>();
            Object.defineProperty(window, 'localStorage', {
                value: {
                    getItem: (k: string) => store.get(k) ?? null,
                    setItem: (k: string, v: string) => store.set(k, String(v)),
                    removeItem: (k: string) => store.delete(k),
                    clear: () => store.clear(),
                    get length() { return store.size; },
                    key: (i: number) => Array.from(store.keys())[i] ?? null
                },
                configurable: true,
                writable: true
            });
        }
        window.localStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('constructs correct webm audio URLs and filters invalid driveIds', () => {
        expect(getAudioUrl('1a2b3c')).toBe('./audio/1a2b3c.webm');
        expect(getAudioUrl('  abc_123  ')).toBe('./audio/abc_123.webm');
        expect(getAudioUrl('')).toBe('');
        expect(getAudioUrl('null')).toBe('');
        expect(getAudioUrl('undefined')).toBe('');

        expect(filterValidDriveIds(['a', 'null', 'undefined', '  ', 'a', 'b'])).toEqual(['a', 'b']);
    });

    it('checks offline audio cache status in O(1) using a single cache.keys() call', async () => {
        const keysMock = vi.fn().mockResolvedValue([
            { url: 'https://umnuar.github.io/xodang/audio/id1.webm' },
            { url: './audio/id3.webm' }
        ]);
        const matchMock = vi.fn();

        vi.stubGlobal('caches', {
            open: vi.fn().mockResolvedValue({
                keys: keysMock,
                match: matchMock
            })
        });

        const status = await getOfflineAudioStatus(['id1', 'id2', 'id3', 'null', '']);
        expect(keysMock).toHaveBeenCalledTimes(1);
        expect(matchMock).not.toHaveBeenCalled();
        expect(status).toEqual({ cached: 2, total: 3 });
    });

    it('sanitizes Vietnamese filename to ASCII-safe string', () => {
        expect(sanitizeFilename('Tiếng Xơ Đăng')).toBe('tieng_xo_dang');
        expect(sanitizeFilename('Đóng góp từ vựng mới!')).toBe('dong_gop_tu_vung_moi_');
        expect(sanitizeFilename('Bơ rơ ha')).toBe('bo_ro_ha');
    });

    it('validates audio files correctly and rejects malicious/oversized uploads (CODE-07)', () => {
        const validFile = { name: 'sample.mp3', size: 1024 * 1024, type: 'audio/mpeg' };
        expect(isValidAudioFile(validFile)).toEqual({ valid: true });

        const validWebm = { name: 'voice.webm', size: 500 * 1024, type: 'audio/webm' };
        expect(isValidAudioFile(validWebm)).toEqual({ valid: true });

        const hugeFile = { name: 'huge_song.wav', size: MAX_AUDIO_FILE_SIZE + 1, type: 'audio/wav' };
        const hugeResult = isValidAudioFile(hugeFile);
        expect(hugeResult.valid).toBe(false);
        expect(hugeResult.reason).toContain('vượt quá 10MB');

        const evilScript = { name: 'exploit.sh', size: 100, type: 'application/x-sh' };
        expect(isValidAudioFile(evilScript).valid).toBe(false);

        const evilHtml = { name: 'payload.html', size: 200, type: 'text/html' };
        expect(isValidAudioFile(evilHtml).valid).toBe(false);

        const evilExe = { name: 'trojan.exe', size: 5000, type: '' };
        expect(isValidAudioFile(evilExe).valid).toBe(false);
    });

    it('sends multipart FormData to Rust contribute API and surfaces HTTP errors', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            status: 202,
            json: async () => ({
                success: true,
                message: 'Đã nhận đóng góp và đang đồng bộ sang Google Sheet.'
            })
        });
        vi.stubGlobal('fetch', fetchMock);

        const blob = new Blob([new Uint8Array([0x1A, 0x45, 0xDF, 0xA3])], { type: 'audio/webm' });
        const result = await sendContribution({
            type: 'vocab',
            vietnamese: 'Nhà',
            xodang: 'Hnam',
            name: 'Nhà',
            blob,
            endpointUrl: 'https://contribute.example.com/api/contributions'
        });

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe('https://contribute.example.com/api/contributions');
        expect(init.method).toBe('POST');
        expect(init.mode).toBeUndefined();
        expect(init.body).toBeInstanceOf(FormData);
        const bodyForm = init.body as FormData;
        expect(bodyForm.get('type')).toBe('vocab');
        expect(bodyForm.get('vietnamese')).toBe('Nhà');
        expect(bodyForm.get('xodang')).toBe('Hnam');
        expect(bodyForm.get('audio')).toBeTruthy();
        expect(result.message).toContain('Google Sheet');

        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: false,
            status: 415,
            json: async () => ({
                success: false,
                message: 'Định dạng file âm thanh không hợp lệ hoặc sai magic bytes.'
            })
        }));

        await expect(sendContribution({
            type: 'voice',
            readingContent: 'Đak',
            blob,
            endpointUrl: 'https://contribute.example.com/api/contributions'
        })).rejects.toThrow('magic bytes');
    });

    it('preserves Apps Script no-cors Base64 JSON fallback for legacy endpoint', async () => {
        const fetchMock = vi.fn().mockResolvedValue({ ok: true });
        vi.stubGlobal('fetch', fetchMock);

        const blob = new Blob(['test-audio'], { type: 'audio/webm' });
        await sendContribution({
            type: 'voice',
            readingContent: 'Test',
            blob,
            endpointUrl: 'https://script.google.com/macros/s/test/exec'
        });

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [, init] = fetchMock.mock.calls[0];
        expect(init.mode).toBe('no-cors');
        expect(init.headers['Content-Type']).toBe('text/plain;charset=utf-8');
        const payload = JSON.parse(init.body as string);
        expect(payload.readingContent).toBe('Test');
        expect(typeof payload.audioData).toBe('string');
        expect(payload.audioData.length).toBeGreaterThan(0);
    });

    it('downloads binary audio-pack.bin in 1 request when missing >= 30 audio files', async () => {
        const ids = Array.from({ length: 35 }, (_, idx) => `word_${idx}`);
        const chunks = ids.map((id, idx) => new Uint8Array([0x1A, 0x45, idx & 0xff, id.length]));
        const totalBytes = chunks.reduce((sum, c) => sum + c.byteLength, 0);
        const packed = new Uint8Array(totalBytes);
        const files: Record<string, [number, number, string]> = {};
        let offset = 0;
        ids.forEach((id, idx) => {
            packed.set(chunks[idx], offset);
            files[id] = [offset, chunks[idx].byteLength, `hash_${idx}`];
            offset += chunks[idx].byteLength;
        });

        const storedResponses = new Map<string, Response>();
        const putMock = vi.fn().mockImplementation(async (key: string, res: Response) => {
            storedResponses.set(key, res);
        });
        vi.stubGlobal('caches', {
            open: vi.fn().mockResolvedValue({
                keys: vi.fn().mockResolvedValue([]),
                put: putMock,
                delete: vi.fn().mockResolvedValue(true)
            })
        });

        const fetchMock = vi.fn().mockImplementation(async (url: string) => {
            if (url === './audio-pack.index.json') {
                return {
                    ok: true,
                    json: async () => ({ version: 'v1', totalBytes, count: ids.length, files })
                };
            }
            if (url === './audio-pack.bin') {
                return {
                    ok: true,
                    headers: { get: () => String(totalBytes) },
                    arrayBuffer: async () => packed.buffer.slice(0)
                };
            }
            throw new Error(`Unexpected individual fetch: ${url}`);
        });
        vi.stubGlobal('fetch', fetchMock);

        const progressEvents: number[] = [];
        const result = await downloadOfflineAudio(ids, (_loaded, _total, percent) => {
            progressEvents.push(percent);
        });

        expect(result).toEqual({ cached: 35, total: 35 });
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(putMock).toHaveBeenCalledTimes(35);
        const firstSlice = new Uint8Array(await storedResponses.get('./audio/word_0.webm')!.arrayBuffer());
        expect(Array.from(firstSlice)).toEqual(Array.from(chunks[0]));
        const savedHashes = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.AUDIO_PACK_HASHES) || '{}');
        expect(savedHashes.word_34).toBe('hash_34');
        expect(progressEvents[progressEvents.length - 1]).toBe(100);
    });

    it('downloads only delta files when < 30 items missing or hash-changed and prunes obsolete keys', async () => {
        const upToDateIds = Array.from({ length: 34 }, (_, idx) => `keep_${idx}`);
        const staleId = 'stale_1';
        const brandNewId = 'new_1';
        const allIds = [...upToDateIds, staleId, brandNewId];

        const initialHashes: Record<string, string> = {};
        const files: Record<string, [number, number, string]> = {};
        upToDateIds.forEach((id, idx) => {
            initialHashes[id] = `h_${idx}`;
            files[id] = [idx * 4, 4, `h_${idx}`];
        });
        initialHashes[staleId] = 'old_hash';
        files[staleId] = [1000, 4, 'new_hash'];
        files[brandNewId] = [1004, 4, 'brand_new_hash'];
        window.localStorage.setItem(STORAGE_KEYS.AUDIO_PACK_HASHES, JSON.stringify(initialHashes));

        const cachedReqs = [
            ...upToDateIds.map(id => ({ url: `./audio/${id}.webm` })),
            { url: `./audio/${staleId}.webm` },
            { url: './audio/removed_old.webm' }
        ];
        const deleteMock = vi.fn().mockResolvedValue(true);
        const putMock = vi.fn().mockResolvedValue(undefined);
        vi.stubGlobal('caches', {
            open: vi.fn().mockResolvedValue({
                keys: vi.fn().mockResolvedValue(cachedReqs),
                put: putMock,
                delete: deleteMock
            })
        });

        const fetchMock = vi.fn().mockImplementation(async (url: string) => {
            if (url === './audio-pack.index.json') {
                return {
                    ok: true,
                    json: async () => ({ version: 'v2', totalBytes: 1008, count: allIds.length, files })
                };
            }
            if (url === `./audio/${staleId}.webm` || url === `./audio/${brandNewId}.webm`) {
                return {
                    ok: true,
                    clone: () => ({ ok: true })
                };
            }
            throw new Error(`Unexpected fetch URL: ${url}`);
        });
        vi.stubGlobal('fetch', fetchMock);

        const updateCheck = await hasOfflineAudioUpdates(allIds);
        expect(updateCheck).toEqual({ needsSync: true, cached: 34, total: 36 });

        const result = await downloadOfflineAudio(allIds);
        expect(result).toEqual({ cached: 36, total: 36 });
        expect(fetchMock).toHaveBeenCalledTimes(4);
        expect(fetchMock.mock.calls.some(c => c[0] === './audio-pack.bin')).toBe(false);
        expect(putMock).toHaveBeenCalledTimes(2);
        expect(deleteMock).toHaveBeenCalledWith({ url: './audio/removed_old.webm' });
        const savedHashes = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.AUDIO_PACK_HASHES) || '{}');
        expect(savedHashes[staleId]).toBe('new_hash');
        expect(savedHashes[brandNewId]).toBe('brand_new_hash');
    });

    it('falls back cleanly to individual fetches when audio-pack.index.json is unavailable', async () => {
        const putMock = vi.fn().mockResolvedValue(undefined);
        vi.stubGlobal('caches', {
            open: vi.fn().mockResolvedValue({
                keys: vi.fn().mockResolvedValue([]),
                put: putMock,
                delete: vi.fn().mockResolvedValue(true)
            })
        });

        const fetchMock = vi.fn().mockImplementation(async (url: string) => {
            if (url === './audio-pack.index.json') {
                return { ok: false, status: 404 };
            }
            return { ok: true, clone: () => ({ ok: true }) };
        });
        vi.stubGlobal('fetch', fetchMock);

        const result = await downloadOfflineAudio(['a1', 'a2']);
        expect(result).toEqual({ cached: 2, total: 2 });
        expect(putMock).toHaveBeenCalledTimes(2);
    });

    it('gates auto-download based on CacheStorage support, online status, and network conditions', () => {
        vi.stubGlobal('caches', {});
        Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
        Object.defineProperty(navigator, 'connection', {
            value: { saveData: false, effectiveType: '4g' },
            configurable: true
        });
        expect(shouldAutoDownloadOfflineAudio()).toBe(true);

        Object.defineProperty(navigator, 'connection', {
            value: { saveData: true, effectiveType: '4g' },
            configurable: true
        });
        expect(shouldAutoDownloadOfflineAudio()).toBe(false);

        Object.defineProperty(navigator, 'connection', {
            value: { saveData: false, effectiveType: '2g' },
            configurable: true
        });
        expect(shouldAutoDownloadOfflineAudio()).toBe(false);

        Object.defineProperty(navigator, 'connection', {
            value: { saveData: false, effectiveType: '4g' },
            configurable: true
        });
        Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
        expect(shouldAutoDownloadOfflineAudio()).toBe(false);
    });
});
