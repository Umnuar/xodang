import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HashRouter } from '@/renderer/router';

describe('HashRouter (< 40 lines router)', () => {
    let router: HashRouter;

    beforeEach(() => {
        window.location.hash = '';
        router = new HashRouter(['home', 'contribute', 'quiz', 'game'], 'home');
    });

    it('falls back to default route if hash is empty', () => {
        const callback = vi.fn();
        router.init(callback);

        expect(callback).toHaveBeenCalledWith('home');
    });

    it('navigates to valid route and updates location hash', () => {
        const callback = vi.fn();
        router.init(callback);

        router.navigate('quiz');
        expect(window.location.hash).toBe('#quiz');
        expect(callback).toHaveBeenCalledWith('quiz');
    });

    it('falls back to default route when navigating to an unknown route', () => {
        const callback = vi.fn();
        router.init(callback);

        window.location.hash = '#invalid-route';
        window.dispatchEvent(new HashChangeEvent('hashchange'));

        expect(callback).toHaveBeenCalledWith('home');
    });

    it('correctly handles routes with leading slash', () => {
        const callback = vi.fn();
        router.init(callback);

        window.location.hash = '#/contribute';
        window.dispatchEvent(new HashChangeEvent('hashchange'));

        expect(callback).toHaveBeenCalledWith('contribute');
    });

    it('calls handler again if navigating to current route', () => {
        const callback = vi.fn();
        router.init(callback);

        router.navigate('game');
        expect(callback).toHaveBeenLastCalledWith('game');

        router.navigate('game');
        expect(callback).toHaveBeenCalledTimes(3); // init(home) -> game -> game
    });
});
