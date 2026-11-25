import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { openAccessibleModal, closeAccessibleModal } from '@/utils/modal-a11y';
import { showToast } from '@/components/toast';

describe('Modal A11y & Toast Behavior Regression Tests (UI-11, UI-12)', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        document.body.style.overflow = '';
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('UI-11: openAccessibleModal sets dialog ARIA, traps Tab/Shift+Tab, handles Escape, stacks scroll lock, and restores focus', () => {
        document.body.innerHTML = `
            <button id="triggerBtn" type="button">Open Modal</button>
            <div id="modalA" style="display: flex;">
                <h2 id="modalATitle">Modal A</h2>
                <button id="aFirst" type="button">First</button>
                <button id="aHidden" type="button" style="display: none;">Hidden</button>
                <button id="aSecond" type="button">Second</button>
            </div>
            <div id="modalB" style="display: flex;">
                <h2 id="modalBTitle">Modal B</h2>
                <button id="bOnly" type="button">Only B</button>
            </div>
        `;

        const triggerBtn = document.getElementById('triggerBtn') as HTMLButtonElement;
        const modalA = document.getElementById('modalA') as HTMLElement;
        const aFirst = document.getElementById('aFirst') as HTMLButtonElement;
        const aSecond = document.getElementById('aSecond') as HTMLButtonElement;
        const modalB = document.getElementById('modalB') as HTMLElement;
        const bOnly = document.getElementById('bOnly') as HTMLButtonElement;

        const onCloseA = vi.fn(() => {
            modalA.style.display = 'none';
            closeAccessibleModal(modalA);
        });
        const onCloseB = vi.fn(() => {
            modalB.style.display = 'none';
            closeAccessibleModal(modalB);
        });

        triggerBtn.focus();
        expect(document.activeElement).toBe(triggerBtn);

        openAccessibleModal(modalA, {
            labelledById: 'modalATitle',
            onClose: onCloseA
        });

        expect(modalA.getAttribute('role')).toBe('dialog');
        expect(modalA.getAttribute('aria-modal')).toBe('true');
        expect(modalA.getAttribute('aria-labelledby')).toBe('modalATitle');
        expect(document.body.style.overflow).toBe('hidden');
        expect(document.activeElement).toBe(aFirst);

        aSecond.focus();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
        expect(document.activeElement).toBe(aFirst);

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }));
        expect(document.activeElement).toBe(aSecond);

        openAccessibleModal(modalB, {
            labelledById: 'modalBTitle',
            onClose: onCloseB
        });
        expect(document.activeElement).toBe(bOnly);
        expect(document.body.style.overflow).toBe('hidden');

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(onCloseB).toHaveBeenCalledTimes(1);
        expect(onCloseA).not.toHaveBeenCalled();
        expect(document.body.style.overflow).toBe('hidden');
        expect(document.activeElement).toBe(aSecond);

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(onCloseA).toHaveBeenCalledTimes(1);
        expect(document.body.style.overflow).toBe('');
        expect(document.activeElement).toBe(triggerBtn);
    });

    it('UI-12: showToast avoids inline minWidth/minHeight on close button, removes on fade-out click, and pauses on hover', () => {
        vi.useFakeTimers();
        document.body.innerHTML = '<div id="toastContainer" role="status" aria-live="polite"></div>';

        showToast('Cảnh báo thử nghiệm', 'warning');
        const container = document.getElementById('toastContainer')!;
        const toast = container.querySelector('.toast.warning') as HTMLElement;
        expect(toast).not.toBeNull();

        const closeBtn = toast.querySelector('.toast-close-btn') as HTMLButtonElement;
        expect(closeBtn).not.toBeNull();
        expect(closeBtn.style.minWidth).toBe('');
        expect(closeBtn.style.minHeight).toBe('');

        vi.advanceTimersByTime(2000);
        toast.dispatchEvent(new MouseEvent('mouseenter'));
        vi.advanceTimersByTime(5000);
        expect(container.contains(toast)).toBe(true);

        toast.dispatchEvent(new MouseEvent('mouseleave'));
        vi.advanceTimersByTime(2400);
        expect(container.contains(toast)).toBe(true);

        vi.advanceTimersByTime(200);
        expect(toast.classList.contains('show')).toBe(false);
        expect(container.contains(toast)).toBe(true);

        closeBtn.click();
        expect(container.contains(toast)).toBe(false);
    });
});
