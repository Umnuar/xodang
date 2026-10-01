/**
 * Loading Overlay Component
 * Controls full-screen or section-level loading spinners.
 */

export function showLoading(message: string = 'Đang xử lý...'): void {
    const overlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    if (!overlay) return;

    if (loadingText) {
        loadingText.textContent = message;
    }
    overlay.classList.remove('hidden');
}

export function hideLoading(): void {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}
