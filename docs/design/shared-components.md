# KIỂM KÊ COMPONENT DÙNG CHUNG (SHARED COMPONENTS AUDIT)
*Dự án: Ứng dụng số hóa hỗ trợ tự học, nghiên cứu và bảo tồn ngôn ngữ Xơ Đăng*

---

## 1. Nút Bấm (Buttons)

| Tên Component | Selector / Class | Biến thể / Trạng thái | Kích thước hiện tại | Vấn đề UX/UI phát hiện | Giải pháp cải tiến Stitch/Figma |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Menu Button / Link** | `.menu-link`, `.menu-button` | Default, Hover, Active | ~128x42px (Desktop), co cụm trên mobile | Chiều cao 42px chưa đạt chuẩn 48px tap target trên mobile; tràn ngang khi màn hình hẹp | Tăng padding dọc lên 12px (min-height: 48px), bo góc tròn mềm mại, đồng bộ icon + text |
| **Search Button** | `.search-button` | Default, Hover, Active, Disabled | Full width / inline | Nền xanh đặc, hiệu ứng hover đơn giản | Bo góc đồng bộ, gradient nhẹ bản địa, phản hồi tactile khi nhấn |
| **Icon Button (Micro)** | `#speechButton` | Idle, Listening (`.listening`) | 60x42px | Chiều cao 42px thiếu 6px so với chuẩn 48px; hiệu ứng pulse đỏ hơi gắt | Đạt chuẩn 48x48px tối thiểu, hiệu ứng sóng âm viền gradient mềm mại |
| **Game Action Button** | `.game-play-btn`, `.game-icon-btn` | Default, Hover, Focus | 36x36px đến 40x40px | Các nút icon trên thanh Game Hub quá nhỏ (36px), khó bấm trúng trên di động | Đưa về chuẩn 48x48px với padding click an toàn |
| **Flashcard Controls** | `.flashcard-btn`, `.flashcard-nav-btn` | Prev, Flip, Next, Disabled | 40px chiều cao | Nút "Lật thẻ" và nút điều hướng nằm sát nhau, dễ bấm nhầm trên màn hình 360px | Tách khoảng cách tối thiểu 12px, phân biệt rõ nút chính (Primary) và nút phụ |
| **Audio Playback** | `.audio-btn`, `.single-play-btn` | Play, Stop, Delete | 32-38px | Icon nhỏ, không có nhãn hiển thị nếu thiếu tooltip | Nút tròn 44x44px có hiệu ứng sóng phát âm thanh động |

---

## 2. Form Input & Controls

| Tên Component | Selector / Element | Phụ thuộc | Vấn đề UX/UI hiện tại | Giải pháp cải tiến |
| :--- | :--- | :--- | :--- | :--- |
| **Search Input** | `#word` (`input[type="text"]`) | Kèm `#speechButton` & `#suggestions` | Viền input mỏng, placeholder mờ trong Dark Mode, không có nút xoá nhanh (Clear button) | Viền bo góc 12px, bổ sung nút "X" xoá nhanh từ vựng, focus ring nổi bật |
| **Direction Select** | `#direction` (`select`) | Form hướng dịch | Giao diện dropdown mặc định của trình duyệt, icon mũi tên thô | Custom dropdown có biểu tượng cờ/ngôn ngữ rõ ràng, chiều cao chuẩn 48px |
| **Contribute Inputs** | `#vietnameseWord`, `#xodangWord` | Tab đóng góp | Chưa có đếm ký tự (character count), chưa có validation lỗi real-time | Bổ sung helper text, nhãn nổi (floating label) hoặc nhãn rõ ràng, thông báo hợp lệ tức thì |

---

## 3. Thẻ Nội Dung (Cards)

| Tên Thẻ | Selector / Class | Nội dung chính | Vấn đề hiện tại | Đề xuất thiết kế lại |
| :--- | :--- | :--- | :--- | :--- |
| **Thống Kê (Stat Card)** | `.stat-item` | Số lượng từ, âm thanh, ví dụ | Đơn điệu, viền 1px mỏng xám, bóng đổ chưa có chiều sâu | Thiết kế dạng Glassmorphism/Bento card, icon màu sắc đại diện cho từng loại dữ liệu |
| **Thẻ Tải Offline** | `.offline-download-card` | Banner kêu gọi tải audio | Nằm lọt thỏm giữa trang, màu sắc chưa tạo cảm giác tính năng cao cấp của PWA | Thẻ nổi bật với gradient nhẹ, thanh progress bar động mượt mà |
| **Thẻ Tính Năng** | `.feature-item` | 10 tính năng nổi bật | Danh sách trải dài gây mỏi mắt khi cuộn trên di động | Nhóm thành thẻ lưới 2 cột icon sinh động hoặc carousel lướt tiện lợi |
| **Thẻ Từ Vựng** | `.word-card` | Từ gốc, từ dịch, ví dụ, audio | Khoảng cách văn bản chưa thoáng, nút phát audio nhỏ | Thẻ từ thiết kế theo chuẩn từ điển quốc tế, phân biệt rõ phần phát âm ngữ âm (IPA) |
| **Thẻ Game** | `.game-select-card` | 4 trò chơi học tập | Icon emoji đơn giản (🎴, 🧺, 🏹, 🌾), thiếu minh họa đồ họa cao cấp | Minh họa sinh động văn hóa Tây Nguyên, badge thể loại rực rỡ |
| **Thẻ Flashcard** | `.flashcard` | Lật mặt trước / mặt sau | Chữ hiển thị mặt sau đôi khi bị chật trên màn hình 360px | Tỷ lệ vàng khung thẻ (aspect ratio 3:2), lật 3D có hiệu ứng ánh sáng bề mặt |

---

## 4. Thanh Điều Hướng (Navigation)

| Vị trí | Selector / Class | Điểm mạnh hiện tại | Điểm yếu cần thiết kế lại | Đề xuất |
| :--- | :--- | :--- | :--- | :--- |
| **Desktop Navbar** | `.navbar` (Sticky top) | Luôn cố định, dễ chuyển trang | Nút dạng viên thuốc bo tròn quá khổ chiếm diện tích dọc | Thanh bar thanh thoát, kính mờ (blur backdrop), chỉ báo tab tích cực (active indicator) hiện đại |
| **Mobile Navigation** | Co cụm trong `.navbar ul` | Tự động wrap | Nhiều nút bị gãy dòng, không tối ưu cho thao tác 1 tay (ngón cái) | Chuyển sang thanh **Bottom Navigation Bar** 4 mục chính trên màn hình < 768px |

---

## 5. Modal & Hộp Thoại (Modals & Overlays)

| Tên Modal | Selector | Kích hoạt | Vấn đề hiện tại |
| :--- | :--- | :--- | :--- |
| **Install Modal** | `#installModal` | Khi PWA sẵn sàng cài đặt | Thiết kế còn đơn sơ, thiếu hình ảnh minh họa bước cài trên iOS/Android |
| **Onboarding Modal** | `#onboardingModal` | Khi người dùng lần đầu vào app hoặc bấm xem HD | Nút đóng `x` nhỏ (32px), khó bấm; slide chữ nhiều trên màn hình 360px |
| **Loading Overlay** | `#loadingOverlay` | Khi đồng bộ dữ liệu | Màu đen đục chắn màn hình thô kệch, thiếu thông tin % chi tiết |
| **Leaderboard Modal** | `#leaderboardModal` | Bấm cúp vàng trong Game | Bảng điểm bảng HTML truyền thống, thiếu sự tôn vinh huy chương Top 1-2-3 |

---

## 6. Thông Báo & Trạng Thái (Feedback & Indicators)

| Thành phần | Selector / Class | Trạng thái | Đánh giá |
| :--- | :--- | :--- | :--- |
| **Toast** | `.toast` (`.success`, `.error`, `.info`) | Hiện góc trên bên phải | Vị trí trên mobile bị che bởi thanh địa chỉ trình duyệt, chưa có nút đóng |
| **Offline Indicator** | `#offlineIndicator` | Hiện góc trên khi mất mạng | Kích thước quá bé (0.65-0.7rem), chữ ngắn dễ bị người dùng lướt qua không thấy |
| **Error Box** | `.error` | Viền đỏ nhạt, nền hồng | Thiếu icon minh họa, thiếu nút "Thử lại", text kỹ thuật |
