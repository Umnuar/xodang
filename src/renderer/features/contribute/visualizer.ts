/**
 * Audio Visualizer
 * Manages wave animation for audio recording and playback.
 * Enforces Rule 11: clean animation loops with cancelAnimationFrame.
 */

export class AudioWaveVisualizer {
    private waveElement: HTMLElement | null;
    private animFrameId: number | null = null;
    private isRunning = false;

    constructor(waveElement: HTMLElement | null) {
        this.waveElement = waveElement;
        this.initBars();
    }

    private initBars(barsCount: number = 40): void {
        if (!this.waveElement) return;
        this.waveElement.replaceChildren();

        for (let i = 0; i < barsCount; i++) {
            const bar = document.createElement('div');
            bar.className = 'audio-wave-bar';
            bar.style.left = `${(i / barsCount) * 100}%`;
            bar.style.height = '0%';
            this.waveElement.appendChild(bar);
        }
    }

    startAnimation(isPlaying: boolean = false): void {
        if (!this.waveElement) return;
        this.stopAnimation();
        this.isRunning = true;

        const update = () => {
            if (!this.isRunning || !this.waveElement) return;

            const bars = this.waveElement.querySelectorAll<HTMLElement>('.audio-wave-bar');
            bars.forEach(bar => {
                if (isPlaying) {
                    bar.style.height = `${Math.random() * 60 + 20}%`;
                    bar.classList.add('playing-wave');
                } else {
                    bar.style.height = `${Math.random() * 80 + 20}%`;
                    bar.classList.remove('playing-wave');
                }
            });

            this.animFrameId = requestAnimationFrame(update);
        };

        this.animFrameId = requestAnimationFrame(update);
    }

    stopAnimation(): void {
        this.isRunning = false;
        if (this.animFrameId !== null) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }

        if (this.waveElement) {
            const bars = this.waveElement.querySelectorAll<HTMLElement>('.audio-wave-bar');
            bars.forEach(bar => {
                bar.style.height = '0%';
                bar.classList.remove('playing-wave');
            });
        }
    }

    destroy(): void {
        this.stopAnimation();
        if (this.waveElement) {
            this.waveElement.replaceChildren();
        }
    }
}
