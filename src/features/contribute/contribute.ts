import '@/styles/features/contribute.css';
import { showToast } from '@/components/toast';
import { showLoading, hideLoading } from '@/components/loading-overlay';
import { eventBus } from '@/utils/event-bus';
import { sendContribution, isAppsScriptEndpoint } from '@/services/offline-sync.service';
import { enqueueContribution, flushContributionOutbox, getOutboxCount } from '@/services/contribution-outbox.service';
import { openAccessibleModal, closeAccessibleModal } from '@/utils/modal-a11y';
import { APP_CONFIG } from '@/shared/constants/config';
import { getLucideIcon } from '@/utils/icons';
import { AudioWaveVisualizer } from './visualizer';
import { AudioRecorder, MAX_RECORDING_SECONDS } from './recorder';
import { BatchQueueManager } from './batch-queue';

export const MAX_AUDIO_FILE_SIZE = 10 * 1024 * 1024;
export const ALLOWED_AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a', '.webm', '.aac', '.flac'];

export function getAudioExtensionFromMime(mimeType: string): string {
    const lower = (mimeType || '').toLowerCase();
    if (lower.includes('mp4')) return '.mp4';
    if (lower.includes('ogg')) return '.ogg';
    if (lower.includes('wav')) return '.wav';
    if (lower.includes('mpeg') || lower.includes('mp3')) return '.mp3';
    if (lower.includes('flac')) return '.flac';
    return '.webm';
}

export function isValidAudioFile(file: { name: string; size: number; type?: string }): { valid: boolean; reason?: string } {
    if (file.size > MAX_AUDIO_FILE_SIZE) {
        return { valid: false, reason: `Dung lượng file "${file.name}" vượt quá 10MB (${(file.size / (1024 * 1024)).toFixed(1)}MB).` };
    }
    const isAudioMime = file.type ? file.type.startsWith('audio/') : false;
    const lowerName = file.name.toLowerCase();
    const hasAudioExt = ALLOWED_AUDIO_EXTENSIONS.some(ext => lowerName.endsWith(ext));
    if (!isAudioMime && !hasAudioExt) {
        return { valid: false, reason: `File "${file.name}" không phải là định dạng âm thanh hợp lệ.` };
    }
    return { valid: true };
}

function formatDuration(totalSeconds: number): string {
    const clamped = Math.max(0, Math.floor(totalSeconds));
    const mins = Math.floor(clamped / 60);
    const secs = clamped % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function isNetworkOrTimeoutError(err: unknown): boolean {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
    if (err instanceof TypeError) return true;
    if (err && typeof err === 'object' && 'name' in err) {
        const name = String((err as { name?: unknown }).name || '');
        if (name === 'AbortError' || name === 'TypeError') return true;
    }
    if (typeof DOMException !== 'undefined' && err instanceof DOMException && err.name === 'AbortError') return true;
    return false;
}

function isUsingNoCorsAppsScript(): boolean {
    const targetUrl = (APP_CONFIG.CONTRIBUTE_API_URL || APP_CONFIG.CONTRIBUTE_URL || '').trim();
    return isAppsScriptEndpoint(targetUrl);
}

function getContributionSuccessMessage(count: number = 1): string {
    if (isUsingNoCorsAppsScript()) {
        return 'Đã gửi yêu cầu đóng góp (chế độ không xác nhận phản hồi máy chủ)';
    }
    return count > 1
        ? `Đã gửi đóng góp thành công toàn bộ ${count} mục!`
        : 'Đã gửi đóng góp thành công!';
}

export function initContribute(): void {
    const singleTab = document.getElementById('singleTab');
    const batchTab = document.getElementById('batchTab');
    const singleContributeForm = document.getElementById('singleContributeForm') as HTMLFormElement | null;
    const tabButtons = document.querySelectorAll('.contribute-tab');

    const outboxStatusBar = document.getElementById('outboxStatusBar') as HTMLElement | null;
    const outboxStatusText = document.getElementById('outboxStatusText') as HTMLElement | null;
    const syncOutboxBtn = document.getElementById('syncOutboxBtn') as HTMLButtonElement | null;

    const vietnameseWordInput = document.getElementById('vietnameseWord') as HTMLInputElement | null;
    const xodangWordInput = document.getElementById('xodangWord') as HTMLInputElement | null;
    const diacriticButtons = document.querySelectorAll('.contribute-diacritic-btn');
    const recordAudioBtn = document.getElementById('recordAudioBtn') as HTMLButtonElement | null;
    const uploadAudioBtn = document.getElementById('uploadAudioBtn') as HTMLButtonElement | null;
    const audioFileInput = document.getElementById('audioFileInput') as HTMLInputElement | null;
    const singleRecordTimer = document.getElementById('singleRecordTimer') as HTMLElement | null;
    const audioWave = document.getElementById('audioWave');
    const singlePlaybackControls = document.getElementById('singlePlaybackControls');
    const singlePlayAudioBtn = document.getElementById('singlePlayAudioBtn');
    const singleStopAudioBtn = document.getElementById('singleStopAudioBtn');
    const singleDeleteAudioBtn = document.getElementById('singleDeleteAudioBtn');
    const singleAudioFileName = document.getElementById('singleAudioFileName');
    const audioStatus = document.getElementById('audioStatus');
    const submitSingleBtn = document.getElementById('submitSingleBtn') as HTMLButtonElement | null;

    const recordBatchBtn = document.getElementById('recordBatchBtn') as HTMLButtonElement | null;
    const uploadBatchBtn = document.getElementById('uploadBatchBtn') as HTMLButtonElement | null;
    const batchAudioInput = document.getElementById('batchAudioInput') as HTMLInputElement | null;
    const batchRecordTimer = document.getElementById('batchRecordTimer') as HTMLElement | null;
    const batchWave = document.getElementById('batchWave');
    const batchStatus = document.getElementById('batchStatus');
    const batchQueueList = document.getElementById('batchQueueList');
    const submitBatchBtn = document.getElementById('submitBatchBtn') as HTMLButtonElement | null;

    const deleteAudioModal = document.getElementById('deleteAudioConfirmModal') as HTMLElement | null;
    const btnCancelDeleteAudio = document.getElementById('btnCancelDeleteAudio') as HTMLButtonElement | null;
    const btnConfirmDeleteAudio = document.getElementById('btnConfirmDeleteAudio') as HTMLButtonElement | null;

    const singleVisualizer = new AudioWaveVisualizer(audioWave);
    const batchVisualizer = new AudioWaveVisualizer(batchWave);
    const recorder = new AudioRecorder();

    let singleAudioBlob: Blob | null = null;
    let singleAudioUrl: string | null = null;
    let singleAudioPlayer: HTMLAudioElement | null = null;
    let pendingDeleteType: 'single' | 'batch' | null = null;
    let pendingDeleteIndex = -1;
    let activeWordInput: HTMLInputElement | null = xodangWordInput;
    let isSubmittingSingle = false;
    let isSubmittingBatch = false;

    const batchQueue = new BatchQueueManager(() => {
        updateBatchUI();
    });

    function updateOutboxUI(count: number): void {
        if (!outboxStatusBar || !outboxStatusText || !syncOutboxBtn) return;
        if (count <= 0) {
            outboxStatusBar.classList.add('is-empty');
            outboxStatusBar.hidden = true;
            outboxStatusText.textContent = 'Không có bản ghi chờ đồng bộ';
            syncOutboxBtn.disabled = true;
        } else {
            outboxStatusBar.classList.remove('is-empty');
            outboxStatusBar.hidden = false;
            outboxStatusText.textContent = `Đang chờ đồng bộ: ${count} bản ghi offline`;
            syncOutboxBtn.disabled = false;
        }
    }

    function resetRecordingTimers(resetText: boolean = false): void {
        if (singleRecordTimer) {
            singleRecordTimer.classList.remove('active');
            if (resetText) singleRecordTimer.textContent = '00:00';
        }
        if (batchRecordTimer) {
            batchRecordTimer.classList.remove('active');
            if (resetText) batchRecordTimer.textContent = '00:00';
        }
    }

    function resetRecordingButtons(): void {
        if (recordAudioBtn) {
            recordAudioBtn.innerHTML = `${getLucideIcon('mic', 'lucide-icon', 18)}<span class="btn-text">Thu âm</span>`;
            recordAudioBtn.classList.remove('recording');
        }
        if (recordBatchBtn) {
            recordBatchBtn.innerHTML = `${getLucideIcon('mic', 'lucide-icon', 18)}<span class="btn-text">Bắt đầu thu</span>`;
            recordBatchBtn.classList.remove('recording');
        }
        singleVisualizer.stopAnimation();
        batchVisualizer.stopAnimation();
    }

    function pauseSinglePlayback(): void {
        if (singleAudioPlayer) {
            singleAudioPlayer.pause();
            singleAudioPlayer.currentTime = 0;
        }
        singleVisualizer.stopAnimation();
    }

    function clearSingleAudio(): void {
        pauseSinglePlayback();
        singleAudioBlob = null;
        if (singleAudioUrl) {
            URL.revokeObjectURL(singleAudioUrl);
            singleAudioUrl = null;
        }
        if (audioFileInput) {
            audioFileInput.value = '';
        }
        if (singlePlaybackControls) singlePlaybackControls.style.display = 'none';
        if (singleAudioFileName) singleAudioFileName.textContent = '';
        if (audioStatus) audioStatus.textContent = '';
        resetRecordingTimers(true);
    }

    function stopAllAudio(cancelRecording: boolean = false): void {
        if (recorder.isRecording()) {
            if (cancelRecording) {
                recorder.cancel();
                resetRecordingButtons();
                resetRecordingTimers(true);
            } else {
                stopRecording();
            }
        } else if (cancelRecording) {
            recorder.cancel();
            resetRecordingButtons();
            resetRecordingTimers(true);
        }
        pauseSinglePlayback();
        batchQueue.stopPlayback();
        batchVisualizer.stopAnimation();
    }

    function stopRecording(): void {
        recorder.stop();
        resetRecordingButtons();
        resetRecordingTimers(false);
    }

    async function startRecording(isBatch: boolean = false): Promise<void> {
        stopAllAudio(true);

        const timerEl = isBatch ? batchRecordTimer : singleRecordTimer;
        if (timerEl) {
            timerEl.textContent = '00:00';
            timerEl.classList.add('active');
        }

        try {
            const stream = await recorder.start(
                ({ blob }) => {
                    if (isBatch) {
                        handleBatchRecordedBlob(blob);
                    } else {
                        handleSingleRecordedBlob(blob);
                    }
                },
                {
                    maxDurationSeconds: MAX_RECORDING_SECONDS,
                    onTick: (elapsedSeconds) => {
                        if (timerEl) {
                            timerEl.textContent = formatDuration(elapsedSeconds);
                        }
                    },
                    onMaxDurationReached: () => {
                        resetRecordingButtons();
                        resetRecordingTimers(false);
                        showToast('Đã đạt giới hạn thu âm tối đa 60 giây.', 'warning');
                    }
                }
            );

            if (isBatch) {
                if (recordBatchBtn) {
                    recordBatchBtn.innerHTML = `${getLucideIcon('square', 'lucide-icon', 18)}<span class="btn-text">Dừng thu</span>`;
                    recordBatchBtn.classList.add('recording');
                }
                batchVisualizer.startAnimation(false, stream);
                if (batchStatus) batchStatus.textContent = 'Đang thu âm... Nhấn "Dừng thu" khi hoàn tất (tối đa 60 giây).';
            } else {
                if (recordAudioBtn) {
                    recordAudioBtn.innerHTML = `${getLucideIcon('square', 'lucide-icon', 18)}<span class="btn-text">Dừng thu</span>`;
                    recordAudioBtn.classList.add('recording');
                }
                singleVisualizer.startAnimation(false, stream);
                if (audioStatus) audioStatus.textContent = 'Đang thu âm... (tối đa 60 giây)';
            }
        } catch (err: unknown) {
            resetRecordingTimers(true);
            if (err instanceof Error && err.message === 'Phiên ghi âm đã bị hủy.') {
                return;
            }
            console.error('Cannot access microphone:', err);
            showToast('Không thể truy cập microphone. Vui lòng cấp quyền trong cài đặt trình duyệt.', 'error');
        }
    }

    function handleSingleRecordedBlob(blob: Blob): void {
        if (blob.size > MAX_AUDIO_FILE_SIZE) {
            showToast(`Bản thu âm vượt quá giới hạn 10MB (${(blob.size / (1024 * 1024)).toFixed(1)}MB). Vui lòng thu ngắn hơn.`, 'error');
            clearSingleAudio();
            return;
        }
        const ext = getAudioExtensionFromMime(blob.type);
        singleAudioBlob = blob;
        if (singleAudioUrl) URL.revokeObjectURL(singleAudioUrl);
        singleAudioUrl = URL.createObjectURL(blob);

        if (singlePlaybackControls) singlePlaybackControls.style.display = 'flex';
        if (singleAudioFileName) singleAudioFileName.textContent = `Thu_am_${new Date().toLocaleTimeString('vi-VN')}${ext}`;
        if (audioStatus) audioStatus.textContent = 'Đã thu âm xong. Nhấn nghe thử hoặc gửi từ vựng.';
    }

    function handleBatchRecordedBlob(blob: Blob): void {
        if (blob.size > MAX_AUDIO_FILE_SIZE) {
            showToast(`Bản thu âm vượt quá giới hạn 10MB (${(blob.size / (1024 * 1024)).toFixed(1)}MB). Vui lòng thu ngắn hơn.`, 'error');
            return;
        }
        const ext = getAudioExtensionFromMime(blob.type);
        const index = batchQueue.length + 1;
        const name = `Thu_am_${index}_${new Date().toLocaleTimeString('vi-VN').replace(/:/g, '-')}${ext}`;
        batchQueue.add({
            name,
            vietnamese: '',
            xodang: '',
            blob,
            size: `${(blob.size / 1024).toFixed(1)} KB`,
            type: 'recording',
            audioUrl: URL.createObjectURL(blob)
        });
        if (batchStatus) batchStatus.textContent = `Đã thêm 1 file thu âm vào hàng đợi (Tổng: ${batchQueue.length} file).`;
    }

    function updateBatchUI(): void {
        if (!batchQueueList || !submitBatchBtn) return;

        const items = batchQueue.getItems();
        if (items.length === 0) {
            batchQueueList.style.display = 'none';
            batchQueueList.replaceChildren();
            submitBatchBtn.innerHTML = `${getLucideIcon('send', 'lucide-icon', 18)}<span>Gửi tất cả</span>`;
            return;
        }

        batchQueueList.style.display = 'block';
        submitBatchBtn.innerHTML = `${getLucideIcon('send', 'lucide-icon', 18)}<span>Gửi tất cả (${items.length})</span>`;

        const fragment = document.createDocumentFragment();
        const playingIdx = batchQueue.getPlayingIndex();

        items.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'queue-item';

            const headerDiv = document.createElement('div');
            headerDiv.className = 'queue-item-header';

            const infoDiv = document.createElement('div');
            infoDiv.className = 'queue-item-info';

            const nameDiv = document.createElement('div');
            nameDiv.className = 'queue-item-name';
            nameDiv.textContent = item.name;

            const sizeDiv = document.createElement('div');
            sizeDiv.className = 'queue-item-size';
            sizeDiv.textContent = `${item.size} • ${item.type === 'recording' ? 'Thu âm' : 'Tải lên'}`;

            infoDiv.appendChild(nameDiv);
            infoDiv.appendChild(sizeDiv);

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'queue-item-actions';

            const isPlaying = playingIdx === index;
            const playBtn = document.createElement('button');
            playBtn.type = 'button';
            playBtn.className = `queue-play-btn ${isPlaying ? 'playing' : ''}`;
            playBtn.dataset.action = 'play-queue';
            playBtn.dataset.index = String(index);
            playBtn.title = isPlaying ? 'Tạm dừng' : 'Nghe';
            playBtn.setAttribute('aria-label', isPlaying ? `Tạm dừng ${item.name}` : `Nghe ${item.name}`);
            playBtn.innerHTML = getLucideIcon(isPlaying ? 'pause' : 'play', 'lucide-icon', 16);

            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'queue-delete-btn';
            deleteBtn.dataset.action = 'delete-queue';
            deleteBtn.dataset.index = String(index);
            deleteBtn.title = 'Xóa';
            deleteBtn.setAttribute('aria-label', `Xóa ${item.name} khỏi hàng đợi`);
            deleteBtn.innerHTML = getLucideIcon('trash-2', 'lucide-icon', 16);

            actionsDiv.appendChild(playBtn);
            actionsDiv.appendChild(deleteBtn);

            headerDiv.appendChild(infoDiv);
            headerDiv.appendChild(actionsDiv);

            const fieldsDiv = document.createElement('div');
            fieldsDiv.className = 'queue-item-fields';

            const vietInput = document.createElement('input');
            vietInput.type = 'text';
            vietInput.className = 'queue-item-input queue-viet-input';
            vietInput.maxLength = 120;
            vietInput.placeholder = 'Từ tiếng Việt *';
            vietInput.value = item.vietnamese || '';
            vietInput.dataset.field = 'vietnamese';
            vietInput.dataset.index = String(index);
            vietInput.setAttribute('aria-label', `Từ tiếng Việt cho ${item.name}`);

            const xodangInput = document.createElement('input');
            xodangInput.type = 'text';
            xodangInput.className = 'queue-item-input queue-xodang-input';
            xodangInput.maxLength = 120;
            xodangInput.placeholder = 'Từ tiếng Xơ Đăng *';
            xodangInput.value = item.xodang || '';
            xodangInput.dataset.field = 'xodang';
            xodangInput.dataset.index = String(index);
            xodangInput.setAttribute('aria-label', `Từ tiếng Xơ Đăng cho ${item.name}`);

            fieldsDiv.appendChild(vietInput);
            fieldsDiv.appendChild(xodangInput);

            itemDiv.appendChild(headerDiv);
            itemDiv.appendChild(fieldsDiv);
            fragment.appendChild(itemDiv);
        });

        batchQueueList.replaceChildren(fragment);
    }

    function openDeleteConfirmation(type: 'single' | 'batch', index = -1): void {
        pendingDeleteType = type;
        pendingDeleteIndex = index;
        if (deleteAudioModal) {
            deleteAudioModal.style.display = 'flex';
            openAccessibleModal(deleteAudioModal, {
                onClose: closeDeleteConfirmation,
                initialFocus: btnCancelDeleteAudio ?? btnConfirmDeleteAudio ?? undefined,
                labelledById: 'deleteModalTitle'
            });
        }
    }

    function closeDeleteConfirmation(): void {
        pendingDeleteType = null;
        pendingDeleteIndex = -1;
        if (deleteAudioModal) {
            deleteAudioModal.style.display = 'none';
            closeAccessibleModal(deleteAudioModal);
        }
    }

    async function queueSingleContributionOffline(vietnamese: string, xodang: string, blob: Blob): Promise<void> {
        try {
            await enqueueContribution({
                id: `contrib_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                type: 'vocab',
                vietnamese,
                xodang,
                name: vietnamese,
                blob,
                timestamp: Date.now()
            });
            showToast('Đang offline — đã lưu vào hàng đợi, sẽ tự đồng bộ khi có mạng', 'warning');
            if (vietnameseWordInput) vietnameseWordInput.value = '';
            if (xodangWordInput) xodangWordInput.value = '';
            clearSingleAudio();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Không thể lưu bản ghi vào hàng đợi ngoại tuyến.';
            showToast(msg, 'error');
        }
    }

    async function handleSingleSubmit(): Promise<void> {
        if (!vietnameseWordInput || !xodangWordInput || isSubmittingSingle) return;

        const vietnamese = vietnameseWordInput.value.trim();
        const xodang = xodangWordInput.value.trim();

        if (!vietnamese) {
            showToast('Vui lòng nhập đầy đủ từ tiếng Việt và tiếng Xơ Đăng', 'error');
            vietnameseWordInput.focus();
            return;
        }

        if (!xodang) {
            showToast('Vui lòng nhập đầy đủ từ tiếng Việt và tiếng Xơ Đăng', 'error');
            xodangWordInput.focus();
            return;
        }

        if (!singleAudioBlob) {
            showToast('Vui lòng thu âm hoặc tải file âm thanh lên', 'error');
            recordAudioBtn?.focus();
            return;
        }

        stopAllAudio(true);

        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            await queueSingleContributionOffline(vietnamese, xodang, singleAudioBlob);
            return;
        }

        isSubmittingSingle = true;
        if (submitSingleBtn) submitSingleBtn.disabled = true;
        showLoading('Đang gửi từ vựng...');

        try {
            await sendContribution({
                type: 'vocab',
                vietnamese,
                xodang,
                blob: singleAudioBlob,
                name: vietnamese,
                filename: vietnamese
            });

            showToast(getContributionSuccessMessage(1), 'success');
            vietnameseWordInput.value = '';
            xodangWordInput.value = '';
            clearSingleAudio();
        } catch (err: unknown) {
            if (isNetworkOrTimeoutError(err)) {
                await queueSingleContributionOffline(vietnamese, xodang, singleAudioBlob);
            } else {
                console.error('Error submitting vocabulary:', err);
                showToast('Lỗi khi gửi từ vựng. Vui lòng thử lại sau.', 'error');
            }
        } finally {
            isSubmittingSingle = false;
            if (submitSingleBtn) submitSingleBtn.disabled = false;
            hideLoading();
        }
    }

    vietnameseWordInput?.addEventListener('focus', () => {
        activeWordInput = vietnameseWordInput;
    });

    xodangWordInput?.addEventListener('focus', () => {
        activeWordInput = xodangWordInput;
    });

    diacriticButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const char = (btn as HTMLElement).dataset.char || btn.textContent || '';
            const targetInput = activeWordInput || xodangWordInput || vietnameseWordInput;
            if (!targetInput || !char) return;
            const start = targetInput.selectionStart ?? targetInput.value.length;
            const end = targetInput.selectionEnd ?? targetInput.value.length;
            const currentValue = targetInput.value;
            const maxLen = targetInput.maxLength > 0 ? targetInput.maxLength : 120;
            const nextValue = currentValue.substring(0, start) + char + currentValue.substring(end);
            if (nextValue.length > maxLen) return;
            targetInput.value = nextValue;
            targetInput.focus();
            const cursorPos = start + char.length;
            targetInput.setSelectionRange(cursorPos, cursorPos);
        });
    });

    tabButtons.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab as HTMLElement;
            tabButtons.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            target.classList.add('active');
            target.setAttribute('aria-selected', 'true');

            const tabId = target.dataset.tab;
            if (singleTab) singleTab.style.display = tabId === 'single' ? 'block' : 'none';
            if (batchTab) batchTab.style.display = tabId === 'batch' ? 'block' : 'none';

            stopAllAudio(true);
            closeDeleteConfirmation();
        });
    });

    if (recordAudioBtn) {
        recordAudioBtn.addEventListener('click', () => {
            if (recorder.isRecording()) {
                stopRecording();
            } else {
                startRecording(false);
            }
        });
    }

    if (uploadAudioBtn && audioFileInput) {
        uploadAudioBtn.addEventListener('click', () => audioFileInput.click());
        audioFileInput.addEventListener('change', (e: Event) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const check = isValidAudioFile(file);
            if (!check.valid) {
                showToast(check.reason || 'File không hợp lệ', 'error');
                audioFileInput.value = '';
                return;
            }

            stopAllAudio(true);

            singleAudioBlob = file;
            if (singleAudioUrl) URL.revokeObjectURL(singleAudioUrl);
            singleAudioUrl = URL.createObjectURL(file);

            if (singlePlaybackControls) singlePlaybackControls.style.display = 'flex';
            if (singleAudioFileName) singleAudioFileName.textContent = file.name;
            if (audioStatus) audioStatus.textContent = `Đã chọn file: ${file.name}`;
        });
    }

    if (singlePlayAudioBtn) {
        singlePlayAudioBtn.addEventListener('click', () => {
            if (!singleAudioUrl) return;
            if (recorder.isRecording()) {
                stopRecording();
            }
            batchQueue.stopPlayback();
            batchVisualizer.stopAnimation();

            if (!singleAudioPlayer) {
                singleAudioPlayer = new Audio();
                singleAudioPlayer.onended = () => {
                    singleVisualizer.stopAnimation();
                };
                singleAudioPlayer.onerror = () => {
                    singleVisualizer.stopAnimation();
                    showToast('Không thể phát tệp âm thanh này trên trình duyệt hiện tại.', 'error');
                };
            }
            singleAudioPlayer.src = singleAudioUrl;
            const playPromise = singleAudioPlayer.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(() => {
                    singleVisualizer.stopAnimation();
                    showToast('Không thể phát tệp âm thanh này trên trình duyệt hiện tại.', 'error');
                });
            }
            singleVisualizer.startAnimation(true);
        });
    }

    if (singleStopAudioBtn) {
        singleStopAudioBtn.addEventListener('click', () => {
            pauseSinglePlayback();
        });
    }

    btnCancelDeleteAudio?.addEventListener('click', closeDeleteConfirmation);
    deleteAudioModal?.addEventListener('click', (e) => {
        if (e.target === deleteAudioModal) closeDeleteConfirmation();
    });

    btnConfirmDeleteAudio?.addEventListener('click', () => {
        if (pendingDeleteType === 'single') {
            clearSingleAudio();
            showToast('Đã xóa bản thu âm', 'info');
        } else if (pendingDeleteType === 'batch' && pendingDeleteIndex >= 0) {
            const wasPlaying = batchQueue.getPlayingIndex() === pendingDeleteIndex;
            const removed = batchQueue.removeAt(pendingDeleteIndex);
            if (wasPlaying) batchVisualizer.stopAnimation();
            if (batchStatus && batchQueue.length === 0) {
                batchStatus.textContent = 'Chưa có file nào trong hàng đợi';
            }
            showToast(`Đã xóa "${removed?.name || 'file'}" khỏi hàng đợi`, 'info');
        }
        closeDeleteConfirmation();
    });

    if (singleDeleteAudioBtn) {
        singleDeleteAudioBtn.addEventListener('click', () => {
            openDeleteConfirmation('single');
        });
    }

    if (singleContributeForm) {
        singleContributeForm.addEventListener('submit', (e: Event) => {
            e.preventDefault();
            void handleSingleSubmit();
        });
    } else if (submitSingleBtn) {
        submitSingleBtn.addEventListener('click', () => {
            void handleSingleSubmit();
        });
    }

    if (recordBatchBtn) {
        recordBatchBtn.addEventListener('click', () => {
            if (recorder.isRecording()) {
                stopRecording();
            } else {
                startRecording(true);
            }
        });
    }

    if (uploadBatchBtn && batchAudioInput) {
        uploadBatchBtn.addEventListener('click', () => batchAudioInput.click());
        batchAudioInput.addEventListener('change', (e: Event) => {
            const files = (e.target as HTMLInputElement).files;
            if (!files || files.length === 0) return;

            let addedCount = 0;
            Array.from(files).forEach(file => {
                const check = isValidAudioFile(file);
                if (!check.valid) {
                    showToast(check.reason || 'File không hợp lệ', 'error');
                    return;
                }

                batchQueue.add({
                    name: file.name,
                    vietnamese: '',
                    xodang: '',
                    blob: file,
                    size: `${(file.size / 1024).toFixed(1)} KB`,
                    type: 'upload',
                    audioUrl: URL.createObjectURL(file)
                });
                addedCount++;
            });

            batchAudioInput.value = '';
            if (addedCount > 0 && batchStatus) {
                batchStatus.textContent = `Đã thêm ${addedCount} file vào hàng đợi.`;
            }
        });
    }

    if (batchQueueList) {
        batchQueueList.addEventListener('input', (e: Event) => {
            const input = e.target as HTMLInputElement | null;
            if (!input || !input.classList.contains('queue-item-input')) return;
            const index = parseInt(input.dataset.index || '-1', 10);
            const field = input.dataset.field;
            if (index < 0) return;
            if (field === 'vietnamese') {
                batchQueue.updateLabels(index, { vietnamese: input.value });
            } else if (field === 'xodang') {
                batchQueue.updateLabels(index, { xodang: input.value });
            }
        });

        batchQueueList.addEventListener('click', (e: Event) => {
            const target = e.target as HTMLElement;
            const btn = target.closest('button');
            if (!btn) return;

            const action = btn.dataset.action;
            const index = parseInt(btn.dataset.index || '-1', 10);
            if (index < 0) return;

            if (action === 'play-queue') {
                if (recorder.isRecording()) {
                    stopRecording();
                }
                pauseSinglePlayback();
                const started = batchQueue.play(
                    index,
                    () => batchVisualizer.stopAnimation(),
                    (message) => showToast(message, 'error')
                );
                if (started) {
                    batchVisualizer.startAnimation(true);
                } else {
                    batchVisualizer.stopAnimation();
                }
            } else if (action === 'delete-queue') {
                openDeleteConfirmation('batch', index);
            }
        });
    }

    if (submitBatchBtn) {
        submitBatchBtn.addEventListener('click', async () => {
            if (isSubmittingBatch) return;
            const items = [...batchQueue.getItems()];
            if (items.length === 0) {
                showToast('Hàng đợi trống', 'error');
                return;
            }

            const invalidIndex = items.findIndex((item) => !(item.vietnamese || '').trim() && !(item.xodang || '').trim());
            if (invalidIndex !== -1) {
                showToast('Vui lòng nhập từ tiếng Việt hoặc tiếng Xơ Đăng cho tất cả các mục trong hàng đợi', 'error');
                const firstInvalidInput = batchQueueList?.querySelector<HTMLInputElement>(
                    `.queue-viet-input[data-index="${invalidIndex}"]`
                );
                firstInvalidInput?.focus();
                return;
            }

            stopAllAudio(true);
            isSubmittingBatch = true;
            submitBatchBtn.disabled = true;
            showLoading(`Đang gửi ${items.length} file âm thanh...`);

            let successCount = 0;
            let queuedOfflineCount = 0;
            let failedCount = 0;

            try {
                for (const item of items) {
                    const viet = (item.vietnamese || '').trim();
                    const xodang = (item.xodang || '').trim();
                    const label = [viet, xodang].filter(Boolean).join(' - ');

                    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
                        try {
                            await enqueueContribution({
                                id: `contrib_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                                type: 'voice',
                                vietnamese: viet,
                                xodang,
                                readingContent: label,
                                name: label || item.name,
                                blob: item.blob,
                                timestamp: Date.now()
                            });
                            const idx = batchQueue.getItems().indexOf(item);
                            if (idx >= 0) batchQueue.removeAt(idx);
                            queuedOfflineCount++;
                        } catch {
                            failedCount++;
                        }
                        continue;
                    }

                    try {
                        await sendContribution({
                            type: 'voice',
                            vietnamese: viet,
                            xodang,
                            readingContent: label,
                            blob: item.blob,
                            name: label || item.name,
                            filename: xodang || viet || item.name
                        });
                        const idx = batchQueue.getItems().indexOf(item);
                        if (idx >= 0) batchQueue.removeAt(idx);
                        successCount++;
                    } catch (err: unknown) {
                        if (isNetworkOrTimeoutError(err)) {
                            try {
                                await enqueueContribution({
                                    id: `contrib_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                                    type: 'voice',
                                    vietnamese: viet,
                                    xodang,
                                    readingContent: label,
                                    name: label || item.name,
                                    blob: item.blob,
                                    timestamp: Date.now()
                                });
                                const idx = batchQueue.getItems().indexOf(item);
                                if (idx >= 0) batchQueue.removeAt(idx);
                                queuedOfflineCount++;
                            } catch {
                                failedCount++;
                            }
                        } else {
                            console.error(`Error uploading item ${item.name}:`, err);
                            failedCount++;
                        }
                    }
                }
            } finally {
                isSubmittingBatch = false;
                submitBatchBtn.disabled = false;
                hideLoading();
            }

            if (batchQueue.length === 0 && batchStatus) {
                batchStatus.textContent = 'Chưa có file nào trong hàng đợi';
            }

            if (queuedOfflineCount > 0 && failedCount === 0 && successCount === 0) {
                showToast('Đang offline — đã lưu vào hàng đợi, sẽ tự đồng bộ khi có mạng', 'warning');
            } else if (successCount === items.length) {
                showToast(getContributionSuccessMessage(items.length), 'success');
            } else if (successCount === 0 && queuedOfflineCount === 0) {
                showToast(`Không thể gửi ${items.length} file. Vui lòng thử lại sau.`, 'error');
            } else {
                const parts: string[] = [`Đã gửi ${successCount}/${items.length} file thành công`];
                if (queuedOfflineCount > 0) parts.push(`${queuedOfflineCount} file đã lưu vào hàng đợi offline`);
                if (failedCount > 0) parts.push(`${failedCount} file bị lỗi`);
                showToast(parts.join(', ') + '.', 'warning');
            }
        });
    }

    syncOutboxBtn?.addEventListener('click', async () => {
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            showToast('Thiết bị đang ngoại tuyến. Sẽ tự đồng bộ khi có mạng.', 'warning');
            return;
        }
        syncOutboxBtn.disabled = true;
        showLoading('Đang đồng bộ hàng đợi đóng góp...');
        try {
            const result = await flushContributionOutbox();
            updateOutboxUI(result.remaining);
            if (result.sent > 0 && result.failed === 0 && result.remaining === 0) {
                showToast(`Đã đồng bộ ${result.sent} bản ghi thành công!`, 'success');
            } else if (result.sent > 0 && result.failed > 0) {
                showToast(`Đã đồng bộ ${result.sent} bản ghi, còn ${result.remaining} bản ghi lỗi.`, 'warning');
            } else if (result.failed > 0) {
                showToast(`Không thể đồng bộ ${result.failed} bản ghi. Vui lòng thử lại sau.`, 'error');
            } else {
                showToast('Không có bản ghi nào cần đồng bộ.', 'info');
            }
        } catch {
            showToast('Lỗi khi đồng bộ hàng đợi đóng góp.', 'error');
        } finally {
            hideLoading();
            void getOutboxCount().then(updateOutboxUI).catch(() => {});
        }
    });

    eventBus.on('outbox:change', (remainingCount: number) => {
        updateOutboxUI(typeof remainingCount === 'number' ? remainingCount : 0);
    });

    void getOutboxCount().then(updateOutboxUI).catch(() => updateOutboxUI(0));

    eventBus.on('tab:change', (sectionId: string) => {
        if (sectionId !== 'contribute') {
            stopAllAudio(true);
            closeDeleteConfirmation();
        }
    });
}
