<div align="center">

# Chính Sách Bảo Mật (Security Policy)
### *Tiêu Chuẩn Đảm Bảo An Ninh Ứng Dụng & Quy Trình Tiếp Nhận Lỗ Hổng Bảo Mật*

[![Security Status](https://img.shields.io/badge/Security_Policy-Active-22c55e?style=flat-square&logo=shield)](https://github.com/Umnuar/xodang/security)
[![Vulnerability Reporting](https://img.shields.io/badge/Vulnerability_Reporting-Private_Advisory-3b82f6?style=flat-square&logo=github)](https://github.com/Umnuar/xodang/security/advisories/new)
[![Response SLA](https://img.shields.io/badge/Response_SLA-%3C_48h-f59e0b?style=flat-square)](https://github.com/Umnuar/xodang)
[![CVSS Standard](https://img.shields.io/badge/Severity_Standard-CVSS_v3.1-6366f1?style=flat-square)](https://www.first.org/cvss/)

[English](SECURITY.en.md) • **Tiếng Việt** • **[Tạo Báo Cáo Riêng Tư](https://github.com/Umnuar/xodang/security/advisories/new)**

</div>

---

Dự án **Từ Điển Xơ Đăng – Tiếng Việt** (`tudien-xedang`) cam kết bảo vệ dữ liệu văn hóa bản địa, an toàn thông tin người dùng và duy trì tiêu chuẩn kỹ thuật an ninh phần mềm theo chuẩn **OWASP ASVS** và các thông lệ quốc tế tốt nhất.

Tài liệu này xác định phạm vi phiên bản được hỗ trợ, mô hình phòng vệ kiến trúc và quy trình **Tiết lộ có trách nhiệm (Responsible Disclosure)**.

---

## 1. ⬡ Các phiên bản được hỗ trợ (Supported Versions)

Chúng tôi cung cấp các bản vá bảo mật và cập nhật an ninh định kỳ cho các phiên bản theo lộ trình sau:

| Phiên Bản | Hỗ Trợ Bảo Mật | Trạng Thái | Chiến Lược Bản Vá |
| :---: | :---: | :---: | :--- |
| **10.0.x** | Có | Bản phát hành sản xuất chính thức (PWA & Electron) | Bản vá khẩn cấp P0/P1 trong vòng 24–72 giờ |
| **< 10.0.0** | Không | Phiên bản cũ (Legacy Web) | Hết hạn hỗ trợ; khuyến nghị nâng cấp |

---

## 2. ⛊ Báo cáo lỗ hổng bảo mật (Reporting a Vulnerability)

Nếu phát hiện bất kỳ vấn đề an ninh hoặc lỗ hổng bảo mật nào trong mã nguồn hoặc hệ thống triển khai, vui lòng tuân thủ quy trình **Tiết lộ có trách nhiệm**:

### ▷ Phương thức ưu tiên (Khuyến nghị trên GitHub)
Sử dụng tính năng **GitHub Private Vulnerability Reporting** tại:  
▷ **[Tạo Báo Cáo Lỗ Hổng Riêng Tư (New Security Advisory)](https://github.com/Umnuar/xodang/security/advisories/new)**

> [!WARNING]
> **Tuyệt đối không** mở Issue công khai, Pull Request hoặc bình luận công khai trên GitHub để báo cáo lỗ hổng an ninh hoặc đính kèm mã khai thác (PoC) trước khi bản vá được phát hành.

### ▷ Thông tin cần cung cấp trong báo cáo:
1. **Phân loại lỗ hổng**: Mã CWE hoặc danh mục OWASP Top 10 (ví dụ: *CWE-79: Cross-site Scripting*, *CWE-200: Information Disclosure*).
2. **Phạm vi tác động**: Module bị ảnh hưởng (Trang chủ, tra cứu, bài thi, minigame, Service Worker, hoặc tiến trình Electron).
3. **Các bước tái hiện (Proof of Concept - PoC)**:
   * Trình tự từng bước tái hiện hành vi lỗi.
   * Dữ liệu đầu vào hoặc URL giả lập (không gây ảnh hưởng đến dữ liệu thực tế).
4. **Đánh giá mức độ nghiêm trọng (CVSS v3.1 Calculator)**: Điểm số ước lượng và khả năng khai thác thực tế.
5. **Đề xuất khắc phục (nếu có)**: Giải pháp kỹ thuật hoặc mã sửa đổi khuyến nghị.

---

## 3. ▷ Quy trình xử lý & Cam kết SLA (Incident Response Lifecycle)

```text
[Báo cáo gửi đến] 
       │
       ▼ (≤ 24 giờ)
[Xác nhận tiếp nhận & Kiểm tra PoC ban đầu]
       │
       ▼ (≤ 72 giờ)
[Xác định điểm CVSS v3.1 & Tạo nhánh vá bảo mật nội bộ]
       │
       ▼ (7–14 ngày)
[Kiểm thử hồi quy tự động (Vitest) & Biên dịch an toàn]
       │
       ▼
[Triển khai Bản Vá & Công bố Security Advisory phối hợp]
```

### Cam kết thời gian phản hồi:
| Mức Độ Nghiêm Trọng (CVSS v3.1) | Điểm Số | Xác Nhận Tiếp Nhận | Thời Gian Phát Hành Bản Vá |
| :--- | :---: | :---: | :---: |
| **Critical (Khẩn cấp)** | 9.0 – 10.0 | < 12 giờ | **Trong vòng 24 giờ** |
| **High (Nghiêm trọng)** | 7.0 – 8.9 | < 24 giờ | **Trong vòng 72 giờ** |
| **Medium (Trung bình)** | 4.0 – 6.9 | < 48 giờ | Trong chu kỳ phát hành (7 ngày) |
| **Low (Thấp)** | 0.1 – 3.9 | < 72 giờ | Bản phát hành định kỳ kế tiếp |

---

## 4. ⊞ Mô hình đe dọa & Phòng vệ kiến trúc (Threat Model & Defenses)

Dự án được thiết kế với cơ chế phòng thủ theo chiều sâu (Defense-in-Depth):

### 4.1. An toàn chuỗi cung ứng (Supply Chain Defense)
* **Zero Runtime Dependencies**: Không chứa bất kỳ thư viện bên ngoài nào trong `dependencies`. Toàn bộ mã chạy trên trình duyệt là TypeScript thuần chuyển mã sang ESM.
* **Tác động an ninh**: Triệt tiêu hoàn toàn bề mặt tấn công từ các cuộc tấn công chiếm quyền gói npm (typosquatting, dependency confusion, malicious sub-dependencies).

### 4.2. Chống chèn mã phía Client (XSS & Injection Mitigation)
* Dữ liệu từ điển và dữ liệu người dùng nhập tuyệt đối không được gán trực tiếp qua `innerHTML` chưa xử lý.
* Áp dụng bắt buộc `textContent`, `document.createElement`, hoặc hàm tạo DOM an toàn.
* Tự động kiểm thử liên tục qua suite: [`tests/xss-security.test.ts`](tests/xss-security.test.ts) (100% pass với payload XSS chuyên sâu).

### 4.3. Bảo vệ khóa Google Sheets API (Least Privilege & Key Protection)
* **Nguyên tắc đặc quyền tối thiểu**: Khóa API sử dụng cho dự án chỉ có quyền đọc (Read-only) dữ liệu bảng tính.
* **HTTP Referrer Restriction**: Khóa API được khóa cứng tên miền trong Google Cloud Console (`hoctiengxodang.online/*`).
* **Khả năng phục hồi ngoại tuyến**: Khi khóa API bị thu hồi hoặc lỗi hạn ngạch (quota exceeded), ứng dụng tự động chuyển sang snapshot tĩnh (`src/shared/data/snapshot-fallback.ts`), không làm lộ thông tin nhạy cảm.
* **Bảo vệ biến môi trường**: Tệp `.env` thực tế được chặn 100% trong `.gitignore`. Kho lưu trữ chỉ chứa tệp mẫu `.env.example`.

### 4.4. Cách ly bộ nhớ đệm PWA (Service Worker Sandbox)
* Service Worker chỉ lưu trữ tài nguyên có cùng nguồn gốc (`same-origin`) và tài nguyên âm thanh/font chữ đã định danh.
* Cơ chế tự dọn dẹp cache cũ khi có phiên bản mới, ngăn ngừa rò rỉ dữ liệu hoặc đầu độc bộ đệm (Cache Poisoning).

---

## 5. ⊚ Quy trình thu hồi & Xoay khóa khẩn cấp (Key Rotation Protocol)

Trong trường hợp có dấu hiệu rò rỉ khóa API hoặc thông tin bí mật:
1. **Thu hồi khẩn cấp**: Truy cập Google Cloud Console và vô hiệu hóa ngay khóa nghi ngờ bị lộ.
2. **Khởi tạo khóa mới**: Tạo khóa thay thế, cấu hình giới hạn chỉ cho phép HTTP Referrer của website chính thức.
3. **Cập nhật cấu hình**: Cập nhật biến môi trường trên GitHub Actions Secrets và máy chủ triển khai.
4. **Kiểm tra nhật ký truy cập**: Đánh giá lưu lượng truy cập để bảo đảm không có lạm dụng hạn ngạch.

---

## 6. ◈ Vinh danh đóng góp bảo mật (Security Hall of Fame)

Chúng tôi trân trọng ghi nhận và vinh danh các chuyên gia bảo mật và cộng tác viên đã phát hiện, báo cáo có trách nhiệm các lỗ hổng giúp nâng cao độ an toàn của hệ sinh thái Từ Điển Xơ Đăng.

*Mọi đóng góp bảo mật hợp lệ sẽ được ghi nhận tên và liên kết hồ sơ trên trang thông báo phát hành (Release Notes) và tài liệu bảo mật chính thức của dự án.*

---

<div align="center">
  <sub>Bảo mật thông tin là nền tảng bảo tồn tri thức di sản bền vững.</sub>
</div>
