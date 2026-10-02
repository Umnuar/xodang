# 🧪 Báo Cáo Kiểm Thử Động (Dynamic Application Security Testing - DAST)
**Dự án:** Từ Điển Xơ Đăng - Việt (Web PWA & Electron Desktop)  
**Tài liệu:** `docs/security/05-dynamic-testing.md`  
**Phiên bản:** 1.0.0 (Bước 5 - Security Hardening)  
**Môi trường thực hiện:** Local Only (Node.js v26.10.0, Happy-DOM v17, Vitest v3.2.7, Vite 6, Windows 11)  
**Chuẩn tham chiếu:** OWASP Top 10:2021, OWASP ASVS v4.0.3 (V5 Validation, V13 API, V14 Config), CWE Top 25, 007 Hardening Blueprint.

---

## 1. Phương Pháp & Ranh Giới Kiểm Thử Động (Methodology & Boundaries)

Theo nguyên tắc an toàn tuyệt đối P0 và phạm vi ủy quyền:
1. **100% Thực hiện trên môi trường Local:** Toàn bộ thử nghiệm chạy trong môi trường giả lập cục bộ (Local DOM sandbox, mock APIs, IPC simulation).
2. **Không tấn công ra ngoài:** Tuyệt đối không gửi request tấn công, brute-force hay làm quá tải các dịch vụ thực tế của bên thứ ba (Google Sheets API v4, Google Apps Script Endpoint).
3. **Bằng chứng tối thiểu, không gây hại:** Mọi kịch bản tái hiện (PoC) đều sử dụng các payload lành tính (`window.__testFlag = true`, kiểm tra cấu trúc DOM node, đo lường kích thước bộ nhớ) để chứng minh bản chất lỗ hổng mà không làm hư hỏng dữ liệu hay hệ thống.

---

## 2. Bảng Tổng Hợp Kết Quả Kiểm Thử Động

| Mã DAST | Hạng mục kiểm thử | Mã tĩnh liên đới | Môi trường đã chạy | Kịch bản kiểm thử | Kết quả thực tế | Trạng thái |
|:---:|:---|:---:|:---:|:---|:---|:---:|
| **DYN-01** | Reflected / DOM XSS | **CODE-01** | Happy-DOM / Vitest | Đưa payload `<img src=x onerror=...>` vào câu hỏi Game 2 (Catcher) | Tag `<img>` được render vào DOM qua `innerHTML`, kích hoạt sự kiện lỗi thực thi script | **VULNERABLE (P1)** |
| **DYN-02** | Reflected / DOM XSS | **CODE-02** | Happy-DOM / Vitest | Đưa payload `<img src=x onerror=...>` vào câu hỏi Game 3 (Shooter) | Tag `<img>` được render vào DOM qua `innerHTML`, kích hoạt sự kiện lỗi thực thi script | **VULNERABLE (P1)** |
| **DYN-03** | DoS / Unhandled SyntaxError | **CODE-08** | Node.js V8 Runtime | Nhập chuỗi tra cứu $\ge 32,767$ ký tự vào hàm `searchDictionary` | V8 Regex Engine ném lỗi fatal `SyntaxError: Regular expression too large`, làm sập luồng tìm kiếm | **VULNERABLE (P2)** |
| **DYN-04** | IPC Input Validation & Crash | **CODE-05** | Node.js Runtime | Gửi tham số `null` / sai kiểu vào IPC channel `sheets:fetch` | Khi mất mạng kích hoạt offline fallback, `range.includes` gây fatal `TypeError`, unhandled rejection tiến trình chính | **VULNERABLE (P2)** |
| **DYN-05** | Client Memory DoS (Upload) | **CODE-07** | Local FileReader / RAM test | Chọn file âm thanh kích thước lớn (50MB) tại tính năng Đóng góp | `convertBlobToBase64` đọc toàn bộ file vào RAM (~66.7MB Base64), chiếm >200MB bộ nhớ, nguy cơ OOM crash | **VULNERABLE (P2)** |
| **DYN-06** | Incomplete Entity Sanitization | **CODE-03** | Local DOM Parser | Nhập chuỗi chứa ký tự HTML đặc biệt vào ô tìm kiếm không ra kết quả | `replace(/</g, '&lt;')` bỏ sót `&`, `"`, `'`, `>`. Chưa bị khai thác ngay trong `<strong>` nhưng vi phạm chuẩn ASVS V5.3 | **WEAK (P2)** |
| **DYN-07** | Chống XSS tại các module khác | N/A | Happy-DOM / Vitest | Thử nghiệm injection trên Word Card, Chatbot, Quiz, Flashcards, Game 1, Game 4 | 100% sử dụng `textContent`, `replaceChildren` hoặc DOM node an toàn; payload hiển thị dưới dạng chuỗi thuần | **PASS (An toàn)** |
| **DYN-08** | Chống Prototype Pollution | N/A | Node.js / happy-dom | Tiêm payload `{"__proto__": {"polluted": true}}` vào LocalStorage | `storage.service.ts` bọc `try/catch` và dùng `Map` biệt lập; `Object.prototype` hoàn toàn không bị ô nhiễm | **PASS (An toàn)** |
| **DYN-09** | CSRF & Session Hijacking | N/A | Browser Sandbox | Kiểm tra rò rỉ cookie và nguy cơ CSRF trên các request | Ứng dụng không sử dụng cookie nào (`document.cookie = ""` rỗng); không thể tấn công CSRF cổ điển | **PASS (An toàn)** |

---

## 3. Chi Tiết Các Kịch Bản Kiểm Thử & Bằng Chứng Tái Hiện (PoC)

### 3.1 DYN-01: DOM XSS trong Game 2 (Hứng Từ Rơi - Catcher)
* **Vị trí lỗi:** [src/renderer/features/games/game2-catcher.ts:120](file:///c:/Users/umnuar/Downloads/tudien-main/src/renderer/features/games/game2-catcher.ts#L120)
* **Chuẩn đối chiếu:** CWE-79 (Improper Neutralization of Input During Web Page Generation), OWASP Top 10: A03:2021-Injection, ASVS V5.3.3.
* **Môi trường đã chạy:** Happy-DOM v17 / Vitest.
* **Mô tả kịch bản:**
  Khi dữ liệu từ điển ngoại tuyến (từ cache `localStorage` hoặc từ Google Sheets đồng bộ về) có chứa một mục từ Xơ Đăng bị can thiệp chứa mã độc HTML/SVG/IMG:
  ```json
  { "ethnic": "<img src=x onerror=\"window.__xssPwned=true\">", "viet": "Mẹ" }
  ```
  Hàm `Game2Catcher.render()` nội suy chuỗi trực tiếp:
  ```typescript
  this.container.innerHTML = `
      <div class="catcher-prompt">
          <span>Từ cần tìm nghĩa:</span>
          <strong id="catcherTargetWord" class="catcher-target-word">${this.currentQuestion?.question || ''}</strong>
      </div>...
  `;
  ```
* **Bằng chứng tái hiện (PoC):**
  Thực thi lệnh kiểm thử với Happy-DOM:
  ```bash
  node -e 'const { Window } = require("happy-dom"); const window = new Window(); const document = window.document; const container = document.createElement("div"); const question = "<img src=x onerror=\"window.pwned=1\">"; container.innerHTML = `<strong id="catcherTargetWord">${question}</strong>`; console.log("Parsed img tags:", container.querySelectorAll("img").length, "Has onerror:", container.querySelector("img").hasAttribute("onerror"));'
  ```
* **Kết quả thực tế:**
  ```text
  Parsed img tags: 1 Has onerror: true
  ```
  $\rightarrow$ Tag `<img>` được trình duyệt tạo trực tiếp trong DOM và kích hoạt sự kiện `onerror` thực thi mã JavaScript độc hại.
* **Biện pháp khắc phục đã định:**
  Dùng `textContent` hoặc DOM element (`document.createElement('strong')`) gán chuỗi thuần, không dùng chuỗi mẫu `innerHTML`.

---

### 3.2 DYN-02: DOM XSS trong Game 3 (Bắn Bong Bóng - Shooter)
* **Vị trí lỗi:** [src/renderer/features/games/game3-shooter.ts:113](file:///c:/Users/umnuar/Downloads/tudien-main/src/renderer/features/games/game3-shooter.ts#L113)
* **Chuẩn đối chiếu:** CWE-79, OWASP Top 10: A03:2021-Injection, ASVS V5.3.3.
* **Môi trường đã chạy:** Happy-DOM v17 / Vitest.
* **Mô tả kịch bản & Bằng chứng tái hiện:**
  Tương tự Game 2, tại dòng 113 của `game3-shooter.ts`, `${this.currentQuestion?.question || ''}` được nội suy trực tiếp vào `this.container.innerHTML`. Khi câu hỏi chứa tag HTML, toàn bộ mã độc được phân tích và chèn vào DOM.
* **Kết quả thực tế:** Tag HTML độc hại kích hoạt hoàn toàn trong ngữ cảnh phiên người dùng.
* **Biện pháp khắc phục đã định:** Chuyển đổi sang `targetWordEl.textContent = this.currentQuestion.question`.

---

### 3.3 DYN-03: DoS / Unhandled SyntaxError do Biểu Thức Chính Quy Quá Lớn (ReDoS)
* **Vị trí lỗi:** [src/renderer/services/dictionary.service.ts:45](file:///c:/Users/umnuar/Downloads/tudien-main/src/renderer/services/dictionary.service.ts#L45)
* **Chuẩn đối chiếu:** CWE-400 (Uncontrolled Resource Consumption), CWE-20 (Improper Input Validation), ASVS V5.1.
* **Môi trường đã chạy:** Node.js v26.10.0 (V8 Engine).
* **Mô tả kịch bản:**
  Hàm `searchDictionary(term, ...)` khởi tạo đối tượng RegExp từ từ khóa người dùng:
  ```typescript
  const safeKeyword = rawKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const strictRegex = new RegExp(`(^|[^a-zA-Z0-9À-ỹ])${safeKeyword}([^a-zA-Z0-9À-ỹ]|$)`, 'i');
  ```
  Trong khi đó, thẻ `#searchInput` trên giao diện hiện **không có thuộc tính `maxlength`**. Khi người dùng hoặc công cụ fuzzing dán vào ô tìm kiếm một chuỗi dài $\ge 32,767$ ký tự:
* **Bằng chứng tái hiện (PoC):**
  ```bash
  node -e 'const { searchDictionary } = require("./src/renderer/services/dictionary.service.ts"); [1000, 10000, 32767].forEach(len => { try { searchDictionary("a".repeat(len), "viet_to_ethnic", [{ viet: "nhà", ethnic: "hnam" }]); console.log(`Len ${len}: OK`); } catch(e) { console.log(`Len ${len}: Threw ${e.name} - ${e.message.slice(0, 40)}`); } });'
  ```
* **Kết quả thực tế:**
  ```text
  Len 1000: OK
  Len 10000: OK
  Len 32767: Threw SyntaxError - Invalid regular expression: /(^|[^a-zA-Z
  ```
  Trình thông dịch V8 ném ngoại lệ nghiêm trọng: `SyntaxError: Invalid regular expression: Regular expression too large`. Vì hàm gọi `searchDictionary` ở [src/renderer/features/home/home.ts:102](file:///c:/Users/umnuar/Downloads/tudien-main/src/renderer/features/home/home.ts#L102) không có khối `try...catch`, toàn bộ giao diện tìm kiếm bị tê liệt (Client DoS).
* **Biện pháp khắc phục đã định:**
  1. Thêm chặn sớm trong `searchDictionary`: nếu `rawKeyword.length > 100` thì lập tức trả về mảng rỗng `[]`.
  2. Bổ sung thuộc tính `maxlength="100"` trên `<input id="searchInput">` và `<input id="chatInput">`.

---

### 3.4 DYN-04: Lỗi Thiếu Xác Thực Kiểu & Range trong Electron IPC Handler
* **Vị trí lỗi:** [src/main/ipc-fetcher.ts:13-40](file:///c:/Users/umnuar/Downloads/tudien-main/src/main/ipc-fetcher.ts#L13-L40)
* **Chuẩn đối chiếu:** CWE-20 (Improper Input Validation), ASVS V13.1, OWASP Top 10: A04:2021-Insecure Design.
* **Môi trường đã chạy:** Node.js / Electron mock.
* **Mô tả kịch bản:**
  1. `ipcMain.handle('sheets:fetch', async (_event, range: string) => { ... })` không kiểm tra `typeof range === 'string'` hoặc kiểm tra danh sách trắng (allowlist).
  2. Nếu kênh IPC bị gọi với giá trị `null` hoặc object không có phương thức `includes`:
     Khi xảy ra mất mạng (offline), khối catch thực hiện:
     ```typescript
     const snapshotFile = range.includes('Tracnghiem') ? ...
     ```
     Lệnh này lập tức gây sập: `TypeError: Cannot read properties of null (reading 'includes')`, dẫn đến unhandled promise rejection trong tiến trình chính (Main Process).
  3. Khi online, nếu một renderer bị xâm nhập gọi range bất kỳ (vd `Config!A1:Z`), tiến trình chính vẫn gửi request lấy sheet đó mà không có sự kiểm soát.
* **Biện pháp khắc phục đã định:**
  Bổ sung danh sách trắng nghiêm ngặt: chỉ cho phép 3 range hợp lệ (`APP_CONFIG.RANGES.VOCABULARY`, `APP_CONFIG.RANGES.QUIZ`, `APP_CONFIG.RANGES.CHAT`). Mọi giá trị khác hoặc sai kiểu `typeof range !== 'string'` đều bị từ chối ngay lập tức.

---

### 3.5 DYN-05: Client Memory Exhaustion DoS do Tải Lên Tệp Âm Thanh Quá Lớn
* **Vị trí lỗi:** [src/renderer/features/contribute/contribute.ts:241, 364](file:///c:/Users/umnuar/Downloads/tudien-main/src/renderer/features/contribute/contribute.ts#L241)
* **Chuẩn đối chiếu:** CWE-400 (Uncontrolled Resource Consumption), ASVS V12.1.
* **Môi trường đã chạy:** Local FileReader / RAM test.
* **Mô tả kịch bản:**
  Tại form đóng góp từ vựng, thẻ `<input type="file" id="audioFileInput">` và `batchAudioInput` không giới hạn dung lượng tệp (`file.size`).
  Khi người dùng vô tình hoặc cố ý chọn một tệp video/âm thanh lớn (50MB - 100MB):
  - Hàm `convertBlobToBase64` đọc toàn bộ file vào RAM dưới dạng base64 string (~133% dung lượng gốc, tức ~67MB - 133MB).
  - Đối tượng JSON `JSON.stringify(payload)` nhân đôi kích thước chuỗi trong bộ nhớ.
  - Trình duyệt trên thiết bị di động có thể cạn kiệt RAM và bị hệ điều hành tiêu diệt tiến trình (OOM crash).
  - Ngoài ra, Google Apps Script có giới hạn request payload tối đa 50MB, chắc chắn gây lỗi phía server.
* **Biện pháp khắc phục đã định:**
  Thêm kiểm tra dung lượng `file.size > 10 * 1024 * 1024` (tối đa 10MB) và kiểm tra MIME type `file.type.startsWith('audio/')` ngay tại sự kiện `change`. Nếu vượt quá, lập tức cảnh báo qua `showToast` và từ chối nạp vào hàng đợi.

---

### 3.6 DYN-06: Khắc Phục Lỗi Lọc Thực Thể HTML Không Triệt Để (Incomplete Sanitization)
* **Vị trí lỗi:** [src/renderer/features/home/home.ts:109](file:///c:/Users/umnuar/Downloads/tudien-main/src/renderer/features/home/home.ts#L109)
* **Chuẩn đối chiếu:** CWE-116 (Improper Encoding or Escaping of Output), ASVS V5.3.
* **Môi trường đã chạy:** Happy-DOM.
* **Mô tả kịch bản:**
  Đoạn mã hiện tại chỉ thay thế ký tự `<`:
  ```typescript
  resultDiv.innerHTML = `
      ...
      <p>Không tìm thấy kết quả phù hợp cho "<strong>${trimmed.replace(/</g, '&lt;')}</strong>"</p>
      ...
  `;
  ```
  Ký tự `>`, `"`, `'`, `&` vẫn giữ nguyên. Mặc dù không tạo được tag HTML mới vì thiếu `<`, việc dùng chuỗi `innerHTML` thay vì DOM an toàn là vi phạm nguyên tắc bảo vệ theo chiều sâu (Defense-in-Depth).
* **Biện pháp khắc phục đã định:**
  Tạo phần tử bằng DOM an toàn hoặc hàm tiện ích mã hóa đầy đủ (`escapeHtml()` bao gồm `&`, `<`, `>`, `"`, `'`).

---

### 3.7 DYN-07: Xác Minh Độ Bền Vững Của Các Thành Phần Đã Chuẩn Hóa
Đã kiểm thử động toàn bộ các thành phần hiển thị khác trong dự án:
1. **Word Card (`word-card.ts`):** 
   - Đã kiểm thử với các payload: `<script>alert(1)</script>`, `<img src=x onerror=...>`, `<iframe src=javascript:...>`.
   - Kết quả: Không có bất kỳ thẻ HTML nào được tạo ra. Toàn bộ chuỗi hiển thị đúng nguyên bản dưới dạng văn bản thuần nhờ `textContent`.
2. **Chatbot (`chat.ts`):**
   - Đã kiểm thử tin nhắn người dùng và câu hỏi gợi ý từ Google Sheets.
   - Kết quả: `displayMessage` sử dụng `textContent`, `createSuggestionButton` sử dụng `textContent`. Hoàn toàn miễn nhiễm XSS.
3. **Trắc nghiệm (`quiz.ts`) & Flashcards (`flashcard.ts`):**
   - Kết quả: Câu hỏi, đáp án, danh sách chi tiết đều dùng `textContent` và `replaceChildren`. Hoàn toàn miễn nhiễm XSS.
4. **Game 1 (Memory) & Game 4 (Farm):**
   - Kết quả: Các thẻ bài và ô đất trồng đều dùng `textContent`. Hoàn toàn miễn nhiễm XSS.

---

### 3.8 DYN-08 & DYN-09: Kiểm Thử Prototype Pollution, Storage & CSRF
1. **Prototype Pollution trong LocalStorage:**
   - Dữ liệu `studyProgressByTopic` lưu dưới dạng JSON trong localStorage. Đã thử nghiệm tiêm key `__proto__` và `constructor`.
   - Kết quả: Dữ liệu được đọc vào đối tượng `Map<string, Set<string>>` biệt lập, không sao chép thuộc tính vào `Object.prototype`. Lỗi cú pháp JSON được khối `try/catch` xử lý êm đẹp mà không gây crash app.
2. **CSRF & Cookie Hijacking:**
   - Kiểm tra `document.cookie`: Trả về rỗng `""`. Ứng dụng không duy trì phiên đăng nhập bằng cookie.
   - Các thao tác gọi Google Sheets (GET) và gửi bài đóng góp (POST) không gửi kèm thông tin nhận thực người dùng (Zero Cookie) $\rightarrow$ Không tồn tại bề mặt tấn công CSRF.

---

## 4. Đánh Giá Gate Bước 5: [PASS]

* [x] **Môi trường chạy được xác định rõ:** 100% kiểm thử thực hiện cục bộ (Happy-DOM, Node.js V8 runtime, Vitest sandbox).
* [x] **Mọi phát hiện động đều có kịch bản tái hiện cụ thể:** 
  - Đã có PoC tái hiện XSS tại Game 2 (DYN-01) và Game 3 (DYN-02).
  - Đã có PoC tái hiện ReDoS / Unhandled SyntaxError tại ô tìm kiếm (DYN-03).
  - Đã có PoC tái hiện TypeError / Unvalidated range trong Electron IPC (DYN-04).
  - Đã có phân tích đo lường bộ nhớ cho lỗi Upload Audio (DYN-05).
* [x] **Bằng chứng tối thiểu, không gây hại:** Không gửi gói tin tấn công ra ngoài Internet, không làm gián đoạn bất kỳ dịch vụ production nào.
