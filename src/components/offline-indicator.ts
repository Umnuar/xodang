import { showToast } from './toast';
import { getLucideIcon } from '@/utils/icons';

export function initOfflineIndicator(): void {
    const indicator = document.getElementById('offlineIndicator');
    if (!indicator) return;

    let hideTimeoutId: ReturnType<typeof setTimeout> | null = null;

    function clearHideTimeout(): void {
        if (hideTimeoutId !== null) {
            clearTimeout(hideTimeoutId);
            hideTimeoutId = null;
        }
    }

    function updateStatus(isOnline: boolean): void {
        if (!indicator) return;
        clearHideTimeout();

        if (isOnline) {
            indicator.classList.add('online', 'show');
            indicator.setAttribute('aria-hidden', 'false');
            indicator.innerHTML = `${getLucideIcon('wifi', 'lucide-icon', 16)} <span>Đã kết nối lại</span>`;
            showToast('Đã kết nối lại mạng Internet', 'success');

            hideTimeoutId = setTimeout(() => {
                hideTimeoutId = null;
                indicator.classList.remove('online', 'show');
                indicator.setAttribute('aria-hidden', 'true');
            }, 3000);
        } else {
            indicator.classList.remove('online');
            indicator.classList.add('show');
            indicator.setAttribute('aria-hidden', 'false');
            indicator.innerHTML = `${getLucideIcon('wifi-off', 'lucide-icon', 16)} <span>Đang offline</span>`;
            showToast('Mất kết nối mạng. Ứng dụng chuyển sang chế độ Offline.', 'warning');
        }
    }

    window.addEventListener('online', () => updateStatus(true));
    window.addEventListener('offline', () => updateStatus(false));

    if (!navigator.onLine) {
        indicator.classList.add('show');
        indicator.setAttribute('aria-hidden', 'false');
    } else {
        indicator.classList.remove('show', 'online');
        indicator.setAttribute('aria-hidden', 'true');
    }
}
