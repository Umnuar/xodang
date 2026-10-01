/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import gamesHtml from '@/renderer/features/games/games.html?raw';
import { initGames, launchGame, exitToMenu, getActiveGame } from '@/renderer/features/games/games';
import { eventBus } from '@/renderer/components/event-bus';
import { Game1Memory } from '@/renderer/features/games/game1-memory';
import { Game2Catcher } from '@/renderer/features/games/game2-catcher';
import { Game3Shooter } from '@/renderer/features/games/game3-shooter';
import { Game4Farm } from '@/renderer/features/games/game4-farm';

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
});
