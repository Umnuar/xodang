/**
 * Electron IPC Fetcher for Google Sheets Data
 * Handles API calls from main process, adds desktop headers, and falls back
 * to local snapshots when running without Internet connection.
 */

import { ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';
import { GOOGLE_CONFIG } from '../shared/constants/config';

export function registerIpcFetcher(): void {
    ipcMain.handle('sheets:fetch', async (_event, range: string) => {
        const apiKey = GOOGLE_CONFIG.API_KEY;
        const sheetId = GOOGLE_CONFIG.SHEET_ID;
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`;

        try {
            // Attempt network fetch with desktop User-Agent
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'TuDienXoDang-Desktop/10.0.3'
                }
            });

            if (!response.ok) {
                throw new Error(`Sheets API responded with ${response.status}`);
            }

            const data = await response.json();
            return { success: true, data };
        } catch (netErr) {
            console.warn('[Desktop IPC] Network fetch failed, reading offline snapshot fallback...', (netErr as Error).message);

            // Offline Snapshot Fallback
            const snapshotFile = range.includes('Tracnghiem')
                ? 'quiz-snapshot.json'
                : range.includes('Chat')
                ? 'chat-snapshot.json'
                : 'vocab-snapshot.json';

            const snapshotPath = path.resolve(__dirname, '../shared/data/snapshot', snapshotFile);

            if (fs.existsSync(snapshotPath)) {
                try {
                    const raw = fs.readFileSync(snapshotPath, 'utf-8');
                    const snapshotData = JSON.parse(raw);
                    return { success: true, data: snapshotData, isOfflineSnapshot: true };
                } catch (fsErr) {
                    console.error('[Desktop IPC] Failed to parse snapshot file:', fsErr);
                }
            }

            return { success: false, error: (netErr as Error).message };
        }
    });

    ipcMain.handle('system:is-offline', () => {
        // Can be queried by renderer
        return false;
    });
}
