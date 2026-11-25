import { getQuestionsForLevel, shuffleArray, type GameQuestion, type GameWordPair } from './game-data';
import type { GameTargetInfo } from './games';
import { soundEffects } from './sound-effects';

export interface Game3Callbacks {
    onScoreChange: (score: number) => void;
    onLivesChange: (lives: number) => void;
    onLevelComplete: (level: number, score: number) => void;
    onGameOver: (score: number) => void;
    onProgressChange?: (current: number, total: number) => void;
    onComboChange?: (combo: number) => void;
    onMistake?: (pair: GameWordPair) => void;
    onTargetChange?: (target: GameTargetInfo | null) => void;
}

interface Target {
    text: string;
    isCorrect: boolean;
    x: number;
    y: number;
    radius: number;
    width?: number;
    height?: number;
    lane?: number;
    keyIndex?: number;
    vx: number;
    vy: number;
    color: string;
}

interface ShotEffect {
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    hit: boolean;
    correct: boolean;
    remainingMs: number;
    totalMs: number;
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
    colorSecondary: string;
    colorTertiary: string;
    colorDanger: string;
    borderDefault: string;
    borderSubtle: string;
}

const FONT_FAMILY = '"Be Vietnam Pro", sans-serif';
const PILL_FONT = `600 14px ${FONT_FAMILY}`;
const WALL_OFFSET = 35;

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
        colorSecondary: readThemeToken(styles, '--color-secondary', '#c05621'),
        colorTertiary: readThemeToken(styles, '--color-tertiary', '#2c5282'),
        colorDanger: readThemeToken(styles, '--color-danger', '#dc2626'),
        borderDefault: readThemeToken(styles, '--border-default', '#d6d3d1'),
        borderSubtle: readThemeToken(styles, '--border-subtle', '#e7e5e4')
    };
}

export class Game3Shooter {
    private container: HTMLElement;
    private callbacks: Game3Callbacks;
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;

    private logicalWidth = 600;
    private logicalHeight = 420;
    private dpr = 1;

    private level = 1;
    private score = 0;
    private lives = 3;
    private combo = 0;
    private kills = 0;
    private killsNeeded = 5;

    private questions: GameQuestion[] = [];
    private currentQuestionIndex = 0;
    private currentQuestion: GameQuestion | null = null;
    private mistakes: GameWordPair[] = [];

    private targets: Target[] = [];
    private shotEffects: ShotEffect[] = [];
    private correctionBanner: CorrectionBanner | null = null;
    private aimX = 300;
    private aimY = 160;
    private focusedTargetIndex = 0;

    private animId: number | null = null;
    private lastFrameTime = 0;
    private isDestroyed = false;
    private isPaused = false;
    private hasStarted = false;

    private pointerDownHandler: ((e: PointerEvent) => void) | null = null;
    private pointerMoveHandler: ((e: PointerEvent) => void) | null = null;
    private keyDownHandler: ((e: KeyboardEvent) => void) | null = null;
    private windowResizeHandler: (() => void) | null = null;
    private resizeObserver: ResizeObserver | null = null;

    constructor(container: HTMLElement, callbacks: Game3Callbacks) {
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
        this.lastFrameTime = 0;
        this.level = level;
        this.score = 0;
        this.lives = 3;
        this.combo = 0;
        this.kills = 0;
        this.currentQuestionIndex = 0;
        this.currentQuestion = null;
        this.killsNeeded = 4 + level;
        this.targets = [];
        this.shotEffects = [];
        this.mistakes = [];
        this.correctionBanner = null;
        this.focusedTargetIndex = 0;

        if (this.hasStarted) {
            this.callbacks.onScoreChange(0);
            this.callbacks.onLivesChange(this.lives);
        }
        this.hasStarted = true;
        this.callbacks.onComboChange?.(0);

        this.questions = getQuestionsForLevel(this.level, this.killsNeeded + 3);
        if (this.questions.length === 0) {
            this.callbacks.onProgressChange?.(0, 0);
            this.callbacks.onTargetChange?.(null);
            this.renderEmptyState();
            return;
        }

        this.callbacks.onProgressChange?.(0, this.killsNeeded);
        this.render();
        this.nextQuestion();
        this.draw();
        this.startLoop();
    }

    pause(): void {
        if (this.isPaused || this.isDestroyed) return;
        this.isPaused = true;
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
        const wrap = this.container.querySelector<HTMLElement>('.shooter-canvas-wrap');
        const measuredW = wrap?.clientWidth || this.container.clientWidth || 0;
        const nextW = measuredW > 0 ? Math.max(320, Math.min(920, Math.floor(measuredW))) : 600;
        const viewportH = typeof window !== 'undefined' && window.innerHeight > 0 ? window.innerHeight : 720;
        const nextH = measuredW > 0 ? Math.max(360, Math.min(520, Math.round(viewportH * 0.54))) : 420;
        const nextDpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;

        this.logicalWidth = nextW;
        this.logicalHeight = nextH;
        this.dpr = nextDpr;
        this.aimX = Math.max(0, Math.min(nextW, this.aimX));
        this.aimY = Math.max(0, Math.min(nextH - WALL_OFFSET, this.aimY));

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

        for (let i = 0; i < this.targets.length; i++) {
            const t = this.targets[i];
            const halfW = (t.width ?? t.radius * 2) / 2;
            t.x = Math.max(halfW + 10, Math.min(nextW - halfW - 10, t.x));
        }
    }

    private nextQuestion(): void {
        if (this.questions.length === 0) return;
        if (this.currentQuestionIndex >= this.questions.length) {
            this.currentQuestionIndex = 0;
        }
        this.currentQuestion = this.questions[this.currentQuestionIndex++];
        const promptEl = this.container.querySelector('#shooterTargetWord');
        if (promptEl) {
            promptEl.textContent = this.currentQuestion?.question || '';
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
        this.spawnTargets();
    }

    private spawnTargets(): void {
        if (!this.currentQuestion || !this.canvas) return;
        this.targets = [];
        this.focusedTargetIndex = 0;

        const theme = resolveCanvasTheme();
        const laneColors = [theme.colorPrimary, theme.colorTertiary, theme.colorSecondary];
        const options = shuffleArray([
            { text: this.currentQuestion.correct, isCorrect: true },
            ...this.currentQuestion.wrongs.slice(0, 2).map(w => ({ text: w, isCorrect: false }))
        ]);

        const w = this.logicalWidth;
        const h = this.logicalHeight;
        const rowSpacing = Math.max(62, Math.floor((h - 175) / 3));
        const pillHeight = 48;
        const horizontalSpeed = 0.85 + this.level * 0.16;
        const downwardSpeed = 0.35 + this.level * 0.09;

        options.forEach((opt, idx) => {
            const measuredTextW = this.measureLabelWidth(opt.text, PILL_FONT);
            const pillWidth = Math.max(128, Math.min(w - 24, Math.ceil(measuredTextW + 64)));
            const halfW = pillWidth / 2;
            const minX = halfW + 12;
            const maxX = Math.max(minX, w - halfW - 12);
            const anchorRatio = idx === 0 ? 0.25 : idx === 1 ? 0.5 : 0.75;
            const startX = Math.max(minX, Math.min(maxX, w * anchorRatio));
            const startY = 44 + idx * rowSpacing;

            this.targets.push({
                text: opt.text,
                isCorrect: opt.isCorrect,
                x: startX,
                y: startY,
                radius: pillHeight / 2,
                width: pillWidth,
                height: pillHeight,
                lane: idx,
                keyIndex: idx + 1,
                vx: (idx % 2 === 0 ? 1 : -1) * horizontalSpeed,
                vy: downwardSpeed,
                color: laneColors[idx % laneColors.length]
            });
        });
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
            <div class="shooter-prompt">
                <span>Mục tiêu cần bắn: Nghĩa của từ </span>
                <strong id="shooterTargetWord" class="shooter-target-word"></strong>
            </div>
            <div class="shooter-canvas-wrap">
                <canvas id="shooterCanvas"></canvas>
            </div>
            <div class="shooter-hint">Chạm vào thẻ từ đúng hoặc nhấn phím 1, 2, 3 để bảo vệ buôn làng</div>
        `;

        const targetWordEl = this.container.querySelector('#shooterTargetWord');
        if (targetWordEl) {
            targetWordEl.textContent = this.currentQuestion?.question || '';
        }

        this.canvas = this.container.querySelector('#shooterCanvas') as HTMLCanvasElement | null;
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.syncCanvasSize();
        this.aimX = this.logicalWidth / 2;
        this.aimY = this.logicalHeight / 2;

        if (typeof ResizeObserver !== 'undefined') {
            const wrap = this.container.querySelector<HTMLElement>('.shooter-canvas-wrap') || this.container;
            this.resizeObserver = new ResizeObserver(() => {
                if (!this.isDestroyed) {
                    this.syncCanvasSize();
                    this.draw();
                }
            });
            this.resizeObserver.observe(wrap);
        }

        this.windowResizeHandler = () => {
            if (!this.isDestroyed) {
                this.syncCanvasSize();
                this.draw();
            }
        };
        window.addEventListener('resize', this.windowResizeHandler);

        this.pointerMoveHandler = (e: PointerEvent) => {
            if (!this.canvas || this.isDestroyed || this.isPaused) return;
            const rect = this.canvas.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) return;
            this.aimX = ((e.clientX - rect.left) / rect.width) * this.logicalWidth;
            this.aimY = ((e.clientY - rect.top) / rect.height) * this.logicalHeight;
        };
        this.canvas.addEventListener('pointermove', this.pointerMoveHandler);

        this.pointerDownHandler = (e: PointerEvent) => {
            if (!this.canvas || this.isDestroyed || this.isPaused) return;
            const rect = this.canvas.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) return;
            const clickX = ((e.clientX - rect.left) / rect.width) * this.logicalWidth;
            const clickY = ((e.clientY - rect.top) / rect.height) * this.logicalHeight;
            this.aimX = clickX;
            this.aimY = clickY;
            this.handleShoot(clickX, clickY);
        };
        this.canvas.addEventListener('pointerdown', this.pointerDownHandler);

        this.keyDownHandler = (e: KeyboardEvent) => {
            if (!this.canvas || this.isDestroyed || this.isPaused || this.correctionBanner) return;
            if (this.isEditableElement(e.target)) return;

            if (e.key === '1' || e.key === '2' || e.key === '3') {
                const keyNum = parseInt(e.key, 10);
                const idx = this.targets.findIndex(t => t.keyIndex === keyNum);
                const fallbackIdx = idx >= 0 ? idx : keyNum - 1;
                if (fallbackIdx >= 0 && fallbackIdx < this.targets.length) {
                    e.preventDefault();
                    this.focusedTargetIndex = fallbackIdx;
                    this.fireAtTargetIndex(fallbackIdx);
                }
                return;
            }

            if (this.targets.length === 0) return;

            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                this.focusedTargetIndex = (this.focusedTargetIndex - 1 + this.targets.length) % this.targets.length;
                const focused = this.targets[this.focusedTargetIndex];
                this.aimX = focused.x;
                this.aimY = focused.y;
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                this.focusedTargetIndex = (this.focusedTargetIndex + 1) % this.targets.length;
                const focused = this.targets[this.focusedTargetIndex];
                this.aimX = focused.x;
                this.aimY = focused.y;
            } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const safeIdx = Math.max(0, Math.min(this.targets.length - 1, this.focusedTargetIndex));
                this.fireAtTargetIndex(safeIdx);
            }
        };
        window.addEventListener('keydown', this.keyDownHandler);
    }

    private addShotEffect(toX: number, toY: number, hit: boolean, correct: boolean): void {
        const launcherX = this.logicalWidth / 2;
        const launcherY = this.logicalHeight - WALL_OFFSET;
        this.shotEffects.push({
            fromX: launcherX,
            fromY: launcherY,
            toX,
            toY,
            hit,
            correct,
            remainingMs: 280,
            totalMs: 280
        });
    }

    private fireAtTargetIndex(index: number): void {
        if (this.isDestroyed || this.isPaused || this.correctionBanner) return;
        const t = this.targets[index];
        if (!t) return;

        this.aimX = t.x;
        this.aimY = t.y;
        this.addShotEffect(t.x, t.y, true, t.isCorrect);

        if (t.isCorrect) {
            this.combo++;
            this.callbacks.onComboChange?.(this.combo);
            this.score += 70 + this.level * 10;
            this.kills++;
            this.callbacks.onScoreChange(this.score);
            this.callbacks.onProgressChange?.(this.kills, this.killsNeeded);

            if (this.kills >= this.killsNeeded) {
                soundEffects.levelUp();
                this.stopLoop();
                this.callbacks.onTargetChange?.(null);
                this.callbacks.onLevelComplete(this.level, this.score);
                return;
            }
            soundEffects.success();
            this.nextQuestion();
        } else {
            this.handleMistakeEvent();
        }
    }

    private handleShoot(clickX: number, clickY: number): void {
        if (this.isDestroyed || this.isPaused || this.correctionBanner) return;

        for (let i = this.targets.length - 1; i >= 0; i--) {
            const t = this.targets[i];
            const isHit = t.width !== undefined && t.height !== undefined
                ? Math.abs(clickX - t.x) <= t.width / 2 && Math.abs(clickY - t.y) <= t.height / 2
                : Math.hypot(clickX - t.x, clickY - t.y) <= t.radius;

            if (isHit) {
                this.fireAtTargetIndex(i);
                return;
            }
        }

        soundEffects.shoot();
        this.addShotEffect(clickX, clickY, false, false);
    }

    private handleMistakeEvent(): void {
        soundEffects.wrong();
        this.lives--;
        this.callbacks.onLivesChange(this.lives);
        this.combo = 0;
        this.callbacks.onComboChange?.(0);
        this.targets = [];

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
            this.update(dt);
            if (this.isDestroyed || this.isPaused) return;
            this.draw();
            this.animId = requestAnimationFrame(loop);
        };
        this.animId = requestAnimationFrame(loop);
    }

    private resolveTargetOverlap(): void {
        for (let i = 0; i < this.targets.length; i++) {
            for (let j = i + 1; j < this.targets.length; j++) {
                const a = this.targets[i];
                const b = this.targets[j];
                const aHalfW = (a.width ?? a.radius * 2) / 2;
                const bHalfW = (b.width ?? b.radius * 2) / 2;
                const aHalfH = (a.height ?? a.radius * 2) / 2;
                const bHalfH = (b.height ?? b.radius * 2) / 2;

                const minGapY = aHalfH + bHalfH + 10;
                const minGapX = aHalfW + bHalfW + 10;
                const dx = a.x - b.x;
                const dy = a.y - b.y;

                if (Math.abs(dx) < minGapX && Math.abs(dy) < minGapY) {
                    const pushY = (minGapY - Math.abs(dy)) * 0.5;
                    if (dy <= 0) {
                        a.y -= pushY;
                        b.y += pushY;
                    } else {
                        a.y += pushY;
                        b.y -= pushY;
                    }
                }
            }
        }
    }

    private update(dt: number = 1): void {
        if (!this.canvas || this.isDestroyed || this.isPaused) return;

        for (let i = this.shotEffects.length - 1; i >= 0; i--) {
            this.shotEffects[i].remainingMs -= dt * 16.667;
            if (this.shotEffects[i].remainingMs <= 0) {
                this.shotEffects.splice(i, 1);
            }
        }

        if (this.correctionBanner) {
            this.correctionBanner.remainingMs -= dt * 16.667;
            if (this.correctionBanner.remainingMs <= 0) {
                this.correctionBanner = null;
                this.nextQuestion();
            }
            return;
        }

        const w = this.logicalWidth;
        const h = this.logicalHeight;
        const wallY = h - WALL_OFFSET;

        for (let i = this.targets.length - 1; i >= 0; i--) {
            const t = this.targets[i];
            const halfW = (t.width ?? t.radius * 2) / 2;
            const halfH = (t.height ?? t.radius * 2) / 2;

            t.x += t.vx * dt;
            t.y += t.vy * dt;

            if (t.x - halfW <= 8) {
                t.x = halfW + 8;
                t.vx = Math.abs(t.vx);
            } else if (t.x + halfW >= w - 8) {
                t.x = w - halfW - 8;
                t.vx = -Math.abs(t.vx);
            }

            if (t.y + halfH >= wallY) {
                if (t.isCorrect) {
                    this.handleMistakeEvent();
                    return;
                }
                this.targets.splice(i, 1);
            }
        }

        this.resolveTargetOverlap();

        if (this.targets.length === 0) {
            this.spawnTargets();
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

    private drawDefenseWall(ctx: CanvasRenderingContext2D, theme: CanvasTheme, w: number, h: number): void {
        const wallY = h - WALL_OFFSET;

        ctx.fillStyle = theme.colorSecondary;
        ctx.fillRect(0, wallY, w, 10);
        ctx.fillStyle = theme.bgSurface;
        ctx.fillRect(0, wallY + 10, w, WALL_OFFSET - 10);
        ctx.strokeStyle = theme.borderDefault;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, wallY);
        ctx.lineTo(w, wallY);
        ctx.stroke();

        const launcherX = w / 2;
        const launcherY = wallY;
        const angle = Math.atan2(this.aimY - launcherY, this.aimX - launcherX);

        ctx.save();
        ctx.translate(launcherX, launcherY);
        ctx.rotate(angle);
        ctx.fillStyle = theme.colorPrimary;
        ctx.beginPath();
        this.drawRoundedRect(ctx, 0, -5, 24, 10, 5);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = theme.colorPrimary;
        ctx.beginPath();
        ctx.arc(launcherX, launcherY, 13, Math.PI, 0);
        ctx.fill();
        ctx.strokeStyle = theme.bgSurface;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    private drawShotEffects(ctx: CanvasRenderingContext2D, theme: CanvasTheme): void {
        for (const fx of this.shotEffects) {
            const alpha = Math.max(0, fx.remainingMs / fx.totalMs);
            const fxColor = fx.hit
                ? (fx.correct ? theme.colorPrimary : theme.colorDanger)
                : theme.colorTertiary;

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = fxColor;
            ctx.lineWidth = fx.hit ? 3 : 2;
            ctx.beginPath();
            ctx.moveTo(fx.fromX, fx.fromY);
            ctx.lineTo(fx.toX, fx.toY);
            ctx.stroke();

            const ringRadius = 10 + (1 - alpha) * 18;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(fx.toX, fx.toY, ringRadius, 0, Math.PI * 2);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(fx.toX - 8, fx.toY);
            ctx.lineTo(fx.toX + 8, fx.toY);
            ctx.moveTo(fx.toX, fx.toY - 8);
            ctx.lineTo(fx.toX, fx.toY + 8);
            ctx.stroke();
            ctx.restore();
        }
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
        for (let row = 1; row <= 3; row++) {
            const ry = (h - WALL_OFFSET) * (row / 4);
            ctx.beginPath();
            ctx.setLineDash([5, 6]);
            ctx.moveTo(12, ry);
            ctx.lineTo(w - 12, ry);
            ctx.stroke();
        }
        ctx.setLineDash([]);

        this.targets.forEach((t, idx) => {
            const pillW = t.width ?? t.radius * 2;
            const pillH = t.height ?? t.radius * 2;
            const left = t.x - pillW / 2;
            const top = t.y - pillH / 2;
            const isFocused = idx === this.focusedTargetIndex;

            ctx.fillStyle = theme.bgSurface;
            ctx.strokeStyle = isFocused ? t.color : theme.borderDefault;
            ctx.lineWidth = isFocused ? 2.5 : 1.5;
            ctx.beginPath();
            this.drawRoundedRect(ctx, left, top, pillW, pillH, 12);
            ctx.fill();
            ctx.stroke();

            const badgeSize = 26;
            const badgeX = left + 10;
            const badgeY = top + (pillH - badgeSize) / 2;
            ctx.fillStyle = t.color;
            ctx.beginPath();
            this.drawRoundedRect(ctx, badgeX, badgeY, badgeSize, badgeSize, 8);
            ctx.fill();

            ctx.fillStyle = theme.textInverse;
            ctx.font = `700 12px ${FONT_FAMILY}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(t.keyIndex ?? idx + 1), badgeX + badgeSize / 2, badgeY + badgeSize / 2);

            const textStartX = badgeX + badgeSize + 10;
            const availableTextW = pillW - (badgeSize + 28);
            ctx.fillStyle = theme.textPrimary;
            ctx.font = PILL_FONT;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(t.text, textStartX + availableTextW / 2, t.y, availableTextW);
        });

        this.drawDefenseWall(ctx, theme, w, h);
        this.drawShotEffects(ctx, theme);

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
        if (this.windowResizeHandler) {
            window.removeEventListener('resize', this.windowResizeHandler);
            this.windowResizeHandler = null;
        }
        if (this.canvas) {
            if (this.pointerDownHandler) {
                this.canvas.removeEventListener('pointerdown', this.pointerDownHandler);
                this.pointerDownHandler = null;
            }
            if (this.pointerMoveHandler) {
                this.canvas.removeEventListener('pointermove', this.pointerMoveHandler);
                this.pointerMoveHandler = null;
            }
        }
        if (this.keyDownHandler) {
            window.removeEventListener('keydown', this.keyDownHandler);
            this.keyDownHandler = null;
        }
    }

    destroy(): void {
        this.stopLoop();
        this.cleanupListeners();
        this.callbacks.onTargetChange?.(null);
        this.container.replaceChildren();
    }
}
