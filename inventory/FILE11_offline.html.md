# KIỂM KÊ CHI TIẾT: FILE11 — `offline.html`

- **Đường dẫn:** `C:\Users\umnuar\Downloads\tudien-goc\offline.html`
- **Loại tập tin:** HTML / CSS / JavaScript inline
- **Số dòng:** 493 dòng (16.746 bytes)

---

## A. HÀM / CLASS / METHOD
| ID | Tên hàm | File:Dòng | Tham số | Mô tả một câu | Nơi gọi | Giá trị trả về / Hiệu ứng phụ |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F001_F11** | `updateOnlineStatus` | dòng 347 | Không | Kiểm tra `navigator.onLine`, cập nhật giao diện thông báo, hiển thị spinner và kích hoạt redirect sau 3s về `./` nếu mạng phục hồi | `window.ononline`, `window.onoffline`, gọi trực tiếp khi nạp trang (dòng 378), `setInterval` ping (dòng 440) | Cập nhật style DOM, kích hoạt `setTimeout` redirect |
| **F002_F11** | `showNotification` | dòng 381 | `message, type` | Tạo và gắn một toast alert thông báo ở góc trên bên phải màn hình (`slideIn`), tự hủy sau 3 giây (`slideOut`) | `updateOnlineStatus` (dòng 365), `DOMContentLoaded` (dòng 455), PWA installed (dòng 480) | Tạo DOM element Toast, inject thẻ `<style>` animation |

---

## B. EVENT & BINDING
| ID | Phần tử / Đối tượng | Loại sự kiện | Hàm xử lý | File:Dòng | Hành vi kích hoạt |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **E001_F11** | `window` | `online` | `updateOnlineStatus` | dòng 374 | Khi thiết bị có kết nối mạng trở lại |
| **E002_F11** | `window` | `offline` | `updateOnlineStatus` | dòng 375 | Khi thiết bị mất kết nối mạng |
| **E003_F11** | `document` | `DOMContentLoaded` | Anonymous function | dòng 449 | Kiểm tra `sessionStorage`, hiển thị mẹo lần đầu ghé thăm, bắt sự kiện cài đặt PWA |
| **E004_F11** | `window` | `beforeinstallprompt` | Anonymous function | dòng 465 | Chặn prompt mặc định, tạo nút "Cài đặt ứng dụng" màu tím |
| **E005_F11** | `button.btn` (Thử lại) | `click` (Inline `onclick`) | `window.location.reload()` | dòng 317 | Tải lại trang để kiểm tra kết nối mạng |
| **E006_F11** | `button.btn-secondary` | `click` (Inline `onclick`) | `window.history.back()` | dòng 321 | Quay lại trang trước trong lịch sử trình duyệt |
| **E007_F11** | `button.btn-tertiary` | `click` (Inline `onclick`) | `window.location.href = './'` | dòng 325 | Chuyển hướng về trang chủ ứng dụng |
| **E008_F11** | `installBtn` (Dynamic) | `click` (`installBtn.onclick`) | Anonymous function | dòng 475 | Gọi `deferredPrompt.prompt()`, xử lý kết quả người dùng chấp thuận |

---

## C. PHẦN TỬ HTML TƯƠNG TÁC & SELECTORS
### 1. Phần tử tương tác người dùng
| ID | Thẻ HTML | ID / Class | Nhãn hiển thị | Hành vi khi tương tác |
| :--- | :--- | :--- | :--- | :--- |
| **B001_F11** | `<button>` | `.btn` | Thử lại kết nối | Reload lại trang hiện tại |
| **B002_F11** | `<button>` | `.btn.btn-secondary` | Quay lại trang trước | Lùi về trang trước qua `history.back()` |
| **B003_F11** | `<button>` | `.btn.btn-tertiary` | Về trang chủ offline | Điều hướng về `./` |
| **B004_F11** | `<button>` | `.btn` (Dynamic) | Cài đặt ứng dụng | Kích hoạt PWA Install Prompt |
| **B005_F11** | `<a>` | Không | Liên hệ hỗ trợ | Mở trình gửi mail tới `baotruongminh201@gmail.com` |

### 2. Danh mục Selectors mà JavaScript tham chiếu
- `document.getElementById('statusIndicator')` (dòng 343)
- `document.getElementById('onlineStatus')` (dòng 344)
- `document.querySelector('.container')` (dòng 354)
- `document.querySelector('.actions')` (dòng 357, 486)
- `document.body` (dòng 407)
- `document.head` (dòng 427)

---

## D. STATE & DỮ LIỆU
| ID | Tên biến / Khóa | Kiểu | File:Dòng | Nơi đọc | Nơi ghi | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **S001_F11** | `sessionStorage['offlinePageVisited']` | Storage Key | dòng 451, 454 | `DOMContentLoaded` | `DOMContentLoaded` | Đánh dấu người dùng đã xem trang offline chưa để chỉ hiện mẹo 1 lần |
| **S002_F11** | `deferredPrompt` | Event Object | dòng 463, 467, 477 | `installBtn.onclick` | `beforeinstallprompt` | Lưu trữ sự kiện cài đặt PWA để kích hoạt thủ công |
| **S003_F11** | Ping Test URL | String URL | dòng 434 | `setInterval` ping | Tham số URL | URL kiểm tra mạng thực tế: `./?ping=${Date.now()}` |

---

## E. LUỒNG KHỞI TẠO & BẤT ĐỒNG BỘ
1. `DOMContentLoaded`: Đọc `sessionStorage`, nếu chưa có thì `showNotification` thông báo mẹo đồng bộ dữ liệu.
2. `updateOnlineStatus()`: Chạy ngay khi tải xong script (dòng 378).
3. `setInterval(..., 30000)`: Chạy nền mỗi 30 giây thực hiện `fetch` nhẹ (`HEAD`, `no-cors`, `no-cache`) tới `./?ping=...` để phát hiện mạng phục hồi ngay cả khi trình duyệt chưa phát sự kiện `online`.
4. Khi phát hiện mạng: Kích hoạt `setTimeout` 3.000ms chuyển hướng về `./`.

---

## F. UI LOGIC
- **Mất kết nối:** Khối `#statusIndicator` nền đỏ hiện chữ "Đang offline - Mất kết nối internet".
- **Có kết nối:** Khối `#statusIndicator` bị ẩn, `#onlineStatus` nền xanh hiện lên, chèn thêm `.spinner` quay tròn vào trước khối `.actions`, hiển thị Toast xanh thông báo đang tự nạp lại và redirect sau 3s.
- **Toast Notification:** Trượt vào từ bên phải (100% $\rightarrow$ 0%), cố định góc trên bên phải, trượt ra sau 3s rồi xóa khỏi DOM.

---

## G. CSS
- **Media Queries:**
  - `@media (max-width: 600px)`: Responsive cho điện thoại (thu nhỏ font, full width buttons, chuyển `.actions` thành cột dọc).
  - `@media (prefers-color-scheme: dark)`: Hỗ trợ dark mode hệ điều hành (nền tối `#34495e`/`#2c3e50`, container `#2c3e50`, chữ `#ecf0f1`).
- **Keyframes:** `@keyframes pulse` (nhịp tim logo), `@keyframes spin` (xoay tròn spinner), `@keyframes slideIn`, `@keyframes slideOut` (hiệu ứng toast).
- **CSS Classes:** `.container`, `.logo`, `.offline-icon`, `.features`, `.actions`, `.btn`, `.btn-secondary`, `.btn-tertiary`, `.status-indicator`, `.offline-status`, `.online-status`, `.spinner`, `.footer`.

---

## H. PHỤ THUỘC & THỨ TỰ NẠP
1. Thư viện ngoài: FontAwesome 6 CDN `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">` (dòng 262).
2. Không có file script ngoài.

---

## BƯỚC 2: Tự kiểm đếm CLI
- Lệnh kiểm tra:
  - Đếm hàm: `Select-String -Path "C:\Users\umnuar\Downloads\tudien-goc\offline.html" -Pattern "function\s+\w+" | Measure-Object` $\rightarrow$ 2 hàm (F001_F11, F002_F11).
  - Đếm inline onclick: `Select-String -Path "C:\Users\umnuar\Downloads\tudien-goc\offline.html" -Pattern "onclick=" | Measure-Object` $\rightarrow$ 3 inline handlers (E005_F11, E006_F11, E007_F11).
  - Đếm addEventListener: `Select-String -Path "C:\Users\umnuar\Downloads\tudien-goc\offline.html" -Pattern "addEventListener\(" | Measure-Object` $\rightarrow$ 4 listeners (E001_F11, E002_F11, E003_F11, E004_F11).
- Trạng thái kiểm đếm: Khớp chính xác 100%.
