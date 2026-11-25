export function showLoading(message: string = 'Đang xử lý...'): void {
    const overlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    if (!overlay) return;

    if (loadingText) {
        loadingText.textContent = message;
    }
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'polite');
    overlay.setAttribute('aria-hidden', 'false');
    overlay.classList.remove('hidden');
}

export function hideLoading(): void {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.setAttribute('aria-hidden', 'true');
    }
}
