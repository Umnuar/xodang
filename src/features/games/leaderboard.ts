import { STORAGE_KEYS } from '@/shared/constants/storage-keys';
import { getRawStorageItem, getStorageItem, setStorageItem } from '@/services/storage.service';
import { soundEffects } from './sound-effects';
import { getSavedCertificates, showCertificateModal } from './certificate';
import { createLucideIconElement } from '@/utils/icons';

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

function getAllUsers(): Record<string, UserProfile> {
    return getStorageItem<Record<string, UserProfile>>(STORAGE_KEYS.GAME_USERS, {});
}

function saveAllUsers(users: Record<string, UserProfile>): void {
    setStorageItem(STORAGE_KEYS.GAME_USERS, users);
}

export function recordGameScore(gameType: string, score: number, level: number): void {
    const currentUsername = getRawStorageItem(STORAGE_KEYS.GAME_CURRENT_USER) || 'Người học Xơ Đăng';
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

export function getUserBadges(): BadgeRecord[] {
    const currentUsername = getRawStorageItem(STORAGE_KEYS.GAME_CURRENT_USER) || 'Người học Xơ Đăng';
    const users = getAllUsers();
    const user = users[currentUsername] || { totalScore: 0, bestScore: 0, level: 1, gamesPlayed: 0 };
    const certCount = getSavedCertificates().length;

    return [
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
            name: 'Người Học Chăm Chỉ',
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
}

function createModalShell(id: string): HTMLElement {
    let modal = document.getElementById(id);
    if (!modal) {
        modal = document.createElement('div');
        modal.id = id;
        modal.className = 'game-modal-overlay';
        modal.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target === modal || target.closest('.btn-close-modal') || target.closest('.btn-close-modal-action')) {
                modal!.style.display = 'none';
            }
        });
        document.body.appendChild(modal);
    }
    return modal;
}

function createModalHeader(iconName: string, titleText: string, subtitleText?: string): HTMLElement {
    const header = document.createElement('div');
    header.className = 'cert-modal-header';

    const titleEl = document.createElement('h3');
    titleEl.appendChild(createLucideIconElement(iconName, 'lucide-icon', 20));
    titleEl.appendChild(document.createTextNode(` ${titleText}`));

    if (subtitleText !== undefined) {
        const titleWrap = document.createElement('div');
        titleWrap.appendChild(titleEl);
        const sub = document.createElement('span');
        sub.className = 'badge-stats-summary';
        sub.textContent = subtitleText;
        titleWrap.appendChild(sub);
        header.appendChild(titleWrap);
    } else {
        header.appendChild(titleEl);
    }

    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn-close-modal';
    closeBtn.setAttribute('aria-label', 'Đóng');
    closeBtn.textContent = '×';
    header.appendChild(closeBtn);

    return header;
}

function createModalFooter(): HTMLElement {
    const actions = document.createElement('div');
    actions.className = 'cert-modal-actions';

    const closeActionBtn = document.createElement('button');
    closeActionBtn.className = 'modal-btn btn-secondary btn-close-modal-action';
    closeActionBtn.textContent = 'Đóng';
    actions.appendChild(closeActionBtn);

    return actions;
}

function createEmptyState(icon: string, message: string, subMessage: string): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'empty-state-wrap';

    const iconDiv = document.createElement('div');
    iconDiv.className = 'empty-icon';
    iconDiv.textContent = icon;

    const msgP = document.createElement('p');
    msgP.textContent = message;

    const subP = document.createElement('p');
    subP.className = 'empty-sub';
    subP.textContent = subMessage;

    wrap.appendChild(iconDiv);
    wrap.appendChild(msgP);
    wrap.appendChild(subP);
    return wrap;
}

export function showLeaderboardModal(): void {
    soundEffects.click();
    const leaderboard = getLeaderboard();
    const currentUsername = getRawStorageItem(STORAGE_KEYS.GAME_CURRENT_USER) || 'Người học Xơ Đăng';
    const modal = createModalShell('leaderboardModal');

    const card = document.createElement('div');
    card.className = 'game-modal-card leaderboard-modal-card';
    card.appendChild(createModalHeader('trophy', 'Bảng Vàng Thành Tích'));

    const body = document.createElement('div');
    body.className = 'leaderboard-body';

    if (leaderboard.length === 0) {
        body.appendChild(createEmptyState(
            '🏆',
            'Chưa có kỷ lục nào được ghi nhận.',
            'Hãy hoàn thành một màn chơi để là người đầu tiên lên bảng vàng!'
        ));
    } else {
        const list = document.createElement('div');
        list.className = 'leaderboard-list';

        leaderboard.forEach((entry, idx) => {
            const isMe = entry.name === currentUsername;
            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;

            const item = document.createElement('div');
            item.className = `leaderboard-item${isMe ? ' is-current-user' : ''}`;

            const rankCol = document.createElement('div');
            rankCol.className = 'rank-col';
            rankCol.textContent = medal;

            const infoCol = document.createElement('div');
            infoCol.className = 'info-col';

            const nameDiv = document.createElement('div');
            nameDiv.className = 'player-name';
            nameDiv.appendChild(document.createTextNode(entry.name));
            if (isMe) {
                const badge = document.createElement('span');
                badge.className = 'you-badge';
                badge.textContent = ' (Bạn)';
                nameDiv.appendChild(badge);
            }

            const metaDiv = document.createElement('div');
            metaDiv.className = 'player-meta';
            metaDiv.textContent = `Level ${entry.level} • ${entry.gamesPlayed} trận`;

            infoCol.appendChild(nameDiv);
            infoCol.appendChild(metaDiv);

            const scoreCol = document.createElement('div');
            scoreCol.className = 'score-col';

            const scoreVal = document.createElement('div');
            scoreVal.className = 'player-score';
            scoreVal.textContent = String(entry.totalScore);

            const scoreLabel = document.createElement('div');
            scoreLabel.className = 'score-label';
            scoreLabel.textContent = 'điểm';

            scoreCol.appendChild(scoreVal);
            scoreCol.appendChild(scoreLabel);

            item.appendChild(rankCol);
            item.appendChild(infoCol);
            item.appendChild(scoreCol);
            list.appendChild(item);
        });

        body.appendChild(list);
    }

    card.appendChild(body);
    card.appendChild(createModalFooter());
    modal.replaceChildren(card);
    modal.style.display = 'flex';
}

export function showBadgesModal(): void {
    soundEffects.click();
    const badges = getUserBadges();
    const unlockedCount = badges.filter(b => b.isUnlocked).length;
    const modal = createModalShell('badgesModal');

    const card = document.createElement('div');
    card.className = 'game-modal-card badges-modal-card';
    card.appendChild(createModalHeader('award', 'Bộ Sưu Tập Huy Hiệu', `Đã mở khóa: ${unlockedCount}/${badges.length}`));

    const grid = document.createElement('div');
    grid.className = 'badges-grid-container';

    badges.forEach(b => {
        const badgeCard = document.createElement('div');
        badgeCard.className = `badge-card ${b.isUnlocked ? 'unlocked' : 'locked'}`;

        const iconDiv = document.createElement('div');
        iconDiv.className = 'badge-icon';
        iconDiv.textContent = b.icon;

        const infoDiv = document.createElement('div');
        infoDiv.className = 'badge-info';

        const nameDiv = document.createElement('div');
        nameDiv.className = 'badge-name';
        nameDiv.textContent = b.name;

        const descDiv = document.createElement('div');
        descDiv.className = 'badge-desc';
        descDiv.textContent = b.desc;

        infoDiv.appendChild(nameDiv);
        infoDiv.appendChild(descDiv);

        const statusTag = document.createElement('div');
        statusTag.className = 'badge-status-tag';

        const statusSpan = document.createElement('span');
        statusSpan.className = b.isUnlocked ? 'status-done' : 'status-locked';
        statusSpan.textContent = b.isUnlocked ? '✓ Đã đạt' : '🔒 Chưa đạt';
        statusTag.appendChild(statusSpan);

        badgeCard.appendChild(iconDiv);
        badgeCard.appendChild(infoDiv);
        badgeCard.appendChild(statusTag);
        grid.appendChild(badgeCard);
    });

    card.appendChild(grid);
    card.appendChild(createModalFooter());
    modal.replaceChildren(card);
    modal.style.display = 'flex';
}

export function showCertificatesModal(): void {
    soundEffects.click();
    const certificates = getSavedCertificates();
    let modal = document.getElementById('certificatesListModal');
    if (!modal) {
        modal = createModalShell('certificatesListModal');
        modal.addEventListener('click', (e) => {
            const viewBtn = (e.target as HTMLElement).closest('.btn-view-cert') as HTMLElement | null;
            if (!viewBtn) return;
            const certId = viewBtn.dataset.certId;
            const cert = getSavedCertificates().find(c => c.id === certId);
            if (cert) {
                modal!.style.display = 'none';
                showCertificateModal({
                    studentName: cert.studentName,
                    gameTitle: cert.gameTitle,
                    score: cert.score,
                    level: cert.level,
                    id: cert.id,
                    date: cert.date,
                    persist: false
                });
            }
        });
    }

    const card = document.createElement('div');
    card.className = 'game-modal-card certs-list-modal-card';
    card.appendChild(createModalHeader('award', 'Kho Giấy Chứng Nhận Của Bạn'));

    const body = document.createElement('div');
    body.className = 'certs-list-body';

    if (certificates.length === 0) {
        body.appendChild(createEmptyState(
            '📜',
            'Bạn chưa có giấy chứng nhận nào.',
            'Hãy chiến thắng các minigame để nhận bằng khen vinh danh!'
        ));
    } else {
        const grid = document.createElement('div');
        grid.className = 'certs-grid';

        certificates.forEach(c => {
            const item = document.createElement('div');
            item.className = 'cert-card-item';

            const badge = document.createElement('div');
            badge.className = 'cert-card-badge';
            badge.textContent = '🎓';

            const details = document.createElement('div');
            details.className = 'cert-card-details';

            const title = document.createElement('h4');
            title.textContent = c.gameTitle;

            const meta = document.createElement('div');
            meta.className = 'cert-card-meta';
            meta.textContent = `Level ${c.level} • ${c.score} điểm`;

            const date = document.createElement('div');
            date.className = 'cert-card-date';
            date.textContent = `Ngày cấp: ${c.date}`;

            details.appendChild(title);
            details.appendChild(meta);
            details.appendChild(date);

            const viewBtn = document.createElement('button');
            viewBtn.className = 'btn-view-cert modal-btn btn-primary';
            viewBtn.dataset.certId = c.id;
            viewBtn.appendChild(createLucideIconElement('eye', 'lucide-icon', 16));
            viewBtn.appendChild(document.createTextNode(' Xem & Tải'));

            item.appendChild(badge);
            item.appendChild(details);
            item.appendChild(viewBtn);
            grid.appendChild(item);
        });

        body.appendChild(grid);
    }

    card.appendChild(body);
    card.appendChild(createModalFooter());
    modal.replaceChildren(card);
    modal.style.display = 'flex';
}
