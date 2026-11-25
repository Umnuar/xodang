import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { APP_CONFIG } from '../src/shared/constants/config';
import type { SnapshotDictionaryEntry } from '../src/shared/data/snapshot-fallback';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

function loadValidAudioIds(indexPath: string): Set<string> {
    if (!fs.existsSync(indexPath)) {
        throw new Error(`Missing audio index file: ${indexPath}`);
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

function sanitizeVocabRows(rows: string[][], validAudioIds: Set<string>): string[][] {
    return rows.map((row) => {
        const nextRow = [...row];
        if (nextRow.length > 3) {
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

async function generateSnapshots(): Promise<void> {
    loadDotEnv(path.resolve(__dirname, '../.env'));

    const apiKey =
        process.env.GOOGLE_SHEETS_API_KEY ||
        process.env.VITE_GOOGLE_API_KEY ||
        APP_CONFIG.GOOGLE_API_KEY;
    if (!apiKey || apiKey === 'YOUR_GOOGLE_SHEETS_API_KEY_HERE') {
        console.error('Missing GOOGLE_SHEETS_API_KEY or VITE_GOOGLE_API_KEY.');
        process.exit(1);
    }

    const sheetId = process.env.VITE_SHEET_ID || APP_CONFIG.SHEET_ID;
    const validAudioIds = loadValidAudioIds(path.resolve(__dirname, '../public/audio-pack.index.json'));
    const outputDir = path.resolve(__dirname, '../src/shared/data/snapshot');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
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
        const filePath = path.join(outputDir, out.name);
        fs.writeFileSync(filePath, JSON.stringify(out.payload, null, 2) + '\n', 'utf8');
        console.log(`Saved ${out.name}: ${out.payload.values.length} rows`);
    }

    const fallbackPath = path.resolve(__dirname, '../src/shared/data/snapshot-fallback.ts');
    writeSnapshotFallbackTs(fallbackPath, vocabPayload.values, quizPayload.values, chatPayload.values);
    console.log('Updated src/shared/data/snapshot-fallback.ts');
}

generateSnapshots().catch((err) => {
    console.error('Snapshot generation failed:', err instanceof Error ? err.message : String(err));
    process.exit(1);
});
