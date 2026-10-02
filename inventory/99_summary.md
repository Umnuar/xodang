# TỔNG HỢP KIỂM KÊ MÃ NGUỒN GỐC (99_SUMMARY)

- **Thư mục kiểm kê gốc:** `C:\Users\umnuar\Downloads\tudien-goc`
- **Thời gian hoàn tất:** 2026-10-02
- **Tổng số tập tin được phân tích chi tiết:** 15 tập tin văn bản/mã nguồn (21.687 dòng mã nguồn)
- **Tổng số tập tin nhị phân/media đã lập danh mục bỏ qua:** 1.279 tập tin (.webm, .mp3, .png, .jpg)

---

## 1. Ma Trận Thống Kê Tổng Hợp

| Mã File | Tên tập tin | Số dòng | Hàm / Methods (F) | Sự kiện / Bindings (E) | Phần tử tương tác / Selectors (B) | State / Config (S) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **FILE01** | `CNAME` | 1 | 0 | 0 | 0 | 1 |
| **FILE02** | `robots.txt` | 3 | 0 | 0 | 0 | 3 |
| **FILE03** | `sitemap.xml` | 15 | 0 | 0 | 0 | 2 |
| **FILE04** | `google752b7efc6d08d97f.html` | 1 | 0 | 0 | 0 | 1 |
| **FILE05** | `audio/README.md` | 0 | 0 | 0 | 0 | 1 |
| **FILE06** | `manifest.json` | 64 | 0 | 0 | 0 | 13 |
| **FILE07** | `Danh_gia_va_Toi_uu_Du_an.md` | 139 | 0 | 0 | 0 | 6 |
| **FILE08** | `Bao_cao_giai_phap_PWA.md` | 312 | 1 | 0 | 2 | 4 |
| **FILE09** | `.agents/skills/taste-skill/SKILL.md` | 332 | 0 | 0 | 0 | 4 |
| **FILE10** | `service-worker.js` | 429 | 9 | 6 | 2 | 9 |
| **FILE11** | `offline.html` | 493 | 2 | 8 | 11 | 3 |
| **FILE12** | `intro.html` | 1.523 | 9 | 10 | 16 | 6 |
| **FILE13** | `game.html` | 4.876 | 95 | 15 | 22 | 17 |
| **FILE14** | `app/index.html` | 7.078 | 66 | 16 | 120 | 9 |
| **FILE15** | `index.html` | 7.380 | 74 | 17 | 135 | 10 |
| **TỔNG** | **15 tập tin** | **21.687** | **256** | **72** | **308** | **89** |

---

## 2. Sơ Đồ Phụ Thuộc Mã Nguồn Gốc (Dependency Architecture Map)

```mermaid
flowchart TD
    subgraph ClientBrowsing["Trình duyệt Client"]
        CNAME["FILE01 CNAME<br/>hoctiengxodang.online"] --> DNS["GitHub Pages"]
        Robots["FILE02 robots.txt"] --> Sitemap["FILE03 sitemap.xml"]
        GoogleVerify["FILE04 google-verify.html"]
    end

    subgraph Entrypoints["Các Cửa Ngõ Vào Ứng Dụng"]
        Index["FILE15 index.html<br/>(Master Monolith 7.380 dòng)"]
        AppIndex["FILE14 app/index.html<br/>(Subdir Variant 7.078 dòng)"]
        Intro["FILE12 intro.html<br/>(Onboarding Slider)"]
        Game["FILE13 game.html<br/>(4 Minigames Engine)"]
        Offline["FILE11 offline.html<br/>(Fallback UI)"]
    end

    subgraph BackgroundWorker["Service Worker & Caching Đa Tầng"]
        SW["FILE10 service-worker.js<br/>(v10.0.3)"]
        Manifest["FILE06 manifest.json"]
        StaticCache[("Cache: tudien-10.0.3")]
        AudioCache[("Cache: tudien-audio")]
    end

    subgraph CloudServices["Dịch Vụ Đám Mây"]
        SheetsAPI["Google Sheets API v4<br/>(Tu_Dien, Data_Chat, Data_Tracnghiem, Game)"]
        AppsScript["Google Apps Script Webhook<br/>(Đóng góp từ vựng)"]
        AudioFiles["1.261 Audio .webm Files<br/>(Thư mục audio/)"]
    end

    Intro -- "startApp() -> localStorage['hasSeenIntro']" --> Index
    Index -- "Chuyển tab #game" --> Game
    Index -- "Đăng ký SW" --> SW
    Index -- "initOfflineDownloader()" --> AudioCache
    SW -- "Pre-cache STATIC_FILES" --> StaticCache
    SW -- "Chặn lỗi 408 / Cache 30m" --> SheetsAPI
    SW -- "Dự phòng khi mất mạng" --> Offline
    Game -- "fetchData() tab Game!A3:AC100" --> SheetsAPI
    Index -- "sendFile() Base64 Audio" --> AppsScript
    Index -- "audio/{id}.webm" --> AudioFiles
```

---

## 3. Danh Sách 7 Chuỗi Luồng Người Dùng Cốt Lõi (Core User Flows)

### Luồng 1: Onboarding $\rightarrow$ Tra cứu Từ điển
- **Mắt xích:** `FILE12:intro.html` $\rightarrow$ Vuốt 6 slide $\rightarrow$ Bấm `#floating-start-btn` $\rightarrow$ Ghi `localStorage['hasSeenIntro'] = 'true'` $\rightarrow$ Chuyển về `FILE15:index.html` $\rightarrow$ Tự động chạy `fetchDictionary()` $\rightarrow$ Người dùng gõ `#search-input` (debounce 300ms) $\rightarrow$ `smartSearch()` $\rightarrow$ Render các thẻ từ `.word-card` $\rightarrow$ Bấm nút Loa $\rightarrow$ Phát âm thanh `./audio/${driveId}.webm`.

### Luồng 2: Nhận diện Giọng nói Tìm kiếm
- **Mắt xích:** Người dùng bấm `#mic-button` $\rightarrow$ `playSound()` bíp $\rightarrow$ Kích hoạt `webkitSpeechRecognition` $\rightarrow$ Nhận diện câu nói tiếng Việt $\rightarrow$ Điền tự động vào `#search-input` $\rightarrow$ Kích hoạt `handleSearch()` $\rightarrow$ Hiển thị kết quả.

### Luồng 3: Tải Âm thanh Ngoại tuyến Hàng loạt (Chỉ có ở FILE15)
- **Mắt xích:** Người dùng bấm `#btn-download-offline` $\rightarrow$ `initOfflineDownloader()` $\rightarrow$ Mở cache `tudien-audio` $\rightarrow$ Vòng lặp `downloadNext()` duyệt toàn bộ danh sách `dictionaryData` $\rightarrow$ `fetch('./audio/' + driveId + '.webm')` $\rightarrow$ `cache.put()` $\rightarrow$ `updateProgress()` tăng thanh tiến độ 0% $\rightarrow$ 100%.

### Luồng 4: Đóng góp Từ vựng Đơn kèm Bản thu âm
- **Mắt xích:** Mở tab `#contribute` $\rightarrow$ Điền form (từ tiếng Xơ Đăng, nghĩa tiếng Việt, câu ví dụ) $\rightarrow$ Bấm nút Micro $\rightarrow$ `startRecording()` mở MediaRecorder $\rightarrow$ Canvas `animate()` vẽ sóng âm $\rightarrow$ Bấm Dừng $\rightarrow$ Nghe lại $\rightarrow$ Bấm "Gửi đóng góp" $\rightarrow$ `convertBlobToBase64()` $\rightarrow$ `sendFile()` POST lên Apps Script Webhook $\rightarrow$ Nhận JSON phản hồi và báo Toast thành công.

### Luồng 5: Đóng góp Hàng loạt (Batch Upload)
- **Mắt xích:** Chọn tab "Đóng góp hàng loạt" $\rightarrow$ Chọn tệp `.csv` hoặc `.xlsx` $\rightarrow$ Parse dữ liệu vào `batchQueue` $\rightarrow$ Render bảng `#batch-table` $\rightarrow$ Thu âm bổ sung cho từng từ (tùy chọn) $\rightarrow$ Bấm "Gửi tất cả" $\rightarrow$ Gửi batch lên server.

### Luồng 6: Trợ lý Chat AI (FAQ Bot)
- **Mắt xích:** Bấm bong bóng `#chat-toggle-btn` $\rightarrow$ Mở `#chat-widget` $\rightarrow$ `displayWelcomeWithQuestions()` hiện 4 câu hỏi FAQ gợi ý $\rightarrow$ Người dùng gõ câu hỏi hoặc click chip $\rightarrow$ `findAnswer()` so khớp độ tương đồng chuỗi từ bảng `Data_Chat` $\rightarrow$ Hiện bong bóng 3 chấm typing $\rightarrow$ Render câu trả lời và cuộn xuống cuối.

### Luồng 7: Hệ Thống 4 Trò Chơi Học Tập
- **Mắt xích:** Mở `game.html` $\rightarrow$ Nạp Web Audio synthesizer $\rightarrow$ Kiểm tra đăng nhập (`loadUser()`) $\rightarrow$ Mở Lobby hiển thị 4 Game $\rightarrow$
  - Game 1: Lật ô trí nhớ (`flipCard`) $\rightarrow$ Khớp cặp tiếng Việt & Xơ Đăng.
  - Game 2: Hứng quả từ vựng (`gameLoop`, `updateGame2`, di chuyển giỏ hứng bằng phím/cảm ứng).
  - Game 3: Bảo vệ cứ điểm (`updateGame3`, xạ kích quái vật mang chữ).
  - Game 4: Nông trại tri thức (`selectPlot`, trả lời trắc nghiệm nuôi cây lớn, thu hoạch).
  - Phá đảo $\rightarrow$ `showCertificate()` vẽ bằng khen lên `<canvas>` $\rightarrow$ Tải ảnh `.png`.

---

## 4. Các Điểm Yếu & Lỗi Kiến Trúc Tiềm Ẩn Đã Phát Hiện Trong Mã Nguồn Gốc

1. **Lệch Khóa LocalStorage Onboarding (Bug nghiêm trọng trong intro.html):**
   - Tại `intro.html:1242`: Kiểm tra `localStorage.getItem('introSeen') === 'true'` để tự động chuyển trang.
   - Nhưng tại `intro.html:1484`: Hàm `startApp()` lại ghi `localStorage.setItem('hasSeenIntro', 'true')`!
   - *Hậu quả:* Người dùng đã bấm "Sử dụng ứng dụng" nhưng lần sau mở lại `intro.html` vẫn bị coi là chưa xem vì sai tên khóa (`introSeen` vs `hasSeenIntro`).
2. **Hardcode API Key công khai:**
   - Cả 3 file `service-worker.js`, `game.html`, `index.html` đều hardcode trực tiếp `API_KEY: 'AIzaSyD757jS4SLR7-EzrPgrW9WrLQeD2DQExHw'`. Cần đưa vào file cấu hình môi trường hoặc proxy.
3. **Phân nhánh không đồng bộ giữa `index.html` và `app/index.html`:**
   - `index.html` đã được nâng cấp thêm bộ tải âm thanh ngoại tuyến (`initOfflineDownloader`) và Schema SEO, nhưng `app/index.html` bị bỏ quên không có các tính năng này.
4. **Xung đột tên Cache Game trong `index.html`:**
   - Dòng 7315 `index.html` kiểm tra cache `tudien-xodang-v3.2` trong khi Service Worker phiên bản 10.0.3 dùng `CACHE_NAME = 'tudien-10.0.3'`.
5. **Kích thước file Monolith quá lớn (7.380 dòng và 4.876 dòng):**
   - Việc gom toàn bộ HTML, CSS và JavaScript vào chung 1 file khiến không thể kiểm thử đơn vị tự động, khó bảo trì, dễ đứt gãy biến toàn cục và trùng lặp logic (`showToast`, `showLoading` bị khai báo lặp lại ở 4 IIFE khác nhau).
