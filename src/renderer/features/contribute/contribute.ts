/**
 * Contribute Feature Controller
 * Handles single/batch vocabulary audio recording, file upload, and Apps Script submission.
 * Replaces inline onclick with Event Delegation on batch queue.
 */

import { APP_CONFIG } from '@/shared/constants/config';
import { showToast } from '@/renderer/components/toast';
import { showLoading, hideLoading } from '@/renderer/components/loading-overlay';
import { AudioWaveVisualizer } from './visualizer';

interface BatchQueueItem {
    name: string;
    blob: Blob;
    size: string;
    type: 'recording' | 'upload';
    audioUrl: string;
}

export const MAX_AUDIO_FILE_SIZE = 10 * 1024 * 1024; // 10MB
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

    // Single Form elements
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

    // Batch Form elements
    const recordBatchBtn = document.getElementById('recordBatchBtn') as HTMLButtonElement | null;
    const uploadBatchBtn = document.getElementById('uploadBatchBtn') as HTMLButtonElement | null;
    const batchAudioInput = document.getElementById('batchAudioInput') as HTMLInputElement | null;
    const batchWave = document.getElementById('batchWave');
    const batchStatus = document.getElementById('batchStatus');
    const batchQueueList = document.getElementById('batchQueueList');
    const submitBatchBtn = document.getElementById('submitBatchBtn');

    // Visualizers
    const singleVisualizer = new AudioWaveVisualizer(audioWave);
    const batchVisualizer = new AudioWaveVisualizer(batchWave);

    // State
    let singleAudioBlob: Blob | null = null;
    let singleAudioUrl: string | null = null;
    let singleAudioPlayer: HTMLAudioElement | null = null;
    let mediaRecorder: MediaRecorder | null = null;
    let audioStream: MediaStream | null = null;
    let isRecording = false;

    let batchQueue: BatchQueueItem[] = [];
    let currentBatchPlayingIndex = -1;
    let batchAudioPlayer: HTMLAudioElement | null = null;

    // Tab Switching
    tabButtons.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab as HTMLElement;
            tabButtons.forEach(t => t.classList.remove('active'));
            target.classList.add('active');

            const tabId = target.dataset.tab;
            if (singleTab) singleTab.style.display = tabId === 'single' ? 'block' : 'none';
            if (batchTab) batchTab.style.display = tabId === 'batch' ? 'block' : 'none';

            stopAllAudio();
        });
    });

    // --- Audio Utilities ---
    function stopAllAudio(): void {
        if (isRecording) {
            stopRecording();
        }
        if (singleAudioPlayer) {
            singleAudioPlayer.pause();
            singleAudioPlayer.currentTime = 0;
            singleVisualizer.stopAnimation();
        }
        stopBatchAudio();
    }

    function sanitizeFilename(text: string): string {
        return text
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd').replace(/Đ/g, 'D')
            .replace(/[^a-zA-Z0-9]/g, '_')
            .toLowerCase();
    }

    function convertBlobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = (reader.result as string).split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    async function sendFile(data: {
        type: string;
        vietnamese?: string;
        xodang?: string;
        readingContent?: string;
        blob: Blob;
        name: string;
        filename: string;
    }): Promise<{ success: boolean; message: string }> {
        const base64Audio = await convertBlobToBase64(data.blob);
        const payload = {
            type: data.type,
            vietnamese: data.vietnamese || '',
            xodang: data.xodang || '',
            readingContent: data.readingContent || data.name || '',
            audioData: base64Audio,
            mimeType: data.blob.type || 'audio/webm',
            filename: `${sanitizeFilename(data.filename || data.name)}_${Date.now()}.${data.blob.type.includes('mp3') ? 'mp3' : 'webm'}`
        };

        await fetch(APP_CONFIG.CONTRIBUTE_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        return { success: true, message: 'File đã được gửi thành công' };
    }

    // --- Recording Logic ---
    async function startRecording(isBatch: boolean = false): Promise<void> {
        stopAllAudio();

        try {
            audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const chunks: Blob[] = [];

            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : 'audio/webm';

            mediaRecorder = new MediaRecorder(audioStream, { mimeType });
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: mimeType });
                if (isBatch) {
                    handleBatchRecordedBlob(blob);
                } else {
                    handleSingleRecordedBlob(blob);
                }
            };

            mediaRecorder.start();
            isRecording = true;

            if (isBatch) {
                if (recordBatchBtn) {
                    recordBatchBtn.innerHTML = '<i class="fas fa-stop"></i> Dừng thu';
                    recordBatchBtn.classList.add('recording');
                }
                batchVisualizer.startAnimation(false);
                if (batchStatus) batchStatus.textContent = 'Đang thu âm... Nhấn "Dừng thu" khi hoàn tất.';
            } else {
                if (recordAudioBtn) {
                    recordAudioBtn.innerHTML = '<i class="fas fa-stop"></i> Dừng thu';
                    recordAudioBtn.classList.add('recording');
                }
                singleVisualizer.startAnimation(false);
                if (audioStatus) audioStatus.textContent = 'Đang thu âm...';
            }
        } catch (err: unknown) {
            console.error('Cannot access microphone:', err);
            showToast('Không thể truy cập microphone. Vui lòng cấp quyền trong cài đặt trình duyệt.', 'error');
        }
    }

    function stopRecording(): void {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
        if (audioStream) {
            audioStream.getTracks().forEach(track => track.stop());
            audioStream = null;
        }
        isRecording = false;

        if (recordAudioBtn) {
            recordAudioBtn.innerHTML = '<i class="fas fa-microphone"></i> Thu âm';
            recordAudioBtn.classList.remove('recording');
        }
        if (recordBatchBtn) {
            recordBatchBtn.innerHTML = '<i class="fas fa-microphone"></i> Bắt đầu thu';
            recordBatchBtn.classList.remove('recording');
        }
        singleVisualizer.stopAnimation();
        batchVisualizer.stopAnimation();
    }

    // --- Single Form Handling ---
    function handleSingleRecordedBlob(blob: Blob): void {
        singleAudioBlob = blob;
        if (singleAudioUrl) URL.revokeObjectURL(singleAudioUrl);
        singleAudioUrl = URL.createObjectURL(blob);

        if (singlePlaybackControls) singlePlaybackControls.style.display = 'flex';
        if (singleAudioFileName) singleAudioFileName.textContent = `Thu_am_${new Date().toLocaleTimeString('vi-VN')}.webm`;
        if (audioStatus) audioStatus.textContent = 'Đã thu âm xong. Nhấn nghe thử hoặc gửi từ vựng.';
    }

    if (recordAudioBtn) {
        recordAudioBtn.addEventListener('click', () => {
            if (isRecording) {
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
            singleAudioPlayer.play();
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

    if (singleDeleteAudioBtn) {
        singleDeleteAudioBtn.addEventListener('click', () => {
            singleAudioBlob = null;
            if (singleAudioUrl) {
                URL.revokeObjectURL(singleAudioUrl);
                singleAudioUrl = null;
            }
            if (singlePlaybackControls) singlePlaybackControls.style.display = 'none';
            if (audioStatus) audioStatus.textContent = '';
            singleVisualizer.stopAnimation();
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
                await sendFile({
                    type: 'vocab',
                    vietnamese,
                    xodang,
                    blob: singleAudioBlob,
                    name: vietnamese,
                    filename: vietnamese
                });

                showToast('Đã gửi từ vựng thành công! Cảm ơn bạn đã đóng góp.', 'success');

                // Reset form
                vietnameseWordInput.value = '';
                xodangWordInput.value = '';
                singleAudioBlob = null;
                if (singlePlaybackControls) singlePlaybackControls.style.display = 'none';
                if (audioStatus) audioStatus.textContent = '';
            } catch (err: unknown) {
                console.error('Error submitting vocabulary:', err);
                showToast('Lỗi khi gửi từ vựng. Vui lòng thử lại sau.', 'error');
            } finally {
                hideLoading();
            }
        });
    }

    // --- Batch Queue Handling (Event Delegation) ---
    function handleBatchRecordedBlob(blob: Blob): void {
        const index = batchQueue.length + 1;
        const name = `Thu_am_${index}_${new Date().toLocaleTimeString('vi-VN').replace(/:/g, '-')}`;
        const item: BatchQueueItem = {
            name,
            blob,
            size: `${(blob.size / 1024).toFixed(1)} KB`,
            type: 'recording',
            audioUrl: URL.createObjectURL(blob)
        };
        batchQueue.push(item);
        updateBatchUI();
        if (batchStatus) batchStatus.textContent = `Đã thêm 1 file thu âm vào hàng đợi (Tổng: ${batchQueue.length} file).`;
    }

    if (recordBatchBtn) {
        recordBatchBtn.addEventListener('click', () => {
            if (isRecording) {
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

                batchQueue.push({
                    name: file.name,
                    blob: file,
                    size: `${(file.size / 1024).toFixed(1)} KB`,
                    type: 'upload',
                    audioUrl: URL.createObjectURL(file)
                });
                addedCount++;
            });

            updateBatchUI();
            batchAudioInput.value = '';
            if (addedCount > 0 && batchStatus) {
                batchStatus.textContent = `Đã thêm ${addedCount} file vào hàng đợi.`;
            }
        });
    }

    function updateBatchUI(): void {
        if (!batchQueueList || !submitBatchBtn) return;

        if (batchQueue.length === 0) {
            batchQueueList.style.display = 'none';
            batchQueueList.replaceChildren();
            submitBatchBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Gửi tất cả';
            return;
        }

        batchQueueList.style.display = 'block';
        submitBatchBtn.innerHTML = `<i class="fas fa-paper-plane"></i> Gửi tất cả (${batchQueue.length})`;

        // Build list items using DOM APIs (Anti-XSS) and Event Delegation data attributes
        const fragment = document.createDocumentFragment();

        batchQueue.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'queue-item';

            const infoDiv = document.createElement('div');
            infoDiv.className = 'queue-item-info';

            const nameDiv = document.createElement('div');
            nameDiv.className = 'queue-item-name';
            nameDiv.textContent = item.name; // Safe against XSS

            const sizeDiv = document.createElement('div');
            sizeDiv.className = 'queue-item-size';
            sizeDiv.textContent = `${item.size} • ${item.type === 'recording' ? 'Thu âm' : 'Tải lên'}`;

            infoDiv.appendChild(nameDiv);
            infoDiv.appendChild(sizeDiv);

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'queue-item-actions';

            const isPlaying = currentBatchPlayingIndex === index;
            const playBtn = document.createElement('button');
            playBtn.className = `queue-play-btn ${isPlaying ? 'playing' : ''}`;
            playBtn.dataset.action = 'play-queue';
            playBtn.dataset.index = String(index);
            playBtn.title = isPlaying ? 'Tạm dừng' : 'Nghe';
            playBtn.innerHTML = `<i class="fas ${isPlaying ? 'fa-pause' : 'fa-play'}"></i>`;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'queue-delete-btn';
            deleteBtn.dataset.action = 'delete-queue';
            deleteBtn.dataset.index = String(index);
            deleteBtn.title = 'Xóa';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';

            actionsDiv.appendChild(playBtn);
            actionsDiv.appendChild(deleteBtn);

            itemDiv.appendChild(infoDiv);
            itemDiv.appendChild(actionsDiv);
            fragment.appendChild(itemDiv);
        });

        batchQueueList.replaceChildren(fragment);
    }

    function stopBatchAudio(): void {
        if (batchAudioPlayer) {
            batchAudioPlayer.pause();
            batchAudioPlayer.currentTime = 0;
        }
        currentBatchPlayingIndex = -1;
        batchVisualizer.stopAnimation();
        updateBatchUI();
    }

    function playBatchQueueItem(index: number): void {
        if (index < 0 || index >= batchQueue.length) return;

        if (currentBatchPlayingIndex === index) {
            stopBatchAudio();
            return;
        }

        stopBatchAudio();
        const item = batchQueue[index];
        currentBatchPlayingIndex = index;

        if (!batchAudioPlayer) {
            batchAudioPlayer = new Audio();
            batchAudioPlayer.onended = () => {
                stopBatchAudio();
            };
        }

        batchAudioPlayer.src = item.audioUrl;
        batchAudioPlayer.play();
        batchVisualizer.startAnimation(true);
        updateBatchUI();
    }

    function deleteQueueItem(index: number): void {
        if (index < 0 || index >= batchQueue.length) return;

        if (currentBatchPlayingIndex === index) {
            stopBatchAudio();
        }

        const removed = batchQueue.splice(index, 1)[0];
        if (removed.audioUrl) URL.revokeObjectURL(removed.audioUrl);

        updateBatchUI();
        showToast(`Đã xóa "${removed.name}" khỏi hàng đợi`, 'info');
    }

    // Attach Event Delegation on batchQueueList
    if (batchQueueList) {
        batchQueueList.addEventListener('click', (e: Event) => {
            const target = e.target as HTMLElement;
            const btn = target.closest('button');
            if (!btn) return;

            const action = btn.dataset.action;
            const index = parseInt(btn.dataset.index || '-1', 10);
            if (index < 0) return;

            if (action === 'play-queue') {
                playBatchQueueItem(index);
            } else if (action === 'delete-queue') {
                deleteQueueItem(index);
            }
        });
    }

    // Expose functions globally for Phase A backwards compatibility
    (window as unknown as { playBatchQueueItem: (i: number) => void }).playBatchQueueItem = playBatchQueueItem;
    (window as unknown as { deleteQueueItem: (i: number) => void }).deleteQueueItem = deleteQueueItem;

    // Submit Batch
    if (submitBatchBtn) {
        submitBatchBtn.addEventListener('click', async () => {
            if (batchQueue.length === 0) {
                showToast('Hàng đợi trống', 'error');
                return;
            }

            stopBatchAudio();
            showLoading(`Đang gửi ${batchQueue.length} file âm thanh...`);

            let successCount = 0;
            for (let i = 0; i < batchQueue.length; i++) {
                const item = batchQueue[i];
                try {
                    await sendFile({
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
            if (successCount === batchQueue.length) {
                showToast(`Đã gửi thành công toàn bộ ${batchQueue.length} file! Cảm ơn bạn.`, 'success');
                batchQueue.forEach(item => URL.revokeObjectURL(item.audioUrl));
                batchQueue = [];
                updateBatchUI();
                if (batchStatus) batchStatus.textContent = 'Chưa có file nào trong hàng đợi';
            } else {
                showToast(`Đã gửi ${successCount}/${batchQueue.length} file thành công.`, 'info');
            }
        });
    }
}
