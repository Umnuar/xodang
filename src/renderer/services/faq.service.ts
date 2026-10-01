/**
 * FAQ Service
 * Manages Chatbot FAQ knowledge base, normalization, answer lookup, and suggestion generation.
 */

import { normalizeUnicodeNFC } from './dictionary.service';

export interface FaqItem {
    question: string;
    answer: string;
}

export const DEFAULT_FAQ_ITEMS: FaqItem[] = [
    { question: 'Xin chào bằng tiếng Xơ Đăng là gì?', answer: 'Bơ rơ ha' },
    { question: 'Cảm ơn tiếng Xơ Đăng nói thế nào?', answer: 'Hơ măn ơn' },
    { question: 'Tạm biệt trong tiếng Xơ Đăng là gì?', answer: 'Brơi' },
    { question: 'Bạn có khỏe không?', answer: 'Brơi ha mơ hă?' },
    { question: 'Tôi khỏe, cảm ơn', answer: 'Brơi ha, hơ măn ơn' },
    { question: 'Tên bạn là gì?', answer: 'Brơi pêng hơ rơ ha?' },
    { question: 'Tên tôi là...', answer: 'Brơi pêng ha...' },
    { question: 'Bạn bao nhiêu tuổi?', answer: 'Brơi năm hơ rơ ha?' }
];

/**
 * Parses raw Google Sheet rows into FaqItem array.
 */
export function parseFaqRows(rows: string[][]): FaqItem[] {
    const items = rows.map(row => ({
        question: normalizeUnicodeNFC(row[0] || '').trim(),
        answer: normalizeUnicodeNFC(row[1] || '').trim()
    })).filter(item => item.question.length > 0 && item.answer.length > 0);

    return items.length > 0 ? items : [...DEFAULT_FAQ_ITEMS];
}

/**
 * Finds the corresponding FAQ answer for a question.
 * Exact match (trimmed, case-insensitive, Unicode NFC normalized).
 */
export function findFaqAnswer(query: string, faqs: FaqItem[]): string | null {
    const normalizedQuery = normalizeUnicodeNFC(query).toLowerCase().trim();
    if (!normalizedQuery) return null;

    for (const item of faqs) {
        const itemQuestion = normalizeUnicodeNFC(item.question).toLowerCase().trim();
        if (itemQuestion === normalizedQuery) {
            return item.answer;
        }
    }

    return null;
}

/**
 * Gets random suggestion questions without repeating recently used ones.
 */
export function getRandomFaqSuggestions(
    faqs: FaqItem[],
    count: number = 3,
    usedQuestions: Set<string> = new Set()
): FaqItem[] {
    if (faqs.length === 0) return [];

    let available = faqs.filter(q => !usedQuestions.has(q.question));
    if (available.length < count) {
        usedQuestions.clear();
        available = [...faqs];
    }

    // Shuffle
    const shuffled = [...available];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const selected = shuffled.slice(0, count);
    selected.forEach(q => usedQuestions.add(q.question));
    return selected;
}
