/**
 * Minigames Leaderboard & Badges Controller
 * Manages player profiles, high scores, leaderboard rankings, and badge achievements
 * in compliance with original game.html specifications.
 */

import { STORAGE_KEYS } from '@/shared/constants/storage-keys';
import { soundEffects } from './sound-effects';
import { getSavedCertificates, showCertificateModal } from './certificate';

export interface LeaderboardEntry {
    name: string;
    totalScore: number;
    bestScore: number;
    level: number;
    gamesPlayed: number;
    lastPlayed: number;
}

export interface BadgeRecord {
    id: string;
    icon: string;
    name: string;
    desc: string;
    category: 'Điểm' | 'Trận đấu' | 'Cấp độ' | 'Chứng chỉ';
    isUnlocked: boolean;
}

interface UserProfile {
    name: string;
    totalScore: number;
    bestScore: number;
    level: number;
    gamesPlayed: number;
    lastPlayed: number;
    gameScores?: Record<string, { score: number; level: number; timestamp: number }[]>;
    highestLevels?: Record<string, number>;
}

/**
 * Loads all users from localStorage.
 */
function getAllUsers(): Record<string, UserProfile> {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.GAME_USERS);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

/**
 * Saves all users back to localStorage.
 */
function saveAllUsers(users: Record<string, UserProfile>): void {
    try {
        localStorage.setItem(STORAGE_KEYS.GAME_USERS, JSON.stringify(users));
    } catch {
        // Ignore quota error
    }
}

/**
 * Records a completed game score for the current active player.
 */
export function recordGameScore(gameType: string, score: number, level: number): void {
    const currentUsername = localStorage.getItem(STORAGE_KEYS.GAME_CURRENT_USER) || 'Học sinh Xơ Đăng';
    const users = getAllUsers();

    if (!users[currentUsername]) {
        users[currentUsername] = {
            name: currentUsername,
            totalScore: 0,
            bestScore: 0,
            level: 1,
            gamesPlayed: 0,
            lastPlayed: Date.now(),
            gameScores: {},
            highestLevels: {}
        };
    }

    const user = users[currentUsername];
    user.gamesPlayed = (user.gamesPlayed || 0) + 1;
    user.totalScore = (user.totalScore || 0) + score;
    user.bestScore = Math.max(user.bestScore || 0, score);
    user.level = Math.max(user.level || 1, level);
    user.lastPlayed = Date.now();

    if (!user.gameScores) user.gameScores = {};
    if (!user.gameScores[gameType]) user.gameScores[gameType] = [];
    user.gameScores[gameType].push({ score, level, timestamp: Date.now() });

    if (!user.highestLevels) user.highestLevels = {};
    user.highestLevels[gameType] = Math.max(user.highestLevels[gameType] || 0, level);

    saveAllUsers(users);
}

/**
 * Calculates top 10 leaderboard entries.
 */
export function getLeaderboard(): LeaderboardEntry[] {
    const users = getAllUsers();
    const list = Object.values(users).map(u => ({
        name: u.name,
        totalScore: u.totalScore || 0,
        bestScore: u.bestScore || 0,
        level: u.level || 1,
        gamesPlayed: u.gamesPlayed || 0,
        lastPlayed: u.lastPlayed || 0
    }));

    list.sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        if (b.bestScore !== a.bestScore) return b.bestScore - a.bestScore;
        return b.lastPlayed - a.lastPlayed;
    });

    return list.slice(0, 10);
}

/**
 * Evaluates unlock status for all badge milestones based on active user stats.
 */
export function getUserBadges(): BadgeRecord[] {
    const currentUsername = localStorage.getItem(STORAGE_KEYS.GAME_CURRENT_USER) || 'Học sinh Xơ Đăng';
    const users = getAllUsers();
    const user = users[currentUsername] || { totalScore: 0, bestScore: 0, level: 1, gamesPlayed: 0 };
    const certCount = getSavedCertificates().length;

    const badges: BadgeRecord[] = [
        {
            id: 'score_100',
            icon: '⭐',
            name: 'Khởi Đầu Vững Chắc',
            desc: 'Đạt tổng điểm từ 100 trở lên',
            category: 'Điểm',
            isUnlocked: user.totalScore >= 100
        },
        {
            id: 'score_500',
            icon: '🌟',
            name: 'Chiến Binh Từ Vựng',
            desc: 'Đạt tổng điểm từ 500 trở lên',
            category: 'Điểm',
            isUnlocked: user.totalScore >= 500
        },
        {
            id: 'score_1000',
            icon: '🏆',
            name: 'Cao Thủ Ngôn Ngữ',
            desc: 'Đạt tổng điểm từ 1.000 trở lên',
            category: 'Điểm',
            isUnlocked: user.totalScore >= 1000
        },
        {
            id: 'score_2000',
            icon: '👑',
            name: 'Huyền Thoại Xơ Đăng',
            desc: 'Đạt tổng điểm từ 2.000 trở lên',
            category: 'Điểm',
            isUnlocked: user.totalScore >= 2000
        },
        {
            id: 'games_1',
            icon: '🎮',
            name: 'Tân Thủ Nhập Môn',
            desc: 'Hoàn thành trận chơi đầu tiên',
            category: 'Trận đấu',
            isUnlocked: user.gamesPlayed >= 1
        },
        {
            id: 'games_5',
            icon: '🎯',
            name: 'Học Sinh Chăm Chỉ',
            desc: 'Tham gia từ 5 trận chơi',
            category: 'Trận đấu',
            isUnlocked: user.gamesPlayed >= 5
        },
        {
            id: 'games_15',
            icon: '⚡',
            name: 'Bậc Thầy Luyện Tập',
            desc: 'Tham gia từ 15 trận chơi',
            category: 'Trận đấu',
            isUnlocked: user.gamesPlayed >= 15
        },
        {
            id: 'level_3',
            icon: '🎖️',
            name: 'Vượt Qua Thử Thách',
            desc: 'Chinh phục Cấp độ 3 của bất kỳ minigame nào',
            category: 'Cấp độ',
            isUnlocked: user.level >= 3
        },
        {
            id: 'cert_1',
            icon: '📜',
            name: 'Cử Nhân Tí Hon',
            desc: 'Nhận ít nhất 1 Giấy Chứng Nhận Tốt Nghiệp',
            category: 'Chứng chỉ',
            isUnlocked: certCount >= 1
        }
    ];

    return badges;
}

/**
 * Displays the Leaderboard Modal dialog.
 */
export function showLeaderboardModal(): void {
    soundEffects.click();
    const leaderboard = getLeaderboard();
    const currentUsername = localStorage.getItem(STORAGE_KEYS.GAME_CURRENT_USER) || 'Học sinh Xơ Đăng';

    let modal = document.getElementById('leaderboardModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'leaderboardModal';
        modal.className = 'game-modal-overlay';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="game-modal-card leaderboard-modal-card">
            <div class="cert-modal-header">
                <h3><i class="fas fa-trophy" style="color: #f59e0b;"></i> Bảng Vàng Thành Tích</h3>
                <button class="btn-close-modal" aria-label="Đóng">&times;</button>
            </div>
            <div class="leaderboard-body">
                ${leaderboard.length === 0 ? `
                    <div class="empty-state-wrap">
                        <div class="empty-icon">🏆</div>
                        <p>Chưa có kỷ lục nào được ghi nhận.</p>
                        <p class="empty-sub">Hãy hoàn thành một màn chơi để là người đầu tiên lên bảng vàng!</p>
                    </div>
                ` : `
                    <div class="leaderboard-list">
                        ${leaderboard.map((entry, idx) => {
                            const isMe = entry.name === currentUsername;
                            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
                            return `
                                <div class="leaderboard-item ${isMe ? 'is-current-user' : ''}">
                                    <div class="rank-col">${medal}</div>
                                    <div class="info-col">
                                        <div class="player-name">${entry.name} ${isMe ? '<span class="you-badge">(Bạn)</span>' : ''}</div>
                                        <div class="player-meta">Level ${entry.level} • ${entry.gamesPlayed} trận</div>
                                    </div>
                                    <div class="score-col">
                                        <div class="player-score">${entry.totalScore}</div>
                                        <div class="score-label">điểm</div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `}
            </div>
            <div class="cert-modal-actions">
                <button class="modal-btn btn-secondary btn-close-modal-action">Đóng</button>
            </div>
        </div>
    `;

    const closeModal = () => { if (modal) modal.style.display = 'none'; };
    modal.querySelector('.btn-close-modal')?.addEventListener('click', closeModal);
    modal.querySelector('.btn-close-modal-action')?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    modal.style.display = 'flex';
}

/**
 * Displays the Badges Showcase Modal.
 */
export function showBadgesModal(): void {
    soundEffects.click();
    const badges = getUserBadges();
    const unlockedCount = badges.filter(b => b.isUnlocked).length;

    let modal = document.getElementById('badgesModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'badgesModal';
        modal.className = 'game-modal-overlay';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="game-modal-card badges-modal-card">
            <div class="cert-modal-header">
                <div>
                    <h3><i class="fas fa-medal" style="color: #ec4899;"></i> Bộ Sưu Tập Huy Hiệu</h3>
                    <span class="badge-stats-summary">Đã mở khóa: ${unlockedCount}/${badges.length}</span>
                </div>
                <button class="btn-close-modal" aria-label="Đóng">&times;</button>
            </div>
            <div class="badges-grid-container">
                ${badges.map(b => `
                    <div class="badge-card ${b.isUnlocked ? 'unlocked' : 'locked'}">
                        <div class="badge-icon">${b.icon}</div>
                        <div class="badge-info">
                            <div class="badge-name">${b.name}</div>
                            <div class="badge-desc">${b.desc}</div>
                        </div>
                        <div class="badge-status-tag">
                            ${b.isUnlocked ? '<span class="status-done">✓ Đã đạt</span>' : '<span class="status-locked">🔒 Chưa đạt</span>'}
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="cert-modal-actions">
                <button class="modal-btn btn-secondary btn-close-modal-action">Đóng</button>
            </div>
        </div>
    `;

    const closeModal = () => { if (modal) modal.style.display = 'none'; };
    modal.querySelector('.btn-close-modal')?.addEventListener('click', closeModal);
    modal.querySelector('.btn-close-modal-action')?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    modal.style.display = 'flex';
}

/**
 * Displays the list of all earned certificates with instant preview & re-download.
 */
export function showCertificatesModal(): void {
    soundEffects.click();
    const certificates = getSavedCertificates();

    let modal = document.getElementById('certificatesListModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'certificatesListModal';
        modal.className = 'game-modal-overlay';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="game-modal-card certs-list-modal-card">
            <div class="cert-modal-header">
                <h3><i class="fas fa-certificate" style="color: #f59e0b;"></i> Kho Giấy Chứng Nhận Của Bạn</h3>
                <button class="btn-close-modal" aria-label="Đóng">&times;</button>
            </div>
            <div class="certs-list-body">
                ${certificates.length === 0 ? `
                    <div class="empty-state-wrap">
                        <div class="empty-icon">📜</div>
                        <p>Bạn chưa có giấy chứng nhận nào.</p>
                        <p class="empty-sub">Hãy chiến thắng các minigame để nhận bằng khen vinh danh!</p>
                    </div>
                ` : `
                    <div class="certs-grid">
                        ${certificates.map((c) => `
                            <div class="cert-card-item">
                                <div class="cert-card-badge">🎓</div>
                                <div class="cert-card-details">
                                    <h4>${c.gameTitle}</h4>
                                    <div class="cert-card-meta">Level ${c.level} • ${c.score} điểm</div>
                                    <div class="cert-card-date">Ngày cấp: ${c.date}</div>
                                </div>
                                <button class="btn-view-cert modal-btn btn-primary" data-cert-id="${c.id}">
                                    <i class="fas fa-eye"></i> Xem & Tải
                                </button>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
            <div class="cert-modal-actions">
                <button class="modal-btn btn-secondary btn-close-modal-action">Đóng</button>
            </div>
        </div>
    `;

    const closeModal = () => { if (modal) modal.style.display = 'none'; };
    modal.querySelector('.btn-close-modal')?.addEventListener('click', closeModal);
    modal.querySelector('.btn-close-modal-action')?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    // Handle view cert click
    modal.querySelectorAll('.btn-view-cert').forEach(btn => {
        btn.addEventListener('click', () => {
            const certId = (btn as HTMLElement).dataset.certId;
            const cert = certificates.find(c => c.id === certId);
            if (cert) {
                closeModal();
                showCertificateModal({
                    studentName: cert.studentName,
                    gameTitle: cert.gameTitle,
                    score: cert.score,
                    level: cert.level
                });
            }
        });
    });

    modal.style.display = 'flex';
}
