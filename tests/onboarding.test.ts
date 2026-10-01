import { describe, it, expect, beforeEach } from 'vitest';
import { OnboardingController } from '@/renderer/features/onboarding/onboarding';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys';
import onboardingHtml from '@/renderer/features/onboarding/onboarding.html?raw';

describe('OnboardingController', () => {
    let controller: OnboardingController;

    beforeEach(() => {
        if (!window.localStorage || typeof window.localStorage.clear !== 'function') {
            const store = new Map<string, string>();
            const mockStorage = {
                getItem: (k: string) => store.get(k) ?? null,
                setItem: (k: string, v: string) => store.set(k, String(v)),
                removeItem: (k: string) => store.delete(k),
                clear: () => store.clear(),
                get length() { return store.size; },
                key: (i: number) => Array.from(store.keys())[i] ?? null
            };
            Object.defineProperty(window, 'localStorage', {
                value: mockStorage,
                configurable: true,
                writable: true
            });
        }
        window.localStorage.clear();
        document.body.innerHTML = onboardingHtml;
        controller = new OnboardingController();
    });

    it('auto-displays modal if user has not seen intro', () => {
        expect(localStorage.getItem(STORAGE_KEYS.HAS_SEEN_INTRO)).toBeNull();

        controller.init();
        expect(controller.isOpen()).toBe(true);
    });

    it('stays hidden if user has already seen intro', () => {
        localStorage.setItem(STORAGE_KEYS.HAS_SEEN_INTRO, 'true');

        controller.init();
        expect(controller.isOpen()).toBe(false);
    });

    it('navigates through slides within bounds 0 to 5', () => {
        controller.init();
        expect(controller.getCurrentSlide()).toBe(0);

        // Prev should stay at 0
        controller.prev();
        expect(controller.getCurrentSlide()).toBe(0);

        // Next moves forward
        controller.next();
        expect(controller.getCurrentSlide()).toBe(1);

        controller.goToSlide(5);
        expect(controller.getCurrentSlide()).toBe(5);

        // Next at last slide does nothing
        controller.next();
        expect(controller.getCurrentSlide()).toBe(5);

        controller.prev();
        expect(controller.getCurrentSlide()).toBe(4);
    });

    it('updates active class and aria-selected on dots', () => {
        controller.init();
        controller.goToSlide(2);

        const dots = document.querySelectorAll('.onboarding-dot');
        expect(dots[2].classList.contains('active')).toBe(true);
        expect(dots[2].getAttribute('aria-selected')).toBe('true');
        expect(dots[0].classList.contains('active')).toBe(false);
    });

    it('persists HAS_SEEN_INTRO and hides modal on complete()', () => {
        controller.init();
        expect(controller.isOpen()).toBe(true);

        controller.complete();
        expect(localStorage.getItem(STORAGE_KEYS.HAS_SEEN_INTRO)).toBe('true');
        expect(controller.isOpen()).toBe(false);
    });

    it('allows opening and closing programmatically', () => {
        localStorage.setItem(STORAGE_KEYS.HAS_SEEN_INTRO, 'true');
        controller.init();
        expect(controller.isOpen()).toBe(false);

        controller.open();
        expect(controller.isOpen()).toBe(true);
        expect(controller.getCurrentSlide()).toBe(0);

        controller.close();
        expect(controller.isOpen()).toBe(false);
    });
});
