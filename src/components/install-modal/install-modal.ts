import { closeAccessibleModal, openAccessibleModal } from '@/utils/modal-a11y';
import { showToast } from '@/components/toast';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function closeInstallModal(): void {
    const modal = document.getElementById('installGuideModal');
    if (modal) {
        modal.style.display = 'none';
        closeAccessibleModal(modal);
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
    const closeBtn = modal.querySelector<HTMLElement>('.modal-close-btn');
    openAccessibleModal(modal, {
        onClose: closeInstallModal,
        initialFocus: closeBtn,
        labelledById: guideType === 'ios' ? 'installModalHeading' : 'warningTitle'
    });
}

export function initInstallModal(): void {
    const installBtn = document.getElementById('installButton');
    const modal = document.getElementById('installGuideModal');

    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
    const isInApp = /FBAN|FBAV|Instagram|Zalo/i.test(ua);

    if (installBtn && (isStandalone || (!isInApp && !isIOS && !deferredPrompt))) {
        installBtn.style.display = 'none';
    }

    window.addEventListener('beforeinstallprompt', (e: Event) => {
        e.preventDefault();
        deferredPrompt = e as BeforeInstallPromptEvent;
        if (installBtn && !isStandalone) {
            installBtn.style.display = 'inline-flex';
        }
    });

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        if (installBtn) {
            installBtn.style.display = 'none';
        }
        closeInstallModal();
    });

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
                } else {
                    showToast('Bạn có thể cài đặt ứng dụng từ thanh địa chỉ trình duyệt bất kỳ lúc nào.', 'info');
                }
                deferredPrompt = null;
                return;
            }

            if (isIOS) {
                openInstallModal('ios');
                return;
            }

            showToast('Trình duyệt hiện tại chưa hỗ trợ cài đặt nhanh.', 'info');
        });
    }

    if (modal) {
        modal.addEventListener('click', (e: Event) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('install-modal-overlay') || target.closest('.modal-close-btn')) {
                closeInstallModal();
            }
        });
    }
}
