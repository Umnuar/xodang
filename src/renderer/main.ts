/**
 * Main Application Bootstrap
 * Mounts component templates, initializes controllers, registers Service Worker,
 * and maintains global interfaces for Phase A backwards compatibility.
 */

import './styles/index.css';

// HTML Templates imported via Vite ?raw
import navbarHtml from './components/navbar/navbar.html?raw';
import footerHtml from './components/footer/footer.html?raw';
import installModalHtml from './components/install-modal/install-modal.html?raw';
import chatHtml from './features/chat/chat.html?raw';
import homeHtml from './features/home/home.html?raw';
import contributeHtml from './features/contribute/contribute.html?raw';
import quizHtml from './features/quiz/quiz.html?raw';
import gamesHtml from './features/games/games.html?raw';

// Controllers
import { initNavbar, showSection } from './components/navbar/navbar';
import { initFooter } from './components/footer/footer';
import { initInstallModal, closeInstallModal } from './components/install-modal/install-modal';
import { initOfflineIndicator } from './components/offline-indicator';
import { initHome } from './features/home/home';
import { initContribute } from './features/contribute/contribute';
import { initQuiz } from './features/quiz/quiz';
import { initChat } from './features/chat/chat';
import { initGames, checkGameAvailable } from './features/games/games';
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
            <div id="offlineIndicator" class="offline-indicator">
                <i class="fas fa-wifi"></i> <span>Offline</span>
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
    }

    localStorage.setItem(STORAGE_KEYS.HAS_SEEN_INTRO, 'true');

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
    initGames();
    initContribute();
    initQuiz();
    initChat();
    await initHome();

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

// Global functions for Phase A backwards compatibility
(window as unknown as {
    showSection: typeof showSection;
    closeInstallModal: typeof closeInstallModal;
    skipLoading: typeof skipLoading;
    checkGameAvailable: typeof checkGameAvailable;
}).showSection = showSection;

(window as unknown as { closeInstallModal: typeof closeInstallModal }).closeInstallModal = closeInstallModal;
(window as unknown as { skipLoading: typeof skipLoading }).skipLoading = skipLoading;
(window as unknown as { checkGameAvailable: typeof checkGameAvailable }).checkGameAvailable = checkGameAvailable;

// Start app once DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => bootstrap());
} else {
    bootstrap();
}
