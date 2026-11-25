# BÁO CÁO ĐỐI CHIẾU: FILE08 — `Bao_cao_giai_phap_PWA.md`

- **Tập tin gốc:** `C:\Users\umnuar\Downloads\tudien-goc\Bao_cao_giai_phap_PWA.md`
- **Tập tin mới:** `c:\Users\umnuar\Downloads\tudien-main\docs\archive\Bao_cao_giai_phap_PWA.md`

---

## BẢNG ĐỐI CHIẾU TỪNG MỤC THEO ID

| ID | Tên mục | Trạng thái | Vị trí file:dòng mới | Ghi chú & Trích đoạn đối chiếu |
| :--- | :--- | :---: | :--- | :--- |
| **F001_F08** | `downloadAllAudioToFolder` | ✅ GIỮ NGUYÊN | `docs/archive/Bao_cao_giai_phap_PWA.md:74` | Script tiện ích Google Apps Script độc lập được lưu trữ nguyên văn trong tài liệu archive |
| **B001_F08** | `<audio controls preload="none">` | ✅ GIỮ NGUYÊN | `src/renderer/features/home/word-card.ts:85` | Bản mới đã dùng HTML5 Audio element chuẩn thay thế cho iframe Google Drive |
| **B002_F08** | `<source src="./audio/${driveId}.webm">` | ✅ GIỮ NGUYÊN | `src/renderer/features/home/word-card.ts:87`, `src/renderer/services/audio.service.ts:32` | Sử dụng chính xác định dạng `./audio/${driveId}.webm` |
| **S001_F08** | Sheet Name `Tu_Dien` | ✅ GIỮ NGUYÊN | `src/shared/constants/config.ts:14` | `'Tu_Dien!A2:F'` |
| **S002_F08** | Export Folder Name | ✅ GIỮ NGUYÊN | `docs/archive/Bao_cao_giai_phap_PWA.md:96` | Lưu trong tài liệu kỹ thuật |
| **S003_F08** | Local Audio Path Pattern | ✅ GIỮ NGUYÊN | `src/shared/constants/config.ts:25` | `AUDIO_BASE_URL = './audio/'` |
| **S004_F08** | SW Version Bump | ⚠️ ĐỔI KHÁC | `src/renderer/service-worker.ts:5` | Phiên bản Service Worker mới trong TypeScript được quản lý theo `SW_VERSION = 'v1.0.0'` |

---

## KẾT LUẬN FILE08
- Tỷ lệ: 6/7 mục ✅ GIỮ NGUYÊN, 1/7 mục ⚠️ ĐỔI KHÁC (quản lý versioning SW theo chuẩn semver của Vite).
- Kiến trúc âm thanh ngoại tuyến đề xuất trong báo cáo đã được hiện thực hóa trọn vẹn trong `audio.service.ts` và `word-card.ts`.
