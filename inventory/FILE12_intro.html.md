# KIỂM KÊ CHI TIẾT: FILE12 — `intro.html`

- **Đường dẫn:** `C:\Users\umnuar\Downloads\tudien-goc\intro.html`
- **Loại tập tin:** HTML / CSS / JavaScript inline (Onboarding Slider)
- **Số dòng:** 1.523 dòng (55.332 bytes)

---

## A. HÀM / CLASS / METHOD
| ID | Tên hàm | File:Dòng | Tham số | Mô tả một câu | Nơi gọi | Giá trị trả về / Hiệu ứng phụ |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F001_F12** | `updateSlide` | dòng 1332 | `index` | Cập nhật slide hiện tại: chuyển class `active`/`prev`, cập nhật `aria-hidden`, active dot, ẩn/hiện nút prev, next và floating-start-btn | Splash timeout (dòng 1302), dot click (dòng 1309, 1325), `nextSlide`, `prevSlide`, phím tắt | Thao tác DOM classList và ARIA attributes |
| **F002_F12** | `announceSlideChange` | dòng 1380 | `index` | Tạo thẻ `.sr-only` với `aria-live="polite"` thông báo tên slide bằng giọng đọc hỗ trợ người khiếm thị | `updateSlide` (dòng 1378) | Thêm và tự xóa phần tử DOM sau 1 giây |
| **F003_F12** | `window.nextSlide` | dòng 1401 | Không | Tăng chỉ số `currentIndex` lên 1 và chuyển sang slide tiếp theo nếu chưa ở slide cuối | Nút `#btn-next` (dòng 1232), swipe left (dòng 1472), phím Right/Space | Gọi `updateSlide(currentIndex + 1)` |
| **F004_F12** | `window.prevSlide` | dòng 1407 | Không | Giảm chỉ số `currentIndex` đi 1 và lùi về slide trước nếu `currentIndex > 0` | Nút `#btn-prev` (dòng 1212), swipe right (dòng 1474), phím Left | Gọi `updateSlide(currentIndex - 1)` |
| **F005_F12** | `handleKeyboardNavigation` | dòng 1413 | `e` (Event) | Bắt các phím mũi tên, Space, Home, End, Escape để điều hướng onboarding | Listener `keydown` trên `document` (dòng 1305) | Điều hướng slide hoặc kết thúc intro |
| **F006_F12** | `handleTouchStart` | dòng 1439 | `e` (TouchEvent) | Ghi nhận tọa độ cảm ứng chạm ban đầu `startX`, `startY` và bật cờ `isSwiping` | Listener `touchstart` (dòng 1319) | Cập nhật biến state cảm ứng |
| **F007_F12** | `handleTouchMove` | dòng 1445 | `e` (TouchEvent) | Theo dõi vị trí chạm, chặn hành vi cuộn dọc mặc định (`e.preventDefault()`) nếu người dùng vuốt ngang | Listener `touchmove` (dòng 1320) | Ngăn chặn cuộn trang khi vuốt chuyển slide |
| **F008_F12** | `handleTouchEnd` | dòng 1460 | `e` (TouchEvent) | Tính khoảng cách vuốt ngang `diffX`: nếu > 50px gọi `nextSlide()`, nếu < -50px gọi `prevSlide()` | Listener `touchend` (dòng 1321) | Kích hoạt chuyển slide theo cử chỉ ngón tay |
| **F009_F12** | `window.startApp` | dòng 1482 | Không | Lưu cờ đã xem vào localStorage, hiển thị hoạt ảnh chuyển cảnh `#exit-loading` rồi chuyển hướng về `index.html` | Nút `#floating-start-btn` (dòng 1217), phím Escape (dòng 1434) | Ghi LocalStorage, điều hướng `window.location.href = "index.html"` |

---

## B. EVENT & BINDING
| ID | Phần tử / Đối tượng | Loại sự kiện | Hàm xử lý | File:Dòng | Hành vi kích hoạt |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **E001_F12** | `document` | `DOMContentLoaded` | Anonymous function | dòng 1239 | Kiểm tra cờ xem intro, khởi tạo splash, slider và các listeners |
| **E002_F12** | `#btn-prev` | `click` (Inline `onclick`) | `prevSlide()` | dòng 1212 | Lùi về slide trước |
| **E003_F12** | `#floating-start-btn` | `click` (Inline `onclick`) | `startApp()` | dòng 1217 | Hoàn thành intro, bắt đầu mở ứng dụng |
| **E004_F12** | `#btn-next` | `click` (Inline `onclick`) | `nextSlide()` | dòng 1232 | Tiến tới slide kế tiếp |
| **E005_F12** | `document` | `keydown` | `handleKeyboardNavigation` | dòng 1305 | Điều hướng bằng bàn phím máy tính |
| **E006_F12** | `.dot` (mỗi dot) | `click` | `() => updateSlide(index)` | dòng 1309, 1325 | Bấm chọn trực tiếp slide mong muốn |
| **E007_F12** | `.dot` (mỗi dot) | `keydown` | Anonymous function | dòng 1310 | Kích hoạt slide khi nhấn Enter hoặc Space trên dot |
| **E008_F12** | `#slider-container` | `touchstart` | `handleTouchStart` | dòng 1319 | Bắt đầu thao tác vuốt màn hình cảm ứng |
| **E009_F12** | `#slider-container` | `touchmove` | `handleTouchMove` | dòng 1320 | Theo dõi di chuyển ngón tay vuốt ngang |
| **E010_F12** | `#slider-container` | `touchend` | `handleTouchEnd` | dòng 1321 | Kết thúc cử chỉ vuốt và chuyển slide |

---

## C. PHẦN TỬ HTML TƯƠNG TÁC & SELECTORS
### 1. Phần tử tương tác người dùng
| ID | Thẻ HTML | ID / Class | Nhãn hiển thị | Hành vi khi tương tác |
| :--- | :--- | :--- | :--- | :--- |
| **B001_F12** | `<button>` | `#btn-prev.btn-nav` | Mũi tên trái | Lùi về slide trước đó |
| **B002_F12** | `<button>` | `#btn-next.btn-nav` | Mũi tên phải | Tiến đến slide kế tiếp |
| **B003_F12** | `<button>` | `#floating-start-btn.floating-start-btn` | Sử dụng ứng dụng | Hoàn tất xem intro, chuyển về trang chính |
| **B004_F12** | `<span>` x 6 | `.dot` (trong `.dots`) | Chấm chỉ thị 1 - 6 | Chuyển tới slide tương ứng từ 1 đến 6 |
| **B005_F12** | `<div>` x 6 | `.slide` | 6 Slide nội dung | Trượt ngang khi vuốt ngón tay |

### 2. Danh mục Selectors mà JavaScript tham chiếu
- `document.getElementById('splash-screen')` (dòng 1278)
- `document.getElementById('slider-container')` (dòng 1279)
- `document.getElementById('exit-loading')` (dòng 1280)
- `document.querySelectorAll('.slide')` (dòng 1281)
- `document.querySelectorAll('.dot')` (dòng 1282, 1324)
- `document.querySelector('.dots')` (dòng 1283)
- `document.getElementById('btn-next')` (dòng 1284)
- `document.getElementById('btn-prev')` (dòng 1285)
- `document.getElementById('floating-start-btn')` (dòng 1286)
- `document.body` (dòng 1266, 1396, 1397)
- `document.head` (dòng 1519)

---

## D. STATE & DỮ LIỆU
| ID | Tên biến / Khóa | Kiểu | File:Dòng | Nơi đọc | Nơi ghi | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **S001_F12** | `localStorage['introSeen']` | Storage Key | dòng 1242 | `DOMContentLoaded` | Không ghi ở đây | Cờ kiểm tra xem đã qua intro chưa (đang trỏ sang `app.html`) |
| **S002_F12** | `localStorage['hasSeenIntro']` | Storage Key | dòng 1484 | Không đọc ở đây | `startApp()` | Cờ ghi nhận hoàn tất onboarding (**Lệch key với S001_F12**) |
| **S003_F12** | `currentIndex` | Number | dòng 1289 | Các hàm slide | `updateSlide` | Chỉ số slide hiện tại (từ 0 đến 5) |
| **S004_F12** | `totalSlides` | Number | dòng 1290 | Các hàm slide | Hằng số (`slides.length = 6`) | Tổng số slides |
| **S005_F12** | `startX, startY, isSwiping` | Number / Boolean | dòng 1291-1293 | Touch handlers | Touch handlers | Tọa độ và cờ theo dõi cử chỉ vuốt cảm ứng |
| **S006_F12** | `slideTitles` | Array(6) | dòng 1381-1388 | `announceSlideChange` | Hằng số | Danh sách tên 6 slide phục vụ accessibility |

---

## E. LUỒNG KHỞI TẠO & BẤT ĐỒNG BỘ
1. **Kiểm tra tự động chuyển trang:** Nếu `localStorage.getItem('introSeen') === 'true'`, tạo loading overlay và sau 1.500ms nhảy tới `app.html`.
2. **Splash Screen:** Chờ 3.500ms (3.5 giây) cho progress-bar chạy animation `loadingFill`, sau đó ẩn splash screen và sau 500ms hiển thị slider.
3. **Thoát Onboarding:** Khi bấm `#floating-start-btn`, làm mờ slider trong 300ms, hiện loading 1.500ms, đổi text thông báo "Ứng dụng đã sẵn sàng!" rồi sau 1.000ms điều hướng tới `index.html`.

---

## F. UI LOGIC
- **Trình chiếu 6 Slide chuyên đề:**
  - Slide 1: Nguồn dữ liệu chuẩn hóa (Tra cứu đa chiều, Nhận diện giọng nói, Audio bản xứ).
  - Slide 2: Phương pháp học chủ động (Chủ đề, Flashcard, Trắc nghiệm, Game).
  - Slide 3: Trợ lý ảo thông minh (Hướng dẫn sử dụng, Hỏi đáp, Hỗ trợ 24/7).
  - Slide 4: Cộng đồng đóng góp (Đóng góp từ mới, Thu âm giọng đọc, Kiểm duyệt, Tự động).
  - Slide 5: Công nghệ hiện đại (Chi phí thấp, Mã nguồn mở, PWA Offline, Cập nhật tự động).
  - Slide 6: Lưu ý khi sử dụng (Trình duyệt khuyên dùng Chrome/Safari, cấp quyền Mic, Cài đặt PWA).
- **Chuyển đổi trạng thái cuối:** Tại Slide 6, thanh dots và nút Next tự động ẩn; nút "Sử dụng ứng dụng" màu xanh ngọc xuất hiện với hiệu ứng bập bùng `floatUpDown`.

---

## G. CSS
- **Hệ màu sắc theo từng Slide:**
  - Slide 1 (`.card-s1`, `.s1-icon`): Xanh lá Emerald (`#059669`)
  - Slide 2 (`.card-s2`, `.s2-icon`): Xanh dương Sky (`#0284c7`)
  - Slide 3 (`.card-s3`, `.s3-icon`): Chàm Indigo (`#4f46e5`)
  - Slide 4 (`.card-s4`, `.s4-icon`): Tím Violet (`#7c3aed`)
  - Slide 5 (`.card-s5`, `.s5-icon`): Cam Orange (`#ea580c`)
  - Slide 6 (`.card-s6`, `.s6-icon`): Đỏ Alert (`#dc2626`)
- **Animations:** `@keyframes loadingFill`, `@keyframes fadeIn`, `@keyframes pulse`, `@keyframes spin`, `@keyframes slideIn`, `@keyframes floatUpDown`.
- **Media Queries phong phú:** Hỗ trợ tối ưu hóa chiều cao màn hình nhỏ (`max-height: 750px`, `700px`, `650px`), màn hình hẹp (`max-width: 400px`, `380px`), dark mode, high contrast, prefers-reduced-motion.

---

## H. PHỤ THUỘC & THỨ TỰ NẠP
1. Google Fonts: `Inter` (300, 400, 500, 600, 700, 800).
2. FontAwesome 6 CDN: `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css`.
3. Ảnh Logo: `https://raw.githubusercontent.com/tudienxedang/tudien/main/twitter-card.png`.

---

## BƯỚC 2: Tự kiểm đếm CLI
- Lệnh kiểm tra:
  - Đếm hàm: `Select-String -Path "C:\Users\umnuar\Downloads\tudien-goc\intro.html" -Pattern "(function\s+\w+|window\.\w+\s*=)" | Measure-Object` $\rightarrow$ 9 hàm (F001_F12 đến F009_F12).
  - Đếm inline onclick: `Select-String -Path "C:\Users\umnuar\Downloads\tudien-goc\intro.html" -Pattern "onclick=" | Measure-Object` $\rightarrow$ 3 inline handlers (E002_F12, E003_F12, E004_F12).
  - Đếm addEventListener: `Select-String -Path "C:\Users\umnuar\Downloads\tudien-goc\intro.html" -Pattern "addEventListener\(" | Measure-Object` $\rightarrow$ 7 listeners (E001_F12, E005_F12, E006_F12, E007_F12, E008_F12, E009_F12, E010_F12).
- Trạng thái kiểm đếm: Khớp chính xác 100%.
