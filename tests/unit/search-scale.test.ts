import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    classifyEntryKind,
    getSuggestions,
    searchDictionary,
    searchDictionaryPaginated,
    warmDictionaryIndex,
    type DictionaryEntry
} from '@/services/dictionary.service';
import { getMemoryCardPairs, getQuestionsForLevel } from '@/features/games/game-data';
import * as homeFeature from '@/features/home/home';
import { buildStaticDataPack, packVocabTuple } from '../../scripts/generate-snapshot';

function buildSyntheticCorpus(wordCount: number, phraseCount: number): DictionaryEntry[] {
    const entries: DictionaryEntry[] = [];
    const seeds = ['cơm', 'nước', 'rừng', 'nhà', 'cây', 'sông', 'mẹ', 'chim'];

    for (let i = 0; i < wordCount; i++) {
        const seed = seeds[i % seeds.length];
        entries.push({
            viet: i < seeds.length ? seed : `${seed} ${i}`,
            ethnic: i < seeds.length ? `x_${seed}` : `x_${seed}_${i}`,
            kind: 'word'
        });
    }

    for (let i = 0; i < phraseCount; i++) {
        const seed = seeds[i % seeds.length];
        entries.push({
            viet: `tôi thấy ${seed} rất đẹp ở vùng ${i}`,
            ethnic: `o hlo ${seed} lĕ a kơdrăm ${i}`,
            kind: 'phrase'
        });
    }

    return entries;
}

function percentile95(samples: number[]): number {
    const sorted = [...samples].sort((a, b) => a - b);
    const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
    return sorted[idx];
}

describe('Phase 1 scale, ranking, pagination, and static pack', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('classifies words vs phrases and builds valid static tuple pack', () => {
        expect(classifyEntryKind('ăn', 'ka')).toBe('word');
        expect(classifyEntryKind('Say mê (sảng khoái)', 'Rơhú')).toBe('word');
        expect(classifyEntryKind('làm cha, làm mẹ', 'pơja')).toBe('phrase');
        expect(classifyEntryKind('Em thức dậy vào sáng sớm', 'O xông koi')).toBe('phrase');

        expect(
            packVocabTuple({
                viet: 'ăn',
                ethnic: 'ka',
                pronunciation: 'ka',
                driveId: '',
                exampleViet: '',
                exampleEthnic: ''
            })
        ).toEqual(['ăn', 'ka', 'ka']);

        const pack = buildStaticDataPack(
            [
                ['ăn', 'ka', '', 'drv1'],
                ['Em thức dậy sớm', 'O xông koi kơso', '', ''],
                ['', 'empty-viet']
            ],
            [['1', 'Câu hỏi', 'A', 'B', 'C', 'D', 'A', 'Giải thích']],
            [['Xin chào', 'Hơtô']],
            '2026-11-26T00:00:00.000Z'
        );

        expect(pack.manifest.totalEntries).toBe(2);
        expect(pack.manifest.chunks.words.count).toBe(1);
        expect(pack.manifest.chunks.phrases.count).toBe(1);
        expect(pack.manifest.chunks.quiz.count).toBe(1);
        expect(pack.manifest.chunks.chat.count).toBe(1);
        expect(pack.manifest.chunks.words.sha256).toMatch(/^[a-f0-9]{64}$/);
        expect(new TextEncoder().encode(pack.files['words.json']).byteLength).toBe(
            pack.manifest.chunks.words.bytes
        );
    });

    it('ranks word entries before phrase entries and handles pagination cleanly', () => {
        const sample: DictionaryEntry[] = [
            { viet: 'nước chảy xiết qua khe đá lớn', ethnic: 'dak kơtơng', kind: 'phrase' },
            { viet: 'nước', ethnic: 'dak', kind: 'word' },
            { viet: 'uống nước', ethnic: 'ngă dak', kind: 'word' }
        ];

        const ranked = searchDictionary('nước', 'viet_to_ethnic', sample);
        expect(ranked.map((e) => e.viet)).toEqual([
            'nước',
            'uống nước',
            'nước chảy xiết qua khe đá lớn'
        ]);

        const manyWords: DictionaryEntry[] = Array.from({ length: 45 }, (_, i) => ({
            viet: `mưa ${i}`,
            ethnic: `mơ-giă ${i}`,
            kind: 'word'
        }));

        const page1 = searchDictionaryPaginated('mưa', 'viet_to_ethnic', manyWords, {
            offset: 0,
            limit: 30
        });
        expect(page1.total).toBe(45);
        expect(page1.entries).toHaveLength(30);
        expect(page1.hasMore).toBe(true);
        expect(page1.nextOffset).toBe(30);

        const page2 = searchDictionaryPaginated('mưa', 'viet_to_ethnic', manyWords, {
            offset: page1.nextOffset,
            limit: 30
        });
        expect(page2.entries).toHaveLength(15);
        expect(page2.hasMore).toBe(false);
        expect(page2.nextOffset).toBe(45);
    });

    it('benchmarks 25,000 entries under 10ms p95 for search and prefix suggestions', () => {
        const corpus = buildSyntheticCorpus(10_000, 15_000);
        warmDictionaryIndex(corpus);

        const queries: Array<[string, 'viet_to_ethnic' | 'ethnic_to_viet']> = [
            ['cơm', 'viet_to_ethnic'],
            ['com', 'viet_to_ethnic'],
            ['nước', 'viet_to_ethnic'],
            ['nuoc', 'viet_to_ethnic'],
            ['rừng', 'viet_to_ethnic'],
            ['nhà', 'viet_to_ethnic'],
            ['500', 'viet_to_ethnic'],
            ['x_cơm', 'ethnic_to_viet'],
            ['x_nước', 'ethnic_to_viet'],
            ['khongtontai', 'viet_to_ethnic']
        ];

        for (const [q, dir] of queries) {
            searchDictionaryPaginated(q, dir, corpus, { offset: 0, limit: 30 });
            getSuggestions(q, dir, corpus, 8);
        }

        const searchTimesMs: number[] = [];
        const suggestTimesMs: number[] = [];

        for (let round = 0; round < 5; round++) {
            for (const [q, dir] of queries) {
                const t0 = performance.now();
                searchDictionaryPaginated(q, dir, corpus, { offset: 0, limit: 30 });
                searchTimesMs.push(performance.now() - t0);

                const s0 = performance.now();
                getSuggestions(q, dir, corpus, 8);
                suggestTimesMs.push(performance.now() - s0);
            }
        }

        const searchP95 = percentile95(searchTimesMs);
        const suggestP95 = percentile95(suggestTimesMs);

        expect(searchP95).toBeLessThan(10);
        expect(suggestP95).toBeLessThan(10);
    });

    it('scales game question generation over 25,000 entries and prioritizes words in level 1', () => {
        const corpus = buildSyntheticCorpus(10_000, 15_000);
        vi.spyOn(homeFeature, 'getLoadedDictionary').mockReturnValue(corpus);

        const coldStart = performance.now();
        const questions = getQuestionsForLevel(1, 10, 'viet_to_ethnic');
        const coldElapsedMs = performance.now() - coldStart;

        const warmStart = performance.now();
        const warmQuestions = getQuestionsForLevel(1, 10, 'viet_to_ethnic');
        const warmElapsedMs = performance.now() - warmStart;

        expect(questions).toHaveLength(10);
        expect(warmQuestions).toHaveLength(10);
        for (const q of questions) {
            expect(q.wrongs).toHaveLength(3);
            expect(q.wrongs).not.toContain(q.correct);
            expect(q.question.split(/\s+/).length).toBeLessThanOrEqual(2);
        }

        const memoryPairs = getMemoryCardPairs(1, 6);
        expect(memoryPairs).toHaveLength(12);
        expect(coldElapsedMs).toBeLessThan(600);
        expect(warmElapsedMs).toBeLessThan(150);
    });
});
