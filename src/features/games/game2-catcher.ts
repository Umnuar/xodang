import { getQuestionsForLevel, shuffleArray, type GameQuestion } from './game-data';
import { soundEffects } from './sound-effects';

export interface Game2Callbacks {
    onScoreChange: (score: number) => void;
    onLivesChange: (lives: number) => void;
    onLevelComplete: (level: number, score: number) => void;
    onGameOver: (score: number) => void;
}

interface FallingWord {
    text: string;
    isCorrect: boolean;
    x: number;
    y: number;
    speed: number;
    width: number;
    height: number;
}

export class Game2Catcher {
    private container: HTMLElement;
    private callbacks: Game2Callbacks;
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;

    private level = 1;
    private score = 0;
    private lives = 3;
    private questionsAnswered = 0;
    private questionsNeeded = 5;

    private questions: GameQuestion[] = [];
    private currentQuestionIndex = 0;
    private currentQuestion: GameQuestion | null = null;

    private basketX = 150;
    private basketWidth = 90;
    private basketHeight = 40;
    private fallingWords: FallingWord[] = [];

    private animId: number | null = null;
    private lastSpawnTime = 0;
    private lastFrameTime = 0;
    private isDestroyed = false;

    private handleMouseMove: ((e: MouseEvent) => void) | null = null;
    private handleTouchMove: ((e: TouchEvent) => void) | null = null;
    private handleKeyDown: ((e: KeyboardEvent) => void) | null = null;

    constructor(container: HTMLElement, callbacks: Game2Callbacks) {
        this.container = container;
        this.callbacks = callbacks;
    }

    start(level: number = 1): void {
        this.isDestroyed = false;
        this.lastFrameTime = 0;
        this.level = level;
        this.lives = 3;
        this.questionsAnswered = 0;
        this.currentQuestionIndex = 0;
        this.questionsNeeded = 4 + level;
        this.fallingWords = [];

        this.questions = getQuestionsForLevel(this.level, this.questionsNeeded + 3);
        this.render();
        this.setupNextQuestion();
        this.startLoop();
    }

    private setupNextQuestion(): void {
        if (this.currentQuestionIndex >= this.questions.length) {
            this.currentQuestionIndex = 0;
        }
        this.currentQuestion = this.questions[this.currentQuestionIndex++];
        const targetWordEl = this.container.querySelector('#catcherTargetWord');
        if (targetWordEl) {
            targetWordEl.textContent = this.currentQuestion?.question || '';
        }
        this.fallingWords = [];
        this.spawnWordsForCurrentQuestion();
    }

    private spawnWordsForCurrentQuestion(): void {
        if (!this.currentQuestion || !this.canvas) return;

        const options = shuffleArray([
            { text: this.currentQuestion.correct, isCorrect: true },
            ...this.currentQuestion.wrongs.slice(0, 2).map(w => ({ text: w, isCorrect: false }))
        ]);

        const canvasWidth = this.canvas.width;
        const segment = canvasWidth / (options.length + 1);

        options.forEach((opt, idx) => {
            const wordWidth = Math.max(80, opt.text.length * 11);
            const posX = Math.max(10, Math.min(canvasWidth - wordWidth - 10, segment * (idx + 1) - wordWidth / 2 + (Math.random() * 40 - 20)));
            const startY = -(Math.random() * 60 + 20);
            const baseSpeed = 1.2 + this.level * 0.25;

            this.fallingWords.push({
                text: opt.text,
                isCorrect: opt.isCorrect,
                x: posX,
                y: startY,
                speed: baseSpeed + Math.random() * 0.4,
                width: wordWidth,
                height: 32
            });
        });
    }

    private render(): void {
        this.container.innerHTML = `
            <div class="catcher-prompt">
                <span>Từ cần tìm nghĩa:</span>
                <strong id="catcherTargetWord" class="catcher-target-word"></strong>
            </div>
            <div class="catcher-canvas-wrap">
                <canvas id="catcherCanvas" width="600" height="420"></canvas>
            </div>
            <div class="catcher-hint">Di chuyển giỏ bằng chuột, chạm vuốt hoặc phím ← →</div>
        `;

        const targetWordEl = this.container.querySelector('#catcherTargetWord');
        if (targetWordEl) {
            targetWordEl.textContent = this.currentQuestion?.question || '';
        }

        this.canvas = this.container.querySelector('#catcherCanvas') as HTMLCanvasElement;
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.basketX = (this.canvas.width - this.basketWidth) / 2;

        this.handleMouseMove = (e: MouseEvent) => {
            if (!this.canvas) return;
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = ((e.clientX - rect.left) / rect.width) * this.canvas.width;
            this.basketX = Math.max(0, Math.min(this.canvas.width - this.basketWidth, mouseX - this.basketWidth / 2));
        };
        this.canvas.addEventListener('mousemove', this.handleMouseMove);

        this.handleTouchMove = (e: TouchEvent) => {
            if (!this.canvas || e.touches.length === 0) return;
            const rect = this.canvas.getBoundingClientRect();
            const touchX = ((e.touches[0].clientX - rect.left) / rect.width) * this.canvas.width;
            this.basketX = Math.max(0, Math.min(this.canvas.width - this.basketWidth, touchX - this.basketWidth / 2));
            e.preventDefault();
        };
        this.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });

        this.handleKeyDown = (e: KeyboardEvent) => {
            if (!this.canvas) return;
            const step = 30;
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                this.basketX = Math.max(0, this.basketX - step);
            } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                this.basketX = Math.min(this.canvas.width - this.basketWidth, this.basketX + step);
            }
        };
        window.addEventListener('keydown', this.handleKeyDown);
    }

    private stopLoop(): void {
        this.isDestroyed = true;
        if (this.animId !== null) {
            cancelAnimationFrame(this.animId);
            this.animId = null;
        }
    }

    private startLoop(): void {
        const loop = (timestamp: number) => {
            if (this.isDestroyed) return;
            const dt = this.lastFrameTime > 0 ? Math.min((timestamp - this.lastFrameTime) / 16.667, 3) : 1;
            this.lastFrameTime = timestamp;
            this.update(timestamp, dt);
            if (this.isDestroyed) return;
            this.draw();
            this.animId = requestAnimationFrame(loop);
        };
        this.animId = requestAnimationFrame(loop);
    }

    private update(timestamp: number, dt: number = 1): void {
        if (!this.canvas || this.isDestroyed) return;
        const canvasHeight = this.canvas.height;
        const basketY = canvasHeight - this.basketHeight - 15;

        if (this.fallingWords.length === 0 && timestamp - this.lastSpawnTime > 600) {
            this.spawnWordsForCurrentQuestion();
            this.lastSpawnTime = timestamp;
        }

        for (let i = this.fallingWords.length - 1; i >= 0; i--) {
            const word = this.fallingWords[i];
            word.y += word.speed * dt;

            const hitBasketX = (word.x + word.width > this.basketX) && (word.x < this.basketX + this.basketWidth);
            const hitBasketY = (word.y + word.height >= basketY) && (word.y <= basketY + this.basketHeight);

            if (hitBasketX && hitBasketY) {
                if (word.isCorrect) {
                    soundEffects.catch();
                    this.score += 60 + this.level * 15;
                    this.questionsAnswered++;
                    this.callbacks.onScoreChange(this.score);

                    if (this.questionsAnswered >= this.questionsNeeded) {
                        soundEffects.levelUp();
                        this.stopLoop();
                        this.callbacks.onLevelComplete(this.level, this.score);
                        return;
                    }
                    this.setupNextQuestion();
                } else {
                    soundEffects.wrong();
                    this.lives--;
                    this.callbacks.onLivesChange(this.lives);
                    this.fallingWords.splice(i, 1);

                    if (this.lives <= 0) {
                        this.stopLoop();
                        this.callbacks.onGameOver(this.score);
                        return;
                    }
                }
                break;
            }

            if (word.y > canvasHeight) {
                if (word.isCorrect) {
                    this.lives--;
                    this.callbacks.onLivesChange(this.lives);
                    if (this.lives <= 0) {
                        this.stopLoop();
                        this.callbacks.onGameOver(this.score);
                        return;
                    }
                }
                this.fallingWords.splice(i, 1);
            }
        }
    }

    private drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radii: number | number[]): void {
        if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(x, y, w, h, radii);
            return;
        }
        const r = Array.isArray(radii) ? radii[2] ?? 0 : radii;
        if (Array.isArray(radii)) {
            const [tl, tr, br, bl] = radii;
            ctx.moveTo(x + tl, y);
            ctx.lineTo(x + w - tr, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
            ctx.lineTo(x + w, y + h - br);
            ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
            ctx.lineTo(x + bl, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
            ctx.lineTo(x, y + tl);
            ctx.quadraticCurveTo(x, y, x + tl, y);
            ctx.closePath();
            return;
        }
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    private draw(): void {
        if (!this.ctx || !this.canvas) return;
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.fillStyle = '#f0f9ff';
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, h - 15);
        ctx.lineTo(w, h - 15);
        ctx.stroke();

        this.fallingWords.forEach(word => {
            ctx.fillStyle = '#3b82f6';
            ctx.beginPath();
            this.drawRoundedRect(ctx, word.x, word.y, word.width, word.height, 12);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 13px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(word.text, word.x + word.width / 2, word.y + word.height / 2);
        });

        const basketY = h - this.basketHeight - 15;
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        this.drawRoundedRect(ctx, this.basketX, basketY, this.basketWidth, this.basketHeight, [0, 0, 16, 16]);
        ctx.fill();

        ctx.fillStyle = '#fed7aa';
        ctx.fillRect(this.basketX + 5, basketY, this.basketWidth - 10, 8);

        ctx.fillStyle = '#ffffff';
        ctx.font = '16px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🧺', this.basketX + this.basketWidth / 2, basketY + 22);
    }

    destroy(): void {
        this.stopLoop();

        if (this.canvas) {
            if (this.handleMouseMove) {
                this.canvas.removeEventListener('mousemove', this.handleMouseMove);
                this.handleMouseMove = null;
            }
            if (this.handleTouchMove) {
                this.canvas.removeEventListener('touchmove', this.handleTouchMove);
                this.handleTouchMove = null;
            }
        }

        if (this.handleKeyDown) {
            window.removeEventListener('keydown', this.handleKeyDown);
            this.handleKeyDown = null;
        }

        this.container.replaceChildren();
    }
}
