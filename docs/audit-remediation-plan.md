# Kế hoạch Sửa lỗi, Tái cấu trúc & Tối ưu — `tudien-xedang`

**Mục tiêu:** Vá toàn bộ 5 lỗi P0, 10 nhóm lỗi P1, hợp nhất dead/duplicate code, tối ưu hiệu năng bundle/search/cache/canvas và dọn rác repo với 100% unit/security tests xanh.

**Ràng buộc toàn cục:**
- **Git Safety:** Tạo nhánh `fix/audit-remediation` từ `main` trước mọi chỉnh sửa; không commit trực tiếp lên `main`.
- **Zero Comments:** Không viết comment trong mã nguồn mới/sửa; dọn comment tại các đoạn chỉnh sửa.
- **No Unrequested Deps:** Không tự ý cài package mới; chỉ dùng `npm ci` để khôi phục `node_modules/.bin` từ `package-lock.json` hiện có (cần xác nhận nếu chạy).
- **Zero Regression Contracts:** Giữ nguyên kết quả khớp chính xác của `tests/golden-search.test.ts`, chuẩn `Direction A` của `tests/minimal-redesign-verification.test.ts`, định dạng `studyProgressByTopic` của `tests/legacy-storage.test.ts` và bảo toàn cache `tudien-audio` (`40.6 MB`).

---

## Pre-flight — Khởi tạo nhánh & Môi trường kiểm thử

- [x] **Task 0: Tạo nhánh làm việc & kiểm tra baseline**
  - Chạy `git checkout -b fix/audit-remediation`.
  - Khôi phục `node_modules/.bin` (`npm ci` — hiện `node_modules/.bin` đang rỗng khiến `vitest`/`tsc` chưa chạy được).
  - Xác nhận baseline: `npx tsc --noEmit && npm test`.

---

## Giai đoạn 1 — Vá lỗi P0 (Nghiêm trọng & Bảo mật)

### Task 1: Sửa đáp án Flashcard (off-by-one) + Lỗi Quiz (bộ đếm, thang điểm %, timer, clipboard)
**Files:**
- Sửa: `src/renderer/features/quiz/flashcard.ts:36-42`, `src/renderer/services/quiz.service.ts:107-131`, `src/renderer/features/quiz/quiz.html:152-155`, `src/renderer/features/quiz/quiz.html:215-219`, `src/renderer/features/quiz/quiz.ts:56-60`, `src/renderer/features/quiz/quiz.ts:169-198`, `src/renderer/features/quiz/quiz.ts:260-345`
- Test: `tests/quiz.test.ts`

**Thay đổi cụ thể:**
- [x] `src/renderer/features/quiz/flashcard.ts:40`: Đổi `q.options[q.correctAnswer]` → `q.options[q.correctAnswer - 1] ?? q.options[0] ?? ''`.
- [x] `src/renderer/services/quiz.service.ts:110-122`: Đổi ngưỡng tuyệt đối `score >= 4` / `score >= 3` sang theo phần trăm (`percentage === 100` → `'Xuất sắc! 🎉'`, `>= 80` → `'Rất tốt! 👏'`, `>= 60` → `'Khá tốt! 👍'`, còn lại `'Cần cố gắng thêm! 📚'`) — tương thích 100% với bộ test 5 câu hiện tại và đúng với chủ đề 2–10 câu.
- [x] `src/renderer/features/quiz/quiz.html:153`: Xóa `/5` thừa sau `<span id="currentQuestionNumber">1</span>`; thêm `id="maxScore"` cho `<span class="score-max">/5</span>` ở dòng `217`.
- [x] `src/renderer/features/quiz/quiz.ts`: Dùng thẳng `title` và `description` từ `evaluateQuiz()`, cập nhật `#maxScore` thành `/${total}`; dừng `stopTimer()` khi `tab:change` rời `'quiz'`, bấm `retryQuizBtn` và `newTopicBtn`; gọi thật `navigator.clipboard.writeText(window.location.href)` trong fallback nút chia sẻ.
- [x] Thêm test vào `tests/quiz.test.ts`: kiểm tra `FlashcardManager.setCards()` map đúng 1-indexed đáp án (gồm cả `correctAnswer = 1` và `correctAnswer = 4`), kiểm tra `evaluateQuiz()` cho pool 2 câu & 10 câu, kiểm tra timer dừng khi chuyển tab.
- [x] Xác minh: `npx vitest run tests/quiz.test.ts` → PASS.

### Task 2: Vá Stored XSS, Rò rỉ Listener & Nhân bản Chứng chỉ ở Games
**Files:**
- Sửa: `src/shared/constants/storage-keys.ts`, `src/renderer/features/games/certificate.ts`, `src/renderer/features/games/leaderboard.ts`, `src/renderer/features/games/games.ts`
- Test: `tests/xss-security.test.ts`, `tests/games-ancillary.test.ts`

**Thay đổi cụ thể:**
- [x] Thêm `GAME_CERTIFICATES: 'xedang_certificates'` vào `STORAGE_KEYS`, thay thế hằng nội bộ trong `src/renderer/features/games/certificate.ts`.
- [x] `src/renderer/features/games/certificate.ts`: Mở rộng `showCertificateModal(options)` nhận thêm `id?: string`, `date?: string`, `persist?: boolean` (mặc định `true`). Chỉ gọi `saveCertificate()` khi `persist !== false`; dùng `options.id` (hoặc `saved.id`) làm số hiệu cố định thay cho `Date.now()`.
- [x] `src/renderer/features/games/leaderboard.ts`:
  - Chuyển toàn bộ phần render danh sách trong `showLeaderboardModal()`, `showBadgesModal()`, `showCertificatesModal()` sang DOM API (`document.createElement` + `textContent`), tuyệt đối không nội suy dữ liệu người dùng/storage vào `innerHTML`.
  - Gắn sự kiện đóng overlay/button **1 lần duy nhất** khi khởi tạo node modal (dùng event delegation trên modal), xóa rò rỉ listener mỗi lần mở lại.
  - Khi bấm `"Xem & Tải"` trong `showCertificatesModal()`, gọi `showCertificateModal({ ..., id: cert.id, date: cert.date, persist: false })`.
- [x] `src/renderer/features/games/games.ts`: Rút gọn `GAME_TITLES` thành 1 hằng chung duy nhất.
- [x] Thêm test vào `tests/xss-security.test.ts` (payload `<img onerror>` trong `GAME_USERS` và `GAME_CERTIFICATES`) và `tests/games-ancillary.test.ts` (xem lại chứng chỉ không tăng số lượng chứng chỉ lưu trữ + mở/đóng modal nhiều lần không nhân bản listener).
- [x] Xác minh: `npx vitest run tests/xss-security.test.ts tests/games-ancillary.test.ts` → PASS.

### Task 3: Dừng vòng lặp Game 2 & 3 khi kết thúc + Hủy Timeout Game 1 & 4 + Delta-Time Physics + A11y
**Files:**
- Sửa: `src/renderer/features/games/game1-memory.ts`, `src/renderer/features/games/game2-catcher.ts`, `src/renderer/features/games/game3-shooter.ts`, `src/renderer/features/games/game4-farm.ts`, `src/renderer/features/games/game-data.ts`
- Test: `tests/games.test.ts`

**Thay đổi cụ thể:**
- [x] `src/renderer/features/games/game2-catcher.ts` & `src/renderer/features/games/game3-shooter.ts`:
  - Thêm `private stopLoop(): void` (`isDestroyed = true`, `cancelAnimationFrame`, `animId = null`) và gọi **trước** `onLevelComplete` / `onGameOver`.
  - Gọi `this.render()` trước `setupNextQuestion()` / `nextQuestion()` để `canvas` sẵn sàng ngay frame đầu.
  - Tính `dt = Math.min((timestamp - lastFrameTime) / 16.667, 3)` nhân vào vận tốc (`word.speed * dt`, `t.vx * dt`, `t.vy * dt`) để tốc độ đồng nhất trên 60Hz/120Hz/144Hz.
  - Thêm fallback cho `ctx.roundRect` trong `src/renderer/features/games/game2-catcher.ts` để chạy được trên Safari < 15.4.
- [x] `src/renderer/features/games/game1-memory.ts` & `src/renderer/features/games/game4-farm.ts`: Lưu `levelCompleteTimeoutId` và `clearTimeout()` trong `destroy()`; thêm `keydown` (`Enter` / `Space`) cho thẻ ở `src/renderer/features/games/game1-memory.ts`.
- [x] `src/renderer/features/games/game-data.ts`: Thay toàn bộ `.sort(() => Math.random() - 0.5)` bằng Fisher-Yates / lấy mẫu ngẫu nhiên O(1) theo chỉ số để chọn 3 đáp án sai không trùng; bỏ `d.matchType || 'Từ điển'` vô nghĩa.
- [x] Thêm test vào `tests/games.test.ts`: xác nhận `onGameOver` / `onLevelComplete` hủy `requestAnimationFrame` ngay lập tức (không trừ mạng âm, không gọi lại callback) và `destroy()` trong 600ms sau khi thắng ở Game 1/4 không kích hoạt `onLevelComplete`.
- [x] Xác minh: `npx vitest run tests/games.test.ts` → PASS.

### Task 4: Sửa Service Worker Precache, Font 404 trên GitHub Pages/Electron & Offline Cache Từ điển thật
**Files:**
- Sửa: `public/fonts/jakarta/jakarta.css`, `src/renderer/styles/base.css:1`, `index.html`, `src/shared/constants/config.ts`, `src/shared/constants/storage-keys.ts`, `src/renderer/service-worker.ts`, `src/renderer/main.ts:150-158`, `src/renderer/services/sheets.service.ts`
- Test: `tests/service-worker.test.ts`

**Thay đổi cụ thể:**
- [x] `public/fonts/jakarta/jakarta.css`: Đổi toàn bộ 16 `url(/fonts/jakarta/pjs-*.woff2)` → `url(./pjs-*.woff2)`.
- [x] Gỡ `@import '/fonts/jakarta/jakarta.css'` khỏi `src/renderer/styles/base.css`, nạp qua `<link rel="stylesheet" href="./fonts/jakarta/jakarta.css">` trong `index.html` để tương thích đồng thời dev, subpath `/xodang/` và `file://`.
- [x] `src/shared/constants/config.ts` & `src/renderer/service-worker.ts`: Đồng bộ `APP_CACHE_NAME = 'tudien-modular-v10.0.4'`, dùng chung constant từ `APP_CONFIG`. Sửa `STATIC_PRECACHE` trỏ đúng các file tồn tại (`./`, `./index.html`, `./offline.html`, `./manifest.json`, `./fonts/jakarta/jakarta.css`, các file `pjs-*.woff2` tiếng Việt/Latin, `./icons/icon-192x192.png`) và precache từng file bằng `Promise.allSettled` để 1 asset lỗi không hủy toàn bộ precache. Ở handler `navigate`, ghi ngược response hợp lệ vào `CACHE_NAME`.
- [x] `src/renderer/main.ts`: Sửa `isElectron = Boolean(window.electronAPI?.isElectron)`; nếu `document.readyState === 'complete'` thì gọi `navigator.serviceWorker.register('./service-worker.js')` ngay thay vì chờ `load` (đã bắn xong).
- [x] `src/renderer/services/sheets.service.ts`:
  - Thêm `inFlightRequests = new Map<string, Promise<string[][]>>()` chống gọi trùng song song.
  - Lưu dữ liệu tải được từ Google Sheets xuống `localStorage` (key theo `range`, kèm timestamp) thông qua `src/renderer/services/storage.service.ts`. Thứ tự fallback khi mất mạng: `memoryCache` → mạng (timeout 8s) → cache bền trong `localStorage` (1,000+ từ thật) → `snapshotFallback` (20 từ mẫu).
- [x] Cập nhật `tests/service-worker.test.ts`: test danh sách `STATIC_PRECACHE` tồn tại thật trên ổ đĩa, test `sheets.service` deduplication + offline persistence fallback.
- [x] Xác minh: `npx vitest run tests/service-worker.test.ts` → PASS.

---

## Giai đoạn 2 — Vá lỗi P1 & Dọn Kiến trúc

### Task 5: Gỡ Fake Splash 3.8s + Đồng nhất `storage.service.ts` + Vệ sinh HTML/CSS/Manifest
**Files:**
- Sửa: `src/renderer/main.ts`, `src/renderer/services/storage.service.ts`, `src/shared/constants/storage-keys.ts`, `src/renderer/components/navbar/navbar.ts`, `src/renderer/components/install-modal/install-modal.ts`, `src/renderer/features/chat/chat.ts`, `src/renderer/features/onboarding/onboarding.ts`, `src/renderer/features/games/games.ts`, `src/renderer/features/games/game-data.ts`, `src/renderer/features/games/sound-effects.ts`, `index.html`, `public/manifest.json`, `public/offline.html`, `src/renderer/styles/tokens.css`, `src/renderer/styles/features/home.css`
- Xóa: `src/renderer/components/footer/footer.ts` (no-op rỗng)
- Test: `tests/legacy-storage.test.ts`, `tests/onboarding.test.ts`, `tests/smoke.test.ts`

**Thay đổi cụ thể:**
- [x] `src/renderer/main.ts`: Xóa vòng lặp fake splash 3.8s; ẩn `#app-loading` ngay sau khi khởi tạo xong và bắn `appLoadingComplete` đúng 1 lần. Gỡ các global `window.*` thừa không còn caller.
- [x] Chuyển toàn bộ `localStorage.getItem/setItem` ở 9 module sang `src/renderer/services/storage.service.ts` (`getStorageItem`, `setStorageItem`, `isDarkMode`, `setDarkMode`, `hasSeenIntro`, `setHasSeenIntro`, `hasOpenedChat`, `setHasOpenedChat`).
- [x] Sửa `public/offline.html:292-302` (xóa `}` dư và rule `.offline-svg-icon` lặp); sửa `src/renderer/styles/tokens.css:6` (`--color-primary-glow: rgba(30, 126, 72, 0.18)`) để `src/renderer/styles/features/home.css:72` focus ring hợp lệ; đồng bộ `theme-color: #1e7e48` trong `index.html` + `public/manifest.json`; sửa `softwareVersion: "10.0.3"` và gỡ `sameAs` placeholder ở `index.html:231-232`.
- [x] Xác minh: `npx vitest run tests/legacy-storage.test.ts tests/onboarding.test.ts tests/smoke.test.ts` → PASS.

### Task 6: Hợp nhất Audio/Offline Service + Tách `contribute.ts` (626 dòng) + Sửa lỗi Offline Download
**Files:**
- Xóa: `src/renderer/services/audio.service.ts`
- Tạo: `src/renderer/features/contribute/recorder.ts`, `src/renderer/features/contribute/batch-queue.ts`
- Sửa: `src/renderer/services/offline-sync.service.ts`, `src/renderer/features/home/word-card.ts`, `src/renderer/features/home/home.ts:217-255`, `src/renderer/features/contribute/contribute.ts`
- Test: `tests/audio.test.ts`, `tests/contribute.test.ts`

**Thay đổi cụ thể:**
- [x] Chuyển `getAudioUrl(driveId: string): string` (có `encodeURIComponent` + lọc `'null'`/`'undefined'`) về `src/renderer/services/offline-sync.service.ts` làm nguồn duy nhất cho cả `word-card.ts` và offline sync; xóa `src/renderer/services/audio.service.ts` (loại bỏ rò rỉ `AudioContext` và code tải cache trùng lặp).
- [x] Tối ưu `getOfflineAudioStatus()`: gọi `await cache.keys()` **1 lần duy nhất**, xây `Set` pathname để kiểm tra O(1) thay vì 1,264 lần `await cache.match()`. Lọc chuẩn `id && id.trim() !== '' && id !== 'null' && id !== 'undefined'` thống nhất giữa `home.ts` và `offline-sync.service.ts`.
- [x] `src/renderer/features/home/home.ts`: Kiểm tra `{ cached, total }` trả về từ `downloadOfflineAudio()`. Chỉ khóa nút & báo thành công khi `total > 0 && cached >= total`; nếu thiếu file thì mở lại nút để tải tiếp và hiển thị đúng số lượng đã lưu.
- [x] `src/renderer/services/offline-sync.service.ts`: Thêm `AbortController` timeout cho `sendContribution()`, dùng `Content-Type: text/plain;charset=utf-8` (header hợp lệ dưới `mode: 'no-cors'` cho Google Apps Script) và thông báo trung thực trạng thái đã gửi.
- [x] Tách `src/renderer/features/contribute/contribute.ts`:
  - `src/renderer/features/contribute/recorder.ts`: `AudioRecorder` chọn MIME có fallback an toàn cho Safari iOS (`audio/webm;codecs=opus` → `audio/webm` → `audio/mp4` → mặc định trình duyệt), tắt sạch mọi `MediaStreamTrack` và trả về `Blob` kèm đúng extension.
  - `src/renderer/features/contribute/batch-queue.ts`: quản lý mảng queue, `URL.revokeObjectURL` khi xóa/reset, tự cập nhật `currentBatchPlayingIndex` khi xóa phần tử đứng trước (`index < currentBatchPlayingIndex` → giảm 1), bọc `.play().catch(...)`.
  - `src/renderer/features/contribute/contribute.ts`: gọi `sendContribution()` từ `offline-sync.service.ts` (xóa code trùng `sanitizeFilename`/`convertBlobToBase64`/`sendFile`), revoke `singleAudioUrl` khi submit đơn xong, dừng ghi âm/phát khi nhận `tab:change` rời `'contribute'`.
- [x] Cập nhật `tests/audio.test.ts` (import từ `offline-sync.service.ts`) + thêm test vào `tests/contribute.test.ts` (xóa item đứng trước item đang phát không làm lệch index).
- [x] Xác minh: `npx vitest run tests/audio.test.ts tests/contribute.test.ts` → PASS.

### Task 7: Gỡ bỏ hoàn toàn Electron + Chốt Build Snapshot Web PWA *(đã chuyển sang Phương án D1=B)*
**Files:**
- Xóa: `src/main/index.ts`, `src/main/ipc-fetcher.ts`, `src/preload/index.ts`, `src/shared/types/electron.d.ts`, `src/shared/types/electron-module.d.ts`, `vite.electron.config.ts`
- Tạo/Sửa: `src/shared/types/node-builtins.d.ts`, `scripts/generate-snapshot.ts`, `vite.config.ts`, `package.json`, `tsconfig.node.json`, `src/renderer/main.ts`, `src/renderer/services/sheets.service.ts`

**Thay đổi cụ thể (Phương án B — Web PWA thuần):**
- [x] Gỡ bỏ `src/main/`, `src/preload/`, `src/shared/types/electron*.d.ts`, `vite.electron.config.ts`, nhánh `window.electronAPI` trong `src/renderer/main.ts` & `src/renderer/services/sheets.service.ts`, và các script `electron:*` trong `package.json`.
- [x] `tsconfig.node.json`: Tách ambient Node built-in declarations sang `src/shared/types/node-builtins.d.ts` để `vite.config.ts` và `vitest.config.ts` kiểm tra kiểu sạch không cần Electron.
- [x] `vite.config.ts`: Tự động kiểm tra nếu tồn tại `src/shared/data/snapshot/vocab-snapshot.json` thì nạp snapshot build-time, ngược lại fallback về `src/shared/data/snapshot-fallback.ts`.

---

## Giai đoạn 3 — Tối ưu Hiệu năng, Search/Chat & Vệ sinh Repo

### Task 8: Code-Splitting & Lazy-Loading theo Route
**Files:**
- Sửa: `src/renderer/main.ts`, `src/renderer/router.ts`, `src/renderer/styles/index.css`
- Test: `tests/router.test.ts`, `tests/memory-leak.test.ts`

**Thay đổi cụ thể:**
- [x] Giữ sẵn 4 shell `<section id="home|contribute|quiz|game" class="container"></section>` trong `<main>` (đảm bảo tương thích 100% với `tests/memory-leak.test.ts`).
- [x] Chỉ nạp ngay ở bundle chính: `home` + `navbar` + `footer` + `onboarding` + `install-modal` + CSS nền (`tokens`, `base`, `layout`, `common`, `modal`, `home`, `onboarding`).
- [x] Dùng dynamic `import()` nạp HTML + CSS feature + controller (`contribute`, `quiz`, `games`) 1 lần duy nhất khi user mở tab tương ứng; nạp `chat` khi bấm nút chat hoặc lúc rảnh (`requestIdleCallback`).
- [x] Xác minh: `npm run build` tạo chunk riêng cho `quiz`, `games`, `contribute`, `chat`, giảm rõ kích thước chunk khởi động so với `182 KB` hiện tại; `npx vitest run tests/router.test.ts tests/memory-leak.test.ts` → PASS.

### Task 9: Nâng cấp Search Engine, Home UX, Chatbot FAQ & Audio Visualizer GPU
**Files:**
- Sửa: `src/renderer/services/dictionary.service.ts`, `src/renderer/features/home/home.ts`, `src/renderer/services/faq.service.ts`, `src/renderer/features/chat/chat.ts`, `src/renderer/features/contribute/visualizer.ts`, `src/renderer/styles/features/contribute.css`
- Test: `tests/golden-search.test.ts`, `tests/unicode-nfc.test.ts`, `tests/faq.test.ts`, `tests/memory-leak.test.ts`

**Thay đổi cụ thể:**
- [x] `src/renderer/services/dictionary.service.ts`:
  - Xây index cache theo tham chiếu mảng bằng `WeakMap<DictionaryEntry[], IndexedEntry[]>` chứa sẵn `vietNfc`, `ethnicNfc`, `vietFolded`, `ethnicFolded` (bỏ dấu tiếng Việt/Xơ Đăng).
  - Nâng cấp regex ranh giới từ sang Unicode property `/(^|[^\p{L}\p{N}])...([^\p{L}\p{N}]|$)/iu`.
  - Giữ 100% hành vi exact match (`matchType: 'exact', score: 20`) cho `tests/golden-search.test.ts`; chỉ khi exact match trả rỗng mới fallback sang khớp không dấu (`matchType: 'accent_insensitive', score: 10`).
- [x] `src/renderer/features/home/home.ts`: Nối `getSuggestions()` cập nhật `<datalist id="suggestions">` động theo hướng dịch và input; xử lý khi xóa input về rỗng/`< 2` ký tự (khôi phục trạng thái ban đầu) và lắng nghe `directionSelect.addEventListener('change', ...)` để tra lại ngay.
- [x] `src/renderer/services/faq.service.ts` & `src/renderer/features/chat/chat.ts`: Tạo `const usedQuestions = new Set<string>()` duy trì suốt phiên trong `initChat()`; import `DEFAULT_FAQ_ITEMS` thay vì copy cứng; đổi `keypress` → `keydown`; nâng cấp `findFaqAnswer()` theo thứ tự exact → khớp từ khóa bỏ dấu có ngưỡng tối thiểu (đảm bảo `'Câu hỏi không tồn tại'` vẫn trả `null`).
- [x] `src/renderer/features/contribute/visualizer.ts`: Cache mảng `private bars: HTMLElement[]` 1 lần ở `initBars()`; chuyển animation từ `bar.style.height` sang GPU `bar.style.transform = scaleY(...)` (kèm `transform-origin: bottom` trong `src/renderer/styles/features/contribute.css`), throttle ~20fps và hỗ trợ nối `AnalyserNode` thật từ `MediaStream` (đóng `AudioContext` sạch trong `stopAnimation()`/`destroy()`).
- [x] Xác minh: `npx vitest run tests/golden-search.test.ts tests/unicode-nfc.test.ts tests/faq.test.ts tests/memory-leak.test.ts` → PASS.

### Task 10: Vệ sinh Repo, Asset & Tooling (`graft` / `graphify`) *(đã chốt D2=A, D3=A)*
**Files:**
- [x] Xóa khỏi `public/`: `public/og-image.png` (`6.86 MB`), `public/og-image_v2.png` (`2.50 MB`), `public/twitter-card.png` (`253 KB`), `public/_sdk/` (giảm **~9.6 MB** mỗi lần deploy).
- [x] Sửa: `package.json` (gỡ `vite-plugin-pwa` không dùng để khớp custom SW), `.gitignore` (thêm `.codegraph/`, `*.tsbuildinfo`).
- [x] Chuyển thư mục kiểm toán cũ ở root (`fix/`, `inventory/`, `review/`) vào `docs/archive/` qua `git mv`; giữ nguyên untracked `doc/` và `KHKT 10A3-12B1.docx`.
- [x] Tạo `.graphifyignore` (loại trừ `.agents/`, `docs/archive/`, `public/audio/`, `dist/`, `dist-electron/`, `node_modules/`, `graft/`, `.codegraph/`, `.remember/`), chạy lại `graft build --follow-nested-repos` và `graphify update .`.
- [x] Xác minh tổng cuối cùng: `npx tsc --noEmit`, `npx tsc -p tsconfig.node.json --noEmit`, `npm test`, `npm run build`.

---

## 5 Kịch bản Biên bắt buộc phải được Test phủ (Review Focus)
1. **Private Mode / `localStorage` bị chặn:** `getItem/setItem` ném `SecurityError` hoặc `QuotaExceededError` → ứng dụng vẫn khởi chạy và chạy trong RAM không crash.
2. **Deploy subpath `/xodang/` & relative paths:** 0 đường dẫn tuyệt đối `/...` trong CSS/HTML/JS/SW; 100% file trong `STATIC_PRECACHE` tồn tại thật trong `public/` hoặc `dist/`.
3. **Reload trang khi mất mạng hoàn toàn:** Sau 1 lần truy cập online, tải lại khi offline vẫn hiển thị đầy đủ dữ liệu từ điển đã cache (không tụt về 20 từ mock).
4. **Đổi tab liên tục giữa chừng:** Đang thu âm, đang chạy timer Quiz, hoặc trong 600ms sau khi thắng Game 1/4 → đổi tab dừng sạch mic/timer/timeout, không bật modal rác.
5. **Dữ liệu độc hại từ `localStorage` / Sheets:** Payload `<script>` / `<img onerror>` trong `GAME_USERS`, `GAME_CERTIFICATES`, từ điển, chat → không sinh thẻ HTML thực thi ở bất kỳ view/modal nào.

---

## 3 Quyết định đã xác nhận thực thi (D1=B, D2=A, D3=A)

1. **D1 — Phạm vi Electron (`src/main`, `src/preload`): Đã chốt B**
   - **A:** Giữ & sửa pipeline build + lỗi main/IPC.
   - **(Đã chọn) B:** Gỡ bỏ hoàn toàn Electron để dự án thuần Web PWA (nếu sau này làm Desktop sẽ dựng mới bằng Tauri v2).
2. **D2 — Thư mục `fix/`, `inventory/`, `review/` ở root & `docs/` screenshots (`15.3 MB`): Đã chốt A**
   - **(Khuyến nghị) A:** Gộp `fix/`, `inventory/`, `review/` vào `docs/archive/` (giữ lịch sử, sạch root). Giữ nguyên untracked `doc/` và `KHKT 10A3-12B1.docx`.
   - **B:** Xóa hẳn `fix/`, `inventory/`, `review/` khỏi Git (vẫn còn trong git history).
3. **D3 — Thư mục `public/audio/` (`1,264` file = `40.6 MB`): Đã chốt A**
   - **(Khuyến nghị cho GitHub Pages hiện tại) A:** Giữ nguyên trong `public/audio/` để PWA tải offline trực tiếp cùng origin không tốn thêm hạ tầng.
   - **B:** Lập hướng dẫn tách sang Cloudflare R2 / GitHub Releases / Git LFS (cần đổi `getAudioUrl()` + CSP `media-src`/`connect-src`).
