/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect } from 'vitest';
import * as nodeFs from 'fs';
import * as nodePath from 'path';

const fs: any = nodeFs;
const path: any = nodePath;

describe('Design Direction A: "Ấn phẩm yên tĩnh" Integrity Verification', () => {
    const srcDir = path.resolve(__dirname, '../src');

    it('guarantees ZERO Font Awesome icon classes in all HTML templates under src/', () => {
        const getFiles = (dir: string, ext: string[]): string[] => {
            let results: string[] = [];
            const list = fs.readdirSync(dir);
            list.forEach((file: string) => {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);
                if (stat && stat.isDirectory()) {
                    results = results.concat(getFiles(fullPath, ext));
                } else if (ext.some(e => file.endsWith(e))) {
                    results.push(fullPath);
                }
            });
            return results;
        };

        const htmlFiles = getFiles(srcDir, ['.html']);
        const faRegex = /class=["'][^"']*\b(fa-[a-z0-9-]+|fas|far|fab)\b[^"']*["']/g;

        htmlFiles.forEach(file => {
            const content = fs.readFileSync(file, 'utf-8');
            const matches = content.match(faRegex);
            expect(matches, `Found Font Awesome class in ${file}: ${matches}`).toBeNull();
        });
    });

    it('guarantees ZERO Font Awesome icon classes in all TypeScript files under src/', () => {
        const getFiles = (dir: string, ext: string[]): string[] => {
            let results: string[] = [];
            const list = fs.readdirSync(dir);
            list.forEach((file: string) => {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);
                if (stat && stat.isDirectory()) {
                    results = results.concat(getFiles(fullPath, ext));
                } else if (ext.some(e => file.endsWith(e))) {
                    results.push(fullPath);
                }
            });
            return results;
        };

        const tsFiles = getFiles(srcDir, ['.ts']);
        const faRegex = /\b(fas fa-|far fa-|fab fa-|class=['"][^'"]*fa-[a-z0-9-]+)/g;

        tsFiles.forEach((file: string) => {
            const content = fs.readFileSync(file, 'utf-8');
            const matches = content.match(faRegex);
            expect(matches, `Found Font Awesome reference in ${file}: ${matches}`).toBeNull();
        });
    });

    it('verifies Font Awesome is completely purged from stylesheets, service-worker, and offline.html', () => {
        const indexCss = fs.readFileSync(path.resolve(__dirname, '../src/renderer/styles/index.css'), 'utf-8');
        expect(indexCss).not.toContain('fontawesome');

        const swTs = fs.readFileSync(path.resolve(__dirname, '../src/renderer/service-worker.ts'), 'utf-8');
        expect(swTs).not.toContain('fontawesome');

        const offlineHtml = fs.readFileSync(path.resolve(__dirname, '../public/offline.html'), 'utf-8');
        expect(offlineHtml).not.toContain('font-awesome');
        expect(offlineHtml).not.toContain('fa-');

        const faDirExists = fs.existsSync(path.resolve(__dirname, '../public/fonts/fontawesome'));
        expect(faDirExists).toBe(false);

        const webfontsDirExists = fs.existsSync(path.resolve(__dirname, '../public/fonts/webfonts'));
        expect(webfontsDirExists).toBe(false);
    });

    it('verifies index.html initial loader uses inline SVG instead of Font Awesome spinner', () => {
        const indexHtml = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf-8');
        expect(indexHtml).not.toContain('fa-spinner');
        expect(indexHtml).not.toContain('fas fa-');
    });

    it('verifies Chatbot has responsive mobile bottom sheet CSS rule', () => {
        const chatCss = fs.readFileSync(path.resolve(__dirname, '../src/renderer/styles/features/chat.css'), 'utf-8');
        expect(chatCss).toContain('bottom: 64px');
        expect(chatCss).toContain('max-height: calc(85vh - 64px)');
    });

    it('verifies Onboarding copy is educational and free from AI-slop marketing hype', () => {
        const onboardingHtml = fs.readFileSync(path.resolve(__dirname, '../src/renderer/features/onboarding/onboarding.html'), 'utf-8');
        expect(onboardingHtml).not.toContain('Flashcard 3D');
        expect(onboardingHtml).not.toContain('siêu thông minh');
        expect(onboardingHtml).not.toContain('24/7');
        expect(onboardingHtml).toContain('Ngữ liệu Xơ Đăng chuẩn mực');
        expect(onboardingHtml).toContain('Sử dụng ổn định Ngoại tuyến (Offline)');
    });

    it('verifies Game Hub has labeled profile chips and separate SFX button', () => {
        const gameHtml = fs.readFileSync(path.resolve(__dirname, '../src/renderer/features/games/games.html'), 'utf-8');
        expect(gameHtml).toContain('id="btnOpenLeaderboard"');
        expect(gameHtml).toContain('id="btnOpenBadges"');
        expect(gameHtml).toContain('id="btnOpenCertificates"');
        expect(gameHtml).toContain('id="toggleGameSfx"');
        expect(gameHtml).toContain('title="Bật/Tắt âm thanh hiệu ứng"');
    });

    it('verifies Contribute feature has 1-step deletion modal', () => {
        const contributeHtml = fs.readFileSync(path.resolve(__dirname, '../src/renderer/features/contribute/contribute.html'), 'utf-8');
        expect(contributeHtml).toContain('id="deleteAudioConfirmModal"');
        expect(contributeHtml).toContain('id="btnConfirmDeleteAudio"');
        expect(contributeHtml).toContain('Xóa');
    });
});
