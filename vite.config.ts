import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  root: '.',
  publicDir: 'public',
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
        game: path.resolve(__dirname, 'game.html'),
        intro: path.resolve(__dirname, 'intro.html')
      }
    }
  },
  server: {
    port: 3000,
    open: false
  }
});
