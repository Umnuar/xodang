import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@snapshot/data': path.resolve(__dirname, 'src/shared/data/snapshot-fallback.ts'),
      '@snapshot': path.resolve(__dirname, 'src/shared/data/snapshot-fallback.ts')
    }
  },
  test: {
    environment: 'happy-dom',
    environmentOptions: {
      happyDOM: {
        url: 'http://localhost:3000'
      }
    },
    globals: true,
    include: ['tests/**/*.test.ts']
  }
});
