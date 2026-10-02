/**
 * Central configuration constants for Google Sheets API, Apps Script, and PWA caches.
 */

export const APP_CONFIG = {
    GOOGLE_API_KEY: (import.meta.env?.VITE_GOOGLE_API_KEY as string | undefined) || 'AIzaSyD757jS4SLR7-EzrPgrW9WrLQeD2DQExHw',
    SHEET_ID: '1Z59pDBu_tGwlYqUeS1-VJLpcHozp7LbxnC_-qhT3iHs',
    DICTIONARY_RANGE: 'Tu_Dien!A2:F',
    CHAT_RANGE: 'Data_Chat!A2:B',
    QUIZ_RANGE: 'Data_Tracnghiem!A2:H',
    CONTRIBUTE_URL: 'https://script.google.com/macros/s/AKfycbz9XYdorp6vsKFTCrqx2tUSJGecpOmCbrROqKfkHYSFn2WXieQtJXWCQvSJvxCk6yrs/exec',
    AUDIO_CACHE_NAME: 'tudien-audio',
    APP_CACHE_NAME: 'tudien-10.0.3',
    REQUEST_TIMEOUT_MS: 8000
} as const;

export const GOOGLE_CONFIG = {
    API_KEY: APP_CONFIG.GOOGLE_API_KEY,
    SHEET_ID: APP_CONFIG.SHEET_ID
} as const;

export const ALLOWED_SHEET_RANGES = new Set<string>([
    APP_CONFIG.DICTIONARY_RANGE,
    APP_CONFIG.CHAT_RANGE,
    APP_CONFIG.QUIZ_RANGE,
    'Tudien!A2:E',
    'Tracnghiem!A2:G',
    'Chat!A2:D'
]);
