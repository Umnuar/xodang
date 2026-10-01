/**
 * Build-time Data Snapshot Generator (For Electron Offline Packaging)
 * Fetches Google Sheets API v4 data using environment variable GOOGLE_SHEETS_API_KEY
 * and saves frozen JSON snapshots to src/shared/data/snapshot/.
 *
 * NOTE: API Key must be supplied via environment variable and NEVER committed to Git.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GOOGLE_CONFIG } from '../src/shared/constants/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateSnapshots(): Promise<void> {
    const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
    if (!apiKey) {
        console.error('❌ Lỗi: Cần cung cấp biến môi trường GOOGLE_SHEETS_API_KEY để tạo snapshot!');
        console.error('Ví dụ: GOOGLE_SHEETS_API_KEY=AIzaSy... npm run snapshot');
        process.exit(1);
    }

    const outputDir = path.resolve(__dirname, '../src/shared/data/snapshot');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const sheetId = GOOGLE_CONFIG.SHEET_ID;

    console.log('🔄 Đang kéo dữ liệu từ Google Sheets API...');

    const endpoints = [
        {
            name: 'vocab-snapshot.json',
            url: `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Tu_Dien!A2:F?key=${apiKey}`
        },
        {
            name: 'quiz-snapshot.json',
            url: `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Data_Tracnghiem!A2:H?key=${apiKey}`
        },
        {
            name: 'chat-snapshot.json',
            url: `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Data_Chat!A2:B?key=${apiKey}`
        }
    ];

    for (const ep of endpoints) {
        try {
            console.log(`⬇️ Đang tải ${ep.name}...`);
            const res = await fetch(ep.url);
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            const data = await res.json();
            const filePath = path.join(outputDir, ep.name);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
            console.log(`✅ Đã lưu ${ep.name} (${(fs.statSync(filePath).size / 1024).toFixed(1)} KB)`);
        } catch (err) {
            console.error(`❌ Thất bại khi tải ${ep.name}:`, (err as Error).message);
        }
    }

    console.log('🎉 Hoàn tất quá trình tạo snapshot offline!');
}

generateSnapshots().catch((err) => {
    console.error('Lỗi không xác định:', err);
    process.exit(1);
});
