import { hasSeenIntro, setHasSeenIntro } from '@/services/storage.service';
import { closeAccessibleModal, openAccessibleModal } from '@/utils/modal-a11y';

export class OnboardingController {
    private modal: HTMLElement | null = null;
    private slides: HTMLElement[] = [];
    private dots: HTMLElement[] = [];
    private prevBtn: HTMLButtonElement | null = null;
    private nextBtn: HTMLButtonElement | null = null;
    private closeBtn: HTMLButtonElement | null = null;
    private currentSlide = 0;

    init(): void {
        const modalEl = document.getElementById('onboardingModal');
        if (!modalEl) return;

        if (this.modal !== modalEl) {
            this.bindModal(modalEl);
        }

        this.updateSlideUI();

        if (!hasSeenIntro() && !this.isOpen()) {
            this.open();
        }
    }

    private bindModal(modalEl: HTMLElement): void {
        this.modal = modalEl;
        this.slides = Array.from(this.modal.querySelectorAll<HTMLElement>('.onboarding-slide'));
        this.dots = Array.from(this.modal.querySelectorAll<HTMLElement>('.onboarding-dot'));
        this.prevBtn = this.modal.querySelector<HTMLButtonElement>('#onboardingPrevBtn');
        this.nextBtn = this.modal.querySelector<HTMLButtonElement>('#onboardingNextBtn');
        this.closeBtn = this.modal.querySelector<HTMLButtonElement>('#closeOnboardingBtn');
        const startBtn = this.modal.querySelector<HTMLButtonElement>('#onboardingStartBtn');
        const overlay = this.modal.querySelector<HTMLElement>('.onboarding-overlay');

        this.prevBtn?.addEventListener('click', () => this.prev());
        this.nextBtn?.addEventListener('click', () => this.next());
        this.closeBtn?.addEventListener('click', () => this.complete());
        startBtn?.addEventListener('click', () => this.complete());
        overlay?.addEventListener('click', () => this.complete());

        this.dots.forEach((dot, idx) => {
            dot.addEventListener('click', () => this.goToSlide(idx));
            dot.addEventListener('keydown', (e: KeyboardEvent) => {
                if (this.dots.length === 0) return;
                let targetIdx: number | null = null;
                if (e.key === 'ArrowRight') {
                    targetIdx = (idx + 1) % this.dots.length;
                } else if (e.key === 'ArrowLeft') {
                    targetIdx = (idx - 1 + this.dots.length) % this.dots.length;
                } else if (e.key === 'Home') {
                    targetIdx = 0;
                } else if (e.key === 'End') {
                    targetIdx = this.dots.length - 1;
                }
                if (targetIdx !== null) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.goToSlide(targetIdx);
                    this.dots[targetIdx]?.focus();
                }
            });
        });

        this.modal.addEventListener('keydown', (e: KeyboardEvent) => {
            if (!this.isOpen()) return;
            if (e.key === 'ArrowRight') {
                this.next();
            } else if (e.key === 'ArrowLeft') {
                this.prev();
            }
        });

        let touchStartX = 0;
        let touchStartY = 0;

        this.modal.addEventListener('touchstart', (e: Event) => {
            const touchEvent = e as TouchEvent;
            if (touchEvent.changedTouches && touchEvent.changedTouches.length > 0) {
                touchStartX = touchEvent.changedTouches[0].screenX ?? 0;
                touchStartY = touchEvent.changedTouches[0].screenY ?? 0;
            }
        }, { passive: true });

        this.modal.addEventListener('touchend', (e: Event) => {
            const touchEvent = e as TouchEvent;
            if (touchEvent.changedTouches && touchEvent.changedTouches.length > 0) {
                const touchEndX = touchEvent.changedTouches[0].screenX ?? 0;
                const touchEndY = touchEvent.changedTouches[0].screenY ?? 0;
                const diffX = touchEndX - touchStartX;
                const diffY = touchEndY - touchStartY;
                if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
                    if (diffX < 0) {
                        this.next();
                    } else {
                        this.prev();
                    }
                }
            }
        }, { passive: true });
    }

    isOpen(): boolean {
        return this.modal !== null && this.modal.style.display !== 'none';
    }

    open(): void {
        const modalEl = document.getElementById('onboardingModal');
        if (modalEl && this.modal !== modalEl) {
            this.bindModal(modalEl);
        }
        if (!this.modal) return;
        this.currentSlide = 0;
        this.updateSlideUI();
        this.modal.style.display = 'flex';
        openAccessibleModal(this.modal, {
            onClose: () => this.complete(),
            initialFocus: this.closeBtn,
            labelledById: this.getActiveHeadingId()
        });
    }

    close(): void {
        if (!this.modal) return;
        this.modal.style.display = 'none';
        closeAccessibleModal(this.modal);
    }

    complete(): void {
        setHasSeenIntro(true);
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

    private getActiveHeadingId(): string | undefined {
        const activeSlide = this.slides[this.currentSlide];
        const heading = activeSlide?.querySelector<HTMLElement>('h2, h3');
        return heading?.id || undefined;
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
            const isActive = idx === this.currentSlide;
            if (isActive) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
            dot.setAttribute('aria-selected', String(isActive));
            dot.setAttribute('tabindex', isActive ? '0' : '-1');
        });

        const activeHeadingId = this.getActiveHeadingId();
        if (this.modal && activeHeadingId) {
            this.modal.setAttribute('aria-labelledby', activeHeadingId);
        }

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
