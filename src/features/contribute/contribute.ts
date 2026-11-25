import '@/styles/features/contribute.css';
import { showToast } from '@/components/toast';
import { showLoading, hideLoading } from '@/components/loading-overlay';
import { eventBus } from '@/utils/event-bus';
import { sendContribution } from '@/services/offline-sync.service';
import { getLucideIcon } from '@/utils/icons';
import { AudioWaveVisualizer } from './visualizer';
import { AudioRecorder } from './recorder';
import { BatchQueueManager } from './batch-queue';

export const MAX_AUDIO_FILE_SIZE = 10 * 1024 * 1024;
export const ALLOWED_AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a', '.webm', '.aac', '.flac'];

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

export function initContribute(): void {
    const singleTab = document.getElementById('singleTab');
    const batchTab = document.getElementById('batchTab');
    const tabButtons = document.querySelectorAll('.contribute-tab');

    const vietnameseWordInput = document.getElementById('vietnameseWord') as HTMLInputElement | null;
    const xodangWordInput = document.getElementById('xodangWord') as HTMLInputElement | null;
    const recordAudioBtn = document.getElementById('recordAudioBtn') as HTMLButtonElement | null;
    const uploadAudioBtn = document.getElementById('uploadAudioBtn') as HTMLButtonElement | null;
    const audioFileInput = document.getElementById('audioFileInput') as HTMLInputElement | null;
    const audioWave = document.getElementById('audioWave');
    const singlePlaybackControls = document.getElementById('singlePlaybackControls');
    const singlePlayAudioBtn = document.getElementById('singlePlayAudioBtn');
    const singleStopAudioBtn = document.getElementById('singleStopAudioBtn');
    const singleDeleteAudioBtn = document.getElementById('singleDeleteAudioBtn');
    const singleAudioFileName = document.getElementById('singleAudioFileName');
    const audioStatus = document.getElementById('audioStatus');
    const submitSingleBtn = document.getElementById('submitSingleBtn');

    const recordBatchBtn = document.getElementById('recordBatchBtn') as HTMLButtonElement | null;
    const uploadBatchBtn = document.getElementById('uploadBatchBtn') as HTMLButtonElement | null;
    const batchAudioInput = document.getElementById('batchAudioInput') as HTMLInputElement | null;
    const batchWave = document.getElementById('batchWave');
    const batchStatus = document.getElementById('batchStatus');
    const batchQueueList = document.getElementById('batchQueueList');
    const submitBatchBtn = document.getElementById('submitBatchBtn');

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

    const batchQueue = new BatchQueueManager(() => {
        updateBatchUI();
    });

    function clearSingleAudio(): void {
        singleAudioBlob = null;
        if (singleAudioUrl) {
            URL.revokeObjectURL(singleAudioUrl);
            singleAudioUrl = null;
        }
        if (singlePlaybackControls) singlePlaybackControls.style.display = 'none';
        if (audioStatus) audioStatus.textContent = '';
        singleVisualizer.stopAnimation();
    }

    function stopAllAudio(): void {
        if (recorder.isRecording()) {
            stopRecording();
        }
        if (singleAudioPlayer) {
            singleAudioPlayer.pause();
            singleAudioPlayer.currentTime = 0;
            singleVisualizer.stopAnimation();
        }
        batchQueue.stopPlayback();
        batchVisualizer.stopAnimation();
    }

    function stopRecording(): void {
        recorder.stop();
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

    async function startRecording(isBatch: boolean = false): Promise<void> {
        stopAllAudio();

        try {
            const stream = await recorder.start(({ blob }) => {
                if (isBatch) {
                    handleBatchRecordedBlob(blob);
                } else {
                    handleSingleRecordedBlob(blob);
                }
            });

            if (isBatch) {
                if (recordBatchBtn) {
                    recordBatchBtn.innerHTML = `${getLucideIcon('square', 'lucide-icon', 18)}<span class="btn-text">Dừng thu</span>`;
                    recordBatchBtn.classList.add('recording');
                }
                batchVisualizer.startAnimation(false, stream);
                if (batchStatus) batchStatus.textContent = 'Đang thu âm... Nhấn "Dừng thu" khi hoàn tất.';
            } else {
                if (recordAudioBtn) {
                    recordAudioBtn.innerHTML = `${getLucideIcon('square', 'lucide-icon', 18)}<span class="btn-text">Dừng thu</span>`;
                    recordAudioBtn.classList.add('recording');
                }
                singleVisualizer.startAnimation(false, stream);
                if (audioStatus) audioStatus.textContent = 'Đang thu âm...';
            }
        } catch (err: unknown) {
            console.error('Cannot access microphone:', err);
            showToast('Không thể truy cập microphone. Vui lòng cấp quyền trong cài đặt trình duyệt.', 'error');
        }
    }

    function handleSingleRecordedBlob(blob: Blob): void {
        singleAudioBlob = blob;
        if (singleAudioUrl) URL.revokeObjectURL(singleAudioUrl);
        singleAudioUrl = URL.createObjectURL(blob);

        if (singlePlaybackControls) singlePlaybackControls.style.display = 'flex';
        if (singleAudioFileName) singleAudioFileName.textContent = `Thu_am_${new Date().toLocaleTimeString('vi-VN')}.webm`;
        if (audioStatus) audioStatus.textContent = 'Đã thu âm xong. Nhấn nghe thử hoặc gửi từ vựng.';
    }

    function handleBatchRecordedBlob(blob: Blob): void {
        const index = batchQueue.length + 1;
        const name = `Thu_am_${index}_${new Date().toLocaleTimeString('vi-VN').replace(/:/g, '-')}`;
        batchQueue.add({
            name,
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
            playBtn.className = `queue-play-btn ${isPlaying ? 'playing' : ''}`;
            playBtn.dataset.action = 'play-queue';
            playBtn.dataset.index = String(index);
            playBtn.title = isPlaying ? 'Tạm dừng' : 'Nghe';
            playBtn.innerHTML = getLucideIcon(isPlaying ? 'pause' : 'play', 'lucide-icon', 16);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'queue-delete-btn';
            deleteBtn.dataset.action = 'delete-queue';
            deleteBtn.dataset.index = String(index);
            deleteBtn.title = 'Xóa';
            deleteBtn.innerHTML = getLucideIcon('trash-2', 'lucide-icon', 16);

            actionsDiv.appendChild(playBtn);
            actionsDiv.appendChild(deleteBtn);

            itemDiv.appendChild(infoDiv);
            itemDiv.appendChild(actionsDiv);
            fragment.appendChild(itemDiv);
        });

        batchQueueList.replaceChildren(fragment);
    }

    function openDeleteConfirmation(type: 'single' | 'batch', index = -1): void {
        pendingDeleteType = type;
        pendingDeleteIndex = index;
        if (deleteAudioModal) {
            deleteAudioModal.style.display = 'flex';
            btnConfirmDeleteAudio?.focus();
        }
    }

    function closeDeleteConfirmation(): void {
        pendingDeleteType = null;
        pendingDeleteIndex = -1;
        if (deleteAudioModal) deleteAudioModal.style.display = 'none';
    }

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

            stopAllAudio();
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
            if (!singleAudioPlayer) {
                singleAudioPlayer = new Audio();
                singleAudioPlayer.onended = () => {
                    singleVisualizer.stopAnimation();
                };
            }
            singleAudioPlayer.src = singleAudioUrl;
            const playPromise = singleAudioPlayer.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(() => {
                    singleVisualizer.stopAnimation();
                });
            }
            singleVisualizer.startAnimation(true);
        });
    }

    if (singleStopAudioBtn) {
        singleStopAudioBtn.addEventListener('click', () => {
            if (singleAudioPlayer) {
                singleAudioPlayer.pause();
                singleAudioPlayer.currentTime = 0;
            }
            singleVisualizer.stopAnimation();
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
            showToast(`Đã xóa "${removed?.name || 'file'}" khỏi hàng đợi`, 'info');
        }
        closeDeleteConfirmation();
    });

    if (singleDeleteAudioBtn) {
        singleDeleteAudioBtn.addEventListener('click', () => {
            openDeleteConfirmation('single');
        });
    }

    if (submitSingleBtn && vietnameseWordInput && xodangWordInput) {
        submitSingleBtn.addEventListener('click', async () => {
            const vietnamese = vietnameseWordInput.value.trim();
            const xodang = xodangWordInput.value.trim();

            if (!vietnamese || !xodang) {
                showToast('Vui lòng nhập đầy đủ từ tiếng Việt và tiếng Xơ Đăng', 'error');
                return;
            }

            if (!singleAudioBlob) {
                showToast('Vui lòng thu âm hoặc tải file âm thanh lên', 'error');
                return;
            }

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

                showToast('Đã gửi từ vựng thành công! Cảm ơn bạn đã đóng góp.', 'success');
                vietnameseWordInput.value = '';
                xodangWordInput.value = '';
                clearSingleAudio();
            } catch (err: unknown) {
                console.error('Error submitting vocabulary:', err);
                showToast('Lỗi khi gửi từ vựng. Vui lòng thử lại sau.', 'error');
            } finally {
                hideLoading();
            }
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
        batchQueueList.addEventListener('click', (e: Event) => {
            const target = e.target as HTMLElement;
            const btn = target.closest('button');
            if (!btn) return;

            const action = btn.dataset.action;
            const index = parseInt(btn.dataset.index || '-1', 10);
            if (index < 0) return;

            if (action === 'play-queue') {
                const started = batchQueue.play(index, () => batchVisualizer.stopAnimation());
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
            const items = batchQueue.getItems();
            if (items.length === 0) {
                showToast('Hàng đợi trống', 'error');
                return;
            }

            stopAllAudio();
            showLoading(`Đang gửi ${items.length} file âm thanh...`);

            let successCount = 0;
            for (const item of items) {
                try {
                    await sendContribution({
                        type: 'voice',
                        readingContent: item.name,
                        blob: item.blob,
                        name: item.name,
                        filename: item.name
                    });
                    successCount++;
                } catch (err: unknown) {
                    console.error(`Error uploading item ${item.name}:`, err);
                }
            }

            hideLoading();
            if (successCount === items.length) {
                showToast(`Đã gửi thành công toàn bộ ${items.length} file! Cảm ơn bạn.`, 'success');
                batchQueue.clear();
                if (batchStatus) batchStatus.textContent = 'Chưa có file nào trong hàng đợi';
            } else {
                showToast(`Đã gửi ${successCount}/${items.length} file thành công.`, 'info');
            }
        });
    }

    eventBus.on('tab:change', (sectionId: string) => {
        if (sectionId !== 'contribute') {
            stopAllAudio();
        }
    });
}
