# ⚙️ Báo Cáo Rà Soát Cấu Hình, Hạ Tầng & Triển Khai (Infrastructure & Config Audit)
**Dự án:** Từ Điển Xơ Đăng - Việt (Web PWA & Electron Desktop)  
**Tài liệu:** `docs/security/04-infrastructure-config-audit.md`  
**Phiên bản:** 1.0.0 (Bước 4 - Security Hardening)  
**Chuẩn tham chiếu:** W3C CSP Level 3, OWASP ASVS v4.0.3 (V14 Configuration & Build), CIS Controls, 007 Hardening Blueprint.

---

## 1. Phương Pháp & Phạm Vi Rà Soát (Audit Methodology)

Rà soát toàn diện các thiết lập cấu hình bảo mật ở cấp độ đóng gói và triển khai:
1. **Chính sách an ninh nội dung (Content Security Policy - CSP):** Kiểm tra từng chỉ thị (directive) được Vite tiêm vào `dist/index.html` lúc build production.
2. **Các Security Meta Tags & Headers:** Đối chiếu các cơ chế bảo vệ HTTP headers và khả năng tương thích trên nền tảng GitHub Pages.
3. **Quản lý Cookie & Session:** Rà soát việc sử dụng cookie và cờ an toàn (`Secure`, `HttpOnly`, `SameSite`).
4. **Cơ chế phân quyền CORS & API Endpoints:** Đánh giá tính an toàn khi giao tiếp với Google Sheets API v4 và Google Apps Script.
5. **Kiểm tra bản build Production (`dist/`):** Đảm bảo không có tệp sourcemap (`.map`), không có nhật ký debug dư thừa trong mã nguồn xuất xưởng.
6. **Bảo mật Service Worker & PWA Manifest:** Kiểm tra phạm vi cache và manifest.

---

## 2. Bảng Tổng Hợp Đánh Giá Cấu Hình & Hạ Tầng

| ID | Hạng mục | Vị trí kiểm tra | Tiêu chuẩn đối chiếu | Đánh giá hiện tại | Mức độ | Đề xuất khắc phục |
|:---:|:---|:---|:---:|:---:|:---:|:---|
| **CONF-01** | Content Security Policy (CSP) | `vite.config.ts:18`<br>`dist/index.html:4` | W3C CSP Level 3<br>ASVS V14.4.3, V14.4.4 | **Cần thắt chặt:** Thiếu `object-src`, `base-uri`, `form-action`; `img-src` dùng wildcard `https:` | **P2 (Trung bình)** | Thắt chặt CSP, chặn Flash/Plugin và Base Tag Hijacking |
| **CONF-02** | Referrer Policy | `index.html` | ASVS V14.4.7<br>CWE-200 | **Thiếu:** Chưa có thẻ `<meta name="referrer">` | **P3 (Thấp)** | Bổ sung `<meta name="referrer" content="strict-origin-when-cross-origin">` |
| **CONF-03** | Khuyến nghị Header cho CDN / Cloudflare | Máy chủ / DNS Proxy | CIS Benchmarks<br>OWASP Secure Headers | GitHub Pages không cho phép chỉnh header máy chủ | **Khuyến nghị** | Cung cấp mẫu cấu hình Cloudflare Rule / Nginx HSTS |
| **CONF-04** | Cookie Security Flags | Mã nguồn client `src/` | ASVS V3.4 | **PASS (An toàn):** Không sử dụng cookie nào | **N/A** | Giữ nguyên (Kiến trúc không dùng cookie) |
| **CONF-05** | Service Worker Cache Isolation | `src/renderer/service-worker.ts` | ASVS V14.2 | **PASS (An toàn):** Không cache API ngoài | **PASS** | Duy trì cô lập cache `tudien-audio` |
| **CONF-06** | Vệ sinh bản build `dist/` | Thư mục `dist/` | ASVS V14.3 | **PASS (An toàn):** Không chứa sourcemaps | **PASS** | Duy trì bản build sạch |

---

## 3. Phân Tích Chuyên Sâu Từng Chỉ Thị CSP (CSP Directive Analysis)

### 3.1 Hiện trạng CSP đang áp dụng trong `vite.config.ts:18`
```html
<meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self';
    style-src 'self' 'unsafe-inline';
    font-src 'self';
    media-src 'self' blob: data:;
    connect-src 'self' https://sheets.googleapis.com https://script.google.com https://script.googleusercontent.com;
    frame-src 'none';
    img-src 'self' data: https:;
">
```

### 3.2 Đánh giá an ninh & Các điểm yếu cần khắc phục
1. **Thiếu `object-src 'none'` (ASVS V14.4.3 / CWE-94):**
   * *Nguy cơ:* Nếu không khai báo `object-src 'none'`, trình duyệt sẽ dùng giá trị mặc định của `default-src 'self'`. Điều này cho phép nhúng các đối tượng plugin (`<object>`, `<embed>`, `<applet>`) từ chính domain.
   * *Khắc phục:* Bắt buộc thêm `object-src 'none'`.
2. **Thiếu `base-uri 'self'` (ASVS V14.4.4 / CWE-610 - Base Tag Hijacking):**
   * *Nguy cơ:* Kẻ tấn công nếu chèn được thẻ `<base href="https://attacker.com/">` vào DOM có thể làm cho toàn bộ đường dẫn tương đối (scripts, fetch) bị điều hướng sang máy chủ độc hại.
   * *Khắc phục:* Bắt buộc thêm `base-uri 'self'`.
3. **Thiếu `form-action 'self'`:**
   * *Nguy cơ:* Ngăn chặn kẻ tấn công chèn hoặc thao túng biểu mẫu HTML gửi dữ liệu (form submission) sang URL lừa đảo ngoài ý muốn.
   * *Khắc phục:* Bổ sung `form-action 'self'`.
4. **Wildcard trong `img-src 'self' data: https:`:**
   * *Nguy cơ:* Cờ `https:` cho phép trang web nạp hình ảnh từ **bất kỳ trang web HTTPS nào trên toàn thế giới**, có thể bị lợi dụng để theo dõi IP người dùng (Web Beacons / Tracking Pixels).
   * *Thực tế:* Ứng dụng Từ điển chỉ sử dụng ảnh nội bộ từ `/public/` (`favicon.png`, `Thumnail.jpg`, `og-image*`, bộ icons) và các icon SVG data URL. Ứng dụng không cần nạp ảnh từ bất kỳ trang web ngoài nào.
   * *Khắc phục:* Rút gọn thành `img-src 'self' data:;`.
5. **Chấp nhận có kiểm soát `style-src 'self' 'unsafe-inline'`:**
   * *Lý do:* Ứng dụng điều khiển động các thanh tiến độ (`loading-bar width`), ẩn hiện overlay (`display: none`), và màu sắc dynamic trong game. Đây là giải pháp cân bằng hợp lý, không tiềm ẩn nguy cơ thực thi mã JavaScript vì `script-src` đã được khóa chặt ở `'self'`.

### 3.3 Đề xuất CSP mới sau khi tối ưu (Thực hiện ở Bước 7)
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; media-src 'self' blob: data:; connect-src 'self' https://sheets.googleapis.com https://script.google.com https://script.googleusercontent.com; img-src 'self' data:; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self';">
```

---

## 4. Rà Soát Hạ Tầng Lưu Trữ & Triển Khai (Hosting & Infrastructure)

### 4.1 Ràng buộc của nền tảng GitHub Pages
* **Đặc thù:** GitHub Pages phục vụ nội dung tĩnh qua máy chủ CDN Fastly của GitHub.
* **Hạn chế:** GitHub Pages **không hỗ trợ** tệp cấu hình tùy biến header HTTP (như `_headers` của Cloudflare Pages hay `.htaccess` của Apache).
* **Giải pháp thích ứng:**
  1. Sử dụng thẻ `<meta http-equiv="Content-Security-Policy">` (Đã triển khai trong `dist/index.html`).
  2. Bổ sung thẻ `<meta name="referrer" content="strict-origin-when-cross-origin">` vào `index.html` để kiểm soát rò rỉ URL qua header `Referer`.

### 4.2 Cấu hình đề xuất nếu triển khai sau Cloudflare Proxy hoặc Nginx
Nếu sau này tên miền `hoctiengxodang.online` được bật tính năng Proxy qua Cloudflare hoặc chuyển sang máy chủ Nginx riêng, khuyến nghị kích hoạt các header sau:

```nginx
# Cấu hình Nginx Security Headers đề xuất
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(self), geolocation=()" always;
```

---

## 5. Tiêu Chí Nghiệm Thu Cổng (Gate Bước 4 Checklist)

* [x] **Kiểm tra trực tiếp trên bản build production (`dist/index.html`):** Xác nhận CSP hiện tại và các điểm cần thắt chặt.
* [x] **Đối chiếu từng chỉ thị CSP với chuẩn W3C CSP Level 3 và ASVS v4.0.3.**
* [x] **Đánh giá toàn diện các header bảo mật (HSTS, Referrer-Policy, Permissions-Policy).**
* [x] **Xác nhận tính an toàn về Cookie, CORS và Service Worker Cache.**
* [x] **Không có phát hiện nào thiếu căn cứ đối chiếu hạ tầng.**
