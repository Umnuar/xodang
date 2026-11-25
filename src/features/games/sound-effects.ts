import { STORAGE_KEYS } from '@/shared/constants/storage-keys';
import { getRawStorageItem, setRawStorageItem } from '@/services/storage.service';

interface ToneStep {
    freq: number;
    type: OscillatorType;
    duration: number;
    gain: number;
    offset: number;
}

class SoundEffectsEngine {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private activeOscillators = new Set<OscillatorNode>();
    private baseVolume = 1;

    private ensureAudioGraph(): { ctx: AudioContext; masterGain: GainNode } | null {
        if (!this.isEnabled() || typeof window === 'undefined') return null;

        if (!this.ctx) {
            const AudioCtx =
                window.AudioContext ||
                (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (!AudioCtx) return null;
            this.ctx = new AudioCtx();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(this.baseVolume, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);
        }

        if (!this.masterGain && this.ctx) {
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(this.baseVolume, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);
        }

        if (!this.ctx || !this.masterGain) return null;
        return { ctx: this.ctx, masterGain: this.masterGain };
    }

    private async ensureRunningContext(ctx: AudioContext): Promise<boolean> {
        if ((ctx.state as string) === 'running') {
            return true;
        }
        try {
            await ctx.resume();
            return (ctx.state as string) === 'running';
        } catch {
            return false;
        }
    }

    private stopActiveOscillators(): void {
        for (const osc of this.activeOscillators) {
            try {
                osc.stop();
                osc.disconnect();
            } catch {
            }
        }
        this.activeOscillators.clear();
    }

    isEnabled(): boolean {
        return getRawStorageItem(STORAGE_KEYS.GAME_SFX) !== 'false';
    }

    setEnabled(enabled: boolean): void {
        setRawStorageItem(STORAGE_KEYS.GAME_SFX, String(enabled));
        if (!enabled) {
            this.stopActiveOscillators();
            if (this.masterGain && this.ctx) {
                const now = this.ctx.currentTime;
                this.masterGain.gain.cancelScheduledValues(now);
                this.masterGain.gain.setValueAtTime(0, now);
            }
            if (this.ctx && (this.ctx.state as string) === 'running') {
                void this.ctx.suspend().catch(() => {});
            }
            return;
        }

        if (this.masterGain && this.ctx) {
            const now = this.ctx.currentTime;
            this.masterGain.gain.cancelScheduledValues(now);
            this.masterGain.gain.setValueAtTime(this.baseVolume, now);
        }
    }

    duckForAudio(durationMs: number): void {
        if (!this.isEnabled() || durationMs <= 0) return;
        const graph = this.ensureAudioGraph();
        if (!graph) return;
        const { ctx, masterGain } = graph;
        const now = ctx.currentTime;
        const durationSec = Math.max(0.05, durationMs / 1000);

        try {
            masterGain.gain.cancelScheduledValues(now);
            masterGain.gain.setValueAtTime(masterGain.gain.value, now);
            masterGain.gain.linearRampToValueAtTime(0.15, now + 0.03);
            masterGain.gain.setValueAtTime(0.15, now + durationSec);
            masterGain.gain.linearRampToValueAtTime(this.baseVolume, now + durationSec + 0.08);
        } catch {
        }
    }

    private async playSequence(steps: ToneStep[]): Promise<void> {
        if (!this.isEnabled()) return;
        const graph = this.ensureAudioGraph();
        if (!graph) return;

        const { ctx, masterGain } = graph;
        const isRunning = await this.ensureRunningContext(ctx);
        if (!isRunning || !this.isEnabled()) return;

        try {
            const baseTime = ctx.currentTime;
            for (const step of steps) {
                const startTime = baseTime + step.offset;
                const stopTime = startTime + step.duration;
                const osc = ctx.createOscillator();
                const noteGain = ctx.createGain();

                osc.type = step.type;
                osc.frequency.setValueAtTime(step.freq, startTime);

                noteGain.gain.setValueAtTime(step.gain, startTime);
                noteGain.gain.exponentialRampToValueAtTime(0.001, stopTime);

                osc.connect(noteGain);
                noteGain.connect(masterGain);

                this.activeOscillators.add(osc);
                osc.onended = () => {
                    this.activeOscillators.delete(osc);
                    try {
                        osc.disconnect();
                        noteGain.disconnect();
                    } catch {
                    }
                };

                osc.start(startTime);
                osc.stop(stopTime);
            }
        } catch {
        }
    }

    click(): void {
        void this.playSequence([
            { freq: 600, type: 'sine', duration: 0.05, gain: 0.1, offset: 0 }
        ]);
    }

    match(): void {
        void this.playSequence([
            { freq: 523.25, type: 'triangle', duration: 0.1, gain: 0.15, offset: 0 },
            { freq: 659.25, type: 'triangle', duration: 0.1, gain: 0.15, offset: 0.08 },
            { freq: 783.99, type: 'triangle', duration: 0.2, gain: 0.2, offset: 0.16 }
        ]);
    }

    success(): void {
        void this.playSequence([
            { freq: 587.33, type: 'sine', duration: 0.1, gain: 0.15, offset: 0 },
            { freq: 880, type: 'sine', duration: 0.25, gain: 0.2, offset: 0.1 }
        ]);
    }

    wrong(): void {
        void this.playSequence([
            { freq: 220, type: 'sawtooth', duration: 0.18, gain: 0.15, offset: 0 },
            { freq: 180, type: 'sawtooth', duration: 0.2, gain: 0.15, offset: 0.1 }
        ]);
    }

    shoot(): void {
        void this.playSequence([
            { freq: 800, type: 'square', duration: 0.08, gain: 0.08, offset: 0 }
        ]);
    }

    catch(): void {
        void this.playSequence([
            { freq: 700, type: 'sine', duration: 0.12, gain: 0.15, offset: 0 }
        ]);
    }

    levelUp(): void {
        void this.playSequence([
            { freq: 440, type: 'triangle', duration: 0.15, gain: 0.2, offset: 0 },
            { freq: 554.37, type: 'triangle', duration: 0.15, gain: 0.2, offset: 0.07 },
            { freq: 659.25, type: 'triangle', duration: 0.15, gain: 0.2, offset: 0.14 },
            { freq: 880, type: 'triangle', duration: 0.18, gain: 0.2, offset: 0.21 }
        ]);
    }
}

export const soundEffects = new SoundEffectsEngine();
