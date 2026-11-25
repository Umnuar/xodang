/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import gamesHtml from '@/features/games/games.html?raw';
import { initGames, launchGame, exitToMenu, getActiveGame } from '@/features/games/games';
import { eventBus } from '@/utils/event-bus';
import { Game1Memory } from '@/features/games/game1-memory';
import { Game2Catcher } from '@/features/games/game2-catcher';
import { Game3Shooter } from '@/features/games/game3-shooter';
import { Game4Farm } from '@/features/games/game4-farm';

describe('Native Canvas Games & Lifecycle Tests (Rule 11 Compliance)', () => {
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
        // Labeled chips exist
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

        // No emojis in cards or .game-badge
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

        // Switch tab to 'home'
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

