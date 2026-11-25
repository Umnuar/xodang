export class AudioWaveVisualizer {
    private waveElement: HTMLElement | null;
    private bars: HTMLElement[] = [];
    private animFrameId: number | null = null;
    private isRunning = false;
    private audioCtx: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private freqData: Uint8Array<ArrayBuffer> | null = null;
    private lastDrawTime = 0;

    constructor(waveElement: HTMLElement | null) {
        this.waveElement = waveElement;
        this.initBars();
    }

    private initBars(barsCount: number = 40): void {
        if (!this.waveElement) return;
        this.waveElement.replaceChildren();
        this.bars = [];

        const fragment = document.createDocumentFragment();
        for (let i = 0; i < barsCount; i++) {
            const bar = document.createElement('div');
            bar.className = 'audio-wave-bar';
            bar.style.left = `${(i / barsCount) * 100}%`;
            bar.style.transform = 'scaleY(0)';
            fragment.appendChild(bar);
            this.bars.push(bar);
        }
        this.waveElement.appendChild(fragment);
    }

    startAnimation(isPlaying: boolean = false, stream?: MediaStream): void {
        if (!this.waveElement) return;
        this.stopAnimation();
        this.isRunning = true;
        this.lastDrawTime = 0;

        this.bars.forEach((bar) => {
            if (isPlaying) {
                bar.classList.add('playing-wave');
            } else {
                bar.classList.remove('playing-wave');
            }
        });

        if (stream && typeof window !== 'undefined') {
            try {
                const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
                if (AudioCtx) {
                    const ctx = new AudioCtx();
                    const source = ctx.createMediaStreamSource(stream);
                    const analyser = ctx.createAnalyser();
                    analyser.fftSize = 64;
                    source.connect(analyser);
                    this.audioCtx = ctx;
                    this.analyser = analyser;
                    this.freqData = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
                }
            } catch {
                this.closeAudioAnalyser();
            }
        }

        const update = (timestamp: number) => {
            if (!this.isRunning || !this.waveElement) return;

            if (timestamp - this.lastDrawTime >= 50) {
                this.lastDrawTime = timestamp;
                if (this.analyser && this.freqData) {
                    this.analyser.getByteFrequencyData(this.freqData);
                    const len = this.freqData.length || 1;
                    this.bars.forEach((bar, i) => {
                        const bin = this.freqData![i % len] / 255;
                        const scale = Math.max(0.12, Math.min(1, bin * 0.85 + 0.12));
                        bar.style.transform = `scaleY(${scale.toFixed(2)})`;
                    });
                } else {
                    const minScale = isPlaying ? 0.2 : 0.2;
                    const range = isPlaying ? 0.6 : 0.8;
                    this.bars.forEach((bar) => {
                        const scale = Math.random() * range + minScale;
                        bar.style.transform = `scaleY(${scale.toFixed(2)})`;
                    });
                }
            }

            this.animFrameId = requestAnimationFrame(update);
        };

        this.animFrameId = requestAnimationFrame(update);
    }

    private closeAudioAnalyser(): void {
        if (this.audioCtx) {
            this.audioCtx.close().catch(() => {});
            this.audioCtx = null;
        }
        this.analyser = null;
        this.freqData = null;
    }

    stopAnimation(): void {
        this.isRunning = false;
        if (this.animFrameId !== null) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
        this.closeAudioAnalyser();

        this.bars.forEach((bar) => {
            bar.style.transform = 'scaleY(0)';
            bar.classList.remove('playing-wave');
        });
    }

    destroy(): void {
        this.stopAnimation();
        this.bars = [];
        if (this.waveElement) {
            this.waveElement.replaceChildren();
        }
    }
}
