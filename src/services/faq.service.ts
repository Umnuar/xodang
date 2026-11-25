import { normalizeUnicodeNFC, stripDiacritics } from './dictionary.service';
import { snapshotFallback } from '@snapshot/data';

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

const FAQ_STOP_WORDS = new Set([
    'la', 'gi', 'the', 'nao', 'bang', 'tieng', 'trong', 'xo', 'dang',
    'co', 'khong', 'duoc', 'de', 'lam', 'sao', 'toi', 'ban', 'nay',
    've', 'mot', 'cac', 'oi', 'cho', 'hoi', 'cua'
]);

function extractContentTokens(text: string): string[] {
    const folded = stripDiacritics(text)
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .trim();
    if (!folded) return [];
    return folded
        .split(/\s+/)
        .filter((token) => token.length >= 2 && !FAQ_STOP_WORDS.has(token));
}

export function parseFaqRows(rows: string[][]): FaqItem[] {
    const items = rows.map(row => ({
        question: normalizeUnicodeNFC(row[0] || '').trim(),
        answer: normalizeUnicodeNFC(row[1] || '').trim()
    })).filter(item => item.question.length > 0 && item.answer.length > 0);

    return items.length > 0 ? items : [...DEFAULT_FAQ_ITEMS];
}

export function findFaqAnswer(query: string, faqs: FaqItem[]): string | null {
    const normalizedQuery = normalizeUnicodeNFC(query).toLowerCase().trim();
    if (!normalizedQuery) return null;

    for (const item of faqs) {
        const itemQuestion = normalizeUnicodeNFC(item.question).toLowerCase().trim();
        if (itemQuestion === normalizedQuery) {
            return item.answer;
        }
    }

    const foldedQuery = stripDiacritics(normalizedQuery).trim();
    for (const item of faqs) {
        const foldedItem = stripDiacritics(item.question).toLowerCase().trim();
        if (foldedItem === foldedQuery) {
            return item.answer;
        }
    }

    const queryTokens = extractContentTokens(normalizedQuery);
    if (queryTokens.length === 0) return null;
    const queryTokenSet = new Set(queryTokens);

    let bestAnswer: string | null = null;
    let bestScore = 0;

    for (const item of faqs) {
        const itemTokens = extractContentTokens(item.question);
        if (itemTokens.length === 0) continue;
        const itemTokenSet = new Set(itemTokens);

        let overlap = 0;
        queryTokenSet.forEach((t) => {
            if (itemTokenSet.has(t)) overlap++;
        });

        const queryCoverage = overlap / queryTokenSet.size;
        const itemCoverage = overlap / itemTokenSet.size;
        if (queryCoverage >= 0.6 && overlap >= 1) {
            const score = queryCoverage * 0.6 + itemCoverage * 0.4;
            if (score > bestScore) {
                bestScore = score;
                bestAnswer = item.answer;
            }
        }
    }

    return bestAnswer;
}

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

    const shuffled = [...available];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const selected = shuffled.slice(0, count);
    selected.forEach(q => usedQuestions.add(q.question));
    return selected;
}

export function getInitialFaqItems(): FaqItem[] {
    if (snapshotFallback?.chat && snapshotFallback.chat.length > 0) {
        return parseFaqRows(snapshotFallback.chat);
    }
    return [...DEFAULT_FAQ_ITEMS];
}

export type BotFAQ = FaqItem;
export const pickRandomFaqSuggestions = getRandomFaqSuggestions;
