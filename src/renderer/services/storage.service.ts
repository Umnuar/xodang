import { STORAGE_KEYS, type StorageKey } from '@/shared/constants/storage-keys';

export function getStorageItemByKey<T>(key: string, fallback: T): T {
    try {
        if (typeof window === 'undefined' || !window.localStorage) return fallback;
        const raw = window.localStorage.getItem(key);
        if (raw === null) return fallback;
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

export function setStorageItemByKey<T>(key: string, value: T): boolean {
    try {
        if (typeof window === 'undefined' || !window.localStorage) return false;
        window.localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        return false;
    }
}

export function removeStorageKeysByPrefix(prefix: string): void {
    try {
        if (typeof window === 'undefined' || !window.localStorage) return;
        const keysToRemove: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
            const key = window.localStorage.key(i);
            if (key && key.startsWith(prefix)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach((key) => window.localStorage.removeItem(key));
    } catch {
        return;
    }
}

export function getStorageItem<T>(key: StorageKey, fallback: T): T {
    return getStorageItemByKey(key, fallback);
}

export function getRawStorageItem(key: StorageKey): string | null {
    try {
        if (typeof window === 'undefined' || !window.localStorage) return null;
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

export function setStorageItem<T>(key: StorageKey, value: T): boolean {
    return setStorageItemByKey(key, value);
}

export function setRawStorageItem(key: StorageKey, value: string): boolean {
    try {
        if (typeof window === 'undefined' || !window.localStorage) return false;
        window.localStorage.setItem(key, value);
        return true;
    } catch {
        return false;
    }
}

export function removeStorageItem(key: StorageKey): void {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.removeItem(key);
        }
    } catch {
        return;
    }
}

export function isDarkMode(): boolean {
    return getRawStorageItem(STORAGE_KEYS.DARK_MODE) === 'true';
}

export function setDarkMode(enabled: boolean): void {
    setRawStorageItem(STORAGE_KEYS.DARK_MODE, enabled ? 'true' : 'false');
}

export function hasSeenIntro(): boolean {
    return getRawStorageItem(STORAGE_KEYS.HAS_SEEN_INTRO) === 'true';
}

export function setHasSeenIntro(seen: boolean = true): void {
    setRawStorageItem(STORAGE_KEYS.HAS_SEEN_INTRO, seen ? 'true' : 'false');
}

export function hasOpenedChat(): boolean {
    return getRawStorageItem(STORAGE_KEYS.HAS_OPENED_CHAT) === 'true';
}

export function setHasOpenedChat(opened: boolean = true): void {
    setRawStorageItem(STORAGE_KEYS.HAS_OPENED_CHAT, opened ? 'true' : 'false');
}

export function loadStudyProgress(): Map<string, Set<string>> {
    const raw = getRawStorageItem(STORAGE_KEYS.STUDY_PROGRESS_BY_TOPIC);
    const progressMap = new Map<string, Set<string>>();

    if (!raw) return progressMap;

    try {
        const parsed = JSON.parse(raw);
        for (const [topic, cardsVal] of Object.entries(parsed)) {
            let cardsArr: string[] = [];
            if (typeof cardsVal === 'string') {
                try {
                    cardsArr = JSON.parse(cardsVal);
                } catch {
                    cardsArr = [];
                }
            } else if (Array.isArray(cardsVal)) {
                cardsArr = cardsVal;
            }
            progressMap.set(topic, new Set(cardsArr.map(String)));
        }
    } catch (e) {
        console.error('Failed to parse study progress:', e);
    }

    return progressMap;
}

export function saveStudyProgress(progressMap: Map<string, Set<string>>): boolean {
    try {
        const payload: Record<string, string> = {};
        progressMap.forEach((cardsSet, topic) => {
            payload[topic] = JSON.stringify(Array.from(cardsSet));
        });
        return setRawStorageItem(STORAGE_KEYS.STUDY_PROGRESS_BY_TOPIC, JSON.stringify(payload));
    } catch {
        return false;
    }
}
