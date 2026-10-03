/**
 * Game 1: Lật Thẻ Trí Nhớ (Memory Flip Game)
 * Student matches Sedang words with Vietnamese meanings by flipping cards.
 * Implements strict destroy() lifecycle to prevent memory leaks.
 */

import { getMemoryCardPairs } from './game-data';
import { soundEffects } from './sound-effects';
import { getLucideIcon } from '@/renderer/utils/icons';

export interface Game1Callbacks {
    onScoreChange: (score: number) => void;
    onLevelComplete: (level: number, score: number) => void;
}

export class Game1Memory {
    private container: HTMLElement;
    private callbacks: Game1Callbacks;
    private level = 1;
    private score = 0;
    private flippedIndices: number[] = [];
    private matchedPairs = 0;
    private totalPairs = 4;
    private canFlip = true;
    private cards: Array<{ id: string; pairId: number; content: string; type: 'question' | 'answer' }> = [];
    private flipTimeoutId: number | null = null;
    private clickHandler: ((e: Event) => void) | null = null;

    constructor(container: HTMLElement, callbacks: Game1Callbacks) {
        this.container = container;
        this.callbacks = callbacks;
    }

    start(level: number = 1): void {
        this.level = level;
        this.matchedPairs = 0;
        this.flippedIndices = [];
        this.canFlip = true;
        this.totalPairs = Math.min(3 + level, 8); // 4 to 8 pairs

        this.cards = getMemoryCardPairs(this.level, this.totalPairs);
        this.render();
    }

    private render(): void {
        this.container.innerHTML = `
            <div class="game-hud-sub">
                <span>Ghép đúng: <strong id="game1Matched">0</strong>/${this.totalPairs} cặp</span>
            </div>
            <div class="memory-grid" id="memoryGrid"></div>
        `;

        const grid = this.container.querySelector('#memoryGrid') as HTMLElement;
        if (!grid) return;

        // Render card nodes safely
        grid.replaceChildren();
        this.cards.forEach((card, index) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'memory-card';
            cardEl.dataset.index = String(index);
            cardEl.setAttribute('role', 'button');
            cardEl.setAttribute('tabindex', '0');
            cardEl.setAttribute('aria-label', `Thẻ số ${index + 1}`);

            const cardInner = document.createElement('div');
            cardInner.className = 'memory-card-inner';

            const cardFront = document.createElement('div');
            cardFront.className = 'memory-card-front';
            cardFront.innerHTML = getLucideIcon('help-circle', 'lucide-icon', 24);

            const cardBack = document.createElement('div');
            cardBack.className = 'memory-card-back';
            const span = document.createElement('span');
            span.textContent = card.content;
            cardBack.appendChild(span);

            cardInner.appendChild(cardFront);
            cardInner.appendChild(cardBack);
            cardEl.appendChild(cardInner);
            grid.appendChild(cardEl);
        });

        // Event delegation on grid container
        this.clickHandler = (e: Event) => {
            const target = e.target as HTMLElement;
            const cardEl = target.closest('.memory-card') as HTMLElement | null;
            if (cardEl && cardEl.dataset.index !== undefined) {
                const idx = parseInt(cardEl.dataset.index, 10);
                this.flipCard(idx);
            }
        };
        grid.addEventListener('click', this.clickHandler);
    }

    private flipCard(index: number): void {
        if (!this.canFlip) return;
        if (this.flippedIndices.includes(index)) return;

        const cardEls = this.container.querySelectorAll('.memory-card');
        const cardEl = cardEls[index];
        if (!cardEl || cardEl.classList.contains('matched')) return;

        soundEffects.click();
        cardEl.classList.add('flipped');
        this.flippedIndices.push(index);

        if (this.flippedIndices.length === 2) {
            this.canFlip = false;
            const [idx1, idx2] = this.flippedIndices;
            const card1 = this.cards[idx1];
            const card2 = this.cards[idx2];

            if (card1.pairId === card2.pairId && card1.type !== card2.type) {
                // Correct match!
                soundEffects.match();
                cardEls[idx1].classList.add('matched');
                cardEls[idx2].classList.add('matched');
                this.matchedPairs++;
                this.score += 50 + this.level * 10;
                this.callbacks.onScoreChange(this.score);

                const matchedEl = this.container.querySelector('#game1Matched');
                if (matchedEl) matchedEl.textContent = String(this.matchedPairs);

                this.flippedIndices = [];
                this.canFlip = true;

                if (this.matchedPairs >= this.totalPairs) {
                    soundEffects.levelUp();
                    setTimeout(() => {
                        this.callbacks.onLevelComplete(this.level, this.score);
                    }, 600);
                }
            } else {
                // Wrong match
                soundEffects.wrong();
                this.flipTimeoutId = window.setTimeout(() => {
                    cardEls[idx1].classList.remove('flipped');
                    cardEls[idx2].classList.remove('flipped');
                    this.flippedIndices = [];
                    this.canFlip = true;
                }, 800);
            }
        }
    }

    destroy(): void {
        if (this.flipTimeoutId !== null) {
            clearTimeout(this.flipTimeoutId);
            this.flipTimeoutId = null;
        }
        const grid = this.container.querySelector('#memoryGrid');
        if (grid && this.clickHandler) {
            grid.removeEventListener('click', this.clickHandler);
            this.clickHandler = null;
        }
        this.container.innerHTML = '';
    }
}
