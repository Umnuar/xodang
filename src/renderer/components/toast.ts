/**
 * Toast Notification Component
 * Safe DOM creation with textContent (Anti-XSS).
 */

import { createLucideIconElement } from '@/renderer/utils/icons';

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
    flexWrapper.style.gap = '10px';

    const icon = createLucideIconElement(ICON_MAP[type] || 'info', 'lucide-icon', 18);

    const textSpan = document.createElement('span');
    textSpan.textContent = message; // Safe against XSS

    flexWrapper.appendChild(icon);
    flexWrapper.appendChild(textSpan);
    toast.appendChild(flexWrapper);

    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Auto-dismiss after 3s
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}
