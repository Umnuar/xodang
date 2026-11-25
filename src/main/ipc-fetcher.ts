import { ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';
import { APP_CONFIG, GOOGLE_CONFIG, ALLOWED_SHEET_RANGES } from '../shared/constants/config';

export function registerIpcFetcher(): void {
    ipcMain.handle('sheets:fetch', async (_event, range: string) => {
        if (typeof range !== 'string' || !ALLOWED_SHEET_RANGES.has(range)) {
            return {
                success: false,
                error: 'Invalid or unauthorized sheet range requested'
            };
        }

        const apiKey = process.env.GOOGLE_SHEETS_API_KEY || process.env.VITE_GOOGLE_API_KEY || GOOGLE_CONFIG.API_KEY;
        const sheetId = process.env.VITE_SHEET_ID || GOOGLE_CONFIG.SHEET_ID;
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), APP_CONFIG.REQUEST_TIMEOUT_MS);

        try {
            if (!apiKey) {
                throw new Error('Missing Google Sheets API key');
            }

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'TuDienXoDang-Desktop/10.0.3'
                },
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error(`Sheets API responded with ${response.status}`);
            }

            const data = await response.json();
            return { success: true, data };
        } catch (netErr) {
            console.warn('[Desktop IPC] Network fetch failed, reading offline snapshot fallback...', (netErr as Error).message);

            const snapshotFile = range.includes('Tracnghiem')
                ? 'quiz-snapshot.json'
                : range.includes('Chat')
                ? 'chat-snapshot.json'
                : 'vocab-snapshot.json';

            const candidatePaths = [
                path.resolve(__dirname, '../../src/shared/data/snapshot', snapshotFile),
                path.resolve(__dirname, '../shared/data/snapshot', snapshotFile)
            ];
            const snapshotPath = candidatePaths.find((candidate) => fs.existsSync(candidate));

            if (snapshotPath) {
                try {
                    const raw = fs.readFileSync(snapshotPath, 'utf-8');
                    const snapshotData = JSON.parse(raw);
                    return { success: true, data: snapshotData, isOfflineSnapshot: true };
                } catch (fsErr) {
                    console.error('[Desktop IPC] Failed to parse snapshot file:', fsErr);
                }
            }

            return { success: false, error: (netErr as Error).message };
        } finally {
            clearTimeout(timeoutId);
        }
    });

    ipcMain.handle('system:is-offline', () => {
        return false;
    });
}
