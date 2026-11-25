import { getLoadedDictionary } from '@/features/home/home';
import { getStorageItem } from '@/services/storage.service';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys';

export interface GameWordPair {
    ethnic: string;
    viet: string;
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
    { ethnic: 'Jĭt', viet: 'Mười (10)', topic: 'Số đếm' }
];

export function shuffleArray<T>(items: T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

export function getAllGameVocab(): GameWordPair[] {
    const cached = getStorageItem<GameWordPair[]>(STORAGE_KEYS.GAME_OFFLINE_DATA, []);
    if (Array.isArray(cached) && cached.length > 0) {
        return cached;
    }

    const dict = getLoadedDictionary();
    if (dict && dict.length > 0) {
        const dictMapped: GameWordPair[] = dict
            .filter(d => Boolean(d.viet && d.ethnic))
            .map(d => ({
                ethnic: d.ethnic.trim(),
                viet: d.viet.trim(),
                topic: 'Từ điển'
            }));
        if (dictMapped.length >= BASELINE_GAME_VOCAB.length) {
            return dictMapped;
        }
    }

    return BASELINE_GAME_VOCAB;
}

function pickWrongAnswers(vocab: GameWordPair[], correctViet: string, count: number): string[] {
    const wrongAnswers: string[] = [];
    const seen = new Set<string>([correctViet]);
    const maxAttempts = Math.min(vocab.length * 3, 40);

    for (let attempt = 0; attempt < maxAttempts && wrongAnswers.length < count; attempt++) {
        const candidate = vocab[Math.floor(Math.random() * vocab.length)];
        if (!seen.has(candidate.viet)) {
            seen.add(candidate.viet);
            wrongAnswers.push(candidate.viet);
        }
    }

    if (wrongAnswers.length < count) {
        for (const candidate of vocab) {
            if (!seen.has(candidate.viet)) {
                seen.add(candidate.viet);
                wrongAnswers.push(candidate.viet);
                if (wrongAnswers.length === count) break;
            }
        }
    }

    while (wrongAnswers.length < count) {
        wrongAnswers.push(`Từ khác ${wrongAnswers.length + 1}`);
    }

    return wrongAnswers;
}

export function getQuestionsForLevel(level: number, count: number = 5): GameQuestion[] {
    const vocab = getAllGameVocab();
    if (vocab.length === 0) return [];

    const offset = ((level - 1) * count) % vocab.length;
    const questions: GameQuestion[] = [];

    for (let i = 0; i < count; i++) {
        const item = vocab[(offset + i) % vocab.length];
        questions.push({
            id: `lvl${level}_q${i}`,
            question: item.ethnic,
            correct: item.viet,
            wrongs: pickWrongAnswers(vocab, item.viet, 3),
            topic: item.topic || 'Chung',
            level
        });
    }

    return questions;
}

export function getMemoryCardPairs(level: number, pairCount: number = 4): { id: string; pairId: number; content: string; type: 'question' | 'answer' }[] {
    const vocab = getAllGameVocab();
    const offset = ((level - 1) * pairCount) % vocab.length;
    const cards: { id: string; pairId: number; content: string; type: 'question' | 'answer' }[] = [];

    for (let i = 0; i < pairCount; i++) {
        const item = vocab[(offset + i) % vocab.length];
        cards.push({ id: `q_${level}_${i}`, pairId: i, content: item.ethnic, type: 'question' });
        cards.push({ id: `a_${level}_${i}`, pairId: i, content: item.viet, type: 'answer' });
    }

    return shuffleArray(cards);
}
