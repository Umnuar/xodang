/**
 * Lightweight Hash Router (< 40 lines)
 * Manages SPA section routing via window.location.hash with zero framework bloat.
 */

export type RouteChangeCallback = (route: string) => void;

export class HashRouter {
    private routes = new Set<string>();
    private defaultRoute: string;
    private listener?: RouteChangeCallback;

    constructor(routes: string[], defaultRoute: string = 'home') {
        this.routes = new Set(routes);
        this.defaultRoute = defaultRoute;
    }

    init(callback: RouteChangeCallback): void {
        this.listener = callback;
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();
    }

    navigate(route: string): void {
        const targetHash = `#${route}`;
        if (window.location.hash === targetHash) {
            this.handleRoute();
        } else {
            window.location.hash = targetHash;
        }
    }

    private handleRoute(): void {
        const hash = window.location.hash.replace(/^#\/?/, '').trim();
        const activeRoute = this.routes.has(hash) ? hash : this.defaultRoute;
        this.listener?.(activeRoute);
    }
}

export const router = new HashRouter(['home', 'contribute', 'quiz', 'game'], 'home');
