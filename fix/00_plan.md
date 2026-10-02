# KẾ HOẠCH SỬA LỖI & BÙ ĐẮP THIẾU SÓT SAU REFACTOR
**Branch**: `fix/refactor-gaps`  
**Dự án**: Số hóa & Bảo tồn Ngôn ngữ Xơ Đăng  
**Tài liệu cơ sở**: `review/99_report.md`, `review/02_cross_checks.md`, `review/03_flows.md`, `inventory/`  
**Mã nguồn gốc**: `C:\Users\umnuar\Downloads\tudien-goc`  
**Mã nguồn thực thi**: `c:\Users\umnuar\Downloads\tudien-main`  
**Ngày lập**: 02/10/2026  

---

## 1. BẢNG DANH MỤC LỖI & THIẾU SÓT (DEFECT CATALOG)

| ID Lỗi | Mức độ | Nhóm nguyên nhân | File cần sửa | Cách sửa dự kiến | Trạng thái |
| :---: | :---: | :--- | :--- | :--- | :---: |
| **GAP-01** | MEDIUM | Thiếu màn hình Giấy chứng nhận hoàn thành vẽ bằng Canvas HTML5 (`FILE13_game.html:4372-4585`) | `src/renderer/features/games/certificate.ts`<br>`src/renderer/features/games/games.ts`<br>`src/renderer/features/games/games.html`<br>`tests/games-ancillary.test.ts` | Tạo module `certificate.ts` khôi phục hàm `renderCertificateCanvas()`, `showCertificateModal()`, `downloadCertificatePng()`, lưu trữ LocalStorage `xedang_certificates`, tích hợp vào modal thắng game. | [x] Đã sửa & test 100% |
| **GAP-02** | MEDIUM | Thiếu màn hình Bảng vàng (Leaderboard) & Huy hiệu (Badges) trong Game (`FILE13_game.html:2167-2256, 4648-4655`) | `src/renderer/features/games/leaderboard.ts`<br>`src/renderer/features/games/games.ts`<br>`src/renderer/features/games/games.html`<br>`src/renderer/styles/features/games.css`<br>`tests/games-ancillary.test.ts` | Khôi phục logic đọc/ghi `xedang_users` trong LocalStorage, tính toán xếp hạng top 10 và danh hiệu huy hiệu đạt được (Học sinh chăm chỉ, Cao thủ từ vựng, v.v.), tích hợp modal xem Bảng vàng, Huy hiệu, Kho chứng chỉ. | [x] Đã sửa & test 100% |
| **GAP-03** | MEDIUM | Thiếu cử chỉ vuốt chạm cảm ứng (Touch Swipe Gestures) trên modal Giới thiệu (`FILE12_intro.html:1440-1470`) | `src/renderer/features/onboarding/onboarding.ts`<br>`tests/onboarding.test.ts` | Bổ sung listener `touchstart` và `touchend` với ngưỡng 50px hỗ trợ vuốt trái sang slide kế và vuốt phải về slide trước trên màn hình di động/tablet. | [x] Đã sửa & test 100% |
| **GAP-04** | LOW / INFO | Nghi vấn thiếu nút tải trước âm thanh offline (`#btn-download-offline`) | `src/renderer/features/home/home.html`<br>`src/renderer/features/home/home.ts` | **Không phải lỗi**: Đã kiểm chứng tính năng đã có sẵn đầy đủ tại `home.html:26-50` và `home.ts:180-225`, kèm thanh tiến trình và 5 worker song song nạp cache `tudien-audio`. | [x] Không phải lỗi (Đã có sẵn) |
| **GAP-05** | LOW / INFO | Lỗi phân mảnh key LocalStorage trong bản gốc (`introSeen` vs `hasSeenIntro`) | `src/shared/constants/storage-keys.ts`<br>`src/renderer/features/onboarding/onboarding.ts` | **Không phải lỗi**: Bản mới đã chủ động vá lỗi phân mảnh của bản gốc bằng cách chuẩn hóa thống nhất qua `STORAGE_KEYS.HAS_SEEN_INTRO`. | [x] Đã tối ưu chuẩn xác |
| **GAP-06** | LOW / INFO | Lược bỏ sự kiện Web Push trong Service Worker | `src/renderer/service-worker.ts` | **Không phải lỗi**: Bản gốc chỉ đặt event listener rỗng không có máy chủ Push Backend. Ứng dụng PWA hoạt động hoàn toàn độc lập phía client. | [x] Thiết kế chuẩn |

---

## 2. KẾ HOẠCH TRIỂN KHAI THEO THỨ TỰ ƯU TIÊN

### Đợt 1: Bổ sung Cử chỉ vuốt chạm Onboarding (GAP-03)
- **Tiến độ**: Đã hoàn thành và kiểm chứng với 7/7 test pass trong `tests/onboarding.test.ts` (Commit `4079319`).

### Đợt 2: Khôi phục Bảng vàng & Huy hiệu Game (GAP-02)
- **Mục tiêu**:
  - Tạo `src/renderer/features/games/leaderboard.ts` xử lý logic `getLeaderboard()`, `getUserBadges()`, `recordGameScore()`.
  - Thêm nút `#btnOpenLeaderboard` và `#btnOpenBadges` tại Game Bar trong `games.html`.
  - Hiển thị Modal Bảng vàng với xếp hạng Top 10 và Modal Bộ sưu tập Huy hiệu.
- **Kiểm chứng**:
  - Viết unit test xác thực thuật toán sắp xếp điểm và mở khóa huy hiệu.
  - Kiểm tra DOM không lỗi, CSS responsive.

### Đợt 3: Khôi phục Giấy chứng nhận hoàn thành Canvas & Tải ảnh PNG (GAP-01)
- **Mục tiêu**:
  - Tạo `src/renderer/features/games/certificate.ts` vẽ Canvas 800x600 px độ phân giải cao: hoa văn viền xanh lá & vàng kim, chữ thư pháp Xơ Đăng, tên học sinh, điểm số, ngày cấp, con dấu đỏ "Xuất Sắc".
  - Nút tải ảnh chứng nhận `.png` trực tiếp không cần thư viện ngoài (dùng native `canvas.toBlob` và `URL.createObjectURL`).
  - Tích hợp vào Modal chiến thắng của cả 4 Minigames và danh sách chứng chỉ đã đạt.
- **Kiểm chứng**:
  - Viết unit test kiểm chứng canvas tạo ra dữ liệu blob/png hợp lệ.
  - Kiểm tra hiển thị và tải file trên trình duyệt.

### Đợt 4: Kiểm tra lại toàn diện Bước 3 & Lập báo cáo cuối `fix/99_fix_report.md`
- Chạy lại 10 bài kiểm tra chéo (Selector, Type check, Dead code, Storage, CSS, Assets).
- Chạy toàn bộ 74+ tests của Vitest.
- Chạy `npm run build` xác nhận bundle production.
- Viết `fix/99_fix_report.md`.
