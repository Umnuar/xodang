export type RouteChangeCallback = (route: string) => void | Promise<void>;

export class HashRouter {
    private routes = new Set<string>();
    private defaultRoute: string;
    private listener?: RouteChangeCallback;

    constructor(routes: string[], defaultRoute: string = 'home') {
        this.routes = new Set(routes.map((route) => route.trim().toLowerCase()));
        this.defaultRoute = defaultRoute.trim().toLowerCase();
    }

    init(callback: RouteChangeCallback): void {
        this.listener = callback;
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();
    }

    navigate(route: string): void {
        const normalized = route.replace(/^#\/?/, '').split('?')[0].trim().toLowerCase();
        const targetHash = `#${normalized}`;
        if (window.location.hash.toLowerCase() === targetHash) {
            this.handleRoute();
        } else {
            window.location.hash = targetHash;
        }
    }

    private handleRoute(): void {
        const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0].trim().toLowerCase();
        const activeRoute = this.routes.has(hash) ? hash : this.defaultRoute;
        this.listener?.(activeRoute);
    }
}

export const router = new HashRouter(['home', 'contribute', 'quiz', 'game'], 'home');
