import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
    getAllGameVocab,
    getMemoryCardPairs,
    getQuestionsForLevel
} from '@/features/games/game-data';
import { snapshotFallback } from '@snapshot/data';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys';

describe('Game Data & Snapshot Consistency Regression Tests (GM-01, GM-07, GM-12, GM-17)', () => {
    const originalDictionary = snapshotFallback.dictionary;

    beforeEach(() => {
        if (!window.localStorage || typeof window.localStorage.clear !== 'function') {
            const store = new Map<string, string>();
            Object.defineProperty(window, 'localStorage', {
                value: {
                    getItem: (k: string) => store.get(k) ?? null,
                    setItem: (k: string, v: string) => store.set(k, String(v)),
                    removeItem: (k: string) => store.delete(k),
                    clear: () => store.clear(),
                    get length() { return store.size; },
                    key: (i: number) => Array.from(store.keys())[i] ?? null
                },
                configurable: true,
                writable: true
            });
        }
        window.localStorage.clear();
        snapshotFallback.dictionary = originalDictionary;
    });

    afterEach(() => {
        snapshotFallback.dictionary = originalDictionary;
    });

    it('GM-01 & GM-12: snapshotFallback.dictionary has consistent Bố/Mẹ entries and zero fake audio_1..20 driveIds', () => {
        const dict = snapshotFallback.dictionary;
        expect(Array.isArray(dict)).toBe(true);
        expect(dict!.length).toBeGreaterThanOrEqual(20);

        const boEntry = dict!.find((d) => d.viet.trim() === 'Bố');
        expect(boEntry).toBeDefined();
        expect(boEntry!.ethnic).toBe('Pa');
        expect(boEntry!.ethnic).not.toBe('Bá');
        expect(boEntry!.ethnic.toLowerCase()).not.toBe('mê');

        const parentEntry = dict!.find((d) => d.viet.includes('Làm cha, làm mẹ'));
        expect(parentEntry).toBeDefined();
        expect(parentEntry!.ethnic).toBe('Pro pa, pro nôu');

        const meEntry = dict!.find((d) => d.viet.trim().toLowerCase() === 'mẹ');
        if (meEntry) {
            expect(meEntry.ethnic).not.toBe('Mế');
        }

        const audioIndexPath = path.resolve(__dirname, '../../public/audio-pack.index.json');
        const audioIndex = JSON.parse(fs.readFileSync(audioIndexPath, 'utf-8')) as {
            files: Record<string, unknown>;
        };

        for (const entry of dict!) {
            const driveId = (entry.driveId || '').trim();
            expect(driveId).not.toMatch(/^audio_\d+$/i);
            if (driveId) {
                expect(Object.prototype.hasOwnProperty.call(audioIndex.files, driveId)).toBe(true);
            }
        }
    });

    it('GM-01 & GM-12: getAllGameVocab rejects legacy localStorage caches with audio_\\d+ or Bố->Bá / Mẹ->Mế', () => {
        window.localStorage.setItem(
            STORAGE_KEYS.GAME_OFFLINE_DATA,
            JSON.stringify([
                { viet: 'Bố', ethnic: 'Bá', driveId: 'audio_1' },
                { viet: 'Mẹ', ethnic: 'Mế', driveId: 'audio_2' },
                { viet: 'Nhà', ethnic: 'Hngêi', driveId: 'audio_3' },
                { viet: 'Núi', ethnic: 'Ngo', driveId: 'audio_4' }
            ])
        );

        const vocab = getAllGameVocab();
        expect(vocab.length).toBeGreaterThanOrEqual(4);
        const bo = vocab.find((v) => v.viet === 'Bố');
        expect(bo?.ethnic).toBe('Pa');
        expect(vocab.some((v) => /^audio_\d+$/i.test(v.driveId || ''))).toBe(false);

        window.localStorage.setItem(
            STORAGE_KEYS.GAME_OFFLINE_DATA,
            JSON.stringify([
                { viet: 'Bố', ethnic: 'Bá' },
                { viet: 'Cơm', ethnic: 'Hme' },
                { viet: 'Nhà', ethnic: 'Hngêi' },
                { viet: 'Núi', ethnic: 'Ngo' }
            ])
        );
        const vocabRejectedBo = getAllGameVocab();
        expect(vocabRejectedBo.find((v) => v.viet === 'Bố')?.ethnic).toBe('Pa');

        window.localStorage.setItem(
            STORAGE_KEYS.GAME_OFFLINE_DATA,
            JSON.stringify([
                { viet: 'Mẹ', ethnic: 'Mế' },
                { viet: 'Cơm', ethnic: 'Hme' },
                { viet: 'Nhà', ethnic: 'Hngêi' },
                { viet: 'Núi', ethnic: 'Ngo' }
            ])
        );
        const vocabRejectedMe = getAllGameVocab();
        expect(vocabRejectedMe.some((v) => v.viet === 'Mẹ' && v.ethnic === 'Mế')).toBe(false);
    });

    it('GM-07: getMemoryCardPairs and getQuestionsForLevel guard against empty vocab and deduplicate pairs', () => {
        expect(getMemoryCardPairs(1, 0)).toEqual([]);
        expect(getQuestionsForLevel(1, 0)).toEqual([]);

        snapshotFallback.dictionary = [];
        expect(getAllGameVocab()).toEqual([]);
        expect(getMemoryCardPairs(1, 4)).toEqual([]);
        expect(getQuestionsForLevel(1, 5)).toEqual([]);

        snapshotFallback.dictionary = [
            { viet: 'Nhà', ethnic: 'Hngêi', driveId: '1raUfN0CewaGXr0GTORjCblECdbcSc6M-' },
            { viet: 'nhà', ethnic: 'hngêi' },
            { viet: 'Nước', ethnic: 'Têa' },
            { viet: 'Núi', ethnic: 'Ngo' },
            { viet: 'Cây', ethnic: 'Loă' }
        ];

        const pairs = getMemoryCardPairs(1, 8);
        expect(pairs.length).toBe(8);
        const ethnicContents = pairs
            .filter((c) => c.type === 'question')
            .map((c) => c.content.toLowerCase());
        expect(new Set(ethnicContents).size).toBe(4);
    });

    it('GM-17: supports bidirectional questions, strips (1)..(10) suffixes, and excludes polysemy from wrong answers', () => {
        snapshotFallback.dictionary = [
            { viet: 'Số một (1)', ethnic: 'Môi' },
            { viet: 'Số hai (2)', ethnic: 'Péa' },
            { viet: 'Số mười (10)', ethnic: 'Môi chat' },
            { viet: 'Núi', ethnic: 'Ngo' },
            { viet: 'Núi cao', ethnic: 'Ngo' },
            { viet: 'Sông', ethnic: 'Kroáng' },
            { viet: 'Cây', ethnic: 'Loă' }
        ];

        const questions = getQuestionsForLevel(2, 6);
        const directions = new Set(questions.map((q) => q.direction));
        expect(directions.has('ethnic_to_viet')).toBe(true);
        expect(directions.has('viet_to_ethnic')).toBe(true);

        for (const q of questions) {
            expect(q.question).not.toMatch(/\((?:10|[1-9])\)$/);
            expect(q.correct).not.toMatch(/\((?:10|[1-9])\)$/);
            expect(q.wrongs).not.toContain(q.correct);
            for (const w of q.wrongs) {
                expect(w).not.toMatch(/\((?:10|[1-9])\)$/);
            }
        }

        const ngoQuestion = getQuestionsForLevel(1, 10, 'ethnic_to_viet').find(
            (q) => q.question.toLowerCase() === 'ngo'
        );
        expect(ngoQuestion).toBeDefined();
        expect(ngoQuestion!.wrongs).not.toContain('Núi');
        expect(ngoQuestion!.wrongs).not.toContain('Núi cao');
    });
});
