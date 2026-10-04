# 🛡️ Mô Hình Hóa Mối Đe Dọa (Threat Model) & Kiểm Kê Tài Sản An Ninh
**Dự án:** Từ Điển Xơ Đăng - Việt (Web PWA & Electron Desktop)  
**Tài liệu:** `docs/security/00-threat-model.md`  
**Phiên bản:** 1.0.0 (Bước 0 - Security Hardening)  
**Tiêu chuẩn áp dụng:** STRIDE Methodology, OWASP Top 10 (2021), OWASP ASVS v4.0.3, Electron Security Guidelines, CWE Top 25.

---

## 1. Tổng Quan Kiến Trúc & Mục Tiêu An Ninh

Ứng dụng **Từ Điển Xơ Đăng - Tiếng Việt** là hệ thống giáo dục đa nền tảng gồm:
1. **Web Progressive Web App (PWA):** Triển khai tĩnh trên GitHub Pages (`https://hoctiengxodang.online/`), hỗ trợ người học, nhà nghiên cứu và nhà phát triển tra cứu từ điển song ngữ, bài tập trắc nghiệm, luyện nghe phát âm và 4 trò chơi học tập tương tác với khả năng hoạt động offline 100% qua Service Worker.
2. **Desktop Application (Electron):** Đóng gói cho máy tính để bàn (Windows, macOS, Linux), nạp giao diện tĩnh từ thư mục `dist/` và truy xuất dữ liệu qua cầu nối IPC và snapshot ngoại tuyến.

### Mục tiêu an ninh cốt lõi (CIA Triad & Safety):
* **Tính bảo mật (Confidentiality):** Bảo vệ các khóa API (Google Sheets API Key), ngăn chặn lộ thông tin dữ liệu âm thanh cá nhân hoặc hành vi của người dùng (Nghị định 13/2023/NĐ-CP).
* **Tính toàn vẹn (Integrity):** Đảm bảo tính chuẩn xác của dữ liệu từ điển, ngăn chặn mã độc tiêm nhiễm (XSS - Cross-Site Scripting, DOM Clobbering, Prototype Pollution) hoặc dữ liệu giả mạo làm sai lệch kết quả học tập.
* **Tính khả dụng (Availability):** Bảo đảm ứng dụng vận hành mượt mà cả khi mất mạng (Offline-first), không bị nghẽn hạn ngạch (quota exhaustion) hoặc tấn công từ chối dịch vụ trên endpoint Google Apps Script.
* **An toàn hệ thống máy chủ/desktop (Safety & Sandboxing):** Cô lập tuyệt đối môi trường Electron Renderer khỏi quyền truy cập hệ điều hành của máy tính người dùng.

---

## 2. Sơ Đồ Thành Phần & Luồng Dữ Liệu (Data Flow Diagram - DFD)

```mermaid
flowchart TD
    %% Zones & Boundaries
    subgraph Zone_Untrusted ["Vùng Không Tin Cậy (Untrusted Zone)"]
        User(["Học sinh / Người dùng"])
        HardwareMic["Phần cứng Microphone thiết bị"]
        GoogleSheetsAPI["Google Sheets API v4 (spreadsheets.values)"]
    end

    subgraph Zone_Client_Renderer ["Ranh Giới Trình Duyệt / Electron Renderer (Client Context)"]
        subgraph UI_Components ["Giao Diện & Xử Lý Sự Kiện"]
            SearchInput["Ô nhập tìm kiếm (#searchInput)"]
            ChatInput["Ô nhập Chatbot FAQ (#chatInput)"]
            ContributeForm["Form đóng góp từ vựng & âm thanh"]
            RouterNav["Hash Router (#home, #contribute, #quiz, #game)"]
            GameEngine["Game Hub (4 trò chơi tương tác)"]
        end

        subgraph Core_Services ["Dịch Vụ Nghiệp Vụ (Pure TS)"]
            DictService["Dictionary Service (normalizeNFC)"]
            FAQService["FAQ Service (findFaqAnswer)"]
            StorageService["Storage Service (JSON parser)"]
            AudioService["Audio Service (WebM URL generator)"]
        end

        subgraph Client_Storage ["Lưu Trữ Phía Máy Khách"]
            BrowserLS[("localStorage (Tiến độ học, UI state)")]
            SWCache[("CacheStorage (Static Shell & Audio)")]
        end
    end

    subgraph Zone_Electron_Main ["Ranh Giới Đặc Quyền Cao (Electron Main Process)"]
        ContextBridge["Preload contextBridge (electronAPI)"]
        IPCHandler["IPC Main Handler ('sheets:fetch')"]
        LocalFS[("Hệ Thống Tệp Cục Bộ (dist/snapshot/)")]
    end

    subgraph Zone_External_Backend ["Dịch Vụ Đích Bên Ngoài (Google Cloud / GAS)"]
        GAS["Google Apps Script Web App (Tiếp nhận đóng góp Base64)"]
    end

    %% Data Flows
    User -->|DF01: Ký tự gõ vào| SearchInput
    User -->|DF02: Câu hỏi FAQ| ChatInput
    HardwareMic -->|DF03: Luồng âm thanh MediaStream| ContributeForm
    User -->|DF04: Tệp âm thanh upload| ContributeForm
    User -->|DF05: Thay đổi hash URL| RouterNav

    SearchInput -->|DF06: Chuỗi truy vấn thô| DictService
    DictService -->|DF07: Kết xuất thẻ từ an toàn| User
    ChatInput -->|DF08: Đối sánh câu hỏi| FAQService

    ContributeForm -->|DF09: Base64 Audio & Metadata (no-cors)| GAS
    GoogleSheetsAPI -->|DF10: JSON mảng 2 chiều| DictService
    GoogleSheetsAPI -->|DF11: FAQ Data rows| FAQService

    Core_Services <-->|DF12: Ghi/Đọc tiến độ| BrowserLS
    Core_Services <-->|DF13: Nạp audio & shell| SWCache

    %% Desktop IPC Flows
    DictService -.->|DF14: invoke('sheets:fetch', range)| ContextBridge
    ContextBridge -->|DF15: IPC message| IPCHandler
    IPCHandler -->|DF16: Đọc snapshot tĩnh| LocalFS
    IPCHandler -->|DF17: Fetch mạng kèm User-Agent| GoogleSheetsAPI
```

---

## 3. Danh Mục Ranh Giới Tin Cậy (Trust Boundaries)

| ID Ranh Giới | Tên Ranh Giới | Bên Ngoài (Ít tin cậy hơn) | Bên Trong (Tin cậy hơn) | Cơ chế kiểm soát an ninh |
|:---:|:---|:---|:---|:---|
| **TB1** | **User $\rightarrow$ Renderer DOM** | Học sinh / Người dùng trên Internet | DOM Tree của ứng dụng (HTML/JS) | Chuẩn hoá Unicode NFC, gán giá trị bằng `textContent`, DOM Node API, cấm `innerHTML` chứa dữ liệu người dùng. |
| **TB2** | **External API $\rightarrow$ Renderer Data** | Google Sheets API v4 / Dữ liệu mạng | Bộ nhớ ứng dụng (Memory / State) | Parser mảng 2 chiều có kiểm tra độ dài cột, fallback an toàn, không thực thi `eval`. |
| **TB3** | **Renderer $\rightarrow$ Electron Main** | Web Renderer (chạy mã JavaScript giao diện) | Node.js Process (có quyền ghi file / gọi hệ điều hành) | `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, chỉ cho phép gọi qua `ipcRenderer.invoke`. |
| **TB4** | **Client $\rightarrow$ Google Apps Script** | Trình duyệt người dùng gửi đóng góp | Serverless Backend Google Apps Script | Request `POST` đóng gói JSON Base64 gửi `mode: no-cors`, lọc tên file bằng `sanitizeFilename`. |
| **TB5** | **Build & Dependency Supply Chain** | Kho npm registry & npm packages | Mã nguồn dự án & Bundle sản phẩm (`dist/`) | Khóa `package-lock.json` kèm SHA-512 integrity hashes, quét `npm audit`. |

---

## 4. Danh Mục Toàn Bộ Điểm Vào (Entry Points Inventory)

### 4.1 Điểm vào từ biểu mẫu (Form Inputs)
1. **Ô tìm kiếm từ vựng chính (`#searchInput`):**
   * *Vị trí:* `src/renderer/features/home/search-bar.ts:40`
   * *Kiểu dữ liệu:* Chuỗi văn bản tùy ý (`string`).
   * *Xử lý:* Lắng nghe sự kiện `input` và `keypress` (Enter); đi qua hàm `normalizeNFC` trong `src/renderer/services/dictionary.service.ts`.
2. **Ô nhập tin nhắn Chatbot (`#chatInput`):**
   * *Vị trí:* `src/renderer/features/chat/chat.ts:198`
   * *Kiểu dữ liệu:* Chuỗi câu hỏi văn bản (`string`).
   * *Xử lý:* Cắt tỉa khoảng trắng `trim()`, gán hiển thị qua `document.createElement('div').textContent = text` (Anti-XSS).
3. **Ô nhập từ tiếng Việt (`#vietnameseWord`):**
   * *Vị trí:* `src/renderer/features/contribute/contribute.ts:26, 295`
   * *Kiểu dữ liệu:* Chuỗi văn bản tiếng Việt đóng góp.
   * *Xử lý:* Kiểm tra rỗng; đưa vào payload gửi sang Google Apps Script.
4. **Ô nhập từ tiếng Xơ Đăng (`#xodangWord`):**
   * *Vị trí:* `src/renderer/features/contribute/contribute.ts:27, 296`
   * *Kiểu dữ liệu:* Chuỗi văn bản tiếng Xơ Đăng đóng góp.
   * *Xử lý:* Kiểm tra rỗng; đưa vào payload gửi sang Google Apps Script.

### 4.2 Điểm vào phần cứng / Đa phương tiện (Media & Audio)
5. **Microphone thiết bị (MediaStream API):**
   * *Vị trí:* `src/renderer/features/contribute/contribute.ts:151`
   * *Lệnh:* `navigator.mediaDevices.getUserMedia({ audio: true })`
   * *Xử lý:* Thu âm vào `MediaRecorder` với định dạng `audio/webm;codecs=opus` hoặc `audio/webm`, đóng gói thành `Blob`.
   * *Electron Permission:* `src/main/index.ts:29` cấp quyền tự động cho `permission === 'media'`.

### 4.3 Điểm vào tệp tin tải lên (File Uploads)
6. **Nạp tệp âm thanh đơn lẻ (`#audioFileInput`):**
   * *Vị trí:* `src/renderer/features/contribute/contribute.ts:30, 240`
   * *Loại thẻ:* `<input type="file" id="audioFileInput" accept="audio/*">`
   * *Xử lý:* Đọc tệp thành `Blob`, chuyển đổi Base64 qua `FileReader.readAsDataURL()`.
7. **Nạp tệp âm thanh hàng loạt (`#batchAudioInput`):**
   * *Vị trí:* `src/renderer/features/contribute/contribute.ts:43, 362`
   * *Loại thẻ:* `<input type="file" id="batchAudioInput" multiple accept="audio/*">`
   * *Xử lý:* Lặp qua danh sách `files`, đẩy vào mảng hàng đợi `batchQueue`.

### 4.4 Điểm vào điều hướng URL (URL & Hash Navigation)
8. **Hash Router (`window.location.hash`):**
   * *Vị trí:* `src/renderer/router.ts:33`
   * *Kiểu dữ liệu:* Chuỗi định tuyến URL sau ký tự `#` (vd: `#home`, `#contribute`, `#quiz`, `#game`).
   * *Xử lý:* Lọc chuỗi và đối chiếu với tập hợp cho phép (Allowlist): `new Set(['home', 'contribute', 'quiz', 'game'])`. Nếu không khớp, chuyển về mặc định `'home'`.

### 4.5 Điểm vào IPC giữa các tiến trình (Electron IPC Channels)
9. **Kênh IPC `sheets:fetch`:**
   * *Phía gọi (Renderer):* `src/preload/index.ts:9` (`ipcRenderer.invoke('sheets:fetch', range)`)
   * *Phía nhận (Main Process):* `src/main/ipc-fetcher.ts:13` (`ipcMain.handle('sheets:fetch', async (_event, range) => ...)`)
   * *Tham số:* Chuỗi `range` đại diện cho tọa độ sheet cần đọc (vd: `Tu_Dien!A2:F`).
   * *Rủi ro:* Cần xác thực giá trị `range` để ngăn chặn SSRF hoặc truy xuất ngoài phạm vi sheet được định trước.
10. **Kênh IPC `system:is-offline`:**
    * *Phía nhận:* `src/main/ipc-fetcher.ts:58`. Trả về boolean. Không nhận tham số.

### 4.6 Điểm vào từ API bên ngoài & Webhook
11. **Dữ liệu Google Sheets API v4 Response:**
    * *Vị trí:* `src/renderer/services/sheets.service.ts:31` & `src/main/ipc-fetcher.ts:20`
    * *Kiểu dữ liệu:* JSON object chứa `values: string[][]`.
    * *Xử lý:* Chuyển đổi thành các thực thể `DictionaryEntry`, câu hỏi `QuizItem`, hoặc `BotFAQ`.

---

## 5. Danh Mục Nơi Lưu Trữ Dữ Liệu (Data Stores Inventory)

| Vị trí lưu trữ | Tên khóa / Tệp | Nội dung lưu trữ | Rủi ro rò rỉ / Giả mạo | Phân loại dữ liệu |
|:---|:---|:---|:---|:---|
| **localStorage** | `studyProgressByTopic` | Bản đồ JSON tiến độ học từ vựng theo chủ đề | Giả mạo điểm học tập, lỗi cú pháp JSON | Không nhạy cảm |
| **localStorage** | `hasSeenIntro` | Cờ trạng thái đã xem màn hình chào mừng (`'true'/'false'`) | Bị thay đổi gây hiển thị lại modal chào | Không nhạy cảm |
| **localStorage** | `darkMode` | Cờ giao diện tối (`'true'/'false'`) | Thay đổi giao diện hiển thị | Không nhạy cảm |
| **localStorage** | `hasOpenedChat` | Cờ trạng thái người dùng đã mở chatbot | Ẩn/hiện dấu chấm đỏ thông báo | Không nhạy cảm |
| **localStorage** | `xedang_current_user` | Tên hiển thị người chơi trong game (mặc định 'Học sinh Xơ Đăng') | Bị ghi đè tên | Không nhạy cảm |
| **localStorage** | Các khóa game (`xedang_max_levels_*`, `xedang_bgm`, `xedang_sfx`) | Điểm số, âm lượng, cấp độ cao nhất của trò chơi | Giả mạo điểm game offline | Không nhạy cảm |
| **CacheStorage** | `tudien-modular-v10.0.3` | Bản lưu offline của file HTML vỏ, manifest, CSS, font chữ | Nhiễm cache cũ (Cache Poisoning / Stale Cache) | Công khai |
| **CacheStorage** | `tudien-audio` | Lưu đệm ~40 MB tệp âm thanh `.webm` phát âm tiếng Xơ Đăng | Giả mạo file âm thanh cục bộ | Công khai |
| **Local File System** | `src/shared/data/snapshot/*.json` | Bản chụp tĩnh dữ liệu từ điển, trắc nghiệm, chat FAQ | Bị đọc trộm nếu ứng dụng không đóng gói an toàn | Dữ liệu học tập tĩnh |

---

## 6. Danh Mục Bí Mật & Thông Tin Cấu Hình (Secrets Inventory)

> [!CAUTION]
> **Tuân thủ Luật Bất Khả Xâm Phạm:** Tuyệt đối không ghi giá trị thật của API Key hay Token trong báo cáo này. Chỉ ghi nhận vị trí tệp, số dòng và phân loại.

1. **Khóa Google Cloud API Key (Sheets API v4):**
   * *Vị trí 1:* `src/shared/constants/config.ts:6` (Biến `APP_CONFIG.GOOGLE_API_KEY` - hiện có chuỗi fallback tĩnh dạng `AIzaSy...`).
   * *Vị trí 2:* `src/shared/constants/config.ts:18` (Biến `GOOGLE_CONFIG.API_KEY`).
   * *Vị trí 3:* `scripts/generate-snapshot.ts:18` (Đọc từ biến môi trường `process.env.GOOGLE_SHEETS_API_KEY`).
   * *Vị trí 4:* `.env.example:3` (Mẫu biến môi trường `GOOGLE_SHEETS_API_KEY=YOUR_GOOGLE_SHEETS_API_KEY_HERE`).
   * *Phân loại:* Client-side Public API Key (dùng để đọc bảng tính Google Sheets công khai). Cần kiểm tra giới hạn miền (HTTP referrer restriction) trên Google Cloud Console để ngăn chặn bị lạm dụng quota.
2. **URL Triển khai Google Apps Script (Web App Endpoint):**
   * *Vị trí:* `src/shared/constants/config.ts:11` (Biến `APP_CONFIG.CONTRIBUTE_URL` dạng `https://script.google.com/macros/s/AKfycb.../exec`).
   * *Phân loại:* Webhook tiếp nhận tải lên file âm thanh đóng góp.

---

## 7. Phụ Thuộc Bên Thứ Ba (Dependencies & Supply Chain Inventory)

* **Runtime Dependencies (`dependencies`):** **0 phụ thuộc**. Mã nguồn chạy trên trình duyệt là 100% Vanilla TypeScript thuần, tự lưu trữ Font, không phụ thuộc thư viện UI ngoài (Zero Library Bloat).
* **Development Dependencies (`devDependencies`):**
  * `happy-dom` (`^17.1.0`): Giả lập môi trường DOM cho Vitest. *(Đã ghi nhận 3 cảnh báo lỗ hổng bảo mật trong `npm audit` cần xử lý tại Bước 2).*
  * `vitest` (`^3.0.5`): Khung chạy kiểm thử tự động. *(Lỗ hổng Moderate Path Traversal trong `@vitest/mocker`).*
  * `vite` (`^6.2.0`): Công cụ đóng gói mã nguồn và phát triển cục bộ.
  * `vite-plugin-pwa` (`^0.21.1`): Tích hợp PWA.
  * `typescript` (`^5.7.3`): Trình biên dịch mã nguồn.

---

## 8. Mô Hình Hóa Mối Đe Dọa Theo STRIDE Cho Từng Ranh Giới

Phương pháp **STRIDE** phân tích 6 khía cạnh đe dọa:
* **S**poofing (Giả mạo danh tính)
* **T**ampering (Can thiệp / Làm sai lệch dữ liệu)
* **R**epudiation (Chối bỏ trách nhiệm)
* **I**nformation Disclosure (Lộ lọt thông tin)
* **D**enial of Service (Từ chối dịch vụ)
* **E**levation of Privilege (Leo thang đặc quyền)

---

### 8.1 Ranh Giới TB1: Người Dùng $\leftrightarrow$ Web/Renderer DOM (Client-Side)

| Mối đe dọa (STRIDE) | Kịch bản khai thác khả dĩ | Mức độ rủi ro | Biện pháp kiểm soát hiện tại | Khoảng trống an ninh & Đề xuất |
|:---|:---|:---:|:---|:---|
| **Spoofing (S)** | Kẻ tấn công giả mạo học sinh/giáo viên đóng góp từ vựng sai lệch. | Thấp | Không có cơ chế đăng nhập (thiết kế mở cho cộng đồng). | Đã đề xuất trang kiểm duyệt bởi người bản ngữ trên Notion trước khi nhập vào dữ liệu chính. |
| **Tampering (T) / XSS** | Kẻ tấn công tiêm mã `<script>`, thẻ `<img> onerror` hoặc SVG độc hại vào ô tìm kiếm, nội dung chat hoặc dữ liệu sheet. | **P1 (Cao)** | `word-card.ts`, `chat.ts`, `toast.ts` đã dùng `textContent` và DOM Node API. Bộ test `xss-security.test.ts` đã xác minh. | Cần bổ sung CSP nghiêm ngặt (`script-src 'self'`) để tạo lớp bảo vệ chiều sâu nếu có DOM XSS phát sinh ngoài dự kiến. |
| **Repudiation (R)** | Người dùng đóng góp nội dung không phù hợp rồi chối bỏ hành vi. | Thấp | Request gửi lên Google Apps Script có gắn thời gian và tên file do client sinh ra. | Chấp nhận rủi ro (đặc thù ứng dụng cộng đồng phi lợi nhuận). |
| **Information Disclosure (I)** | Rò rỉ tiến độ học tập hoặc thông tin của học sinh lưu trong `localStorage`. | Thấp | `localStorage` chỉ lưu ID thẻ từ và tên nick trong game, hoàn toàn không lưu email/SĐT/mật khẩu. | Tuân thủ nguyên tắc giảm thiểu dữ liệu (Data Minimization) của Nghị định 13/2023/NĐ-CP. |
| **Denial of Service (D)** | Người dùng nhập chuỗi cực dài vào ô tìm kiếm hoặc spam tạo audio gây tràn bộ nhớ (Heap Overflow/Crash tab). | Trung bình | `search-bar.ts` chưa giới hạn độ dài `maxLength` của thẻ input `#searchInput`. | Bổ sung `maxLength="200"` trên các thẻ input tìm kiếm và form đóng góp. |
| **Elevation of Privilege (E)** | Mã JavaScript trong trang web tìm cách thoát khỏi sandbox trình duyệt. | Thấp | Trình duyệt hiện đại đã sandbox hóa tab web. | Tuân thủ chính sách sandbox tiêu chuẩn của Chromium/Safari. |

---

### 8.2 Ranh Giới TB2: Web Renderer $\leftrightarrow$ Electron Main Process (Desktop IPC)

| Mối đe dọa (STRIDE) | Kịch bản khai thác khả dĩ | Mức độ rủi ro | Biện pháp kiểm soát hiện tại | Khoảng trống an ninh & Đề xuất |
|:---|:---|:---:|:---|:---|
| **Spoofing (S)** | Script độc hại trong cửa sổ Renderer giả mạo sự kiện IPC gửi tới Main process. | Trung bình | `contextIsolation: true` tách biệt context giữa trang web và Node.js. | Đạt yêu cầu. |
| **Tampering (T)** | Kẻ tấn công truyền chuỗi `range` độc hại vào `ipcRenderer.invoke('sheets:fetch', range)` để truy xuất range bất thường hoặc tấn công injection. | **P2 (Trung bình)** | `src/main/ipc-fetcher.ts:16` chỉ gọi `encodeURIComponent(range)`. | Cần thêm bộ lọc kiểm tra (Allowlist validation) cho `range` chỉ nhận `Tu_Dien!A2:F`, `Data_Tracnghiem!A2:H`, `Data_Chat!A2:B`. |
| **Repudiation (R)** | Không áp dụng trong IPC cục bộ. | Không | N/A | N/A |
| **Information Disclosure (I)** | Rò rỉ đường dẫn tệp tin hệ điều hành hoặc lỗi hệ thống qua console Electron. | Thấp | Lỗi đọc snapshot được log ra terminal nội bộ của máy tính. | Ẩn stack trace chi tiết khi chạy bản đóng gói production (`app.isPackaged`). |
| **Denial of Service (D)** | Gọi IPC liên tục gây nghẽn tiến trình Main process. | Thấp | Tần suất gọi IPC chỉ diễn ra khi khởi động hoặc đồng bộ dữ liệu. | Đạt yêu cầu. |
| **Elevation of Privilege (E)** | **Nguy hiểm nhất trong Electron:** Vượt rào sandbox thông qua `nodeIntegration` hoặc điều hướng tới trang web ngoài chứa mã độc chiếm quyền máy tính. | **P1 (Cao)** | `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true` đã được bật. | **Cần bổ sung:** Chặn mở cửa sổ mới bằng `setWindowOpenHandler(() => ({ action: 'deny' }))` và chặn điều hướng ngoài bằng `webContents.on('will-navigate')` trong `src/main/index.ts`. |

---

### 8.3 Ranh Giới TB3: Ứng Dụng Khách $\leftrightarrow$ Google Apps Script (Contribute Endpoint)

| Mối đe dọa (STRIDE) | Kịch bản khai thác khả dĩ | Mức độ rủi ro | Biện pháp kiểm soát hiện tại | Khoảng trống an ninh & Đề xuất |
|:---|:---|:---:|:---|:---|
| **Spoofing (S)** | Kẻ xấu sử dụng script bên ngoài gọi liên tục vào URL Google Apps Script để spam dữ liệu rác. | Trung bình | URL webhook công khai, không có khóa xác thực người gửi. | Phía Google Apps Script cần cơ chế kiểm duyệt dữ liệu trước khi đẩy vào Google Drive. |
| **Tampering (T)** | Tải lên tệp có đuôi `.webm` nhưng chứa payload nhị phân độc hại (Executable/Shellcode). | Trung bình | Tệp được mã hóa Base64 và gửi lên Drive lưu trữ dưới dạng audio. Trình duyệt client không thực thi tệp này như mã thực thi. | Giới hạn dung lượng tệp âm thanh tải lên (vd: tối đa 5 MB/tệp) ở phía client trước khi chuyển đổi Base64. |
| **Information Disclosure (I)** | Dữ liệu âm thanh của học sinh bị nghe lén trên đường truyền. | Thấp | Bắt buộc truyền tải qua giao thức HTTPS có mã hóa TLS của Google. | Đạt yêu cầu. |
| **Denial of Service (D)** | Người dùng chọn một tệp video nặng 500 MB nạp vào `#audioFileInput`, làm trình duyệt đơ và cạn kiệt hạn ngạch thực thi 6 phút của Google Apps Script. | **P2 (Trung bình)** | Hiện tại hàm `sendFile` chưa kiểm tra kích thước `blob.size` trước khi gọi `convertBlobToBase64`. | Bổ sung kiểm tra kiểm tra kích thước tối đa của tệp âm thanh (vd: `<= 10 MB`) trước khi mã hóa Base64. |

---

### 8.4 Ranh Giới TB4: Ứng Dụng Khách / Main $\leftrightarrow$ Google Sheets API v4

| Mối đe dọa (STRIDE) | Kịch bản khai thác khả dĩ | Mức độ rủi ro | Biện pháp kiểm soát hiện tại | Khoảng trống an ninh & Đề xuất |
|:---|:---|:---:|:---|:---|
| **Information Disclosure (I)** | Google Cloud API Key bị lộ trong mã nguồn client và bị đối tượng xấu lấy dùng cho dự án khác gây hết quota. | **P2 (Trung bình)** | Khóa được đưa vào biến môi trường nhưng hiện tại vẫn có fallback chuỗi tĩnh tại `config.ts:6`. | 1. Xoay key mới trên Google Cloud Console.<br>2. Cài đặt giới hạn **HTTP Referrers** chỉ cho phép domain `https://hoctiengxodang.online/*` và `localhost:3000`.<br>3. Giới hạn API chỉ bật Google Sheets API v4 (API Restrictions). |
| **Denial of Service (D)** | Tấn công cạn kiệt hạn ngạch (Quota Exhaustion) do gọi API quá nhiều lần. | Trung bình | Ứng dụng đã có cơ chế lưu trữ snapshot dữ liệu tĩnh dự phòng (`src/shared/data/snapshot/`), tự động chuyển sang offline khi lỗi mạng. | Đạt yêu cầu. |

---

### 8.5 Ranh Giới TB5: Chuỗi Cung Ứng Phát Triển (Build & Supply Chain)

| Mối đe dọa (STRIDE) | Kịch bản khai thác khả dĩ | Mức độ rủi ro | Biện pháp kiểm soát hiện tại | Khoảng trống an ninh & Đề xuất |
|:---|:---|:---:|:---|:---|
| **Tampering (T) / Supply Chain** | Gói `happy-dom` phiên bản cũ chứa lỗ hổng VM Context Escape (GHSA-37j7-fg3j-429f) bị khai thác trong môi trường test CI/CD khi chạy test với fixture độc hại. | **P2 (Thực tế)** | Gói chỉ nằm trong `devDependencies`, không xuất hiện trong bản build sản phẩm (`dist/`). | Nâng cấp `happy-dom` lên phiên bản an toàn hoặc đánh giá rủi ro có kiểm soát tại Bước 2. |
| **Integrity Violation** | File `package-lock.json` bị chỉnh sửa ngầm tải mã độc từ registry lạ. | Thấp | Khóa cố định phiên bản và SHA-512 hashes. | Đạt yêu cầu. |

---

## 9. Ma Trận Đánh Giá Mối Đe Dọa Sơ Bộ (Threat Ranking Matrix)

```
        MỨC ĐỘ ẢNH HƯỞNG (IMPACT)
           Thấp        Trung bình        Cao
        ┌───────────┬───────────────┬───────────────┐
   Cao  │           │ T03: Range IPC│ T01: DOM XSS  │
        │           │     Tampering │ T02: Electron │
K       │           │               │     Navigation│
H       ├───────────┼───────────────┼───────────────┤
Ả  TB   │ T04: Game │ T05: Upload   │ T06: Quota    │
        │      Cheat│      Oversize │      Exhaust  │
N       ├───────────┼───────────────┼───────────────┤
Ă       │ T07: Hash │ T08: Test VM  │               │
N  Thấp │      Route│      Escape   │               │
G       └───────────┴───────────────┴───────────────┘
```

* **T01 (P1):** Rủi ro XSS nếu xuất hiện dữ liệu không an toàn trong DOM (cần bảo vệ đa tầng bằng CSP nghiêm ngặt).
* **T02 (P1):** Rủi ro điều hướng ngoài trong Electron do thiếu `setWindowOpenHandler` và `will-navigate`.
* **T03 (P2):** Rủi ro tham số `range` chưa được validate chặt chẽ trong IPC `sheets:fetch`.
* **T04 (P3):** Giả mạo điểm số và cấp độ game trong `localStorage`.
* **T05 (P2):** Nạp tệp âm thanh quá lớn gây đơ trình duyệt và tốn băng thông Google Apps Script.
* **T06 (P2):** Lộ Google API Key fallback gây cạn kiệt hạn ngạch truy vấn bảng tính.
* **T07 (P3):** Điều hướng hash sai (đã được xử lý bằng Allowlist).
* **T08 (P2):** Lỗ hổng trong `happy-dom` của môi trường test runner.

---

## 10. Tiêu Chí Nghiệm Thu Cổng (Gate Bước 0 Checklist)

* [x] **100% điểm vào (Entry Points) được kiểm kê:** 4 ô form input, 1 luồng microphone, 2 luồng tải file âm thanh, 1 hash router, 2 kênh IPC Electron, 1 API response.
* [x] **100% ranh giới tin cậy (Trust Boundaries) được phân lập:** TB1 (User/DOM), TB2 (API/Renderer), TB3 (Renderer/Electron Main), TB4 (Client/GAS), TB5 (Supply Chain).
* [x] **100% vị trí lưu trữ dữ liệu được ghi nhận:** `localStorage` (14 khóa), `CacheStorage` (2 cache names), hệ thống snapshot tệp tĩnh.
* [x] **100% vị trí bí mật được định danh:** Chỉ ghi nhận vị trí file và số dòng, không in giá trị thật.
* [x] **Mô hình hóa mối đe dọa STRIDE hoàn tất cho cả 5 ranh giới.**
* [x] **Không chỉnh sửa bất kỳ tệp mã nguồn nào trong dự án.**
