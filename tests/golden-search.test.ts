import { describe, it, expect } from 'vitest';
import { legacySmartSearch, type LegacyDictionaryEntry } from './legacy/legacy-search';
import { searchDictionary, type DictionaryEntry } from '@/renderer/services/dictionary.service';

// 500-entry realistic sample dataset
function generateSampleDictionary(): DictionaryEntry[] {
    const baseWords = [
        { viet: 'xin chào', ethnic: 'bơ rơ ha', pronunciation: 'bơ-rơ-ha' },
        { viet: 'cảm ơn', ethnic: 'hơ măn ơn', pronunciation: 'hơ-măn-ơn' },
        { viet: 'tạm biệt', ethnic: 'brơi', pronunciation: 'brơi' },
        { viet: 'nhà', ethnic: 'hnam', pronunciation: 'h-nam' },
        { viet: 'nước', ethnic: 'đak', pronunciation: 'đak' },
        { viet: 'cơm', ethnic: 'pơ ro', pronunciation: 'pơ-ro' },
        { viet: 'bố', ethnic: 'mê', pronunciation: 'mê' },
        { viet: 'mẹ', ethnic: 'mẹ', pronunciation: 'mẹ' },
        { viet: 'anh em', ethnic: 'nhô ma', pronunciation: 'nhô-ma' },
        { viet: 'núi', ethnic: 'kông', pronunciation: 'kông' },
        { viet: 'rừng', ethnic: 'bri', pronunciation: 'bri' },
        { viet: 'mặt trời', ethnic: 'măt hơ ri', pronunciation: 'măt-hơ-ri' },
        { viet: 'mặt trăng', ethnic: 'khế', pronunciation: 'khế' },
        { viet: 'ngôi sao', ethnic: 'sơ măng', pronunciation: 'sơ-măng' },
        { viet: 'con bò', ethnic: 'rơ pu', pronunciation: 'rơ-pu' },
        { viet: 'con trâu', ethnic: 'kơ pau', pronunciation: 'kơ-pau' },
        { viet: 'con chim', ethnic: 'chêm', pronunciation: 'chêm' },
        { viet: 'con cá', ethnic: 'ka', pronunciation: 'ka' },
        { viet: 'cây', ethnic: 'long', pronunciation: 'long' },
        { viet: 'lá', ethnic: 'hla', pronunciation: 'hla' }
    ];

    const entries: DictionaryEntry[] = [];
    for (let i = 0; i < 25; i++) {
        for (const bw of baseWords) {
            const suffix = i === 0 ? '' : ` ${i}`;
            entries.push({
                viet: `${bw.viet}${suffix}`,
                ethnic: `${bw.ethnic}${suffix}`,
                pronunciation: bw.pronunciation,
                driveId: `audio_${entries.length + 1}`
            });
        }
    }
    return entries;
}

describe('Golden Test: legacySmartSearch vs searchDictionary', () => {
    const dictionary = generateSampleDictionary();

    it('dataset has 500 entries', () => {
        expect(dictionary.length).toBe(500);
    });

    const testQueries = [
        { term: 'xin chào', dir: 'viet_to_ethnic' as const },
        { term: 'cảm ơn', dir: 'viet_to_ethnic' as const },
        { term: 'nhà', dir: 'viet_to_ethnic' as const },
        { term: 'bơ rơ ha', dir: 'ethnic_to_viet' as const },
        { term: 'brơi', dir: 'ethnic_to_viet' as const },
        { term: 'đak', dir: 'ethnic_to_viet' as const },
        { term: 'con bò', dir: 'viet_to_ethnic' as const },
        { term: 'kông', dir: 'ethnic_to_viet' as const },
        { term: 'mặt trời', dir: 'viet_to_ethnic' as const },
        { term: 'nonexistent', dir: 'viet_to_ethnic' as const },
        { term: '', dir: 'viet_to_ethnic' as const },
        { term: '   ', dir: 'ethnic_to_viet' as const }
    ];

    testQueries.forEach(({ term, dir }) => {
        it(`returns identical results for query "${term}" (${dir})`, () => {
            const legacyResults = legacySmartSearch(term, dir, dictionary as LegacyDictionaryEntry[]);
            const newResults = searchDictionary(term, dir, dictionary);

            expect(newResults.length).toBe(legacyResults.length);

            // Verify each item matches
            for (let i = 0; i < newResults.length; i++) {
                expect(newResults[i].viet).toBe(legacyResults[i].viet);
                expect(newResults[i].ethnic).toBe(legacyResults[i].ethnic);
                expect(newResults[i].matchType).toBe(legacyResults[i].matchType);
                expect(newResults[i].score).toBe(legacyResults[i].score);
            }
        });
    });

    it('CODE-08: safely handles long queries without throwing SyntaxError or crashing (ReDoS guard)', () => {
        // Test with 150 characters (exceeds max length 100)
        const longQuery = 'a'.repeat(150);
        const results1 = searchDictionary(longQuery, 'viet_to_ethnic', dictionary);
        expect(results1).toEqual([]);

        // Test with 50,000 characters (exceeds V8 RegExp limit 32,767)
        const hugeQuery = 'x'.repeat(50000);
        expect(() => {
            const results2 = searchDictionary(hugeQuery, 'viet_to_ethnic', dictionary);
            expect(results2).toEqual([]);
        }).not.toThrow();
    });
});
