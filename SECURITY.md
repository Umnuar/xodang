# Chính Sách Bảo Mật (Security Policy)

Dự án **Từ Điển Xơ Đăng - Việt** cam kết duy trì tiêu chuẩn an ninh và bảo vệ thông tin cho người dùng cũng như các dữ liệu văn hóa ngôn ngữ truyền thống.

---

## 1. Các Phiên Bản Được Hỗ Trợ (Supported Versions)

Chúng tôi cung cấp các bản vá bảo mật và cải tiến cho các phiên bản sau:

| Phiên bản | Hỗ trợ bảo mật | Trạng thái |
|:---:|:---:|:---:|
| **10.0.x** | :white_check_mark: Có | Phiên bản sản xuất hiện tại (PWA & Electron) |
| **< 10.0.0** | :x: Không | Bản cũ không còn duy trì |

---

## 2. Báo Cáo Lỗ Hổng Bảo Mật (Reporting a Vulnerability)

Nếu bạn phát hiện bất kỳ vấn đề hoặc lỗ hổng bảo mật nào trong dự án, vui lòng tuân thủ quy trình **Tiết lộ có trách nhiệm (Responsible Disclosure)**:

1. **KHÔNG** mở Issue công khai trên GitHub để báo cáo lỗ hổng an ninh hoặc tiết lộ thông tin nhạy cảm.
2. Vui lòng gửi email trực tiếp tới người quản trị dự án hoặc kênh bảo mật riêng tư với tiêu đề `[SECURITY] Phát hiện lỗ hổng trên Dự án Từ Điển Xơ Đăng`.
3. Vui lòng cung cấp đầy đủ thông tin:
   - Mô tả chi tiết lỗ hổng và phạm vi ảnh hưởng.
   - Các bước tái hiện tối thiểu (PoC) không gây hại.
   - Mã CWE / Phân loại OWASP liên quan (nếu có).
   - Đề xuất khắc phục (nếu có).

---

## 3. Thời Gian Phản Hồi & Xử Lý (Response SLA)

* **Xác nhận tiếp nhận:** Trong vòng **48 giờ** kể từ khi nhận được báo cáo.
* **Đánh giá & Phân loại rủi ro:** Trong vòng **7 ngày làm việc**.
* **Phát hành bản vá:** Ưu tiên xử lý theo mức độ CVSS:
  - **P0 / P1 (Nghiêm trọng & Cao):** Phát hành bản vá khẩn cấp trong vòng 24–72 giờ.
  - **P2 (Trung bình):** Phát hành trong chu kỳ cập nhật tiếp theo (7–14 ngày).
  - **P3 (Thấp):** Ghi nhận và xử lý trong bản phát hành định kỳ.

---

## 4. Nguyên Tắc An Ninh Cốt Lõi Của Dự Án (Security Best Practices)

Toàn bộ thành viên phát triển và cộng tác viên phải tuân thủ nghiêm ngặt các nguyên tắc sau:

1. **Tuyệt đối không commit bí mật vào mã nguồn:**
   - Mọi khóa API (Google Sheets API, Apps Script tokens, v.v.) phải được quản lý qua biến môi trường (`.env.local`) hoặc CI Secrets.
   - Luôn sử dụng `.env.example` làm tệp mẫu chứa giá trị placeholder.
2. **Nguyên tắc Đặc quyền tối thiểu (Least Privilege):**
   - Các khóa API bên ngoài chỉ được cấp quyền đọc (Read-only) và bị giới hạn phạm vi truy cập (HTTP Referrer / IP restriction).
3. **Phòng chống tấn công chèn mã (XSS / Code Injection):**
   - Tuyệt đối không nội suy dữ liệu người dùng hoặc từ điển vào `innerHTML`, `eval`, hay các hàm thực thi mã động.
   - Luôn sử dụng `textContent`, `document.createElement`, hoặc các phương thức DOM an toàn.
4. **Chính sách An ninh Nội dung (CSP):**
   - Bản build phát hành luôn thực thi CSP nghiêm ngặt: cấm `eval`, chặn plugin/object lạ (`object-src 'none'`), chặn base hijacking (`base-uri 'self'`).
5. **Kiểm thử tự động trước khi đóng gói:**
   - Mọi đóng góp mã mới phải vượt qua 100% test suite tự động (`npm test`) và kiểm tra biên dịch (`npm run build`).

---

## 5. Quy Trình Thu Hồi & Xoay Khóa (Key Rotation Policy)

Khi có nghi ngờ rò rỉ khóa API:
1. Đăng nhập Google Cloud Console / Bảng điều khiển dịch vụ liên quan.
2. Tạo khóa API mới với cấu hình hạn chế HTTP Referrer (`hoctiengxodang.online/*`).
3. Cập nhật biến môi trường trên hệ thống triển khai và `.env.local` của các nhà phát triển.
4. Xóa/Vô hiệu hóa (Revoke) khóa cũ ngay lập tức.
