<div align="center">

# Chính Sách Bảo Mật (Security Policy)
### *Tiêu Chuẩn An Toàn Mã Nguồn, Phòng Vệ Kiến Trúc & Quy Trình Tiết Lộ Lỗ Hổng*

[![Security Policy](https://img.shields.io/badge/Security_Policy-Active-22c55e?style=flat-square&logo=shield)](https://github.com/Umnuar/xodang/security)
[![Private Reporting](https://img.shields.io/badge/Reporting-GitHub_Private_Advisory-3b82f6?style=flat-square&logo=github)](https://github.com/Umnuar/xodang/security/advisories/new)
[![Severity Standard](https://img.shields.io/badge/Severity-CVSS_v3.1-6366f1?style=flat-square)](https://www.first.org/cvss/)

[English](SECURITY.en.md) • **Tiếng Việt** • **[Gửi Báo Cáo Riêng Tư](https://github.com/Umnuar/xodang/security/advisories/new)**

</div>

---

Dự án **Từ Điển Xơ Đăng – Tiếng Việt** (`tudien-xedang`) cam kết bảo vệ dữ liệu ngôn ngữ cộng đồng và an toàn của người dùng cuối theo thực hành **OWASP ASVS** cho ứng dụng Web PWA và dịch vụ phụ trợ Rust.

---

## 1. Phiên bản được hỗ trợ (Supported Versions)

| Phiên bản | Hỗ trợ bảo mật | Phạm vi phát hành | Chính sách xử lý |
| :---: | :---: | :--- | :--- |
| **10.0.x** | Có | Web PWA chính thức + Rust Audio Tooling & Contribute Gateway (`services/contribute-api`) | Vá lỗi P0/P1 khẩn cấp qua bản phát hành chính thức |
| **< 10.0.0** | Không | Phiên bản legacy cũ | Ngừng hỗ trợ; khuyến nghị nâng cấp lên nhánh `main` mới nhất |

---

## 2. Quy trình báo cáo lỗ hổng (Responsible Disclosure)

### Kênh tiếp nhận ưu tiên
Vui lòng báo cáo riêng tư thông qua tính năng **GitHub Private Security Advisory**:
- **[Tạo Security Advisory riêng tư](https://github.com/Umnuar/xodang/security/advisories/new)**

> [!WARNING]
> **Không** mở Issue công khai, Pull Request hoặc đăng tải PoC khai thác công khai trước khi bản vá được kiểm chứng và phát hành.

### Thông tin cần đính kèm
1. **Phân loại vấn đề:** Mã CWE / OWASP (ví dụ: `CWE-79` XSS, `CWE-434` Unrestricted Upload, `CWE-22` Path Traversal).
2. **Thành phần ảnh hưởng:** Đường dẫn tệp hoặc phân hệ (`src/renderer/*`, `service-worker.ts`, `services/contribute-api/*`, CI/CD).
3. **Các bước tái hiện (PoC):** Kịch bản tối thiểu, không tác động lên dữ liệu thật hoặc làm gián đoạn dịch vụ công cộng.
4. **Mức độ nghiêm trọng đề xuất:** Ước lượng theo thang điểm **CVSS v3.1** kèm điều kiện khai thác.

### Cam kết thiện chí (Safe Harbor)
Nhóm phát triển không khởi kiện hoặc truy cứu đối với các nghiên cứu bảo mật tuân thủ nguyên tắc thiện chí: không khai thác phá hoại dữ liệu, không thử tải DDoS diện rộng, không truy cập dữ liệu riêng tư của người dùng khác và cho phép thời gian hợp lý để vá lỗi trước khi công bố.

### Ngoài phạm vi (Out of Scope)
- Khóa API Google Sheets chỉ-đọc công khai trên trình duyệt vốn được giới hạn bởi HTTP Referrer (`https://umnuar.github.io/xodang/*`) theo thiết kế của Google Sheets API phía client.
- Lỗ hổng chỉ phát sinh trên trình duyệt quá cũ không hỗ trợ Web Crypto / ES2022 / `CacheStorage`.
- Thử nghiệm spam/từ chối dịch vụ (DoS/DDoS) vào GitHub Pages hoặc Google Apps Script.

---

## 3. Thời gian phản hồi mục tiêu (SLA)

| Mức độ (CVSS v3.1) | Điểm | Xác nhận tiếp nhận | Mục tiêu phát hành bản vá |
| :--- | :---: | :---: | :--- |
| **Critical** | 9.0 – 10.0 | ≤ 24 giờ | ≤ 48 giờ |
| **High** | 7.0 – 8.9 | ≤ 48 giờ | ≤ 72 giờ |
| **Medium** | 4.0 – 6.9 | ≤ 72 giờ | Chu kỳ 7–14 ngày |
| **Low** | 0.1 – 3.9 | ≤ 5 ngày | Bản phát hành kế tiếp |

---

## 4. Mô hình phòng vệ kiến trúc đã triển khai

### 4.1. An toàn chuỗi cung ứng (Supply Chain Defense)
- **Zero Runtime Dependencies phía trình duyệt:** [package.json](package.json) không chứa thư viện `dependencies` nào; toàn bộ logic web là TypeScript thuần, loại bỏ nguy cơ chèn mã qua gói npm runtime bên thứ ba.
- **Lockfile cố định:** Cài đặt bằng `npm ci` với [package-lock.json](package-lock.json) và Cargo lockfiles (`Cargo.lock`) cho công cụ Rust.

### 4.2. Content Security Policy (CSP) & Referrer Hardening
- Cấu hình build trong [vite.config.ts](vite.config.ts) tự động chèn `<meta http-equiv="Content-Security-Policy">` vào `dist/index.html`:
  - `default-src 'self'`, `script-src 'self'`, `frame-src 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`.
  - `connect-src` giới hạn rõ nguồn gốc hợp lệ (`'self'`, `https://sheets.googleapis.com`, `https://script.google.com`, `https://script.googleusercontent.com` và origin của `VITE_CONTRIBUTE_API_URL` nếu cấu hình).
- [index.html](index.html) khai báo `<meta name="referrer" content="strict-origin-when-cross-origin">`.

### 4.3. Phòng chống XSS phía Client
- Toàn bộ kết quả tra cứu, câu trả lời chatbot, bảng xếp hạng, huy hiệu, chứng chỉ và hàng đợi đóng góp được render bằng DOM API an toàn (`document.createElement` + `textContent`) thay vì nội suy trực tiếp chuỗi chưa làm sạch vào `innerHTML`.
- Được kiểm thử hồi quy bắt buộc trong [tests/xss-security.test.ts](tests/xss-security.test.ts).

### 4.4. Bảo vệ dữ liệu lưu trữ & Private Mode
- Toàn bộ thao tác `localStorage` được tập trung qua [src/renderer/services/storage.service.ts](src/renderer/services/storage.service.ts) với xử lý an toàn khi gặp `SecurityError`, `QuotaExceededError` hoặc JSON hỏng ([tests/legacy-storage.test.ts](tests/legacy-storage.test.ts)).
- Không dùng fallback secret hardcode trong mã nguồn ([tests/smoke.test.ts](tests/smoke.test.ts)); toàn bộ tệp `.env*` bị chặn qua [.gitignore](.gitignore).

### 4.5. Cách ly Service Worker Cache
- [src/renderer/service-worker.ts](src/renderer/service-worker.ts) chỉ cache tài nguyên `same-origin` và thư mục audio; thực hiện dọn sạch cache phiên bản cũ khi kích hoạt (`tudien-modular-v10.0.4`) nhưng bảo toàn kho âm thanh `tudien-audio`.
- Tệp gói lớn `/audio-pack.bin` và bảng chỉ mục `/audio-pack.index.json` bỏ qua bộ đệm SW để tránh nhân đôi dung lượng lưu trữ và bảo đảm kiểm tra hash phiên bản luôn chính xác từ mạng ([tests/service-worker.test.ts](tests/service-worker.test.ts)).

### 4.6. Hardening cho Rust Axum Contribute Gateway (`services/contribute-api`)
Khi triển khai backend tùy chọn [services/contribute-api](services/contribute-api/):
- **Giới hạn kích thước cứng:** Từ chối payload vượt `MAX_UPLOAD_BYTES` (`10 MB` mặc định) với HTTP `413`.
- **Kiểm tra Magic Bytes thực tế:** Không tin phần mở rộng hay `Content-Type`; chỉ chấp nhận binary khớp chữ ký WebM (`1A 45 DF A3`), MP4/M4A (`ftyp`), OGG (`OggS`), MP3 (`ID3` / frame sync), WAV (`RIFF....WAVE`) hoặc FLAC (`fLaC`) — trả `415` cho tệp giả mạo HTML/EXE/script.
- **Chống Path Traversal:** Làm sạch toàn bộ ký tự điều hướng `/` / `\` / `..` trong tên tệp trước khi lưu đĩa.
- **Rate Limit & CORS:** Giới hạn tần suất theo IP (`429`), danh sách `ALLOWED_ORIGINS` cấu hình qua biến môi trường, và chạy trong Docker container bằng user không có quyền root (`appuser`).

---

## 5. Quy trình xoay khóa khẩn cấp (Key Rotation)

Khi nghi ngờ lộ khóa Google Sheets API hoặc biến môi trường triển khai:
1. Vô hiệu hóa khóa cũ ngay lập tức trong Google Cloud Console.
2. Tạo khóa mới với quyền tối thiểu (Read-only Sheets API) và khóa chặt HTTP Referrer theo tên miền chính thức.
3. Cập nhật giá trị `VITE_GOOGLE_API_KEY` trong GitHub Repository Secrets và chạy lại workflow triển khai.
4. Rà soát nhật ký hạn ngạch (quota/metrics) trên Cloud Console để phát hiện truy vấn bất thường.

---

<div align="center">
  <sub>An toàn hệ thống là nền tảng để bảo tồn tri thức ngôn ngữ lâu dài.</sub>
</div>
