/**
 * Dictionary Service
 * Provides Unicode NFC normalization, dictionary search, and autocomplete logic.
 */

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

/**
 * Normalizes input string to Unicode NFC format.
 * Critical for Vietnamese and Sedang diacritics consistency.
 */
export function normalizeUnicodeNFC(str: string): string {
    return (str || '').normalize('NFC');
}

/**
 * Searches the dictionary for entries matching the given term and direction.
 * Matches legacy search behavior exactly (strict word boundary regex, exact matching).
 */
export function searchDictionary(
    term: string,
    direction: SearchDirection,
    dictionary: DictionaryEntry[]
): DictionaryEntry[] {
    const rawKeyword = normalizeUnicodeNFC(term).toLowerCase().trim();
    const isVietToEthnic = direction === 'viet_to_ethnic';
    
    if (!rawKeyword || rawKeyword.length === 0) {
        return [];
    }
    
    // Tạo regex an toàn để tìm từ chính xác
    const safeKeyword = rawKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const strictRegex = new RegExp(`(^|[^a-zA-Z0-9À-ỹ])${safeKeyword}([^a-zA-Z0-9À-ỹ]|$)`, 'i');
    
    let exactMatches: DictionaryEntry[] = [];
    
    if (isVietToEthnic) {
        exactMatches = dictionary.filter(item => {
            if (!item.viet) return false;
            const norm = normalizeUnicodeNFC(item.viet);
            return strictRegex.test(norm);
        });
    } else {
        exactMatches = dictionary.filter(item => {
            if (!item.ethnic) return false;
            const norm = normalizeUnicodeNFC(item.ethnic);
            return strictRegex.test(norm);
        });
    }
    
    const finalResults = exactMatches.map(item => ({
        ...item,
        matchType: 'exact',
        score: 20
    }));
    
    // Loại bỏ trùng lặp theo key "viet|ethnic"
    const uniqueMap = new Map<string, DictionaryEntry>();
    finalResults.forEach(item => {
        const key = `${normalizeUnicodeNFC(item.viet)}|${normalizeUnicodeNFC(item.ethnic)}`;
        const existing = uniqueMap.get(key);
        if (!existing || (item.score ?? 0) > (existing.score ?? 0)) {
            uniqueMap.set(key, item);
        }
    });
    
    const displayList = Array.from(uniqueMap.values());
    
    // Sắp xếp: khớp chính xác 100% lên đầu, sau đó theo độ dài ngắn hơn
    displayList.sort((a, b) => {
        const wordA = normalizeUnicodeNFC(isVietToEthnic ? a.viet : a.ethnic).toLowerCase();
        const wordB = normalizeUnicodeNFC(isVietToEthnic ? b.viet : b.ethnic).toLowerCase();
        
        if (wordA === rawKeyword && wordB !== rawKeyword) return -1;
        if (wordB === rawKeyword && wordA !== rawKeyword) return 1;
        
        return wordA.length - wordB.length;
    });
    
    return displayList.slice(0, 50);
}

/**
 * Returns autocomplete suggestion list for input.
 */
export function getSuggestions(
    term: string,
    direction: SearchDirection,
    dictionary: DictionaryEntry[],
    maxResults: number = 8
): string[] {
    const raw = normalizeUnicodeNFC(term).toLowerCase().trim();
    if (!raw) return [];
    
    const isVietToEthnic = direction === 'viet_to_ethnic';
    const suggestions = new Set<string>();
    
    for (const item of dictionary) {
        const target = normalizeUnicodeNFC(isVietToEthnic ? item.viet : item.ethnic).trim();
        if (target.toLowerCase().startsWith(raw)) {
            suggestions.add(target);
            if (suggestions.size >= maxResults) break;
        }
    }
    
    return Array.from(suggestions);
}
