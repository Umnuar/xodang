/**
 * Home Feature Controller
 * Manages dictionary search, stats counters, voice recognition, and offline audio downloads.
 */

import { fetchDictionaryData } from '@/renderer/services/sheets.service';
import { searchDictionary, type DictionaryEntry, type SearchDirection } from '@/renderer/services/dictionary.service';
import { renderWordCards } from './word-card';
import { showToast } from '@/renderer/components/toast';
import { showLoading, hideLoading } from '@/renderer/components/loading-overlay';
import { isSpeechRecognitionSupported, startSpeechRecognition } from '@/renderer/services/speech.service';
import { downloadOfflineAudio, getOfflineAudioStatus } from '@/renderer/services/offline-sync.service';

let dictionaryData: DictionaryEntry[] = [];

export async function initHome(): Promise<void> {
    const searchForm = document.getElementById('searchForm') as HTMLFormElement | null;
    const wordInput = document.getElementById('word') as HTMLInputElement | null;
    const directionSelect = document.getElementById('direction') as HTMLSelectElement | null;
    const speechBtn = document.getElementById('speechButton');
    const resultDiv = document.getElementById('result');
    const errorDiv = document.getElementById('error');
    const searchStatus = document.getElementById('searchStatus');
    const suggestionsList = document.getElementById('suggestions');

    // Stats elements
    const dictCount = document.getElementById('dictionary-count');
    const statWords = document.getElementById('stat-words');
    const statAudio = document.getElementById('stat-audio');
    const statExamples = document.getElementById('stat-examples');
    const statQuestions = document.getElementById('stat-questions');

    // Offline download elements
    const btnDownload = document.getElementById('btn-download-offline') as HTMLButtonElement | null;
    const progressContainer = document.getElementById('download-progress-container');
    const progressBar = document.getElementById('download-progress-bar');
    const progressText = document.getElementById('download-progress-text');
    const downloadStatus = document.getElementById('download-status');

    // Load dictionary data
    try {
        showLoading('Đang tải dữ liệu từ điển...');
        dictionaryData = await fetchDictionaryData();

        // Update stats
        if (dictCount) dictCount.textContent = `${dictionaryData.length}+ từ vựng chuẩn`;
        if (statWords) statWords.textContent = `${dictionaryData.length}+`;

        const audioCount = dictionaryData.filter(d => d.driveId && d.driveId.trim() !== '' && d.driveId !== 'null').length;
        if (statAudio) statAudio.textContent = `${audioCount}+`;

        const exampleCount = dictionaryData.filter(d => (d.exampleViet || d.exampleEthnic) && d.exampleViet !== 'null').length;
        if (statExamples) statExamples.textContent = `${exampleCount}+`;
        if (statQuestions) statQuestions.textContent = '100+';

        // Autocomplete
        if (suggestionsList) {
            const fragment = document.createDocumentFragment();
            const sampleWords = dictionaryData.slice(0, 100);
            sampleWords.forEach(entry => {
                if (entry.viet) {
                    const opt = document.createElement('option');
                    opt.value = entry.viet;
                    fragment.appendChild(opt);
                }
            });
            suggestionsList.appendChild(fragment);
        }

        // Check offline audio status
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

    // Search handler
    function executeSearch(query: string, direction: SearchDirection): void {
        if (!resultDiv) return;
        const trimmed = query.trim();

        if (!trimmed) {
            if (searchStatus) searchStatus.textContent = '';
            resultDiv.innerHTML = `
                <div class="no-result">
                    <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem; color: #ccc; display: block;"></i>
                    <p>Nhập từ cần tra cứu và nhấn nút "Tra cứu"</p>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem;">Hoặc sử dụng tính năng nhận diện giọng nói</p>
                </div>
            `;
            return;
        }

        const results = searchDictionary(trimmed, direction, dictionaryData);

        if (results.length === 0) {
            if (searchStatus) searchStatus.textContent = `Không tìm thấy từ: "${trimmed}"`;
            resultDiv.innerHTML = `
                <div class="no-result">
                    <i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 1rem; color: #f39c12; display: block;"></i>
                    <p>Không tìm thấy kết quả phù hợp cho "<strong>${trimmed.replace(/</g, '&lt;')}</strong>"</p>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem;">Thử đổi hướng dịch hoặc kiểm tra lại chính tả.</p>
                </div>
            `;
            return;
        }

        if (searchStatus) {
            searchStatus.textContent = `Tìm thấy ${results.length} kết quả cho "${trimmed}":`;
        }
        renderWordCards(resultDiv, results, direction);
    }

    // Bind form submit
    if (searchForm && wordInput && directionSelect) {
        searchForm.addEventListener('submit', (e: Event) => {
            e.preventDefault();
            executeSearch(wordInput.value, directionSelect.value as SearchDirection);
        });

        // Live input search with debouncing
        let debounceTimer: ReturnType<typeof setTimeout>;
        wordInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                if (wordInput.value.trim().length >= 2) {
                    executeSearch(wordInput.value, directionSelect.value as SearchDirection);
                }
            }, 300);
        });
    }

    // Speech Recognition Button
    if (speechBtn && wordInput && directionSelect) {
        if (!isSpeechRecognitionSupported()) {
            speechBtn.style.display = 'none';
        } else {
            speechBtn.addEventListener('click', () => {
                speechBtn.classList.add('recording');
                showToast('Đang lắng nghe... Hãy nói từ cần tra', 'info');

                startSpeechRecognition(
                    (recognizedText: string) => {
                        speechBtn.classList.remove('recording');
                        wordInput.value = recognizedText;
                        executeSearch(recognizedText, directionSelect.value as SearchDirection);
                    },
                    (err: string) => {
                        speechBtn.classList.remove('recording');
                        showToast(`Lỗi nhận diện giọng nói: ${err}`, 'error');
                    }
                );
            });
        }
    }

    // Offline Audio Status & Downloader
    async function checkOfflineAudioState(): Promise<void> {
        if (!btnDownload || !downloadStatus) return;
        const driveIds = dictionaryData.map(d => d.driveId).filter((id): id is string => Boolean(id && id.trim() !== ''));
        const status = await getOfflineAudioStatus(driveIds);

        if (status.total > 0 && status.cached >= status.total) {
            btnDownload.innerHTML = '<i class="fas fa-check-circle"></i> Đã tải offline thành công';
            btnDownload.style.background = '#27ae60';
            btnDownload.disabled = true;
            downloadStatus.textContent = `Đã lưu sẵn ${status.cached}/${status.total} file âm thanh. Sẵn sàng học offline 100%!`;
            const card = document.querySelector('.offline-download-card') as HTMLElement | null;
            if (card) card.style.display = 'none';
        } else if (status.cached > 0) {
            btnDownload.innerHTML = `<i class="fas fa-download"></i> Tiếp tục tải offline (${status.cached}/${status.total})`;
            downloadStatus.textContent = `Đã tải được ${status.cached}/${status.total} file âm thanh.`;
        }
    }

    if (btnDownload && progressContainer && progressBar && progressText && downloadStatus) {
        btnDownload.addEventListener('click', async () => {
            btnDownload.disabled = true;
            btnDownload.style.opacity = '0.7';
            btnDownload.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang chuẩn bị dữ liệu...';
            progressContainer.style.display = 'block';

            const driveIds = dictionaryData.map(d => d.driveId).filter((id): id is string => Boolean(id && id.trim() !== ''));

            await downloadOfflineAudio(driveIds, (loaded: number, total: number, percent: number) => {
                progressBar.style.width = `${percent}%`;
                progressText.textContent = `Đang tải: ${loaded}/${total} (${percent}%)`;
            });

            btnDownload.innerHTML = '<i class="fas fa-check-circle"></i> Đã tải offline thành công';
            btnDownload.style.background = '#27ae60';
            btnDownload.disabled = true;
            downloadStatus.textContent = 'Tải hoàn tất! Bạn có thể nghe phát âm khi không có mạng.';
            showToast('Tải thành công âm thanh offline!', 'success');
        });
    }
}

export function getLoadedDictionary(): DictionaryEntry[] {
    return dictionaryData;
}
