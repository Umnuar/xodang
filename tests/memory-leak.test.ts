/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { showSection, initNavbar } from '@/renderer/components/navbar/navbar';
import { AudioWaveVisualizer } from '@/renderer/features/contribute/visualizer';
import { eventBus } from '@/renderer/components/event-bus';

describe('Tab Navigation & Memory Leak Tests (Rule 11 Compliance)', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <nav class="navbar">
                <a href="#home" class="menu-link active" data-section="home">Home</a>
                <a href="#contribute" class="menu-link" data-section="contribute">Contribute</a>
                <a href="#quiz" class="menu-link" data-section="quiz">Quiz</a>
                <a href="#game" class="menu-link" data-section="game">Game</a>
            </nav>
            <main>
                <section id="home" class="container active"></section>
                <section id="contribute" class="container"></section>
                <section id="quiz" class="container"></section>
                <section id="game" class="container"></section>
            </main>
        `;
        initNavbar();
    });

    it('switches between all 4 tabs 5 consecutive rounds cleanly with active states isolated', () => {
        const tabs = ['contribute', 'quiz', 'game', 'home'];
        const emittedEvents: string[] = [];

        const unsubscribe = eventBus.on('tab:change', (sectionId: string) => {
            emittedEvents.push(sectionId);
        });

        // 5 cycles = 20 tab switches
        for (let round = 0; round < 5; round++) {
            for (const tab of tabs) {
                showSection(tab);

                const activeSections = document.querySelectorAll('.container.active');
                expect(activeSections.length).toBe(1);
                expect(activeSections[0].id).toBe(tab);

                const activeLinks = document.querySelectorAll('.menu-link.active');
                expect(activeLinks.length).toBe(1);
            }
        }

        expect(emittedEvents.length).toBe(20);
        unsubscribe();
    });

    it('AudioWaveVisualizer cancels animationFrame cleanly on stop and destroy', () => {
        const waveContainer = document.createElement('div');
        const visualizer = new AudioWaveVisualizer(waveContainer);

        const cancelRafSpy = vi.spyOn(window, 'cancelAnimationFrame');
        const reqRafSpy = vi.spyOn(window, 'requestAnimationFrame');

        visualizer.startAnimation(true);
        expect(reqRafSpy).toHaveBeenCalled();

        visualizer.stopAnimation();
        expect(cancelRafSpy).toHaveBeenCalled();

        visualizer.destroy();
        expect(waveContainer.children.length).toBe(0);

        cancelRafSpy.mockRestore();
        reqRafSpy.mockRestore();
    });
});
