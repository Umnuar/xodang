export interface AccessibleModalOptions {
    onClose?: () => void;
    initialFocus?: HTMLElement | null;
    labelledById?: string;
}

interface ModalState {
    previousFocus: HTMLElement | null;
    onClose?: () => void;
    keydownHandler: (e: KeyboardEvent) => void;
}

const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
].join(', ');

const modalStates = new WeakMap<HTMLElement, ModalState>();
const openModalStack: HTMLElement[] = [];
let previousBodyOverflow = '';

function isElementVisible(el: HTMLElement): boolean {
    if (el.hasAttribute('hidden')) return false;
    let current: HTMLElement | null = el;
    while (current) {
        if (current.style.display === 'none' || current.style.visibility === 'hidden') {
            return false;
        }
        if (typeof window.getComputedStyle === 'function') {
            const style = window.getComputedStyle(current);
            if (style.display === 'none' || style.visibility === 'hidden') {
                return false;
            }
        }
        current = current.parentElement;
    }
    return true;
}

function getFocusableElements(modalEl: HTMLElement): HTMLElement[] {
    return Array.from(modalEl.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(isElementVisible);
}

export function openAccessibleModal(modalEl: HTMLElement, options: AccessibleModalOptions = {}): void {
    modalEl.setAttribute('role', 'dialog');
    modalEl.setAttribute('aria-modal', 'true');
    if (options.labelledById) {
        modalEl.setAttribute('aria-labelledby', options.labelledById);
    }

    const existingState = modalStates.get(modalEl);
    if (existingState) {
        existingState.onClose = options.onClose;
    } else {
        const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;

        if (openModalStack.length === 0) {
            previousBodyOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
        }
        openModalStack.push(modalEl);

        const keydownHandler = (e: KeyboardEvent): void => {
            if (openModalStack[openModalStack.length - 1] !== modalEl) return;

            if (e.key === 'Escape') {
                e.preventDefault();
                const currentState = modalStates.get(modalEl);
                if (currentState?.onClose) {
                    currentState.onClose();
                } else {
                    closeAccessibleModal(modalEl);
                }
                return;
            }

            if (e.key === 'Tab') {
                const focusables = getFocusableElements(modalEl);
                if (focusables.length === 0) {
                    e.preventDefault();
                    if (!modalEl.hasAttribute('tabindex')) {
                        modalEl.setAttribute('tabindex', '-1');
                    }
                    modalEl.focus();
                    return;
                }

                const first = focusables[0];
                const last = focusables[focusables.length - 1];
                const active = document.activeElement;

                if (e.shiftKey) {
                    if (active === first || !modalEl.contains(active)) {
                        e.preventDefault();
                        last.focus();
                    }
                } else if (active === last || !modalEl.contains(active)) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };

        document.addEventListener('keydown', keydownHandler);
        modalStates.set(modalEl, {
            previousFocus,
            onClose: options.onClose,
            keydownHandler
        });
    }

    const focusables = getFocusableElements(modalEl);
    const target = options.initialFocus && isElementVisible(options.initialFocus)
        ? options.initialFocus
        : (focusables[0] ?? modalEl);

    if (target === modalEl && !modalEl.hasAttribute('tabindex')) {
        modalEl.setAttribute('tabindex', '-1');
    }
    target.focus();
}

export function closeAccessibleModal(modalEl: HTMLElement): void {
    const state = modalStates.get(modalEl);
    if (!state) return;

    document.removeEventListener('keydown', state.keydownHandler);
    modalStates.delete(modalEl);

    const stackIndex = openModalStack.lastIndexOf(modalEl);
    if (stackIndex !== -1) {
        openModalStack.splice(stackIndex, 1);
    }

    if (openModalStack.length === 0) {
        document.body.style.overflow = previousBodyOverflow;
    }

    if (state.previousFocus && state.previousFocus.isConnected) {
        state.previousFocus.focus();
    }
}
