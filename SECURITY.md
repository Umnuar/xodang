<div align="center">

# Chính Sách Bảo Mật (Security Policy)
### *Tiêu Chuẩn Đảm Bảo An Ninh Ứng Dụng & Quy Trình Tiếp Nhận Lỗ Hổng Bảo Mật*

[![Security Status](https://img.shields.io/badge/Security_Policy-Active-22c55e?style=flat-square&logo=shield)](https://github.com/Umnuar/xodang/security)
[![Vulnerability Reporting](https://img.shields.io/badge/Vulnerability_Reporting-Private_Advisory-3b82f6?style=flat-square&logo=github)](https://github.com/Umnuar/xodang/security/advisories/new)
[![Response SLA](https://img.shields.io/badge/Response_SLA-%3C_48h-f59e0b?style=flat-square)](https://github.com/Umnuar/xodang)
[![CVSS Standard](https://img.shields.io/badge/Severity_Standard-CVSS_v3.1-6366f1?style=flat-square)](https://www.first.org/cvss/)

[English](#security-policy-en) • [Tiếng Việt](#chính-sách-bảo-mật-vi)

</div>

---

<a name="chính-sách-bảo-mật-vi"></a>
## ◈ Chính sách bảo mật (Tiếng Việt)

Tài liệu này xác định phạm vi phiên bản được hỗ trợ, mô hình phòng vệ kiến trúc và quy trình báo cáo lỗ hổng bảo mật cho dự án Từ Điển Xơ Đăng – Tiếng Việt (`tudien-xedang`).

### 1. ⬡ Các phiên bản được hỗ trợ (Supported Versions)

| Phiên bản | Hỗ trợ bảo mật | Trạng thái | Chiến lược bản vá |
| :---: | :---: | :---: | :--- |
| **10.0.x** | Có | Bản phát hành chính thức (PWA & Electron) | Bản vá P0/P1 trong vòng 24–72 giờ |
| **< 10.0.0** | Không | Phiên bản cũ (Legacy Web) | Hết hạn hỗ trợ; khuyến nghị nâng cấp |

---

### 2. ⛊ Báo cáo lỗ hổng bảo mật (Reporting a Vulnerability)

Nếu phát hiện vấn đề an ninh hoặc lỗ hổng bảo mật trong mã nguồn hoặc hệ thống triển khai, vui lòng tuân thủ quy trình **Tiết lộ có trách nhiệm (Responsible Disclosure)**:

* **Phương thức ưu tiên (Khuyến nghị trên GitHub)**: Sử dụng tính năng GitHub Private Vulnerability Reporting tại:  
  ▷ **[Tạo Báo Cáo Lỗ Hổng Riêng Tư (New Security Advisory)](https://github.com/Umnuar/xodang/security/advisories/new)**
* **Lưu ý quan trọng**: Tuyệt đối không mở Issue công khai, Pull Request hoặc bình luận công khai chứa mã khai thác (PoC) trước khi bản vá được phát hành.

#### Thông tin cần cung cấp trong báo cáo:
1. Phân loại lỗ hổng (mã CWE hoặc OWASP nếu xác định được).
2. Phạm vi ảnh hưởng (Trang chủ, tra cứu, bài thi, minigame, Service Worker, hoặc tiến trình Electron).
3. Các bước tái hiện chi tiết (kèm dữ liệu mẫu không gây hại).
4. Đánh giá mức độ nghiêm trọng (điểm số CVSS v3.1 ước lượng).
5. Đề xuất khắc phục (nếu có).

---

### 3. ▷ Quy trình xử lý & Cam kết SLA (Incident Response Lifecycle)

| Mức độ nghiêm trọng (CVSS v3.1) | Điểm số | Xác nhận ban đầu | Thời gian phát hành bản vá |
| :--- | :---: | :---: | :---: |
| **Critical (Khẩn cấp)** | 9.0 – 10.0 | < 12 giờ | **Trong vòng 24 giờ** |
| **High (Nghiêm trọng)** | 7.0 – 8.9 | < 24 giờ | **Trong vòng 72 giờ** |
| **Medium (Trung bình)** | 4.0 – 6.9 | < 48 giờ | Trong chu kỳ phát hành (7 ngày) |
| **Low (Thấp)** | 0.1 – 3.9 | < 72 giờ | Bản phát hành định kỳ kế tiếp |

---

### 4. ⊞ Mô hình đe dọa & Phòng vệ kiến trúc (Threat Model & Defenses)

* **Không có thư viện phụ thuộc runtime**: Dự án không dùng thư viện runtime của bên thứ ba, loại bỏ hoàn toàn rủi ro từ tấn công chuỗi cung ứng npm khi chạy trên trình duyệt.
* **Ngăn chặn XSS**: Toàn bộ dữ liệu hiển thị được xử lý qua các phương thức DOM an toàn (`textContent`, `createElement`). Bộ kiểm thử `tests/xss-security.test.ts` tự động xác minh điều này trước mỗi lần đóng gói.
* **Bảo vệ khóa API**: Khóa Google Sheets API được cấu hình quyền chỉ đọc (Read-only) và giới hạn tên miền HTTP Referrer. Khi mất mạng hoặc API lỗi, ứng dụng tự động chuyển sang snapshot tĩnh nội bộ mà không làm lộ dữ liệu nhạy cảm.
* **Cô lập bộ nhớ đệm PWA**: Service Worker chỉ lưu trữ tài nguyên cùng nguồn gốc (`same-origin`) và tài nguyên âm thanh đã chỉ định.

---

### 5. ⊚ Quy trình thu hồi & Xoay khóa khẩn cấp (Key Rotation Protocol)

1. Đăng nhập Google Cloud Console và vô hiệu hóa ngay khóa API nghi ngờ bị lộ.
2. Tạo khóa thay thế có cấu hình giới hạn HTTP Referrer.
3. Cập nhật khóa mới vào biến môi trường và chạy script kiểm tra.
4. Đánh giá nhật ký truy cập để kiểm tra lưu lượng bất thường.

---

### 6. ◈ Vinh danh đóng góp bảo mật (Security Hall of Fame)

Chúng tôi trân trọng ghi nhận và vinh danh các chuyên gia bảo mật và cộng tác viên đã phát hiện, báo cáo có trách nhiệm các lỗ hổng giúp nâng cao độ an toàn của hệ sinh thái Từ Điển Xơ Đăng.

---

<a name="security-policy-en"></a>
## ◈ Security Policy (English)

This document defines supported versions, architectural defense models, and vulnerability reporting procedures for the Xe Dang – Vietnamese Dictionary project.

### 1. ⬡ Supported Versions

| Version | Supported | Status | Patch Strategy |
| :---: | :---: | :---: | :--- |
| **10.0.x** | Yes | Active Production (PWA & Electron) | P0/P1 patches within 24–72 hours |
| **< 10.0.0** | No | Legacy Release | End of life; upgrade recommended |

---

### 2. ⛊ Reporting a Vulnerability

If you discover a security vulnerability, please report it following **Responsible Disclosure**:

* **Preferred Channel**: Submit a private advisory via GitHub Security Advisories:  
  ▷ **[Create Private Security Advisory](https://github.com/Umnuar/xodang/security/advisories/new)**
* **Important**: Please do not open public issues or public pull requests containing exploit payloads prior to an official coordinated release.

#### Information to include in your report:
1. Vulnerability category (CWE identifier or OWASP classification).
2. Affected scope (search engine, study modules, games, service worker, or Electron process).
3. Step-by-step reproduction instructions with non-destructive proof-of-concept payload.
4. Estimated CVSS v3.1 severity rating.
5. Proposed patch or mitigation advice (optional).

---

### 3. ▷ Response & Remediation SLA

| Severity (CVSS v3.1) | Score | Initial Acknowledgment | Patch Release SLA |
| :--- | :---: | :---: | :---: |
| **Critical** | 9.0 – 10.0 | < 12 hours | **Within 24 hours** |
| **High** | 7.0 – 8.9 | < 24 hours | **Within 72 hours** |
| **Medium** | 4.0 – 6.9 | < 48 hours | Within 7 days |
| **Low** | 0.1 – 3.9 | < 72 hours | Next regular release |

---

### 4. ⊞ Architectural Threat Defenses

* **Zero Runtime Dependencies**: No third-party runtime packages are imported, eliminating supply-chain attack surfaces in production builds.
* **XSS Mitigation**: Dynamic text insertion strictly uses safe DOM APIs (`textContent`, `createElement`). Regression test `tests/xss-security.test.ts` enforces this requirement.
* **API Credential Isolation**: Google Sheets API keys are read-only and restricted to authorized HTTP referrers. On network failure or quota exhaustion, the app gracefully falls back to bundled static snapshot data.
* **Service Worker Sandboxing**: CacheStorage is scoped to same-origin assets with automatic versioned cache eviction.

---

### 5. ⊚ Emergency Key Rotation

1. Revoke the exposed API key in Google Cloud Console immediately.
2. Provision a replacement key with domain restrictions enabled.
3. Update environment secrets on deployment hosts.
4. Review access logs to evaluate unauthorized usage.

---

### 6. ◈ Security Hall of Fame

We gratefully acknowledge security researchers and contributors who practice responsible disclosure to protect the Xe Dang linguistic data and its learners.
