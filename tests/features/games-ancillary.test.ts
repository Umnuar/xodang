import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    renderCertificateCanvas,
    saveCertificate,
    getSavedCertificates,
    showCertificateModal,
    closeCertificateModal,
    formatCertificateFilename
} from '@/features/games/certificate';
import {
    recordGameScore,
    getLeaderboard,
    getUserBadges,
    showLeaderboardModal,
    showBadgesModal,
    showCertificatesModal,
    closeAllLeaderboardModals
} from '@/features/games/leaderboard';
import { soundEffects } from '@/features/games/sound-effects';
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
        closeAllLeaderboardModals();
        vi.restoreAllMocks();
    });

    describe('Certificate Generation', () => {
        it('renders 800x600 by default and 1600x1200 with scale 2', () => {
            const canvas1x = renderCertificateCanvas({
                studentName: 'A Dũng',
                gameTitle: 'Lật Thẻ Trí Nhớ',
                score: 150,
                level: 3,
                date: '02/10/2026'
            });

            expect(canvas1x).toBeInstanceOf(HTMLCanvasElement);
            expect(canvas1x.width).toBe(800);
            expect(canvas1x.height).toBe(600);

            const canvas2x = renderCertificateCanvas({
                studentName: 'A Dũng',
                gameTitle: 'Lật Thẻ Trí Nhớ',
                score: 150,
                level: 3,
                date: '02/10/2026',
                scale: 2
            });

            expect(canvas2x).toBeInstanceOf(HTMLCanvasElement);
            expect(canvas2x.width).toBe(1600);
            expect(canvas2x.height).toBe(1200);
        });

        it('normalizes Vietnamese diacritics using NFD in certificate download filenames', () => {
            expect(formatCertificateFilename('Người học Xơ Đăng', '25/11/2026')).toBe(
                'Chung-Nhan-nguoi-hoc-xo-dang-25-11-2026.png'
            );
            expect(formatCertificateFilename('Đặng Thị Ánh Tuyết', '01/02/2026')).toBe(
                'Chung-Nhan-dang-thi-anh-tuyet-01-02-2026.png'
            );
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

        it('mounts certificate modal with 2x canvas, suppresses levelUp and persistence when persist is false', () => {
            const levelUpSpy = vi.spyOn(soundEffects, 'levelUp').mockImplementation(() => {});

            const certId = showCertificateModal({
                studentName: 'A Phong',
                gameTitle: 'Bảo Vệ Làng',
                score: 300,
                level: 4,
                persist: false
            });

            expect(certId).toBeUndefined();
            expect(levelUpSpy).not.toHaveBeenCalled();
            expect(getSavedCertificates().length).toBe(0);

            const modal = document.getElementById('certificateModal');
            expect(modal).not.toBeNull();
            expect(modal?.style.display).toBe('flex');
            const canvas = modal?.querySelector('canvas') as HTMLCanvasElement | null;
            expect(canvas?.width).toBe(1600);
            expect(canvas?.height).toBe(1200);

            closeCertificateModal();
            expect(modal?.style.display).toBe('none');

            const savedId = showCertificateModal({
                studentName: 'A Phong',
                gameTitle: 'Bảo Vệ Làng',
                score: 300,
                level: 4,
                persist: true
            });
            expect(savedId).toBeDefined();
            expect(levelUpSpy).toHaveBeenCalledTimes(1);
            expect(getSavedCertificates().length).toBe(1);
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

        it('does not increment user level or unlock completion badges when completed is false', () => {
            localStorage.setItem(STORAGE_KEYS.GAME_CURRENT_USER, 'LossTester');
            recordGameScore('game2', 75, 3, false, 75);

            const board = getLeaderboard();
            expect(board[0].level).toBe(1);
            expect(board[0].gamesPlayed).toBe(1);

            const badgesOnLoss = getUserBadges();
            expect(badgesOnLoss.find(b => b.id === 'games_1')?.isUnlocked).toBe(false);
            expect(badgesOnLoss.find(b => b.id === 'level_3')?.isUnlocked).toBe(false);

            recordGameScore('game2', 120, 3, true, 195);
            const boardAfterWin = getLeaderboard();
            expect(boardAfterWin[0].level).toBe(3);

            const badgesOnWin = getUserBadges();
            expect(badgesOnWin.find(b => b.id === 'games_1')?.isUnlocked).toBe(true);
            expect(badgesOnWin.find(b => b.id === 'level_3')?.isUnlocked).toBe(true);
        });

        it('correctly calculates badge milestone unlocks', () => {
            localStorage.setItem(STORAGE_KEYS.GAME_CURRENT_USER, 'StarStudent');

            let badges = getUserBadges();
            const score100 = badges.find(b => b.id === 'score_100');
            const games1 = badges.find(b => b.id === 'games_1');
            expect(score100?.isUnlocked).toBe(false);
            expect(games1?.isUnlocked).toBe(false);

            recordGameScore('game3', 120, 1);

            badges = getUserBadges();
            const score100After = badges.find(b => b.id === 'score_100');
            const games1After = badges.find(b => b.id === 'games_1');
            expect(score100After?.isUnlocked).toBe(true);
            expect(games1After?.isUnlocked).toBe(true);
        });

        it('filters certificates by current owner in showCertificatesModal', () => {
            saveCertificate({
                studentName: 'Y Mi',
                gameTitle: 'Mưa Từ Vựng',
                score: 220,
                level: 2,
                date: '25/11/2026'
            });
            saveCertificate({
                studentName: 'A Phong',
                gameTitle: 'Bảo Vệ Làng',
                score: 300,
                level: 3,
                date: '25/11/2026'
            });

            localStorage.setItem(STORAGE_KEYS.GAME_CURRENT_USER, 'Y Mi');
            showCertificatesModal();

            const modal = document.getElementById('certificatesListModal')!;
            expect(modal.querySelectorAll('.cert-card-item').length).toBe(2);

            const mineBtn = modal.querySelector<HTMLButtonElement>('[data-filter-scope="mine"]')!;
            expect(mineBtn.textContent).toContain('Của Y Mi (1)');
            mineBtn.click();

            const filteredItems = modal.querySelectorAll('.cert-card-item');
            expect(filteredItems.length).toBe(1);
            expect(filteredItems[0].textContent).toContain('Y Mi');

            localStorage.setItem(STORAGE_KEYS.GAME_CURRENT_USER, 'Người Mới');
            showCertificatesModal();
            const mineEmptyBtn = modal.querySelector<HTMLButtonElement>('[data-filter-scope="mine"]')!;
            mineEmptyBtn.click();

            const gridEl = modal.querySelector('.certs-grid') as HTMLElement;
            const emptyEl = modal.querySelector('.certs-filtered-empty') as HTMLElement;
            expect(gridEl.hidden).toBe(true);
            expect(emptyEl.hidden).toBe(false);
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

        it('re-viewing an existing certificate does not duplicate saved records and keeps modal close listeners singular', () => {
            const saved = saveCertificate({
                studentName: 'Y Hoa',
                gameTitle: 'Nông Trại Số',
                score: 400,
                level: 3,
                date: '25/11/2026'
            });
            expect(getSavedCertificates().length).toBe(1);

            showCertificatesModal();
            showCertificatesModal();
            const cModal = document.getElementById('certificatesListModal')!;
            const viewBtn = cModal.querySelector('.btn-view-cert') as HTMLElement;
            expect(viewBtn).not.toBeNull();

            viewBtn.click();

            const listAfter = getSavedCertificates();
            expect(listAfter.length).toBe(1);
            expect(listAfter[0].id).toBe(saved.id);

            const certModal = document.getElementById('certificateModal')!;
            expect(certModal.style.display).toBe('flex');
            (certModal.querySelector('#btnCloseCertAction') as HTMLElement).click();
            expect(certModal.style.display).toBe('none');
        });
    });
});
