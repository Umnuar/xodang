/**
 * Legacy search function extracted verbatim from index.html (lines 1298 - 1354).
 * Used for golden tests to guarantee zero behavior change during refactoring.
 */

export interface LegacyDictionaryEntry {
    viet: string;
    ethnic: string;
    pronunciation?: string;
    driveId?: string;
    exampleViet?: string;
    exampleEthnic?: string;
    matchType?: string;
    score?: number;
}

export function legacySmartSearch(
    term: string,
    direction: 'viet_to_ethnic' | 'ethnic_to_viet',
    dictionary: LegacyDictionaryEntry[]
): LegacyDictionaryEntry[] {
    const rawKeyword = term.toLowerCase().trim();
    const isVietToEthnic = direction === 'viet_to_ethnic';
    
    if (!rawKeyword || rawKeyword.length === 0) {
        return [];
    }
    
    // Tạo regex để tìm từ chính xác
    const safeKeyword = rawKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const strictRegex = new RegExp(`(^|[^a-zA-Z0-9À-ỹ])${safeKeyword}([^a-zA-Z0-9À-ỹ]|$)`, 'i');
    
    // Tìm từ chính xác
    let exactMatches: LegacyDictionaryEntry[] = [];
    
    if (isVietToEthnic) {
        exactMatches = dictionary.filter(item => {
            return item.viet && strictRegex.test(item.viet);
        });
    } else {
        exactMatches = dictionary.filter(item => {
            return item.ethnic && strictRegex.test(item.ethnic);
        });
    }
    
    // Chỉ trả về từ chính xác
    const finalResults = exactMatches.map(item => ({
        ...item,
        matchType: 'exact',
        score: 20
    }));
    
    // Loại bỏ trùng lặp
    const uniqueMap = new Map<string, LegacyDictionaryEntry>();
    finalResults.forEach(item => {
        const key = `${item.viet}|${item.ethnic}`;
        const existing = uniqueMap.get(key);
        if (!existing || (item.score ?? 0) > (existing.score ?? 0)) {
            uniqueMap.set(key, item);
        }
    });
    
    // Chuyển map thành mảng và sắp xếp
    const displayList = Array.from(uniqueMap.values());
    
    // Sắp xếp
    displayList.sort((a, b) => {
        const wordA = isVietToEthnic ? a.viet : a.ethnic;
        const wordB = isVietToEthnic ? b.viet : b.ethnic;
        
        if (wordA.toLowerCase() === rawKeyword && wordB.toLowerCase() !== rawKeyword) return -1;
        if (wordB.toLowerCase() === rawKeyword && wordA.toLowerCase() !== rawKeyword) return 1;
        
        return wordA.length - wordB.length;
    });
    
    return displayList.slice(0, 50);
}
