import { STORAGE_KEYS } from '@/shared/constants/storage-keys';
import { getStorageItem, setStorageItem } from '@/services/storage.service';
import { soundEffects } from './sound-effects';
import { getLucideIcon } from '@/utils/icons';
import { openAccessibleModal, closeAccessibleModal } from '@/utils/modal-a11y';

export interface CertificateRecord {
    id: string;
    gameTitle: string;
    studentName: string;
    score: number;
    level: number;
    date: string;
    timestamp: number;
}

export interface CertificateRenderOptions {
    studentName: string;
    gameTitle: string;
    score: number;
    level: number;
    date?: string;
    id?: string;
    scale?: number;
}

let activeCertificateCanvas: HTMLCanvasElement | null = null;
let activeCertificateStudentName = '';
let activeCertificateDate = '';

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
    return newCert;
}

export function formatCertificateFilename(studentName: string, dateStr?: string): string {
    const slug = (studentName || 'hoc-vien')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'hoc-vien';

    const rawDate = dateStr || new Date().toLocaleDateString('vi-VN');
    const safeDate = rawDate
        .replace(/[^0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || String(Date.now());

    return `Chung-Nhan-${slug}-${safeDate}.png`;
}

function paintCertificateCanvas(canvas: HTMLCanvasElement, options: CertificateRenderOptions): void {
    const scale = options.scale && options.scale > 0 ? options.scale : 1;
    const width = 800;
    const height = 600;
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(scale, scale);

    const { studentName, gameTitle, score, level } = options;
    const dateStr = options.date || new Date().toLocaleDateString('vi-VN');
    const serialSuffix = (options.id || String(Date.now())).slice(-6).toUpperCase();
    const fontFamily = '"Be Vietnam Pro", -apple-system, BlinkMacSystemFont, sans-serif';

    ctx.fillStyle = '#fbfbfa';
    ctx.fillRect(0, 0, width, height);

    ctx.lineWidth = 14;
    ctx.strokeStyle = '#1e7e48';
    ctx.strokeRect(18, 18, 764, 564);

    ctx.lineWidth = 3;
    ctx.strokeStyle = '#c05621';
    ctx.strokeRect(32, 32, 736, 536);

    drawCornerAccent(ctx, 36, 36, 1, 1);
    drawCornerAccent(ctx, 764, 36, -1, 1);
    drawCornerAccent(ctx, 36, 564, 1, -1);
    drawCornerAccent(ctx, 764, 564, -1, -1);

    drawCertificateEmblem(ctx, 400, 74);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#1c1917';
    ctx.font = `700 30px ${fontFamily}`;
    ctx.fillText('GIẤY CHỨNG NHẬN HOÀN THÀNH', 400, 142, 680);

    ctx.fillStyle = '#1e7e48';
    ctx.font = `600 17px ${fontFamily}`;
    ctx.fillText('KHÔNG GIAN TRÒ CHƠI HỌC TIẾNG XƠ ĐĂNG', 400, 176, 680);

    ctx.strokeStyle = '#d6d3d1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(220, 194);
    ctx.lineTo(580, 194);
    ctx.stroke();

    ctx.fillStyle = '#57534e';
    ctx.font = `500 18px ${fontFamily}`;
    ctx.fillText('Trân trọng trao tặng cho:', 400, 238, 640);

    ctx.fillStyle = '#9c4215';
    ctx.font = `700 36px ${fontFamily}`;
    ctx.fillText(studentName || 'Người học Xơ Đăng', 400, 294, 680);

    ctx.fillStyle = '#1c1917';
    ctx.font = `400 18px ${fontFamily}`;
    ctx.fillText('Đã xuất sắc vượt qua các thử thách từ vựng trong trò chơi:', 400, 344, 680);

    ctx.fillStyle = '#1e7e48';
    ctx.font = `700 24px ${fontFamily}`;
    ctx.fillText(`"${gameTitle}"`, 400, 384, 680);

    ctx.fillStyle = '#f4f4f0';
    ctx.strokeStyle = '#d6d3d1';
    ctx.lineWidth = 1.5;
    roundRect(ctx, 210, 414, 380, 56, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1c1917';
    ctx.font = `700 16px ${fontFamily}`;
    ctx.fillText(`Cấp độ: ${level}    |    Tổng điểm: ${score}`, 400, 448, 350);

    drawRedSeal(ctx, 668, 476, fontFamily);

    ctx.fillStyle = '#57534e';
    ctx.font = `500 14px ${fontFamily}`;
    ctx.textAlign = 'left';
    ctx.fillText(`Ngày cấp: ${dateStr}`, 60, 522, 340);
    ctx.fillText(`Số hiệu: XEDANG-EDU-${serialSuffix}`, 60, 544, 340);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#1c1917';
    ctx.font = `700 14px ${fontFamily}`;
    ctx.fillText('Ban Phát Triển Từ Điển Xơ Đăng', 668, 544, 220);

    ctx.restore();
}

export function renderCertificateCanvas(options: CertificateRenderOptions): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    paintCertificateCanvas(canvas, options);
    return canvas;
}

function drawCertificateEmblem(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = '#e8f5e9';
    ctx.strokeStyle = '#1e7e48';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1e7e48';
    ctx.beginPath();
    ctx.moveTo(-10, 18);
    ctx.lineTo(-14, 34);
    ctx.lineTo(-5, 29);
    ctx.lineTo(0, 34);
    ctx.lineTo(5, 29);
    ctx.lineTo(14, 34);
    ctx.lineTo(10, 18);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#c05621';
    ctx.beginPath();
    const outerRadius = 14;
    const innerRadius = 6;
    for (let i = 0; i < 10; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (Math.PI / 5) * i - Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

function drawCornerAccent(ctx: CanvasRenderingContext2D, x: number, y: number, dirX: number, dirY: number): void {
    ctx.strokeStyle = '#c05621';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + dirY * 22);
    ctx.lineTo(x, y);
    ctx.lineTo(x + dirX * 22, y);
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

function drawRedSeal(ctx: CanvasRenderingContext2D, cx: number, cy: number, fontFamily: string): void {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.08);

    ctx.strokeStyle = '#9c4215';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 38, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 33, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#9c4215';
    ctx.font = `700 9px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText('CHỨNG NHẬN', 0, -12, 58);
    ctx.font = `700 13px ${fontFamily}`;
    ctx.fillText('XUẤT SẮC', 0, 4, 62);
    ctx.font = `600 8px ${fontFamily}`;
    ctx.fillText('XƠ ĐĂNG APP', 0, 17, 58);

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
}): string | undefined {
    const certDate = options.date || new Date().toLocaleDateString('vi-VN');
    let certId = options.id;
    const shouldPersist = options.persist !== false;

    if (shouldPersist) {
        const saved = saveCertificate({
            studentName: options.studentName,
            gameTitle: options.gameTitle,
            score: options.score,
            level: options.level,
            date: certDate
        });
        certId = saved.id;
        soundEffects.levelUp();
    }

    let modal = document.getElementById('certificateModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'certificateModal';
        modal.className = 'game-modal-overlay';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'certModalHeading');
        modal.innerHTML = `
            <div class="game-modal-card cert-modal-card">
                <div class="cert-modal-header">
                    <h3 id="certModalHeading">${getLucideIcon('award', 'lucide-icon', 20)} Giấy Chứng Nhận Tốt Nghiệp</h3>
                    <button type="button" id="btnCloseCertModal" class="btn-close-modal" aria-label="Đóng">${getLucideIcon('x', 'lucide-icon', 20)}</button>
                </div>
                <div class="cert-canvas-wrapper" id="certCanvasContainer"></div>
                <div class="cert-modal-actions">
                    <button type="button" id="btnDownloadCertPng" class="game-modal-btn btn-primary">
                        ${getLucideIcon('download', 'lucide-icon', 16)} Tải ảnh chứng nhận (.PNG)
                    </button>
                    <button type="button" id="btnCloseCertAction" class="game-modal-btn btn-secondary">
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
                const filename = formatCertificateFilename(activeCertificateStudentName, activeCertificateDate);
                downloadCertificatePng(activeCertificateCanvas, filename);
            }
        });
    }

    const container = modal.querySelector('#certCanvasContainer');
    if (container) {
        container.replaceChildren();
        const renderOptions: CertificateRenderOptions = {
            studentName: options.studentName,
            gameTitle: options.gameTitle,
            score: options.score,
            level: options.level,
            date: certDate,
            id: certId,
            scale: 2
        };
        const canvas = renderCertificateCanvas(renderOptions);
        canvas.style.maxWidth = '100%';
        canvas.style.width = '100%';
        canvas.style.height = 'auto';
        canvas.style.aspectRatio = '4 / 3';
        canvas.style.borderRadius = '8px';
        canvas.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
        container.appendChild(canvas);

        activeCertificateCanvas = canvas;
        activeCertificateStudentName = options.studentName;
        activeCertificateDate = certDate;

        if (typeof document !== 'undefined' && document.fonts?.ready) {
            void document.fonts.ready.then(() => {
                if (canvas.isConnected && activeCertificateCanvas === canvas) {
                    paintCertificateCanvas(canvas, renderOptions);
                }
            }).catch(() => {});
        }
    }

    modal.style.display = 'flex';
    openAccessibleModal(modal, {
        labelledById: 'certModalHeading',
        initialFocus: modal.querySelector<HTMLElement>('#btnDownloadCertPng'),
        onClose: () => closeCertificateModal()
    });

    return certId;
}

export function closeCertificateModal(): void {
    const modal = document.getElementById('certificateModal');
    if (modal) {
        modal.style.display = 'none';
        closeAccessibleModal(modal);
    }
}
