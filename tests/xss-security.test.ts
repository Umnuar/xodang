/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createWordCard, renderWordCards } from '@/renderer/features/home/word-card';
import { createSuggestionButton } from '@/renderer/features/chat/chat';
import { showToast } from '@/renderer/components/toast';
import type { DictionaryEntry } from '@/renderer/services/dictionary.service';

describe('XSS Security Tests (Rule 3 Compliance)', () => {
    beforeEach(() => {
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
});
