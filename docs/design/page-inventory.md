# BẢN KIỂM KÊ TRANG & MÀN HÌNH (PAGE INVENTORY)
*Dự án: Ứng dụng số hóa hỗ trợ tự học và bảo tồn ngôn ngữ Xơ Đăng cho học sinh THCS*  
*Phiên bản: 10.0.3 | Ngày kiểm kê: 2026-10-03*

---

## 1. Danh Sách Màn Hình / Tuyến Trang

Dự án là ứng dụng Single Page Application (PWA) định tuyến bằng URL hash (`router.ts`), kết hợp một trang cứu trợ ngoại tuyến độc lập (`offline.html`).

| STT | Màn hình | URL / Tuyến | Template / File Nguồn | Mục đích chính |
| :--- | :--- | :--- | :--- | :--- |
| **01** | **Trang Chủ (Từ Điển)** | `/#home` (hoặc `/`) | `src/renderer/features/home/home.html` | Tra cứu 2 chiều Xơ Đăng ↔ Việt, thống kê số liệu, tải audio offline, tìm kiếm giọng nói, hiển thị chi tiết từ vựng và câu ví dụ |
| **02** | **Đóng Góp Từ Vựng** | `/#contribute` | `src/renderer/features/contribute/contribute.html` | Thu thập từ mới và bản thu âm giọng đọc bản địa từ cộng đồng học sinh/giáo viên (hỗ trợ đóng góp đơn và thu âm hàng loạt) |
| **03** | **Học & Kiểm Tra (Quiz/Flashcard)** | `/#quiz` | `src/renderer/features/quiz/quiz.html` | Chọn chủ đề bài học, lật flashcard 3D học từ vựng, làm bài trắc nghiệm tính điểm, xem kết quả và giải thích |
| **04** | **Game Giáo Dục** | `/#game` | `src/renderer/features/games/games.html` | Hub 4 trò chơi học tập (Lật thẻ trí nhớ, Mưa từ vựng, Bảo vệ làng, Nông trại số), bảng xếp hạng, huy hiệu, chứng nhận tốt nghiệp |
| **05** | **Hướng Dẫn Sử Dụng (Onboarding Modal)** | Khởi chạy qua modal `#onboardingModal` | `src/renderer/features/onboarding/onboarding.html` | Giới thiệu 4 trụ cột tính năng cho người mới: Dữ liệu chuẩn, Phương pháp học, Trợ lý ảo, Cộng đồng |
| **06** | **Trang Báo Ngoại Tuyến (Offline Fallback)** | `/offline.html` | `public/offline.html` | Trang dự phòng khi mất kết nối hoàn toàn và chưa kịp cache tài nguyên ứng dụng |

---

## 2. Chi Tiết Thành Phần Giao Diện Theo Từng Màn Hình

### 2.1 Trang Chủ (Từ Điển - `/#home`)
- **Header & Hero Section**:
  - Tiêu đề chính `h1`: "Tra Cứu Tiếng Xơ Đăng - Tiếng Việt"
  - Mô tả tóm tắt mục tiêu dự án
  - Thẻ lưới thống kê 4 cột (`.dictionary-stats`): Số lượng Từ vựng (1000+), File âm thanh (1000+), Ví dụ (2000+), Câu hỏi ôn tập (100+)
- **Thẻ Tải Âm Thanh Ngoại Tuyến (`.offline-download-card`)**:
  - Icon wifi, tiêu đề trạng thái, thanh tiến trình download (`.download-progress-bar`), nút hành động "Tải âm thanh offline (~40MB)"
- **Lưới Tính Năng Nổi Bật (`.features-list`)**:
  - 10 thẻ item biểu tượng icon + văn bản giới thiệu các tính năng cốt lõi
- **Form Tra Cứu (`#searchForm`)**:
  - Ô input tìm kiếm `#word` tích hợp autocomplete suggestions (`#suggestions`)
  - Nút nhận diện giọng nói `#speechButton` (icon micro, hiệu ứng pulse khi đang nghe)
  - Dropdown chọn hướng dịch `#direction` (Việt → Xơ Đăng / Xơ Đăng → Việt)
  - Nút bấm `#search-button` "Tra cứu"
- **Khu Vực Kết Quả Tra Cứu (`#resultContainer`)**:
  - Trạng thái ban đầu: Empty state gợi ý nhập từ
  - Trạng thái kết quả: Thẻ từ (`.word-card`), bao gồm từ gốc, từ dịch, nút phát âm thanh (`.audio-btn`), câu ví dụ minh họa và nghĩa tiếng Việt

### 2.2 Đóng Góp Từ Vựng (`/#contribute`)
- **Tiêu đề & Hướng dẫn**: Giới thiệu mục đích và 2 hình thức đóng góp
- **Bộ Chuyển Tab (`.contribute-tabs`)**: Nút tab "Từ đơn" (`#singleTab`) và "Thu hàng loạt" (`#batchTab`)
- **Form Tab "Từ Đơn"**:
  - Input từ tiếng Việt (`#vietnameseWord`)
  - Input nghĩa tiếng Xơ Đăng (`#xodangWord`)
  - Khu vực âm thanh: Nút "Thu âm" (`#recordAudioBtn`), Nút "Tải lên" (`#uploadAudioBtn`), Input file ẩn
  - Bộ visualizer sóng âm (`#audioVisualizer` / `#audioWave`)
  - Bảng điều khiển phát lại bản thu (`#singlePlaybackControls`): Nút Play, Stop, Delete, Tên file
  - Nút gửi đóng góp (`#submitSingleBtn`)
- **Form Tab "Thu Hàng Loạt"**:
  - Thống kê tiến độ danh sách từ cần thu
  - Thẻ từ vựng hiện tại cần đọc to
  - Bộ nút điều hướng: Bỏ qua, Thu lại, Tiếp tục

### 2.3 Học & Kiểm Tra (`/#quiz`)
- **Tiêu đề & Thanh Tiến Trình Học Tập**: `.study-progress-bar`
- **Màn Hình 1 - Chọn Chủ Đề (`#studyQuizTopicSelection`)**:
  - Lưới card các chủ đề bài học (`#studyQuizTopicsGrid`): Gia đình, Trường học, Thiên nhiên, Động vật, v.v. Kèm số lượng thẻ và tiến độ %
- **Màn Hình 2 - Flashcard Học Tập (`#studyInterface`)**:
  - Tiêu đề chủ đề, bộ đếm số thẻ (`#currentStudyCardNumber` / `#totalStudyCards`), tỷ lệ % hoàn thành
  - Khối hướng dẫn 4 bước học tập
  - Thẻ Flashcard 3D lật 2 mặt (`#flashcard`):
    - Mặt trước: Câu hỏi / Từ vựng, badge số thứ tự, nút âm thanh
    - Mặt sau: Đáp án, nghĩa chi tiết, câu mẫu minh họa
  - Thanh điều khiển: Nút "Thẻ trước", Nút "Lật thẻ", Nút "Thẻ sau"
  - Nút mở khóa "Bắt đầu làm bài trắc nghiệm" (kích hoạt khi học ≥ 70%)
- **Màn Hình 3 - Trắc Nghiệm Tính Điểm (`#quizInterface`)**:
  - Thanh đếm giờ / tiến độ câu hỏi
  - Câu hỏi và 4 lựa chọn đáp án A, B, C, D
  - Màn hình kết quả tổng kết: Điểm số, xếp loại, nút làm lại hoặc chọn chủ đề khác

### 2.4 Game Giáo Dục (`/#game`)
- **Game Hub (Màn hình chọn game - `#gameHubView`)**:
  - Thanh người dùng: Tên học sinh, Bộ 4 nút tiện ích (Bảng vàng `#btnOpenLeaderboard`, Huy hiệu `#btnOpenBadges`, Chứng nhận `#btnOpenCertificates`, Bật/tắt âm thanh SFX `#toggleGameSfx`)
  - Lưới 4 Game Cards:
    1. Game 1: Lật Thẻ Trí Nhớ (Memory Match)
    2. Game 2: Mưa Từ Vựng (Word Catcher)
    3. Game 3: Bảo Vệ Làng (Word Shooter)
    4. Game 4: Nông Trại Số (Word Farm)
- **Game Active View (`#gameActiveView`)**:
  - Header trò chơi: Nút quay lại Hub, Điểm số, Mạng/Thời gian, Tên game
  - Khu vực canvas / bàn chơi tương tác theo từng trò chơi
  - Modal Game Over / Chiến thắng kèm bảng xếp hạng cục bộ

### 2.5 Hướng Dẫn Sử Dụng (Onboarding Modal - `#onboardingModal`)
- Modal cố định toàn màn hình với nền mờ (`.onboarding-overlay`)
- Nút đóng `x` góc trên bên phải
- Carousel 4 slide:
  - Slide 1: Nguồn dữ liệu chuẩn hóa
  - Slide 2: Phương pháp học chủ động
  - Slide 3: Trợ lý ảo thông minh
  - Slide 4: Cộng đồng đóng góp từ vựng
- Dots chỉ số slide và 2 nút điều hướng (Slide trước / Slide tiếp / Bắt đầu trải nghiệm)

### 2.6 Trang Báo Ngoại Tuyến (`public/offline.html`)
- Biểu tượng ngoại tuyến động pulse
- Tiêu đề thông báo mất mạng
- Danh sách các tính năng vẫn dùng được khi offline (tra từ đã lưu, nghe phát âm đã tải)
- Nút "Thử kết nối lại" và nút "Về trang chủ khi có mạng"

---

## 3. Các Trạng Thái Giao Diện (State Matrix)

| Trạng thái | Biểu hiện trên UI hiện tại | Điểm hạn chế cần khắc phục |
| :--- | :--- | :--- |
| **Bình thường (Default/Normal)** | Render nội dung cơ bản, màu nền gradient xám xanh | Đơn điệu, độ tương phản một số nhãn mờ, khoảng cách chưa có nhịp điệu (rhythm) |
| **Trống (Empty State)** | Biểu tượng kính lúp màu xám nhạt `#ccc` và văn bản 2 dòng | Thiếu call-to-action (CTA) trực quan, thiếu từ khóa mẫu gợi ý |
| **Đang tải (Loading State)** | Spinner tròn cổ điển, overlay `#loadingOverlay` màu tối `rgba(0,0,0,0.7)` | Gây chặn hoàn toàn tương tác của người dùng, thiếu skeleton loading ở các card |
| **Báo lỗi (Error State)** | Hộp viền đỏ nhạt `.error` với background `#fdeded`, chữ đỏ | Đơn điệu, thông báo kỹ thuật khô khan, không có nút hành động thử lại (Retry) |
| **Ngoại tuyến (Offline State)** | Thẻ badge góc phải `#offlineIndicator` màu cam/xanh | Kích thước badge quá nhỏ trên mobile (0.65rem), dễ bị che khuất hoặc bỏ qua |

---

## 4. Hệ Thống Màu Sắc, Font Chữ & Spacing Hiện Tại

### 4.1 Bảng màu (Tokens hiện có trong `tokens.css`)
- Light mode:
  - Primary: `#2c3e50` (Slate navy)
  - Secondary: `#27ae60` (Green)
  - Accent / Error: `#e74c3c` (Red)
  - Text: `#000000` (Pure black - gây gắt mắt)
  - Background: `linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)`
- Dark mode:
  - Primary / Text: `#ecf0f1` (Off white)
  - Background: `linear-gradient(135deg, #34495e 0%, #2c3e50 100%)`
  - Error: `#e74c3c` (Dùng nền đỏ chữ trắng gây chói)

### 4.2 Typography
- Font stack chính: `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`
- Footer có chen font ngoài: `'Plus Jakarta Sans', sans-serif` (chưa nạp @font-face đầy đủ)
- Cỡ chữ: Hardcoded rải rác (`0.65rem`, `0.7rem`, `0.8rem`, `0.95rem`, `1.1rem`, `1.4rem`, `1.8rem`, `2.5rem`) thiếu scale modular chuẩn.

### 4.3 Spacing & Layout
- Grid & Flexbox dùng khoảng cách ad-hoc: `5px`, `10px`, `15px`, `20px`, `1rem`, `1.5rem`, `2rem`.
- Breakpoints: Đang dùng `768px` và `480px`. Chưa tối ưu tốt cho chuẩn 360px (mobile chuẩn) và 1280px (desktop rộng).
