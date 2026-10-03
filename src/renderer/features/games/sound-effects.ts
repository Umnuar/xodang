/**
 * Game Sound Effects Engine
 * Uses Web Audio API oscillator synthesis with zero external audio dependencies.
 * Respects user SFX preference in localStorage (xedang_sfx).
 */

import { STORAGE_KEYS } from '@/shared/constants/storage-keys';

class SoundEffectsEngine {
    private ctx: AudioContext | null = null;

    private getContext(): AudioContext | null {
        if (!this.isEnabled()) return null;
        if (typeof window === 'undefined') return null;
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
        return this.ctx;
    }

    isEnabled(): boolean {
        return localStorage.getItem(STORAGE_KEYS.GAME_SFX) !== 'false';
    }

    setEnabled(enabled: boolean): void {
        localStorage.setItem(STORAGE_KEYS.GAME_SFX, String(enabled));
    }

    /**
     * Play tone at specified frequency
     */
    private playTone(freq: number, type: OscillatorType, duration: number, gainVal: number = 0.15): void {
        const ctx = this.getContext();
        if (!ctx) return;

        try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);

            gain.gain.setValueAtTime(gainVal, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch {
            // Audio error suppression
        }
    }

    click(): void {
        this.playTone(600, 'sine', 0.05, 0.1);
    }

    match(): void {
        const ctx = this.getContext();
        if (!ctx) return;
        try {
            // Arpeggio chime
            this.playTone(523.25, 'triangle', 0.1, 0.15); // C5
            setTimeout(() => this.playTone(659.25, 'triangle', 0.1, 0.15), 80); // E5
            setTimeout(() => this.playTone(783.99, 'triangle', 0.2, 0.2), 160); // G5
        } catch {}
    }

    success(): void {
        const ctx = this.getContext();
        if (!ctx) return;
        try {
            this.playTone(587.33, 'sine', 0.1, 0.15); // D5
            setTimeout(() => this.playTone(880.00, 'sine', 0.25, 0.2), 100); // A5
        } catch {}
    }

    wrong(): void {
        const ctx = this.getContext();
        if (!ctx) return;
        try {
            this.playTone(220, 'sawtooth', 0.18, 0.15);
            setTimeout(() => this.playTone(180, 'sawtooth', 0.2, 0.15), 100);
        } catch {}
    }

    shoot(): void {
        this.playTone(800, 'square', 0.08, 0.08);
    }

    catch(): void {
        this.playTone(700, 'sine', 0.12, 0.15);
    }

    levelUp(): void {
        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((freq, idx) => {
            setTimeout(() => this.playTone(freq, 'triangle', 0.15, 0.2), idx * 70);
        });
    }
}

export const soundEffects = new SoundEffectsEngine();
