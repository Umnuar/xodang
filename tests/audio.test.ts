import { describe, it, expect } from 'vitest';
import { getAudioUrl, playSyntheticBeep } from '@/renderer/services/audio.service';
import { sanitizeFilename } from '@/renderer/services/offline-sync.service';
import { isValidAudioFile, MAX_AUDIO_FILE_SIZE } from '@/renderer/features/contribute/contribute';

describe('Audio & Filename Utility Tests', () => {
    it('constructs correct webm audio URLs', () => {
        expect(getAudioUrl('1a2b3c')).toBe('./audio/1a2b3c.webm');
        expect(getAudioUrl('  abc_123  ')).toBe('./audio/abc_123.webm');
        expect(getAudioUrl('')).toBe('');
    });

    it('plays synthetic beep without throwing error', () => {
        expect(() => playSyntheticBeep(440, 0.1)).not.toThrow();
    });

    it('sanitizes Vietnamese filename to ASCII-safe string', () => {
        expect(sanitizeFilename('Tiếng Xơ Đăng')).toBe('tieng_xo_dang');
        expect(sanitizeFilename('Đóng góp từ vựng mới!')).toBe('dong_gop_tu_vung_moi_');
        expect(sanitizeFilename('Bơ rơ ha')).toBe('bo_ro_ha');
    });

    it('validates audio files correctly and rejects malicious/oversized uploads (CODE-07)', () => {
        // Valid audio file under 10MB
        const validFile = { name: 'sample.mp3', size: 1024 * 1024, type: 'audio/mpeg' };
        expect(isValidAudioFile(validFile)).toEqual({ valid: true });

        const validWebm = { name: 'voice.webm', size: 500 * 1024, type: 'audio/webm' };
        expect(isValidAudioFile(validWebm)).toEqual({ valid: true });

        // Oversized file (> 10MB)
        const hugeFile = { name: 'huge_song.wav', size: MAX_AUDIO_FILE_SIZE + 1, type: 'audio/wav' };
        const hugeResult = isValidAudioFile(hugeFile);
        expect(hugeResult.valid).toBe(false);
        expect(hugeResult.reason).toContain('vượt quá 10MB');

        // Non-audio file extensions & MIME types (e.g. script, executable, html)
        const evilScript = { name: 'exploit.sh', size: 100, type: 'application/x-sh' };
        expect(isValidAudioFile(evilScript).valid).toBe(false);

        const evilHtml = { name: 'payload.html', size: 200, type: 'text/html' };
        expect(isValidAudioFile(evilHtml).valid).toBe(false);

        const evilExe = { name: 'trojan.exe', size: 5000, type: '' };
        expect(isValidAudioFile(evilExe).valid).toBe(false);
    });
});

