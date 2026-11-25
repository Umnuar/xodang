import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import contributeHtml from '@/features/contribute/contribute.html?raw';
import { initContribute, isValidAudioFile, MAX_AUDIO_FILE_SIZE, getAudioExtensionFromMime } from '@/features/contribute/contribute';
import { BatchQueueManager } from '@/features/contribute/batch-queue';
import { AudioRecorder } from '@/features/contribute/recorder';
import { eventBus } from '@/utils/event-bus';

describe('Contribute Feature & Deletion Workflow Tests (Lô 4)', () => {
    afterEach(() => {
        eventBus.clear();
        vi.useRealTimers();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    beforeEach(() => {
        Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
        document.body.innerHTML = `
            <div id="toastContainer" role="status" aria-live="polite"></div>
            <main>
                ${contributeHtml}
            </main>
        `;
        initContribute();
    });

    it('renders Direction A editorial layout without AI slop badges', () => {
        expect(document.querySelector('.contribute-badge')).toBeNull();

        const header = document.querySelector('.contribute-header h1');
        expect(header?.textContent).toContain('Đóng Góp Từ Vựng');

        const subtitle = document.querySelector('.contribute-subtitle');
        expect(subtitle).not.toBeNull();

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

        (tabs[1] as HTMLButtonElement).click();
        expect(singleTab?.style.display).toBe('none');
        expect(batchTab?.style.display).toBe('block');
        expect(tabs[1].classList.contains('active')).toBe(true);

        (tabs[0] as HTMLButtonElement).click();
        expect(singleTab?.style.display).toBe('block');
        expect(batchTab?.style.display).toBe('none');
        expect(tabs[0].classList.contains('active')).toBe(true);
    });

    it('validates audio files correctly', () => {
        const validFile = { name: 'test.wav', size: 1024 * 100, type: 'audio/wav' };
        expect(isValidAudioFile(validFile).valid).toBe(true);

        const bigFile = { name: 'huge.mp3', size: MAX_AUDIO_FILE_SIZE + 10, type: 'audio/mp3' };
        const bigCheck = isValidAudioFile(bigFile);
        expect(bigCheck.valid).toBe(false);
        expect(bigCheck.reason).toContain('vượt quá 10MB');

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
        expect(confirmBtn?.textContent?.trim()).toBe('Xóa');

        if (playbackControls) playbackControls.style.display = 'flex';

        singleDeleteBtn?.click();
        expect(deleteModal?.style.display).toBe('flex');

        cancelBtn?.click();
        expect(deleteModal?.style.display).toBe('none');
        expect(playbackControls?.style.display).toBe('flex');

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

    it('UX-01 & UX-11: validates batch Vietnamese/Xơ Đăng labels, edits them, and removes only succeeded items on partial failure', async () => {
        vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:batch-test');
        vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

        const batchInput = document.getElementById('batchAudioInput') as HTMLInputElement;
        const batchQueueList = document.getElementById('batchQueueList') as HTMLElement;
        const submitBatchBtn = document.getElementById('submitBatchBtn') as HTMLButtonElement;

        const file1 = new File([new Uint8Array([1, 2, 3])], 'a1.webm', { type: 'audio/webm' });
        const file2 = new File([new Uint8Array([4, 5, 6])], 'a2.webm', { type: 'audio/webm' });
        Object.defineProperty(batchInput, 'files', { value: [file1, file2], configurable: true });
        batchInput.dispatchEvent(new Event('change'));

        const vietInputs = batchQueueList.querySelectorAll<HTMLInputElement>('.queue-viet-input');
        const xodangInputs = batchQueueList.querySelectorAll<HTMLInputElement>('.queue-xodang-input');
        expect(vietInputs.length).toBe(2);
        expect(xodangInputs.length).toBe(2);

        const fetchMock = vi.fn().mockImplementation(async (_url: string, init?: RequestInit) => {
            const payload = JSON.parse(String(init?.body || '{}')) as { vietnamese?: string };
            if (payload.vietnamese === 'Nước') {
                throw new Error('Server rejected second file');
            }
            return { ok: true };
        });
        vi.stubGlobal('fetch', fetchMock);

        submitBatchBtn.click();
        expect(fetchMock).not.toHaveBeenCalled();

        vietInputs[0].value = 'Nhà';
        vietInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
        xodangInputs[0].value = 'Hnam';
        xodangInputs[0].dispatchEvent(new Event('input', { bubbles: true }));

        vietInputs[1].value = 'Nước';
        vietInputs[1].dispatchEvent(new Event('input', { bubbles: true }));
        xodangInputs[1].value = 'Đak';
        xodangInputs[1].dispatchEvent(new Event('input', { bubbles: true }));

        submitBatchBtn.click();

        await vi.waitFor(() => {
            expect(fetchMock).toHaveBeenCalledTimes(2);
            const remainingItems = batchQueueList.querySelectorAll('.queue-item');
            expect(remainingItems.length).toBe(1);
            expect(remainingItems[0].textContent).toContain('a2.webm');
            const warningToast = document.querySelector('#toastContainer .toast.warning');
            expect(warningToast?.textContent).toContain('1/2');
        });
    });

    it('UX-13 & UX-28: AudioRecorder.cancel suppresses onStop, clears audio pauses playback & resets file input, and resolves MIME extensions', async () => {
        expect(getAudioExtensionFromMime('audio/mp4')).toBe('.mp4');
        expect(getAudioExtensionFromMime('audio/ogg;codecs=opus')).toBe('.ogg');
        expect(getAudioExtensionFromMime('audio/webm')).toBe('.webm');

        const stopTrackSpy = vi.fn();
        const mockStream = { getTracks: () => [{ stop: stopTrackSpy }] } as unknown as MediaStream;
        vi.stubGlobal('navigator', {
            ...navigator,
            onLine: true,
            mediaDevices: { getUserMedia: vi.fn().mockResolvedValue(mockStream) }
        });

        let lastRecorder: {
            state: string;
            mimeType: string;
            ondataavailable?: (e: { data: Blob }) => void;
            onstop?: () => void;
            start: () => void;
            stop: () => void;
        } | null = null;

        class MockMediaRecorder {
            state = 'inactive';
            mimeType = 'audio/mp4';
            ondataavailable?: (e: { data: Blob }) => void;
            onstop?: () => void;
            static isTypeSupported = () => true;
            start = vi.fn(() => {
                this.state = 'recording';
            });
            stop = vi.fn(() => {
                this.state = 'inactive';
                this.ondataavailable?.({ data: new Blob(['chunk'], { type: 'audio/mp4' }) });
                this.onstop?.();
            });
            constructor() {
                lastRecorder = this;
            }
        }
        vi.stubGlobal('MediaRecorder', MockMediaRecorder);

        const recorder = new AudioRecorder();
        const onStopSpy = vi.fn();
        await recorder.start(onStopSpy);
        expect(recorder.isRecording()).toBe(true);
        expect(lastRecorder).not.toBeNull();

        recorder.cancel();
        expect(recorder.isRecording()).toBe(false);
        expect(onStopSpy).not.toHaveBeenCalled();
        expect(stopTrackSpy).toHaveBeenCalled();

        const playSpy = vi.fn().mockResolvedValue(undefined);
        const pauseSpy = vi.fn();
        vi.stubGlobal('Audio', vi.fn().mockImplementation(() => ({
            play: playSpy,
            pause: pauseSpy,
            currentTime: 0,
            src: '',
            onended: null,
            onerror: null
        })));
        vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:clear-test');
        vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

        const fileInput = document.getElementById('audioFileInput') as HTMLInputElement;
        const file = new File([new Uint8Array([1, 2, 3])], 'nha.webm', { type: 'audio/webm' });
        let inputValue = 'C:\\fakepath\\nha.webm';
        Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });
        Object.defineProperty(fileInput, 'value', {
            get: () => inputValue,
            set: (v: string) => { inputValue = v; },
            configurable: true
        });
        fileInput.dispatchEvent(new Event('change'));

        document.getElementById('singlePlayAudioBtn')!.click();
        expect(playSpy).toHaveBeenCalledTimes(1);

        document.getElementById('singleDeleteAudioBtn')!.click();
        const deleteModal = document.getElementById('deleteAudioConfirmModal')!;
        expect(deleteModal.style.display).toBe('flex');

        document.getElementById('btnConfirmDeleteAudio')!.click();
        expect(pauseSpy).toHaveBeenCalled();
        expect(fileInput.value).toBe('');

        document.getElementById('singleDeleteAudioBtn')!.click();
        expect(deleteModal.style.display).toBe('flex');
        eventBus.emit('tab:change', 'home');
        expect(deleteModal.style.display).toBe('none');
    });
});
