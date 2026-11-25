import { describe, it, expect, vi, afterEach } from 'vitest';
import {
    getAudioUrl,
    filterValidDriveIds,
    getOfflineAudioStatus,
    sanitizeFilename,
    sendContribution
} from '@/renderer/services/offline-sync.service';
import { isValidAudioFile, MAX_AUDIO_FILE_SIZE } from '@/renderer/features/contribute/contribute';

describe('Audio & Filename Utility Tests', () => {
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
});
