/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createWordCard, renderWordCards } from '@/features/home/word-card';
import { createSuggestionButton } from '@/features/chat/chat';
import { showToast } from '@/components/toast';
import { Game2Catcher } from '@/features/games/game2-catcher';
import { Game3Shooter } from '@/features/games/game3-shooter';
import { renderNoResult } from '@/features/home/home';
import { showLeaderboardModal, showCertificatesModal } from '@/features/games/leaderboard';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys';
import type { DictionaryEntry } from '@/services/dictionary.service';

describe('XSS Security Tests (Rule 3 Compliance)', () => {
    beforeEach(() => {
        if (!window.localStorage || typeof window.localStorage.clear !== 'function') {
            const store = new Map<string, string>();
            const mockStorage = {
                getItem: (k: string) => store.get(k) ?? null,
                setItem: (k: string, v: string) => store.set(k, String(v)),
                removeItem: (k: string) => store.delete(k),
                clear: () => store.clear(),
                get length() { return store.size; },
                key: (i: number) => Array.from(store.keys())[i] ?? null
            };
            Object.defineProperty(window, 'localStorage', {
                value: mockStorage,
                configurable: true,
                writable: true
            });
        }
        window.localStorage.clear();
        document.body.innerHTML = `
            <div id="toastContainer"></div>
            <div id="testCardContainer"></div>
        `;
    });

    it('renders malicious dictionary entries as text without executing script or injecting DOM tags', () => {
        const maliciousEntry: DictionaryEntry = {
            viet: '<script>window.pwned=true</script>',
            ethnic: '<img src="x" onerror="window.pwned=true">',
            pronunciation: '<iframe src="javascript:alert(1)"></iframe>',
            exampleViet: '<svg onload="alert(1)">',
            exampleEthnic: '<a href="javascript:alert(1)">Click me</a>'
        };

        const card = createWordCard(maliciousEntry, 'viet_to_ethnic');
        const container = document.getElementById('testCardContainer')!;
        container.appendChild(card);

        // Verify no malicious elements were created in the DOM tree
        expect(card.querySelector('script')).toBeNull();
        expect(card.querySelector('img[onerror]')).toBeNull();
        expect(card.querySelector('iframe')).toBeNull();
        expect(card.querySelector('svg[onload]')).toBeNull();
        expect(card.querySelector('a[href^="javascript"]')).toBeNull();

        // Verify textContent safely preserved the characters verbatim
        const highlightWord = card.querySelector('.highlight-word');
        expect(highlightWord).not.toBeNull();
        expect(highlightWord?.textContent).toBe('<script>window.pwned=true</script>');

        const targetWord = card.querySelector('.word-text');
        expect(targetWord).not.toBeNull();
        expect(targetWord?.textContent).toBe('<img src="x" onerror="window.pwned=true">');
    });

    it('renderWordCards cleans container using replaceChildren and inserts safe cards', () => {
        const container = document.getElementById('testCardContainer')!;
        container.innerHTML = '<div id="legacy-garbage">Old</div>';

        const entries: DictionaryEntry[] = [
            { viet: 'từ 1', ethnic: 'word 1' },
            { viet: 'từ 2', ethnic: 'word 2' }
        ];

        renderWordCards(container, entries, 'viet_to_ethnic');

        expect(container.querySelector('#legacy-garbage')).toBeNull();
        expect(container.children.length).toBe(2);
        expect(container.querySelectorAll('.word-card').length).toBe(2);
    });

    it('creates chatbot suggestion button as safe DOM node with zero inline onclick', () => {
        const maliciousPrompt = `'; alert('xss'); document.write('<script>'); //`;
        let clickedValue = '';

        const btn = createSuggestionButton(maliciousPrompt, (val) => {
            clickedValue = val;
        });

        // Verify zero inline onclick attribute
        expect(btn.getAttribute('onclick')).toBeNull();
        expect(btn.hasAttribute('onclick')).toBe(false);

        // Verify textContent matches verbatim without unescaped tags
        expect(btn.textContent).toBe(maliciousPrompt);
        expect(btn.querySelector('script')).toBeNull();

        // Verify click handler works cleanly
        btn.click();
        expect(clickedValue).toBe(maliciousPrompt);
    });

    it('showToast renders message via textContent and never creates injected elements', () => {
        const maliciousToast = '<img src="invalid" onerror="window.pwnedToast=true"><script>alert(1)</script>';

        showToast(maliciousToast, 'error');

        const toastContainer = document.getElementById('toastContainer')!;
        const toast = toastContainer.querySelector('.toast');
        expect(toast).not.toBeNull();

        // Verify no injected elements
        expect(toast?.querySelector('img')).toBeNull();
        expect(toast?.querySelector('script')).toBeNull();

        // Verify text content preserved safely
        expect(toast?.textContent).toContain('<img src="invalid" onerror="window.pwnedToast=true"><script>alert(1)</script>');
    });

    it('renders Game 2 (Catcher) target word safely via textContent without executing XSS', () => {
        const gameContainer = document.createElement('div');
        document.body.appendChild(gameContainer);

        const game = new Game2Catcher(gameContainer, {
            onScoreChange: () => {},
            onLivesChange: () => {},
            onLevelComplete: () => {},
            onGameOver: () => {}
        });

        // Mock malicious question
        (game as unknown as { currentQuestion: { question: string } }).currentQuestion = {
            question: '<img src="x" onerror="window.pwnedGame2=true"><script>alert(1)</script>'
        };

        // Call private render
        (game as unknown as { render: () => void }).render();

        const targetWord = gameContainer.querySelector('#catcherTargetWord');
        expect(targetWord).not.toBeNull();
        expect(gameContainer.querySelector('img')).toBeNull();
        expect(gameContainer.querySelector('script')).toBeNull();
        expect(targetWord?.textContent).toBe('<img src="x" onerror="window.pwnedGame2=true"><script>alert(1)</script>');
    });

    it('renders Game 3 (Shooter) target word safely via textContent without executing XSS', () => {
        const gameContainer = document.createElement('div');
        document.body.appendChild(gameContainer);

        const game = new Game3Shooter(gameContainer, {
            onScoreChange: () => {},
            onLivesChange: () => {},
            onLevelComplete: () => {},
            onGameOver: () => {}
        });

        // Mock malicious question
        (game as unknown as { currentQuestion: { question: string } }).currentQuestion = {
            question: '<img src="x" onerror="window.pwnedGame3=true"><script>alert(1)</script>'
        };

        // Call private render
        (game as unknown as { render: () => void }).render();

        const targetWord = gameContainer.querySelector('#shooterTargetWord');
        expect(targetWord).not.toBeNull();
        expect(gameContainer.querySelector('img')).toBeNull();
        expect(gameContainer.querySelector('script')).toBeNull();
        expect(targetWord?.textContent).toBe('<img src="x" onerror="window.pwnedGame3=true"><script>alert(1)</script>');
    });

    it('renders search no-results state safely via textContent without executing XSS (CODE-03)', () => {
        const resultContainer = document.createElement('div');
        document.body.appendChild(resultContainer);

        const maliciousKeyword = '<script>window.pwnedNoResult=true</script><img src="x" onerror="alert(1)">';
        renderNoResult(resultContainer, maliciousKeyword);

        // Verify no malicious script or image tags were created
        expect(resultContainer.querySelector('script')).toBeNull();
        expect(resultContainer.querySelector('img')).toBeNull();

        // Verify the keyword is safely rendered inside <strong> via textContent
        const strong = resultContainer.querySelector('strong');
        expect(strong).not.toBeNull();
        expect(strong?.textContent).toBe(maliciousKeyword);
        expect(resultContainer.textContent).toContain(`Không tìm thấy kết quả phù hợp cho "${maliciousKeyword}"`);
    });

    it('renders malicious player names and certificate titles safely as text in Leaderboard & Certificates modals', () => {
        const payload = '<img src="x" onerror="window.pwnedBoard=true"><script>alert(1)</script>';
        window.localStorage.setItem(STORAGE_KEYS.GAME_USERS, JSON.stringify({
            [payload]: {
                name: payload,
                totalScore: 999,
                bestScore: 500,
                level: 3,
                gamesPlayed: 4,
                lastPlayed: Date.now()
            }
        }));
        window.localStorage.setItem(STORAGE_KEYS.GAME_CERTIFICATES, JSON.stringify([
            {
                id: 'cert_xss_1',
                gameTitle: payload,
                studentName: payload,
                score: 300,
                level: 2,
                date: '25/11/2026',
                timestamp: Date.now()
            }
        ]));

        showLeaderboardModal();
        const lModal = document.getElementById('leaderboardModal')!;
        expect(lModal.querySelector('img')).toBeNull();
        expect(lModal.querySelector('script')).toBeNull();
        expect(lModal.querySelector('.player-name')?.textContent).toContain(payload);

        showCertificatesModal();
        const cModal = document.getElementById('certificatesListModal')!;
        expect(cModal.querySelector('img')).toBeNull();
        expect(cModal.querySelector('script')).toBeNull();
        expect(cModal.querySelector('.cert-card-details h4')?.textContent).toBe(payload);
    });
});

