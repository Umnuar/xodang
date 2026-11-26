import { getLoadedDictionary } from '@/features/home/home';
import { classifyEntryKind, type EntryKind } from '@/services/dictionary.service';
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
    kind?: EntryKind;
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

const COMBINING_MARKS_REGEX = /[\u0300-\u036f]/;

function normalizeLookupKey(text: string): string {
    const trimmed = (text || '').trim();
    const normalized = COMBINING_MARKS_REGEX.test(trimmed) ? trimmed.normalize('NFC') : trimmed;
    return normalized.toLowerCase();
}

function cleanNumberHintSuffix(viet: string): string {
    const trimmed = (viet || '').trim();
    if (!trimmed.endsWith(')')) return trimmed;
    return trimmed.replace(/\s*\((?:10|[1-9])\)\s*$/u, '').trim();
}

function countDelimiters(text: string, splitHyphens: boolean): number {
    let count = 0;
    let inToken = false;
    for (let i = 0; i < text.length; i++) {
        const ch = text.charCodeAt(i);
        const isSep = ch <= 32 || (splitHyphens && ch === 45);
        if (isSep) {
            inToken = false;
        } else if (!inToken) {
            inToken = true;
            count++;
        }
    }
    return count;
}

function computeWordDifficulty(ethnic: string, viet: string): 1 | 2 | 3 {
    const ethnicSyllables = countDelimiters(ethnic, true);
    const vietWords = countDelimiters(viet, false);

    if (ethnicSyllables <= 1 && vietWords <= 2 && ethnic.length <= 12 && viet.length <= 14) {
        return 1;
    }
    if (ethnicSyllables <= 2 && vietWords <= 3 && ethnic.length <= 20 && viet.length <= 24) {
        return 2;
    }
    return 3;
}

const TOPIC_KEYWORD_GUARD = /(?:^số |^con |^cá |chim|bố|mẹ|cha|anh em|cơm|ăn|uống|núi|sông|suối|cây|lá|tháng|rừng|nhà|chào|cảm ơn)/;

function inferTopicFromLower(lower: string, existingTopic?: string): string {
    if (existingTopic && existingTopic.trim()) {
        return existingTopic.trim();
    }
    if (!TOPIC_KEYWORD_GUARD.test(lower)) return 'Từ điển';
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

const loadedGameVocabCache = new WeakMap<object[], GameWordPair[]>();

function normalizeAndDeduplicateList(
    rawList: Array<{
        ethnic?: unknown;
        viet?: unknown;
        pronunciation?: unknown;
        driveId?: unknown;
        topic?: unknown;
        difficulty?: unknown;
        kind?: unknown;
    }>
): GameWordPair[] {
    const seen = new Set<string>();
    const result: GameWordPair[] = [];

    for (let i = 0; i < rawList.length; i++) {
        const raw = rawList[i];
        if (!raw || typeof raw.ethnic !== 'string' || typeof raw.viet !== 'string') {
            continue;
        }
        const ethnicRaw = raw.ethnic.trim();
        const vietRaw = cleanNumberHintSuffix(raw.viet);
        if (!ethnicRaw || !vietRaw) {
            continue;
        }
        const ethnic = COMBINING_MARKS_REGEX.test(ethnicRaw) ? ethnicRaw.normalize('NFC') : ethnicRaw;
        const viet = COMBINING_MARKS_REGEX.test(vietRaw) ? vietRaw.normalize('NFC') : vietRaw;
        const ethnicKey = ethnic.toLowerCase();
        const vietKey = viet.toLowerCase();
        const dedupKey = `${ethnicKey}||${vietKey}`;
        if (seen.has(dedupKey)) {
            continue;
        }
        seen.add(dedupKey);

        const pronunciation =
            typeof raw.pronunciation === 'string' && raw.pronunciation.trim()
                ? raw.pronunciation.trim()
                : undefined;
        const driveId = sanitizeDriveId(raw.driveId);
        const topic = inferTopicFromLower(
            vietKey,
            typeof raw.topic === 'string' ? raw.topic : undefined
        );
        const difficulty: 1 | 2 | 3 =
            raw.difficulty === 1 || raw.difficulty === 2 || raw.difficulty === 3
                ? raw.difficulty
                : computeWordDifficulty(ethnic, viet);
        const kind: EntryKind =
            raw.kind === 'word' || raw.kind === 'phrase'
                ? raw.kind
                : classifyEntryKind(viet, ethnic);

        result.push({
            ethnic,
            viet,
            pronunciation,
            driveId,
            topic,
            difficulty,
            kind
        });
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

function sampleRandomItems<T>(items: T[], maxCount: number): T[] {
    if (items.length <= maxCount) {
        return shuffleArray(items);
    }
    const picked: T[] = [];
    const usedIndices = new Set<number>();
    const maxAttempts = maxCount * 4;
    let attempts = 0;
    while (picked.length < maxCount && attempts < maxAttempts) {
        attempts++;
        const idx = Math.floor(Math.random() * items.length);
        if (usedIndices.has(idx)) continue;
        usedIndices.add(idx);
        picked.push(items[idx]);
    }
    return picked;
}

export function getAllGameVocab(): GameWordPair[] {
    const dict = getLoadedDictionary();
    if (Array.isArray(dict) && dict.length >= 4) {
        const cached = loadedGameVocabCache.get(dict);
        if (cached) {
            return cached;
        }
        const dictMapped = normalizeAndDeduplicateList(dict);
        if (dictMapped.length >= 4) {
            loadedGameVocabCache.set(dict, dictMapped);
            return dictMapped;
        }
    }

    const rawCached = getStorageItem<unknown>(STORAGE_KEYS.GAME_OFFLINE_DATA, []);
    if (Array.isArray(rawCached) && rawCached.length >= 4) {
        const cachedObjects = rawCached.filter(
            (item): item is Record<string, unknown> => Boolean(item && typeof item === 'object')
        );
        if (!cachedObjects.some((item) => isLegacyCachedEntry(item))) {
            const validatedCached = normalizeAndDeduplicateList(cachedObjects);
            if (validatedCached.length >= 4) {
                return validatedCached;
            }
        }
    }

    const fallbackDict = snapshotFallback?.dictionary;
    if (Array.isArray(fallbackDict) && fallbackDict.length > 0) {
        return normalizeAndDeduplicateList(fallbackDict);
    }

    return [];
}

interface TieredVocabBuckets {
    tier1Words: GameWordPair[];
    tier2Words: GameWordPair[];
    phraseShort: GameWordPair[];
    tier3All: GameWordPair[];
}

const tieredBucketsCache = new WeakMap<GameWordPair[], TieredVocabBuckets>();

function getTieredBuckets(vocab: GameWordPair[]): TieredVocabBuckets {
    let buckets = tieredBucketsCache.get(vocab);
    if (!buckets) {
        const tier1Words: GameWordPair[] = [];
        const tier2Words: GameWordPair[] = [];
        const phraseShort: GameWordPair[] = [];
        const tier3All: GameWordPair[] = [];

        for (let i = 0; i < vocab.length; i++) {
            const item = vocab[i];
            if (item.difficulty === 3) {
                tier3All.push(item);
            } else if (item.kind === 'phrase') {
                phraseShort.push(item);
            } else if (item.difficulty === 2) {
                tier2Words.push(item);
            } else {
                tier1Words.push(item);
            }
        }

        buckets = { tier1Words, tier2Words, phraseShort, tier3All };
        tieredBucketsCache.set(vocab, buckets);
    }
    return buckets;
}

function getTieredVocabForLevel(vocab: GameWordPair[], level: number): GameWordPair[] {
    const poolLimit = vocab.length > 400 ? 150 : vocab.length;
    const buckets = getTieredBuckets(vocab);
    const tier1Words = sampleRandomItems(buckets.tier1Words, poolLimit);
    const tier2Words = sampleRandomItems(buckets.tier2Words, poolLimit);
    const phraseShort = sampleRandomItems(buckets.phraseShort, poolLimit);
    const tier3All = sampleRandomItems(buckets.tier3All, poolLimit);

    if (level <= 1) {
        return [...tier1Words, ...tier2Words, ...phraseShort, ...tier3All];
    }
    if (level === 2) {
        return [...tier2Words, ...tier1Words, ...phraseShort, ...tier3All];
    }
    return [...tier3All, ...tier2Words, ...phraseShort, ...tier1Words];
}

function pickWrongAnswers(
    vocab: GameWordPair[],
    targetItem: GameWordPair,
    count: number,
    direction: GameDirection,
    precomputedForbidden?: Set<string>
): string[] {
    const isEthnicToViet = direction === 'ethnic_to_viet';
    const targetHeadKey = normalizeLookupKey(isEthnicToViet ? targetItem.ethnic : targetItem.viet);
    const correctDisplay = isEthnicToViet ? targetItem.viet : targetItem.ethnic;
    const forbidden = precomputedForbidden || new Set<string>([normalizeLookupKey(correctDisplay)]);

    if (!precomputedForbidden) {
        const targetRawLen = targetHeadKey.length;
        for (let i = 0; i < vocab.length; i++) {
            const entry = vocab[i];
            const headRaw = isEthnicToViet ? entry.ethnic : entry.viet;
            if (headRaw.length !== targetRawLen) {
                continue;
            }
            if (headRaw.toLowerCase() === targetHeadKey) {
                const polysemyVal = isEthnicToViet ? entry.viet : entry.ethnic;
                forbidden.add(normalizeLookupKey(polysemyVal));
            }
        }
    }

    const candidates: Array<{ text: string; key: string; score: number }> = [];
    const seenCandidateKeys = new Set<string>();
    const candidatePool = vocab.length > 250 ? sampleRandomItems(vocab, 90) : shuffleArray(vocab);

    for (const entry of candidatePool) {
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
    const ethnicTargets = new Map<string, Set<string>[]>();
    const vietTargets = new Map<string, Set<string>[]>();
    const ethnicLens = new Set<number>();
    const vietLens = new Set<number>();

    const selected: Array<{
        item: GameWordPair;
        resolvedDirection: GameDirection;
        questionText: string;
        correctText: string;
        forbidden: Set<string>;
    }> = [];

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
        const headKey = normalizeLookupKey(questionText);
        const forbidden = new Set<string>([normalizeLookupKey(correctText)]);

        if (resolvedDirection === 'ethnic_to_viet') {
            ethnicLens.add(questionText.length);
            let list = ethnicTargets.get(headKey);
            if (!list) {
                list = [];
                ethnicTargets.set(headKey, list);
            }
            list.push(forbidden);
        } else {
            vietLens.add(questionText.length);
            let list = vietTargets.get(headKey);
            if (!list) {
                list = [];
                vietTargets.set(headKey, list);
            }
            list.push(forbidden);
        }

        selected.push({ item, resolvedDirection, questionText, correctText, forbidden });
    }

    const checkEthnic = ethnicTargets.size > 0;
    const checkViet = vietTargets.size > 0;
    for (let i = 0; i < vocab.length; i++) {
        const entry = vocab[i];
        if (checkEthnic && ethnicLens.has(entry.ethnic.length)) {
            const matched = ethnicTargets.get(entry.ethnic.toLowerCase());
            if (matched) {
                const val = entry.viet.toLowerCase();
                for (let k = 0; k < matched.length; k++) {
                    matched[k].add(val);
                }
            }
        }
        if (checkViet && vietLens.has(entry.viet.length)) {
            const matched = vietTargets.get(entry.viet.toLowerCase());
            if (matched) {
                const val = entry.ethnic.toLowerCase();
                for (let k = 0; k < matched.length; k++) {
                    matched[k].add(val);
                }
            }
        }
    }

    const questions: GameQuestion[] = [];
    for (let i = 0; i < selected.length; i++) {
        const entry = selected[i];
        questions.push({
            id: `lvl${level}_q${i}`,
            question: entry.questionText,
            correct: entry.correctText,
            wrongs: pickWrongAnswers(vocab, entry.item, 3, entry.resolvedDirection, entry.forbidden),
            topic: entry.item.topic || 'Chung',
            level,
            driveId: entry.item.driveId,
            pronunciation: entry.item.pronunciation,
            direction: entry.resolvedDirection
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
