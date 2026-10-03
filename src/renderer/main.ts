/**
 * Main Application Bootstrap
 * Mounts component templates, initializes controllers, registers Service Worker,
 * sets up Hash Routing, and activates Onboarding Modal.
 */

import './styles/index.css';

// HTML Templates imported via Vite ?raw
import navbarHtml from './components/navbar/navbar.html?raw';
import footerHtml from './components/footer/footer.html?raw';
import installModalHtml from './components/install-modal/install-modal.html?raw';
import onboardingHtml from './features/onboarding/onboarding.html?raw';
import chatHtml from './features/chat/chat.html?raw';
import homeHtml from './features/home/home.html?raw';
import contributeHtml from './features/contribute/contribute.html?raw';
import quizHtml from './features/quiz/quiz.html?raw';
import gamesHtml from './features/games/games.html?raw';

// Controllers & Services
import { initNavbar, showSection } from './components/navbar/navbar';
import { initFooter } from './components/footer/footer';
import { initInstallModal, closeInstallModal } from './components/install-modal/install-modal';
import { initOfflineIndicator } from './components/offline-indicator';
import { initOnboarding, openOnboarding, closeOnboarding } from './features/onboarding/onboarding';
import { initHome } from './features/home/home';
import { initContribute } from './features/contribute/contribute';
import { initQuiz } from './features/quiz/quiz';
import { initChat } from './features/chat/chat';
import { initGames, checkGameAvailable } from './features/games/games';
import { router } from './router';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys';

/**
 * Mounts HTML fragments if running in #app container.
 * If static markup already exists in the DOM, leaves it in place.
 */
function mountMarkup(): void {
    const app = document.getElementById('app');
    if (app) {
        app.innerHTML = `
            ${installModalHtml}
            ${onboardingHtml}
            <div id="offlineIndicator" class="offline-indicator">
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
            <div id="toastContainer"></div>
            <div id="loadingOverlay" class="loading-overlay hidden">
                <div class="spinner"></div>
                <div id="loadingText">Đang xử lý...</div>
            </div>
            ${chatHtml}
            ${navbarHtml}
            <main>
                ${homeHtml}
                ${contributeHtml}
                ${quizHtml}
                ${gamesHtml}
            </main>
            ${footerHtml}
        `;
    }
}

/**
 * Splash Loading Management
 */
function handleAppLoading(): void {
    const loadingScreen = document.getElementById('app-loading');
    if (!loadingScreen) return;

    const hasSeenIntro = localStorage.getItem(STORAGE_KEYS.HAS_SEEN_INTRO);
    if (hasSeenIntro === 'true') {
        loadingScreen.style.display = 'flex';
        let progress = 0;
        const progressBar = document.querySelector('.loading-bar') as HTMLElement | null;

        const interval = setInterval(() => {
            progress += 1;
            if (progressBar) progressBar.style.width = `${progress}%`;

            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    loadingScreen.style.opacity = '0';
                    loadingScreen.style.transition = 'opacity 0.5s ease';
                    setTimeout(() => {
                        loadingScreen.style.display = 'none';
                        window.dispatchEvent(new Event('appLoadingComplete'));
                    }, 500);
                }, 300);
            }
        }, 30);
    } else {
        loadingScreen.style.display = 'none';
        window.dispatchEvent(new Event('appLoadingComplete'));
    }

    // Auto-dismiss safety timeout
    setTimeout(() => {
        if (loadingScreen.style.display !== 'none') {
            loadingScreen.style.display = 'none';
            window.dispatchEvent(new Event('appLoadingComplete'));
        }
    }, 10000);
}

export function skipLoading(): void {
    const loadingScreen = document.getElementById('app-loading');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }
    window.dispatchEvent(new Event('appLoadingComplete'));
}

/**
 * Bootstrap Application
 */
export async function bootstrap(): Promise<void> {
    mountMarkup();

    // Initialize all components and features
    initNavbar();
    initFooter();
    initInstallModal();
    initOfflineIndicator();
    initOnboarding();
    initGames();
    initContribute();
    initQuiz();
    initChat();
    await initHome();

    // Initialize Hash Routing
    router.init((route) => {
        showSection(route);
    });

    handleAppLoading();

    // Register Service Worker on web if supported and not in Electron
    const isElectron = Boolean((window as unknown as { process?: { versions?: { electron?: string } } }).process?.versions?.electron);
    if ('serviceWorker' in navigator && !isElectron) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js').catch(err => {
                console.warn('[SW] Registration failed:', err);
            });
        });
    }
}

// Global functions for backwards compatibility
(window as unknown as {
    showSection: typeof showSection;
    closeInstallModal: typeof closeInstallModal;
    openOnboarding: typeof openOnboarding;
    closeOnboarding: typeof closeOnboarding;
    skipLoading: typeof skipLoading;
    checkGameAvailable: typeof checkGameAvailable;
}).showSection = showSection;

(window as unknown as { closeInstallModal: typeof closeInstallModal }).closeInstallModal = closeInstallModal;
(window as unknown as { openOnboarding: typeof openOnboarding }).openOnboarding = openOnboarding;
(window as unknown as { closeOnboarding: typeof closeOnboarding }).closeOnboarding = closeOnboarding;
(window as unknown as { skipLoading: typeof skipLoading }).skipLoading = skipLoading;
(window as unknown as { checkGameAvailable: typeof checkGameAvailable }).checkGameAvailable = checkGameAvailable;

// Start app once DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => bootstrap());
} else {
    bootstrap();
}
