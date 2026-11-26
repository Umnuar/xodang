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
            name: 'html-transform-csp',
            transformIndexHtml(html, ctx) {
                if (command === 'build' && ctx.filename && path.basename(ctx.filename) === 'index.html') {
                    const appendEnvOrigin = (sources: string[], rawUrl: string | undefined) => {
                        if (!rawUrl) return;
                        try {
                            const origin = new URL(rawUrl).origin;
                            if (sources.indexOf(origin) === -1) {
                                sources.push(origin);
                            }
                        } catch {
                        }
                    };
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
                    const mediaSources = ["'self'", 'blob:', 'data:'];
                    appendEnvOrigin(connectSources, process.env.VITE_CONTRIBUTE_API_URL);
                    appendEnvOrigin(connectSources, process.env.VITE_DATA_BASE_URL);
                    appendEnvOrigin(connectSources, process.env.VITE_AUDIO_BASE_URL);
                    appendEnvOrigin(mediaSources, process.env.VITE_AUDIO_BASE_URL);
                    const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'wasm-unsafe-eval' https://cdn.jsdelivr.net; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; font-src 'self'; media-src ${mediaSources.join(' ')}; connect-src ${connectSources.join(' ')}; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; img-src 'self' data:;">`;
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
