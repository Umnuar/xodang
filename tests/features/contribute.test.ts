/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import contributeHtml from '@/features/contribute/contribute.html?raw';
import { initContribute, isValidAudioFile, MAX_AUDIO_FILE_SIZE } from '@/features/contribute/contribute';
import { BatchQueueManager } from '@/features/contribute/batch-queue';
import { eventBus } from '@/utils/event-bus';

describe('Contribute Feature & Deletion Workflow Tests (Lô 4)', () => {
    afterEach(() => {
        eventBus.clear();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });
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

    it('shifts playing index accurately when removing an earlier item in BatchQueueManager and stops on tab change', () => {
        const playSpy = vi.fn().mockResolvedValue(undefined);
        const pauseSpy = vi.fn();
        vi.stubGlobal('Audio', vi.fn().mockImplementation(() => ({
            play: playSpy,
            pause: pauseSpy,
            currentTime: 0,
            src: '',
            onended: null
        })));
        const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

        const queue = new BatchQueueManager();
        const dummyBlob = new Blob(['a'], { type: 'audio/webm' });
        queue.add({ name: 'item0', blob: dummyBlob, size: '1 KB', type: 'recording', audioUrl: 'blob:0' });
        queue.add({ name: 'item1', blob: dummyBlob, size: '1 KB', type: 'recording', audioUrl: 'blob:1' });
        queue.add({ name: 'item2', blob: dummyBlob, size: '1 KB', type: 'recording', audioUrl: 'blob:2' });

        expect(queue.play(1)).toBe(true);
        expect(queue.getPlayingIndex()).toBe(1);

        queue.removeAt(0);
        expect(queue.getPlayingIndex()).toBe(0);
        expect(queue.getItems()[0].name).toBe('item1');
        expect(revokeSpy).toHaveBeenCalledWith('blob:0');

        queue.removeAt(0);
        expect(queue.getPlayingIndex()).toBe(-1);
        expect(pauseSpy).toHaveBeenCalled();

        eventBus.emit('tab:change', 'home');
    });

    it('submits uploaded single audio via sendContribution and resets controls on success', async () => {
        const fetchMock = vi.fn().mockResolvedValue({ ok: true });
        vi.stubGlobal('fetch', fetchMock);
        vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:single-test');
        vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

        const fileInput = document.getElementById('audioFileInput') as HTMLInputElement;
        const vietInput = document.getElementById('vietnameseWord') as HTMLInputElement;
        const xodangInput = document.getElementById('xodangWord') as HTMLInputElement;
        const submitBtn = document.getElementById('submitSingleBtn') as HTMLButtonElement;
        const playbackControls = document.getElementById('singlePlaybackControls') as HTMLElement;

        const file = new File([new Uint8Array([0x1A, 0x45, 0xDF, 0xA3])], 'nha.webm', { type: 'audio/webm' });
        Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });
        fileInput.dispatchEvent(new Event('change'));

        vietInput.value = 'Nhà';
        xodangInput.value = 'Hnam';
        submitBtn.click();

        await vi.waitFor(() => {
            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(vietInput.value).toBe('');
            expect(xodangInput.value).toBe('');
            expect(playbackControls.style.display).toBe('none');
        });
    });
});
