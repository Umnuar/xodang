import '@/styles/features/games.css';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys';
import { getRawStorageItem, setRawStorageItem } from '@/services/storage.service';
import { getAudioUrl } from '@/services/offline-sync.service';
import { showToast } from '@/components/toast';
import { eventBus } from '@/utils/event-bus';
import { getLucideIcon, createLucideIconElement } from '@/utils/icons';
import { openAccessibleModal, closeAccessibleModal } from '@/utils/modal-a11y';
import { getQuestionsForLevel, type GameWordPair } from './game-data';
import { soundEffects } from './sound-effects';
import { Game1Memory } from './game1-memory';
import { Game2Catcher } from './game2-catcher';
import { Game3Shooter } from './game3-shooter';
import { Game4Farm } from './game4-farm';
import { showCertificateModal, closeCertificateModal } from './certificate';
import {
    recordGameScore,
    showLeaderboardModal,
    showBadgesModal,
    showCertificatesModal,
    closeAllLeaderboardModals
} from './leaderboard';

export type GameId = 'game1' | 'game2' | 'game3' | 'game4';

export interface GameTargetInfo {
    text: string;
    driveId?: string;
    pronunciation?: string;
}

export interface GameCallbacks {
    onScoreChange: (score: number) => void;
    onLivesChange?: (lives: number) => void;
    onLevelComplete: (level: number, score: number) => void;
    onGameOver?: (score: number) => void;
    onProgressChange?: (current: number, total: number) => void;
    onComboChange?: (combo: number) => void;
    onMistake?: (pair: GameWordPair) => void;
    onTargetChange?: (target: GameTargetInfo | null) => void;
}

export interface DestroyableGame {
    destroy(): void;
    start(level?: number): void;
    pause?(): void;
    resume?(): void;
    getMistakes?(): GameWordPair[];
}

const DEFAULT_USER_NAME = 'Người học Xơ Đăng';

const GAME_TITLES: Record<GameId, string> = {
    game1: 'Lật Thẻ Trí Nhớ',
    game2: 'Mưa Từ Vựng',
    game3: 'Bảo Vệ Làng',
    game4: 'Nông Trại Số'
};

let activeGame: DestroyableGame | null = null;
let currentGameId: GameId | null = null;
let currentLevel = 1;
let currentScore = 0;
let levelBaseScore = 0;
let issuedCertId: string | undefined;
let isPaused = false;
let currentTargetDriveId: string | undefined;
let sessionMistakes: GameWordPair[] = [];
let activeWordAudio: HTMLAudioElement | null = null;
let isTabListenerRegistered = false;

export function initGames(): void {
    const section = document.getElementById('game');
    if (!section) return;

    const currentUser = getRawStorageItem(STORAGE_KEYS.GAME_CURRENT_USER) || DEFAULT_USER_NAME;
    const userEl = section.querySelector('#gameCurrentUserName');
    if (userEl) userEl.textContent = currentUser;

    const editNameBtn = section.querySelector<HTMLButtonElement>('#btnEditPlayerName');
    const nameForm = section.querySelector<HTMLFormElement>('#playerNameForm');
    const nameInput = section.querySelector<HTMLInputElement>('#playerNameInput');
    const cancelNameBtn = section.querySelector<HTMLButtonElement>('#btnCancelPlayerName');

    if (editNameBtn && nameForm && nameInput) {
        editNameBtn.addEventListener('click', () => {
            const latestName = getRawStorageItem(STORAGE_KEYS.GAME_CURRENT_USER) || DEFAULT_USER_NAME;
            nameInput.value = latestName;
            nameForm.hidden = false;
            nameInput.focus();
            nameInput.select();
        });

        nameForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const trimmed = nameInput.value.trim();
            if (!trimmed) {
                showToast('Vui lòng nhập tên người chơi hợp lệ.', 'warning');
                nameInput.focus();
                return;
            }
            setRawStorageItem(STORAGE_KEYS.GAME_CURRENT_USER, trimmed);
            if (userEl) userEl.textContent = trimmed;
            nameForm.hidden = true;
            editNameBtn.focus();
            showToast('Đã cập nhật tên người chơi.', 'success');
        });

        cancelNameBtn?.addEventListener('click', () => {
            nameForm.hidden = true;
            editNameBtn.focus();
        });
    }

    const sfxBtn = section.querySelector('#toggleGameSfx') as HTMLButtonElement | null;
    if (sfxBtn) {
        updateSfxButtonUI(sfxBtn);
        sfxBtn.addEventListener('click', () => {
            const nextState = !soundEffects.isEnabled();
            soundEffects.setEnabled(nextState);
            updateSfxButtonUI(sfxBtn);
            if (nextState) soundEffects.click();
        });
    }

    section.querySelector('#btnOpenLeaderboard')?.addEventListener('click', () => showLeaderboardModal());
    section.querySelector('#btnOpenBadges')?.addEventListener('click', () => showBadgesModal());
    section.querySelector('#btnOpenCertificates')?.addEventListener('click', () => showCertificatesModal());

    section.addEventListener('click', (e: Event) => {
        const target = e.target as HTMLElement;

        const speakTargetBtn = target.closest('#btnSpeakTarget');
        if (speakTargetBtn) {
            if (currentTargetDriveId) {
                playGameWordAudio(currentTargetDriveId);
            }
            return;
        }

        const pauseBtn = target.closest<HTMLButtonElement>('#btnPauseGame');
        if (pauseBtn) {
            togglePauseGame(pauseBtn);
            return;
        }

        const previewAudioBtn = target.closest<HTMLElement>('.vocab-preview-audio-btn');
        if (previewAudioBtn) {
            const driveId = previewAudioBtn.dataset.driveId;
            if (driveId) {
                playGameWordAudio(driveId);
            }
            return;
        }

        const startPreviewBtn = target.closest('#btnStartFromPreview');
        if (startPreviewBtn) {
            dismissVocabPreview();
            return;
        }

        const reviewAudioBtn = target.closest<HTMLElement>('.modal-review-audio-btn');
        if (reviewAudioBtn) {
            const driveId = reviewAudioBtn.dataset.driveId;
            if (driveId) {
                playGameWordAudio(driveId);
            }
            return;
        }

        const card = target.closest('[data-game]') as HTMLElement | null;
        if (card && card.dataset.game) {
            const gameId = card.dataset.game as GameId;
            launchGame(gameId, 1, 0);
            return;
        }

        if (target.closest('#btnExitGame') || target.closest('#btnBackToMenu')) {
            exitToMenu();
            return;
        }

        if (target.closest('#btnNextLevel')) {
            closeGameOverModal();
            if (currentGameId) {
                currentLevel++;
                launchGame(currentGameId, currentLevel, currentScore);
            }
            return;
        }

        if (target.closest('#btnGetCertificate')) {
            const studentName = getRawStorageItem(STORAGE_KEYS.GAME_CURRENT_USER) || DEFAULT_USER_NAME;
            const title = currentGameId ? GAME_TITLES[currentGameId] : 'Trò chơi Xơ Đăng';
            const certId = showCertificateModal({
                studentName,
                gameTitle: title,
                score: currentScore,
                level: currentLevel,
                id: issuedCertId,
                persist: !issuedCertId
            });
            if (!issuedCertId && certId) {
                issuedCertId = certId;
            }
            return;
        }

        if (target.closest('#btnReplayLevel')) {
            closeGameOverModal();
            if (currentGameId) {
                const replayCarry = currentLevel <= 1 ? 0 : levelBaseScore;
                launchGame(currentGameId, currentLevel, replayCarry);
            }
        }
    });

    if (!isTabListenerRegistered) {
        isTabListenerRegistered = true;
        eventBus.on('tab:change', (sectionId: string) => {
            if (sectionId !== 'game') {
                exitToMenu();
            }
        });
    }
}

function updateSfxButtonUI(btn: HTMLButtonElement): void {
    const isEnabled = soundEffects.isEnabled();
    const icon = isEnabled
        ? getLucideIcon('volume-2', 'lucide-icon', 16)
        : getLucideIcon('volume-x', 'lucide-icon', 16);
    btn.innerHTML = `${icon}<span class="chip-label">${isEnabled ? 'Âm thanh: Bật' : 'Âm thanh: Tắt'}</span>`;
    btn.setAttribute('title', isEnabled ? 'Tắt hiệu ứng âm thanh' : 'Bật hiệu ứng âm thanh');
    btn.setAttribute('aria-label', isEnabled ? 'Tắt hiệu ứng âm thanh' : 'Bật hiệu ứng âm thanh');
    btn.setAttribute('aria-pressed', String(isEnabled));
    btn.classList.toggle('muted', !isEnabled);
}

function updatePauseButtonUI(btn: HTMLButtonElement, paused: boolean): void {
    const icon = paused
        ? getLucideIcon('play', 'lucide-icon', 16)
        : getLucideIcon('pause', 'lucide-icon', 16);
    btn.innerHTML = `${icon}<span>${paused ? 'Tiếp tục' : 'Tạm dừng'}</span>`;
    btn.setAttribute('aria-pressed', String(paused));
    btn.setAttribute('aria-label', paused ? 'Tiếp tục trò chơi' : 'Tạm dừng trò chơi');
    btn.setAttribute('title', paused ? 'Tiếp tục' : 'Tạm dừng');
}

function togglePauseGame(btn: HTMLButtonElement): void {
    if (!activeGame) return;
    if (isPaused) {
        activeGame.resume?.();
        isPaused = false;
    } else {
        activeGame.pause?.();
        isPaused = true;
    }
    updatePauseButtonUI(btn, isPaused);
}

function stopWordAudio(): void {
    if (activeWordAudio) {
        try {
            activeWordAudio.pause();
            activeWordAudio.currentTime = 0;
        } catch {
        }
        activeWordAudio = null;
    }
}

export function playGameWordAudio(driveId: string): void {
    const url = getAudioUrl(driveId);
    if (!url) return;

    stopWordAudio();
    soundEffects.duckForAudio(1500);

    const audio = new Audio(url);
    activeWordAudio = audio;
    audio.onerror = () => {
        showToast('Chưa có tệp phát âm cho từ này khi ngoại tuyến.', 'warning');
    };
    audio.onended = () => {
        if (activeWordAudio === audio) {
            activeWordAudio = null;
        }
    };
    void audio.play().catch(() => {});
}

function addMistake(pair: GameWordPair): void {
    const key = `${pair.ethnic.trim().toLowerCase()}||${pair.viet.trim().toLowerCase()}`;
    const exists = sessionMistakes.some(
        m => `${m.ethnic.trim().toLowerCase()}||${m.viet.trim().toLowerCase()}` === key
    );
    if (!exists) {
        sessionMistakes.push(pair);
    }
}

function updateProgressHud(current: number, total: number): void {
    const wrap = document.getElementById('gameProgressWrap');
    const textEl = document.getElementById('gameProgressText');
    if (!wrap || !textEl) return;
    if (total <= 0) {
        wrap.hidden = true;
        return;
    }
    wrap.hidden = false;
    textEl.textContent = `${Math.min(current, total)}/${total}`;
}

function updateComboHud(combo: number): void {
    const badge = document.getElementById('gameComboBadge');
    const textEl = document.getElementById('gameComboText');
    if (!badge || !textEl) return;
    if (combo >= 2) {
        badge.hidden = false;
        textEl.textContent = `x${combo}`;
    } else {
        badge.hidden = true;
    }
}

function updateTargetAudioHud(target: GameTargetInfo | null): void {
    const btn = document.getElementById('btnSpeakTarget') as HTMLButtonElement | null;
    currentTargetDriveId = target?.driveId;
    if (!btn) return;
    if (currentTargetDriveId) {
        btn.hidden = false;
        btn.setAttribute('aria-label', `Nghe phát âm từ ${target?.text || 'mục tiêu'}`);
    } else {
        btn.hidden = true;
    }
}

function populateVocabPreview(level: number): void {
    const panel = document.getElementById('vocabPreviewPanel');
    const levelEl = document.getElementById('vocabPreviewLevel');
    const listEl = document.getElementById('vocabPreviewList');
    if (!panel || !listEl) return;

    if (levelEl) levelEl.textContent = String(level);

    const questions = getQuestionsForLevel(level, 5);
    const seen = new Set<string>();
    const previewPairs: Array<{ ethnic: string; viet: string; pronunciation?: string; driveId?: string }> = [];

    for (const q of questions) {
        const ethnic = q.direction === 'viet_to_ethnic' ? q.correct : q.question;
        const viet = q.direction === 'viet_to_ethnic' ? q.question : q.correct;
        const key = `${ethnic.toLowerCase()}||${viet.toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        previewPairs.push({
            ethnic,
            viet,
            pronunciation: q.pronunciation,
            driveId: q.driveId
        });
        if (previewPairs.length >= 5) break;
    }

    if (previewPairs.length === 0) {
        panel.style.display = 'none';
        return;
    }

    listEl.replaceChildren();
    previewPairs.forEach(pair => {
        const item = document.createElement('li');
        item.className = 'vocab-preview-item';

        const wordWrap = document.createElement('div');
        wordWrap.className = 'vocab-preview-words';

        const ethnicEl = document.createElement('strong');
        ethnicEl.className = 'vocab-preview-ethnic';
        ethnicEl.textContent = pair.ethnic;
        wordWrap.appendChild(ethnicEl);

        if (pair.pronunciation) {
            const pronEl = document.createElement('span');
            pronEl.className = 'vocab-preview-pron';
            pronEl.textContent = `/${pair.pronunciation}/`;
            wordWrap.appendChild(pronEl);
        }

        const vietEl = document.createElement('span');
        vietEl.className = 'vocab-preview-viet';
        vietEl.textContent = pair.viet;
        wordWrap.appendChild(vietEl);

        item.appendChild(wordWrap);

        if (pair.driveId) {
            const audioBtn = document.createElement('button');
            audioBtn.type = 'button';
            audioBtn.className = 'vocab-preview-audio-btn';
            audioBtn.dataset.driveId = pair.driveId;
            audioBtn.setAttribute('aria-label', `Nghe phát âm ${pair.ethnic}`);
            audioBtn.appendChild(createLucideIconElement('volume-2', 'lucide-icon', 16));
            item.appendChild(audioBtn);
        }

        listEl.appendChild(item);
    });

    panel.style.display = 'block';
    activeGame?.pause?.();
}

function dismissVocabPreview(): void {
    const panel = document.getElementById('vocabPreviewPanel');
    if (panel) {
        panel.style.display = 'none';
    }
    if (!isPaused) {
        activeGame?.resume?.();
    }
}

function hideVocabPreview(): void {
    const panel = document.getElementById('vocabPreviewPanel');
    if (panel) {
        panel.style.display = 'none';
    }
}

function renderModalReviewList(): void {
    const sectionEl = document.getElementById('modalReviewSection');
    const listEl = document.getElementById('modalReviewList');
    if (!sectionEl || !listEl) return;

    const engineMistakes = activeGame?.getMistakes?.() ?? [];
    for (const m of engineMistakes) {
        addMistake(m);
    }

    if (sessionMistakes.length === 0) {
        sectionEl.hidden = true;
        listEl.replaceChildren();
        return;
    }

    listEl.replaceChildren();
    sessionMistakes.forEach(pair => {
        const li = document.createElement('li');
        li.className = 'modal-review-item';

        const textWrap = document.createElement('div');
        textWrap.className = 'modal-review-words';

        const ethnicEl = document.createElement('strong');
        ethnicEl.textContent = pair.ethnic;
        const eqEl = document.createElement('span');
        eqEl.textContent = ` — ${pair.viet}`;

        textWrap.appendChild(ethnicEl);
        textWrap.appendChild(eqEl);
        li.appendChild(textWrap);

        if (pair.driveId) {
            const audioBtn = document.createElement('button');
            audioBtn.type = 'button';
            audioBtn.className = 'modal-review-audio-btn';
            audioBtn.dataset.driveId = pair.driveId;
            audioBtn.setAttribute('aria-label', `Nghe lại phát âm ${pair.ethnic}`);
            audioBtn.appendChild(createLucideIconElement('volume-2', 'lucide-icon', 15));
            li.appendChild(audioBtn);
        }

        listEl.appendChild(li);
    });

    sectionEl.hidden = false;
}

function closeGameOverModal(): void {
    const modal = document.getElementById('gameOverModal');
    if (modal) {
        modal.style.display = 'none';
        closeAccessibleModal(modal);
    }
}

export function launchGame(gameId: GameId, level: number = 1, carryScore: number = 0): void {
    const hubView = document.getElementById('gameHubView');
    const activeView = document.getElementById('gameActiveView');
    const stage = document.getElementById('gameStage');
    const titleEl = document.getElementById('activeGameTitle');
    const levelEl = document.getElementById('activeGameLevel');
    const scoreEl = document.getElementById('activeGameScore');
    const livesWrap = document.getElementById('activeGameLivesWrap');
    const livesEl = document.getElementById('activeGameLives');
    const pauseBtn = document.getElementById('btnPauseGame') as HTMLButtonElement | null;

    if (!hubView || !activeView || !stage) return;

    if (activeGame) {
        activeGame.destroy();
        activeGame = null;
    }
    stopWordAudio();
    closeGameOverModal();
    hideVocabPreview();

    document.body.classList.add('game-focus-mode');
    hubView.style.display = 'none';
    activeView.style.display = 'block';

    currentGameId = gameId;
    currentLevel = level;
    levelBaseScore = carryScore;
    currentScore = carryScore;
    issuedCertId = undefined;
    isPaused = false;
    currentTargetDriveId = undefined;
    sessionMistakes = [];

    if (levelEl) levelEl.textContent = String(level);
    if (scoreEl) scoreEl.textContent = String(carryScore);
    if (livesEl) livesEl.textContent = '3';
    if (titleEl) titleEl.textContent = GAME_TITLES[gameId];

    updateProgressHud(0, 0);
    updateComboHud(0);
    updateTargetAudioHud(null);

    if (livesWrap) {
        livesWrap.style.display = (gameId === 'game2' || gameId === 'game3') ? 'flex' : 'none';
    }

    const sharedCallbacks: GameCallbacks & {
        onLivesChange: (lives: number) => void;
        onGameOver: (score: number) => void;
    } = {
        onScoreChange: (levelScore) => updateScore(levelBaseScore + levelScore),
        onLivesChange: (lives) => {
            if (livesEl) livesEl.textContent = String(lives);
        },
        onLevelComplete: (lvl, levelScore) => handleLevelComplete(lvl, levelScore),
        onGameOver: (levelScore) => handleGameOver(levelScore),
        onProgressChange: (current, total) => updateProgressHud(current, total),
        onComboChange: (combo) => updateComboHud(combo),
        onMistake: (pair) => addMistake(pair),
        onTargetChange: (target) => updateTargetAudioHud(target)
    };

    switch (gameId) {
        case 'game1':
            activeGame = new Game1Memory(stage, sharedCallbacks);
            break;
        case 'game2':
            activeGame = new Game2Catcher(stage, sharedCallbacks);
            break;
        case 'game3':
            activeGame = new Game3Shooter(stage, sharedCallbacks);
            break;
        case 'game4':
            activeGame = new Game4Farm(stage, sharedCallbacks);
            break;
    }

    activeGame?.start(level);

    if (pauseBtn) {
        const supportsPause = typeof activeGame?.pause === 'function' && typeof activeGame?.resume === 'function';
        pauseBtn.hidden = !supportsPause;
        updatePauseButtonUI(pauseBtn, false);
    }

    if (gameId === 'game2' || gameId === 'game3') {
        populateVocabPreview(level);
    }
}

function updateScore(score: number): void {
    currentScore = score;
    const scoreEl = document.getElementById('activeGameScore');
    if (scoreEl) scoreEl.textContent = String(score);
}

function handleLevelComplete(level: number, levelScore: number): void {
    const totalRunScore = levelBaseScore + levelScore;
    currentScore = totalRunScore;
    updateScore(totalRunScore);
    hideVocabPreview();

    if (currentGameId) {
        recordGameScore(currentGameId, levelScore, level, true, totalRunScore);
    }

    const modal = document.getElementById('gameOverModal');
    const icon = document.getElementById('modalIcon');
    const title = document.getElementById('modalTitle');
    const desc = document.getElementById('modalDesc');
    const finalScore = document.getElementById('modalFinalScore');
    const nextBtn = document.getElementById('btnNextLevel');
    const certBtn = document.getElementById('btnGetCertificate');

    if (!modal) return;
    if (icon) {
        icon.className = 'modal-icon modal-icon-win';
        icon.innerHTML = getLucideIcon('award', 'lucide-icon', 36);
    }
    if (title) title.textContent = `Hoàn Thành Level ${level}!`;
    if (desc) desc.textContent = 'Chúc mừng bạn đã xuất sắc vượt qua thử thách từ vựng.';
    if (finalScore) finalScore.textContent = String(totalRunScore);
    if (nextBtn) nextBtn.style.display = 'inline-flex';
    if (certBtn) certBtn.style.display = 'inline-flex';

    renderModalReviewList();

    modal.style.display = 'flex';
    openAccessibleModal(modal, {
        labelledById: 'modalTitle',
        initialFocus: nextBtn as HTMLElement | null,
        onClose: () => closeGameOverModal()
    });
}

function handleGameOver(levelScore: number): void {
    const totalRunScore = levelBaseScore + levelScore;
    currentScore = totalRunScore;
    updateScore(totalRunScore);
    hideVocabPreview();

    if (currentGameId) {
        recordGameScore(currentGameId, levelScore, currentLevel, false, totalRunScore);
    }

    const modal = document.getElementById('gameOverModal');
    const icon = document.getElementById('modalIcon');
    const title = document.getElementById('modalTitle');
    const desc = document.getElementById('modalDesc');
    const finalScore = document.getElementById('modalFinalScore');
    const nextBtn = document.getElementById('btnNextLevel');
    const certBtn = document.getElementById('btnGetCertificate');
    const replayBtn = document.getElementById('btnReplayLevel');

    if (!modal) return;
    if (icon) {
        icon.className = 'modal-icon modal-icon-loss';
        icon.innerHTML = getLucideIcon('alert-circle', 'lucide-icon', 36);
    }
    if (title) title.textContent = 'Hết Lượt Chơi!';
    if (desc) desc.textContent = 'Đừng nản lòng, hãy ôn lại các từ vừa gặp và thử lại nhé.';
    if (finalScore) finalScore.textContent = String(totalRunScore);
    if (nextBtn) nextBtn.style.display = 'none';
    if (certBtn) certBtn.style.display = 'none';

    renderModalReviewList();

    modal.style.display = 'flex';
    openAccessibleModal(modal, {
        labelledById: 'modalTitle',
        initialFocus: replayBtn as HTMLElement | null,
        onClose: () => closeGameOverModal()
    });
}

export function exitToMenu(): void {
    if (activeGame) {
        activeGame.destroy();
        activeGame = null;
    }
    stopWordAudio();
    hideVocabPreview();
    closeGameOverModal();
    closeCertificateModal();
    closeAllLeaderboardModals();

    document.body.classList.remove('game-focus-mode');

    const hubView = document.getElementById('gameHubView');
    const activeView = document.getElementById('gameActiveView');

    if (activeView) activeView.style.display = 'none';
    if (hubView) hubView.style.display = 'block';

    currentGameId = null;
    isPaused = false;
    currentTargetDriveId = undefined;
    issuedCertId = undefined;
}

export function getActiveGame(): DestroyableGame | null {
    return activeGame;
}

export function checkGameAvailable(): boolean {
    return true;
}

export function getCurrentScore(): number {
    return currentScore;
}
