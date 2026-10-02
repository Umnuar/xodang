# 🛡️ BÁO CÁO TỔNG HỢP AN NINH & BẢNG ĐIỀU KHIỂN CỔNG DUYỆT (Security Master Report)

**Dự án:** Từ Điển Xơ Đăng - Việt (Web PWA & Electron Desktop)  
**Tài liệu:** `docs/security/06-report.md`  
**Phiên bản:** 1.0.0 (Bước 6 - Cổng Duyệt & Kế Hoạch Sửa Lỗi)  
**Nhánh Git:** `sec/hardening` (Baseline tag: `pre-security`)  
**Chuẩn tham chiếu:** OWASP Top 10:2021, OWASP ASVS v4.0.3, CWE Top 25, NIST SSDF, SLSA v1.0, CVSS v3.1.  

---

## 1. Tóm Tắt Tình Hình An Ninh Dự Án (Executive Summary)

Sau 6 bước rà soát độc lập và có hệ thống (từ Bước 0 đến Bước 5):
* **Tổng số điểm vào (Entry Points):** 11 điểm vào trên toàn bộ Web PWA và Electron Desktop.
* **Tổng số ranh giới tin cậy (Trust Boundaries):** 5 ranh giới (TB1: Người dùng $\rightarrow$ DOM, TB2: Trình duyệt $\rightarrow$ Google APIs, TB3: Renderer $\rightarrow$ Main Process qua IPC, TB4: Dữ liệu mạng $\rightarrow$ Service Worker & Cache, TB5: Tệp đóng góp $\rightarrow$ Google Apps Script).
* **Kết quả quét bí mật & lịch sử:** 0 mật khẩu/private key bị lộ. Có 1 Google Cloud API Key (chỉ có quyền đọc Sheets công khai) đang hardcode trong cấu hình mặc định và lịch sử commit ban đầu.
* **Kết quả chuỗi cung ứng (SLSA):** 0 phụ thuộc CDN ngoài (100% tự lưu trữ), 0 lỗ hổng trên gói production (3 cảnh báo `npm audit` chỉ thuộc về môi trường test `devDependencies`).
* **Tổng số phát hiện cần xử lý:** **11 phát hiện** (0 P0, 3 P1, 6 P2, 2 P3).

---

## 2. Bảng Tổng Hợp Lỗ Hổng & Phát Hiện (Xếp Theo Thứ Tự Ưu Tiên P0 → P3)

| Mã | Phân loại | Tên lỗ hổng / Phát hiện | Vị trí tệp & dòng | Điểm CVSS v3.1 | Mức độ | Công sức sửa | Rủi ro vỡ tính năng | Thứ tự đề xuất |
|:---:|:---|:---|:---|:---:|:---:|:---:|:---:|:---:|
| **CODE-01** | XSS | DOM XSS qua Game 2 (Catcher) prompt | `src/renderer/features/games/game2-catcher.ts:120` | **7.1** (High) | **P1** | Thấp (15m) | Rất thấp (Giữ nguyên DOM class & style) | **#1** |
| **CODE-02** | XSS | DOM XSS qua Game 3 (Shooter) prompt | `src/renderer/features/games/game3-shooter.ts:113` | **7.1** (High) | **P1** | Thấp (15m) | Rất thấp (Giữ nguyên DOM class & style) | **#2** |
| **CODE-04** | Desktop | Missing `setWindowOpenHandler` & `will-navigate` | `src/main/index.ts:14-26` | **7.4** (High) | **P1** | Thấp (20m) | Rất thấp (Mở link ngoài bằng trình duyệt mặc định) | **#3** |
| **CONF-01** | Cấu hình | CSP thiếu `object-src`, `base-uri`, `form-action` | `vite.config.ts:18`<br>`dist/index.html:4` | **6.5** (Medium) | **P2** | Thấp (15m) | Thấp (Cần kiểm tra tải ảnh/font) | **#4** |
| **CODE-08** | DoS / ReDoS | Unhandled SyntaxError DoS khi tìm kiếm $\ge 32,767$ ký tự | `src/renderer/services/dictionary.service.ts:45`<br>`index.html` | **5.3** (Medium) | **P2** | Thấp (20m) | Không (Thêm chặn max length 100 ký tự) | **#5** |
| **CODE-05** | IPC / Crash | Missing allowlist & type check trên `sheets:fetch` | `src/main/ipc-fetcher.ts:13-40` | **5.3** (Medium) | **P2** | Thấp (20m) | Không (Dùng enum `ALLOWED_RANGES`) | **#6** |
| **CODE-06** | Desktop | Quyền micro chưa kiểm tra origin người gọi | `src/main/index.ts:29-34` | **5.0** (Medium) | **P2** | Thấp (15m) | Không (Chỉ cấp quyền cho app origin) | **#7** |
| **CODE-07** | DoS / RAM | Thiếu giới hạn dung lượng file âm thanh tải lên | `src/renderer/features/contribute/contribute.ts:241, 364` | **5.3** (Medium) | **P2** | Thấp (20m) | Không (Giới hạn tối đa 10MB và định dạng audio) | **#8** |
| **CODE-03** | Injection | Lọc thực thể HTML chưa triệt để trong kết quả tìm kiếm | `src/renderer/features/home/home.ts:109` | **5.4** (Medium) | **P2** | Thấp (15m) | Không (Dùng `escapeHtml` chuẩn hoặc textContent) | **#9** |
| **SEC-01** | Bí mật | Hardcoded Google API Key fallback trong mã nguồn | `src/shared/constants/config.ts:6` | **5.3** (Medium) | **P2** | Trung bình (30m) | Thấp (Cần giữ fallback offline snapshot nếu không có key) | **#10** |
| **CONF-02** | Rò rỉ URL | Thiếu `<meta name="referrer">` bảo vệ tiêu đề HTTP | `index.html` | **3.7** (Low) | **P3** | Rất thấp (5m) | Không (strict-origin-when-cross-origin) | **#11** |

*(Ghi chú: Lỗ hổng lịch sử git **SEC-02** và phụ thuộc kiểm thử **SUP-01** được đề xuất phương án xử lý chi tiết tại Mục 4 mà không cần commit sửa đổi mã ứng dụng).*

---

## 3. Phân Tích Chi Tiết Từng Phát Hiện & Phương Án Sửa Chữa

### Nhóm 1: Các Phát Hiện Mức Cao (P1 - High Priority)

#### 1. CODE-01 & CODE-02: DOM XSS trong Game 2 (Catcher) và Game 3 (Shooter)
* **CWE:** CWE-79 (Cross-Site Scripting).
* **ASVS:** V5.3.3 (Output Encoding and Injection Mitigation).
* **CVSS v3.1:** 7.1 (`CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N`).
* **Bản chất lỗi:** Thuộc tính `${this.currentQuestion?.question || ''}` được nội suy trực tiếp vào chuỗi gán `this.container.innerHTML` tại dòng 120 (`game2-catcher.ts`) và dòng 113 (`game3-shooter.ts`). Khi dữ liệu từ điển đồng bộ chứa ký tự HTML, thẻ độc hại được dựng thẳng vào DOM.
* **Phương án sửa:**
  - Thay vì dùng chuỗi mẫu nội suy HTML, sử dụng `textContent` gán trực tiếp cho phần tử DOM mục tiêu:
    ```typescript
    const targetWordEl = this.container.querySelector('#catcherTargetWord');
    if (targetWordEl) {
        targetWordEl.textContent = this.currentQuestion?.question || '';
    }
    ```
  - Tương tự cho Game 3 Shooter (`#shooterTargetWord`).
* **Test kiểm chứng:** Bổ sung test case trong `tests/xss-security.test.ts` nạp câu hỏi chứa `<img src=x onerror=...>`, kiểm tra `querySelector('img')` là `null` và `textContent` hiển thị nguyên vẹn.

#### 2. CODE-04: Nguy cơ Điều Hướng & Cửa Sổ Ngoài trong Electron Main Process
* **CWE:** CWE-601 (URL Redirection to Untrusted Site), CWE-200 (Information Disclosure).
* **ASVS:** V14.2 (Desktop/Mobile Platform Security), Electron Security Guidelines Rule 13 & 14.
* **CVSS v3.1:** 7.4 (`CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:H/I:N/A:N`).
* **Bản chất lỗi:** Trong `src/main/index.ts`, cửa sổ `BrowserWindow` chưa thiết lập `setWindowOpenHandler` và sự kiện `will-navigate`. Bất kỳ liên kết nào mở cửa sổ mới (`window.open` hoặc `target="_blank"`) sẽ mở một BrowserWindow nội bộ thay vì điều hướng ra trình duyệt hệ thống.
* **Phương án sửa:**
  - Cấu hình `mainWindow.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });`
  - Chặn điều hướng ngoài: `mainWindow.webContents.on('will-navigate', (event, url) => { if (!isSafeAppUrl(url)) { event.preventDefault(); shell.openExternal(url); } });`
* **Test kiểm chứng:** Test mock Electron handler từ chối action mở cửa sổ và gọi `shell.openExternal`.

---

### Nhóm 2: Các Phát Hiện Mức Trung Bình (P2 - Medium Priority)

#### 3. CONF-01: Thắt Chặt Chính Sách An Ninh Nội Dung (CSP)
* **CWE:** CWE-94, CWE-610 (Base Tag Hijacking).
* **ASVS:** V14.4.3, V14.4.4.
* **CVSS v3.1:** 6.5.
* **Phương án sửa:**
  Cập nhật thẻ CSP trong `vite.config.ts:18` bổ sung:
  - `object-src 'none';` (vô hiệu hóa hoàn toàn plugin Flash/Java/ActiveX)
  - `base-uri 'self';` (ngăn ngừa Base Tag Hijacking)
  - `form-action 'self';` (ngăn ngừa điều hướng form sang trang ngoài)
  - Giới hạn `img-src 'self' data: https://*` về các domain cần thiết.
* **Test kiểm chứng:** Chạy `npm run build` và kiểm tra thẻ CSP trong `dist/index.html`.

#### 4. CODE-08: DoS / Unhandled SyntaxError do Chuỗi Tìm Kiếm Quá Lớn
* **CWE:** CWE-400 (Uncontrolled Resource Consumption), CWE-20.
* **ASVS:** V5.1 (Input Validation).
* **CVSS v3.1:** 5.3.
* **Phương án sửa:**
  1. Thêm chặn sớm trong [src/renderer/services/dictionary.service.ts](file:///c:/Users/umnuar/Downloads/tudien-main/src/renderer/services/dictionary.service.ts): nếu `rawKeyword.length > 100` thì trả về ngay `[]`.
  2. Bọc `try ... catch` quanh đoạn khởi tạo `new RegExp(...)` để đảm bảo không bao giờ ném ngoại lệ chưa xử lý.
  3. Bổ sung `maxlength="100"` trên thẻ `<input id="searchInput">` và `<input id="chatInput">`.
* **Test kiểm chứng:** Bổ sung unit test tìm kiếm với chuỗi $50,000$ ký tự, đảm bảo không sập ứng dụng và trả về kết quả rỗng một cách an toàn.

#### 5. CODE-05: Thiếu Kiểm Tra Ranh Giới Tham Số trong IPC `sheets:fetch`
* **CWE:** CWE-20 (Improper Input Validation).
* **ASVS:** V13.1.
* **CVSS v3.1:** 5.3.
* **Phương án sửa:**
  - Kiểm tra `typeof range === 'string'` ngay đầu handler.
  - Định nghĩa danh sách trắng `ALLOWED_RANGES = new Set(['Tudien!A2:E', 'Tracnghiem!A2:G', 'Chat!A2:D'])`.
  - Nếu `range` không nằm trong danh sách trắng, từ chối request với mã lỗi an toàn.
* **Test kiểm chứng:** Unit test gọi IPC với `null` hoặc range bất hợp pháp, xác nhận trả về lỗi mà không làm sập tiến trình.

#### 6. CODE-06: Xác Thực Nguồn Gốc Yêu Cầu Cấp Quyền Micro trong Electron
* **CWE:** CWE-250 (Execution with Unnecessary Privileges).
* **ASVS:** V14.2.
* **CVSS v3.1:** 5.0.
* **Phương án sửa:**
  Kiểm tra URL của webContents yêu cầu quyền: chỉ cấp quyền microphone nếu URL bắt đầu bằng `http://localhost:3000` (khi dev) hoặc scheme nội bộ của app, từ chối mọi frame/origin lạ.

#### 7. CODE-07: Giới Hạn Kích Thước & Định Dạng Tệp Âm Thanh Tải Lên (Contribute)
* **CWE:** CWE-400 (Resource Exhaustion).
* **ASVS:** V12.1.
* **CVSS v3.1:** 5.3.
* **Phương án sửa:**
  - Tại sự kiện chọn file (`audioFileInput` và `batchAudioInput`):
    - Kiểm tra `file.size <= 10 * 1024 * 1024` (tối đa 10MB). Nếu vượt quá, hiển thị thông báo lỗi `showToast('Tệp âm thanh không được vượt quá 10MB', 'error')` và reset input.
    - Kiểm tra `file.type.startsWith('audio/')` hoặc đuôi file hợp lệ (`.mp3`, `.m4a`, `.wav`, `.ogg`, `.webm`).
* **Test kiểm chứng:** Test chọn file giả lập 15MB, kiểm tra hệ thống từ chối và hiển thị thông báo lỗi thân thiện.

#### 8. CODE-03: Lọc Thực Thể HTML Đầy Đủ trong Giao Diện Tìm Kiếm
* **CWE:** CWE-116 (Improper Encoding or Escaping of Output).
* **ASVS:** V5.3.
* **CVSS v3.1:** 5.4.
* **Phương án sửa:**
  Thay vì `trimmed.replace(/</g, '&lt;')`, sử dụng phương thức tạo DOM chuẩn (`document.createElement('strong')` + `textContent = trimmed`) hoặc hàm `escapeHtml()` đầy đủ (mã hóa cả `&`, `<`, `>`, `"`, `'`).

#### 9. SEC-01: Quản Lý Khóa Google API Fallback Theo Nguyên Tắc Least Privilege
* **CWE:** CWE-798 (Use of Hard-coded Credentials).
* **CVSS v3.1:** 5.3.
* **Phương án sửa:**
  - Chuyển `API_KEY` mặc định thành chuỗi rỗng hoặc đọc từ biến môi trường `import.meta.env.VITE_GOOGLE_API_KEY || ''`.
  - Nếu không có API key: Ứng dụng tự động chuyển sang đọc snapshot ngoại tuyến (`vocab-snapshot.json`, `quiz-snapshot.json`, `chat-snapshot.json`) một cách mượt mà mà không báo lỗi hỏng cho người dùng.
  - Hướng dẫn cấu hình API Key trên Google Cloud Console: giới hạn quyền chỉ đọc Google Sheets API, gán hạn chế HTTP Referrer vào domain `https://*.hoctiengxodang.online`.

---

### Nhóm 3: Các Phát Hiện Mức Thấp & Cấu Hình Bổ Sung (P3 - Low)

#### 10. CONF-02: Bổ Sung Meta Tag Referrer Policy
* **CWE:** CWE-200.
* **CVSS v3.1:** 3.7.
* **Phương án sửa:** Thêm `<meta name="referrer" content="strict-origin-when-cross-origin">` vào thẻ `<head>` của `index.html`.

---

## 4. Các Vấn Đề Lịch Sử & Chuỗi Cung Ứng (Không Sửa Vào Mã Nguồn Ứng Dụng)

1. **SEC-02: Lịch sử Git chứa API Key cũ (Commit `d98f5c3`):**
   * *Đánh giá:* Việc chạy `git filter-repo` để viết lại lịch sử git sẽ làm thay đổi mã SHA của toàn bộ commit trong repo, gây xung đột nếu các lập trình viên khác đang kéo nhánh về.
   * *Khuyến nghị an toàn (Senior Dev Mindset):* Thay vì viết lại git history, chủ dự án chỉ cần truy cập **Google Cloud Console**, vô hiệu hóa (revoke/delete) key cũ, tạo key mới và bật hạn chế **HTTP Referrer Restriction** (chỉ cho phép gọi từ domain của dự án).
2. **SUP-01: Cảnh báo `npm audit` trong `happy-dom` và `@vitest/mocker`:**
   * *Đánh giá:* Cả hai gói này đều là `devDependencies`, chỉ chạy khi chạy lệnh `npm test` trên máy lập trình viên. Bản build xuất xưởng (`dist/`) hoàn toàn không chứa mã nguồn của chúng.
   * *Khuyến nghị:* Cập nhật gói thử nghiệm lên phiên bản vá khi có bản phát hành ổn định tiếp theo mà không làm ảnh hưởng đến mã nguồn chính.

---

## 5. Quy Trình & Kế Hoạch Sửa Lỗi Bước 7 (Sau Khi Được Duyệt)

Tuân thủ nghiêm ngặt quy tắc P0 của dự án:
1. **Mỗi phát hiện đúng một commit:** Thực hiện theo thứ tự ưu tiên P1 $\rightarrow$ P2 $\rightarrow$ P3.
2. **Kèm theo test hồi quy:** Mỗi commit sửa lỗi bắt buộc đi kèm kiểm thử đơn vị chứng minh lỗi cũ đã hết và không thể tái diễn.
3. **Cổng chất lượng từng commit:** Sau mỗi commit, chạy `npm test` (đảm bảo 100% test xanh) và `npm run build` (đảm bảo build production không lỗi).
4. **Không đổi giao diện hay hành vi ngoài phạm vi bảo mật.**

---

## 6. Đánh Giá Gate Bước 6: [PASS]

* [x] **Tài liệu tổng hợp `docs/security/06-report.md` đã được khởi tạo đầy đủ.**
* [x] **Mọi phát hiện đều được phân loại P0–P3, tính điểm CVSS, ước tính công sức và đánh giá rủi ro.**
* [x] **Kế hoạch sửa lỗi và kiểm chứng được vạch ra chi tiết theo thứ tự ưu tiên.**
* [x] **DỪNG LẠI TẠI CỔNG DUYỆT:** Chưa thực hiện bất kỳ sửa đổi nào trên mã nguồn ứng dụng, chờ lệnh phê duyệt từ người dùng.
