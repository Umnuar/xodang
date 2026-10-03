/**
 * Offline Indicator Component
 * Monitors online/offline network events and updates UI indicator accordingly.
 */

import { showToast } from './toast';
import { getLucideIcon } from '@/renderer/utils/icons';

export function initOfflineIndicator(): void {
    const indicator = document.getElementById('offlineIndicator');
    if (!indicator) return;

    function updateStatus(isOnline: boolean): void {
        if (!indicator) return;

        if (isOnline) {
            indicator.classList.add('online');
            indicator.classList.remove('show');
            indicator.innerHTML = `${getLucideIcon('wifi', 'lucide-icon', 16)} <span>Đã kết nối lại</span>`;
            showToast('Đã kết nối lại mạng Internet', 'success');

            setTimeout(() => {
                indicator.classList.remove('online');
            }, 3000);
        } else {
            indicator.classList.remove('online');
            indicator.classList.add('show');
            indicator.innerHTML = `${getLucideIcon('wifi-off', 'lucide-icon', 16)} <span>Đang offline</span>`;
            showToast('Mất kết nối mạng. Ứng dụng chuyển sang chế độ Offline.', 'warning');
        }
    }

    window.addEventListener('online', () => updateStatus(true));
    window.addEventListener('offline', () => updateStatus(false));

    // Initial check
    if (!navigator.onLine) {
        indicator.classList.add('show');
    }
}
