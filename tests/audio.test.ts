import { describe, it, expect } from 'vitest';
import { getAudioUrl, playSyntheticBeep } from '@/renderer/services/audio.service';
import { sanitizeFilename } from '@/renderer/services/offline-sync.service';

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
});
