import { describe, it, expect, vi, afterEach } from 'vitest';
import {
    getAudioUrl,
    filterValidDriveIds,
    getOfflineAudioStatus,
    sanitizeFilename
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
});
