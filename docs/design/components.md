# QUY CHUẨN THÀNH PHẦN GIAO DIỆN (COMPONENTS SPECIFICATION)
*Dự án: Ứng dụng số hóa hỗ trợ tự học và bảo tồn ngôn ngữ Xơ Đăng cho học sinh THCS*

---

## 1. Hệ Thống Nút Bấm (Button System)

### 1.1 Quy định chung
- **Vùng bấm tối thiểu (Tap Target)**: `min-height: 48px; min-width: 48px;` trên thiết bị cảm ứng (`@media (pointer: coarse)` hoặc di động).
- **Trạng thái (States)**: Default, Hover, Focus-visible (`outline: 2px solid var(--border-focus); outline-offset: 2px;`), Active (`transform: scale(0.97)`), Disabled (`opacity: 0.5; cursor: not-allowed; pointer-events: none`).

### 1.2 Các biến thể
1. **Button Primary**:
   - Nền: `var(--color-primary-base)` gradient nhẹ `#1e7e48` → `#17653a`
   - Chữ: Trắng `#ffffff`, `font-weight: 600`
   - Bo góc: `var(--radius-md)` (10px) hoặc pill `var(--radius-full)` cho menu
   - Ứng dụng: Nút "Tra cứu", "Bắt đầu làm bài", "Gửi từ vựng", "Chơi ngay"
2. **Button Secondary / Outline**:
   - Nền: Transparent, Viền `1.5px solid var(--border-default)`
   - Chữ: `var(--color-primary-base)` (Light) / `var(--color-primary-base)` (Dark)
   - Ứng dụng: "Thẻ trước", "Thẻ sau", "Bỏ qua", "Đóng"
3. **Icon Action Button**:
   - Kích thước: `48x48px` hình tròn hoặc bo vuông `12px`
   - Bắt buộc có thuộc tính `aria-label` tường minh
   - Ứng dụng: Nút micro nhận diện giọng nói, nút phát âm thanh, nút bật/tắt dark mode

---

## 2. Hệ Thống Ô Nhập & Form (Form Controls)

1. **Input Search & Text**:
   - Chiều cao: `48px`, padding `0 16px`
   - Viền: `1.5px solid var(--border-subtle)`, khi focus chuyển `var(--border-focus)` kèm shadow glow nhẹ
   - Tích hợp nút Xóa nhanh (Clear button) bên phải khi có văn bản
   - Nhãn form rõ ràng gắn thẻ `<label for="...">`
2. **Custom Select (Hướng dịch)**:
   - Chiều cao: `48px`, có icon cờ/mũi tên hai chiều trực quan
   - Padding đồng bộ, font-size `16px` để tránh iOS tự động zoom màn hình

---

## 3. Hệ Thống Thẻ Nội Dung (Card Patterns)

1. **Bento Stat Card (Thống kê)**:
   - Nền: Glassmorphism `rgba(255,255,255,0.85)` (Light) / `rgba(30,41,59,0.85)` (Dark), `backdrop-filter: blur(12px)`
   - Viền: `1px solid var(--border-subtle)`
   - Icon màu sắc riêng biệt cho từng loại dữ liệu (Sách, Loa, Bút, Cúp)
   - Con số to rõ: `font-size: 1.875rem; font-weight: 700;`
2. **Word Card (Thẻ kết quả tra cứu)**:
   - Thiết kế phân cấp từ điển chuyên nghiệp:
     - Header: Từ gốc (Headline bold) + Nút phát âm thanh nổi bật + Phiên âm IPA
     - Body: Từ tiếng Việt tương ứng (Màu nhấn)
     - Footer: Các câu ví dụ ngữ cảnh (Ví dụ tiếng Xơ Đăng in nghiêng, dịch tiếng Việt in thường rõ nét)
3. **Flashcard 3D Interactive**:
   - Khung thẻ tỷ lệ 3:2, bo góc `16px`
   - Hiệu ứng lật mượt mà `transform-style: preserve-3d; transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);`
   - Đổ bóng đa tầng `var(--shadow-lg)` tạo chiều sâu trên màn hình học tập
4. **Game Card**:
   - Minh họa văn hóa Tây Nguyên đặc sắc
   - Badge thể loại màu sắc ấm áp
   - Nút "Chơi ngay" kích hoạt tức thì

---

## 4. Hệ Thống Điều Hướng Đa Nền Tảng (Adaptive Navigation)

1. **Desktop (> 768px)**:
   - Header sticky thanh thoát, logo nhận diện bên trái
   - Menu trung tâm dạng tab nổi (Floating pill navigation)
   - Tiện ích bên phải: Toggle Dark Mode, Nút cài đặt PWA
2. **Mobile (≤ 768px)**:
   - Top Header siêu gọn: Tên ứng dụng + nút Dark mode
   - **Bottom Navigation Bar cố định ở đáy**:
     - 4 tab icon + text: `Trang chủ`, `Học & Thi`, `Trò chơi`, `Đóng góp`
     - Chiều cao `64px`, tap target rộng rãi cho ngón tay cái
     - Hiệu ứng tab active có thanh chỉ báo (Active indicator line) nổi bật

---

## 5. Modal & Phản Hồi Trạng Thái (Modals & Feedback)

1. **Onboarding Carousel**:
   - Card modal bo góc `24px`, căn giữa màn hình
   - 4 slide rút gọn: Mỗi slide tập trung 1 giá trị cốt lõi, icon minh họa 3D/vector bắt mắt
   - Nút "Bắt đầu ngay" lớn ở slide cuối
2. **Toast Feedback**:
   - Cố định an toàn dưới header (desktop) hoặc trên bottom bar (mobile)
   - Có icon trạng thái (Tick xanh, Than vàng, Chéo đỏ) kèm nút đóng
   - Tự biến mất sau 4 giây với hiệu ứng slide mượt mà
3. **Offline Banner**:
   - Thanh thông báo trạng thái mạng thanh lịch, không che khuất nội dung quan trọng
