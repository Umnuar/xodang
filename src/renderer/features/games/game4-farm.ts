/**
 * Game 4: Nông Trại Số (Farm Harvest Quiz)
 * Student answers vocabulary questions to tend and harvest crops on farm plots.
 * Implements strict destroy() lifecycle and event delegation.
 */

import { getQuestionsForLevel, type GameQuestion } from './game-data';
import { soundEffects } from './sound-effects';

export interface Game4Callbacks {
    onScoreChange: (score: number) => void;
    onLevelComplete: (level: number, score: number) => void;
}

interface Plot {
    id: number;
    stage: 'seed' | 'sprout' | 'ready' | 'harvested';
    cropIcon: string;
}

export class Game4Farm {
    private container: HTMLElement;
    private callbacks: Game4Callbacks;

    private level = 1;
    private score = 0;
    private harvestedCount = 0;
    private totalPlots = 4;

    private plots: Plot[] = [];
    private questions: GameQuestion[] = [];
    private selectedPlotIndex: number | null = null;
    private currentQuestion: GameQuestion | null = null;
    private clickHandler: ((e: MouseEvent) => void) | null = null;

    constructor(container: HTMLElement, callbacks: Game4Callbacks) {
        this.container = container;
        this.callbacks = callbacks;
    }

    start(level: number = 1): void {
        this.level = level;
        this.harvestedCount = 0;
        this.selectedPlotIndex = null;
        this.totalPlots = 4;

        this.plots = [
            { id: 0, stage: 'seed', cropIcon: '🌽' },
            { id: 1, stage: 'seed', cropIcon: '🥕' },
            { id: 2, stage: 'seed', cropIcon: '🥔' },
            { id: 3, stage: 'seed', cropIcon: '🍅' },
        ];

        this.questions = getQuestionsForLevel(this.level, 8);
        this.render();
    }

    private render(): void {
        this.container.innerHTML = `
            <div class="farm-hud-sub">
                <span>Thu hoạch: <strong id="farmHarvestCount">${this.harvestedCount}</strong>/${this.totalPlots} ô đất</span>
            </div>
            <div class="farm-grid" id="farmGrid">
                ${this.plots.map((plot, idx) => `
                    <div class="farm-plot ${plot.stage}" data-plot="${idx}">
                        <div class="plot-dirt">
                            <span class="crop-emoji">${this.getCropEmoji(plot)}</span>
                        </div>
                        <div class="plot-label">${this.getPlotLabel(plot)}</div>
                    </div>
                `).join('')}
            </div>

            <div id="farmQuestionModal" class="farm-modal" style="display: none;">
                <div class="farm-modal-card">
                    <h4>Chăm sóc cây trồng</h4>
                    <p class="farm-question-text">Chọn nghĩa Tiếng Việt đúng của từ: <strong id="farmQWord" class="farm-q-word"></strong></p>
                    <div id="farmAnswersGrid" class="farm-answers-grid"></div>
                </div>
            </div>
        `;

        this.clickHandler = (e: MouseEvent) => {
            const target = e.target as HTMLElement;

            // Plot click
            const plotEl = target.closest('.farm-plot') as HTMLElement | null;
            if (plotEl && plotEl.dataset.plot !== undefined) {
                const plotIdx = parseInt(plotEl.dataset.plot, 10);
                this.handlePlotClick(plotIdx);
                return;
            }

            // Answer button click
            const answerBtn = target.closest('.farm-answer-btn') as HTMLButtonElement | null;
            if (answerBtn && answerBtn.dataset.answer) {
                this.handleAnswer(answerBtn.dataset.answer);
            }
        };

        this.container.addEventListener('click', this.clickHandler);
    }

    private getCropEmoji(plot: Plot): string {
        switch (plot.stage) {
            case 'seed': return '🌱';
            case 'sprout': return '🌿';
            case 'ready': return plot.cropIcon;
            case 'harvested': return '✨';
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

    private handlePlotClick(plotIdx: number): void {
        const plot = this.plots[plotIdx];
        if (plot.stage === 'harvested') return;

        soundEffects.click();
        this.selectedPlotIndex = plotIdx;

        // Pick random question from list
        this.currentQuestion = this.questions[Math.floor(Math.random() * this.questions.length)];
        this.showQuestionModal();
    }

    private showQuestionModal(): void {
        const modal = this.container.querySelector('#farmQuestionModal') as HTMLElement | null;
        const qWord = this.container.querySelector('#farmQWord');
        const answersGrid = this.container.querySelector('#farmAnswersGrid');

        if (!modal || !qWord || !answersGrid || !this.currentQuestion) return;

        qWord.textContent = this.currentQuestion.question;

        const allAnswers = [this.currentQuestion.correct, ...this.currentQuestion.wrongs.slice(0, 3)]
            .sort(() => Math.random() - 0.5);

        answersGrid.replaceChildren();
        allAnswers.forEach(ans => {
            const btn = document.createElement('button');
            btn.className = 'farm-answer-btn';
            btn.dataset.answer = ans;
            btn.textContent = ans;
            answersGrid.appendChild(btn);
        });

        modal.style.display = 'flex';
    }

    private handleAnswer(answer: string): void {
        const modal = this.container.querySelector('#farmQuestionModal') as HTMLElement | null;
        if (!modal || this.selectedPlotIndex === null || !this.currentQuestion) return;

        const plot = this.plots[this.selectedPlotIndex];

        if (answer === this.currentQuestion.correct) {
            soundEffects.success();
            this.score += 50 + this.level * 10;
            this.callbacks.onScoreChange(this.score);

            // Advance stage
            if (plot.stage === 'seed') plot.stage = 'sprout';
            else if (plot.stage === 'sprout') plot.stage = 'ready';
            else if (plot.stage === 'ready') {
                plot.stage = 'harvested';
                this.harvestedCount++;
                const harvestEl = this.container.querySelector('#farmHarvestCount');
                if (harvestEl) harvestEl.textContent = String(this.harvestedCount);
            }

            modal.style.display = 'none';
            this.updatePlotsUI();

            if (this.harvestedCount >= this.totalPlots) {
                soundEffects.levelUp();
                setTimeout(() => {
                    this.callbacks.onLevelComplete(this.level, this.score);
                }, 600);
            }
        } else {
            soundEffects.wrong();
            modal.style.display = 'none';
        }
    }

    private updatePlotsUI(): void {
        this.plots.forEach((plot, idx) => {
            const plotEl = this.container.querySelector(`[data-plot="${idx}"]`);
            if (!plotEl) return;
            plotEl.className = `farm-plot ${plot.stage}`;
            const emojiEl = plotEl.querySelector('.crop-emoji');
            if (emojiEl) emojiEl.textContent = this.getCropEmoji(plot);
            const labelEl = plotEl.querySelector('.plot-label');
            if (labelEl) labelEl.textContent = this.getPlotLabel(plot);
        });
    }

    destroy(): void {
        if (this.clickHandler) {
            this.container.removeEventListener('click', this.clickHandler);
            this.clickHandler = null;
        }
        this.container.innerHTML = '';
    }
}
