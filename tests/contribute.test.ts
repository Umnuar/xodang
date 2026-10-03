/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import contributeHtml from '@/renderer/features/contribute/contribute.html?raw';
import { initContribute, isValidAudioFile, MAX_AUDIO_FILE_SIZE } from '@/renderer/features/contribute/contribute';

describe('Contribute Feature & Deletion Workflow Tests (Lô 4)', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <main>
                ${contributeHtml}
            </main>
        `;
        initContribute();
    });

    it('renders Direction A editorial layout without AI slop badges', () => {
        // No .contribute-badge
        expect(document.querySelector('.contribute-badge')).toBeNull();

        // Header and subtitle exist
        const header = document.querySelector('.contribute-header h1');
        expect(header?.textContent).toContain('Đóng Góp Từ Vựng');

        const subtitle = document.querySelector('.contribute-subtitle');
        expect(subtitle).not.toBeNull();

        // 2 Tabs exist
        const tabs = document.querySelectorAll('.contribute-tab');
        expect(tabs.length).toBe(2);
        expect(tabs[0].textContent).toBe('Từ đơn');
        expect(tabs[1].textContent).toBe('Thu hàng loạt');
    });

    it('switches between Single and Batch tabs', () => {
        const singleTab = document.getElementById('singleTab');
        const batchTab = document.getElementById('batchTab');
        const tabs = document.querySelectorAll('.contribute-tab');

        expect(singleTab?.style.display).not.toBe('none');
        expect(batchTab?.style.display).toBe('none');

        // Click Batch Tab
        (tabs[1] as HTMLButtonElement).click();
        expect(singleTab?.style.display).toBe('none');
        expect(batchTab?.style.display).toBe('block');
        expect(tabs[1].classList.contains('active')).toBe(true);

        // Click Single Tab back
        (tabs[0] as HTMLButtonElement).click();
        expect(singleTab?.style.display).toBe('block');
        expect(batchTab?.style.display).toBe('none');
        expect(tabs[0].classList.contains('active')).toBe(true);
    });

    it('validates audio files correctly', () => {
        // Valid file
        const validFile = { name: 'test.wav', size: 1024 * 100, type: 'audio/wav' };
        expect(isValidAudioFile(validFile).valid).toBe(true);

        // File exceeding size limit
        const bigFile = { name: 'huge.mp3', size: MAX_AUDIO_FILE_SIZE + 10, type: 'audio/mp3' };
        const bigCheck = isValidAudioFile(bigFile);
        expect(bigCheck.valid).toBe(false);
        expect(bigCheck.reason).toContain('vượt quá 10MB');

        // Invalid file format
        const badFile = { name: 'document.pdf', size: 500, type: 'application/pdf' };
        const badCheck = isValidAudioFile(badFile);
        expect(badCheck.valid).toBe(false);
        expect(badCheck.reason).toContain('không phải là định dạng âm thanh');
    });

    it('executes 1-step deletion confirmation with button labeled "Xóa"', () => {
        const deleteModal = document.getElementById('deleteAudioConfirmModal');
        const confirmBtn = document.getElementById('btnConfirmDeleteAudio');
        const cancelBtn = document.getElementById('btnCancelDeleteAudio');
        const singleDeleteBtn = document.getElementById('singleDeleteAudioBtn');
        const playbackControls = document.getElementById('singlePlaybackControls');

        expect(deleteModal).not.toBeNull();
        expect(deleteModal?.style.display).toBe('none');

        // Button label is explicitly "Xóa"
        expect(confirmBtn?.textContent?.trim()).toBe('Xóa');

        // Simulate having a recorded file
        if (playbackControls) playbackControls.style.display = 'flex';

        // Clicking delete button opens 1-step confirmation modal
        singleDeleteBtn?.click();
        expect(deleteModal?.style.display).toBe('flex');

        // Clicking cancel closes modal without deleting
        cancelBtn?.click();
        expect(deleteModal?.style.display).toBe('none');
        expect(playbackControls?.style.display).toBe('flex');

        // Re-open and confirm delete
        singleDeleteBtn?.click();
        expect(deleteModal?.style.display).toBe('flex');

        confirmBtn?.click();
        expect(deleteModal?.style.display).toBe('none');
        expect(playbackControls?.style.display).toBe('none');
    });
});
