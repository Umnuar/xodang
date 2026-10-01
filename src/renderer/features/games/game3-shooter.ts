/**
 * Game 3: Bảo Vệ Làng / Bắn Từ (Word Defender / Shooter)
 * Student taps or clicks moving targets matching the target Sedang word to defend the village.
 * Strict destroy() lifecycle cancels requestAnimationFrame and cleans event listeners.
 */

import { getQuestionsForLevel, type GameQuestion } from './game-data';
import { soundEffects } from './sound-effects';

export interface Game3Callbacks {
    onScoreChange: (score: number) => void;
    onLivesChange: (lives: number) => void;
    onLevelComplete: (level: number, score: number) => void;
    onGameOver: (score: number) => void;
}

interface Target {
    text: string;
    isCorrect: boolean;
    x: number;
    y: number;
    radius: number;
    vx: number;
    vy: number;
    color: string;
}

export class Game3Shooter {
    private container: HTMLElement;
    private callbacks: Game3Callbacks;
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;

    private level = 1;
    private score = 0;
    private lives = 3;
    private kills = 0;
    private killsNeeded = 5;

    private questions: GameQuestion[] = [];
    private currentQuestionIndex = 0;
    private currentQuestion: GameQuestion | null = null;

    private targets: Target[] = [];
    private animId: number | null = null;
    private isDestroyed = false;
    private clickHandler: ((e: MouseEvent) => void) | null = null;

    constructor(container: HTMLElement, callbacks: Game3Callbacks) {
        this.container = container;
        this.callbacks = callbacks;
    }

    start(level: number = 1): void {
        this.isDestroyed = false;
        this.level = level;
        this.lives = 3;
        this.kills = 0;
        this.currentQuestionIndex = 0;
        this.killsNeeded = 4 + level;
        this.targets = [];

        this.questions = getQuestionsForLevel(this.level, this.killsNeeded + 3);
        this.nextQuestion();

        this.render();
        this.startLoop();
    }

    private nextQuestion(): void {
        if (this.currentQuestionIndex >= this.questions.length) {
            this.currentQuestionIndex = 0;
        }
        this.currentQuestion = this.questions[this.currentQuestionIndex++];
        this.spawnTargets();
    }

    private spawnTargets(): void {
        if (!this.currentQuestion || !this.canvas) return;
        this.targets = [];

        const options = [
            { text: this.currentQuestion.correct, isCorrect: true },
            ...this.currentQuestion.wrongs.slice(0, 2).map(w => ({ text: w, isCorrect: false }))
        ].sort(() => Math.random() - 0.5);

        const colors = ['#0284c7', '#7c3aed', '#059669', '#d97706'];
        const w = this.canvas.width;

        options.forEach((opt, idx) => {
            const radius = 34;
            const x = 50 + (idx * (w - 100)) / (options.length - 1 || 1);
            const y = 50 + (Math.random() * 40);
            const speed = 0.6 + this.level * 0.15;

            this.targets.push({
                text: opt.text,
                isCorrect: opt.isCorrect,
                x,
                y,
                radius,
                vx: (Math.random() - 0.5) * 1.2,
                vy: speed + Math.random() * 0.3,
                color: colors[idx % colors.length]
            });
        });
    }

    private render(): void {
        this.container.innerHTML = `
            <div class="shooter-prompt">
                <span>Mục tiêu cần bắn: Nghĩa của từ </span>
                <strong id="shooterTargetWord" class="shooter-target-word">${this.currentQuestion?.question || ''}</strong>
            </div>
            <div class="shooter-canvas-wrap">
                <canvas id="shooterCanvas" width="600" height="420"></canvas>
            </div>
            <div class="shooter-hint">Nhấp hoặc chạm vào bong bóng chứa nghĩa đúng để bắn!</div>
        `;

        this.canvas = this.container.querySelector('#shooterCanvas') as HTMLCanvasElement;
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');

        // Click / Touch to Shoot
        this.clickHandler = (e: MouseEvent) => {
            if (!this.canvas) return;
            const rect = this.canvas.getBoundingClientRect();
            const clickX = ((e.clientX - rect.left) / rect.width) * this.canvas.width;
            const clickY = ((e.clientY - rect.top) / rect.height) * this.canvas.height;

            soundEffects.shoot();
            this.handleShoot(clickX, clickY);
        };
        this.canvas.addEventListener('click', this.clickHandler);
    }

    private handleShoot(clickX: number, clickY: number): void {
        for (let i = this.targets.length - 1; i >= 0; i--) {
            const t = this.targets[i];
            const dist = Math.hypot(clickX - t.x, clickY - t.y);

            if (dist <= t.radius) {
                if (t.isCorrect) {
                    soundEffects.success();
                    this.score += 70 + this.level * 10;
                    this.kills++;
                    this.callbacks.onScoreChange(this.score);

                    if (this.kills >= this.killsNeeded) {
                        soundEffects.levelUp();
                        this.callbacks.onLevelComplete(this.level, this.score);
                        return;
                    }
                    this.nextQuestion();
                    const promptEl = this.container.querySelector('#shooterTargetWord');
                    if (promptEl) promptEl.textContent = this.currentQuestion?.question || '';
                } else {
                    soundEffects.wrong();
                    this.lives--;
                    this.callbacks.onLivesChange(this.lives);
                    this.targets.splice(i, 1);

                    if (this.lives <= 0) {
                        this.callbacks.onGameOver(this.score);
                        return;
                    }
                }
                break;
            }
        }
    }

    private startLoop(): void {
        const loop = () => {
            if (this.isDestroyed) return;
            this.update();
            this.draw();
            this.animId = requestAnimationFrame(loop);
        };
        this.animId = requestAnimationFrame(loop);
    }

    private update(): void {
        if (!this.canvas) return;
        const w = this.canvas.width;
        const h = this.canvas.height;

        for (let i = this.targets.length - 1; i >= 0; i--) {
            const t = this.targets[i];
            t.x += t.vx;
            t.y += t.vy;

            // Bounce off left/right
            if (t.x - t.radius <= 0 || t.x + t.radius >= w) {
                t.vx *= -1;
            }

            // Fall past defense line
            if (t.y - t.radius >= h - 40) {
                if (t.isCorrect) {
                    this.lives--;
                    this.callbacks.onLivesChange(this.lives);
                    if (this.lives <= 0) {
                        this.callbacks.onGameOver(this.score);
                        return;
                    }
                }
                this.targets.splice(i, 1);
            }
        }

        if (this.targets.length === 0) {
            this.spawnTargets();
        }
    }

    private draw(): void {
        if (!this.ctx || !this.canvas) return;
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Sky background
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, w, h);

        // Defense line (Village fence)
        ctx.fillStyle = '#b45309';
        ctx.fillRect(0, h - 35, w, 10);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(0, h - 25, w, 25);

        // Targets
        this.targets.forEach(t => {
            // Glow
            ctx.beginPath();
            ctx.arc(t.x, t.y, t.radius + 4, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fill();

            // Orb
            ctx.beginPath();
            ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
            ctx.fillStyle = t.color;
            ctx.fill();

            // Text
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(t.text, t.x, t.y);
        });
    }

    destroy(): void {
        this.isDestroyed = true;
        if (this.animId !== null) {
            cancelAnimationFrame(this.animId);
            this.animId = null;
        }

        if (this.canvas && this.clickHandler) {
            this.canvas.removeEventListener('click', this.clickHandler);
            this.clickHandler = null;
        }

        this.container.innerHTML = '';
    }
}
