export type SearchDirection = 'viet_to_ethnic' | 'ethnic_to_viet';
export type EntryKind = 'word' | 'phrase';

export interface DictionaryEntry {
    viet: string;
    ethnic: string;
    pronunciation?: string;
    driveId?: string;
    exampleViet?: string;
    exampleEthnic?: string;
    matchType?: string;
    score?: number;
    kind?: EntryKind;
}

export interface SearchPaginationOptions {
    offset?: number;
    limit?: number;
}

export interface PaginatedSearchResult {
    entries: DictionaryEntry[];
    total: number;
    hasMore: boolean;
    nextOffset: number;
}

interface IndexedDictionaryEntry {
    entry: DictionaryEntry;
    kind: EntryKind;
    vietNfc: string;
    ethnicNfc: string;
    vietLower: string;
    ethnicLower: string;
    vietFolded: string;
    ethnicFolded: string;
}

interface DictionaryIndex {
    sourceLength: number;
    items: IndexedDictionaryEntry[];
    vietOrderedIndices: number[];
    ethnicOrderedIndices: number[];
    vietExactPostings: Map<string, number[]>;
    vietFoldedPostings: Map<string, number[]>;
    ethnicExactPostings: Map<string, number[]>;
    ethnicFoldedPostings: Map<string, number[]>;
    vietExactFull: Map<string, number[]>;
    vietFoldedFull: Map<string, number[]>;
    ethnicExactFull: Map<string, number[]>;
    ethnicFoldedFull: Map<string, number[]>;
    vietPrefixes: Map<string, number[]>;
    ethnicPrefixes: Map<string, number[]>;
}

const TOKEN_EXTRACT_REGEX = /[\p{L}\p{N}\p{M}]+/gu;
const SINGLE_TOKEN_REGEX = /^[\p{L}\p{N}\p{M}]+$/u;
const WORD_CHAR_REGEX = /[\p{L}\p{N}\p{M}]/u;
const dictionaryIndexCache = new WeakMap<DictionaryEntry[], DictionaryIndex>();

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

export function classifyEntryKind(viet: string, ethnic: string): EntryKind {
    const cleanViet = normalizeUnicodeNFC(viet).replace(/\([^)]*\)/g, ' ').trim();
    const cleanEthnic = normalizeUnicodeNFC(ethnic).replace(/\([^)]*\)/g, ' ').trim();
    if (/[,;?!]/.test(cleanViet)) {
        return 'phrase';
    }
    const vietTokens = cleanViet ? cleanViet.split(/\s+/).filter(Boolean).length : 0;
    const ethnicTokens = cleanEthnic ? cleanEthnic.split(/\s+/).filter(Boolean).length : 0;
    if (vietTokens <= 2 && ethnicTokens <= 2) {
        return 'word';
    }
    return 'phrase';
}

function extractTokens(text: string): string[] {
    const matches = text.match(TOKEN_EXTRACT_REGEX);
    return matches ? matches : [];
}

export function extractFoldedTokens(str: string): string[] {
    return extractTokens(stripDiacritics(str).toLowerCase());
}

function addPosting(map: Map<string, number[]>, key: string, rank: number): void {
    const bucket = map.get(key);
    if (bucket) {
        bucket.push(rank);
    } else {
        map.set(key, [rank]);
    }
}

function addUniqueTokensToPostings(map: Map<string, number[]>, text: string, rank: number): void {
    const tokens = extractTokens(text);
    if (tokens.length === 0) return;
    if (tokens.length === 1) {
        addPosting(map, tokens[0], rank);
        return;
    }
    const seen = new Set<string>();
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (seen.has(token)) continue;
        seen.add(token);
        addPosting(map, token, rank);
    }
}

function addFieldPrefixes(map: Map<string, number[]>, foldedField: string, itemIdx: number): void {
    const maxLen = Math.min(3, foldedField.length);
    for (let len = 1; len <= maxLen; len++) {
        addPosting(map, foldedField.slice(0, len), itemIdx);
    }
}

function getDictionaryIndex(dictionary: DictionaryEntry[]): DictionaryIndex {
    const cached = dictionaryIndexCache.get(dictionary);
    if (cached && cached.sourceLength === dictionary.length) {
        return cached;
    }

    const items: IndexedDictionaryEntry[] = [];
    const seenDedupKeys = new Set<string>();

    for (let i = 0; i < dictionary.length; i++) {
        const entry = dictionary[i];
        const vietNfc = normalizeUnicodeNFC(entry.viet).trim();
        const ethnicNfc = normalizeUnicodeNFC(entry.ethnic).trim();
        const dedupKey = `${vietNfc}|${ethnicNfc}`;
        if (seenDedupKeys.has(dedupKey)) {
            continue;
        }
        seenDedupKeys.add(dedupKey);

        const vietLower = vietNfc.toLowerCase();
        const ethnicLower = ethnicNfc.toLowerCase();
        const vietFolded = stripDiacritics(vietNfc).toLowerCase();
        const ethnicFolded = stripDiacritics(ethnicNfc).toLowerCase();
        const kind = entry.kind || classifyEntryKind(vietNfc, ethnicNfc);

        items.push({
            entry,
            kind,
            vietNfc,
            ethnicNfc,
            vietLower,
            ethnicLower,
            vietFolded,
            ethnicFolded
        });
    }

    const vietOrderedIndices = items.map((_, i) => i);
    vietOrderedIndices.sort((a, b) => {
        const itemA = items[a];
        const itemB = items[b];
        if (itemA.kind !== itemB.kind) {
            return itemA.kind === 'word' ? -1 : 1;
        }
        if (itemA.vietLower.length !== itemB.vietLower.length) {
            return itemA.vietLower.length - itemB.vietLower.length;
        }
        return a - b;
    });

    const ethnicOrderedIndices = items.map((_, i) => i);
    ethnicOrderedIndices.sort((a, b) => {
        const itemA = items[a];
        const itemB = items[b];
        if (itemA.kind !== itemB.kind) {
            return itemA.kind === 'word' ? -1 : 1;
        }
        if (itemA.ethnicLower.length !== itemB.ethnicLower.length) {
            return itemA.ethnicLower.length - itemB.ethnicLower.length;
        }
        return a - b;
    });

    const vietExactPostings = new Map<string, number[]>();
    const vietFoldedPostings = new Map<string, number[]>();
    const ethnicExactPostings = new Map<string, number[]>();
    const ethnicFoldedPostings = new Map<string, number[]>();
    const vietExactFull = new Map<string, number[]>();
    const vietFoldedFull = new Map<string, number[]>();
    const ethnicExactFull = new Map<string, number[]>();
    const ethnicFoldedFull = new Map<string, number[]>();
    const vietPrefixes = new Map<string, number[]>();
    const ethnicPrefixes = new Map<string, number[]>();

    for (let rank = 0; rank < vietOrderedIndices.length; rank++) {
        const item = items[vietOrderedIndices[rank]];
        if (item.vietLower) {
            addUniqueTokensToPostings(vietExactPostings, item.vietLower, rank);
            addPosting(vietExactFull, item.vietLower, rank);
        }
        if (item.vietFolded) {
            addUniqueTokensToPostings(vietFoldedPostings, item.vietFolded, rank);
            addPosting(vietFoldedFull, item.vietFolded, rank);
        }
    }

    for (let rank = 0; rank < ethnicOrderedIndices.length; rank++) {
        const item = items[ethnicOrderedIndices[rank]];
        if (item.ethnicLower) {
            addUniqueTokensToPostings(ethnicExactPostings, item.ethnicLower, rank);
            addPosting(ethnicExactFull, item.ethnicLower, rank);
        }
        if (item.ethnicFolded) {
            addUniqueTokensToPostings(ethnicFoldedPostings, item.ethnicFolded, rank);
            addPosting(ethnicFoldedFull, item.ethnicFolded, rank);
        }
    }

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.vietFolded) {
            addFieldPrefixes(vietPrefixes, item.vietFolded, i);
        }
        if (item.ethnicFolded) {
            addFieldPrefixes(ethnicPrefixes, item.ethnicFolded, i);
        }
    }

    const index: DictionaryIndex = {
        sourceLength: dictionary.length,
        items,
        vietOrderedIndices,
        ethnicOrderedIndices,
        vietExactPostings,
        vietFoldedPostings,
        ethnicExactPostings,
        ethnicFoldedPostings,
        vietExactFull,
        vietFoldedFull,
        ethnicExactFull,
        ethnicFoldedFull,
        vietPrefixes,
        ethnicPrefixes
    };
    dictionaryIndexCache.set(dictionary, index);
    return index;
}

export function warmDictionaryIndex(dictionary: DictionaryEntry[]): void {
    getDictionaryIndex(dictionary);
}

function binarySearchContains(sorted: number[], target: number): boolean {
    let lo = 0;
    let hi = sorted.length - 1;
    while (lo <= hi) {
        const mid = (lo + hi) >>> 1;
        const val = sorted[mid];
        if (val === target) return true;
        if (val < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return false;
}

function intersectSortedPair(a: number[], b: number[]): number[] {
    if (a.length === 0 || b.length === 0) return [];
    if (b.length > a.length * 12) {
        const result: number[] = [];
        for (let i = 0; i < a.length; i++) {
            if (binarySearchContains(b, a[i])) {
                result.push(a[i]);
            }
        }
        return result;
    }
    const result: number[] = [];
    let i = 0;
    let j = 0;
    while (i < a.length && j < b.length) {
        const va = a[i];
        const vb = b[j];
        if (va === vb) {
            result.push(va);
            i++;
            j++;
        } else if (va < vb) {
            i++;
        } else {
            j++;
        }
    }
    return result;
}

function intersectSortedPostings(
    postingsMap: Map<string, number[]>,
    tokens: string[]
): number[] | null {
    if (tokens.length === 0) return null;

    const lists: number[][] = [];
    const seenTokens = new Set<string>();
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (seenTokens.has(token)) continue;
        seenTokens.add(token);
        const list = postingsMap.get(token);
        if (!list || list.length === 0) {
            return [];
        }
        lists.push(list);
    }

    if (lists.length === 1) {
        return lists[0];
    }

    lists.sort((a, b) => a.length - b.length);
    let current = lists[0];
    for (let i = 1; i < lists.length; i++) {
        current = intersectSortedPair(current, lists[i]);
        if (current.length === 0) {
            return [];
        }
    }
    return current;
}

function isWordBoundaryChar(text: string, index: number): boolean {
    const code = text.charCodeAt(index);
    if (code <= 127) {
        return (code >= 48 && code <= 57) || (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
    }
    return WORD_CHAR_REGEX.test(text[index]);
}

function hasBoundaryMatch(haystack: string, needle: string): boolean {
    const needleLen = needle.length;
    if (needleLen === 0 || haystack.length < needleLen) return false;
    let pos = haystack.indexOf(needle);
    while (pos !== -1) {
        const leftOk = pos === 0 || !isWordBoundaryChar(haystack, pos - 1);
        if (leftOk) {
            const end = pos + needleLen;
            if (end === haystack.length || !isWordBoundaryChar(haystack, end)) {
                return true;
            }
        }
        pos = haystack.indexOf(needle, pos + 1);
    }
    return false;
}

function sliceRankedRanks(
    items: IndexedDictionaryEntry[],
    orderedIndices: number[],
    fullRanks: number[] | undefined,
    matchedRanks: number[],
    offset: number,
    limit: number,
    matchType: 'exact' | 'accent_insensitive',
    score: number,
    verifyPromoted: boolean
): PaginatedSearchResult {
    const total = matchedRanks.length;
    if (total === 0 || offset >= total) {
        return {
            entries: [],
            total,
            hasMore: false,
            nextOffset: Math.min(offset, total)
        };
    }

    let promoted: number[] = [];
    let promotedSet: Set<number> | null = null;

    if (fullRanks && fullRanks.length > 0) {
        if (!verifyPromoted) {
            promoted = fullRanks;
        } else {
            promoted = [];
            for (let i = 0; i < fullRanks.length; i++) {
                if (binarySearchContains(matchedRanks, fullRanks[i])) {
                    promoted.push(fullRanks[i]);
                }
            }
        }
        if (promoted.length > 0) {
            promotedSet = new Set(promoted);
        }
    }

    const entries: DictionaryEntry[] = [];
    let cursor = 0;

    for (let i = 0; i < promoted.length && entries.length < limit; i++) {
        if (cursor >= offset) {
            const item = items[orderedIndices[promoted[i]]];
            entries.push({
                ...item.entry,
                kind: item.kind,
                matchType,
                score
            });
        }
        cursor++;
    }

    for (let i = 0; i < matchedRanks.length && entries.length < limit; i++) {
        const rank = matchedRanks[i];
        if (promotedSet && promotedSet.has(rank)) {
            continue;
        }
        if (cursor >= offset) {
            const item = items[orderedIndices[rank]];
            entries.push({
                ...item.entry,
                kind: item.kind,
                matchType,
                score
            });
        }
        cursor++;
    }

    const nextOffset = offset + entries.length;
    return {
        entries,
        total,
        hasMore: nextOffset < total,
        nextOffset
    };
}

function runPaginatedSearch(
    term: string,
    direction: SearchDirection,
    dictionary: DictionaryEntry[],
    offset: number,
    limit: number
): PaginatedSearchResult {
    const rawKeyword = normalizeUnicodeNFC(term).toLowerCase().trim();
    if (!rawKeyword || rawKeyword.length > 100) {
        return { entries: [], total: 0, hasMore: false, nextOffset: 0 };
    }

    const index = getDictionaryIndex(dictionary);
    const isVietToEthnic = direction === 'viet_to_ethnic';
    const orderedIndices = isVietToEthnic ? index.vietOrderedIndices : index.ethnicOrderedIndices;
    const exactPostings = isVietToEthnic ? index.vietExactPostings : index.ethnicExactPostings;
    const foldedPostings = isVietToEthnic ? index.vietFoldedPostings : index.ethnicFoldedPostings;
    const exactFull = isVietToEthnic ? index.vietExactFull : index.ethnicExactFull;
    const foldedFull = isVietToEthnic ? index.vietFoldedFull : index.ethnicFoldedFull;

    if (SINGLE_TOKEN_REGEX.test(rawKeyword)) {
        const exactList = exactPostings.get(rawKeyword);
        if (exactList && exactList.length > 0) {
            return sliceRankedRanks(
                index.items,
                orderedIndices,
                exactFull.get(rawKeyword),
                exactList,
                offset,
                limit,
                'exact',
                20,
                false
            );
        }
        const foldedKeyword = stripDiacritics(rawKeyword).trim();
        const foldedList = foldedKeyword ? foldedPostings.get(foldedKeyword) : undefined;
        if (foldedList && foldedList.length > 0) {
            return sliceRankedRanks(
                index.items,
                orderedIndices,
                foldedFull.get(foldedKeyword),
                foldedList,
                offset,
                limit,
                'accent_insensitive',
                10,
                false
            );
        }
        return { entries: [], total: 0, hasMore: false, nextOffset: 0 };
    }

    const exactTokens = extractTokens(rawKeyword);
    const exactCandidates = intersectSortedPostings(exactPostings, exactTokens);
    const exactMatched: number[] = [];

    if (exactCandidates === null) {
        for (let rank = 0; rank < orderedIndices.length; rank++) {
            const item = index.items[orderedIndices[rank]];
            const field = isVietToEthnic ? item.vietLower : item.ethnicLower;
            if (hasBoundaryMatch(field, rawKeyword)) {
                exactMatched.push(rank);
            }
        }
    } else if (exactCandidates.length > 0) {
        for (let i = 0; i < exactCandidates.length; i++) {
            const rank = exactCandidates[i];
            const item = index.items[orderedIndices[rank]];
            const field = isVietToEthnic ? item.vietLower : item.ethnicLower;
            if (hasBoundaryMatch(field, rawKeyword)) {
                exactMatched.push(rank);
            }
        }
    }

    if (exactMatched.length > 0) {
        return sliceRankedRanks(
            index.items,
            orderedIndices,
            exactFull.get(rawKeyword),
            exactMatched,
            offset,
            limit,
            'exact',
            20,
            true
        );
    }

    const foldedKeyword = stripDiacritics(rawKeyword).trim();
    if (!foldedKeyword) {
        return { entries: [], total: 0, hasMore: false, nextOffset: 0 };
    }

    const foldedTokens = extractTokens(foldedKeyword);
    const foldedCandidates = intersectSortedPostings(foldedPostings, foldedTokens);
    const foldedMatched: number[] = [];

    if (foldedCandidates === null) {
        for (let rank = 0; rank < orderedIndices.length; rank++) {
            const item = index.items[orderedIndices[rank]];
            const field = isVietToEthnic ? item.vietFolded : item.ethnicFolded;
            if (hasBoundaryMatch(field, foldedKeyword)) {
                foldedMatched.push(rank);
            }
        }
    } else if (foldedCandidates.length > 0) {
        for (let i = 0; i < foldedCandidates.length; i++) {
            const rank = foldedCandidates[i];
            const item = index.items[orderedIndices[rank]];
            const field = isVietToEthnic ? item.vietFolded : item.ethnicFolded;
            if (hasBoundaryMatch(field, foldedKeyword)) {
                foldedMatched.push(rank);
            }
        }
    }

    if (foldedMatched.length === 0) {
        return { entries: [], total: 0, hasMore: false, nextOffset: 0 };
    }

    return sliceRankedRanks(
        index.items,
        orderedIndices,
        foldedFull.get(foldedKeyword),
        foldedMatched,
        offset,
        limit,
        'accent_insensitive',
        10,
        true
    );
}

export function searchDictionaryPaginated(
    term: string,
    direction: SearchDirection,
    dictionary: DictionaryEntry[],
    options: SearchPaginationOptions = {}
): PaginatedSearchResult {
    const limit = Math.max(1, options.limit ?? 30);
    const offset = Math.max(0, options.offset ?? 0);
    return runPaginatedSearch(term, direction, dictionary, offset, limit);
}

export function searchDictionary(
    term: string,
    direction: SearchDirection,
    dictionary: DictionaryEntry[]
): DictionaryEntry[] {
    return runPaginatedSearch(term, direction, dictionary, 0, 50).entries;
}

export function getSuggestions(
    term: string,
    direction: SearchDirection,
    dictionary: DictionaryEntry[],
    maxResults: number = 8
): string[] {
    const raw = normalizeUnicodeNFC(term).toLowerCase().trim();
    if (!raw || raw.length > 100 || maxResults <= 0) return [];

    const isVietToEthnic = direction === 'viet_to_ethnic';
    const index = getDictionaryIndex(dictionary);
    const folded = stripDiacritics(raw).trim();
    const prefixMap = isVietToEthnic ? index.vietPrefixes : index.ethnicPrefixes;

    let candidateIndices: number[];
    if (folded.length > 0) {
        candidateIndices = prefixMap.get(folded.slice(0, Math.min(3, folded.length))) || [];
    } else {
        candidateIndices = index.items.map((_, i) => i);
    }

    if (candidateIndices.length === 0) {
        return [];
    }

    const suggestions: string[] = [];
    const seen = new Set<string>();

    const addSuggestion = (display: string): boolean => {
        const key = display.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        suggestions.push(display);
        return suggestions.length >= maxResults;
    };

    for (let i = 0; i < candidateIndices.length; i++) {
        const item = index.items[candidateIndices[i]];
        const display = isVietToEthnic ? item.vietNfc : item.ethnicNfc;
        const lower = isVietToEthnic ? item.vietLower : item.ethnicLower;
        if (display && lower.startsWith(raw)) {
            if (addSuggestion(display)) return suggestions;
        }
    }

    if (folded) {
        for (let i = 0; i < candidateIndices.length; i++) {
            const item = index.items[candidateIndices[i]];
            const display = isVietToEthnic ? item.vietNfc : item.ethnicNfc;
            const foldedTarget = isVietToEthnic ? item.vietFolded : item.ethnicFolded;
            if (display && foldedTarget.startsWith(folded)) {
                if (addSuggestion(display)) break;
            }
        }
    }

    return suggestions;
}
