# Checklist Kiểm Tra & Sửa Lỗi UI/UX (`tudien-xedang`)

- **Phiên bản / Commit kiểm tra:** `10.0.4` (`1939e2d`)
- **Phạm vi rà soát:** [index.html](../index.html), [public/manifest.json](../public/manifest.json), [public/offline.html](../public/offline.html), [public/fonts/be-vietnam-pro/be-vietnam-pro.css](../public/fonts/be-vietnam-pro/be-vietnam-pro.css) *(thay cho `jakarta.css` đã gỡ bỏ)*, [src/service-worker.ts](../src/service-worker.ts), toàn bộ HTML/CSS/TS dưới `src/`, và các chuẩn token trong `docs/design/`
- **Phương pháp:** Hai vòng kiểm toán tĩnh trên mã nguồn: vòng 1 tổng quan (`29` mục) và vòng 2 chuyên sâu bằng 3 subagent độc lập (`CSS/Layout/PWA`, `Interactive UX/State`, `Games/Pedagogy/Canvas/Audio`), đã khử trùng lặp 100% và xác thực chéo trực tiếp với mã nguồn kèm [dark-mode-tokens.md](./design/dark-mode-tokens.md) / [dark-mode-tokens.json](./design/dark-mode-tokens.json). *(Chụp trình duyệt live qua Chrome DevTools MCP bị bỏ qua do lỗi giao thức cửa sổ host `Browser.setContentsSize`.)*

---

## Tóm tắt theo mức độ & nhóm vấn đề

| Nhóm kiểm toán | P0 | P1 | P2 | P3 | Redesign | Tổng | Trọng tâm chính |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **1. Core UI/UX & A11y (`UI-01`–`UI-22`)** | 6 | 6 | 6 | 4 | — | **22** | Tương phản CTA Dark Mode, Toast, kẹt Quiz, thanh đáy iOS, `.hashtag`, focus/ARIA/Modal, FOUC, polish |
| **2. Kiến trúc & Thiết kế Game Arena (`GAME-01`–`GAME-07`)** | — | — | — | — | 7 | **7** | Khung chơi 4 lớp + Canvas `600×420`, bỏ phí `driveId`, thiếu sửa lỗi/ôn tập, làm quen từ, Pause/HUD, thẩm mỹ |
| **3. CSS, Tương phản, Z-Index, Font Xơ Đăng & PWA (`VIS-01`–`VIS-18`)** | 5 | 8 | 4 | 1 | — | **18** | `.chat-header h3`, `--color-danger`, thanh tiến độ `0px`, `viewport-fit=cover`, `#offlineIndicator` chặn click, `color-scheme`, thang `z-index`, xung đột CSS lazy-chunk, mất dấu `U+0306` & SW font, `offline.html`, `100vh`, tràn `320–360px`, tương phản Light/Canvas, `.lucide-icon`, `manifest.json` |
| **4. Luồng tương tác, State, STT, Quiz, Đóng góp & Chat (`UX-01`–`UX-31`)** | 1 | 15 | 14 | 1 | — | **31** | Thu hàng loạt thiếu nhập từ, lazy-route không loader/catch, bootstrap race, chồng `<audio>`, STT `vi-VN` & race/cancel, `#retryQuizBtn` về Flashcard, đơ đồng hồ Quiz, `no-cors` báo thành công giả, kẹt audio Đóng góp, race nút Chat & `loadFaqs()` xóa tin nhắn, `aria-labelledby` trỏ heading ẩn |
| **5. Cơ chế Game, Ngữ liệu, Audio SFX, Chứng nhận & Bảng vàng (`GM-01`–`GM-19`)** | 2 | 11 | 4 | 2 | — | **19** | Đảo ngược nghĩa **Bố/Mẹ** & 8 từ mâu thuẫn ngữ liệu, chồng chữ Game 2 không thể né, reset điểm qua Level, hitbox tường Game 3 lệch `63px`, Game 4 kẹt modal, crash `getMemoryCardPairs`, `aria-label` che thẻ Game 1, thua vẫn cấp bằng "XUẤT SẮC" & mở huy hiệu, lỗi Web Audio SFX, 20 `driveId` ảo `audio_1..20`, lỗi touch/keyboard Canvas, mất dấu tên file chứng nhận |
| **Tổng cộng** | **14** | **40** | **28** | **8** | **7** | **97** | **29 mục nền + 68 phát hiện chuyên sâu mới (đã khử trùng lặp)** |

---

## P0 — Critical (Vỡ hiển thị, trượt tương phản WCAG, kẹt luồng sử dụng)

- [x] **[UI-01] Dark Mode: Nút CTA và icon dùng chữ trắng (`#ffffff` / `white`) trên nền `#34d399` (tỷ lệ `2.08:1`, trượt chuẩn WCAG 2.2 AA `4.5:1`)**
  - Theo [dark-mode-tokens.md](./design/dark-mode-tokens.md#L69-L70), nền `#34d399` bắt buộc đi với chữ tối (`#0f1012`), nhưng hàng loạt thành phần chưa có override `body.dark-mode` nên bị mờ/chói khi bật Dark Mode:
  - [x] [src/styles/components/modal.css](../src/styles/components/modal.css#L7-L8): `.install-button` (`background: var(--color-primary); color: #ffffff;`)
  - [x] [src/styles/components/common.css](../src/styles/components/common.css#L206-L207): `.chat-toggle-btn` fallback trước khi `chat.css` được lazy-load
  - [x] [src/styles/features/chat.css](../src/styles/features/chat.css#L215-L216): `.send-btn` (chỉ mới override `.chat-toggle-btn`, `.chat-header`, `.close-chat-btn`, `.message.user`, bỏ sót `.send-btn`)
  - [x] [src/styles/features/contribute.css](../src/styles/features/contribute.css#L276-L277): `.submit-contribute-btn`
  - [x] [src/styles/features/flashcard.css](../src/styles/features/flashcard.css#L316-L317): `.flashcard-tick` và `.start-quiz-btn` ([dòng 405-406](../src/styles/features/flashcard.css#L405-L406))
  - [x] [src/styles/features/quiz.css](../src/styles/features/quiz.css#L327-L328): `.result-action-btn`
  - [x] [src/styles/features/games.css](../src/styles/features/games.css#L191-L192): `.game-play-btn` và `.modal-btn.btn-primary` ([dòng 614-615](../src/styles/features/games.css#L614-L615))
  - [x] [src/styles/features/onboarding.css](../src/styles/features/onboarding.css#L203-L204): `.onboarding-start-btn`
  - [x] [src/styles/layout.css](../src/styles/layout.css#L57-L58): `.brand-logo:hover .brand-icon` (`color: white`) và `.social-icons a:hover` ([dòng 283-284](../src/styles/layout.css#L283-L284))
  - [x] [src/features/home/home.ts](../src/features/home/home.ts#L244-L246): JS gán inline `btnDownload.style.background = 'var(--color-primary)'` nhưng không đổi màu chữ từ `var(--text-primary)` thành `#0f1012` khi Dark Mode ([dòng 245 & 270](../src/features/home/home.ts#L269-L271))

- [x] **[UI-02] Toast loại `warning` thiếu class CSS nên bị trong suốt (chữ trắng tàng hình trên nền sáng)**
  - [src/components/toast.ts](../src/components/toast.ts#L3), [src/features/home/home.ts](../src/features/home/home.ts#L258) và [src/features/quiz/quiz.ts](../src/features/quiz/quiz.ts#L117) gọi `showToast(..., 'warning')`.
  - [src/styles/components/common.css](../src/styles/components/common.css#L90-L100) chỉ định nghĩa `.toast.success`, `.toast.error`, `.toast.info` — thiếu hoàn toàn `.toast.warning`, làm toast giữ nguyên `color: white` nhưng nền rỗng.

- [x] **[UI-03] Nhiều Toast đè chồng lên nhau tại một tọa độ & bị modal/chat che khuất**
  - [src/styles/components/common.css](../src/styles/components/common.css#L70-L83) gắn `position: fixed; top: 20px; right: 20px; z-index: 1000;` lên từng `.toast` thay vì gắn layout flex stack lên `#toastContainer`.
  - Khi phát sinh nhiều thông báo liên tiếp (ví dụ thao tác ghi âm + lưu cache), các toast đè khít lên nhau; đồng thời `z-index: 1000` thấp hơn `.chat-widget-container` (`9998`), `.loading-overlay` (`9999`), `.install-modal` (`10000`) và `.onboarding-modal` (`10000`) nên thông báo lỗi trong modal bị che khuất.

- [x] **[UI-04] Kẹt đường quay lại chọn chủ đề trong phân hệ Học & Thi (UX Dead-end)**
  - [src/features/quiz/quiz.html](../src/features/quiz/quiz.html#L28-L199) chỉ có nút `#newTopicBtn` ở màn hình kết quả sau khi thi xong ([dòng 248](../src/features/quiz/quiz.html#L248)).
  - Khi đang xem Flashcard (`#studyInterface`) hoặc đang làm trắc nghiệm (`#quizInterface`), người dùng không có nút "Quay lại danh sách chủ đề" để đổi chủ đề khác mà phải chuyển sang tab khác hoặc tải lại trang.

- [x] **[UI-05] Thanh điều hướng đáy di động bị bóp chiều cao & đụng thanh Home Indicator trên iPhone**
  - [src/styles/layout.css](../src/styles/layout.css#L370-L374) đặt `height: 64px; padding-bottom: env(safe-area-inset-bottom, 0px); box-sizing: border-box;` trên `.mobile-bottom-nav`. Với iPhone có home indicator `34px`, chiều cao hiển thị icon + nhãn bên trong chỉ còn `30px` (`< 44px` tap target).
  - Các phần tử neo đáy khác (`.chat-window` ở [src/styles/features/chat.css](../src/styles/features/chat.css#L324), `.chat-widget-container` ở [common.css](../src/styles/components/common.css#L218), `.install-button` ở [modal.css](../src/styles/components/modal.css#L33)) cố định `64px` / `76px` mà chưa cộng `env(safe-area-inset-bottom, 0px)`.

- [x] **[UI-06] Xung đột class `.hashtag` toàn cục giữa Footer và Chat Widget khi lazy-load**
  - [src/styles/layout.css](../src/styles/layout.css#L225-L245) định nghĩa `.hashtag` cho các nhãn `#TừĐiểnXơĐăng` ở Footer (pill bo tròn `9999px`, nền xanh nhạt).
  - Khi `chat.css` được nạp trễ lúc trình duyệt rảnh (`requestIdleCallback`), [src/styles/features/chat.css](../src/styles/features/chat.css#L265-L280) định nghĩa lại `.hashtag` với bo góc `4px`, nền `var(--bg-canvas)`, viền xám, khiến các thẻ trong Footer đột ngột đổi hình dạng giữa chừng và ở Dark Mode chuyển chữ tối khó đọc khi chưa hover.

---

## P1 — High (Accessibility WCAG 2.2 AA, Điều hướng bàn phím & Screen Reader)

- [x] **[UI-07] Tắt `outline: none` khi focus trên input, select và textarea**
  - [src/styles/base.css](../src/styles/base.css#L80-L83) đặt `outline: none` cho `input[type="text"]:focus, select:focus, textarea:focus` và [src/styles/features/home.css](../src/styles/features/home.css#L70-L74) lặp lại trên `#word`, ghi đè `:focus-visible` chung.
  - Đặc biệt thẻ `<select id="direction">` không có `box-shadow` thay thế nên khi nhấn `Tab` không thấy khung focus; trên Windows Forced Colors `box-shadow` cũng bị tắt làm người dùng bàn phím mất dấu vị trí con trỏ.

- [x] **[UI-08] Lồng phần tử tương tác ở Game Hub (`role="button"` bọc `<button>`)**
  - [src/features/games/games.html](../src/features/games/games.html#L48-L132) đặt `role="button" tabindex="0"` trên `.game-select-card` và đặt thêm `<button class="game-play-btn">` bên trong (vi phạm nested interactive HTML, tạo 2 điểm dừng `Tab` trùng chức năng cho mỗi thẻ game).
  - [src/features/games/games.ts](../src/features/games/games.ts#L59-L68) chỉ lắng nghe `click`, chưa bắt `keydown` (`Enter` / `Space`) cho `.game-select-card`.

- [x] **[UI-09] Nhiều điều khiển cốt lõi dùng `<div>`/`<span>` thay `<button>` nên không thao tác được bằng bàn phím**
  - [src/features/quiz/quiz.ts](../src/features/quiz/quiz.ts#L85-L106): `.topic-card` dùng `<div>` chỉ có sự kiện `click`, không thể Tab vào chọn chủ đề.
  - [src/features/quiz/quiz.ts](../src/features/quiz/quiz.ts#L203-L224): `.option` nằm trong container `role="radiogroup"` ([quiz.html](../src/features/quiz/quiz.html#L171)) nhưng dùng `<div>` không có `role="radio"`, `aria-checked`, `tabindex` hay điều hướng phím mũi tên / `Enter` / `Space`.
  - [src/features/quiz/quiz.ts](../src/features/quiz/quiz.ts#L135-L137): `#flashcard` có `role="button" tabindex="0"` nhưng chưa xử lý `keydown` (`Enter` / `Space`) để lật thẻ.
  - [src/features/games/game4-farm.ts](../src/features/games/game4-farm.ts#L66-L72): `.farm-plot` dùng `<div>` không có `role="button"`, `tabindex="0"`, `keydown`.
  - [src/features/onboarding/onboarding.html](../src/features/onboarding/onboarding.html#L116-L121) & [src/styles/features/onboarding.css](../src/styles/features/onboarding.css#L182-L189): `.onboarding-dot` dùng `<span role="tab">` thiếu `tabindex` và chỉ rộng `8×8px` (dưới chuẩn `44×44px`).

- [x] **[UI-10] Sai ngữ nghĩa ARIA tại Navbar & thiếu `type="button"` / `aria-pressed`**
  - [src/components/navbar/navbar.html](../src/components/navbar/navbar.html#L17-L58) gắn `role="menubar"` / `role="menuitem"` cho menu điều hướng website nhưng không cài đặt roving `tabindex` hay phím mũi tên theo chuẩn ARIA Menubar, và [navbar.ts](../src/components/navbar/navbar.ts#L15-L22) không đặt `aria-current="page"` trên tab đang chọn.
  - [src/components/navbar/navbar.html](../src/components/navbar/navbar.html#L72) đặt `<div class="mobile-bottom-nav" role="navigation">` lồng bên trong `<nav class="navbar">`.
  - Thiếu `type="button"` (nhất là nếu đặt trong form) và `aria-pressed` cho các nút toggle trạng thái như `#darkModeToggle` ([navbar.html](../src/components/navbar/navbar.html#L62)), `#toggleGameSfx` ([games.html](../src/features/games/games.html#L36)), các nút ở [quiz.html](../src/features/quiz/quiz.html#L112-L197), [install-modal.html](../src/components/install-modal/install-modal.html#L4), [onboarding.html](../src/features/onboarding/onboarding.html#L4), [chat.html](../src/features/chat/chat.html#L2).

- [x] **[UI-11] Hệ thống Modal thiếu Escape, Focus Trap, khóa cuộn trang và nút đóng đạt chuẩn 44px**
  - `#installGuideModal` ([install-modal.ts](../src/components/install-modal/install-modal.ts)), `#deleteAudioConfirmModal` ([contribute.ts](../src/features/contribute/contribute.ts#L230-L243)), `#gameOverModal` ([games.html](../src/features/games/games.html#L170)), `#certificateModal` ([certificate.ts](../src/features/games/certificate.ts#L240-L297)), `#leaderboardModal` / `#badgesModal` / `#certificatesListModal` ([leaderboard.ts](../src/features/games/leaderboard.ts#L259-L485)), `#farmQuestionModal` ([game4-farm.ts](../src/features/games/game4-farm.ts#L75)):
    - Đa số modal trong Game Hub thiếu `role="dialog"` / `aria-modal="true"` / `aria-labelledby`.
    - Ngoại trừ Onboarding, tất cả các modal còn lại không đóng được bằng phím `Escape`, không giữ vòng Tab bên trong modal (focus trap), không khóa cuộn nền và không trả focus về nút kích hoạt khi đóng.
  - [src/styles/features/games.css](../src/styles/features/games.css#L733-L743): `.btn-close-modal` không đặt `min-width: 44px; min-height: 44px;`.

- [x] **[UI-12] Thiếu live region cho Toast & thuộc tính cập nhật động trên Progressbar / Queue**
  - [src/main.ts](../src/main.ts#L123): `#toastContainer` thiếu `role="status"` / `aria-live="polite"`.
  - [src/features/quiz/quiz.html](../src/features/quiz/quiz.html#L6) & [flashcard.ts](../src/features/quiz/flashcard.ts#L138-L154): hai thanh `#studyProgressFill` và `#studySessionProgressFill` có `role="progressbar"` nhưng JS chỉ đổi `style.width`, không cập nhật `aria-valuenow`.
  - [src/features/contribute/contribute.ts](../src/features/contribute/contribute.ts#L205-L217): `.queue-play-btn` và `.queue-delete-btn` chỉ gán `title`, thiếu `aria-label` và `type="button"` cho trình đọc màn hình.

---

## P2 — Medium (Dark Mode chưa triệt để, Responsive, Nhất quán hệ thiết kế)

- [x] **[UI-13] Chớp sáng trắng (FOUC) khi mở ứng dụng ở Dark Mode & không đồng bộ `theme-color`**
  - Class `body.dark-mode` chỉ được gắn sau khi bundle JS thực thi ở [navbar.ts](../src/components/navbar/navbar.ts#L45-L47), còn [index.html](../index.html#L238) lại gắn cứng `style="... background:white; ..."` và `color:#27ae60` cho `#app-loading`.
  - [index.html](../index.html#L35) khai báo cứng `<meta name="theme-color" content="#1e7e48">`, chưa đổi màu thanh trạng thái PWA sang `#0f1012` khi người dùng bật Dark Mode.

- [x] **[UI-14] Dark Mode Graphite chưa phủ đều ở Game Hub, Modals & dùng biến CSS không tồn tại**
  - [src/styles/layout.css](../src/styles/layout.css#L378): `.mobile-bottom-nav` ở Dark Mode dùng màu xanh navy cũ `rgba(11, 17, 32, 0.96)` lệch tông Graphite (`#17181b`).
  - [src/styles/features/games.css](../src/styles/features/games.css#L229-L549) tham chiếu hàng loạt biến CSS chưa hề khai báo trong [tokens.css](../src/styles/tokens.css): `--color-surface` ([dòng 229](../src/styles/features/games.css#L229)), `--color-border` ([dòng 230](../src/styles/features/games.css#L230)), `--bg-card` ([dòng 303](../src/styles/features/games.css#L303), [487](../src/styles/features/games.css#L487), [549](../src/styles/features/games.css#L549)), `--color-text-primary` ([dòng 247](../src/styles/features/games.css#L247)), `--text-muted` ([dòng 420](../src/styles/features/games.css#L420)).
  - Nhiều khối bên trong Game Hub & Modals giữ màu sáng/xám hardcoded khi Dark Mode: `.game-level-tag`, `.stat-pill` ([dòng 271-300](../src/styles/features/games.css#L271-L300)), `.memory-card-back` ([dòng 370-376](../src/styles/features/games.css#L370-L376)), `.player-meta` / `.player-score` ([dòng 832-851](../src/styles/features/games.css#L832-L851)), `.badge-desc` ([dòng 904](../src/styles/features/games.css#L904)), `.cert-card-meta` / `.cert-card-date` ([dòng 952-963](../src/styles/features/games.css#L952-L963)), `.empty-state-wrap` ([dòng 966-981](../src/styles/features/games.css#L966-L981)), `.cert-modal-header` ([dòng 720](../src/styles/features/games.css#L720)).
  - [src/styles/components/modal.css](../src/styles/components/modal.css#L111-L247) (`.modal-desc`, `.warning-box`, `.browser-suggestion`, `.badge`, `.zalo-guide-tip`) và [src/styles/components/common.css](../src/styles/components/common.css#L51-L123) (`.spinner`, `.toast`, `.offline-indicator`) vẫn hardcode màu nền/chữ sáng cũ (`#27ae60`, `#e74c3c`, `#3498db`, `#f39c12`, `#64748b`).

- [x] **[UI-15] Thiếu nhất quán với hệ thiết kế Direction A ("Ấn phẩm yên tĩnh")**
  - [src/features/games/games.ts](../src/features/games/games.ts#L225) ghi đè SVG Lucide trong `#modalIcon` của `games.html` bằng emoji `🎉` ([dòng 225](../src/features/games/games.ts#L225)) và `💔` ([dòng 249](../src/features/games/games.ts#L249)); [leaderboard.ts](../src/features/games/leaderboard.ts#L274) và [game4-farm.ts](../src/features/games/game4-farm.ts#L49-L52) còn dùng emoji (`🏆`, `🥇`, `🔒`, `📜`, `🎓`, `🌱`, `🌽`).
  - [games.css](../src/styles/features/games.css#L232) (`.game-active-topbar`, `.game-stage`, `.memory-card-front`, `.game-modal-card`, `.modal-btn.btn-gold`) và [modal.css](../src/styles/components/modal.css#L79) (`.install-modal-card`) vẫn dùng bo góc `16px–24px` và gradient nặng thay vì chuẩn phẳng `4px–8px` trong [tokens.css](../src/styles/tokens.css#L46-L50).

- [x] **[UI-16] Nút nổi `#installButton` hiện thừa/sai ngữ cảnh trên Desktop & dễ che nội dung trên Mobile 360px**
  - [src/styles/components/modal.css](../src/styles/components/modal.css#L21-L23) ép `opacity: 1 !important` khiến nút "Cài App" luôn hiển thị cả trên trình duyệt không hỗ trợ cài PWA (`beforeinstallprompt` chưa phát). Khi bấm trên Desktop/Firefox, [install-modal.ts](../src/components/install-modal/install-modal.ts#L81) mở modal cảnh báo *"Mở bằng trình duyệt ngoài"* vốn dành cho Zalo/Facebook In-App Browser.
  - Ở màn hình di động `360px`, bộ nút nổi góc trái (`#installButton`), góc phải (`#chatToggleBtn`) và thanh đáy `64px` cùng nổi khiến vùng nhìn hiệu dụng bị thu hẹp và dễ đè nút CTA ở cuối trang.

- [x] **[UI-17] Tinh chỉnh Responsive màn hình hẹp (360px–480px) & bảo vệ dấu thanh Xơ Đăng**
  - [src/styles/features/home.css](../src/styles/features/home.css#L584-L605): `.highlight-word`, `.word-text`, `.pronunciation` chưa áp `line-height: 1.6` tối thiểu theo quy chuẩn [dark-mode-tokens.md](./design/dark-mode-tokens.md#L78), dễ gây chạm/cắt dấu ghép Xơ Đăng (`ơ̆`, `ư̆`, `ê̆`) trên thiết bị có DPI thấp.
  - [src/styles/features/home.css](../src/styles/features/home.css#L443): `.suggest-chip` đặt `min-height: 36px` (thấp hơn mức tối thiểu `44px` ở các thành phần khác).
  - [src/styles/features/games.css](../src/styles/features/games.css#L324): `.memory-grid` khóa `repeat(4, 1fr)` trên màn hình 360px làm thẻ quá hẹp cho từ ghép dài; `.farm-answers-grid` ([dòng 513](../src/styles/features/games.css#L513)) khóa 2 cột; `.cert-modal-actions` ([dòng 760](../src/styles/features/games.css#L760)) không có `flex-wrap: wrap`; [`.leaderboard-item`](../src/styles/features/games.css#L783) dễ tràn ngang khi tên người chơi dài.
  - [src/styles/features/chat.css](../src/styles/features/chat.css#L325-L326): `.chat-window` trên mobile dùng `width: 100vw; max-width: 100vw;` thay vì `100%`, dễ gây lệch khung/tràn ngang trên trình duyệt desktop giả lập có scrollbar.

- [x] **[UI-18] Thiếu quy tắc `@media (prefers-reduced-motion: reduce)`**
  - Chưa có CSS tôn trọng cài đặt giảm chuyển động của hệ điều hành cho `.speech-button.recording`, `.spin`, `.container.active`, `.typing-dot`, `.flashcard`, `.memory-card-inner`, `.game-modal-card` và `.cert-modal-card`.

---

## P3 — Low / Polish (CLS nhẹ, Dọn dẹp CSS & Tiện ích thao tác)

- [x] **[UI-19] Layout Shift (CLS) giữa skeleton khởi động và giao diện Trang chủ thật**
  - [index.html](../index.html#L252-L257) dựng trước khối 4 thẻ `.dictionary-stats` cao lớn trước khi JS mount, nhưng `home.html` đã chuyển sang thanh tóm tắt 1 dòng `.lexical-summary-bar`, gây giật bố cục khi [main.ts](../src/main.ts#L158) thay nội dung `#app`.

- [x] **[UI-20] Selector CSS chết & định nghĩa trùng lặp cần dọn gọn**
  - [src/styles/layout.css](../src/styles/layout.css#L398-L401): `.mobile-bottom-nav .menu-link i` và `:416-418` (`.mobile-bottom-nav .menu-link.active i`) không còn tác dụng vì đã đổi toàn bộ sang `<svg class="lucide-icon">`.
  - [src/styles/features/games.css](../src/styles/features/games.css#L1035): `body.dark-mode .game-hub-header h2` (`h1` mới đúng) và `.game-icon-btn` ([dòng 1052](../src/styles/features/games.css#L1052)) không tồn tại trong DOM hiện hành.
  - [src/styles/components/common.css](../src/styles/components/common.css#L193-L220) trùng định nghĩa `.chat-widget-container` / `.chat-toggle-btn` với `chat.css`; [src/styles/features/home.css](../src/styles/features/home.css#L479-L486) trùng `@keyframes spin` với [common.css](../src/styles/components/common.css#L58-L61).

- [x] **[UI-21] Nhãn kết quả tìm kiếm luôn ghi `"Từ chính xác"` dù là tìm gần đúng / không dấu**
  - [src/features/home/word-card.ts](../src/features/home/word-card.ts#L29-L31) hardcode `matchTypeSpan.textContent = 'Từ chính xác'` bất kể từ điển khớp theo `matchType` (`exact` / `partial` / `fuzzy` hoặc không dấu), và dòng `:114` viết chưa chuẩn chính tả `"Xơ đăng"`.

- [x] **[UI-22] Thiếu một số tiện ích nhỏ giúp thao tác hằng ngày thuận tiện hơn**
  - Ô tìm kiếm `#word` ([home.html](../src/features/home/home.html#L19)) chưa có nút xóa nhanh (`Clear`) khi người dùng muốn tra từ khác trên điện thoại.
  - Trang Đóng góp ([contribute.html](../src/features/contribute/contribute.html#L19-L22)) chưa có bàn phím ký tự đặc biệt Xơ Đăng (`Ŏ Ŭ Ĕ Ă Â Õ Ě Ĭ Ơ̆ Ư̆`) như Trang chủ để gõ từ mới thuận tiện.
  - Nút `#darkModeToggle` ([navbar.ts](../src/components/navbar/navbar.ts#L47)) luôn hiển thị nhãn tĩnh `"Giao diện"`, chưa phản ánh trạng thái hiện tại (`"Chế độ sáng"` / `"Chế độ tối"`).
  - Game Hub ([games.html](../src/features/games/games.html#L15)) hiển thị tên mặc định `"Người học Xơ Đăng"` nhưng chưa có nút đổi tên người chơi trực tiếp để cá nhân hóa Bảng vàng & Giấy chứng nhận.

---

## Chuyên sâu — Khu vực Trò Chơi Học Tập (Màn hình nhỏ, Chưa khoa học, Thiết kế chưa đẹp)

- [x] **[GAME-01] Màn hình chơi bị bóp nhỏ qua 4 lớp khung lồng nhau & Canvas cố định `600×420` (không HiDPI)**
  - Sân chơi bị lồng qua 4 lớp co hẹp liên tiếp: [`.container`](../src/styles/layout.css#L154-L168) (`padding: 2.2rem 2.4rem`, `width: 95%`) → [`.game-active-view`](../src/styles/features/games.css#L219-L223) (`max-width: 900px; padding: 1rem`) → [`.game-stage`](../src/styles/features/games.css#L302-L312) (`padding: 1.5rem`) → Canvas cứng `width="600" height="420"` ([game2-catcher.ts](../src/features/games/game2-catcher.ts#L121), [game3-shooter.ts](../src/features/games/game3-shooter.ts#L115)), [`.memory-grid`](../src/styles/features/games.css#L327) (`max-width: 580px`), [`.farm-grid`](../src/styles/features/games.css#L437) (`max-width: 480px`).
  - Không có chế độ tập trung (Theater / Focus Mode): Navbar, Footer, nút nổi Chat và Cài App vẫn chiếm diện tích màn hình khi đang chơi.
  - Canvas không scale theo `window.devicePixelRatio` và kích thước vùng chứa thực tế, làm mờ nét khi phóng và thu chữ `12–13px` xuống chỉ ~`5–6px` trên điện thoại `360px`.

- [x] **[GAME-02] Bỏ phí hoàn toàn kho phát âm bản địa (`driveId`) & phiên âm (`pronunciation`)**
  - Interface `GameWordPair` và ánh xạ từ điển tại [game-data.ts](../src/features/games/game-data.ts#L5-L18) ([dòng 70-76](../src/features/games/game-data.ts#L70-L76)) bỏ qua cả `driveId` lẫn `pronunciation` dù PWA đã có sẵn `1,261` tệp âm thanh offline.
  - Người học chỉ nhìn mặt chữ để đoán mà không được nghe giọng đọc chuẩn bản địa để ghi nhớ theo kênh Nghe–Nhìn (Dual-Coding).

- [x] **[GAME-03] Thiếu phản hồi sửa lỗi tức thì & tổng kết từ sai cuối màn**
  - [game4-farm.ts](../src/features/games/game4-farm.ts#L192-L195): chọn sai chỉ ẩn modal im lặng, không báo đáp án đúng là gì.
  - [game2-catcher.ts](../src/features/games/game2-catcher.ts#L218-L243) & [game3-shooter.ts](../src/features/games/game3-shooter.ts#L161-L172): hứng/bắn sai hoặc để rơi từ đúng chỉ trừ 1 tim, không hiển thị ngắn cặp đúng (`Xơ Đăng = Tiếng Việt`).
  - [game1-memory.ts](../src/features/games/game1-memory.ts#L53-L78): mặt sau thẻ không phân biệt nhãn ngôn ngữ (`Xơ Đăng` vs `Tiếng Việt`) và không phát âm thanh khi ghép đúng cặp.
  - Modal kết thúc ở [games.html](../src/features/games/games.html#L170-L210) chỉ báo điểm/nút chơi tiếp, không tổng kết danh sách từ vừa học và từ hay sai để ôn tập ngay.

- [x] **[GAME-04] Chọn từ vựng & phân tầng độ khó chưa khoa học, thiếu bước làm quen trước khi chơi**
  - [game-data.ts](../src/features/games/game-data.ts#L119) & [dòng 139](../src/features/games/game-data.ts#L139) cắt tuần tự theo chỉ số mảng (`offset`), không phân độ dài từ / chủ đề tăng dần theo Level; [game4-farm.ts](../src/features/games/game4-farm.ts#L131) bốc ngẫu nhiên hoàn toàn nên dễ lặp câu vừa hỏi ngay trước đó.
  - Thiếu thẻ "Xem nhanh 4–5 từ màn này (có nút Nghe)" trước khi bước vào game tốc độ (Game 2, Game 3), khiến người mới học buộc phải đoán mò và mất tim oan.

- [x] **[GAME-05] Thiếu HUD tiến độ, nút Tạm dừng (Pause) & trùng lặp cơ chế giữa Game 2 và Game 3**
  - Thanh đầu màn chơi [games.html](../src/features/games/games.html#L138-L163) chỉ có Level / Điểm / Tim; thiếu tiến độ câu (`2/5`), chuỗi trả lời đúng (Combo), nút nghe lại phát âm từ mục tiêu và nút Tạm dừng.
  - Game 2 và Game 3 cùng cơ chế thả 3 đáp án từ trên xuống trên cùng kích thước Canvas `600×420`, chỉ khác nhau ở kéo giỏ vs nhấp chuột vào bóng.

- [x] **[GAME-06] Tràn chữ trên Canvas & mục tiêu chạm quá nhỏ trên điện thoại**
  - [game3-shooter.ts](../src/features/games/game3-shooter.ts#L90) ([dòng 250-266](../src/features/games/game3-shooter.ts#L250-L266)): vẽ mục tiêu tròn bán kính cố định `34px` (`68px` đường kính); các từ tiếng Việt có `>= 8` ký tự hoặc ghép nhiều tiếng bị tràn khỏi hình tròn, và trên màn hình `360px` thu nhỏ chỉ còn ~`38px` (khó bấm trúng bằng ngón tay).
  - [game2-catcher.ts](../src/features/games/game2-catcher.ts#L97): tính chiều rộng hộp chữ bằng phép nhân thô `opt.text.length * 11` thay vì `ctx.measureText()`, dễ cắt/lệch chữ tiếng Việt có dấu rộng; khi kéo chạm trực tiếp giỏ ở đáy dễ bị ngón tay che khuất.

- [x] **[GAME-07] Thẩm mỹ 4 màn chơi lỗi thời, rời rạc & lạc tông với Direction A / Dark Mode**
  - [game2-catcher.ts](../src/features/games/game2-catcher.ts#L286-L322) (nền xanh nhạt `#f0f9ff` + khối xanh dương `#3b82f6` + emoji `🧺`), [game3-shooter.ts](../src/features/games/game3-shooter.ts#L242-L266) (nền tối cứng `#0f172a` + thanh tường `#78350f`), [`.memory-card-front`](../src/styles/features/games.css#L365) (gradient xanh dương chói) và [`.farm-plot`](../src/styles/features/games.css#L440-L465) (vàng nét đứt + emoji) dùng bảng màu tách rời hoàn toàn khỏi hệ thiết kế **Warm Paper / Graphite** (`#1e7e48` / `#34d399`).

### Hướng thiết kế lại khoa học cho Khu vực Trò chơi (Game Arena Redesign)
1. **Theater / Focus Arena Mode (Giải phóng không gian chơi):**
   - Khi kích hoạt `#gameActiveView`, bật chế độ tập trung toàn khung: mở rộng `.game-active-view` tới `max-width: 1120px` và `.game-stage` chiếm trọn `min-height: clamp(460px, 72dvh, 720px)` (trên mobile không bị khung `.container` bóp padding, tạm ẩn Footer và nút nổi Chat/Cài App trong lúc chơi).
   - Canvas tự đo kích thước container thực tế (`ResizeObserver`) và nhân `window.devicePixelRatio` để sắc nét trên mọi màn hình; thay vòng tròn `34px` bằng thẻ viên thuốc tự động co giãn theo `ctx.measureText()` (`min-height >= 48px`).
2. **Vòng lặp học khoa học 3 nhịp (`Làm quen → Thực hành → Ôn từ sai`):**
   - Mở rộng `GameWordPair` trong `game-data.ts` để giữ lại `driveId` và `pronunciation`, sắp độ khó từ ngắn (`1–2` âm tiết) đến cụm từ dài theo Level và loại trừ câu trùng lặp.
   - Thêm bước **Xem nhanh từ vựng màn chơi** (4–5 cặp từ kèm nút nghe audio, bấm "Bắt đầu ngay") trước các màn tốc độ.
   - Gắn nút **Nghe phát âm** trực tiếp trên thanh câu hỏi mục tiêu, phát âm chuẩn khi ghép đúng ở Game 1, hiển thị banner **Sửa lỗi tức thì** (`Xơ Đăng = Việt`) khi chọn sai, thêm HUD **Tiến độ (`3/5`) + Combo + Tạm dừng**, và bảng **Tổng kết từ vừa học / Ôn lại từ sai** trong modal kết thúc màn.
3. **Đồng bộ thẩm mỹ Direction A & phân hóa cơ chế chơi:**
   - Thống nhất palette Warm Paper (Light) / Graphite (Dark) đọc trực tiếp từ CSS custom properties cho cả Canvas lẫn thẻ DOM, thay toàn bộ emoji trong UI bằng Lucide SVGs.
   - Phân hóa Game 3 thành trò chơi **Nghe – Nhắm chọn mục tiêu theo nhịp rõ ràng** hoặc **Bắn thẻ từ kích thước rộng theo hàng ngang** thay vì 3 hình tròn `34px` rơi trùng lặp Game 2.

---

## Chuyên sâu — CSS, Tương phản, Z-Index, Font Xơ Đăng, Responsive & PWA (`VIS-01` → `VIS-18`)

- [x] **[VIS-01] [P0] `.chat-header h3` kế thừa màu tiêu đề từ `base.css` → trượt tương phản nặng ở cả Dark (`1.57:1`) lẫn Light (`3.44:1`)**
  - [src/styles/base.css](../src/styles/base.css#L37-L41) đặt `h1, h2, h3, h4 { color: var(--text-primary); }`; [src/styles/features/chat.css](../src/styles/features/chat.css#L85-L102) và [dòng 353-355](../src/styles/features/chat.css#L353-L355) chỉ đặt `color` trên `.chat-header` mà bỏ sót `.chat-header h3` ([chat.html](../src/features/chat/chat.html#L9-L10)). Kết quả: Dark Mode `#e8e8ea` trên `#34d399` (`1.57:1`, gần như tàng hình); Light Mode `#1c1917` trên `#1e7e48` (`3.44:1`, trượt AA `4.5:1`).
  - *Hướng sửa:* Thêm `color: inherit;` (hoặc `var(--text-inverse)`) vào `.chat-header h3`.

- [x] **[VIS-02] [P0] Dark Mode: Nút & huy hiệu dùng `--color-danger` (`#f87171`) giữ chữ trắng (`2.77:1`, trượt WCAG AA)**
  - [src/styles/tokens.css](../src/styles/tokens.css#L122) đổi `--color-danger` sang `#f87171` ở Dark Mode nhưng `.record-btn` ([contribute.css](../src/styles/features/contribute.css#L144-L151)), `.queue-play-btn.playing` ([dòng 378-382](../src/styles/features/contribute.css#L378-L382)), `.modal-btn.btn-danger` ([dòng 462-469](../src/styles/features/contribute.css#L462-L469)) và `.chat-toggle-btn .notification-badge` ([chat.css](../src/styles/features/chat.css#L43-L58)) vẫn đặt `color: #ffffff` (`2.77:1`); `.record-btn:hover` còn nhảy đột ngột về màu tối cứng `#b91c1c`.
  - *Hướng sửa:* Dùng `color: var(--text-inverse)` (`#0f1012` trên `#f87171` = `7.65:1` AAA) hoặc tách biến `--color-danger-bg` (`#dc2626`) cho nút nền đỏ chữ trắng.

- [x] **[VIS-03] [P0] Hai thanh tiến độ Flashcard hoàn toàn không có CSS (`height: 0px`, tàng hình)**
  - [src/features/quiz/quiz.html](../src/features/quiz/quiz.html#L6-L8), [dòng 72](../src/features/quiz/quiz.html#L72), [dòng 133-135](../src/features/quiz/quiz.html#L133-L135) và [src/features/quiz/flashcard.ts](../src/features/quiz/flashcard.ts#L138-L154) dựng `.study-progress-bar`, `.study-progress-fill` (`#studyProgressFill`, `#studySessionProgressFill`) và `.card-completion-effect`, nhưng toàn bộ [flashcard.css](../src/styles/features/flashcard.css) & [quiz.css](../src/styles/features/quiz.css) không có rule CSS nào cho 3 class này. Người học không thấy thanh tiến độ hướng tới mốc mở khóa 70%.
  - *Hướng sửa:* Định nghĩa `.study-progress-bar` (`height: 8px; background: var(--border-subtle); border-radius: var(--radius-full); overflow: hidden;`) và `.study-progress-fill` (`height: 100%; background: var(--color-primary);`) trong `flashcard.css`.

- [x] **[VIS-04] [P0] Thiếu `viewport-fit=cover` vô hiệu hóa `env(safe-area-inset-*)` & `black-translucent` đè `.navbar` trên iOS PWA**
  - [index.html](../index.html#L5) thiếu `viewport-fit=cover` trong `<meta name="viewport">`, làm `env(safe-area-inset-bottom)` tại [layout.css](../src/styles/layout.css#L370-L375) luôn trả `0px`. Đồng thời [index.html](../index.html#L38) đặt `apple-mobile-web-app-status-bar-style="black-translucent"` nhưng `.navbar` ([layout.css](../src/styles/layout.css#L6-L29)) thiếu `padding-top: env(safe-area-inset-top, 0px)`, khiến chữ đồng hồ/sóng trắng của iOS bị lẫn trên nền `.navbar` trắng và đụng logo/nút Giao diện dưới Notch/Dynamic Island.
  - *Hướng sửa:* Thêm `viewport-fit=cover`, đổi status-bar-style sang `default` (hoặc đồng bộ theo theme), và thêm `padding-top: env(safe-area-inset-top, 0px)` cho `.navbar`.

- [x] **[VIS-05] [P0] `#offlineIndicator` ẩn vẫn chặn click tại `z-index: 9999`, đọc nhầm `"Ngoại tuyến"`, banner kết nối lại bị tàng hình (`opacity: 0`) & đè nút đóng Chat**
  - [src/main.ts](../src/main.ts#L111-L122) gắn sẵn `#offlineIndicator` trong DOM; [src/styles/components/common.css](../src/styles/components/common.css#L102-L151) chỉ ẩn bằng `opacity: 0` (thiếu `pointer-events: none; visibility: hidden;`), giữ hộp vô hình `z-index: 9999` đè lên cạnh dưới `#darkModeToggle` và luôn để Screen Reader đọc `"Ngoại tuyến"` ngay cả khi đang online.
  - Khi có mạng trở lại, [src/components/offline-indicator.ts](../src/components/offline-indicator.ts#L11-L19) thêm `.online` nhưng lại xóa `.show`; trong khi `.offline-indicator.online` ([common.css](../src/styles/components/common.css#L121-L128)) không đặt `opacity: 1; transform: translateY(0)` nên thông báo `"Đã kết nối lại"` tàng hình hoàn toàn; rớt/có mạng liên tục còn làm rò `setTimeout` không hủy, và khi offline `z-index: 9999` che mất `#closeChatBtn` của `.chat-window` (`9998`, [chat.css](../src/styles/features/chat.css#L335)).
  - *Hướng sửa:* Đặt `pointer-events: none; visibility: hidden;` mặc định, bật `opacity: 1; visibility: visible; transform: translateY(0);` cho cả `.show` và `.online`, hủy `timeoutId` cũ trước khi tạo timer mới, thêm `role="status" aria-live="polite"` + toggle `aria-hidden`, và hạ `z-index` xuống dưới Modal/Chat.

- [x] **[VIS-06] [P1] Thiếu `color-scheme` & gắn Dark Mode trên `body` thay vì `:root` làm `<select>`, `<audio>`, `<datalist>` và thanh cuộn chói trắng**
  - [src/styles/tokens.css](../src/styles/tokens.css#L1), [dòng 84](../src/styles/tokens.css#L84), [src/styles/base.css](../src/styles/base.css#L7-L23), [src/features/home/home.html](../src/features/home/home.html#L36-L39), [src/features/home/word-card.ts](../src/features/home/word-card.ts#L98-L107), [src/styles/features/home.css](../src/styles/features/home.css#L76-L84), [public/offline.html](../public/offline.html#L250): Không khai báo `color-scheme` ở bất kỳ đâu; kết quả trong Dark Mode trình duyệt vẽ thanh `<audio controls>` nền trắng chói `#f1f3f4`, menu `<select id="direction">` / `<datalist>` sáng trắng, mũi tên `::-webkit-calendar-picker-indicator` màu đen chìm trên `#17181b`, và scrollbar trang giữ màu sáng (scrollbar gốc chỉ nhận `color-scheme` trên `:root`/`html`).
  - *Hướng sửa:* Di chuyển class/token Dark Mode lên `:root.dark-mode` (giữ alias `body.dark-mode` tương thích), khai báo `:root { color-scheme: light; }` & `:root.dark-mode { color-scheme: dark; }`, và thêm `color-scheme: light dark` vào `public/offline.html`.

- [x] **[VIS-07] [P1] Xung đột thang `z-index` toàn cục giữa Navbar, Bottom Nav, Chat, Game Modals & Loading Overlay**
  - [src/components/navbar/navbar.html](../src/components/navbar/navbar.html#L1), [dòng 72](../src/components/navbar/navbar.html#L72) + [layout.css](../src/styles/layout.css#L12-L14), [dòng 369](../src/styles/layout.css#L369): `.mobile-bottom-nav` (`z: 1000`) bị nhốt trong stacking context `z: 100` của `<nav class="navbar">`, thực tế nằm dưới `#installButton` (`999`, [modal.css](../src/styles/components/modal.css#L6)).
  - `#farmQuestionModal` ([games.css](../src/styles/features/games.css#L483)) và `#gameOverModal` ([dòng 545](../src/styles/features/games.css#L545)) đều có `z: 1000` — thấp hơn `.chat-widget-container` / `.chat-window` (`9998`, [common.css](../src/styles/components/common.css#L197), [chat.css](../src/styles/features/chat.css#L12)) nên khung chat đè lên trên modal game.
  - `#deleteAudioConfirmModal` ([contribute.css](../src/styles/features/contribute.css#L401), `9999`) và `.game-modal-overlay` ([games.css](../src/styles/features/games.css#L680), `9999`, mount sau `#app` vào `document.body`) bằng `z-index` với `#loadingOverlay` ([common.css](../src/styles/components/common.css#L37), `9999`, mount sớm ở [main.ts](../src/main.ts#L124)) khiến spinner bị chìm sau modal.
  - *Hướng sửa:* Đưa `.mobile-bottom-nav` ra ngoài `<nav>` và quy chuẩn hệ biến `--z-*` trong `tokens.css` (`nav: 100`, `fab: 200`, `chat: 300`, `offline: 400`, `modal: 1000`, `loading: 1100`, `toast: 1200`).

- [x] **[VIS-08] [P1] Xung đột class CSS giữa các chunk lazy-load & core (`.modal-btn`, `.btn-secondary`, `.step-num`, `.loading`)**
  - `.modal-btn` / `.modal-btn.btn-secondary`: [contribute.css](../src/styles/features/contribute.css#L440-L460) và [games.css](../src/styles/features/games.css#L599-L629), [dòng 653-659](../src/styles/features/games.css#L653-L659) cùng định nghĩa không tiền tố. Mở tab Đóng góp rồi sang Trò chơi làm nút Hủy xóa audio mất viền/bo góc; đi ngược lại làm nút modal Game đổi padding/radius và hover hòa nền.
  - `.step-num`: [modal.css](../src/styles/components/modal.css#L161-L174) (xanh dương `20px`, `margin-right: 10px`) va chạm với [flashcard.css](../src/styles/features/flashcard.css#L193-L205) (`22px`, nền xám), làm `.guide-step` bị lệch `18px` và mở tab Học & Thi xong quay lại modal cài iOS bị đổi màu xám.
  - `.loading`: [home.css](../src/styles/features/home.css#L470-L477) (`display: flex`) import sau [common.css](../src/styles/components/common.css#L19-L25) (`display: none`) trong [index.css](../src/styles/index.css#L4-L6), phá vỡ trạng thái ẩn mặc định của `.loading`.
  - *Hướng sửa:* Đặt tiền tố phạm vi theo feature (`.contribute-modal-btn`, `.game-modal-btn`, `.ios-step-num`, `.guide-step-num`, `.home-loading`) và xóa `.loading` thừa ở `common.css`.

- [x] **[VIS-09] [P1] Dấu thanh Xơ Đăng bị vỡ font do `jakarta.css` thiếu `U+0306` & Service Worker bỏ sót toàn bộ `latin-ext` + weight `500`**
  - `public/fonts/jakarta/jakarta.css` (trước khi thay bằng [be-vietnam-pro.css](../public/fonts/be-vietnam-pro/be-vietnam-pro.css)): Mọi `unicode-range` đều **thiếu `U+0306`** (Combining Breve `̆`) và `U+0302`/`U+030C`/`U+031B` — buộc các ký tự Xơ Đăng cốt lõi `Ơ̆`, `Ư̆`, `ơ̆`, `ư̆`, `ê̆` ([home.html](../src/features/home/home.html#L109-L118)) fallback sang font hệ thống (lệch dấu).
  - Các ký tự dựng sẵn `Ŏ/Ŭ/Ĕ/Ě/Ĭ` nằm riêng trong subset `latin-ext` (`pjs-3/7/11/15.woff2`), nhưng [src/service-worker.ts](../src/service-worker.ts#L6-L19) chỉ precache `pjs-2/4/10/12/14/16.woff2` (`vietnamese` + `latin` ở `400/600/700`), bỏ sót toàn bộ `latin-ext` và toàn bộ weight `500` (`pjs-6/7/8.woff2`), gây `404` và vỡ chữ xen kẽ khi dùng offline.
  - [src/styles/features/home.css](../src/styles/features/home.css#L598) gán `Consolas, monospace` cho `.pronunciation`, bỏ qua `Plus Jakarta Sans`.
  - *Hướng sửa:* Bổ sung subset font có `U+0300–U+036F` (tối thiểu `U+0306/0302/030C/031B`), thêm `pjs-3/6/7/8/11/15.woff2` vào `STATIC_PRECACHE`, và dùng `Plus Jakarta Sans` cho `.pronunciation`.

- [x] **[VIS-10] [P1] `public/offline.html` trượt tương phản Dark Mode (`2.59–2.91:1`), toast `'info'` hiện màu đỏ lỗi, selector icon chết & thiếu A11y**
  - [public/offline.html](../public/offline.html#L250-L292): Dark Mode chỉ dùng `@media (prefers-color-scheme: dark)` (bỏ qua toggle `localStorage` của app), dùng nền Navy cũ `#0f172a`/`#1e293b`, quên override `.offline-status` (`2.91:1`), `.online-status` (`2.59:1`), `.footer a` (`2.88:1`), `.subtitle` (`3.20:1`) và `.spinner`.
  - [public/offline.html](../public/offline.html#L426-L473), [dòng 500-504](../public/offline.html#L500-L504): Lần vào đầu gọi `showNotification('💡 Mẹo: ...', 'info')`, nhưng nhánh ternary `type === 'success' ? '#27ae60' : '#e74c3c'` vẽ toast mẹo thành **nền đỏ lỗi** (`3.82:1`) kèm icon cảnh báo và emoji; mỗi lần gọi còn chèn thêm thẻ `<style>` trùng lặp vào `<head>`.
  - Selector `.features li i` ([dòng 113-116](../public/offline.html#L113-L116), [dòng 284-286](../public/offline.html#L284-L286)) chết do DOM dùng `<svg class="offline-svg-icon">` ([dòng 336-353](../public/offline.html#L336-L353)); dùng `'Segoe UI'` ([dòng 16](../public/offline.html#L16)) thay vì `jakarta.css`; viết sai `"Xơ đăng"` ([dòng 7](../public/offline.html#L7)); thiếu `<main>`, nhảy `<h1>` → `<h3>`, thiếu `type="button"`, `:focus-visible`, `aria-live`, `prefers-reduced-motion`; lặp sự kiện `online` chèn trùng `.spinner` ([dòng 395-398](../public/offline.html#L395-L398)).
  - *Hướng sửa:* Đồng bộ `offline.html` theo Direction A / Graphite + đọc `localStorage` theme, nạp `./fonts/jakarta/jakarta.css`, sửa nhánh `'info'` không chèn `<style>` lặp, đổi selector sang `.features li svg`, bảo vệ tạo spinner và bổ sung semantic A11y.

- [x] **[VIS-11] [P1] Dùng `100vh`/`100vw` gây cắt khung di động & các Modal không cuộn được trên màn hình thấp / xoay ngang / zoom 200%**
  - [chat.css](../src/styles/features/chat.css#L327-L328) dùng `calc(85vh - 64px)` (khi bàn phím ảo hoặc thanh URL bật lên, `.chat-header`/`#closeChatBtn` bị đẩy khuất mép trên).
  - [contribute.css](../src/styles/features/contribute.css#L398-L399), [games.css](../src/styles/features/games.css#L676-L677), [onboarding.css](../src/styles/features/onboarding.css#L7-L8) dùng `width: 100vw; height: 100vh;` (và [base.css](../src/styles/base.css#L17), [games.css](../src/styles/features/games.css#L696) dùng `vh`), gây lệch scrollbar ngang trên desktop.
  - 5 thẻ modal không có `max-height` lẫn `overflow-y: auto`: `.onboarding-card` ([onboarding.css](../src/styles/features/onboarding.css#L26-L39)), `.install-modal-card` ([modal.css](../src/styles/components/modal.css#L74-L86)), `.contribute-modal-card` ([contribute.css](../src/styles/features/contribute.css#L409-L418)), `.farm-modal-card` ([games.css](../src/styles/features/games.css#L486-L494)) và `.game-modal-card` ([dòng 548-557](../src/styles/features/games.css#L548-L557)) — vi phạm WCAG 1.4.10 Reflow khi màn hình ngang `640×360` bị cắt mất nút đóng và nút CTA.
  - *Hướng sửa:* Thay `100vw/100vh` bằng `inset: 0;` và `100dvh` (có fallback `vh`), thêm `max-height: calc(100dvh - 2rem); overflow-y: auto;` cho mọi modal card.

- [x] **[VIS-12] [P1] Tràn ngang trên màn hình hẹp (`320px–360px`) & cắt chữ trên thẻ Flashcard chiều cao cứng**
  - `.flashcard-controls` ([flashcard.css](../src/styles/features/flashcard.css#L125), [dòng 333-376](../src/styles/features/flashcard.css#L333-L376)) không `flex-wrap`, cần tối thiểu `304px+` trong khi chiều rộng lõi còn lại bên trong `.container` ([layout.css](../src/styles/layout.css#L425-L430)) + `.study-interface` (`padding: 1.5rem`) chỉ là `284px` tại `360px` → tràn ngang `20–36px`.
  - `.flashcard-container` khóa cứng `height: 280px` (`250px` trên mobile, [flashcard.css](../src/styles/features/flashcard.css#L212), [dòng 230-296](../src/styles/features/flashcard.css#L230-L296), [dòng 434-436](../src/styles/features/flashcard.css#L434-L436)) không `overflow-y: auto`, làm câu hỏi/đáp án dài chồng lên `.flashcard-number`, `.flashcard-tick` và `.flashcard-instruction`.
  - `.badges-grid-container` (`minmax(260px, 1fr)`, [games.css](../src/styles/features/games.css#L862)) và `.certs-grid` (`minmax(240px, 1fr)`, [dòng 926](../src/styles/features/games.css#L926)) vượt chiều rộng lõi `232–255px` của modal trên `320–360px`; `.search-controls-wrap` ([home.css](../src/styles/features/home.css#L788-L805)) thiếu `flex-wrap: wrap` & `min-width: 0`.
  - *Hướng sửa:* Giảm padding `.study-interface` mobile xuống `1rem`, cho `.flashcard-controls` và `.search-controls-wrap` xuống dòng (`flex-wrap: wrap; min-width: 0`), dùng `min-height` + `overflow-y: auto` trên mặt thẻ Flashcard, đổi grid modal thành `minmax(min(260px, 100%), 1fr)` / `minmax(min(240px, 100%), 1fr)`.

- [x] **[VIS-13] [P1] Trượt tương phản WCAG 2.2 AA ở cả Chế độ Sáng (Light Mode), hai chế độ & Canvas Trò chơi (ngoài `UI-01`)**
  - `.pronunciation` Light Mode ([home.css](../src/styles/features/home.css#L597-L605)): `#c05621` trên `#feebc8` = **`3.90:1`** (cần `4.5:1`).
  - `.toast.*` & `.offline-indicator` cả 2 chế độ ([common.css](../src/styles/components/common.css#L90-L123)): `.success` (`2.87:1`), `.error` (`3.82:1`), `.info` (`3.15:1`), `.offline-indicator` cam (`2.19:1`).
  - Games DOM & Canvas cả 2 chế độ: `.memory-card.matched .memory-card-back` ([games.css](../src/styles/features/games.css#L378-L382), `#fff` trên `#10b981` = **`2.54:1`**), `.modal-btn.btn-gold` ([dòng 766-769](../src/styles/features/games.css#L766-L769), **`2.15–3.19:1`**), `.stat-pill` Light Mode ([dòng 291-292](../src/styles/features/games.css#L291-L292), `#d97706` trên `#fef3c7` = **`2.86:1`**), `.btn-close-modal` ([dòng 733-737](../src/styles/features/games.css#L733-L737), `#9ca3af` trên `#fff` = **`2.54:1`**, trượt UI `3.0:1`), `.status-locked` ([dòng 882-886](../src/styles/features/games.css#L882-L886), [dòng 919-921](../src/styles/features/games.css#L919-L921), **`2.45:1`** trước `opacity: 0.6`), Game 2 Canvas `#fff` trên `#3b82f6` ([game2-catcher.ts](../src/features/games/game2-catcher.ts#L297-L306), **`3.68:1`**), Game 3 Canvas 3/4 màu bóng ([game3-shooter.ts](../src/features/games/game3-shooter.ts#L86), [dòng 261-265](../src/features/games/game3-shooter.ts#L261-L265), **`3.19–4.10:1`**).
  - `--text-tertiary` trên bề mặt nổi ([tokens.css](../src/styles/tokens.css#L19), [dòng 25](../src/styles/tokens.css#L25), [dòng 102-110](../src/styles/tokens.css#L102-L110)): Light `#78716c` trên `#f4f4f0` (`4.35:1`), Dark `#7f838c` trên `#1f2124`/`#27292d` (`4.25:1` / `3.84:1`); `.ios-text-simulate` Dark Mode ([modal.css](../src/styles/components/modal.css#L188-L192), `#3b82f6` trên `#1f2124` = **`4.39:1`**).
  - *Hướng sửa:* Chuẩn hóa bảng cặp màu đạt `>= 4.5:1` (`#9c4215` trên `#feebc8`, `#92400e` trên `#fef3c7`, chữ `#0f1012` trên vàng/ngọc/cam, `#6b6661` / `#8b909a` cho `--text-tertiary`, `#475569` cho nút đóng/khóa, `var(--color-tertiary)` cho `.ios-text-simulate`).

- [x] **[VIS-14] [P2] Rule toàn cục `.lucide-icon { width: 1.25rem; height: 1.25rem; }` ghi đè mọi kích thước SVG (`14/16/24/32/36px`)**
  - [src/styles/base.css](../src/styles/base.css#L100-L102) khóa cứng `width`/`height: 1.25rem` (`20px`), thắng thuộc tính trình bày `width`/`height` của SVG do [src/utils/icons.ts](../src/utils/icons.ts#L69-L72) sinh ra và trong [games.html](../src/features/games/games.html#L19), [dòng 50](../src/features/games/games.html#L50), [dòng 151](../src/features/games/games.html#L151), [dòng 173](../src/features/games/games.html#L173), [game1-memory.ts](../src/features/games/game1-memory.ts#L66). Toàn bộ icon lớn (`32–36px`) và nhỏ (`14–16px`) bị ép về đúng `20×20px`.
  - *Hướng sửa:* Xóa `width`/`height` cố định khỏi `.lucide-icon` (hoặc đặt trong `:where(.lucide-icon)` / xuất kích thước bằng `style` trong `getLucideIcon`).

- [x] **[VIS-15] [P2] Lỗi specificity chặn `:hover` trong Dark Mode, viền/nền tàng hình, thiếu phân lớp độ nổi & `line-height < 1.6` ở Flashcard/Quiz**
  - Specificity `body.dark-mode .game-btn-back` / `.farm-answer-btn` / `.modal-btn.btn-secondary` / `.leaderboard-item` ([games.css](../src/styles/features/games.css#L255-L257), [dòng 528-532](../src/styles/features/games.css#L528-L532), [dòng 653-659](../src/styles/features/games.css#L653-L659), [dòng 794-797](../src/styles/features/games.css#L794-L797), [dòng 1079-1083](../src/styles/features/games.css#L1079-L1083)) thắng các rule `:hover` không có tiền tố `body.dark-mode`, làm mất hoàn toàn hiệu ứng hover trong Dark Mode.
  - `.modal-score-wrap` (`rgba(0,0,0,0.04)`, [dòng 577](../src/styles/features/games.css#L577)) & `.modal-btn.btn-outline` (`rgba(0,0,0,0.15)`, [dòng 633](../src/styles/features/games.css#L633)) chìm trên `#17181b`; `.game-modal-card { text-align: center }` ([dòng 552](../src/styles/features/games.css#L552)) tràn sang bảng xếp hạng & huy hiệu.
  - `rgba` màu sáng cứng ở [flashcard.css](../src/styles/features/flashcard.css#L87-L91) và [quiz.css](../src/styles/features/quiz.css#L47), [dòng 103](../src/styles/features/quiz.css#L103), [dòng 295-301](../src/styles/features/quiz.css#L295-L301) (câu sai dùng màu cam `--color-secondary` thay `--color-danger`); mặt sau Flashcard ([flashcard.css](../src/styles/features/flashcard.css#L230-L255)) & ô tìm kiếm ([home.css](../src/styles/features/home.css#L30), [dòng 65](../src/styles/features/home.css#L65), [dòng 149](../src/styles/features/home.css#L149)) chưa dùng `--bg-surface-elevated` theo [dark-mode-tokens.json](./design/dark-mode-tokens.json#L282-L300).
  - `line-height` dưới `1.6` trên chữ Xơ Đăng tại [flashcard.css](../src/styles/features/flashcard.css#L268-L285) (`1.3–1.4`) và [quiz.css](../src/styles/features/quiz.css#L69), [dòng 117](../src/styles/features/quiz.css#L117) (`1.4–1.5`), vi phạm quy tắc bảo vệ dấu ghép tại [dark-mode-tokens.md](./design/dark-mode-tokens.md#L78).
  - *Hướng sửa:* Thay `rgba` cứng bằng semantic tokens, bổ sung `body.dark-mode ...:hover`, đặt `text-align: left` cho hàng danh sách modal, phân lớp `--bg-surface-elevated`, và nâng `line-height: 1.6`.

- [x] **[VIS-16] [P2] Lỗi chuẩn PWA trong `public/manifest.json` (khóa dọc, gộp `"any maskable"`, thiếu icon sẵn có & shortcut icons)**
  - [public/manifest.json](../public/manifest.json#L7-L62): `"orientation": "portrait"` ([dòng 9](../public/manifest.json#L9)) khóa xoay ngang (vi phạm WCAG 1.3.4 trên tablet/foldable); `icon-192x192.png` gộp `"purpose": "any maskable"` ([dòng 40](../public/manifest.json#L40)) gây cảnh báo Lighthouse/cắt mép Android; `icon-512x512.png` thiếu bản `maskable`; 3 icon đã có sẵn trong `public/icons/` (`icon-152x152`, `icon-256x256`, `icon-384x384`) chưa được khai báo; `shortcuts[]` thiếu `icons` & thiếu `#game`/`#contribute`; `"background_color": "#ffffff"` lệch `#fbfbfa` và thiếu `id`/`scope`.
  - *Hướng sửa:* Bỏ khóa `"portrait"`, tách riêng icon `"any"` và `"maskable"` (192 & 512), khai báo đủ icon `152/256/384`, thêm `icons` vào `shortcuts`, và đồng bộ `background_color: "#fbfbfa"`.

- [x] **[VIS-17] [P2] Lệch chuẩn Design Token giữa tài liệu & mã nguồn, biến `--text-inverse` không được dùng (`0` tham chiếu)**
  - [src/styles/tokens.css](../src/styles/tokens.css#L26), [dòng 111](../src/styles/tokens.css#L111) định nghĩa `--text-inverse` (`#ffffff` / `#0f1012`) nhưng không một file CSS nào sử dụng (toàn bộ hardcode `#ffffff`); còn dư biến mồ côi `--bg-card-dark` ([dòng 105](../src/styles/tokens.css#L105)), thiếu `--color-danger-light`/`--color-warning-light`/`--bg-overlay`, và `--border-default` đặt `0.14` ([dòng 115](../src/styles/tokens.css#L115)) lệch `0.12` ở [dark-mode-tokens.json](./design/dark-mode-tokens.json#L176).
  - [docs/design/tokens.json](./design/tokens.json#L79-L102) dùng bảng màu Zinc (`#18181B`/`#4ADE80`) mâu thuẫn với Graphite trong `tokens.css` & [dark-mode-tokens.json](./design/dark-mode-tokens.json#L145-L272); [docs/design/dark-mode-themes.css](./design/dark-mode-themes.css#L10-L94) dùng quy ước selector/tên biến khác hoàn toàn (`:root[data-theme="graphite"]`).
  - *Hướng sửa:* Chốt `src/styles/tokens.css` làm nguồn chuẩn duy nhất, đồng bộ tài liệu thiết kế, bổ sung semantic subtle/overlay tokens, xóa `--bg-card-dark` và thay toàn bộ chữ trắng trên nền màu nhấn bằng `var(--text-inverse)`.

- [x] **[VIS-18] [P3] Keyframe `modalPop` gãy (sai tên), lặp block Dark Mode trong `games.css`, ép font-weight `800`/italic giả & thừa `@font-face` `cyrillic-ext`**
  - [games.css](../src/styles/features/games.css#L556) gọi `animation: modalPop 0.3s ease;` nhưng `@keyframes` tại [dòng 710](../src/styles/features/games.css#L710) tên là `modalPopIn`; [dòng 1043-1094](../src/styles/features/games.css#L1043-L1094) lặp lại các rule `body.dark-mode` đã khai báo ở [dòng 642-659](../src/styles/features/games.css#L642-L659).
  - Bộ font cũ `public/fonts/jakarta/jakarta.css` (đã thay bằng [be-vietnam-pro.css](../public/fonts/be-vietnam-pro/be-vietnam-pro.css)) chỉ có weight `400/500/600/700` thẳng đứng (và chứa 4 block `cyrillic-ext` không dùng), trong khi [flashcard.css](../src/styles/features/flashcard.css#L273), [quiz.css](../src/styles/features/quiz.css#L232), [games.css](../src/styles/features/games.css#L566), [dòng 806](../src/styles/features/games.css#L806), [dòng 844](../src/styles/features/games.css#L844) gọi `font-weight: 800` và [modal.css](../src/styles/components/modal.css#L246) gọi `font-style: italic` (trình duyệt phải giả lập nét đậm/nghiêng).
  - *Hướng sửa:* Đổi `modalPop` → `modalPopIn`, gộp block Dark Mode trùng, giới hạn `font-weight` tối đa `700` và bỏ 4 block `cyrillic-ext` thừa.

---

## Chuyên sâu — Luồng tương tác, Trạng thái, Routing, STT, Quiz, Đóng góp & Chat (`UX-01` → `UX-31`)

- [x] **[UX-01] [P0] Tab "Thu hàng loạt" (Đóng góp) hoàn toàn không có ô nhập từ Việt/Xơ Đăng hay đổi tên bản thu**
  - [src/features/contribute/contribute.html](../src/features/contribute/contribute.html#L77-L113) và [src/features/contribute/contribute.ts](../src/features/contribute/contribute.ts#L153-L163), [dòng 183-225](../src/features/contribute/contribute.ts#L183-L225), [dòng 465-474](../src/features/contribute/contribute.ts#L465-L474): Không có ô nhập nội dung từ; mọi bản thu bị gán tên tĩnh `Thu_am_${index}_${time}` hiển thị dưới dạng `div` không sửa được và gửi lên máy chủ với `readingContent: item.name`, khiến đội ngũ biên tập không thể biết người đóng góp đã đọc từ nào.
  - *Hướng sửa:* Thêm ô nhập/sửa nhãn từ tiếng Việt & Xơ Đăng ngay cho từng mục trong hàng đợi (hoặc ô nhập trước khi thu) và bắt buộc có nhãn hợp lệ trước khi gửi.

- [x] **[UX-02] [P1] Lazy-load các tab (`#quiz`, `#game`, `#contribute`) không có phản hồi tải & nuốt lỗi im lặng khi mất mạng**
  - [src/main.ts](../src/main.ts#L36-L76), [dòng 166-177](../src/main.ts#L166-L177): `void ensureRouteLoaded(route).then(...)` không bật trạng thái tải và không có `.catch()`. Khi mạng chậm, nhấn tab mới không có phản hồi; khi offline chưa cache chunk, `import()` reject không xử lý khiến nút điều hướng như bị liệt.
  - *Hướng sửa:* Bật trạng thái loading nhẹ trong vùng section, cập nhật active nav sớm và thêm `.catch()` hiện toast lỗi kèm nút thử lại.

- [x] **[UX-03] [P1] `bootstrap()` chặn router & nút Chat bởi `await initHome()`, nháy `#home` khi mở deep-link và chồng Onboarding lên `#loadingOverlay`**
  - [src/main.ts](../src/main.ts#L160-L182), [dòng 195](../src/main.ts#L195), [src/features/home/home.html](../src/features/home/home.html#L1), [src/shared/constants/config.ts](../src/shared/constants/config.ts#L15): `initOnboarding()` (`z: 10000`) chạy trước `await initHome()` (`#loadingOverlay` `z: 9999`, timeout `8000ms`), còn `router.init()` và nút Chat gắn sau cùng; `#home` lại gán cứng `.active`. Người dùng mới bị hai lớp nền tối chồng nhau, mạng chậm làm liệt menu & chat tới 8 giây, và link trực tiếp `#quiz`/`#game` bị nháy Trang chủ trước khi nhảy tab.
  - *Hướng sửa:* Đăng ký `router.init()` và nút Chat trước khi chờ fetch từ điển; không gán cứng `.active` lên `#home` khi hash trỏ route khác; chỉ mở Onboarding sau khi tải khởi động xong.

- [x] **[UX-04] [P1] Audio thẻ từ phát chồng giọng lên nhau & tiếp tục phát nền khi chuyển sang tab khác**
  - [src/features/home/word-card.ts](../src/features/home/word-card.ts#L98-L107) & [src/features/home/home.ts](../src/features/home/home.ts#L354-L360): Mỗi `<audio>` chạy độc lập và `tab:change` chỉ dừng STT mà không tạm dừng `<audio>` trong `#result`, khiến tiếng đọc tiếp tục phát nền (thậm chí lọt vào micro khi sang tab Đóng góp).
  - *Hướng sửa:* Ủy quyền sự kiện `play` (capture) trên `#result` để pause các `<audio>` khác, và pause toàn bộ `#result audio` khi `tab:change` rời `home`.

- [x] **[UX-05] [P1] Trình phát `<audio>` chỉ có nguồn WebM, không có xử lý `onerror` khi Safari cũ không hỗ trợ hoặc file chưa cache offline**
  - [src/services/offline-sync.service.ts](../src/services/offline-sync.service.ts#L21), [src/features/home/word-card.ts](../src/features/home/word-card.ts#L104-L110), [src/service-worker.ts](../src/service-worker.ts#L112): Chỉ đặt `<source type="audio/webm">`, khi offline chưa tải gói audio SW trả `404` nhưng UI chỉ hiện trình phát `0:00` chết im lặng.
  - *Hướng sửa:* Bắt `onerror` trên `<audio>`/`<source>` để hiện ghi chú ngắn gọn (hướng dẫn tải Gói phát âm offline hoặc báo định dạng chưa hỗ trợ trên Safari cũ) và cung cấp fallback M4A/MP3 nếu có.

- [x] **[UX-06] [P1] Nhận dạng giọng nói 3 tầng (STT) luôn nhận diện tiếng Việt (`vi-VN`) kể cả khi đang chọn chiều `Xơ Đăng → Việt`**
  - [src/features/home/home.ts](../src/features/home/home.ts#L254-L283), [src/services/speech.service.ts](../src/services/speech.service.ts#L150), [src/services/whisper-stt.worker.ts](../src/services/whisper-stt.worker.ts#L129): `vi-VN` / `'vietnamese'` bị cố định, nhưng kết quả vẫn gọi `executeSearch(recognizedText, directionSelect.value)`. Ở chiều `ethnic_to_viet`, giọng đọc tiếng Việt bị tra vào cột Xơ Đăng nên luôn trả 0 kết quả.
  - *Hướng sửa:* Tự động chuyển `#direction` về `viet_to_ethnic` kèm toast thông báo ngắn khi bật STT tiếng Việt, hoặc cảnh báo rõ ràng khi đang ở chiều `ethnic_to_viet`.

- [x] **[UX-07] [P1] Lỗi race-condition bất đồng bộ của STT 3 tầng: rò micro khi đổi tab, tải Whisper 45MB tự bật mic bất ngờ & kẹt cờ `STT_WASM_READY`**
  - [src/features/home/home.ts](../src/features/home/home.ts#L244-L306), [dòng 328-360](../src/features/home/home.ts#L328-L360), [src/services/speech.service.ts](../src/services/speech.service.ts#L126-L136), [dòng 234-254](../src/services/speech.service.ts#L234-L254), [src/services/whisper-stt.service.ts](../src/services/whisper-stt.service.ts#L99), [dòng 256-274](../src/services/whisper-stt.service.ts#L256-L274):
    - `activeSpeechHandle` chỉ gán *sau* `await`, bấm đúp nhanh mở chồng nhiều phiên; dừng thu WASM xóa `activeSpeechHandle = null` ngay trong lúc Whisper vẫn đang giải mã.
    - `WasmCaptureSession.cancel()` không bao giờ được gọi: đổi tab gọi `stop()`, kích hoạt phiên dịch Whisper và bắn toast ở tab khác; dừng giữa lúc xin quyền mic rò stream ([speech.service.ts](../src/services/speech.service.ts#L240-L248)).
    - Đóng `#voiceFallbackPanel` hoặc rời Home trong lúc tải model 45MB không hủy lệnh tự gọi `runSpeechCapture(true)`, làm bật mic đột ngột trên tab khác.
    - `setWasmSpeechCached(false)` là dead code: nếu trình duyệt (iOS ITP) xóa cache model nhưng `localStorage['xedang_stt_wasm_ready'] === 'true'`, người dùng offline bị kẹt lỗi WASM liên tiếp mà không fallback về bảng bàn phím.
  - *Hướng sửa:* Dùng state machine rõ ràng (`idle | starting | listening | processing`), gán handle hủy được trước khi `await`, gọi `cancel()` trên `tab:change`, chặn tự bật mic nếu panel đóng/rời Home, và xóa cờ `STT_WASM_READY` + mở bảng bàn phím khi tải WASM offline thất bại.

- [x] **[UX-08] [P1] Nút `#retryQuizBtn` ("Làm lại bài") đẩy người dùng về Flashcard thay vì làm lại trắc nghiệm**
  - [src/features/quiz/quiz.ts](../src/features/quiz/quiz.ts#L312-L317) & [src/features/quiz/quiz.html](../src/features/quiz/quiz.html#L241-L247): Gọi `selectTopic(currentTopic)` vốn mở `#studyInterface` (Flashcard) thay vì bắt đầu lượt thi mới trên `#quizInterface`.
  - *Hướng sửa:* Tách hàm `startQuizForCurrentTopic()` từ `#startQuizBtn` ([quiz.ts](../src/features/quiz/quiz.ts#L153-L168)) và gọi trực tiếp từ `#retryQuizBtn`.

- [x] **[UX-09] [P1] Đổi tab giữa lúc làm bài thi làm đồng hồ `#quizTimer` đóng băng vĩnh viễn khi quay lại**
  - [src/features/quiz/quiz.ts](../src/features/quiz/quiz.ts#L54-L62), [dòng 171-189](../src/features/quiz/quiz.ts#L171-L189): `tab:change` gọi `stopTimer()` khi rời `'quiz'`, nhưng khi quay lại `'quiz'` không hề chạy tiếp bộ đếm dù bài thi đang mở.
  - *Hướng sửa:* Lưu cờ `isQuizActive` và tiếp tục chạy `setInterval` (không reset `timeElapsedSeconds`) khi quay lại tab `'quiz'`.

- [x] **[UX-10] [P1] Lỗi parser & sư phạm Quiz/Flashcard: giữ đáp án rỗng, không kiểm tra biên `correctAnswer`, không trộn A/B/C/D, còn emoji trong kết quả & sai hướng dẫn mặt thẻ**
  - [src/services/quiz.service.ts](../src/services/quiz.service.ts#L34-L47), [dòng 67-78](../src/services/quiz.service.ts#L67-L78), [dòng 113-125](../src/services/quiz.service.ts#L113-L125): `parseQuizRows` điền chuỗi rỗng `''` cho đáp án thiếu mà không lọc và không kiểm tra `1 <= correctAnswer <= validOptions.length`; không xáo trộn thứ tự A/B/C/D qua các lần thi lại (học vẹt vị trí); `evaluateQuiz` còn hardcode emoji (`🎉`, `👏`, `👍`, `📚`).
  - [src/features/quiz/quiz.html](../src/features/quiz/quiz.html#L56) hướng dẫn *"lật xem đáp án tiếng Việt"* nhưng dữ liệu [snapshot-fallback.ts](../src/shared/data/snapshot-fallback.ts#L40-L45) có đáp án là tiếng Xơ Đăng (`Bơ rơ ha`, `Đak`), và [flashcard.ts](../src/features/quiz/flashcard.ts#L32-L33) nhân đôi `question` vào `fullQuestion`.
  - *Hướng sửa:* Lọc đáp án rỗng + kiểm tra biên `correctAnswer`, xáo trộn đáp án kèm ánh xạ lại chỉ số đúng, bỏ emoji ở `evaluateQuiz`, và sửa hướng dẫn mặt thẻ cho khớp chiều câu hỏi/đáp án thực tế.

- [x] **[UX-11] [P1] Gửi hàng loạt thất bại một phần vẫn giữ nguyên file đã gửi thành công (trùng lặp khi thử lại) & báo thất bại `0/N` bằng toast `'info'`**
  - [src/features/contribute/contribute.ts](../src/features/contribute/contribute.ts#L464-L488): Chỉ gọi `batchQueue.clear()` khi `successCount === items.length`; ngược lại giữ nguyên toàn bộ hàng đợi (thử lại sẽ upload trùng các file đã gửi) và hiển thị `'Đã gửi 0/5 file thành công.'` dưới dạng toast `'info'` màu xanh dương trung tính.
  - *Hướng sửa:* Gỡ từng mục ngay sau khi gửi thành công, chỉ giữ mục lỗi trong hàng đợi, và dùng toast `'error'` khi `successCount === 0` hoặc `'warning'` khi thành công một phần.

- [x] **[UX-12] [P1] Đóng góp qua Apps Script dùng `mode: 'no-cors'` báo thành công giả, xóa trắng biểu mẫu, thiếu hàng đợi offline như đã hứa & timeout 8s quá ngắn cho file 10MB**
  - [src/services/offline-sync.service.ts](../src/services/offline-sync.service.ts#L93), [dòng 139-152](../src/services/offline-sync.service.ts#L139-L152), [src/shared/constants/config.ts](../src/shared/constants/config.ts#L15), [src/features/contribute/contribute.ts](../src/features/contribute/contribute.ts#L11), [dòng 367-380](../src/features/contribute/contribute.ts#L367-L380), [src/features/onboarding/onboarding.html](../src/features/onboarding/onboarding.html#L87): `no-cors` trả phản hồi mờ (không phát hiện HTTP 4xx/5xx hay lỗi quota), vẫn báo thành công và xóa sạch dữ liệu người dùng; `REQUEST_TIMEOUT_MS = 8000` dễ ngắt file Base64 ~13.3MB trên mạng di động; không có outbox offline dù `onboarding.html:87` cam kết *"Tự động đồng bộ khi có kết nối trở lại"*.
  - *Hướng sửa:* Kiểm tra `navigator.onLine` (lưu outbox IndexedDB hoặc chỉnh nội dung Onboarding trung thực), tăng timeout tải lên lên `30–60s`, và định tuyến qua endpoint hỗ trợ CORS (hoặc thông báo rõ tính chất gửi bất đồng bộ khi dùng `no-cors`).

- [x] **[UX-13] [P1] 6 lỗi máy trạng thái âm thanh trong trang Đóng góp (xóa vẫn phát, không chọn lại được cùng file, chuyển tab lưu nhầm clip dở, phát chồng thu, thiếu `onerror`, kẹt modal xóa)**
  - [src/features/contribute/contribute.ts](../src/features/contribute/contribute.ts#L72-L108), [dòng 259](../src/features/contribute/contribute.ts#L259), [dòng 275-314](../src/features/contribute/contribute.ts#L275-L314), [dòng 331-342](../src/features/contribute/contribute.ts#L331-L342), [dòng 440-446](../src/features/contribute/contribute.ts#L440-L446), [dòng 491-495](../src/features/contribute/contribute.ts#L491-L495), [src/features/contribute/recorder.ts](../src/features/contribute/recorder.ts#L46-L66), [src/features/contribute/batch-queue.ts](../src/features/contribute/batch-queue.ts#L70-L84):
    1. `clearSingleAudio()` hủy URL nhưng không `pause()` `singleAudioPlayer` → bản thu đã xóa vẫn tiếp tục phát không có nút dừng.
    2. Không reset `audioFileInput.value = ''` → chọn lại cùng tên file không kích hoạt sự kiện `change`.
    3. Chuyển tab Đơn↔Hàng loạt hoặc rời `#contribute` gọi `recorder.stop()`, khiến callback bất đồng bộ `onstop` vẫn lưu bản thu bị cắt ngang.
    4. Bấm phát lại không dừng phiên thu đang chạy (lọt tiếng loa vào mic); tải file mới không pause bản phát cũ.
    5. `singleAudioPlayer` và `BatchQueueManager.audioPlayer` không xử lý `onerror` (ví dụ `.ogg`/`.flac` trên Safari dù nằm trong `ALLOWED_AUDIO_EXTENSIONS`).
    6. `tab:change` không gọi `closeDeleteConfirmation()` → quay lại tab thấy modal cũ còn treo.
  - *Hướng sửa:* Pause + reset `audioFileInput.value = ''` trong `clearSingleAudio()`, thêm `recorder.cancel()` bỏ qua `onstop` khi chuyển tab, dừng thu trước khi phát, gắn `onerror` báo toast và đóng modal xóa khi `tab:change`.

- [x] **[UX-14] [P1] Race condition nút `#chatToggleBtn` lúc mới tải bỏ mất ý định mở Chat & `{ once: true }` làm liệt nút Chat nếu tải offline lỗi**
  - [src/main.ts](../src/main.ts#L78-L103), [dòng 179-193](../src/main.ts#L179-L193): Nếu `requestIdleCallback` đang chạy `ensureChatLoaded(false)` mà người dùng bấm nút Chat, lệnh `ensureChatLoaded(true)` gặp `if (chatLoadPromise) { await chatLoadPromise; return; }` và vứt bỏ `autoOpen = true`. Nếu tải chunk lỗi do offline, `{ once: true }` đã gỡ vĩnh viễn listener nên nút Chat liệt hoàn toàn tới khi F5.
  - *Hướng sửa:* Dùng cờ module `pendingChatAutoOpen` nâng lên `true` khi người dùng bấm, bỏ `{ once: true }` (hoặc gắn lại khi `.catch()` kèm toast).

- [x] **[UX-15] [P1] Chat `loadFaqs()` xóa sạch tin nhắn người dùng gửi sớm; sheet mobile che mất chuyển tab; trùng `#typingIndicator` & thiếu Chat ARIA**
  - [src/features/chat/chat.ts](../src/features/chat/chat.ts#L37-L46), [dòng 73-75](../src/features/chat/chat.ts#L73-L75), [dòng 102-120](../src/features/chat/chat.ts#L102-L120), [dòng 151-178](../src/features/chat/chat.ts#L151-L178), [dòng 193](../src/features/chat/chat.ts#L193), [src/features/chat/chat.html](../src/features/chat/chat.html#L2), [dòng 8](../src/features/chat/chat.html#L8), [dòng 18](../src/features/chat/chat.html#L18): Mở Chat khi `loadFaqs()` chưa xong cho phép gửi tin vào mảng `faqs = []` (trả lỗi), sau đó `displayWelcome()` gọi `chatMessages.replaceChildren()` xóa trắng tin vừa gửi; gửi nhanh tạo trùng `id="typingIndicator"`; không đóng khi bấm `Escape` hay `tab:change` trên mobile; thiếu `aria-expanded`/`aria-controls` trên `#chatToggleBtn` và `role="log" aria-live="polite"` trên `#chatMessages`.
  - *Hướng sửa:* Hiện câu chào/FAQ mặc định ngay hoặc khóa input trong lúc nạp mà không xóa tin nhắn người dùng, thay ID trùng bằng class, đóng chat khi `Escape`/`tab:change` mobile, bổ sung ARIA.

- [x] **[UX-16] [P1] `aria-labelledby` trỏ vào tiêu đề đang `display: none` trong Install Modal & Onboarding Modal**
  - [src/components/install-modal/install-modal.html](../src/components/install-modal/install-modal.html#L1), [dòng 10-12](../src/components/install-modal/install-modal.html#L10-L12), [dòng 38-40](../src/components/install-modal/install-modal.html#L38-L40), [install-modal.ts](../src/components/install-modal/install-modal.ts#L20-L31): Luôn trỏ `#installModalHeading` dù đang mở `#inAppBrowserWarning` (`#warningTitle`).
  - [src/features/onboarding/onboarding.html](../src/features/onboarding/onboarding.html#L1), [dòng 12](../src/features/onboarding/onboarding.html#L12), [dòng 18](../src/features/onboarding/onboarding.html#L18), [onboarding.css](../src/styles/features/onboarding.css#L73-L79): Luôn trỏ `#onboardingHeading` ở Slide 1 dù Slide 2–6 đang hiển thị.
  - *Hướng sửa:* Cập nhật động `aria-labelledby` theo nhánh modal / slide đang mở.

- [x] **[UX-17] [P2] Chuyển tab không cuộn trang về đầu (`window.scrollTo`)**
  - [src/components/navbar/navbar.ts](../src/components/navbar/navbar.ts#L6-L25): `showSection()` đổi `.active` nhưng giữ nguyên vị trí cuộn cũ, khiến mở tab mới bị nằm giữa trang hoặc sát Footer.
  - *Hướng sửa:* Gọi `window.scrollTo({ top: 0, behavior: 'instant' })` khi chuyển sang `sectionId` khác.

- [x] **[UX-18] [P2] Hash router nhạy chữ hoa/query (`#Quiz`, `#home?q=...`) & bấm lại tab hiện tại bắn trùng `tab:change` gây gọi đua `loadQuizData()`**
  - [src/router.ts](../src/router.ts#L19-L32) & [src/features/quiz/quiz.ts](../src/features/quiz/quiz.ts#L54-L62): Không `.split('?')[0].toLowerCase()`; bấm lại cùng tab vẫn gọi `handleRoute()` → `showSection()`; `quiz.ts` không có cờ `isLoadingQuiz` chống tải song song.
  - *Hướng sửa:* Chuẩn hóa hash, bỏ qua `showSection()` khi tab đã active, và thêm cờ `isLoadingQuiz`.

- [x] **[UX-19] [P2] Đồng bộ Gói phát âm Offline: bấm lúc mất mạng vẫn chạy 1.261 request với thanh 100% giả, lỗi giữ thanh treo, thành công ẩn luôn cả thẻ**
  - [src/features/home/home.ts](../src/features/home/home.ts#L362-L435), [src/features/home/home.html](../src/features/home/home.html#L207-L215), [src/services/offline-sync.service.ts](../src/services/offline-sync.service.ts#L376-L416): Không kiểm tra `navigator.onLine`; nhánh `catch` vẫn tăng `loaded++` làm thanh chạy tới `1261/1261 (100%)` rồi báo `Thử tải lại (0/1261)` mà không ẩn `#download-progress-container`; khi xong lại đặt `card.style.display = 'none'` giấu mất thông báo thành công; thiếu cập nhật `aria-valuenow`.
  - *Hướng sửa:* Chặn sớm khi `!navigator.onLine`, ẩn progress bar khi lỗi, giữ huy hiệu trạng thái gọn "Đã sẵn sàng offline (N/N)" thay vì ẩn cả thẻ, và cập nhật `aria-valuenow`.

- [x] **[UX-20] [P2] Các chip gợi ý tìm kiếm nhanh luôn giữ tiếng Việt khi đang ở chiều `Xơ Đăng → Việt`**
  - [src/features/home/home.html](../src/features/home/home.html#L146-L152) & [src/features/home/home.ts](../src/features/home/home.ts#L195-L203): Chip gán cứng `data-query="xin chào"`, `"rừng"`, `"mẹ"`... nên bấm ở chiều `ethnic_to_viet` luôn không ra kết quả.
  - *Hướng sửa:* Đổi danh sách chip sang từ Xơ Đăng mẫu (`bơ rơ ha`, `bri`, `hnam`, `đak`) khi đổi `#direction`, hoặc tự đổi chiều tương ứng khi bấm chip.

- [x] **[UX-21] [P2] Xóa ô tìm kiếm còn 1 ký tự giữ nguyên kết quả cũ & `<datalist>` gốc phá vỡ gợi ý không dấu**
  - [src/features/home/home.ts](../src/features/home/home.ts#L70-L83), [dòng 160-170](../src/features/home/home.ts#L160-L170), [src/services/dictionary.service.ts](../src/services/dictionary.service.ts#L171-L181): `trimmed.length === 1` lọt khe giữa `=== 0` và `>= 2`; `<datalist>` lọc phân biệt dấu nên tự ẩn kết quả không dấu (`"rung"` → `"rừng"`); nhánh rỗng thiếu `Set` khử trùng.
  - *Hướng sửa:* Tìm/xóa kết quả ngay ở độ dài 1, khử trùng bằng `Set`, và thay `<datalist>` bằng ARIA combobox listbox nhẹ hỗ trợ khớp không dấu.

- [x] **[UX-22] [P2] `#voiceFallbackPanel` treo lại qua tìm kiếm/đổi tab; `#error` không bao giờ tắt & thiếu nút Thử lại; chuỗi `'null'` bị in thẳng ra ví dụ**
  - [src/features/home/home.ts](../src/features/home/home.ts#L96), [dòng 108-111](../src/features/home/home.ts#L108-L111), [dòng 149-152](../src/features/home/home.ts#L149-L152), [dòng 196-203](../src/features/home/home.ts#L196-L203), [dòng 354-360](../src/features/home/home.ts#L354-L360) & [src/features/home/word-card.ts](../src/features/home/word-card.ts#L123), [dòng 135](../src/features/home/word-card.ts#L135), [dòng 152](../src/features/home/word-card.ts#L152).
  - *Hướng sửa:* Ẩn `#voiceFallbackPanel` khi submit/bấm chip/đổi tab; thêm nút Thử lại vào `#error` và ẩn khi nạp xong; lọc giá trị `'null'`/`'undefined'` trong `word-card.ts`.

- [x] **[UX-23] [P2] `sheets.service.ts` fallback offline không kiểm tra `navigator.onLine`, bỏ qua `memoryCache` & không kiểm tra hạn `timestamp`**
  - [src/services/sheets.service.ts](../src/services/sheets.service.ts#L24-L33), [dòng 84-96](../src/services/sheets.service.ts#L84-L96), [dòng 101-126](../src/services/sheets.service.ts#L101-L126): Mạng yếu/offline vẫn chờ timeout lặp lại qua các tab và cache `localStorage` cũ tồn tại vĩnh viễn không hết hạn dù app đã phát hành snapshot mới.
  - *Hướng sửa:* Trả nhanh cache/snapshot khi `!navigator.onLine`, nạp vào `memoryCache` với TTL ngắn, và kiểm tra phiên bản/tuổi `PersistedSheetCache.timestamp`.

- [x] **[UX-24] [P2] Đồng hồ Quiz không đặt lại `00:00` trước nhịp giây đầu tiên & không hiển thị thời gian hoàn thành ở trang kết quả**
  - [src/features/quiz/quiz.ts](../src/features/quiz/quiz.ts#L171-L182), [dòng 262-310](../src/features/quiz/quiz.ts#L262-L310): Lượt thi mới hiển thị thời gian lượt cũ (vd `01:45`) trong 1 giây đầu rồi nhảy sang `00:01`.
  - *Hướng sửa:* Gán ngay `quizTimer.textContent = '00:00'` trong `startTimer()` và hiển thị tổng thời gian ở `#quizResult`.

- [x] **[UX-25] [P2] Thanh tiến độ tổng thể bị ghi đè bởi tiến độ 1 chủ đề, không tính lại khi đổi chủ đề & lưu theo chỉ số mảng dễ vượt `100%`**
  - [src/features/quiz/quiz.html](../src/features/quiz/quiz.html#L6-L8), [dòng 133-135](../src/features/quiz/quiz.html#L133-L135), [src/features/quiz/flashcard.ts](../src/features/quiz/flashcard.ts#L30-L43), [dòng 138-155](../src/features/quiz/flashcard.ts#L138-L155), [src/features/quiz/quiz.ts](../src/features/quiz/quiz.ts#L319-L327): `#studyProgressFill` ("tổng thể") bị ghi đè theo 1 chủ đề; lưu tiến độ bằng chỉ số `0, 1, 2` thay vì `q.id` nên khi Sheet bớt/đổi hàng, tỷ lệ có thể vượt `100%` (vd `"150% đã học"`).
  - *Hướng sửa:* Lưu `studiedCards` theo `q.id` (lọc giao với danh sách hiện hành), tính `#studyProgressFill` trên toàn bộ chủ đề và đồng bộ khi nhấn `#newTopicBtn`.

- [x] **[UX-26] [P2] Bấm Tiếp/Trước khi thẻ Flashcard đang lật làm lộ đáp án thẻ kế tiếp trong ~250ms**
  - [src/features/quiz/flashcard.ts](../src/features/quiz/flashcard.ts#L117-L133) & [src/styles/features/flashcard.css](../src/styles/features/flashcard.css#L221): Ghi đè `#flashcardAnswer` ngay lập tức trước khi hiệu ứng lật `0.5s` xoay qua góc `90deg`.
  - *Hướng sửa:* Bỏ transition khi reset `.flipped` lúc chuyển thẻ, hoặc chỉ cập nhật mặt sau sau khi thẻ xoay khuất `90deg`.

- [x] **[UX-27] [P2] Bấm chọn đáp án Quiz hủy DOM làm rơi focus; nút "Nộp bài" bị disable không chỉ câu bỏ sót; lỗi tải để màn trắng không có nút Thử lại**
  - [src/features/quiz/quiz.ts](../src/features/quiz/quiz.ts#L71-L76), [dòng 218-221](../src/features/quiz/quiz.ts#L218-L221), [dòng 230](../src/features/quiz/quiz.ts#L230), [dòng 252-256](../src/features/quiz/quiz.ts#L252-L256): `displayQuestion()` gọi `optionsContainer.replaceChildren()` hủy luôn nút vừa bấm; `submitQuizBtn.disabled = userAnswers.includes(null)` làm toast nhắc nhở tại dòng 254 không bao giờ chạy; lỗi `loadQuizData()` để trống `#studyQuizTopicsGrid`.
  - *Hướng sửa:* Toggle `.selected` / `aria-checked` tại chỗ không xây lại DOM; hiển thị bộ đếm số câu đã chọn (`3/5`) hoặc nhảy tới câu chưa làm khi bấm Nộp; dựng trạng thái lỗi có nút Thử lại trong `#studyQuizTopicsGrid`.

- [x] **[UX-28] [P2] Trang Đóng góp thiếu đồng hồ/giới hạn thời lượng thu âm, gắn cứng đuôi `.webm` trên Safari/iOS & thiếu khóa chống gửi đúp**
  - [src/features/contribute/contribute.ts](../src/features/contribute/contribute.ts#L110-L164), [dòng 350-387](../src/features/contribute/contribute.ts#L350-L387), [dòng 453-489](../src/features/contribute/contribute.ts#L453-L489), [contribute.html](../src/features/contribute/contribute.html#L13-L22), [dòng 68](../src/features/contribute/contribute.html#L68), [dòng 107](../src/features/contribute/contribute.html#L107), [recorder.ts](../src/features/contribute/recorder.ts#L10): Không có bộ đếm `MM:SS`, không chặn dung lượng blob thu trực tiếp (`MAX_AUDIO_FILE_SIZE` chỉ kiểm tra lúc tải file), gắn cứng `.webm` dù Safari ghi `audio/mp4`, `#singleTab` là `<div>` không submit bằng `Enter`, thiếu `maxlength`/focus ô lỗi và không disable nút gửi khi đang upload.
  - *Hướng sửa:* Thêm bộ đếm + giới hạn thời lượng (vd 60s) + kiểm tra kích thước sau khi dừng, lấy phần mở rộng từ `blob.type`, bọc `<form>`, thêm `maxlength` và disable nút gửi trong lúc request.

- [x] **[UX-29] [P2] Không có nút mở lại Hướng dẫn (Onboarding) sau khi đóng & vuốt dọc chéo tay vô tình chuyển slide**
  - [src/features/onboarding/onboarding.ts](../src/features/onboarding/onboarding.ts#L47-L67), [dòng 153-155](../src/features/onboarding/onboarding.ts#L153-L155): `openOnboarding()` được export nhưng không nơi nào gọi; xử lý swipe chỉ kiểm tra `Math.abs(diffX) > 50` mà không so với `Math.abs(diffY)`.
  - *Hướng sửa:* Thêm nút "Hướng dẫn" ở Navbar/Footer gọi `openOnboarding()`, và chỉ nhận swipe khi `Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)`.

- [x] **[UX-30] [P2] Nút `#installButton` giữ trạng thái cũ sau khi từ chối cài (bấm lại mở nhầm cảnh báo In-App Browser) & thiếu sự kiện `appinstalled`**
  - [src/components/install-modal/install-modal.ts](../src/components/install-modal/install-modal.ts#L49-L83): Sau khi người dùng hủy `deferredPrompt`, biến về `null` nhưng nút vẫn hiện; bấm lần 2 rơi vào `openInstallModal('warning')` báo nhầm Chrome là trình duyệt Zalo/Facebook.
  - *Hướng sửa:* Lắng nghe `appinstalled` để ẩn `#installButton` và xử lý riêng trạng thái sau khi hủy prompt.

- [x] **[UX-31] [P3] Toast luôn tự biến mất sau đúng `3s`, không có nút đóng/dừng khi hover & thiếu `max-width` trên mobile**
  - [src/components/toast.ts](../src/components/toast.ts#L40-L46) & [src/styles/components/common.css](../src/styles/components/common.css#L70-L83): Các thông báo hướng dẫn/lỗi dài 70+ ký tự tắt quá nhanh trước khi đọc xong và dễ tràn ngang trên màn hình `360px`.
  - *Hướng sửa:* Tăng thời gian cho lỗi/cảnh báo (`4.5–5s`), tạm dừng timer khi hover/focus, cho chạm/nút đóng và giới hạn `max-width: min(360px, calc(100vw - 32px))`.

---

## Chuyên sâu — Cơ chế Trò chơi, Ngữ liệu, Audio SFX, Chứng nhận & Bảng vàng (`GM-01` → `GM-19`)

- [x] **[GM-01] [P0] Mâu thuẫn ngữ liệu nghiêm trọng — đảo ngược nghĩa "Bố / Mẹ" & 8 cặp từ trái ngược giữa `BASELINE_GAME_VOCAB` và `snapshotFallback.dictionary`**
  - [src/features/games/game-data.ts](../src/features/games/game-data.ts#L20-L51), [dòng 62-83](../src/features/games/game-data.ts#L62-L83) đối chiếu [src/shared/data/snapshot-fallback.ts](../src/shared/data/snapshot-fallback.ts#L17-L46):
    - **Bố:** `Bá` (`game-data.ts:32`) ≠ **`mê`** (`snapshot-fallback.ts:24`, quiz dòng 41).
    - **Mẹ:** **`Mế`** (`game-data.ts:31`) ≠ `mẹ` (`snapshot-fallback.ts:25` — giữ nguyên chữ tiếng Việt!) → **`mê`/`Mế` bị đảo ngược giữa Bố và Mẹ!**
    - 6 mâu thuẫn khác: Cơm (`Pơur` ≠ `pơ ro`), Uống (`Ngôi` ≠ `ngôm`), Con trâu (`Kơpô` ≠ `kơ pau`), Con bò (`Rơkô` ≠ `rơ pu`), Mặt trời (`Măt hơjan` ≠ `măt hơ ri`), Mặt trăng (`Khey` ≠ `khế`).
    - Thêm nữa, `game-data.ts:77` đòi `dictMapped.length >= BASELINE_GAME_VOCAB.length` (`20 >= 30` là `false`), nên khi offline/fallback Game luôn bỏ qua `snapshotFallback.dictionary` để dùng bộ từ mâu thuẫn kia.
  - *Hướng sửa:* Chuẩn hóa về 1 kho ngữ liệu Xơ Đăng đã kiểm chứng thống nhất với Google Sheet chính, và hạ ngưỡng dùng từ điển trong `getAllGameVocab()` xuống `>= 4` mục hợp lệ.

- [x] **[GM-02] [P0] Game 2 (`Game2Catcher`): Các khối từ rơi chồng ngang lên nhau khiến không thể hứng từ đúng mà không mất tim**
  - [src/features/games/game2-catcher.ts](../src/features/games/game2-catcher.ts#L38), [dòng 93-111](../src/features/games/game2-catcher.ts#L93-L111), [dòng 197-231](../src/features/games/game2-catcher.ts#L197-L231): Giỏ rộng `90px`, khoảng chia cột `150px` nhưng chiều rộng hộp `Math.max(80, len * 11)` cộng rung ngang `±20px` và độ cao `startY` gần ngang nhau (`-20` → `-80px`). Với từ 8+ ký tự, khe hở chỉ còn `22px` (`< 90px` giỏ); với cụm từ 13+ ký tự các hộp đè nhau `30–60px`, khiến hứng đúng chắc chắn chạm hitbox từ sai và `break;` (dòng 230) hủy luôn điểm hứng đúng trong khung hình đó.
  - *Hướng sửa:* Chia 3 làn tách biệt có khoảng hở tối thiểu `>= basketWidth + 16px`, lệch độ cao `startY` rõ rệt theo làn (`idx * 90px`), và đo chiều rộng chuẩn bằng `ctx.measureText()`.

- [x] **[GM-03] [P1] Điểm cộng dồn bị reset về `0` mỗi khi bấm qua màn tiếp theo (`#btnNextLevel`)**
  - [src/features/games/games.ts](../src/features/games/games.ts#L77-L85), [dòng 141-156](../src/features/games/games.ts#L141-L156), [dòng 205-233](../src/features/games/games.ts#L205-L233), [games.html](../src/features/games/games.html#L180-L181): `launchGame()` đặt `currentScore = 0` và khởi tạo game mới với `this.score = 0` dù modal và chứng nhận ghi `"Tổng điểm"`. Qua Level 2, 3 làm mất sạch điểm các màn trước trên `bestScore` và Giấy chứng nhận.
  - *Hướng sửa:* Truyền điểm tích lũy phiên (`carryScore`) khi gọi `launchGame()` từ `#btnNextLevel` (chỉ reset `0` khi chơi lại từ đầu/đổi game).

- [x] **[GM-04] [P1] Game 2 & Game 3: Mất tim im lặng, đứng chờ 6–8 giây vô ích khi lỡ từ đúng & hitbox tường Game 3 lệch `63px`**
  - [src/features/games/game2-catcher.ts](../src/features/games/game2-catcher.ts#L192-L195), [dòng 233-244](../src/features/games/game2-catcher.ts#L233-L244) & [src/features/games/game3-shooter.ts](../src/features/games/game3-shooter.ts#L217-L233), [dòng 245-248](../src/features/games/game3-shooter.ts#L245-L248):
    - Để lọt từ đúng trừ tim mà không phát `soundEffects.wrong()`; cả 2 game bắt chờ toàn bộ đáp án sai rơi hết (`length === 0`) mới thả câu mới (~6–8 giây chờ chết ở Game 3 Level 1).
    - Game 3 vẽ tường ở `y = h - 35` (`385px`) nhưng kiểm tra chạm bằng `t.y - t.radius >= h - 40` (`t.y >= 414`, đáy bóng tụt quá tường `63px` ra ngoài Canvas mới trừ tim).
    - `game2-catcher.ts` không cập nhật `lastSpawnTime` khi sinh chữ nên lần hồi sinh đầu trễ `0ms`.
  - *Hướng sửa:* Sửa điều kiện chạm tường Game 3 thành `t.y + t.radius >= h - 35`, phát `soundEffects.wrong()` khi lỡ, dọn ngay đáp án sai sau banner sửa lỗi ngắn và cập nhật `lastSpawnTime`.

- [x] **[GM-05] [P1] Game 3 (`Game3Shooter`): Các mục tiêu bay chồng che nhau & cướp cú bắn; bấm khoảng trống kêu `shoot()` không có phản hồi thị giác**
  - [src/features/games/game3-shooter.ts](../src/features/games/game3-shooter.ts#L89-L105), [dòng 129-176](../src/features/games/game3-shooter.ts#L129-L176), [dòng 204-215](../src/features/games/game3-shooter.ts#L204-L215), [dòng 250-266](../src/features/games/game3-shooter.ts#L250-L266): Mục tiêu có `vx` ngẫu nhiên chỉ bật khỏi mép Canvas, không tránh nhau → bóng sai trôi đè lên bóng đúng và cướp click (`handleShoot` duyệt ngược từ cuối mảng); click khoảng trống phát tiếng bíp nhưng không vẽ hiệu ứng bắn.
  - *Hướng sửa:* Tách làn hoặc xử lý va chạm đẩy nhẹ giữa các mục tiêu, vẽ vòng hiệu ứng bắn/trúng/trượt ngắn, và chỉ phát `shoot()` khi trượt để tránh chồng SFX.

- [x] **[GM-06] [P1] Game 4 (`Game4Farm`): Modal câu hỏi bị nhốt không thể đóng, thiếu câu hỏi (8 câu cho 12 chặng) & không tăng độ khó theo Level**
  - [src/features/games/game4-farm.ts](../src/features/games/game4-farm.ts#L46-L56), [dòng 75-103](../src/features/games/game4-farm.ts#L75-L103), [dòng 158-196](../src/features/games/game4-farm.ts#L158-L196): `#farmQuestionModal` không có nút Đóng/Hủy và không đóng khi click nền tối; `totalPlots = 4 × 3 chặng = 12` câu nhưng chỉ lấy 8 câu (ép lặp `>= 4` câu/màn) và `totalPlots` không tăng theo Level; dòng 97 kiểm tra truthy `if (answerBtn.dataset.answer)` thay vì `!== undefined`.
  - *Hướng sửa:* Thêm nút đóng + click backdrop, lấy đủ `>= totalPlots * 3` câu qua hàng đợi không lặp, tăng dần số ô đất (`4 → 6 → 8`) hoặc thêm giới hạn sai theo Level, và kiểm tra `!== undefined`.

- [x] **[GM-07] [P1] `getMemoryCardPairs` crash `TypeError` khi từ vựng rỗng, không kiểm duyệt `GAME_OFFLINE_DATA` & thẻ trùng nghĩa bị tính sai oan**
  - [src/features/games/game-data.ts](../src/features/games/game-data.ts#L62-L83), [dòng 137-149](../src/features/games/game-data.ts#L137-L149) & [src/features/games/game1-memory.ts](../src/features/games/game1-memory.ts#L121): Thiếu kiểm tra `vocab.length === 0` (`offset = NaN` gây `TypeError`); `getAllGameVocab()` tin mù `STORAGE_KEYS.GAME_OFFLINE_DATA` không kiểm tra schema; so khớp cứng theo `pairId` làm 2 cặp có chữ trùng nhau (do wrap modulo hoặc đồng nghĩa trong từ điển) bị báo sai dù mặt chữ khớp 100%.
  - *Hướng sửa:* Kiểm tra schema & tối thiểu `Math.max(4, pairCount)` mục trong `getAllGameVocab()`, chặn `vocab.length === 0`, và khử trùng theo cả `ethnic` lẫn `viet` đã chuẩn hóa trong `getMemoryCardPairs()`.

- [x] **[GM-08] [P1] Game 1 (`Game1Memory`): `aria-label="Thẻ số N"` cố định che mất chữ mặt ngửa với Screen Reader**
  - [src/features/games/game1-memory.ts](../src/features/games/game1-memory.ts#L54-L60), [dòng 112-125](../src/features/games/game1-memory.ts#L112-L125), [dòng 149-151](../src/features/games/game1-memory.ts#L149-L151): `aria-label` ghi đè nội dung con `<span>` và không bao giờ cập nhật khi `.flipped`/`.matched`, khiến người dùng khiếm thị chỉ nghe `"Thẻ số 3"` ngay cả khi thẻ đã lật mở.
  - *Hướng sửa:* Cập nhật động `aria-label` kèm chữ + ngôn ngữ + trạng thái (`đã lật` / `đã ghép`), cập nhật `aria-pressed` và thông báo kết quả ghép qua `aria-live="polite"`.

- [x] **[GM-09] [P1] Thua cuộc (Game Over) vẫn cấp "GIẤY CHỨNG NHẬN HOÀN THÀNH / XUẤT SẮC" & bấm lại lưu nhân bản vô hạn**
  - [src/features/games/games.ts](../src/features/games/games.ts#L87-L97), [dòng 254](../src/features/games/games.ts#L254) & [src/features/games/certificate.ts](../src/features/games/certificate.ts#L93), [dòng 116](../src/features/games/certificate.ts#L116), [dòng 193](../src/features/games/certificate.ts#L193), [dòng 227-236](../src/features/games/certificate.ts#L227-L236): `handleGameOver()` hiện `#btnGetCertificate` khi `score >= 50` (chỉ cần trúng 1 từ ở Game 2 được 75đ hoặc Game 3 được 80đ rồi thua hết tim vẫn nhận bằng con dấu đỏ `"XUẤT SẮC"`). Đóng `#certificateModal` xong bấm lại `#btnGetCertificate` lưu thêm bản sao trùng vào `localStorage` không giới hạn.
  - *Hướng sửa:* Ẩn `#btnGetCertificate` trong `handleGameOver()` (chỉ cấp khi hoàn thành màn), lưu `issuedCertId` mỗi lượt để mở lại với `persist: false`.

- [x] **[GM-10] [P1] Lỗi Huy hiệu & Hồ sơ: Thua với `0` điểm vẫn mở `level_3`/`games_1`; Chứng nhận rò rỉ chéo giữa các người chơi & `gameScores` phình vô hạn**
  - [src/features/games/leaderboard.ts](../src/features/games/leaderboard.ts#L44-L76), [dòng 98-178](../src/features/games/leaderboard.ts#L98-L178), [dòng 397-421](../src/features/games/leaderboard.ts#L397-L421), [games.ts](../src/features/games/games.ts#L235-L238), [certificate.ts](../src/features/games/certificate.ts#L39-L48): `handleGameOver()` gọi `recordGameScore()` tăng `gamesPlayed` và `user.level` không phân biệt thắng/thua; `cert_1` và `showCertificatesModal()` đọc toàn bộ kho chứng nhận chung không lọc theo `currentUsername`; `certificate.ts:39-48` ghi bản sao chết vào `users[name].certificates`; `user.gameScores[gameType]` push vô hạn không giới hạn kích thước.
  - *Hướng sửa:* Truyền `completed: boolean` vào `recordGameScore()` (chỉ nâng `level` & mở huy hiệu hoàn thành khi thắng), lọc chứng nhận theo người chơi (hoặc hiển thị rõ tên chủ bằng), bỏ ghi trùng và giới hạn lịch sử `gameScores`.

- [x] **[GM-11] [P1] Lỗi Web Audio SFX (`sound-effects.ts`): Không chờ `ctx.resume()`, kẹt `'interrupted'` trên iOS, chồng 3 âm cùng lúc khi thắng & không hủy timer khi tắt tiếng**
  - [src/features/games/sound-effects.ts](../src/features/games/sound-effects.ts#L7-L28), [dòng 33-55](../src/features/games/sound-effects.ts#L33-L55), [dòng 61-104](../src/features/games/sound-effects.ts#L61-L104) & `game1..4`: Chỉ kiểm tra `'suspended'` (thiếu `'interrupted'` trên iOS PWA khi chạy nền), không `await ctx.resume()`, lên lịch hợp âm bằng `setTimeout` (kể cả khi đã mute), `setEnabled(false)` không suspend `ctx`/hủy timer, thắng Game 3 phát đồng thời 3 SFX (`shoot` + `success` + `levelUp`), và không điều phối âm lượng với `<audio>` phát âm từ vựng.
  - *Hướng sửa:* Kiểm tra `ctx.state !== 'running'`, phát sau khi `resume()`, lập lịch nốt chính xác theo `ctx.currentTime + offset` qua `GainNode` tổng, bỏ SFX trùng khi phát `levelUp()`, và giảm/nhường âm khi phát giọng đọc bản địa.

- [x] **[GM-12] [P1] `snapshotFallback.dictionary` gắn 20 `driveId` ảo (`audio_1`..`audio_20`) gây 100% lỗi 404 audio & hỏng đồng bộ offline**
  - [src/shared/data/snapshot-fallback.ts](../src/shared/data/snapshot-fallback.ts#L18-L37), [src/features/home/home.ts](../src/features/home/home.ts#L93), [dòng 370-394](../src/features/home/home.ts#L370-L394), [dòng 417](../src/features/home/home.ts#L417), [src/features/home/word-card.ts](../src/features/home/word-card.ts#L89-L108): Không tệp nào mang tên `audio_1..audio_20.webm` tồn tại trong `public/audio/` hay `public/audio-pack.index.json` (dùng ID Drive dạng `1-...`). Ở chế độ offline/không API key, mọi thẻ từ hiện thanh audio 404, thống kê báo ảo `20+` âm thanh, sync chạy 20 request 404 (`Thử tải lại (0/20)`), và tích hợp `driveId` cho Game (`GAME-02`) sẽ hỏng trên tập fallback.
  - *Hướng sửa:* Ánh xạ `driveId` thật đã kiểm chứng từ [public/audio-pack.index.json](../public/audio-pack.index.json) (hoặc để rỗng `''` với từ chưa có bản thu).

- [x] **[GM-13] [P1] Lỗi thao tác Chạm / Chuột / Bàn phím ở Games 1–4: thiếu `touch-action: none`, thiếu `touchstart`, Game 3 chỉ dùng `click` & không chơi được bằng bàn phím, phím `a`/`d` cướp gõ `#chatInput`**
  - [src/styles/features/games.css](../src/styles/features/games.css#L331-L362), [dòng 408-415](../src/styles/features/games.css#L408-L415), [dòng 440-448](../src/styles/features/games.css#L440-L448), [src/features/games/game2-catcher.ts](../src/features/games/game2-catcher.ts#L137-L164), [src/features/games/game3-shooter.ts](../src/features/games/game3-shooter.ts#L129-L138):
    - Canvas thiếu `touch-action: none; user-select: none;` (kéo giỏ làm cuộn/zoom trang); thẻ Memory thiếu `-webkit-backface-visibility: hidden` (nháy 3D trên iOS Safari).
    - Game 2 chỉ nghe `touchmove` (chạm thẳng vào làn không nhảy giỏ); Game 3 dùng `click` thay `pointerdown` (bóng trượt khỏi vòng `34px` hoặc rung tay hủy click); chia cho `rect.width`/`rect.height` không chặn `0` làm `basketX = NaN`.
    - Game 2 lắng nghe `window` `keydown` không kiểm tra `isDestroyed`, không `preventDefault()` phím mũi tên và không bỏ qua ô nhập đang focus → gõ `'a'`/`'d'` trong `#chatInput` làm giỏ chạy theo.
    - Game 3 hoàn toàn không có điều khiển bàn phím (vi phạm WCAG 2.1.1 Level A).
  - *Hướng sửa:* Thêm `touch-action: none; user-select: none;` & `-webkit-backface-visibility: hidden`, chuyển sang Pointer Events (`pointerdown`/`pointermove`), chặn `rect.width === 0` / `isDestroyed` / phần tử editable, và bổ sung phím tắt `1`/`2`/`3` bắn mục tiêu ở Game 3.

- [x] **[GM-14] [P2] Tên file tải Giấy chứng nhận xóa sạch mọi dấu tiếng Việt & khoảng trắng thành chuỗi gạch dưới hỏng**
  - [src/features/games/certificate.ts](../src/features/games/certificate.ts#L269-L270): `.replace(/[^a-zA-Z0-9]/g, '_')` biến `"Người học Xơ Đăng"` thành `Chung-Nhan-Ng__i_h_c_X___ng-<ts>.png` dù hàm `sanitizeFilename()` chuẩn NFD đã có sẵn tại [src/services/offline-sync.service.ts](../src/services/offline-sync.service.ts#L38-L47).
  - *Hướng sửa:* Tái sử dụng chuẩn hóa NFD + `đ→d` + nối bằng `-` (`Chung-Nhan-nguoi-hoc-xo-dang-<date>.png`).

- [x] **[GM-15] [P2] Canvas Giấy chứng nhận hardcode font Windows `"Segoe UI"`, vẽ emoji `'🎓'`, thiếu `maxWidth`, con dấu mobile mờ `2.7px` & phát `levelUp()` khi xem lại kho lưu trữ**
  - [src/features/games/certificate.ts](../src/features/games/certificate.ts#L61-L63), [dòng 87-144](../src/features/games/certificate.ts#L87-L144), [dòng 189-195](../src/features/games/certificate.ts#L189-L195), [dòng 238](../src/features/games/certificate.ts#L238), [dòng 286-290](../src/features/games/certificate.ts#L286-L290) & [leaderboard.ts](../src/features/games/leaderboard.ts#L410-L418): Không dùng `'Plus Jakarta Sans'` hay `document.fonts.ready`; tên/điểm dài tràn khỏi khung `360px` vì thiếu `maxWidth`; canvas `800×600` 1x thu xuống `270px` trên mobile làm chữ con dấu `8px` chỉ còn `~2.7px`; xem lại chứng nhận cũ (`persist: false`) vẫn kêu `levelUp()`.
  - *Hướng sửa:* Dùng `'Plus Jakarta Sans'` sau `document.fonts?.ready`, vẽ biểu trưng vector thay `'🎓'`, truyền `maxWidth`, xuất độ phân giải 2x (`1600×1200`), và bỏ `levelUp()` khi `persist === false`.

- [x] **[GM-16] [P2] 4 Modal Game gắn vào `document.body` bị treo lơ lửng khi chuyển tab bằng Back/Forward hoặc đổi hash**
  - [src/features/games/games.ts](../src/features/games/games.ts#L110-L114), [dòng 259-274](../src/features/games/games.ts#L259-L274), [certificate.ts](../src/features/games/certificate.ts#L262), [leaderboard.ts](../src/features/games/leaderboard.ts#L192): `exitToMenu()` khi `tab:change` chỉ ẩn `#gameOverModal`, bỏ quên `#certificateModal`, `#leaderboardModal`, `#badgesModal` và `#certificatesListModal`.
  - *Hướng sửa:* Đóng đồng thời cả 4 overlay modal gắn ở `document.body` bên trong `exitToMenu()`.

- [x] **[GM-17] [P2] Game 2/3/4 chỉ luyện 1 chiều (`Xơ Đăng → Việt`), đáp án nhiễu không cùng chủ đề/rò từ đa nghĩa & lộ dấu hiệu `(1)..(10)` ở số đếm**
  - [src/features/games/game-data.ts](../src/features/games/game-data.ts#L41-L50), [dòng 85-113](../src/features/games/game-data.ts#L85-L113), [dòng 126-128](../src/features/games/game-data.ts#L126-L128): Không có bài luyện sản sinh `Việt → Xơ Đăng`; `pickWrongAnswers` bỏ qua `topic`, phân biệt hoa-thường/NFD, không loại các nghĩa khác của cùng 1 từ Xơ Đăng đa nghĩa, và phát sinh chuỗi `"Từ khác 1"` khi tập nhỏ; các mục `'Số đếm'` gắn sẵn `(1)..(10)` khiến người chơi đoán bằng mắt không cần nhớ từ.
  - *Hướng sửa:* Hỗ trợ chế độ 2 chiều (chuyển đổi hoặc trộn ở Level cao), ưu tiên nhiễu cùng chủ đề/cùng độ dài, chuẩn hóa NFC + chữ thường + loại toàn bộ nghĩa của `item.ethnic`, và bỏ hậu tố `(1)..(10)`.

- [x] **[GM-18] [P3] Thiếu bảo vệ tập câu hỏi rỗng ở Game 2/3/4 (vòng lặp `rAF` chạy trắng vô hạn) & `start()` không an toàn khi gọi lại**
  - [game1-memory.ts](../src/features/games/game1-memory.ts#L30-L39), [game2-catcher.ts](../src/features/games/game2-catcher.ts#L56-L86), [dòng 192-195](../src/features/games/game2-catcher.ts#L192-L195), [game3-shooter.ts](../src/features/games/game3-shooter.ts#L49-L79), [dòng 231-233](../src/features/games/game3-shooter.ts#L231-L233), [game4-farm.ts](../src/features/games/game4-farm.ts#L42-L57), [dòng 123-140](../src/features/games/game4-farm.ts#L123-L140).
  - *Hướng sửa:* Hiển thị trạng thái trống rõ ràng khi `questions.length === 0`, dọn listener/timer cũ và reset `this.score` trong `start()`.

- [x] **[GM-19] [P3] Thứ bậc heading `#game` nhảy cóc `<h2>` (`<h1>` → `<h3>`) & `.game-active-topbar` xuống 2–3 dòng (~140–170px) trên màn hình `360px`**
  - [src/features/games/games.html](../src/features/games/games.html#L5), [dòng 55-121](../src/features/games/games.html#L55-L121), [dòng 146](../src/features/games/games.html#L146), [dòng 177](../src/features/games/games.html#L177) & [src/styles/features/games.css](../src/styles/features/games.css#L225-L283).
  - *Hướng sửa:* Dùng `<h2>` cho tiêu đề thẻ game và `#activeGameTitle`; thu gọn `.game-active-topbar` ở `@media (max-width: 540px)` (rút ngắn nhãn `"Menu"`, giảm padding/font).

---

## Đề xuất lộ trình xử lý

> Kế hoạch thực thi chi tiết **DAG 4 vòng — 12 subagent** (đã khóa 3 quyết định: đồng bộ Google Sheet, font self-host `Be Vietnam Pro`, và Outbox IndexedDB) xem tại [ui-audit-remediation-plan.md](./ui-audit-remediation-plan.md).

1. **Đợt 1 — Vá toàn bộ 14 lỗi P0 (`[UI-01]`→`[UI-06]`, `[VIS-01]`→`[VIS-05]`, `[UX-01]`, `[GM-01]`→`[GM-02]`):** Sửa tương phản Dark Mode CTA/Danger/`.chat-header h3`, thêm `.toast.warning` + stack `#toastContainer`, bật CSS thanh tiến độ Flashcard (`0px`), sửa `viewport-fit=cover` + thanh đáy iOS, vô hiệu hóa click xuyên `#offlineIndicator` + hiện banner kết nối lại, tách `.hashtag`, thêm nút quay lại chủ đề Quiz, thêm ô nhập nhãn từ cho Thu hàng loạt, thống nhất ngữ liệu Bố/Mẹ & 8 cặp từ mâu thuẫn, tách làn rơi không chồng cho Game 2.
2. **Đợt 2 — Hệ thống CSS, Font Xơ Đăng, Z-Index, Responsive & PWA (`[UI-13]`→`[UI-18]`, `[VIS-06]`→`[VIS-18]`):** Thêm `color-scheme` + chuyển Dark Mode lên `:root.dark-mode` chống FOUC, quy hoạch thang `--z-*`, đổi tên class xung đột cross-chunk (`.modal-btn`/`.step-num`/`.loading`), bổ sung `U+0306` + precache SW `latin-ext`/weight `500`, sửa toàn bộ tương phản Light/Canvas, sửa [offline.html](../public/offline.html) & [manifest.json](../public/manifest.json), đổi `100vh` → `100dvh` + cuộn modal + sửa tràn `320–360px`, bỏ ép cứng `20px` trên `.lucide-icon`.
3. **Đợt 3 — Máy trạng thái tương tác, Routing, STT, Quiz, Đóng góp & Chat (`[UX-02]`→`[UX-31]`):** Sửa bootstrap/lazy-route loading + error catch, điều phối `<audio>` + `onerror`, sửa STT `vi-VN` & state machine/cancel, sửa `#retryQuizBtn` & đóng băng đồng hồ Quiz + xáo trộn đáp án, sửa toàn bộ 6 lỗi audio Đóng góp & batch retry/`no-cors`/timer, sửa race nút Chat & `loadFaqs()` xóa tin nhắn, sửa `aria-labelledby` modal.
4. **Đợt 4 — Accessibility bàn phím & Polish chung (`[UI-07]`→`[UI-12]`, `[UI-19]`→`[UI-22]`):** Khôi phục `:focus-visible`, sửa semantic `<button>`/ARIA/Escape/Focus Trap toàn bộ Modal/Navbar/Quiz/Game 4/Onboarding, sửa skeleton CLS, xóa CSS chết, hiển thị đúng `matchType`, thêm nút Clear/bàn phím Xơ Đăng ở Đóng góp/đổi tên người chơi.
5. **Đợt 5 (hoặc tách nhánh ưu tiên riêng) — Tái thiết kế Game Arena & Sửa toàn bộ cơ chế Game (`[GAME-01]`→`[GAME-07]`, `[GM-03]`→`[GM-19]`):** Theater Mode toàn khung + Canvas HiDPI co giãn + bảng màu Direction A/Graphite, tích hợp audio thật (`driveId` chuẩn, xóa `audio_1..20` ảo), sửa điểm cộng dồn qua Level, sửa hitbox tường Game 3 + tránh chồng mục tiêu + nút đóng/pool câu Game 4 + bảo vệ rỗng `getMemoryCardPairs`, sửa điều kiện cấp Giấy chứng nhận & huy hiệu/hồ sơ người chơi, viết lại Web Audio SFX chuẩn `ctx.currentTime`, nâng cấp Pointer Events + phím tắt `1/2/3`, sửa font & tên file chứng nhận.
