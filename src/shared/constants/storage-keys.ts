/**
 * Storage keys used across the application (localStorage and sessionStorage).
 * Extracted and validated from index.html, intro.html, game.html, and offline.html.
 */

export const STORAGE_KEYS = {
    // App & Shell
    HAS_SEEN_INTRO: 'hasSeenIntro',
    DARK_MODE: 'darkMode',
    HAS_OPENED_CHAT: 'hasOpenedChat',
    STUDY_PROGRESS_BY_TOPIC: 'studyProgressByTopic',

    // Intro page legacy key
    INTRO_SEEN: 'introSeen',

    // Offline page (sessionStorage)
    OFFLINE_PAGE_VISITED: 'offlinePageVisited',

    // Game keys (localStorage)
    GAME_MAX_LEVELS_CACHE: 'xedang_max_levels_cache',
    GAME_MAX_LEVELS_TIME: 'xedang_max_levels_time',
    GAME_LAST_LEVEL_CALCULATION: 'xedang_last_level_calculation',
    GAME_LAST_SEEN_LEVELS: 'xedang_last_seen_levels',
    GAME_BGM: 'xedang_bgm',
    GAME_SFX: 'xedang_sfx',
    GAME_CACHE_TIMESTAMP: 'xedang_cache_timestamp',
    GAME_NEEDS_REFRESH: 'xedang_needs_refresh',
    GAME_OFFLINE_DATA: 'xedang_offline_data',
    GAME_OFFLINE_TIMESTAMP: 'xedang_offline_timestamp',
    GAME_USERS: 'xedang_users',
    GAME_CURRENT_USER: 'xedang_current_user',
    GAME_LAST_GAME_STATE: 'xedang_last_game_state',
    GAME_TUTORIAL_SHOWN: 'xedang_tutorial_shown'
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
