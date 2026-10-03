# KIỂM KÊ MÀN HÌNH VÀ THÀNH PHẦN GIAO DIỆN (PAGE INVENTORY)
*Dự án: Xơ Đăng Lingua — Phiên bản 10.0.3*
*Ngày lập: 03/10/2026 — Kiểm kê thực tế trực tiếp từ source code (HTML, TS, CSS)*

---

## 1. Bản Đồ Điều Hướng & Router (src/renderer/router.ts)
Hệ thống sử dụng Hash Router không framework (`#home`, `#quiz`, `#game`, `#contribute`), tự động chuyển đổi active section giữa các container và đồng bộ hóa trạng thái active trên Desktop Navigation / Mobile Bottom Navigation.

---

## 2. Danh Mục Chi Tiết Từng Trang & Thành Phần

### 2.1. Khung Giao Diện Dùng Chung (Shell / Global Layout)
- **File**: `index.html`, `src/renderer/components/navbar/navbar.html`, `src/renderer/components/footer/footer.html`, `src/renderer/styles/layout.css`
- **Thành phần**:
  - `navbar`: Logo thương hiệu (icon + tiêu đề + phụ đề), menu liên kết desktop (`.desktop-menu`), nút chuyển Dark Mode (`#themeToggleBtn`), nút cài đặt PWA (`#pwaInstallBtn`).
  - `mobile-bottom-nav`: Thanh tab cố định đáy màn hình trên thiết bị di động (Tra từ `#home`, Học tập `#quiz`, Trò chơi `#game`, Đóng góp `#contribute`).
  - `footer`: Bản quyền, giới thiệu dự án bảo tồn ngôn ngữ, liên kết chính sách.
  - `offline-indicator`: Thông báo trạng thái mạng khi chuyển sang chế độ ngoại tuyến.
- **Các trạng thái cần hỗ trợ**:
  - Bình thường (Online, Light/Dark)
  - Ngoại tuyến (Offline indicator hiển thị nhãn "Chế độ Ngoại tuyến")
  - Mobile (Bottom Nav hiển thị, Desktop Menu ẩn)
- **Mức ưu tiên**: **P0**

---

### 2.2. Trang Chủ — Tra Cứu Từ Điển (`#home`)
- **File**: `src/renderer/features/home/home.html`, `src/renderer/features/home/home.ts`, `src/renderer/styles/features/home.css`
- **Thành phần**:
  - **Khối giới thiệu / Hero**: Mô tả ứng dụng, bộ thống kê Bento Stats (Tổng từ, Phát âm, Ví dụ, Trắc nghiệm), thẻ tải dữ liệu ngoại tuyến (`.offline-download-card`), danh sách tính năng (`.features-list`).
  - **Biểu mẫu tìm kiếm (`#searchForm`)**:
    - Ô nhập từ (`#word`) kèm nút mic nhận diện giọng nói (`#speechButton`).
    - Bàn phím ký tự đặc biệt Xơ Đăng (`.diacritics-bar` với 10 nút: Ŏ, Ŭ, Ĕ, Ă, Â, Õ, Ě, Ĭ, Ơ̆, Ư̆).
    - Dropdown chọn hướng dịch (`#direction`: Việt ⇄ Xơ Đăng).
    - Nút thực hiện tra cứu (`.search-button`).
  - **Gợi ý tra cứu nhanh (`.suggestions-chips-container`)**: Các chip từ khóa phổ biến ("xin chào", "cảm ơn", "nhà rông", "uống nước", "rừng").
  - **Khung kết quả tra cứu (`#result`)**:
    - Trạng thái rỗng ban đầu: Minh họa kính lúp + hướng dẫn tra cứu.
    - Trạng thái đang tải (Loading spinner / skeleton).
    - Trạng thái có kết quả: Thẻ từ vựng chi tiết (`.word-card`), từ in đậm, phiên âm, nhãn loại từ, trình phát âm thanh mẫu (`.audio-player-container`), ví dụ song ngữ.
    - Trạng thái không tìm thấy (No result state): Thông báo lịch sự kèm nút chuyển hướng đóng góp từ mới.
- **Các trạng thái cần hỗ trợ**: Bình thường, Rỗng, Đang tra cứu (Loading), Tìm thấy kết quả, Không tìm thấy (Empty/Not found), Ngoại tuyến (Tra từ điển offline).
- **Mức ưu tiên**: **P0**

---

### 2.3. Trang Học Tập & Thi Trắc Nghiệm (`#quiz`)
- **File**: `src/renderer/features/quiz/quiz.html`, `src/renderer/features/quiz/quiz.ts`, `src/renderer/styles/features/quiz.css`
- **Thành phần**:
  - **Chọn chủ đề (`#quizTopicSelection`)**: Lưới thẻ chủ đề học tập (Gia đình, Động vật, Số đếm, Thiên nhiên...) kèm nhãn số lượng từ và tiến độ học.
  - **Chế độ Luyện tập Flashcard (`#flashcardContainer`)**:
    - Thẻ từ vựng lật 2 mặt (Mặt trước: tiếng Xơ Đăng + audio; Mặt sau: tiếng Việt + ví dụ).
    - Nút điều hướng Trước / Sau, nút Lật thẻ, nút phát âm.
  - **Chế độ Thi Trắc nghiệm (`#quizQuestionContainer`)**:
    - Thanh tiến trình câu hỏi (Câu X / Y).
    - Câu hỏi trắc nghiệm (Dịch từ, chọn từ đúng, nghe âm thanh chọn từ).
    - Lưới 4 đáp án lựa chọn (`.quiz-option-btn`).
    - Phản hồi đúng/sai tức thì kèm giải thích.
  - **Màn hình Kết quả & Đánh giá (`#quizResultContainer`)**:
    - Tổng điểm, tỷ lệ chính xác, số sao đạt được.
    - Nhận xét động và nút "Làm lại" / "Chọn chủ đề khác".
- **Các trạng thái cần hỗ trợ**: Chọn chủ đề (Default), Rỗng (Chưa chọn), Đang làm bài (Active quiz), Xem kết quả (Result), Lưu tiến độ localStorage (`studyProgressByTopic`).
- **Mức ưu tiên**: **P0**

---

### 2.4. Trang Trò Chơi Giáo Dục (`#game`)
- **File**: `src/renderer/features/games/games.html`, `src/renderer/features/games/games.ts`, `src/renderer/styles/features/games.css`
- **Thành phần**:
  - **Hub trò chơi (`#gameHubView`)**:
    - Thẻ hồ sơ người học (`.game-user-bar`): Tên người học (`#gameCurrentUserName`), 4 nút chức năng: Bảng vàng thành tích (`#btnOpenLeaderboard`), Huy hiệu (`#btnOpenBadges`), Chứng nhận tốt nghiệp (`#btnOpenCertificates`), Bật/tắt âm thanh SFX (`#toggleGameSfx`).
    - Lưới 4 thẻ game:
      1. Game 1: **Lật Thẻ Trí Nhớ** (`data-game="game1"`).
      2. Game 2: **Mưa Từ Vựng** (`data-game="game2"`).
      3. Game 3: **Bảo Vệ Làng** (`data-game="game3"`).
      4. Game 4: **Nông Trại Số** (`data-game="game4"`).
  - **Giao diện trong trò chơi (`#gameActiveView`)**:
    - Thanh điều khiển trên cùng (Top bar): Nút "Menu trò chơi" (`#btnExitGame`), Tên trò chơi (`#activeGameTitle`), Cấp độ (`#activeGameLevel`), Điểm (`#activeGameScore`), Số mạng sống (`#activeGameLives`).
    - Sân khấu trò chơi (`#gameStage`): Khung canvas / DOM game động.
    - Modal hoàn thành màn chơi / Game over (`#gameOverModal`).
  - **Các Modal bổ trợ**:
    - Modal Bảng vàng (`#leaderboardModal`).
    - Modal Bộ sưu tập huy hiệu (`#badgesModal`).
    - Modal Chứng nhận tốt nghiệp (`#certsModal`).
- **Các trạng thái cần hỗ trợ**: Hub danh mục (Default), Đang chơi game (Active game view), Modal thông báo (Over/Win/Badge), Lưu điểm cao (`xedang_game_*`).
- **Mức ưu tiên**: **P1**

---

### 2.5. Trang Đóng Góp Từ Ngữ & Thu Âm (`#contribute`)
- **File**: `src/renderer/features/contribute/contribute.html`, `src/renderer/features/contribute/contribute.ts`, `src/renderer/styles/features/contribute.css`
- **Thành phần**:
  - **Biểu mẫu đóng góp từ vựng (`#contributeForm`)**:
    - Nhập từ Xơ Đăng, nghĩa tiếng Việt, loại từ (Danh từ, Động từ, Tính từ...).
    - Câu ví dụ minh họa và nghĩa tiếng Việt của câu.
    - Chọn vùng phương ngữ (Đăk Tô, Tu Mơ Rông, Kon Plông...).
  - **Khu vực thu âm phát âm chuẩn (`#audioRecorder`)**:
    - Nút bắt đầu thu âm (`#startRecordBtn`), nút dừng thu (`#stopRecordBtn`).
    - Đồng hồ đếm thời gian thu âm.
    - Khung phát nghe lại bản thu (`#audioPlayback`).
  - **Danh sách hàng đợi đóng góp (`#contributionQueue`)**:
    - Hiển thị danh sách các từ đã gửi hoặc đang lưu tạm trong máy khi mất mạng.
    - Nút gửi đồng bộ khi có kết nối trở lại.
- **Các trạng thái cần hỗ trợ**: Form trống (Default), Đang thu âm (Recording state), Đã có bản thu (Recorded state), Hàng đợi rỗng (Empty queue), Hàng đợi có dữ liệu offline (Pending queue), Gửi thành công (Success toast/feedback).
- **Mức ưu tiên**: **P1**

---

### 2.6. Trợ Lý AI Chatbot (`#chatWindow` & `#chatToggleBtn`)
- **File**: `src/renderer/features/chat/chat.html`, `src/renderer/features/chat/chat.ts`, `src/renderer/styles/features/chat.css`
- **Thành phần**:
  - Nút tròn nổi kích hoạt chatbot (`#chatToggleBtn`) ở góc dưới phải.
  - Cửa sổ hộp thoại (`#chatWindow`):
    - Tiêu đề chatbot + nút đóng (`#closeChatBtn`).
    - Danh sách tin nhắn (`#chatMessages`): Tin nhắn chào mừng, tin bot trả lời, tin người dùng, nhãn thời gian, hiệu ứng typing indicator khi đang suy nghĩ.
    - Khung nhập tin nhắn (`#chatInput`) + Nút gửi (`#sendChatBtn`).
    - Các chip câu hỏi gợi ý nhanh (`.hashtag`).
- **Các trạng thái cần hỗ trợ**: Ẩn (Default), Mở (Active popup/drawer), Đang gõ tin nhắn (Typing indicator), Mất mạng (Offline AI notice).
- **Mức ưu tiên**: **P2**

---

### 2.7. Hướng Dẫn Ban Đầu (Onboarding Guide)
- **File**: `src/renderer/features/onboarding/onboarding.html`, `src/renderer/features/onboarding/onboarding.ts`, `src/renderer/styles/features/onboarding.css`
- **Thành phần**:
  - Modal toàn màn hình nhẹ (`#onboardingModal`).
  - Các bước giới thiệu tính năng: 1) Tra cứu từ điển, 2) Học Flashcard & Quiz, 3) Chơi game bảo tồn ngôn ngữ, 4) Tải ứng dụng offline.
  - Nút chuyển bước kế tiếp (`#onboardingNext`), nút bỏ qua (`#onboardingSkip`).
- **Các trạng thái cần hỗ trợ**: Hiển thị lần đầu (chưa có key `hasSeenIntro`), Đã hoàn thành (ẩn hoàn toàn).
- **Mức ưu tiên**: **P2**

---

### 2.8. Modal Cài Đặt Ứng Dụng PWA (`#installModal`)
- **File**: `src/renderer/components/install-modal/install-modal.html`, `src/renderer/components/install-modal/install-modal.ts`
- **Thành phần**:
  - Hộp thoại hướng dẫn cài đặt web app lên màn hình chính (Chrome, Safari, Edge, Mobile).
  - Nút "Cài đặt ngay" (`#confirmInstallBtn`), nút đóng modal (`#closeInstallModalBtn`).
- **Các trạng thái cần hỗ trợ**: Ẩn, Mở khi nhấn nút `#pwaInstallBtn` trên navbar hoặc kích hoạt từ banner PWA.
- **Mức ưu tiên**: **P2**
