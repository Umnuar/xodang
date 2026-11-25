import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ command }) => ({
    base: './',
    root: '.',
    publicDir: 'public',
    plugins: [
        {
            name: 'snapshot-data-resolver',
            resolveId(source) {
                if (source === '@snapshot/data') {
                    const vocabPath = path.resolve(__dirname, 'src/shared/data/snapshot/vocab-snapshot.json');
                    if (fs.existsSync(vocabPath)) {
                        return '\0virtual:snapshot-data';
                    }
                }
                return null;
            },
            load(id) {
                if (id !== '\0virtual:snapshot-data') return null;
                const snapshotDir = path.resolve(__dirname, 'src/shared/data/snapshot');
                const readValues = (fileName: string): string[][] | null => {
                    const filePath = path.join(snapshotDir, fileName);
                    if (!fs.existsSync(filePath)) return null;
                    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as { values?: string[][] };
                    return Array.isArray(parsed.values) ? parsed.values : null;
                };
                const vocabRows = readValues('vocab-snapshot.json');
                const dictionary = vocabRows
                    ? vocabRows.map((row) => ({
                        viet: (row[0] || '').trim(),
                        ethnic: (row[1] || '').trim(),
                        pronunciation: (row[2] || '').trim(),
                        driveId: (row[3] || '').trim(),
                        exampleViet: (row[4] || '').trim(),
                        exampleEthnic: (row[5] || '').trim()
                    })).filter((entry) => entry.viet && entry.ethnic)
                    : null;
                const payload = {
                    dictionary,
                    quiz: readValues('quiz-snapshot.json'),
                    chat: readValues('chat-snapshot.json')
                };
                return `export const snapshotFallback = ${JSON.stringify(payload)};\nexport const vocabSnapshot = snapshotFallback.dictionary;\nexport const quizSnapshot = snapshotFallback.quiz;\nexport const chatSnapshot = snapshotFallback.chat;`;
            }
        },
        {
            name: 'html-transform-csp',
            transformIndexHtml(html, ctx) {
                if (command === 'build' && ctx.filename && path.basename(ctx.filename) === 'index.html') {
                    const connectSources = [
                        "'self'",
                        'https://sheets.googleapis.com',
                        'https://script.google.com',
                        'https://script.googleusercontent.com',
                        'https://cdn.jsdelivr.net',
                        'https://huggingface.co',
                        'https://cdn-lfs.hf.co',
                        'https://cdn-lfs-us-1.hf.co',
                        'https://cdn-lfs-eu-1.hf.co'
                    ];
                    const contributeApiUrl = process.env.VITE_CONTRIBUTE_API_URL;
                    if (contributeApiUrl) {
                        try {
                            const origin = new URL(contributeApiUrl).origin;
                            if (connectSources.indexOf(origin) === -1) {
                                connectSources.push(origin);
                            }
                        } catch {
                        }
                    }
                    const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'wasm-unsafe-eval' https://cdn.jsdelivr.net; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; font-src 'self'; media-src 'self' blob: data:; connect-src ${connectSources.join(' ')}; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; img-src 'self' data:;">`;
                    return html.replace(/<head(\s[^>]*)?>/i, (match) => `${match}\n    ${cspMeta}`);
                }
                return html;
            }
        }
    ],
    worker: {
        format: 'es'
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
            '@shared': path.resolve(__dirname, 'src/shared'),
            '@snapshot/data': path.resolve(__dirname, 'src/shared/data/snapshot-fallback.ts'),
            '@snapshot': path.resolve(__dirname, 'src/shared/data/snapshot-fallback.ts')
        }
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, 'index.html'),
                sw: path.resolve(__dirname, 'src/service-worker.ts')
            },
            output: {
                entryFileNames: (chunkInfo) => {
                    if (chunkInfo.name === 'sw') {
                        return 'service-worker.js';
                    }
                    return 'assets/[name]-[hash].js';
                }
            }
        }
    },
    server: {
        port: 3000,
        open: false
    }
}));
