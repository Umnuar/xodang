import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import chatHtml from '@/features/chat/chat.html?raw';
import navbarHtml from '@/components/navbar/navbar.html?raw';
import { initChat } from '@/features/chat/chat';
import { initNavbar, showSection } from '@/components/navbar/navbar';
import * as sheetsService from '@/services/sheets.service';
import { eventBus } from '@/utils/event-bus';

describe('Chat & Navbar Regression Tests (UX-15, UX-18)', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            ${navbarHtml}
            <main>
                <section id="home" class="container active"></section>
                <section id="quiz" class="container"></section>
                <section id="game" class="container"></section>
                <section id="contribute" class="container"></section>
            </main>
            <div id="chatWidgetMount">${chatHtml}</div>
        `;
        Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true, writable: true });
        initNavbar();
    });

    afterEach(() => {
        eventBus.clear();
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('UX-15: loadFaqs preserves early user messages, prevents duplicate typing indicators, and closes on Escape / mobile tab:change', async () => {
        let resolveFaqFetch!: (rows: string[][]) => void;
        vi.spyOn(sheetsService, 'fetchChatData').mockImplementation(
            () => new Promise<string[][]>((resolve) => {
                resolveFaqFetch = resolve;
            })
        );

        initChat(true);

        const chatWindow = document.getElementById('chatWindow')!;
        const chatToggleBtn = document.getElementById('chatToggleBtn')!;
        const chatMessages = document.getElementById('chatMessages')!;
        const chatInput = document.getElementById('chatInput') as HTMLInputElement;
        const sendChatBtn = document.getElementById('sendChatBtn')!;

        expect(chatWindow.classList.contains('active')).toBe(true);
        expect(chatToggleBtn.getAttribute('aria-expanded')).toBe('true');

        chatInput.value = 'Xin chào?';
        sendChatBtn.click();
        chatInput.value = 'Cảm ơn?';
        sendChatBtn.click();

        expect(chatMessages.querySelectorAll('.typing-indicator').length).toBe(1);
        expect(chatMessages.querySelectorAll('.message.user').length).toBe(2);

        resolveFaqFetch([
            ['Xin chào?', 'Bơ rơ ha'],
            ['Cảm ơn?', 'Mơnê']
        ]);

        await vi.waitFor(() => {
            expect(chatMessages.querySelectorAll('.message.user').length).toBe(2);
            expect(chatMessages.textContent).toContain('Xin chào?');
            expect(chatMessages.textContent).toContain('Cảm ơn?');
        });

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(chatWindow.classList.contains('active')).toBe(false);
        expect(document.activeElement).toBe(chatToggleBtn);

        chatToggleBtn.click();
        expect(chatWindow.classList.contains('active')).toBe(true);

        eventBus.emit('tab:change', 'quiz');
        expect(chatWindow.classList.contains('active')).toBe(false);
    });

    it('UX-18: showSection suppresses duplicate tab:change when targeting the already active section', () => {
        const events: string[] = [];
        eventBus.on('tab:change', (sectionId) => {
            events.push(sectionId as string);
        });

        showSection('home');
        expect(events).toEqual([]);

        showSection('quiz');
        expect(events).toEqual(['quiz']);
        expect(document.querySelector('.desktop-menu .menu-link[data-section="quiz"]')?.getAttribute('aria-current')).toBe('page');

        showSection('quiz');
        expect(events).toEqual(['quiz']);
    });
});
