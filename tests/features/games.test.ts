import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import gamesHtml from '@/features/games/games.html?raw';
import { initGames, launchGame, exitToMenu, getActiveGame, getCurrentScore } from '@/features/games/games';
import { eventBus } from '@/utils/event-bus';
import { Game1Memory } from '@/features/games/game1-memory';
import { Game2Catcher } from '@/features/games/game2-catcher';
import { Game3Shooter } from '@/features/games/game3-shooter';
import { Game4Farm } from '@/features/games/game4-farm';
import { getSavedCertificates, closeCertificateModal } from '@/features/games/certificate';
import {
    showLeaderboardModal,
    showBadgesModal,
    showCertificatesModal,
    closeAllLeaderboardModals
} from '@/features/games/leaderboard';
import { snapshotFallback } from '@snapshot/data';

describe('Native Canvas Games & Lifecycle Tests (Rule 11 Compliance)', () => {
    const originalDictionary = snapshotFallback.dictionary;

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
        snapshotFallback.dictionary = originalDictionary;

        document.body.innerHTML = `
            <main>
                ${gamesHtml}
                <section id="home" class="container"></section>
            </main>
        `;
        initGames();
    });

    afterEach(() => {
        exitToMenu();
        closeCertificateModal();
        closeAllLeaderboardModals();
        snapshotFallback.dictionary = originalDictionary;
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('initializes Game Hub and renders 4 game selection cards', () => {
        const hub = document.getElementById('gameHubView');
        expect(hub).not.toBeNull();
        expect(hub?.style.display).not.toBe('none');

        const cards = document.querySelectorAll('.game-select-card');
        expect(cards.length).toBe(4);
    });

    it('launches Game 1 (Memory Flip) and mounts memory cards', () => {
        launchGame('game1');

        const activeGame = getActiveGame();
        expect(activeGame).toBeInstanceOf(Game1Memory);

        const memoryGrid = document.querySelector('#memoryGrid');
        expect(memoryGrid).not.toBeNull();

        const cards = document.querySelectorAll('.memory-card');
        expect(cards.length).toBeGreaterThanOrEqual(8);
    });

    it('launches Game 2 (Word Catcher) and mounts canvas with loop', () => {
        const reqRafSpy = vi.spyOn(window, 'requestAnimationFrame');

        launchGame('game2');

        const activeGame = getActiveGame();
        expect(activeGame).toBeInstanceOf(Game2Catcher);

        const canvas = document.querySelector('#catcherCanvas') as HTMLCanvasElement;
        expect(canvas).not.toBeNull();
        expect(reqRafSpy).toHaveBeenCalled();
    });

    it('launches Game 3 (Word Shooter) and mounts canvas with targets', () => {
        const reqRafSpy = vi.spyOn(window, 'requestAnimationFrame');

        launchGame('game3');

        const activeGame = getActiveGame();
        expect(activeGame).toBeInstanceOf(Game3Shooter);

        const canvas = document.querySelector('#shooterCanvas') as HTMLCanvasElement;
        expect(canvas).not.toBeNull();
        expect(reqRafSpy).toHaveBeenCalled();
    });

    it('launches Game 4 (Farm Harvest) and mounts farm plots', () => {
        launchGame('game4');

        const activeGame = getActiveGame();
        expect(activeGame).toBeInstanceOf(Game4Farm);

        const plots = document.querySelectorAll('.farm-plot');
        expect(plots.length).toBe(4);
    });

    it('renders Direction A Game Hub with labeled chips and semantic Lucide SVGs', () => {
        const chips = document.querySelectorAll('.game-chip-btn');
        expect(chips.length).toBe(4);

        const leaderboardBtn = document.getElementById('btnOpenLeaderboard');
        expect(leaderboardBtn?.textContent).toContain('Bảng vàng');
        expect(leaderboardBtn?.querySelector('svg')).not.toBeNull();

        const badgesBtn = document.getElementById('btnOpenBadges');
        expect(badgesBtn?.textContent).toContain('Huy hiệu');
        expect(badgesBtn?.querySelector('svg')).not.toBeNull();

        const certsBtn = document.getElementById('btnOpenCertificates');
        expect(certsBtn?.textContent).toContain('Chứng nhận');
        expect(certsBtn?.querySelector('svg')).not.toBeNull();

        const sfxBtn = document.getElementById('toggleGameSfx') as HTMLButtonElement;
        expect(sfxBtn?.textContent).toContain('Âm thanh: Bật');
        expect(sfxBtn?.querySelector('svg')).not.toBeNull();

        expect(document.querySelector('.game-badge')).toBeNull();
        const cards = document.querySelectorAll('.game-select-card');
        expect(cards.length).toBe(4);
        cards.forEach(card => {
            const iconSvg = card.querySelector('.game-card-icon svg');
            expect(iconSvg).not.toBeNull();
            const playBtn = card.querySelector('.game-play-btn');
            expect(playBtn).not.toBeNull();
            expect(playBtn?.textContent).toContain('Chơi ngay');
            expect(playBtn?.querySelector('svg')).not.toBeNull();
        });
    });

    it('toggles SFX button state, label, and icon on click', () => {
        const sfxBtn = document.getElementById('toggleGameSfx') as HTMLButtonElement;
        expect(sfxBtn.textContent).toContain('Âm thanh: Bật');

        sfxBtn.click();
        expect(sfxBtn.textContent).toContain('Âm thanh: Tắt');
        expect(sfxBtn.classList.contains('muted')).toBe(true);

        sfxBtn.click();
        expect(sfxBtn.textContent).toContain('Âm thanh: Bật');
        expect(sfxBtn.classList.contains('muted')).toBe(false);
    });

    it('RULE 11: calls destroy() and cancels requestAnimationFrame when exiting to menu', () => {
        const cancelRafSpy = vi.spyOn(window, 'cancelAnimationFrame');

        launchGame('game2');
        expect(getActiveGame()).not.toBeNull();

        exitToMenu();
        expect(getActiveGame()).toBeNull();
        expect(cancelRafSpy).toHaveBeenCalled();

        const hub = document.getElementById('gameHubView');
        expect(hub?.style.display).toBe('block');
    });

    it('RULE 11: switching tab via eventBus automatically calls destroy() and exits active game', () => {
        const cancelRafSpy = vi.spyOn(window, 'cancelAnimationFrame');

        launchGame('game3');
        expect(getActiveGame()).not.toBeNull();

        eventBus.emit('tab:change', 'home');

        expect(getActiveGame()).toBeNull();
        expect(cancelRafSpy).toHaveBeenCalled();
    });

    it('stops Game 2 Catcher animation loop immediately on game over without decrementing lives below 0', () => {
        const cancelRafSpy = vi.spyOn(window, 'cancelAnimationFrame');
        const onGameOver = vi.fn();
        const onLivesChange = vi.fn();
        const stage = document.createElement('div');
        const game = new Game2Catcher(stage, {
            onScoreChange: () => {},
            onLivesChange,
            onLevelComplete: () => {},
            onGameOver
        });

        game.start(1);
        const state = game as unknown as {
            lives: number;
            fallingWords: Array<{ text: string; isCorrect: boolean; x: number; y: number; speed: number; width: number; height: number }>;
            update: (ts: number, dt?: number) => void;
        };

        state.lives = 1;
        state.fallingWords = [
            { text: 'Nhà', isCorrect: true, x: 50, y: 425, speed: 2, width: 80, height: 32 },
            { text: 'Nước', isCorrect: true, x: 180, y: 425, speed: 2, width: 80, height: 32 }
        ];

        state.update(1000, 1);
        state.update(1016, 1);

        expect(onGameOver).toHaveBeenCalledTimes(1);
        expect(onLivesChange).toHaveBeenCalledTimes(1);
        expect(onLivesChange).toHaveBeenCalledWith(0);
        expect(cancelRafSpy).toHaveBeenCalled();
    });

    it('GM-02: Game 2 separates falling words across 3 lanes, updates lastSpawnTime, and clears words immediately on wrong catch', () => {
        const onLivesChange = vi.fn();
        const onMistake = vi.fn();
        const stage = document.createElement('div');
        const game = new Game2Catcher(stage, {
            onScoreChange: () => {},
            onLivesChange,
            onLevelComplete: () => {},
            onGameOver: () => {},
            onMistake
        });

        game.start(1);
        const state = game as unknown as {
            logicalWidth: number;
            logicalHeight: number;
            basketX: number;
            basketWidth: number;
            basketHeight: number;
            lastSpawnTime: number;
            correctionBanner: { text: string; remainingMs: number } | null;
            fallingWords: Array<{ text: string; isCorrect: boolean; x: number; y: number; width: number; height: number; baseX?: number }>;
            update: (ts: number, dt?: number) => void;
        };

        expect(state.lastSpawnTime).toBeGreaterThan(0);
        expect(state.fallingWords.length).toBe(3);

        const laneWidth = state.logicalWidth / 3;
        const lanes = state.fallingWords.map((w) => Math.floor((w.baseX ?? w.x) / laneWidth));
        expect(new Set(lanes).size).toBe(3);

        const sorted = [...state.fallingWords].sort((a, b) => a.x - b.x);
        expect(sorted[0].x + sorted[0].width).toBeLessThanOrEqual(sorted[1].x + 0.01);
        expect(sorted[1].x + sorted[1].width).toBeLessThanOrEqual(sorted[2].x + 0.01);

        const wrongWord = state.fallingWords.find((w) => !w.isCorrect)!;
        state.basketX = wrongWord.x;
        wrongWord.y = state.logicalHeight - state.basketHeight - 16;

        state.update(5000, 1);

        expect(state.fallingWords.length).toBe(0);
        expect(onLivesChange).toHaveBeenCalledWith(2);
        expect(onMistake).toHaveBeenCalledTimes(1);
        expect(state.correctionBanner).not.toBeNull();
    });

    it('stops Game 3 Shooter animation loop immediately on game over and level complete', () => {
        const cancelRafSpy = vi.spyOn(window, 'cancelAnimationFrame');
        const onGameOver = vi.fn();
        const stage = document.createElement('div');
        const game = new Game3Shooter(stage, {
            onScoreChange: () => {},
            onLivesChange: () => {},
            onLevelComplete: () => {},
            onGameOver
        });

        game.start(1);
        const state = game as unknown as {
            lives: number;
            targets: Array<{ text: string; isCorrect: boolean; x: number; y: number; radius: number; vx: number; vy: number; color: string }>;
            update: (dt?: number) => void;
        };

        state.lives = 1;
        state.targets = [
            { text: 'Nhà', isCorrect: true, x: 100, y: 420, radius: 34, vx: 0, vy: 2, color: '#000' },
            { text: 'Nước', isCorrect: true, x: 200, y: 420, radius: 34, vx: 0, vy: 2, color: '#000' }
        ];

        state.update(1);
        state.update(1);

        expect(onGameOver).toHaveBeenCalledTimes(1);
        expect(cancelRafSpy).toHaveBeenCalled();
    });

    it('GM-04 & GM-05: Game 3 detects wall collision at h - 35, separates overlapping targets, and fires via 1/2/3 keys outside editable inputs', () => {
        const onLivesChange = vi.fn();
        const onScoreChange = vi.fn();
        const stage = document.createElement('div');
        document.body.appendChild(stage);
        const chatInput = document.createElement('input');
        chatInput.id = 'chatInput';
        document.body.appendChild(chatInput);

        const game = new Game3Shooter(stage, {
            onScoreChange,
            onLivesChange,
            onLevelComplete: () => {},
            onGameOver: () => {}
        });

        game.start(1);
        const state = game as unknown as {
            logicalHeight: number;
            targets: Array<{ text: string; isCorrect: boolean; x: number; y: number; radius: number; width?: number; height?: number; keyIndex?: number; vx: number; vy: number; color: string }>;
            update: (dt?: number) => void;
        };

        state.targets = [
            { text: 'A', isCorrect: false, x: 220, y: 140, radius: 24, width: 140, height: 48, keyIndex: 1, vx: 0, vy: 0, color: '#000' },
            { text: 'B', isCorrect: true, x: 225, y: 145, radius: 24, width: 140, height: 48, keyIndex: 2, vx: 0, vy: 0, color: '#000' }
        ];
        state.update(1);
        expect(Math.abs(state.targets[0].y - state.targets[1].y)).toBeGreaterThanOrEqual(48 + 9);

        const correctTarget = state.targets.find((t) => t.isCorrect)!;
        const correctKey = String(correctTarget.keyIndex);

        chatInput.focus();
        window.dispatchEvent(new KeyboardEvent('keydown', { key: correctKey, bubbles: true }));
        expect(onScoreChange).not.toHaveBeenCalled();

        chatInput.blur();
        (document.body as HTMLElement).focus?.();
        window.dispatchEvent(new KeyboardEvent('keydown', { key: correctKey, bubbles: true }));
        expect(onScoreChange).toHaveBeenCalledTimes(1);

        const wallY = state.logicalHeight - 35;
        state.targets = [
            { text: 'ExactWall', isCorrect: true, x: 200, y: wallY - 24, radius: 24, width: 128, height: 48, keyIndex: 1, vx: 0, vy: 1, color: '#000' }
        ];
        state.update(1);
        expect(onLivesChange).toHaveBeenCalledWith(2);

        game.destroy();
    });

    it('GM-06: Game 4 modal closes via button/Escape, handles dataset.answer !== undefined, and maintains non-repeating queue', () => {
        const stage = document.createElement('div');
        document.body.appendChild(stage);
        const game = new Game4Farm(stage, {
            onScoreChange: () => {},
            onLevelComplete: () => {}
        });

        game.start(1);
        const state = game as unknown as {
            totalPlots: number;
            questions: Array<{ question: string; correct: string }>;
            questionQueue: Array<{ question: string; correct: string }>;
            currentQuestion: { question: string; correct: string } | null;
        };

        expect(state.questions.length).toBe(state.totalPlots * 3);

        const plot0 = stage.querySelector<HTMLButtonElement>('.farm-plot[data-plot="0"]')!;
        plot0.click();

        const modal = stage.querySelector('#farmQuestionModal') as HTMLElement;
        expect(modal.style.display).toBe('flex');

        stage.querySelector<HTMLButtonElement>('#btnCloseFarmModal')!.click();
        expect(modal.style.display).toBe('none');

        plot0.click();
        expect(modal.style.display).toBe('flex');
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(modal.style.display).toBe('none');

        plot0.click();
        const answerBtns = Array.from(stage.querySelectorAll<HTMLButtonElement>('.farm-answer-btn'));
        expect(answerBtns.length).toBeGreaterThanOrEqual(2);
        for (const btn of answerBtns) {
            expect(btn.dataset.answer).not.toBeUndefined();
        }

        state.currentQuestion = { question: 'TestEmpty', correct: '' };
        answerBtns[0].dataset.answer = '';
        answerBtns[0].click();
        expect(modal.style.display).toBe('none');
        expect(stage.querySelector('.farm-plot[data-plot="0"]')?.classList.contains('sprout')).toBe(true);

        game.destroy();
    });

    it('GM-03, GM-09, GM-16: preserves carryScore across #btnNextLevel, hides cert on Game Over, prevents duplicate cert saves, and closes all modals on exitToMenu', () => {
        vi.useFakeTimers();

        launchGame('game1', 1, 0);
        expect(document.body.classList.contains('game-focus-mode')).toBe(true);

        const game1 = getActiveGame() as unknown as {
            cards: Array<{ id: string; pairId: number; content: string; type: 'question' | 'answer' }>;
            matchedPairs: number;
            totalPairs: number;
        };
        const stage = document.getElementById('gameStage')!;
        const cardEls = stage.querySelectorAll<HTMLElement>('.memory-card');

        const pairs = new Map<number, number[]>();
        game1.cards.forEach((c, idx) => {
            const list = pairs.get(c.pairId) ?? [];
            list.push(idx);
            pairs.set(c.pairId, list);
        });
        for (const indices of pairs.values()) {
            cardEls[indices[0]].click();
            cardEls[indices[1]].click();
        }

        vi.advanceTimersByTime(700);

        const gameOverModal = document.getElementById('gameOverModal')!;
        const certBtn = document.getElementById('btnGetCertificate') as HTMLElement;
        const nextLevelBtn = document.getElementById('btnNextLevel') as HTMLElement;

        expect(gameOverModal.style.display).toBe('flex');
        expect(certBtn.style.display).toBe('inline-flex');
        expect(nextLevelBtn.style.display).toBe('inline-flex');

        const level1Score = getCurrentScore();
        expect(level1Score).toBeGreaterThan(0);

        certBtn.click();
        certBtn.click();
        expect(getSavedCertificates().length).toBe(1);
        closeCertificateModal();

        nextLevelBtn.click();
        expect(document.getElementById('activeGameLevel')?.textContent).toBe('2');
        expect(document.getElementById('activeGameScore')?.textContent).toBe(String(level1Score));
        expect(getCurrentScore()).toBe(level1Score);

        launchGame('game2', 1, 0);
        document.getElementById('btnStartFromPreview')?.click();
        const game2 = getActiveGame() as unknown as {
            lives: number;
            fallingWords: Array<{ text: string; isCorrect: boolean; x: number; y: number; speed: number; width: number; height: number }>;
            update: (ts: number, dt?: number) => void;
        };
        game2.lives = 1;
        game2.fallingWords = [
            { text: 'Nhà', isCorrect: true, x: 50, y: 500, speed: 2, width: 80, height: 32 }
        ];
        game2.update(1000, 1);

        expect(gameOverModal.style.display).toBe('flex');
        expect(certBtn.style.display).toBe('none');

        showLeaderboardModal();
        showBadgesModal();
        showCertificatesModal();
        document.getElementById('certificateModal')!.style.display = 'flex';

        exitToMenu();

        expect(document.body.classList.contains('game-focus-mode')).toBe(false);
        expect(gameOverModal.style.display).toBe('none');
        expect(document.getElementById('leaderboardModal')?.style.display).toBe('none');
        expect(document.getElementById('badgesModal')?.style.display).toBe('none');
        expect(document.getElementById('certificatesListModal')?.style.display).toBe('none');
        expect(document.getElementById('certificateModal')?.style.display).toBe('none');
    });

    it('GM-18: Games 1-4 guard against empty vocab without starting rAF and reset cleanly on idempotent start()', () => {
        const reqRafSpy = vi.spyOn(window, 'requestAnimationFrame');
        snapshotFallback.dictionary = [];

        const stage1 = document.createElement('div');
        const g1 = new Game1Memory(stage1, { onScoreChange: () => {}, onLevelComplete: () => {} });
        g1.start(1);
        expect(stage1.querySelector('.game-empty-state')).not.toBeNull();

        const stage2 = document.createElement('div');
        const g2 = new Game2Catcher(stage2, {
            onScoreChange: () => {},
            onLivesChange: () => {},
            onLevelComplete: () => {},
            onGameOver: () => {}
        });
        g2.start(1);
        expect(stage2.querySelector('.game-empty-state')).not.toBeNull();

        const stage3 = document.createElement('div');
        const g3 = new Game3Shooter(stage3, {
            onScoreChange: () => {},
            onLivesChange: () => {},
            onLevelComplete: () => {},
            onGameOver: () => {}
        });
        g3.start(1);
        expect(stage3.querySelector('.game-empty-state')).not.toBeNull();

        const stage4 = document.createElement('div');
        const g4 = new Game4Farm(stage4, { onScoreChange: () => {}, onLevelComplete: () => {} });
        g4.start(1);
        expect(stage4.querySelector('.game-empty-state')).not.toBeNull();

        expect(reqRafSpy).not.toHaveBeenCalled();

        snapshotFallback.dictionary = originalDictionary;
        const onScore2 = vi.fn();
        const g2Repeat = new Game2Catcher(stage2, {
            onScoreChange: onScore2,
            onLivesChange: () => {},
            onLevelComplete: () => {},
            onGameOver: () => {}
        });
        g2Repeat.start(1);
        expect(onScore2).not.toHaveBeenCalled();
        g2Repeat.start(2);
        expect(onScore2).toHaveBeenCalledWith(0);
        g2Repeat.destroy();
    });

    it('cancels Game 1 and Game 4 pending levelComplete timeout on destroy and supports keyboard card flip', () => {
        vi.useFakeTimers();
        const onComplete1 = vi.fn();
        const stage1 = document.createElement('div');
        const game1 = new Game1Memory(stage1, { onScoreChange: () => {}, onLevelComplete: onComplete1 });
        game1.start(1);

        const g1State = game1 as unknown as {
            cards: Array<{ id: string; pairId: number; content: string; type: 'question' | 'answer' }>;
            totalPairs: number;
            matchedPairs: number;
        };
        g1State.matchedPairs = g1State.totalPairs - 1;

        const firstIdx = 0;
        const pairId = g1State.cards[0].pairId;
        const secondIdx = g1State.cards.findIndex((c, idx) => idx !== firstIdx && c.pairId === pairId);
        const cardEls = stage1.querySelectorAll('.memory-card');

        cardEls[firstIdx].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        expect(cardEls[firstIdx].classList.contains('flipped')).toBe(true);
        (cardEls[secondIdx] as HTMLElement).click();

        game1.destroy();
        vi.advanceTimersByTime(1000);
        expect(onComplete1).not.toHaveBeenCalled();

        const onComplete4 = vi.fn();
        const stage4 = document.createElement('div');
        const game4 = new Game4Farm(stage4, { onScoreChange: () => {}, onLevelComplete: onComplete4 });
        game4.start(1);
        const g4State = game4 as unknown as {
            plots: Array<{ id: number; stage: string; cropIcon: string }>;
            harvestedCount: number;
            totalPlots: number;
            selectedPlotIndex: number | null;
            currentQuestion: { correct: string } | null;
            handleAnswer: (ans: string) => void;
        };
        g4State.plots[0].stage = 'ready';
        g4State.harvestedCount = g4State.totalPlots - 1;
        g4State.selectedPlotIndex = 0;
        g4State.currentQuestion = { correct: 'Nhà' };
        g4State.handleAnswer('Nhà');

        game4.destroy();
        vi.advanceTimersByTime(1000);
        expect(onComplete4).not.toHaveBeenCalled();
    });
});
