import { STORAGE_KEYS } from '@/shared/constants/storage-keys';
import { getRawStorageItem, getStorageItem, setStorageItem } from '@/services/storage.service';
import { soundEffects } from './sound-effects';
import { getLucideIcon } from '@/utils/icons';

export interface CertificateRecord {
    id: string;
    gameTitle: string;
    studentName: string;
    score: number;
    level: number;
    date: string;
    timestamp: number;
}

interface StoredUserCertBucket {
    name: string;
    certificates?: CertificateRecord[];
}

let activeCertificateCanvas: HTMLCanvasElement | null = null;
let activeCertificateStudentName = '';

export function getSavedCertificates(): CertificateRecord[] {
    return getStorageItem<CertificateRecord[]>(STORAGE_KEYS.GAME_CERTIFICATES, []);
}

export function saveCertificate(cert: Omit<CertificateRecord, 'id' | 'timestamp'>): CertificateRecord {
    const list = getSavedCertificates();
    const newCert: CertificateRecord = {
        ...cert,
        id: `cert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: Date.now()
    };
    list.unshift(newCert);

    setStorageItem(STORAGE_KEYS.GAME_CERTIFICATES, list);

    const users = getStorageItem<Record<string, StoredUserCertBucket>>(STORAGE_KEYS.GAME_USERS, {});
    const currentUsername = getRawStorageItem(STORAGE_KEYS.GAME_CURRENT_USER) || 'Người học Xơ Đăng';
    if (!users[currentUsername]) {
        users[currentUsername] = { name: currentUsername, certificates: [] };
    }
    if (!Array.isArray(users[currentUsername].certificates)) {
        users[currentUsername].certificates = [];
    }
    users[currentUsername].certificates.unshift(newCert);
    setStorageItem(STORAGE_KEYS.GAME_USERS, users);

    return newCert;
}

export function renderCertificateCanvas(options: {
    studentName: string;
    gameTitle: string;
    score: number;
    level: number;
    date?: string;
    id?: string;
}): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const { studentName, gameTitle, score, level } = options;
    const dateStr = options.date || new Date().toLocaleDateString('vi-VN');
    const serialSuffix = (options.id || String(Date.now())).slice(-6).toUpperCase();

    ctx.fillStyle = '#fdfbf7';
    ctx.fillRect(0, 0, 800, 600);

    ctx.lineWidth = 14;
    ctx.strokeStyle = '#27ae60';
    ctx.strokeRect(18, 18, 764, 564);

    ctx.lineWidth = 3;
    ctx.strokeStyle = '#d4af37';
    ctx.strokeRect(32, 32, 736, 536);

    drawCornerAccent(ctx, 36, 36, 1, 1);
    drawCornerAccent(ctx, 764, 36, -1, 1);
    drawCornerAccent(ctx, 36, 564, 1, -1);
    drawCornerAccent(ctx, 764, 564, -1, -1);

    ctx.font = '48px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎓', 400, 95);

    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 32px "Segoe UI", sans-serif';
    ctx.fillText('GIẤY CHỨNG NHẬN HOÀN THÀNH', 400, 145);

    ctx.fillStyle = '#27ae60';
    ctx.font = '600 18px "Segoe UI", sans-serif';
    ctx.fillText('KHÔNG GIAN TRÒ CHƠI HỌC TIẾNG XƠ ĐĂNG', 400, 180);

    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(250, 195);
    ctx.lineTo(550, 195);
    ctx.stroke();

    ctx.fillStyle = '#4b5563';
    ctx.font = 'italic 18px "Segoe UI", sans-serif';
    ctx.fillText('Trân trọng trao tặng cho:', 400, 240);

    ctx.fillStyle = '#b91c1c';
    ctx.font = 'bold 38px "Segoe UI", sans-serif';
    ctx.fillText(studentName || 'Người học Xơ Đăng', 400, 295);

    ctx.fillStyle = '#374151';
    ctx.font = '18px "Segoe UI", sans-serif';
    ctx.fillText('Đã xuất sắc vượt qua các thử thách từ vựng trong trò chơi:', 400, 345);

    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 24px "Segoe UI", sans-serif';
    ctx.fillText(`"${gameTitle}"`, 400, 385);

    ctx.fillStyle = '#f3f4f6';
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    roundRect(ctx, 220, 415, 360, 55, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 16px "Segoe UI", sans-serif';
    ctx.fillText(`Cấp độ: ${level}    |    Tổng điểm: ${score}`, 400, 450);

    drawRedSeal(ctx, 670, 480);

    ctx.fillStyle = '#6b7280';
    ctx.font = 'italic 15px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Ngày cấp: ${dateStr}`, 60, 525);
    ctx.fillText(`Số hiệu: XEDANG-EDU-${serialSuffix}`, 60, 545);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 15px "Segoe UI", sans-serif';
    ctx.fillText('Ban Phát Triển Từ Điển Xơ Đăng', 670, 545);

    return canvas;
}

function drawCornerAccent(ctx: CanvasRenderingContext2D, x: number, y: number, dirX: number, dirY: number): void {
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + dirY * 20);
    ctx.lineTo(x, y);
    ctx.lineTo(x + dirX * 20, y);
    ctx.stroke();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function drawRedSeal(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.1);

    ctx.strokeStyle = '#b91c1c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#b91c1c';
    ctx.font = 'bold 9px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★ CHỨNG NHẬN ★', 0, -12);
    ctx.font = 'bold 13px "Segoe UI", sans-serif';
    ctx.fillText('XUẤT SẮC', 0, 4);
    ctx.font = 'bold 8px "Segoe UI", sans-serif';
    ctx.fillText('XƠ ĐĂNG APP', 0, 16);

    ctx.restore();
}

export function downloadCertificatePng(canvas: HTMLCanvasElement, filename: string): void {
    soundEffects.click();
    canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
}

export function showCertificateModal(options: {
    studentName: string;
    gameTitle: string;
    score: number;
    level: number;
    id?: string;
    date?: string;
    persist?: boolean;
}): void {
    const certDate = options.date || new Date().toLocaleDateString('vi-VN');
    let certId = options.id;

    if (options.persist !== false) {
        const saved = saveCertificate({
            studentName: options.studentName,
            gameTitle: options.gameTitle,
            score: options.score,
            level: options.level,
            date: certDate
        });
        certId = saved.id;
    }

    soundEffects.levelUp();

    let modal = document.getElementById('certificateModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'certificateModal';
        modal.className = 'game-modal-overlay';
        modal.innerHTML = `
            <div class="game-modal-card cert-modal-card">
                <div class="cert-modal-header">
                    <h3>${getLucideIcon('award', 'lucide-icon', 20)} Giấy Chứng Nhận Tốt Nghiệp</h3>
                    <button id="btnCloseCertModal" class="btn-close-modal" aria-label="Đóng">&times;</button>
                </div>
                <div class="cert-canvas-wrapper" id="certCanvasContainer"></div>
                <div class="cert-modal-actions">
                    <button id="btnDownloadCertPng" class="modal-btn btn-primary">
                        ${getLucideIcon('download', 'lucide-icon', 16)} Tải ảnh chứng nhận (.PNG)
                    </button>
                    <button id="btnCloseCertAction" class="modal-btn btn-secondary">
                        Đóng
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target === modal || target.closest('#btnCloseCertModal') || target.closest('#btnCloseCertAction')) {
                closeCertificateModal();
            } else if (target.closest('#btnDownloadCertPng') && activeCertificateCanvas) {
                const safeName = (activeCertificateStudentName || 'Hoc-Sinh').replace(/[^a-zA-Z0-9]/g, '_');
                downloadCertificatePng(activeCertificateCanvas, `Chung-Nhan-${safeName}-${Date.now()}.png`);
            }
        });
    }

    const container = modal.querySelector('#certCanvasContainer');
    if (container) {
        container.replaceChildren();
        const canvas = renderCertificateCanvas({
            studentName: options.studentName,
            gameTitle: options.gameTitle,
            score: options.score,
            level: options.level,
            date: certDate,
            id: certId
        });
        canvas.style.maxWidth = '100%';
        canvas.style.height = 'auto';
        canvas.style.borderRadius = '8px';
        canvas.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
        container.appendChild(canvas);

        activeCertificateCanvas = canvas;
        activeCertificateStudentName = options.studentName;
    }

    modal.style.display = 'flex';
}

export function closeCertificateModal(): void {
    const modal = document.getElementById('certificateModal');
    if (modal) {
        modal.style.display = 'none';
    }
}
