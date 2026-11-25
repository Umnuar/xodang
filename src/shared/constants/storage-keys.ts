export const STORAGE_KEYS = {
    HAS_SEEN_INTRO: 'hasSeenIntro',
    DARK_MODE: 'darkMode',
    HAS_OPENED_CHAT: 'hasOpenedChat',
    STUDY_PROGRESS_BY_TOPIC: 'studyProgressByTopic',
    GAME_SFX: 'xedang_sfx',
    GAME_OFFLINE_DATA: 'xedang_offline_data',
    GAME_USERS: 'xedang_users',
    GAME_CURRENT_USER: 'xedang_current_user',
    GAME_CERTIFICATES: 'xedang_certificates',
    SHEETS_CACHE_PREFIX: 'xedang_sheets_cache_',
    AUDIO_PACK_HASHES: 'xedang_audio_hashes'
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
