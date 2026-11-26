import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';
import { APP_CONFIG } from '../src/shared/constants/config';
import { classifyEntryKind, type EntryKind } from '../src/services/dictionary.service';
import type { SnapshotDictionaryEntry } from '../src/shared/data/snapshot-fallback';

export { classifyEntryKind, type EntryKind };

export interface StaticChunkMeta {
    path: string;
    sha256: string;
    count: number;
    bytes: number;
}

export interface StaticDictManifest {
    version: number;
    generatedAt: string;
    totalEntries: number;
    chunks: {
        words: StaticChunkMeta;
        phrases: StaticChunkMeta;
        quiz: StaticChunkMeta;
        chat: StaticChunkMeta;
    };
}

export type StaticPackFileName =
    | 'dict-manifest.json'
    | 'words.json'
    | 'phrases.json'
    | 'quiz.json'
    | 'chat.json';

export interface BuiltStaticDataPack {
    manifest: StaticDictManifest;
    files: Record<StaticPackFileName, string>;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const textEncoder = new TextEncoder();

const PRIORITY_FALLBACK_VIET = [
    'bố',
    'làm cha, làm mẹ',
    'cơm',
    'ăn',
    'uống',
    'uống nước',
    'nhà',
    'núi',
    'sông',
    'suối',
    'con trâu',
    'con bò',
    'con cá',
    'chim',
    'cây',
    'lá chuối',
    'cảm ơn',
    'anh em',
    'chào hỏi',
    'tháng',
    'số một (1)',
    'số hai (2)',
    'số ba (3)',
    'số bốn (4)',
    'số năm (5)',
    'số sáu (6)',
    'số bảy (7)',
    'số tám (8)',
    'số chính (9)',
    'số mười (10)'
];

const PRIORITY_QUIZ_IDS = new Set([
    '1',
    '2',
    '3',
    '14',
    '15',
    '18',
    '29',
    '36',
    '37',
    '54',
    '55',
    '211'
]);

function loadDotEnv(envPath: string): void {
    if (!fs.existsSync(envPath)) return;
    const content = fs.readFileSync(envPath, 'utf8');
    for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('\u0023')) continue;
        const eqIdx = line.indexOf('=');
        if (eqIdx <= 0) continue;
        const key = line.slice(0, eqIdx).trim();
        let val = line.slice(eqIdx + 1).trim();
        if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
        ) {
            val = val.slice(1, -1);
        }
        if (!(key in process.env) || !process.env[key]) {
            process.env[key] = val;
        }
    }
}

function loadValidAudioIds(indexPath: string): Set<string> | null {
    if (!fs.existsSync(indexPath)) {
        return null;
    }
    const parsed = JSON.parse(fs.readFileSync(indexPath, 'utf8')) as {
        files?: Record<string, unknown>;
    };
    if (!parsed || typeof parsed !== 'object' || !parsed.files || typeof parsed.files !== 'object') {
        throw new Error('Invalid audio-pack.index.json structure');
    }
    return new Set(Object.keys(parsed.files));
}

async function fetchSheetPayload(
    sheetId: string,
    range: string,
    apiKey: string
): Promise<{ range?: string; majorDimension?: string; values: string[][] }> {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText} (${range})`);
    }
    const data = (await res.json()) as {
        range?: string;
        majorDimension?: string;
        values?: string[][];
    };
    if (!data || !Array.isArray(data.values)) {
        throw new Error(`Invalid sheet response for range ${range}`);
    }
    return {
        range: data.range || range,
        majorDimension: data.majorDimension || 'ROWS',
        values: data.values
    };
}

function sanitizeVocabRows(rows: string[][], validAudioIds: Set<string> | null): string[][] {
    return rows.map((row) => {
        const nextRow = [...row];
        if (nextRow.length > 3 && validAudioIds) {
            const rawDriveId = String(nextRow[3] || '').trim();
            nextRow[3] = rawDriveId && validAudioIds.has(rawDriveId) ? rawDriveId : '';
        }
        return nextRow;
    });
}

function toDictionaryEntry(row: string[]): SnapshotDictionaryEntry | null {
    const viet = (row[0] || '').trim();
    const ethnic = (row[1] || '').trim();
    if (!viet || !ethnic) return null;
    const entry: SnapshotDictionaryEntry = { viet, ethnic };
    const pronunciation = (row[2] || '').trim();
    const driveId = (row[3] || '').trim();
    const exampleViet = (row[4] || '').trim();
    const exampleEthnic = (row[5] || '').trim();
    if (pronunciation) entry.pronunciation = pronunciation;
    if (driveId) entry.driveId = driveId;
    if (exampleViet) entry.exampleViet = exampleViet;
    if (exampleEthnic) entry.exampleEthnic = exampleEthnic;
    return entry;
}

export function packVocabTuple(entry: SnapshotDictionaryEntry): string[] {
    const tuple = [
        (entry.viet || '').trim(),
        (entry.ethnic || '').trim(),
        (entry.pronunciation || '').trim(),
        (entry.driveId || '').trim(),
        (entry.exampleViet || '').trim(),
        (entry.exampleEthnic || '').trim()
    ];
    while (tuple.length > 2 && tuple[tuple.length - 1] === '') {
        tuple.pop();
    }
    return tuple;
}

function serializeChunk(filePath: string, data: unknown): { json: string; meta: StaticChunkMeta } {
    const json = JSON.stringify(data);
    const bytes = textEncoder.encode(json);
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    const count = Array.isArray(data) ? data.length : 0;
    return {
        json,
        meta: {
            path: filePath,
            sha256,
            count,
            bytes: bytes.byteLength
        }
    };
}

function filterNonEmptyRows(rows: string[][]): string[][] {
    return rows.filter(
        (row) => Array.isArray(row) && row.some((cell) => String(cell || '').trim().length > 0)
    );
}

export function buildStaticDataPack(
    vocabRows: string[][],
    quizRows: string[][],
    chatRows: string[][],
    generatedAt: string = new Date().toISOString()
): BuiltStaticDataPack {
    const wordsTuples: string[][] = [];
    const phrasesTuples: string[][] = [];

    for (const row of vocabRows) {
        const entry = toDictionaryEntry(row);
        if (!entry) continue;
        const kind = classifyEntryKind(entry.viet, entry.ethnic);
        const packed = packVocabTuple(entry);
        if (kind === 'word') {
            wordsTuples.push(packed);
        } else {
            phrasesTuples.push(packed);
        }
    }

    const cleanQuizRows = filterNonEmptyRows(quizRows);
    const cleanChatRows = filterNonEmptyRows(chatRows);

    const wordsChunk = serializeChunk('words.json', wordsTuples);
    const phrasesChunk = serializeChunk('phrases.json', phrasesTuples);
    const quizChunk = serializeChunk('quiz.json', cleanQuizRows);
    const chatChunk = serializeChunk('chat.json', cleanChatRows);

    const manifest: StaticDictManifest = {
        version: 1,
        generatedAt,
        totalEntries: wordsTuples.length + phrasesTuples.length,
        chunks: {
            words: wordsChunk.meta,
            phrases: phrasesChunk.meta,
            quiz: quizChunk.meta,
            chat: chatChunk.meta
        }
    };

    return {
        manifest,
        files: {
            'dict-manifest.json': `${JSON.stringify(manifest, null, 2)}\n`,
            'words.json': wordsChunk.json,
            'phrases.json': phrasesChunk.json,
            'quiz.json': quizChunk.json,
            'chat.json': chatChunk.json
        }
    };
}

function buildFallbackDictionary(vocabRows: string[][]): SnapshotDictionaryEntry[] {
    const parsed = vocabRows
        .map(toDictionaryEntry)
        .filter((entry): entry is SnapshotDictionaryEntry => entry !== null);

    const selected: SnapshotDictionaryEntry[] = [];
    const seenViet = new Set<string>();
    const seenEthnic = new Set<string>();

    const tryAdd = (entry: SnapshotDictionaryEntry): boolean => {
        const vietKey = entry.viet.normalize('NFC').toLowerCase();
        const ethnicKey = entry.ethnic.normalize('NFC').toLowerCase();
        if (seenViet.has(vietKey) || seenEthnic.has(ethnicKey)) return false;
        seenViet.add(vietKey);
        seenEthnic.add(ethnicKey);
        selected.push(entry);
        return true;
    };

    for (const targetViet of PRIORITY_FALLBACK_VIET) {
        const match = parsed.find((entry) => entry.viet.normalize('NFC').toLowerCase() === targetViet);
        if (match) {
            tryAdd(match);
        }
    }

    for (const entry of parsed) {
        if (selected.length >= 36) break;
        if (entry.viet.length <= 16 && entry.ethnic.length <= 16) {
            tryAdd(entry);
        }
    }

    return selected;
}

function buildFallbackQuiz(quizRows: string[][]): string[][] {
    const validRows = quizRows.filter((row) => row.length >= 7 && row[1] && row[2]);
    const prioritized = validRows.filter((row) => PRIORITY_QUIZ_IDS.has((row[0] || '').trim()));
    if (prioritized.length >= 6) {
        return prioritized.slice(0, 12);
    }
    return validRows.slice(0, 12);
}

function buildFallbackChat(chatRows: string[][]): string[][] {
    return chatRows.filter((row) => row.length >= 2 && row[0] && row[1]).slice(0, 10);
}

function writeSnapshotFallbackTs(
    targetPath: string,
    vocabRows: string[][],
    quizRows: string[][],
    chatRows: string[][]
): void {
    const fallbackPayload = {
        dictionary: buildFallbackDictionary(vocabRows),
        quiz: buildFallbackQuiz(quizRows),
        chat: buildFallbackChat(chatRows)
    };

    const content = [
        'export interface SnapshotDictionaryEntry {',
        '    viet: string;',
        '    ethnic: string;',
        '    pronunciation?: string;',
        '    driveId?: string;',
        '    exampleViet?: string;',
        '    exampleEthnic?: string;',
        '}',
        '',
        'export interface SnapshotFallbackType {',
        '    dictionary: SnapshotDictionaryEntry[] | null;',
        '    quiz: string[][] | null;',
        '    chat: string[][] | null;',
        '}',
        '',
        `export const snapshotFallback: SnapshotFallbackType = ${JSON.stringify(fallbackPayload, null, 4)};`,
        '',
        'export const vocabSnapshot = snapshotFallback.dictionary;',
        'export const quizSnapshot = snapshotFallback.quiz;',
        'export const chatSnapshot = snapshotFallback.chat;',
        ''
    ].join('\n');

    fs.writeFileSync(targetPath, content, 'utf8');
}

function readLocalSnapshotValues(filePath: string): string[][] {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Missing local snapshot file: ${filePath}`);
    }
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as { values?: string[][] };
    if (!parsed || !Array.isArray(parsed.values)) {
        throw new Error(`Invalid snapshot payload in ${filePath}`);
    }
    return parsed.values;
}

function writeStaticPackFiles(dataDir: string, pack: BuiltStaticDataPack): void {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    for (const [fileName, content] of Object.entries(pack.files)) {
        fs.writeFileSync(path.join(dataDir, fileName), content, 'utf8');
    }
    console.log(
        `Generated public/data pack: words=${pack.manifest.chunks.words.count} (${pack.manifest.chunks.words.bytes}B), phrases=${pack.manifest.chunks.phrases.count} (${pack.manifest.chunks.phrases.bytes}B), quiz=${pack.manifest.chunks.quiz.count}, chat=${pack.manifest.chunks.chat.count}`
    );
}

export async function generateSnapshots(options?: { fromLocal?: boolean }): Promise<void> {
    const fromLocal = Boolean(options?.fromLocal);
    const snapshotDir = path.resolve(__dirname, '../src/shared/data/snapshot');
    const publicDataDir = path.resolve(__dirname, '../public/data');
    const audioIndexPath = path.resolve(__dirname, '../public/audio-pack.index.json');
    const validAudioIds = loadValidAudioIds(audioIndexPath);

    if (fromLocal) {
        const vocabValues = sanitizeVocabRows(
            readLocalSnapshotValues(path.join(snapshotDir, 'vocab-snapshot.json')),
            validAudioIds
        );
        const quizValues = readLocalSnapshotValues(path.join(snapshotDir, 'quiz-snapshot.json'));
        const chatValues = readLocalSnapshotValues(path.join(snapshotDir, 'chat-snapshot.json'));

        const pack = buildStaticDataPack(vocabValues, quizValues, chatValues);
        writeStaticPackFiles(publicDataDir, pack);

        const fallbackPath = path.resolve(__dirname, '../src/shared/data/snapshot-fallback.ts');
        writeSnapshotFallbackTs(fallbackPath, vocabValues, quizValues, chatValues);
        console.log('Updated src/shared/data/snapshot-fallback.ts from local snapshots');
        return;
    }

    loadDotEnv(path.resolve(__dirname, '../.env'));

    const apiKey =
        process.env.GOOGLE_SHEETS_API_KEY ||
        process.env.VITE_GOOGLE_API_KEY ||
        APP_CONFIG.GOOGLE_API_KEY;
    if (!apiKey || apiKey === 'YOUR_GOOGLE_SHEETS_API_KEY_HERE') {
        console.error('Missing GOOGLE_SHEETS_API_KEY or VITE_GOOGLE_API_KEY.');
        process.exit(1);
    }

    if (!validAudioIds) {
        throw new Error(`Missing audio index file: ${audioIndexPath}`);
    }

    const sheetId = process.env.VITE_SHEET_ID || APP_CONFIG.SHEET_ID;
    if (!fs.existsSync(snapshotDir)) {
        fs.mkdirSync(snapshotDir, { recursive: true });
    }

    const vocabPayload = await fetchSheetPayload(sheetId, APP_CONFIG.DICTIONARY_RANGE, apiKey);
    vocabPayload.values = sanitizeVocabRows(vocabPayload.values, validAudioIds);

    const quizPayload = await fetchSheetPayload(sheetId, APP_CONFIG.QUIZ_RANGE, apiKey);
    const chatPayload = await fetchSheetPayload(sheetId, APP_CONFIG.CHAT_RANGE, apiKey);

    const outputs = [
        { name: 'vocab-snapshot.json', payload: vocabPayload },
        { name: 'quiz-snapshot.json', payload: quizPayload },
        { name: 'chat-snapshot.json', payload: chatPayload }
    ];

    for (const out of outputs) {
        const filePath = path.join(snapshotDir, out.name);
        fs.writeFileSync(filePath, JSON.stringify(out.payload, null, 2) + '\n', 'utf8');
        console.log(`Saved ${out.name}: ${out.payload.values.length} rows`);
    }

    const pack = buildStaticDataPack(vocabPayload.values, quizPayload.values, chatPayload.values);
    writeStaticPackFiles(publicDataDir, pack);

    const fallbackPath = path.resolve(__dirname, '../src/shared/data/snapshot-fallback.ts');
    writeSnapshotFallbackTs(fallbackPath, vocabPayload.values, quizPayload.values, chatPayload.values);
    console.log('Updated src/shared/data/snapshot-fallback.ts');
}

const isDirectExecution = (() => {
    if (typeof process === 'undefined' || process.env.VITEST || !Array.isArray(process.argv)) {
        return false;
    }
    return process.argv.some((arg) => {
        if (typeof arg !== 'string') return false;
        const normalized = arg.replace(/\\/g, '/');
        return normalized.endsWith('scripts/generate-snapshot.ts') || normalized.includes('/vite-node');
    });
})();

if (isDirectExecution) {
    const fromLocal = process.argv.includes('--from-local');
    generateSnapshots({ fromLocal }).catch((err) => {
        console.error('Snapshot generation failed:', err instanceof Error ? err.message : String(err));
        process.exit(1);
    });
}
