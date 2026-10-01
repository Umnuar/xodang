/**
 * Games Feature Controller (Phase A Wrapper)
 * Hosts game.html via iframe and checks offline availability.
 * In Phase B, this will be replaced with 4 native canvas games.
 */

import { showToast } from '@/renderer/components/toast';
import { eventBus } from '@/renderer/components/event-bus';

export function checkGameAvailable(): boolean {
    if (!navigator.onLine) {
        if ('caches' in window) {
            caches.match('./game.html').then(response => {
                if (!response) {
                    showToast('⚠️ Bạn đang offline. Game chỉ khả dụng khi có kết nối internet.', 'warning');
                }
            }).catch(() => {
                showToast('⚠️ Bạn đang offline. Game chỉ khả dụng khi có kết nối internet.', 'warning');
            });
        }
        return false;
    }
    return true;
}

export function initGames(): void {
    eventBus.on('tab:change', (sectionId: string) => {
        if (sectionId === 'game') {
            checkGameAvailable();
        }
    });

    // Expose checkGameAvailable globally for Phase A backwards compatibility
    (window as unknown as { checkGameAvailable: () => boolean }).checkGameAvailable = checkGameAvailable;
}
