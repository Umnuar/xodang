import { getQuestionsForLevel, shuffleArray, type GameQuestion, type GameWordPair } from './game-data';
import type { GameTargetInfo } from './games';
import { soundEffects } from './sound-effects';

export interface Game2Callbacks {
    onScoreChange: (score: number) => void;
    onLivesChange: (lives: number) => void;
    onLevelComplete: (level: number, score: number) => void;
    onGameOver: (score: number) => void;
    onProgressChange?: (current: number, total: number) => void;
    onComboChange?: (combo: number) => void;
    onMistake?: (pair: GameWordPair) => void;
    onTargetChange?: (target: GameTargetInfo | null) => void;
}

interface FallingWord {
    text: string;
    isCorrect: boolean;
    x: number;
    y: number;
    speed: number;
    width: number;
    height: number;
    baseX?: number;
    laneMinX?: number;
    laneMaxX?: number;
    swayAmp?: number;
    swayPhase?: number;
}

interface CorrectionBanner {
    text: string;
    remainingMs: number;
}

interface CanvasTheme {
    bgCanvas: string;
    bgSurface: string;
    bgSurfaceElevated: string;
    bgOverlay: string;
    textPrimary: string;
    textSecondary: string;
    textInverse: string;
    colorPrimary: string;
    colorPrimaryHover: string;
    colorPrimaryLight: string;
    colorSecondary: string;
    colorTertiary: string;
    colorDanger: string;
    borderDefault: string;
    borderSubtle: string;
}

const FONT_FAMILY = '"Be Vietnam Pro", sans-serif';
const PILL_FONT = `600 14px ${FONT_FAMILY}`;

function readThemeToken(styles: CSSStyleDeclaration | null, name: string, fallback: string): string {
    const value = styles?.getPropertyValue(name)?.trim();
    return value || fallback;
}

function resolveCanvasTheme(): CanvasTheme {
    const docEl = document.documentElement;
    const bodyEl = document.body;
    const isDark = docEl.classList.contains('dark-mode') || bodyEl.classList.contains('dark-mode');
    const sourceEl = bodyEl.classList.contains('dark-mode') && !docEl.classList.contains('dark-mode')
        ? bodyEl
        : docEl;
    const styles = typeof window !== 'undefined' && typeof window.getComputedStyle === 'function'
        ? window.getComputedStyle(sourceEl)
        : null;

    if (isDark) {
        return {
            bgCanvas: readThemeToken(styles, '--bg-canvas', '#0f1012'),
            bgSurface: readThemeToken(styles, '--bg-surface', '#17181b'),
            bgSurfaceElevated: readThemeToken(styles, '--bg-surface-elevated', '#1f2124'),
            bgOverlay: readThemeToken(styles, '--bg-overlay', 'rgba(15, 16, 18, 0.85)'),
            textPrimary: readThemeToken(styles, '--text-primary', '#e8e8ea'),
            textSecondary: readThemeToken(styles, '--text-secondary', '#a0a3a8'),
            textInverse: readThemeToken(styles, '--text-inverse', '#0f1012'),
            colorPrimary: readThemeToken(styles, '--color-primary', '#34d399'),
            colorPrimaryHover: readThemeToken(styles, '--color-primary-hover', '#10b981'),
            colorPrimaryLight: readThemeToken(styles, '--color-primary-light', 'rgba(52, 211, 153, 0.12)'),
            colorSecondary: readThemeToken(styles, '--color-secondary', '#fbbf24'),
            colorTertiary: readThemeToken(styles, '--color-tertiary', '#60a5fa'),
            colorDanger: readThemeToken(styles, '--color-danger', '#f87171'),
            borderDefault: readThemeToken(styles, '--border-default', 'rgba(255, 255, 255, 0.12)'),
            borderSubtle: readThemeToken(styles, '--border-subtle', 'rgba(255, 255, 255, 0.08)')
        };
    }

    return {
        bgCanvas: readThemeToken(styles, '--bg-canvas', '#fbfbfa'),
        bgSurface: readThemeToken(styles, '--bg-surface', '#ffffff'),
        bgSurfaceElevated: readThemeToken(styles, '--bg-surface-elevated', '#f4f4f0'),
        bgOverlay: readThemeToken(styles, '--bg-overlay', 'rgba(28, 25, 23, 0.72)'),
        textPrimary: readThemeToken(styles, '--text-primary', '#1c1917'),
        textSecondary: readThemeToken(styles, '--text-secondary', '#57534e'),
        textInverse: readThemeToken(styles, '--text-inverse', '#ffffff'),
        colorPrimary: readThemeToken(styles, '--color-primary', '#1e7e48'),
        colorPrimaryHover: readThemeToken(styles, '--color-primary-hover', '#166534'),
        colorPrimaryLight: readThemeToken(styles, '--color-primary-light', '#e8f5e9'),
        colorSecondary: readThemeToken(styles, '--color-secondary', '#c05621'),
        colorTertiary: readThemeToken(styles, '--color-tertiary', '#2c5282'),
        colorDanger: readThemeToken(styles, '--color-danger', '#dc2626'),
        borderDefault: readThemeToken(styles, '--border-default', '#d6d3d1'),
        borderSubtle: readThemeToken(styles, '--border-subtle', '#e7e5e4')
    };
}

export class Game2Catcher {
    private container: HTMLElement;
    private callbacks: Game2Callbacks;
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;

    private logicalWidth = 600;
    private logicalHeight = 420;
    private dpr = 1;

    private level = 1;
    private score = 0;
    private lives = 3;
    private combo = 0;
    private questionsAnswered = 0;
    private questionsNeeded = 5;

    private questions: GameQuestion[] = [];
    private currentQuestionIndex = 0;
    private currentQuestion: GameQuestion | null = null;
    private mistakes: GameWordPair[] = [];

    private basketX = 250;
    private basketWidth = 96;
    private basketHeight = 42;
    private fallingWords: FallingWord[] = [];
    private correctionBanner: CorrectionBanner | null = null;

    private animId: number | null = null;
    private lastSpawnTime = 0;
    private lastFrameTime = 0;
    private isDestroyed = false;
    private isPaused = false;
    private isPointerDragging = false;
    private hasStarted = false;

    private handlePointerDown: ((e: PointerEvent) => void) | null = null;
    private handlePointerMove: ((e: PointerEvent) => void) | null = null;
    private handlePointerUp: (() => void) | null = null;
    private handleKeyDown: ((e: KeyboardEvent) => void) | null = null;
    private handleWindowResize: (() => void) | null = null;
    private resizeObserver: ResizeObserver | null = null;

    constructor(container: HTMLElement, callbacks: Game2Callbacks) {
        this.container = container;
        this.callbacks = callbacks;
    }

    start(level: number = 1): void {
        this.cleanupListeners();
        if (this.animId !== null) {
            cancelAnimationFrame(this.animId);
            this.animId = null;
        }

        this.isDestroyed = false;
        this.isPaused = false;
        this.isPointerDragging = false;
        this.lastFrameTime = 0;
        this.lastSpawnTime = 0;
        this.level = level;
        this.score = 0;
        this.lives = 3;
        this.combo = 0;
        this.questionsAnswered = 0;
        this.currentQuestionIndex = 0;
        this.currentQuestion = null;
        this.questionsNeeded = 4 + level;
        this.fallingWords = [];
        this.mistakes = [];
        this.correctionBanner = null;

        if (this.hasStarted) {
            this.callbacks.onScoreChange(0);
            this.callbacks.onLivesChange(this.lives);
        }
        this.hasStarted = true;
        this.callbacks.onComboChange?.(0);

        this.questions = getQuestionsForLevel(this.level, this.questionsNeeded + 3);
        if (this.questions.length === 0) {
            this.callbacks.onProgressChange?.(0, 0);
            this.callbacks.onTargetChange?.(null);
            this.renderEmptyState();
            return;
        }

        this.callbacks.onProgressChange?.(0, this.questionsNeeded);
        this.render();
        this.setupNextQuestion();
        this.draw();
        this.startLoop();
    }

    pause(): void {
        if (this.isPaused || this.isDestroyed) return;
        this.isPaused = true;
        this.isPointerDragging = false;
        this.lastFrameTime = 0;
        if (this.animId !== null) {
            cancelAnimationFrame(this.animId);
            this.animId = null;
        }
        this.draw();
    }

    resume(): void {
        if (!this.isPaused || this.isDestroyed) return;
        this.isPaused = false;
        this.lastFrameTime = 0;
        this.draw();
        this.startLoop();
    }

    getMistakes(): GameWordPair[] {
        return [...this.mistakes];
    }

    private renderEmptyState(): void {
        this.container.replaceChildren();
        const emptyBox = document.createElement('div');
        emptyBox.className = 'game-empty-state';
        emptyBox.textContent = 'Chưa có dữ liệu từ vựng để bắt đầu trò chơi.';
        this.container.appendChild(emptyBox);
    }

    private toWordPair(question: GameQuestion): GameWordPair {
        const isVietToEthnic = question.direction === 'viet_to_ethnic';
        return {
            ethnic: isVietToEthnic ? question.correct : question.question,
            viet: isVietToEthnic ? question.question : question.correct,
            pronunciation: question.pronunciation,
            driveId: question.driveId,
            topic: question.topic
        };
    }

    private recordMistake(pair: GameWordPair): void {
        const key = `${pair.ethnic.trim().toLowerCase()}||${pair.viet.trim().toLowerCase()}`;
        const exists = this.mistakes.some(
            item => `${item.ethnic.trim().toLowerCase()}||${item.viet.trim().toLowerCase()}` === key
        );
        if (!exists) {
            this.mistakes.push(pair);
        }
        this.callbacks.onMistake?.(pair);
    }

    private measureLabelWidth(text: string, font: string): number {
        if (this.ctx) {
            this.ctx.font = font;
            return this.ctx.measureText(text).width;
        }
        return text.length * 9;
    }

    private syncCanvasSize(): void {
        if (!this.canvas) return;
        const wrap = this.container.querySelector<HTMLElement>('.catcher-canvas-wrap');
        const measuredW = wrap?.clientWidth || this.container.clientWidth || 0;
        const nextW = measuredW > 0 ? Math.max(320, Math.min(920, Math.floor(measuredW))) : 600;
        const viewportH = typeof window !== 'undefined' && window.innerHeight > 0 ? window.innerHeight : 720;
        const nextH = measuredW > 0 ? Math.max(360, Math.min(520, Math.round(viewportH * 0.54))) : 420;
        const nextDpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;

        this.logicalWidth = nextW;
        this.logicalHeight = nextH;
        this.dpr = nextDpr;
        this.basketWidth = Math.min(112, Math.max(82, Math.round(nextW * 0.16)));

        const pixelW = Math.round(nextW * nextDpr);
        const pixelH = Math.round(nextH * nextDpr);
        if (this.canvas.width !== pixelW || this.canvas.height !== pixelH) {
            this.canvas.width = pixelW;
            this.canvas.height = pixelH;
        }
        this.canvas.style.width = `${nextW}px`;
        this.canvas.style.height = `${nextH}px`;

        if (this.ctx) {
            this.ctx.setTransform(nextDpr, 0, 0, nextDpr, 0, 0);
        }

        this.basketX = Math.max(0, Math.min(nextW - this.basketWidth, this.basketX));
        const laneWidth = nextW / 3;
        for (let i = 0; i < this.fallingWords.length; i++) {
            const word = this.fallingWords[i];
            word.x = Math.max(8, Math.min(nextW - word.width - 8, word.x));
            if (word.baseX !== undefined) {
                const lane = Math.min(2, Math.max(0, Math.floor(word.baseX / Math.max(1, laneWidth))));
                const laneMin = Math.max(8, lane * laneWidth + 6);
                const laneMax = Math.min(nextW - word.width - 8, (lane + 1) * laneWidth - word.width - 6);
                word.laneMinX = laneMin;
                word.laneMaxX = Math.max(laneMin, laneMax);
                word.baseX = Math.max(laneMin, Math.min(word.laneMaxX, word.baseX));
            }
        }
    }

    private setupNextQuestion(): void {
        if (this.questions.length === 0) return;
        if (this.currentQuestionIndex >= this.questions.length) {
            this.currentQuestionIndex = 0;
        }
        this.currentQuestion = this.questions[this.currentQuestionIndex++];
        const targetWordEl = this.container.querySelector('#catcherTargetWord');
        if (targetWordEl) {
            targetWordEl.textContent = this.currentQuestion?.question || '';
        }
        if (this.currentQuestion) {
            this.callbacks.onTargetChange?.({
                text: this.currentQuestion.question,
                pronunciation: this.currentQuestion.pronunciation,
                driveId: this.currentQuestion.driveId
            });
        } else {
            this.callbacks.onTargetChange?.(null);
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

        const lanes = shuffleArray([0, 1, 2]);
        const canvasWidth = this.logicalWidth;
        const laneWidth = canvasWidth / 3;
        const pillHeight = 48;
        const baseSpeed = 1.15 + this.level * 0.22;

        options.forEach((opt, idx) => {
            const lane = lanes[idx % lanes.length];
            const measuredTextW = this.measureLabelWidth(opt.text, PILL_FONT);
            const maxLaneWidth = Math.max(92, laneWidth - 16);
            const wordWidth = Math.max(92, Math.min(canvasWidth - 20, Math.ceil(measuredTextW + 36)));
            const fittedWidth = Math.min(wordWidth, Math.max(maxLaneWidth, Math.min(canvasWidth - 20, wordWidth)));
            const laneCenter = (lane + 0.5) * laneWidth;
            const rawMinX = lane * laneWidth + 8;
            const rawMaxX = (lane + 1) * laneWidth - fittedWidth - 8;
            const laneMinX = Math.max(8, Math.min(canvasWidth - fittedWidth - 8, rawMinX));
            const laneMaxX = Math.max(laneMinX, Math.min(canvasWidth - fittedWidth - 8, rawMaxX));
            const baseX = Math.max(laneMinX, Math.min(laneMaxX, laneCenter - fittedWidth / 2));
            const swayAmp = Math.max(0, Math.min(12, (laneMaxX - laneMinX) / 2));
            const startY = -(pillHeight + 12 + idx * 100);

            this.fallingWords.push({
                text: opt.text,
                isCorrect: opt.isCorrect,
                x: baseX,
                y: startY,
                speed: baseSpeed + (idx % 2) * 0.12,
                width: fittedWidth,
                height: pillHeight,
                baseX,
                laneMinX,
                laneMaxX,
                swayAmp,
                swayPhase: idx * 1.4
            });
        });

        this.lastSpawnTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    }

    private updateBasketFromPointer(e: PointerEvent): void {
        if (!this.canvas || this.isDestroyed || this.isPaused) return;
        const rect = this.canvas.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;
        const pointerX = ((e.clientX - rect.left) / rect.width) * this.logicalWidth;
        this.basketX = Math.max(0, Math.min(this.logicalWidth - this.basketWidth, pointerX - this.basketWidth / 2));
    }

    private isEditableElement(el: EventTarget | null): boolean {
        const node = el as HTMLElement | null;
        const active = typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null;
        const check = (candidate: HTMLElement | null): boolean => {
            if (!candidate) return false;
            const tag = candidate.tagName;
            return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || candidate.isContentEditable;
        };
        return check(node) || check(active);
    }

    private render(): void {
        this.container.innerHTML = `
            <div class="catcher-prompt">
                <span>Từ cần tìm nghĩa:</span>
                <strong id="catcherTargetWord" class="catcher-target-word"></strong>
            </div>
            <div class="catcher-canvas-wrap">
                <canvas id="catcherCanvas"></canvas>
            </div>
            <div class="catcher-hint">Chạm vào làn, kéo giỏ hoặc nhấn phím ← → để hứng nghĩa đúng</div>
        `;

        const targetWordEl = this.container.querySelector('#catcherTargetWord');
        if (targetWordEl) {
            targetWordEl.textContent = this.currentQuestion?.question || '';
        }

        this.canvas = this.container.querySelector('#catcherCanvas') as HTMLCanvasElement | null;
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.syncCanvasSize();
        this.basketX = (this.logicalWidth - this.basketWidth) / 2;

        if (typeof ResizeObserver !== 'undefined') {
            const wrap = this.container.querySelector<HTMLElement>('.catcher-canvas-wrap') || this.container;
            this.resizeObserver = new ResizeObserver(() => {
                if (!this.isDestroyed) {
                    this.syncCanvasSize();
                    this.draw();
                }
            });
            this.resizeObserver.observe(wrap);
        }

        this.handleWindowResize = () => {
            if (!this.isDestroyed) {
                this.syncCanvasSize();
                this.draw();
            }
        };
        window.addEventListener('resize', this.handleWindowResize);

        this.handlePointerDown = (e: PointerEvent) => {
            if (!this.canvas || this.isDestroyed || this.isPaused) return;
            this.isPointerDragging = true;
            try {
                this.canvas.setPointerCapture?.(e.pointerId);
            } catch {
            }
            this.updateBasketFromPointer(e);
        };
        this.canvas.addEventListener('pointerdown', this.handlePointerDown);

        this.handlePointerMove = (e: PointerEvent) => {
            if (!this.canvas || this.isDestroyed || this.isPaused) return;
            if (e.pointerType === 'mouse' || this.isPointerDragging) {
                this.updateBasketFromPointer(e);
            }
        };
        this.canvas.addEventListener('pointermove', this.handlePointerMove);

        this.handlePointerUp = () => {
            this.isPointerDragging = false;
        };
        window.addEventListener('pointerup', this.handlePointerUp);
        window.addEventListener('pointercancel', this.handlePointerUp);

        this.handleKeyDown = (e: KeyboardEvent) => {
            if (!this.canvas || this.isDestroyed || this.isPaused) return;
            if (this.isEditableElement(e.target)) return;
            const step = Math.max(28, Math.round(this.logicalWidth * 0.06));
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                if (e.key === 'ArrowLeft') e.preventDefault();
                this.basketX = Math.max(0, this.basketX - step);
            } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                if (e.key === 'ArrowRight') e.preventDefault();
                this.basketX = Math.min(this.logicalWidth - this.basketWidth, this.basketX + step);
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
        if (this.animId !== null) {
            cancelAnimationFrame(this.animId);
            this.animId = null;
        }
        const loop = (timestamp: number) => {
            if (this.isDestroyed || this.isPaused) return;
            const dt = this.lastFrameTime > 0 ? Math.min((timestamp - this.lastFrameTime) / 16.667, 3) : 1;
            this.lastFrameTime = timestamp;
            this.update(timestamp, dt);
            if (this.isDestroyed || this.isPaused) return;
            this.draw();
            this.animId = requestAnimationFrame(loop);
        };
        this.animId = requestAnimationFrame(loop);
    }

    private handleMistakeEvent(): void {
        soundEffects.wrong();
        this.lives--;
        this.callbacks.onLivesChange(this.lives);
        this.combo = 0;
        this.callbacks.onComboChange?.(0);
        this.fallingWords = [];

        if (this.currentQuestion) {
            const pair = this.toWordPair(this.currentQuestion);
            this.recordMistake(pair);
            this.correctionBanner = {
                text: `${pair.ethnic} = ${pair.viet}`,
                remainingMs: 1200
            };
        }

        if (this.lives <= 0) {
            this.stopLoop();
            this.callbacks.onTargetChange?.(null);
            this.callbacks.onGameOver(this.score);
        }
    }

    private update(timestamp: number, dt: number = 1): void {
        if (!this.canvas || this.isDestroyed || this.isPaused) return;

        if (this.correctionBanner) {
            this.correctionBanner.remainingMs -= dt * 16.667;
            if (this.correctionBanner.remainingMs <= 0) {
                this.correctionBanner = null;
                this.setupNextQuestion();
            }
            return;
        }

        const canvasHeight = this.logicalHeight;
        const basketY = canvasHeight - this.basketHeight - 16;

        if (this.fallingWords.length === 0 && timestamp - this.lastSpawnTime > 600) {
            this.spawnWordsForCurrentQuestion();
        }

        for (let i = this.fallingWords.length - 1; i >= 0; i--) {
            const word = this.fallingWords[i];
            word.y += word.speed * dt;
            if (word.baseX !== undefined && word.swayAmp && word.swayAmp > 0) {
                const offset = Math.sin(word.y * 0.025 + (word.swayPhase || 0)) * word.swayAmp;
                const minX = word.laneMinX ?? 8;
                const maxX = word.laneMaxX ?? (this.logicalWidth - word.width - 8);
                word.x = Math.max(minX, Math.min(maxX, word.baseX + offset));
            }

            const hitBasketX = (word.x + word.width > this.basketX) && (word.x < this.basketX + this.basketWidth);
            const hitBasketY = (word.y + word.height >= basketY) && (word.y <= basketY + this.basketHeight);

            if (hitBasketX && hitBasketY) {
                if (word.isCorrect) {
                    this.combo++;
                    this.callbacks.onComboChange?.(this.combo);
                    this.score += 60 + this.level * 15;
                    this.questionsAnswered++;
                    this.callbacks.onScoreChange(this.score);
                    this.callbacks.onProgressChange?.(this.questionsAnswered, this.questionsNeeded);

                    if (this.questionsAnswered >= this.questionsNeeded) {
                        soundEffects.levelUp();
                        this.stopLoop();
                        this.callbacks.onTargetChange?.(null);
                        this.callbacks.onLevelComplete(this.level, this.score);
                        return;
                    }
                    soundEffects.catch();
                    this.setupNextQuestion();
                } else {
                    this.handleMistakeEvent();
                    return;
                }
                break;
            }

            if (word.y > canvasHeight) {
                if (word.isCorrect) {
                    this.handleMistakeEvent();
                    return;
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

    private drawBasket(ctx: CanvasRenderingContext2D, theme: CanvasTheme, w: number, h: number): void {
        const basketY = h - this.basketHeight - 16;
        const bx = this.basketX;
        const bw = this.basketWidth;
        const bh = this.basketHeight;

        ctx.strokeStyle = theme.borderDefault;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, h - 16);
        ctx.lineTo(w, h - 16);
        ctx.stroke();

        ctx.fillStyle = theme.colorPrimary;
        ctx.beginPath();
        this.drawRoundedRect(ctx, bx, basketY + 6, bw, bh - 6, [4, 4, 14, 14]);
        ctx.fill();

        ctx.fillStyle = theme.colorSecondary;
        ctx.beginPath();
        this.drawRoundedRect(ctx, bx - 4, basketY, bw + 8, 10, 5);
        ctx.fill();

        ctx.strokeStyle = theme.textInverse;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(bx + 14, basketY + 18);
        ctx.lineTo(bx + bw - 14, basketY + 18);
        ctx.moveTo(bx + 18, basketY + 28);
        ctx.lineTo(bx + bw - 18, basketY + 28);
        ctx.stroke();

        ctx.fillStyle = theme.bgSurface;
        ctx.strokeStyle = theme.colorPrimary;
        ctx.lineWidth = 1.5;
        const badgeW = 48;
        const badgeH = 20;
        const badgeX = bx + (bw - badgeW) / 2;
        const badgeY = basketY - 24;
        ctx.beginPath();
        this.drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = theme.textPrimary;
        ctx.font = `700 11px ${FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GIỎ', bx + bw / 2, badgeY + badgeH / 2);
    }

    private drawBanner(ctx: CanvasRenderingContext2D, theme: CanvasTheme, w: number, h: number, text: string): void {
        const bannerW = Math.min(w - 32, Math.max(240, this.measureLabelWidth(text, `700 15px ${FONT_FAMILY}`) + 64));
        const bannerH = 64;
        const x = (w - bannerW) / 2;
        const y = (h - bannerH) / 2 - 12;

        ctx.fillStyle = theme.bgSurface;
        ctx.strokeStyle = theme.colorDanger;
        ctx.lineWidth = 2;
        ctx.beginPath();
        this.drawRoundedRect(ctx, x, y, bannerW, bannerH, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = theme.colorDanger;
        ctx.font = `700 12px ${FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ĐÁP ÁN ĐÚNG', w / 2, y + 20, bannerW - 24);

        ctx.fillStyle = theme.textPrimary;
        ctx.font = `700 15px ${FONT_FAMILY}`;
        ctx.fillText(text, w / 2, y + 44, bannerW - 24);
    }

    private drawPauseOverlay(ctx: CanvasRenderingContext2D, theme: CanvasTheme, w: number, h: number): void {
        ctx.fillStyle = theme.bgOverlay;
        ctx.fillRect(0, 0, w, h);

        const cardW = Math.min(w - 40, 280);
        const cardH = 92;
        const x = (w - cardW) / 2;
        const y = (h - cardH) / 2;

        ctx.fillStyle = theme.bgSurface;
        ctx.strokeStyle = theme.borderDefault;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        this.drawRoundedRect(ctx, x, y, cardW, cardH, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = theme.textPrimary;
        ctx.font = `700 18px ${FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ĐANG TẠM DỪNG', w / 2, y + 34, cardW - 24);

        ctx.fillStyle = theme.textSecondary;
        ctx.font = `500 13px ${FONT_FAMILY}`;
        ctx.fillText('Nhấn Tiếp tục để chơi tiếp', w / 2, y + 62, cardW - 24);
    }

    private draw(): void {
        if (!this.ctx || !this.canvas) return;
        const ctx = this.ctx;
        const w = this.logicalWidth;
        const h = this.logicalHeight;
        const theme = resolveCanvasTheme();

        ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

        ctx.fillStyle = theme.bgSurfaceElevated;
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = theme.borderSubtle;
        ctx.lineWidth = 1;
        for (let lane = 1; lane < 3; lane++) {
            const lx = (w / 3) * lane;
            ctx.beginPath();
            ctx.setLineDash([6, 6]);
            ctx.moveTo(lx, 12);
            ctx.lineTo(lx, h - 24);
            ctx.stroke();
        }
        ctx.setLineDash([]);

        this.fallingWords.forEach(word => {
            ctx.fillStyle = theme.bgSurface;
            ctx.strokeStyle = theme.colorPrimary;
            ctx.lineWidth = 2;
            ctx.beginPath();
            this.drawRoundedRect(ctx, word.x, word.y, word.width, word.height, 10);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = theme.textPrimary;
            ctx.font = PILL_FONT;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(word.text, word.x + word.width / 2, word.y + word.height / 2, word.width - 20);
        });

        this.drawBasket(ctx, theme, w, h);

        if (this.correctionBanner) {
            this.drawBanner(ctx, theme, w, h, this.correctionBanner.text);
        }

        if (this.isPaused) {
            this.drawPauseOverlay(ctx, theme, w, h);
        }
    }

    private cleanupListeners(): void {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        if (this.handleWindowResize) {
            window.removeEventListener('resize', this.handleWindowResize);
            this.handleWindowResize = null;
        }
        if (this.canvas) {
            if (this.handlePointerDown) {
                this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
                this.handlePointerDown = null;
            }
            if (this.handlePointerMove) {
                this.canvas.removeEventListener('pointermove', this.handlePointerMove);
                this.handlePointerMove = null;
            }
        }
        if (this.handlePointerUp) {
            window.removeEventListener('pointerup', this.handlePointerUp);
            window.removeEventListener('pointercancel', this.handlePointerUp);
            this.handlePointerUp = null;
        }
        if (this.handleKeyDown) {
            window.removeEventListener('keydown', this.handleKeyDown);
            this.handleKeyDown = null;
        }
    }

    destroy(): void {
        this.stopLoop();
        this.cleanupListeners();
        this.callbacks.onTargetChange?.(null);
        this.container.replaceChildren();
    }
}
