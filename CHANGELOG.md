# Nhật ký thay đổi (Changelog)

Mọi thay đổi đáng chú ý của dự án **Từ Điển Xơ Đăng – Tiếng Việt (`tudien-xedang`)** được ghi nhận tại đây theo quy chuẩn [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/) và đánh số phiên bản theo [Semantic Versioning 2.0.0](https://semver.org/).

---

## [10.0.4] - 2026-11-25

### Thêm mới (Added)
- **Công cụ dòng lệnh Rust tối ưu & đóng gói âm thanh ([tools/audio-optimizer/](tools/audio-optimizer/)):** CLI viết bằng Rust thuần với `0` crate phụ thuộc ngoài (`7` unit tests), hỗ trợ chuẩn hóa âm thanh WebM sang Opus VoIP 24 kbps kèm `loudnorm`, tự động giữ nguyên tệp gốc nếu không nhỏ hơn, và đóng gói gói nhị phân qua cờ `--pack`.
- **Cơ chế Hybrid Binary Audio Pack & Đồng bộ Delta (`public/audio-pack.bin` & `public/audio-pack.index.json`):**
  - Hợp nhất kho phát âm thành một tệp nhị phân (`8.23 MiB` / `8,626,087 B`) kèm bảng chỉ mục offset, độ dài và hash FNV-1a 64-bit (`88,315 B`).
  - Lần đầu tải toàn bộ gói âm thanh chỉ với **1 HTTP request duy nhất** có thanh tiến trình theo byte và lưu vào `CacheStorage` (`tudien-audio`).
  - Các lần cập nhật sau đối chiếu hash FNV-1a để chỉ tải phần chênh lệch (delta) khi thêm hoặc thu âm lại từ vựng.
  - Tự động tải nền qua `requestIdleCallback` khi trình duyệt rảnh, tôn trọng trạng thái mạng (`navigator.onLine`), chế độ tiết kiệm dữ liệu (`saveData`) và kết nối chậm (`2g`).
- **Tùy chọn Rust Axum Contribute Gateway ([services/contribute-api/](services/contribute-api/)):** HTTP gateway xác thực chữ ký magic bytes thực tế (`WebM`, `MP4/M4A`, `OGG`, `MP3`, `WAV`, `FLAC`), giới hạn tải `10 MB` (`413`), chống Path Traversal, giới hạn tần suất theo IP (`429`), `ALLOWED_ORIGINS`, cấu hình `Dockerfile` chạy bằng user `appuser` không quyền root (`8` integration tests), và chuyển tiếp kiểu **Option A2** sang Google Apps Script.
- **Tải lên `FormData` & cơ chế Fallback:** Hàm `sendContribution()` trong [src/services/offline-sync.service.ts](src/services/offline-sync.service.ts) hỗ trợ gửi tệp binary `multipart/form-data` tới Gateway hoặc tự động fallback `no-cors` trực tiếp về Google Apps Script khi không đặt `VITE_CONTRIBUTE_API_URL`.
- **Tài liệu theo dõi phiên bản:** Bổ sung tệp [CHANGELOG.md](CHANGELOG.md) ở thư mục gốc và liên kết từ [README.md](README.md) / [README.en.md](README.en.md).

### Thay đổi (Changed)
- **Nén toàn bộ `1,261` tệp âm thanh `.webm`:** Giảm dung lượng kho âm thanh trong `public/audio/` từ `40.38 MB` (`40,379,824 B`) xuống `8.23 MiB` (`8,626,087 B`, giảm `78.64%`), đồng bộ nhãn nút tải ngoại tuyến trên trang chủ thành `(~9MB)` và cập nhật `softwareVersion` lên `10.0.4`.
- **Sắp xếp lại cấu trúc mã nguồn & kiểm thử:**
  - Làm phẳng lớp `src/renderer/*` dư thừa từ kiến trúc Electron cũ lên trực tiếp [src/](src/), di chuyển `event-bus.ts` sang [src/utils/event-bus.ts](src/utils/event-bus.ts).
  - Phân nhóm toàn bộ 16 bộ kiểm thử Vitest và dữ liệu mẫu vào 5 thư mục theo vai trò: `tests/unit/`, `tests/features/`, `tests/integration/`, `tests/security/`, và `tests/fixtures/`.
- **Tách mã nguồn theo Route (Code-Splitting):** Nạp động các phân hệ `quiz`, `games`, `contribute` và `chat` theo yêu cầu hoặc khi trình duyệt rảnh, giữ gói khởi động trang chủ gọn nhẹ (~`84 kB` JS).
- **Nâng cấp tìm kiếm ngữ âm & bộ đệm ứng dụng:**
  - Lập chỉ mục `WeakMap` theo Unicode NFC cho `DictionaryService`, sử dụng ranh giới từ Unicode (`\p{L}\p{N}`) bảo toàn các tổ hợp dấu Xơ Đăng (`ơ̆`, `ŏ`, `ê̆`) và fallback tìm kiếm không dấu.
  - Bổ sung khớp từ khóa FAQ thông minh cho Chatbot, chuyển sóng âm ghi âm `AudioWaveVisualizer` sang GPU `scaleY()`, tập trung truy cập `localStorage` qua [src/services/storage.service.ts](src/services/storage.service.ts) (an toàn Private Mode), hợp nhất request Google Sheets song song + giữ cache ngoại tuyến bền vững, và loại bỏ màn hình chờ splash giả.
- **Vệ sinh kho lưu trữ công khai:** Gỡ `6,589` tệp tài liệu/công cụ nội bộ khỏi danh sách theo dõi Git công khai và viết lại song ngữ [README.md](README.md), [README.en.md](README.en.md), [SECURITY.md](SECURITY.md), [SECURITY.en.md](SECURITY.en.md).

### Sửa lỗi (Fixed)
- **Quy trình triển khai GitHub Pages ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)):** Khắc phục lỗi `No artifacts named "github-pages" were found` bằng cách tách hai job `build` và `deploy` (`needs: build`), nâng `actions/upload-pages-artifact` lên `@v4`, đặt `cancel-in-progress: false` và bổ sung bước `npm test` trước khi build.
- **Khắc phục toàn diện theo báo cáo kiểm định:** Sửa lỗi lệch chỉ số (`off-by-one`) ở Flashcard, sửa tính điểm phần trăm và dọn dẹp timer trong Quiz, vá XSS và vòng lặp/delta-time physics/chứng chỉ ở Game Hub, kiểm chứng danh sách precache & đường dẫn font tương đối trong [src/service-worker.ts](src/service-worker.ts), và bỏ qua bộ đệm Service Worker cho `/audio-pack.bin` và `/audio-pack.index.json` để đồng bộ hash chính xác.

### Loại bỏ (Removed)
- **Lớp ứng dụng Electron (`src/main/`, `src/preload/`):** Gỡ bỏ hoàn toàn tầng desktop để tập trung vào Web PWA thuần với `0` runtime dependency ở frontend.
- **Tài nguyên và gói dư thừa:** Gỡ bỏ gói `vite-plugin-pwa` không sử dụng và khoảng `9.6 MB` tệp OG/SDK cũ.

---

## [10.0.3] - 2026-10-09

### Thêm mới (Added)
- **Hệ thống giao diện Graphite Dark Mode ([docs/design/dark-mode-tokens.md](docs/design/dark-mode-tokens.md)):** Đặc tả token màu tối đạt chuẩn tương phản WCAG 2.2 AA/AAA cùng tệp JSON (`dark-mode-tokens.json`) và biến CSS (`dark-mode-themes.css`).
- **Quy trình CI/CD & Cấu hình môi trường:** Thêm workflow triển khai GitHub Actions với đường dẫn tương đối (`base: './'`) và biến cấu hình `VITE_SHEET_ID`.
- **Tài liệu & Giấy phép:** Bổ sung giấy phép [LICENSE](LICENSE) (MIT), tách riêng chính sách bảo mật và README song ngữ Việt – Anh.

### Thay đổi (Changed)
- **Thiết kế tối giản Direction A ("Ấn phẩm yên tĩnh"):** Thay thế hoàn toàn bộ icon Font Awesome bằng Lucide SVGs nội tuyến, thiết kế lại các màn hình Home, Study/Quiz, Game Hub, Contribute và Chat mobile bottom-sheet; thay trang `public/offline.html` sang SVG nội tuyến và giảm 50% dung lượng CSS.
- **Tối ưu SEO & Giao diện di động:** Cập nhật Open Graph/canonical URL về `https://umnuar.github.io/xodang/`, tách ô tìm kiếm và nút Micro bằng bố cục flex, xử lý tràn ngang trên các màn hình `360px`–`768px` và tinh chỉnh `line-height` cho ký tự Xơ Đăng.

---

## [10.0.2] - 2026-10-02

### Thêm mới (Added)
- **Game Hub & Onboarding:** Khôi phục trình tạo chứng chỉ Canvas (`certificate.ts`), hệ thống Bảng xếp hạng & Huy hiệu (`leaderboard.ts`), và thao tác vuốt (swipe) trên thiết bị cảm ứng cho Onboarding.
- **Snapshot dự phòng khi mất mạng:** Bổ sung dữ liệu snapshot tĩnh tích hợp khi build để tránh lỗi `403` từ Google Sheets API khi chưa cấu hình khóa hoặc ngoại tuyến.

### Sửa lỗi & Bảo mật (Fixed & Security)
- **Chống DOM XSS & ReDoS:** Loại bỏ nội suy chuỗi HTML chưa làm sạch tại Game 2 (`Game2Catcher`), Game 3 (`Game3Shooter`) và khung kết quả trống tìm kiếm; chặn biểu thức chính quy quá dài chống treo trình duyệt.
- **Chính sách CSP, Upload & API Allowlist:** Siết chặt thẻ Content Security Policy khi build production, thêm `<meta name="referrer" content="strict-origin-when-cross-origin">`, giới hạn phạm vi sheet qua `ALLOWED_SHEET_RANGES`, chặn tải tệp âm thanh vượt `10 MB` hoặc sai MIME, và gỡ bỏ khóa Google API hardcode khỏi mã nguồn.
- **Khả năng truy cập (Accessibility):** Đảm bảo vùng chạm tối thiểu `44px` trên nút đóng modal, sửa thanh điều hướng mobile và dùng favicon nội bộ.

---

## [10.0.1] - 2026-10-01

### Thay đổi (Changed)
- **Kiến trúc mô-đun TypeScript + Vite:** Tách toàn bộ mã nguồn monolithic trước đây thành cấu trúc mô-đun chuẩn với `TypeScript` (`strict`), `Vite` và bộ kiểm thử tự động `Vitest` (`happy-dom`).
- **Tầng dịch vụ & Ngữ âm:** Tách riêng các service `dictionary`, `quiz`, `faq`, `sheets`, `offline-sync`, `speech`, `storage` kèm chuẩn hóa Unicode NFC và bộ golden tests đối chiếu độ chính xác tìm kiếm với phiên bản cũ.
- **Nền tảng học tập & PWA:** Hoàn thiện 4 minigame Canvas bản địa, Flashcard/Quiz theo chủ đề, công cụ ghi âm đóng góp, tự chủ font chữ `Plus Jakarta Sans` (`public/fonts/jakarta/`) và Service Worker bảo toàn kho `tudien-audio`.
