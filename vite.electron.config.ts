import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
            '@shared': path.resolve(__dirname, 'src/shared')
        }
    },
    build: {
        outDir: 'dist-electron',
        emptyOutDir: true,
        target: 'node20',
        ssr: true,
        rollupOptions: {
            input: {
                'main/index': path.resolve(__dirname, 'src/main/index.ts'),
                'preload/index': path.resolve(__dirname, 'src/preload/index.ts')
            },
            external: ['electron', 'fs', 'path', 'url'],
            output: {
                format: 'cjs',
                entryFileNames: '[name].cjs'
            }
        }
    }
});
