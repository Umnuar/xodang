# BÁO CÁO ĐỐI CHIẾU: FILE12 — `intro.html`

- **Tập tin gốc:** `C:\Users\umnuar\Downloads\tudien-goc\intro.html` (1.523 dòng)
- **Tập tin mới:** `c:\Users\umnuar\Downloads\tudien-main\src\renderer\features\onboarding\` (`onboarding.ts`, `onboarding.html`, `onboarding.css`)

---

## BẢNG ĐỐI CHIẾU TỪNG MỤC THEO ID

| ID | Tên mục | Trạng thái | Vị trí file:dòng mới | Ghi chú & Trích đoạn đối chiếu |
| :--- | :--- | :---: | :--- | :--- |
| **F001_F12** | `updateSlide` | ✅ GIỮ NGUYÊN | `onboarding.ts:79, 101` | Chuyển thành phương thức `goToSlide(index)` & `updateSlideUI()` cập nhật slide active và dots |
| **F002_F12** | `announceSlideChange` | ⚠️ ĐỔI KHÁC | `onboarding.ts:110` | Sử dụng `aria-selected` trên dot indicator thay vì tạo DOM `.sr-only` động |
| **F003_F12** | `window.nextSlide` | ✅ GIỮ NGUYÊN | `onboarding.ts:85` | Chuyển thành phương thức `next()` trong `OnboardingController` |
| **F004_F12** | `window.prevSlide` | ✅ GIỮ NGUYÊN | `onboarding.ts:91` | Chuyển thành phương thức `prev()` trong `OnboardingController` |
| **F005_F12** | `handleKeyboardNavigation` | ✅ GIỮ NGUYÊN | `onboarding.ts:42-47` | Hỗ trợ ArrowRight, ArrowLeft, Escape để đóng modal |
| **F006_F12** | `handleTouchStart` | ⚠️ ĐỔI KHÁC | Chưa có trong `onboarding.ts` | Cử chỉ vuốt tay (Touch swipe) chưa được gắn vào modal, hiện đang dựa vào nút bấm Prev/Next và Dots |
| **F007_F12** | `handleTouchMove` | ⚠️ ĐỔI KHÁC | Chưa có trong `onboarding.ts` | Giống F006 |
| **F008_F12** | `handleTouchEnd` | ⚠️ ĐỔI KHÁC | Chưa có trong `onboarding.ts` | Giống F006 |
| **F009_F12** | `window.startApp` | ✅ GIỮ NGUYÊN | `onboarding.ts:74` | Chuyển thành `complete()`: lưu cờ đã xem và đóng modal trong SPA |
| **E001_F12** | `document.DOMContentLoaded` | ✅ GIỮ NGUYÊN | `src/renderer/main.ts:107` | Được gọi tự động trong chu trình `mountMarkup()` khi khởi động ứng dụng |
| **E002_F12** | `#btn-prev` click | ✅ GIỮ NGUYÊN | `onboarding.ts:30` | `this.prevBtn?.addEventListener('click', () => this.prev())` |
| **E003_F12** | `#floating-start-btn` click | ✅ GIỮ NGUYÊN | `onboarding.ts:33` | `startBtn?.addEventListener('click', () => this.complete())` |
| **E004_F12** | `#btn-next` click | ✅ GIỮ NGUYÊN | `onboarding.ts:31` | `this.nextBtn?.addEventListener('click', () => this.next())` |
| **E005_F12** | `document.keydown` | ✅ GIỮ NGUYÊN | `onboarding.ts:42` | `window.addEventListener('keydown', ...)` |
| **E006_F12** | `.dot` click | ✅ GIỮ NGUYÊN | `onboarding.ts:38` | `dot.addEventListener('click', () => this.goToSlide(idx))` |
| **E007_F12** | `.dot` keydown (Enter/Space) | ⚠️ ĐỔI KHÁC | `onboarding.ts` | Gán trực tiếp qua listener click tiêu chuẩn |
| **E008_F12** | `touchstart` swipe | ⚠️ ĐỔI KHÁC | Chưa có | Chưa tích hợp touch swipe |
| **E009_F12** | `touchmove` swipe | ⚠️ ĐỔI KHÁC | Chưa có | Chưa tích hợp touch swipe |
| **E010_F12** | `touchend` swipe | ⚠️ ĐỔI KHÁC | Chưa có | Chưa tích hợp touch swipe |
| **B001_F12** | Nút Lùi lại | ✅ GIỮ NGUYÊN | `onboarding.html:101` | `#onboardingPrevBtn` |
| **B002_F12** | Nút Kế tiếp | ✅ GIỮ NGUYÊN | `onboarding.html:103` | `#onboardingNextBtn` |
| **B003_F12** | Nút Bắt đầu sử dụng | ✅ GIỮ NGUYÊN | `onboarding.html:95` | `#onboardingStartBtn` |
| **B004_F12** | 6 Chấm chỉ thị Slide | ✅ GIỮ NGUYÊN | `onboarding.html:86-93` | 6 `.onboarding-dot` |
| **B005_F12** | 6 Slide chuyên đề | ✅ GIỮ NGUYÊN | `onboarding.html:15-84` | Đầy đủ 6 nội dung card (Dữ liệu, Phương pháp, Trợ lý, Cộng đồng, Công nghệ, Lưu ý) |
| **S001_F12** | `localStorage['introSeen']` | ✅ GIỮ NGUYÊN | `src/shared/constants/storage-keys.ts:14` | Ghi nhận khóa legacy `INTRO_SEEN: 'introSeen'` |
| **S002_F12** | `localStorage['hasSeenIntro']` | ✅ GIỮ NGUYÊN | `onboarding.ts:52, 75` | Khóa chính thức `STORAGE_KEYS.HAS_SEEN_INTRO` đã sửa triệt để lỗi lệch key của bản gốc |
| **S003_F12** | `currentIndex` | ✅ GIỮ NGUYÊN | `onboarding.ts:15` | `private currentSlide = 0` |
| **S004_F12** | `totalSlides` | ✅ GIỮ NGUYÊN | `onboarding.ts:80` | `this.slides.length` |
| **S005_F12** | Biến cảm ứng vuốt | ⚠️ ĐỔI KHÁC | Chưa dùng | Không còn biến `startX, startY` |
| **S006_F12** | Danh sách tên slide | ✅ GIỮ NGUYÊN | `onboarding.html` | Giữ nguyên tiêu đề 6 slide trong template HTML |

---

## KẾT LUẬN FILE12
- Tỷ lệ: 22/30 mục ✅ GIỮ NGUYÊN, 8/30 mục ⚠️ ĐỔI KHÁC (chuyển đổi từ standalone page sang modal nhúng trong SPA).
- Sửa lỗi lớn của bản gốc: Bản mới thống nhất dùng đúng khóa `hasSeenIntro` khi đọc và ghi, khắc phục hoàn toàn lỗi lặp lại intro của bản gốc.
- Đề xuất cải tiến: Có thể bổ sung thêm touch swipe listener (`touchstart`/`touchend`) vào modal onboarding để người dùng vuốt trượt cảm ứng tự nhiên hơn trên điện thoại.
