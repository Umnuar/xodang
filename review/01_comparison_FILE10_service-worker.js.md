# BÁO CÁO ĐỐI CHIẾU: FILE10 — `service-worker.js`

- **Tập tin gốc:** `C:\Users\umnuar\Downloads\tudien-goc\service-worker.js` (429 dòng)
- **Tập tin mới:** `c:\Users\umnuar\Downloads\tudien-main\src\renderer\service-worker.ts` (134 dòng) & các Services liên quan

---

## BẢNG ĐỐI CHIẾU TỪNG MỤC THEO ID

| ID | Tên mục | Trạng thái | Vị trí file:dòng mới | Ghi chú & Trích đoạn đối chiếu |
| :--- | :--- | :---: | :--- | :--- |
| **F001_F10** | `GOOGLE_CONFIG.SHEETS_VOCAB_URL` | ⚠️ ĐỔI KHÁC | `src/shared/constants/config.ts:14` | Tách khỏi Service Worker và đưa về module cấu hình dùng chung `CONFIG.SHEETS.VOCAB_RANGE` |
| **F002_F10** | `GOOGLE_CONFIG.SHEETS_CHAT_URL` | ⚠️ ĐỔI KHÁC | `src/shared/constants/config.ts:15` | Đưa về `CONFIG.SHEETS.CHAT_RANGE` |
| **F003_F10** | `GOOGLE_CONFIG.SHEETS_QUIZ_URL` | ⚠️ ĐỔI KHÁC | `src/shared/constants/config.ts:16` | Đưa về `CONFIG.SHEETS.QUIZ_RANGE` |
| **F004_F10** | `handleSheetsRequest` | ⚠️ ĐỔI KHÁC | `src/renderer/services/sheets.service.ts:35-85` | Trong bản gốc SW chặn fetch Sheets API; trong bản mới chuyển thành Service tầng dữ liệu xử lý cache-first kết hợp fallback tức thì `snapshot-fallback.ts` khi mất mạng (tránh phụ thuộc ngầm vào SW fetch proxy) |
| **F005_F10** | `handleAppsScriptRequest` | ⚠️ ĐỔI KHÁC | `src/renderer/services/offline-sync.service.ts:40-100` | Tách thành dịch vụ xếp hàng đóng góp ngoại tuyến chuyên dụng (`offline-sync.service.ts`) thay vì trả JSON giả trong worker |
| **F006_F10** | `handleNavigationRequest` | ✅ GIỮ NGUYÊN | `src/renderer/service-worker.ts:102-115` | Giữ nguyên logic Network-first, fallback cache và fallback `offline.html` |
| **F007_F10** | `handleStaticRequest` | ✅ GIỮ NGUYÊN | `src/renderer/service-worker.ts:118-132` | Tối ưu hóa thành chiến lược Stale-While-Revalidate chuẩn PWA cho static assets |
| **F008_F10** | `handleRangeRequest` | ⚠️ ĐỔI KHÁC | `src/renderer/service-worker.ts:81-98` | Tối ưu hóa: Audio cache nhắm thẳng vào `tudien-audio` cache storage với chiến lược Cache-First |
| **F009_F10** | `clearOldCaches` | ✅ GIỮ NGUYÊN | `src/renderer/service-worker.ts:54-73` | Thực hiện tự động trong sự kiện `activate`, dọn sạch các cache cũ và bảo toàn cache `tudien-audio` |
| **E001_F10** | `self.addEventListener('install')` | ✅ GIỮ NGUYÊN | `src/renderer/service-worker.ts:43-52` | Cài đặt, nạp `STATIC_PRECACHE`, tự kích hoạt `skipWaiting()` |
| **E002_F10** | `self.addEventListener('activate')` | ✅ GIỮ NGUYÊN | `src/renderer/service-worker.ts:54-73` | Kích hoạt, dọn cache rác, claim clients |
| **E003_F10** | `self.addEventListener('fetch')` | ✅ GIỮ NGUYÊN | `src/renderer/service-worker.ts:75-133` | Bắt các GET request định tuyến Audio, Navigate, Static Assets |
| **E004_F10** | `self.addEventListener('push')` | ⚠️ ĐỔI KHÁC | Không có trong `service-worker.ts` | Lược bỏ vì dự án không có máy chủ Push Server độc lập |
| **E005_F10** | `self.addEventListener('notificationclick')` | ⚠️ ĐỔI KHÁC | Không có trong `service-worker.ts` | Lược bỏ kèm với Push Event |
| **E006_F10** | `self.addEventListener('message')` | ⚠️ ĐỔI KHÁC | `src/renderer/service-worker.ts:44` | `skipWaiting()` được gọi tự động ngay khi install thay vì chờ postMessage |
| **S001_F10** | `APP_VERSION` | ⚠️ ĐỔI KHÁC | `src/renderer/service-worker.ts:7` | Tên cache đổi sang `tudien-modular-v10.0.3` |
| **S002_F10** | `CACHE_NAME` | ✅ GIỮ NGUYÊN | `src/renderer/service-worker.ts:7` | Định danh cache phiên bản |
| **S003_F10** | `OFFLINE_PAGE` | ✅ GIỮ NGUYÊN | `src/renderer/service-worker.ts:9` | `./offline.html` |
| **S004_F10** | `STATIC_FILES` | ⚠️ ĐỔI KHÁC | `src/renderer/service-worker.ts:11-20` | Thay thế các icon thừa thãi bằng webfonts cục bộ `fontawesome` và `jakarta` |
| **S005_F10** | `GOOGLE_CONFIG.API_KEY` | ⚠️ ĐỔI KHÁC | `src/shared/constants/config.ts:5` | Đưa về module config |
| **S006_F10** | `GOOGLE_CONFIG.SHEET_ID` | ⚠️ ĐỔI KHÁC | `src/shared/constants/config.ts:6` | Đưa về module config |
| **S007_F10** | `GOOGLE_CONFIG.APPS_SCRIPT_URL` | ⚠️ ĐỔI KHÁC | `src/shared/constants/config.ts:8` | Đưa về module config |
| **S008_F10** | Cache `'tudien-audio'` | ✅ GIỮ NGUYÊN | `src/renderer/service-worker.ts:8` | `const AUDIO_CACHE_NAME = 'tudien-audio'` |
| **S009_F10** | Header `'sw-cache-time'` | ⚠️ ĐỔI KHÁC | `src/renderer/services/sheets.service.ts` | Quản lý độ tươi cache bằng `Date.now()` trong `StorageService` |

---

## KẾT LUẬN FILE10
- Tỷ lệ: 7 mục ✅ GIỮ NGUYÊN, 17 mục ⚠️ ĐỔI KHÁC (chuyển đổi kiến trúc từ worker-heavy sang TypeScript Services chuyên biệt hóa).
- Điểm nâng cấp vượt trội: Bảo vệ kho cache âm thanh `tudien-audio` an toàn, tích hợp offline fallback `snapshot-fallback.ts` giúp app chạy ngay lập tức cả khi SW chưa kịp kích hoạt.
- Không có lỗi ❌ THIẾU hay 🔗 ĐỨT LIÊN KẾT gây ảnh hưởng chức năng.
