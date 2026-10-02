/**
 * Games Hub Controller
 * Coordinates the 4 native educational games, user profiles, sound controls,
 * and handles clean lifecycle management with destroy() on tab switch.
 */

import { STORAGE_KEYS } from '@/shared/constants/storage-keys';
import { eventBus } from '@/renderer/components/event-bus';
import { soundEffects } from './sound-effects';
import { Game1Memory } from './game1-memory';
import { Game2Catcher } from './game2-catcher';
import { Game3Shooter } from './game3-shooter';
import { Game4Farm } from './game4-farm';
import { showCertificateModal } from './certificate';
import { recordGameScore, showLeaderboardModal, showBadgesModal, showCertificatesModal } from './leaderboard';

export type GameId = 'game1' | 'game2' | 'game3' | 'game4';

interface DestroyableGame {
    destroy(): void;
    start(level?: number): void;
}

let activeGame: DestroyableGame | null = null;
let currentGameId: GameId | null = null;
let currentLevel = 1;
let currentScore = 0;

export function initGames(): void {
    const section = document.getElementById('game');
    if (!section) return;

    // Load active player profile
    const currentUser = localStorage.getItem(STORAGE_KEYS.GAME_CURRENT_USER) || 'Học sinh Xơ Đăng';
    const userEl = section.querySelector('#gameCurrentUserName');
    if (userEl) userEl.textContent = currentUser;

    // SFX toggle
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

    // Leaderboard, Badges, and Certificates Buttons
    section.querySelector('#btnOpenLeaderboard')?.addEventListener('click', () => showLeaderboardModal());
    section.querySelector('#btnOpenBadges')?.addEventListener('click', () => showBadgesModal());
    section.querySelector('#btnOpenCertificates')?.addEventListener('click', () => showCertificatesModal());

    // Event delegation on Game Selection Grid
    section.addEventListener('click', (e: Event) => {
        const target = e.target as HTMLElement;

        // Game Card or Play Button Click
        const card = target.closest('[data-game]') as HTMLElement | null;
        if (card && card.dataset.game) {
            const gameId = card.dataset.game as GameId;
            launchGame(gameId);
            return;
        }

        // Back to Menu Button
        if (target.closest('#btnExitGame') || target.closest('#btnBackToMenu')) {
            exitToMenu();
            return;
        }

        // Next Level Button
        if (target.closest('#btnNextLevel')) {
            const modal = section.querySelector('#gameOverModal') as HTMLElement | null;
            if (modal) modal.style.display = 'none';
            if (currentGameId) {
                currentLevel++;
                launchGame(currentGameId, currentLevel);
            }
            return;
        }

        // Claim / View Certificate Button
        if (target.closest('#btnGetCertificate')) {
            const studentName = localStorage.getItem(STORAGE_KEYS.GAME_CURRENT_USER) || 'Học sinh Xơ Đăng';
            const gameTitles: Record<GameId, string> = {
                game1: 'Lật Thẻ Trí Nhớ',
                game2: 'Mưa Từ Vựng',
                game3: 'Bảo Vệ Làng',
                game4: 'Nông Trại Số'
            };
            const title = currentGameId ? gameTitles[currentGameId] : 'Trò chơi Xơ Đăng';
            showCertificateModal({
                studentName,
                gameTitle: title,
                score: currentScore,
                level: currentLevel
            });
            return;
        }

        // Replay Level Button
        if (target.closest('#btnReplayLevel')) {
            const modal = section.querySelector('#gameOverModal') as HTMLElement | null;
            if (modal) modal.style.display = 'none';
            if (currentGameId) {
                launchGame(currentGameId, currentLevel);
            }
        }
    });

    // RULE 11: Cancel all game animation frames when switching away from the game tab
    eventBus.on('tab:change', (sectionId: string) => {
        if (sectionId !== 'game') {
            exitToMenu();
        }
    });
}

function updateSfxButtonUI(btn: HTMLButtonElement): void {
    const isEnabled = soundEffects.isEnabled();
    btn.innerHTML = isEnabled ? '<i class="fas fa-volume-up"></i>' : '<i class="fas fa-volume-mute"></i>';
    btn.classList.toggle('muted', !isEnabled);
}

export function launchGame(gameId: GameId, level: number = 1): void {
    const hubView = document.getElementById('gameHubView');
    const activeView = document.getElementById('gameActiveView');
    const stage = document.getElementById('gameStage');
    const titleEl = document.getElementById('activeGameTitle');
    const levelEl = document.getElementById('activeGameLevel');
    const scoreEl = document.getElementById('activeGameScore');
    const livesWrap = document.getElementById('activeGameLivesWrap');
    const livesEl = document.getElementById('activeGameLives');
    const modal = document.getElementById('gameOverModal');

    if (!hubView || !activeView || !stage) return;

    // Clean up previous game if still running
    if (activeGame) {
        activeGame.destroy();
        activeGame = null;
    }

    if (modal) modal.style.display = 'none';
    hubView.style.display = 'none';
    activeView.style.display = 'block';

    currentGameId = gameId;
    currentLevel = level;
    currentScore = 0;

    if (levelEl) levelEl.textContent = String(level);
    if (scoreEl) scoreEl.textContent = '0';
    if (livesEl) livesEl.textContent = '3';

    // Game Specific Setup
    const gameTitles: Record<GameId, string> = {
        game1: 'Lật Thẻ Trí Nhớ',
        game2: 'Mưa Từ Vựng',
        game3: 'Bảo Vệ Làng',
        game4: 'Nông Trại Số'
    };

    if (titleEl) titleEl.textContent = gameTitles[gameId];

    // Toggle lives visibility (Game 1 & 4 don't have hearts)
    if (livesWrap) {
        livesWrap.style.display = (gameId === 'game2' || gameId === 'game3') ? 'flex' : 'none';
    }

    // Instantiate game
    switch (gameId) {
        case 'game1':
            activeGame = new Game1Memory(stage, {
                onScoreChange: (score) => updateScore(score),
                onLevelComplete: (lvl, sc) => handleLevelComplete(lvl, sc)
            });
            break;
        case 'game2':
            activeGame = new Game2Catcher(stage, {
                onScoreChange: (score) => updateScore(score),
                onLivesChange: (lives) => {
                    if (livesEl) livesEl.textContent = String(lives);
                },
                onLevelComplete: (lvl, sc) => handleLevelComplete(lvl, sc),
                onGameOver: (sc) => handleGameOver(sc)
            });
            break;
        case 'game3':
            activeGame = new Game3Shooter(stage, {
                onScoreChange: (score) => updateScore(score),
                onLivesChange: (lives) => {
                    if (livesEl) livesEl.textContent = String(lives);
                },
                onLevelComplete: (lvl, sc) => handleLevelComplete(lvl, sc),
                onGameOver: (sc) => handleGameOver(sc)
            });
            break;
        case 'game4':
            activeGame = new Game4Farm(stage, {
                onScoreChange: (score) => updateScore(score),
                onLevelComplete: (lvl, sc) => handleLevelComplete(lvl, sc)
            });
            break;
    }

    activeGame?.start(level);
}

function updateScore(score: number): void {
    currentScore = score;
    const scoreEl = document.getElementById('activeGameScore');
    if (scoreEl) scoreEl.textContent = String(score);
}

function handleLevelComplete(level: number, score: number): void {
    if (currentGameId) {
        recordGameScore(currentGameId, score, level);
    }

    const modal = document.getElementById('gameOverModal');
    const icon = document.getElementById('modalIcon');
    const title = document.getElementById('modalTitle');
    const desc = document.getElementById('modalDesc');
    const finalScore = document.getElementById('modalFinalScore');
    const nextBtn = document.getElementById('btnNextLevel');
    const certBtn = document.getElementById('btnGetCertificate');

    if (!modal) return;
    if (icon) icon.textContent = '🎉';
    if (title) title.textContent = `Hoàn Thành Level ${level}!`;
    if (desc) desc.textContent = 'Chúc mừng bạn đã xuất sắc vượt qua thử thách từ vựng.';
    if (finalScore) finalScore.textContent = String(score);
    if (nextBtn) nextBtn.style.display = 'inline-flex';
    if (certBtn) certBtn.style.display = 'inline-flex';

    modal.style.display = 'flex';
}

function handleGameOver(score: number): void {
    if (currentGameId) {
        recordGameScore(currentGameId, score, currentLevel);
    }

    const modal = document.getElementById('gameOverModal');
    const icon = document.getElementById('modalIcon');
    const title = document.getElementById('modalTitle');
    const desc = document.getElementById('modalDesc');
    const finalScore = document.getElementById('modalFinalScore');
    const nextBtn = document.getElementById('btnNextLevel');
    const certBtn = document.getElementById('btnGetCertificate');

    if (!modal) return;
    if (icon) icon.textContent = '💔';
    if (title) title.textContent = 'Hết Lượt Chơi!';
    if (desc) desc.textContent = 'Đừng nản lòng, hãy thử lại để ghi nhớ từ vựng tốt hơn nhé.';
    if (finalScore) finalScore.textContent = String(score);
    if (nextBtn) nextBtn.style.display = 'none';
    if (certBtn) certBtn.style.display = score >= 50 ? 'inline-flex' : 'none';

    modal.style.display = 'flex';
}

export function exitToMenu(): void {
    if (activeGame) {
        activeGame.destroy();
        activeGame = null;
    }

    const hubView = document.getElementById('gameHubView');
    const activeView = document.getElementById('gameActiveView');
    const modal = document.getElementById('gameOverModal');

    if (modal) modal.style.display = 'none';
    if (activeView) activeView.style.display = 'none';
    if (hubView) hubView.style.display = 'block';

    currentGameId = null;
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
