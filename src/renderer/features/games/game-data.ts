/**
 * Game Data Provider
 * Supplies vocabulary pairs and multi-choice questions for all 4 games.
 * Combines offline baseline vocabulary with dynamically loaded dictionary data.
 */

import { getLoadedDictionary } from '@/renderer/features/home/home';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys';

export interface GameWordPair {
    ethnic: string; // Xơ Đăng
    viet: string;   // Tiếng Việt
    topic?: string;
}

export interface GameQuestion {
    id: string;
    question: string;
    correct: string;
    wrongs: string[];
    topic?: string;
    level: number;
}

export const BASELINE_GAME_VOCAB: GameWordPair[] = [
    { ethnic: 'Hnam', viet: 'Nhà', topic: 'Đời sống' },
    { ethnic: 'Đak', viet: 'Nước', topic: 'Tự nhiên' },
    { ethnic: 'Pơur', viet: 'Cơm', topic: 'Ẩm thực' },
    { ethnic: 'Chă', viet: 'Ăn', topic: 'Hành động' },
    { ethnic: 'Ngôi', viet: 'Uống', topic: 'Hành động' },
    { ethnic: 'Hôp', viet: 'Học', topic: 'Giáo dục' },
    { ethnic: 'Plei', viet: 'Làng', topic: 'Đời sống' },
    { ethnic: 'Kông', viet: 'Núi', topic: 'Tự nhiên' },
    { ethnic: 'Bri', viet: 'Rừng', topic: 'Tự nhiên' },
    { ethnic: 'Krông', viet: 'Sông', topic: 'Tự nhiên' },
    { ethnic: 'Mế', viet: 'Mẹ', topic: 'Gia đình' },
    { ethnic: 'Bá', viet: 'Bố', topic: 'Gia đình' },
    { ethnic: 'Aih', viet: 'Anh', topic: 'Gia đình' },
    { ethnic: 'O', viet: 'Em', topic: 'Gia đình' },
    { ethnic: 'Kơpô', viet: 'Con trâu', topic: 'Động vật' },
    { ethnic: 'Rơkô', viet: 'Con bò', topic: 'Động vật' },
    { ethnic: 'Chô', viet: 'Con chó', topic: 'Động vật' },
    { ethnic: 'Iêr', viet: 'Con gà', topic: 'Động vật' },
    { ethnic: 'Măt hơjan', viet: 'Mặt trời', topic: 'Tự nhiên' },
    { ethnic: 'Khey', viet: 'Mặt trăng', topic: 'Tự nhiên' },
    { ethnic: 'Môi', viet: 'Một (1)', topic: 'Số đếm' },
    { ethnic: 'Bâr', viet: 'Hai (2)', topic: 'Số đếm' },
    { ethnic: 'Pê', viet: 'Ba (3)', topic: 'Số đếm' },
    { ethnic: 'Puan', viet: 'Bốn (4)', topic: 'Số đếm' },
    { ethnic: 'Pơtâm', viet: 'Năm (5)', topic: 'Số đếm' },
    { ethnic: 'Tơdrou', viet: 'Sáu (6)', topic: 'Số đếm' },
    { ethnic: 'Tơpêh', viet: 'Bảy (7)', topic: 'Số đếm' },
    { ethnic: 'Tơhăm', viet: 'Tám (8)', topic: 'Số đếm' },
    { ethnic: 'Tơchên', viet: 'Chín (9)', topic: 'Số đếm' },
    { ethnic: 'Jĭt', viet: 'Mười (10)', topic: 'Số đếm' },
];

/**
 * Returns merged vocabulary pool
 */
export function getAllGameVocab(): GameWordPair[] {
    // Check cached offline game data in localStorage first
    try {
        const cachedRaw = localStorage.getItem(STORAGE_KEYS.GAME_OFFLINE_DATA);
        if (cachedRaw) {
            const parsed = JSON.parse(cachedRaw);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch {
        // Fallback to memory
    }

    const dict = getLoadedDictionary();
    if (dict && dict.length > 0) {
        const dictMapped: GameWordPair[] = dict
            .filter(d => Boolean(d.viet && d.ethnic))
            .map(d => ({
                ethnic: d.ethnic.trim(),
                viet: d.viet.trim(),
                topic: d.matchType || 'Từ điển'
            }));
        if (dictMapped.length >= BASELINE_GAME_VOCAB.length) {
            return dictMapped;
        }
    }

    return BASELINE_GAME_VOCAB;
}

/**
 * Generates questions for level
 */
export function getQuestionsForLevel(level: number, count: number = 5): GameQuestion[] {
    const vocab = getAllGameVocab();
    if (vocab.length === 0) return [];

    const offset = ((level - 1) * count) % vocab.length;
    const questions: GameQuestion[] = [];

    for (let i = 0; i < count; i++) {
        const item = vocab[(offset + i) % vocab.length];
        // Collect 3 distinct wrong answers
        const wrongAnswers: string[] = [];
        const shuffled = [...vocab].sort(() => Math.random() - 0.5);

        for (const candidate of shuffled) {
            if (candidate.viet !== item.viet && !wrongAnswers.includes(candidate.viet)) {
                wrongAnswers.push(candidate.viet);
                if (wrongAnswers.length === 3) break;
            }
        }

        // Fill fallback wrongs if needed
        while (wrongAnswers.length < 3) {
            wrongAnswers.push(`Từ khác ${wrongAnswers.length + 1}`);
        }

        questions.push({
            id: `lvl${level}_q${i}`,
            question: item.ethnic,
            correct: item.viet,
            wrongs: wrongAnswers,
            topic: item.topic || 'Chung',
            level
        });
    }

    return questions;
}

/**
 * Generates memory card pairs
 */
export function getMemoryCardPairs(level: number, pairCount: number = 4): { id: string; pairId: number; content: string; type: 'question' | 'answer' }[] {
    const vocab = getAllGameVocab();
    const offset = ((level - 1) * pairCount) % vocab.length;
    const cards: { id: string; pairId: number; content: string; type: 'question' | 'answer' }[] = [];

    for (let i = 0; i < pairCount; i++) {
        const item = vocab[(offset + i) % vocab.length];
        cards.push({ id: `q_${level}_${i}`, pairId: i, content: item.ethnic, type: 'question' });
        cards.push({ id: `a_${level}_${i}`, pairId: i, content: item.viet, type: 'answer' });
    }

    return cards.sort(() => Math.random() - 0.5);
}
