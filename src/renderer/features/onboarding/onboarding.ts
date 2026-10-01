/**
 * Onboarding Modal Controller
 * Handles 6 slide walkthrough, pagination dots, keyboard navigation,
 * and first-visit detection with localStorage persistence.
 */

import { STORAGE_KEYS } from '@/shared/constants/storage-keys';

export class OnboardingController {
    private modal: HTMLElement | null = null;
    private slides: HTMLElement[] = [];
    private dots: HTMLElement[] = [];
    private prevBtn: HTMLButtonElement | null = null;
    private nextBtn: HTMLButtonElement | null = null;
    private currentSlide = 0;

    init(): void {
        this.modal = document.getElementById('onboardingModal');
        if (!this.modal) return;

        this.slides = Array.from(this.modal.querySelectorAll<HTMLElement>('.onboarding-slide'));
        this.dots = Array.from(this.modal.querySelectorAll<HTMLElement>('.onboarding-dot'));
        this.prevBtn = this.modal.querySelector<HTMLButtonElement>('#onboardingPrevBtn');
        this.nextBtn = this.modal.querySelector<HTMLButtonElement>('#onboardingNextBtn');
        const closeBtn = this.modal.querySelector<HTMLButtonElement>('#closeOnboardingBtn');
        const startBtn = this.modal.querySelector<HTMLButtonElement>('#onboardingStartBtn');
        const overlay = this.modal.querySelector<HTMLElement>('.onboarding-overlay');

        // Navigation controls
        this.prevBtn?.addEventListener('click', () => this.prev());
        this.nextBtn?.addEventListener('click', () => this.next());
        closeBtn?.addEventListener('click', () => this.complete());
        startBtn?.addEventListener('click', () => this.complete());
        overlay?.addEventListener('click', () => this.complete());

        // Dot navigation
        this.dots.forEach((dot, idx) => {
            dot.addEventListener('click', () => this.goToSlide(idx));
        });

        // Keyboard shortcuts
        window.addEventListener('keydown', (e: KeyboardEvent) => {
            if (!this.isOpen()) return;
            if (e.key === 'ArrowRight') this.next();
            if (e.key === 'ArrowLeft') this.prev();
            if (e.key === 'Escape') this.complete();
        });

        this.updateSlideUI();

        // Auto-show for first-time visitors
        const hasSeen = localStorage.getItem(STORAGE_KEYS.HAS_SEEN_INTRO);
        if (hasSeen !== 'true') {
            this.open();
        }
    }

    isOpen(): boolean {
        return this.modal !== null && this.modal.style.display !== 'none';
    }

    open(): void {
        if (!this.modal) return;
        this.currentSlide = 0;
        this.updateSlideUI();
        this.modal.style.display = 'flex';
    }

    close(): void {
        if (!this.modal) return;
        this.modal.style.display = 'none';
    }

    complete(): void {
        localStorage.setItem(STORAGE_KEYS.HAS_SEEN_INTRO, 'true');
        this.close();
    }

    goToSlide(index: number): void {
        if (index < 0 || index >= this.slides.length) return;
        this.currentSlide = index;
        this.updateSlideUI();
    }

    next(): void {
        if (this.currentSlide < this.slides.length - 1) {
            this.goToSlide(this.currentSlide + 1);
        }
    }

    prev(): void {
        if (this.currentSlide > 0) {
            this.goToSlide(this.currentSlide - 1);
        }
    }

    getCurrentSlide(): number {
        return this.currentSlide;
    }

    private updateSlideUI(): void {
        this.slides.forEach((slide, idx) => {
            if (idx === this.currentSlide) {
                slide.classList.add('active');
            } else {
                slide.classList.remove('active');
            }
        });

        this.dots.forEach((dot, idx) => {
            if (idx === this.currentSlide) {
                dot.classList.add('active');
                dot.setAttribute('aria-selected', 'true');
            } else {
                dot.classList.remove('active');
                dot.setAttribute('aria-selected', 'false');
            }
        });

        if (this.prevBtn) {
            this.prevBtn.disabled = this.currentSlide === 0;
        }
        if (this.nextBtn) {
            this.nextBtn.disabled = this.currentSlide === this.slides.length - 1;
        }
    }
}

export const onboardingController = new OnboardingController();

export function initOnboarding(): void {
    onboardingController.init();
}

export function openOnboarding(): void {
    onboardingController.open();
}

export function closeOnboarding(): void {
    onboardingController.close();
}
