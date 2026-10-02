# BẢN ĐỐI CHIẾU MÃ NGUỒN — DANH MỤC TẬP TIN DỰ ÁN MỚI & BẢNG ÁNH XẠ KIẾN TRÚC (00_NEW_FILES)

- **Thư mục dự án mới (`<ĐƯỜNG_DẪN_MỚI>`):** `c:\Users\umnuar\Downloads\tudien-main`
- **Thư mục mã nguồn gốc (`<ĐƯỜNG_DẪN_GỐC>`):** `C:\Users\umnuar\Downloads\tudien-goc`
- **Thời điểm thực hiện:** 2026-10-02
- **Trạng thái:** Hoàn tất quét toàn bộ cây thư mục mã nguồn TypeScript, HTML template, CSS và Assets.

---

## 1. Danh Mục Các Tập Tin Mã Nguồn Trong Dự Án Mới (`tudien-main`)

*(Bỏ qua `node_modules/`, `.git/`, `dist/`, `build/`, `.agents/`, `inventory/`, `review/`, và các file nhị phân media/fonts .woff2)*

| STT | Đường dẫn tập tin | Loại file | Số dòng | Kích thước (bytes) | Phân hệ / Vai trò kỹ thuật |
| :---: | :--- | :---: | :---: | :---: | :--- |
| 1 | `index.html` | HTML | 255 | 12.895 | Entrypoint chính của Vite: Shell HTML, Navbar, Containers, Scripts |
| 2 | `public/CNAME` | DNS | 1 | 21 | Cấu hình Custom Domain GitHub Pages (`hoctiengxodang.online`) |
| 3 | `public/robots.txt` | SEO | 3 | 85 | Khai báo crawler web và sitemap |
| 4 | `public/sitemap.xml` | XML | 15 | 513 | Sơ đồ liên kết website |
| 5 | `public/google752b7efc6d08d97f.html` | HTML | 1 | 53 | Mã xác thực Google Search Console |
| 6 | `public/manifest.json` | JSON | 64 | 1.554 | Web App Manifest PWA chuẩn hóa |
| 7 | `public/offline.html` | HTML | 492 | 16.815 | Trang ngoại tuyến dự phòng khi mất kết nối |
| 8 | `public/audio/README.md` | Doc | 0 | 1 | Placeholder thư mục audio cục bộ |
| 9 | `public/_sdk/element_sdk.js` | JS SDK | 2 | 128 | Canva Element SDK adapter |
| 10 | `public/_sdk/data_sdk.js` | JS SDK | 2 | 122 | Canva Data SDK adapter |
| 11 | `src/main/index.ts` | TS | 84 | 3.257 | Electron Main Process: khởi tạo BrowserWindow, CSP, lifecycle |
| 12 | `src/main/ipc-fetcher.ts` | TS | 59 | 2.636 | Electron IPC Fetcher xử lý request mạng vòng tránh CORS |
| 13 | `src/preload/index.ts` | TS | 11 | 411 | Electron Preload Script: `contextBridge.exposeInMainWorld` |
| 14 | `src/renderer/main.ts` | TS | 155 | 6.317 | Điểm nạp ứng dụng Renderer: mount markup, khởi tạo services |
| 15 | `src/renderer/router.ts` | TS | 33 | 1.238 | Router điều hướng Single Page Application theo Hash |
| 16 | `src/renderer/service-worker.ts` | TS | 115 | 4.512 | Service Worker PWA viết bằng TypeScript |
| 17 | `src/renderer/components/event-bus.ts` | TS | 34 | 1.106 | Bộ phát sự kiện trung tâm (Pub/Sub Event Bus) |
| 18 | `src/renderer/components/toast.ts` | TS | 40 | 1.434 | Toast thông báo dạng module dùng chung |
| 19 | `src/renderer/components/loading-overlay.ts` | TS | 19 | 610 | Lớp phủ chờ tải toàn cục |
| 20 | `src/renderer/components/offline-indicator.ts` | TS | 32 | 1.356 | Chỉ báo trạng thái mạng Online / Offline |
| 21 | `src/renderer/components/navbar/navbar.html` | HTML | 9 | 677 | Template HTML thanh điều hướng |
| 22 | `src/renderer/components/navbar/navbar.ts` | TS | 63 | 2.692 | Logic điều hướng Navbar, highlight tab active |
| 23 | `src/renderer/components/footer/footer.html` | HTML | 30 | 1.776 | Template HTML chân trang bản quyền & PWA status |
| 24 | `src/renderer/components/footer/footer.ts` | TS | 6 | 179 | Component Footer |
| 25 | `src/renderer/components/install-modal/install-modal.html` | HTML | 55 | 2.943 | Template HTML hướng dẫn cài đặt PWA đa nền tảng |
| 26 | `src/renderer/components/install-modal/install-modal.ts` | TS | 80 | 3.361 | Logic bắt `beforeinstallprompt`, hiển thị modal cài đặt |
| 27 | `src/renderer/features/home/home.html` | HTML | 135 | 6.557 | Template HTML màn hình tra cứu từ điển |
| 28 | `src/renderer/features/home/home.ts` | TS | 196 | 10.475 | Logic tra từ điển, autocomplete, speech recognition |
| 29 | `src/renderer/features/home/word-card.ts` | TS | 142 | 7.680 | Component thẻ từ vựng WordCard & audio player |
| 30 | `src/renderer/features/contribute/contribute.html` | HTML | 101 | 4.789 | Template HTML đóng góp đơn & hàng loạt |
| 31 | `src/renderer/features/contribute/contribute.ts` | TS | 509 | 22.886 | Logic ghi âm MediaRecorder, parse CSV/Excel, submit batch |
| 32 | `src/renderer/features/contribute/visualizer.ts` | TS | 65 | 2.382 | Vẽ sóng âm Canvas Wave Visualizer khi thu âm |
| 33 | `src/renderer/features/chat/chat.html` | HTML | 23 | 1.140 | Template HTML widget Trợ lý Chat AI |
| 34 | `src/renderer/features/chat/chat.ts` | TS | 175 | 7.946 | Logic chatbot FAQ, gợi ý câu hỏi, so khớp tương đồng |
| 35 | `src/renderer/features/quiz/quiz.html` | HTML | 203 | 9.475 | Template HTML học Flashcard & trắc nghiệm |
| 36 | `src/renderer/features/quiz/quiz.ts` | TS | 287 | 13.976 | Logic câu hỏi trắc nghiệm, tính giờ, chấm điểm |
| 37 | `src/renderer/features/quiz/flashcard.ts` | TS | 143 | 6.537 | Logic lật thẻ Flashcard 3D, đánh dấu đã học |
| 38 | `src/renderer/features/games/games.html` | HTML | 100 | 5.617 | Template HTML sảnh trò chơi Lobby |
| 39 | `src/renderer/features/games/games.ts` | TS | 216 | 9.025 | Router điều phối 4 games, bảng xếp hạng, chứng chỉ |
| 40 | `src/renderer/features/games/game-data.ts` | TS | 131 | 5.562 | Dữ liệu mẫu dự phòng & cấu hình level trò chơi |
| 41 | `src/renderer/features/games/game1-memory.ts` | TS | 137 | 5.931 | Module Game 1: Lật ô trí nhớ (Memory Cards) |
| 42 | `src/renderer/features/games/game2-catcher.ts` | TS | 271 | 11.529 | Module Game 2: Hứng quả từ vựng (Word Catcher) |
| 43 | `src/renderer/features/games/game3-shooter.ts` | TS | 235 | 8.976 | Module Game 3: Bắn cung / Bảo vệ căn cứ (Shooter) |
| 44 | `src/renderer/features/games/game4-farm.ts` | TS | 178 | 7.793 | Module Game 4: Nông trại tri thức (Farm Simulation) |
| 45 | `src/renderer/features/games/sound-effects.ts` | TS | 91 | 3.265 | Web Audio API Synthesizer đa tần số cho trò chơi |
| 46 | `src/renderer/features/onboarding/onboarding.html` | HTML | 107 | 6.868 | Template HTML 6 slide giới thiệu ứng dụng |
| 47 | `src/renderer/features/onboarding/onboarding.ts` | TS | 117 | 4.500 | Logic vuốt trượt 6 slide onboarding & cờ xem |
| 48 | `src/renderer/services/audio.service.ts` | TS | 118 | 4.288 | Service phát âm thanh, nạp audio .webm, audio feedback |
| 49 | `src/renderer/services/dictionary.service.ts` | TS | 119 | 3.967 | Service tra cứu từ điển thông minh & lọc kết quả |
| 50 | `src/renderer/services/faq.service.ts` | TS | 70 | 2.813 | Service so khớp câu hỏi đáp FAQ chatbot |
| 51 | `src/renderer/services/offline-sync.service.ts` | TS | 141 | 4.684 | Service đồng bộ hàng đợi ngoại tuyến Background Sync |
| 52 | `src/renderer/services/quiz.service.ts` | TS | 119 | 3.725 | Service nạp ngân hàng trắc nghiệm & danh mục chủ đề |
| 53 | `src/renderer/services/sheets.service.ts` | TS | 137 | 5.412 | Service giao tiếp Google Sheets API v4 |
| 54 | `src/renderer/services/speech.service.ts` | TS | 84 | 2.707 | Service nhận diện giọng nói Web Speech API |
| 55 | `src/renderer/services/storage.service.ts` | TS | 130 | 4.388 | Service wrapper LocalStorage với schema nhất quán |
| 56 | `src/shared/constants/config.ts` | TS | 26 | 960 | Tập trung các biến hằng số cấu hình API & URL |
| 57 | `src/shared/constants/storage-keys.ts` | TS | 31 | 1.303 | Chuẩn hóa toàn bộ key LocalStorage toàn hệ thống |
| 58 | `src/shared/data/snapshot-fallback.ts` | TS | 55 | 5.375 | Dữ liệu từ vựng snapshot nhúng sẵn phục vụ 100% offline |
| 59 | `src/renderer/styles/tokens.css` | CSS | 19 | 572 | Design Tokens: CSS variables màu sắc, bán kính bo góc |
| 60 | `src/renderer/styles/base.css` | CSS | 100 | 2.106 | Reset CSS, typography, scroll-padding |
| 61 | `src/renderer/styles/layout.css` | CSS | 196 | 4.503 | Layout navbar, app container, responsive shell |
| 62 | `src/renderer/styles/components/common.css` | CSS | 218 | 4.671 | Styles chung cho button, badge, loading spinner |
| 63 | `src/renderer/styles/components/modal.css` | CSS | 290 | 6.079 | Styles hộp thoại modal popup |
| 64 | `src/renderer/styles/features/home.css` | CSS | 711 | 16.534 | Styles cho trang chủ tra cứu & thẻ WordCard |
| 65 | `src/renderer/styles/features/contribute.css` | CSS | 381 | 7.930 | Styles cho form đóng góp & bảng queue |
| 66 | `src/renderer/styles/features/chat.css` | CSS | 296 | 6.341 | Styles cho khung chat bong bóng |
| 67 | `src/renderer/styles/features/quiz.css` | CSS | 371 | 7.753 | Styles cho trắc nghiệm & danh mục chủ đề |
| 68 | `src/renderer/styles/features/flashcard.css` | CSS | 396 | 9.179 | Styles hiệu ứng lật thẻ Flashcard 3D |
| 69 | `src/renderer/styles/features/games.css` | CSS | 537 | 12.039 | Styles cho 4 minigames, lobby, bảng thành tích |
| 70 | `src/renderer/styles/features/onboarding.css` | CSS | 277 | 6.384 | Styles cho onboarding slider 6 slide |

---

## 2. Bảng Ánh Xạ Kiến Trúc (Original $\rightarrow$ Refactored Codebase Mapping)

| Tập tin gốc (`tudien-goc`) | Tập tin mới tương ứng (`tudien-main`) | Mức độ bao phủ logic | Ghi chú chuyển dịch |
| :--- | :--- | :---: | :--- |
| **FILE01: `CNAME`** | `public/CNAME` | 100% | Giữ nguyên tên miền `hoctiengxodang.online` |
| **FILE02: `robots.txt`** | `public/robots.txt` | 100% | Giữ nguyên quy tắc crawler |
| **FILE03: `sitemap.xml`** | `public/sitemap.xml` | 100% | Giữ nguyên sơ đồ URL |
| **FILE04: `google752b7efc6d08d97f.html`**| `public/google752b7efc6d08d97f.html` | 100% | Giữ nguyên token xác thực Google |
| **FILE05: `audio/README.md`** | `public/audio/README.md` | 100% | Giữ nguyên placeholder audio |
| **FILE06: `manifest.json`** | `public/manifest.json` | 100% | Chuẩn hóa đường dẫn icon và display mode |
| **FILE07: `Danh_gia_va_Toi_uu_Du_an.md`** | `docs/archive/Danh_gia_va_Toi_uu_Du_an.md` | 100% | Chuyển vào thư mục tài liệu lưu trữ |
| **FILE08: `Bao_cao_giai_phap_PWA.md`** | `docs/archive/Bao_cao_giai_phap_PWA.md` | 100% | Chuyển vào thư mục tài liệu lưu trữ |
| **FILE09: `.agents/skills/taste-skill/SKILL.md`** | `.agents/skills/` (hệ thống skills) | 100% | Đã tích hợp vào hệ thống quy tắc agent |
| **FILE10: `service-worker.js`** | `src/renderer/service-worker.ts` | Phân rã | Viết lại bằng TypeScript, tách offline sync |
| **FILE11: `offline.html`** | `public/offline.html` | 100% | Giữ nguyên giao diện ngoại tuyến dự phòng |
| **FILE12: `intro.html`** | `features/onboarding/` (`onboarding.ts`, `onboarding.html`, `onboarding.css`) | 100% | Chuyển từ trang HTML độc lập sang Module Onboarding nhúng trong SPA Shell |
| **FILE13: `game.html`** | `features/games/` (`games.ts`, `game1-memory.ts`, `game2-catcher.ts`, `game3-shooter.ts`, `game4-farm.ts`, `game-data.ts`, `sound-effects.ts`, `games.css`) | 100% | Tách từ monolith 4.876 dòng thành 8 modules TypeScript chuyên biệt |
| **FILE14: `app/index.html`** | Đã được hợp nhất vào kiến trúc tổng thể `src/renderer/` | Hợp nhất | Bản `app/index.html` là biến thể cũ, toàn bộ tính năng đã nằm trong `src/renderer/` |
| **FILE15: `index.html`** (Monolith 7.380 dòng) | Phân rã thành kiến trúc phân lớp: | 100% | - **Home:** `features/home/`, `services/dictionary.service.ts`<br/>- **Contribute:** `features/contribute/`, `visualizer.ts`<br/>- **Quiz:** `features/quiz/`, `flashcard.ts`, `services/quiz.service.ts`<br/>- **Chat:** `features/chat/`, `services/faq.service.ts`<br/>- **Shell/Nav:** `components/navbar/`, `components/footer/`, `components/install-modal/`, `main.ts`, `router.ts`<br/>- **Styles:** `src/renderer/styles/` |

---

## 3. Danh Sách Các Mục Nghi Ngờ Cần Xác Minh Sâu (Suspicion List)

Qua bước lập bản đồ đối chiếu sơ bộ, phát hiện 4 điểm nghi vấn kỹ thuật cần kiểm chứng chi tiết trong BƯỚC 1 & BƯỚC 2:
1. **Bộ Tải Âm Thanh Ngoại Tuyến Hàng Loạt (`initOfflineDownloader` trong FILE15 dòng 5254):**
   - Trong `FILE15:index.html` có cụm hàm `initOfflineDownloader`, `checkOfflineStatus`, `downloadNext`, `updateProgress` và nút `#btn-download-offline`. Cần kiểm tra xem trong `tudien-main` cụm này được chuyển sang `offline-sync.service.ts` hay đã bị lược bỏ.
2. **Các Thẻ SEO Schema JSON-LD (WebApplication, FAQ, Breadcrumb, School):**
   - Trong `FILE15:index.html` dòng 89-280 có 4 thẻ `<script type="application/ld+json">`. Cần kiểm tra trong `tudien-main/index.html` có giữ đầy đủ 4 schema này hay không.
3. **Cơ Chế Onboarding Shell:**
   - Trong bản gốc, `intro.html` là một trang HTML riêng biệt điều hướng sang `index.html` qua `window.location.href`. Trong bản mới, Onboarding được tích hợp trực tiếp thành Modal/View trong SPA qua `onboarding.ts`. Cần xác minh xem cờ `hasSeenIntro` có được tôn trọng và hoạt động trơn tru không.
4. **Sự Kiện Inline Onclick vs Event Delegation:**
   - Hầu hết các nút bấm trong bản gốc dùng inline `onclick="..."`. Trong bản mới dạng Vite module, các hàm không tự động lộ ra `window`. Cần kiểm tra xem các hàm có được gắn qua `addEventListener` hoặc gắn tường minh vào `window` trong `main.ts` hay không.
