import { fetchDictionaryData } from '@/services/sheets.service';
import { getSuggestions, searchDictionary, type DictionaryEntry, type SearchDirection } from '@/services/dictionary.service';
import { renderWordCards } from './word-card';
import { showToast } from '@/components/toast';
import { showLoading, hideLoading } from '@/components/loading-overlay';
import { startSmartVietnameseSpeech, type SmartSpeechHandle, type SpeechFallbackInfo } from '@/services/speech.service';
import {
    downloadOfflineAudio,
    filterValidDriveIds,
    hasOfflineAudioUpdates,
    shouldAutoDownloadOfflineAudio
} from '@/services/offline-sync.service';
import { getLucideIcon } from '@/utils/icons';
import { eventBus } from '@/utils/event-bus';

let dictionaryData: DictionaryEntry[] = [];

export function renderNoResult(resultDiv: HTMLElement, keyword: string): void {
    const noResultDiv = document.createElement('div');
    noResultDiv.className = 'no-result';

    const iconDiv = document.createElement('div');
    iconDiv.className = 'no-result-icon';
    iconDiv.innerHTML = getLucideIcon('alert-circle', 'lucide-icon', 32);
    iconDiv.style.cssText = 'margin-bottom: 0.75rem; color: var(--color-warning); display: flex; justify-content: center;';

    const mainP = document.createElement('p');
    mainP.append('Không tìm thấy kết quả phù hợp cho "');
    const strong = document.createElement('strong');
    strong.textContent = keyword;
    mainP.append(strong);
    mainP.append('"');

    const subP = document.createElement('p');
    subP.style.cssText = 'font-size: 0.9rem; margin-top: 0.5rem; color: var(--text-secondary);';
    subP.textContent = 'Thử đổi hướng dịch hoặc kiểm tra lại chính tả.';

    noResultDiv.appendChild(iconDiv);
    noResultDiv.appendChild(mainP);
    noResultDiv.appendChild(subP);

    resultDiv.replaceChildren(noResultDiv);
}

export async function initHome(): Promise<void> {
    const searchForm = document.getElementById('searchForm') as HTMLFormElement | null;
    const wordInput = document.getElementById('word') as HTMLInputElement | null;
    const directionSelect = document.getElementById('direction') as HTMLSelectElement | null;
    const speechBtn = document.getElementById('speechButton');
    const resultDiv = document.getElementById('result');
    const errorDiv = document.getElementById('error');
    const searchStatus = document.getElementById('searchStatus');
    const suggestionsList = document.getElementById('suggestions');

    const dictCount = document.getElementById('dictionary-count');
    const statWords = document.getElementById('stat-words');
    const statAudio = document.getElementById('stat-audio');
    const statExamples = document.getElementById('stat-examples');
    const statQuestions = document.getElementById('stat-questions');

    const btnDownload = document.getElementById('btn-download-offline') as HTMLButtonElement | null;
    const progressContainer = document.getElementById('download-progress-container');
    const progressBar = document.getElementById('download-progress-bar');
    const progressText = document.getElementById('download-progress-text');
    const downloadStatus = document.getElementById('download-status');

    function updateSuggestions(query: string, direction: SearchDirection): void {
        if (!suggestionsList) return;
        const trimmed = query.trim();
        const terms = trimmed
            ? getSuggestions(trimmed, direction, dictionaryData, 10)
            : dictionaryData
                .slice(0, 50)
                .map(entry => (direction === 'viet_to_ethnic' ? entry.viet : entry.ethnic))
                .filter(Boolean);

        const fragment = document.createDocumentFragment();
        terms.forEach(term => {
            const opt = document.createElement('option');
            opt.value = term;
            fragment.appendChild(opt);
        });
        suggestionsList.replaceChildren(fragment);
    }

    try {
        showLoading('Đang tải dữ liệu từ điển...');
        dictionaryData = await fetchDictionaryData();

        if (dictCount) dictCount.textContent = `${dictionaryData.length}+ từ vựng chuẩn`;
        if (statWords) statWords.textContent = `${dictionaryData.length}+`;

        const audioCount = filterValidDriveIds(dictionaryData.map(d => d.driveId)).length;
        if (statAudio) statAudio.textContent = `${audioCount}+`;

        const exampleCount = dictionaryData.filter(d => (d.exampleViet || d.exampleEthnic) && d.exampleViet !== 'null').length;
        if (statExamples) statExamples.textContent = `${exampleCount}+`;
        if (statQuestions) statQuestions.textContent = '100+';

        updateSuggestions('', (directionSelect?.value as SearchDirection) || 'viet_to_ethnic');

        if (btnDownload && downloadStatus) {
            checkOfflineAudioState();
        }
    } catch (err: unknown) {
        console.error('Failed to load dictionary:', err);
        showToast('Không thể tải dữ liệu từ điển từ máy chủ.', 'error');
        if (errorDiv) {
            errorDiv.textContent = 'Lỗi nạp dữ liệu. Vui lòng kiểm tra kết nối mạng.';
            errorDiv.hidden = false;
        }
    } finally {
        hideLoading();
    }

    function executeSearch(query: string, direction: SearchDirection): void {
        if (!resultDiv) return;
        const trimmed = query.trim();

        if (!trimmed) {
            if (searchStatus) searchStatus.textContent = '';
            resultDiv.innerHTML = `
                <div class="no-result">
                    <div class="no-result-icon" style="margin-bottom: 0.75rem; color: var(--text-tertiary); display: flex; justify-content: center;">
                        ${getLucideIcon('search', 'lucide-icon', 32)}
                    </div>
                    <p>Nhập từ cần tra cứu và nhấn nút "Tra cứu"</p>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem; color: var(--text-secondary);">Hoặc sử dụng tính năng nhận diện giọng nói qua micro</p>
                </div>
            `;
            return;
        }

        const results = searchDictionary(trimmed, direction, dictionaryData);

        if (results.length === 0) {
            if (searchStatus) searchStatus.textContent = `Không tìm thấy từ: "${trimmed}"`;
            renderNoResult(resultDiv, trimmed);
            return;
        }

        if (searchStatus) {
            searchStatus.textContent = `Tìm thấy ${results.length} kết quả cho "${trimmed}":`;
        }
        renderWordCards(resultDiv, results, direction);
    }

    if (searchForm && wordInput && directionSelect) {
        searchForm.addEventListener('submit', (e: Event) => {
            e.preventDefault();
            executeSearch(wordInput.value, directionSelect.value as SearchDirection);
        });

        let debounceTimer: ReturnType<typeof setTimeout>;
        wordInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            const direction = directionSelect.value as SearchDirection;
            updateSuggestions(wordInput.value, direction);

            const trimmed = wordInput.value.trim();
            if (trimmed.length === 0) {
                executeSearch('', direction);
                return;
            }
            if (trimmed.length >= 2) {
                debounceTimer = setTimeout(() => {
                    executeSearch(wordInput.value, directionSelect.value as SearchDirection);
                }, 300);
            }
        });

        directionSelect.addEventListener('change', () => {
            const direction = directionSelect.value as SearchDirection;
            updateSuggestions(wordInput.value, direction);
            if (wordInput.value.trim().length > 0) {
                executeSearch(wordInput.value, direction);
            }
        });

        const diacriticBtns = document.querySelectorAll('.diacritic-btn');
        diacriticBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const char = (btn as HTMLElement).dataset.char || btn.textContent || '';
                const start = wordInput.selectionStart ?? wordInput.value.length;
                const end = wordInput.selectionEnd ?? wordInput.value.length;
                const val = wordInput.value;
                wordInput.value = val.substring(0, start) + char + val.substring(end);
                wordInput.focus();
                const newPos = start + char.length;
                wordInput.setSelectionRange(newPos, newPos);
                wordInput.dispatchEvent(new Event('input'));
            });
        });

        const suggestChips = document.querySelectorAll('.suggest-chip');
        suggestChips.forEach(chip => {
            chip.addEventListener('click', () => {
                const query = (chip as HTMLElement).dataset.query || chip.textContent || '';
                wordInput.value = query;
                wordInput.focus();
                executeSearch(query, directionSelect.value as SearchDirection);
            });
        });
    }

    const voiceFallbackPanel = document.getElementById('voiceFallbackPanel') as HTMLElement | null;
    const voiceFallbackMessage = document.getElementById('voiceFallbackMessage') as HTMLElement | null;
    const voiceWasmProgress = document.getElementById('voiceWasmProgress') as HTMLElement | null;
    const voiceWasmProgressBar = document.getElementById('voiceWasmProgressBar') as HTMLElement | null;
    const voiceWasmProgressText = document.getElementById('voiceWasmProgressText') as HTMLElement | null;
    const btnVoiceKeyboard = document.getElementById('btnVoiceKeyboard') as HTMLButtonElement | null;
    const btnVoiceWasm = document.getElementById('btnVoiceWasm') as HTMLButtonElement | null;
    const btnCloseVoiceFallback = document.getElementById('btnCloseVoiceFallback') as HTMLButtonElement | null;

    let activeSpeechHandle: SmartSpeechHandle | null = null;

    const resetSpeechButton = (): void => {
        if (!speechBtn) return;
        speechBtn.classList.remove('recording');
        speechBtn.setAttribute('aria-pressed', 'false');
    };

    const showVoiceFallbackPanel = (info: SpeechFallbackInfo): void => {
        if (!wordInput) return;
        wordInput.focus();
        if (!voiceFallbackPanel) return;
        if (voiceFallbackMessage) {
            voiceFallbackMessage.textContent = info.isWasmCached
                ? 'Không nhận được giọng nói từ trình duyệt. Hãy bấm mic trên bàn phím (Gboard / iOS / Win+H / Fn — 0 MB) hoặc chạy AI Whisper WASM đã lưu offline.'
                : 'Trình duyệt hoặc mạng chưa hỗ trợ đọc trực tiếp. Hãy bấm mic trên bàn phím (Gboard / iOS / Win+H / Fn — 0 MB), hoặc tải AI Whisper WASM (~45MB) làm phương án dự phòng offline.';
        }
        if (btnVoiceWasm) {
            btnVoiceWasm.disabled = !info.canUseWasm || (!info.isOnline && !info.isWasmCached);
            const labelSpan = btnVoiceWasm.querySelector('span');
            if (labelSpan) {
                labelSpan.textContent = info.isWasmCached
                    ? 'Chạy AI Whisper WASM (đã lưu)'
                    : 'Tải & chạy AI Whisper WASM (~45MB)';
            }
        }
        voiceFallbackPanel.hidden = false;
    };

    const runSpeechCapture = async (forceWasm: boolean): Promise<void> => {
        if (!speechBtn || !wordInput || !directionSelect) return;
        if (activeSpeechHandle) {
            activeSpeechHandle.stop();
            activeSpeechHandle = null;
            resetSpeechButton();
            return;
        }

        let starting = true;
        const handle = await startSmartVietnameseSpeech({
            forceWasm,
            onTierSelected: (tier) => {
                if (voiceFallbackPanel && tier !== 'keyboard') {
                    voiceFallbackPanel.hidden = true;
                }
            },
            onStatus: (message) => {
                showToast(message, 'info');
            },
            onStart: (tier) => {
                speechBtn.classList.add('recording');
                speechBtn.setAttribute('aria-pressed', 'true');
                const toastMessage = tier === 'on-device'
                    ? 'Đang nghe tiếng Việt offline (trên thiết bị)...'
                    : tier === 'wasm'
                        ? 'Đang ghi âm AI offline... Nhấn micro lần nữa để dừng'
                        : 'Đang lắng nghe... Hãy nói từ cần tra';
                showToast(toastMessage, 'info');
            },
            onProcessing: () => {
                showToast('Đang chuyển giọng nói thành chữ...', 'info');
            },
            onResult: (recognizedText: string) => {
                starting = false;
                activeSpeechHandle = null;
                resetSpeechButton();
                wordInput.value = recognizedText;
                executeSearch(recognizedText, directionSelect.value as SearchDirection);
            },
            onError: (err: string) => {
                starting = false;
                activeSpeechHandle = null;
                resetSpeechButton();
                showToast(`Lỗi nhận diện giọng nói: ${err}`, 'error');
            },
            onEnd: () => {
                starting = false;
                activeSpeechHandle = null;
                resetSpeechButton();
            },
            onFallbackKeyboard: (info) => {
                starting = false;
                activeSpeechHandle = null;
                resetSpeechButton();
                showVoiceFallbackPanel(info);
            }
        });

        if (starting && handle.tier !== 'keyboard') {
            activeSpeechHandle = handle;
        }
    };

    if (speechBtn && wordInput && directionSelect) {
        speechBtn.addEventListener('click', () => {
            void runSpeechCapture(false);
        });
    }

    if (btnVoiceKeyboard && wordInput) {
        btnVoiceKeyboard.addEventListener('click', () => {
            if (voiceFallbackPanel) voiceFallbackPanel.hidden = true;
            wordInput.focus();
            showToast('Nhấn nút micro trên bàn phím điện thoại hoặc Win+H / Fn để nhập giọng nói.', 'info');
        });
    }

    if (btnCloseVoiceFallback && voiceFallbackPanel) {
        btnCloseVoiceFallback.addEventListener('click', () => {
            voiceFallbackPanel.hidden = true;
        });
    }

    if (btnVoiceWasm) {
        btnVoiceWasm.addEventListener('click', async () => {
            btnVoiceWasm.disabled = true;
            if (voiceWasmProgress) voiceWasmProgress.hidden = false;
            if (voiceWasmProgressBar) voiceWasmProgressBar.style.width = '0%';
            if (voiceWasmProgressText) voiceWasmProgressText.textContent = 'Đang khởi tạo AI Whisper WASM (~45MB)...';

            try {
                const { preloadWhisperModel } = await import('@/services/whisper-stt.service');
                await preloadWhisperModel((percent: number) => {
                    if (voiceWasmProgressBar) voiceWasmProgressBar.style.width = `${percent}%`;
                    if (voiceWasmProgressText) voiceWasmProgressText.textContent = `Đang tải mô hình AI tiếng Việt: ${percent}%`;
                });
                if (voiceWasmProgress) voiceWasmProgress.hidden = true;
                if (voiceFallbackPanel) voiceFallbackPanel.hidden = true;
                btnVoiceWasm.disabled = false;
                await runSpeechCapture(true);
            } catch (err: unknown) {
                btnVoiceWasm.disabled = false;
                if (voiceWasmProgress) voiceWasmProgress.hidden = true;
                const message = err instanceof Error ? err.message : 'Không thể tải mô hình AI Whisper WASM.';
                showToast(message, 'error');
            }
        });
    }

    eventBus.on('tab:change', (sectionId: string) => {
        if (sectionId !== 'home' && activeSpeechHandle) {
            activeSpeechHandle.stop();
            activeSpeechHandle = null;
            resetSpeechButton();
        }
    });

    async function runOfflineAudioSync(isAuto: boolean): Promise<void> {
        if (!btnDownload || !progressContainer || !progressBar || !progressText || !downloadStatus) return;

        btnDownload.disabled = true;
        btnDownload.style.opacity = '0.7';
        btnDownload.innerHTML = `${getLucideIcon('rotate-ccw', 'lucide-icon', 18)} <span>${isAuto ? 'Đang tự động đồng bộ âm thanh...' : 'Đang chuẩn bị dữ liệu...'}</span>`;
        progressContainer.style.display = 'block';

        const driveIds = filterValidDriveIds(dictionaryData.map(d => d.driveId));
        const result = await downloadOfflineAudio(driveIds, (loaded: number, total: number, percent: number) => {
            progressBar.style.width = `${percent}%`;
            progressText.textContent = `Đang tải: ${loaded}/${total} (${percent}%)`;
        });

        btnDownload.style.opacity = '1';
        if (result.total > 0 && result.cached >= result.total) {
            btnDownload.innerHTML = `${getLucideIcon('check-circle', 'lucide-icon', 18)} <span>Đã tải offline thành công</span>`;
            btnDownload.style.background = 'var(--color-primary)';
            btnDownload.disabled = true;
            downloadStatus.textContent = 'Tải hoàn tất! Bạn có thể nghe phát âm khi không có mạng.';
            const card = document.querySelector('.offline-download-card') as HTMLElement | null;
            if (card) card.style.display = 'none';
            if (!isAuto) {
                showToast('Tải thành công âm thanh offline!', 'success');
            }
        } else {
            btnDownload.disabled = false;
            btnDownload.innerHTML = `${getLucideIcon('download', 'lucide-icon', 18)} <span>Thử tải lại (${result.cached}/${result.total})</span>`;
            downloadStatus.textContent = `Đã tải được ${result.cached}/${result.total} file âm thanh. Vui lòng thử lại khi mạng ổn định.`;
            if (!isAuto) {
                showToast(`Chỉ tải được ${result.cached}/${result.total} file âm thanh.`, 'warning');
            }
        }
    }

    async function checkOfflineAudioState(): Promise<void> {
        if (!btnDownload || !downloadStatus) return;
        const driveIds = filterValidDriveIds(dictionaryData.map(d => d.driveId));
        const status = await hasOfflineAudioUpdates(driveIds);

        if (status.total > 0 && !status.needsSync) {
            btnDownload.innerHTML = `${getLucideIcon('check-circle', 'lucide-icon', 18)} <span>Đã tải offline thành công</span>`;
            btnDownload.style.background = 'var(--color-primary)';
            btnDownload.disabled = true;
            downloadStatus.textContent = `Đã lưu sẵn ${status.cached}/${status.total} file âm thanh. Sẵn sàng học offline 100%!`;
            const card = document.querySelector('.offline-download-card') as HTMLElement | null;
            if (card) card.style.display = 'none';
            return;
        }

        if (status.cached > 0) {
            btnDownload.innerHTML = `${getLucideIcon('download', 'lucide-icon', 18)} <span>Cập nhật âm thanh (${status.cached}/${status.total})</span>`;
            downloadStatus.textContent = `Đã lưu ${status.cached}/${status.total} file âm thanh mới nhất.`;
        }

        if (status.total > 0 && shouldAutoDownloadOfflineAudio()) {
            const scheduleIdle = (window as unknown as { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback;
            if (typeof scheduleIdle === 'function') {
                scheduleIdle(() => {
                    void runOfflineAudioSync(true);
                });
            } else {
                setTimeout(() => {
                    void runOfflineAudioSync(true);
                }, 1200);
            }
        }
    }

    if (btnDownload && progressContainer && progressBar && progressText && downloadStatus) {
        btnDownload.addEventListener('click', () => {
            void runOfflineAudioSync(false);
        });
    }
}

export function getLoadedDictionary(): DictionaryEntry[] {
    return dictionaryData;
}
