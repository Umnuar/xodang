import { fetchDictionaryData } from '@/services/sheets.service';
import { getSuggestions, searchDictionary, type DictionaryEntry, type SearchDirection } from '@/services/dictionary.service';
import { renderWordCards } from './word-card';
import { showToast } from '@/components/toast';
import { showLoading, hideLoading } from '@/components/loading-overlay';
import {
    startSmartVietnameseSpeech,
    type SmartSpeechHandle,
    type SpeechFallbackInfo,
    type SpeechState
} from '@/services/speech.service';
import {
    downloadOfflineAudio,
    filterValidDriveIds,
    hasOfflineAudioUpdates,
    shouldAutoDownloadOfflineAudio
} from '@/services/offline-sync.service';
import { getLucideIcon } from '@/utils/icons';
import { eventBus } from '@/utils/event-bus';

let dictionaryData: DictionaryEntry[] = [];

interface QuickChipItem {
    query: string;
    label: string;
}

const VIET_QUICK_CHIPS: QuickChipItem[] = [
    { query: 'xin chào', label: 'Xin chào' },
    { query: 'cảm ơn', label: 'Cảm ơn' },
    { query: 'nhà', label: 'Nhà' },
    { query: 'rừng', label: 'Rừng già' },
    { query: 'nước', label: 'Nước' },
    { query: 'cơm', label: 'Cơm' },
    { query: 'mẹ', label: 'Mẹ' }
];

const DEFAULT_ETHNIC_QUICK_CHIPS: QuickChipItem[] = [
    { query: 'bơ rơ ha', label: 'Bơ rơ ha' },
    { query: 'bri', label: 'Bri' },
    { query: 'hnam', label: 'Hnam' },
    { query: 'đak', label: 'Đak' }
];

function isValidOptionalField(value?: string): boolean {
    const trimmed = (value || '').trim();
    if (!trimmed) return false;
    const lower = trimmed.toLowerCase();
    return lower !== 'null' && lower !== 'undefined';
}

function getEthnicQuickChips(dictionary: DictionaryEntry[]): QuickChipItem[] {
    if (dictionary.length === 0) {
        return DEFAULT_ETHNIC_QUICK_CHIPS;
    }

    const hasDefaultSamples = DEFAULT_ETHNIC_QUICK_CHIPS.some(
        (chip) => searchDictionary(chip.query, 'ethnic_to_viet', dictionary).length > 0
    );
    if (hasDefaultSamples) {
        return DEFAULT_ETHNIC_QUICK_CHIPS;
    }

    const picked: QuickChipItem[] = [];
    const seen = new Set<string>();
    for (const entry of dictionary) {
        const ethnic = (entry.ethnic || '').trim();
        if (!ethnic || ethnic.length > 20) continue;
        const key = ethnic.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        picked.push({ query: ethnic, label: ethnic });
        if (picked.length >= 6) break;
    }

    return picked.length > 0 ? picked : DEFAULT_ETHNIC_QUICK_CHIPS;
}

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
    const clearSearchBtn = document.getElementById('clearSearchBtn') as HTMLButtonElement | null;
    const directionSelect = document.getElementById('direction') as HTMLSelectElement | null;
    const speechBtn = document.getElementById('speechButton');
    const resultDiv = document.getElementById('result');
    const errorDiv = document.getElementById('error');
    const searchStatus = document.getElementById('searchStatus');
    const suggestionsList = document.getElementById('suggestions') as HTMLUListElement | null;
    const quickChipsList = document.getElementById('quickChipsList') || document.querySelector('.chips-list');

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

    const voiceFallbackPanel = document.getElementById('voiceFallbackPanel') as HTMLElement | null;
    const voiceFallbackMessage = document.getElementById('voiceFallbackMessage') as HTMLElement | null;
    const voiceWasmProgress = document.getElementById('voiceWasmProgress') as HTMLElement | null;
    const voiceWasmProgressBar = document.getElementById('voiceWasmProgressBar') as HTMLElement | null;
    const voiceWasmProgressText = document.getElementById('voiceWasmProgressText') as HTMLElement | null;
    const btnVoiceKeyboard = document.getElementById('btnVoiceKeyboard') as HTMLButtonElement | null;
    const btnVoiceWasm = document.getElementById('btnVoiceWasm') as HTMLButtonElement | null;
    const btnCloseVoiceFallback = document.getElementById('btnCloseVoiceFallback') as HTMLButtonElement | null;

    let activeSuggestionIndex = -1;
    let currentSuggestionTerms: string[] = [];

    const syncClearButton = (): void => {
        if (!clearSearchBtn || !wordInput) return;
        clearSearchBtn.hidden = wordInput.value.length === 0;
    };

    const closeSuggestionsListbox = (): void => {
        activeSuggestionIndex = -1;
        if (suggestionsList) {
            suggestionsList.hidden = true;
        }
        if (wordInput) {
            wordInput.setAttribute('aria-expanded', 'false');
            wordInput.removeAttribute('aria-activedescendant');
        }
    };

    const setActiveSuggestion = (index: number): void => {
        if (!suggestionsList || !wordInput) return;
        const options = suggestionsList.querySelectorAll<HTMLElement>('[role="option"]');
        if (options.length === 0 || index < 0 || index >= options.length) {
            activeSuggestionIndex = -1;
            options.forEach((opt) => opt.setAttribute('aria-selected', 'false'));
            wordInput.removeAttribute('aria-activedescendant');
            return;
        }
        activeSuggestionIndex = index;
        options.forEach((opt, idx) => {
            const selected = idx === index;
            opt.setAttribute('aria-selected', selected ? 'true' : 'false');
        });
        const activeOption = options[index];
        wordInput.setAttribute('aria-activedescendant', activeOption.id);
        activeOption.scrollIntoView?.({ block: 'nearest' });
    };

    function getSuggestionCandidates(query: string, direction: SearchDirection): string[] {
        const trimmed = query.trim();
        if (trimmed) {
            return getSuggestions(trimmed, direction, dictionaryData, 10);
        }
        const unique = new Set<string>();
        for (const entry of dictionaryData) {
            const val = (direction === 'viet_to_ethnic' ? entry.viet : entry.ethnic).trim();
            if (val) {
                unique.add(val);
                if (unique.size >= 10) break;
            }
        }
        return Array.from(unique);
    }

    function updateSuggestions(query: string, direction: SearchDirection, shouldOpen: boolean = false): void {
        if (!suggestionsList || !wordInput) return;
        currentSuggestionTerms = getSuggestionCandidates(query, direction);
        activeSuggestionIndex = -1;
        wordInput.removeAttribute('aria-activedescendant');

        if (currentSuggestionTerms.length === 0) {
            suggestionsList.replaceChildren();
            closeSuggestionsListbox();
            return;
        }

        const fragment = document.createDocumentFragment();
        currentSuggestionTerms.forEach((term, idx) => {
            const li = document.createElement('li');
            li.id = `suggestion-opt-${idx}`;
            li.className = 'suggestion-option';
            li.setAttribute('role', 'option');
            li.setAttribute('aria-selected', 'false');
            li.dataset.value = term;
            li.textContent = term;
            fragment.appendChild(li);
        });
        suggestionsList.replaceChildren(fragment);

        if (shouldOpen) {
            suggestionsList.hidden = false;
            wordInput.setAttribute('aria-expanded', 'true');
        } else {
            suggestionsList.hidden = true;
            wordInput.setAttribute('aria-expanded', 'false');
        }
    }

    function renderQuickChips(direction: SearchDirection): void {
        if (!quickChipsList) return;
        const chips = direction === 'viet_to_ethnic'
            ? VIET_QUICK_CHIPS
            : getEthnicQuickChips(dictionaryData);
        const fragment = document.createDocumentFragment();
        chips.forEach((chip) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'suggest-chip';
            btn.dataset.query = chip.query;
            btn.textContent = chip.label;
            fragment.appendChild(btn);
        });
        quickChipsList.replaceChildren(fragment);
    }

    function showDictionaryLoadError(): void {
        if (!errorDiv) return;
        const msg = document.createElement('p');
        msg.textContent = 'Lỗi nạp dữ liệu từ điển. Vui lòng kiểm tra kết nối mạng.';

        const retryBtn = document.createElement('button');
        retryBtn.type = 'button';
        retryBtn.id = 'retryLoadDictBtn';
        retryBtn.className = 'error-retry-btn';
        retryBtn.innerHTML = `${getLucideIcon('rotate-ccw', 'lucide-icon', 16)} <span>Thử lại</span>`;
        retryBtn.addEventListener('click', () => {
            void loadDictionaryData();
        });

        errorDiv.replaceChildren(msg, retryBtn);
        errorDiv.hidden = false;
    }

    function clearDictionaryError(): void {
        if (!errorDiv) return;
        errorDiv.replaceChildren();
        errorDiv.hidden = true;
    }

    async function loadDictionaryData(): Promise<void> {
        try {
            showLoading('Đang tải dữ liệu từ điển...');
            clearDictionaryError();
            dictionaryData = await fetchDictionaryData();

            if (dictCount) dictCount.textContent = `${dictionaryData.length}+ từ vựng chuẩn`;
            if (statWords) statWords.textContent = `${dictionaryData.length}+`;

            const audioCount = filterValidDriveIds(dictionaryData.map(d => d.driveId)).length;
            if (statAudio) statAudio.textContent = `${audioCount}+`;

            const exampleCount = dictionaryData.filter(
                d => isValidOptionalField(d.exampleViet) || isValidOptionalField(d.exampleEthnic)
            ).length;
            if (statExamples) statExamples.textContent = `${exampleCount}+`;
            if (statQuestions) statQuestions.textContent = '100+';

            const currentDir = (directionSelect?.value as SearchDirection) || 'viet_to_ethnic';
            updateSuggestions(wordInput?.value || '', currentDir, false);
            renderQuickChips(currentDir);

            if (btnDownload && downloadStatus) {
                void checkOfflineAudioState();
            }
        } catch (err: unknown) {
            console.error('Failed to load dictionary:', err);
            showToast('Không thể tải dữ liệu từ điển từ máy chủ.', 'error');
            showDictionaryLoadError();
        } finally {
            hideLoading();
        }
    }

    await loadDictionaryData();

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

    if (resultDiv) {
        resultDiv.addEventListener('play', (e: Event) => {
            const target = e.target;
            if (!(target instanceof HTMLAudioElement)) return;
            resultDiv.querySelectorAll('audio').forEach((audio) => {
                if (audio !== target && !audio.paused) {
                    audio.pause();
                }
            });
        }, true);
    }

    let speechState: SpeechState = 'idle';
    let activeSpeechAbort: AbortController | null = null;
    let activeSpeechHandle: SmartSpeechHandle | null = null;
    let activeWasmPreloadAbort: AbortController | null = null;

    const isHomeActive = (): boolean => {
        const homeSection = document.getElementById('home');
        return homeSection ? homeSection.classList.contains('active') : true;
    };

    const resetSpeechButton = (): void => {
        if (!speechBtn) return;
        speechBtn.classList.remove('recording');
        speechBtn.setAttribute('aria-pressed', 'false');
    };

    const hideVoiceFallbackPanel = (): void => {
        if (activeWasmPreloadAbort) {
            activeWasmPreloadAbort.abort();
            activeWasmPreloadAbort = null;
        }
        if (voiceWasmProgress) voiceWasmProgress.hidden = true;
        if (btnVoiceWasm) btnVoiceWasm.disabled = false;
        if (voiceFallbackPanel) voiceFallbackPanel.hidden = true;
    };

    const cancelActiveSpeech = (): void => {
        if (activeWasmPreloadAbort) {
            activeWasmPreloadAbort.abort();
            activeWasmPreloadAbort = null;
        }
        if (activeSpeechAbort) {
            activeSpeechAbort.abort();
            activeSpeechAbort = null;
        }
        if (activeSpeechHandle) {
            activeSpeechHandle.cancel();
            activeSpeechHandle = null;
        }
        speechState = 'idle';
        resetSpeechButton();
    };

    if (searchForm && wordInput && directionSelect) {
        const selectSuggestionTerm = (term: string): void => {
            wordInput.value = term;
            syncClearButton();
            closeSuggestionsListbox();
            hideVoiceFallbackPanel();
            executeSearch(term, directionSelect.value as SearchDirection);
            wordInput.focus();
        };

        searchForm.addEventListener('submit', (e: Event) => {
            e.preventDefault();
            closeSuggestionsListbox();
            hideVoiceFallbackPanel();
            executeSearch(wordInput.value, directionSelect.value as SearchDirection);
        });

        let debounceTimer: ReturnType<typeof setTimeout>;
        wordInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            syncClearButton();
            const direction = directionSelect.value as SearchDirection;
            const trimmed = wordInput.value.trim();

            if (trimmed.length === 0) {
                updateSuggestions('', direction, false);
                executeSearch('', direction);
                return;
            }

            updateSuggestions(wordInput.value, direction, true);
            debounceTimer = setTimeout(() => {
                executeSearch(wordInput.value, directionSelect.value as SearchDirection);
            }, 250);
        });

        wordInput.addEventListener('keydown', (e: KeyboardEvent) => {
            if (!suggestionsList) return;
            const options = suggestionsList.querySelectorAll<HTMLElement>('[role="option"]');

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (suggestionsList.hidden) {
                    updateSuggestions(wordInput.value, directionSelect.value as SearchDirection, true);
                    const reopened = suggestionsList.querySelectorAll<HTMLElement>('[role="option"]');
                    if (reopened.length > 0) {
                        setActiveSuggestion(0);
                    }
                    return;
                }
                if (options.length > 0) {
                    const nextIdx = activeSuggestionIndex < options.length - 1 ? activeSuggestionIndex + 1 : 0;
                    setActiveSuggestion(nextIdx);
                }
            } else if (e.key === 'ArrowUp') {
                if (suggestionsList.hidden || options.length === 0) return;
                e.preventDefault();
                const prevIdx = activeSuggestionIndex <= 0 ? options.length - 1 : activeSuggestionIndex - 1;
                setActiveSuggestion(prevIdx);
            } else if (e.key === 'Enter') {
                if (!suggestionsList.hidden && activeSuggestionIndex >= 0 && options[activeSuggestionIndex]) {
                    e.preventDefault();
                    const chosen = options[activeSuggestionIndex].dataset.value || options[activeSuggestionIndex].textContent || '';
                    if (chosen) {
                        selectSuggestionTerm(chosen);
                    }
                } else {
                    closeSuggestionsListbox();
                }
            } else if (e.key === 'Escape') {
                if (!suggestionsList.hidden) {
                    e.preventDefault();
                    closeSuggestionsListbox();
                }
            }
        });

        wordInput.addEventListener('blur', () => {
            closeSuggestionsListbox();
        });

        if (suggestionsList) {
            suggestionsList.addEventListener('mousedown', (e: MouseEvent) => {
                const target = (e.target as HTMLElement | null)?.closest<HTMLElement>('[role="option"]');
                if (!target) return;
                e.preventDefault();
                const value = target.dataset.value || target.textContent || '';
                if (value) {
                    selectSuggestionTerm(value);
                }
            });
        }

        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                clearTimeout(debounceTimer);
                wordInput.value = '';
                syncClearButton();
                const direction = directionSelect.value as SearchDirection;
                updateSuggestions('', direction, false);
                executeSearch('', direction);
                wordInput.focus();
            });
        }

        directionSelect.addEventListener('change', () => {
            const direction = directionSelect.value as SearchDirection;
            updateSuggestions(wordInput.value, direction, false);
            renderQuickChips(direction);
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
                syncClearButton();
                wordInput.dispatchEvent(new Event('input'));
            });
        });

        if (quickChipsList) {
            quickChipsList.addEventListener('click', (e: Event) => {
                const chip = (e.target as HTMLElement | null)?.closest<HTMLElement>('.suggest-chip');
                if (!chip) return;
                const query = chip.dataset.query || chip.textContent || '';
                hideVoiceFallbackPanel();
                closeSuggestionsListbox();
                wordInput.value = query;
                syncClearButton();
                wordInput.focus();
                executeSearch(query, directionSelect.value as SearchDirection);
            });
        }

        syncClearButton();
    }

    const showVoiceFallbackPanel = (info: SpeechFallbackInfo): void => {
        if (!wordInput || !isHomeActive()) return;
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
        if (!isHomeActive()) return;

        if (speechState !== 'idle') {
            if (speechState === 'listening' && activeSpeechHandle) {
                speechState = 'processing';
                activeSpeechHandle.stop();
                return;
            }
            cancelActiveSpeech();
            return;
        }

        if (directionSelect.value !== 'viet_to_ethnic') {
            directionSelect.value = 'viet_to_ethnic';
            updateSuggestions(wordInput.value, 'viet_to_ethnic', false);
            renderQuickChips('viet_to_ethnic');
            showToast('Đã chuyển sang chiều Việt → Xơ Đăng cho giọng nói tiếng Việt', 'info');
        }

        speechState = 'starting';
        const controller = new AbortController();
        activeSpeechAbort = controller;

        const handle = await startSmartVietnameseSpeech({
            forceWasm,
            signal: controller.signal,
            onStateChange: (nextState) => {
                if (controller.signal.aborted || activeSpeechAbort !== controller) return;
                speechState = nextState;
            },
            onTierSelected: (tier) => {
                if (controller.signal.aborted || activeSpeechAbort !== controller) return;
                if (voiceFallbackPanel && tier !== 'keyboard') {
                    voiceFallbackPanel.hidden = true;
                }
            },
            onStatus: (message) => {
                if (controller.signal.aborted || activeSpeechAbort !== controller) return;
                showToast(message, 'info');
            },
            onStart: (tier) => {
                if (controller.signal.aborted || activeSpeechAbort !== controller) return;
                speechState = 'listening';
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
                if (controller.signal.aborted || activeSpeechAbort !== controller) return;
                speechState = 'processing';
                showToast('Đang chuyển giọng nói thành chữ...', 'info');
            },
            onResult: (recognizedText: string) => {
                if (controller.signal.aborted || activeSpeechAbort !== controller) return;
                speechState = 'idle';
                activeSpeechAbort = null;
                activeSpeechHandle = null;
                resetSpeechButton();
                closeSuggestionsListbox();
                wordInput.value = recognizedText;
                syncClearButton();
                executeSearch(recognizedText, directionSelect.value as SearchDirection);
            },
            onError: (err: string) => {
                if (controller.signal.aborted || activeSpeechAbort !== controller) return;
                speechState = 'idle';
                activeSpeechAbort = null;
                activeSpeechHandle = null;
                resetSpeechButton();
                showToast(`Lỗi nhận diện giọng nói: ${err}`, 'error');
            },
            onEnd: () => {
                if (activeSpeechAbort === controller) {
                    speechState = 'idle';
                    activeSpeechAbort = null;
                    activeSpeechHandle = null;
                    resetSpeechButton();
                }
            },
            onFallbackKeyboard: (info) => {
                if (controller.signal.aborted || activeSpeechAbort !== controller) return;
                speechState = 'idle';
                activeSpeechAbort = null;
                activeSpeechHandle = null;
                resetSpeechButton();
                showVoiceFallbackPanel(info);
            }
        });

        if (controller.signal.aborted || activeSpeechAbort !== controller || !isHomeActive()) {
            handle.cancel();
            if (activeSpeechAbort === controller) {
                activeSpeechAbort = null;
                activeSpeechHandle = null;
                speechState = 'idle';
                resetSpeechButton();
            }
            return;
        }

        const latestState = speechState as SpeechState;
        if (handle.tier !== 'keyboard' && latestState !== 'idle') {
            activeSpeechHandle = handle;
        } else if (latestState === 'starting') {
            speechState = 'idle';
            if (activeSpeechAbort === controller) {
                activeSpeechAbort = null;
            }
        }
    };

    if (speechBtn && wordInput && directionSelect) {
        speechBtn.addEventListener('click', () => {
            void runSpeechCapture(false);
        });
    }

    if (btnVoiceKeyboard && wordInput) {
        btnVoiceKeyboard.addEventListener('click', () => {
            hideVoiceFallbackPanel();
            wordInput.focus();
            showToast('Nhấn nút micro trên bàn phím điện thoại hoặc Win+H / Fn để nhập giọng nói.', 'info');
        });
    }

    if (btnCloseVoiceFallback && voiceFallbackPanel) {
        btnCloseVoiceFallback.addEventListener('click', () => {
            hideVoiceFallbackPanel();
        });
    }

    if (btnVoiceWasm) {
        btnVoiceWasm.addEventListener('click', async () => {
            if (!isHomeActive() || voiceFallbackPanel?.hidden) return;
            btnVoiceWasm.disabled = true;
            if (voiceWasmProgress) voiceWasmProgress.hidden = false;
            if (voiceWasmProgressBar) voiceWasmProgressBar.style.width = '0%';
            if (voiceWasmProgressText) voiceWasmProgressText.textContent = 'Đang khởi tạo AI Whisper WASM (~45MB)...';

            const preloadController = new AbortController();
            activeWasmPreloadAbort = preloadController;

            try {
                const { preloadWhisperModel } = await import('@/services/whisper-stt.service');
                await preloadWhisperModel((percent: number) => {
                    if (preloadController.signal.aborted) return;
                    if (voiceWasmProgressBar) voiceWasmProgressBar.style.width = `${percent}%`;
                    if (voiceWasmProgressText) voiceWasmProgressText.textContent = `Đang tải mô hình AI tiếng Việt: ${percent}%`;
                }, preloadController.signal);

                if (preloadController.signal.aborted || activeWasmPreloadAbort !== preloadController) {
                    return;
                }
                activeWasmPreloadAbort = null;

                const canLaunchMic = isHomeActive() && Boolean(voiceFallbackPanel && !voiceFallbackPanel.hidden);
                if (voiceWasmProgress) voiceWasmProgress.hidden = true;
                if (voiceFallbackPanel) voiceFallbackPanel.hidden = true;
                btnVoiceWasm.disabled = false;

                if (!canLaunchMic) {
                    return;
                }
                await runSpeechCapture(true);
            } catch (err: unknown) {
                if (activeWasmPreloadAbort === preloadController) {
                    activeWasmPreloadAbort = null;
                }
                btnVoiceWasm.disabled = false;
                if (voiceWasmProgress) voiceWasmProgress.hidden = true;
                if (preloadController.signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) {
                    return;
                }
                const message = err instanceof Error ? err.message : 'Không thể tải mô hình AI Whisper WASM.';
                showToast(message, 'error');
            }
        });
    }

    eventBus.on('tab:change', (sectionId: string) => {
        if (sectionId !== 'home') {
            cancelActiveSpeech();
            hideVoiceFallbackPanel();
            closeSuggestionsListbox();
            resultDiv?.querySelectorAll('audio').forEach((audio) => {
                if (!audio.paused) {
                    audio.pause();
                }
            });
        }
    });

    function setOfflineReadyUI(cached: number, total: number, statusMessage: string): void {
        if (!btnDownload || !downloadStatus || !progressContainer) return;
        progressContainer.style.display = 'none';
        progressContainer.setAttribute('aria-valuenow', '100');
        btnDownload.innerHTML = `${getLucideIcon('check-circle', 'lucide-icon', 18)} <span>Đã sẵn sàng offline (${cached}/${total})</span>`;
        btnDownload.style.background = 'var(--color-primary)';
        btnDownload.style.color = 'var(--text-inverse)';
        btnDownload.style.borderColor = 'var(--color-primary-hover)';
        btnDownload.style.opacity = '1';
        btnDownload.disabled = true;
        downloadStatus.textContent = statusMessage;
    }

    async function runOfflineAudioSync(isAuto: boolean): Promise<void> {
        if (!btnDownload || !progressContainer || !progressBar || !progressText || !downloadStatus) return;

        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            progressContainer.style.display = 'none';
            progressContainer.setAttribute('aria-valuenow', '0');
            if (!isAuto) {
                showToast('Đang ngoại tuyến. Vui lòng kết nối mạng để tải gói phát âm.', 'warning');
            }
            return;
        }

        btnDownload.disabled = true;
        btnDownload.style.opacity = '0.7';
        btnDownload.innerHTML = `${getLucideIcon('rotate-ccw', 'lucide-icon', 18)} <span>${isAuto ? 'Đang tự động đồng bộ âm thanh...' : 'Đang chuẩn bị dữ liệu...'}</span>`;
        progressBar.style.width = '0%';
        progressContainer.setAttribute('aria-valuenow', '0');
        progressContainer.style.display = 'block';

        const driveIds = filterValidDriveIds(dictionaryData.map(d => d.driveId));
        try {
            const result = await downloadOfflineAudio(driveIds, (loaded: number, total: number, percent: number) => {
                progressBar.style.width = `${percent}%`;
                progressContainer.setAttribute('aria-valuenow', String(percent));
                progressText.textContent = `Đang tải: ${loaded}/${total} (${percent}%)`;
            });

            btnDownload.style.opacity = '1';
            if (result.total > 0 && result.cached >= result.total) {
                setOfflineReadyUI(
                    result.cached,
                    result.total,
                    `Đã sẵn sàng offline (${result.cached}/${result.total} tệp âm thanh). Bạn có thể nghe phát âm khi mất mạng.`
                );
                if (!isAuto) {
                    showToast('Tải thành công âm thanh offline!', 'success');
                }
            } else {
                progressContainer.style.display = 'none';
                btnDownload.disabled = false;
                btnDownload.style.background = '';
                btnDownload.style.color = '';
                btnDownload.style.borderColor = '';
                btnDownload.innerHTML = `${getLucideIcon('download', 'lucide-icon', 18)} <span>Thử tải lại (${result.cached}/${result.total})</span>`;
                downloadStatus.textContent = `Đã tải được ${result.cached}/${result.total} file âm thanh. Vui lòng thử lại khi mạng ổn định.`;
                if (!isAuto) {
                    showToast(`Chỉ tải được ${result.cached}/${result.total} file âm thanh.`, 'warning');
                }
            }
        } catch {
            progressContainer.style.display = 'none';
            btnDownload.style.opacity = '1';
            btnDownload.disabled = false;
            btnDownload.style.background = '';
            btnDownload.style.color = '';
            btnDownload.style.borderColor = '';
            btnDownload.innerHTML = `${getLucideIcon('download', 'lucide-icon', 18)} <span>Thử tải lại</span>`;
            if (!isAuto) {
                showToast('Tải gói âm thanh offline thất bại. Vui lòng thử lại.', 'error');
            }
        }
    }

    async function checkOfflineAudioState(): Promise<void> {
        if (!btnDownload || !downloadStatus) return;
        const driveIds = filterValidDriveIds(dictionaryData.map(d => d.driveId));
        const status = await hasOfflineAudioUpdates(driveIds);

        if (status.total > 0 && !status.needsSync) {
            setOfflineReadyUI(
                status.cached,
                status.total,
                `Đã sẵn sàng offline (${status.cached}/${status.total} tệp âm thanh). Sẵn sàng học offline 100%!`
            );
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
