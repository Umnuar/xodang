/**
 * PWA Install Modal Component Controller
 * Event delegation for modal closing and platform-aware installation prompts.
 */

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function closeInstallModal(): void {
    const modal = document.getElementById('installGuideModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

export function openInstallModal(guideType: 'ios' | 'warning'): void {
    const modal = document.getElementById('installGuideModal');
    const iosGuide = document.getElementById('iosInstallGuide');
    const warningGuide = document.getElementById('inAppBrowserWarning');

    if (!modal) return;

    if (iosGuide) iosGuide.style.display = guideType === 'ios' ? 'block' : 'none';
    if (warningGuide) warningGuide.style.display = guideType === 'warning' ? 'block' : 'none';

    modal.style.display = 'flex';
}

export function initInstallModal(): void {
    const installBtn = document.getElementById('installButton');
    const modal = document.getElementById('installGuideModal');

    // Environment detection
    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
    const isInApp = /FBAN|FBAV|Instagram|Zalo/i.test(ua);

    // If already installed in standalone mode, hide install button
    if (isStandalone && installBtn) {
        installBtn.style.display = 'none';
    }

    // Capture PWA install prompt
    window.addEventListener('beforeinstallprompt', (e: Event) => {
        e.preventDefault();
        deferredPrompt = e as BeforeInstallPromptEvent;
        if (installBtn) {
            installBtn.style.display = 'flex';
        }
    });

    // Install Button Click Handler
    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (isInApp) {
                openInstallModal('warning');
                return;
            }

            if (deferredPrompt) {
                await deferredPrompt.prompt();
                const choice = await deferredPrompt.userChoice;
                if (choice.outcome === 'accepted') {
                    installBtn.style.display = 'none';
                }
                deferredPrompt = null;
                return;
            }

            if (isIOS) {
                openInstallModal('ios');
                return;
            }

            // Desktop / General fallback
            openInstallModal('warning');
        });
    }

    // Event Delegation for Closing Modal (Overlay or Close Button)
    if (modal) {
        modal.addEventListener('click', (e: Event) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('install-modal-overlay') || target.closest('.modal-close-btn')) {
                closeInstallModal();
            }
        });
    }

    // Expose closeInstallModal globally for Phase A backwards compatibility
    (window as unknown as { closeInstallModal: () => void }).closeInstallModal = closeInstallModal;
}
