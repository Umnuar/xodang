export type SearchDirection = 'viet_to_ethnic' | 'ethnic_to_viet';

export interface DictionaryEntry {
    viet: string;
    ethnic: string;
    pronunciation?: string;
    driveId?: string;
    exampleViet?: string;
    exampleEthnic?: string;
    matchType?: string;
    score?: number;
}

interface IndexedDictionaryEntry {
    entry: DictionaryEntry;
    vietNfc: string;
    ethnicNfc: string;
    vietLower: string;
    ethnicLower: string;
    vietFolded: string;
    ethnicFolded: string;
}

const dictionaryIndexCache = new WeakMap<DictionaryEntry[], IndexedDictionaryEntry[]>();

export function normalizeUnicodeNFC(str: string): string {
    return (str || '').normalize('NFC');
}

export function stripDiacritics(str: string): string {
    return normalizeUnicodeNFC(str)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
}

function getIndexedDictionary(dictionary: DictionaryEntry[]): IndexedDictionaryEntry[] {
    const cached = dictionaryIndexCache.get(dictionary);
    if (cached && cached.length === dictionary.length) {
        return cached;
    }

    const indexed = dictionary.map((entry) => {
        const vietNfc = normalizeUnicodeNFC(entry.viet).trim();
        const ethnicNfc = normalizeUnicodeNFC(entry.ethnic).trim();
        return {
            entry,
            vietNfc,
            ethnicNfc,
            vietLower: vietNfc.toLowerCase(),
            ethnicLower: ethnicNfc.toLowerCase(),
            vietFolded: stripDiacritics(vietNfc).toLowerCase(),
            ethnicFolded: stripDiacritics(ethnicNfc).toLowerCase()
        };
    });

    dictionaryIndexCache.set(dictionary, indexed);
    return indexed;
}

function buildBoundaryRegex(keyword: string): RegExp | null {
    try {
        const safeKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`(^|[^\\p{L}\\p{N}\\p{M}])${safeKeyword}([^\\p{L}\\p{N}\\p{M}]|$)`, 'iu');
    } catch {
        return null;
    }
}

export function searchDictionary(
    term: string,
    direction: SearchDirection,
    dictionary: DictionaryEntry[]
): DictionaryEntry[] {
    const rawKeyword = normalizeUnicodeNFC(term).toLowerCase().trim();
    const isVietToEthnic = direction === 'viet_to_ethnic';

    if (!rawKeyword || rawKeyword.length === 0 || rawKeyword.length > 100) {
        return [];
    }

    const strictRegex = buildBoundaryRegex(rawKeyword);
    if (!strictRegex) {
        return [];
    }

    const indexed = getIndexedDictionary(dictionary);
    const exactMatches = indexed.filter((item) => {
        const field = isVietToEthnic ? item.vietNfc : item.ethnicNfc;
        return field.length > 0 && strictRegex.test(field);
    });

    let matchedEntries: DictionaryEntry[];
    let sortTargetKeyword = rawKeyword;
    let useFoldedSort = false;

    if (exactMatches.length > 0) {
        matchedEntries = exactMatches.map((item) => ({
            ...item.entry,
            matchType: 'exact',
            score: 20
        }));
    } else {
        const foldedKeyword = stripDiacritics(rawKeyword).trim();
        const foldedRegex = foldedKeyword ? buildBoundaryRegex(foldedKeyword) : null;
        if (!foldedRegex) {
            return [];
        }
        const foldedMatches = indexed.filter((item) => {
            const field = isVietToEthnic ? item.vietFolded : item.ethnicFolded;
            return field.length > 0 && foldedRegex.test(field);
        });
        matchedEntries = foldedMatches.map((item) => ({
            ...item.entry,
            matchType: 'accent_insensitive',
            score: 10
        }));
        sortTargetKeyword = foldedKeyword;
        useFoldedSort = true;
    }

    const uniqueMap = new Map<string, DictionaryEntry>();
    matchedEntries.forEach((item) => {
        const key = `${normalizeUnicodeNFC(item.viet)}|${normalizeUnicodeNFC(item.ethnic)}`;
        const existing = uniqueMap.get(key);
        if (!existing || (item.score ?? 0) > (existing.score ?? 0)) {
            uniqueMap.set(key, item);
        }
    });

    const displayList = Array.from(uniqueMap.values());

    displayList.sort((a, b) => {
        const rawA = normalizeUnicodeNFC(isVietToEthnic ? a.viet : a.ethnic).toLowerCase();
        const rawB = normalizeUnicodeNFC(isVietToEthnic ? b.viet : b.ethnic).toLowerCase();
        const wordA = useFoldedSort ? stripDiacritics(rawA) : rawA;
        const wordB = useFoldedSort ? stripDiacritics(rawB) : rawB;

        if (wordA === sortTargetKeyword && wordB !== sortTargetKeyword) return -1;
        if (wordB === sortTargetKeyword && wordA !== sortTargetKeyword) return 1;

        return rawA.length - rawB.length;
    });

    return displayList.slice(0, 50);
}

export function getSuggestions(
    term: string,
    direction: SearchDirection,
    dictionary: DictionaryEntry[],
    maxResults: number = 8
): string[] {
    const raw = normalizeUnicodeNFC(term).toLowerCase().trim();
    if (!raw || raw.length > 100) return [];

    const isVietToEthnic = direction === 'viet_to_ethnic';
    const indexed = getIndexedDictionary(dictionary);
    const suggestions: string[] = [];
    const seen = new Set<string>();

    const addSuggestion = (display: string): boolean => {
        const key = display.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        suggestions.push(display);
        return suggestions.length >= maxResults;
    };

    for (const item of indexed) {
        const display = isVietToEthnic ? item.vietNfc : item.ethnicNfc;
        const lower = isVietToEthnic ? item.vietLower : item.ethnicLower;
        if (display && lower.startsWith(raw)) {
            if (addSuggestion(display)) return suggestions;
        }
    }

    const folded = stripDiacritics(raw).trim();
    if (folded) {
        for (const item of indexed) {
            const display = isVietToEthnic ? item.vietNfc : item.ethnicNfc;
            const foldedTarget = isVietToEthnic ? item.vietFolded : item.ethnicFolded;
            if (display && foldedTarget.startsWith(folded)) {
                if (addSuggestion(display)) break;
            }
        }
    }

    return suggestions;
}
