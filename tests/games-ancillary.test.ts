/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    renderCertificateCanvas,
    saveCertificate,
    getSavedCertificates,
    showCertificateModal,
    closeCertificateModal
} from '@/renderer/features/games/certificate';
import {
    recordGameScore,
    getLeaderboard,
    getUserBadges,
    showLeaderboardModal,
    showBadgesModal,
    showCertificatesModal
} from '@/renderer/features/games/leaderboard';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys';

describe('Minigames Certificate & Leaderboard Systems (Restoration Tests)', () => {
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
        document.body.innerHTML = '<div id="game"></div>';
    });

    afterEach(() => {
        closeCertificateModal();
        vi.restoreAllMocks();
    });

    describe('Certificate Generation', () => {
        it('renders a high-resolution 800x600 canvas with certificate details', () => {
            const canvas = renderCertificateCanvas({
                studentName: 'A Dũng',
                gameTitle: 'Lật Thẻ Trí Nhớ',
                score: 150,
                level: 3,
                date: '02/10/2026'
            });

            expect(canvas).toBeInstanceOf(HTMLCanvasElement);
            expect(canvas.width).toBe(800);
            expect(canvas.height).toBe(600);
        });

        it('saves and retrieves certificate records in localStorage', () => {
            expect(getSavedCertificates().length).toBe(0);

            const record = saveCertificate({
                studentName: 'Y Mi',
                gameTitle: 'Mưa Từ Vựng',
                score: 220,
                level: 2,
                date: '02/10/2026'
            });

            expect(record.id).toBeDefined();
            expect(record.studentName).toBe('Y Mi');

            const list = getSavedCertificates();
            expect(list.length).toBe(1);
            expect(list[0].gameTitle).toBe('Mưa Từ Vựng');
        });

        it('mounts certificate modal on DOM and handles closing', () => {
            showCertificateModal({
                studentName: 'A Phong',
                gameTitle: 'Bảo Vệ Làng',
                score: 300,
                level: 4
            });

            const modal = document.getElementById('certificateModal');
            expect(modal).not.toBeNull();
            expect(modal?.style.display).toBe('flex');

            closeCertificateModal();
            expect(modal?.style.display).toBe('none');
        });
    });

    describe('Leaderboard & Scoring Systems', () => {
        it('records player scores and sorts leaderboard by totalScore descending', () => {
            localStorage.setItem(STORAGE_KEYS.GAME_CURRENT_USER, 'PlayerOne');
            recordGameScore('game1', 100, 1);
            recordGameScore('game2', 150, 2);

            localStorage.setItem(STORAGE_KEYS.GAME_CURRENT_USER, 'PlayerTwo');
            recordGameScore('game1', 500, 3);

            const board = getLeaderboard();
            expect(board.length).toBe(2);
            expect(board[0].name).toBe('PlayerTwo');
            expect(board[0].totalScore).toBe(500);
            expect(board[1].name).toBe('PlayerOne');
            expect(board[1].totalScore).toBe(250);
            expect(board[1].gamesPlayed).toBe(2);
        });

        it('correctly calculates badge milestone unlocks', () => {
            localStorage.setItem(STORAGE_KEYS.GAME_CURRENT_USER, 'StarStudent');

            // Initially locked
            let badges = getUserBadges();
            const score100 = badges.find(b => b.id === 'score_100');
            const games1 = badges.find(b => b.id === 'games_1');
            expect(score100?.isUnlocked).toBe(false);
            expect(games1?.isUnlocked).toBe(false);

            // Record game with score 120
            recordGameScore('game3', 120, 1);

            badges = getUserBadges();
            const score100After = badges.find(b => b.id === 'score_100');
            const games1After = badges.find(b => b.id === 'games_1');
            expect(score100After?.isUnlocked).toBe(true);
            expect(games1After?.isUnlocked).toBe(true);
        });

        it('mounts leaderboard and badges modals without runtime exceptions', () => {
            showLeaderboardModal();
            const lModal = document.getElementById('leaderboardModal');
            expect(lModal).not.toBeNull();
            expect(lModal?.style.display).toBe('flex');

            showBadgesModal();
            const bModal = document.getElementById('badgesModal');
            expect(bModal).not.toBeNull();
            expect(bModal?.style.display).toBe('flex');

            showCertificatesModal();
            const cModal = document.getElementById('certificatesListModal');
            expect(cModal).not.toBeNull();
            expect(cModal?.style.display).toBe('flex');
        });
    });
});
