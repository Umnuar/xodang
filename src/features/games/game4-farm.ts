import { getQuestionsForLevel, shuffleArray, type GameQuestion, type GameWordPair } from './game-data';
import { soundEffects } from './sound-effects';
import { getLucideIcon } from '@/utils/icons';
import { openAccessibleModal, closeAccessibleModal } from '@/utils/modal-a11y';
import { getAudioUrl } from '@/services/offline-sync.service';

export interface Game4TargetInfo {
    text: string;
    driveId?: string;
    pronunciation?: string;
}

export interface Game4Callbacks {
    onScoreChange: (score: number) => void;
    onLevelComplete: (level: number, score: number) => void;
    onProgressChange?: (current: number, total: number) => void;
    onComboChange?: (combo: number) => void;
    onMistake?: (pair: GameWordPair) => void;
    onTargetChange?: (target: Game4TargetInfo | null) => void;
}

interface Plot {
    id: number;
    stage: 'seed' | 'sprout' | 'ready' | 'harvested';
    cropIcon: string;
}

function normalizePairKey(text: string): string {
    return (text || '').normalize('NFC').trim().toLowerCase();
}

export class Game4Farm {
    private container: HTMLElement;
    private callbacks: Game4Callbacks;

    private level = 1;
    private score = 0;
    private combo = 0;
    private harvestedCount = 0;
    private totalPlots = 4;

    private plots: Plot[] = [];
    private questions: GameQuestion[] = [];
    private questionQueue: GameQuestion[] = [];
    private lastQuestionKey = '';
    private mistakes: GameWordPair[] = [];
    private selectedPlotIndex: number | null = null;
    private currentQuestion: GameQuestion | null = null;
    private isAwaitingFeedback = false;
    private clickHandler: ((e: MouseEvent) => void) | null = null;
    private levelCompleteTimeoutId: number | null = null;
    private wrongFeedbackTimeoutId: number | null = null;
    private activeAudio: HTMLAudioElement | null = null;

    constructor(container: HTMLElement, callbacks: Game4Callbacks) {
        this.container = container;
        this.callbacks = callbacks;
    }

    start(level: number = 1, carryScore: number = 0): void {
        this.cleanup();
        this.level = level;
        this.score = carryScore;
        this.combo = 0;
        this.harvestedCount = 0;
        this.selectedPlotIndex = null;
        this.currentQuestion = null;
        this.isAwaitingFeedback = false;
        this.lastQuestionKey = '';
        this.mistakes = [];

        this.totalPlots = Math.min(2 + level * 2, 8);
        const iconNames = ['sprout', 'sun', 'sparkles', 'award'];
        this.plots = Array.from({ length: this.totalPlots }, (_, idx) => ({
            id: idx,
            stage: 'seed' as const,
            cropIcon: iconNames[idx % iconNames.length]
        }));

        const queueTargetSize = this.totalPlots * 3;
        this.questions = getQuestionsForLevel(this.level, queueTargetSize);

        this.callbacks.onTargetChange?.(null);
        this.callbacks.onComboChange?.(0);

        if (this.questions.length === 0) {
            this.questionQueue = [];
            this.callbacks.onProgressChange?.(0, 0);
            this.renderEmptyState();
            return;
        }

        this.questionQueue = shuffleArray(this.questions);
        this.callbacks.onProgressChange?.(0, this.totalPlots);
        this.render();
    }

    getMistakes(): GameWordPair[] {
        return [...this.mistakes];
    }

    private renderEmptyState(): void {
        this.container.innerHTML = '';
        const emptyBox = document.createElement('div');
        emptyBox.className = 'game-empty-state';
        emptyBox.setAttribute('role', 'status');
        emptyBox.textContent = 'Chưa có đủ từ vựng để tạo câu hỏi cho trò chơi này. Vui lòng thử lại sau.';
        this.container.appendChild(emptyBox);
    }

    private render(): void {
        this.container.innerHTML = `
            <div class="farm-hud-sub">
                <span>Thu hoạch: <strong id="farmHarvestCount">${this.harvestedCount}</strong>/${this.totalPlots} ô đất</span>
            </div>
            <div id="farmStageFeedback" class="game-error-banner" role="status" aria-live="polite" hidden style="margin-bottom: 0.875rem;"></div>
            <div class="farm-grid" id="farmGrid">
                ${this.plots.map((plot, idx) => `
                    <button type="button" class="farm-plot ${plot.stage}" data-plot="${idx}" aria-label="Ô đất số ${idx + 1}: ${this.getPlotLabel(plot)}"${plot.stage === 'harvested' ? ' disabled' : ''}>
                        <span class="plot-dirt" style="display: block;">
                            <span class="crop-emoji">${this.getStageIcon(plot)}</span>
                        </span>
                        <span class="plot-label" style="display: block;">${this.getPlotLabel(plot)}</span>
                    </button>
                `).join('')}
            </div>

            <div id="farmQuestionModal" class="farm-modal" role="dialog" aria-modal="true" aria-labelledby="farmModalTitle" style="display: none;">
                <div class="farm-modal-card">
                    <div class="cert-modal-header">
                        <h4 id="farmModalTitle" style="margin: 0;">Chăm sóc cây trồng</h4>
                        <button type="button" id="btnCloseFarmModal" class="btn-close-modal" aria-label="Đóng câu hỏi">
                            ${getLucideIcon('x', 'lucide-icon', 20)}
                        </button>
                    </div>
                    <p id="farmQuestionPrompt" class="farm-question-text">
                        <span id="farmPromptLead">Chọn nghĩa Tiếng Việt đúng của từ:</span>
                        <strong id="farmQWord" class="farm-q-word"></strong>
                    </p>
                    <div id="farmWordMeta" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-bottom: 1rem;">
                        <span id="farmQPronunciation" class="vocab-preview-pron" hidden></span>
                        <button type="button" id="btnFarmListen" class="vocab-preview-audio-btn" aria-label="Nghe phát âm từ câu hỏi" hidden>
                            ${getLucideIcon('volume-2', 'lucide-icon', 18)}
                        </button>
                    </div>
                    <div id="farmFeedbackBanner" class="game-error-banner" role="status" aria-live="polite" hidden style="margin-bottom: 0.875rem;"></div>
                    <div id="farmAnswersGrid" class="farm-answers-grid"></div>
                </div>
            </div>
        `;

        this.clickHandler = (e: MouseEvent) => {
            const target = e.target as HTMLElement;

            if (target.id === 'farmQuestionModal') {
                this.closeQuestionModal();
                return;
            }

            if (target.closest('#btnCloseFarmModal')) {
                this.closeQuestionModal();
                return;
            }

            if (target.closest('#btnFarmListen')) {
                if (this.currentQuestion?.driveId) {
                    this.playPronunciation(this.currentQuestion.driveId);
                }
                return;
            }

            const plotEl = target.closest('.farm-plot') as HTMLElement | null;
            if (plotEl && plotEl.dataset.plot !== undefined) {
                const plotIdx = parseInt(plotEl.dataset.plot, 10);
                this.handlePlotClick(plotIdx);
                return;
            }

            const answerBtn = target.closest('.farm-answer-btn') as HTMLButtonElement | null;
            if (answerBtn && answerBtn.dataset.answer !== undefined) {
                this.handleAnswer(answerBtn.dataset.answer);
            }
        };

        this.container.addEventListener('click', this.clickHandler);
    }

    private getStageIcon(plot: Plot): string {
        switch (plot.stage) {
            case 'seed': return getLucideIcon('sprout', 'lucide-icon', 28);
            case 'sprout': return getLucideIcon('sun', 'lucide-icon', 30);
            case 'ready': return getLucideIcon('sparkles', 'lucide-icon', 32);
            case 'harvested': return getLucideIcon('check-circle', 'lucide-icon', 32);
        }
    }

    private getPlotLabel(plot: Plot): string {
        switch (plot.stage) {
            case 'seed': return 'Mới gieo (Tưới nước)';
            case 'sprout': return 'Cây non (Bón phân)';
            case 'ready': return 'Chín muồi (Thu hoạch)';
            case 'harvested': return 'Đã thu hoạch!';
        }
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

    private pullNextQuestion(): GameQuestion | null {
        if (this.questionQueue.length === 0) {
            const minSize = this.totalPlots * 3;
            const fresh = this.questions.length >= minSize
                ? this.questions
                : getQuestionsForLevel(this.level, minSize);
            if (fresh.length === 0) return null;
            this.questionQueue = shuffleArray(fresh);
            if (this.questionQueue.length > 1 && this.questionQueue[0].question === this.lastQuestionKey) {
                const swapIdx = this.questionQueue.findIndex(q => q.question !== this.lastQuestionKey);
                if (swapIdx > 0) {
                    [this.questionQueue[0], this.questionQueue[swapIdx]] = [
                        this.questionQueue[swapIdx],
                        this.questionQueue[0]
                    ];
                }
            }
        }

        const next = this.questionQueue.shift() ?? null;
        if (next) {
            this.lastQuestionKey = next.question;
        }
        return next;
    }

    private handlePlotClick(plotIdx: number): void {
        const plot = this.plots[plotIdx];
        if (!plot || plot.stage === 'harvested') return;

        soundEffects.click();
        this.selectedPlotIndex = plotIdx;
        this.currentQuestion = this.pullNextQuestion();
        if (!this.currentQuestion) return;

        this.callbacks.onTargetChange?.({
            text: this.currentQuestion.question,
            driveId: this.currentQuestion.driveId,
            pronunciation: this.currentQuestion.pronunciation
        });
        this.showQuestionModal();
    }

    private showQuestionModal(): void {
        const modal = this.container.querySelector('#farmQuestionModal') as HTMLElement | null;
        const promptLead = this.container.querySelector('#farmPromptLead');
        const qWord = this.container.querySelector('#farmQWord');
        const qPron = this.container.querySelector('#farmQPronunciation') as HTMLElement | null;
        const listenBtn = this.container.querySelector('#btnFarmListen') as HTMLButtonElement | null;
        const feedbackBanner = this.container.querySelector('#farmFeedbackBanner') as HTMLElement | null;
        const answersGrid = this.container.querySelector('#farmAnswersGrid');

        if (!modal || !qWord || !answersGrid || !this.currentQuestion) return;

        this.isAwaitingFeedback = false;
        if (this.wrongFeedbackTimeoutId !== null) {
            clearTimeout(this.wrongFeedbackTimeoutId);
            this.wrongFeedbackTimeoutId = null;
        }

        if (promptLead) {
            promptLead.textContent = this.currentQuestion.direction === 'viet_to_ethnic'
                ? 'Chọn từ Tiếng Xơ Đăng đúng của:'
                : 'Chọn nghĩa Tiếng Việt đúng của từ:';
        }
        qWord.textContent = this.currentQuestion.question;

        if (qPron) {
            if (this.currentQuestion.pronunciation) {
                qPron.textContent = `/${this.currentQuestion.pronunciation}/`;
                qPron.hidden = false;
            } else {
                qPron.textContent = '';
                qPron.hidden = true;
            }
        }

        if (listenBtn) {
            const hasAudio = Boolean(this.currentQuestion.driveId && getAudioUrl(this.currentQuestion.driveId));
            listenBtn.hidden = !hasAudio;
            listenBtn.setAttribute('aria-label', `Nghe phát âm ${this.currentQuestion.question}`);
        }

        if (feedbackBanner) {
            feedbackBanner.textContent = '';
            feedbackBanner.hidden = true;
        }

        const allAnswers = shuffleArray([this.currentQuestion.correct, ...this.currentQuestion.wrongs.slice(0, 3)]);

        answersGrid.replaceChildren();
        allAnswers.forEach(ans => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'farm-answer-btn';
            btn.dataset.answer = ans;
            btn.textContent = ans;
            answersGrid.appendChild(btn);
        });

        modal.style.display = 'flex';
        openAccessibleModal(modal, {
            labelledById: 'farmModalTitle',
            onClose: () => this.closeQuestionModal()
        });
    }

    private closeQuestionModal(): void {
        if (this.wrongFeedbackTimeoutId !== null) {
            clearTimeout(this.wrongFeedbackTimeoutId);
            this.wrongFeedbackTimeoutId = null;
        }
        this.isAwaitingFeedback = false;
        const modal = this.container.querySelector('#farmQuestionModal') as HTMLElement | null;
        if (modal && modal.style.display !== 'none') {
            modal.style.display = 'none';
            closeAccessibleModal(modal);
        }
        this.callbacks.onTargetChange?.(null);
    }

    private extractWordPair(q: GameQuestion): GameWordPair | null {
        const questionText = typeof q.question === 'string' ? q.question.trim() : '';
        const correctText = typeof q.correct === 'string' ? q.correct.trim() : '';
        if (!questionText || !correctText) return null;

        if (q.direction === 'viet_to_ethnic') {
            return {
                ethnic: correctText,
                viet: questionText,
                driveId: q.driveId,
                pronunciation: q.pronunciation
            };
        }
        return {
            ethnic: questionText,
            viet: correctText,
            driveId: q.driveId,
            pronunciation: q.pronunciation
        };
    }

    private recordMistake(pair: GameWordPair | null): void {
        if (!pair) return;
        const key = `${normalizePairKey(pair.ethnic)}||${normalizePairKey(pair.viet)}`;
        const exists = this.mistakes.some(
            m => `${normalizePairKey(m.ethnic)}||${normalizePairKey(m.viet)}` === key
        );
        if (!exists) {
            this.mistakes.push(pair);
        }
        this.callbacks.onMistake?.(pair);
    }

    private handleAnswer(answer: string): void {
        const modal = this.container.querySelector('#farmQuestionModal') as HTMLElement | null;
        if (!modal || this.selectedPlotIndex === null || !this.currentQuestion || this.isAwaitingFeedback) return;

        const plot = this.plots[this.selectedPlotIndex];
        if (!plot) return;

        if (answer === this.currentQuestion.correct) {
            this.score += 50 + this.level * 10;
            this.combo++;
            this.callbacks.onScoreChange(this.score);
            this.callbacks.onComboChange?.(this.combo);

            if (plot.stage === 'seed') plot.stage = 'sprout';
            else if (plot.stage === 'sprout') plot.stage = 'ready';
            else if (plot.stage === 'ready') {
                plot.stage = 'harvested';
                this.harvestedCount++;
                const harvestEl = this.container.querySelector('#farmHarvestCount');
                if (harvestEl) harvestEl.textContent = String(this.harvestedCount);
            }

            this.callbacks.onProgressChange?.(this.harvestedCount, this.totalPlots);

            const stageBanner = this.container.querySelector('#farmStageFeedback') as HTMLElement | null;
            if (stageBanner) {
                stageBanner.hidden = true;
                stageBanner.textContent = '';
            }

            this.closeQuestionModal();
            this.updatePlotsUI();

            if (this.harvestedCount >= this.totalPlots) {
                soundEffects.levelUp();
                if (this.levelCompleteTimeoutId !== null) {
                    clearTimeout(this.levelCompleteTimeoutId);
                }
                this.levelCompleteTimeoutId = window.setTimeout(() => {
                    this.levelCompleteTimeoutId = null;
                    this.callbacks.onLevelComplete(this.level, this.score);
                }, 600);
            } else {
                soundEffects.success();
            }
        } else {
            soundEffects.wrong();
            this.combo = 0;
            this.callbacks.onComboChange?.(0);

            const pair = this.extractWordPair(this.currentQuestion);
            this.recordMistake(pair);

            const correctionText = pair
                ? `Chưa đúng! Ghi nhớ: ${pair.ethnic} = ${pair.viet}`
                : `Chưa đúng! Đáp án đúng là: ${this.currentQuestion.correct}`;

            const feedbackBanner = this.container.querySelector('#farmFeedbackBanner') as HTMLElement | null;
            if (feedbackBanner) {
                feedbackBanner.textContent = correctionText;
                feedbackBanner.hidden = false;
            }

            const stageBanner = this.container.querySelector('#farmStageFeedback') as HTMLElement | null;
            if (stageBanner) {
                stageBanner.textContent = correctionText;
                stageBanner.hidden = false;
            }

            this.isAwaitingFeedback = true;
            const answerBtns = this.container.querySelectorAll<HTMLButtonElement>('.farm-answer-btn');
            answerBtns.forEach(btn => {
                btn.disabled = true;
            });

            if (this.wrongFeedbackTimeoutId !== null) {
                clearTimeout(this.wrongFeedbackTimeoutId);
            }
            this.wrongFeedbackTimeoutId = window.setTimeout(() => {
                this.wrongFeedbackTimeoutId = null;
                this.closeQuestionModal();
            }, 1200);
        }
    }

    private updatePlotsUI(): void {
        this.plots.forEach((plot, idx) => {
            const plotEl = this.container.querySelector<HTMLButtonElement>(`[data-plot="${idx}"]`);
            if (!plotEl) return;
            const labelText = this.getPlotLabel(plot);
            plotEl.className = `farm-plot ${plot.stage}`;
            plotEl.disabled = plot.stage === 'harvested';
            plotEl.setAttribute('aria-label', `Ô đất số ${idx + 1}: ${labelText}`);
            const emojiEl = plotEl.querySelector('.crop-emoji');
            if (emojiEl) emojiEl.innerHTML = this.getStageIcon(plot);
            const labelEl = plotEl.querySelector('.plot-label');
            if (labelEl) labelEl.textContent = labelText;
        });
    }

    private cleanup(): void {
        if (this.levelCompleteTimeoutId !== null) {
            clearTimeout(this.levelCompleteTimeoutId);
            this.levelCompleteTimeoutId = null;
        }
        if (this.wrongFeedbackTimeoutId !== null) {
            clearTimeout(this.wrongFeedbackTimeoutId);
            this.wrongFeedbackTimeoutId = null;
        }
        this.isAwaitingFeedback = false;
        this.stopActiveAudio();
        const modal = this.container.querySelector('#farmQuestionModal') as HTMLElement | null;
        if (modal) {
            modal.style.display = 'none';
            closeAccessibleModal(modal);
        }
        if (this.clickHandler) {
            this.container.removeEventListener('click', this.clickHandler);
            this.clickHandler = null;
        }
        this.container.replaceChildren();
    }

    destroy(): void {
        this.cleanup();
    }
}
