import { createLucideIconElement } from '@/utils/icons';

export type ToastType = 'info' | 'success' | 'error' | 'warning';

const ICON_MAP: Record<ToastType, string> = {
    info: 'info',
    success: 'check-circle',
    error: 'alert-circle',
    warning: 'alert-circle'
};

export function showToast(message: string, type: ToastType = 'info'): void {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const flexWrapper = document.createElement('div');
    flexWrapper.style.display = 'flex';
    flexWrapper.style.alignItems = 'center';
    flexWrapper.style.justifyContent = 'space-between';
    flexWrapper.style.gap = '10px';
    flexWrapper.style.width = '100%';

    const contentWrapper = document.createElement('div');
    contentWrapper.style.display = 'flex';
    contentWrapper.style.alignItems = 'center';
    contentWrapper.style.gap = '10px';

    const icon = createLucideIconElement(ICON_MAP[type] || 'info', 'lucide-icon', 18);

    const textSpan = document.createElement('span');
    textSpan.textContent = message;

    contentWrapper.appendChild(icon);
    contentWrapper.appendChild(textSpan);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'toast-close-btn';
    closeBtn.setAttribute('aria-label', 'Đóng thông báo');
    closeBtn.appendChild(createLucideIconElement('x', 'lucide-icon', 14));

    flexWrapper.appendChild(contentWrapper);
    flexWrapper.appendChild(closeBtn);
    toast.appendChild(flexWrapper);

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    const duration = type === 'error' || type === 'warning' ? 4500 : 3000;
    let remainingMs = duration;
    let timerStartedAt = 0;
    let dismissTimerId: ReturnType<typeof setTimeout> | null = null;
    let removeTimerId: ReturnType<typeof setTimeout> | null = null;
    let isPaused = false;
    let isDismissed = false;

    const dismiss = (): void => {
        if (isDismissed) return;
        isDismissed = true;
        if (dismissTimerId !== null) {
            clearTimeout(dismissTimerId);
            dismissTimerId = null;
        }
        toast.classList.remove('show');
        removeTimerId = setTimeout(() => {
            removeTimerId = null;
            toast.remove();
        }, 300);
    };

    const scheduleDismiss = (): void => {
        if (isDismissed) return;
        if (dismissTimerId !== null) {
            clearTimeout(dismissTimerId);
        }
        timerStartedAt = Date.now();
        dismissTimerId = setTimeout(dismiss, remainingMs);
    };

    const pauseTimer = (): void => {
        if (isPaused || isDismissed) return;
        isPaused = true;
        if (dismissTimerId !== null) {
            clearTimeout(dismissTimerId);
            dismissTimerId = null;
        }
        remainingMs = Math.max(0, remainingMs - (Date.now() - timerStartedAt));
    };

    const resumeTimer = (): void => {
        if (!isPaused || isDismissed) return;
        isPaused = false;
        if (remainingMs <= 0) {
            dismiss();
        } else {
            scheduleDismiss();
        }
    };

    closeBtn.addEventListener('click', () => {
        if (isDismissed) {
            if (removeTimerId !== null) {
                clearTimeout(removeTimerId);
                removeTimerId = null;
            }
            toast.remove();
            return;
        }
        dismiss();
    });

    toast.addEventListener('mouseenter', pauseTimer);
    toast.addEventListener('mouseleave', resumeTimer);
    toast.addEventListener('focusin', pauseTimer);
    toast.addEventListener('focusout', (e: FocusEvent) => {
        if (!toast.contains(e.relatedTarget as Node | null)) {
            resumeTimer();
        }
    });

    scheduleDismiss();
}
