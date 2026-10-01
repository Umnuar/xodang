import { describe, it, expect } from 'vitest';
import {
    parseFaqRows,
    findFaqAnswer,
    getRandomFaqSuggestions,
    DEFAULT_FAQ_ITEMS
} from '@/renderer/services/faq.service';

describe('FAQ Service Unit Tests', () => {
    const rawRows = [
        ['Xin chào bằng tiếng Xơ Đăng là gì?', 'Bơ rơ ha'],
        ['Cảm ơn tiếng Xơ Đăng nói thế nào?', 'Hơ măn ơn'],
        ['Tạm biệt trong tiếng Xơ Đăng là gì?', 'Brơi']
    ];

    it('parses raw sheet rows into FaqItem array', () => {
        const faqs = parseFaqRows(rawRows);
        expect(faqs.length).toBe(3);
        expect(faqs[0].question).toBe('Xin chào bằng tiếng Xơ Đăng là gì?');
        expect(faqs[0].answer).toBe('Bơ rơ ha');
    });

    it('falls back to DEFAULT_FAQ_ITEMS if rows are empty', () => {
        const faqs = parseFaqRows([]);
        expect(faqs.length).toBe(DEFAULT_FAQ_ITEMS.length);
    });

    it('finds answer with case and whitespace insensitivity', () => {
        const faqs = parseFaqRows(rawRows);
        const ans = findFaqAnswer('  xIn chÀo bằng TIẾNG xơ đăng LÀ GÌ?  ', faqs);
        expect(ans).toBe('Bơ rơ ha');
    });

    it('returns null when question is not found', () => {
        const faqs = parseFaqRows(rawRows);
        const ans = findFaqAnswer('Câu hỏi không tồn tại', faqs);
        expect(ans).toBeNull();
    });

    it('provides distinct random suggestions', () => {
        const faqs = parseFaqRows(rawRows);
        const used = new Set<string>();
        const suggestions = getRandomFaqSuggestions(faqs, 2, used);

        expect(suggestions.length).toBe(2);
        expect(used.size).toBe(2);
    });
});
