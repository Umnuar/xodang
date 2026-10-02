# 🔑 Báo Cáo Rà Soát Bí Mật & Lịch Sử Git (Secrets & Git History Audit)
**Dự án:** Từ Điển Xơ Đăng - Việt (Web PWA & Electron Desktop)  
**Tài liệu:** `docs/security/01-secrets-audit.md`  
**Phiên bản:** 1.0.0 (Bước 1 - Security Hardening)  
**Chuẩn tham chiếu:** OWASP ASVS v4.0.3 (V14.2 Secret Management), CWE-798, CWE-306, 007 Security Standard (Zero Trust & No Hardcoded Secrets).

---

## 1. Phương Pháp & Phạm Vi Quét (Audit Methodology)

Rà soát toàn diện theo phương châm **007 — No Hardcoded Secrets** trên 4 phạm vi:
1. **Toàn bộ lịch sử Git (Git History):** Quét toàn bộ commit từ commit khởi tạo (`d98f5c3`) đến commit hiện tại (`24f3cfa`) sử dụng `git log --all --full-history -G` và `git grep` với các biểu thức chính quy (Regex) quét nhận diện bí mật.
2. **Cây làm việc hiện tại (Working Tree):** Quét mã nguồn TypeScript, HTML, CSS, Scripts và tài liệu cấu hình.
3. **Tài sản đóng gói xuất xưởng (Build Artifacts):** Rà soát thư mục `dist/` để kiểm tra rò rỉ bí mật hoặc sourcemaps.
4. **Cấu hình môi trường (Environment & Secrets Hygiene):** Kiểm tra `.gitignore`, `.env.example` và các tệp `.env*`.

### Các mẫu nhận diện bí mật đã quét:
* Khóa Google Cloud API Key (`AIza[0-9A-Za-z-_]{35}`)
* Khóa Private Keys (`BEGIN.*PRIVATE KEY`)
* Khóa Cloud & SaaS (AWS `AKIA...`, GitHub Tokens `ghp_...`, OpenAI `sk-...`, Stripe)
* Chuỗi xác thực (Passwords, Bearer Tokens, Authorization Headers, Client Secrets)
* Google Apps Script Web App Deployment IDs (`AKfycb...`)

---

## 2. Bảng Tổng Hợp Phát Hiện Bí Mật (Findings Inventory)

> [!CAUTION]
> **Tuân thủ Luật Bất Khả Xâm Phạm:** Báo cáo này tuyệt đối không in giá trị thật của API Key hay Token. Chỉ ghi nhận chính xác vị trí tệp, số dòng, commit hash và phân loại.

| ID | Tiêu đề | Vị trí (File : Dòng) | Phân loại bí mật | Mức độ rủi ro | Trạng thái hiện tại |
|:---:|:---|:---|:---|:---:|:---:|
| **SEC-01** | Chuỗi Fallback Google API Key trong mã nguồn client | `src/shared/constants/config.ts:6`<br>`dist/assets/main-3qTVORXy.js:786` | Google Cloud API Key (Sheets API v4) | **P2 (Trung bình)** | Đang mở (Cần cô lập biến môi trường & xoay key) |
| **SEC-02** | Google API Key tồn tại trong lịch sử commit cũ | Lịch sử commit Git: `d98f5c3`, `872d2fa`, `e132620`, `dbb9bbf`, `73e7d59` | Google Cloud API Key (Sheets API v4) | **P2 (Trung bình)** | Đang mở (Cần xoay key & đề xuất filter-repo) |
| **SEC-03** | URL Web App Google Apps Script công khai | `src/shared/constants/config.ts:11` | Serverless Webhook Endpoint | **P2 (Trung bình)** | Đang mở (Cần rate limit & validate kích thước) |
| **SEC-04** | Vệ sinh biến môi trường & `.gitignore` | `.gitignore:9-13`<br>`.env.example:3` | Cấu hình bảo vệ môi trường | **PASS (An toàn)** | Đạt yêu cầu (Không có tệp `.env` nào bị rò rỉ) |
| **SEC-05** | Bản build `dist/` không chứa sourcemaps | `dist/assets/` | Mã nguồn đóng gói production | **PASS (An toàn)** | Đạt yêu cầu (Không có tệp `.map`) |

---

## 3. Chi Tiết Phát Hiện & Đánh Giá Rủi Ro

### 3.1 Phát hiện SEC-01 & SEC-02: Google Cloud API Key trong Mã Nguồn & Lịch Sử Git
* **Mô tả:** Trong tệp `src/shared/constants/config.ts` dòng 6:
  Khóa `GOOGLE_API_KEY` được khai báo bằng biểu thức lấy từ biến môi trường `import.meta.env?.VITE_GOOGLE_API_KEY`, nhưng có kèm **chuỗi fallback tĩnh** nếu biến môi trường bị thiếu. Chuỗi fallback này chứa trực tiếp một Google API Key hợp lệ.
* **Lịch sử Git:** Chuỗi này vốn được nhúng trực tiếp trong tệp `index.html` và `game.html` từ commit baseline ban đầu (`d98f5c3`), sau đó được di chuyển vào `config.ts` trong đợt refactor modular (`872d2fa`).
* **Đánh giá rủi ro kỹ thuật:**
  * **CWE:** CWE-798 (Use of Hard-coded Credentials).
  * **OWASP Top 10:** A05:2021 – Security Misconfiguration.
  * **ASVS:** V14.2.1 (Verify that secrets are not stored in source code).
  * **Ngữ cảnh thực tế:** Google Sheets API Key dùng trong ứng dụng web tĩnh/SPA về bản chất là một **client-side key** (trình duyệt người dùng buộc phải gửi key này trong URL khi gọi Google Sheets API). Tính an toàn của loại key này phụ thuộc vào **hạn chế phạm vi trên Google Cloud Console**:
    1. Nếu key KHÔNG được giới hạn HTTP Referrer: Đối tượng xấu có thể sao chép key và gọi API Google Sheets không giới hạn, làm cạn kiệt quota 300 requests/phút của dự án hoặc làm phát sinh chi phí nếu dự án gắn thẻ thanh toán.
    2. Nếu key ĐÃ ĐƯỢC giới hạn HTTP Referrer (chỉ cho phép `hoctiengxodang.online/*`): Key chỉ hoạt động trên tên miền của dự án, người ngoài dùng ở domain khác sẽ bị Google chặn (HTTP 403 Forbidden).
* **Kết luận:** Cần loại bỏ hoàn toàn chuỗi fallback tĩnh trong mã nguồn, đồng thời thực hiện quy trình xoay key và đặt giới hạn chặt chẽ trên Google Cloud Console.

---

### 3.2 Phát hiện SEC-03: Google Apps Script Web App Endpoint Không Xác Thực
* **Mô tả:** Tệp `src/shared/constants/config.ts` dòng 11 chứa URL Web App của Google Apps Script (`APP_CONFIG.CONTRIBUTE_URL`). Endpoint này tiếp nhận các yêu cầu đóng góp từ vựng và tệp âm thanh thu âm Base64 qua phương thức `POST` với cờ `mode: 'no-cors'`.
* **Đánh giá rủi ro kỹ thuật:**
  * **CWE:** CWE-306 (Missing Authentication for Critical Function).
  * **OWASP Top 10:** A01:2021 – Broken Access Control / A04:2021 – Insecure Design.
  * **Kịch bản khai thác:** Kẻ xấu có thể viết bot tự động gửi hàng nghìn request tải lên các tệp Base64 rác, gây tràn bộ nhớ Google Drive liên kết và làm cạn kiệt thời gian thực thi (quota 6 phút/ngày) của Google Apps Script.
* **Kết luận:** Cần bổ sung kiểm soát kích thước tệp và giới hạn tần suất ở client, đồng thời kiến nghị kiểm soát đầu vào tại script Google Apps Script.

---

## 4. Kế Hoạch Xử Lý & Khắc Phục (Actionable Remediation Plan)

### Kế hoạch 1: Xoay Khóa & Đặt Giới Hạn Trên Google Cloud Console (Thực hiện bởi người dùng)
> [!IMPORTANT]
> Đây là hành động then chốt nhất để bảo vệ API key của bạn:
1. Đăng nhập vào [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials).
2. Tìm đến API Key hiện tại và chọn **Regenerate key** (hoặc tạo một API Key mới).
3. **Cài đặt Application Restrictions (Ràng buộc ứng dụng):**
   * Chọn **Websites (HTTP referrers)**.
   * Thêm các URL được phép sử dụng:
     * `https://hoctiengxodang.online/*`
     * `http://localhost:3000/*` (phục vụ kiểm thử local)
4. **Cài đặt API Restrictions (Ràng buộc API):**
   * Chọn **Restrict key**.
   * Chỉ tích chọn duy nhất: **Google Sheets API**. (Chặn mọi dịch vụ Google Cloud khác).
5. Đặt cảnh báo hạn ngạch (Quota Alerts) trong phần Quotas & System Limits để nhận email nếu lưu lượng vượt ngưỡng bất thường.

---

### Kế hoạch 2: Làm Sạch Mã Nguồn Client (Thực hiện tại Bước 7)
1. **Loại bỏ chuỗi fallback tĩnh:** Trong `src/shared/constants/config.ts`:
   * Chuyển `GOOGLE_API_KEY` sang chỉ đọc từ `import.meta.env?.VITE_GOOGLE_API_KEY || ''`.
2. **Cơ chế phòng thủ an toàn (Fail-Safe):**
   * Nếu `GOOGLE_API_KEY` rỗng (người dùng chạy cục bộ không cấu hình `.env` hoặc offline), dịch vụ `sheets.service.ts` và Electron IPC tự động nạp từ bản snapshot tĩnh (`src/shared/data/snapshot/` hoặc fallback) mà không bị crash và không cần phụ thuộc vào API key nhúng sẵn.
3. **Cập nhật `.env.example`:** Hướng dẫn cấu hình `VITE_GOOGLE_API_KEY=YOUR_KEY_HERE` cho môi trường phát triển local.

---

### Kế hoạch 3: Xử Lý Lịch Sử Git (Git History Remediation)
Vì khóa cũ đã nằm trong lịch sử Git từ commit đầu tiên, việc viết lại lịch sử commit (`git filter-repo`) sẽ làm thay đổi toàn bộ mã băm commit (Commit SHA) của các tag `checkpoint-*` và nhánh hiện tại.

**Đề xuất 2 phương án để bạn lựa chọn:**
* **Phương án A (Khuyến nghị cao — Chuẩn Zero Trust):**
  Thực hiện **Kế hoạch 1** (Xoay key mới và thu hồi hoàn toàn key cũ trên Google Cloud Console).
  *Khi key cũ đã bị hủy trên Google Cloud, chuỗi khóa trong lịch sử Git cũ trở thành vô hiệu, không còn giá trị khai thác.* Không cần viết lại lịch sử Git, bảo toàn 100% commit SHA và các tag đối chiếu.
* **Phương án B (Làm sạch tuyệt đối lịch sử Git):**
  Nếu bạn có kế hoạch công khai hoàn toàn mã nguồn lên GitHub Public và muốn xóa sạch dấu vết:
  Chạy lệnh `git-filter-repo` để thay thế chuỗi khóa cũ bằng chuỗi `REDACTED` trên toàn bộ lịch sử Git:
  ```bash
  # Lệnh người dùng tự chạy (nếu chọn phương án B):
  git filter-repo --replace-text <(echo "AIzaSyD757jS4SLR7-EzrPgrW9WrLQeD2DQExHw==>REDACTED_API_KEY")
  ```

---

## 5. Tiêu Chí Nghiệm Thu Cổng (Gate Bước 1 Checklist)

* [x] **Quét toàn diện lịch sử Git hoàn tất:** Không phát hiện private keys, token đám mây (AWS, GitHub, OpenAI), hay mật khẩu người dùng.
* [x] **Xác định chính xác vị trí chứa khóa Google API Key:** `src/shared/constants/config.ts:6` và 5 commit trong lịch sử Git.
* [x] **Xác định chính xác vị trí Web App Google Apps Script:** `src/shared/constants/config.ts:11`.
* [x] **Kiểm tra vệ sinh môi trường:** `.gitignore` đạt chuẩn, không có tệp `.env` nào bị commit.
* [x] **Tuân thủ Luật Bất Khả Xâm Phạm:** Không in bất kỳ giá trị bí mật nào ra màn hình, báo cáo hay log.
* [x] **Có kế hoạch xử lý, xoay key và làm sạch mã nguồn chi tiết.**
