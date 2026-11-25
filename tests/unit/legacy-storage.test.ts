import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
    loadStudyProgress,
    saveStudyProgress,
    isDarkMode,
    setDarkMode,
    hasSeenIntro,
    setHasSeenIntro,
    hasOpenedChat,
    setHasOpenedChat,
    getStorageItem,
    setStorageItem
} from '@/services/storage.service';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys';
import { OnboardingController } from '@/features/onboarding/onboarding';
import onboardingHtml from '@/features/onboarding/onboarding.html?raw';
import { soundEffects } from '@/features/games/sound-effects';
import { getLeaderboard } from '@/features/games/leaderboard';
import { getSavedCertificates, saveCertificate } from '@/features/games/certificate';

describe('Storage Service & Legacy Migration Tests', () => {
    beforeEach(() => {
        if (!window.localStorage || typeof window.localStorage.clear !== 'function') {
            const store = new Map<string, string>();
            const mockStorage = {
                getItem: (k: string) => store.get(k) ?? null,
                setItem: (k: string, v: string) => store.set(k, String(v)),
                removeItem: (k: string) => store.delete(k),
                clear: () => store.clear(),
                get length() { return store.size; },
                key: (i: number) => Array.from(store.keys())[i] ?? null
            };
            Object.defineProperty(window, 'localStorage', {
                value: mockStorage,
                configurable: true,
                writable: true
            });
        }
        window.localStorage.clear();
    });

    it('reads legacy double-JSON-encoded studyProgressByTopic correctly', () => {
        // Simulate legacy format created by index.html line 3245
        // localStorage.setItem('studyProgressByTopic', JSON.stringify({ topic1: JSON.stringify(['1', '2', '3']) }))
        const legacyPayload = {
            'Gia đình': JSON.stringify(['card1', 'card2']),
            'Thiên nhiên': JSON.stringify(['card3', 'card4', 'card5'])
        };
        window.localStorage.setItem(STORAGE_KEYS.STUDY_PROGRESS_BY_TOPIC, JSON.stringify(legacyPayload));

        const progressMap = loadStudyProgress();

        expect(progressMap.size).toBe(2);
        expect(progressMap.has('Gia đình')).toBe(true);
        expect(progressMap.get('Gia đình')?.has('card1')).toBe(true);
        expect(progressMap.get('Gia đình')?.has('card2')).toBe(true);
        expect(progressMap.get('Thiên nhiên')?.size).toBe(3);
    });

    it('saves study progress in exact legacy-compatible format', () => {
        const progressMap = new Map<string, Set<string>>();
        progressMap.set('Số đếm', new Set(['c1', 'c2']));

        saveStudyProgress(progressMap);

        const raw = window.localStorage.getItem(STORAGE_KEYS.STUDY_PROGRESS_BY_TOPIC);
        expect(raw).toBeTruthy();

        const parsed = JSON.parse(raw!);
        expect(typeof parsed['Số đếm']).toBe('string');
        const cardsArr = JSON.parse(parsed['Số đếm']);
        expect(cardsArr).toEqual(['c1', 'c2']);
    });

    it('handles empty or missing study progress gracefully', () => {
        const progressMap = loadStudyProgress();
        expect(progressMap.size).toBe(0);
    });

    it('handles corrupt JSON in study progress without crashing', () => {
        window.localStorage.setItem(STORAGE_KEYS.STUDY_PROGRESS_BY_TOPIC, '{ invalid json');
        const progressMap = loadStudyProgress();
        expect(progressMap.size).toBe(0);
    });

    it('reads and writes darkMode correctly', () => {
        expect(isDarkMode()).toBe(false);
        setDarkMode(true);
        expect(isDarkMode()).toBe(true);
        expect(window.localStorage.getItem(STORAGE_KEYS.DARK_MODE)).toBe('true');
        setDarkMode(false);
        expect(isDarkMode()).toBe(false);
        expect(window.localStorage.getItem(STORAGE_KEYS.DARK_MODE)).toBe('false');
    });

    it('reads and writes hasSeenIntro correctly', () => {
        expect(hasSeenIntro()).toBe(false);
        setHasSeenIntro(true);
        expect(hasSeenIntro()).toBe(true);
        expect(window.localStorage.getItem(STORAGE_KEYS.HAS_SEEN_INTRO)).toBe('true');
    });

    it('reads and writes hasOpenedChat correctly', () => {
        expect(hasOpenedChat()).toBe(false);
        setHasOpenedChat(true);
        expect(hasOpenedChat()).toBe(true);
        expect(window.localStorage.getItem(STORAGE_KEYS.HAS_OPENED_CHAT)).toBe('true');
    });

    it('reads and writes generic typed storage items', () => {
        interface UserProfile { name: string; score: number }
        const key = STORAGE_KEYS.GAME_CURRENT_USER;
        setStorageItem<UserProfile>(key, { name: 'Player1', score: 100 });

        const retrieved = getStorageItem<UserProfile>(key, { name: '', score: 0 });
        expect(retrieved.name).toBe('Player1');
        expect(retrieved.score).toBe(100);
    });

    describe('Private Mode / SecurityError resilience', () => {
        const originalDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');

        afterEach(() => {
            if (originalDescriptor) {
                Object.defineProperty(window, 'localStorage', originalDescriptor);
            }
            vi.restoreAllMocks();
        });

        it('operates safely without throwing when localStorage throws SecurityError or QuotaExceededError', () => {
            const throwingStorage = {
                getItem: () => { throw new DOMException('Blocked', 'SecurityError'); },
                setItem: () => { throw new DOMException('Quota exceeded', 'QuotaExceededError'); },
                removeItem: () => { throw new DOMException('Blocked', 'SecurityError'); },
                clear: () => {},
                length: 0,
                key: () => null
            };
            Object.defineProperty(window, 'localStorage', {
                value: throwingStorage,
                configurable: true,
                writable: true
            });

            expect(isDarkMode()).toBe(false);
            expect(() => setDarkMode(true)).not.toThrow();
            expect(hasSeenIntro()).toBe(false);
            expect(() => setHasSeenIntro(true)).not.toThrow();
            expect(hasOpenedChat()).toBe(false);
            expect(() => setHasOpenedChat(true)).not.toThrow();
            expect(loadStudyProgress().size).toBe(0);
            expect(saveStudyProgress(new Map())).toBe(false);

            document.body.innerHTML = onboardingHtml;
            const onboarding = new OnboardingController();
            expect(() => onboarding.init()).not.toThrow();
            expect(() => onboarding.complete()).not.toThrow();

            expect(soundEffects.isEnabled()).toBe(true);
            expect(() => soundEffects.setEnabled(false)).not.toThrow();
            expect(getLeaderboard()).toEqual([]);
            expect(getSavedCertificates()).toEqual([]);
            expect(() => saveCertificate({
                studentName: 'Test',
                gameTitle: 'Game',
                score: 100,
                level: 1,
                date: '25/11/2026'
            })).not.toThrow();
        });
    });
});
