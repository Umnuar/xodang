# Chính Sách Bảo Mật (Security Policy)

[English](#security-policy-en) | [Tiếng Việt](#chính-sách-bảo-mật-vi)

---

<a name="chính-sách-bảo-mật-vi"></a>
## Chính sách bảo mật (Tiếng Việt)

Tài liệu này xác định phạm vi phiên bản được hỗ trợ, mô hình phòng vệ kiến trúc và quy trình báo cáo lỗ hổng bảo mật cho dự án Từ Điển Xơ Đăng – Tiếng Việt (`tudien-xedang`).

### 1. Các phiên bản được hỗ trợ

| Phiên bản | Hỗ trợ bảo mật | Ghi chú |
| :---: | :---: | :--- |
| **10.0.x** | Có | Bản phát hành chính thức hiện tại (PWA & Electron) |
| **< 10.0.0** | Không | Bản cũ không còn duy trì |

---

### 2. Quy trình báo cáo lỗ hổng

Nếu phát hiện vấn đề an ninh hoặc lỗ hổng bảo mật trong mã nguồn hoặc hệ thống triển khai, vui lòng tuân thủ quy trình **Tiết lộ có trách nhiệm (Responsible Disclosure)**:

* **Phương thức ưu tiên (Khuyến nghị)**: Sử dụng tính năng GitHub Private Vulnerability Reporting tại:  
  [https://github.com/Umnuar/xodang/security/advisories/new](https://github.com/Umnuar/xodang/security/advisories/new)
* **Lưu ý quan trọng**: Không mở Issue công khai hoặc Pull Request chứa mã khai thác (PoC) trước khi bản vá được phát hành.

#### Thông tin cần cung cấp trong báo cáo:
1. Phân loại lỗ hổng (mã CWE hoặc OWASP nếu xác định được).
2. Phạm vi ảnh hưởng (Trang chủ, tra cứu, bài thi, minigame, Service Worker, hoặc tiến trình Electron).
3. Các bước tái hiện chi tiết (kèm dữ liệu mẫu không gây hại).
4. Đánh giá mức độ nghiêm trọng (điểm số CVSS v3.1 ước lượng).
5. Đề xuất khắc phục (nếu có).

---

### 3. Thời gian phản hồi và xử lý (SLA)

| Mức độ nghiêm trọng (CVSS v3.1) | Xác nhận ban đầu | Thời gian phát hành bản vá |
| :--- | :---: | :---: |
| **Critical (9.0 – 10.0)** | < 12 giờ | Trong vòng 24 giờ |
| **High (7.0 – 8.9)** | < 24 giờ | Trong vòng 72 giờ |
| **Medium (4.0 – 6.9)** | < 48 giờ | Trong chu kỳ 7 ngày |
| **Low (0.1 – 3.9)** | < 72 giờ | Bản phát hành định kỳ kế tiếp |

---

### 4. Các biện pháp phòng vệ kiến trúc

* **Không có thư viện phụ thuộc runtime**: Dự án không dùng thư viện runtime của bên thứ ba, loại bỏ hoàn toàn rủi ro từ tấn công chuỗi cung ứng npm khi chạy trên trình duyệt.
* **Ngăn chặn XSS**: Toàn bộ dữ liệu hiển thị được xử lý qua các phương thức DOM an toàn (`textContent`, `createElement`). Bộ kiểm thử `tests/xss-security.test.ts` tự động xác minh điều này trước mỗi lần đóng gói.
* **Bảo vệ khóa API**: Khóa Google Sheets API được cấu hình quyền chỉ đọc (Read-only) và giới hạn tên miền HTTP Referrer. Khi mất mạng hoặc API lỗi, ứng dụng tự động chuyển sang snapshot tĩnh nội bộ mà không làm lộ dữ liệu nhạy cảm.
* **Cô lập bộ nhớ đệm PWA**: Service Worker chỉ lưu trữ tài nguyên cùng nguồn gốc (`same-origin`) và tài nguyên âm thanh đã chỉ định.

---

### 5. Quy trình thu hồi khóa khi có sự cố

1. Đăng nhập Google Cloud Console và vô hiệu hóa ngay khóa API nghi ngờ bị lộ.
2. Tạo khóa thay thế có cấu hình giới hạn HTTP Referrer.
3. Cập nhật khóa mới vào biến môi trường và chạy script kiểm tra.
4. Đánh giá nhật ký truy cập để kiểm tra lưu lượng bất thường.

---

<a name="security-policy-en"></a>
## Security Policy (English)

This document outlines supported versions, architectural defense mechanisms, and vulnerability reporting procedures for the Xe Dang – Vietnamese Dictionary project.

### 1. Supported Versions

| Version | Supported | Notes |
| :---: | :---: | :--- |
| **10.0.x** | Yes | Current production release (PWA & Electron) |
| **< 10.0.0** | No | Legacy release, no longer maintained |

---

### 2. Reporting a Vulnerability

If you discover a security vulnerability, please report it through **Responsible Disclosure**:

* **Preferred Channel**: Submit a private report via GitHub Security Advisories:  
  [https://github.com/Umnuar/xodang/security/advisories/new](https://github.com/Umnuar/xodang/security/advisories/new)
* **Important**: Please do not open public issues or public pull requests containing exploit code prior to a coordinated patch release.

#### Information to include in your report:
1. Vulnerability category (CWE identifier or OWASP classification, if applicable).
2. Affected scope (search engine, quiz module, games hub, service worker, or Electron process).
3. Step-by-step reproduction instructions with non-destructive proof-of-concept payload.
4. Estimated CVSS v3.1 severity rating.
5. Proposed remediation or patch suggestion (optional).

---

### 3. Response & Remediation SLA

| Severity (CVSS v3.1) | Acknowledgment | Patch Release SLA |
| :--- | :---: | :---: |
| **Critical (9.0 – 10.0)** | < 12 hours | Within 24 hours |
| **High (7.0 – 8.9)** | < 24 hours | Within 72 hours |
| **Medium (4.0 – 6.9)** | < 48 hours | Within 7 days |
| **Low (0.1 – 3.9)** | < 72 hours | Next planned release |

---

### 4. Architectural Defenses

* **Zero Runtime Dependencies**: No third-party runtime packages are imported, eliminating supply-chain attack surfaces in production builds.
* **XSS Mitigation**: Dynamic text insertion strictly uses safe DOM APIs (`textContent`, `createElement`). Regression test `tests/xss-security.test.ts` enforces this requirement.
* **API Credential Isolation**: Google Sheets API keys are read-only and restricted to authorized HTTP referrers. On network failure or quota exhaustion, the app gracefully falls back to bundled static snapshot data.
* **Service Worker Sandboxing**: CacheStorage is scoped to same-origin assets with automatic versioned cache eviction.

---

### 5. Emergency Key Rotation

1. Revoke the exposed API key in Google Cloud Console immediately.
2. Provision a replacement key with domain restrictions enabled.
3. Update environment secrets on deployment hosts.
4. Review access logs to evaluate unauthorized usage.
