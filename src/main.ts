import './styles/index.css';

import navbarHtml from './components/navbar/navbar.html?raw';
import footerHtml from './components/footer/footer.html?raw';
import installModalHtml from './components/install-modal/install-modal.html?raw';
import onboardingHtml from './features/onboarding/onboarding.html?raw';
import homeHtml from './features/home/home.html?raw';

import { initNavbar, setActiveNavLink, showSection } from './components/navbar/navbar';
import { initInstallModal } from './components/install-modal/install-modal';
import { initOfflineIndicator } from './components/offline-indicator';
import { hideLoading, showLoading } from './components/loading-overlay';
import { showToast } from './components/toast';
import { initOnboarding } from './features/onboarding/onboarding';
import { initHome } from './features/home/home';
import { router } from './router';
import { flushContributionOutbox } from './services/contribution-outbox.service';

const LAZY_ROUTES = new Set<string>(['contribute', 'quiz', 'game']);
const loadedRoutes = new Set<string>(['home']);
const routeLoaders = new Map<string, Promise<void>>();
let chatLoaded = false;
let chatLoadPromise: Promise<void> | null = null;
let pendingChatAutoOpen = false;
let latestRequestedRoute = 'home';

function getNormalizedInitialRoute(): string {
    const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0].trim().toLowerCase();
    return LAZY_ROUTES.has(hash) ? hash : 'home';
}

function mountRouteSection(sectionId: string, html: string): void {
    const existing = document.getElementById(sectionId);
    if (!existing) return;
    const wasActive = existing.classList.contains('active');
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    const newSection = template.content.firstElementChild as HTMLElement | null;
    if (!newSection) return;
    if (wasActive) {
        newSection.classList.add('active');
    }
    existing.replaceWith(newSection);
}

async function ensureRouteLoaded(route: string): Promise<void> {
    if (loadedRoutes.has(route)) return;
    if (routeLoaders.has(route)) {
        return routeLoaders.get(route)!;
    }

    showLoading('Đang tải trang...');
    const loader = (async () => {
        if (route === 'contribute') {
            const [{ default: html }, { initContribute }] = await Promise.all([
                import('./features/contribute/contribute.html?raw'),
                import('./features/contribute/contribute')
            ]);
            mountRouteSection('contribute', html);
            initContribute();
            loadedRoutes.add('contribute');
        } else if (route === 'quiz') {
            const [{ default: html }, { initQuiz }] = await Promise.all([
                import('./features/quiz/quiz.html?raw'),
                import('./features/quiz/quiz')
            ]);
            mountRouteSection('quiz', html);
            await initQuiz();
            loadedRoutes.add('quiz');
        } else if (route === 'game') {
            const [{ default: html }, { initGames }] = await Promise.all([
                import('./features/games/games.html?raw'),
                import('./features/games/games')
            ]);
            mountRouteSection('game', html);
            initGames();
            loadedRoutes.add('game');
        }
    })();

    routeLoaders.set(route, loader);
    try {
        await loader;
    } finally {
        routeLoaders.delete(route);
        hideLoading();
    }
}

async function ensureChatLoaded(autoOpen: boolean = false): Promise<void> {
    if (autoOpen) {
        pendingChatAutoOpen = true;
    }
    if (chatLoaded) {
        if (pendingChatAutoOpen) {
            pendingChatAutoOpen = false;
            const chatWindow = document.getElementById('chatWindow');
            if (chatWindow && !chatWindow.classList.contains('active')) {
                document.getElementById('chatToggleBtn')?.click();
            }
        }
        return;
    }
    if (chatLoadPromise) {
        await chatLoadPromise;
        if (pendingChatAutoOpen) {
            pendingChatAutoOpen = false;
            const chatWindow = document.getElementById('chatWindow');
            if (chatWindow && !chatWindow.classList.contains('active')) {
                document.getElementById('chatToggleBtn')?.click();
            }
        }
        return;
    }

    chatLoadPromise = (async () => {
        const [{ default: chatHtml }, { initChat }] = await Promise.all([
            import('./features/chat/chat.html?raw'),
            import('./features/chat/chat')
        ]);
        const mount = document.getElementById('chatWidgetMount');
        if (mount) {
            const shouldOpen = pendingChatAutoOpen;
            pendingChatAutoOpen = false;
            mount.innerHTML = chatHtml;
            initChat(shouldOpen);
            chatLoaded = true;
        }
    })();

    try {
        await chatLoadPromise;
    } catch (err) {
        if (autoOpen) {
            pendingChatAutoOpen = false;
            showToast('Không thể tải trợ lý chat. Vui lòng thử lại.', 'error');
        }
        throw err;
    } finally {
        chatLoadPromise = null;
    }
}

function mountMarkup(): void {
    const app = document.getElementById('app');
    if (app) {
        app.innerHTML = `
            ${installModalHtml}
            ${onboardingHtml}
            <div id="offlineIndicator" class="offline-indicator" role="status" aria-live="polite" aria-hidden="true">
                <svg class="lucide-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <line x1="2" x2="22" y1="2" y2="22"/>
                    <path d="M12 20h.01"/>
                    <path d="M8.5 16.429a5 5 0 0 1 7 0"/>
                    <path d="M5 12.859a10 10 0 0 1 5.17-2.69"/>
                    <path d="M19 12.859a10 10 0 0 0-2.007-1.523"/>
                    <path d="M2 8.82a15 15 0 0 1 4.177-2.643"/>
                    <path d="M22 8.82a15 15 0 0 0-11.288-3.764"/>
                </svg>
                <span>Ngoại tuyến</span>
            </div>
            <div id="toastContainer" role="status" aria-live="polite"></div>
            <div id="loadingOverlay" class="loading-overlay hidden" role="status" aria-live="polite" aria-hidden="true">
                <div class="spinner"></div>
                <div id="loadingText">Đang xử lý...</div>
            </div>
            <div id="chatWidgetMount">
                <div class="chat-widget-container">
                    <button type="button" class="chat-toggle-btn" id="chatToggleBtn" aria-label="Mở trợ lý chat">
                        <svg class="lucide-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                    </button>
                </div>
            </div>
            ${navbarHtml}
            <main>
                ${homeHtml}
                <section id="contribute" class="container"></section>
                <section id="quiz" class="container"></section>
                <section id="game" class="container"></section>
            </main>
            ${footerHtml}
        `;

        const initialRoute = getNormalizedInitialRoute();
        if (initialRoute !== 'home') {
            document.getElementById('home')?.classList.remove('active');
            setActiveNavLink(initialRoute);
        }
    }
}

function dismissAppLoading(): void {
    const loadingScreen = document.getElementById('app-loading');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }
    window.dispatchEvent(new Event('appLoadingComplete'));
}

export async function bootstrap(): Promise<void> {
    mountMarkup();

    initNavbar();
    initInstallModal();
    initOfflineIndicator();

    router.init((route) => {
        latestRequestedRoute = route;
        if (loadedRoutes.has(route)) {
            showSection(route);
            return;
        }
        setActiveNavLink(route);
        void ensureRouteLoaded(route)
            .then(() => {
                if (latestRequestedRoute === route) {
                    showSection(route);
                }
            })
            .catch(() => {
                if (!document.querySelector('main > section.container.active')) {
                    showSection('home');
                }
                showToast('Không thể tải trang. Vui lòng kiểm tra mạng và thử lại.', 'error');
            });
    });

    const chatStubBtn = document.getElementById('chatToggleBtn');
    chatStubBtn?.addEventListener('click', () => {
        void ensureChatLoaded(true).catch(() => {});
    });

    await initHome();
    dismissAppLoading();
    initOnboarding();

    if (navigator.onLine) {
        void flushContributionOutbox().catch(() => {});
    }
    window.addEventListener('online', () => {
        void flushContributionOutbox().catch(() => {});
    });

    const scheduleIdleChat = (window as unknown as { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback;
    if (typeof scheduleIdleChat === 'function') {
        scheduleIdleChat(() => {
            void ensureChatLoaded(false).catch(() => {});
        });
    } else {
        setTimeout(() => {
            void ensureChatLoaded(false).catch(() => {});
        }, 1500);
    }

    if ('serviceWorker' in navigator) {
        const registerSw = () => {
            navigator.serviceWorker.register('./service-worker.js').catch(err => {
                console.warn('[SW] Registration failed:', err);
            });
        };
        if (document.readyState === 'complete') {
            registerSw();
        } else {
            window.addEventListener('load', registerSw, { once: true });
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => bootstrap());
} else {
    bootstrap();
}
