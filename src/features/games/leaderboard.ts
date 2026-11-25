import { STORAGE_KEYS } from '@/shared/constants/storage-keys';
import { getRawStorageItem, getStorageItem, setStorageItem } from '@/services/storage.service';
import { soundEffects } from './sound-effects';
import { getSavedCertificates, showCertificateModal, type CertificateRecord } from './certificate';
import { createLucideIconElement } from '@/utils/icons';
import { openAccessibleModal, closeAccessibleModal } from '@/utils/modal-a11y';

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

interface GameScoreRecord {
    score: number;
    level: number;
    timestamp: number;
    completed?: boolean;
}

interface UserProfile {
    name: string;
    totalScore: number;
    bestScore: number;
    level: number;
    gamesPlayed: number;
    gamesCompleted?: number;
    lastPlayed: number;
    gameScores?: Record<string, GameScoreRecord[]>;
    highestLevels?: Record<string, number>;
}

const MAX_GAME_SCORE_HISTORY = 50;
const DEFAULT_USER_NAME = 'Người học Xơ Đăng';

function getCurrentUsername(): string {
    return getRawStorageItem(STORAGE_KEYS.GAME_CURRENT_USER) || DEFAULT_USER_NAME;
}

function getAllUsers(): Record<string, UserProfile> {
    return getStorageItem<Record<string, UserProfile>>(STORAGE_KEYS.GAME_USERS, {});
}

function saveAllUsers(users: Record<string, UserProfile>): void {
    setStorageItem(STORAGE_KEYS.GAME_USERS, users);
}

export function recordGameScore(
    gameType: string,
    score: number,
    level: number,
    completed: boolean = true,
    runBestScore?: number
): void {
    const currentUsername = getCurrentUsername();
    const users = getAllUsers();

    if (!users[currentUsername]) {
        users[currentUsername] = {
            name: currentUsername,
            totalScore: 0,
            bestScore: 0,
            level: 1,
            gamesPlayed: 0,
            gamesCompleted: 0,
            lastPlayed: Date.now(),
            gameScores: {},
            highestLevels: {}
        };
    }

    const user = users[currentUsername];
    user.gamesPlayed = (user.gamesPlayed || 0) + 1;
    user.totalScore = (user.totalScore || 0) + score;
    user.bestScore = Math.max(user.bestScore || 0, score, runBestScore ?? 0);
    user.lastPlayed = Date.now();

    if (completed) {
        user.gamesCompleted = (user.gamesCompleted ?? 0) + 1;
        user.level = Math.max(user.level || 1, level);
        if (!user.highestLevels) user.highestLevels = {};
        user.highestLevels[gameType] = Math.max(user.highestLevels[gameType] || 0, level);
    }

    if (!user.gameScores) user.gameScores = {};
    if (!user.gameScores[gameType]) user.gameScores[gameType] = [];
    user.gameScores[gameType].push({ score, level, timestamp: Date.now(), completed });
    if (user.gameScores[gameType].length > MAX_GAME_SCORE_HISTORY) {
        user.gameScores[gameType] = user.gameScores[gameType].slice(-MAX_GAME_SCORE_HISTORY);
    }

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
    const currentUsername = getCurrentUsername();
    const users = getAllUsers();
    const user: Partial<UserProfile> = users[currentUsername] || {
        totalScore: 0,
        bestScore: 0,
        level: 1,
        gamesPlayed: 0,
        gamesCompleted: 0
    };
    const totalScore = user.totalScore || 0;
    const gamesPlayed = user.gamesPlayed || 0;
    const gamesCompleted = user.gamesCompleted !== undefined
        ? user.gamesCompleted
        : (totalScore > 0 ? gamesPlayed : 0);
    const level = user.level || 1;
    const userCertCount = getSavedCertificates().filter(c => c.studentName === currentUsername).length;

    return [
        {
            id: 'score_100',
            icon: 'sparkles',
            name: 'Khởi Đầu Vững Chắc',
            desc: 'Đạt tổng điểm từ 100 trở lên',
            category: 'Điểm',
            isUnlocked: totalScore >= 100
        },
        {
            id: 'score_500',
            icon: 'award',
            name: 'Chiến Binh Từ Vựng',
            desc: 'Đạt tổng điểm từ 500 trở lên',
            category: 'Điểm',
            isUnlocked: totalScore >= 500
        },
        {
            id: 'score_1000',
            icon: 'trophy',
            name: 'Cao Thủ Ngôn Ngữ',
            desc: 'Đạt tổng điểm từ 1.000 trở lên',
            category: 'Điểm',
            isUnlocked: totalScore >= 1000
        },
        {
            id: 'score_2000',
            icon: 'medal',
            name: 'Huyền Thoại Xơ Đăng',
            desc: 'Đạt tổng điểm từ 2.000 trở lên',
            category: 'Điểm',
            isUnlocked: totalScore >= 2000
        },
        {
            id: 'games_1',
            icon: 'gamepad-2',
            name: 'Tân Thủ Nhập Môn',
            desc: 'Hoàn thành trận chơi đầu tiên',
            category: 'Trận đấu',
            isUnlocked: gamesCompleted >= 1
        },
        {
            id: 'games_5',
            icon: 'check-circle',
            name: 'Người Học Chăm Chỉ',
            desc: 'Tham gia từ 5 trận chơi',
            category: 'Trận đấu',
            isUnlocked: gamesPlayed >= 5
        },
        {
            id: 'games_15',
            icon: 'layers',
            name: 'Bậc Thầy Luyện Tập',
            desc: 'Tham gia từ 15 trận chơi',
            category: 'Trận đấu',
            isUnlocked: gamesPlayed >= 15
        },
        {
            id: 'level_3',
            icon: 'shield',
            name: 'Vượt Qua Thử Thách',
            desc: 'Chinh phục Cấp độ 3 của bất kỳ minigame nào',
            category: 'Cấp độ',
            isUnlocked: level >= 3
        },
        {
            id: 'cert_1',
            icon: 'graduation-cap',
            name: 'Cử Nhân Tí Hon',
            desc: 'Nhận ít nhất 1 Giấy Chứng Nhận Tốt Nghiệp',
            category: 'Chứng chỉ',
            isUnlocked: userCertCount >= 1
        }
    ];
}

function closeModalById(id: string): void {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'none';
        closeAccessibleModal(modal);
    }
}

export function closeAllLeaderboardModals(): void {
    closeModalById('leaderboardModal');
    closeModalById('badgesModal');
    closeModalById('certificatesListModal');
}

function createModalShell(id: string): HTMLElement {
    let modal = document.getElementById(id);
    if (!modal) {
        modal = document.createElement('div');
        modal.id = id;
        modal.className = 'game-modal-overlay';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', `${id}Heading`);
        modal.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target === modal || target.closest('.btn-close-modal') || target.closest('.btn-close-modal-action')) {
                closeModalById(id);
            }
        });
        document.body.appendChild(modal);
    }
    return modal;
}

function createModalHeader(modalId: string, iconName: string, titleText: string, subtitleText?: string): HTMLElement {
    const header = document.createElement('div');
    header.className = 'cert-modal-header';

    const titleEl = document.createElement('h3');
    titleEl.id = `${modalId}Heading`;
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
    closeBtn.type = 'button';
    closeBtn.className = 'btn-close-modal';
    closeBtn.setAttribute('aria-label', 'Đóng');
    closeBtn.appendChild(createLucideIconElement('x', 'lucide-icon', 20));
    header.appendChild(closeBtn);

    return header;
}

function createModalFooter(): HTMLElement {
    const actions = document.createElement('div');
    actions.className = 'cert-modal-actions';

    const closeActionBtn = document.createElement('button');
    closeActionBtn.type = 'button';
    closeActionBtn.className = 'game-modal-btn btn-secondary btn-close-modal-action';
    closeActionBtn.textContent = 'Đóng';
    actions.appendChild(closeActionBtn);

    return actions;
}

function createEmptyState(iconName: string, message: string, subMessage: string): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'empty-state-wrap';

    const iconDiv = document.createElement('div');
    iconDiv.className = 'empty-icon';
    iconDiv.appendChild(createLucideIconElement(iconName, 'lucide-icon', 36));

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
    const currentUsername = getCurrentUsername();
    const modalId = 'leaderboardModal';
    const modal = createModalShell(modalId);

    const card = document.createElement('div');
    card.className = 'game-modal-card leaderboard-modal-card';
    card.appendChild(createModalHeader(modalId, 'trophy', 'Bảng Vàng Thành Tích'));

    const body = document.createElement('div');
    body.className = 'leaderboard-body';

    if (leaderboard.length === 0) {
        body.appendChild(createEmptyState(
            'trophy',
            'Chưa có kỷ lục nào được ghi nhận.',
            'Hãy hoàn thành một màn chơi để là người đầu tiên lên bảng vàng!'
        ));
    } else {
        const list = document.createElement('div');
        list.className = 'leaderboard-list';

        leaderboard.forEach((entry, idx) => {
            const isMe = entry.name === currentUsername;

            const item = document.createElement('div');
            item.className = `leaderboard-item${isMe ? ' is-current-user' : ''}`;

            const rankCol = document.createElement('div');
            rankCol.className = `rank-col${idx < 3 ? ` rank-top-${idx + 1}` : ''}`;
            if (idx < 3) {
                rankCol.appendChild(createLucideIconElement('medal', 'lucide-icon', 18));
            }
            const rankText = document.createElement('span');
            rankText.textContent = `#${idx + 1}`;
            rankCol.appendChild(rankText);

            const infoCol = document.createElement('div');
            infoCol.className = 'info-col';

            const nameDiv = document.createElement('div');
            nameDiv.className = 'player-name';
            nameDiv.appendChild(document.createTextNode(entry.name));
            if (isMe) {
                const badge = document.createElement('span');
                badge.className = 'you-badge';
                badge.textContent = 'Bạn';
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
    openAccessibleModal(modal, {
        labelledById: `${modalId}Heading`,
        onClose: () => closeModalById(modalId)
    });
}

export function showBadgesModal(): void {
    soundEffects.click();
    const badges = getUserBadges();
    const unlockedCount = badges.filter(b => b.isUnlocked).length;
    const modalId = 'badgesModal';
    const modal = createModalShell(modalId);

    const card = document.createElement('div');
    card.className = 'game-modal-card badges-modal-card';
    card.appendChild(createModalHeader(modalId, 'award', 'Bộ Sưu Tập Huy Hiệu', `Đã mở khóa: ${unlockedCount}/${badges.length}`));

    const grid = document.createElement('div');
    grid.className = 'badges-grid-container';

    badges.forEach(b => {
        const badgeCard = document.createElement('div');
        badgeCard.className = `badge-card ${b.isUnlocked ? 'unlocked' : 'locked'}`;

        const iconDiv = document.createElement('div');
        iconDiv.className = 'badge-icon';
        iconDiv.appendChild(createLucideIconElement(b.icon, 'lucide-icon', 22));

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
        if (b.isUnlocked) {
            statusSpan.appendChild(createLucideIconElement('check', 'lucide-icon', 14));
            statusSpan.appendChild(document.createTextNode(' Đã đạt'));
        } else {
            statusSpan.appendChild(createLucideIconElement('x', 'lucide-icon', 14));
            statusSpan.appendChild(document.createTextNode(' Chưa đạt'));
        }
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
    openAccessibleModal(modal, {
        labelledById: `${modalId}Heading`,
        onClose: () => closeModalById(modalId)
    });
}

function renderCertificateCardsGrid(grid: HTMLElement, certificates: CertificateRecord[]): void {
    grid.replaceChildren();
    certificates.forEach(c => {
        const item = document.createElement('div');
        item.className = 'cert-card-item';

        const badge = document.createElement('div');
        badge.className = 'cert-card-badge';
        badge.appendChild(createLucideIconElement('graduation-cap', 'lucide-icon', 28));

        const details = document.createElement('div');
        details.className = 'cert-card-details';

        const title = document.createElement('h4');
        title.textContent = c.gameTitle;

        const owner = document.createElement('div');
        owner.className = 'cert-card-owner';
        owner.textContent = `Học viên: ${c.studentName}`;

        const meta = document.createElement('div');
        meta.className = 'cert-card-meta';
        meta.textContent = `Level ${c.level} • ${c.score} điểm`;

        const date = document.createElement('div');
        date.className = 'cert-card-date';
        date.textContent = `Ngày cấp: ${c.date}`;

        details.appendChild(title);
        details.appendChild(owner);
        details.appendChild(meta);
        details.appendChild(date);

        const viewBtn = document.createElement('button');
        viewBtn.type = 'button';
        viewBtn.className = 'btn-view-cert game-modal-btn btn-primary';
        viewBtn.dataset.certId = c.id;
        viewBtn.appendChild(createLucideIconElement('eye', 'lucide-icon', 16));
        viewBtn.appendChild(document.createTextNode(' Xem & Tải'));

        item.appendChild(badge);
        item.appendChild(details);
        item.appendChild(viewBtn);
        grid.appendChild(item);
    });
}

export function showCertificatesModal(): void {
    soundEffects.click();
    const allCertificates = getSavedCertificates();
    const currentUsername = getCurrentUsername();
    const myCertificates = allCertificates.filter(c => c.studentName === currentUsername);
    const modalId = 'certificatesListModal';
    let modal = document.getElementById(modalId);
    if (!modal) {
        modal = createModalShell(modalId);
        modal.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const filterBtn = target.closest('.certs-filter-btn') as HTMLElement | null;
            if (filterBtn) {
                const scope = filterBtn.dataset.filterScope;
                const latestAll = getSavedCertificates();
                const latestUser = getCurrentUsername();
                const filtered = scope === 'mine'
                    ? latestAll.filter(c => c.studentName === latestUser)
                    : latestAll;
                modal!.querySelectorAll('.certs-filter-btn').forEach(btn => {
                    const isActive = btn === filterBtn;
                    btn.classList.toggle('active', isActive);
                    btn.setAttribute('aria-pressed', String(isActive));
                });
                const gridEl = modal!.querySelector('.certs-grid') as HTMLElement | null;
                const emptyEl = modal!.querySelector('.certs-filtered-empty') as HTMLElement | null;
                if (gridEl && emptyEl) {
                    if (filtered.length === 0) {
                        gridEl.hidden = true;
                        emptyEl.hidden = false;
                    } else {
                        gridEl.hidden = false;
                        emptyEl.hidden = true;
                        renderCertificateCardsGrid(gridEl, filtered);
                    }
                }
                return;
            }

            const viewBtn = target.closest('.btn-view-cert') as HTMLElement | null;
            if (!viewBtn) return;
            const certId = viewBtn.dataset.certId;
            const cert = getSavedCertificates().find(c => c.id === certId);
            if (cert) {
                closeModalById(modalId);
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
    card.appendChild(createModalHeader(modalId, 'award', 'Kho Giấy Chứng Nhận'));

    const body = document.createElement('div');
    body.className = 'certs-list-body';

    if (allCertificates.length === 0) {
        body.appendChild(createEmptyState(
            'graduation-cap',
            'Bạn chưa có giấy chứng nhận nào.',
            'Hãy chiến thắng các minigame để nhận bằng khen vinh danh!'
        ));
    } else {
        const filterBar = document.createElement('div');
        filterBar.className = 'certs-filter-bar';

        const allBtn = document.createElement('button');
        allBtn.type = 'button';
        allBtn.className = 'certs-filter-btn active';
        allBtn.dataset.filterScope = 'all';
        allBtn.setAttribute('aria-pressed', 'true');
        allBtn.textContent = `Tất cả (${allCertificates.length})`;

        const mineBtn = document.createElement('button');
        mineBtn.type = 'button';
        mineBtn.className = 'certs-filter-btn';
        mineBtn.dataset.filterScope = 'mine';
        mineBtn.setAttribute('aria-pressed', 'false');
        mineBtn.textContent = `Của ${currentUsername} (${myCertificates.length})`;

        filterBar.appendChild(allBtn);
        filterBar.appendChild(mineBtn);
        body.appendChild(filterBar);

        const grid = document.createElement('div');
        grid.className = 'certs-grid';
        renderCertificateCardsGrid(grid, allCertificates);
        body.appendChild(grid);

        const filteredEmpty = createEmptyState(
            'graduation-cap',
            `${currentUsername} chưa có giấy chứng nhận nào.`,
            'Hoàn thành màn chơi để nhận chứng nhận mang tên bạn!'
        );
        filteredEmpty.classList.add('certs-filtered-empty');
        filteredEmpty.hidden = true;
        body.appendChild(filteredEmpty);
    }

    card.appendChild(body);
    card.appendChild(createModalFooter());
    modal.replaceChildren(card);
    modal.style.display = 'flex';
    openAccessibleModal(modal, {
        labelledById: `${modalId}Heading`,
        onClose: () => closeModalById(modalId)
    });
}
