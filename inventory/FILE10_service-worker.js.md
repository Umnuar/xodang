# KIỂM KÊ CHI TIẾT: FILE10 — `service-worker.js`

- **Đường dẫn:** `C:\Users\umnuar\Downloads\tudien-goc\service-worker.js`
- **Loại tập tin:** JavaScript (PWA Service Worker)
- **Số dòng:** 429 dòng (13.145 bytes)
- **Phiên bản:** `10.0.3`

---

## A. HÀM / CLASS / METHOD
| ID | Tên hàm / Phương thức | File:Dòng | Tham số | Mô tả một câu | Nơi gọi | Giá trị trả về / Hiệu ứng phụ |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F001_F10** | `GOOGLE_CONFIG.SHEETS_VOCAB_URL` | dòng 35 | Không | Getter tạo URL endpoint lấy dữ liệu từ vựng Google Sheets (tab `Tu_Dien!A2:F`) | Code nội bộ | Trả về chuỗi URL Google Sheets API v4 kèm API Key |
| **F002_F10** | `GOOGLE_CONFIG.SHEETS_CHAT_URL` | dòng 39 | Không | Getter tạo URL endpoint lấy dữ liệu hỏi đáp Chatbot (tab `Data_Chat!A2:B`) | Code nội bộ | Trả về chuỗi URL Google Sheets API v4 kèm API Key |
| **F003_F10** | `GOOGLE_CONFIG.SHEETS_QUIZ_URL` | dòng 43 | Không | Getter tạo URL endpoint lấy câu hỏi trắc nghiệm (tab `Data_Tracnghiem!A2:H`) | Code nội bộ | Trả về chuỗi URL Google Sheets API v4 kèm API Key |
| **F004_F10** | `handleSheetsRequest` | dòng 139 | `request` | Xử lý yêu cầu Google Sheets API: kiểm tra cache (<30 phút), fetch mạng với timeout 8s, lưu cache kèm header `sw-cache-time`, trả fallback JSON rỗng nếu mất mạng | Listener `fetch` (dòng 105) | Trả về `Response` (từ cache, mạng hoặc fallback JSON rỗng) |
| **F005_F10** | `handleAppsScriptRequest` | dòng 233 | `request` | Xử lý yêu cầu gửi dữ liệu Google Apps Script với timeout 10s; nếu mất mạng trả về JSON báo offline để đồng bộ sau | Listener `fetch` (dòng 111) | Trả về `Response` (kết quả Apps Script hoặc JSON thông báo offline) |
| **F006_F10** | `handleNavigationRequest` | dòng 260 | `request` | Xử lý yêu cầu điều hướng trang HTML (`mode === 'navigate'`): ưu tiên tải mạng, nếu lỗi lấy cache trang, nếu không có lấy `offline.html` | Listener `fetch` (dòng 127) | Trả về `Response` (HTML từ mạng, cache hoặc fallback HTML khẩn cấp) |
| **F007_F10** | `handleStaticRequest` | dòng 297 | `request` | Xử lý yêu cầu tài nguyên tĩnh (CDN, Fonts, CSS, JS, Icon): ưu tiên cache, kiểm tra Range header nếu là audio | Listener `fetch` (dòng 121, 133) | Trả về `Response` từ cache/mạng hoặc SVG placeholder nếu ảnh lỗi |
| **F008_F10** | `handleRangeRequest` | dòng 338 | `request` | Xử lý Range Request (HTTP 206 Partial Content) cho tệp âm thanh HTML5 Audio khi nghe offline từ Cache Storage | `handleStaticRequest` (dòng 300) | Trả về `Response` mã 206 với buffer cắt đoạn `start-end` và `Content-Range` |
| **F009_F10** | `clearOldCaches` | dòng 418 | Không | Xóa tất cả các cache storage hiện có trong origin | Listener `message` (dòng 414) | Promise xóa toàn bộ cache keys |

---

## B. EVENT & BINDING
| ID | Phần tử / Scope | Loại sự kiện | Hàm xử lý | File:Dòng | Hành vi kích hoạt |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **E001_F10** | `self` (ServiceWorker) | `install` | Anonymous arrow function | dòng 51 | Mở cache `CACHE_NAME`, nạp danh sách 17 file tĩnh `STATIC_FILES`, gọi `skipWaiting()` |
| **E002_F10** | `self` (ServiceWorker) | `activate` | Anonymous arrow function | dòng 77 | Xóa các cache cũ ngoại trừ `CACHE_NAME` và `tudien-audio`, gọi `clients.claim()` |
| **E003_F10** | `self` (ServiceWorker) | `fetch` | Anonymous arrow function | dòng 98 | Bắt các GET request và định tuyến qua 5 bộ xử lý: Sheets, Apps Script, CDN/Fonts, Navigate, Static |
| **E004_F10** | `self` (ServiceWorker) | `push` | Anonymous arrow function | dòng 385 | Bắt Web Push Notification từ server và hiển thị thông báo "Từ điển Xơ Đăng" |
| **E005_F10** | `self` (ServiceWorker) | `notificationclick` | Anonymous arrow function | dòng 398 | Đóng notification và mở tab trình duyệt trỏ về root `./` |
| **E006_F10** | `self` (ServiceWorker) | `message` | Anonymous arrow function | dòng 406 | Lắng nghe command từ main thread: `SKIP_WAITING` và `CLEAR_CACHE` |

---

## C. PHẦN TỬ HTML TƯƠNG TÁC & SELECTORS
*Service Worker chạy độc lập trong background worker thread, không có DOM tree trực tiếp.*
- **Fallback Template 1:** Chuỗi HTML khẩn cấp (dòng 280-288) `<h1>Ứng dụng không khả dụng offline</h1>`.
- **Fallback Template 2:** Chuỗi SVG image placeholder (dòng 320-324) hiển thị chữ `IMG` nền xám khi mất kết nối.

---

## D. STATE & DỮ LIỆU
| ID | Tên biến / Khóa cấu hình | Kiểu | File:Dòng | Nơi đọc | Nơi ghi | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **S001_F10** | `APP_VERSION` | String | dòng 5 | Toàn file | Hằng số | Phiên bản SW: `'10.0.3'` |
| **S002_F10** | `CACHE_NAME` | String | dòng 6 | `install`, `activate`, `fetch` | Hằng số | Tên cache chính: `tudien-10.0.3` |
| **S003_F10** | `OFFLINE_PAGE` | String | dòng 7 | `handleNavigationRequest` | Hằng số | Đường dẫn fallback ngoại tuyến: `'./offline.html'` |
| **S004_F10** | `STATIC_FILES` | Array(17) | dòng 10-28 | `install` | Hằng số | Danh sách 17 URL nạp sẵn vào cache khi cài đặt |
| **S005_F10** | `GOOGLE_CONFIG.API_KEY` | String | dòng 32 | Getter URLs | Hằng số | Google Cloud API Key truy vấn Sheets |
| **S006_F10** | `GOOGLE_CONFIG.SHEET_ID` | String | dòng 33 | Getter URLs | Hằng số | Spreadsheet ID lưu dữ liệu từ điển |
| **S007_F10** | `GOOGLE_CONFIG.APPS_SCRIPT_URL` | String | dòng 47 | Fetch logic | Hằng số | Webhook Google Apps Script nhận đóng góp từ vựng |
| **S008_F10** | `'tudien-audio'` | String | dòng 84, 343 | `activate`, `handleRangeRequest` | Hằng số | Tên cache ngoại lệ dành riêng cho tệp phát âm |
| **S009_F10** | `'sw-cache-time'` | Header String | dòng 149, 183 | `handleSheetsRequest` | Header HTTP | Lưu timestamp cache để kiểm tra độ tươi (< 30 phút) |

---

## E. LUỒNG KHỞI TẠO & BẤT ĐỒNG BỘ
1. **Chu trình cài đặt:** `install` $\rightarrow$ `caches.open(CACHE_NAME)` $\rightarrow$ `cache.add()` cho từng static file $\rightarrow$ `self.skipWaiting()`.
2. **Chu trình kích hoạt:** `activate` $\rightarrow$ duyệt `caches.keys()` $\rightarrow$ xóa cache khác tên $\rightarrow$ `self.clients.claim()`.
3. **Quản lý Timeout chống lỗi 408:**
   - Sheets API: `AbortController` timeout sau 8.000ms (8 giây).
   - Apps Script: `AbortController` timeout sau 10.000ms (10 giây).
4. **Phân đoạn phát âm Range Request:** Đọc `arrayBuffer`, trích xuất byte theo Range Header (`bytes=start-end`), trả HTTP 206 Partial Content kèm `Content-Range`.

---

## F. UI LOGIC
- Khi offline: Tự động điều hướng các request trang HTML không thành công về trang dự phòng `offline.html`.

---

## G. CSS
- Cung cấp style inline cho chuỗi HTML khẩn cấp: `style="padding:40px;font-family:Arial;"`.

---

## H. PHỤ THUỘC & THỨ TỰ NẠP
- Nạp ngầm qua `navigator.serviceWorker.register('./service-worker.js')` từ các trang HTML.
- Tương tác với Cache API của trình duyệt.
- Tương tác với Google Sheets API v4 và Google Apps Script.

---

## BƯỚC 2: Tự kiểm đếm CLI
- Lệnh kiểm tra:
  - Đếm hàm: `Select-String -Path "C:\Users\umnuar\Downloads\tudien-goc\service-worker.js" -Pattern "(function\s+\w+|get\s+\w+)" | Measure-Object` $\rightarrow$ 9 hàm/getters (F001_F10 đến F009_F10).
  - Đếm event listener: `Select-String -Path "C:\Users\umnuar\Downloads\tudien-goc\service-worker.js" -Pattern "addEventListener\(" | Measure-Object` $\rightarrow$ 6 listeners (E001_F10 đến E006_F10).
- Kết quả kiểm đếm: Khớp chính xác 100% với danh mục kiểm kê.
