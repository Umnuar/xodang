const viteEnv = (typeof import.meta !== 'undefined' && (import.meta as { env?: Record<string, string | undefined> }).env) || {};
const nodeEnv = (typeof process !== 'undefined' && process.env) ? process.env : {};
const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz9XYdorp6vsKFTCrqx2tUSJGecpOmCbrROqKfkHYSFn2WXieQtJXWCQvSJvxCk6yrs/exec';
const stripTrailingSlashes = (value: string): string => value.replace(/\/+$/, '');

export const APP_CONFIG = {
    GOOGLE_API_KEY: viteEnv.VITE_GOOGLE_API_KEY || nodeEnv.VITE_GOOGLE_API_KEY || nodeEnv.GOOGLE_SHEETS_API_KEY || '',
    SHEET_ID: viteEnv.VITE_SHEET_ID || nodeEnv.VITE_SHEET_ID || '1Z59pDBu_tGwlYqUeS1-VJLpcHozp7LbxnC_-qhT3iHs',
    DICTIONARY_RANGE: 'Tu_Dien!A2:F',
    CHAT_RANGE: 'Data_Chat!A2:B',
    QUIZ_RANGE: 'Data_Tracnghiem!A2:H',
    CONTRIBUTE_URL: DEFAULT_APPS_SCRIPT_URL,
    CONTRIBUTE_API_URL: viteEnv.VITE_CONTRIBUTE_API_URL || nodeEnv.VITE_CONTRIBUTE_API_URL || DEFAULT_APPS_SCRIPT_URL,
    DATA_BASE_URL: stripTrailingSlashes(viteEnv.VITE_DATA_BASE_URL || nodeEnv.VITE_DATA_BASE_URL || './data'),
    AUDIO_BASE_URL: stripTrailingSlashes(viteEnv.VITE_AUDIO_BASE_URL || nodeEnv.VITE_AUDIO_BASE_URL || './audio'),
    AUDIO_CACHE_NAME: 'tudien-audio',
    APP_CACHE_NAME: 'tudien-modular-v10.0.4',
    REQUEST_TIMEOUT_MS: 8000,
    UPLOAD_TIMEOUT_MS: 45000
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
