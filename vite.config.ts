import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ command }) => ({
  root: '.',
  publicDir: 'public',
  plugins: [
    {
      name: 'html-transform-csp',
      transformIndexHtml(html, ctx) {
        // 1. Chỉ tiêm khi build production và Electron
        // 2. CHỈ TIÊM CHO index.html — bỏ qua intro.html và game.html trong Phase A để không chặn inline scripts & onclicks cũ
        if (command === 'build' && ctx.filename && path.basename(ctx.filename) === 'index.html') {
          const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; media-src 'self' blob: data:; connect-src 'self' https://sheets.googleapis.com https://script.google.com https://script.googleusercontent.com; frame-src 'self'; img-src 'self' data: https:;">`;
          // Sử dụng regex an toàn bảo toàn attributes trên thẻ head
          return html.replace(/<head(\s[^>]*)?>/i, (match) => `${match}\n    ${cspMeta}`);
        }
        return html;
      }
    }
  ],
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
}));
