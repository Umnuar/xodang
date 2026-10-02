import { describe, expect, it } from 'vitest';

describe('Tooling Smoke Test', () => {
  it('happy-dom environment is active', () => {
    expect(window).toBeDefined();
    expect(document).toBeDefined();
    const div = document.createElement('div');
    div.id = 'app';
    document.body.appendChild(div);
    expect(document.getElementById('app')).toBe(div);
  });

  it('CODE-05: enforces strict allowlist on Electron sheets:fetch ranges', async () => {
    const { ALLOWED_SHEET_RANGES } = await import('@/shared/constants/config');
    expect(ALLOWED_SHEET_RANGES.has('Tu_Dien!A2:F')).toBe(true);
    expect(ALLOWED_SHEET_RANGES.has('Data_Tracnghiem!A2:H')).toBe(true);
    expect(ALLOWED_SHEET_RANGES.has('Data_Chat!A2:B')).toBe(true);
    expect(ALLOWED_SHEET_RANGES.has('Tudien!A2:E')).toBe(true);

    // Disallowed / Malicious ranges
    expect(ALLOWED_SHEET_RANGES.has('AdminUsers!A1:Z100')).toBe(false);
    expect(ALLOWED_SHEET_RANGES.has('../../../etc/passwd')).toBe(false);
    expect(ALLOWED_SHEET_RANGES.has('')).toBe(false);
  });

  it('SEC-01: ensures GOOGLE_API_KEY does not contain hardcoded secret fallback', async () => {
    const { APP_CONFIG, GOOGLE_CONFIG } = await import('@/shared/constants/config');
    expect(APP_CONFIG.GOOGLE_API_KEY).not.toBe('AIzaSyD757jS4SLR7-EzrPgrW9WrLQeD2DQExHw');
    expect(GOOGLE_CONFIG.API_KEY).not.toBe('AIzaSyD757jS4SLR7-EzrPgrW9WrLQeD2DQExHw');
    expect(typeof APP_CONFIG.GOOGLE_API_KEY).toBe('string');
  });
});

