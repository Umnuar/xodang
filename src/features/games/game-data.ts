import { getLoadedDictionary } from '@/features/home/home';
import { getStorageItem } from '@/services/storage.service';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys';
import { snapshotFallback } from '@snapshot/data';

export type GameDirection = 'ethnic_to_viet' | 'viet_to_ethnic';

export interface GameWordPair {
    ethnic: string;
    viet: string;
    pronunciation?: string;
    driveId?: string;
    topic?: string;
    difficulty?: 1 | 2 | 3;
}

export interface GameQuestion {
    id: string;
    question: string;
    correct: string;
    wrongs: string[];
    topic?: string;
    level: number;
    driveId?: string;
    pronunciation?: string;
    direction: GameDirection;
}

export interface MemoryCardItem {
    id: string;
    pairId: number;
    content: string;
    type: 'question' | 'answer';
    driveId?: string;
    pronunciation?: string;
    lang?: 'ethnic' | 'viet';
}

function normalizeLookupKey(text: string): string {
    return (text || '').normalize('NFC').trim().toLowerCase();
}

function cleanNumberHintSuffix(viet: string): string {
    return (viet || '').trim().replace(/\s*\((?:10|[1-9])\)\s*$/u, '').trim();
}

function computeWordDifficulty(ethnic: string, viet: string): 1 | 2 | 3 {
    const ethnicSyllables = ethnic.trim().split(/[\s-]+/).filter(Boolean).length;
    const vietWords = viet.trim().split(/\s+/).filter(Boolean).length;

    if (ethnicSyllables <= 1 && vietWords <= 2 && ethnic.length <= 12 && viet.length <= 14) {
        return 1;
    }
    if (ethnicSyllables <= 2 && vietWords <= 3 && ethnic.length <= 20 && viet.length <= 24) {
        return 2;
    }
    return 3;
}

function inferTopicFromEntry(viet: string, existingTopic?: string): string {
    if (existingTopic && existingTopic.trim()) {
        return existingTopic.trim();
    }
    const lower = normalizeLookupKey(viet);
    if (lower.startsWith('số ')) return 'Số đếm';
    if (/^(con |chim|cá )/.test(lower) || lower === 'chim') return 'Động vật';
    if (/(bố|mẹ|cha|anh em)/.test(lower)) return 'Gia đình';
    if (/(cơm|ăn|uống)/.test(lower)) return 'Ẩm thực';
    if (/(núi|sông|suối|cây|lá|tháng|rừng)/.test(lower)) return 'Thiên nhiên';
    if (/(nhà|chào|cảm ơn)/.test(lower)) return 'Đời sống';
    return 'Từ điển';
}

function sanitizeDriveId(rawDriveId: unknown): string | undefined {
    if (typeof rawDriveId !== 'string') {
        return undefined;
    }
    const trimmed = rawDriveId.trim();
    if (!trimmed || trimmed === 'null' || trimmed === 'undefined' || /^audio_\d+$/i.test(trimmed)) {
        return undefined;
    }
    return trimmed;
}

function isLegacyCachedEntry(raw: Record<string, unknown>): boolean {
    if (typeof raw.driveId === 'string' && /^audio_\d+$/i.test(raw.driveId.trim())) {
        return true;
    }
    if (typeof raw.viet === 'string' && typeof raw.ethnic === 'string') {
        const viet = normalizeLookupKey(raw.viet);
        const ethnic = normalizeLookupKey(raw.ethnic);
        if ((viet === 'bố' && ethnic === 'bá') || (viet === 'mẹ' && ethnic === 'mế')) {
            return true;
        }
    }
    return false;
}

function normalizeWordPair(raw: {
    ethnic?: unknown;
    viet?: unknown;
    pronunciation?: unknown;
    driveId?: unknown;
    topic?: unknown;
    difficulty?: unknown;
}): GameWordPair | null {
    if (typeof raw.ethnic !== 'string' || typeof raw.viet !== 'string') {
        return null;
    }
    const ethnic = raw.ethnic.trim();
    const viet = cleanNumberHintSuffix(raw.viet);
    if (!ethnic || !viet) {
        return null;
    }
    const pronunciation = typeof raw.pronunciation === 'string' && raw.pronunciation.trim()
        ? raw.pronunciation.trim()
        : undefined;
    const driveId = sanitizeDriveId(raw.driveId);
    const topic = inferTopicFromEntry(
        viet,
        typeof raw.topic === 'string' ? raw.topic : undefined
    );
    const difficulty: 1 | 2 | 3 =
        raw.difficulty === 1 || raw.difficulty === 2 || raw.difficulty === 3
            ? raw.difficulty
            : computeWordDifficulty(ethnic, viet);

    return {
        ethnic,
        viet,
        pronunciation,
        driveId,
        topic,
        difficulty
    };
}

function deduplicateVocab(items: GameWordPair[]): GameWordPair[] {
    const seen = new Set<string>();
    const result: GameWordPair[] = [];
    for (const item of items) {
        const key = `${normalizeLookupKey(item.ethnic)}||${normalizeLookupKey(item.viet)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        result.push(item);
    }
    return result;
}

export function shuffleArray<T>(items: T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

export function getAllGameVocab(): GameWordPair[] {
    const dict = getLoadedDictionary();
    if (Array.isArray(dict) && dict.length >= 4) {
        const dictMapped = deduplicateVocab(
            dict
                .map((entry) => normalizeWordPair(entry))
                .filter((item): item is GameWordPair => item !== null)
        );
        if (dictMapped.length >= 4) {
            return dictMapped;
        }
    }

    const rawCached = getStorageItem<unknown>(STORAGE_KEYS.GAME_OFFLINE_DATA, []);
    if (Array.isArray(rawCached) && rawCached.length >= 4) {
        const cachedObjects = rawCached.filter(
            (item): item is Record<string, unknown> => Boolean(item && typeof item === 'object')
        );
        if (!cachedObjects.some((item) => isLegacyCachedEntry(item))) {
            const validatedCached = deduplicateVocab(
                cachedObjects
                    .map((item) => normalizeWordPair(item))
                    .filter((item): item is GameWordPair => item !== null)
            );
            if (validatedCached.length >= 4) {
                return validatedCached;
            }
        }
    }

    const fallbackDict = snapshotFallback?.dictionary;
    if (Array.isArray(fallbackDict) && fallbackDict.length > 0) {
        return deduplicateVocab(
            fallbackDict
                .map((entry) => normalizeWordPair(entry))
                .filter((item): item is GameWordPair => item !== null)
        );
    }

    return [];
}

function getTieredVocabForLevel(vocab: GameWordPair[], level: number): GameWordPair[] {
    const tier1 = shuffleArray(vocab.filter((item) => (item.difficulty || 1) === 1));
    const tier2 = shuffleArray(vocab.filter((item) => item.difficulty === 2));
    const tier3 = shuffleArray(vocab.filter((item) => item.difficulty === 3));

    if (level <= 1) {
        return [...tier1, ...tier2, ...tier3];
    }
    if (level === 2) {
        return [...tier2, ...tier1, ...tier3];
    }
    return [...tier3, ...tier2, ...tier1];
}

function pickWrongAnswers(
    vocab: GameWordPair[],
    targetItem: GameWordPair,
    count: number,
    direction: GameDirection
): string[] {
    const isEthnicToViet = direction === 'ethnic_to_viet';
    const targetHeadKey = normalizeLookupKey(isEthnicToViet ? targetItem.ethnic : targetItem.viet);
    const correctDisplay = isEthnicToViet ? targetItem.viet : targetItem.ethnic;
    const forbidden = new Set<string>([normalizeLookupKey(correctDisplay)]);

    for (const entry of vocab) {
        const headKey = normalizeLookupKey(isEthnicToViet ? entry.ethnic : entry.viet);
        if (headKey === targetHeadKey) {
            const polysemyVal = isEthnicToViet ? entry.viet : entry.ethnic;
            forbidden.add(normalizeLookupKey(polysemyVal));
        }
    }

    const candidates: Array<{ text: string; key: string; score: number }> = [];
    const seenCandidateKeys = new Set<string>();

    for (const entry of shuffleArray(vocab)) {
        const candidateText = isEthnicToViet ? entry.viet : entry.ethnic;
        const candidateKey = normalizeLookupKey(candidateText);
        if (!candidateKey || forbidden.has(candidateKey) || seenCandidateKeys.has(candidateKey)) {
            continue;
        }
        seenCandidateKeys.add(candidateKey);

        let score = 0;
        if (
            entry.topic &&
            targetItem.topic &&
            entry.topic === targetItem.topic &&
            entry.topic !== 'Từ điển' &&
            entry.topic !== 'Chung'
        ) {
            score += 2;
        }
        if (entry.difficulty && targetItem.difficulty && entry.difficulty === targetItem.difficulty) {
            score += 2;
        }
        if (Math.abs(candidateText.length - correctDisplay.length) <= 4) {
            score += 1;
        }

        candidates.push({ text: candidateText, key: candidateKey, score });
    }

    candidates.sort((a, b) => b.score - a.score);

    const wrongAnswers = candidates.slice(0, count).map((c) => c.text);
    while (wrongAnswers.length < count) {
        wrongAnswers.push(`Từ khác ${wrongAnswers.length + 1}`);
    }
    return wrongAnswers;
}

export function getQuestionsForLevel(
    level: number,
    count: number = 5,
    direction?: GameDirection | 'mixed'
): GameQuestion[] {
    const vocab = getAllGameVocab();
    if (vocab.length === 0 || count <= 0) return [];

    const tiered = getTieredVocabForLevel(vocab, level);
    const questions: GameQuestion[] = [];

    for (let i = 0; i < count; i++) {
        const item = tiered[i % tiered.length];
        const resolvedDirection: GameDirection =
            direction === 'ethnic_to_viet' || direction === 'viet_to_ethnic'
                ? direction
                : level >= 2 && i % 2 === 1
                    ? 'viet_to_ethnic'
                    : 'ethnic_to_viet';

        const questionText = resolvedDirection === 'ethnic_to_viet' ? item.ethnic : item.viet;
        const correctText = resolvedDirection === 'ethnic_to_viet' ? item.viet : item.ethnic;

        questions.push({
            id: `lvl${level}_q${i}`,
            question: questionText,
            correct: correctText,
            wrongs: pickWrongAnswers(vocab, item, 3, resolvedDirection),
            topic: item.topic || 'Chung',
            level,
            driveId: item.driveId,
            pronunciation: item.pronunciation,
            direction: resolvedDirection
        });
    }

    return questions;
}

export function getMemoryCardPairs(level: number, pairCount: number = 4): MemoryCardItem[] {
    const vocab = getAllGameVocab();
    if (vocab.length === 0 || pairCount <= 0) return [];

    const tiered = getTieredVocabForLevel(vocab, level);
    const uniquePairs: GameWordPair[] = [];
    const seenEthnic = new Set<string>();
    const seenViet = new Set<string>();

    for (const item of tiered) {
        const ethnicKey = normalizeLookupKey(item.ethnic);
        const vietKey = normalizeLookupKey(item.viet);
        if (!ethnicKey || !vietKey || seenEthnic.has(ethnicKey) || seenViet.has(vietKey)) {
            continue;
        }
        seenEthnic.add(ethnicKey);
        seenViet.add(vietKey);
        uniquePairs.push(item);
        if (uniquePairs.length >= pairCount) break;
    }

    if (uniquePairs.length === 0) return [];

    const cards: MemoryCardItem[] = [];
    uniquePairs.forEach((item, index) => {
        cards.push({
            id: `q_${level}_${index}`,
            pairId: index,
            content: item.ethnic,
            type: 'question',
            driveId: item.driveId,
            pronunciation: item.pronunciation,
            lang: 'ethnic'
        });
        cards.push({
            id: `a_${level}_${index}`,
            pairId: index,
            content: item.viet,
            type: 'answer',
            driveId: item.driveId,
            pronunciation: item.pronunciation,
            lang: 'viet'
        });
    });

    return shuffleArray(cards);
}
