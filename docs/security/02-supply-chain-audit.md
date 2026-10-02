# 📦 Báo Cáo Rà Soát Chuỗi Cung Ứng & Phụ Thuộc (Supply Chain & Dependencies Audit)
**Dự án:** Từ Điển Xơ Đăng - Việt (Web PWA & Electron Desktop)  
**Tài liệu:** `docs/security/02-supply-chain-audit.md`  
**Phiên bản:** 1.0.0 (Bước 2 - Security Hardening)  
**Chuẩn tham chiếu:** SLSA (Supply-chain Levels for Software Artifacts v1.0), NIST SSDF (SP 800-218), OWASP Top 10 (A06:2021 – Vulnerable and Outdated Components), 007 Supply Chain Shield.

---

## 1. Phương Pháp & Phạm Vi Rà Soát (Audit Methodology)

Rà soát toàn diện chuỗi cung ứng phần mềm theo 6 khía cạnh:
1. **Kiểm kê cây phụ thuộc (Dependency Tree):** Phân định rõ ràng giữa phụ thuộc thực thi môi trường production (`dependencies`) và phụ thuộc môi trường phát triển/kiểm thử (`devDependencies`).
2. **Quét cơ sở dữ liệu lỗ hổng (Vulnerability Scanning):** Quét qua `npm audit` đối chiếu với GitHub Advisory Database và chuẩn CVE/CWE.
3. **Tính toàn vẹn của Lockfile (Lockfile Integrity):** Kiểm tra `package-lock.json` (phiên bản lockfile, SHA-512 cryptographic hashes).
4. **Kịch bản cài đặt tự động (Install Scripts Audit):** Rà soát các hook `preinstall`, `install`, `postinstall` để phát hiện mã độc nhúng vào quá trình cài đặt.
5. **Rà soát CDN & Tính toàn vẹn tài nguyên (CDN & SRI):** Kiểm tra các liên kết tài nguyên từ bên thứ ba (Script, CSS, Font).
6. **Đánh giá cấp độ an toàn chuỗi cung ứng theo SLSA:** Đánh giá tính minh bạch và khả năng tái lập quy trình build.

---

## 2. Kết Quả Kiểm Kê Phụ Thuộc (Dependency Inventory)

### 2.1 Cấu hình trong `package.json`
* **Runtime Dependencies (`dependencies`):** **0 gói (Zero Library Bloat)**.
  Toàn bộ mã nguồn chạy trên trình duyệt là Vanilla TypeScript thuần được Vite biên dịch sang JavaScript tiêu chuẩn. Không có bất kỳ thư viện UI, tiện ích lodash, hay jQuery bên ngoài nào.
* **Development Dependencies (`devDependencies`):** **5 gói chính thức:**
  * `typescript`: `^5.7.3` (Trình biên dịch mã nguồn của Microsoft).
  * `vite`: `^6.2.0` (Công cụ đóng gói và máy chủ dev của Evan You).
  * `vite-plugin-pwa`: `^0.21.1` (Plugin tạo service worker PWA của Anthony Fu).
  * `vitest`: `^3.0.5` (Khung chạy kiểm thử tự động).
  * `happy-dom`: `^17.1.0` (Giả lập môi trường trình duyệt cho Vitest).
* **Tổng số gói phụ thuộc trong cây (Dependency Graph):** 420 gói (gồm các thư viện con của Vite, Vitest, Rollup, esbuild).

---

## 3. Bảng Tổng Hợp Lỗ Hổng Phụ Thuộc (Vulnerability Report)

| ID Lỗ Hổng | Tên Gói | Phiên bản hiện tại | Mức độ CVE / GHSA | CWE | CVSS v3.1 | Khả năng khai thác thực tế trong dự án | Phiên bản khắc phục |
|:---|:---|:---:|:---:|:---:|:---:|:---|:---:|
| **GHSA-37j7-fg3j-429f** | `happy-dom` | `17.1.0` | **Critical (Nghiêm trọng)** | CWE-94 (Code Injection) | Điểm 0 (Cơ sở) | **Cực thấp (Chỉ trong test runner cục bộ):** Lỗ hổng VM Context Escape chỉ kích hoạt khi test runner nạp đoạn script của bên thứ ba độc hại. Toàn bộ test trong repo chỉ nạp hàm nội bộ. | `20.14.5` (Major upgrade) |
| **GHSA-w4gp-fjgq-3q4g** | `happy-dom` | `17.1.0` | **High (Cao)** | CWE-201 (Info Exposure) | 7.5 | **Không thể khai thác:** Ứng dụng không sử dụng cookie hay xác thực cross-origin trong bài test nào. | `20.14.5` (Major upgrade) |
| **GHSA-6q6h-j7hj-3r64** | `happy-dom` | `17.1.0` | **High (Cao)** | CWE-94 (Code Injection) | 8.8 | **Không thể khai thác:** Test không biên dịch module ECMAScript động từ nguồn lạ. | `20.14.5` (Major upgrade) |
| **GHSA-82fw-gwwq-j7x9** | `@vitest/mocker`<br>(qua `vitest`) | `3.0.5` | **Moderate (Trung bình)** | CWE-22 (Path Traversal) | 5.9 | **Không thể khai thác:** Dự án không sử dụng tính năng redirect mocking với đường dẫn động trong các bài test. | `5.0.3` (Major upgrade) |

---

## 4. Rà Soát Chi Tiết Chuỗi Cung Ứng (Supply Chain Deep Dive)

### 4.1 Rà soát Install Scripts (`hasInstallScript`)
Kiểm tra toàn bộ 420 gói trong `package-lock.json`, chỉ phát hiện **2 gói** có chạy script trong quá trình cài đặt:
1. `node_modules/esbuild`: Tải binary biên dịch gốc phù hợp với hệ điều hành (Windows/macOS/Linux). Đây là hành vi chuẩn mực và tin cậy của esbuild.
2. `node_modules/fsevents`: Thư viện quan sát tệp tin tùy chọn cho macOS.
* **Kết luận:** **Không có postinstall script độc hại**, không có script gửi dữ liệu ra mạng ngoài lúc `npm install`.

### 4.2 Rà soát Typosquatting & Gói bỏ hoang (Abandoned Packages)
* Toàn bộ 5 gói trực tiếp đều thuộc các tổ chức mã nguồn mở uy tín nhất trong hệ sinh thái JavaScript (Microsoft, Vite Team, Vitest Team).
* Không phát hiện dấu hiệu của kỹ thuật bắt chước tên gói (Typosquatting) hay gói bị chiếm quyền (Account Takeover).

### 4.3 Rà soát CDN & Subresource Integrity (SRI)
* **Kết quả:** **100% tài nguyên đã được tự lưu trữ (Self-hosted)**:
  * FontAwesome: Đọc từ `/fonts/fontawesome/all.min.css` và webfonts `.woff2` cục bộ.
  * Plus Jakarta Sans: Đọc từ `/fonts/jakarta/jakarta.css` và tệp `.woff2` cục bộ.
  * Scripts & Styles: Vite đóng gói và băm nội dung theo chuẩn Content-Hashed (`assets/main-[hash].js`).
* **Kết luận:** Dự án hoàn toàn độc lập với các mạng CDN công cộng (Cloudflare, cdnjs, unpkg, jsdelivr). Triệt tiêu 100% rủi ro bị tấn công chuỗi cung ứng qua CDN (CDN Poisoning).

### 4.4 Đánh giá cấp độ an toàn SLSA (Supply-chain Levels)
* **Hiện trạng:**
  * Định nghĩa bản build có trong mã nguồn (`package.json`, `vite.config.ts`) $\rightarrow$ **Đạt SLSA Level 1**.
  * Dự án chưa có quy trình CI/CD tự động (`.github/workflows`) có chữ ký chứng thực nguồn gốc (Provenance Attestations) $\rightarrow$ Chưa đạt SLSA Level 2/3.
* **Khuyến nghị:** Ở Bước 9, đề xuất bổ sung GitHub Actions chạy kiểm tra tự động và ghim cố định phiên bản runner.

---

## 5. Đánh Giá Khả Năng Khai Thác Thực Tế & Lộ Trình Nâng Cấp An Toàn

> [!NOTE]
> **Nhận định quan trọng về bối cảnh bảo mật:**
> Các lỗ hổng được `npm audit` báo cáo đều nằm trong **`devDependencies` (happy-dom và vitest)**.
> Khi người dùng truy cập trang web `https://hoctiengxodang.online/` hoặc mở ứng dụng Electron đóng gói:
> * Bản build `dist/` **HOÀN TOÀN KHÔNG CHỨA** `happy-dom` hay `vitest`.
> * Do đó, người dùng cuối và ứng dụng production **KHÔNG BỊ ẢNH HƯỞNG** bởi các lỗ hổng này.
> * Rủi ro chỉ phát sinh nếu máy lập trình viên chạy test với các tệp test fixture do kẻ tấn công bên ngoài cung cấp.

### Lộ trình nâng cấp an toàn đề xuất (Chờ duyệt ở Bước 6):
1. **Không chạy `npm audit fix --force`:**
   Lệnh này sẽ tự động ép nâng cấp `vitest` lên 5.0.3 và `happy-dom` lên 20.14.5. Vì đây là các bản nâng cấp phiên bản chính (Major release), nguy cơ phá vỡ 13 test suites hiện tại là rất cao.
2. **Phương án thử nghiệm có kiểm soát (Thực hiện tại Bước 7):**
   * Giữ nguyên `vitest` ở dòng 3.x ổn định (hoặc bản vá minor 3.2.x mới nhất).
   * Tạo nhánh thử nghiệm riêng để kiểm tra nâng cấp `happy-dom` lên v20, chạy `npm test` để xác minh tương thích trước khi merge.
   * Nếu có xung đột cú pháp test, duy trì phiên bản hiện tại kèm ghi chú chấp nhận rủi ro môi trường dev (Risk Acceptance).

---

## 6. Tiêu Chí Nghiệm Thu Cổng (Gate Bước 2 Checklist)

* [x] **Danh sách phụ thuộc có lỗ hổng được lập đầy đủ:** 3 lỗ hổng trong `happy-dom` và 1 trong `@vitest/mocker`.
* [x] **Đánh giá khả năng khai thác thực tế:** Đã chứng minh 100% lỗ hổng chỉ thuộc môi trường test cục bộ, không lọt vào sản phẩm production.
* [x] **Rà soát install scripts:** Không có mã độc postinstall (chỉ có esbuild và fsevents).
* [x] **Rà soát CDN & SRI:** Xác nhận 100% self-hosted, không phụ thuộc CDN ngoài.
* [x] **Tuân thủ Gate Phụ Thuộc (P0 Rule 1.5 & 7.6):** Không tự ý cài đặt hay cập nhật bất kỳ gói nào khi chưa được duyệt.
* [x] **Có phương án nâng cấp an toàn có kiểm soát.**
