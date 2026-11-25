import { getMemoryCardPairs, type GameWordPair, type MemoryCardItem } from './game-data';
import { soundEffects } from './sound-effects';
import { getLucideIcon } from '@/utils/icons';
import { getAudioUrl } from '@/services/offline-sync.service';

export interface Game1TargetInfo {
    text: string;
    driveId?: string;
    pronunciation?: string;
}

export interface Game1Callbacks {
    onScoreChange: (score: number) => void;
    onLevelComplete: (level: number, score: number) => void;
    onProgressChange?: (current: number, total: number) => void;
    onComboChange?: (combo: number) => void;
    onMistake?: (pair: GameWordPair) => void;
    onTargetChange?: (target: Game1TargetInfo | null) => void;
}

function normalizeMatchText(text: string): string {
    return (text || '').normalize('NFC').trim().toLowerCase();
}

export class Game1Memory {
    private container: HTMLElement;
    private callbacks: Game1Callbacks;
    private level = 1;
    private score = 0;
    private combo = 0;
    private flippedIndices: number[] = [];
    private matchedPairs = 0;
    private totalPairs = 4;
    private canFlip = true;
    private cards: MemoryCardItem[] = [];
    private activePairs = new Map<number, GameWordPair>();
    private validPairKeys = new Set<string>();
    private mistakes: GameWordPair[] = [];
    private flipTimeoutId: number | null = null;
    private levelCompleteTimeoutId: number | null = null;
    private activeAudio: HTMLAudioElement | null = null;
    private clickHandler: ((e: Event) => void) | null = null;
    private keyDownHandler: ((e: KeyboardEvent) => void) | null = null;

    constructor(container: HTMLElement, callbacks: Game1Callbacks) {
        this.container = container;
        this.callbacks = callbacks;
    }

    start(level: number = 1, carryScore: number = 0): void {
        this.cleanup();
        this.level = level;
        this.score = carryScore;
        this.combo = 0;
        this.matchedPairs = 0;
        this.flippedIndices = [];
        this.canFlip = true;
        this.mistakes = [];
        this.activePairs.clear();
        this.validPairKeys.clear();

        const requestedPairs = Math.min(3 + level, 8);
        this.cards = getMemoryCardPairs(this.level, requestedPairs);

        this.callbacks.onTargetChange?.(null);
        this.callbacks.onComboChange?.(0);

        if (this.cards.length === 0) {
            this.totalPairs = 0;
            this.callbacks.onProgressChange?.(0, 0);
            this.renderEmptyState();
            return;
        }

        this.buildActivePairTable();
        this.totalPairs = Math.floor(this.cards.length / 2);
        this.callbacks.onProgressChange?.(0, this.totalPairs);
        this.render();
    }

    getMistakes(): GameWordPair[] {
        return [...this.mistakes];
    }

    private buildActivePairTable(): void {
        const grouped = new Map<number, { ethnic?: MemoryCardItem; viet?: MemoryCardItem }>();
        for (const card of this.cards) {
            const group = grouped.get(card.pairId) ?? {};
            const isEthnic = card.lang === 'ethnic' || card.type === 'question';
            if (isEthnic) {
                group.ethnic = card;
            } else {
                group.viet = card;
            }
            grouped.set(card.pairId, group);
        }

        for (const [pairId, group] of grouped.entries()) {
            if (group.ethnic && group.viet) {
                const pair: GameWordPair = {
                    ethnic: group.ethnic.content,
                    viet: group.viet.content,
                    driveId: group.ethnic.driveId ?? group.viet.driveId,
                    pronunciation: group.ethnic.pronunciation ?? group.viet.pronunciation
                };
                this.activePairs.set(pairId, pair);
                this.validPairKeys.add(
                    `${normalizeMatchText(pair.ethnic)}||${normalizeMatchText(pair.viet)}`
                );
            }
        }
    }

    private getCardLangLabel(card: MemoryCardItem): string {
        const lang = card.lang ?? (card.type === 'question' ? 'ethnic' : 'viet');
        return lang === 'ethnic' ? 'Xơ Đăng' : 'Tiếng Việt';
    }

    private updateCardAria(
        cardEl: Element,
        card: MemoryCardItem,
        index: number,
        state: 'hidden' | 'flipped' | 'matched'
    ): void {
        if (state === 'hidden') {
            cardEl.setAttribute('aria-label', `Thẻ số ${index + 1}, chưa lật`);
            cardEl.setAttribute('aria-pressed', 'false');
            return;
        }
        const langLabel = this.getCardLangLabel(card);
        const statusText = state === 'matched' ? 'đã ghép' : 'đã lật';
        cardEl.setAttribute('aria-label', `Thẻ số ${index + 1}: ${card.content} (${langLabel}), ${statusText}`);
        cardEl.setAttribute('aria-pressed', 'true');
    }

    private announce(message: string): void {
        const liveEl = this.container.querySelector('#game1LiveRegion');
        if (liveEl) {
            liveEl.textContent = message;
        }
    }

    private isMatchingPair(card1: MemoryCardItem, card2: MemoryCardItem): boolean {
        if (card1.type === card2.type) return false;
        if (card1.pairId === card2.pairId) return true;

        const ethnicCard = card1.type === 'question' ? card1 : card2;
        const vietCard = card1.type === 'answer' ? card1 : card2;
        const key = `${normalizeMatchText(ethnicCard.content)}||${normalizeMatchText(vietCard.content)}`;
        return this.validPairKeys.has(key);
    }

    private recordMistake(pair: GameWordPair | undefined): void {
        if (!pair || !pair.ethnic || !pair.viet) return;
        const key = `${normalizeMatchText(pair.ethnic)}||${normalizeMatchText(pair.viet)}`;
        const exists = this.mistakes.some(
            m => `${normalizeMatchText(m.ethnic)}||${normalizeMatchText(m.viet)}` === key
        );
        if (!exists) {
            this.mistakes.push(pair);
        }
        this.callbacks.onMistake?.(pair);
    }

    private stopActiveAudio(): void {
        if (this.activeAudio) {
            try {
                this.activeAudio.pause();
                this.activeAudio.currentTime = 0;
            } catch {
            }
            this.activeAudio = null;
        }
    }

    private playPronunciation(driveId: string): void {
        const url = getAudioUrl(driveId);
        if (!url || typeof Audio === 'undefined') return;

        this.stopActiveAudio();
        soundEffects.duckForAudio(1500);

        try {
            const audio = new Audio(url);
            this.activeAudio = audio;
            audio.onerror = () => {
                if (this.activeAudio === audio) {
                    this.activeAudio = null;
                }
            };
            audio.onended = () => {
                if (this.activeAudio === audio) {
                    this.activeAudio = null;
                }
            };
            const playPromise = audio.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                void playPromise.catch(() => {});
            }
        } catch {
        }
    }

    private renderEmptyState(): void {
        this.container.innerHTML = '';
        const emptyBox = document.createElement('div');
        emptyBox.className = 'game-empty-state';
        emptyBox.setAttribute('role', 'status');
        emptyBox.textContent = 'Chưa có đủ từ vựng để tạo cặp thẻ cho trò chơi này. Vui lòng thử lại sau.';
        this.container.appendChild(emptyBox);
    }

    private render(): void {
        this.container.innerHTML = `
            <div class="game-hud-sub">
                <span>Ghép đúng: <strong id="game1Matched">0</strong>/${this.totalPairs} cặp</span>
            </div>
            <div id="game1LiveRegion" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></div>
            <div class="memory-grid" id="memoryGrid"></div>
        `;

        const grid = this.container.querySelector<HTMLElement>('#memoryGrid');
        if (!grid) return;

        grid.replaceChildren();
        this.cards.forEach((card, index) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'memory-card';
            cardEl.dataset.index = String(index);
            cardEl.setAttribute('role', 'button');
            cardEl.setAttribute('tabindex', '0');
            this.updateCardAria(cardEl, card, index, 'hidden');

            const cardInner = document.createElement('div');
            cardInner.className = 'memory-card-inner';

            const cardFront = document.createElement('div');
            cardFront.className = 'memory-card-front';
            cardFront.innerHTML = getLucideIcon('help-circle', 'lucide-icon', 24);

            const cardBack = document.createElement('div');
            cardBack.className = 'memory-card-back';

            const langTag = document.createElement('span');
            langTag.className = 'memory-card-lang';
            langTag.style.fontSize = '0.7rem';
            langTag.style.fontWeight = '600';
            langTag.textContent = this.getCardLangLabel(card);

            const wordSpan = document.createElement('span');
            wordSpan.className = 'memory-card-word';
            wordSpan.textContent = card.content;

            cardBack.appendChild(langTag);
            cardBack.appendChild(wordSpan);

            cardInner.appendChild(cardFront);
            cardInner.appendChild(cardBack);
            cardEl.appendChild(cardInner);
            grid.appendChild(cardEl);
        });

        this.clickHandler = (e: Event) => {
            const target = e.target as HTMLElement;
            const cardEl = target.closest('.memory-card') as HTMLElement | null;
            if (cardEl && cardEl.dataset.index !== undefined) {
                const idx = parseInt(cardEl.dataset.index, 10);
                this.flipCard(idx);
            }
        };
        grid.addEventListener('click', this.clickHandler);

        this.keyDownHandler = (e: KeyboardEvent) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            const target = e.target as HTMLElement;
            const cardEl = target.closest('.memory-card') as HTMLElement | null;
            if (cardEl && cardEl.dataset.index !== undefined) {
                e.preventDefault();
                const idx = parseInt(cardEl.dataset.index, 10);
                this.flipCard(idx);
            }
        };
        grid.addEventListener('keydown', this.keyDownHandler);
    }

    private flipCard(index: number): void {
        if (!this.canFlip) return;
        if (this.flippedIndices.includes(index)) return;

        const cardEls = this.container.querySelectorAll('.memory-card');
        const cardEl = cardEls[index];
        const card = this.cards[index];
        if (!cardEl || !card || cardEl.classList.contains('matched')) return;

        soundEffects.click();
        cardEl.classList.add('flipped');
        this.updateCardAria(cardEl, card, index, 'flipped');
        this.flippedIndices.push(index);

        if (this.flippedIndices.length === 2) {
            this.canFlip = false;
            const [idx1, idx2] = this.flippedIndices;
            const card1 = this.cards[idx1];
            const card2 = this.cards[idx2];

            if (this.isMatchingPair(card1, card2)) {
                cardEls[idx1].classList.add('matched');
                cardEls[idx2].classList.add('matched');
                this.updateCardAria(cardEls[idx1], card1, idx1, 'matched');
                this.updateCardAria(cardEls[idx2], card2, idx2, 'matched');

                this.matchedPairs++;
                this.combo++;
                this.score += 50 + this.level * 10;
                this.callbacks.onScoreChange(this.score);
                this.callbacks.onProgressChange?.(this.matchedPairs, this.totalPairs);
                this.callbacks.onComboChange?.(this.combo);

                const matchedEl = this.container.querySelector('#game1Matched');
                if (matchedEl) matchedEl.textContent = String(this.matchedPairs);

                const ethnicCard = card1.type === 'question' ? card1 : card2;
                const vietCard = card1.type === 'answer' ? card1 : card2;
                const matchedPair = this.activePairs.get(ethnicCard.pairId) ?? {
                    ethnic: ethnicCard.content,
                    viet: vietCard.content,
                    driveId: ethnicCard.driveId ?? vietCard.driveId,
                    pronunciation: ethnicCard.pronunciation ?? vietCard.pronunciation
                };

                this.announce(`Đã ghép đúng cặp: ${matchedPair.ethnic} nghĩa là ${matchedPair.viet}.`);

                if (matchedPair.driveId) {
                    this.callbacks.onTargetChange?.({
                        text: matchedPair.ethnic,
                        driveId: matchedPair.driveId,
                        pronunciation: matchedPair.pronunciation
                    });
                    this.playPronunciation(matchedPair.driveId);
                }

                this.flippedIndices = [];
                this.canFlip = true;

                if (this.matchedPairs >= this.totalPairs) {
                    soundEffects.levelUp();
                    if (this.levelCompleteTimeoutId !== null) {
                        clearTimeout(this.levelCompleteTimeoutId);
                    }
                    this.levelCompleteTimeoutId = window.setTimeout(() => {
                        this.levelCompleteTimeoutId = null;
                        this.callbacks.onLevelComplete(this.level, this.score);
                    }, 600);
                } else {
                    soundEffects.match();
                }
            } else {
                soundEffects.wrong();
                this.combo = 0;
                this.callbacks.onComboChange?.(0);
                this.announce(`Chưa khớp: ${card1.content} và ${card2.content}. Thử lại.`);

                const pair1 = this.activePairs.get(card1.pairId);
                const pair2 = this.activePairs.get(card2.pairId);
                this.recordMistake(pair1);
                if (pair2 && pair2 !== pair1) {
                    this.recordMistake(pair2);
                }

                this.flipTimeoutId = window.setTimeout(() => {
                    this.flipTimeoutId = null;
                    if (cardEls[idx1]) {
                        cardEls[idx1].classList.remove('flipped');
                        this.updateCardAria(cardEls[idx1], card1, idx1, 'hidden');
                    }
                    if (cardEls[idx2]) {
                        cardEls[idx2].classList.remove('flipped');
                        this.updateCardAria(cardEls[idx2], card2, idx2, 'hidden');
                    }
                    this.flippedIndices = [];
                    this.canFlip = true;
                }, 800);
            }
        }
    }

    private cleanup(): void {
        if (this.flipTimeoutId !== null) {
            clearTimeout(this.flipTimeoutId);
            this.flipTimeoutId = null;
        }
        if (this.levelCompleteTimeoutId !== null) {
            clearTimeout(this.levelCompleteTimeoutId);
            this.levelCompleteTimeoutId = null;
        }
        this.stopActiveAudio();
        const grid = this.container.querySelector<HTMLElement>('#memoryGrid');
        if (grid) {
            if (this.clickHandler) {
                grid.removeEventListener('click', this.clickHandler);
                this.clickHandler = null;
            }
            if (this.keyDownHandler) {
                grid.removeEventListener('keydown', this.keyDownHandler);
                this.keyDownHandler = null;
            }
        }
        this.container.replaceChildren();
    }

    destroy(): void {
        this.cleanup();
    }
}
